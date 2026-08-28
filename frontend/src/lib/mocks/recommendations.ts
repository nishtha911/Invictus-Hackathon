import { ProfileIntake, RecommendLoansResponse, RecommendedLoan } from "../types/contracts";

/**
 * Standard EMI Calculation helper for mock data generation
 * E = P * r * (1 + r)^n / ((1 + r)^n - 1)
 */
function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (!principal || !annualRate || !tenureMonths) return 0;
  const monthlyRate = annualRate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

export function generateMockRecommendations(profile: ProfileIntake): RecommendLoansResponse {
  const intent = profile.intent || "Home Loan";
  const amount = profile.loan_amount && profile.loan_amount > 0 
    ? profile.loan_amount 
    : intent === "Home Loan" 
    ? 4500000 
    : intent === "Gold Loan" 
    ? 300000 
    : 800000;
  const income = profile.income && profile.income > 0 ? profile.income : 120000;
  const tenureYears = profile.tenure_years || (intent === "Home Loan" ? 20 : intent === "Gold Loan" ? 2 : 5);
  const tenureMonths = tenureYears * 12;

  let recommendations: RecommendedLoan[] = [];

  if (intent === "Home Loan") {
    recommendations = [
      {
        loan_id: "HL-PRIME-101",
        name: "Prime Home Loan",
        category: "Home Loan",
        tag: "BEST MATCH",
        match_score: 94,
        interest_rate: 8.50,
        min_amount: 1500000,
        max_amount: 10000000,
        tenure_months: tenureMonths,
        estimated_emi: calculateEMI(amount, 8.50, tenureMonths),
        processing_fee_pct: 0.25,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Prime Home Loan delivers our lowest benchmark interest rate with zero prepayment penalties. Given your verified income profile and stable employment history, your FOIR (Fixed Obligation to Income Ratio) remains safely within the 42% threshold.",
        bullet_points: [
          "Requested loan amount fits perfectly within Tier-1 prime lending limits",
          "Calculated FOIR of 38.5% is well below the maximum 50% risk threshold",
          "Includes complimentary property legal & technical valuation checks",
          "Zero foreclosure charges after 12 active EMIs",
        ],
        policy_citations: [
          {
            policy_name: "Master Lending Policy v4.2",
            clause_id: "SEC-HL-8.1",
            text: "Salaried applicants with CIBIL > 750 qualify for prime floating rate of Repo + 2.00% (8.50% p.a.).",
          },
          {
            policy_name: "FOIR Guidelines 2025",
            clause_id: "ANNEX-B",
            text: "Net monthly disposable income surplus exceeds mandatory 50% post-EMI threshold.",
          },
        ],
        features: [
          "Repayment tenure up to 30 years",
          "Digital sanction letter within 48 hours",
          "PMAY subsidy assistance available",
          "Doorstep document pick-up",
        ],
      },
      {
        loan_id: "HL-FLEXI-102",
        name: "Flexi Home Loan",
        category: "Home Loan",
        tag: "MAX SAVINGS",
        match_score: 88,
        interest_rate: 8.75,
        min_amount: 2500000,
        max_amount: 15000000,
        tenure_months: tenureMonths,
        estimated_emi: calculateEMI(amount, 8.75, tenureMonths),
        processing_fee_pct: 0.35,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Features an integrated overdraft facility allowing you to park surplus savings against your loan balance, reducing daily interest accumulation while retaining liquidity.",
        bullet_points: [
          "Overdraft feature ideal for professionals with seasonal bonuses or dividends",
          "Interest calculated on daily net balance rather than gross principal",
          "Withdraw parked funds 24/7 without paperwork",
        ],
        policy_citations: [
          {
            policy_name: "OD Home Finance Circular 2024-C",
            clause_id: "OD-4.1",
            text: "Overdraft linked current account allows up to 25% interest reduction over tenure.",
          },
        ],
        features: [
          "Linked savings account",
          "Instant digital withdrawals via net banking",
          "Flexi-tenure adjustment options",
        ],
      },
      {
        loan_id: "HL-SMART-103",
        name: "Smart Home Finance",
        category: "Home Loan",
        tag: "FIXED + FLOATING",
        match_score: 81,
        interest_rate: 8.95,
        min_amount: 1000000,
        max_amount: 7500000,
        tenure_months: tenureMonths,
        estimated_emi: calculateEMI(amount, 8.95, tenureMonths),
        processing_fee_pct: 0.50,
        eligibility_status: "Conditionally Eligible",
        is_verified_calculation: true,
        reasoning: "Provides interest rate certainty with a fixed rate for the initial 3 years, transitioning to a transparent repo-linked floating rate thereafter.",
        bullet_points: [
          "Guarantees stable budgeting during the crucial initial property setup phase",
          "Seamless transition to market rates without refinancing charges",
        ],
        policy_citations: [
          {
            policy_name: "Hybrid Rate Framework",
            clause_id: "HYB-2.0",
            text: "Initial 36-month fixed band guarantees protection against rate-hiking cycles.",
          },
        ],
        features: [
          "3-year rate lock",
          "No switching fees at year 4",
          "Pre-approved home decor top-up option",
        ],
      },
    ];
  } else if (intent === "Gold Loan") {
    recommendations = [
      {
        loan_id: "GL-SOVEREIGN-501",
        name: "Sovereign Gold Express",
        category: "Gold Loan",
        tag: "BEST MATCH",
        match_score: 97,
        interest_rate: 8.95,
        min_amount: 25000,
        max_amount: 2500000,
        tenure_months: Math.min(tenureMonths, 24),
        estimated_emi: calculateEMI(amount, 8.95, Math.min(tenureMonths, 24)),
        processing_fee_pct: 0.2,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Instant liquidity backed by physical gold jewelry with competitive per-gram valuations and insured bank vault safety.",
        bullet_points: [
          "Up to 75% LTV on hallmarked 22K/24K gold jewelry",
          "Disbursal in under 30 minutes with minimal income documentation",
          "Free secure insurance coverage in bank branch vault",
          "Flexible interest-only bullet repayment schemes available",
        ],
        policy_citations: [
          {
            policy_name: "Gold Collateral Lending Policy 2025",
            clause_id: "GL-LTV-1.2",
            text: "RBI-compliant 75% loan-to-value ceiling with spot market bullion price reference.",
          },
        ],
        features: [
          "30-minute branch disbursal",
          "Zero income proof required up to ₹5 Lakhs",
          "Free high-security vault custody",
          "Bullet or monthly EMI options",
        ],
      },
      {
        loan_id: "GL-FLEXI-502",
        name: "Gold Overdraft Line",
        category: "Gold Loan",
        tag: "PAY INTEREST ON USE",
        match_score: 91,
        interest_rate: 9.45,
        min_amount: 100000,
        max_amount: 5000000,
        tenure_months: Math.min(tenureMonths, 36),
        estimated_emi: calculateEMI(amount, 9.45, Math.min(tenureMonths, 36)),
        processing_fee_pct: 0.35,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Credit line backed by pledged gold allowing you to withdraw whenever required and pay interest only on the utilized sum.",
        bullet_points: [
          "Revolving credit limit linked to UPI and debit card",
          "Interest charged strictly on daily utilized amount",
        ],
        policy_citations: [
          {
            policy_name: "Overdraft Collateral Regulations",
            clause_id: "OD-GL-3.0",
            text: "Annual renewal facility with zero part-prepayment penalties.",
          },
        ],
        features: [
          "ATM withdrawal enabled",
          "Repay principal anytime without charges",
          "Multi-year credit line",
        ],
      },
    ];
  } else if (intent === "Personal Loan") {
    recommendations = [
      {
        loan_id: "PL-EXPRESS-201",
        name: "Express Personal Loan",
        category: "Personal Loan",
        tag: "BEST MATCH",
        match_score: 96,
        interest_rate: 10.49,
        min_amount: 100000,
        max_amount: 2500000,
        tenure_months: Math.min(tenureMonths, 60),
        estimated_emi: calculateEMI(amount, 10.49, Math.min(tenureMonths, 60)),
        processing_fee_pct: 1.0,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Instant digital sanction with paperless verification. Matches your income band for immediate credit into your primary salary account.",
        bullet_points: [
          "Zero collateral required with end-to-end e-KYC",
          "Calculated repayment obligations are well within safe disposable limit",
          "Disbursal within 4 business hours",
        ],
        policy_citations: [
          {
            policy_name: "Unsecured Retail Credit Policy 2025",
            clause_id: "URC-7.2",
            text: "Salaried professionals earning > ₹50,000/mo qualify for instant disbursal up to 15x monthly take-home.",
          },
        ],
        features: [
          "100% paperless e-Sign",
          "Flexible tenure from 12 to 60 months",
          "No physical branch visit required",
        ],
      },
      {
        loan_id: "PL-PREMIER-202",
        name: "Premier Salaried Credit",
        category: "Personal Loan",
        tag: "LOWEST EMI",
        match_score: 89,
        interest_rate: 10.99,
        min_amount: 250000,
        max_amount: 3500000,
        tenure_months: Math.min(tenureMonths, 72),
        estimated_emi: calculateEMI(amount, 10.99, Math.min(tenureMonths, 72)),
        processing_fee_pct: 0.75,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Tailored for corporate employees with structured step-up repayment matching your annual appraisal schedule.",
        bullet_points: [
          "Lower initial EMIs in year 1 with structured step-up options",
          "Special processing fee waiver for corporate banking relationships",
        ],
        policy_citations: [
          {
            policy_name: "Corporate Salary Tie-up Matrix",
            clause_id: "CORP-1.8",
            text: "Category-A corporate employees receive 50 bps interest concession and 50% fee discount.",
          },
        ],
        features: [
          "Step-up EMI structure",
          "Part-prepayment allowed after 6 months",
          "Dedicated relationship manager",
        ],
      },
    ];
  } else if (intent === "Vehicle Loan") {
    recommendations = [
      {
        loan_id: "VL-DRIVEPLUS-301",
        name: "DrivePlus Auto Loan",
        category: "Vehicle Loan",
        tag: "BEST MATCH",
        match_score: 93,
        interest_rate: 8.85,
        min_amount: 300000,
        max_amount: 5000000,
        tenure_months: Math.min(tenureMonths, 84),
        estimated_emi: calculateEMI(amount, 8.85, Math.min(tenureMonths, 84)),
        processing_fee_pct: 0.5,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Comprehensive auto financing covering on-road pricing with tie-ups across all authorized dealerships and zero hidden prepayment fees.",
        bullet_points: [
          "Up to 100% on-road funding on selected models",
          "Fixed interest rate for the entire tenure",
          "Instant dealer payout token",
        ],
        policy_citations: [
          {
            policy_name: "Auto Finance Master Terms",
            clause_id: "AUTO-3.5",
            text: "Electric and hybrid vehicles qualify for special 25 bps green mobility discount.",
          },
        ],
        features: [
          "Tenure up to 7 years",
          "Direct dealer disbursal",
          "Optional road-side assistance bundle",
        ],
      },
      {
        loan_id: "VL-GREEN-302",
        name: "Green Mobility EV Loan",
        category: "Vehicle Loan",
        tag: "GREEN SPECIAL",
        match_score: 89,
        interest_rate: 8.60,
        min_amount: 400000,
        max_amount: 4000000,
        tenure_months: Math.min(tenureMonths, 84),
        estimated_emi: calculateEMI(amount, 8.60, Math.min(tenureMonths, 84)),
        processing_fee_pct: 0.25,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Subsidized interest rates and zero processing fees for electric 4-wheelers and commercial fleet upgrades.",
        bullet_points: [
          "Discounted interest rates for certified zero-emission vehicles",
          "Free battery warranty protection tie-up",
        ],
        policy_citations: [
          {
            policy_name: "Green Energy Lending Initiative",
            clause_id: "EV-1.1",
            text: "Zero processing fee on all EV models recognized under government green subsidy guidelines.",
          },
        ],
        features: [
          "Zero processing fee",
          "Special charging infrastructure financing",
        ],
      },
    ];
  } else {
    // Default / Business Loan / Education Loan
    recommendations = [
      {
        loan_id: "BIZ-GROWTH-401",
        name: "Enterprise Growth Credit",
        category: "Business Loan",
        tag: "COLLATERAL-FREE",
        match_score: 92,
        interest_rate: 11.75,
        min_amount: 500000,
        max_amount: 7500000,
        tenure_months: 48,
        estimated_emi: calculateEMI(amount, 11.75, 48),
        processing_fee_pct: 1.25,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Collateral-free working capital loan backed by GST invoice and bank statement cash-flow analytics.",
        bullet_points: [
          "Based on digital banking transactions without physical balance sheet audits",
          "Disbursal into business current account in 24 hours",
        ],
        policy_citations: [
          {
            policy_name: "SME Credit Underwriting Standard",
            clause_id: "SME-8.0",
            text: "GST returns > 12 months qualify for automated underwriting without mortgage collateral.",
          },
        ],
        features: [
          "GST data integration",
          "Bullet repayment option for working capital",
          "CGTMSE cover eligible",
        ],
      },
      {
        loan_id: "EDU-GLOBAL-601",
        name: "Global Scholar Loan",
        category: "Education Loan",
        tag: "TAX SAVER SEC 80E",
        match_score: 88,
        interest_rate: 9.25,
        min_amount: 500000,
        max_amount: 8000000,
        tenure_months: 84,
        estimated_emi: calculateEMI(amount, 9.25, 84),
        processing_fee_pct: 0.5,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Moratorium support covering entire course duration plus 1 year grace period before EMI repayment begins.",
        bullet_points: [
          "100% tuition + living expenses covered",
          "100% tax deduction on interest paid under Section 80E",
        ],
        policy_citations: [
          {
            policy_name: "Priority Sector Education Guidelines",
            clause_id: "EDU-4.0",
            text: "No collateral required for recognized Tier-1 universities up to ₹40 Lakhs.",
          },
        ],
        features: [
          "Course + 1 year moratorium",
          "Global university tie-ups",
          "Pre-visa sanction letter",
        ],
      },
    ];
  }

  return {
    status: "success",
    recommended_loans: recommendations,
    profile_summary: {
      intent,
      income,
      loan_amount: amount,
      tenure_years: tenureYears,
      employment_type: profile.employment_type || "Salaried",
    },
    explanation_meta: {
      model: "DhanSetu Policy-Grounded Underwriting Model",
      numbers_verified: true,
      rule_engine_verified: true,
      policy_grounded: true,
    },
  };
}
