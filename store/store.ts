import { create } from "zustand";
import { VendorReviewFeedback } from "../types";

type ErrorState = {
  error: string;
  setError: (msg: string) => void;
  clearError: () => void;
}

export const useVendorReviewStore = create<VendorReviewFeedback>(() => ({
  trustScore: 0,
  decision: "",
  summary: "",
  criticalFindings: [],
  strengths: [],
  followUpQuestions: [],
  recommendedControls: [],
}));

export const useErrorStore = create<ErrorState>((set) => ({
  error: "",
  setError: (msg) => set({ error: msg }),
  clearError: () => set({ error: "" }),
}));
