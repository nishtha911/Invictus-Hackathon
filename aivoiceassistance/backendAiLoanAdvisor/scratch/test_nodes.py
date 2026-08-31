import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))
from app.graph.nodes import extract_income_employment_node
from app.graph.state import AdvisoryState
from app.schemas.profile import ProfileData, EmploymentType, LoanIntent
from dotenv import load_dotenv

load_dotenv("backend/.env")

state = AdvisoryState(session_id="test")
state.profile = ProfileData()
state.profile.intent = LoanIntent.BUSINESS_LOAN
state.profile.employment_type = EmploymentType.BUSINESS_OWNER
state.profile.monthly_income = 5000000.0
state.current_user_input = "36"

try:
    state = extract_income_employment_node(state)
    print("SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
from app.graph.state import compute_completeness
from app.schemas.profile import ExtractedProfile, ExtractionMeta
from datetime import datetime

pct, filled, remaining = compute_completeness(state.profile)
print("Completeness:", pct)
extracted = ExtractedProfile(
    session_id=state.session_id,
    user_type=state.user_type,
    profile=state.profile,
    extraction_meta=ExtractionMeta(
        completeness_pct=pct,
        turns_taken=state.turn_count,
        model="llama3",
        extracted_at=datetime.utcnow(),
        fields_filled=filled,
        fields_remaining=remaining,
    ),
).model_dump(mode="json")
print("DUMP SUCCESS")
from app.main import _state_to_response
response = _state_to_response(state)
print("RESPONSE SUCCESS")
