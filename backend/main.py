from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Bank GenAI Loan Advisory Backend")

# 1. Pydantic Schemas (Contracts)
class ProfileIntake(BaseModel):
    user_type: str                  # "new" or "existing"
    income: Optional[float] = 0.0
    loan_amount: Optional[float] = 0.0
    intent: Optional[str] = None    # e.g., "Home Loan", "Personal"

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

@app.post("/api/v1/recommend-loans")
def recommend_loans(profile: ProfileIntake):
    # Stubbed output: Temporary response for frontend testing
    return {
        "recommended_loans": [
            {
                "loan_id": "L-101",
                "name": "Standard Personal Loan",
                "max_amount": 500000,
                "interest_rate": 10.5,
                "reasoning": "Fits current income level."
            }
        ]
    }

@app.post("/api/v1/leads")
def submit_lead(lead: LeadCapture):
    # Stubbed output: Will store leads in DB later
    return {
        "status": "success",
        "lead_id": "LEAD-9999",
        "message": "Lead captured successfully"
    }