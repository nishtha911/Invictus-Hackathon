# test_full_pipeline.py
from database import fetch_loan_products, get_grounded_policy_chunks
from scoring_engine import evaluate_product_match
from guardrails import verify_explanation_hallucination
from schemas import ExtractedProfilePayload, ProfileData, ExtractionMeta

# 1. Simulate an extracted user profile from Paras (Pod 1 Chat)
test_payload = ExtractedProfilePayload(
    session_id="3b91918c-bacf-48d6-a06d-bc86d3ad401d",
    user_type="guest",
    profile=ProfileData(
        intent="home_loan",
        monthly_income=120000.0,
        employment_type="salaried",
        requested_loan_amount=4500000.0,
        preferred_tenure_months=180,
        existing_emi_obligations=12000.0,
        credit_score_band="excellent",
        urgency="immediate"
    ),
    extraction_meta=ExtractionMeta(
        completeness_pct=100,
        turns_taken=5
    )
)

print(f"🎯 1. Testing for: {test_payload.profile.intent} (Amount: ₹{test_payload.profile.requested_loan_amount:,.0f})")

# 2. Fetch catalogue products from Supabase
products = fetch_loan_products(category=test_payload.profile.intent)
print(f"📦 2. Found {len(products)} products in Supabase catalogue.")

# 3. Score every product & retrieve RAG policy citations
scored_recommendations = []
for prod in products:
    rec = evaluate_product_match(test_payload, prod)
    
    # 4. Vector similarity search for policy grounding
    policy_data = get_grounded_policy_chunks(
        product_id=rec.product_id,
        user_query="prepayment charges and eligibility rules",
        top_k=2
    )
    
    # 5. LLM Explanation + Guardrail
    sample_llm_text = (
        f"You are eligible for {rec.product_name} at {rec.computed_terms.interest_rate_pct}% interest rate. "
        f"Your monthly EMI is ₹{rec.computed_terms.estimated_emi:,.2f}."
    )
    
    rec.ai_explanation = verify_explanation_hallucination(
        llm_explanation_text=sample_llm_text,
        computed_terms=rec.computed_terms,
        grounded_chunk_ids=policy_data["grounded_on_chunk_ids"]
    )
    scored_recommendations.append(rec)

# 6. Sort and show Top Recommendation
top_rec = sorted(scored_recommendations, key=lambda x: x.match_score, reverse=True)[0]
print("\n🏆 Top Matched Product Result:")
print(top_rec.model_dump_json(indent=2))