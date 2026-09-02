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


def compute_policy_match_score(scheme_name: str, profile: dict) -> float:
    """Compute exact policy segment match score based on target segment rules in policy docs."""
    name_clean = scheme_name.lower()
    prof = profile.get("profile", profile) if isinstance(profile, dict) else {}
    income = float(prof.get("monthly_income") or prof.get("income") or 0)
    amount = float(prof.get("requested_loan_amount") or prof.get("loan_amount") or 0)
    emp = str(prof.get("employment_type") or "").lower()
    age = int(prof.get("age") or 30) if prof.get("age") is not None else 30

    score = 0.80  # Base score

    # Vehicle Loan rules
    if "newbie" in name_clean:
        if amount <= 500000 and (income <= 40000 or age <= 30):
            score = 0.96
        elif amount <= 500000:
            score = 0.90
        else:
            score = 0.60
    elif "fleet" in name_clean or "commercial" in name_clean:
        if "business" in emp or "self" in emp or amount >= 2500000:
            score = 0.97
        else:
            score = 0.50
    elif "easydrive" in name_clean:
        if amount <= 3000000 and (income <= 60000 or "fair" in str(prof.get("credit_score_band","")).lower()):
            score = 0.93
        else:
            score = 0.85
    elif "smartauto" in name_clean:
        if amount > 500000 and amount <= 5000000 and ("salaried" in emp or not emp):
            score = 0.94
        elif amount <= 500000:
            score = 0.82
        else:
            score = 0.70

    # Home Loan rules
    elif "royal" in name_clean:
        if amount >= 50000000 or income >= 150000:
            score = 0.97
        else:
            score = 0.70
    elif "fleximortgage" in name_clean:
        if "business" in emp or "self" in emp or amount > 30000000:
            score = 0.95
        else:
            score = 0.86
    elif "firsthome" in name_clean:
        if amount <= 50000000 and income >= 30000 and income <= 120000:
            score = 0.94
        else:
            score = 0.85
    elif "easyhome" in name_clean:
        if income <= 40000 or amount <= 2500000:
            score = 0.95
        else:
            score = 0.88

    # Personal Loan rules
    elif "quickcash" in name_clean:
        if amount <= 500000 and income <= 50000:
            score = 0.96
        else:
            score = 0.82
    elif "premiumpersonal" in name_clean or "premium" in name_clean:
        if amount >= 1500000 or income >= 75000:
            score = 0.97
        else:
            score = 0.75
    elif "flexipersonal" in name_clean:
        if "business" in emp or "self" in emp:
            score = 0.95
        else:
            score = 0.85
    elif "personalplus" in name_clean or "plus" in name_clean:
        score = 0.89

    # Education Loan rules
    elif "studyabroad" in name_clean or "abroad" in name_clean:
        if amount >= 3000000:
            score = 0.97
        else:
            score = 0.75
    elif "scholarplus" in name_clean or "scholar" in name_clean:
        if amount <= 3000000:
            score = 0.95
        else:
            score = 0.85
    elif "skillboost" in name_clean or "skill" in name_clean:
        if amount <= 500000:
            score = 0.96
        else:
            score = 0.70

    # Business Loan rules
    elif "enterpriseedge" in name_clean or "enterprise" in name_clean:
        if amount >= 5000000 or income >= 200000:
            score = 0.97
        else:
            score = 0.72
    elif "growthbooster" in name_clean or "growth" in name_clean:
        if amount <= 5000000:
            score = 0.94
        else:
            score = 0.80
    elif "expressbiz" in name_clean or "express" in name_clean:
        if amount <= 3000000:
            score = 0.92
        else:
            score = 0.75

    return round(score, 2)


def recommend_from_profile(profile: Dict[str, Any], top_k: int = 12) -> Dict[str, Any]:
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
        chunks = retrieve(query, top_k=max(top_k, 12), loan_category=loan_cat)
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
        "evaluate EVERY scheme in the documents and recommend the BEST MATCHING schemes for this customer.\n\n"
        "EVALUATION & RANKING INSTRUCTIONS:\n"
        "1. Compare requested loan amount against each document's min/max loan limits.\n"
        "2. Compare monthly income against each document's minimum income requirement.\n"
        "3. Match employment type (e.g. Business Owner -> commercial fleet/business schemes; Salaried -> standard/first-time buyer schemes).\n"
        "4. RANK the recommendations in DESCENDING order of match quality (the absolute best match FIRST).\n"
        "5. Assign a confidence score (0.70 to 0.98) reflecting how well each scheme fits the borrower's exact situation.\n"

        "CRITICAL RULES:\n"
        "1. ONLY recommend schemes that appear in the retrieved documents.\n"
        "2. Extract the EXACT scheme name and bank from the documents.\n"
        "3. For each recommendation, cite which document it came from.\n"
        "4. Do NOT invent any bank or scheme name.\n"
        "5. Return result as JSON with structure: {\"recommendations\": [{\"scheme_name\": \"...\", \"bank\": \"...\", \"match_reason\": \"...\", \"eligibility\": [...], \"supporting_chunks\": [...], \"confidence\": 0.0-1.0}], \"insufficient_information\": false}\n\n"
        f"Customer Profile:\n{profile_context}\n\n"
        f"Retrieved Policy Documents:\n{context}\n\n"
        "Based ONLY on the documents above, which schemes best match this customer? Place the TOP best match first."
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + "\n\nAlways extract loan scheme names and bank names EXACTLY as they appear in the source documents. Never invent or modify scheme names. Always order recommendations from best fit to lowest fit."},
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

    # Basic sanitation and policy match score rescoring
    for r in recs:
        if "supporting_chunks" in r and isinstance(r["supporting_chunks"], list):
            r["supporting_chunks"] = [str(x) for x in r["supporting_chunks"]]
        if "eligibility" in r and not isinstance(r["eligibility"], list):
            r["eligibility"] = [str(r.get("eligibility"))]
        
        # Calculate exact policy match score
        scheme_name = str(r.get("scheme_name") or "")
        rule_score = compute_policy_match_score(scheme_name, profile)
        r["confidence"] = rule_score

    # Sort recommendations by computed policy match score descending
    recs.sort(key=lambda x: float(x.get("confidence", 0.0)), reverse=True)
    top_confidence = recs[0].get("confidence", 0.85) if recs else 0.0

    result = {"recommendations": recs, "confidence": float(top_confidence), "insufficient_information": bool(insuff)}
    
    # Log the recommendations for debugging
    if recs:
        logger.info("✓ Generated %d RAG-based recommendations: %s", len(recs), 
                   [{"scheme": r.get("scheme_name"), "bank": r.get("bank"), "conf": r.get("confidence")} for r in recs])
    else:
        logger.warning("⚠ No recommendations generated (insufficient_info=%s)", insuff)
    
    return result

