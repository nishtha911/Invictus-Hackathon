"""
seed_policy_embeddings.py
Pod 3: Database & RAG Pipeline
Ingests loan policy clauses, generates 384-dimensional embeddings, 
and stores them in Supabase pgvector table.
"""

import os
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer

# 1. SETUP SUPABASE CLIENT
# Replace with your actual Supabase URL and service_role / anon key
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://psclpghrsoxelzmebovj.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY2xwZ2hyc294ZWx6bWVib3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg0Mjk5OSwiZXhwIjoyMTAzNDE4OTk5fQ.bX5_2_CwIqTPPNkNUUJhGtAxaS-5PWaSkEXiez1oeWg")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 2. LOAD FREE LOCAL EMBEDDING MODEL (Fast & 384-dimensions)
print("📦 Loading embedding model (all-MiniLM-L6-v2)...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# 3. SAMPLE LOAN POLICY DOCUMENTS & CLAUSES
policy_clauses = [
    # Standard Home Loan Clauses (HL-STD-01)
    {
        "chunk_id": "policy_hl_std_v3_chunk_12",
        "product_id": "HL-STD-01",
        "document_title": "Standard Home Loan Policy Guidelines v3.2",
        "clause_category": "prepayment",
        "content": "Prepayment & Foreclosure Terms: Under RBI master circular guidelines, individual borrowers with floating rate home loans are subject to ZERO prepayment charges and ZERO foreclosure penalties for part or full pre-closure at any time during the loan tenure."
    },
    {
        "chunk_id": "policy_hl_std_v3_chunk_14",
        "product_id": "HL-STD-01",
        "document_title": "Standard Home Loan Policy Guidelines v3.2",
        "clause_category": "eligibility",
        "content": "Eligibility & Income Criteria: Salaried applicants must have a minimum net monthly income of ₹35,000 with at least 2 years of total work experience. Maximum allowable FOIR (Fixed Obligation to Income Ratio) is capped at 55% including existing EMIs."
    },
    {
        "chunk_id": "policy_hl_std_v3_chunk_18",
        "product_id": "HL-STD-01",
        "document_title": "Standard Home Loan Policy Guidelines v3.2",
        "clause_category": "tax_benefits",
        "content": "Tax Deductions: Home loan borrowers can claim tax deductions up to ₹1.5 Lakhs on principal repayment under Section 80C and up to ₹2 Lakhs on interest payment under Section 24(b) of the Income Tax Act for self-occupied properties."
    },

    # Vehicle Loan Clauses (VL-CAR-01)
    {
        "chunk_id": "policy_vl_car_v2_chunk_05",
        "product_id": "VL-CAR-01",
        "document_title": "New Auto Loan Policy & Terms",
        "clause_category": "financing_ratio",
        "content": "Financing & Down Payment: Up to 90% on-road financing is offered on new four-wheeler purchases. Down payment of minimum 10% is mandatory. Electric vehicles (EV) receive an interest rate concession of 0.25%."
    },
    {
        "chunk_id": "policy_vl_car_v2_chunk_09",
        "product_id": "VL-CAR-01",
        "document_title": "New Auto Loan Policy & Terms",
        "clause_category": "foreclosure",
        "content": "Foreclosure Charges: Foreclosure of car loans within 6 months of disbursal is not permitted. After 6 months, a 2% prepayment charge applies on the outstanding principal balance if closed before 24 months."
    },

    # Express Personal Loan Clauses (PL-INST-01)
    {
        "chunk_id": "policy_pl_inst_v1_chunk_03",
        "product_id": "PL-INST-01",
        "document_title": "Express Personal Loan Master Terms",
        "clause_category": "eligibility",
        "content": "Eligibility Criteria: Minimum credit score requirement is 720. Applicant must be salaried with minimum 6 months tenure in the current organization. No physical guarantor or collateral is required."
    },

    # SME Business Growth Loan Clauses (BL-SME-01)
    {
        "chunk_id": "policy_bl_sme_v1_chunk_07",
        "product_id": "BL-SME-01",
        "document_title": "SME Credit Policy Framework",
        "clause_category": "collateral",
        "content": "Collateral & Security: Business loans up to ₹50 Lakhs are unsecured under the CGTMSE credit guarantee scheme. For amounts above ₹50 Lakhs up to ₹75 Lakhs, hypothecation of business equipment or liquid collateral is required."
    }
]

# 4. EMBED AND UPSERT INTO SUPABASE
print(f"🚀 Embedding {len(policy_clauses)} policy clauses...")

for item in policy_clauses:
    embedding = embedder.encode(item["content"]).tolist()
    
    payload = {
        "chunk_id": item["chunk_id"],
        "product_id": item["product_id"],
        "document_title": item["document_title"],
        "clause_category": item["clause_category"],
        "content": item["content"],
        "metadata": {"category": item["clause_category"]},
        "embedding": embedding
    }
    
    response = supabase.table("loan_policy_chunks").upsert(payload).execute()
    print(f"✅ Upserted chunk: {item['chunk_id']} ({item['document_title']})")

print("\n🎉 All policy documents embedded and stored in Supabase pgvector successfully!")