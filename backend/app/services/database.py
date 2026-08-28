# database.py
import os
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer

# ⚠️ REPLACE WITH YOUR ACTUAL SUPABASE CREDENTIALS:
SUPABASE_URL = "https://psclpghrsoxelzmebovj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY2xwZ2hyc294ZWx6bWVib3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg0Mjk5OSwiZXhwIjoyMTAzNDE4OTk5fQ.bX5_2_CwIqTPPNkNUUJhGtAxaS-5PWaSkEXiez1oeWg"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def fetch_loan_products(category: str = None):
    """Fetches active loan products for the scoring engine."""
    query = supabase.table("loan_products").select("*").eq("is_active", True)
    if category:
        query = query.eq("category", category)
    res = query.execute()
    return res.data

def get_grounded_policy_chunks(product_id: str, user_query: str, top_k: int = 3):
    """Retrieves top-k policy clauses with chunk_ids for citations."""
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
    
    return {
        "context_text": context_text,
        "grounded_on_chunk_ids": chunk_ids,
        "raw_chunks": chunks
    }

def save_customer_profile(extracted_json: dict):
    """Saves/updates extracted profile in Supabase."""
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