/**
 * DhanSetu Chatbot Mock Responses & Quick Action Fixtures
 * Grounded in DhanSetu Banking & Underwriting Policies
 */

export interface SuggestedAction {
  id: string;
  label: string;
  actionType: "intent" | "navigate" | "query" | "advisor";
  payload?: string;
}

export interface ChatbotResponse {
  status: string;
  message_id: string;
  reply: string;
  suggested_actions?: SuggestedAction[];
  suggestedActions?: SuggestedAction[];
  extracted_signals?: string[];
  context_state?: Record<string, unknown>;
}

export const INITIAL_BOT_MESSAGE: {
  text: string;
  suggestedActions: SuggestedAction[];
} = {
  text: "Hello! Welcome to DhanSetu. I can assist you in finding suitable home, vehicle, business, or gold loan options tailored to your needs.",
  suggestedActions: [
    { id: "act_home", label: "Home Loan", actionType: "intent", payload: "home_loan" },
    { id: "act_car", label: "Car Loan", actionType: "intent", payload: "vehicle_loan" },
    { id: "act_biz", label: "Business Loan", actionType: "intent", payload: "business_loan" },
    { id: "act_gold", label: "Gold Loan", actionType: "intent", payload: "gold_loan" },
    { id: "act_hiw", label: "How DhanSetu Works", actionType: "navigate", payload: "/#how-it-works" },
  ],
};

export function getMockChatbotReply(
  userText: string,
  _context?: Record<string, unknown>
): ChatbotResponse {
  const lower = userText.toLowerCase();
  const timestamp = String(Date.now());

  if (lower.includes("how") && (lower.includes("work") || lower.includes("process"))) {
    const actions: SuggestedAction[] = [
      { id: "act_adv", label: "Start Guided Intake", actionType: "navigate", payload: "/#personalised-loans" },
      { id: "act_full", label: "Launch Full Advisor", actionType: "navigate", payload: "/advisor" },
    ];
    return {
      status: "success",
      message_id: `msg-${timestamp}`,
      reply:
        "DhanSetu follows a 4-step guided digital process: 1) Choose your loan goal, 2) Answer guided profile questions, 3) Receive verified deterministic EMI options, and 4) Connect directly with a retail lending officer without repeating your details.",
      suggested_actions: actions,
      suggestedActions: actions,
    };
  }

  if (lower.includes("home") || lower.includes("house") || lower.includes("flat") || lower.includes("property")) {
    const actions: SuggestedAction[] = [
      { id: "act_home_adv", label: "Check Home Loan Eligibility", actionType: "advisor", payload: "home_loan" },
      { id: "act_info", label: "View Home Loan Details", actionType: "navigate", payload: "/#loan-information" },
    ];
    return {
      status: "success",
      message_id: `msg-${timestamp}`,
      reply:
        "We offer Prime Home Loans with tenures up to 30 years and competitive benchmark interest rates starting from 8.40% p.a. Tax deductions are eligible under Section 24(b) and 80C.",
      suggested_actions: actions,
      suggestedActions: actions,
      extracted_signals: ["Intent: Home Loan"],
    };
  }

  if (lower.includes("car") || lower.includes("vehicle") || lower.includes("auto") || lower.includes("ev")) {
    const actions: SuggestedAction[] = [
      { id: "act_car_adv", label: "Explore Car Loan Offers", actionType: "advisor", payload: "vehicle_loan" },
      { id: "act_info", label: "View Loan Details", actionType: "navigate", payload: "/#loan-information" },
    ];
    return {
      status: "success",
      message_id: `msg-${timestamp}`,
      reply:
        "Our Vehicle Loans cover new passenger cars, certified pre-owned vehicles, and EV financing with flexible repayment tenures up to 7 years and up to 100% on-road funding on select models.",
      suggested_actions: actions,
      suggestedActions: actions,
      extracted_signals: ["Intent: Vehicle Loan"],
    };
  }

  if (lower.includes("business") || lower.includes("msme") || lower.includes("working capital")) {
    const actions: SuggestedAction[] = [
      { id: "act_biz_adv", label: "Check Business Loan Eligibility", actionType: "advisor", payload: "business_loan" },
      { id: "act_info", label: "View All Products", actionType: "navigate", payload: "/#loan-information" },
    ];
    return {
      status: "success",
      message_id: `msg-${timestamp}`,
      reply:
        "We provide collateral-free working capital and MSME term loans under credit guarantee schemes, with underwriting based on your GST filings and annual turnover.",
      suggested_actions: actions,
      suggestedActions: actions,
      extracted_signals: ["Intent: Business Loan"],
    };
  }

  if (lower.includes("gold") || lower.includes("jewel") || lower.includes("ornament")) {
    const actions: SuggestedAction[] = [
      { id: "act_gold_adv", label: "Check Gold Loan Terms", actionType: "advisor", payload: "gold_loan" },
      { id: "act_info", label: "Compare Products", actionType: "navigate", payload: "/#loan-information" },
    ];
    return {
      status: "success",
      message_id: `msg-${timestamp}`,
      reply:
        "Our Gold Loans provide immediate liquidity with up to 75% LTV on hallmarked jewelry, zero income proof up to ₹5 Lakh, and rapid 30-minute disbursals into your bank account.",
      suggested_actions: actions,
      suggestedActions: actions,
      extracted_signals: ["Intent: Gold Loan"],
    };
  }

  if (lower.includes("interest") || lower.includes("rate") || lower.includes("emi") || lower.includes("calculate")) {
    const actions: SuggestedAction[] = [
      { id: "act_adv", label: "Calculate Personalised EMI", actionType: "navigate", payload: "/#personalised-loans" },
      { id: "act_matrix", label: "View Verification Matrix", actionType: "navigate", payload: "/#about" },
    ];
    return {
      status: "success",
      message_id: `msg-${timestamp}`,
      reply:
        "DhanSetu computes exact monthly EMIs using verified deterministic formulas based on benchmark interest rates and debt-service ratios, ensuring zero hidden charges.",
      suggested_actions: actions,
      suggestedActions: actions,
    };
  }

  // Default helpful response
  const defaultActions: SuggestedAction[] = [
    { id: "act_all_loans", label: "Explore Loan Options", actionType: "navigate", payload: "/#loan-information" },
    { id: "act_intake", label: "Find Personalised Loan", actionType: "navigate", payload: "/#personalised-loans" },
    { id: "act_adv", label: "Launch Full Advisor", actionType: "navigate", payload: "/advisor" },
  ];

  return {
    status: "success",
    message_id: `msg-${timestamp}`,
    reply:
      "Thank you for your message. DhanSetu evaluates verified banking policies and exact debt-service ratios for transparent lending decisions. How can I best guide your loan search today?",
    suggested_actions: defaultActions,
    suggestedActions: defaultActions,
    context_state: _context,
  };
}
