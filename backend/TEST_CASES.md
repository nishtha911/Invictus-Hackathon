# LoanPilot Test Cases — Loan Advisor & Knowledge Base Chatbot

## Test Environment Setup
```bash
# Terminal 1: Start the backend server
cd backend
.\venv\Scripts\python.exe run.py

# Terminal 2: Run individual test requests
cd backend
.\venv\Scripts\python.exe
```

---

## PART A: LOAN ADVISOR TESTS

### Test Case A1: Personal Loan for Salaried Customer

**Scenario:** A salaried customer with ₹75,000/month income seeking a personal loan of ₹5 lakh.

**Test Request (POST to /api/recommendations):**
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
  "urgency": "immediate",
  "customer_name": "Rahul Kumar"
}
```

**Expected Behavior:**
- System searches `rag` schema for personal loan schemes matching the profile.
- Expected schemes to appear: `PersonalPlus`, `FlexiPersonal`, `PremiumPersonal`, `QuickCash`.
- Each recommendation should include:
  - Scheme name (grounded from KB)
  - Bank name (grounded from KB)
  - Match reasoning (e.g., "Your monthly income of ₹75,000 qualifies for schemes with no minimum income requirement")
  - Eligibility criteria (extracted from KB chunks)
  - Supporting chunk IDs (from `rag.chunks` table)

**Expected Response (snippet):**
```json
{
  "status": "success",
  "recommended_loans": [
    {
      "scheme_name": "PremiumPersonal",
      "bank": "Elite Finance",
      "match_reason": "Your monthly income of ₹75,000 exceeds the typical requirements for premium personal lending.",
      "eligibility": [
        "Monthly income ≥ ₹60,000 preferred",
        "Salaried employment with stable income",
        "Loan amount up to ₹5,000,000"
      ],
      "supporting_chunks": ["education_scheme_scholar_plus.txt-1", "..."],
      "confidence": 0.85,
      "interest_rate_approx": "10.25% p.a."
    }
  ],
  "rag_insufficient_information": false,
  "rag_confidence": 0.85
}
```

---

### Test Case A2: Home Loan for First-Time Buyer

**Scenario:** First-time home buyer, salaried, ₹60,000/month, seeking ₹30 lakh home loan.

**Test Request (POST to /api/recommendations):**
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
  "urgency": "exploring",
  "customer_name": "Priya Sharma"
}
```

**Expected Behavior:**
- System should retrieve home loan schemes from KB.
- Should prioritize first-time buyer schemes: `FirstHome Advantage`, `EasyHome Loan`.
- Should NOT recommend Royal Mortgage or FlexiMortgage if they require higher income or additional collateral beyond what the customer profile supports.
- Recommendations must cite loan limits, interest rates, processing fees from KB chunks.

**Expected Response (snippet):**
```json
{
  "status": "success",
  "recommended_loans": [
    {
      "scheme_name": "FirstHome Advantage",
      "bank": "Community Lend",
      "match_reason": "Designed specifically for first-time buyers. Your income and requested loan amount align with this scheme's parameters.",
      "eligibility": [
        "First-time buyer status confirmed",
        "Monthly income ≥ ₹18,000 (you have ₹60,000)",
        "Loan amount up to ₹20,000,000"
      ],
      "supporting_chunks": ["home_scheme_first_home.txt-1", "home_scheme_first_home.txt-2"],
      "confidence": 0.92
    }
  ],
  "rag_insufficient_information": false
}
```

---

### Test Case A3: Education Loan with Missing Information

**Scenario:** Student seeking education loan but income/salary not disclosed.

**Test Request (POST to /api/recommendations):**
```json
{
  "user_type": "new",
  "income": null,
  "loan_amount": 1500000,
  "intent": "Education Loan",
  "tenure_years": 10,
  "employment_type": null,
  "existing_emi": 0,
  "credit_band": "unknown",
  "urgency": "immediate",
  "customer_name": "Aman Singh"
}
```

**Expected Behavior:**
- System may retrieve some education loan schemes (e.g., ScholarPlus, FutureBuilder).
- Should flag `insufficient_information: true` if critical eligibility criteria cannot be evaluated.
- Response should indicate: "Some schemes may have income requirements or co-borrower conditions that cannot be verified with the information provided."
- Should NOT invent eligibility criteria; stick to what's in KB.

**Expected Response (snippet):**
```json
{
  "status": "success",
  "recommended_loans": [
    {
      "scheme_name": "ScholarPlus Education Loan",
      "bank": "BrightFutures Bank",
      "match_reason": "Supports education financing. Specific eligibility for your profile requires co-borrower income confirmation.",
      "eligibility": ["Applicant age 18+", "Admission proof required"],
      "supporting_chunks": ["education_scheme_scholar_plus.txt-1"],
      "confidence": 0.60
    }
  ],
  "rag_insufficient_information": true,
  "note": "To refine recommendations, please provide co-borrower or family monthly income."
}
```

---

### Test Case A4: Vehicle Loan for Self-Employed

**Scenario:** Self-employed, ₹1.2 lakh/month income, seeking vehicle loan for ₹10 lakh.

**Test Request (POST to /api/recommendations):**
```json
{
  "user_type": "existing",
  "income": 120000,
  "loan_amount": 1000000,
  "intent": "Vehicle Loan",
  "tenure_years": 6,
  "employment_type": "Self-Employed",
  "existing_emi": 15000,
  "credit_band": "good",
  "urgency": "within_3_months",
  "customer_name": "Vikram Patel"
}
```

**Expected Behavior:**
- System retrieves vehicle loan schemes: SmartAuto, EasyDrive, FleetPro, NewbieCar.
- Should recognize self-employed status and retrieve schemes that accept non-salaried borrowers.
- Should evaluate FOIR (Fixed Obligation to Income Ratio): existing_emi (₹15k) + estimated new EMI against ₹120k income.
- Should indicate if customer qualifies or if FOIR is tight.

**Expected Response (snippet):**
```json
{
  "status": "success",
  "recommended_loans": [
    {
      "scheme_name": "SmartAuto Loan",
      "bank": "DriveBank",
      "match_reason": "Your income and existing obligations fit within acceptable FOIR limits. Supports self-employed borrowers with regular income documentation.",
      "eligibility": [
        "Monthly income: ₹120,000 (qualifies)",
        "Loan amount ₹10,00,000 within max of ₹5,000,000",
        "Existing EMI obligations: ₹15,000/month (manageable with new tenure)"
      ],
      "supporting_chunks": ["vehicle_scheme_smart_auto.txt-1"],
      "confidence": 0.80
    }
  ],
  "rag_insufficient_information": false
}
```

---

### Test Case A5: Business Loan for SME

**Scenario:** Small business owner (established 3 years), ₹5 lakh/month revenue, seeking ₹20 lakh business loan.

**Test Request (POST to /api/recommendations):**
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
  "urgency": "immediate",
  "customer_name": "Ravi Sharma"
}
```

**Expected Behavior:**
- System retrieves business loan schemes: GrowthBooster, ExpressBiz, SMEPlus, EnterpriseEdge.
- Should recommend schemes suited to small businesses (not enterprise-level EnterpriseEdge unless revenue is very high).
- Should cite minimum business operation period, annual turnover requirements from KB.

**Expected Response (snippet):**
```json
{
  "status": "success",
  "recommended_loans": [
    {
      "scheme_name": "GrowthBooster Business Loan",
      "bank": "SME Bank",
      "match_reason": "Tailored for growing businesses with sustainable revenue. Your ₹5,00,000 monthly revenue qualifies.",
      "eligibility": [
        "Registered business with 2+ years operations (you have 3 years)",
        "Loan amount up to ₹20,000,000",
        "Monthly revenue: ₹5,00,000 (exceeds typical thresholds)"
      ],
      "supporting_chunks": ["business_scheme_growth_booster.txt-1"],
      "confidence": 0.88
    }
  ],
  "rag_insufficient_information": false
}
```

---

## PART B: LOAN KNOWLEDGE BASE CHATBOT TESTS

Use **POST /query** endpoint with the following test cases.

### Test Case B1: FAQ about ScholarPlus Education Loan

**Question:** "What is the minimum monthly income required for ScholarPlus Education Loan?"

**Test Request (POST to /query):**
```json
{
  "question": "What is the minimum monthly income required for ScholarPlus Education Loan?",
  "loan_category": "education_loan",
  "top_k": 5,
  "session_id": "KB-TEST-001",
  "profile": {}
}
```

**Expected Answer:**
- Should retrieve the education_scheme_scholar_plus.txt chunk(s).
- Answer must cite from KB: "ScholarPlus Education Loan eligibility does not specify a minimum monthly income requirement for co-signed loans; however, income is considered for interest rate banding."
- Should NOT invent an income threshold; only state what the KB says.

**Expected Response (snippet):**
```json
{
  "answer": "Based on the ScholarPlus Education Loan policy, no specific minimum monthly income is mandated for co-signed loans. The borrower's income is assessed to determine the interest rate band applicable. For loans where a co-borrower is required, the combined family income is considered during underwriting.",
  "sources": [
    {
      "doc_name": "education_scheme_scholar_plus.txt",
      "section": "Eligibility",
      "page_number": 1,
      "content": "...",
      "chunk_id": "education_scheme_scholar_plus.txt-1"
    }
  ],
  "numbers_verified": true,
  "grounded_on_chunk_ids": ["education_scheme_scholar_plus.txt-1"]
}
```

---

### Test Case B2: Interest Rate Query

**Question:** "What is the interest rate for EasyHome Loan?"

**Test Request (POST to /query):**
```json
{
  "question": "What is the interest rate for EasyHome Loan?",
  "loan_category": "home_loan",
  "top_k": 5,
  "session_id": "KB-TEST-002",
  "profile": {}
}
```

**Expected Answer:**
- Should retrieve home_scheme_easy_home.txt.
- Answer: "The EasyHome Loan from Neighbourhood Bank offers interest rates starting from 8.10% p.a."
- Must cite the rate from KB; must NOT hallucinate other rates.

**Expected Response (snippet):**
```json
{
  "answer": "The EasyHome Loan from Neighbourhood Bank offers interest rates starting at 8.10% per annum. The exact rate applicable to you depends on your credit profile and loan-to-value ratio during formal assessment.",
  "sources": [
    {
      "doc_name": "home_scheme_easy_home.txt",
      "section": "Financials",
      "content": "Interest rate: From 8.10% p.a.",
      "chunk_id": "home_scheme_easy_home.txt-1"
    }
  ],
  "numbers_verified": true
}
```

---

### Test Case B3: Tenure & EMI Query

**Question:** "What is the maximum tenure for PersonalPlus from TrustLend?"

**Test Request (POST to /query):**
```json
{
  "question": "What is the maximum tenure for PersonalPlus from TrustLend?",
  "loan_category": "personal_loan",
  "top_k": 5,
  "session_id": "KB-TEST-003",
  "profile": {}
}
```

**Expected Answer:**
- Should retrieve personal_scheme_plus.txt.
- Answer: "PersonalPlus from TrustLend has a maximum tenure of 7 years."
- Must cite the exact tenure from KB.

**Expected Response (snippet):**
```json
{
  "answer": "PersonalPlus from TrustLend offers a maximum tenure of 7 years. This gives borrowers flexibility to choose between 1 to 7 years based on their financial capacity and preference.",
  "sources": [
    {
      "doc_name": "personal_scheme_plus.txt",
      "section": "Financials",
      "content": "Tenure: 1 to 7 years",
      "chunk_id": "personal_scheme_plus.txt-1"
    }
  ]
}
```

---

### Test Case B4: Cross-Loan Question (Not in Advisory Profile)

**Question:** "I was exploring home loans, but now tell me eligibility for business loans. What is the minimum turnover required for GrowthBooster?"

**Test Request (POST to /query):**
```json
{
  "question": "What is the minimum annual turnover required for GrowthBooster Business Loan?",
  "loan_category": "business_loan",
  "top_k": 5,
  "session_id": "KB-TEST-004",
  "profile": {
    "user_type": "existing",
    "profile": {
      "loan_category": "Home Loan"
    }
  }
}
```

**Expected Answer:**
- Should retrieve business_scheme_growth_booster.txt.
- Profile shows "Home Loan" but the KB query asks about business loans → should NOT restrict the answer.
- Answer must cite from business loan KB: "GrowthBooster requires businesses to have minimum 2 years of operations."
- Should NOT mention minimum turnover if the KB doesn't specify one.

**Expected Response (snippet):**
```json
{
  "answer": "The GrowthBooster Business Loan from SME Bank requires the business to have completed a minimum of 2 years of operations. The lending decision also includes evaluation of financial statements and cash flow, but no specific minimum annual turnover is mandated in the standard policy—this is assessed case-by-case.",
  "sources": [
    {
      "doc_name": "business_scheme_growth_booster.txt",
      "section": "Eligibility",
      "content": "Registered businesses with minimum 2 years of operations",
      "chunk_id": "business_scheme_growth_booster.txt-1"
    }
  ]
}
```

---

### Test Case B5: Question Not in KB

**Question:** "Does your bank offer cryptocurrency-backed loans?"

**Test Request (POST to /query):**
```json
{
  "question": "Does your bank offer cryptocurrency-backed loans?",
  "loan_category": null,
  "top_k": 5,
  "session_id": "KB-TEST-005",
  "profile": {}
}
```

**Expected Answer:**
- Should NOT find relevant chunks (cryptocurrency is not in the sample docs).
- Answer must be honest: "I could not find this specific detail in our available policy documents, but our branch loan officers can assist during formal processing."
- Must NOT invent a response about crypto loans.

**Expected Response (snippet):**
```json
{
  "answer": "I could not find information about cryptocurrency-backed loans in the available bank policy documents. For specialized lending products, I recommend contacting our branch directly or speaking with a loan officer who can explore custom solutions.",
  "sources": [],
  "grounded_on_chunk_ids": []
}
```

---

## Running Tests from Command Line

### Option 1: Python Script (Automated)

Create `backend/scripts/test_both_systems.py`:
```python
import requests, json, time

BASE = 'http://localhost:8080'

print("\n" + "="*60)
print("LOAN ADVISOR TESTS")
print("="*60)

tests_advisor = [
    {"name": "A1: Personal Loan (Salaried)", "data": {"user_type":"guest","income":75000,"loan_amount":500000,"intent":"Personal Loan","tenure_years":5,"employment_type":"Salaried","existing_emi":0,"credit_band":"good","urgency":"immediate","customer_name":"Rahul Kumar"}},
    {"name": "A2: Home Loan (First-time)", "data": {"user_type":"new","income":60000,"loan_amount":3000000,"intent":"Home Loan","tenure_years":20,"employment_type":"Salaried","existing_emi":0,"credit_band":"good","urgency":"exploring","customer_name":"Priya Sharma"}},
    {"name": "A3: Education Loan (No income)", "data": {"user_type":"new","income":None,"loan_amount":1500000,"intent":"Education Loan","tenure_years":10,"employment_type":None,"existing_emi":0,"credit_band":"unknown","urgency":"immediate","customer_name":"Aman Singh"}},
]

for test in tests_advisor:
    print(f"\n[TEST] {test['name']}")
    try:
        r = requests.post(f"{BASE}/api/recommendations", json=test['data'], timeout=10)
        if r.status_code == 200:
            resp = r.json()
            recs = resp.get('recommended_loans', [])
            print(f"  ✓ Found {len(recs)} recommendations")
            for i, rec in enumerate(recs[:2]):
                print(f"    {i+1}. {rec.get('scheme_name', 'N/A')} ({rec.get('bank', 'N/A')})")
            print(f"  Confidence: {resp.get('rag_confidence', 0):.2f}, Insufficient Info: {resp.get('rag_insufficient_information', False)}")
        else:
            print(f"  ✗ Error {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"  ✗ Exception: {str(e)[:150]}")
    time.sleep(1)

print("\n" + "="*60)
print("KNOWLEDGE BASE CHATBOT TESTS")
print("="*60)

tests_kb = [
    {"name": "B1: ScholarPlus Min Income", "q": "What is the minimum monthly income required for ScholarPlus Education Loan?", "cat": "education_loan"},
    {"name": "B2: EasyHome Interest Rate", "q": "What is the interest rate for EasyHome Loan?", "cat": "home_loan"},
    {"name": "B3: PersonalPlus Tenure", "q": "What is the maximum tenure for PersonalPlus from TrustLend?", "cat": "personal_loan"},
    {"name": "B4: GrowthBooster Turnover", "q": "What is the minimum annual turnover required for GrowthBooster Business Loan?", "cat": "business_loan"},
    {"name": "B5: Crypto Loans (Not in KB)", "q": "Does your bank offer cryptocurrency-backed loans?", "cat": None},
]

for test in tests_kb:
    print(f"\n[TEST] {test['name']}")
    print(f"  Q: {test['q'][:80]}...")
    try:
        r = requests.post(f"{BASE}/query", json={
            "question": test['q'],
            "loan_category": test['cat'],
            "top_k": 5,
            "session_id": f"KB-TEST-{test['name']}",
            "profile": {}
        }, timeout=10)
        if r.status_code == 200:
            resp = r.json()
            ans = resp.get('answer', '')
            sources = resp.get('sources', [])
            print(f"  ✓ Answer retrieved ({len(ans)} chars)")
            print(f"    Answer: {ans[:120]}...")
            print(f"    Sources: {len(sources)} chunk(s)")
        else:
            print(f"  ✗ Error {r.status_code}")
    except Exception as e:
        print(f"  ✗ Exception: {str(e)[:150]}")
    time.sleep(1)

print("\n" + "="*60)
print("TEST SUMMARY COMPLETE")
print("="*60)
```

Run:
```bash
cd backend
.\venv\Scripts\python.exe .\scripts\test_both_systems.py
```

---

## Expected Test Outcomes

| Test Case | Success Criteria |
|-----------|------------------|
| A1 – Personal Loan | ≥2 personal loan schemes recommended; confidence >0.75 |
| A2 – Home Loan | FirstHome scheme recommended; insufficient_info = false |
| A3 – Education (no income) | ≥1 recommendation; insufficient_info = true |
| A4 – Vehicle (self-employed) | ≥2 vehicle schemes; FOIR logic evident |
| A5 – Business Loan | GrowthBooster or SMEPlus recommended |
| B1 – ScholarPlus Min Income | Answer cites KB exactly; no invented thresholds |
| B2 – EasyHome Rate | Answer: "8.10% p.a."; grounded in chunks |
| B3 – PersonalPlus Tenure | Answer: "7 years max"; from rag schema |
| B4 – GrowthBooster Turnover | Cites "2 years operations"; no invented turnover min |
| B5 – Crypto Loans | Honest "not in KB" response; no hallucination |

---

## Validation Checklist

- [ ] All recommendations are grounded in `rag.chunks` (no hardcoded data).
- [ ] No bank names or scheme names are invented.
- [ ] Numbers (rates, amounts, tenures) match KB exactly.
- [ ] KB chatbot refuses questions outside its domain gracefully.
- [ ] Insufficient information flags are raised when needed.
- [ ] Loan Advisor uses the shared RAG engine (not independent scorer).
- [ ] Both interfaces cite supporting chunk IDs from `rag` schema.
