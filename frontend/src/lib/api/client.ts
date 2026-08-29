/**
 * DhanSetu — Unified API Client
 * Wraps all real backend endpoints only.
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Accept: "application/json", ...init?.headers },
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || `HTTP ${r.status}`);
  }
  return r.json();
}

// ── Types ────────────────────────────────────────────────────────

export interface UIComponent {
  type: "mcq" | "slider" | "number_input" | "text_input" | "yes_no" | "info_card";
  options?: { label: string; value: string }[];
  min_value?: number;
  max_value?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  default_value?: unknown;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  ui_component?: UIComponent | null;
  field_target?: string | null;
}

export interface SessionState {
  session_id: string;
  completeness_pct: number;
  fields_filled: string[];
  is_complete: boolean;
  current_phase: string;
}

export interface ChatResponse {
  session_id: string;
  messages: ChatMessage[];
  session_state: SessionState;
  extracted_profile?: Record<string, unknown> | null;
}

export interface ComputedTerms {
  interest_rate_pct: number;
  tenure_months: number;
  estimated_emi: number;
  eligibility_status: "eligible" | "conditionally_eligible" | "not_eligible";
}

export interface Recommendation {
  product_id: string;
  product_name: string;
  match_score: number; // 0–1
  computed_terms: ComputedTerms;
  ai_explanation: { summary_text: string; numbers_verified: boolean; grounded_on_chunk_ids: string[] };
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
}

export interface LeadScoring {
  lead_id: string;
  score: number;
  score_band: "HOT LEAD" | "WARM LEAD" | "NURTURE";
  ai_briefing: string;
  key_scoring_factors: string[];
  talking_points: string[];
  qualification_probability: number;
  estimated_closing_days: number;
}

export interface LeadCaptureResponse {
  status: string;
  lead_id: string;
  message: string;
  created_at: string;
  scoring: LeadScoring;
}

export interface DashboardLead {
  lead_id: string;
  customer_name: string;
  email: string;
  phone: string;
  product_name?: string;
  loan_amount?: number;
  estimated_emi?: number;
  score: number;
  score_band: "HOT LEAD" | "WARM LEAD" | "NURTURE";
  status: string;
  created_at: string;
  ai_briefing: string;
  talking_points: string[];
}

export interface DashboardResponse {
  kpis: {
    total_leads: number;
    hot_leads: number;
    warm_leads: number;
    avg_lead_score: number;
    total_loan_demand: number;
    conversion_pipeline: Record<string, number>;
  };
  leads: DashboardLead[];
  volume_trend: { date: string; leads: number; hot: number }[];
}

// ── API Functions ────────────────────────────────────────────────

export const startSession = (userType: "guest" | "existing_customer" = "guest") =>
  req<ChatResponse>(`/api/chat/start?user_type=${userType}`, { method: "POST" });

export const sendMessage = (sessionId: string, message: string, fieldTarget?: string | null) =>
  req<ChatResponse>("/api/chat/message", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, message, field_target: fieldTarget ?? null }),
  });

export const getRecommendations = (sessionId: string) =>
  req<RecommendationsResponse>(`/api/recommendations/${sessionId}`);

export const captureLead = (payload: {
  session_id: string;
  name: string;
  email: string;
  phone: string;
  selected_loan_id?: string;
  selected_loan_name?: string;
  loan_amount?: number;
  estimated_emi?: number;
  preferred_contact_time?: string;
}) => req<LeadCaptureResponse>("/api/leads", { method: "POST", body: JSON.stringify(payload) });

export const getDashboard = () => req<DashboardResponse>("/api/dashboard");

export const checkHealth = () => req<{ status: string }>("/api/health");
