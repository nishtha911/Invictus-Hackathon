# /backend/app/services/llm.py
"""
Groq LLM client — single point of LLM interaction.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from app.config import get_settings

logger = logging.getLogger(__name__)

def get_llm(temperature: float = 0.1) -> ChatGroq:
    """Return a configured Groq LLM instance."""
    settings = get_settings()
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.GROQ_MODEL,
        temperature=temperature,
        max_tokens=1024,
    )

def extract_json_from_llm(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.0,
) -> Optional[dict[str, Any]]:
    """
    Call the LLM expecting a JSON response. Parse and return it.
    Returns None if parsing fails.
    """
    llm = get_llm(temperature=temperature)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    try:
        response = llm.invoke(messages)
        content = response.content.strip()

        # Try to extract JSON from markdown code blocks
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        return json.loads(content)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM JSON response: {e}\nContent: {content}")
        return None
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return None

def generate_conversational_response(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
) -> str:
    """Call the LLM for a natural-language conversational response."""
    llm = get_llm(temperature=temperature)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    try:
        response = llm.invoke(messages)
        return response.content.strip()
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return "I apologize, but I'm having trouble processing that. Could you try again?"