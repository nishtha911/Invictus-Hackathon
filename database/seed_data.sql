-- ============================================================================
-- Pod 3: Master Seed Data (20 Products, 15 Profiles, 15 Leads)
-- ============================================================================

-- 1. LOAN CATALOGUE
INSERT INTO loan_products (
    product_id, product_name, category, min_amount, max_amount, 
    min_tenure_months, max_tenure_months, base_interest_rate, 
    min_monthly_income, min_credit_score, allowed_employment_types, max_foir_pct, processing_fee_pct, features
) VALUES
-- Home Loans
('HL-STD-01', 'Standard Home Loan', 'home_loan', 500000, 15000000, 36, 360, 8.60, 35000, 700, '{"salaried", "self_employed", "business_owner"}', 0.55, 0.50, '["Zero prepayment on floating", "PMAY subsidy eligible", "Up to 80% LTV"]'::jsonb),
('HL-AFF-02', 'Affordable Housing Scheme Loan', 'home_loan', 300000, 3500000, 24, 240, 8.25, 20000, 650, '{"salaried", "self_employed"}', 0.60, 0.25, '["Subsidized interest", "Women co-owner discount 0.05%", "Low processing fee"]'::jsonb),
('HL-LUX-03', 'Prime Villa & Luxury Home Loan', 'home_loan', 15000000, 100000000, 60, 360, 8.45, 250000, 750, '{"salaried", "business_owner"}', 0.60, 0.35, '["Dedicated wealth manager", "Flexible repayment holidays", "Overdraft facility"]'::jsonb),
('HL-REN-04', 'Home Improvement & Renovation Loan', 'home_loan', 100000, 2500000, 12, 120, 9.15, 30000, 680, '{"salaried", "self_employed"}', 0.50, 0.75, '["No technical valuation fee", "Fast 48hr disbursal"]'::jsonb),

-- Personal Loans
('PL-INST-01', 'Express Digital Personal Loan', 'personal_loan', 50000, 1000000, 12, 60, 10.75, 25000, 720, '{"salaried"}', 0.45, 1.50, '["Instant 2-hour digital disbursal", "Zero physical paperwork", "Flexible tenure"]'::jsonb),
('PL-FLEXI-02', 'Flexi Line of Credit', 'personal_loan', 100000, 2500000, 12, 72, 11.50, 45000, 700, '{"salaried", "business_owner"}', 0.50, 1.00, '["Pay interest only on drawn amount", "Unlimited part-prepayments at zero cost"]'::jsonb),
('PL-MED-03', 'Medical & Emergency Care Loan', 'personal_loan', 50000, 800000, 6, 36, 9.99, 20000, 640, '{"salaried", "self_employed", "business_owner"}', 0.55, 0.00, '["Zero processing fee", "Hospital direct settlement", "Priority approval"]'::jsonb),
('PL-WED-04', 'Wedding & Lifestyle Loan', 'personal_loan', 100000, 2000000, 12, 60, 11.25, 35000, 690, '{"salaried"}', 0.50, 1.25, '["Co-applicant permitted", "Special travel voucher partner perks"]'::jsonb),

-- Vehicle Loans
('VL-CAR-01', 'New Four-Wheeler Auto Loan', 'vehicle_loan', 100000, 5000000, 12, 84, 8.85, 30000, 680, '{"salaried", "self_employed", "business_owner"}', 0.50, 0.50, '["Up to 90% on-road funding", "Tie-ups with leading manufacturers"]'::jsonb),
('VL-EV-02', 'Green EV Electric Mobility Loan', 'vehicle_loan', 100000, 6000000, 12, 96, 8.35, 30000, 680, '{"salaried", "self_employed", "business_owner"}', 0.55, 0.25, '["Special 0.50% EV interest rebate", "Up to 95% on-road financing"]'::jsonb),
('VL-TW-03', 'Two-Wheeler Easy Ride Loan', 'vehicle_loan', 25000, 350000, 6, 48, 10.25, 15000, 600, '{"salaried", "self_employed"}', 0.45, 1.00, '["100% ex-showroom financing", "Instant spot sanction"]'::jsonb),
('VL-USEDCAR-04', 'Pre-Owned Certified Car Loan', 'vehicle_loan', 100000, 2500000, 12, 60, 11.50, 25000, 660, '{"salaried", "self_employed"}', 0.50, 1.50, '["Up to 80% valuation funding", "Includes 1-year warranty package"]'::jsonb),

-- Business Loans
('BL-SME-01', 'SME Growth & Working Capital Loan', 'business_loan', 500000, 7500000, 12, 60, 12.50, 75000, 680, '{"business_owner", "self_employed"}', 0.50, 1.25, '["Collateral-free up to ₹50L under CGTMSE", "Cash credit facility"]'::jsonb),
('BL-MUDRA-02', 'Pradhan Mantri MUDRA Tarun Loan', 'business_loan', 50000, 1000000, 12, 60, 9.50, 25000, 620, '{"business_owner", "self_employed"}', 0.55, 0.00, '["Zero collateral", "Zero processing fee for micro enterprises"]'::jsonb),
('BL-MACH-03', 'Equipment & Machinery Term Loan', 'business_loan', 1000000, 20000000, 24, 84, 11.20, 100000, 700, '{"business_owner"}', 0.55, 1.00, '["Machinery itself acts as primary security", "Moratorium up to 6 months"]'::jsonb),
('BL-WOMEN-04', 'Women Business Enterprise Shakti Loan', 'business_loan', 200000, 5000000, 12, 60, 10.80, 40000, 650, '{"business_owner"}', 0.55, 0.50, '["Special 0.75% rate discount for 51%+ women-owned businesses"]'::jsonb),

-- Education Loans
('EL-GLOBAL-01', 'Global Premier Studies Overseas Loan', 'education_loan', 500000, 15000000, 36, 180, 9.40, 30000, 650, '{"salaried", "self_employed"}', 0.50, 0.75, '["100% fee + living expense coverage", "Moratorium (Course + 1 year)", "Sec 80E tax benefit"]'::jsonb),
('EL-DOM-02', 'India Premier College & STEM Loan', 'education_loan', 200000, 4000000, 24, 144, 8.85, 20000, 630, '{"salaried", "self_employed"}', 0.55, 0.50, '["No collateral required up to ₹7.5 Lakhs", "Fast track for IIT/IIM/AIIMS"]'::jsonb),
('EL-EXEC-03', 'Executive MBA & Upskilling Loan', 'education_loan', 100000, 2500000, 12, 60, 10.15, 50000, 700, '{"salaried"}', 0.45, 1.00, '["Weekend/Hybrid course eligible", "Direct university fee disbursal"]'::jsonb),
('EL-VOC-04', 'Vocational Aviation & Pilot Training Loan', 'education_loan', 500000, 8000000, 36, 144, 10.50, 45000, 660, '{"salaried", "self_employed"}', 0.50, 1.00, '["Includes simulator and flight hour training costs", "Flexible collateral options"]'::jsonb)
ON CONFLICT (product_id) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    base_interest_rate = EXCLUDED.base_interest_rate,
    features = EXCLUDED.features;

-- 2. CUSTOMER PROFILES
INSERT INTO customer_profiles (
    session_id, user_type, applicant_name, intent, age, monthly_income, 
    employment_type, requested_loan_amount, preferred_tenure_months, 
    existing_emi_obligations, credit_score_band, urgency, completeness_pct, turns_taken,
    home_loan_details, vehicle_loan_details, business_loan_details
) VALUES
('3b91918c-bacf-48d6-a06d-bc86d3ad401d', 'guest', 'Rajesh Sharma', 'home_loan', 60, 500000, 'salaried', 2500000, 60, 50000, 'excellent', 'within_3_months', 100, 5, '{"property_value": 4500000, "is_first_property": true}'::jsonb, NULL, NULL),
('8de4ab39-f983-4d06-94fa-32d9d2bb548e', 'guest', 'Shruti Patel', 'vehicle_loan', 30, 85000, 'salaried', 225000, 36, 5000, 'good', 'within_3_months', 100, 6, NULL, '{"vehicle_type": "two_wheeler", "new_or_used": "new", "vehicle_price": 250000}'::jsonb, NULL),
('5e9ef6b8-0f21-41d9-be2a-6e87b0c56d80', 'guest', 'Paras Mehta', 'business_loan', 35, 180000, 'business_owner', 2500000, 48, 0, 'good', 'immediate', 90, 4, NULL, NULL, '{"business_type": "manufacturing", "annual_turnover": 12000000}'::jsonb),
('d1111111-aaaa-4bbb-cccc-111111111111', 'guest', 'Ananya Deshmukh', 'education_loan', 23, 40000, 'salaried', 4500000, 120, 0, 'good', 'immediate', 100, 7, NULL, NULL, NULL),
('d2222222-aaaa-4bbb-cccc-222222222222', 'existing_customer', 'Vikramaditya Rao', 'home_loan', 48, 450000, 'business_owner', 25000000, 240, 45000, 'excellent', 'immediate', 100, 5, '{"property_value": 35000000, "property_location": "Bandra, Mumbai"}'::jsonb, NULL, NULL),
('d3333333-aaaa-4bbb-cccc-333333333333', 'guest', 'Neha Kulkarni', 'vehicle_loan', 32, 110000, 'salaried', 1500000, 60, 10000, 'excellent', 'within_3_months', 100, 6, NULL, '{"vehicle_type": "four_wheeler", "new_or_used": "new", "vehicle_price": 1750000}'::jsonb, NULL),
('d4444444-aaaa-4bbb-cccc-444444444444', 'guest', 'Amitabh Verma', 'personal_loan', 29, 65000, 'salaried', 600000, 36, 8000, 'fair', 'immediate', 100, 5, NULL, NULL, NULL),
('d5555555-aaaa-4bbb-cccc-555555555555', 'existing_customer', 'Dr. Pooja Iyer', 'business_loan', 41, 190000, 'business_owner', 1800000, 48, 15000, 'excellent', 'immediate', 100, 6, NULL, NULL, '{"business_type": "healthcare_clinic", "annual_turnover": 8500000}'::jsonb),
('d6666666-aaaa-4bbb-cccc-666666666666', 'guest', 'Suresh Jadhav', 'home_loan', 38, 32000, 'salaried', 1800000, 180, 2000, 'good', 'within_3_months', 100, 7, '{"property_value": 2200000, "property_location": "Nashik"}'::jsonb, NULL, NULL),
('d7777777-aaaa-4bbb-cccc-777777777777', 'guest', 'Rahul Nair', 'personal_loan', 34, 52000, 'salaried', 300000, 24, 4000, 'good', 'immediate', 100, 4, NULL, NULL, NULL),
('d8888888-aaaa-4bbb-cccc-888888888888', 'guest', 'Karan Johri', 'vehicle_loan', 27, 45000, 'salaried', 450000, 48, 6000, 'fair', 'exploring', 85, 5, NULL, '{"vehicle_type": "four_wheeler", "new_or_used": "used", "vehicle_price": 550000}'::jsonb, NULL),
('d9999999-aaaa-4bbb-cccc-999999999999', 'existing_customer', 'Ritu Sengupta', 'education_loan', 31, 140000, 'salaried', 2000000, 48, 0, 'excellent', 'immediate', 100, 5, NULL, NULL, NULL),
('da111111-aaaa-4bbb-cccc-aaaaaaaaaaaa', 'guest', 'Deepankar Roy', 'personal_loan', 45, 60000, 'salaried', 1200000, 60, 32000, 'poor', 'exploring', 100, 6, NULL, NULL, NULL),
('db222222-aaaa-4bbb-cccc-bbbbbbbbbbbb', 'guest', 'Manish Gupta', 'business_loan', 26, 35000, 'self_employed', 400000, 36, 0, 'fair', 'immediate', 90, 4, NULL, NULL, '{"business_type": "kirana_retail"}'::jsonb),
('dc333333-aaaa-4bbb-cccc-cccccccccccc', 'guest', 'Priya Nambiar', 'home_loan', 39, 95000, 'salaried', 1200000, 84, 11000, 'good', 'within_3_months', 100, 6, '{"property_value": 7000000, "renovation_type": "interior_overhaul"}'::jsonb, NULL, NULL)
ON CONFLICT (session_id) DO UPDATE SET
    applicant_name = EXCLUDED.applicant_name,
    monthly_income = EXCLUDED.monthly_income,
    requested_loan_amount = EXCLUDED.requested_loan_amount;

-- 3. QUALIFIED LEADS
INSERT INTO qualified_leads (
    lead_id, session_id, full_name, phone, email, preferred_contact_time,
    interested_product_id, lead_score, lead_band, score_factors,
    chat_summary, key_objections_or_notes, recommended_talking_points, status
) VALUES
('a1111111-1111-1111-1111-111111111111', '3b91918c-bacf-48d6-a06d-bc86d3ad401d', 'Rajesh Sharma', '+91 98201 12345', 'rajesh.sharma@gmail.com', 'Evening (5 PM - 8 PM)', 'HL-STD-01', 94, 'hot', '["income_verified", "excellent_cibil_820", "low_existing_emi", "immediate_decision"]'::jsonb, 'High-net-worth salaried executive seeking ₹25L Home Loan to complete final property payment. Ready with down payment.', 'Wants written assurance of zero prepayment fees on floating interest.', '["Highlight 8.60% competitive rate", "Explain zero penalty part-closure", "Offer express digital sanction"]'::jsonb, 'new'),

('a2222222-2222-2222-2222-222222222222', 'd1111111-aaaa-4bbb-cccc-111111111111', 'Ananya Deshmukh', '+91 98112 34567', 'ananya.deshmukh@outlook.com', 'Morning (9 AM - 11 AM)', 'EL-GLOBAL-01', 91, 'hot', '["top_tier_us_university_admit", "strong_co_borrower_father", "visa_appointment_next_week"]'::jsonb, 'Admitted to Columbia University MS CS. Requires ₹45 Lakhs covering I-20 financial proof. Father is primary co-applicant with ₹1.8L monthly pension/salary.', 'Needs Sanction Letter within 4 days for US Visa interview.', '["Highlight Moratorium period (Course + 1 year)", "Offer fast-track digital i-20 sanction letter", "Explain Sec 80E tax deduction"]'::jsonb, 'new'),

('a3333333-3333-3333-3333-333333333333', 'd2222222-aaaa-4bbb-cccc-222222222222', 'Vikramaditya Rao', '+91 99200 88776', 'vikram.rao@raocorp.in', 'Afternoon (2 PM - 4 PM)', 'HL-LUX-03', 96, 'hot', '["high_net_worth", "repeat_bank_client", "high_ticket_size_2.5cr"]'::jsonb, 'Promoter purchasing a sea-facing luxury apartment in Bandra for ₹3.5 Cr. Requested ₹2.5 Cr loan.', 'Comparing our 8.45% rate against private competitor offering 8.40%.', '["Pitch dedicated wealth manager relationship", "Waive legal inspection fee", "Bundle home loan overdraft account"]'::jsonb, 'contacted'),

('a4444444-4444-4444-4444-444444444444', 'd5555555-aaaa-4bbb-cccc-555555555555', 'Dr. Pooja Iyer', '+91 98700 11223', 'dr.pooja.iyer@careclinic.org', 'Evening (6 PM - 8 PM)', 'BL-WOMEN-04', 88, 'hot', '["established_practice_10yrs", "audited_gst_returns", "women_shakti_eligible"]'::jsonb, 'Cardiologist expanding diagnostic equipment. Looking for ₹18 Lakhs uncollateralized loan.', 'Needs clarity on whether GST returns are sufficient proof without property hypothecation.', '["Pitch 0.75% discount under Women Shakti scheme", "Confirm CGTMSE zero collateral cover"]'::jsonb, 'converted'),

('a5555555-5555-5555-5555-555555555555', 'd3333333-aaaa-4bbb-cccc-333333333333', 'Neha Kulkarni', '+91 97654 32109', 'neha.kulkarni@techcorp.com', 'Anytime on WhatsApp', 'VL-EV-02', 82, 'warm', '["stable_mnc_employee", "ev_interest_rebate_eligible"]'::jsonb, 'Booking a Tata Harrier EV. Seeking ₹15L loan over 5 years. Evaluating dealer finance vs direct bank.', 'Dealer is giving a small insurance discount if financed via their NBFC.', '["Show overall interest saving with bank 8.35% green rate", "Offer 95% on-road funding"]'::jsonb, 'new'),

('a6666666-6666-6666-6666-666666666666', 'd7777777-aaaa-4bbb-cccc-777777777777', 'Rahul Nair', '+91 98922 44556', 'rahul.nair89@gmail.com', 'Immediate', 'PL-MED-03', 89, 'hot', '["urgent_medical_need", "good_salary_account_holder"]'::jsonb, 'Requires ₹3 Lakhs immediately for family hospitalization. Clean bureau record.', 'Needs disbursal within 6 hours directly to hospital.', '["Activate instant digital sanction with zero processing fee", "Direct NEFT transfer"]'::jsonb, 'contacted'),

('a7777777-7777-7777-7777-777777777777', '8de4ab39-f983-4d06-94fa-32d9d2bb548e', 'Shruti Patel', '+91 98765 43210', 'shruti.patel@gmail.com', 'Morning (10 AM - 12 PM)', 'VL-TW-03', 76, 'warm', '["steady_income", "low_ticket_size"]'::jsonb, 'Buying Ather 450X electric scooter. Requested ₹2.25L over 3 years.', 'Hesitant about down payment requirements.', '["Offer 100% on-road funding with zero down payment option"]'::jsonb, 'new'),

('a8888888-8888-8888-8888-888888888888', '5e9ef6b8-0f21-41d9-be2a-6e87b0c56d80', 'Paras Mehta', '+91 99302 98765', 'paras.mehta@mehtatex.com', 'Afternoon (3 PM - 5 PM)', 'BL-SME-01', 79, 'warm', '["healthy_turnover_1.2cr", "growing_orderbook"]'::jsonb, 'Textile firm owner needs ₹25L for inventory cycle ahead of festive season.', 'Wanted confirmation on turnaround time for sanction.', '["Explain 48-hour in-principle sanction", "Offer overdraft limit option"]'::jsonb, 'contacted'),

('a9999999-9999-9999-9999-999999999999', 'd6666666-aaaa-4bbb-cccc-666666666666', 'Suresh Jadhav', '+91 98450 67890', 'suresh.jadhav@rediffmail.com', 'Evening (7 PM - 9 PM)', 'HL-AFF-02', 74, 'warm', '["first_time_home_buyer", "eligible_for_pmay"]'::jsonb, 'Purchasing 1BHK in Nashik. Needs guidance on government subsidy.', 'Wants assistance with PMAY documentation.', '["Help file PMAY subsidy application for ₹2.67L interest subsidy", "Offer 8.25% lowest rate"]'::jsonb, 'new'),

('ba111111-1111-1111-1111-111111111111', 'd9999999-aaaa-4bbb-cccc-999999999999', 'Ritu Sengupta', '+91 98300 55443', 'ritu.sengupta@fintech.co', 'Weekend (11 AM - 2 PM)', 'EL-EXEC-03', 92, 'hot', '["high_salary_1.4l", "isb_hyderabad_candidate", "zero_debts"]'::jsonb, 'Admitted to PGPpro executive program at ISB. Requested ₹20 Lakhs.', 'Wants tax deduction structure explained.', '["Confirm 100% tax benefit on interest under 80E", "Zero margin money requirement"]'::jsonb, 'converted'),

('bb222222-2222-2222-2222-222222222222', 'd4444444-aaaa-4bbb-cccc-444444444444', 'Amitabh Verma', '+91 98190 22334', 'amitabh.verma@gmail.com', 'Afternoon (1 PM - 3 PM)', 'PL-INST-01', 70, 'warm', '["salaried", "fair_cibil_690"]'::jsonb, 'Wedding planned in November. Looking for ₹6L personal loan.', 'Wants to keep EMI under ₹20,000/month.', '["Recommend 48-month tenure to reduce EMI to ₹15,700"]'::jsonb, 'new'),

('bc333333-3333-3333-3333-333333333333', 'dc333333-aaaa-4bbb-cccc-cccccccccccc', 'Priya Nambiar', '+91 97110 99887', 'priya.nambiar@designstudio.in', 'Morning (10 AM - 12 PM)', 'HL-REN-04', 78, 'warm', '["existing_property_owner", "high_disposable_income"]'::jsonb, 'Renovating 3BHK flat. Looking for ₹12L home improvement loan.', 'Needs confirmation on whether architect quotation is required.', '["Clarify self-declaration policy for loans under ₹15L", "Fast track approval"]'::jsonb, 'contacted'),

('bd444444-4444-4444-4444-444444444444', 'db222222-aaaa-4bbb-cccc-bbbbbbbbbbbb', 'Manish Gupta', '+91 96500 12345', 'manish.gupta26@gmail.com', 'Evening (6 PM - 8 PM)', 'BL-MUDRA-02', 58, 'cold', '["new_business", "no_prior_banking_history"]'::jsonb, 'Opening grocery shop. Requires ₹4L MUDRA loan.', 'Has no ITR filed for previous years.', '["Direct to branch for manual offline assessment under Shishu/Kishore scheme"]'::jsonb, 'dropped'),

('be555555-5555-5555-5555-555555555555', 'd8888888-aaaa-4bbb-cccc-888888888888', 'Karan Johri', '+91 99100 66778', 'karan.johri@yahoo.co.in', 'Afternoon (2 PM - 4 PM)', 'VL-USEDCAR-04', 52, 'cold', '["low_credit_score_620", "exploring_phase"]'::jsonb, 'Looking at second-hand Honda City. Just browsing options.', 'Unlikely to purchase within 3 months.', '["Keep in automated email drip campaign", "Suggest credit repair tips"]'::jsonb, 'dropped'),

('bf666666-6666-6666-6666-666666666666', 'da111111-aaaa-4bbb-cccc-aaaaaaaaaaaa', 'Deepankar Roy', '+91 98210 33445', 'deepankar.roy@rediffmail.com', 'Morning', 'PL-INST-01', 35, 'cold', '["high_foir_68_percent", "multiple_active_loans"]'::jsonb, 'Requested ₹12L personal loan but has existing EMIs taking up 60%+ of salary.', 'Does not qualify for additional unsecured exposure.', '["Offer loan consolidation program to merge existing loans into single lower EMI"]'::jsonb, 'dropped')
ON CONFLICT (lead_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    lead_score = EXCLUDED.lead_score,
    status = EXCLUDED.status;