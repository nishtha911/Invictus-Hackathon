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

  let candidates: RecommendedLoan[] = [];

  const isSalaried = !profile.employment_type || profile.employment_type.toLowerCase().includes("salaried");
  const isBusinessOwner = profile.employment_type?.toLowerCase().includes("business") || profile.employment_type?.toLowerCase().includes("self");

  if (intent === "Home Loan") {
    candidates = [
      {
        loan_id: "HL-EASY-101",
        name: "EasyHome Loan",
        bank: "Neighbourhood Bank",
        category: "Home Loan",
        match_score: income < 50000 ? 94 : 82,
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
          "Reduced processing fee for salaried applicants",
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
        ],
      },
      {
        loan_id: "HL-FIRST-102",
        name: "FirstHome Advantage",
        bank: "Apex Bank",
        category: "Home Loan",
        match_score: income >= 50000 && income <= 150000 && amount <= 50000000 ? 95 : 85,
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
        ],
      },
      {
        loan_id: "HL-FLEXI-103",
        name: "FlexiMortgage",
        bank: "Metro Bank",
        category: "Home Loan",
        match_score: isBusinessOwner || amount > 50000000 ? 92 : 80,
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
          "Overdraft feature linked to bank account",
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
      {
        loan_id: "HL-ROYAL-104",
        name: "RoyalMortgage Luxury Home Loan",
        bank: "Royal Trust",
        category: "Home Loan",
        match_score: income > 150000 || amount >= 50000000 ? 96 : 70,
        interest_rate: 8.25,
        min_amount: 5000000,
        max_amount: 100000000,
        tenure_months: tenureMonths,
        estimated_emi: calculateEMI(amount, 8.25, tenureMonths),
        processing_fee_pct: 0.35,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "High net worth luxury home financing with dedicated relationship manager and priority approval.",
        bullet_points: [
          "Minimum monthly income requirement: ₹1,50,000",
          "High LTV up to 80% for high-value properties",
        ],
        policy_citations: [
          {
            policy_name: "RoyalMortgage Policy",
            clause_id: "home_scheme_royal_mortgage",
            text: "Based on Royal Trust RoyalMortgage policy document",
          },
        ],
        features: [
          "Interest rate from 8.25% p.a.",
          "High limit up to ₹10,00,00,000",
        ],
      },
    ];
  } else if (intent === "Personal Loan") {
    candidates = [
      {
        loan_id: "PL-QUICK-201",
        name: "QuickCash Personal Loan",
        bank: "FastCredit Bank",
        category: "Personal Loan",
        match_score: income <= 50000 && amount <= 1500000 ? 95 : 82,
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
        match_score: isBusinessOwner || (income > 50000 && income <= 100000) ? 94 : 84,
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
      {
        loan_id: "PL-PREMIUM-203",
        name: "PremiumPersonal Loan",
        bank: "Elite Finance",
        category: "Personal Loan",
        match_score: income > 100000 || amount > 1500000 ? 96 : 75,
        interest_rate: 9.99,
        min_amount: 500000,
        max_amount: 5000000,
        tenure_months: Math.min(tenureMonths, 84),
        estimated_emi: calculateEMI(amount, 9.99, Math.min(tenureMonths, 84)),
        processing_fee_pct: 0.75,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "High-ticket personal loan with prime interest rates for high-income professionals.",
        bullet_points: [
          "Minimum monthly income: ₹75,000",
          "Zero pre-closure charges after 12 EMIs",
        ],
        policy_citations: [
          {
            policy_name: "PremiumPersonal Policy",
            clause_id: "personal_scheme_premium",
            text: "Based on Elite Finance PremiumPersonal policy document",
          },
        ],
        features: [
          "Interest rate from 9.99% p.a.",
          "Loan up to ₹50,00,000",
        ],
      },
    ];
  } else if (intent === "Vehicle Loan") {
    candidates = [
      {
        loan_id: "VL-NEWBIE-304",
        name: "NewbieCar First Auto Loan",
        bank: "FirstAuto Finance",
        category: "Vehicle Loan",
        match_score: income <= 40000 && amount <= 800000 ? 96 : 72,
        interest_rate: 9.25,
        min_amount: 50000,
        max_amount: 1000000,
        tenure_months: Math.min(tenureMonths, 84),
        estimated_emi: calculateEMI(amount, 9.25, Math.min(tenureMonths, 84)),
        processing_fee_pct: 0.5,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Tailored car loan for first-time car buyers with accessible income criteria.",
        bullet_points: [
          "Minimum monthly income: ₹18,000",
          "Special approval pathway for fresh salaried employees",
        ],
        policy_citations: [
          {
            policy_name: "NewbieCar Policy",
            clause_id: "vehicle_scheme_newbie",
            text: "Based on FirstAuto Finance NewbieCar policy document",
          },
        ],
        features: [
          "Interest rate 9.25% p.a.",
          "Low income requirement ₹18,000/mo",
        ],
      },
      {
        loan_id: "VL-SMART-301",
        name: "SmartAuto Car Loan",
        bank: "AutoFinance Bank",
        category: "Vehicle Loan",
        match_score: income > 40000 && income <= 120000 && isSalaried ? 94 : 85,
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
        loan_id: "VL-FLEET-303",
        name: "FleetPro Business Auto Loan",
        bank: "Commercial Auto Bank",
        category: "Vehicle Loan",
        match_score: isBusinessOwner || amount > 2500000 ? 97 : 70,
        interest_rate: 8.50,
        min_amount: 300000,
        max_amount: 10000000,
        tenure_months: Math.min(tenureMonths, 84),
        estimated_emi: calculateEMI(amount, 8.50, Math.min(tenureMonths, 84)),
        processing_fee_pct: 0.4,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "Commercial vehicle financing for business owners, fleet operators, and high-value luxury cars.",
        bullet_points: [
          "100% ex-showroom funding for commercial fleets",
          "GST tax benefit documentation provided",
        ],
        policy_citations: [
          {
            policy_name: "FleetPro Policy",
            clause_id: "vehicle_scheme_fleet_pro",
            text: "Based on Commercial Auto Bank FleetPro policy document",
          },
        ],
        features: [
          "Interest rate from 8.50% p.a.",
          "Up to ₹1,00,00,000 financing",
        ],
      },
      {
        loan_id: "VL-EASY-302",
        name: "EasyDrive Vehicle Loan",
        bank: "DriveCapital Bank",
        category: "Vehicle Loan",
        match_score: 83,
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
    candidates = [
      {
        loan_id: "EDU-SCHOLAR-601",
        name: "ScholarPlus Education Loan",
        bank: "EduTrust Bank",
        category: "Education Loan",
        match_score: amount <= 3000000 ? 94 : 85,
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
        loan_id: "EDU-ABROAD-603",
        name: "StudyAbroad Edge",
        bank: "Global Edu Bank",
        category: "Education Loan",
        match_score: amount > 3000000 ? 97 : 78,
        interest_rate: 9.10,
        min_amount: 1000000,
        max_amount: 15000000,
        tenure_months: 180,
        estimated_emi: calculateEMI(amount, 9.10, 180),
        processing_fee_pct: 0.5,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "High-cap education loan tailored for foreign universities with forex card and visa support.",
        bullet_points: [
          "Covers tuition, living expenses, travel & visa fees",
          "Multi-currency disbursal options",
        ],
        policy_citations: [
          {
            policy_name: "StudyAbroad Edge Policy",
            clause_id: "education_scheme_study_abroad",
            text: "Based on Global Edu Bank StudyAbroad Edge policy document",
          },
        ],
        features: [
          "Interest rate 9.10% p.a.",
          "Up to ₹1.5 Crore cover",
        ],
      },
    ];
  } else {
    // Business Loan
    candidates = [
      {
        loan_id: "BIZ-GROWTH-401",
        name: "GrowthBooster Business Loan",
        bank: "Enterprise Capital",
        category: "Business Loan",
        match_score: amount <= 5000000 ? 93 : 80,
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
        loan_id: "BIZ-ENT-404",
        name: "EnterpriseEdge Corporate Loan",
        bank: "Corporate Credit",
        category: "Business Loan",
        match_score: amount > 5000000 || income > 200000 ? 96 : 72,
        interest_rate: 10.25,
        min_amount: 5000000,
        max_amount: 100000000,
        tenure_months: 120,
        estimated_emi: calculateEMI(amount, 10.25, 120),
        processing_fee_pct: 0.75,
        eligibility_status: "Eligible",
        is_verified_calculation: true,
        reasoning: "High-capacity commercial enterprise loan for machinery purchase, expansion, and capex.",
        bullet_points: [
          "Competitive corporate rates from 10.25%",
          "Tenure up to 10 years",
        ],
        policy_citations: [
          {
            policy_name: "EnterpriseEdge Policy",
            clause_id: "business_scheme_enterprise",
            text: "Based on Corporate Credit EnterpriseEdge policy document",
          },
        ],
        features: [
          "Interest rate from 10.25% p.a.",
          "Cap up to ₹10 Crore",
        ],
      },
    ];
  }

  // Sort candidates by match_score descending
  candidates.sort((a, b) => b.match_score - a.match_score);

  // Assign tags: top match gets "BEST MATCH", second gets "POPULAR" if not already set
  if (candidates.length > 0) {
    candidates[0].tag = "BEST MATCH";
  }
  if (candidates.length > 1 && !candidates[1].tag) {
    candidates[1].tag = "POPULAR";
  }

  const recommendations = candidates;

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

