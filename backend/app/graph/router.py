# /backend/app/graph/router.py
"""
Router logic for the LangGraph advisory graph.

The router inspects the current state and decides which node to execute next.
This is the "brain" that implements conditional branching based on:
  1. Current phase (which question we're on)
  2. Completeness percentage (should we keep asking or finish?)
  3. Loan-type-specific sub-flows (vehicle multi-step, education multi-step)
"""

from __future__ import annotations

import logging

from app.config import get_settings
from app.graph.state import AdvisoryState, compute_completeness

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════
#  PHASE-BASED ROUTING
#  Each function returns the NAME of the next node to execute.
#  These names must match exactly what's registered in builder.py.
# ═══════════════════════════════════════════════════════════════════════

def route_after_greeting(state: AdvisoryState) -> str:
    """After greeting, always go to loan type extraction."""
    return "extract_loan_type"

def route_after_loan_type(state: AdvisoryState) -> str:
    """
    After extracting loan type:
    - If loan type was successfully extracted → go to type-specific details
    - If not extracted (re-ask) → stay on loan type
    """
    if state.profile.intent is not None:
        return "extract_loan_type_details"
    return "extract_loan_type"

def route_after_loan_type_details(state: AdvisoryState) -> str:
    """
    After extracting type-specific details.

    This handles MULTI-STEP sub-flows:
    - Vehicle loan: new_or_used → vehicle_type → vehicle_price (3 steps)
    - Education loan: course_level → fees → co_applicant (3 steps)

    If a sub-flow is incomplete, we stay on the same node.
    If loan amount was derived from type details, skip to income.
    If loan amount still not set, go to loan amount.
    """
    intent = state.profile.intent

    # ── Vehicle sub-flow: check if all steps are done ──
    if intent and intent.value == "vehicle_loan":
        details = state.profile.vehicle_loan_details
        if details:
            if details.new_or_used is None:
                return "extract_loan_type_details"
            if details.vehicle_type is None:
                return "extract_loan_type_details"
            if details.vehicle_price is None:
                return "extract_loan_type_details"

    # ── Education sub-flow: check if all steps are done ──
    if intent and intent.value == "education_loan":
        details = state.profile.education_loan_details
        if details:
            if details.course_level is None:
                return "extract_loan_type_details"
            if details.total_fees is None:
                return "extract_loan_type_details"
            if details.co_applicant_available is None:
                return "extract_loan_type_details"

    # ── Main flow routing ──
    if state.current_phase == "loan_amount":
        return "extract_loan_amount"
    if state.current_phase == "income_employment":
        return "extract_income_employment"

    # Fallback: if amount is set go to income, otherwise go to amount
    if state.profile.requested_loan_amount:
        return "extract_income_employment"
    return "extract_loan_amount"

def route_after_loan_amount(state: AdvisoryState) -> str:
    """After extracting loan amount, go to income/employment."""
    if state.profile.requested_loan_amount:
        return "extract_income_employment"
    # Amount not yet extracted (re-ask)
    return "extract_loan_amount"

def route_after_income_employment(state: AdvisoryState) -> str:
    """
    After income/employment extraction.

    This is a TWO-STEP sub-flow:
    - Step 1: employment_type → then asks income (stays on same node)
    - Step 2: monthly_income → then moves to existing debts

    If both are filled, move on.
    """
    if state.profile.employment_type is None:
        return "extract_income_employment"
    if state.profile.monthly_income is None:
        return "extract_income_employment"
    return "extract_existing_debts"

def route_after_existing_debts(state: AdvisoryState) -> str:
    """
    After existing debts extraction.

    Two-step sub-flow:
    - Step 1: has_existing_loans (yes/no)
    - Step 2: if yes, how much EMI

    If complete, move to credit score.
    """
    if state.profile.has_existing_loans is None:
        return "extract_existing_debts"
    if (
        state.profile.has_existing_loans
        and state.profile.existing_emi_obligations is None
    ):
        return "extract_existing_debts"
    # If existing_emi_obligations is 0 and has_existing_loans is True,
    # it could be the default — check if we actually asked
    if (
        state.profile.has_existing_loans
        and state.profile.existing_emi_obligations == 0
        and state.current_phase != "credit_score"
    ):
        return "extract_existing_debts"

    return "extract_credit_score"

def route_after_credit_score(state: AdvisoryState) -> str:
    """After credit score, go to age."""
    if state.profile.credit_score_band is not None:
        return "extract_age"
    return "extract_credit_score"

def route_after_age(state: AdvisoryState) -> str:
    """After age, go to tenure."""
    if state.profile.age is not None:
        return "extract_tenure"
    return "extract_age"

def route_after_tenure(state: AdvisoryState) -> str:
    """After tenure, go to co-applicant."""
    if state.profile.preferred_tenure_months is not None:
        return "extract_co_applicant"
    return "extract_tenure"

def route_after_co_applicant(state: AdvisoryState) -> str:
    """After co-applicant, go to urgency."""
    if state.profile.has_co_applicant is not None:
        return "extract_urgency"
    return "extract_co_applicant"

def route_after_urgency(state: AdvisoryState) -> str:
    """After urgency, check completeness and either finish or loop back."""
    if state.profile.urgency is not None:
        return "completion"
    return "extract_urgency"

# ═══════════════════════════════════════════════════════════════════════
#  MASTER ROUTER
#  Used when we need a single function to route from any phase.
# ═══════════════════════════════════════════════════════════════════════

def master_router(state: AdvisoryState) -> str:
    """
    Universal router that determines the next node based on the current phase.

    This is the primary routing function used by the graph's
    conditional edges. It maps current_phase → next node.
    """
    settings = get_settings()
    threshold = settings.COMPLETENESS_THRESHOLD
    max_turns = settings.MAX_CHAT_TURNS

    # Safety: if we've exceeded max turns, force completion
    if state.turn_count >= max_turns:
        logger.warning(
            f"Session {state.session_id}: max turns ({max_turns}) reached, "
            f"forcing completion at {state.extraction_meta.completeness_pct}%"
        )
        return "completion"

    # Check if already complete
    if state.is_complete:
        return "completion"

    # Check completeness threshold
    pct, _, _ = compute_completeness(state.profile)
    if pct >= threshold and state.profile.urgency is not None:
        return "completion"

    # Phase-based routing
    phase = state.current_phase

    phase_to_node = {
        "greeting": "greeting",
        "loan_type": "extract_loan_type",
        "loan_type_details": "extract_loan_type_details",
        "loan_amount": "extract_loan_amount",
        "income_employment": "extract_income_employment",
        "existing_debts": "extract_existing_debts",
        "credit_score": "extract_credit_score",
        "age": "extract_age",
        "tenure": "extract_tenure",
        "co_applicant": "extract_co_applicant",
        "urgency": "extract_urgency",
        "complete": "completion",
    }

    next_node = phase_to_node.get(phase)

    if next_node:
        logger.debug(
            f"Session {state.session_id}: phase={phase} → node={next_node} "
            f"(completeness={pct}%)"
        )
        return next_node

    # Fallback: figure out what's missing and route there
    logger.warning(
        f"Session {state.session_id}: unknown phase '{phase}', "
        f"falling back to field-based routing"
    )
    return _route_by_missing_fields(state)

def _route_by_missing_fields(state: AdvisoryState) -> str:
    """
    Fallback router: look at which fields are still empty
    and route to the appropriate extraction node.
    """
    profile = state.profile

    if profile.intent is None:
        return "extract_loan_type"
    if profile.requested_loan_amount is None:
        # Check if type-specific details might give us the amount
        return "extract_loan_amount"
    if profile.employment_type is None or profile.monthly_income is None:
        return "extract_income_employment"
    if profile.has_existing_loans is None:
        return "extract_existing_debts"
    if profile.credit_score_band is None:
        return "extract_credit_score"
    if profile.age is None:
        return "extract_age"
    if profile.preferred_tenure_months is None:
        return "extract_tenure"
    if profile.has_co_applicant is None:
        return "extract_co_applicant"
    if profile.urgency is None:
        return "extract_urgency"

    return "completion"