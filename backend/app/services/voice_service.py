# /backend/app/services/voice_service.py
"""
Browser-based AI voice call service.

The "call" runs entirely in the banker's browser:
  - Speech-to-text  -> Web Speech API (browser, free)
  - Text-to-speech  -> ElevenLabs if a key is set, else the browser's speechSynthesis (free)
  - Conversation    -> Groq LLM (this module)

No telephony provider, no phone number, no PSTN. This module only supplies the
LLM turns + post-call analysis, and logs calls to Supabase (best-effort).

Merged in from the former `aivoiceassistance/` prototype.
"""
from __future__ import annotations

import json
import logging
import os
import re
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_INTENTS = [
    "INTERESTED", "NOT_INTERESTED", "NEEDS_TIME", "CALLBACK_REQUESTED",
    "READY_TO_APPLY", "APPLICATION_IN_PROGRESS", "UNKNOWN",
]
_SENTIMENTS = ["POSITIVE", "NEUTRAL", "NEGATIVE"]

# In-memory log so the dashboard has data even without Supabase.
VOICE_CALL_STORE: List[Dict[str, Any]] = []


# ─────────────────────────────────────────────────────────────────────────────
#  LLM plumbing (reuses the Groq client / model resolution from query.py)
# ─────────────────────────────────────────────────────────────────────────────
# Voice turns need low latency. Preference order — the first that the account
# can actually serve is used and cached. Override the top pick via VOICE_MODEL.
_VOICE_MODEL_CANDIDATES = [
    m for m in [
        os.environ.get("VOICE_MODEL"),
        "qwen/qwen3.8-27b",       # fastest clean-JSON chat model on our Groq plan
        "openai/gpt-oss-20b",
        "openai/gpt-oss-120b",
        "llama-3.1-8b-instant",   # if the plan ever gains llama access
    ] if m
]
_VOICE_TIMEOUT_S = float(os.environ.get("VOICE_LLM_TIMEOUT", "8"))
_resolved_voice_model: Optional[str] = None
_BAD_MODEL_MARKERS = ("does not exist", "model_not_found", "decommissioned", "not found")


def _groq_chat(messages: List[Dict[str, str]], *, json_mode: bool = False,
               temperature: float = 0.4, max_tokens: int = 320) -> Optional[str]:
    """Best-effort Groq call. Returns None on any failure so callers can fall back."""
    global _resolved_voice_model
    try:
        from query import _get_api_key_and_model
        provider, key, global_model = _get_api_key_and_model()
    except Exception as exc:  # no key configured
        logger.info("Voice LLM unavailable (%s)", exc)
        return None

    if provider == "openrouter":
        candidates = [global_model]
    elif _resolved_voice_model:
        candidates = [_resolved_voice_model]
    else:
        candidates = _VOICE_MODEL_CANDIDATES + [global_model]

    for model in candidates:
        if not model:
            continue
        try:
            is_reasoning = "gpt-oss" in model
            kwargs: Dict[str, Any] = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens * 6 if is_reasoning else max_tokens,
            }
            if is_reasoning:
                kwargs["reasoning_effort"] = "low"
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}

            if provider == "openrouter":
                from openai import OpenAI
                client = OpenAI(api_key=key, base_url="https://openrouter.ai/api/v1",
                                timeout=_VOICE_TIMEOUT_S, max_retries=0)
            else:
                from groq import Groq
                client = Groq(api_key=key, timeout=_VOICE_TIMEOUT_S, max_retries=0)

            resp = client.chat.completions.create(**kwargs)
            content = (resp.choices[0].message.content or "").strip()
            if content:
                if provider == "groq":
                    _resolved_voice_model = model  # cache the working model
                return content
            logger.warning("Voice LLM %s returned empty content", model)
        except Exception as exc:
            msg = str(exc).lower()
            if any(k in msg for k in _BAD_MODEL_MARKERS):
                logger.warning("Voice model %s unavailable, trying next candidate", model)
                continue
            logger.warning("Voice LLM call failed (%s): %s", model, exc)
            return None
    return None


def _safe_json(text: Optional[str]) -> Optional[dict]:
    """Tolerant JSON extraction: raw, fenced, or the first balanced object."""
    if not text:
        return None
    candidates = [text.strip()]
    fence = re.search(r"```(?:json)?\s*(.+?)\s*```", text, re.DOTALL)
    if fence:
        candidates.append(fence.group(1).strip())
    brace = re.search(r"\{.*\}", text, re.DOTALL)
    if brace:
        candidates.append(brace.group(0))
    # progressively trim trailing junk after the last closing brace
    if "}" in text:
        candidates.append(text[: text.rfind("}") + 1][text.find("{"):] if "{" in text else "")
    for c in candidates:
        if not c:
            continue
        try:
            data = json.loads(c)
            if isinstance(data, dict):
                return data
        except (json.JSONDecodeError, ValueError):
            continue
    return None


# ─────────────────────────────────────────────────────────────────────────────
#  Call context
# ─────────────────────────────────────────────────────────────────────────────
def build_call_context(lead: Dict[str, Any]) -> Dict[str, Any]:
    """Normalise a dashboard lead / profile dict into a call context."""
    lead = lead or {}
    name = (
        lead.get("customer_name") or lead.get("name")
        or lead.get("full_name") or "there"
    )
    amount = lead.get("requested_amount") or lead.get("loan_amount") or lead.get("requested_loan_amount") or 0
    try:
        amount = float(amount or 0)
    except (TypeError, ValueError):
        amount = 0.0
    return {
        "lead_id": str(lead.get("id") or lead.get("lead_id") or ""),
        "name": name,
        "phone": lead.get("phone") or "",
        "loan_type": lead.get("loan_category") or lead.get("product_name") or "loan",
        "loan_amount": amount,
        "emi": lead.get("estimated_emi") or 0,
        "status": lead.get("status") or "New",
        "briefing": lead.get("ai_briefing") or "",
    }


def _amount_str(v: Any) -> str:
    try:
        return f"₹{float(v):,.0f}"
    except (TypeError, ValueError):
        return str(v)


# ─────────────────────────────────────────────────────────────────────────────
#  Turn 0 — opening line
# ─────────────────────────────────────────────────────────────────────────────
def generate_opening_line(context: Dict[str, Any]) -> str:
    name = context["name"]
    loan = context["loan_type"]
    amt = _amount_str(context["loan_amount"])
    system = (
        "You are Alex, a warm, professional relationship manager at Cognis Bank making a "
        "friendly follow-up call to someone who showed interest in a loan on the bank's "
        f"website. Greet {name} by name, say you're calling about their interest in a {loan} "
        f"of {amt}, and ask if it's a good time for a quick chat. Exactly two short, natural "
        "sentences. Do NOT mention documents, links, or portals."
    )
    out = _groq_chat(
        [{"role": "system", "content": system},
         {"role": "user", "content": f"Opening greeting for {name}."}],
        temperature=0.5, max_tokens=200,
    )
    out = (out or "").strip().strip('"')
    if len(out) > 40 and out[-1] in ".?!":
        return out
    return (
        f"Hi {name}, this is Alex from Cognis Bank. I'm calling about your interest in a "
        f"{loan} of {amt} — is now a good time for a quick chat?"
    )


# ─────────────────────────────────────────────────────────────────────────────
#  Per-turn reply
# ─────────────────────────────────────────────────────────────────────────────
def _last_assistant_line(history: List[Dict[str, str]]) -> str:
    for t in reversed(history or []):
        if t.get("role") == "assistant":
            return (t.get("text") or t.get("content") or "").strip()
    return ""


def generate_turn(context: Dict[str, Any], history: List[Dict[str, str]],
                  user_speech: str) -> Dict[str, Any]:
    name = context["name"]
    loan = context["loan_type"]
    amt = _amount_str(context["loan_amount"])
    prev = _last_assistant_line(history)

    system = f"""You are Alex, a warm, upbeat relationship manager at Cognis Bank on a short
follow-up phone call with {name}, who showed interest in a {loan} of {amt} on the bank's website.

YOUR GOAL: keep it light and conversational, gauge how interested they are, answer any quick
questions at a high level, and — if they're keen — tell them a loan officer will call to take
it forward. This is a friendly check-in, NOT a processing call.

HARD RULES:
- NEVER talk about documents, bank statements, upload links, portals, or paperwork. If they
  bring it up, just say their dedicated loan officer will guide them through everything.
- NEVER repeat your previous sentence. Your last line was: "{prev or '(this is the first reply)'}".
  Always move the conversation forward with something new.
- At most 2 short spoken sentences. Sound like a real person, not a script.

HOW TO RESPOND:
- Greeting / "hello" / "yes" / small talk  -> thank them and ask if they're looking to move
  ahead with the {loan} soon or still comparing options. intent = INTERESTED
- Keen / "yes I want to proceed" / "go ahead" / "what next"  -> "That's great. I'll mark your
  file as a priority and one of our loan officers will call you within a business day to walk
  you through the next steps and lock in your rate." intent = READY_TO_APPLY
- Asks about rate / EMI / eligibility  -> "For a {loan} of {amt}, our rates currently start
  around 8.4% per annum, and your officer will confirm the exact figure for your profile."
  intent = INTERESTED
- Asks about timeline / "when will I get the funds"  -> "Once your application is in, funds
  are usually disbursed within a few working days." intent = INTERESTED
- Wants to talk later / busy / "call me in the evening"  -> agree warmly, ask what time suits.
  intent = NEEDS_TIME
- Wants a human / manager  -> "Of course, I'll have a senior loan officer call you back shortly."
  intent = CALLBACK_REQUESTED, requires_human = true
- Not interested / "no thanks"  -> "No problem at all, thanks for your time. We won't follow up
  unless you reach out to us." intent = NOT_INTERESTED
- Anything unclear  -> a warm one-liner that gently moves toward: would they like to proceed,
  or do they have any questions. intent = INTERESTED

Return ONLY valid JSON:
{{"speech_reply": "...", "extracted_intent": "INTERESTED|NOT_INTERESTED|NEEDS_TIME|CALLBACK_REQUESTED|READY_TO_APPLY|UNKNOWN", "requires_human": false}}"""

    msgs: List[Dict[str, str]] = [{"role": "system", "content": system}]
    for t in history or []:
        role = "assistant" if t.get("role") == "assistant" else "user"
        msgs.append({"role": role, "content": t.get("text") or t.get("content") or ""})
    if user_speech:
        msgs.append({"role": "user", "content": user_speech})

    parsed = _safe_json(_groq_chat(msgs, json_mode=True, temperature=0.6, max_tokens=260))
    if parsed and parsed.get("speech_reply"):
        reply = str(parsed["speech_reply"]).strip()
        # Anti-loop guard: if the model echoed its last line, nudge forward.
        if prev and _similar(reply, prev):
            return {"speech_reply": f"Understood. Would you like to go ahead with the {loan}, or is there anything you'd like me to clarify first?",
                    "intent": "INTERESTED", "requires_human": False}
        intent = str(parsed.get("extracted_intent", "INTERESTED")).upper()
        return {
            "speech_reply": reply,
            "intent": intent if intent in _INTENTS else "INTERESTED",
            "requires_human": bool(parsed.get("requires_human")),
        }
    return _fallback_turn(context, history, user_speech)


def _similar(a: str, b: str) -> bool:
    a2 = re.sub(r"[^a-z0-9 ]", "", a.lower()).strip()
    b2 = re.sub(r"[^a-z0-9 ]", "", b.lower()).strip()
    return a2 == b2 or (len(a2) > 20 and (a2 in b2 or b2 in a2))


def _fallback_turn(context: Dict[str, Any], history: List[Dict[str, str]],
                   user_speech: str) -> Dict[str, Any]:
    t = (user_speech or "").lower()
    loan = context["loan_type"]
    amt = _amount_str(context["loan_amount"])
    prev = _last_assistant_line(history)

    def out(reply: str, intent: str = "INTERESTED", human: bool = False) -> Dict[str, Any]:
        if prev and _similar(reply, prev):
            reply = f"Understood. Shall I go ahead and have a loan officer call you to take your {loan} forward?"
            intent = "INTERESTED"
        return {"speech_reply": reply, "intent": intent, "requires_human": human}

    if any(w in t for w in ("evening", "morning", "afternoon", "later", "busy", "call me back", "tomorrow", "not now")):
        return out("Of course — what time would suit you best?", "NEEDS_TIME")
    if any(w in t for w in ("manager", "human", "officer", "speak to a person", "real person")):
        return out("Of course, I'll have a senior loan officer call you back shortly.", "CALLBACK_REQUESTED", True)
    if any(w in t for w in ("not interested", "cancel", "no thanks", "don't want", "stop calling")):
        return out("No problem at all, thanks for your time. We won't follow up unless you reach out to us.", "NOT_INTERESTED")
    if any(w in t for w in ("rate", "interest", "emi", "how much", "cost")):
        return out(f"For a {loan} of {amt}, our rates currently start around 8.4% per annum, and your officer will confirm the exact figure for your profile.")
    if any(w in t for w in ("when", "how long", "timeline", "disburse", "get the money", "funds")):
        return out("Once your application is in, funds are usually disbursed within a few working days.")
    if any(w in t for w in ("yes", "sure", "go ahead", "proceed", "interested", "sounds good", "okay let", "what next", "next step")):
        return out(f"That's great to hear. I'll flag your file as a priority and one of our loan officers will call you within a business day to walk you through the next steps.", "READY_TO_APPLY")
    if any(w in t for w in ("document", "statement", "link", "upload", "paperwork")):
        return out("No need to worry about any of that now — your dedicated loan officer will guide you through everything when they call.")
    # greeting / acknowledgement / unclear
    return out(f"Thanks for taking the call. Are you looking to move ahead with the {loan} soon, or still weighing your options?")


# ─────────────────────────────────────────────────────────────────────────────
#  Post-call analysis
# ─────────────────────────────────────────────────────────────────────────────
def analyze_transcript(context: Dict[str, Any], transcript: List[Dict[str, str]]) -> Dict[str, Any]:
    lines = "\n".join(
        f"{('Alex' if t.get('role') == 'assistant' else context['name'])}: {t.get('text') or t.get('content') or ''}"
        for t in (transcript or [])
    )
    system = (
        "You are a sales analyst for a bank. Analyse this short follow-up call between Alex "
        "(Cognis Bank relationship manager) and a prospective borrower. Judge how interested "
        "the customer is and what the next step should be. Return ONLY valid JSON: "
        '{"summary": "1-2 sentences on how the call went and the customer\'s interest level", '
        '"intent": "INTERESTED|NOT_INTERESTED|NEEDS_TIME|CALLBACK_REQUESTED|READY_TO_APPLY|UNKNOWN", '
        '"sentiment": "POSITIVE|NEUTRAL|NEGATIVE", "outcome": "FOLLOW_UP_REQUIRED|COMPLETED|ESCALATED_TO_HUMAN|UNREACHABLE", '
        '"next_action": "one concrete next step for the loan officer", "follow_up_required": true, "requires_human": false}'
    )
    parsed = _safe_json(_groq_chat(
        [{"role": "system", "content": system},
         {"role": "user", "content": f"Customer: {context['name']} | Loan: {context['loan_type']}\n\nTranscript:\n{lines or '(no transcript)'}"}],
        json_mode=True, temperature=0.2, max_tokens=280,
    ))
    if parsed and parsed.get("summary"):
        intent = str(parsed.get("intent", "INTERESTED")).upper()
        sentiment = str(parsed.get("sentiment", "NEUTRAL")).upper()
        return {
            "summary": str(parsed["summary"]).strip(),
            "intent": intent if intent in _INTENTS else "INTERESTED",
            "sentiment": sentiment if sentiment in _SENTIMENTS else "NEUTRAL",
            "outcome": str(parsed.get("outcome", "FOLLOW_UP_REQUIRED")),
            "next_action": str(parsed.get("next_action", "Follow up with the customer as planned.")),
            "follow_up_required": bool(parsed.get("follow_up_required", True)),
            "requires_human": bool(parsed.get("requires_human", False)),
        }
    return _fallback_analysis(context, lines)


def _fallback_analysis(context: Dict[str, Any], transcript_text: str) -> Dict[str, Any]:
    t = (transcript_text or "").lower()
    if "not interested" in t or "cancel" in t:
        intent, sentiment, human = "NOT_INTERESTED", "NEGATIVE", False
        nxt = "Mark not interested; pause automated follow-ups."
    elif any(w in t for w in ("manager", "human", "officer")):
        intent, sentiment, human = "CALLBACK_REQUESTED", "NEUTRAL", True
        nxt = "Route to a human loan officer for a manual call-back."
    elif any(w in t for w in ("evening", "later", "busy", "tomorrow")):
        intent, sentiment, human = "NEEDS_TIME", "NEUTRAL", False
        nxt = "Re-attempt the call at the customer's preferred time."
    elif any(w in t for w in ("go ahead", "proceed", "what next", "next step", "yes")):
        intent, sentiment, human = "READY_TO_APPLY", "POSITIVE", False
        nxt = "Priority follow-up: a loan officer should call within a business day to finalise."
    else:
        intent, sentiment, human = "INTERESTED", "POSITIVE", False
        nxt = "Have a loan officer call the customer to take the application forward."
    return {
        "summary": f"Call with {context['name']} about their {context['loan_type']} completed. Customer appears {intent.lower().replace('_', ' ')}.",
        "intent": intent, "sentiment": sentiment, "outcome": "ESCALATED_TO_HUMAN" if human else "FOLLOW_UP_REQUIRED",
        "next_action": nxt, "follow_up_required": intent != "NOT_INTERESTED", "requires_human": human,
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Text-to-speech (optional — ElevenLabs)
# ─────────────────────────────────────────────────────────────────────────────
def synthesize_speech(text: str) -> Optional[bytes]:
    api_key = os.environ.get("ELEVENLABS_API_KEY", "")
    if not api_key or "your_" in api_key:
        return None
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
    try:
        import httpx
        r = httpx.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={"xi-api-key": api_key, "Content-Type": "application/json"},
            json={"text": text, "model_id": "eleven_turbo_v2_5",
                  "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}},
            timeout=20,
        )
        if r.status_code == 200:
            return r.content
        logger.warning("ElevenLabs TTS %s: %s", r.status_code, r.text[:200])
    except Exception as exc:
        logger.warning("ElevenLabs TTS failed: %s", exc)
    return None


# ─────────────────────────────────────────────────────────────────────────────
#  Call log persistence
# ─────────────────────────────────────────────────────────────────────────────
def log_call(context: Dict[str, Any], transcript: List[Dict[str, str]],
             duration: int, analysis: Dict[str, Any]) -> Dict[str, Any]:
    record = {
        "call_id": f"CALL-{uuid.uuid4().hex[:8].upper()}",
        "lead_id": context.get("lead_id") or None,
        "customer_name": context["name"],
        "phone": context.get("phone") or "",
        "loan_type": context["loan_type"],
        "loan_amount": context.get("loan_amount") or 0,
        "direction": "OUTBOUND",
        "channel": "browser",
        "duration_seconds": int(duration or 0),
        "transcript": transcript or [],
        "summary": analysis.get("summary"),
        "intent": analysis.get("intent"),
        "sentiment": analysis.get("sentiment"),
        "outcome": analysis.get("outcome"),
        "next_action": analysis.get("next_action"),
        "requires_human": analysis.get("requires_human", False),
        "follow_up_at": (datetime.utcnow() + timedelta(days=2)).isoformat()
        if analysis.get("follow_up_required") else None,
        "created_at": datetime.utcnow().isoformat(),
    }
    VOICE_CALL_STORE.append(record)

    # Best-effort persistence to Supabase (table optional).
    try:
        from app.services.database import supabase
        if supabase is not None:
            row = {k: v for k, v in record.items() if k != "transcript"}
            row["transcript"] = json.dumps(record["transcript"])
            supabase.table("voice_calls").insert(row).execute()
    except Exception as exc:
        logger.info("voice_calls Supabase insert skipped: %s", exc)

    return record


def list_calls() -> List[Dict[str, Any]]:
    calls = list(VOICE_CALL_STORE)
    try:
        from app.services.database import supabase
        if supabase is not None:
            res = supabase.table("voice_calls").select("*").order("created_at", desc=True).limit(50).execute()
            seen = {c["call_id"] for c in calls}
            for row in (res.data or []):
                if row.get("call_id") not in seen:
                    if isinstance(row.get("transcript"), str):
                        try:
                            row["transcript"] = json.loads(row["transcript"])
                        except json.JSONDecodeError:
                            row["transcript"] = []
                    calls.append(row)
    except Exception as exc:
        logger.info("voice_calls Supabase read skipped: %s", exc)
    calls.sort(key=lambda c: c.get("created_at", ""), reverse=True)
    return calls
