/**
 * DHANSETU Global Constants
 * Brand, Navigation & Domain Configs
 */

export const BRAND = {
  name: "DHANSETU",
  tagline: "Smart Lending, Simplified.",
  subtext: "Explore suitable loan options for your home, car, business, or gold with clear guidance, transparent recommendations, and a simpler borrowing experience.",
};

import { API_ENDPOINTS } from "./api/endpoints";
export { API_ENDPOINTS };

export const LOAN_PURPOSES = [
  {
    id: "Home Loan",
    intentKey: "home_loan",
    label: "Home Loan",
    shortDescription: "Finance your dream home",
    description: "Purchase, construction, renovation or plot financing with long-term low interest rates.",
    icon: "Home",
    badge: "Most Popular",
    suggestedAmounts: [2500000, 5000000, 7500000, 12000000],
  },
  {
    id: "Vehicle Loan",
    intentKey: "vehicle_loan",
    label: "Car Loan",
    shortDescription: "Drive your next vehicle",
    description: "New and pre-owned car financing, EV loans, and commercial vehicle credit.",
    icon: "Car",
    badge: "Low Interest",
    suggestedAmounts: [500000, 1000000, 1800000, 2500000],
  },
  {
    id: "Business Loan",
    intentKey: "business_loan",
    label: "Business Loan",
    shortDescription: "Support your business growth",
    description: "Working capital, expansion financing, machinery credit, and MSME term loans.",
    icon: "Briefcase",
    badge: "Growth Capital",
    suggestedAmounts: [1000000, 2500000, 5000000, 10000000],
  },
  {
    id: "Gold Loan",
    intentKey: "gold_loan",
    label: "Gold Loan",
    shortDescription: "Unlock value from your gold",
    description: "Unlock the value of your gold for immediate financial needs with minimal paperwork.",
    icon: "Coins",
    badge: "Instant Liquidity",
    suggestedAmounts: [100000, 300000, 500000, 1500000],
  },
  {
    id: "Personal Loan",
    intentKey: "personal_loan",
    label: "Personal Loan",
    shortDescription: "Flexible multi-purpose credit",
    description: "Multi-purpose unsecured borrowing for medical, travel, wedding, or debt consolidation.",
    icon: "User",
    badge: "Quick Disbursal",
    suggestedAmounts: [200000, 500000, 1000000, 1500000],
  },
  {
    id: "Education Loan",
    intentKey: "education_loan",
    label: "Education Loan",
    shortDescription: "Fund higher studies worldwide",
    description: "Higher education financing for premier universities in India and overseas.",
    icon: "GraduationCap",
    badge: "Tax Benefit",
    suggestedAmounts: [1000000, 2000000, 4000000, 6000000],
  },
];

export const EMPLOYMENT_TYPES = [
  { id: "Salaried", label: "Salaried Professional", subtext: "Regular monthly salary deposited in bank account" },
  { id: "Self-Employed Professional", label: "Self-Employed Professional", subtext: "Doctor, Chartered Accountant, Architect, Legal Consultant" },
  { id: "Business Owner", label: "Business Owner / Enterprise", subtext: "Proprietor, Director, Partnership, GST Registered" },
  { id: "Gig / Freelance", label: "Contractor / Consultant", subtext: "Variable retainer or project-based invoiced income" },
];

export const CREDIT_BANDS = [
  { id: "Excellent (780+)", label: "Excellent (780+)", subtext: "Consistent clean repayment history; qualifies for prime rates" },
  { id: "Good (720 - 779)", label: "Good (720 - 779)", subtext: "Consistently healthy credit bureau profile" },
  { id: "Fair (650 - 719)", label: "Fair (650 - 719)", subtext: "Standard eligibility with standard documentation" },
  { id: "Not Sure / New to Credit", label: "New to Credit / Not Sure", subtext: "First-time borrower or no recent bureau report" },
];

export const URGENCY_OPTIONS = [
  { id: "Immediate (Within 7 Days)", label: "Immediate (Within 7 Days)", subtext: "Ready with property/purchase token" },
  { id: "This Month (15-30 Days)", label: "This Month (15-30 Days)", subtext: "Actively shortlisting and finalizing terms" },
  { id: "Exploring (1-3 Months)", label: "Exploring (1-3 Months)", subtext: "Comparing offers and checking pre-eligibility" },
];
