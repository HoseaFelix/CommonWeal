import { z } from 'zod';

export const policySchema = z.object({
  riskScore: z.number(),
  riskLevel: z.string(),
  summary: z.string(),
  riskyClauses: z.array(z.object({
    clause: z.string(),
    risk: z.string(),
    reason: z.string().optional(),
  })),
  plainEnglish: z.array(z.string()),
  complianceFlags: z.array(z.string()),
  recommendations: z.array(z.string()),
});




