import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ChatMessage, Recommendation } from "@/lib/api/client";

interface AppState {
  // Session
  sessionId: string | null;
  completeness: number;
  isComplete: boolean;
  currentPhase: string;

  // Chat
  messages: ChatMessage[];
  currentQuestion: ChatMessage | null;

  // Results
  recommendations: Recommendation[];
  selectedRec: Recommendation | null;

  // Lead
  leadResult: {
    lead_id: string;
    score: number;
    score_band: string;
    ai_briefing: string;
    talking_points: string[];
    qualification_probability: number;
    estimated_closing_days: number;
  } | null;

  // Actions
  setSessionId: (id: string) => void;
  setCompleteness: (pct: number, phase: string, complete: boolean) => void;
  addMessages: (msgs: ChatMessage[]) => void;
  setCurrentQuestion: (msg: ChatMessage | null) => void;
  setRecommendations: (recs: Recommendation[]) => void;
  setSelectedRec: (rec: Recommendation | null) => void;
  setLeadResult: (r: AppState["leadResult"]) => void;
  reset: () => void;
}

const initial: Pick<AppState, "sessionId" | "completeness" | "isComplete" | "currentPhase" | "messages" | "currentQuestion" | "recommendations" | "selectedRec" | "leadResult"> = {
  sessionId: null,
  completeness: 0,
  isComplete: false,
  currentPhase: "greeting",
  messages: [],
  currentQuestion: null,
  recommendations: [],
  selectedRec: null,
  leadResult: null,
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...initial,
      setSessionId: (id) => set({ sessionId: id }),
      setCompleteness: (pct, phase, complete) => set({ completeness: pct, currentPhase: phase, isComplete: complete }),
      addMessages: (msgs) => set((s) => ({ messages: [...s.messages, ...msgs] })),
      setCurrentQuestion: (msg) => set({ currentQuestion: msg }),
      setRecommendations: (recs) => set({ recommendations: recs }),
      setSelectedRec: (rec) => set({ selectedRec: rec }),
      setLeadResult: (r) => set({ leadResult: r }),
      reset: () => set(initial),
    }),
    {
      name: "dhansetu-session",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.sessionStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} })),
    }
  )
);
