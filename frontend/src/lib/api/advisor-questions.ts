/**
 * Cognis Bank Personalised Intake Question Schema
 * Modular, schema-driven frontend architecture ready for dynamic backend delivery
 */

import { LOAN_PURPOSES, EMPLOYMENT_TYPES, CREDIT_BANDS, URGENCY_OPTIONS } from "@/lib/constants";
import { ProfileIntake } from "@/lib/types/contracts";

export interface QuestionOption {
  id: string;
  label: string;
  subtext?: string;
  icon?: string;
  badge?: string;
}

export interface IntakeQuestionDef {
  id: string;
  field: keyof ProfileIntake;
  stepNumber: number;
  category: "Goal" | "Financials" | "Profile" | "Timeline";
  title: string;
  subtitle: string;
  inputType: "single_choice" | "currency_slider" | "tenure_slider" | "choice_grid";
  options?: QuestionOption[];
  min?: number;
  max?: number;
  step?: number;
  presets?: { label: string; value: number }[];
  unit?: string;
}

export const INTAKE_QUESTIONS: IntakeQuestionDef[] = [
  {
    id: "q_intent",
    field: "intent",
    stepNumber: 1,
    category: "Goal",
    title: "What type of loan are you exploring?",
    subtitle: "Select the loan product tailored to your current financing milestone.",
    inputType: "choice_grid",
    options: LOAN_PURPOSES.map((p) => ({
      id: p.id,
      label: p.label,
      subtext: p.shortDescription,
      icon: p.icon,
      badge: p.badge,
    })),
  },
  {
    id: "q_income",
    field: "income",
    stepNumber: 2,
    category: "Financials",
    title: "What is your monthly net income?",
    subtitle: "Helps verify debt-to-income ratios and maximum borrowing eligibility.",
    inputType: "currency_slider",
    min: 25000,
    max: 1000000,
    step: 5000,
    presets: [
      { label: "₹50K", value: 50000 },
      { label: "₹1 Lakh", value: 100000 },
      { label: "₹2 Lakh", value: 200000 },
      { label: "₹5 Lakh", value: 500000 },
    ],
  },
  {
    id: "q_employment",
    field: "employment_type",
    stepNumber: 3,
    category: "Profile",
    title: "What is your employment type?",
    subtitle: "Underwriting guidelines differ across salaried and self-employed profiles.",
    inputType: "single_choice",
    options: EMPLOYMENT_TYPES.map((e) => ({
      id: e.id,
      label: e.label,
      subtext: e.subtext,
    })),
  },
  {
    id: "q_amount",
    field: "loan_amount",
    stepNumber: 4,
    category: "Financials",
    title: "How much would you like to borrow?",
    subtitle: "Specify the estimated principal loan amount required for your goal.",
    inputType: "currency_slider",
    min: 100000,
    max: 20000000,
    step: 50000,
    presets: [
      { label: "₹10 Lakh", value: 1000000 },
      { label: "₹25 Lakh", value: 2500000 },
      { label: "₹50 Lakh", value: 5000000 },
      { label: "₹1 Crore", value: 10000000 },
    ],
  },
  {
    id: "q_tenure",
    field: "tenure_years",
    stepNumber: 5,
    category: "Financials",
    title: "What tenure do you prefer?",
    subtitle: "Longer tenures reduce monthly EMI; shorter tenures reduce total interest paid.",
    inputType: "tenure_slider",
    min: 1,
    max: 30,
    step: 1,
    unit: "Years",
    presets: [
      { label: "3 Yrs", value: 3 },
      { label: "5 Yrs", value: 5 },
      { label: "10 Yrs", value: 10 },
      { label: "20 Yrs", value: 20 },
      { label: "30 Yrs", value: 30 },
    ],
  },
  {
    id: "q_emi",
    field: "existing_emi",
    stepNumber: 6,
    category: "Financials",
    title: "Do you have existing monthly EMIs?",
    subtitle: "Active obligations currently being serviced across other bank facilities.",
    inputType: "currency_slider",
    min: 0,
    max: 200000,
    step: 2500,
    presets: [
      { label: "₹0 (None)", value: 0 },
      { label: "₹15,000", value: 15000 },
      { label: "₹35,000", value: 35000 },
      { label: "₹75,000", value: 75000 },
    ],
  },
  {
    id: "q_credit",
    field: "credit_band",
    stepNumber: 7,
    category: "Profile",
    title: "What is your credit score range?",
    subtitle: "High credit scores qualify for concessionary benchmark interest rates.",
    inputType: "single_choice",
    options: CREDIT_BANDS.map((c) => ({
      id: c.id,
      label: c.label,
      subtext: c.subtext,
    })),
  },
  {
    id: "q_urgency",
    field: "urgency",
    stepNumber: 8,
    category: "Timeline",
    title: "How soon do you need the loan?",
    subtitle: "Helps route your application through instant or standard underwriting channels.",
    inputType: "single_choice",
    options: URGENCY_OPTIONS.map((u) => ({
      id: u.id,
      label: u.label,
      subtext: u.subtext,
    })),
  },
];

/**
 * Service to fetch questions dynamically (Mock now, API-ready later)
 */
export async function getIntakeQuestions(): Promise<IntakeQuestionDef[]> {
  // Returns static schema for mock mode; ready to fetch from backend in future
  return INTAKE_QUESTIONS;
}
