# /backend/app/graph/state.py
"""
LangGraph state definition.
The state is the single source of truth as the graph executes.
Each node reads from and writes to this state.
"""

from __future__ import annotations

from typing import Annotated, Any, Optional
import operator

from pydantic import BaseModel, Field
from langgraph.graph import MessagesState

from app.schemas.profile import (
    ProfileData,
    ExtractionMeta,
    LoanIntent,
    UserType,
    HomeLoanDetails,
    VehicleLoanDetails,
    EducationLoanDetails,
    PersonalLoanDetails,
    BusinessLoanDetails,
)
from app.schemas.chat import ChatMessage, UIComponent

class AdvisoryState(BaseModel):
    """
    The full state carried through the LangGraph advisory graph.

    Every node reads what it needs and writes what it extracts.
    The router node inspects completeness and decides the next node.
    """

    # ── Session ────────────────────────────────────────────────────────
    session_id: str = ""
    user_type: UserType = UserType.GUEST

    # ── The profile being built ────────────────────────────────────────
    profile: ProfileData = Field(default_factory=ProfileData)

    # ── Extraction tracking ────────────────────────────────────────────
    extraction_meta: ExtractionMeta = Field(default_factory=ExtractionMeta)

    # ── Conversation ───────────────────────────────────────────────────
    chat_history: list[dict[str, Any]] = Field(default_factory=list)
    pending_messages: list[dict[str, Any]] = Field(default_factory=list)

    # ── Current user input ─────────────────────────────────────────────
    current_user_input: str = ""
    current_field_target: Optional[str] = None

    # ── Flow control ───────────────────────────────────────────────────
    current_phase: str = "greeting"
    # Phases: greeting, loan_type, loan_type_details, loan_amount,
    #         income_employment, existing_debts, credit_score,
    #         additional_factors, urgency, complete
    next_node: str = ""
    is_complete: bool = False

    # ── Warnings / validation messages ─────────────────────────────────
    warnings: list[str] = Field(default_factory=list)

    # ── Turn counter ───────────────────────────────────────────────────
    turn_count: int = 0

    class Config:
        arbitrary_types_allowed = True

# ── Completeness Calculation ───────────────────────────────────────────

# Core fields every loan type needs
CORE_FIELDS = [
    "intent",
    "monthly_income",
    "employment_type",
    "requested_loan_amount",
    "existing_emi_obligations",
    "credit_score_band",
    "urgency",
    "age",
]

# Weight of each core field (total = 100 after normalization)
FIELD_WEIGHTS: dict[str, float] = {
    "intent": 15,
    "monthly_income": 15,
    "employment_type": 10,
    "requested_loan_amount": 15,
    "preferred_tenure_months": 5,
    "existing_emi_obligations": 10,
    "has_existing_loans": 5,
    "credit_score_band": 10,
    "urgency": 5,
    "age": 5,
    "has_co_applicant": 5,
}

# Bonus fields per loan type
LOAN_TYPE_BONUS_FIELDS: dict[LoanIntent, list[str]] = {
    LoanIntent.HOME_LOAN: [
        "home_loan_details.property_value",
        "home_loan_details.down_payment",
    ],
    LoanIntent.VEHICLE_LOAN: [
        "vehicle_loan_details.vehicle_type",
        "vehicle_loan_details.new_or_used",
        "vehicle_loan_details.vehicle_price",
    ],
    LoanIntent.EDUCATION_LOAN: [
        "education_loan_details.course_level",
        "education_loan_details.total_fees",
        "education_loan_details.co_applicant_available",
    ],
    LoanIntent.PERSONAL_LOAN: [
        "personal_loan_details.purpose",
    ],
    LoanIntent.BUSINESS_LOAN: [
        "business_loan_details.years_in_business",
        "business_loan_details.annual_turnover",
    ],
}

def compute_completeness(profile: ProfileData) -> tuple[int, list[str], list[str]]:
    """
    Compute completeness percentage, filled fields, and remaining fields.
    Returns (pct, filled, remaining).
    """
    filled: list[str] = []
    remaining: list[str] = []
    total_weight = sum(FIELD_WEIGHTS.values())
    earned_weight = 0.0

    for field, weight in FIELD_WEIGHTS.items():
        value = getattr(profile, field, None)
        if value is not None:
            filled.append(field)
            earned_weight += weight
        else:
            remaining.append(field)

    # Check loan-type-specific bonus fields
    if profile.intent and profile.intent in LOAN_TYPE_BONUS_FIELDS:
        bonus_fields = LOAN_TYPE_BONUS_FIELDS[profile.intent]
        bonus_weight_per_field = 10.0 / max(len(bonus_fields), 1)  # 10% total for type-specific

        for field_path in bonus_fields:
            parts = field_path.split(".")
            obj = profile
            val = None
            try:
                for part in parts:
                    obj = getattr(obj, part, None)
                    if obj is None:
                        break
                val = obj
            except Exception:
                val = None

            total_weight += bonus_weight_per_field
            if val is not None:
                filled.append(field_path)
                earned_weight += bonus_weight_per_field
            else:
                remaining.append(field_path)

    pct = int((earned_weight / total_weight) * 100) if total_weight > 0 else 0
    return min(pct, 100), filled, remaining