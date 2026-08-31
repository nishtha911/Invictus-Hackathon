# /backend/app/schemas/chat.py
"""
Chat interface schemas — what the frontend sends/receives.
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field

class UIComponentType(str, Enum):
    MCQ = "mcq"
    SLIDER = "slider"
    NUMBER_INPUT = "number_input"
    TEXT_INPUT = "text_input"
    YES_NO = "yes_no"
    INFO_CARD = "info_card"

class UIComponent(BaseModel):
    """Defines what interactive element the frontend should render."""

    type: UIComponentType
    options: Optional[list[dict[str, str]]] = None  # For MCQ: [{"label": "...", "value": "..."}]
    min_value: Optional[float] = None  # For slider/number
    max_value: Optional[float] = None
    step: Optional[float] = None
    unit: Optional[str] = None  # e.g. "₹", "months", "years"
    placeholder: Optional[str] = None
    default_value: Optional[Any] = None

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str
    ui_component: Optional[UIComponent] = None
    field_target: Optional[str] = None  # Which profile field this question fills
    metadata: Optional[dict[str, Any]] = None

class ChatRequest(BaseModel):
    session_id: str
    user_type: str = "guest"
    message: str  # User's answer
    field_target: Optional[str] = None  # Which field the answer is for

class SessionState(BaseModel):
    """Returned to frontend so it knows current extraction progress."""

    session_id: str
    completeness_pct: int
    fields_filled: list[str]
    is_complete: bool
    current_phase: str  # e.g. "loan_type", "income", "credit", "complete"

class ChatResponse(BaseModel):
    session_id: str
    messages: list[ChatMessage]  # Can be multiple (e.g. acknowledgment + next question)
    session_state: SessionState
    extracted_profile: Optional[dict] = None  # Sent when extraction is complete