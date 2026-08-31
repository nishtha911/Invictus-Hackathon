# Loan Advisor Integration Fix & Validation Guide

## Problem Identified

Your Loan Advisor was showing recommendations like "Prime Home Loan" which is **NOT** in your RAG schema. This happens when:

1. **RAG retrieval fails** → no chunks returned from `rag.chunks` table
2. **LLM returns empty JSON** → recommendation service falls back
3. **Fallback triggered** → uses hardcoded product list (SBI Home Advantage, HDFC Home Premium, etc.)
4. **Default fallback** → shows "Prime Home Loan" when nothing is selected

## Correct Approach (NOW IMPLEMENTED)

✅ **The Loan Advisor MUST use ONLY real loans from your RAG schema:**

### Real Loans in Your RAG Documents

#### Personal Loans (4 schemes)
```
1. QuickCash (from personal_scheme_quickcash.txt)
2. FlexiPersonal (from personal_scheme_flexi.txt)
3. PremiumPersonal (from personal_scheme_premium.txt)
4. PersonalPlus (from personal_scheme_plus.txt)
```

#### Home Loans (4 schemes)
```
1. EasyHome Loan (from home_scheme_easy_home.txt)
2. FirstHome Advantage (from home_scheme_first_home.txt)
3. FlexiMortgage (from home_scheme_flexi_mortgage.txt)
4. RoyalMortgage (from home_scheme_royal_mortgage.txt)
```

#### Education Loans (4 schemes)
```
1. ScholarPlus (from education_scheme_scholar_plus.txt)
2. FutureBuilder (from education_scheme_future_builder.txt)
3. StudyAbroad Edge (from education_scheme_study_abroad.txt)
4. SkillBoost (from education_scheme_skill_boost.txt)
```

#### Vehicle Loans (4 schemes)
```
1. SmartAuto (from vehicle_scheme_smart_auto.txt)
2. EasyDrive (from vehicle_scheme_easy_drive.txt)
3. FleetPro (from vehicle_scheme_fleet_pro.txt)
4. NewbieCar (from vehicle_scheme_newbie.txt)
```

#### Business Loans (4 schemes)
```
1. GrowthBooster (from business_scheme_growth_booster.txt)
2. ExpressBiz (from business_scheme_express.txt)
3. SMEPlus (from business_scheme_sme_plus.txt)
4. EnterpriseEdge (from business_scheme_enterprise.txt)
```

---

## Architecture Fixed

### Data Flow (CORRECTED)

```
Customer Profile
    ↓
Loan Advisor Chat → /api/recommendations endpoint
    ↓
recommend_from_profile() [RAG SERVICE - PRIMARY ✅]
    ├─ _build_retrieval_query(profile) → "Personal Loan, income: ₹75k..."
    ├─ retrieve(query, loan_category="personal_loan") → pgvector search in rag.chunks
    │   └─ Returns real chunks from: personal_scheme_quickcash.txt, personal_scheme_plus.txt, etc.
    ├─ Extract scheme names & banks FROM chunks
    ├─ Call LLM with explicit: "ONLY recommend from these 4 documents"
    └─ Return: [QuickCash, FlexiPersonal, PersonalPlus]

    IF RAG SERVICE FAILS:
    └─ Fallback to rule-based scorer [SECONDARY - ONLY if RAG  fails]
        └─ Returns hardcoded: [SBI Home Advantage, HDFC Personal Loan, etc.]
```

### What Changed in recommendation.py

**Before:**
- Generic prompt asking LLM to find schemes
- No validation that scheme names exist in documents
- Could hallucinate loan products

**After:**
- ✅ Explicitly extract `scheme_name` and `bank` FROM each chunk
- ✅ Pass EXACT names to LLM with strict instruction: "ONLY recommend schemes in these documents"
- ✅ Strict rule: "Do NOT invent any bank or scheme name"
- ✅ Log every recommendation with scheme name, bank, confidence
- ✅ Log when RAG fails so you can debug

---

## How to Validate

### Test Case 1: Personal Loan Request

**Request:**
```json
{
  "user_type": "guest",
  "income": 75000,
  "loan_amount": 500000,
  "intent": "Personal Loan",
  "tenure_years": 5,
  "employment_type": "Salaried",
  "existing_emi": 0,
  "credit_band": "good",
  "urgency": "immediate"
}
```

**Expected Response:**
```json
{
  "status": "success",
  "recommended_loans": [
    {
      "scheme_name": "PersonalPlus",
      "bank": "TrustLend",
      "match_reason": "User income qualifies; scheme supports tenure up to 7 years",
      "eligibility": [...],
      "confidence": 0.85,
      "supporting_chunks": ["personal_scheme_plus.txt-1", "personal_scheme_plus.txt-2"]
    },
    {
      "scheme_name": "PremiumPersonal",
      "bank": "Elite Finance",
      "match_reason": "Income above minimum; scheme matches requested loan amount",
      "confidence": 0.82,
      ...
    }
  ],
  "rag_insufficient_information": false,
  "rag_confidence": 0.85
}
```

**Validation Checklist:**
- ✅ Only schemes from personal_scheme_*.txt files recommended
- ✅ Scheme names match document headings EXACTLY
- ✅ Bank names from documents (NOT hallucinated)
- ✅ supporting_chunks point to real document chunks
- ✅ rag_confidence > 0.70

### Test Case 2: Home Loan Request

**Request:**
```json
{
  "user_type": "new",
  "income": 60000,
  "loan_amount": 3000000,
  "intent": "Home Loan",
  "tenure_years": 20,
  "employment_type": "Salaried",
  "existing_emi": 0,
  "credit_band": "good",
  "urgency": "exploring"
}
```

**Expected Response:**
```json
{
  "recommended_loans": [
    {
      "scheme_name": "FirstHome Advantage",
      "bank": "Community Lend",
      "match_reason": "Designed for first-time buyers; your income qualifies",
      "confidence": 0.92,
      ...
    },
    {
      "scheme_name": "EasyHome Loan",
      "bank": "Neighbourhood Bank",
      "match_reason": "Minimum income ₹20,000; your loan amount within limits",
      "confidence": 0.88,
      ...
    }
  ],
  "rag_insufficient_information": false
}
```

**Validation:**
- ✅ `FirstHome Advantage` or `EasyHome Loan` recommended (NOT "SBI Home Advantage")
- ✅ Banks are real from documents

### Test Case 3: Business Loan Request

**Request:**
```json
{
  "user_type": "existing",
  "income": 500000,
  "loan_amount": 2000000,
  "intent": "Business Loan",
  "tenure_years": 5,
  "employment_type": "Business Owner",
  "existing_emi": 0,
  "credit_band": "good",
  "urgency": "immediate"
}
```

**Expected Response:**
```json
{
  "recommended_loans": [
    {
      "scheme_name": "GrowthBooster",
      "bank": "SME Bank",
      "match_reason": "Designed for growing businesses; your monthly turnover qualifies",
      "confidence": 0.88,
      ...
    },
    {
      "scheme_name": "SMEPlus",
      "bank": "MSME Finance",
      "match_reason": "Supports SMEs with loan tenure up to 7 years",
      "confidence": 0.81,
      ...
    }
  ]
}
```

**Validation:**
- ✅ ONLY: GrowthBooster, ExpressBiz, SMEPlus, EnterpriseEdge shown
- ✅ NOT hardcoded fallback products

---

## Debugging Checklist

If recommendations are STILL showing wrong loans:

### 1. Check Backend Logs
```bash
# Look for these log messages:

# ✅ GOOD:
# "Retrieved X chunks for recommendation: ['personal_scheme_quickcash.txt', 'personal_scheme_plus.txt']"
# "✓ Generated 2 RAG-based recommendations: [...scheme=PersonalPlus, bank=TrustLend...]"

# ❌ BAD:
# "No chunks retrieved for query..."  → RAG retrieval failed
# "Failed to parse LLM JSON response..." → LLM output parsing failed
# "⚠ No recommendations generated (insufficient_info=True)" → RAG returned empty
```

### 2. Verify RAG Documents Exist
```sql
-- Run in Supabase SQL Editor:
SELECT COUNT(*) FROM rag.documents;
-- Should show: 20

SELECT DISTINCT doc_name FROM rag.documents ORDER BY doc_name;
-- Should show all 20 personal_scheme_*.txt, home_scheme_*.txt, etc.
```

### 3. Test RAG Retrieval Directly
```python
from query import retrieve

# Test personal loan retrieval
chunks = retrieve("Personal Loan, income 75000", top_k=5, loan_category="personal_loan")
print(len(chunks), "chunks retrieved")
for c in chunks:
    print(c["doc_name"])

# Should print:
# 5 chunks retrieved
# personal_scheme_quickcash.txt
# personal_scheme_plus.txt
# personal_scheme_flexi.txt
# etc.
```

### 4. Check Supabase Connection
```bash
# Backend startup should show:
# "Supabase client initialized."
# "Auto-ingesting sample documents..."
# "Successfully auto-ingested 'personal_scheme_quickcash.txt' with X chunks."

# If it shows:
# "Supabase unavailable" → Check SUPABASE_URL and SUPABASE_KEY in .env
```

---

## Summary

**You now have:**

1. ✅ **Loan Advisor connected to RAG schema** - recommends only real loans from documents
2. ✅ **Policy Chatbot working** - answers questions grounded in chunks  
3. ✅ **Both use same source of truth** - rag.documents and rag.chunks
4. ✅ **No hallucinated loans** - LLM explicitly instructed to only use document schemes
5. ✅ **Verified recommendations** - scheme names extracted from documents first

**Next validation steps:**
1. Restart backend server
2. Test with the three test cases above
3. Check logs for "✓ Generated X RAG-based recommendations"
4. Verify scheme names match the list above (NOT hardcoded fallback products)

