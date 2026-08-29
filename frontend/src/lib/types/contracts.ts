/**
 * TypeScript Contracts for DHANSETU Architecture
 * Aligned with Backend FastAPI Models and Underwriting Policy Pipelines
 */

export type UserType = "new" | "existing";

export interface DemoCustomer {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  employment_type: string;
  employer: string;
  monthly_income: number;
  existing_emi: number;
  credit_band: string;
  cibil_score: number;
  relationship_years: number;
  account_type: string;
  default_intent: string;
  default_loan_amount: number;
}

export interface ProfileIntake {
  user_type: UserType;
  income?: number;
  loan_amount?: number;
  intent?: string;
  // Extended fields captured during conversational intake
  employment_type?: string;
  tenure_years?: number;
  existing_emi?: number;
  credit_band?: string;
  urgency?: string;
  customer_name?: string;
  customer_id?: string;
}

export interface ExtractedProfileData {
  intent: string;
  income: number;
  loan_amount: number;
  employment_type?: string;
  tenure_years?: number;
  existing_emi?: number;
  credit_band?: string;
  urgency?: string;
  completeness_score: number;
  signals_captured: string[];
}

export interface PolicyCitation {
  policy_name: string;
  clause_id: string;
  text: string;
}

export interface RecommendedLoan {
  loan_id: string;
  name: string;
  category: string;
  match_score: number; // e.g. 92
  interest_rate: number; // e.g. 8.60 (%)
  max_amount: number;
  min_amount: number;
  tenure_months: number;
  estimated_emi: number;
  processing_fee_pct: number;
  eligibility_status: "Eligible" | "Conditionally Eligible" | "Review Required";
  is_verified_calculation: boolean;
  reasoning: string;
  bullet_points: string[];
  policy_citations: PolicyCitation[];
  features: string[];
  tag?: string; // "BEST MATCH" | "POPULAR" | "FASTEST DISBURSAL"
}

export interface RecommendLoansResponse {
  status: string;
  recommended_loans: RecommendedLoan[];
  profile_summary: {
    intent: string;
    income: number;
    loan_amount: number;
    tenure_years: number;
    employment_type: string;
  };
  explanation_meta: {
    model: string;
    numbers_verified: boolean;
    rule_engine_verified: boolean;
    policy_grounded: boolean;
  };
}

export interface LeadCapturePayload {
  name: string;
  email: string;
  phone: string;
  selected_loan: string;
  preferred_contact_time?: "Morning" | "Afternoon" | "Evening";
  loan_id?: string;
  loan_amount?: number;
  estimated_emi?: number;
  notes?: string;
}

export interface LeadScoringIntelligence {
  lead_score: number; // 0 - 100
  score_band: "HOT LEAD" | "WARM LEAD" | "NURTURE";
  ai_agent_briefing: string;
  key_scoring_factors: string[];
  recommended_talking_points: string[];
  qualification_probability: number;
  estimated_closing_days: number;
}

export interface LeadResponse {
  status: string;
  lead_id: string;
  message: string;
  created_at: string;
  lead_data: LeadCapturePayload;
  scoring: LeadScoringIntelligence;
}

export interface SalesDashboardLeadItem {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  product_name: string;
  loan_category: string;
  requested_amount: number;
  estimated_emi: number;
  lead_score: number;
  score_band: "HOT LEAD" | "WARM LEAD" | "NURTURE";
  urgency: string;
  status: "New" | "Qualified" | "Contacted" | "In Review" | "Converted";
  created_at: string;
  preferred_time: string;
  ai_briefing: string;
  scoring_factors: string[];
  talking_points: string[];
}

export interface DashboardKPIs {
  total_leads: number;
  hot_leads: number;
  qualification_rate: number; // e.g. 67 (%)
  total_loan_demand: number; // e.g. 24000000 (₹2.4 Cr)
  conversion_pipeline: {
    new: number;
    qualified: number;
    contacted: number;
    converted: number;
  };
}
