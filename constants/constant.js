import { z } from 'zod';

export const grantApplicationSchema = z.object({
  viabilityScore: z.number(),
  recommendation: z.string(),
  thesis: z.string(),
  riskFlags: z.array(z.object({
    area: z.string(),
    severity: z.string(),
    rationale: z.string(),
  })),
  strengths: z.array(z.string()),
  diligenceQuestions: z.array(z.string()),
  milestoneConditions: z.array(z.string()),
});
