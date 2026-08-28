/**
 * Chat API Client — wires the frontend to the real LangGraph backend.
 *
 * Backend endpoints used:
 *   POST /api/chat/start        → Start session, get first question
 *   POST /api/chat/message      → Send answer, get next question
 *   GET  /api/recommendations/{session_id} → Get scored loan matches
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

// ── Types mirrored from backend schemas/chat.py ──────────────────────────

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

// ── Scoring types mirrored from backend schemas/scoring.py ───────────────

export interface ComputedTerms {
  interest_rate_pct: number;
  tenure_months: number;
  estimated_emi: number;
  eligibility_status: "eligible" | "conditionally_eligible" | "not_eligible";
}

export interface AIExplanation {
  summary_text: string;
  grounded_on_chunk_ids: string[];
  numbers_verified: boolean;
}

export interface ProductRecommendation {
  product_id: string;
  product_name: string;
  match_score: number;
  computed_terms: ComputedTerms;
  ai_explanation: AIExplanation;
}

export interface RecommendationsResponse {
  recommendations: ProductRecommendation[];
}

// ── API Functions ─────────────────────────────────────────────────────────

async function chatFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Backend error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Start a new LangGraph advisory session.
 * Returns the greeting message and first question from the AI.
 */
export async function startChatSession(userType: "guest" | "existing_customer" = "guest"): Promise<ChatResponse> {
  return chatFetch<ChatResponse>(`/api/chat/start?user_type=${userType}`, { method: "POST" });
}

/**
 * Send the user's answer to the AI and get the next question.
 */
export async function sendChatMessage(
  sessionId: string,
  message: string,
  fieldTarget?: string | null
): Promise<ChatResponse> {
  return chatFetch<ChatResponse>("/api/chat/message", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      message,
      field_target: fieldTarget ?? null,
    }),
  });
}

/**
 * Get scored loan recommendations for a completed session.
 */
export async function fetchRecommendations(sessionId: string): Promise<RecommendationsResponse> {
  return chatFetch<RecommendationsResponse>(`/api/recommendations/${sessionId}`);
}
