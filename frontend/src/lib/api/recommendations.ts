import { apiClient } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import { ProfileIntake, RecommendLoansResponse } from "../types/contracts";
import { generateMockRecommendations } from "../mocks/recommendations";

export async function fetchLoanRecommendations(profile: ProfileIntake): Promise<RecommendLoansResponse> {
  return apiClient<RecommendLoansResponse>(
    API_ENDPOINTS.recommendLoans,
    {
      method: "POST",
      body: JSON.stringify({
        user_type: profile.user_type,
        income: profile.income || 0,
        loan_amount: profile.loan_amount || 0,
        intent: profile.intent || "Home Loan",
        tenure_years: profile.tenure_years || 20,
        employment_type: profile.employment_type || "Salaried",
        existing_emi: profile.existing_emi || 0,
        credit_band: profile.credit_band || "good",
        urgency: profile.urgency || "exploring",
        customer_name: profile.customer_name || null,
      }),
    },
    () => generateMockRecommendations(profile)
  );
}
