# /backend/app/services/database.py
"""
Supabase database client for loan product catalogue and RAG policy retrieval.
Falls back to a static product list if Supabase is unavailable (local dev mode).
"""
import os
import logging

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

# ── Try loading embedder (optional) ─────────────────────────────────────
try:
    from sentence_transformers import SentenceTransformer
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
except Exception:
    embedder = None
    logger.warning("sentence-transformers not available — RAG citations disabled.")

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
    """Fetches active loan products dynamically from RAG knowledge base tables (rag.documents & rag.chunks)."""
    db_category = INTENT_TO_CATEGORY.get(category or "", category)

    try:
        from db import get_conn
        products = []
        with get_conn() as conn:
            with conn.cursor() as cur:
                if db_category:
                    cur.execute(
                        "SELECT id, name, loan_category FROM rag.documents WHERE loan_category ILIKE %s ORDER BY id;",
                        (f"%{db_category}%",)
                    )
                else:
                    cur.execute("SELECT id, name, loan_category FROM rag.documents ORDER BY id;")
                docs = cur.fetchall()

                for d in docs:
                    doc_id = d["id"]
                    doc_name = d["name"]
                    doc_cat = d["loan_category"]

                    cur.execute("SELECT content FROM rag.chunks WHERE doc_id = %s ORDER BY id;", (doc_id,))
                    chunks = cur.fetchall()
                    full_text = "\n".join(c["content"] for c in chunks)

                    # Extract scheme name & bank
                    scheme_match = re.search(r"Scheme Name:\s*([^\n]+)", full_text, re.IGNORECASE)
                    bank_match = re.search(r"Bank:\s*([^\n]+)", full_text, re.IGNORECASE)

                    scheme_name = scheme_match.group(1).strip() if scheme_match else doc_name.replace(".txt", "").replace("_", " ").title()
                    bank_name = bank_match.group(1).strip() if bank_match else "Cognis Bank"

                    # Extract interest rate
                    rate_match = re.search(r"Interest rate[:\s]+From?\s*([\d\.]+)%", full_text, re.IGNORECASE) or re.search(r"[Rr]ate[:\s]*([\d\.]+)%", full_text, re.IGNORECASE)
                    base_rate = float(rate_match.group(1)) if rate_match else 8.5

                    # Extract min/max loan amounts
                    min_amt_match = re.search(r"Loan amount[:\s]+[₹\$]?([\d,]+)\s*to", full_text, re.IGNORECASE)
                    max_amt_match = re.search(r"Loan amount[:\s]+[^₹\$]*[₹\$]?[\d,]+\s*to\s*[₹\$]?([\d,]+)", full_text, re.IGNORECASE)

                    min_amt = float(min_amt_match.group(1).replace(",", "")) if min_amt_match else 100000.0
                    max_amt = float(max_amt_match.group(1).replace(",", "")) if max_amt_match else 10000000.0

                    # Extract fee
                    fee_match = re.search(r"[Pp]rocessing fee[:\s]*([\d\.]+)%", full_text, re.IGNORECASE)
                    fee_pct = float(fee_match.group(1)) if fee_match else 0.5

                    products.append({
                        "product_id": f"rag-doc-{doc_id}",
                        "product_name": scheme_name,
                        "bank": bank_name,
                        "category": doc_cat,
                        "base_interest_rate": base_rate,
                        "min_amount": min_amt,
                        "max_amount": max_amt,
                        "min_monthly_income": 20000,
                        "max_foir_pct": 0.50,
                        "min_tenure_months": 12,
                        "max_tenure_months": 360,
                        "processing_fee_pct": fee_pct,
                        "is_active": True,
                        "doc_name": doc_name,
                    })

        if products:
            logger.info(f"Fetched {len(products)} RAG-grounded products from database for '{db_category}'")
            return products
    except Exception as e:
        logger.warning(f"RAG product fetch failed: {e} — falling back to static fallback")

    # Static fallback (matching knowledge base naming)
    products = [p for p in STATIC_LOAN_PRODUCTS if p["is_active"]]
    if db_category:
        filtered = [p for p in products if p["category"] == db_category]
        products = filtered if filtered else products
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

    return {"context_text": "", "grounded_on_chunk_ids": [], "raw_chunks": []}


def save_customer_profile(extracted_json: dict):
    """Saves extracted profile to Supabase public.customer_profiles. Silent no-op if unavailable."""
    if not supabase:
        return None
    try:
        profile = extracted_json.get("profile", {})
        meta = extracted_json.get("extraction_meta", {})
        db_row = {
            "session_id": extracted_json.get("session_id"),
            "user_type": extracted_json.get("user_type", "guest"),
            "applicant_name": profile.get("customer_name") or profile.get("name"),
            "intent": profile.get("intent"),
            "age": profile.get("age", 30),
            "monthly_income": profile.get("income") or profile.get("monthly_income"),
            "employment_type": profile.get("employment_type"),
            "employer_type": profile.get("employer_type"),
            "years_at_current_job": profile.get("years_at_current_job"),
            "years_in_business": profile.get("years_in_business"),
            "requested_loan_amount": profile.get("loan_amount") or profile.get("requested_loan_amount"),
            "preferred_tenure_months": (profile.get("tenure_years") or 20) * 12 if profile.get("tenure_years") else profile.get("preferred_tenure_months"),
            "existing_emi_obligations": profile.get("existing_emi") or profile.get("existing_emi_obligations", 0.0),
            "has_existing_loans": (profile.get("existing_emi") or 0) > 0,
            "credit_score_band": profile.get("credit_band") or profile.get("credit_score_band", "unknown"),
            "urgency": profile.get("urgency", "Immediate (Within 7 Days)"),
            "home_loan_details": {"property_status": profile.get("property_status")} if profile.get("property_status") else profile.get("home_loan_details"),
            "vehicle_loan_details": {"vehicle_condition": profile.get("vehicle_condition")} if profile.get("vehicle_condition") else profile.get("vehicle_loan_details"),
            "education_loan_details": {"education_country": profile.get("education_country")} if profile.get("education_country") else profile.get("education_loan_details"),
            "business_loan_details": {"annual_turnover": profile.get("annual_turnover"), "business_type": profile.get("business_type")} if profile.get("annual_turnover") or profile.get("business_type") else profile.get("business_loan_details"),
            "personal_loan_details": {"gold_weight_grams": profile.get("gold_weight_grams")} if profile.get("gold_weight_grams") else profile.get("personal_loan_details"),
            "completeness_pct": meta.get("completeness_pct", 100),
            "turns_taken": meta.get("turns_taken", 8),
        }
        # Clean null values if needed or let PostgreSQL handle defaults
        cleaned_row = {k: v for k, v in db_row.items() if v is not None}
        res = supabase.table("customer_profiles").upsert(cleaned_row).execute()
        return res.data
    except Exception as e:
        logger.error(f"Failed to save profile to Supabase: {e}")
        return None


def get_customer_profile(session_id: str):
    """Fetches saved profile from Supabase public.customer_profiles table."""
    if not supabase or not session_id:
        return None
    try:
        res = supabase.table("customer_profiles").select("*").eq("session_id", session_id).limit(1).execute()
        if res.data and len(res.data) > 0:
            row = res.data[0]
            tenure_months = row.get("preferred_tenure_months")
            tenure_years = (tenure_months // 12) if tenure_months else 20
            return {
                "session_id": row.get("session_id"),
                "user_type": row.get("user_type", "guest"),
                "profile": {
                    "applicant_name": row.get("applicant_name"),
                    "name": row.get("applicant_name"),
                    "intent": row.get("intent"),
                    "age": row.get("age"),
                    "monthly_income": row.get("monthly_income"),
                    "income": row.get("monthly_income"),
                    "employment_type": row.get("employment_type"),
                    "employer_type": row.get("employer_type"),
                    "years_at_current_job": row.get("years_at_current_job"),
                    "years_in_business": row.get("years_in_business"),
                    "requested_loan_amount": row.get("requested_loan_amount"),
                    "loan_amount": row.get("requested_loan_amount"),
                    "preferred_tenure_months": tenure_months,
                    "tenure_years": tenure_years,
                    "existing_emi_obligations": row.get("existing_emi_obligations", 0.0),
                    "existing_emi": row.get("existing_emi_obligations", 0.0),
                    "has_existing_loans": row.get("has_existing_loans", False),
                    "credit_score_band": row.get("credit_score_band", "unknown"),
                    "credit_band": row.get("credit_score_band", "unknown"),
                    "urgency": row.get("urgency", "exploring"),
                    "home_loan_details": row.get("home_loan_details"),
                    "vehicle_loan_details": row.get("vehicle_loan_details"),
                    "education_loan_details": row.get("education_loan_details"),
                    "business_loan_details": row.get("business_loan_details"),
                    "personal_loan_details": row.get("personal_loan_details"),
                },
                "extraction_meta": {
                    "completeness_pct": row.get("completeness_pct", 100),
                    "turns_taken": row.get("turns_taken", 8),
                }
            }
    except Exception as e:
        logger.warning(f"Could not fetch profile from Supabase: {e}")
    return None