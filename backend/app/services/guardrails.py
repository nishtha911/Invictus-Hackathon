# guardrails.py
import re
from app.schemas.scoring import ComputedTerms, AIExplanation

def verify_explanation_hallucination(
    llm_explanation_text: str, 
    computed_terms: ComputedTerms, 
    grounded_chunk_ids: list
) -> AIExplanation:
    found_percentages = [float(x) for x in re.findall(r'(\d+\.?\d*)\s*%', llm_explanation_text)]
    rate_verified = True
    for p in found_percentages:
        if abs(p - computed_terms.interest_rate_pct) > 0.1:
            rate_verified = False
            break
            
    has_citations = len(grounded_chunk_ids) > 0
    
    if not rate_verified or not has_citations:
        safe_fallback_text = (
            f"Based on your profile, you qualify for an interest rate of {computed_terms.interest_rate_pct}% "
            f"over a {computed_terms.tenure_months}-month tenure, resulting in an estimated monthly EMI of "
            f"₹{computed_terms.estimated_emi:,.2f}. Terms are subject to policy verification."
        )
        return AIExplanation(
            summary_text=safe_fallback_text,
            grounded_on_chunk_ids=grounded_chunk_ids,
            numbers_verified=False
        )
        
    return AIExplanation(
        summary_text=llm_explanation_text,
        grounded_on_chunk_ids=grounded_chunk_ids,
        numbers_verified=True
    )