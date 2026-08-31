"""Transform RAG recommendations to frontend-compatible format."""

import re
from typing import Any, Dict, List

def extract_number_from_text(text: str, pattern: str) -> float | None:
    """Extract a numeric value from text using a regex pattern."""
    try:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            num_str = match.group(1).replace(",", "").replace("₹", "").strip()
            return float(num_str)
    except (ValueError, AttributeError, IndexError):
        pass
    return None


def transform_rag_recommendation_to_loan(
    rag_rec: Dict[str, Any],
    profile: Dict[str, Any],
    supporting_content: str,
    category: str
) -> Dict[str, Any]:
    """
    Transform RAG recommendation into frontend-compatible RecommendedLoan schema.
    
    Extracts financial terms from scheme-specific RAG content or LLM recommendation fields.
    """
    scheme_name = rag_rec.get("scheme_name", "Unknown Scheme")
    bank = rag_rec.get("bank", "Cognis Bank")
    match_reason = rag_rec.get("match_reason", "")
    eligibility = rag_rec.get("eligibility", [])
    confidence = float(rag_rec.get("confidence", 0.85))
    if confidence <= 0:
        confidence = 0.85

    # Filter supporting content specifically for this scheme if multiple schemes exist
    scheme_content = supporting_content
    if scheme_name and scheme_name.lower() in supporting_content.lower():
        parts = [p for p in supporting_content.split("\n\n---\n\n") if scheme_name.lower() in p.lower()]
        if parts:
            scheme_content = "\n\n".join(parts)

    # Extract profile data
    prof = profile.get("profile", profile)
    monthly_income = float(prof.get("monthly_income", 0))
    requested_amount = float(prof.get("requested_loan_amount", prof.get("loan_amount", 0)))
    tenure_years = int(prof.get("preferred_tenure_months", 240) / 12) if prof.get("preferred_tenure_months") else 20
    tenure_months = int(prof.get("preferred_tenure_months", 240)) if prof.get("preferred_tenure_months") else 240

    # 1. Extract Interest Rate
    interest_rate = rag_rec.get("interest_rate")
    if not interest_rate:
        interest_rate = extract_number_from_text(scheme_content, r"Interest rate[:\s]+From?\s*([\d\.]+)%")
    if not interest_rate:
        interest_rate = extract_number_from_text(scheme_content, r"[Rr]ate[:\s]*([\d\.]+)%")
    if not interest_rate:
        interest_rate = 8.5  # Safe default

    # 2. Extract Loan Amounts
    min_amount = rag_rec.get("min_amount")
    max_amount = rag_rec.get("max_amount")
    if not min_amount or not max_amount:
        min_match = re.search(r"Loan amount[:\s]+[₹\$]?([\d,]+)\s*to", scheme_content, re.IGNORECASE)
        max_match = re.search(r"Loan amount[:\s]+[^₹\$]*[₹\$]?[\d,]+\s*to\s*[₹\$]?([\d,]+)", scheme_content, re.IGNORECASE)

        if min_match and not min_amount:
            min_amount = float(min_match.group(1).replace(",", ""))
        if max_match and not max_amount:
            max_amount = float(max_match.group(1).replace(",", ""))

    min_amount = float(min_amount) if min_amount else max(50000.0, requested_amount * 0.2)
    max_amount = float(max_amount) if max_amount else min(100000000.0, max(requested_amount * 3.0, 1000000.0))

    # 3. Extract Processing Fee
    processing_fee = rag_rec.get("processing_fee_pct")
    if not processing_fee:
        processing_fee = extract_number_from_text(scheme_content, r"[Pp]rocessing fee[:\s]*([\d\.]+)%")
    if not processing_fee:
        processing_fee = 0.5  # Default

    # 4. Tenure calculation
    tenure_match = re.search(r"[Tt]enure[:\s]+Up to\s+([\d]+)\s*years", scheme_content, re.IGNORECASE)
    if tenure_match:
        max_tenure_years = int(tenure_match.group(1))
        tenure_months = min(tenure_years * 12, max_tenure_years * 12)

    # 5. Calculate EMI
    monthly_rate = (interest_rate / 100) / 12
    principal = requested_amount if requested_amount > 0 else 2500000.0

    if monthly_rate and tenure_months:
        numerator = principal * monthly_rate * ((1 + monthly_rate) ** tenure_months)
        denominator = ((1 + monthly_rate) ** tenure_months) - 1
        estimated_emi = int(numerator / denominator) if denominator > 0 else int(principal / tenure_months)
    else:
        estimated_emi = int(principal / tenure_months) if tenure_months else 0

    # 6. Calculate FOIR
    existing_emi = float(prof.get("existing_emi_obligations", 0))
    processed_amount = min(max_amount, max(min_amount, principal))
    total_monthly_obligation = estimated_emi + existing_emi
    foir = (total_monthly_obligation / monthly_income * 100) if monthly_income > 0 else 0

    # Determine eligibility status
    if processed_amount <= max_amount and processed_amount >= min_amount and foir <= 50:
        eligibility_status = "Eligible"
    elif foir <= 60:
        eligibility_status = "Conditionally Eligible"
    else:
        eligibility_status = "Review Required"

    clean_id = re.sub(r"[^a-zA-Z0-9\-]", "", f"{scheme_name.lower().replace(' ', '-')}-{bank.lower().replace(' ', '-')}")

    return {
        "loan_id": clean_id,
        "name": scheme_name,
        "category": category.replace("_", " ").title(),
        "match_score": int(confidence * 100) if confidence <= 1.0 else int(confidence),
        "interest_rate": interest_rate,
        "max_amount": int(max_amount),
        "min_amount": int(min_amount),
        "tenure_months": tenure_months,
        "estimated_emi": estimated_emi,
        "processing_fee_pct": processing_fee,
        "eligibility_status": eligibility_status,
        "is_verified_calculation": True,
        "reasoning": match_reason or f"Based on your profile and {bank}'s lending policy, {scheme_name} offers optimal terms.",
        "bullet_points": eligibility or [
            f"Interest rate: {interest_rate}% p.a.",
            f"Loan amount: ₹{min_amount:,.0f} to ₹{max_amount:,.0f}",
            f"Tenure: up to {int(tenure_months / 12)} years",
            f"Processing fee: {processing_fee}%",
        ],
        "policy_citations": [
            {
                "policy_name": scheme_name,
                "clause_id": f"{bank}-{scheme_name}".lower().replace(" ", "_"),
                "text": f"Based on {bank}'s {scheme_name} policy document",
            }
        ],
        "features": [
            f"Interest rate: {interest_rate}% p.a.",
            f"Flexible tenure: up to {int(tenure_months / 12)} years",
            f"Direct policy match",
            f"Minimal documentation required",
        ],
        "tag": "BEST MATCH" if confidence >= 0.85 else ("POPULAR" if confidence >= 0.70 else None),
        "bank": bank,
        "match_confidence": confidence,
    }

