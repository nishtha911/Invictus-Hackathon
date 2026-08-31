import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import {
  DemoCustomer,
  ExtractedProfileData,
  LeadResponse,
  PersonalizedOffer,
  ProfileIntake,
  RecommendedLoan,
  UserType,
} from "../lib/types/contracts";

export interface AuthUser {
  name: string;
  mobile_number: string;
  email?: string;
  customer_id?: string;
  employer?: string;
  employment_type?: string;
  monthly_income?: number;
}

export interface JourneyState {
  sessionId: string;
  authUser: AuthUser | null;
  userType: UserType | null;
  selectedCustomer: DemoCustomer | null;
  role: "customer" | "employee" | "guest" | null;
  profile: ProfileIntake;
  extractedData: ExtractedProfileData | null;
  recommendations: RecommendedLoan[];
  personalizedOffer: PersonalizedOffer | null;
  advisorNote: string | null;
  selectedLoan: RecommendedLoan | null;
  submittedLead: LeadResponse | null;
  answers: Record<string, string | number | boolean | undefined>;
  currentStepIndex: number;
  isExtracting: boolean;
  extractionStatusMessage: string;

  // Actions
  login: (user: AuthUser, customer?: DemoCustomer) => void;
  logout: () => void;
  setUserType: (type: UserType, customer?: DemoCustomer) => void;
  setRole: (role: "customer" | "employee" | "guest" | null) => void;
  updateProfile: (partial: Partial<ProfileIntake>) => void;
  setExtractedData: (data: ExtractedProfileData | null) => void;
  setRecommendations: (loans: RecommendedLoan[]) => void;
  setPersonalizedOffer: (offer: PersonalizedOffer | null) => void;
  setAdvisorNote: (note: string | null) => void;
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
  age: 32,
  preferred_emi: "balanced",
  interest_type: "not_sure",
};

const dummyStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const generateSessionId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set) => ({
      sessionId: generateSessionId(),
      authUser: null,
      userType: null,
      selectedCustomer: null,
      role: null,
      profile: { ...initialProfile },
      extractedData: null,
      recommendations: [],
      personalizedOffer: null,
      advisorNote: null,
      selectedLoan: null,
      submittedLead: null,
      answers: {},
      currentStepIndex: 0,
      isExtracting: false,
      extractionStatusMessage: "Understanding your requirements...",

      login: (user, customer) =>
        set((state) => {
          const activeCustomer = customer || state.selectedCustomer;
          return {
            ...state,
            authUser: user,
            userType: "existing",
            selectedCustomer: activeCustomer || null,
            role: "customer",
            profile: {
              ...state.profile,
              user_type: "existing",
              customer_name: user.name,
              customer_id: user.customer_id || activeCustomer?.id,
              employment_type: user.employment_type || activeCustomer?.employment_type || state.profile.employment_type,
              income: user.monthly_income || activeCustomer?.monthly_income || state.profile.income,
            },
          };
        }),

      logout: () =>
        set((state) => ({
          ...state,
          authUser: null,
          userType: null,
          selectedCustomer: null,
          role: null,
          profile: {
            ...state.profile,
            user_type: "new",
            customer_id: undefined,
            customer_name: undefined,
          },
        })),

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
            const authUser: AuthUser = {
              name: customer.name,
              mobile_number: customer.phone.replace(/\D/g, "").slice(-10),
              email: customer.email,
              customer_id: customer.id,
              employer: customer.employer,
              employment_type: customer.employment_type,
              monthly_income: customer.monthly_income,
            };
            return {
              ...state,
              authUser,
              userType: type,
              selectedCustomer: customer,
              role: "customer",
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
                preferred_emi: "balanced",
                interest_type: "not_sure",
              },
              answers: existingAnswers,
              currentStepIndex: 0,
            };
          }
          return {
            ...state,
            authUser: null,
            userType: type,
            selectedCustomer: null,
            role: "guest",
            profile: {
              ...initialProfile,
              user_type: "new",
            },
            answers: {},
            currentStepIndex: 0,
          };
        }),

      setRole: (role) => set({ role }),

      updateProfile: (partial) =>
        set((state) => ({
          profile: { ...state.profile, ...partial },
        })),

      setExtractedData: (data) => set({ extractedData: data }),
      setRecommendations: (loans) => set({ recommendations: loans }),
      setPersonalizedOffer: (offer) => set({ personalizedOffer: offer }),
      setAdvisorNote: (note) => set({ advisorNote: note }),
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
          sessionId: generateSessionId(),
          authUser: null,
          userType: null,
          selectedCustomer: null,
          role: null,
          profile: { ...initialProfile },
          extractedData: null,
          recommendations: [],
          personalizedOffer: null,
          advisorNote: null,
          selectedLoan: null,
          submittedLead: null,
          answers: {},
          currentStepIndex: 0,
          isExtracting: false,
          extractionStatusMessage: "Understanding your requirements...",
        }),
    }),
    {
      name: "cognis-bank-journey-storage",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : dummyStorage)),
    }
  )
);
