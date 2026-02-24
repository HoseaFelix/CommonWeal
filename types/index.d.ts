import { z } from "zod";
import { policySchema } from "@/constants/constant";

export type PolicyFeedback = z.infer<typeof policySchema>;

// types/feedback.d.ts or types/feedback.ts

export interface RiskyClause {
  clause: string
  risk: string
  reason?: string
}

export interface PolicyData {
  riskScore: number
  riskLevel: string
  summary: string
  riskyClauses: RiskyClause[]
  plainEnglish: string[]
  complianceFlags: string[]
  recommendations: string[]
}

export interface FeedbackErrorState {
  error: string | null
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
