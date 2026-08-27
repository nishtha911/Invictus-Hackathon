# /backend/app/schemas/profile.py
"""
Shared Pydantic v2 contracts — Section 3.1 of the blueprint.
These are the FROZEN schemas that Pod 2 (Scoring Engine) consumes.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

# ── Enums ──────────────────────────────────────────────────────────────

class LoanIntent(str, Enum):
    HOME_LOAN = "home_loan"
    PERSONAL_LOAN = "personal_loan"
    VEHICLE_LOAN = "vehicle_loan"
    EDUCATION_LOAN = "education_loan"
    BUSINESS_LOAN = "business_loan"

class EmploymentType(str, Enum):
    SALARIED = "salaried"
    SELF_EMPLOYED = "self_employed"
    BUSINESS_OWNER = "business_owner"

class CreditScoreBand(str, Enum):
    UNKNOWN = "unknown"
    POOR = "poor"          # < 650
    FAIR = "fair"          # 650-699
    GOOD = "good"          # 700-749
    EXCELLENT = "excellent"  # 750+

class Urgency(str, Enum):
    IMMEDIATE = "immediate"
    WITHIN_3_MONTHS = "within_3_months"
    EXPLORING = "exploring"

class PreferredEMI(str, Enum):
    LOWEST = "lowest"
    BALANCED = "balanced"
    FAST_REPAYMENT = "fast_repayment"
    FLEXIBLE = "flexible"

class InterestType(str, Enum):
    FIXED = "fixed"
    FLOATING = "floating"
    NOT_SURE = "not_sure"

class UserType(str, Enum):
    GUEST = "guest"
    EXISTING_CUSTOMER = "existing_customer"

# ── Loan-Type Specific Sub-Profiles ───────────────────────────────────

class HomeLoanDetails(BaseModel):
    property_value: Optional[float] = Field(None, description="Property cost in INR")
    down_payment: Optional[float] = Field(None, description="Down payment amount in INR")
    property_location: Optional[str] = Field(None, description="City or area")
    is_first_property: Optional[bool] = Field(None, description="First property purchase?")
    property_status: Optional[str] = Field(
        None, description="ready_to_move | under_construction"
    )

class VehicleLoanDetails(BaseModel):
    vehicle_type: Optional[str] = Field(None, description="two_wheeler | four_wheeler")
    new_or_used: Optional[str] = Field(None, description="new | used")
    vehicle_price: Optional[float] = Field(None, description="On-road price in INR")
    down_payment: Optional[float] = Field(None, description="Down payment in INR")

class EducationLoanDetails(BaseModel):
    course_level: Optional[str] = Field(None, description="ug | pg | professional | diploma")
    institution_type: Optional[str] = Field(None, description="domestic | abroad")
    total_fees: Optional[float] = Field(None, description="Total course fees in INR")
    co_applicant_available: Optional[bool] = Field(
        None, description="Parent/guardian as co-applicant?"
    )
    co_applicant_income: Optional[float] = Field(
        None, description="Co-applicant monthly income in INR"
    )

class PersonalLoanDetails(BaseModel):
    purpose: Optional[str] = Field(
        None,
        description="debt_consolidation | wedding | travel | medical | home_renovation | other",
    )

class BusinessLoanDetails(BaseModel):
    business_type: Optional[str] = Field(None, description="Type of business")
    annual_turnover: Optional[float] = Field(None, description="Annual turnover in INR")

# ── Core Profile ──────────────────────────────────────────────────────

class ProfileData(BaseModel):
    """The extracted customer profile — the contract between Pod 1 and Pod 2."""

    name: Optional[str] = Field(None, description="Customer's full name")
    intent: Optional[LoanIntent] = None
    monthly_income: Optional[float] = Field(None, description="Monthly income in INR")
    employment_type: Optional[EmploymentType] = None
    employer_type: Optional[str] = Field(
        None, description="government | private | mnc | startup (salaried only)"
    )
    years_at_current_job: Optional[int] = Field(None, description="Salaried: tenure at job")
    years_in_business: Optional[int] = Field(None, description="Years in business")
    requested_loan_amount: Optional[float] = Field(None, description="Desired loan in INR")
    preferred_tenure_months: Optional[int] = Field(None, description="Preferred repayment period")
    existing_emi_obligations: Optional[float] = Field(
        0, description="Total current monthly EMIs in INR"
    )
    has_existing_loans: Optional[bool] = None
    credit_score_band: Optional[CreditScoreBand] = None
    credit_score_numeric: Optional[int] = Field(
        None, ge=300, le=900, description="Exact CIBIL score if known"
    )
    urgency: Optional[Urgency] = None
    age: Optional[int] = Field(None, ge=18, le=100)
    has_co_applicant: Optional[bool] = None
    co_applicant_income: Optional[float] = Field(None, description="Co-applicant income in INR")
    has_collateral: Optional[bool] = None
    preferred_emi: Optional[PreferredEMI] = None
    interest_type: Optional[InterestType] = None

    # Loan-type-specific details
    home_loan_details: Optional[HomeLoanDetails] = None
    vehicle_loan_details: Optional[VehicleLoanDetails] = None
    education_loan_details: Optional[EducationLoanDetails] = None
    personal_loan_details: Optional[PersonalLoanDetails] = None
    business_loan_details: Optional[BusinessLoanDetails] = None

    @property
    def occupation_vintage(self) -> Optional[int]:
        if self.employment_type == EmploymentType.SALARIED:
            return self.years_at_current_job
        elif self.employment_type in (EmploymentType.SELF_EMPLOYED, EmploymentType.BUSINESS_OWNER):
            return self.years_in_business
        return None

class ExtractionMeta(BaseModel):
    completeness_pct: int = Field(0, ge=0, le=100)
    turns_taken: int = 0
    model: str = "llama-3.3-70b-versatile"
    extracted_at: datetime = Field(default_factory=datetime.utcnow)
    fields_filled: list[str] = Field(default_factory=list)
    fields_remaining: list[str] = Field(default_factory=list)

class ExtractedProfile(BaseModel):
    """Top-level contract: Pod 1 → Pod 2 (Section 3.1 of blueprint)."""

    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_type: UserType = UserType.GUEST
    profile: ProfileData = Field(default_factory=ProfileData)
    extraction_meta: ExtractionMeta = Field(default_factory=ExtractionMeta)