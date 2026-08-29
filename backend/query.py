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
_GROQ_DEFAULT_MODEL       = "llama-3.3-70b-versatile"
_OPENROUTER_DEFAULT_MODEL = "meta-llama/llama-3.1-8b-instruct:free"


def _call_llm(messages: list) -> str:
    """Route to Groq or OpenRouter based on LLM_PROVIDER env var."""
    provider = os.getenv("LLM_PROVIDER", "groq").lower()

    if provider == "openrouter":
        from openai import OpenAI
        client = OpenAI(
            api_key=os.environ["OPENROUTER_API_KEY"],
            base_url="https://openrouter.ai/api/v1",
        )
        model = os.getenv("OPENROUTER_MODEL", _OPENROUTER_DEFAULT_MODEL)
        response = client.chat.completions.create(
            model=model,
            temperature=0.0,
            messages=messages,
        )
    else:  # groq (default)
        from groq import Groq
        client = Groq(api_key=os.environ["GROQ_API_KEY"])
        model = os.getenv("GROQ_MODEL", _GROQ_DEFAULT_MODEL)
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
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
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
                cur.execute(
                    """
                    SELECT id, doc_id, doc_name, loan_category, section, page_number, content,
                           1 - (embedding <=> %s::vector) AS similarity
                    FROM rag.chunks
                    WHERE loan_category ILIKE %s
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                    """,
                    (str(q_vec), f"%{loan_category}%", str(q_vec), top_k),
                )
                rows = cur.fetchall()
                if rows:
                    return [dict(row) for row in rows]
                # No docs for this category — fall back to unfiltered search
                logger.warning(
                    "No chunks for loan_category=%r; retrying without filter.", loan_category
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
    """Normalize saved and direct frontend profile formats for the LLM."""
    if not isinstance(profile, dict):
        return {}

    loan_profile = profile.get("profile", profile)
    if not isinstance(loan_profile, dict):
        loan_profile = {}

    normalized = {
        "user_type": profile.get("user_type", loan_profile.get("user_type", "new")),
        "loan_profile": loan_profile,
    }

    selected_loan = profile.get("selected_loan")
    # Only include selected_loan when it matches the current intent so a stale
    # Home Loan result does not colour a Gold Loan answer.
    if (
        isinstance(selected_loan, dict)
        and selected_loan.get("category") == loan_profile.get("intent")
    ):
        normalized["selected_loan"] = selected_loan

    customer_context = profile.get("customer_context")
    if isinstance(customer_context, dict):
        normalized["customer_context"] = customer_context

    return normalized


# ---------------------------------------------------------------------------
# Grounded answer generation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a friendly and expert Bank Loan Policy Assistant. \
Your goal is to answer the user's question accurately and helpfully, using ONLY the retrieved bank policy excerpts provided below.

Rules you MUST follow:
1. Base your answer strictly on the provided policy excerpts. Do not use outside knowledge.
2. If the excerpts do not contain enough information to answer, say exactly:
   "I could not find this information in the available bank policy documents."
3. Format your response beautifully using Markdown: use bolding for key parameters, bullet points for lists, and headers if organizing multiple points.
4. Structure the response to be highly readable, conversational, and clear, like a helpful bank support assistant.
5. If multiple policies or values apply, clearly state them and mention the source document they come from.
6. Policy figures, rates, limits, and requirements must match the retrieved excerpts exactly. Values in the "Verified Advisory Profile" are user-supplied facts and may be repeated, but you must not invent a calculation or a missing profile value.
7. Use every relevant field from the Verified Advisory Profile. Never say a field is "not provided" when it appears there. If the credit field is "Not Sure / New to Credit", say the credit score is unknown and state that any policy score threshold cannot yet be confirmed.
8. Never write "assumed", infer eligibility from employment or income alone, or claim the user is eligible unless every policy criterion required for that claim is both present in the profile and satisfied. Clearly identify outstanding checks.
9. When the profile has a requested tenure, mention it for eligibility, tenure, or product-fit questions. Compare it with a policy tenure limit only when that limit appears in a retrieved excerpt."""


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
