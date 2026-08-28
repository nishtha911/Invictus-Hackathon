import { apiClient } from "./client";
import { API_ENDPOINTS } from "../constants";
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
        intent: profile.intent || null,
      }),
    },
    () => generateMockRecommendations(profile)
  );
}
