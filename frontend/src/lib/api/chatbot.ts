/**
 * DhanSetu Centralized Chatbot Service Architecture
 * Connects UI -> Chatbot Service -> Mock/FastAPI Switch -> Backend
 */

import { apiClient } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import {
  ChatbotResponse,
  SuggestedAction,
  INITIAL_BOT_MESSAGE,
  getMockChatbotReply,
} from "../mocks/chatbot";

export type { ChatbotResponse, SuggestedAction };

export interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp?: string;
  suggestedActions?: SuggestedAction[];
}

/**
 * Fetch initial greeting and dynamic quick actions for the chatbot session
 */
export function getInitialBotState(): {
  text: string;
  suggestedActions: SuggestedAction[];
} {
  return INITIAL_BOT_MESSAGE;
}

/**
 * Send a message to the chatbot service (Mock now, API-ready later)
 */
export async function sendChatMessage(
  message: string,
  sessionId?: string,
  context?: Record<string, unknown>
): Promise<ChatbotResponse> {
  return apiClient<ChatbotResponse>(
    API_ENDPOINTS.chatbot,
    {
      method: "POST",
      body: JSON.stringify({
        message,
        session_id: sessionId || `SESSION-${Date.now()}`,
        context: context || {},
      }),
    },
    () => getMockChatbotReply(message, context)
  );
}
