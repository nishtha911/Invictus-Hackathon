import { LeadCapturePayload, LeadResponse } from "../types/contracts";

export function generateMockLeadResponse(payload: LeadCapturePayload): LeadResponse {
  const isHighValue = (payload.loan_amount || 0) >= 3000000;
  const leadScore = isHighValue ? 94 : 88;

  return {
    status: "success",
    lead_id: `LEAD-${Math.floor(1000 + Math.random() * 9000)}`,
    message: "Lead captured and scored successfully by GenAI Advisory Pipeline",
    created_at: new Date().toISOString(),
    lead_data: payload,
    scoring: {
      lead_score: leadScore,
      score_band: leadScore >= 90 ? "HOT LEAD" : "WARM LEAD",
      ai_agent_briefing: `${payload.name} is looking for ${payload.selected_loan}${
        payload.loan_amount ? ` of ₹${(payload.loan_amount / 100000).toFixed(1)} Lakhs` : ""
      }. The applicant exhibits high readiness with verified income indicators and requested contact during ${
        payload.preferred_contact_time || "Morning"
      }.`,
      key_scoring_factors: [
        "Income-to-installment capacity exceeds bank safety threshold (FOIR < 40%)",
        "Clear credit tier and established employment profile",
        "Immediate product intent matches current branch campaign priority",
        "Digital KYC readiness confirmed via conversational intake",
      ],
      recommended_talking_points: [
        "Acknowledge preferred callback window and review sanction timeline (48 hrs)",
        "Highlight special digital processing fee concession available for their tier",
        "Confirm required property / financial document checklist for single-visit sanction",
        "Offer flexible step-up EMI options or overdraft feature if applicable",
      ],
      qualification_probability: 0.89,
      estimated_closing_days: 4,
    },
  };
}
