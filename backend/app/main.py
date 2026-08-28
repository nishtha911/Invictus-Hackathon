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
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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
            
            SUPABASE_URL = "https://psclpghrsoxelzmebovj.supabase.co"
            SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY2xwZ2hyc294ZWx6bWVib3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg0Mjk5OSwiZXhwIjoyMTAzNDE4OTk5fQ.bX5_2_CwIqTPPNkNUUJhGtAxaS-5PWaSkEXiez1oeWg"
            
            def sync_to_db():
                try:
                    with httpx.Client() as client:
                        client.post(
                            f"{SUPABASE_URL}/rest/v1/customer_profiles",
                            headers={
                                "apikey": SUPABASE_KEY,
                                "Authorization": f"Bearer {SUPABASE_KEY}",
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


# ── Mount Frontend Static Files ────────────────────────────────────────
frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.exists():
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")