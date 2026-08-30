import json
import logging
from typing import Any, Dict, List

from query import retrieve, _call_llm, verify_numbers, SYSTEM_PROMPT

logger = logging.getLogger(__name__)


def _safe_parse_json(text: str) -> Any:
    """Try to extract a JSON object from the LLM output."""
    try:
        # naive attempt: find the first { and last }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            snippet = text[start:end + 1]
            return json.loads(snippet)
        return json.loads(text)
    except Exception:
        logger.exception("Failed to parse JSON from LLM output")
        return None


def _build_retrieval_query(profile: Dict[str, Any]) -> str:
    """Build a concise retrieval query from the structured customer profile."""
    prof = profile or {}
    p = prof.get("profile", prof)
    intent = p.get("intent") or prof.get("loan_category") or prof.get("loan_type") or ""
    income = p.get("monthly_income") or p.get("income") or ""
    amount = p.get("requested_loan_amount") or p.get("loan_amount") or ""
    emp = p.get("employment_type") or ""
    emi_pref = p.get("preferred_emi") or ""
    rate_pref = p.get("interest_type") or ""
    parts = [f"loan type: {intent}"]
    if amount:
        parts.append(f"requested amount: {amount}")
    if income:
        parts.append(f"monthly income: {income}")
    if emp:
        parts.append(f"employment type: {emp}")
    if emi_pref:
        parts.append(f"repayment priority: {str(emi_pref).replace('_', ' ')}")
    if rate_pref:
        parts.append(f"interest rate preference: {str(rate_pref).replace('_', ' ')}")
    return ", ".join(parts)


def recommend_from_profile(profile: Dict[str, Any], top_k: int = 6) -> Dict[str, Any]:
    """Produce structured, RAG-grounded loan recommendations from a customer profile.

    Returns a dict containing keys: `recommendations` (list), `confidence` (0-1 float),
    and `insufficient_information` (bool). Each recommendation must include
    `scheme_name`, `bank`, `match_reason`, `eligibility` (list of strings), and
    `supporting_chunks` (list of chunk ids).
    """
    query = _build_retrieval_query(profile)
    loan_cat = None
    # try to infer category
    prof = profile.get("profile", profile)
    loan_cat = prof.get("intent") or prof.get("loan_category") or None

    try:
        chunks = retrieve(query, top_k=top_k, loan_category=loan_cat)
    except Exception as e:
        logger.exception("RAG retrieval failed: %s", e)
        return {"recommendations": [], "confidence": 0.0, "insufficient_information": True}

    if not chunks:
        logger.warning("No chunks retrieved for query: %s (category: %s)", query, loan_cat)
        return {"recommendations": [], "confidence": 0.0, "insufficient_information": True}
    
    logger.info("Retrieved %d chunks for recommendation: %s", len(chunks), [c.get("doc_name") for c in chunks])

    # Build context for LLM
    context_parts: List[str] = []
    doc_lookup: Dict[str, Dict[str, str]] = {}  # Map doc names to extracted scheme/bank info
    
    for c in chunks:
        doc_name = c.get("doc_name", "")
        content = c.get("content", "")
        
        # Extract scheme name and bank from doc_name or content
        if "Scheme Name:" in content:
            # Extract from "Scheme Name: EasyHome Loan"
            try:
                scheme_line = [line for line in content.split("\n") if "Scheme Name:" in line][0]
                scheme_name = scheme_line.split("Scheme Name:")[-1].strip()
            except (IndexError, AttributeError):
                scheme_name = None
        else:
            scheme_name = None
            
        if "Bank:" in content:
            try:
                bank_line = [line for line in content.split("\n") if "Bank:" in line][0]
                bank = bank_line.split("Bank:")[-1].strip()
            except (IndexError, AttributeError):
                bank = None
        else:
            bank = None
        
        # Store mapping
        if doc_name not in doc_lookup:
            doc_lookup[doc_name] = {"scheme_name": scheme_name, "bank": bank}
        
        context_parts.append(f"[Source: {doc_name} | Scheme: {scheme_name} | Bank: {bank}]\n{content}")
    
    context = "\n\n---\n\n".join(context_parts)
    profile_context = json.dumps(profile, indent=2, default=str)

    user_message = (
        "You are a loan recommendation specialist. Given the customer profile and retrieved policy documents, "
        "recommend the BEST MATCHING loan schemes.\n\n"
        "CRITICAL RULES:\n"
        "1. ONLY recommend schemes that appear in the retrieved documents.\n"
        "2. Extract the EXACT scheme name and bank from the documents.\n"
        "3. For each recommendation, cite which document it came from.\n"
        "4. Do NOT invent any bank or scheme name.\n"
        "5. Do NOT suggest loans with different names than in the source.\n"
        "6. Return result as JSON with structure: {\"recommendations\": [{\"scheme_name\": \"...\", \"bank\": \"...\", \"match_reason\": \"...\", \"eligibility\": [...], \"supporting_chunks\": [...], \"confidence\": 0.0-1.0}], \"insufficient_information\": false}\n\n"
        f"Customer Profile:\n{profile_context}\n\n"
        f"Retrieved Policy Documents:\n{context}\n\n"
        "Based ONLY on the documents above, which schemes best match this customer?"
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + "\n\nAlways extract loan scheme names and bank names EXACTLY as they appear in the source documents. Never invent or modify scheme names."},
        {"role": "user", "content": user_message},
    ]

    raw = _call_llm(messages)
    logger.info("LLM raw response: %s", raw[:500])  # Log first 500 chars
    
    parsed = _safe_parse_json(raw)
    if not parsed:
        # fallback: return LLM text as single explanation with no recommendations
        logger.error("Failed to parse LLM JSON response: %s", raw[:300])
        return {"recommendations": [], "confidence": 0.0, "insufficient_information": True, "raw_output": raw}

    # Expect parsed to be either list or dict
    recs = []
    if isinstance(parsed, dict) and "recommendations" in parsed:
        recs = parsed.get("recommendations") or []
        confidence = parsed.get("confidence", 0.0)
        insuff = bool(parsed.get("insufficient_information", False))
    elif isinstance(parsed, list):
        recs = parsed
        confidence = max((r.get("confidence", 0.0) for r in recs), default=0.0)
        insuff = len(recs) == 0
    else:
        return {"recommendations": [], "confidence": 0.0, "insufficient_information": True}

    # Basic sanitation: ensure supporting_chunks are ids and eligibility is list
    for r in recs:
        if "supporting_chunks" in r and isinstance(r["supporting_chunks"], list):
            r["supporting_chunks"] = [str(x) for x in r["supporting_chunks"]]
        if "eligibility" in r and not isinstance(r["eligibility"], list):
            r["eligibility"] = [str(r.get("eligibility"))]

    result = {"recommendations": recs, "confidence": float(confidence), "insufficient_information": bool(insuff)}
    
    # Log the recommendations for debugging
    if recs:
        logger.info("✓ Generated %d RAG-based recommendations: %s", len(recs), 
                   [{"scheme": r.get("scheme_name"), "bank": r.get("bank"), "conf": r.get("confidence")} for r in recs])
    else:
        logger.warning("⚠ No recommendations generated (insufficient_info=%s)", insuff)
    
    return result
