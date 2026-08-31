# /backend/app/services/lead_scorer.py
"""
Deterministic lead scoring engine.
Takes an extracted profile and computes a 0-100 lead quality score.
No LLM calls — pure rule-based math for speed and reliability.
"""
from __future__ import annotations
import uuid
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


def score_lead(
    session_id: str,
    completeness_pct: int,
    monthly_income: Optional[float],
    existing_emi_obligations: Optional[float],
    requested_loan_amount: Optional[float],
    preferred_tenure_months: Optional[int],
    credit_score_band: Optional[str],
    urgency: Optional[str],
    intent: Optional[str],
) -> dict:
    """
    Compute a deterministic lead score and return the full scoring payload.

    Returns:
        {
            lead_id, score, score_band,
            ai_briefing, talking_points, key_factors,
            qualification_probability, estimated_closing_days
        }
    """
    score = 0
    factors = []

    # ── 1. FOIR Score (30 pts max) ──────────────────────────────────────
    income = monthly_income or 0
    emi_obligations = existing_emi_obligations or 0

    if income > 0 and requested_loan_amount and preferred_tenure_months:
        # Rough estimated EMI at 10% for 60 months
        monthly_r = 0.10 / 12
        factor = (1 + monthly_r) ** preferred_tenure_months
        estimated_emi = requested_loan_amount * monthly_r * factor / (factor - 1)
        total_obligation = estimated_emi + emi_obligations
        foir = total_obligation / income

        if foir <= 0.30:
            score += 30
            factors.append("FOIR ≤ 30% — Excellent debt-service coverage")
        elif foir <= 0.45:
            score += 20
            factors.append("FOIR 30–45% — Acceptable debt-service coverage")
        elif foir <= 0.55:
            score += 10
            factors.append("FOIR 45–55% — Borderline debt-service coverage")
        else:
            score += 0
            factors.append("FOIR > 55% — High existing debt obligations")
    else:
        score += 10
        factors.append("Income/loan data incomplete — partial FOIR assessment")

    # ── 2. Credit Score Band (25 pts max) ──────────────────────────────
    credit_pts = {"excellent": 25, "good": 18, "fair": 10, "poor": 3, "unknown": 8}
    credit_label = {"excellent": "CIBIL Excellent (750+)", "good": "CIBIL Good (700–749)",
                    "fair": "CIBIL Fair (650–699)", "poor": "CIBIL Poor (<650)", "unknown": "Credit score not provided"}
    band = (credit_score_band or "unknown").lower()
    score += credit_pts.get(band, 8)
    factors.append(credit_label.get(band, "Credit score not provided"))

    # ── 3. Urgency Signal (20 pts max) ──────────────────────────────────
    urgency_pts = {"immediate": 20, "within_3_months": 12, "exploring": 5}
    urgency_label = {
        "immediate": "Immediate urgency — ready to proceed within 7 days",
        "within_3_months": "Moderate urgency — decision within 3 months",
        "exploring": "Low urgency — still evaluating options",
    }
    u = (urgency or "exploring").lower()
    score += urgency_pts.get(u, 5)
    factors.append(urgency_label.get(u, "Urgency not specified"))

    # ── 4. Completeness (15 pts max) ────────────────────────────────────
    completeness_contribution = int((completeness_pct / 100) * 15)
    score += completeness_contribution
    factors.append(f"Profile {completeness_pct}% complete — {completeness_contribution}/15 pts")

    # ── 5. Income Tier Bonus (10 pts max) ───────────────────────────────
    if income >= 150000:
        score += 10
        factors.append("High income tier (₹1.5L+/month) — premium segment")
    elif income >= 75000:
        score += 6
        factors.append("Mid income tier (₹75K+/month)")
    elif income >= 30000:
        score += 3
        factors.append("Standard income tier (₹30K+/month)")
    else:
        score += 0

    score = min(100, max(0, score))

    # ── Band Classification ──────────────────────────────────────────────
    if score >= 70:
        band_label = "HOT LEAD"
        qualification_probability = 0.82
        estimated_closing_days = 7
    elif score >= 50:
        band_label = "WARM LEAD"
        qualification_probability = 0.55
        estimated_closing_days = 21
    else:
        band_label = "NURTURE"
        qualification_probability = 0.25
        estimated_closing_days = 45

    # ── AI Briefing Text ─────────────────────────────────────────────────
    intent_display = {
        "home_loan": "Home Loan", "personal_loan": "Personal Loan",
        "vehicle_loan": "Vehicle Loan", "education_loan": "Education Loan",
        "business_loan": "Business Loan",
    }.get(intent or "", intent or "Loan")

    income_display = f"₹{income:,.0f}/month" if income else "not disclosed"
    urgency_display = {"immediate": "immediate", "within_3_months": "within 3 months", "exploring": "exploring"}.get(u, u)

    briefing = (
        f"This {band_label.lower()} applicant is requesting a {intent_display} "
        f"of ₹{(requested_loan_amount or 0):,.0f} with income of {income_display}. "
        f"Urgency is {urgency_display}. "
        f"Credit profile is {(credit_score_band or 'unknown')}. "
        f"Lead score: {score}/100. "
        f"{'Prioritise callback within 24 hours.' if band_label == 'HOT LEAD' else 'Schedule a follow-up within the week.' if band_label == 'WARM LEAD' else 'Add to nurture sequence.'}"
    )

    # ── Talking Points ───────────────────────────────────────────────────
    talking_points = []
    if intent == "home_loan":
        talking_points.append("Discuss property type and location to tailor product")
        talking_points.append("Mention first-time homebuyer tax benefits (Section 24B)")
    elif intent == "personal_loan":
        talking_points.append("Highlight quick disbursal — funds in 24–48 hours")
        talking_points.append("Offer pre-approved amount based on salary slip")
    elif intent == "vehicle_loan":
        talking_points.append("Check if new or used vehicle — rate differs by 1-2%")
        talking_points.append("Mention zero down-payment options for salaried employees")
    elif intent == "education_loan":
        talking_points.append("Clarify moratorium period — repayment starts after course end")
        talking_points.append("Highlight 80E tax benefit on education loan interest")
    elif intent == "business_loan":
        talking_points.append("Ask for 2-year ITR to assess business income stability")
        talking_points.append("Discuss collateral options for better interest rate")

    if band == "excellent":
        talking_points.append("Offer premium rate — eligible for best interest rate tier")
    if u == "immediate":
        talking_points.append("Customer is ready to decide — close the loop today")

    return {
        "lead_id": f"LEAD-{uuid.uuid4().hex[:8].upper()}",
        "session_id": session_id,
        "score": score,
        "score_band": band_label,
        "ai_briefing": briefing,
        "key_scoring_factors": factors,
        "talking_points": talking_points,
        "qualification_probability": qualification_probability,
        "estimated_closing_days": estimated_closing_days,
        "scored_at": datetime.utcnow().isoformat(),
    }
