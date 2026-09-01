# /backend/app/services/personalized_offer.py
"""
Personalised loan-offer synthesiser.

Pipeline:  documents (RAG scheme)  ->  matched loan  ->  BANK-DEFINED customisation
bounds  ->  adjust to the customer's needs & preferences  ->  one tailored offer.

Every adjustment is clamped to a bank-governed limit (PERSONALIZATION_BOUNDS).
Nothing here invents a rate or a rule outside those limits, and every number is
recomputed with the standard EMI formula — the LLM is only used to phrase the
rationale (and it degrades to a deterministic template if unavailable).
"""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
#  BANK-DEFINED CUSTOMISATION BOUNDS
#  "Set a limit to what changes can be done in the loan section."
#  These are the only degrees of freedom the advisory engine may move within.
# ─────────────────────────────────────────────────────────────────────────────
PERSONALIZATION_BOUNDS: Dict[str, Dict[str, Any]] = {
    "home_loan": {
        "rate_concession_max_pct": 0.35,   # max reduction from the scheme's base rate
        "rate_loading_max_pct": 0.75,      # max increase (risk loading)
        "processing_fee_floor_pct": 0.0,   # fee may be waived down to this
        "fixed_rate_premium_pct": 0.25,    # cost of choosing a fixed-rate variant
        "max_tenure_months": 360,
        "loan_matures_by_age": 70,
        "moratorium_months_max": 0,
        "foir_ceiling_pct": 55.0,
        "prepayment_waiver_on_floating": True,
    },
    "personal_loan": {
        "rate_concession_max_pct": 0.25, "rate_loading_max_pct": 1.50,
        "processing_fee_floor_pct": 0.25, "fixed_rate_premium_pct": 0.0,
        "max_tenure_months": 60, "loan_matures_by_age": 65,
        "moratorium_months_max": 0, "foir_ceiling_pct": 50.0,
        "prepayment_waiver_on_floating": False,
    },
    "vehicle_loan": {
        "rate_concession_max_pct": 0.30, "rate_loading_max_pct": 1.00,
        "processing_fee_floor_pct": 0.0, "fixed_rate_premium_pct": 0.20,
        "max_tenure_months": 84, "loan_matures_by_age": 65,
        "moratorium_months_max": 0, "foir_ceiling_pct": 55.0,
        "prepayment_waiver_on_floating": True,
    },
    "education_loan": {
        "rate_concession_max_pct": 0.50, "rate_loading_max_pct": 0.50,
        "processing_fee_floor_pct": 0.0, "fixed_rate_premium_pct": 0.25,
        "max_tenure_months": 180, "loan_matures_by_age": 70,
        "moratorium_months_max": 12, "foir_ceiling_pct": 60.0,
        "prepayment_waiver_on_floating": True,
    },
    "business_loan": {
        "rate_concession_max_pct": 0.40, "rate_loading_max_pct": 2.00,
        "processing_fee_floor_pct": 0.50, "fixed_rate_premium_pct": 0.0,
        "max_tenure_months": 120, "loan_matures_by_age": 70,
        "moratorium_months_max": 6, "foir_ceiling_pct": 55.0,
        "prepayment_waiver_on_floating": False,
    },
    "gold_loan": {
        "rate_concession_max_pct": 0.25, "rate_loading_max_pct": 0.50,
        "processing_fee_floor_pct": 0.0, "fixed_rate_premium_pct": 0.0,
        "max_tenure_months": 24, "loan_matures_by_age": 75,
        "moratorium_months_max": 0, "foir_ceiling_pct": 60.0,
        "prepayment_waiver_on_floating": True,
    },
}

_DEFAULT_BOUNDS = PERSONALIZATION_BOUNDS["home_loan"]

# ─────────────────────────────────────────────────────────────────────────────
#  RBI-ALIGNED HARD LIMITS  (apply on top of the per-scheme bounds above)
# ─────────────────────────────────────────────────────────────────────────────
MAX_LOAN_AMOUNT = 100_000_000          # ₹10 crore absolute ceiling on any request

# Home-loan Loan-to-Value ceilings by property value (RBI guidance):
#   ≤ ₹30 lakh            → 90%
#   ₹30 lakh – ₹75 lakh   → 80%
#   > ₹75 lakh            → 75%
HOME_LOAN_LTV_TIERS = (
    (3_000_000, 0.90),
    (7_500_000, 0.80),
    (float("inf"), 0.75),
)

FOIR_CEILING_MIN, FOIR_CEILING_MAX = 50.0, 60.0   # eligibility FOIR band


def _home_loan_ltv_cap(property_value: float) -> float:
    for threshold, ltv in HOME_LOAN_LTV_TIERS:
        if property_value <= threshold:
            return ltv
    return HOME_LOAN_LTV_TIERS[-1][1]


def _emi(principal: float, annual_rate_pct: float, months: int) -> float:
    if principal <= 0 or months <= 0:
        return 0.0
    r = (annual_rate_pct / 100.0) / 12.0
    if r == 0:
        return round(principal / months, 2)
    factor = (1 + r) ** months
    return round(principal * r * factor / (factor - 1), 2)


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def build_personalized_offer(
    profile: Dict[str, Any],
    base_loan: Dict[str, Any],
    *,
    explain: bool = True,
) -> Optional[Dict[str, Any]]:
    """
    Synthesise ONE tailored offer from a matched scheme + the customer profile,
    staying strictly inside PERSONALIZATION_BOUNDS for the loan category.

    `profile` accepts the flat advisory profile (intent, monthly_income,
    requested_loan_amount, preferred_tenure_months, existing_emi_obligations,
    credit_score_band, employment_type, urgency, user_type, age, preferred_emi,
    interest_type). `base_loan` is one item from `recommended_loans`.
    """
    try:
        p = profile.get("profile", profile) if isinstance(profile, dict) else {}
        p = p if isinstance(p, dict) else {}

        category = (base_loan.get("category") or p.get("intent") or "home_loan")
        cat_key = str(category).lower().replace(" ", "_")
        bounds = PERSONALIZATION_BOUNDS.get(cat_key, _DEFAULT_BOUNDS)

        income = float(p.get("monthly_income") or p.get("income") or 0) or 0.0
        existing_emi = float(p.get("existing_emi_obligations") or p.get("existing_emi") or 0) or 0.0
        principal = float(
            p.get("requested_loan_amount")
            or p.get("loan_amount")
            or base_loan.get("min_amount")
            or 0
        ) or 0.0

        property_value = float(p.get("property_value") or 0) or 0.0
        co_applicant_income = float(p.get("co_applicant_income") or 0) or 0.0
        guarantor_income = float(p.get("guarantor_income") or 0) or 0.0

        # ── RBI limits: ₹10 Cr hard cap + home-loan LTV tiering ─────────────
        requested_principal = principal
        principal = min(principal, float(MAX_LOAN_AMOUNT))
        ltv_cap_amount = None
        ltv_pct = None
        if cat_key == "home_loan" and property_value > 0:
            ltv_pct = _home_loan_ltv_cap(property_value)
            ltv_cap_amount = round(property_value * ltv_pct)
            principal = min(principal, float(ltv_cap_amount))

        age = p.get("age")
        try:
            age = int(age) if age is not None else None
        except (TypeError, ValueError):
            age = None

        credit = str(p.get("credit_score_band") or p.get("credit_band") or "unknown").lower()
        user_type = str(profile.get("user_type") or p.get("user_type") or "guest").lower()
        is_existing = user_type in ("existing", "existing_customer")
        urgency = str(p.get("urgency") or "").lower()
        emp = str(p.get("employment_type") or "").lower()
        emi_pref = str(p.get("preferred_emi") or "balanced").lower()
        rate_pref = str(p.get("interest_type") or "not_sure").lower()
        has_co_applicant = bool(p.get("has_co_applicant")) or co_applicant_income > 0

        base_rate = float(base_loan.get("interest_rate") or 8.5)
        base_tenure = int(base_loan.get("tenure_months") or p.get("preferred_tenure_months") or 240)
        base_fee = float(base_loan.get("processing_fee_pct") or 0.5)
        base_emi = _emi(principal, base_rate, base_tenure)

        adjustments = []

        # ── 0. RBI ceilings: absolute cap + home-loan LTV ───────────────────
        if requested_principal > MAX_LOAN_AMOUNT:
            adjustments.append({
                "parameter": "Loan amount",
                "base": f"₹{requested_principal:,.0f} requested",
                "personalized": f"₹{MAX_LOAN_AMOUNT:,.0f} (capped)",
                "reason": "single-borrower requests are capped at ₹10 crore",
                "policy_limit": "₹10,00,00,000 absolute ceiling",
            })
        if ltv_cap_amount is not None and ltv_cap_amount < min(requested_principal, MAX_LOAN_AMOUNT):
            adjustments.append({
                "parameter": "Loan amount (LTV)",
                "base": f"₹{min(requested_principal, MAX_LOAN_AMOUNT):,.0f} requested",
                "personalized": f"₹{ltv_cap_amount:,.0f} at {ltv_pct*100:.0f}% LTV",
                "reason": (
                    f"property valued at ₹{property_value:,.0f} — RBI LTV ceiling of "
                    f"{ltv_pct*100:.0f}% applies for this value band"
                ),
                "policy_limit": "90% ≤ ₹30L · 80% ₹30L–₹75L · 75% > ₹75L",
            })

        # ── 1. Interest rate — concession / loading, clamped to policy ───────
        rate_delta = 0.0
        rate_notes = []
        credit_map = {"excellent": -0.20, "good": -0.05, "fair": 0.15, "poor": 0.50, "unknown": 0.10}
        cd = credit_map.get(credit, 0.10)
        rate_delta += cd
        rate_notes.append(
            f"{'concession' if cd < 0 else 'risk loading'} {cd:+.2f}% for {credit or 'unrated'} credit band"
        )
        if is_existing:
            rate_delta -= 0.10
            rate_notes.append("relationship concession -0.10% (existing customer)")
        if "immed" in urgency and "salar" in emp:
            rate_delta -= 0.05
            rate_notes.append("digital fast-track concession -0.05%")
        if rate_pref == "fixed" and bounds["fixed_rate_premium_pct"] > 0:
            rate_delta += bounds["fixed_rate_premium_pct"]
            rate_notes.append(f"fixed-rate variant +{bounds['fixed_rate_premium_pct']:.2f}%")

        rate_delta = _clamp(
            rate_delta, -bounds["rate_concession_max_pct"], bounds["rate_loading_max_pct"]
        )
        personalized_rate = round(base_rate + rate_delta, 2)
        if abs(rate_delta) >= 0.01:
            adjustments.append({
                "parameter": "Interest rate",
                "base": f"{base_rate:.2f}% p.a.",
                "personalized": f"{personalized_rate:.2f}% p.a.",
                "reason": "; ".join(rate_notes),
                "policy_limit": (
                    f"adjustable between -{bounds['rate_concession_max_pct']:.2f}% and "
                    f"+{bounds['rate_loading_max_pct']:.2f}% of the scheme base rate"
                ),
            })

        # ── 2. Tenure — honour preference, clamp to scheme + age-maturity ────
        want_tenure = int(p.get("preferred_tenure_months") or base_tenure)
        hard_max = bounds["max_tenure_months"]
        if age is not None:
            hard_max = min(hard_max, max(12, (bounds["loan_matures_by_age"] - age) * 12))
        if emi_pref == "lowest":
            want_tenure = hard_max
        elif emi_pref == "fast_repayment":
            want_tenure = min(want_tenure, int(hard_max * 0.65))
        personalized_tenure = int(_clamp(want_tenure, 12, hard_max))
        if personalized_tenure != base_tenure:
            reason = {
                "lowest": "stretched to the maximum permitted tenure to minimise your monthly EMI",
                "fast_repayment": "shortened so you pay the least total interest",
            }.get(emi_pref, "aligned to your stated tenure preference")
            if age is not None and personalized_tenure == (bounds["loan_matures_by_age"] - age) * 12:
                reason += f"; capped so the loan closes by age {bounds['loan_matures_by_age']}"
            adjustments.append({
                "parameter": "Tenure",
                "base": f"{base_tenure} months ({base_tenure/12:.0f} yrs)",
                "personalized": f"{personalized_tenure} months ({personalized_tenure/12:.0f} yrs)",
                "reason": reason,
                "policy_limit": f"1 to {hard_max} months for this scheme",
            })

        # ── 3. Processing fee — waiver eligibility ───────────────────────────
        fee_waiver_eligible = credit == "excellent" or is_existing or ("immed" in urgency)
        personalized_fee = (
            bounds["processing_fee_floor_pct"] if fee_waiver_eligible else base_fee
        )
        if personalized_fee != base_fee:
            why = []
            if credit == "excellent":
                why.append("excellent credit band")
            if is_existing:
                why.append("existing banking relationship")
            if "immed" in urgency:
                why.append("immediate-disbursal segment")
            adjustments.append({
                "parameter": "Processing fee",
                "base": f"{base_fee:.2f}%",
                "personalized": f"{personalized_fee:.2f}% (waived)" if personalized_fee == 0 else f"{personalized_fee:.2f}%",
                "reason": "waiver applied: " + ", ".join(why),
                "policy_limit": f"waivable down to {bounds['processing_fee_floor_pct']:.2f}% for eligible segments",
            })

        # ── 4. Repayment structure add-ons ──────────────────────────────────
        structure_notes = []
        if cat_key == "education_loan" and bounds["moratorium_months_max"] > 0:
            structure_notes.append(
                f"course-period moratorium up to {bounds['moratorium_months_max']} months after study"
            )
        if emi_pref == "flexible" and bounds["prepayment_waiver_on_floating"] and rate_pref != "fixed":
            structure_notes.append("zero part-prepayment / foreclosure charges on the floating-rate option")
        if structure_notes:
            adjustments.append({
                "parameter": "Repayment structure",
                "base": "Standard EMI",
                "personalized": "; ".join(structure_notes),
                "reason": "matched to your stated repayment preference",
                "policy_limit": "structuring options permitted for this scheme",
            })

        # ── Recompute the tailored EMI & affordability ───────────────────────
        personalized_emi = _emi(principal, personalized_rate, personalized_tenure)

        # Assessed income = applicant + full co-applicant salary + half of any
        # guarantor salary (a guarantor is supporting security, not primary income).
        assessed_income = income + co_applicant_income + guarantor_income * 0.5
        foir = (
            round(((personalized_emi + existing_emi) / assessed_income) * 100, 1)
            if assessed_income > 0 else None
        )

        # FOIR eligibility band held to RBI's 50–60% window. A co-applicant with
        # no stated income still earns a small headroom bump; a stated income is
        # already in the denominator so the ceiling stays at the scheme value.
        ceiling = bounds["foir_ceiling_pct"]
        if has_co_applicant and co_applicant_income <= 0:
            ceiling += 8.0
        ceiling = _clamp(ceiling, FOIR_CEILING_MIN, FOIR_CEILING_MAX)

        if co_applicant_income > 0 or guarantor_income > 0:
            parts = []
            if co_applicant_income > 0:
                parts.append(f"co-applicant ₹{co_applicant_income:,.0f}/mo")
            if guarantor_income > 0:
                parts.append(f"guarantor ₹{guarantor_income:,.0f}/mo (50% weighted)")
            adjustments.append({
                "parameter": "Assessed income",
                "base": f"Applicant ₹{income:,.0f}/mo",
                "personalized": f"₹{assessed_income:,.0f}/mo combined",
                "reason": "added: " + ", ".join(parts) + " — widens your affordability headroom",
                "policy_limit": f"FOIR held within {FOIR_CEILING_MIN:.0f}–{FOIR_CEILING_MAX:.0f}% (RBI band)",
            })
        elif has_co_applicant:
            adjustments.append({
                "parameter": "Assessed income",
                "base": "Applicant income only",
                "personalized": "Applicant + co-applicant income",
                "reason": "co-applicant declared — combined income widens your affordability headroom",
                "policy_limit": f"FOIR ceiling relaxed to {ceiling:.0f}% with an assessed co-applicant",
            })

        if foir is None:
            eligibility = "Review Required"
        elif foir <= ceiling - 5:
            eligibility = "Eligible"
        elif foir <= ceiling:
            eligibility = "Conditionally Eligible"
        else:
            eligibility = "Review Required"

        monthly_diff = round(base_emi - personalized_emi, 2)         # +ve => lower EMI
        lifetime_diff = round(base_emi * base_tenure - personalized_emi * personalized_tenure, 2)

        offer = {
            "is_personalized": True,
            "within_policy": True,
            "base_scheme": base_loan.get("name") or base_loan.get("scheme_name") or "Loan Scheme",
            "scheme_name": f"{base_loan.get('name') or 'Loan Scheme'} (Tailored to You)",
            "bank": base_loan.get("bank") or "Cognis Bank",
            "category": category,
            "principal": int(principal),
            "base_terms": {
                "interest_rate": base_rate,
                "tenure_months": base_tenure,
                "processing_fee_pct": base_fee,
                "estimated_emi": base_emi,
            },
            "personalized_terms": {
                "interest_rate": personalized_rate,
                "tenure_months": personalized_tenure,
                "processing_fee_pct": personalized_fee,
                "estimated_emi": personalized_emi,
            },
            "adjustments": adjustments,
            "eligibility_status": eligibility,
            "foir_pct": foir,
            "monthly_emi_difference_vs_base": monthly_diff,
            "lifetime_cost_difference_vs_base": lifetime_diff,
            "policy_basis": (
                f"Base terms from '{base_loan.get('name')}' policy document; "
                f"customisation confined to Cognis Bank's {category} personalisation bounds "
                f"(rate ±, fee waiver, tenure, structure)."
            ),
        }

        offer["rationale"] = _explain_offer(offer, p) if explain else _template_rationale(offer, p)
        return offer

    except Exception as exc:  # never break the recommendations response
        logger.warning("Personalised offer synthesis failed: %s", exc)
        return None


def advisor_note(
    profile: Dict[str, Any],
    top_loan: Optional[Dict[str, Any]],
    offer: Optional[Dict[str, Any]],
) -> str:
    """
    A short, warm 'advisor's read' of the customer's situation for the results page.
    Grounded only in profile facts + already-verified offer numbers. Degrades to a
    deterministic template if the LLM is unavailable.
    """
    p = profile.get("profile", profile) if isinstance(profile, dict) else {}
    p = p if isinstance(p, dict) else {}
    name = p.get("name") or p.get("applicant_name") or p.get("customer_name") or "there"
    income = float(p.get("monthly_income") or p.get("income") or 0) or 0.0
    amount = float(p.get("requested_loan_amount") or p.get("loan_amount") or 0) or 0.0
    existing_emi = float(p.get("existing_emi_obligations") or p.get("existing_emi") or 0) or 0.0
    intent = str(p.get("intent") or "loan").replace("_", " ")
    emi_pref = str(p.get("preferred_emi") or "balanced").replace("_", " ")

    pers_emi = None
    status = None
    foir = None
    if offer:
        pers_emi = offer.get("personalized_terms", {}).get("estimated_emi")
        status = offer.get("eligibility_status")
        foir = offer.get("foir_pct")

    def _template() -> str:
        bits = [f"Hi {name} — here's my read on your {intent} plan."]
        if income and amount:
            bits.append(
                f"On a monthly income of Rs {income:,.0f} with a Rs {amount:,.0f} requirement"
                + (f" and Rs {existing_emi:,.0f} of existing EMIs" if existing_emi else "")
                + ", your affordability is the number that matters most."
            )
        if pers_emi:
            bits.append(f"Your tailored EMI works out to about Rs {pers_emi:,.0f}"
                        + (f", which puts your FOIR at roughly {foir}%." if foir is not None else "."))
        if status == "Review Required":
            bits.append("It's tight right now — a longer tenure or a co-applicant would move you into a comfortable range.")
        elif status == "Conditionally Eligible":
            bits.append("You're close — small tweaks to tenure or down payment would firm this up.")
        else:
            bits.append(f"You have room to proceed, and your '{emi_pref}' preference is already built into the offer above.")
        bits.append("Pick the option you're comfortable with and a relationship manager will take it from there.")
        return " ".join(bits)

    try:
        from query import _call_llm
        facts = (
            f"Customer: {name}\nGoal: {intent}\n"
            f"Monthly income: Rs {income:,.0f}\nRequested amount: Rs {amount:,.0f}\n"
            f"Existing EMIs: Rs {existing_emi:,.0f}\nRepayment preference: {emi_pref}\n"
        )
        if offer:
            facts += (
                f"Tailored EMI: Rs {pers_emi:,.0f}\nEligibility: {status}\nFOIR: {foir}%\n"
            )
        if top_loan:
            facts += f"Best-matched scheme: {top_loan.get('name')} at {top_loan.get('interest_rate')}%\n"
        msg = (
            "You are a Cognis Bank loan advisor speaking directly to this customer on their "
            "results page. Write 3-4 warm, plain-English sentences: what their situation looks "
            "like, why the offer above suits them, and the one thing to keep an eye on. "
            "Use only the facts below; never invent a number.\n\n" + facts
        )
        out = _call_llm([
            {"role": "system", "content": "You are a warm, precise retail lending advisor. Never state a number not given to you. No markdown headings."},
            {"role": "user", "content": msg},
        ])
        return out.strip() or _template()
    except Exception as exc:
        logger.info("Advisor note LLM unavailable (%s) - using template.", exc)
        return _template()


def _template_rationale(offer: Dict[str, Any], p: Dict[str, Any]) -> str:
    bt, pt = offer["base_terms"], offer["personalized_terms"]
    bits = [
        f"Starting from the {offer['base_scheme']} scheme, we tailored the terms to your profile."
    ]
    if pt["interest_rate"] != bt["interest_rate"]:
        d = pt["interest_rate"] - bt["interest_rate"]
        bits.append(
            f"Your rate moves from {bt['interest_rate']:.2f}% to {pt['interest_rate']:.2f}% "
            f"({'a concession' if d < 0 else 'a risk loading'} of {abs(d):.2f}%)."
        )
    if pt["tenure_months"] != bt["tenure_months"]:
        bits.append(
            f"Tenure is set to {pt['tenure_months']//12} years to match your repayment priority."
        )
    if pt["processing_fee_pct"] != bt["processing_fee_pct"]:
        bits.append("Your processing fee is waived.")
    if offer["monthly_emi_difference_vs_base"] > 0:
        bits.append(f"Estimated EMI is about ₹{offer['monthly_emi_difference_vs_base']:,.0f} lower per month than the standard scheme.")
    bits.append("Every change stays within Cognis Bank's published personalisation limits.")
    return " ".join(bits)


def _explain_offer(offer: Dict[str, Any], p: Dict[str, Any]) -> str:
    """One short LLM call for a warm rationale; falls back to the template."""
    try:
        from query import _call_llm

        adj_lines = "\n".join(
            f"- {a['parameter']}: {a['base']} -> {a['personalized']} ({a['reason']})"
            for a in offer["adjustments"]
        ) or "- No adjustments were needed; the standard scheme already fits."

        msg = (
            "You are a Cognis Bank lending advisor. In 3 short sentences, warmly explain this "
            "tailored loan offer to the customer. Be specific about what changed and why it "
            "helps them. Do not invent any number that is not below.\n\n"
            f"Scheme: {offer['base_scheme']} (tailored)\n"
            f"Loan amount: Rs {offer['principal']:,}\n"
            f"Standard: {offer['base_terms']['interest_rate']}% for "
            f"{offer['base_terms']['tenure_months']} months, EMI Rs {offer['base_terms']['estimated_emi']:,.0f}\n"
            f"Tailored: {offer['personalized_terms']['interest_rate']}% for "
            f"{offer['personalized_terms']['tenure_months']} months, EMI Rs {offer['personalized_terms']['estimated_emi']:,.0f}\n"
            f"Adjustments (all within bank policy limits):\n{adj_lines}\n"
            f"Affordability (FOIR): {offer['foir_pct']}%  Status: {offer['eligibility_status']}"
        )
        out = _call_llm([
            {"role": "system", "content": "You are a precise, warm retail lending advisor. Never state a number not given to you."},
            {"role": "user", "content": msg},
        ])
        return out.strip() or _template_rationale(offer, p)
    except Exception as exc:
        logger.info("Offer rationale LLM unavailable (%s) — using template.", exc)
        return _template_rationale(offer, p)
