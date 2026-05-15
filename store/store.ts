import { create } from "zustand";
import { GrantApplicationFeedback } from "../types";

type ErrorState = {
  error: string;
  setError: (msg: string) => void;
  clearError: () => void;
}

export const useGrantApplicationStore = create<GrantApplicationFeedback>(() => ({
  viabilityScore: 0,
  recommendation: "",
  thesis: "",
  riskFlags: [],
  strengths: [],
  diligenceQuestions: [],
  milestoneConditions: [],
}));

export const useErrorStore = create<ErrorState>((set) => ({
  error: "",
  setError: (msg) => set({ error: msg }),
  clearError: () => set({ error: "" }),
}));
