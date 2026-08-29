# /backend/app/main.py
"""
FastAPI application — the HTTP interface for the advisory chat engine.

Endpoints:
  POST /api/chat/start     → Start a new session, get greeting + first question
  POST /api/chat/message   → Send user message, get next question(s)
  GET  /api/chat/{id}      → Get current session state
  GET  /api/health         → Health check

Session state is stored in-memory (dict) for the hackathon.
Production would use Redis or a database.
"""

from __future__ import annotations

import logging
import uuid
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import io

from app.config import get_settings
from db import init_db, get_conn
from ingest import ingest_document
from query import answer

from app.config import get_settings
from app.schemas.profile import ExtractedProfile, ExtractionMeta, UserType
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatMessage,
    SessionState,
    UIComponent,
)
from app.graph.state import AdvisoryState, compute_completeness
from app.graph.builder import get_advisory_graph

# ── Logging ────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

import json

# ── In-memory session store ───────────────────────────────────────────
# Key: session_id, Value: AdvisoryState
SESSION_STORE: dict[str, AdvisoryState] = {}

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
PROFILES_FILE = DATA_DIR / "user_profiles.json"
KNOWLEDGE_BASE_PROFILES_FILE = DATA_DIR / "knowledge_base_profiles.json"


def _load_knowledge_base_profiles() -> dict[str, dict[str, Any]]:
    """Restore the small session-to-profile cache used by the RAG chat."""
    if not KNOWLEDGE_BASE_PROFILES_FILE.exists():
        return {}
    try:
        saved_profiles = json.loads(KNOWLEDGE_BASE_PROFILES_FILE.read_text(encoding="utf-8"))
        return saved_profiles if isinstance(saved_profiles, dict) else {}
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Could not restore knowledge-base profiles: %s", exc)
        return {}


# This is separate from SESSION_STORE because the slider-based UI does not use
# the advisory graph session endpoints. It survives a backend restart so the
# policy chat can recover a user's context after a browser refresh.
KNOWLEDGE_BASE_PROFILE_STORE: dict[str, dict[str, Any]] = _load_knowledge_base_profiles()


def _save_knowledge_base_profiles() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    temporary_file = KNOWLEDGE_BASE_PROFILES_FILE.with_suffix(".tmp")
    temporary_file.write_text(
        json.dumps(KNOWLEDGE_BASE_PROFILE_STORE, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    temporary_file.replace(KNOWLEDGE_BASE_PROFILES_FILE)

def _save_profiles_to_disk():
    """Save all current session profiles to a JSON file and sync to Supabase."""
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        profiles_list = []
        db_rows = []
        for sid, state in SESSION_STORE.items():
            pct, filled, remaining = compute_completeness(state.profile)
            extracted = ExtractedProfile(
                session_id=state.session_id,
                user_type=state.user_type,
                profile=state.profile,
                extraction_meta=ExtractionMeta(
                    completeness_pct=pct,
                    turns_taken=state.turn_count,
                    model=get_settings().GROQ_MODEL,
                    extracted_at=datetime.utcnow(),
                    fields_filled=filled,
                    fields_remaining=remaining,
                ),
            ).model_dump(mode="json")
            profiles_list.append(extracted)
            
            profile_data = extracted.get("profile", {})
            meta_data = extracted.get("extraction_meta", {})
            db_rows.append({
                "session_id": extracted.get("session_id"),
                "user_type": extracted.get("user_type", "guest"),
                "applicant_name": profile_data.get("name"),
                "intent": profile_data.get("intent"),
                "age": profile_data.get("age"),
                "monthly_income": profile_data.get("monthly_income"),
                "employment_type": profile_data.get("employment_type"),
                "requested_loan_amount": profile_data.get("requested_loan_amount"),
                "preferred_tenure_months": profile_data.get("preferred_tenure_months"),
                "existing_emi_obligations": profile_data.get("existing_emi_obligations", 0.0),
                "has_existing_loans": profile_data.get("has_existing_loans", False),
                "credit_score_band": profile_data.get("credit_score_band", "unknown"),
                "urgency": profile_data.get("urgency", "exploring"),
                "completeness_pct": meta_data.get("completeness_pct", 0),
                "turns_taken": meta_data.get("turns_taken", 0)
            })
        
        with open(PROFILES_FILE, "w", encoding="utf-8") as f:
            json.dump(profiles_list, f, indent=2, ensure_ascii=False)
            
        if db_rows:
            import httpx
            import threading
            import os as _os

            _supabase_url = _os.environ.get("SUPABASE_URL", "")
            _supabase_key = _os.environ.get("SUPABASE_KEY", "")

            def sync_to_db():
                try:
                    with httpx.Client() as client:
                        client.post(
                            f"{_supabase_url}/rest/v1/customer_profiles",
                            headers={
                                "apikey": _supabase_key,
                                "Authorization": f"Bearer {_supabase_key}",
                                "Content-Type": "application/json",
                                "Prefer": "resolution=merge-duplicates"
                            },
                            json=db_rows,
                            timeout=5.0
                        )
                except Exception as e:
                    logger.error(f"Supabase sync failed: {e}")

            threading.Thread(target=sync_to_db, daemon=True).start()

    except Exception as e:
        logger.error(f"Failed to save profiles to disk: {e}")


# ── App lifecycle ──────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up the graph on startup."""
    logger.info("Starting Loan Advisory API...")
    settings = get_settings()
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Model: {settings.GROQ_MODEL}")
    logger.info(f"Completeness threshold: {settings.COMPLETENESS_THRESHOLD}%")

    # Pre-compile the graph
    _ = get_advisory_graph()
    logger.info("Advisory graph ready")
    
    # Init RAG database tables
    init_db()

    yield

    logger.info("Shutting down Loan Advisory API...")
    SESSION_STORE.clear()

# ── FastAPI App ────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Loan Advisory Engine",
    description=(
        "Conversational AI engine that profiles loan customers through "
        "dynamic MCQ/slider questions and extracts structured profiles "
        "for the scoring engine."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS (allow React frontend) ───────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Lock down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════════════
#  HELPER: Convert state to API response
# ═══════════════════════════════════════════════════════════════════════

def _state_to_response(state: AdvisoryState) -> ChatResponse:
    """Convert internal AdvisoryState to the ChatResponse API model."""

    # Convert pending messages to ChatMessage objects
    messages = []
    for msg in state.pending_messages:
        ui_comp = None
        if msg.get("ui_component"):
            ui_comp = UIComponent(**msg["ui_component"])

        messages.append(
            ChatMessage(
                role=msg["role"],
                content=msg["content"],
                ui_component=ui_comp,
                field_target=msg.get("field_target"),
            )
        )

    pct, filled, remaining = compute_completeness(state.profile)

    session_state = SessionState(
        session_id=state.session_id,
        completeness_pct=pct,
        fields_filled=filled,
        is_complete=state.is_complete,
        current_phase=state.current_phase,
    )

    # Include extracted profile when complete
    extracted = None
    if state.is_complete:
        extracted = ExtractedProfile(
            session_id=state.session_id,
            user_type=state.user_type,
            profile=state.profile,
            extraction_meta=ExtractionMeta(
                completeness_pct=pct,
                turns_taken=state.turn_count,
                model=get_settings().GROQ_MODEL,
                extracted_at=datetime.utcnow(),
                fields_filled=filled,
                fields_remaining=remaining,
            ),
        ).model_dump(mode="json")

    return ChatResponse(
        session_id=state.session_id,
        messages=messages,
        session_state=session_state,
        extracted_profile=extracted,
    )

# ═══════════════════════════════════════════════════════════════════════
#  ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "loan-advisory-engine",
        "model": get_settings().GROQ_MODEL,
        "active_sessions": len(SESSION_STORE),
    }

@app.post("/api/chat/start", response_model=ChatResponse)
async def start_chat(user_type: str = "guest"):
    """
    Start a new advisory chat session.

    Returns the greeting message with the first question (loan type MCQ).
    The frontend should store the session_id for subsequent messages.
    """
    session_id = str(uuid.uuid4())

    logger.info(f"Starting new session: {session_id} (user_type={user_type})")

    # Create initial state
    state = AdvisoryState(
        session_id=session_id,
        user_type=UserType(user_type) if user_type in ("guest", "existing_customer") else UserType.GUEST,
    )

    # Run the greeting node to initialize conversation and get first question
    from app.graph.nodes import greeting_node

    try:
        result_state = greeting_node(state)

        # Store session
        SESSION_STORE[session_id] = result_state
        _save_profiles_to_disk()

        response = _state_to_response(result_state)
        logger.info(
            f"Session {session_id}: greeting sent, "
            f"{len(response.messages)} messages"
        )
        return response

    except Exception as e:
        logger.error(f"Error starting session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")

@app.post("/api/chat/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Send a user message and get the next bot response(s).

    The request must include the session_id from /api/chat/start.
    The message field contains the user's answer (MCQ value, slider value, or free text).

    Returns one or more bot messages, each potentially with a UI component
    (MCQ, slider, number input) for the frontend to render.
    """
    session_id = request.session_id

    # Retrieve session
    state = SESSION_STORE.get(session_id)
    if state is None:
        raise HTTPException(
            status_code=404,
            detail=f"Session {session_id} not found. Call /api/chat/start first.",
        )

    # Check if already complete
    if state.is_complete:
        logger.info(f"Session {session_id}: already complete, returning profile")
        return _state_to_response(state)

    logger.info(
        f"Session {session_id}: received message for phase '{state.current_phase}': "
        f"'{request.message[:100]}'"
    )

    # Inject user input into state
    state.current_user_input = request.message
    state.current_field_target = request.field_target
    state.pending_messages = []  # Clear previous pending messages

    # Determine which node to run based on current phase
    # Instead of re-running the full graph, we run the specific node
    # and then use the router to prepare for the next interaction.

    try:
        result_state = _run_next_node(state)

        # Store updated session
        SESSION_STORE[session_id] = result_state
        _save_profiles_to_disk()

        response = _state_to_response(result_state)

        pct = response.session_state.completeness_pct
        logger.info(
            f"Session {session_id}: phase={result_state.current_phase}, "
            f"completeness={pct}%, "
            f"complete={result_state.is_complete}, "
            f"messages={len(response.messages)}"
        )

        return response

    except Exception as e:
        logger.error(
            f"Error processing message for session {session_id}: {e}",
            exc_info=True,
        )
        # Return a graceful error message instead of crashing
        state.pending_messages = [
            {
                "role": "assistant",
                "content": (
                    "I'm sorry, I had trouble processing that. "
                    "Could you try again?"
                ),
                "ui_component": None,
                "field_target": None,
            }
        ]
        SESSION_STORE[session_id] = state
        _save_profiles_to_disk()
        return _state_to_response(state)

def _run_next_node(state: AdvisoryState) -> AdvisoryState:
    """
    Run the appropriate extraction node based on the current phase.

    This avoids re-running the full graph from the beginning —
    we directly call the node function for the current phase.
    """
    from app.graph.nodes import (
        extract_name_node,
        extract_loan_type_node,
        extract_loan_type_details_node,
        extract_loan_amount_node,
        extract_income_employment_node,
        extract_existing_debts_node,
        extract_credit_score_node,
        extract_age_node,
        extract_tenure_node,
        extract_co_applicant_node,
        extract_preferred_emi_node,
        extract_interest_type_node,
        extract_urgency_node,
        completion_node,
    )

    phase = state.current_phase

    node_map = {
        "name": extract_name_node,
        "loan_type": extract_loan_type_node,
        "loan_type_details": extract_loan_type_details_node,
        "loan_amount": extract_loan_amount_node,
        "income_employment": extract_income_employment_node,
        "existing_debts": extract_existing_debts_node,
        "credit_score": extract_credit_score_node,
        "age": extract_age_node,
        "tenure": extract_tenure_node,
        "co_applicant": extract_co_applicant_node,
        "preferred_emi": extract_preferred_emi_node,
        "interest_type": extract_interest_type_node,
        "urgency": extract_urgency_node,
        "complete": completion_node,
    }

    node_fn = node_map.get(phase)

    if node_fn is None:
        logger.error(f"No node found for phase: {phase}")
        # Fallback: use the master router to figure out where we are
        from app.graph.router import _route_by_missing_fields

        next_phase = _route_by_missing_fields(state)
        # Map node name back to phase
        phase_map = {
            "extract_name": "name",
            "extract_loan_type": "loan_type",
            "extract_loan_type_details": "loan_type_details",
            "extract_loan_amount": "loan_amount",
            "extract_income_employment": "income_employment",
            "extract_existing_debts": "existing_debts",
            "extract_credit_score": "credit_score",
            "extract_age": "age",
            "extract_tenure": "tenure",
            "extract_co_applicant": "co_applicant",
            "extract_preferred_emi": "preferred_emi",
            "extract_interest_type": "interest_type",
            "extract_urgency": "urgency",
            "completion": "complete",
        }
        state.current_phase = phase_map.get(next_phase, "loan_type")
        node_fn = node_map.get(state.current_phase, extract_loan_type_node)

    return node_fn(state)

@app.get("/api/chat/{session_id}")
async def get_session(session_id: str):
    """
    Get the current state of a chat session.

    Returns the extracted profile (even if partial), completeness,
    and current phase. Useful for debugging and for the frontend
    to restore state after a page refresh.
    """
    state = SESSION_STORE.get(session_id)
    if state is None:
        raise HTTPException(
            status_code=404,
            detail=f"Session {session_id} not found.",
        )

    pct, filled, remaining = compute_completeness(state.profile)

    return {
        "session_id": session_id,
        "user_type": state.user_type.value,
        "current_phase": state.current_phase,
        "is_complete": state.is_complete,
        "turn_count": state.turn_count,
        "completeness_pct": pct,
        "fields_filled": filled,
        "fields_remaining": remaining,
        "warnings": state.warnings,
        "profile": state.profile.model_dump(exclude_none=True),
        "chat_history": state.chat_history,
    }

@app.get("/api/sessions")
async def list_sessions():
    """List all active sessions (for debugging)."""
    sessions = []
    for sid, state in SESSION_STORE.items():
        pct, _, _ = compute_completeness(state.profile)
        sessions.append(
            {
                "session_id": sid,
                "user_type": state.user_type.value,
                "current_phase": state.current_phase,
                "is_complete": state.is_complete,
                "completeness_pct": pct,
                "turn_count": state.turn_count,
            }
        )
    return {"total": len(sessions), "sessions": sessions}

@app.delete("/api/chat/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session."""
    if session_id in SESSION_STORE:
        del SESSION_STORE[session_id]
        _save_profiles_to_disk()
        return {"status": "deleted", "session_id": session_id}
    raise HTTPException(status_code=404, detail="Session not found.")

@app.get("/api/recommendations/{session_id}")
async def get_recommendations(session_id: str):
    """
    Generate and return loan recommendations based on the extracted profile.
    """
    from app.services.database import fetch_loan_products, get_grounded_policy_chunks
    from app.services.scoring_engine import evaluate_product_match
    from app.services.guardrails import verify_explanation_hallucination
    from app.schemas.scoring import ExtractedProfilePayload, ProfileData, ExtractionMeta

    state = SESSION_STORE.get(session_id)
    if state is None:
        raise HTTPException(
            status_code=404,
            detail=f"Session {session_id} not found.",
        )
    
    pct, filled, remaining = compute_completeness(state.profile)
    
    # Defaults in case of incomplete extraction for testing
    payload = ExtractedProfilePayload(
        session_id=session_id,
        user_type=state.user_type.value,
        profile=ProfileData(
            intent=state.profile.intent or "personal_loan",
            monthly_income=state.profile.monthly_income or 50000.0,
            employment_type=state.profile.employment_type or "salaried",
            requested_loan_amount=state.profile.requested_loan_amount or 1000000.0,
            preferred_tenure_months=state.profile.preferred_tenure_months or 60,
            existing_emi_obligations=state.profile.existing_emi_obligations or 0.0,
            credit_score_band=state.profile.credit_score_band or "good",
            urgency=state.profile.urgency or "exploring"
        ),
        extraction_meta=ExtractionMeta(
            completeness_pct=pct,
            turns_taken=state.turn_count
        )
    )
    
    products = fetch_loan_products(category=payload.profile.intent)
    
    scored_recommendations = []
    for prod in products:
        rec = evaluate_product_match(payload, prod)
        policy_data = get_grounded_policy_chunks(
            product_id=rec.product_id,
            user_query="prepayment charges and eligibility rules",
            top_k=2
        )
        sample_llm_text = (
            f"You are eligible for {rec.product_name} at {rec.computed_terms.interest_rate_pct}% interest rate. "
            f"Your monthly EMI is ₹{rec.computed_terms.estimated_emi:,.2f}."
        )
        rec.ai_explanation = verify_explanation_hallucination(
            llm_explanation_text=sample_llm_text,
            computed_terms=rec.computed_terms,
            grounded_chunk_ids=policy_data.get("grounded_on_chunk_ids", [])
        )
        scored_recommendations.append(rec)

    scored_recommendations.sort(key=lambda x: x.match_score, reverse=True)
    return {"recommendations": [rec.model_dump() for rec in scored_recommendations]}


# ── In-memory lead store ───────────────────────────────────────────────
LEAD_STORE: list[dict] = []


# ── Lead Capture Endpoint ──────────────────────────────────────────────

from pydantic import BaseModel as _BaseModel
from typing import Optional as _Optional

class LeadCaptureRequest(_BaseModel):
    session_id: str
    name: str
    email: str
    phone: str
    selected_loan_id: _Optional[str] = None
    selected_loan_name: _Optional[str] = None
    loan_amount: _Optional[float] = None
    estimated_emi: _Optional[float] = None
    preferred_contact_time: _Optional[str] = "Morning"
    notes: _Optional[str] = None


@app.post("/api/leads")
async def capture_lead(payload: LeadCaptureRequest):
    """Capture an inbound lead and return AI scoring intelligence."""
    from app.services.lead_scorer import score_lead

    # Pull profile context from session if available
    state = SESSION_STORE.get(payload.session_id)
    profile = state.profile if state else None
    pct, _, _ = compute_completeness(profile) if profile else (0, [], [])

    scoring = score_lead(
        session_id=payload.session_id,
        completeness_pct=pct,
        monthly_income=getattr(profile, "monthly_income", None) if profile else None,
        existing_emi_obligations=getattr(profile, "existing_emi_obligations", None) if profile else None,
        requested_loan_amount=payload.loan_amount or (getattr(profile, "requested_loan_amount", None) if profile else None),
        preferred_tenure_months=getattr(profile, "preferred_tenure_months", None) if profile else None,
        credit_score_band=getattr(profile, "credit_score_band", None) if profile else None,
        urgency=getattr(profile, "urgency", None) if profile else None,
        intent=getattr(profile, "intent", None) if profile else None,
    )

    lead_record = {
        **scoring,
        "customer_name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "product_id": payload.selected_loan_id,
        "product_name": payload.selected_loan_name,
        "loan_amount": payload.loan_amount,
        "estimated_emi": payload.estimated_emi,
        "preferred_contact_time": payload.preferred_contact_time,
        "notes": payload.notes,
        "status": "New",
        "created_at": datetime.utcnow().isoformat(),
    }
    LEAD_STORE.append(lead_record)

    logger.info(f"Lead captured: {scoring['lead_id']} — {scoring['score_band']} ({scoring['score']}/100)")
    return {
        "status": "captured",
        "lead_id": scoring["lead_id"],
        "message": "Your loan interest has been recorded. A relationship manager will contact you shortly.",
        "created_at": lead_record["created_at"],
        "scoring": scoring,
    }


# ── Sales Dashboard Endpoint ───────────────────────────────────────────

@app.get("/api/dashboard")
async def get_dashboard():
    """Return sales intelligence dashboard data."""
    from datetime import timedelta
    import random

    total_leads = len(LEAD_STORE)
    hot_leads = sum(1 for l in LEAD_STORE if l.get("score_band") == "HOT LEAD")
    warm_leads = sum(1 for l in LEAD_STORE if l.get("score_band") == "WARM LEAD")
    total_demand = sum(l.get("loan_amount") or 0 for l in LEAD_STORE)
    avg_score = (sum(l.get("score", 0) for l in LEAD_STORE) / total_leads) if total_leads else 0

    # Status counts
    statuses = {"New": 0, "Qualified": 0, "Contacted": 0, "Converted": 0}
    for l in LEAD_STORE:
        s = l.get("status", "New")
        statuses[s] = statuses.get(s, 0) + 1

    # Volume trend — last 7 days (real data for today, historical mock)
    today = datetime.utcnow().date()
    trend = []
    today_count = sum(1 for l in LEAD_STORE if l.get("created_at", "")[:10] == str(today))
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        if i == 0:
            trend.append({"date": str(d), "leads": today_count, "hot": max(0, today_count - 1)})
        else:
            n = random.randint(2, 12)
            trend.append({"date": str(d), "leads": n, "hot": max(0, n - random.randint(1, 4))})

    return {
        "kpis": {
            "total_leads": total_leads,
            "hot_leads": hot_leads,
            "warm_leads": warm_leads,
            "avg_lead_score": round(avg_score, 1),
            "total_loan_demand": total_demand,
            "conversion_pipeline": statuses,
        },
        "leads": LEAD_STORE,
        "volume_trend": trend,
    }





# ═══════════════════════════════════════════════════════════════════════
#  SIDDHI'S RAG ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@app.get("/config")
def get_config():
    """Returns active LLM provider info — useful for frontend display."""
    import os
    provider = os.getenv("LLM_PROVIDER", "groq").lower()
    if provider == "openrouter":
        model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free")
    else:
        model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    return {"provider": provider, "model": model}

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    loan_category: str = Form(...),
):
    allowed = {"pdf", "txt", "md"}
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Allowed: {allowed}")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(400, "Empty file.")

    try:
        result = ingest_document(io.BytesIO(file_bytes), file.filename, loan_category)
    except ValueError as e:
        raise HTTPException(422, str(e))

    return {"status": "processed", **result}

class QueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2_000)
    loan_category: Optional[str] = None
    top_k: int = Field(default=8, ge=1, le=8)
    session_id: Optional[str] = Field(default=None, max_length=128)
    profile: Optional[dict] = None


class KnowledgeBaseProfileRequest(BaseModel):
    """Context collected by the slider-based loan advisory flow."""

    session_id: str = Field(min_length=1, max_length=128)
    user_type: str = Field(default="new", max_length=32)
    profile: dict[str, Any]
    selected_loan: Optional[dict[str, Any]] = None
    customer_context: Optional[dict[str, Any]] = None


@app.put("/api/knowledge-base/profile")
def save_knowledge_base_profile(payload: KnowledgeBaseProfileRequest):
    """Persist the active advisory profile so the RAG chat can reuse it."""
    KNOWLEDGE_BASE_PROFILE_STORE[payload.session_id] = {
        "user_type": payload.user_type,
        "profile": payload.profile,
        "selected_loan": payload.selected_loan,
        "customer_context": payload.customer_context,
        "updated_at": datetime.utcnow().isoformat(),
    }
    try:
        _save_knowledge_base_profiles()
    except OSError as exc:
        logger.exception("Unable to persist knowledge-base profile for %s", payload.session_id)
        raise HTTPException(500, "Could not save profile context.") from exc
    return {"status": "saved", "session_id": payload.session_id}


@app.get("/api/knowledge-base/profile/{session_id}")
def get_knowledge_base_profile(session_id: str):
    """Restore a saved RAG context after a browser refresh."""
    saved_profile = KNOWLEDGE_BASE_PROFILE_STORE.get(session_id)
    if saved_profile is None:
        raise HTTPException(404, "No saved knowledge-base profile for this session.")
    return {"session_id": session_id, "context": saved_profile}


@app.post("/query")
def query_knowledge_base(req: QueryRequest):
    profile_context = req.profile
    if req.session_id:
        saved_context = KNOWLEDGE_BASE_PROFILE_STORE.get(req.session_id)
        if saved_context:
            # The server-side context is authoritative: the customer never has
            # to type their slider values into the chat again.
            profile_context = saved_context
    try:
        return answer(req.question, loan_category=req.loan_category, top_k=req.top_k, profile=profile_context)
    except Exception:
        logger.exception("RAG /query failed for question: %r", req.question)
        raise HTTPException(
            status_code=503,
            detail="The knowledge base is temporarily unavailable. Please try again in a moment.",
        )

@app.get("/documents")
def list_documents():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT d.id, d.name, d.loan_category, d.uploaded_at,
                       COUNT(c.id) AS chunk_count
                FROM rag.documents d
                LEFT JOIN rag.chunks c ON c.doc_id = d.id
                GROUP BY d.id
                ORDER BY d.uploaded_at DESC;
            """)
            return cur.fetchall()

@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM rag.documents WHERE id = %s RETURNING id;", (doc_id,))
            if not cur.fetchone():
                raise HTTPException(404, "Document not found.")
        conn.commit()
    return {"status": "deleted", "doc_id": doc_id}

# ── Mount Frontend Static Files ────────────────────────────────────────
frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.exists():
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
