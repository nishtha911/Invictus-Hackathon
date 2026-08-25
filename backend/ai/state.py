from typing import TypedDict, List
from langchain_core.messages import BaseMessage

class ExtractedProfile(TypedDict, total=False):
    intent: str
    income: float
    loan_amount: float

class AgentState(TypedDict):
    messages: List[BaseMessage]
    extracted_profile: ExtractedProfile
