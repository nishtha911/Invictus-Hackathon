import { apiClient } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import { LeadCapturePayload, LeadResponse } from "../types/contracts";
import { generateMockLeadResponse } from "../mocks/leads";

export async function submitLead(payload: LeadCapturePayload): Promise<LeadResponse> {
  return apiClient<LeadResponse>(
    API_ENDPOINTS.leads,
    {
      method: "POST",
      body: JSON.stringify({
        session_id: payload.session_id,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        selected_loan: payload.selected_loan,
        loan_id: payload.loan_id,
        loan_amount: payload.loan_amount,
        estimated_emi: payload.estimated_emi,
        preferred_contact_time: payload.preferred_contact_time,
        notes: payload.notes,
        lead_source: payload.lead_source ?? "genai",
        guarantor: payload.guarantor ?? null,
        co_applicant: payload.co_applicant ?? null,
      }),
    },
    () => generateMockLeadResponse(payload)
  );
}
