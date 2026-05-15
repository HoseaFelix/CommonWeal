import { z } from "zod";
import { grantApplicationSchema } from "@/constants/constant";

export type GrantApplicationFeedback = z.infer<typeof grantApplicationSchema>;

export interface RiskFlag {
  area: string
  severity: string
  rationale: string
}

export interface GrantApplicationData {
  viabilityScore: number
  recommendation: string
  thesis: string
  riskFlags: RiskFlag[]
  strengths: string[]
  diligenceQuestions: string[]
  milestoneConditions: string[]
}

declare global {
  interface EthereumProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  }

  interface Window {
    ethereum?: EthereumProvider;
  }
}
