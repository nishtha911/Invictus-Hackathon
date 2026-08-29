import { apiClient } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import { ExtractedProfileData, ProfileIntake } from "../types/contracts";

export async function extractProfile(payload: ProfileIntake): Promise<{ status: string; data: ExtractedProfileData }> {
  return apiClient<{ status: string; data: ExtractedProfileData }>(
    API_ENDPOINTS.extractProfile,
    {
      method: "POST",
      body: JSON.stringify({
        user_type: payload.user_type,
        income: payload.income || 0,
        loan_amount: payload.loan_amount || 0,
        intent: payload.intent || null,
      }),
    },
    () => {
      // Mock extraction signal evaluation
      const signals: string[] = [];
      if (payload.intent) signals.push(`Intent identified: ${payload.intent}`);
      if (payload.income) signals.push(`Monthly Income signal: ₹${payload.income.toLocaleString("en-IN")}`);
      if (payload.loan_amount) signals.push(`Requested Principal: ₹${payload.loan_amount.toLocaleString("en-IN")}`);
      if (payload.employment_type) signals.push(`Employment Category: ${payload.employment_type}`);
      if (payload.credit_band) signals.push(`Credit Tier: ${payload.credit_band}`);

      let completeness = 20;
      if (payload.intent) completeness += 20;
      if (payload.employment_type) completeness += 15;
      if (payload.income) completeness += 20;
      if (payload.loan_amount) completeness += 15;
      if (payload.tenure_years) completeness += 10;

      return {
        status: "success",
        data: {
          intent: payload.intent || "Home Loan",
          income: payload.income || 100000,
          loan_amount: payload.loan_amount || 2500000,
          employment_type: payload.employment_type,
          tenure_years: payload.tenure_years || 5,
          existing_emi: payload.existing_emi || 0,
          credit_band: payload.credit_band || "Good (720 - 779)",
          urgency: payload.urgency || "Immediate (Within 7 Days)",
          completeness_score: Math.min(100, completeness),
          signals_captured: signals,
        },
      };
    }
  );
}
