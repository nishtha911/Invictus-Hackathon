# scoring_engine.py
from typing import Dict, Any
from app.schemas.scoring import ExtractedProfilePayload, ComputedTerms, ProductRecommendation, AIExplanation

def calculate_monthly_emi(principal: float, annual_rate_pct: float, tenure_months: int) -> float:
    if principal <= 0 or tenure_months <= 0:
        return 0.0
    if annual_rate_pct <= 0:
        return round(principal / tenure_months, 2)
    monthly_r = (annual_rate_pct / 100.0) / 12.0
    factor = (1 + monthly_r) ** tenure_months
    emi = principal * monthly_r * (factor / (factor - 1))
    return round(emi, 2)

def evaluate_product_match(profile_payload: ExtractedProfilePayload, product: Dict[str, Any]) -> ProductRecommendation:
    p = profile_payload.profile
    chosen_tenure = min(max(p.preferred_tenure_months, product["min_tenure_months"]), product["max_tenure_months"])
    loan_amount = p.requested_loan_amount
    rate = float(product["base_interest_rate"])
    emi = calculate_monthly_emi(loan_amount, rate, chosen_tenure)
    
    total_obligation = emi + p.existing_emi_obligations
    foir = total_obligation / p.monthly_income if p.monthly_income > 0 else 1.0
    max_allowed_foir = float(product.get("max_foir_pct", 0.50))
    
    is_income_eligible = p.monthly_income >= float(product["min_monthly_income"])
    is_amount_eligible = (loan_amount >= float(product["min_amount"])) and (loan_amount <= float(product["max_amount"]))
    is_foir_eligible = foir <= max_allowed_foir
    
    credit_score_weights = {"excellent": 1.0, "good": 0.85, "fair": 0.65, "poor": 0.30, "unknown": 0.50}
    credit_weight = credit_score_weights.get(p.credit_score_band, 0.50)
    
    if is_income_eligible and is_amount_eligible and is_foir_eligible:
        status = "eligible"
        base_match = 0.85
    elif is_income_eligible and is_amount_eligible:
        status = "conditionally_eligible"
        base_match = 0.60
    else:
        status = "not_eligible"
        base_match = 0.25
        
    final_score = round(min(1.0, (base_match * 0.6) + (credit_weight * 0.4)), 2)
    
    return ProductRecommendation(
        product_id=product["product_id"],
        product_name=product["product_name"],
        match_score=final_score,
        computed_terms=ComputedTerms(
            interest_rate_pct=rate,
            tenure_months=chosen_tenure,
            estimated_emi=emi,
            eligibility_status=status
        ),
        ai_explanation=AIExplanation(
            summary_text="",
            grounded_on_chunk_ids=[],
            numbers_verified=True
        )
    )