# schemas.py
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class ProfileData(BaseModel):
    intent: Literal["home_loan", "personal_loan", "vehicle_loan", "education_loan", "business_loan"]
    monthly_income: float = Field(..., description="Monthly net income in INR")
    employment_type: Literal["salaried", "self_employed", "business_owner"]
    requested_loan_amount: float = Field(..., description="Loan amount requested in INR")
    preferred_tenure_months: int = Field(..., description="Tenure in months")
    existing_emi_obligations: float = Field(default=0.0, description="Monthly existing EMIs in INR")
    credit_score_band: Literal["unknown", "poor", "fair", "good", "excellent"] = "unknown"
    urgency: Literal["immediate", "within_3_months", "exploring"] = "exploring"
    home_loan_details: Optional[Dict[str, Any]] = None
    vehicle_loan_details: Optional[Dict[str, Any]] = None
    business_loan_details: Optional[Dict[str, Any]] = None

class ExtractionMeta(BaseModel):
    completeness_pct: int = Field(..., ge=0, le=100)
    turns_taken: int
    model: str = "llama-3.3-70b-versatile"
    extracted_at: datetime = Field(default_factory=datetime.utcnow)

class ExtractedProfilePayload(BaseModel):
    session_id: str
    user_type: Literal["guest", "existing_customer"] = "guest"
    profile: ProfileData
    extraction_meta: ExtractionMeta

class ComputedTerms(BaseModel):
    interest_rate_pct: float
    tenure_months: int
    estimated_emi: float
    eligibility_status: Literal["eligible", "conditionally_eligible", "not_eligible"]

class AIExplanation(BaseModel):
    summary_text: str
    grounded_on_chunk_ids: List[str]
    numbers_verified: bool

class ProductRecommendation(BaseModel):
    product_id: str
    product_name: str
    match_score: float = Field(..., ge=0.0, le=1.0)
    computed_terms: ComputedTerms
    ai_explanation: AIExplanation

class RecommendationResponse(BaseModel):
    session_id: str
    recommendations: List[ProductRecommendation]
    generated_at: datetime = Field(default_factory=datetime.utcnow)