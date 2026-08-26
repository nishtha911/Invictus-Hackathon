# /backend/app/graph/prompts.py
"""
All LLM prompt templates for the advisory graph.
Centralized so they're easy to tune and review.
"""

# ── System Prompt (shared across extraction nodes) ─────────────────────

SYSTEM_PROMPT = """You are an expert Indian bank loan advisor chatbot. Your role is to:
1. Ask clear, concise questions to understand the customer's loan needs
2. Extract structured data from their responses
3. Provide helpful context about Indian banking norms when relevant
4. Be warm, professional, and efficient

IMPORTANT RULES:
- Never calculate EMI, interest rates, or eligibility yourself
- Never promise loan approval
- Always use Indian Rupees (₹) for amounts
- Keep responses under 3 sentences unless explaining something important
- If a user gives an unclear answer, ask a brief clarifying question
"""

# ── Extraction Prompts ─────────────────────────────────────────────────

EXTRACT_LOAN_TYPE_PROMPT = """The user was asked about their loan purpose/type. 
Their response: "{user_input}"

Extract the loan type. Map to one of: home_loan, personal_loan, vehicle_loan, education_loan, business_loan.

If they mention house/flat/property/apartment → home_loan
If they mention car/bike/vehicle/two-wheeler/four-wheeler → vehicle_loan  
If they mention study/college/university/course/MBA/engineering → education_loan
If they mention wedding/travel/medical/personal/consolidation → personal_loan
If they mention business/startup/shop/enterprise → business_loan

Return ONLY valid JSON:
{{"intent": "<loan_type>", "confidence": <0.0-1.0>}}

If you cannot determine the type, return:
{{"intent": null, "confidence": 0.0, "clarification_needed": true}}"""

EXTRACT_LOAN_AMOUNT_PROMPT = """The user was asked about the loan amount they need.
Their response: "{user_input}"
Loan type: {loan_type}

Extract the numeric loan amount in INR. Handle Indian number formats:
- "10 lakh" or "10L" = 1000000
- "50 lakh" or "50L" = 5000000  
- "1 crore" or "1Cr" = 10000000
- "25 thousand" or "25K" = 25000
- Plain numbers like "500000" = 500000

Return ONLY valid JSON:
{{"loan_amount": <number_in_inr>, "confidence": <0.0-1.0>}}

If amount is unclear, return:
{{"loan_amount": null, "confidence": 0.0, "clarification_needed": true}}"""

EXTRACT_INCOME_EMPLOYMENT_PROMPT = """The user was asked about their income and employment.
Their response: "{user_input}"

Extract:
1. Monthly income in INR (convert annual to monthly by dividing by 12 if needed)
2. Employment type: salaried, self_employed, or business_owner
3. Employer type (if salaried): government, private, mnc, startup  
4. Years at current job/business (if mentioned)

Handle Indian formats: "50K" = 50000, "1.2 lakh" = 120000, "4 LPA" = 33333/month

Return ONLY valid JSON:
{{
  "monthly_income": <number_or_null>,
  "employment_type": "<type_or_null>",
  "employer_type": "<type_or_null>",
  "years_at_current_job": <number_or_null>,
  "confidence": <0.0-1.0>
}}"""

EXTRACT_EXISTING_DEBTS_PROMPT = """The user was asked about existing loans/EMIs.
Their response: "{user_input}"

Extract:
1. Whether they have existing loans (true/false)
2. Total monthly EMI amount in INR (0 if none)

Return ONLY valid JSON:
{{
  "has_existing_loans": <true_or_false>,
  "existing_emi_obligations": <number_in_inr>,
  "confidence": <0.0-1.0>
}}"""

EXTRACT_CREDIT_SCORE_PROMPT = """The user was asked about their CIBIL/credit score.
Their response: "{user_input}"

Extract:
1. Numeric score (300-900) if provided
2. Band: poor (<650), fair (650-699), good (700-749), excellent (750+)
3. If they don't know, set band to "unknown"

Interpret phrases:
- "good credit" / "no issues" → good (assume ~720)
- "bad credit" / "low score" / "rejected before" → poor (assume ~580)
- "average" / "okay" / "decent" → fair (assume ~670)
- "excellent" / "very good" / "750+" → excellent
- "don't know" / "not sure" / "haven't checked" → unknown

Return ONLY valid JSON:
{{
  "credit_score_numeric": <number_or_null>,
  "credit_score_band": "<band>",
  "confidence": <0.0-1.0>
}}"""

EXTRACT_AGE_PROMPT = """The user was asked about their age.
Their response: "{user_input}"

Extract the numeric age. Must be between 18 and 100.
If they give date of birth, calculate approximate age.

Return ONLY valid JSON:
{{"age": <number_or_null>, "confidence": <0.0-1.0>}}"""

EXTRACT_URGENCY_PROMPT = """The user was asked about their timeline/urgency for the loan.
Their response: "{user_input}"

Map to:
- "immediate": ready now, ASAP, this week/month, urgent
- "within_3_months": planning, next few months, soon
- "exploring": just checking, no rush, researching, comparing

Return ONLY valid JSON:
{{"urgency": "<immediate|within_3_months|exploring>", "confidence": <0.0-1.0>}}"""

# ── Loan-Type Specific Extraction ──────────────────────────────────────

EXTRACT_HOME_LOAN_DETAILS_PROMPT = """The user is applying for a home loan. They were asked about property details.
Their response: "{user_input}"

Extract any of these (set null if not mentioned):
- property_value: total cost of property in INR
- down_payment: down payment amount in INR  
- property_location: city or area name
- is_first_property: true/false
- property_status: ready_to_move or under_construction

Return ONLY valid JSON:
{{
  "property_value": <number_or_null>,
  "down_payment": <number_or_null>,
  "property_location": "<string_or_null>",
  "is_first_property": <true_false_or_null>,
  "property_status": "<status_or_null>"
}}"""

EXTRACT_VEHICLE_LOAN_DETAILS_PROMPT = """The user is applying for a vehicle loan. They were asked about vehicle details.
Their response: "{user_input}"

Extract any of these:
- vehicle_type: two_wheeler or four_wheeler
- new_or_used: new or used
- vehicle_price: on-road price in INR
- down_payment: downpayment in INR if mentioned

Return ONLY valid JSON:
{{
  "vehicle_type": "<type_or_null>",
  "new_or_used": "<new_or_used_or_null>",
  "vehicle_price": <number_or_null>,
  "down_payment": <number_or_null>
}}"""

EXTRACT_EDUCATION_LOAN_DETAILS_PROMPT = """The user is applying for an education loan. They were asked about their course.
Their response: "{user_input}"

Extract any of these:
- course_level: ug, pg, professional, or diploma
- institution_type: domestic or abroad
- total_fees: total course fees in INR
- co_applicant_available: true/false (parent/guardian)
- co_applicant_income: co-applicant's monthly income in INR

Return ONLY valid JSON:
{{
  "course_level": "<level_or_null>",
  "institution_type": "<type_or_null>",
  "total_fees": <number_or_null>,
  "co_applicant_available": <true_false_or_null>,
  "co_applicant_income": <number_or_null>
}}"""

EXTRACT_PERSONAL_LOAN_PURPOSE_PROMPT = """The user is applying for a personal loan. They were asked about the purpose.
Their response: "{user_input}"

Map to one of: debt_consolidation, wedding, travel, medical, home_renovation, other

Return ONLY valid JSON:
{{"purpose": "<purpose>"}}"""

EXTRACT_BUSINESS_LOAN_DETAILS_PROMPT = """The user is applying for a business loan. They were asked about their business.
Their response: "{user_input}"

Extract:
- business_type: type/nature of business
- years_in_business: how many years
- annual_turnover: annual revenue in INR

Return ONLY valid JSON:
{{
  "business_type": "<type_or_null>",
  "years_in_business": <number_or_null>,
  "annual_turnover": <number_or_null>
}}"""

EXTRACT_CO_APPLICANT_PROMPT = """The user was asked about co-applicants and collateral.
Their response: "{user_input}"

Extract:
- has_co_applicant: true/false
- co_applicant_income: monthly income of co-applicant in INR (if mentioned)
- has_collateral: true/false (property, gold, FD, etc.)

Return ONLY valid JSON:
{{
  "has_co_applicant": <true_false_or_null>,
  "co_applicant_income": <number_or_null>,
  "has_collateral": <true_false_or_null>
}}"""

# ── Conversational Response Generation ─────────────────────────────────

ACKNOWLEDGMENT_PROMPT = """You are a friendly Indian bank loan advisor chatbot.

The user just provided this information:
Field: {field_name}
Value: {extracted_value}
Loan type: {loan_type}

{validation_warning}

Generate a brief (1-2 sentence) acknowledgment of what they shared.
If there's a validation warning, mention it helpfully but don't alarm them.
Be warm and professional. Use ₹ for amounts.

Do NOT ask any questions — just acknowledge."""

GENERATE_QUESTION_PROMPT = """You are a friendly Indian bank loan advisor chatbot.

Current profile so far:
{profile_summary}

You need to ask about: {next_field}
This is for a {loan_type} application.

{context_hint}

Generate a natural, conversational question. Keep it to 1-2 sentences.
Be warm and professional. Mention relevant Indian banking context if helpful.

IMPORTANT: Only ask about {next_field}. Do NOT ask multiple questions."""