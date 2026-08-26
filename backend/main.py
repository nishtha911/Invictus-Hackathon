from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional,List

app = FastAPI(title="Bank GenAI Loan Advisory Backend")

# 1. Pydantic Schemas (Contracts)
class ProfileIntake(BaseModel):
    user_type: str                  # "new" or "existing"
    income: Optional[float] = 0.0
    loan_amount: Optional[float] = 0.0
    intent: Optional[str] = None    # e.g., "Home Loan", "Personal"


class LoanRecommendation(BaseModel):
    loan_id: str
    name: str
    max_amount: float
    interest_rate: float
    estimated_emi: float
    score: float
    reasoning: str


class RecommendationResponse(BaseModel):
    recommended_loans: List[LoanRecommendation]

# Loan Catealogue 

MASTER_LOAN_CATALOGUE = [
    {
        "loan_id": "L-101",
        "name": "Instant Personal Loan",
        "intent": "Personal",
        "min_income": 30000.0,
        "max_limit": 500000.0,
        "base_rate": 11.5
    },
    {
        "loan_id": "L-102",
        "name": "Premium Salaried Personal Loan",
        "intent": "Personal",
        "min_income": 75000.0,
        "max_limit": 1500000.0,
        "base_rate": 9.5
    },
    {
        "loan_id": "L-201",
        "name": "Affordable Home Loan",
        "intent": "Home Loan",
        "min_income": 50000.0,
        "max_limit": 5000000.0,
        "base_rate": 8.5
    },
    {
        "loan_id": "L-202",
        "name": "Express Housing Advance",
        "intent": "Home Loan",
        "min_income": 100000.0,
        "max_limit": 10000000.0,
        "base_rate": 8.0
    },
    {
        "loan_id": "L-301",
        "name": "Quick Cash Line",
        "intent": "Emergency",
        "min_income": 20000.0,
        "max_limit": 200000.0,
        "base_rate": 14.0
    }
]


# EMI Calculation

def calculate_emi(
    principal: float,
    annual_rate: float,
    tenure_years: int = 5
) -> float:

    monthly_rate = (annual_rate / 100) / 12
    months = tenure_years * 12

    if monthly_rate == 0:
        return round(principal / months, 2)

    emi = (
        principal
        * monthly_rate
        * ((1 + monthly_rate) ** months)
    ) / (
        ((1 + monthly_rate) ** months) - 1
    )

    return round(emi, 2)

# Recommendation API

@app.post(
    "/api/v1/recommend-loans",
    response_model=RecommendationResponse
)
def recommend_loans(profile: ProfileIntake):

    eligible_loans = []

    # Normalize input
    user_intent = (
        profile.intent.strip().lower()
        if profile.intent
        else None
    )

    user_type = profile.user_type.strip().lower()

    monthly_income = profile.income

    # Requested amount
    requested_amount = (
        profile.loan_amount
        if profile.loan_amount > 0
        else 200000.0
    )

# Checking loan catalogue one by one 

    for loan in MASTER_LOAN_CATALOGUE:

        # Income Eligibilty check

        if monthly_income < loan["min_income"]:
            continue

        # Intent maching check

        loan_intent = loan["intent"].strip().lower()

        intent_match = (
            user_intent is None
            or user_intent == loan_intent
        )

        if not intent_match:
            continue

        # Determine loan amount 

        target_amount = min(
            requested_amount,
            loan["max_limit"]
        )

        # EMI Calculation

        emi = calculate_emi(
            target_amount,
            loan["base_rate"],
            tenure_years=5
        )

        # Affordability check

        max_affordable_emi = monthly_income * 0.50

        if emi > max_affordable_emi:
            affordability_score = 0
            affordable = False
        else:
            affordability_score = 20
            affordable = True

        # Recommandation scoring calculation

        score = 0

            # Income eligibility
        score += 40

            # Intent match
        if user_intent == loan_intent:
            score += 30
        elif user_intent is None:
            score += 15

            # Affordability
        score += affordability_score

            # Loan amount fit
        if requested_amount <= loan["max_limit"]:
            score += 10

            # Existing customers get a small preference
            # because they may have an existing relationship
        if user_type == "existing":
            score += 5

        score = min(score, 100)

        # Recommendation explaination 

        if affordable:
            reasoning = (
                f"Strong match for your profile. "
                f"The estimated EMI is ₹{emi} per month, "
                f"which is within 50% of your monthly income."
            )
        else:
            reasoning = (
                f"You meet the basic eligibility criteria, "
                f"but the estimated EMI of ₹{emi} exceeds "
                f"50% of your monthly income."
            )

        # Store recommandation 

        eligible_loans.append(
            LoanRecommendation(
                loan_id=loan["loan_id"],
                name=loan["name"],
                max_amount=loan["max_limit"],
                interest_rate=loan["base_rate"],
                estimated_emi=emi,
                score=score,
                reasoning=reasoning
            )
        )

    # FallBack

    if not eligible_loans:

        for loan in MASTER_LOAN_CATALOGUE:

            target_amount = min(
                requested_amount,
                loan["max_limit"]
            )

            emi = calculate_emi(
                target_amount,
                loan["base_rate"],
                tenure_years=5
            )

            eligible_loans.append(
                LoanRecommendation(
                    loan_id=loan["loan_id"],
                    name=loan["name"],
                    max_amount=loan["max_limit"],
                    interest_rate=loan["base_rate"],
                    estimated_emi=emi,
                    score=0,
                    reasoning=(
                        "No exact eligible match was found. "
                        "This is shown as a general catalogue option."
                    )
                )
            )

    # Ranking and top 3 return 

    eligible_loans.sort(
        key=lambda loan: loan.score,
        reverse=True
    )

    return {
        "recommended_loans": eligible_loans[:3]
    }

class LeadCapture(BaseModel):
    name: str
    email: str
    phone: str
    selected_loan: str

# 2. Skeleton Endpoints
@app.get("/")
def health_check():
    return {"status": "ok", "message": "Backend API is running"}

@app.post("/api/v1/extract-profile")
def extract_profile(payload: ProfileIntake):
    # Stubbed output: Will be connected to Pod 1's GenAI output
    return {
        "status": "success",
        "data": payload
    }



@app.post("/api/v1/leads")
def submit_lead(lead: LeadCapture):
    # Stubbed output: Will store leads in DB later
    return {
        "status": "success",
        "lead_id": "LEAD-9999",
        "message": "Lead captured successfully"
    }