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
    min_tenure = int(product.get("min_tenure_months", 12))
    max_tenure = int(product.get("max_tenure_months", 360))
    requested_tenure = p.preferred_tenure_months if p.preferred_tenure_months and p.preferred_tenure_months > 0 else 240
    chosen_tenure = min(max(requested_tenure, min_tenure), max_tenure)
    
    loan_amount = float(p.requested_loan_amount or 0.0)
    monthly_income = float(p.monthly_income or 0.0)
    existing_emi = float(p.existing_emi_obligations or 0.0)
    rate = float(product.get("base_interest_rate", 8.5))
    
    emi = calculate_monthly_emi(loan_amount, rate, chosen_tenure)
    
    total_obligation = emi + existing_emi
    foir = (total_obligation / monthly_income) if monthly_income > 0 else 1.0
    
    raw_max_foir = float(product.get("max_foir_pct", 0.50))
    # Unify FOIR as a decimal ratio: if given as e.g. 50 or 55 (percentage), convert to 0.50 or 0.55
    max_allowed_foir = raw_max_foir / 100.0 if raw_max_foir > 1.0 else raw_max_foir
    
    min_income = float(product.get("min_monthly_income", 0))
    min_amount = float(product.get("min_amount", 0))
    max_amount = float(product.get("max_amount", 1e9))
    
    is_income_eligible = monthly_income >= min_income if monthly_income > 0 else False
    is_amount_eligible = (loan_amount >= min_amount) and (loan_amount <= max_amount) if loan_amount > 0 else False
    is_foir_eligible = foir <= max_allowed_foir
    
    credit_score_weights = {
        "excellent": 1.0, "good": 0.85, "fair": 0.65, "poor": 0.30, "unknown": 0.50,
        "excellent (780+)": 1.0, "good (700-779)": 0.85, "average (650-699)": 0.65, "new to credit / no score": 0.50
    }
    credit_key = (p.credit_score_band or "unknown").strip().lower()
    credit_weight = credit_score_weights.get(credit_key, 0.50)
    
    if monthly_income <= 0 or loan_amount <= 0:
        status = "not_eligible"
        base_match = 0.20
    elif is_income_eligible and is_amount_eligible and is_foir_eligible:
        status = "eligible"
        base_match = 0.88
    elif is_income_eligible and is_amount_eligible:
        status = "conditionally_eligible"
        base_match = 0.62
    else:
        status = "not_eligible"
        base_match = 0.30
        
    final_score = round(min(1.0, (base_match * 0.6) + (credit_weight * 0.4)), 2)
    
    return ProductRecommendation(
        product_id=str(product.get("product_id", "prod-001")),
        product_name=str(product.get("product_name", "Standard Loan")),
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