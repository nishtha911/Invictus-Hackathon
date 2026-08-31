import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(backend_dir / "app"))

from query import _profile_for_prompt

# Test profile normalization with sample user advisory answers
sample_advisory_profile = {
    "user_type": "guest",
    "profile": {
        "applicant_name": "Rahul Sharma",
        "intent": "home_loan",
        "monthly_income": 85000,
        "requested_loan_amount": 4500000,
        "preferred_tenure_months": 240,
        "existing_emi_obligations": 12000,
        "employment_type": "salaried",
        "credit_score_band": "good",
        "urgency": "immediate"
    }
}

normalized = _profile_for_prompt(sample_advisory_profile)
print("Normalized Profile Output:")
import json
print(json.dumps(normalized, indent=2))

assert "advisory_intake_answers" in normalized
assert normalized["advisory_intake_answers"]["monthly_income_inr"] == 85000
assert normalized["advisory_intake_answers"]["requested_loan_amount_inr"] == 4500000
assert normalized["advisory_intake_answers"]["employment_type"] == "Salaried"
print("\nAll normalization assertions passed successfully!")
