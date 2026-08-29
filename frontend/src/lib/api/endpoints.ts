/**
 * DhanSetu Centralized API Endpoint Definitions
 * Aligned with FastAPI Backend Architecture
 */

export const API_ENDPOINTS = {
  extractProfile: "/api/v1/extract-profile",
  recommendLoans: "/api/v1/recommend-loans",
  leads: "/api/v1/leads",
} as const;

export type ApiEndpointKey = keyof typeof API_ENDPOINTS;
