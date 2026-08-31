import { DemoCustomer, ProfileIntake, RecommendedLoan, UserType } from "./lib/types/contracts";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export interface KnowledgeBaseContext {
  user_type: UserType;
  profile: ProfileIntake;
  selected_loan?: RecommendedLoan | null;
  customer_context?: DemoCustomer | null;
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Knowledge Base request failed (${response.status})`);
  }
  return data;
}

/** Save the advisory answers once; the RAG service then owns session context. */
export async function saveKnowledgeBaseContext(sessionId: string, context: KnowledgeBaseContext) {
  const response = await fetch(`${BACKEND_URL}/api/knowledge-base/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, ...context }),
  });
  return parseResponse(response);
}

/** Read a previously saved context when the user returns after a refresh. */
export async function getKnowledgeBaseContext(sessionId: string): Promise<KnowledgeBaseContext | null> {
  const response = await fetch(`${BACKEND_URL}/api/knowledge-base/profile/${encodeURIComponent(sessionId)}`);
  if (response.status === 404) return null;
  const data = await parseResponse(response);
  return data.context as KnowledgeBaseContext;
}

export async function queryKnowledgeBase(
  question: string,
  sessionId: string,
  loanCategory?: string | null,
  profile?: KnowledgeBaseContext | null,
) {
  const response = await fetch(`${BACKEND_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      session_id: sessionId,
      loan_category: loanCategory || null,
      top_k: 8,
      // This fallback keeps the chat useful if the save request was interrupted.
      profile,
    }),
  });
  return parseResponse(response);
}
