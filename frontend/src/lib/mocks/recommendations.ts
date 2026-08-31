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
        loan_id: "HL-EASY-101",
        name: "EasyHome Loan",
        bank: "Neighbourhood Bank",
        category: "Home Loan",
        tag: "BEST MATCH",
        match_score: 94,
        interest_rate: 8.10,
        min_amount: 250000,
        max_amount: 30000000,
        tenure_months: tenureMonths,
        estimated_emi: calculateEMI(amount, 8.10, tenureMonths),
        processing_fee_pct: 0.75,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "EasyHome Loan offers an affordable home loan product with streamlined documentation for first-time home buyers.",
        bullet_points: [
          "Salaried applicants with a minimum 2 years employment qualify",
          "Minimum monthly income requirement: ₹20,000",
          "Reduced processing fee for salaried applicants with employer tie-ups",
          "Interest subsidy schemes may apply subject to government policy",
        ],
        policy_citations: [
          {
            policy_name: "EasyHome Loan Policy",
            clause_id: "home_scheme_easy_home",
            text: "Based on Neighbourhood Bank EasyHome Loan policy document",
          },
        ],
        features: [
          "Interest rate from 8.10% p.a.",
          "Loan amount up to ₹3,00,00,000",
          "Tenure up to 25 years",
          "Processing fee 0.75%",
        ],
      },
      {
        loan_id: "HL-FIRST-102",
        name: "FirstHome Advantage",
        bank: "Apex Bank",
        category: "Home Loan",
        tag: "POPULAR",
        match_score: 88,
        interest_rate: 8.35,
        min_amount: 500000,
        max_amount: 50000000,
        tenure_months: tenureMonths,
        estimated_emi: calculateEMI(amount, 8.35, tenureMonths),
        processing_fee_pct: 0.50,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Tailored for first-time homebuyers offering reduced processing fees and flexible tenure options.",
        bullet_points: [
          "Minimum monthly income requirement: ₹30,000",
          "Special interest rate concession for women co-applicants",
        ],
        policy_citations: [
          {
            policy_name: "FirstHome Advantage Policy",
            clause_id: "home_scheme_first_home",
            text: "Based on Apex Bank FirstHome Advantage policy document",
          },
        ],
        features: [
          "Interest rate from 8.35% p.a.",
          "Loan amount up to ₹5,00,00,000",
          "Tenure up to 30 years",
        ],
      },
      {
        loan_id: "HL-FLEXI-103",
        name: "FlexiMortgage",
        bank: "Metro Bank",
        category: "Home Loan",
        tag: "FLEXIBLE",
        match_score: 82,
        interest_rate: 8.60,
        min_amount: 1000000,
        max_amount: 75000000,
        tenure_months: tenureMonths,
        estimated_emi: calculateEMI(amount, 8.60, tenureMonths),
        processing_fee_pct: 0.50,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Flexible home loan facility allowing interest-only payments during construction phase.",
        bullet_points: [
          "Overdraft feature linked to salary account",
          "Pre-payment allowed with zero penalty",
        ],
        policy_citations: [
          {
            policy_name: "FlexiMortgage Policy",
            clause_id: "home_scheme_flexi_mortgage",
            text: "Based on Metro Bank FlexiMortgage policy document",
          },
        ],
        features: [
          "Interest rate from 8.60% p.a.",
          "Tenure up to 30 years",
        ],
      },
    ];
  } else if (intent === "Personal Loan") {
    recommendations = [
      {
        loan_id: "PL-QUICK-201",
        name: "QuickCash Personal Loan",
        bank: "FastCredit Bank",
        category: "Personal Loan",
        tag: "BEST MATCH",
        match_score: 95,
        interest_rate: 10.50,
        min_amount: 50000,
        max_amount: 1500000,
        tenure_months: Math.min(tenureMonths, 60),
        estimated_emi: calculateEMI(amount, 10.50, Math.min(tenureMonths, 60)),
        processing_fee_pct: 1.0,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Instant pre-approved personal loan for salaried professionals with minimal documentation.",
        bullet_points: [
          "Minimum monthly income: ₹25,000",
          "Disbursal within 2 hours of approval",
        ],
        policy_citations: [
          {
            policy_name: "QuickCash Personal Loan Policy",
            clause_id: "personal_scheme_quickcash",
            text: "Based on FastCredit Bank QuickCash policy document",
          },
        ],
        features: [
          "Interest rate 10.50% p.a.",
          "Tenure 12 to 60 months",
        ],
      },
      {
        loan_id: "PL-FLEXI-202",
        name: "FlexiPersonal Credit",
        bank: "City Trust Bank",
        category: "Personal Loan",
        tag: "POPULAR",
        match_score: 89,
        interest_rate: 11.25,
        min_amount: 100000,
        max_amount: 2500000,
        tenure_months: Math.min(tenureMonths, 60),
        estimated_emi: calculateEMI(amount, 11.25, Math.min(tenureMonths, 60)),
        processing_fee_pct: 1.25,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Flexible personal loan overdraft facility allowing partial drawdowns and repayments.",
        bullet_points: [
          "Interest charged only on withdrawn amount",
        ],
        policy_citations: [
          {
            policy_name: "FlexiPersonal Policy",
            clause_id: "personal_scheme_flexi",
            text: "Based on City Trust Bank FlexiPersonal policy document",
          },
        ],
        features: [
          "Interest rate 11.25% p.a.",
          "Revolving credit line",
        ],
      },
    ];
  } else if (intent === "Vehicle Loan") {
    recommendations = [
      {
        loan_id: "VL-SMART-301",
        name: "SmartAuto Car Loan",
        bank: "AutoFinance Bank",
        category: "Vehicle Loan",
        tag: "BEST MATCH",
        match_score: 93,
        interest_rate: 8.75,
        min_amount: 100000,
        max_amount: 5000000,
        tenure_months: Math.min(tenureMonths, 84),
        estimated_emi: calculateEMI(amount, 8.75, Math.min(tenureMonths, 84)),
        processing_fee_pct: 0.5,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Attractive auto financing covering up to 90% of on-road car price with quick dealer disbursal.",
        bullet_points: [
          "Special interest discount for electric vehicles",
          "Tenure up to 7 years",
        ],
        policy_citations: [
          {
            policy_name: "SmartAuto Policy",
            clause_id: "vehicle_scheme_smart_auto",
            text: "Based on AutoFinance Bank SmartAuto policy document",
          },
        ],
        features: [
          "Interest rate 8.75% p.a.",
          "Up to 90% on-road funding",
        ],
      },
      {
        loan_id: "VL-EASY-302",
        name: "EasyDrive Vehicle Loan",
        bank: "DriveCapital Bank",
        category: "Vehicle Loan",
        tag: "POPULAR",
        match_score: 87,
        interest_rate: 9.10,
        min_amount: 150000,
        max_amount: 3500000,
        tenure_months: Math.min(tenureMonths, 84),
        estimated_emi: calculateEMI(amount, 9.10, Math.min(tenureMonths, 84)),
        processing_fee_pct: 0.5,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Simplified car loan for both new and certified pre-owned vehicles.",
        bullet_points: [
          "Minimal documentation for existing bank customers",
        ],
        policy_citations: [
          {
            policy_name: "EasyDrive Policy",
            clause_id: "vehicle_scheme_easy_drive",
            text: "Based on DriveCapital Bank EasyDrive policy document",
          },
        ],
        features: [
          "Interest rate 9.10% p.a.",
          "Pre-approved instant offers",
        ],
      },
    ];
  } else if (intent === "Education Loan") {
    recommendations = [
      {
        loan_id: "EDU-SCHOLAR-601",
        name: "ScholarPlus Education Loan",
        bank: "EduTrust Bank",
        category: "Education Loan",
        tag: "TAX SAVER SEC 80E",
        match_score: 94,
        interest_rate: 8.50,
        min_amount: 200000,
        max_amount: 10000000,
        tenure_months: 144,
        estimated_emi: calculateEMI(amount, 8.50, 144),
        processing_fee_pct: 0.0,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Comprehensive education financing for domestic and international Tier-1 university admissions.",
        bullet_points: [
          "Moratorium period: Course duration + 1 year",
          "100% tax exemption on interest under Section 80E",
          "Zero processing fee for top-ranked institutions",
        ],
        policy_citations: [
          {
            policy_name: "ScholarPlus Policy",
            clause_id: "education_scheme_scholar_plus",
            text: "Based on EduTrust Bank ScholarPlus policy document",
          },
        ],
        features: [
          "Interest rate 8.50% p.a.",
          "Course + 12 months moratorium",
        ],
      },
      {
        loan_id: "EDU-FUTURE-602",
        name: "FutureBuilder Education Loan",
        bank: "Horizon Bank",
        category: "Education Loan",
        tag: "POPULAR",
        match_score: 88,
        interest_rate: 10.25,
        min_amount: 100000,
        max_amount: 1500000,
        tenure_months: 144,
        estimated_emi: calculateEMI(amount, 10.25, 144),
        processing_fee_pct: 0.75,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Supports undergraduate and skill development courses with flexible parent co-signing.",
        bullet_points: [
          "Subsidised interest rates for merit scholarship holders",
        ],
        policy_citations: [
          {
            policy_name: "FutureBuilder Policy",
            clause_id: "education_scheme_future_builder",
            text: "Based on Horizon Bank FutureBuilder policy document",
          },
        ],
        features: [
          "Interest rate 10.25% p.a.",
          "Tenure up to 12 years",
        ],
      },
    ];
  } else {
    // Default / Business Loan
    recommendations = [
      {
        loan_id: "BIZ-GROWTH-401",
        name: "GrowthBooster Business Loan",
        bank: "Enterprise Capital",
        category: "Business Loan",
        tag: "COLLATERAL-FREE",
        match_score: 92,
        interest_rate: 11.50,
        min_amount: 300000,
        max_amount: 5000000,
        tenure_months: 48,
        estimated_emi: calculateEMI(amount, 11.50, 48),
        processing_fee_pct: 1.25,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Collateral-free working capital loan for growing SMEs based on GST and banking turnover.",
        bullet_points: [
          "No physical mortgage collateral required up to ₹50 Lakhs",
          "Automated underwriting via digital bank statements",
        ],
        policy_citations: [
          {
            policy_name: "GrowthBooster Policy",
            clause_id: "business_scheme_growth_booster",
            text: "Based on Enterprise Capital GrowthBooster policy document",
          },
        ],
        features: [
          "Interest rate 11.50% p.a.",
          "Collateral-free up to ₹50L",
        ],
      },
      {
        loan_id: "BIZ-EXPRESS-402",
        name: "ExpressBiz Loan",
        bank: "Commercial Bank",
        category: "Business Loan",
        tag: "QUICK DISBURSAL",
        match_score: 86,
        interest_rate: 12.00,
        min_amount: 200000,
        max_amount: 3000000,
        tenure_months: 36,
        estimated_emi: calculateEMI(amount, 12.00, 36),
        processing_fee_pct: 1.5,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Fast-track credit facility for small business expansion and inventory purchases.",
        bullet_points: [
          "24-hour approval based on GST filing history",
        ],
        policy_citations: [
          {
            policy_name: "ExpressBiz Policy",
            clause_id: "business_scheme_express",
            text: "Based on Commercial Bank ExpressBiz policy document",
          },
        ],
        features: [
          "Interest rate 12.00% p.a.",
          "Fast 24-hour disbursal",
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
      model: "Cognis Bank Policy-Grounded Underwriting Engine",
      numbers_verified: true,
      rule_engine_verified: true,
      policy_grounded: true,
    },
  };
}
