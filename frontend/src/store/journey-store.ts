import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import {
  DemoCustomer,
  ExtractedProfileData,
  LeadResponse,
  ProfileIntake,
  RecommendedLoan,
  UserType,
} from "../lib/types/contracts";

export interface JourneyState {
  sessionId: string;
  userType: UserType | null;
  selectedCustomer: DemoCustomer | null;
  profile: ProfileIntake;
  extractedData: ExtractedProfileData | null;
  recommendations: RecommendedLoan[];
  selectedLoan: RecommendedLoan | null;
  submittedLead: LeadResponse | null;
  answers: Record<string, string | number | boolean | undefined>;
  currentStepIndex: number;
  isExtracting: boolean;
  extractionStatusMessage: string;

  // Actions
  setUserType: (type: UserType, customer?: DemoCustomer) => void;
  updateProfile: (partial: Partial<ProfileIntake>) => void;
  setExtractedData: (data: ExtractedProfileData | null) => void;
  setRecommendations: (loans: RecommendedLoan[]) => void;
  setSelectedLoan: (loan: RecommendedLoan | null) => void;
  setSubmittedLead: (lead: LeadResponse | null) => void;
  setAnswer: (key: string, value: string | number | boolean) => void;
  setStepIndex: (index: number) => void;
  setIsExtracting: (extracting: boolean, status?: string) => void;
  resetDemo: () => void;
}

const initialProfile: ProfileIntake = {
  user_type: "new",
  intent: "Home Loan",
  income: 120000,
  loan_amount: 4500000,
  employment_type: "Salaried",
  tenure_years: 20,
  existing_emi: 0,
  credit_band: "Excellent (780+)",
  urgency: "Immediate (Within 7 Days)",
};

const dummyStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set) => ({
      sessionId: `SESSION-${Date.now()}`,
      userType: null,
      selectedCustomer: null,
      profile: { ...initialProfile },
      extractedData: null,
      recommendations: [],
      selectedLoan: null,
      submittedLead: null,
      answers: {},
      currentStepIndex: 0,
      isExtracting: false,
      extractionStatusMessage: "Understanding your requirements...",

      setUserType: (type, customer) =>
        set((state) => {
          if (type === "existing" && customer) {
            const existingAnswers: Record<string, string | number | boolean | undefined> = {
              purpose: customer.default_intent,
              employment: customer.employment_type,
              income: customer.monthly_income,
              loan_amount: customer.default_loan_amount,
              existing_emi: customer.existing_emi,
              credit: customer.credit_band,
            };
            return {
              ...state,
              userType: type,
              selectedCustomer: customer,
              profile: {
                user_type: "existing",
                customer_id: customer.id,
                customer_name: customer.name,
                intent: customer.default_intent,
                income: customer.monthly_income,
                loan_amount: customer.default_loan_amount,
                employment_type: customer.employment_type,
                existing_emi: customer.existing_emi,
                credit_band: customer.credit_band,
                tenure_years: 20,
                urgency: "Immediate (Within 7 Days)",
              },
              answers: existingAnswers,
              currentStepIndex: 3,
            };
          }
          return {
            ...state,
            userType: type,
            selectedCustomer: null,
            profile: {
              ...initialProfile,
              user_type: "new",
            },
            answers: {},
            currentStepIndex: 0,
          };
        }),

      updateProfile: (partial) =>
        set((state) => ({
          profile: { ...state.profile, ...partial },
        })),

      setExtractedData: (data) => set({ extractedData: data }),
      setRecommendations: (loans) => set({ recommendations: loans }),
      setSelectedLoan: (loan) => set({ selectedLoan: loan }),
      setSubmittedLead: (lead) => set({ submittedLead: lead }),
      setAnswer: (key, value) =>
        set((state) => ({
          answers: { ...state.answers, [key]: value },
        })),
      setStepIndex: (index) => set({ currentStepIndex: index }),
      setIsExtracting: (extracting, status = "Understanding your requirements...") =>
        set({ isExtracting: extracting, extractionStatusMessage: status }),

      resetDemo: () =>
        set({
          sessionId: `SESSION-${Date.now()}`,
          userType: null,
          selectedCustomer: null,
          profile: { ...initialProfile },
          extractedData: null,
          recommendations: [],
          selectedLoan: null,
          submittedLead: null,
          answers: {},
          currentStepIndex: 0,
          isExtracting: false,
          extractionStatusMessage: "Understanding your requirements...",
        }),
    }),
    {
      name: "loansense-journey-storage",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : dummyStorage)),
    }
  )
);
