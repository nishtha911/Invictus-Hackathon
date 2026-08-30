# /backend/app/services/database.py
"""
Supabase database client for loan product catalogue and RAG policy retrieval.
Falls back to a static product list if Supabase is unavailable (local dev mode).
"""
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# ── Try connecting to Supabase (optional) ────────────────────────────────
try:
    from supabase import create_client, Client
    supabase: Client | None = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized.")
except Exception as e:
    supabase = None
    logger.warning(f"Supabase unavailable ({e}) — using static fallback product catalogue.")

# ── Embedder (Lazy loaded on demand) ──────────────────────────────────
_embedder = None

def get_embedder():
    global _embedder
    if _embedder is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedder = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            _embedder = None
            logger.warning("sentence-transformers not available — RAG citations disabled.")
    return _embedder

# ── Static fallback loan product catalogue ───────────────────────────────
# Keys match exactly what scoring_engine.py expects:
# product_id, product_name, base_interest_rate, min_tenure_months, max_tenure_months,
# min_monthly_income, min_amount, max_amount, max_foir_pct, is_active
STATIC_LOAN_PRODUCTS = [
    # Home Loans
    {
        "product_id": "prod-001", "product_name": "SBI Home Advantage",
        "category": "home_loan", "base_interest_rate": 8.40,
        "min_amount": 500000, "max_amount": 75000000,
        "min_monthly_income": 25000, "max_foir_pct": 0.55,
        "min_tenure_months": 12, "max_tenure_months": 360,
        "processing_fee_pct": 0.35, "is_active": True,
    },
    {
        "product_id": "prod-002", "product_name": "HDFC Home Premium",
        "category": "home_loan", "base_interest_rate": 8.65,
        "min_amount": 1000000, "max_amount": 100000000,
        "min_monthly_income": 35000, "max_foir_pct": 0.50,
        "min_tenure_months": 12, "max_tenure_months": 360,
        "processing_fee_pct": 0.50, "is_active": True,
    },
    {
        "product_id": "prod-003", "product_name": "ICICI Home First",
        "category": "home_loan", "base_interest_rate": 8.75,
        "min_amount": 300000, "max_amount": 50000000,
        "min_monthly_income": 20000, "max_foir_pct": 0.55,
        "min_tenure_months": 12, "max_tenure_months": 300,
        "processing_fee_pct": 0.50, "is_active": True,
    },
    # Personal Loans
    {
        "product_id": "prod-004", "product_name": "Axis QuickPersonal",
        "category": "personal_loan", "base_interest_rate": 10.75,
        "min_amount": 50000, "max_amount": 4000000,
        "min_monthly_income": 15000, "max_foir_pct": 0.50,
        "min_tenure_months": 12, "max_tenure_months": 60,
        "processing_fee_pct": 1.50, "is_active": True,
    },
    {
        "product_id": "prod-005", "product_name": "HDFC FlexiPersonal",
        "category": "personal_loan", "base_interest_rate": 10.50,
        "min_amount": 50000, "max_amount": 4000000,
        "min_monthly_income": 20000, "max_foir_pct": 0.50,
        "min_tenure_months": 6, "max_tenure_months": 60,
        "processing_fee_pct": 1.25, "is_active": True,
    },
    {
        "product_id": "prod-006", "product_name": "Kotak Salary Plus",
        "category": "personal_loan", "base_interest_rate": 10.25,
        "min_amount": 100000, "max_amount": 3500000,
        "min_monthly_income": 25000, "max_foir_pct": 0.45,
        "min_tenure_months": 12, "max_tenure_months": 60,
        "processing_fee_pct": 1.00, "is_active": True,
    },
    # Vehicle Loans
    {
        "product_id": "prod-007", "product_name": "SBI Car Loan Prime",
        "category": "vehicle_loan", "base_interest_rate": 8.85,
        "min_amount": 100000, "max_amount": 10000000,
        "min_monthly_income": 20000, "max_foir_pct": 0.55,
        "min_tenure_months": 12, "max_tenure_months": 84,
        "processing_fee_pct": 0.25, "is_active": True,
    },
    {
        "product_id": "prod-008", "product_name": "HDFC Auto Smart",
        "category": "vehicle_loan", "base_interest_rate": 8.95,
        "min_amount": 100000, "max_amount": 8000000,
        "min_monthly_income": 20000, "max_foir_pct": 0.50,
        "min_tenure_months": 12, "max_tenure_months": 84,
        "processing_fee_pct": 0.50, "is_active": True,
    },
    # Education Loans
    {
        "product_id": "prod-009", "product_name": "SBI Scholar Education",
        "category": "education_loan", "base_interest_rate": 8.15,
        "min_amount": 400000, "max_amount": 15000000,
        "min_monthly_income": 15000, "max_foir_pct": 0.60,
        "min_tenure_months": 12, "max_tenure_months": 180,
        "processing_fee_pct": 0.00, "is_active": True,
    },
    {
        "product_id": "prod-010", "product_name": "HDFC Credila Education",
        "category": "education_loan", "base_interest_rate": 9.25,
        "min_amount": 200000, "max_amount": 25000000,
        "min_monthly_income": 10000, "max_foir_pct": 0.65,
        "min_tenure_months": 12, "max_tenure_months": 180,
        "processing_fee_pct": 1.00, "is_active": True,
    },
    # Business Loans
    {
        "product_id": "prod-011", "product_name": "Axis Business Booster",
        "category": "business_loan", "base_interest_rate": 11.50,
        "min_amount": 200000, "max_amount": 5000000,
        "min_monthly_income": 30000, "max_foir_pct": 0.50,
        "min_tenure_months": 12, "max_tenure_months": 60,
        "processing_fee_pct": 1.75, "is_active": True,
    },
    {
        "product_id": "prod-012", "product_name": "ICICI Business Growth",
        "category": "business_loan", "base_interest_rate": 12.00,
        "min_amount": 500000, "max_amount": 20000000,
        "min_monthly_income": 50000, "max_foir_pct": 0.55,
        "min_tenure_months": 12, "max_tenure_months": 84,
        "processing_fee_pct": 2.00, "is_active": True,
    },
]

# Map frontend intent strings to DB categories
INTENT_TO_CATEGORY = {
    "home_loan": "home_loan", "personal_loan": "personal_loan",
    "vehicle_loan": "vehicle_loan", "education_loan": "education_loan",
    "business_loan": "business_loan",
    "Home Loan": "home_loan", "Personal Loan": "personal_loan",
    "Vehicle Loan": "vehicle_loan", "Education Loan": "education_loan",
    "Business Loan": "business_loan",
}


def fetch_loan_products(category: str = None):
    """Fetches active loan products. Tries Supabase first, falls back to static list."""
    db_category = INTENT_TO_CATEGORY.get(category or "", category)

    if supabase:
        try:
            query = supabase.table("loan_products").select("*").eq("is_active", True)
            if db_category:
                query = query.eq("category", db_category)
            res = query.execute()
            if res.data:
                logger.info(f"Fetched {len(res.data)} products from Supabase for '{db_category}'")
                return res.data
        except Exception as e:
            logger.warning(f"Supabase product fetch failed: {e} — using static fallback")

    # Static fallback
    products = [p for p in STATIC_LOAN_PRODUCTS if p["is_active"]]
    if db_category:
        filtered = [p for p in products if p["category"] == db_category]
        products = filtered if filtered else products  # fallback all if category unknown
    logger.info(f"Using {len(products)} static fallback products for '{db_category}'")
    return products


def get_grounded_policy_chunks(product_id: str, user_query: str, top_k: int = 3):
    """Retrieves top-k policy chunks. Returns empty citations if RAG is unavailable."""
    embedder = get_embedder()
    if supabase and embedder:
        try:
            query_vector = embedder.encode(user_query).tolist()
            res = supabase.rpc("match_policy_chunks", {
                "query_embedding": query_vector,
                "match_product_id": product_id,
                "match_count": top_k,
                "similarity_threshold": 0.2
            }).execute()
            chunks = res.data or []
            chunk_ids = [c["chunk_id"] for c in chunks]
            context_text = "\n\n".join([f"[{c['chunk_id']}]: {c['content']}" for c in chunks])
            return {"context_text": context_text, "grounded_on_chunk_ids": chunk_ids, "raw_chunks": chunks}
        except Exception as e:
            logger.warning(f"RAG retrieval failed: {e}")

    return {"context_text": "", "grounded_on_chunk_ids": [], "raw_chunks": []}


def save_customer_profile(extracted_json: dict):
    """Saves extracted profile to Supabase. Silent no-op if unavailable."""
    if not supabase:
        return None
    try:
        profile = extracted_json.get("profile", {})
        meta = extracted_json.get("extraction_meta", {})
        db_row = {
            "session_id": extracted_json.get("session_id"),
            "user_type": extracted_json.get("user_type", "guest"),
            "applicant_name": profile.get("name"),
            "intent": profile.get("intent"),
            "age": profile.get("age"),
            "monthly_income": profile.get("monthly_income"),
            "employment_type": profile.get("employment_type"),
            "requested_loan_amount": profile.get("requested_loan_amount"),
            "preferred_tenure_months": profile.get("preferred_tenure_months"),
            "existing_emi_obligations": profile.get("existing_emi_obligations", 0.0),
            "has_existing_loans": profile.get("has_existing_loans", False),
            "credit_score_band": profile.get("credit_score_band", "unknown"),
            "urgency": profile.get("urgency", "exploring"),
            "completeness_pct": meta.get("completeness_pct", 0),
            "turns_taken": meta.get("turns_taken", 0),
        }
        res = supabase.table("customer_profiles").upsert(db_row).execute()
        return res.data
    except Exception as e:
        logger.error(f"Failed to save profile to Supabase: {e}")
        return None


def save_lead(lead_dict: dict):
    """Saves a captured qualified lead to the Supabase qualified_leads table safely."""
    if not supabase:
        logger.warning("Supabase client not initialized, skipping DB lead save.")
        return None
    try:
        import uuid as _uuid
        raw_sid = lead_dict.get("session_id")
        valid_sid = None
        if raw_sid:
            try:
                valid_sid = str(_uuid.UUID(str(raw_sid)))
            except Exception:
                valid_sid = None

        # Clean score band (must be 'hot', 'warm', or 'cold' lowercase for CHECK constraint)
        band_raw = str(lead_dict.get("score_band", "warm")).lower()
        if "hot" in band_raw:
            clean_band = "hot"
        elif "cold" in band_raw:
            clean_band = "cold"
        else:
            clean_band = "warm"

        # Check product_id exists in loan_products, fallback to 'prod-001'
        prod_id = lead_dict.get("product_id") or lead_dict.get("loan_id") or "prod-001"
        if not prod_id.startswith("prod-"):
            prod_id = "prod-001"

        db_row = {
            "full_name": lead_dict.get("customer_name") or lead_dict.get("name") or "Interested Borrower",
            "phone": str(lead_dict.get("phone") or "N/A"),
            "email": str(lead_dict.get("email") or "N/A"),
            "session_id": valid_sid,
            "preferred_contact_time": lead_dict.get("preferred_contact_time", "Morning"),
            "interested_product_id": prod_id,
            "lead_score": max(0, min(100, int(lead_dict.get("score") or lead_dict.get("lead_score") or 75))),
            "lead_band": clean_band,
            "score_factors": lead_dict.get("key_scoring_factors") or lead_dict.get("score_factors") or [],
            "chat_summary": lead_dict.get("ai_briefing") or lead_dict.get("chat_summary") or "",
            "key_objections_or_notes": lead_dict.get("notes") or "",
            "recommended_talking_points": lead_dict.get("talking_points") or lead_dict.get("recommended_talking_points") or [],
            "status": "new"
        }

        # Try inserting with session_id
        try:
            res = supabase.table("qualified_leads").insert(db_row).execute()
            logger.info(f"Successfully saved lead to Supabase: {res.data}")
            return res.data
        except Exception as insert_err:
            # If session_id foreign key constraint failed, insert with session_id=None
            logger.warning(f"FK constraint retry without session_id: {insert_err}")
            db_row["session_id"] = None
            db_row["interested_product_id"] = "prod-001"
            res = supabase.table("qualified_leads").insert(db_row).execute()
            logger.info(f"Successfully saved lead with sanitized FKs: {res.data}")
            return res.data
    except Exception as e:
        logger.error(f"Failed to save lead to Supabase qualified_leads: {e}")
        return None


def fetch_leads():
    """Fetches all leads from Supabase qualified_leads table."""
    if not supabase:
        return []
    try:
        res = supabase.table("qualified_leads").select("*").order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Failed to fetch leads from Supabase: {e}")
        return []