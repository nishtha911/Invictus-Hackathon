# database.py
"""
Supabase database client for loan product catalogue and RAG policy retrieval.
Falls back to a static product list if Supabase is unavailable (local dev mode).
"""
import os
import logging

logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://psclpghrsoxelzmebovj.supabase.co")
SUPABASE_KEY = os.environ.get(
    "SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY2xwZ2hyc294ZWx6bWVib3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg0Mjk5OSwiZXhwIjoyMTAzNDE4OTk5fQ.bX5_2_CwIqTPPNkNUUJhGtAxaS-5PWaSkEXiez1oeWg"
)

# ── Try connecting to Supabase (optional) ────────────────────────────────
try:
    from supabase import create_client, Client
    supabase: Client | None = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized.")
except Exception as e:
    supabase = None
    logger.warning(f"Supabase unavailable ({e}) — using static fallback product catalogue.")

# ── Try loading embedder (optional) ─────────────────────────────────────
try:
    from sentence_transformers import SentenceTransformer
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
except Exception:
    embedder = None
    logger.warning("sentence-transformers not available — RAG citations disabled.")

# ── Static fallback loan product catalogue ───────────────────────────────
# Derived from database/seed_data.sql — used when Supabase is not seeded/available.
STATIC_LOAN_PRODUCTS = [
    {"id": "prod-001", "name": "SBI Home Advantage", "category": "home_loan", "base_interest_rate": 8.40, "min_loan_amount": 500000, "max_loan_amount": 75000000, "min_tenure_months": 12, "max_tenure_months": 360, "processing_fee_pct": 0.35, "is_active": True},
    {"id": "prod-002", "name": "HDFC Home Premium", "category": "home_loan", "base_interest_rate": 8.65, "min_loan_amount": 1000000, "max_loan_amount": 100000000, "min_tenure_months": 12, "max_tenure_months": 360, "processing_fee_pct": 0.50, "is_active": True},
    {"id": "prod-003", "name": "ICICI Home First", "category": "home_loan", "base_interest_rate": 8.75, "min_loan_amount": 300000, "max_loan_amount": 50000000, "min_tenure_months": 12, "max_tenure_months": 300, "processing_fee_pct": 0.50, "is_active": True},
    {"id": "prod-004", "name": "Axis Bank QuickPersonal", "category": "personal_loan", "base_interest_rate": 10.75, "min_loan_amount": 50000, "max_loan_amount": 4000000, "min_tenure_months": 12, "max_tenure_months": 60, "processing_fee_pct": 1.50, "is_active": True},
    {"id": "prod-005", "name": "HDFC FlexiPersonal", "category": "personal_loan", "base_interest_rate": 10.50, "min_loan_amount": 50000, "max_loan_amount": 4000000, "min_tenure_months": 6, "max_tenure_months": 60, "processing_fee_pct": 1.25, "is_active": True},
    {"id": "prod-006", "name": "Kotak Mahindra Salary Plus", "category": "personal_loan", "base_interest_rate": 10.25, "min_loan_amount": 100000, "max_loan_amount": 3500000, "min_tenure_months": 12, "max_tenure_months": 60, "processing_fee_pct": 1.00, "is_active": True},
    {"id": "prod-007", "name": "SBI Car Loan", "category": "vehicle_loan", "base_interest_rate": 8.85, "min_loan_amount": 100000, "max_loan_amount": 10000000, "min_tenure_months": 12, "max_tenure_months": 84, "processing_fee_pct": 0.25, "is_active": True},
    {"id": "prod-008", "name": "HDFC Auto Smart", "category": "vehicle_loan", "base_interest_rate": 8.95, "min_loan_amount": 100000, "max_loan_amount": 8000000, "min_tenure_months": 12, "max_tenure_months": 84, "processing_fee_pct": 0.50, "is_active": True},
    {"id": "prod-009", "name": "SBI Education Loan", "category": "education_loan", "base_interest_rate": 8.15, "min_loan_amount": 400000, "max_loan_amount": 15000000, "min_tenure_months": 12, "max_tenure_months": 180, "processing_fee_pct": 0.00, "is_active": True},
    {"id": "prod-010", "name": "Axis Business Booster", "category": "business_loan", "base_interest_rate": 11.50, "min_loan_amount": 200000, "max_loan_amount": 5000000, "min_tenure_months": 12, "max_tenure_months": 60, "processing_fee_pct": 1.75, "is_active": True},
]

# Map frontend intent strings to DB categories
INTENT_TO_CATEGORY = {
    "home_loan": "home_loan",
    "personal_loan": "personal_loan",
    "vehicle_loan": "vehicle_loan",
    "education_loan": "education_loan",
    "business_loan": "business_loan",
    # Frontend variations
    "Home Loan": "home_loan",
    "Personal Loan": "personal_loan",
    "Vehicle Loan": "vehicle_loan",
    "Education Loan": "education_loan",
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
        products = [p for p in products if p["category"] == db_category]
    if not products:
        # If category not found in static list, return all products
        products = [p for p in STATIC_LOAN_PRODUCTS if p["is_active"]]
    logger.info(f"Using {len(products)} static fallback products for '{db_category}'")
    return products


def get_grounded_policy_chunks(product_id: str, user_query: str, top_k: int = 3):
    """Retrieves top-k policy chunks. Returns empty citations if RAG is unavailable."""
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

    # Fallback — no policy citations
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
            "turns_taken": meta.get("turns_taken", 0)
        }
        res = supabase.table("customer_profiles").upsert(db_row).execute()
        return res.data
    except Exception as e:
        logger.error(f"Failed to save profile to Supabase: {e}")
        return None