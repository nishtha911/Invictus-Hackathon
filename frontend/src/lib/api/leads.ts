import { apiClient } from "./client";
import { API_ENDPOINTS } from "../constants";
import { LeadCapturePayload, LeadResponse } from "../types/contracts";
import { generateMockLeadResponse } from "../mocks/leads";

export async function submitLead(payload: LeadCapturePayload): Promise<LeadResponse> {
  return apiClient<LeadResponse>(
    API_ENDPOINTS.leads,
    {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        selected_loan: payload.selected_loan,
      }),
    },
    () => generateMockLeadResponse(payload)
  );
}
