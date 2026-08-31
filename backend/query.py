import os
import re
import json
import logging
from pathlib import Path
from typing import List, Dict, Any

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")

from sentence_transformers import SentenceTransformer

from db import get_conn

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# LLM provider — reads LLM_PROVIDER from env ("groq" or "openrouter", default groq)
# ---------------------------------------------------------------------------

# Default models for each provider
_GROQ_DEFAULT_MODEL       = "openai/gpt-oss-120b"
_OPENROUTER_DEFAULT_MODEL = "meta-llama/llama-3.1-8b-instruct:free"


def _get_api_key_and_model():
    """Get API key and model using app.config or environment variables."""
    provider = os.getenv("LLM_PROVIDER", "groq").lower()
    if provider == "openrouter":
        key = os.getenv("OPENROUTER_API_KEY")
        if not key:
            raise RuntimeError("OPENROUTER_API_KEY is not configured in backend/.env")
        model = os.getenv("OPENROUTER_MODEL", _OPENROUTER_DEFAULT_MODEL)
        return provider, key, model
    else:
        # Default groq
        try:
            from app.config import get_settings
            settings = get_settings()
            key = getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY")
            model = getattr(settings, "GROQ_MODEL", None) or os.getenv("GROQ_MODEL", _GROQ_DEFAULT_MODEL)
        except Exception:
            key = os.getenv("GROQ_API_KEY")
            model = os.getenv("GROQ_MODEL", _GROQ_DEFAULT_MODEL)

        if not key:
            raise RuntimeError(
                "GROQ_API_KEY is not configured. Please set GROQ_API_KEY in backend/.env"
            )
        if not model or model == "default":
            model = _GROQ_DEFAULT_MODEL
        return "groq", key, model


def _call_llm(messages: list) -> str:
    """Route to Groq or OpenRouter with clear error handling."""
    provider, key, model = _get_api_key_and_model()

    if provider == "openrouter":
        from openai import OpenAI
        client = OpenAI(
            api_key=key,
            base_url="https://openrouter.ai/api/v1",
        )
        response = client.chat.completions.create(
            model=model,
            temperature=0.0,
            messages=messages,
        )
    else:  # groq (default)
        from groq import Groq
        client = Groq(api_key=key)
        response = client.chat.completions.create(
            model=model,
            temperature=0.0,
            messages=messages,
        )

    return response.choices[0].message.content.strip()


# ---------------------------------------------------------------------------
# Embedder (lazy singleton)
# ---------------------------------------------------------------------------

_embedder = None

def get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        try:
            _embedder = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
        except Exception as exc:
            logger.warning("First attempt to load 'all-MiniLM-L6-v2' failed (%s), retrying...", exc)
            try:
                _embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", device="cpu")
            except Exception as retry_exc:
                logger.error("Failed to load sentence-transformers model 'all-MiniLM-L6-v2': %s", retry_exc)
                raise RuntimeError(
                    f"Embedding model 'all-MiniLM-L6-v2' failed to load. Check sentence-transformers installation and internet connectivity: {retry_exc}"
                ) from retry_exc
    return _embedder


# ---------------------------------------------------------------------------
# Retrieval
# ---------------------------------------------------------------------------

def retrieve(query: str, top_k: int = 5, loan_category: str = None) -> List[Dict[str, Any]]:
    """Cosine-similarity search over rag.chunks in Supabase pgvector.

    If loan_category is set but returns 0 chunks (e.g. no Gold Loan docs
    uploaded yet), automatically falls back to an unfiltered search so the
    user still gets a useful answer instead of a dead end.
    """
    embedder = get_embedder()
    q_vec = embedder.encode([query])[0].tolist()

    _UNFILTERED = """
        SELECT id, doc_id, doc_name, loan_category, section, page_number, content,
               1 - (embedding <=> %s::vector) AS similarity
        FROM rag.chunks
        ORDER BY embedding <=> %s::vector
        LIMIT %s;
    """

    with get_conn() as conn:
        with conn.cursor() as cur:
            if loan_category:
                from ingest import normalize_loan_category
                norm_cat = normalize_loan_category(loan_category)
                raw_pattern = f"%{loan_category}%"
                norm_pattern = f"%{norm_cat}%"
                cur.execute(
                    """
                    SELECT id, doc_id, doc_name, loan_category, section, page_number, content,
                           1 - (embedding <=> %s::vector) AS similarity
                    FROM rag.chunks
                    WHERE loan_category ILIKE %s OR loan_category ILIKE %s
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                    """,
                    (str(q_vec), raw_pattern, norm_pattern, str(q_vec), top_k),
                )
                rows = cur.fetchall()
                if rows:
                    return [dict(row) for row in rows]
                # No docs for this category — fall back to unfiltered search
                logger.warning(
                    "No chunks for loan_category=%r (norm=%r); retrying without filter.", loan_category, norm_cat
                )
                cur.execute(_UNFILTERED, (str(q_vec), str(q_vec), top_k))
            else:
                cur.execute(_UNFILTERED, (str(q_vec), str(q_vec), top_k))
            return [dict(row) for row in cur.fetchall()]


# ---------------------------------------------------------------------------
# Number verification
# ---------------------------------------------------------------------------

def extract_numbers(text: str) -> List[str]:
    """Extract all numeric tokens (amounts, percentages, years, etc.)."""
    return re.findall(r'[₹\$]?\d[\d,\.]*\s*(?:lakh|crore|%|years?|months?|p\.a\.)?', text, re.IGNORECASE)


def verify_numbers(answer: str, source_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Check that every number in the answer appears in at least one source chunk.
    Returns {numbers_verified: bool, unverified: [list of suspect numbers]}
    """
    source_text = " ".join(c["content"] for c in source_chunks)
    answer_numbers = extract_numbers(answer)
    unverified = [n for n in answer_numbers if n.strip() not in source_text]
    return {
        "numbers_verified": len(unverified) == 0,
        "unverified_numbers": unverified,
    }


# ---------------------------------------------------------------------------
# Profile normalisation
# ---------------------------------------------------------------------------

def _profile_for_prompt(profile: dict | None) -> dict:
    """Normalize saved, direct frontend, and database profile formats for the LLM prompt."""
    if not isinstance(profile, dict) or not profile:
        return {}

    # Unpack nested profile if present
    raw_loan_profile = profile.get("profile", profile)
    if not isinstance(raw_loan_profile, dict):
        raw_loan_profile = {}

    # Extract all known fields across different naming conventions
    monthly_income = (
        raw_loan_profile.get("monthly_income")
        or raw_loan_profile.get("income")
        or profile.get("monthly_income")
        or profile.get("income")
    )
    loan_amount = (
        raw_loan_profile.get("requested_loan_amount")
        or raw_loan_profile.get("loan_amount")
        or profile.get("requested_loan_amount")
        or profile.get("loan_amount")
    )
    tenure_months = (
        raw_loan_profile.get("preferred_tenure_months")
        or raw_loan_profile.get("tenure_months")
        or (raw_loan_profile.get("tenure_years") * 12 if raw_loan_profile.get("tenure_years") else None)
        or (profile.get("tenure_years") * 12 if profile.get("tenure_years") else None)
    )
    existing_emi = (
        raw_loan_profile.get("existing_emi_obligations")
        or raw_loan_profile.get("existing_emi")
        or profile.get("existing_emi_obligations")
        or profile.get("existing_emi")
        or 0.0
    )
    intent = (
        raw_loan_profile.get("intent")
        or profile.get("intent")
        or "General Loan Advisory"
    )
    employment_type = (
        raw_loan_profile.get("employment_type")
        or profile.get("employment_type")
    )
    credit_band = (
        raw_loan_profile.get("credit_score_band")
        or raw_loan_profile.get("credit_band")
        or profile.get("credit_score_band")
        or profile.get("credit_band")
    )
    urgency = (
        raw_loan_profile.get("urgency")
        or profile.get("urgency")
    )
    preferred_emi = (
        raw_loan_profile.get("preferred_emi")
        or profile.get("preferred_emi")
    )
    interest_type = (
        raw_loan_profile.get("interest_type")
        or profile.get("interest_type")
    )
    applicant_name = (
        raw_loan_profile.get("name")
        or raw_loan_profile.get("applicant_name")
        or profile.get("applicant_name")
        or profile.get("customer_name")
    )

    clean_profile = {}
    if applicant_name:
        clean_profile["applicant_name"] = applicant_name
    if intent:
        clean_profile["loan_category"] = str(intent).replace("_", " ").title()
    if monthly_income is not None and float(monthly_income) > 0:
        clean_profile["monthly_income_inr"] = float(monthly_income)
    if loan_amount is not None and float(loan_amount) > 0:
        clean_profile["requested_loan_amount_inr"] = float(loan_amount)
    if tenure_months is not None and int(tenure_months) > 0:
        clean_profile["preferred_tenure_months"] = int(tenure_months)
        clean_profile["preferred_tenure_years"] = round(int(tenure_months) / 12, 1)
    if existing_emi is not None:
        clean_profile["existing_monthly_emi_inr"] = float(existing_emi)
    if employment_type:
        clean_profile["employment_type"] = str(employment_type).replace("_", " ").title()
    if credit_band:
        clean_profile["credit_score_band"] = str(credit_band).title()
    if urgency:
        clean_profile["urgency"] = str(urgency).replace("_", " ").title()
    if preferred_emi:
        clean_profile["repayment_priority"] = str(preferred_emi).replace("_", " ").title()
    if interest_type:
        clean_profile["interest_rate_preference"] = str(interest_type).replace("_", " ").title()

    # Pass specific sub-profile fields if present
    for sub in ("home_loan_details", "vehicle_loan_details", "education_loan_details", "personal_loan_details", "business_loan_details"):
        if raw_loan_profile.get(sub):
            clean_profile[sub] = raw_loan_profile[sub]

    normalized = {
        "user_type": profile.get("user_type", raw_loan_profile.get("user_type", "guest")),
        "advisory_intake_answers": clean_profile,
    }

    selected_loan = profile.get("selected_loan")
    if isinstance(selected_loan, dict):
        normalized["selected_loan_product"] = selected_loan

    customer_context = profile.get("customer_context")
    if isinstance(customer_context, dict):
        normalized["customer_context"] = customer_context

    return normalized


# ---------------------------------------------------------------------------
# Grounded answer generation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are Cognis Bank's Loan Policy and Advisory Assistant. \
Your purpose is to answer customer questions with extreme accuracy, professionalism, and clarity, grounding your answers in the retrieved bank policy documents while personalizing guidance using the customer's advisory profile where relevant.

Rules you MUST follow:
1. Policy Grounding: Base all policy statements, interest rates, eligibility criteria, tenure limits, FOIR rules, and document requirements strictly on the retrieved policy excerpts provided. Do not invent bank rules.
2. Cross-Loan Flexibility: The customer's advisory profile (e.g. "Home Loan") reflects the loan they were researching, NOT a restriction on what they can ask. They may ask about ANY loan product (Education, Car, Business, Gold, Personal, etc.) and you MUST answer fully using the retrieved excerpts for that product. Never refuse to answer a policy question about a different loan type.
3. Advisory Personalisation: The "Verified Advisory Intake Answers" contain the customer's real financial details (monthly income, existing EMIs, employment type, credit band, requested amount). Actively use these to personalise answers whenever relevant:
   - For Eligibility Questions: Evaluate their income, requested amount, and obligations against the policy criteria from the excerpts — for whichever loan product they are asking about.
   - For Tenure / EMI Questions: Compare their preferences against policy limits from the excerpts.
   - For Documentation Questions: Tailor requirements to their employment type (Salaried vs Self-Employed).
4. If Policy Information is Missing: If the retrieved excerpts do not contain sufficient information to answer, say: "I could not find this specific detail in our available policy documents, but our branch loan officers can assist during formal processing."
5. Tone & Formatting:
   - Use clear, structured Markdown with bold key terms, readable bullet points, and clean sections.
   - Speak like a professional retail lending advisor: empathetic, clear, objective, and transparent.
6. Accuracy Guarantee: Never assume or hallucinate missing data. If a profile field is not provided, state the general policy and invite the borrower to provide that detail."""


def answer(query: str, loan_category: str = None, top_k: int = 5, profile: dict = None) -> Dict[str, Any]:
    """
    Retrieve relevant chunks and generate a grounded answer.
    Returns answer text + source metadata + number verification.
    """
    chunks = retrieve(query, top_k=top_k, loan_category=loan_category)

    if not chunks:
        return {
            "answer": "I could not find this information in the available bank policy documents.",
            "sources": [],
            "numbers_verified": True,
            "unverified_numbers": [],
            "grounded_on_chunk_ids": [],
        }

    # Build context block for the LLM
    context_parts = []
    for c in chunks:
        context_parts.append(
            f"[Source: {c['doc_name']} | Section: {c['section']} | Page: {c['page_number']}]\n"
            f"{c['content']}"
        )
    context = "\n\n---\n\n".join(context_parts)

    profile_context = ""
    normalized_profile = _profile_for_prompt(profile)
    if normalized_profile:
        profile_context = (
            "Verified Advisory Profile (treat these as facts, not policy excerpts):\n"
            f"{json.dumps(normalized_profile, indent=2)}\n\n"
        )

    user_message = f"{profile_context}Retrieved policy excerpts:\n\n{context}\n\nQuestion: {query}"

    answer_text = _call_llm([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": user_message},
    ])

    # Number verification
    verification = verify_numbers(answer_text, chunks)

    sources = [
        {
            "chunk_id":     c["id"],
            "doc_id":       c["doc_id"],
            "doc_name":     c["doc_name"],
            "loan_category": c["loan_category"],
            "section":      c["section"],
            "page_number":  c["page_number"],
            "similarity":   round(float(c["similarity"]), 4),
            "content":      c["content"],
        }
        for c in chunks
    ]

    return {
        "answer":               answer_text,
        "sources":              sources,
        "numbers_verified":     verification["numbers_verified"],
        "unverified_numbers":   verification["unverified_numbers"],
        "grounded_on_chunk_ids": [c["id"] for c in chunks],
    }
