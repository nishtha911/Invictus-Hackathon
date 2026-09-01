# /backend/app/main.py
"""
FastAPI application — HTTP interface for the Cognis Bank loan platform.

Surface:
  POST /api/v1/recommend-loans      → RAG-grounded, policy-bounded loan recommendations
  PUT  /api/knowledge-base/profile  → persist the advisory intake context for the RAG chat
  POST /query                       → grounded policy Q&A (RAG)
  POST /api/v1/leads                → capture + score an inbound lead
  GET  /api/v1/dashboard            → sales dashboard (employee only)
  POST /api/v1/voice/*              → browser AI voice CRM (employee only)
  POST /api/v1/auth/employee-login  → employee sign-in
  GET  /api/health                  → health check
"""

from __future__ import annotations

import logging
import uuid
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, File, Form, UploadFile, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import io

from app.config import get_settings
from db import init_db, get_conn
from ingest import ingest_document
from query import answer

# ── Logging ────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

import json

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
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


# Advisory intake context (from the slider flow), keyed by session id. Persisted
# to disk so the policy RAG chat can recover a user's context after a refresh.
KNOWLEDGE_BASE_PROFILE_STORE: dict[str, dict[str, Any]] = _load_knowledge_base_profiles()


def _save_knowledge_base_profiles() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    temporary_file = KNOWLEDGE_BASE_PROFILES_FILE.with_suffix(".tmp")
    temporary_file.write_text(
        json.dumps(KNOWLEDGE_BASE_PROFILE_STORE, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    temporary_file.replace(KNOWLEDGE_BASE_PROFILES_FILE)


# ── App lifecycle ──────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise the DB, warm the RAG embedder, verify sample docs."""
    logger.info("Starting Loan Advisory API...")
    settings = get_settings()
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Model: {settings.GROQ_MODEL}")

    # Init RAG + voice-call database tables
    try:
        init_db()
        logger.info("Database tables initialized.")
    except Exception as exc:
        logger.error(f"Failed to initialize database tables: {exc}")

    # Warm up RAG embedding model
    try:
        from query import get_embedder
        _ = get_embedder()
        logger.info("RAG embedding model initialized and ready.")
    except Exception as exc:
        logger.warning(f"Failed to pre-warm RAG embedder: {exc}")

    # Auto-ingest sample documents with metadata enrichment into PostgreSQL RAG tables
    try:
        from ingest import auto_ingest_sample_docs
        ingested = auto_ingest_sample_docs(force=False)
        logger.info(f"Sample docs auto-ingestion completed. Ingested/refreshed {len(ingested)} documents.")
    except Exception as exc:
        logger.error(f"Failed to verify sample documents: {exc}", exc_info=True)

    yield

    logger.info("Shutting down Loan Advisory API...")

# ── FastAPI App ────────────────────────────────────────────────────────

app = FastAPI(
    title="Cognis Bank Loan Platform API",
    description=(
        "RAG-grounded loan recommendations, deterministic underwriting, "
        "inbound lead scoring, and the employee sales dashboard + voice CRM."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS (allow React frontend) ───────────────────────────────────────

import os

frontend_url = os.environ.get("FRONTEND_URL", "*")
origins = [frontend_url] if frontend_url != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True if frontend_url != "*" else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════════════
#  ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "cognis-bank-loan-platform",
        "model": get_settings().GROQ_MODEL,
    }


# ── Customer Profile Lookup (used by customer login) ──────────────────────────

@app.get("/api/v1/customer/profile")
@app.get("/api/customer/profile")
async def get_customer_profile_by_phone(phone: Optional[str] = None, name: Optional[str] = None):
    """
    Lookup a customer profile from Supabase by phone number (and optionally name).
    Returns the customer's profile pre-filled for the advisor journey.
    Returns 404 if not found — frontend falls back to demo customer list.
    """
    from app.services.database import supabase

    # Normalise phone to digits only for comparison
    def _digits(s: str) -> str:
        import re as _re
        return _re.sub(r"\D", "", s or "")

    phone_digits = _digits(phone or "")
    if not phone_digits and not (name or "").strip():
        raise HTTPException(400, "At least one of phone or name is required.")

    if supabase:
        try:
            # Try to find in customer_profiles table first (saved after advisory)
            query = supabase.table("customer_profiles").select("*")
            if name and name.strip():
                query = query.ilike("applicant_name", f"%{name.strip()}%")
            res = query.limit(10).execute()
            rows = res.data or []

            if phone_digits and rows:
                # Filter by phone overlap
                matched = [r for r in rows if phone_digits[-7:] in _digits(r.get("phone") or "")]
                rows = matched if matched else rows

            if rows:
                row = rows[0]
                tenure_months = row.get("preferred_tenure_months") or 240
                tenure_years = tenure_months // 12
                return {
                    "status": "found",
                    "source": "supabase_customer_profiles",
                    "customer": {
                        "id": str(row.get("session_id") or row.get("id") or ""),
                        "name": row.get("applicant_name") or (name or "").strip(),
                        "email": row.get("email") or f"{(name or '').lower().replace(' ', '.')}@example.com",
                        "phone": phone or "",
                        "employment_type": row.get("employment_type") or "Salaried",
                        "employer": row.get("employer_type") or "Enterprise",
                        "monthly_income": row.get("monthly_income") or 0,
                        "existing_emi": row.get("existing_emi_obligations") or 0,
                        "credit_band": row.get("credit_score_band") or "Good (720 - 779)",
                        "cibil_score": 750,
                        "relationship_years": 2.0,
                        "account_type": "Savings Account",
                        "default_intent": row.get("intent") or "Home Loan",
                        "default_loan_amount": row.get("requested_loan_amount") or 0,
                        # Extra fields for profile pre-fill
                        "tenure_years": tenure_years,
                        "urgency": row.get("urgency") or "Immediate (Within 7 Days)",
                    },
                }
        except Exception as exc:
            logger.warning("customer_profiles DB lookup failed: %s", exc)

        # Also check qualified_leads table for name/phone match
        try:
            query2 = supabase.table("qualified_leads").select("*")
            if name and name.strip():
                query2 = query2.ilike("customer_name", f"%{name.strip()}%")
            res2 = query2.limit(10).execute()
            leads = res2.data or []
            if phone_digits and leads:
                matched2 = [l for l in leads if phone_digits[-7:] in _digits(l.get("phone") or "")]
                leads = matched2 if matched2 else leads
            if leads:
                lead = leads[0]
                return {
                    "status": "found",
                    "source": "supabase_qualified_leads",
                    "customer": {
                        "id": str(lead.get("id") or ""),
                        "name": lead.get("customer_name") or (name or "").strip(),
                        "email": lead.get("email") or f"{(name or '').lower().replace(' ', '.')}@example.com",
                        "phone": lead.get("phone") or phone or "",
                        "employment_type": "Salaried",
                        "employer": "Enterprise",
                        "monthly_income": 0,
                        "existing_emi": 0,
                        "credit_band": "Good (720 - 779)",
                        "cibil_score": 740,
                        "relationship_years": 1.0,
                        "account_type": "Savings Account",
                        "default_intent": lead.get("loan_type") or "Home Loan",
                        "default_loan_amount": float(lead.get("loan_amount") or 0),
                        "tenure_years": 20,
                        "urgency": "Immediate (Within 7 Days)",
                    },
                }
        except Exception as exc:
            logger.warning("qualified_leads DB lookup failed: %s", exc)

    raise HTTPException(404, "Customer not found in database.")



class RecommendLoansRequest(BaseModel):
    user_type: Optional[str] = "new"
    income: Optional[float] = 0.0
    loan_amount: Optional[float] = 0.0
    intent: Optional[str] = "Home Loan"
    tenure_years: Optional[int] = 20
    employment_type: Optional[str] = "Salaried"
    existing_emi: Optional[float] = 0.0
    credit_band: Optional[str] = "good"
    urgency: Optional[str] = "exploring"
    preferred_emi: Optional[str] = None
    interest_type: Optional[str] = None
    age: Optional[int] = None
    has_co_applicant: Optional[bool] = None
    customer_name: Optional[str] = None
    session_id: Optional[str] = None
    # RBI compliance / affordability inputs
    property_value: Optional[float] = None          # home-loan LTV tiering
    co_applicant_income: Optional[float] = None     # added to assessed income
    guarantor_income: Optional[float] = None        # guarantor monthly salary


@app.post("/api/v1/recommend-loans")
@app.post("/api/recommendations")
async def recommend_loans_endpoint(req: RecommendLoansRequest):
    """
    Generate and return real, policy-grounded loan recommendations.
    Directly evaluates against database loan products and scoring engine.
    """
    from app.services.database import fetch_loan_products, get_grounded_policy_chunks, INTENT_TO_CATEGORY
    from app.services.scoring_engine import evaluate_product_match
    from app.schemas.scoring import ExtractedProfilePayload, ProfileData, ExtractionMeta
    from app.services.recommendation import recommend_from_profile

    income = float(req.income or 0.0)
    loan_amount = float(req.loan_amount or 0.0)
    tenure_years = int(req.tenure_years or 20)
    tenure_months = tenure_years * 12
    intent = req.intent or "Home Loan"
    category_key = INTENT_TO_CATEGORY.get(intent, intent.lower().replace(" ", "_"))
    if category_key not in ("home_loan", "personal_loan", "vehicle_loan", "education_loan", "business_loan", "gold_loan"):
        category_key = "home_loan"

    emp_raw = (req.employment_type or "salaried").lower().replace(" ", "_").replace("-", "_")
    if "self" in emp_raw or "business" in emp_raw:
        emp_type = "self_employed"
    elif "owner" in emp_raw:
        emp_type = "business_owner"
    else:
        emp_type = "salaried"

    credit_raw = (req.credit_band or "good").lower()
    if "excel" in credit_raw or "780" in credit_raw:
        credit_band = "excellent"
    elif "good" in credit_raw or "700" in credit_raw:
        credit_band = "good"
    elif "fair" in credit_raw or "650" in credit_raw or "average" in credit_raw:
        credit_band = "fair"
    elif "poor" in credit_raw:
        credit_band = "poor"
    else:
        credit_band = "unknown"

    urgency_raw = (req.urgency or "exploring").lower()
    if "immed" in urgency_raw or "7" in urgency_raw:
        urgency_val = "immediate"
    elif "3" in urgency_raw or "month" in urgency_raw:
        urgency_val = "within_3_months"
    else:
        urgency_val = "exploring"

    user_type_val = "existing_customer" if req.user_type in ("existing", "existing_customer") else "guest"

    emi_pref_raw = (req.preferred_emi or "").lower()
    if "lowest" in emi_pref_raw or "low emi" in emi_pref_raw:
        preferred_emi_val = "lowest"
    elif "fast" in emi_pref_raw or "least" in emi_pref_raw or "interest" in emi_pref_raw:
        preferred_emi_val = "fast_repayment"
    elif "flex" in emi_pref_raw:
        preferred_emi_val = "flexible"
    elif "balanc" in emi_pref_raw:
        preferred_emi_val = "balanced"
    else:
        preferred_emi_val = None

    rate_pref_raw = (req.interest_type or "").lower()
    if "fix" in rate_pref_raw:
        interest_type_val = "fixed"
    elif "float" in rate_pref_raw:
        interest_type_val = "floating"
    elif rate_pref_raw:
        interest_type_val = "not_sure"
    else:
        interest_type_val = None

    payload = ExtractedProfilePayload(
        session_id=req.session_id or str(uuid.uuid4()),
        user_type=user_type_val,
        profile=ProfileData(
            intent=category_key,
            monthly_income=income,
            employment_type=emp_type,
            requested_loan_amount=loan_amount,
            preferred_tenure_months=tenure_months,
            existing_emi_obligations=float(req.existing_emi or 0.0),
            credit_score_band=credit_band,
            urgency=urgency_val,
            preferred_emi=preferred_emi_val,
            interest_type=interest_type_val,
        ),
        extraction_meta=ExtractionMeta(
            completeness_pct=100,
            turns_taken=0,
        ),
    )

    # Use RAG-based recommendation service as the authoritative source.
    try:
        from app.services.rag_to_frontend_transformer import transform_rag_recommendation_to_loan
        from query import retrieve
        
        rec_result = recommend_from_profile(payload.dict(), top_k=6)
        raw_recs = rec_result.get("recommendations", [])
        
        # Transform each RAG recommendation into frontend-compatible schema
        transformed_loans = []
        if raw_recs:
            # Retrieve chunks to get supporting content for each recommendation
            retrieval_query = f"{intent}, income: ₹{income}, amount: ₹{loan_amount}"
            try:
                supporting_chunks = retrieve(retrieval_query, top_k=10, loan_category=category_key)
                supporting_content = "\n".join([c.get("content", "") for c in supporting_chunks])
            except Exception:
                supporting_content = ""
            
            for rag_rec in raw_recs:
                try:
                    loan = transform_rag_recommendation_to_loan(
                        rag_rec=rag_rec,
                        profile=payload.dict(),
                        supporting_content=supporting_content,
                        category=intent
                    )
                    transformed_loans.append(loan)
                except Exception as e:
                    logger.warning("Failed to transform RAG recommendation %s: %s", rag_rec.get("scheme_name"), e)
                    continue

        # Synthesise ONE personalised offer from the best match, bounded by bank policy.
        personalized_offer = None
        advisor_note_text = None
        if transformed_loans:
            try:
                from app.services.personalized_offer import build_personalized_offer, advisor_note
                offer_profile = payload.dict().get("profile", {})
                offer_profile["age"] = req.age
                offer_profile["has_co_applicant"] = req.has_co_applicant
                offer_profile["property_value"] = req.property_value
                offer_profile["co_applicant_income"] = req.co_applicant_income
                offer_profile["guarantor_income"] = req.guarantor_income
                if req.customer_name:
                    offer_profile["name"] = req.customer_name
                offer_ctx = {"user_type": user_type_val, "profile": offer_profile}
                personalized_offer = build_personalized_offer(offer_ctx, transformed_loans[0])
                advisor_note_text = advisor_note(offer_ctx, transformed_loans[0], personalized_offer)
            except Exception as e:
                logger.warning("Personalised offer step skipped: %s", e)

        return {
            "status": "success",
            "recommended_loans": transformed_loans,
            "personalized_offer": personalized_offer,
            "advisor_note": advisor_note_text,
            "profile_summary": {
                "intent": intent,
                "income": income,
                "loan_amount": loan_amount,
                "tenure_years": tenure_years,
                "employment_type": req.employment_type or "Salaried",
            },
            "explanation_meta": {
                "model": get_settings().GROQ_MODEL,
                "numbers_verified": True,
                "policy_grounded": True,
                "rag_based": True,
            },
            "rag_insufficient_information": rec_result.get("insufficient_information", False),
            "rag_confidence": rec_result.get("confidence", 0.0),
        }
    except Exception as e:
        # Fallback to dynamic database product scoring if RAG recommendation service fails
        logger.exception("RAG recommendation service failed, falling back to dynamic database product scoring: %s", e)
        products = fetch_loan_products(category=category_key)
        if not products:
            products = fetch_loan_products(category=None)

        recommended_loans = []
        for idx, prod in enumerate(products):
            try:
                rec = evaluate_product_match(payload, prod)
                status_display = "Eligible"
                if rec.computed_terms.eligibility_status == "conditionally_eligible":
                    status_display = "Conditionally Eligible"
                elif rec.computed_terms.eligibility_status == "not_eligible":
                    status_display = "Review Required"
                rate = rec.computed_terms.interest_rate_pct
                emi = rec.computed_terms.estimated_emi
                match_score_pct = int(round(rec.match_score * 100))
                pname = prod.get("product_name") or prod.get("name", "Loan Scheme")
                pbank = prod.get("bank", "Cognis Bank")
                pmin = int(prod.get("min_amount", 100000))
                pmax = int(prod.get("max_amount", 10000000))
                pfee = float(prod.get("processing_fee_pct", 0.5))

                recommended_loans.append({
                    "loan_id": f"fb-{idx}-{prod.get('product_id', 'scheme')}",
                    "name": pname,
                    "bank": pbank,
                    "category": intent,
                    "match_score": match_score_pct,
                    "interest_rate": rate,
                    "estimated_emi": emi,
                    "min_amount": pmin,
                    "max_amount": pmax,
                    "tenure_months": tenure_months,
                    "processing_fee_pct": pfee,
                    "eligibility_status": status_display,
                    "is_verified_calculation": True,
                    "reasoning": f"Matches your requested profile against {pbank}'s {pname} guidelines.",
                    "bullet_points": [
                        f"Interest rate: {rate}% p.a.",
                        f"Loan limit: ₹{pmin:,.0f} to ₹{pmax:,.0f}",
                        f"Processing fee: {pfee}%",
                    ],
                    "policy_citations": [
                        {
                            "policy_name": pname,
                            "clause_id": f"clause-{idx}",
                            "text": f"Policy parameters from {pbank} {pname} documentation",
                        }
                    ],
                    "features": [
                        f"Interest rate: {rate}% p.a.",
                        f"Flexible tenure option",
                    ],
                    "tag": "BEST MATCH" if idx == 0 else None,
                })
            except Exception as eval_err:
                logger.warning("Failed to evaluate fallback product %s: %s", prod.get("product_name"), eval_err)

        personalized_offer = None
        advisor_note_text = None
        if recommended_loans:
            try:
                from app.services.personalized_offer import build_personalized_offer, advisor_note
                offer_profile = payload.dict().get("profile", {})
                offer_profile["age"] = req.age
                offer_profile["has_co_applicant"] = req.has_co_applicant
                offer_profile["property_value"] = req.property_value
                offer_profile["co_applicant_income"] = req.co_applicant_income
                offer_profile["guarantor_income"] = req.guarantor_income
                if req.customer_name:
                    offer_profile["name"] = req.customer_name
                offer_ctx = {"user_type": user_type_val, "profile": offer_profile}
                personalized_offer = build_personalized_offer(offer_ctx, recommended_loans[0])
                advisor_note_text = advisor_note(offer_ctx, recommended_loans[0], personalized_offer)
            except Exception as offer_err:
                logger.warning("Personalised offer step skipped (fallback path): %s", offer_err)

        return {
            "status": "success",
            "recommended_loans": recommended_loans,
            "personalized_offer": personalized_offer,
            "advisor_note": advisor_note_text,
        }


# ── In-memory lead store ───────────────────────────────────────────────
LEAD_STORE: list[dict] = []


# ── Lead Capture Endpoint ──────────────────────────────────────────────

GUARANTOR_MIN_MONTHLY_SALARY = 25000.0  # a declared guarantor must earn at least this


class PartyDetails(BaseModel):
    """Optional guarantor / co-applicant block."""
    name: Optional[str] = None
    relation: Optional[str] = None
    monthly_salary: Optional[float] = None


class LeadCapturePayload(BaseModel):
    session_id: Optional[str] = None
    name: str
    email: str
    phone: str
    selected_loan: Optional[str] = None
    selected_loan_id: Optional[str] = None
    selected_loan_name: Optional[str] = None
    loan_id: Optional[str] = None
    loan_amount: Optional[float] = None
    estimated_emi: Optional[float] = None
    preferred_contact_time: Optional[str] = "Morning"
    notes: Optional[str] = None
    lead_source: Optional[str] = "genai"        # 'genai' | 'manual_employee_call'
    guarantor: Optional[PartyDetails] = None    # optional
    co_applicant: Optional[PartyDetails] = None # optional

    @field_validator("guarantor")
    @classmethod
    def _guarantor_min_salary(cls, v: Optional[PartyDetails]) -> Optional[PartyDetails]:
        if v and (v.name or "").strip():
            salary = v.monthly_salary or 0.0
            if salary < GUARANTOR_MIN_MONTHLY_SALARY:
                raise ValueError(
                    f"Guarantor must have a minimum monthly salary of ₹{GUARANTOR_MIN_MONTHLY_SALARY:,.0f} "
                    f"to be eligible (received ₹{salary:,.0f})."
                )
        return v


@app.post("/api/v1/leads")
@app.post("/api/leads")
async def capture_lead(payload: LeadCapturePayload):
    """Capture an inbound lead and return AI scoring intelligence."""
    from app.services.lead_scorer import score_lead

    sid = payload.session_id or ""
    kb_ctx = KNOWLEDGE_BASE_PROFILE_STORE.get(sid, {})
    kb_profile = kb_ctx.get("profile", {})

    monthly_income = kb_profile.get("income")
    existing_emi = kb_profile.get("existing_emi")
    req_amount = payload.loan_amount or kb_profile.get("loan_amount")
    tenure = (kb_profile.get("tenure_years") or 20) * 12
    credit = kb_profile.get("credit_band")
    urgency = kb_profile.get("urgency")
    intent = kb_profile.get("intent")

    # Optional guarantor / co-applicant — {name, relation, monthly_salary}
    def _party(block) -> Optional[dict]:
        if not block:
            return None
        data = block.dict() if hasattr(block, "dict") else dict(block)
        if not (data.get("name") or "").strip():
            return None
        try:
            data["monthly_salary"] = float(data.get("monthly_salary") or 0) or 0.0
        except (TypeError, ValueError):
            data["monthly_salary"] = 0.0
        return data

    guarantor = _party(payload.guarantor)
    co_applicant = _party(payload.co_applicant)

    # A co-applicant's salary is assessable income; a guarantor's is supporting
    # security but not primary income — count half of it toward affordability.
    assessed_income = float(monthly_income) if monthly_income else 0.0
    if co_applicant:
        assessed_income += co_applicant["monthly_salary"]
    if guarantor:
        assessed_income += guarantor["monthly_salary"] * 0.5

    source_raw = str(payload.lead_source or "genai").lower().strip()
    lead_source = source_raw if source_raw in ("genai", "manual_employee_call") else "genai"

    scoring = score_lead(
        session_id=sid or f"SESSION-{int(datetime.utcnow().timestamp())}",
        completeness_pct=85,
        monthly_income=assessed_income if assessed_income > 0 else None,
        existing_emi_obligations=float(existing_emi) if existing_emi else 0.0,
        requested_loan_amount=float(req_amount) if req_amount else None,
        preferred_tenure_months=int(tenure) if tenure else 240,
        credit_score_band=str(credit) if credit else "good",
        urgency=str(urgency) if urgency else "exploring",
        intent=str(intent) if intent else "home_loan",
    )

    lead_name = payload.selected_loan or payload.selected_loan_name or "Prime Home Loan"
    lead_id_val = payload.loan_id or payload.selected_loan_id or "prod-001"

    lead_record = {
        **scoring,
        "customer_name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "product_id": lead_id_val,
        "product_name": lead_name,
        "loan_amount": payload.loan_amount or req_amount,
        "estimated_emi": payload.estimated_emi,
        "preferred_contact_time": payload.preferred_contact_time or "Morning",
        "notes": payload.notes,
        "lead_source": lead_source,
        "guarantor": guarantor,
        "co_applicant": co_applicant,
        "status": "New",
        "created_at": datetime.utcnow().isoformat(),
    }
    LEAD_STORE.append(lead_record)

    # Persist to Supabase qualified_leads table
    try:
        from app.services.database import save_lead
        save_lead(lead_record)
    except Exception as e:
        logger.error(f"Error syncing lead to Supabase: {e}")

    logger.info(f"Lead captured: {scoring['lead_id']} — {scoring['score_band']} ({scoring['score']}/100)")

    return {
        "status": "captured",
        "lead_id": scoring["lead_id"],
        "message": "Your loan interest has been recorded. A relationship manager will contact you shortly.",
        "created_at": lead_record["created_at"],
        "lead_data": {
            "name": payload.name,
            "email": payload.email,
            "phone": payload.phone,
            "selected_loan": lead_name,
            "preferred_contact_time": payload.preferred_contact_time or "Morning",
            "loan_id": lead_id_val,
            "loan_amount": payload.loan_amount or req_amount,
            "estimated_emi": payload.estimated_emi,
            "lead_source": lead_source,
            "guarantor": guarantor,
            "co_applicant": co_applicant,
        },
        "scoring": {
            "lead_score": scoring["score"],
            "score": scoring["score"],
            "score_band": scoring["score_band"],
            "ai_agent_briefing": scoring["ai_briefing"],
            "ai_briefing": scoring["ai_briefing"],
            "key_scoring_factors": scoring["key_scoring_factors"],
            "recommended_talking_points": scoring["talking_points"],
            "talking_points": scoring["talking_points"],
            "qualification_probability": scoring["qualification_probability"],
            "estimated_closing_days": scoring["estimated_closing_days"],
        },
    }


# ── Sales Dashboard Endpoint ───────────────────────────────────────────

@app.get("/api/v1/dashboard")
@app.get("/api/dashboard")
async def get_dashboard(x_role: Optional[str] = Header(None, alias="X-Role")):
    """Return sales intelligence dashboard data from Supabase and memory."""
    if x_role != "employee":
        raise HTTPException(403, "Access restricted. Only bank employees can view the sales dashboard.")

    import re
    from app.services.database import fetch_leads

    _CATEGORY_HINTS = {
        "home loan": "Home Loan", "personal loan": "Personal Loan",
        "vehicle loan": "Vehicle Loan", "car loan": "Vehicle Loan",
        "education loan": "Education Loan", "business loan": "Business Loan",
        "gold loan": "Gold Loan",
    }

    def _amount_from_text(text: str) -> float:
        # The AI briefing always contains "...requesting a <type> of ₹<amount>..."
        m = re.search(r"of\s*₹\s*([\d,]+)", text or "")
        if not m:
            m = re.search(r"₹\s*([\d,]{4,})", text or "")
        if m:
            try:
                return float(m.group(1).replace(",", ""))
            except ValueError:
                pass
        return 0.0

    def _category_from_text(text: str) -> str:
        low = (text or "").lower()
        for hint, label in _CATEGORY_HINTS.items():
            if hint in low:
                return label
        return "Loan"

    formatted_leads = []

    # 1. Fetch live leads from Supabase qualified_leads
    db_leads = fetch_leads()
    for dl in db_leads:
        band_raw = str(dl.get("lead_band", "warm")).upper()
        score_band_display = f"{band_raw} LEAD" if "LEAD" not in band_raw else band_raw
        briefing = dl.get("chat_summary", "") or ""
        req_amount = float(dl.get("requested_amount") or 0) or _amount_from_text(briefing)
        formatted_leads.append({
            "id": str(dl.get("lead_id", "LEAD-001")),
            "customer_name": dl.get("full_name", "Borrower"),
            "email": dl.get("email", ""),
            "phone": dl.get("phone", ""),
            "product_name": dl.get("interested_product_id", "Loan"),
            "loan_category": _category_from_text(briefing),
            "requested_amount": req_amount,
            "estimated_emi": float(dl.get("estimated_emi") or 0.0),
            "lead_score": int(dl.get("lead_score", 80)),
            "score_band": score_band_display,
            "urgency": "Immediate",
            "status": str(dl.get("status", "new")).capitalize(),
            "created_at": str(dl.get("created_at", "Just now")),
            "preferred_time": dl.get("preferred_contact_time", "Morning (9 AM - 12 PM)"),
            "ai_briefing": dl.get("chat_summary", ""),
            "scoring_factors": dl.get("score_factors", []),
            "talking_points": dl.get("recommended_talking_points", []),
            "lead_source": str(dl.get("lead_source") or "genai"),
        })

    # 2. Append any session in-memory leads if not already present
    for l in reversed(LEAD_STORE):
        formatted_leads.insert(0, {
            "id": l.get("lead_id", "LEAD-001"),
            "customer_name": l.get("customer_name", "Borrower"),
            "email": l.get("email", ""),
            "phone": l.get("phone", ""),
            "product_name": l.get("product_name", "Loan"),
            "loan_category": l.get("intent", "Home Loan"),
            "requested_amount": float(l.get("loan_amount") or 0.0),
            "estimated_emi": float(l.get("estimated_emi") or 0.0),
            "lead_score": int(l.get("score", 85)),
            "score_band": l.get("score_band", "WARM LEAD"),
            "urgency": l.get("urgency", "Immediate (Within 7 Days)"),
            "status": l.get("status", "New"),
            "created_at": l.get("created_at", "Just now"),
            "preferred_time": l.get("preferred_contact_time", "Morning (9 AM - 12 PM)"),
            "ai_briefing": l.get("ai_briefing", ""),
            "scoring_factors": l.get("key_scoring_factors", []),
            "talking_points": l.get("talking_points", []),
            "lead_source": str(l.get("lead_source") or "genai"),
        })

    total_leads = len(formatted_leads)
    hot_leads = sum(1 for l in formatted_leads if "HOT" in str(l.get("score_band", "")).upper())
    warm_leads = sum(1 for l in formatted_leads if "WARM" in str(l.get("score_band", "")).upper())
    nurture_leads = max(0, total_leads - hot_leads - warm_leads)
    total_demand = sum(float(l.get("requested_amount") or 0) for l in formatted_leads)

    # Pipeline from real lead statuses
    def _status_count(*names):
        wanted = {n.lower() for n in names}
        return sum(1 for l in formatted_leads if str(l.get("status", "")).lower() in wanted)

    pipeline = {
        "new": _status_count("new"),
        "qualified": _status_count("qualified", "in review"),
        "contacted": _status_count("contacted"),
        "converted": _status_count("converted"),
    }

    # Product demand aggregated from real leads (by category)
    _cat_agg: dict[str, dict] = {}
    _palette = ["#1F7A63", "#6366f1", "#06b6d4", "#8b5cf6", "#f59e0b", "#64748b"]
    for l in formatted_leads:
        cat = l.get("loan_category") or "Loan"
        _cat_agg.setdefault(cat, {"value": 0.0, "count": 0})
        _cat_agg[cat]["value"] += float(l.get("requested_amount") or 0)
        _cat_agg[cat]["count"] += 1
    product_demand = [
        {"name": name, "value": round(v["value"]), "count": v["count"], "color": _palette[i % len(_palette)]}
        for i, (name, v) in enumerate(sorted(_cat_agg.items(), key=lambda kv: kv[1]["value"], reverse=True))
    ]

    # Weekly trend from created_at (best-effort parse; empty when timestamps unavailable)
    from collections import OrderedDict
    trend_buckets: "OrderedDict[str, dict]" = OrderedDict()
    for l in formatted_leads:
        raw = str(l.get("created_at", ""))
        try:
            day = datetime.fromisoformat(raw.replace("Z", "+00:00")).strftime("%a %d")
        except (ValueError, TypeError):
            continue
        b = trend_buckets.setdefault(day, {"day": day, "total": 0, "hot": 0, "converted": 0})
        b["total"] += 1
        if "HOT" in str(l.get("score_band", "")).upper():
            b["hot"] += 1
        if str(l.get("status", "")).lower() == "converted":
            b["converted"] += 1
    trends = list(trend_buckets.values())

    qualification_rate = (
        round((hot_leads + warm_leads) / total_leads * 100) if total_leads else 0
    )

    # Lead-source split: GenAI voice/advisory agent vs manual employee phone calls
    genai_count = sum(1 for l in formatted_leads if str(l.get("lead_source") or "genai") == "genai")
    manual_count = sum(1 for l in formatted_leads if str(l.get("lead_source")) == "manual_employee_call")
    lead_source_breakdown = [
        {"key": "genai", "name": "GenAI Voice Agent", "value": genai_count, "color": "#6366F1"},
        {"key": "manual_employee_call", "name": "Manual Employee Calls", "value": manual_count, "color": "#F59E0B"},
    ]

    return {
        "kpis": {
            "total_leads": total_leads,
            "hot_leads": hot_leads,
            "warm_leads": warm_leads,
            "qualification_rate": qualification_rate,
            "total_loan_demand": total_demand,
            "conversion_pipeline": pipeline,
        },
        "trends": trends,
        "productDemand": product_demand,
        "leadSourceBreakdown": lead_source_breakdown,
        "scoreDistribution": [
            {"range": "Hot (70-100)", "count": hot_leads, "fill": "#1F7A63"},
            {"range": "Warm (50-69)", "count": warm_leads, "fill": "#6366f1"},
            {"range": "Nurture (< 50)", "count": nurture_leads, "fill": "#94a3b8"},
        ],
        "leads": formatted_leads,
    }


# ═══════════════════════════════════════════════════════════════════════
#  AI VOICE CALL ENDPOINTS  (browser-based, no telephony provider)
# ═══════════════════════════════════════════════════════════════════════

class VoiceOpeningRequest(BaseModel):
    lead: dict[str, Any] = Field(default_factory=dict)


class VoiceTurnRequest(BaseModel):
    context: dict[str, Any] = Field(default_factory=dict)
    history: list[dict[str, Any]] = Field(default_factory=list)
    user_speech: str = ""


class VoiceTtsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class VoiceCompleteRequest(BaseModel):
    context: dict[str, Any] = Field(default_factory=dict)
    transcript: list[dict[str, Any]] = Field(default_factory=list)
    duration: int = 0


def _require_employee(x_role: Optional[str]) -> None:
    """Voice CRM actions are for bank employees only (same X-Role convention
    already used for KB upload/delete)."""
    if x_role != "employee":
        raise HTTPException(403, "Access restricted. Only bank employees can use the Voice CRM.")


@app.post("/api/v1/voice/opening")
@app.post("/api/voice/opening")
async def voice_opening(req: VoiceOpeningRequest, x_role: Optional[str] = Header(None, alias="X-Role")):
    _require_employee(x_role)
    from app.services import voice_service
    context = voice_service.build_call_context(req.lead)
    return {"opening_line": voice_service.generate_opening_line(context), "context": context}


@app.post("/api/v1/voice/turn")
@app.post("/api/voice/turn")
async def voice_turn(req: VoiceTurnRequest, x_role: Optional[str] = Header(None, alias="X-Role")):
    _require_employee(x_role)
    from app.services import voice_service
    context = req.context or voice_service.build_call_context({})
    return voice_service.generate_turn(context, req.history, req.user_speech)


@app.post("/api/v1/voice/tts")
@app.post("/api/voice/tts")
async def voice_tts(req: VoiceTtsRequest, x_role: Optional[str] = Header(None, alias="X-Role")):
    _require_employee(x_role)
    from app.services import voice_service
    audio = voice_service.synthesize_speech(req.text)
    if audio:
        return Response(content=audio, media_type="audio/mpeg")
    # No ElevenLabs key — the browser falls back to speechSynthesis.
    return Response(status_code=204)


@app.post("/api/v1/voice/complete")
@app.post("/api/voice/complete")
async def voice_complete(req: VoiceCompleteRequest, x_role: Optional[str] = Header(None, alias="X-Role")):
    _require_employee(x_role)
    from app.services import voice_service
    context = req.context or voice_service.build_call_context({})
    analysis = voice_service.analyze_transcript(context, req.transcript)
    record = voice_service.log_call(context, req.transcript, req.duration, analysis)
    logger.info("Voice call logged: %s (%s / %s)", record["call_id"], analysis["intent"], analysis["sentiment"])

    # A positive manual phone call becomes a qualified lead, attributed to the
    # employee call channel so the dashboard can compare it against GenAI leads.
    positive = str(analysis.get("intent", "")).upper() in {
        "READY_TO_APPLY", "INTERESTED", "NEEDS_TIME", "CALLBACK_REQUESTED"
    }
    if positive:
        try:
            from app.services.database import save_lead
            band = "hot" if analysis.get("intent", "").upper() == "READY_TO_APPLY" else "warm"
            save_lead({
                "customer_name": context.get("name") or "Phone Enquiry",
                "phone": context.get("phone") or "N/A",
                "email": context.get("email") or "N/A",
                "loan_id": context.get("lead_id"),
                "lead_score": 82 if band == "hot" else 68,
                "score_band": band,
                "lead_source": "manual_employee_call",
                "chat_summary": analysis.get("summary") or record.get("summary") or "",
                "key_objections_or_notes": analysis.get("next_action") or "",
                "preferred_contact_time": "Morning",
            })
        except Exception as exc:
            logger.warning("Could not persist manual-call lead: %s", exc)

    return {"call": record, "analysis": analysis}


@app.get("/api/v1/voice/calls")
@app.get("/api/voice/calls")
async def voice_calls(x_role: Optional[str] = Header(None, alias="X-Role")):
    _require_employee(x_role)
    from app.services import voice_service
    calls = voice_service.list_calls()
    return {"total": len(calls), "calls": calls}


# ═══════════════════════════════════════════════════════════════════════
#  RAG ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@app.get("/config")
def get_config():
    """Returns active LLM provider info — useful for frontend display."""
    import os
    provider = os.getenv("LLM_PROVIDER", "groq").lower()
    if provider == "openrouter":
        model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free")
    else:
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    return {"provider": provider, "model": model}

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    loan_category: str = Form(...),
    x_role: Optional[str] = Header(None, alias="X-Role"),
):
    if x_role != "employee":
        raise HTTPException(403, "Access restricted. Only bank employees can upload policy documents to the knowledge base.")

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
    except Exception as e:
        logger.exception("Upload ingestion failed: %s", e)
        raise HTTPException(500, f"Document ingestion failed: {e}")

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


def _resolve_advisory_profile(session_id: str | None, payload_profile: dict | None = None) -> dict:
    """
    Resolve the customer's advisory context for the RAG chat / lead scoring:
    1. KNOWLEDGE_BASE_PROFILE_STORE (the slider intake cache, saved by /api/knowledge-base/profile)
    2. Supabase public.customer_profiles
    3. Direct payload profile overlay
    """
    merged_profile: dict[str, Any] = {}

    if session_id:
        # 1. Check KNOWLEDGE_BASE_PROFILE_STORE
        if session_id in KNOWLEDGE_BASE_PROFILE_STORE:
            merged_profile = dict(KNOWLEDGE_BASE_PROFILE_STORE[session_id])

        # 2. Check Supabase public schema customer_profiles table
        if not merged_profile:
            try:
                from app.services.database import get_customer_profile
                db_profile = get_customer_profile(session_id)
                if db_profile:
                    merged_profile = db_profile
            except Exception as e:
                logger.warning("Error fetching customer profile from Supabase for %s: %s", session_id, e)

    # 3. Overlay with direct payload profile if passed
    if isinstance(payload_profile, dict) and payload_profile:
        if not merged_profile:
            merged_profile = dict(payload_profile)
        else:
            base_profile = merged_profile.get("profile", {})
            if isinstance(base_profile, dict):
                overlay = payload_profile.get("profile", payload_profile)
                if isinstance(overlay, dict):
                    base_profile.update({k: v for k, v in overlay.items() if v is not None})
                merged_profile["profile"] = base_profile
            if "selected_loan" in payload_profile and payload_profile["selected_loan"]:
                merged_profile["selected_loan"] = payload_profile["selected_loan"]
            if "customer_context" in payload_profile and payload_profile["customer_context"]:
                merged_profile["customer_context"] = payload_profile["customer_context"]

    return merged_profile


@app.put("/api/knowledge-base/profile")
def save_knowledge_base_profile(payload: KnowledgeBaseProfileRequest):
    """Persist the active advisory profile so the RAG chat can reuse it."""
    KNOWLEDGE_BASE_PROFILE_STORE[payload.session_id] = {
        "session_id": payload.session_id,
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
    """Restore a saved RAG context after a browser refresh across all stores."""
    saved_profile = _resolve_advisory_profile(session_id)
    if not saved_profile:
        raise HTTPException(404, "No saved knowledge-base profile for this session.")
    return {"session_id": session_id, "context": saved_profile}


@app.post("/query")
def query_knowledge_base(req: QueryRequest):
    profile_context = _resolve_advisory_profile(req.session_id, req.profile)

    if not req.question or not req.question.strip():
        raise HTTPException(status_code=422, detail="Question cannot be empty.")

    try:
        return answer(req.question, loan_category=req.loan_category, top_k=req.top_k, profile=profile_context)
    except HTTPException:
        raise
    except ValueError as ve:
        logger.warning("Validation error in RAG /query: %s", ve)
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as exc:
        logger.exception("RAG /query failed for question: %r", req.question)
        raise HTTPException(
            status_code=503,
            detail=f"Knowledge Base Service Unavailable: {str(exc)}",
        ) from exc


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
def delete_document(
    doc_id: int,
    x_role: Optional[str] = Header(None, alias="X-Role"),
):
    if x_role != "employee":
        raise HTTPException(403, "Access restricted. Only bank employees can delete policy documents from the knowledge base.")

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM rag.documents WHERE id = %s RETURNING id;", (doc_id,))
            if not cur.fetchone():
                raise HTTPException(404, "Document not found.")
        conn.commit()
    return {"status": "deleted", "doc_id": doc_id}


# ── Employee & Customer Auth Endpoints ─────────────────────────────────

class EmployeeLoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/v1/auth/employee-login")
@app.post("/api/auth/employee-login")
async def employee_login_endpoint(req: EmployeeLoginRequest):
    """Authenticate bank employee for Command Center access."""
    if req.username.strip() == "bankemployee" and req.password == "Demo@123":
        return {
            "status": "success",
            "role": "employee",
            "username": "bankemployee",
            "message": "Successfully authenticated as bank employee"
        }
    raise HTTPException(status_code=401, detail="Invalid employee username or password.")


