/**
 * LoanSense AI Global Constants
 */

export const BRAND = {
  name: "LoanSense AI",
  tagline: "Intelligent Lending Advisor",
  subtext: "Personalized, verified, and policy-grounded loan advisory for modern banking.",
};

export const API_ENDPOINTS = {
  extractProfile: "/api/v1/extract-profile",
  recommendLoans: "/api/v1/recommend-loans",
  leads: "/api/v1/leads",
};

export const LOAN_PURPOSES = [
  {
    id: "Home Loan",
    label: "Home Loan",
    description: "Purchase, construction, or plot financing",
    icon: "Home",
    badge: "Most Popular",
    suggestedAmounts: [2500000, 5000000, 7500000, 12000000],
  },
  {
    id: "Personal Loan",
    label: "Personal Loan",
    description: "Wedding, medical, travel, or debt consolidation",
    icon: "User",
    badge: "Quick Disbursal",
    suggestedAmounts: [200000, 500000, 1000000, 1500000],
  },
  {
    id: "Vehicle Loan",
    label: "Vehicle Loan",
    description: "New/used car, EV, or two-wheeler financing",
    icon: "Car",
    badge: "Low EMI",
    suggestedAmounts: [500000, 1000000, 1800000, 2500000],
  },
  {
    id: "Business Loan",
    label: "Business Loan",
    description: "Working capital, expansion, or equipment purchase",
    icon: "Briefcase",
    badge: "Growth Capital",
    suggestedAmounts: [1000000, 2500000, 5000000, 10000000],
  },
  {
    id: "Education Loan",
    label: "Education Loan",
    description: "Higher studies in India or abroad",
    icon: "GraduationCap",
    badge: "Tax Benefit",
    suggestedAmounts: [1000000, 2000000, 4000000, 6000000],
  },
];

export const EMPLOYMENT_TYPES = [
  { id: "Salaried", label: "Salaried Professional", subtext: "Regular monthly salary in bank" },
  { id: "Self-Employed Professional", label: "Self-Employed Professional", subtext: "Doctor, CA, Architect, Consultant" },
  { id: "Business Owner", label: "Business Owner / Trader", subtext: "Proprietor, Director, GST Registered" },
  { id: "Gig / Freelance", label: "Contractor / Freelancer", subtext: "Variable retainer / project invoices" },
];

export const CREDIT_BANDS = [
  { id: "Excellent (780+)", label: "Excellent (780+)", subtext: "Never missed a payment, prime rates" },
  { id: "Good (720 - 779)", label: "Good (720 - 779)", subtext: "Consistently healthy credit history" },
  { id: "Fair (650 - 719)", label: "Fair (650 - 719)", subtext: "Standard eligibility with documentation" },
  { id: "Not Sure / New to Credit", label: "New to Credit / Not Sure", subtext: "First-time borrower or no recent bureau report" },
];

export const URGENCY_OPTIONS = [
  { id: "Immediate (Within 7 Days)", label: "Immediate (Within 7 Days)", subtext: "Ready with property/purchase token" },
  { id: "This Month (15-30 Days)", label: "This Month (15-30 Days)", subtext: "Actively shortlisting and finalizing" },
  { id: "Exploring (1-3 Months)", label: "Exploring (1-3 Months)", subtext: "Comparing offers and checking pre-eligibility" },
];
