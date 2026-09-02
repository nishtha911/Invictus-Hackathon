import {
  DashboardKPIs,
  DashboardSegment,
  LeadSourceDatum,
  SalesDashboardLeadItem,
} from "../types/contracts";

export const MOCK_DASHBOARD_KPIS: DashboardKPIs = {
  total_leads: 63,
  hot_leads: 21,
  qualification_rate: 71,
  total_loan_demand: 187400000,
  conversion_pipeline: {
    new: 29,
    qualified: 18,
    contacted: 11,
    converted: 5,
  },
};

export interface LeadTrendPoint {
  day: string;
  date?: string;
  total: number;
  hot: number;
  converted: number;
}

export const MOCK_LEAD_TREND_DATA: LeadTrendPoint[] = [
  { day: "Mon 25", date: "2026-08-25", total: 7, hot: 2, converted: 0 },
  { day: "Tue 26", date: "2026-08-26", total: 11, hot: 4, converted: 1 },
  { day: "Wed 27", date: "2026-08-27", total: 9, hot: 3, converted: 1 },
  { day: "Thu 28", date: "2026-08-28", total: 13, hot: 5, converted: 2 },
  { day: "Fri 29", date: "2026-08-29", total: 8, hot: 3, converted: 1 },
  { day: "Sat 30", date: "2026-08-30", total: 5, hot: 1, converted: 0 },
  { day: "Sun 31", date: "2026-08-31", total: 4, hot: 2, converted: 1 },
];

export const MOCK_PRODUCT_DEMAND_DATA = [
  { name: "Home Loan", value: 96500000, count: 17, color: "#1F7A63" },
  { name: "Personal Loan", value: 12800000, count: 14, color: "#6366F1" },
  { name: "Vehicle Loan", value: 21300000, count: 9, color: "#06B6D4" },
  { name: "Business Loan", value: 43600000, count: 6, color: "#8B5CF6" },
  { name: "Education Loan", value: 9800000, count: 4, color: "#F59E0B" },
  { name: "Gold Loan", value: 3400000, count: 3, color: "#94A3B8" },
];

export const MOCK_LEAD_SOURCE_DATA: LeadSourceDatum[] = [
  { key: "genai", name: "GenAI Voice Agent", value: 41, color: "#6366F1" },
  { key: "manual_employee_call", name: "Manual Employee Calls", value: 22, color: "#F59E0B" },
];

export const MOCK_ELIGIBILITY_DATA: DashboardSegment[] = [
  { key: "Loan-Eligible", name: "Loan-Eligible", value: 34, color: "#1F7A63" },
  { key: "Conditionally Eligible", name: "Conditionally Eligible", value: 21, color: "#F59E0B" },
  { key: "Needs Review", name: "Needs Review", value: 8, color: "#94A3B8" },
];

export const MOCK_SCORE_DISTRIBUTION_DATA = [
  { range: "Hot (78-100)", count: 21, fill: "#1F7A63" },
  { range: "Warm (58-77)", count: 34, fill: "#6366F1" },
  { range: "Nurture (< 58)", count: 8, fill: "#94A3B8" },
];

export const MOCK_SALES_LEADS: SalesDashboardLeadItem[] = [
  {
    id: "LEAD-9912",
    customer_name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    phone: "+91 98201 44520",
    product_name: "Prime Home Loan",
    loan_category: "Home Loan",
    requested_amount: 4500000,
    estimated_emi: 39053,
    lead_score: 94,
    score_band: "HOT LEAD",
    urgency: "Immediate (Within 7 Days)",
    status: "Qualified",
    created_at: "10 mins ago",
    preferred_time: "Morning (9 AM - 12 PM)",
    ai_briefing: "Rahul is a salaried Sr. Software Architect at Infosys with ₹1.45L monthly income. Exploring ₹45L for immediate resale flat purchase. FOIR is 38.5%, well within Tier-1 criteria. Strong affinity for low floating rate and zero prepayment fee.",
    scoring_factors: [
      "Excellent credit profile (CIBIL 792) with zero delinquency history",
      "Salary account tenure with bank > 4.5 years",
      "Immediate purchase token signed; seeking sanction within 48 hours",
      "Calculated EMI is under 30% of take-home pay",
    ],
    talking_points: [
      "Confirm 48-hr digital sanction process & doorstep document pick-up",
      "Offer 50% waiver on processing fee as Tier-1 corporate employee",
      "Explain flexi-tenure and zero foreclosure charges after 12 months",
      "Provide list of pre-approved builder projects in his micro-market",
    ],
  },
  {
    id: "LEAD-9891",
    customer_name: "Priya Deshmukh",
    email: "priya.deshmukh@designcorp.in",
    phone: "+91 97654 81290",
    product_name: "Flexi Home Loan",
    loan_category: "Home Loan",
    requested_amount: 6000000,
    estimated_emi: 53020,
    lead_score: 91,
    score_band: "HOT LEAD",
    urgency: "Immediate (Within 7 Days)",
    status: "New",
    created_at: "35 mins ago",
    preferred_time: "Evening (4 PM - 7 PM)",
    ai_briefing: "Priya runs an architecture consultancy with ₹1.85L monthly surplus. Selected Flexi Home Loan to utilize the overdraft facility against project billing cycles.",
    scoring_factors: [
      "Zero active EMI obligations with high net disposable cash flow",
      "GST returns indicate consistent 22% YoY revenue expansion",
      "Selected overdraft feature matches seasonal cash flow pattern",
    ],
    talking_points: [
      "Demonstrate how parking surplus client advances offsets daily loan interest",
      "Highlight 24/7 digital withdrawal capability via corporate net banking",
      "Confirm GST 3B and 2-year ITR documentation for expedited processing",
    ],
  },
  {
    id: "LEAD-9844",
    customer_name: "Amit Kulkarni",
    email: "amit.kulkarni@techlogistics.com",
    phone: "+91 99302 77103",
    product_name: "Express Personal Loan",
    loan_category: "Personal Loan",
    requested_amount: 800000,
    estimated_emi: 17188,
    lead_score: 87,
    score_band: "WARM LEAD",
    urgency: "This Month (15-30 Days)",
    status: "Contacted",
    created_at: "2 hours ago",
    preferred_time: "Afternoon (12 PM - 4 PM)",
    ai_briefing: "Amit is a salaried logistics manager earning ₹82K/mo. Needs ₹8L for home renovation. CIBIL score is 748 with existing ₹8K vehicle EMI.",
    scoring_factors: [
      "Total FOIR including new EMI remains at 31% (standard cap 50%)",
      "Employed with current firm for > 3 years",
      "Requested paperless disbursal",
    ],
    talking_points: [
      "Emphasize 4-hour instant account credit upon e-Sign",
      "Explain flexible 12 to 60 month tenure slider options",
      "Review simple digital KYC and Aadhaar OTP verification steps",
    ],
  },
  {
    id: "LEAD-9792",
    customer_name: "Vikram Singhania",
    email: "vikram.s@singhaniatraders.in",
    phone: "+91 98450 11922",
    product_name: "DrivePlus Vehicle Loan",
    loan_category: "Vehicle Loan",
    requested_amount: 1800000,
    estimated_emi: 28840,
    lead_score: 84,
    score_band: "WARM LEAD",
    urgency: "This Month (15-30 Days)",
    status: "In Review",
    created_at: "4 hours ago",
    preferred_time: "Morning (9 AM - 12 PM)",
    ai_briefing: "Proprietor seeking financing for an electric SUV. High business turnover with strong banking relationship.",
    scoring_factors: [
      "Eligible for 25 bps green mobility rate concession",
      "Current account transaction volume > ₹1.2 Cr annually",
    ],
    talking_points: [
      "Inform customer of special 8.60% EV rate discount",
      "Direct payout to dealer showroom token",
    ],
  },
  {
    id: "LEAD-9710",
    customer_name: "Sunita Roy",
    email: "sunita.roy@gmail.com",
    phone: "+91 98112 34509",
    product_name: "Prime Home Loan",
    loan_category: "Home Loan",
    requested_amount: 3500000,
    estimated_emi: 30375,
    lead_score: 93,
    score_band: "HOT LEAD",
    urgency: "Immediate (Within 7 Days)",
    status: "Qualified",
    created_at: "5 hours ago",
    preferred_time: "Morning (9 AM - 12 PM)",
    ai_briefing: "Salaried professor at central university with 12 years tenured service. Buying second home for investment. Excellent credit record.",
    scoring_factors: [
      "Government / Tenured institutional employment profile",
      "CIBIL score 805 with flawless repayment track record",
    ],
    talking_points: [
      "Present special government employee interest concession (10 bps)",
      "Outline PMAY tax optimization structure under Sec 24(b)",
    ],
  },
  {
    id: "LEAD-9655",
    customer_name: "Deepak Verma",
    email: "deepak.verma@fintechstartup.io",
    phone: "+91 99887 66544",
    product_name: "Express Personal Loan",
    loan_category: "Personal Loan",
    requested_amount: 500000,
    estimated_emi: 10743,
    lead_score: 76,
    score_band: "WARM LEAD",
    urgency: "Exploring (1-3 Months)",
    status: "New",
    created_at: "1 day ago",
    preferred_time: "Evening (4 PM - 7 PM)",
    ai_briefing: "Product manager at early stage startup. Income ₹95K. Looking to consolidate credit card balances into a lower fixed interest loan.",
    scoring_factors: [
      "Debt consolidation will improve debt service coverage ratio",
      "CIBIL 725 with moderate revolving credit utilization",
    ],
    talking_points: [
      "Explain how replacing 36% revolving card interest with 10.49% PL saves ~₹8,400 monthly",
      "Propose auto-debit setup for additional rate concession",
    ],
  },
];
