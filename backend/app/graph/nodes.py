# /backend/app/graph/nodes.py
"""
LangGraph nodes — each node handles one phase of the extraction.

Every node:
1. Reads the current user input from state
2. Calls the LLM to extract structured data
3. Validates the extracted data
4. Updates the profile in state
5. Generates an acknowledgment message
6. Prepares the next question with appropriate UI component
"""

from __future__ import annotations

import logging
from typing import Any

from app.schemas.profile import (
    CreditScoreBand,
    EmploymentType,
    HomeLoanDetails,
    LoanIntent,
    PersonalLoanDetails,
    ProfileData,
    Urgency,
    VehicleLoanDetails,
    EducationLoanDetails,
    BusinessLoanDetails,
)
from app.schemas.chat import UIComponent, UIComponentType
from app.services.llm import extract_json_from_llm, generate_conversational_response
from app.services.validation import (
    check_foir,
    score_to_band,
    validate_credit_score,
    validate_income,
    validate_loan_amount,
    validate_age_tenure,
)
from app.graph.state import AdvisoryState, compute_completeness
from app.graph.prompts import (
    SYSTEM_PROMPT,
    EXTRACT_LOAN_TYPE_PROMPT,
    EXTRACT_LOAN_AMOUNT_PROMPT,
    EXTRACT_INCOME_EMPLOYMENT_PROMPT,
    EXTRACT_EXISTING_DEBTS_PROMPT,
    EXTRACT_CREDIT_SCORE_PROMPT,
    EXTRACT_AGE_PROMPT,
    EXTRACT_URGENCY_PROMPT,
    EXTRACT_HOME_LOAN_DETAILS_PROMPT,
    EXTRACT_VEHICLE_LOAN_DETAILS_PROMPT,
    EXTRACT_EDUCATION_LOAN_DETAILS_PROMPT,
    EXTRACT_PERSONAL_LOAN_PURPOSE_PROMPT,
    EXTRACT_BUSINESS_LOAN_DETAILS_PROMPT,
    EXTRACT_CO_APPLICANT_PROMPT,
    ACKNOWLEDGMENT_PROMPT,
    GENERATE_QUESTION_PROMPT,
)

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════
#  HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════

def _add_bot_message(
    state: AdvisoryState,
    content: str,
    ui_component: dict | None = None,
    field_target: str | None = None,
) -> None:
    """Append a bot message to the pending messages list."""
    msg = {
        "role": "assistant",
        "content": content,
        "ui_component": ui_component,
        "field_target": field_target,
    }
    state.pending_messages.append(msg)

def _add_to_history(state: AdvisoryState, role: str, content: str) -> None:
    """Append to persistent chat history."""
    state.chat_history.append({"role": role, "content": content})

def _generate_ack(
    field_name: str,
    extracted_value: Any,
    loan_type: str,
    warning: str = "",
) -> str:
    """Generate a conversational acknowledgment via LLM."""
    prompt = ACKNOWLEDGMENT_PROMPT.format(
        field_name=field_name,
        extracted_value=extracted_value,
        loan_type=loan_type or "not yet specified",
        validation_warning=f"VALIDATION WARNING: {warning}" if warning else "",
    )
    return generate_conversational_response(SYSTEM_PROMPT, prompt)

def _profile_summary(profile: ProfileData) -> str:
    """Create a readable summary of filled profile fields."""
    parts = []
    if profile.intent:
        parts.append(f"Loan Type: {profile.intent.value.replace('_', ' ').title()}")
    if profile.requested_loan_amount:
        parts.append(f"Amount: ₹{profile.requested_loan_amount:,.0f}")
    if profile.monthly_income:
        parts.append(f"Monthly Income: ₹{profile.monthly_income:,.0f}")
    if profile.employment_type:
        parts.append(
            f"Employment: {profile.employment_type.value.replace('_', ' ').title()}"
        )
    if profile.age:
        parts.append(f"Age: {profile.age}")
    if profile.has_existing_loans is not None:
        emi_str = (
            f"₹{profile.existing_emi_obligations:,.0f}/month"
            if profile.existing_emi_obligations
            else "None"
        )
        parts.append(f"Existing EMIs: {emi_str}")
    if profile.credit_score_band:
        parts.append(f"Credit: {profile.credit_score_band.value.title()}")
    if profile.urgency:
        parts.append(f"Urgency: {profile.urgency.value.replace('_', ' ').title()}")
    return "\n".join(parts) if parts else "No information collected yet."

def _update_completeness(state: AdvisoryState) -> None:
    """Recalculate and update completeness in state."""
    pct, filled, remaining = compute_completeness(state.profile)
    state.extraction_meta.completeness_pct = pct
    state.extraction_meta.fields_filled = filled
    state.extraction_meta.fields_remaining = remaining

def _try_parse_number(text: str) -> float | None:
    """
    Attempt to parse a number from user input, handling Indian formats:
      '10 lakh' → 1_000_000
      '1.5 crore' → 15_000_000
      '50K' → 50_000
      '25000' → 25_000
    """
    import re

    text = text.strip().lower().replace(",", "").replace("₹", "").replace("rs", "").replace("inr", "")
    text = text.replace("years", "").replace("year", "").replace("yrs", "").replace("yr", "")
    text = text.replace("months", "").replace("month", "").replace("mos", "").replace("mo", "").strip()

    # Pattern: number followed by unit word
    match = re.match(
        r"^([\d]+\.?\d*)\s*(lakh|lac|l|crore|cr|c|thousand|k|lakhs|crores)?$",
        text,
    )
    if match:
        num = float(match.group(1))
        unit = match.group(2) or ""
        if unit in ("lakh", "lac", "l", "lakhs"):
            return num * 100_000
        elif unit in ("crore", "cr", "c", "crores"):
            return num * 1_00_00_000
        elif unit in ("thousand", "k"):
            return num * 1_000
        else:
            return num

    # Try plain float
    try:
        return float(text)
    except ValueError:
        return None

# ═══════════════════════════════════════════════════════════════════════
#  QUESTION BUILDER HELPERS
#  Each of these prepares the next question with the right UI component.
# ═══════════════════════════════════════════════════════════════════════

def _ask_loan_type_details(state: AdvisoryState, intent: LoanIntent) -> None:
    """Ask the first type-specific question based on loan type."""
    if intent == LoanIntent.HOME_LOAN:
        _add_bot_message(
            state,
            content=(
                "For your home loan, I need a few property details. "
                "First, what is the approximate property value?"
            ),
            ui_component={
                "type": UIComponentType.NUMBER_INPUT.value,
                "min_value": 5_00_000,
                "max_value": 50_00_00_000,
                "step": 1_00_000,
                "unit": "₹",
                "placeholder": "e.g., 5000000",
            },
            field_target="home_loan_details.property_value",
        )

    elif intent == LoanIntent.VEHICLE_LOAN:
        _add_bot_message(
            state,
            content="Is this for a new or used vehicle?",
            ui_component={
                "type": UIComponentType.MCQ.value,
                "options": [
                    {"label": "🆕 New Vehicle", "value": "new"},
                    {"label": "🔄 Used Vehicle", "value": "used"},
                ],
            },
            field_target="vehicle_loan_details.new_or_used",
        )

    elif intent == LoanIntent.EDUCATION_LOAN:
        _add_bot_message(
            state,
            content=(
                "Tell me about the course — what level and where? "
                "This helps identify eligibility for interest subsidies."
            ),
            ui_component={
                "type": UIComponentType.MCQ.value,
                "options": [
                    {"label": "🎓 Undergraduate (India)", "value": "ug_domestic"},
                    {"label": "🎓 Postgraduate (India)", "value": "pg_domestic"},
                    {"label": "✈️ Study Abroad", "value": "pg_abroad"},
                    {
                        "label": "📋 Professional Course",
                        "value": "professional_domestic",
                    },
                ],
            },
            field_target="education_loan_details",
        )

    elif intent == LoanIntent.PERSONAL_LOAN:
        _add_bot_message(
            state,
            content="What's the primary purpose of this personal loan?",
            ui_component={
                "type": UIComponentType.MCQ.value,
                "options": [
                    {"label": "💒 Wedding", "value": "wedding"},
                    {"label": "🏥 Medical Expenses", "value": "medical"},
                    {"label": "✈️ Travel", "value": "travel"},
                    {"label": "🔄 Debt Consolidation", "value": "debt_consolidation"},
                    {"label": "🏠 Home Renovation", "value": "home_renovation"},
                    {"label": "📦 Other", "value": "other"},
                ],
            },
            field_target="personal_loan_details.purpose",
        )

    elif intent == LoanIntent.BUSINESS_LOAN:
        _add_bot_message(
            state,
            content=(
                "Tell me about your business — what type of business, "
                "how long have you been operating, and approximate annual turnover?"
            ),
            ui_component={
                "type": UIComponentType.TEXT_INPUT.value,
                "placeholder": "e.g., Retail shop, 5 years, 30 lakh/year",
            },
            field_target="business_loan_details",
        )

def _ask_loan_amount(state: AdvisoryState) -> None:
    """Prepare the loan amount question with appropriate UI."""
    intent = state.profile.intent

    max_vals = {
        LoanIntent.HOME_LOAN: 100_000_000,
        LoanIntent.PERSONAL_LOAN: 5_000_000,
        LoanIntent.VEHICLE_LOAN: 50_000_000,
        LoanIntent.EDUCATION_LOAN: 15_000_000,
        LoanIntent.BUSINESS_LOAN: 50_000_000,
    }
    max_val = max_vals.get(intent, 10_000_000)

    _add_bot_message(
        state,
        content="How much loan amount do you need (in ₹)?",
        ui_component={
            "type": UIComponentType.NUMBER_INPUT.value,
            "min_value": 10_000,
            "max_value": max_val,
            "step": 10_000,
            "unit": "₹",
            "placeholder": "e.g., 1000000 or type '10 lakh'",
        },
        field_target="requested_loan_amount",
    )

def _ask_income_employment(state: AdvisoryState) -> None:
    """Ask about income and employment status."""
    if state.profile.employment_type is not None:
        _ask_monthly_income(state)
        return

    _add_bot_message(
        state,
        content="What is your employment type?",
        ui_component={
            "type": UIComponentType.MCQ.value,
            "options": [
                {"label": "💼 Salaried", "value": "salaried"},
                {"label": "🧑💻 Self-Employed / Freelancer", "value": "self_employed"},
                {"label": "🏢 Business Owner", "value": "business_owner"},
            ],
        },
        field_target="employment_type",
    )

def _ask_monthly_income(state: AdvisoryState) -> None:
    """Ask monthly income after employment type is known."""
    emp = state.profile.employment_type
    if emp == EmploymentType.SALARIED:
        label = "What is your net monthly salary (in-hand, after deductions)?"
    elif emp == EmploymentType.SELF_EMPLOYED:
        label = "What is your average monthly income / professional earnings?"
    else:
        label = "What is your average monthly income from the business?"

    _add_bot_message(
        state,
        content=label,
        ui_component={
            "type": UIComponentType.NUMBER_INPUT.value,
            "min_value": 5_000,
            "max_value": 50_000_000,
            "step": 1_000,
            "unit": "₹ / month",
            "placeholder": "e.g., 65000",
        },
        field_target="monthly_income",
    )

def _ask_occupation_vintage(state: AdvisoryState) -> None:
    """Ask for occupation vintage (years in job or business)."""
    emp = state.profile.employment_type
    if emp == EmploymentType.SALARIED:
        label = "How many years have you been working at your current company?"
        target = "years_at_current_job"
    else:
        label = "How many years have you been running your current business / practice?"
        target = "years_in_business"

    _add_bot_message(
        state,
        content=label,
        ui_component={
            "type": UIComponentType.SLIDER.value,
            "min_value": 0,
            "max_value": 40,
            "default_value": 2,
        },
        field_target=target,
    )

def _ask_existing_debts(state: AdvisoryState) -> None:
    """Ask about existing loan obligations."""
    _add_bot_message(
        state,
        content="Do you have any existing loans or EMIs currently running?",
        ui_component={
            "type": UIComponentType.YES_NO.value,
            "options": [
                {"label": "✅ Yes, I have existing EMIs", "value": "yes"},
                {"label": "❌ No existing loans", "value": "no"},
            ],
        },
        field_target="has_existing_loans",
    )

def _ask_existing_emi_amount(state: AdvisoryState) -> None:
    """Follow-up: how much total EMI per month."""
    _add_bot_message(
        state,
        content=(
            "What is your total monthly EMI across all existing loans "
            "(home, car, credit card, etc.)?"
        ),
        ui_component={
            "type": UIComponentType.NUMBER_INPUT.value,
            "min_value": 0,
            "max_value": 5_000_000,
            "step": 500,
            "unit": "₹ / month",
            "placeholder": "e.g., 15000",
        },
        field_target="existing_emi_obligations",
    )

def _ask_credit_score(state: AdvisoryState) -> None:
    """Ask about CIBIL / credit score."""
    _add_bot_message(
        state,
        content=(
            "Do you know your CIBIL / credit score? "
            "If not sure, just pick the range that best describes your credit history."
        ),
        ui_component={
            "type": UIComponentType.MCQ.value,
            "options": [
                {"label": "🌟 Excellent (750+)", "value": "excellent"},
                {"label": "👍 Good (700–749)", "value": "good"},
                {"label": "👌 Fair (650–699)", "value": "fair"},
                {"label": "⚠️ Poor (below 650)", "value": "poor"},
                {"label": "❓ I don't know", "value": "unknown"},
            ],
        },
        field_target="credit_score_band",
    )

def _ask_age(state: AdvisoryState) -> None:
    """Ask the user's age."""
    _add_bot_message(
        state,
        content="How old are you? (This helps determine eligible tenure and products.)",
        ui_component={
            "type": UIComponentType.SLIDER.value,
            "min_value": 18,
            "max_value": 75,
            "step": 1,
            "unit": "years",
            "default_value": 30,
        },
        field_target="age",
    )

def _ask_tenure(state: AdvisoryState) -> None:
    """Ask preferred loan tenure."""
    intent = state.profile.intent
    max_tenure = {
        LoanIntent.HOME_LOAN: 360,       # 30 years
        LoanIntent.PERSONAL_LOAN: 84,    # 7 years
        LoanIntent.VEHICLE_LOAN: 84,     # 7 years
        LoanIntent.EDUCATION_LOAN: 180,  # 15 years
        LoanIntent.BUSINESS_LOAN: 120,   # 10 years
    }
    max_m = max_tenure.get(intent, 120)

    _add_bot_message(
        state,
        content="What repayment period (tenure) would you prefer?",
        ui_component={
            "type": UIComponentType.SLIDER.value,
            "min_value": 12,
            "max_value": max_m,
            "step": 12,
            "unit": "months",
            "default_value": min(60, max_m),
        },
        field_target="preferred_tenure_months",
    )

def _ask_co_applicant(state: AdvisoryState) -> None:
    """Ask about co-applicant / collateral availability."""
    _add_bot_message(
        state,
        content=(
            "Do you have a co-applicant (spouse, parent, relative) "
            "who could join this loan application? This can improve eligibility."
        ),
        ui_component={
            "type": UIComponentType.YES_NO.value,
            "options": [
                {"label": "✅ Yes", "value": "yes"},
                {"label": "❌ No", "value": "no"},
            ],
        },
        field_target="has_co_applicant",
    )

def _ask_urgency(state: AdvisoryState) -> None:
    """Ask about timeline / urgency."""
    _add_bot_message(
        state,
        content="When do you plan to take this loan?",
        ui_component={
            "type": UIComponentType.MCQ.value,
            "options": [
                {"label": "🔥 Immediately / ASAP", "value": "immediate"},
                {"label": "📅 Within 3 months", "value": "within_3_months"},
                {"label": "🔍 Just exploring options", "value": "exploring"},
            ],
        },
        field_target="urgency",
    )

def _build_completion_summary(state: AdvisoryState) -> str:
    """Build the final completion message with profile summary and warnings."""
    profile = state.profile
    summary_lines = [
        "✅ **Profile Complete!** Here's what I've gathered:\n",
        f"  • **Loan Type:** {profile.intent.value.replace('_', ' ').title()}" if profile.intent else "",
        f"  • **Amount:** ₹{profile.requested_loan_amount:,.0f}" if profile.requested_loan_amount else "",
        f"  • **Monthly Income:** ₹{profile.monthly_income:,.0f}" if profile.monthly_income else "",
        f"  • **Employment:** {profile.employment_type.value.replace('_', ' ').title()}" if profile.employment_type else "",
        f"  • **Age:** {profile.age}" if profile.age else "",
    ]

    if profile.has_existing_loans and profile.existing_emi_obligations:
        summary_lines.append(
            f"  • **Existing EMIs:** ₹{profile.existing_emi_obligations:,.0f}/month"
        )
    else:
        summary_lines.append("  • **Existing EMIs:** None")

    if profile.credit_score_band:
        summary_lines.append(
            f"  • **Credit Score:** {profile.credit_score_band.value.title()}"
        )
    if profile.urgency:
        summary_lines.append(
            f"  • **Timeline:** {profile.urgency.value.replace('_', ' ').title()}"
        )
    if profile.preferred_tenure_months:
        years = profile.preferred_tenure_months / 12
        summary_lines.append(
            f"  • **Preferred Tenure:** {profile.preferred_tenure_months} months ({years:.1f} years)"
        )
    if profile.has_co_applicant:
        summary_lines.append("  • **Co-applicant:** Yes")

    # Add any accumulated warnings
    if state.warnings:
        summary_lines.append("\n⚠️ **Things to note:**")
        for w in state.warnings:
            summary_lines.append(f"  • {w}")

    summary_lines.append(
        "\nI'm now matching you with the best loan products. One moment..."
    )

    return "\n".join(line for line in summary_lines if line)

# ═══════════════════════════════════════════════════════════════════════
#  NODE: GREETING
# ═══════════════════════════════════════════════════════════════════════

def greeting_node(state: AdvisoryState) -> AdvisoryState:
    """First node — welcomes the user and asks for their name."""
    state.current_phase = "name"
    state.turn_count += 1

    welcome = (
        "Welcome! 👋 I'm your AI loan advisor. I'll help you find the best loan "
        "options tailored to your needs. This will take about 2 minutes.\n\n"
        "Before we begin, could you please tell me your full name?"
    )

    _add_bot_message(
        state,
        content=welcome,
        ui_component={
            "type": UIComponentType.TEXT_INPUT.value,
            "placeholder": "Enter your name",
        },
        field_target="name",
    )

    _add_to_history(state, "assistant", welcome)
    return state

# ═══════════════════════════════════════════════════════════════════════
#  NODE: EXTRACT NAME
# ═══════════════════════════════════════════════════════════════════════

def extract_name_node(state: AdvisoryState) -> AdvisoryState:
    """Extract the user's name and ask for loan type."""
    user_input = state.current_user_input
    _add_to_history(state, "user", user_input)
    state.turn_count += 1

    name = user_input.strip()
    if name:
        state.profile.name = name
        _update_completeness(state)
        state.current_phase = "loan_type"
        
        ack = f"Nice to meet you, {name}! Let's start — what type of loan are you looking for?"
        _add_bot_message(
            state,
            content=ack,
            ui_component={
                "type": UIComponentType.MCQ.value,
                "options": [
                    {"label": "🏠 Home Loan", "value": "home_loan"},
                    {"label": "🚗 Vehicle Loan", "value": "vehicle_loan"},
                    {"label": "💰 Personal Loan", "value": "personal_loan"},
                    {"label": "🎓 Education Loan", "value": "education_loan"},
                    {"label": "🏢 Business Loan", "value": "business_loan"},
                ],
            },
            field_target="intent",
        )
        _add_to_history(state, "assistant", ack)
    else:
        # Ask again if empty
        msg = "I didn't quite catch that. Could you please tell me your name?"
        _add_bot_message(
            state,
            content=msg,
            ui_component={
                "type": UIComponentType.TEXT_INPUT.value,
                "placeholder": "Enter your name",
            },
            field_target="name",
        )
        _add_to_history(state, "assistant", msg)

    return state

# ═══════════════════════════════════════════════════════════════════════
#  NODE: EXTRACT LOAN TYPE
# ═══════════════════════════════════════════════════════════════════════

def extract_loan_type_node(state: AdvisoryState) -> AdvisoryState:
    """Extract the loan purpose/type from user input."""
    user_input = state.current_user_input
    _add_to_history(state, "user", user_input)
    state.turn_count += 1

    cleaned = user_input.lower().strip().replace("-", " ").replace("_", " ")

    intent = None
    if cleaned in ("1", "1.", "opt 1", "option 1") or any(w in cleaned for w in ("home", "house", "flat", "property", "apartment")):
        intent = LoanIntent.HOME_LOAN
    elif cleaned in ("2", "2.", "opt 2", "option 2") or any(w in cleaned for w in ("vehicle", "car", "bike", "auto", "wheeler")):
        intent = LoanIntent.VEHICLE_LOAN
    elif cleaned in ("3", "3.", "opt 3", "option 3") or any(w in cleaned for w in ("personal", "wedding", "travel", "medical", "general")):
        intent = LoanIntent.PERSONAL_LOAN
    elif cleaned in ("4", "4.", "opt 4", "option 4") or any(w in cleaned for w in ("education", "study", "student", "college", "university", "school")):
        intent = LoanIntent.EDUCATION_LOAN
    elif cleaned in ("5", "5.", "opt 5", "option 5") or any(w in cleaned for w in ("business", "startup", "shop", "commercial", "enterprise", "msme", "sme")):
        intent = LoanIntent.BUSINESS_LOAN

    if not intent:
        # Use LLM extraction for complex free-text answers
        result = extract_json_from_llm(
            SYSTEM_PROMPT,
            EXTRACT_LOAN_TYPE_PROMPT.format(user_input=user_input),
        )
        if result and result.get("intent") and not result.get("clarification_needed"):
            try:
                val = str(result["intent"]).lower().strip().replace(" ", "_")
                intent = LoanIntent(val)
            except ValueError:
                intent = None

    if intent:
        state.profile.intent = intent
        state.current_phase = "loan_type_details"

        # Initialize loan-type-specific details object
        if intent == LoanIntent.HOME_LOAN:
            state.profile.home_loan_details = HomeLoanDetails()
        elif intent == LoanIntent.VEHICLE_LOAN:
            state.profile.vehicle_loan_details = VehicleLoanDetails()
        elif intent == LoanIntent.EDUCATION_LOAN:
            state.profile.education_loan_details = EducationLoanDetails()
        elif intent == LoanIntent.PERSONAL_LOAN:
            state.profile.personal_loan_details = PersonalLoanDetails()
        elif intent == LoanIntent.BUSINESS_LOAN:
            state.profile.business_loan_details = BusinessLoanDetails()
            state.profile.employment_type = EmploymentType.BUSINESS_OWNER

        _update_completeness(state)

        # Acknowledge and ask type-specific details
        intent_label = intent.value.replace("_", " ").title()
        ack = f"Great choice! A {intent_label} — let me help you find the best options."
        _add_bot_message(state, content=ack)
        _add_to_history(state, "assistant", ack)

        # Branch into type-specific first question
        _ask_loan_type_details(state, intent)
    else:
        # Couldn't determine loan type — re-ask with MCQ
        _add_bot_message(
            state,
            content=(
                "I wasn't quite sure about the loan type. "
                "Could you select one of these options?"
            ),
            ui_component={
                "type": UIComponentType.MCQ.value,
                "options": [
                    {"label": "🏠 Home Loan", "value": "home_loan"},
                    {"label": "🚗 Vehicle Loan", "value": "vehicle_loan"},
                    {"label": "💰 Personal Loan", "value": "personal_loan"},
                    {"label": "🎓 Education Loan", "value": "education_loan"},
                    {"label": "🏢 Business Loan", "value": "business_loan"},
                ],
            },
            field_target="intent",
        )

    return state

# ═══════════════════════════════════════════════════════════════════════
#  NODE: EXTRACT LOAN TYPE DETAILS (conditional per loan type)
# ═══════════════════════════════════════════════════════════════════════

def extract_loan_type_details_node(state: AdvisoryState) -> AdvisoryState:
    """Extract loan-type-specific details. Handles multi-step sub-flows for vehicles/education."""
    user_input = state.current_user_input
    _add_to_history(state, "user", user_input)
    state.turn_count += 1
    intent = state.profile.intent
    warning = ""

    # ── HOME LOAN ──────────────────────────────────────────────────────
    if intent == LoanIntent.HOME_LOAN:
        details = state.profile.home_loan_details or HomeLoanDetails()

        # Step 1: property_value
        if details.property_value is None:
            val = _try_parse_number(user_input)
            if val and val > 0:
                details.property_value = val
                state.profile.home_loan_details = details
                _update_completeness(state)
                _add_bot_message(
                    state,
                    content="Great. What is your planned down payment amount?",
                    ui_component={
                        "type": UIComponentType.NUMBER_INPUT.value,
                        "min_value": 0,
                        "max_value": val,
                        "step": 1_00_000,
                        "unit": "₹",
                        "placeholder": "e.g., 500000",
                    },
                    field_target="home_loan_details.down_payment",
                )
            else:
                _add_bot_message(state, content="Please enter a valid property value.")
                _ask_loan_type_details(state, intent)
            return state

        # Step 2: down_payment
        if details.down_payment is None:
            val = _try_parse_number(user_input)
            if val is not None and val >= 0:
                details.down_payment = val
                state.profile.home_loan_details = details
                _update_completeness(state)
                _add_bot_message(
                    state,
                    content="Which city or area is the property located in?",
                    ui_component={
                        "type": UIComponentType.TEXT_INPUT.value,
                        "placeholder": "e.g., Mumbai, Andheri West",
                    },
                    field_target="home_loan_details.property_location",
                )
            else:
                _add_bot_message(state, content="Please enter a valid down payment amount.")
                _add_bot_message(
                    state,
                    content="What is your planned down payment amount?",
                    ui_component={
                        "type": UIComponentType.NUMBER_INPUT.value,
                        "min_value": 0,
                        "max_value": details.property_value,
                        "step": 1_00_000,
                        "unit": "₹",
                    },
                    field_target="home_loan_details.down_payment",
                )
            return state

        # Step 3: property_location
        if details.property_location is None:
            if user_input.strip():
                details.property_location = user_input.strip()
                state.profile.home_loan_details = details
                _update_completeness(state)
                _add_bot_message(
                    state,
                    content="Is this your first property purchase?",
                    ui_component={
                        "type": UIComponentType.YES_NO.value,
                        "options": [
                            {"label": "✅ Yes", "value": "yes"},
                            {"label": "❌ No", "value": "no"},
                        ],
                    },
                    field_target="home_loan_details.is_first_property",
                )
            else:
                _add_bot_message(state, content="Please enter the property location.")
            return state

        # Step 4: is_first_property
        if details.is_first_property is None:
            if user_input.strip().lower() in ("yes", "no"):
                details.is_first_property = (user_input.strip().lower() == "yes")
                state.profile.home_loan_details = details
                _update_completeness(state)
                _add_bot_message(
                    state,
                    content="What is the status of the property?",
                    ui_component={
                        "type": UIComponentType.MCQ.value,
                        "options": [
                            {"label": "🏠 Ready to Move", "value": "ready_to_move"},
                            {"label": "🏗️ Under Construction", "value": "under_construction"},
                        ],
                    },
                    field_target="home_loan_details.property_status",
                )
            else:
                _add_bot_message(state, content="Please select Yes or No.")
            return state

        # Step 5: property_status
        if details.property_status is None:
            if user_input.strip().lower() in ("ready_to_move", "under_construction"):
                details.property_status = user_input.strip().lower()
                state.profile.home_loan_details = details
                
                # Derive requested_loan_amount if not set
                if not state.profile.requested_loan_amount:
                    if details.down_payment is not None:
                        state.profile.requested_loan_amount = details.property_value - details.down_payment
                    else:
                        state.profile.requested_loan_amount = details.property_value * 0.8
                
                _update_completeness(state)
            else:
                _add_bot_message(state, content="Please select a valid property status.")
                return state


    # ── VEHICLE LOAN (multi-step sub-flow) ─────────────────────────────
    elif intent == LoanIntent.VEHICLE_LOAN:
        details = state.profile.vehicle_loan_details or VehicleLoanDetails()

        # Step 1: new_or_used MCQ
        if user_input.strip().lower() in ("new", "used"):
            details.new_or_used = user_input.strip().lower()
            state.profile.vehicle_loan_details = details
            _update_completeness(state)
            _add_bot_message(
                state,
                content="What type of vehicle?",
                ui_component={
                    "type": UIComponentType.MCQ.value,
                    "options": [
                        {"label": "🏍️ Two-Wheeler", "value": "two_wheeler"},
                        {"label": "🚗 Four-Wheeler", "value": "four_wheeler"},
                    ],
                },
                field_target="vehicle_loan_details.vehicle_type",
            )
            return state

        # Step 2: vehicle_type MCQ
        if user_input.strip().lower() in ("two_wheeler", "four_wheeler"):
            details.vehicle_type = user_input.strip().lower()
            state.profile.vehicle_loan_details = details
            _update_completeness(state)
            _add_bot_message(
                state,
                content="What's the approximate on-road price of the vehicle?",
                ui_component={
                    "type": UIComponentType.NUMBER_INPUT.value,
                    "min_value": 30_000,
                    "max_value": 50_000_000,
                    "step": 10_000,
                    "unit": "₹",
                    "placeholder": "e.g., 800000",
                },
                field_target="vehicle_loan_details.vehicle_price",
            )
            return state

        # Step 3: vehicle_price (number) or free-text with multiple fields
        parsed_price = _try_parse_number(user_input)
        if parsed_price and parsed_price > 0:
            details.vehicle_price = parsed_price
            state.profile.vehicle_loan_details = details
            if not state.profile.requested_loan_amount:
                # Default: finance 90% of on-road price
                state.profile.requested_loan_amount = parsed_price * 0.9
        else:
            # Try LLM extraction for free-text
            result = extract_json_from_llm(
                SYSTEM_PROMPT,
                EXTRACT_VEHICLE_LOAN_DETAILS_PROMPT.format(user_input=user_input),
            )
            if result:
                if result.get("vehicle_type"):
                    details.vehicle_type = result["vehicle_type"]
                if result.get("new_or_used"):
                    details.new_or_used = result["new_or_used"]
                if result.get("vehicle_price"):
                    details.vehicle_price = float(result["vehicle_price"])
                    if not state.profile.requested_loan_amount:
                        state.profile.requested_loan_amount = (
                            details.vehicle_price * 0.9
                        )
                if result.get("down_payment"):
                    details.down_payment = float(result["down_payment"])
            state.profile.vehicle_loan_details = details

    # ── EDUCATION LOAN (multi-step sub-flow) ───────────────────────────
    elif intent == LoanIntent.EDUCATION_LOAN:
        details = state.profile.education_loan_details or EducationLoanDetails()

        # Step 1: course level + institution MCQ combo
        mcq_map = {
            "ug_domestic": ("ug", "domestic"),
            "pg_domestic": ("pg", "domestic"),
            "pg_abroad": ("pg", "abroad"),
            "professional_domestic": ("professional", "domestic"),
        }
        if user_input.strip().lower() in mcq_map:
            level, inst = mcq_map[user_input.strip().lower()]
            details.course_level = level
            details.institution_type = inst
            state.profile.education_loan_details = details
            _update_completeness(state)
            _add_bot_message(
                state,
                content=(
                    "What are the total course fees "
                    "(including hostel/living costs if applicable)?"
                ),
                ui_component={
                    "type": UIComponentType.NUMBER_INPUT.value,
                    "min_value": 50_000,
                    "max_value": 15_000_000,
                    "step": 50_000,
                    "unit": "₹",
                    "placeholder": "e.g., 500000",
                },
                field_target="education_loan_details.total_fees",
            )
            return state

        # Step 2: fees (number) or free-text
        parsed_fees = _try_parse_number(user_input)
        if parsed_fees and parsed_fees > 0 and not details.total_fees:
            details.total_fees = parsed_fees
            state.profile.education_loan_details = details
            if not state.profile.requested_loan_amount:
                state.profile.requested_loan_amount = parsed_fees
            _update_completeness(state)
            # Ask about co-applicant for education loan
            _add_bot_message(
                state,
                content=(
                    "For education loans, a co-applicant (parent/guardian) is usually required. "
                    "Do you have one available?"
                ),
                ui_component={
                    "type": UIComponentType.YES_NO.value,
                    "options": [
                        {"label": "✅ Yes", "value": "yes"},
                        {"label": "❌ No", "value": "no"},
                    ],
                },
                field_target="education_loan_details.co_applicant_available",
            )
            return state

        # Step 3: co-applicant yes/no
        if user_input.strip().lower() in ("yes", "no"):
            details.co_applicant_available = user_input.strip().lower() == "yes"
            state.profile.education_loan_details = details
            if details.co_applicant_available:
                state.profile.has_co_applicant = True
        else:
            # Free-text fallback via LLM
            result = extract_json_from_llm(
                SYSTEM_PROMPT,
                EXTRACT_EDUCATION_LOAN_DETAILS_PROMPT.format(user_input=user_input),
            )
            if result:
                if result.get("course_level"):
                    details.course_level = result["course_level"]
                if result.get("institution_type"):
                    details.institution_type = result["institution_type"]
                if result.get("total_fees"):
                    details.total_fees = float(result["total_fees"])
                    if not state.profile.requested_loan_amount:
                        state.profile.requested_loan_amount = details.total_fees
                if result.get("co_applicant_available") is not None:
                    details.co_applicant_available = result["co_applicant_available"]
                    if details.co_applicant_available:
                        state.profile.has_co_applicant = True
                if result.get("co_applicant_income"):
                    details.co_applicant_income = float(
                        result["co_applicant_income"]
                    )
            state.profile.education_loan_details = details

    # ── PERSONAL LOAN ──────────────────────────────────────────────────
    elif intent == LoanIntent.PERSONAL_LOAN:
        details = state.profile.personal_loan_details or PersonalLoanDetails()
        purpose_options = [
            "wedding",
            "medical",
            "travel",
            "debt_consolidation",
            "home_renovation",
            "other",
        ]
        if user_input.strip().lower() in purpose_options:
            details.purpose = user_input.strip().lower()
        else:
            result = extract_json_from_llm(
                SYSTEM_PROMPT,
                EXTRACT_PERSONAL_LOAN_PURPOSE_PROMPT.format(user_input=user_input),
            )
            if result and result.get("purpose"):
                details.purpose = result["purpose"]
        state.profile.personal_loan_details = details

    # ── BUSINESS LOAN ──────────────────────────────────────────────────
    elif intent == LoanIntent.BUSINESS_LOAN:
        details = state.profile.business_loan_details or BusinessLoanDetails()
        result = extract_json_from_llm(
            SYSTEM_PROMPT,
            EXTRACT_BUSINESS_LOAN_DETAILS_PROMPT.format(user_input=user_input),
        )
        if result:
            if result.get("business_type"):
                details.business_type = result["business_type"]
            if result.get("years_in_business"):
                state.profile.years_in_business = int(result["years_in_business"])
            if result.get("annual_turnover"):
                details.annual_turnover = float(result["annual_turnover"])
        state.profile.business_loan_details = details

    # ── Transition to next phase ───────────────────────────────────────
    _update_completeness(state)

    if state.profile.requested_loan_amount:
        # Already derived amount from type-specific details — skip to income
        ack = _generate_ack(
            "loan details",
            f"₹{state.profile.requested_loan_amount:,.0f} requested",
            intent.value if intent else None,
            warning,
        )
        _add_bot_message(state, content=ack)
        _add_to_history(state, "assistant", ack)
        state.current_phase = "income_employment"
        _ask_income_employment(state)
    else:
        ack = "Thanks for those details!"
        _add_bot_message(state, content=ack)
        _add_to_history(state, "assistant", ack)
        state.current_phase = "loan_amount"
        _ask_loan_amount(state)

    return state

# ═══════════════════════════════════════════════════════════════════════
#  NODE: EXTRACT LOAN AMOUNT
# ═══════════════════════════════════════════════════════════════════════

def extract_loan_amount_node(state: AdvisoryState) -> AdvisoryState:
    """Extract the desired loan amount."""
    user_input = state.current_user_input
    _add_to_history(state, "user", user_input)
    state.turn_count += 1
    warning = ""

    # Try direct numeric parse first
    amount = _try_parse_number(user_input)

    if not amount:
        # LLM extraction fallback
        result = extract_json_from_llm(
            SYSTEM_PROMPT,
            EXTRACT_LOAN_AMOUNT_PROMPT.format(
                user_input=user_input,
                loan_type=state.profile.intent.value if state.profile.intent else "unknown",
            ),
        )
        if result and result.get("loan_amount"):
            amount = float(result["loan_amount"])

    if amount and amount > 0:
        # Validate the amount
        validation = validate_loan_amount(
            amount,
            loan_type=state.profile.intent,
            monthly_income=state.profile.monthly_income,
        )

        if not validation.is_valid:
            _add_bot_message(
                state,
                content=validation.error or "That amount doesn't look right. Please try again.",
            )
            _ask_loan_amount(state)
            return state

        state.profile.requested_loan_amount = amount
        if validation.warning:
            warning = validation.warning
            state.warnings.append(validation.warning)

        _update_completeness(state)
        state.current_phase = "income_employment"

        ack = _generate_ack(
            "loan amount",
            f"₹{amount:,.0f}",
            state.profile.intent.value if state.profile.intent else None,
            warning,
        )
        _add_bot_message(state, content=ack)
        _add_to_history(state, "assistant", ack)
        _ask_income_employment(state)
    else:
        # Couldn't parse — re-ask
        _add_bot_message(
            state,
            content=(
                "I couldn't understand that amount. "
                "Please enter a number — for example, '10 lakh' or '1500000'."
            ),
        )
        _ask_loan_amount(state)

    return state

# ═══════════════════════════════════════════════════════════════════════
#  NODE: EXTRACT INCOME & EMPLOYMENT
# ═══════════════════════════════════════════════════════════════════════

def extract_income_employment_node(state: AdvisoryState) -> AdvisoryState:
    """
    Extract employment type and monthly income.

    This node handles a TWO-STEP sub-flow:
      Step 1 — Employment type (MCQ) → sets employment_type, then asks income
      Step 2 — Monthly income (number) → sets monthly_income, then moves on

    The router sends the user back to this node for both steps.
    We distinguish them by checking which fields are already filled.
    """
    user_input = state.current_user_input
    _add_to_history(state, "user", user_input)
    state.turn_count += 1
    warning = ""

    # ── Sub-step 1: Employment type not yet set ────────────────────────
    if state.profile.employment_type is None:
        cleaned = user_input.lower().strip().replace("-", " ").replace("_", " ")
        emp = None
        if cleaned in ("1", "1.", "opt 1") or any(w in cleaned for w in ("salar", "job", "corporate", "employed", "mnc", "govt")):
            emp = EmploymentType.SALARIED
        elif cleaned in ("2", "2.", "opt 2") or any(w in cleaned for w in ("self", "freelanc", "consultant", "doctor", "lawyer", "ca")):
            emp = EmploymentType.SELF_EMPLOYED
        elif cleaned in ("3", "3.", "opt 3") or any(w in cleaned for w in ("business", "owner", "shop", "founder", "trader", "enterprise")):
            emp = EmploymentType.BUSINESS_OWNER

        if not emp:
            # LLM extraction fallback
            result = extract_json_from_llm(
                SYSTEM_PROMPT,
                EXTRACT_INCOME_EMPLOYMENT_PROMPT.format(user_input=user_input),
            )
            if result:
                if result.get("employment_type"):
                    try:
                        val = str(result["employment_type"]).lower().strip().replace(" ", "_")
                        emp = EmploymentType(val)
                    except ValueError:
                        emp = None
                # If LLM also gave income in the same answer, grab it
                if result.get("monthly_income") and emp:
                    state.profile.monthly_income = float(result["monthly_income"])
                if result.get("employer_type"):
                    state.profile.employer_type = result["employer_type"]
                if result.get("years_at_current_job"):
                    years = int(result["years_at_current_job"])
                    if emp == EmploymentType.SALARIED:
                        state.profile.years_at_current_job = years
                    else:
                        state.profile.years_in_business = years

        if emp:
            state.profile.employment_type = emp
            _update_completeness(state)

            # If income was also extracted in the same answer, skip sub-step 2
            if state.profile.monthly_income and state.profile.monthly_income > 0:
                v = validate_income(
                    state.profile.monthly_income, state.profile.intent
                )
                if v.warning:
                    warning = v.warning
                    state.warnings.append(v.warning)

                ack = _generate_ack(
                    "employment & income",
                    (
                        f"{emp.value.replace('_', ' ').title()}, "
                        f"₹{state.profile.monthly_income:,.0f}/month"
                    ),
                    state.profile.intent.value if state.profile.intent else None,
                    warning,
                )
                _add_bot_message(state, content=ack)
                _add_to_history(state, "assistant", ack)
                
                # We also need vintage, let's ask for it
                if (state.profile.employment_type == EmploymentType.SALARIED and state.profile.years_at_current_job is None) or (state.profile.employment_type in (EmploymentType.SELF_EMPLOYED, EmploymentType.BUSINESS_OWNER) and state.profile.years_in_business is None):
                    _ask_occupation_vintage(state)
                else:
                    state.current_phase = "existing_debts"
                    _ask_existing_debts(state)
            else:
                # Ask income as follow-up
                _ask_monthly_income(state)
        else:
            # Couldn't determine employment type — re-ask
            _add_bot_message(
                state,
                content="Could you clarify your employment status?",
            )
            _ask_income_employment(state)

        return state

    # ── Sub-step 2: Employment type known, income not yet set ──────────
    if state.profile.monthly_income is None:
        income = _try_parse_number(user_input)

        if not income:
            result = extract_json_from_llm(
                SYSTEM_PROMPT,
                EXTRACT_INCOME_EMPLOYMENT_PROMPT.format(user_input=user_input),
            )
            if result and result.get("monthly_income"):
                income = float(result["monthly_income"])

        if income and income > 0:
            validation = validate_income(income, state.profile.intent)
            if not validation.is_valid:
                _add_bot_message(
                    state,
                    content=validation.error or "That income doesn't seem right.",
                )
                _ask_monthly_income(state)
                return state

            state.profile.monthly_income = income
            if validation.warning:
                warning = validation.warning
                state.warnings.append(validation.warning)

            _update_completeness(state)
            # We don't change phase yet because we still need vintage.

            ack = _generate_ack(
                "monthly income",
                f"₹{income:,.0f}/month",
                state.profile.intent.value if state.profile.intent else None,
                warning,
            )
            _add_bot_message(state, content=ack)
            _add_to_history(state, "assistant", ack)
            _ask_occupation_vintage(state)
        else:
            _add_bot_message(
                state,
                content=(
                    "I couldn't understand that. Please enter your monthly income "
                    "as a number — for example, '65000' or '1.2 lakh'."
                ),
            )
            _ask_monthly_income(state)

        return state

    # ── Sub-step 3: Vintage not yet set ────────────────────────
    if state.profile.monthly_income is not None:
        needs_vintage = False
        if state.profile.employment_type == EmploymentType.SALARIED and state.profile.years_at_current_job is None:
            needs_vintage = True
        elif state.profile.employment_type in (EmploymentType.SELF_EMPLOYED, EmploymentType.BUSINESS_OWNER) and state.profile.years_in_business is None:
            needs_vintage = True
            
        if needs_vintage:
            years = _try_parse_number(user_input)
            if years is not None and years >= 0:
                if state.profile.employment_type == EmploymentType.SALARIED:
                    state.profile.years_at_current_job = int(years)
                else:
                    state.profile.years_in_business = int(years)
                
                _update_completeness(state)
                state.current_phase = "existing_debts"
                
                ack = _generate_ack(
                    "occupation vintage",
                    f"{int(years)} years",
                    state.profile.intent.value if state.profile.intent else None,
                )
                _add_bot_message(state, content=ack)
                _add_to_history(state, "assistant", ack)
                _ask_existing_debts(state)
            else:
                _add_bot_message(
                    state,
                    content="Please enter the number of years as a valid number.",
                )
                _ask_occupation_vintage(state)

    return state

# ═══════════════════════════════════════════════════════════════════════
#  NODE: EXTRACT EXISTING DEBTS / EMIs
# ═══════════════════════════════════════════════════════════════════════

def extract_existing_debts_node(state: AdvisoryState) -> AdvisoryState:
    """
    Extract existing loan obligations.

    Two-step sub-flow:
      Step 1 — Yes/No: do they have existing EMIs?
      Step 2 — If yes, how much total monthly EMI?
    """
    user_input = state.current_user_input
    _add_to_history(state, "user", user_input)
    state.turn_count += 1
    warning = ""

    # ── Sub-step 1: has_existing_loans not yet answered ────────────────
    if state.profile.has_existing_loans is None:
        lower = user_input.strip().lower()

        if lower in ("no", "none", "nope", "no existing loans", "0", "nil"):
            state.profile.has_existing_loans = False
            state.profile.existing_emi_obligations = 0
            _update_completeness(state)
            state.current_phase = "credit_score"

            ack = "No existing EMIs — that helps your eligibility!"
            _add_bot_message(state, content=ack)
            _add_to_history(state, "assistant", ack)
            _ask_credit_score(state)
            return state

        if lower in ("yes", "yeah", "yep", "y"):
            state.profile.has_existing_loans = True
            _update_completeness(state)
            _ask_existing_emi_amount(state)
            return state

        # LLM fallback
        result = extract_json_from_llm(
            SYSTEM_PROMPT,
            EXTRACT_EXISTING_DEBTS_PROMPT.format(user_input=user_input),
        )
        if result:
            if result.get("has_existing_loans") is not None:
                state.profile.has_existing_loans = result["has_existing_loans"]
            if result.get("existing_emi_obligations") is not None:
                state.profile.existing_emi_obligations = float(
                    result["existing_emi_obligations"]
                )

            if state.profile.has_existing_loans is False:
                state.profile.existing_emi_obligations = 0
                _update_completeness(state)
                state.current_phase = "credit_score"
                ack = "No existing EMIs — that helps your eligibility!"
                _add_bot_message(state, content=ack)
                _add_to_history(state, "assistant", ack)
                _ask_credit_score(state)
                return state

            if (
                state.profile.has_existing_loans
                and state.profile.existing_emi_obligations
                and state.profile.existing_emi_obligations > 0
            ):
                # Both fields extracted in one go
                _update_completeness(state)
                # Run FOIR check
                if state.profile.monthly_income:
                    foir_check = check_foir(
                        state.profile.monthly_income,
                        state.profile.existing_emi_obligations,
                    )
                    if foir_check.warning:
                        warning = foir_check.warning
                        state.warnings.append(foir_check.warning)

                state.current_phase = "credit_score"
                ack = _generate_ack(
                    "existing EMIs",
                    f"₹{state.profile.existing_emi_obligations:,.0f}/month",
                    state.profile.intent.value if state.profile.intent else None,
                    warning,
                )
                _add_bot_message(state, content=ack)
                _add_to_history(state, "assistant", ack)
                _ask_credit_score(state)
                return state

            if state.profile.has_existing_loans:
                _update_completeness(state)
                _ask_existing_emi_amount(state)
                return state

        # Couldn't understand — re-ask
        _add_bot_message(
            state,
            content="I didn't catch that — do you currently have any running EMIs?",
        )
        _ask_existing_debts(state)
        return state

    # ── Sub-step 2: has_existing_loans is True, amount not yet set ─────
    if (
        state.profile.has_existing_loans
        and (
            state.profile.existing_emi_obligations is None
            or state.profile.existing_emi_obligations == 0
        )
    ):
        emi_amount = _try_parse_number(user_input)

        if not emi_amount:
            result = extract_json_from_llm(
                SYSTEM_PROMPT,
                EXTRACT_EXISTING_DEBTS_PROMPT.format(user_input=user_input),
            )
            if result and result.get("existing_emi_obligations"):
                emi_amount = float(result["existing_emi_obligations"])

        if emi_amount is not None and emi_amount >= 0:
            state.profile.existing_emi_obligations = emi_amount

            # FOIR check
            if state.profile.monthly_income and emi_amount > 0:
                foir_check = check_foir(
                    state.profile.monthly_income, emi_amount
                )
                if foir_check.warning:
                    warning = foir_check.warning
                    state.warnings.append(foir_check.warning)

            _update_completeness(state)
            state.current_phase = "credit_score"

            ack = _generate_ack(
                "existing EMIs",
                f"₹{emi_amount:,.0f}/month" if emi_amount > 0 else "None",
                state.profile.intent.value if state.profile.intent else None,
                warning,
            )
            _add_bot_message(state, content=ack)
            _add_to_history(state, "assistant", ack)
            _ask_credit_score(state)
        else:
            _add_bot_message(
                state,
                content=(
                    "Please enter your total monthly EMI amount as a number "
                    "(e.g., '15000' or '0' if none)."
                ),
            )
            _ask_existing_emi_amount(state)

    return state

# ═══════════════════════════════════════════════════════════════════════
#  NODE: EXTRACT CREDIT SCORE
# ═══════════════════════════════════════════════════════════════════════

def extract_credit_score_node(state: AdvisoryState) -> AdvisoryState:
    """Extract credit score band or numeric score."""
    user_input = state.current_user_input
    _add_to_history(state, "user", user_input)
    state.turn_count += 1
    warning = ""

    cleaned = user_input.lower().strip().replace("-", " ").replace("_", " ")

    # Direct / fuzzy / numeric option mapping
    band = None
    if cleaned in ("1", "1.") or "excel" in cleaned:
        band = CreditScoreBand.EXCELLENT
    elif cleaned in ("2", "2.") or "good" in cleaned:
        band = CreditScoreBand.GOOD
    elif cleaned in ("3", "3.") or "fair" in cleaned or "avg" in cleaned or "average" in cleaned:
        band = CreditScoreBand.FAIR
    elif cleaned in ("4", "4.") or "poor" in cleaned or "low" in cleaned or "bad" in cleaned:
        band = CreditScoreBand.POOR
    elif cleaned in ("5", "5.") or "unknown" in cleaned or "don't know" in cleaned or "dont know" in cleaned or "not sure" in cleaned or "no idea" in cleaned:
        band = CreditScoreBand.UNKNOWN

    if not band:
        # Try to parse as numeric score
        try:
            score_num = int(
                user_input.strip()
                .replace(",", "")
                .replace(".", "")
            )
            if 300 <= score_num <= 900:
                validation = validate_credit_score(score_num)
                if validation.is_valid:
                    state.profile.credit_score_numeric = score_num
                    band = score_to_band(score_num)
        except (ValueError, TypeError):
            pass

    if not band:
        # LLM extraction fallback
        result = extract_json_from_llm(
            SYSTEM_PROMPT,
            EXTRACT_CREDIT_SCORE_PROMPT.format(user_input=user_input),
        )
        if result:
            if result.get("credit_score_numeric"):
                try:
                    score_num = int(result["credit_score_numeric"])
                    if 300 <= score_num <= 900:
                        state.profile.credit_score_numeric = score_num
                        band = score_to_band(score_num)
                except (ValueError, TypeError):
                    pass
            if not band and result.get("credit_score_band"):
                band_map = {
                    "poor": CreditScoreBand.POOR,
                    "fair": CreditScoreBand.FAIR,
                    "good": CreditScoreBand.GOOD,
                    "excellent": CreditScoreBand.EXCELLENT,
                    "unknown": CreditScoreBand.UNKNOWN,
                }
                band = band_map.get(result["credit_score_band"])

    if band:
        state.profile.credit_score_band = band
        _update_completeness(state)

        # Add warnings for low credit
        if band == CreditScoreBand.POOR:
            low_credit_warning = (
                "A lower credit score may result in higher interest rates. "
                "Consider a secured loan or adding a guarantor to improve terms."
            )
            warning = low_credit_warning
            state.warnings.append(low_credit_warning)
        elif band == CreditScoreBand.FAIR:
            fair_warning = (
                "A fair credit score is acceptable for most loans, "
                "but you may get better rates with a score above 700."
            )
            warning = fair_warning

        state.current_phase = "age"

        score_display = (
            f"{state.profile.credit_score_numeric} ({band.value.title()})"
            if state.profile.credit_score_numeric
            else band.value.title()
        )
        ack = _generate_ack(
            "credit score",
            score_display,
            state.profile.intent.value if state.profile.intent else None,
            warning,
        )
        _add_bot_message(state, content=ack)
        _add_to_history(state, "assistant", ack)
        _ask_age(state)
    else:
        # Couldn't determine — re-ask with MCQ
        _add_bot_message(
            state,
            content=(
                "I couldn't determine your credit score from that. "
                "Please select the range that best fits:"
            ),
        )
        _ask_credit_score(state)

    return state

# ═══════════════════════════════════════════════════════════════════════
#  NODE: EXTRACT AGE
# ═══════════════════════════════════════════════════════════════════════

def extract_age_node(state: AdvisoryState) -> AdvisoryState:
    """Extract the user's age."""
    user_input = state.current_user_input
    _add_to_history(state, "user", user_input)
    state.turn_count += 1
    warning = ""

    age = None

    # Try direct numeric parse
    try:
        parsed = int(user_input.strip().replace("years", "").replace("yrs", "").strip())
        if 18 <= parsed <= 100:
            age = parsed
    except (ValueError, TypeError):
        pass

    if age is None:
        # LLM extraction fallback
        result = extract_json_from_llm(
            SYSTEM_PROMPT,
            EXTRACT_AGE_PROMPT.format(user_input=user_input),
        )
        if result and result.get("age"):
            try:
                parsed = int(result["age"])
                if 18 <= parsed <= 100:
                    age = parsed
            except (ValueError, TypeError):
                pass

    if age:
        state.profile.age = age
        _update_completeness(state)

        # Check age + tenure compatibility if tenure is already known
        if state.profile.preferred_tenure_months:
            age_check = validate_age_tenure(
                age, state.profile.preferred_tenure_months, state.profile.intent
            )
            if age_check.warning:
                warning = age_check.warning
                state.warnings.append(age_check.warning)

        # Age-based warnings
        if age > 60:
            age_warning = (
                "For borrowers above 60, most banks limit tenure so the loan "
                "matures by age 65–70. A younger co-applicant can help."
            )
            if warning:
                warning += " " + age_warning
            else:
                warning = age_warning
            state.warnings.append(age_warning)

        state.current_phase = "tenure"

        ack = _generate_ack(
            "age",
            f"{age} years",
            state.profile.intent.value if state.profile.intent else None,
            warning,
        )
        _add_bot_message(state, content=ack)
        _add_to_history(state, "assistant", ack)
        _ask_tenure(state)
    else:
        _add_bot_message(
            state,
            content="Please enter your age as a number between 18 and 100.",
        )
        _ask_age(state)

    return state

# ═══════════════════════════════════════════════════════════════════════
#  NODE: EXTRACT PREFERRED TENURE
# ═══════════════════════════════════════════════════════════════════════

def extract_tenure_node(state: AdvisoryState) -> AdvisoryState:
    """Extract preferred loan tenure in months."""
    user_input = state.current_user_input
    _add_to_history(state, "user", user_input)
    state.turn_count += 1
    warning = ""

    tenure_months = None

    # Try direct numeric parse
    text = (
        user_input.strip()
        .lower()
        .replace("months", "")
        .replace("month", "")
        .replace("yrs", "")
        .replace("years", "")
        .replace("year", "")
        .strip()
    )

    try:
        parsed = float(text)
        # Heuristic: if ≤ 30 it's probably years; if > 30 it's probably months
        if parsed <= 30:
            # Check if user likely meant years
            if "year" in user_input.lower() or "yr" in user_input.lower() or parsed <= 30:
                tenure_months = int(parsed * 12)
            else:
                tenure_months = int(parsed)
        else:
            tenure_months = int(parsed)
    except (ValueError, TypeError):
        pass

    # Validate the tenure
    if tenure_months and tenure_months > 0:
        # Sanity bounds
        if tenure_months < 3:
            tenure_months = 3
        elif tenure_months > 360:
            tenure_months = 360

        state.profile.preferred_tenure_months = tenure_months
        _update_completeness(state)

        # Check age + tenure compatibility
        if state.profile.age:
            age_check = validate_age_tenure(
                state.profile.age, tenure_months, state.profile.intent
            )
            if age_check.warning:
                warning = age_check.warning
                state.warnings.append(age_check.warning)

        state.current_phase = "co_applicant"

        years_display = tenure_months / 12
        ack = _generate_ack(
            "preferred tenure",
            f"{tenure_months} months ({years_display:.1f} years)",
            state.profile.intent.value if state.profile.intent else None,
            warning,
        )
        _add_bot_message(state, content=ack)
        _add_to_history(state, "assistant", ack)
        _ask_co_applicant(state)
    else:
        _add_bot_message(
            state,
            content=(
                "I couldn't understand that tenure. Please enter a number — "
                "for example, '5' for 5 years or '60' for 60 months."
            ),
        )
        _ask_tenure(state)

    return state

# ═══════════════════════════════════════════════════════════════════════
#  NODE: EXTRACT CO-APPLICANT / COLLATERAL
# ═══════════════════════════════════════════════════════════════════════

def extract_co_applicant_node(state: AdvisoryState) -> AdvisoryState:
    """Extract co-applicant and collateral information."""
    user_input = state.current_user_input
    _add_to_history(state, "user", user_input)
    state.turn_count += 1

    lower = user_input.strip().lower()

    # Direct yes/no
    if lower in ("yes", "y", "yeah", "yep"):
        state.profile.has_co_applicant = True
    elif lower in ("no", "n", "nope", "nah"):
        state.profile.has_co_applicant = False
    else:
        # LLM extraction
        result = extract_json_from_llm(
            SYSTEM_PROMPT,
            EXTRACT_CO_APPLICANT_PROMPT.format(user_input=user_input),
        )
        if result:
            if result.get("has_co_applicant") is not None:
                state.profile.has_co_applicant = result["has_co_applicant"]
            if result.get("co_applicant_income"):
                state.profile.co_applicant_income = float(
                    result["co_applicant_income"]
                )
            if result.get("has_collateral") is not None:
                state.profile.has_collateral = result["has_collateral"]

    # If co-applicant said yes but we don't have their income yet,
    # we could ask — but to keep the flow short, we skip for MVP
    _update_completeness(state)
    state.current_phase = "preferred_emi"

    ack_val = "Yes" if state.profile.has_co_applicant else "No"
    if state.profile.co_applicant_income:
        ack_val += f" (Income: ₹{state.profile.co_applicant_income:,.0f}/month)"

    ack = _generate_ack(
        "co-applicant details",
        ack_val,
        state.profile.intent.value if state.profile.intent else None,
    )
    _add_bot_message(state, content=ack)
    _add_to_history(state, "assistant", ack)

    msg = "Which repayment goal matters most to you?"
    _add_bot_message(
        state,
        content=msg,
        ui_component={
            "type": UIComponentType.MCQ.value,
            "options": [
                {"label": "Lowest monthly EMI", "value": "lowest"},
                {"label": "Pay the least total interest (Fast repayment)", "value": "fast_repayment"},
                {"label": "Balanced EMI & tenure", "value": "balanced"},
                {"label": "Keep flexibility for future prepayments", "value": "flexible"},
            ],
        },
        field_target="preferred_emi",
    )
    _add_to_history(state, "assistant", msg)

    return state


# ═══════════════════════════════════════════════════════════════════════
#  NODE: EXTRACT PREFERRED EMI
# ═══════════════════════════════════════════════════════════════════════

def extract_preferred_emi_node(state: AdvisoryState) -> AdvisoryState:
    """Extract preferred EMI option."""
    user_input = state.current_user_input
    _add_to_history(state, "user", user_input)
    state.turn_count += 1

    from app.schemas.profile import PreferredEMI

    lower = user_input.strip().lower()
    emi = None

    if "lowest" in lower:
        emi = PreferredEMI.LOWEST
    elif "balance" in lower:
        emi = PreferredEMI.BALANCED
    elif "fast" in lower or "least" in lower:
        emi = PreferredEMI.FAST_REPAYMENT
    elif "flexib" in lower:
        emi = PreferredEMI.FLEXIBLE
    else:
        # Ask LLM fallback
        system_prompt = (
            "Extract preferred EMI option from the user's input.\n"
            "Return EXACTLY one of: lowest, balanced, fast_repayment, flexible.\n"
            "If unclear, return 'unclear'."
        )
        response = _call_llm(system_prompt, user_input)
        ans = response.strip().lower()
        if ans in ("lowest", "balanced", "fast_repayment", "flexible"):
            emi = PreferredEMI(ans)

    if emi:
        state.profile.preferred_emi = emi
        _update_completeness(state)
        state.current_phase = "interest_type"

        msg = "Got it! What type of interest rate do you prefer?"
        _add_bot_message(
            state,
            content=msg,
            ui_component={
                "type": UIComponentType.MCQ.value,
                "options": [
                    {"label": "Fixed", "value": "fixed"},
                    {"label": "Floating", "value": "floating"},
                    {"label": "Not sure", "value": "not_sure"},
                ],
            },
            field_target="interest_type",
        )
        _add_to_history(state, "assistant", msg)
    else:
        msg = "Which repayment goal matters most to you?"
        _add_bot_message(
            state,
            content=msg,
            ui_component={
                "type": UIComponentType.MCQ.value,
                "options": [
                    {"label": "Lowest monthly EMI", "value": "lowest"},
                    {"label": "Pay the least total interest (Fast repayment)", "value": "fast_repayment"},
                    {"label": "Balanced EMI & tenure", "value": "balanced"},
                    {"label": "Keep flexibility for future prepayments", "value": "flexible"},
                ],
            },
            field_target="preferred_emi",
        )
        _add_to_history(state, "assistant", msg)

    return state

# ═══════════════════════════════════════════════════════════════════════
#  NODE: EXTRACT INTEREST TYPE
# ═══════════════════════════════════════════════════════════════════════

def extract_interest_type_node(state: AdvisoryState) -> AdvisoryState:
    """Extract preferred interest type."""
    user_input = state.current_user_input
    _add_to_history(state, "user", user_input)
    state.turn_count += 1

    from app.schemas.profile import InterestType

    lower = user_input.strip().lower()
    int_type = None

    if "fixed" in lower:
        int_type = InterestType.FIXED
    elif "float" in lower:
        int_type = InterestType.FLOATING
    elif "not sure" in lower or "don't know" in lower:
        int_type = InterestType.NOT_SURE
    else:
        # Ask LLM fallback
        system_prompt = (
            "Extract preferred interest type from the user's input.\n"
            "Return EXACTLY one of: fixed, floating, not_sure.\n"
            "If unclear, return 'unclear'."
        )
        response = _call_llm(system_prompt, user_input)
        ans = response.strip().lower()
        if ans in ("fixed", "floating", "not_sure"):
            int_type = InterestType(ans)

    if int_type:
        state.profile.interest_type = int_type
        _update_completeness(state)
        state.current_phase = "urgency"

        msg = "Almost done! When are you planning to take this loan?"
        _add_bot_message(
            state,
            content=msg,
            ui_component={
                "type": UIComponentType.MCQ.value,
                "options": [
                    {"label": "Immediately", "value": "immediate"},
                    {"label": "Within 3 Months", "value": "within_3_months"},
                    {"label": "Just exploring", "value": "exploring"},
                ],
            },
            field_target="urgency",
        )
        _add_to_history(state, "assistant", msg)
    else:
        msg = "Please select an interest type preference:"
        _add_bot_message(
            state,
            content=msg,
            ui_component={
                "type": UIComponentType.MCQ.value,
                "options": [
                    {"label": "Fixed", "value": "fixed"},
                    {"label": "Floating", "value": "floating"},
                    {"label": "Not sure", "value": "not_sure"},
                ],
            },
            field_target="interest_type",
        )
        _add_to_history(state, "assistant", msg)

    return state

# ═══════════════════════════════════════════════════════════════════════
#  NODE: EXTRACT URGENCY
# ═══════════════════════════════════════════════════════════════════════

def extract_urgency_node(state: AdvisoryState) -> AdvisoryState:
    """Extract loan timeline / urgency."""
    user_input = state.current_user_input
    _add_to_history(state, "user", user_input)
    state.turn_count += 1

    lower = user_input.strip().lower()
    urgency = None

    if any(w in lower for w in ("immediate", "asap", "now", "today", "urgent", "quick")):
        urgency = Urgency.IMMEDIATE
    elif any(w in lower for w in ("3 month", "3_month", "few month", "soon", "planning", "within")):
        urgency = Urgency.WITHIN_3_MONTHS
    elif any(w in lower for w in ("explor", "check", "no rush", "research", "just look")):
        urgency = Urgency.EXPLORING
    else:
        result = extract_json_from_llm(
            SYSTEM_PROMPT,
            EXTRACT_URGENCY_PROMPT.format(user_input=user_input),
        )
        if result and result.get("urgency"):
            val = str(result["urgency"]).lower().strip()
            if "immediate" in val:
                urgency = Urgency.IMMEDIATE
            elif "3_month" in val or "within" in val or "month" in val:
                urgency = Urgency.WITHIN_3_MONTHS
            elif "explor" in val:
                urgency = Urgency.EXPLORING

    if urgency:
        state.profile.urgency = urgency
        _update_completeness(state)
        state.current_phase = "complete"
        state.is_complete = True

        ack = _generate_ack(
            "timeline",
            urgency.value.replace("_", " ").title(),
            state.profile.intent.value if state.profile.intent else None,
        )
        _add_bot_message(state, content=ack)
        _add_to_history(state, "assistant", ack)

        summary = _build_completion_summary(state)
        _add_bot_message(state, content=summary)
        _add_to_history(state, "assistant", summary)
    else:
        _add_bot_message(
            state,
            content="When are you planning to take this loan?",
        )
        _ask_urgency(state)

    return state


# ═══════════════════════════════════════════════════════════════════════
#  NODE: WRAPUP / COMPLETION
# ═══════════════════════════════════════════════════════════════════════

def wrapup_node(state: AdvisoryState) -> AdvisoryState:
    """Final node — marks flow as complete and returns summary if not already sent."""
    state.current_phase = "complete"
    state.is_complete = True
    _update_completeness(state)

    summary = _build_completion_summary(state)
    _add_bot_message(state, content=summary)
    _add_to_history(state, "assistant", summary)

    return state


# Alias for builder/main compatibility
completion_node = wrapup_node