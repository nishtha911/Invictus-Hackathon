/**
 * DhanSetu Centralized API Endpoint Definitions
 * Aligned with FastAPI Backend Architecture
 */

export const API_ENDPOINTS = {
  extractProfile: "/api/v1/extract-profile",
  recommendLoans: "/api/v1/recommend-loans",
  leads: "/api/v1/leads",
  chatbot: "/api/v1/chat", // Pending final backend route confirmation; supported by mock fallback
} as const;

export type ApiEndpointKey = keyof typeof API_ENDPOINTS;
