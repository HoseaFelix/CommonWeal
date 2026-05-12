import { z } from "zod";
import { vendorReviewSchema } from "@/constants/constant";

export type VendorReviewFeedback = z.infer<typeof vendorReviewSchema>;

export interface CriticalFinding {
  area: string
  severity: string
  rationale: string
}

export interface VendorReviewData {
  trustScore: number
  decision: string
  summary: string
  criticalFindings: CriticalFinding[]
  strengths: string[]
  followUpQuestions: string[]
  recommendedControls: string[]
}

declare global {
  interface EthereumProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  }

  interface Window {
    ethereum?: EthereumProvider;
  }
}
