# /backend/app/services/validation.py
"""
Input validation helpers for loan advisory data.
Encodes Indian banking norms and eligibility rules.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.schemas.profile import CreditScoreBand, LoanIntent

@dataclass
class ValidationResult:
    is_valid: bool
    cleaned_value: any = None
    warning: Optional[str] = None
    error: Optional[str] = None

# ── Income Validation ──────────────────────────────────────────────────

MIN_INCOME_BY_LOAN_TYPE = {
    LoanIntent.HOME_LOAN: 25000,
    LoanIntent.PERSONAL_LOAN: 15000,
    LoanIntent.VEHICLE_LOAN: 20000,
    LoanIntent.EDUCATION_LOAN: 0,       # Co-applicant income matters more
    LoanIntent.BUSINESS_LOAN: 20000,
}

MAX_REASONABLE_MONTHLY_INCOME = 50_00_000  # ₹50 lakh/month

def validate_income(
    income: float, loan_type: Optional[LoanIntent] = None
) -> ValidationResult:
    if income <= 0:
        return ValidationResult(False, error="Income must be a positive number.")
    if income > MAX_REASONABLE_MONTHLY_INCOME:
        return ValidationResult(
            False, error=f"₹{income:,.0f}/month seems too high. Please re-enter."
        )

    min_income = MIN_INCOME_BY_LOAN_TYPE.get(loan_type, 15000)
    if income < min_income and loan_type:
        return ValidationResult(
            True,
            cleaned_value=income,
            warning=(
                f"Your income of ₹{income:,.0f}/month is below the typical minimum "
                f"of ₹{min_income:,.0f} for {loan_type.value.replace('_', ' ')}s. "
                f"A co-applicant may help improve eligibility."
            ),
        )
    return ValidationResult(True, cleaned_value=income)

# ── Loan Amount Validation ─────────────────────────────────────────────

MAX_LOAN_AMOUNTS = {
    LoanIntent.HOME_LOAN: 10_00_00_000,     # ₹10 crore
    LoanIntent.PERSONAL_LOAN: 50_00_000,     # ₹50 lakh
    LoanIntent.VEHICLE_LOAN: 5_00_00_000,    # ₹5 crore (luxury)
    LoanIntent.EDUCATION_LOAN: 1_50_00_000,  # ₹1.5 crore (abroad)
    LoanIntent.BUSINESS_LOAN: 5_00_00_000,   # ₹5 crore
}

def validate_loan_amount(
    amount: float,
    loan_type: Optional[LoanIntent] = None,
    monthly_income: Optional[float] = None,
) -> ValidationResult:
    if amount <= 0:
        return ValidationResult(False, error="Loan amount must be positive.")
    if amount < 10_000:
        return ValidationResult(
            False, error="Minimum loan amount is typically ₹10,000."
        )

    max_amount = MAX_LOAN_AMOUNTS.get(loan_type, 5_00_00_000)
    if amount > max_amount:
        return ValidationResult(
            True,
            cleaned_value=amount,
            warning=(
                f"₹{amount:,.0f} exceeds the typical maximum of "
                f"₹{max_amount:,.0f} for {loan_type.value.replace('_', ' ')}s. "
                f"A co-applicant or collateral may be required."
            ),
        )

    # Check if amount is reasonable vs income
    if monthly_income and monthly_income > 0:
        ratio = amount / monthly_income
        if ratio > 60:  # More than 5 years of gross income
            return ValidationResult(
                True,
                cleaned_value=amount,
                warning=(
                    f"The requested loan is about {ratio:.0f}× your monthly income. "
                    f"Consider a co-applicant or additional collateral."
                ),
            )

    return ValidationResult(True, cleaned_value=amount)

# ── Credit Score Validation ────────────────────────────────────────────

def validate_credit_score(score: int) -> ValidationResult:
    if score < 300 or score > 900:
        return ValidationResult(
            False, error="CIBIL score must be between 300 and 900."
        )
    return ValidationResult(True, cleaned_value=score)

def score_to_band(score: int) -> CreditScoreBand:
    if score >= 750:
        return CreditScoreBand.EXCELLENT
    elif score >= 700:
        return CreditScoreBand.GOOD
    elif score >= 650:
        return CreditScoreBand.FAIR
    else:
        return CreditScoreBand.POOR

# ── FOIR Check ─────────────────────────────────────────────────────────

def check_foir(
    monthly_income: float,
    existing_emi: float,
    proposed_emi: float = 0,
    max_foir_pct: float = 50.0,
) -> ValidationResult:
    """
    Fixed Obligation to Income Ratio check.
    Banks typically cap total EMIs at 40-50% of net income.
    """
    if monthly_income <= 0:
        return ValidationResult(False, error="Cannot check FOIR without income.")

    total_emi = existing_emi + proposed_emi
    foir = (total_emi / monthly_income) * 100

    if foir > max_foir_pct:
        return ValidationResult(
            True,
            cleaned_value=foir,
            warning=(
                f"Your total EMI obligations (₹{total_emi:,.0f}) are {foir:.0f}% of "
                f"your income, exceeding the recommended {max_foir_pct:.0f}% limit. "
                f"Consider reducing the loan amount or adding a co-borrower."
            ),
        )
    return ValidationResult(True, cleaned_value=foir)

# ── Age + Tenure Validation ────────────────────────────────────────────

MAX_AGE_AT_MATURITY = {
    LoanIntent.HOME_LOAN: 70,
    LoanIntent.PERSONAL_LOAN: 65,
    LoanIntent.VEHICLE_LOAN: 65,
    LoanIntent.EDUCATION_LOAN: 65,
    LoanIntent.BUSINESS_LOAN: 65,
}

def validate_age_tenure(
    age: int,
    tenure_months: int,
    loan_type: Optional[LoanIntent] = None,
) -> ValidationResult:
    max_age = MAX_AGE_AT_MATURITY.get(loan_type, 65)
    age_at_maturity = age + (tenure_months / 12)

    if age_at_maturity > max_age:
        max_tenure = int((max_age - age) * 12)
        return ValidationResult(
            True,
            cleaned_value=tenure_months,
            warning=(
                f"At age {age}, a {tenure_months}-month tenure means maturity at "
                f"age {age_at_maturity:.0f}, exceeding the limit of {max_age}. "
                f"Maximum recommended tenure: {max_tenure} months."
            ),
        )
    return ValidationResult(True, cleaned_value=tenure_months)