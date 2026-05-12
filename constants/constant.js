import { z } from 'zod';

export const vendorReviewSchema = z.object({
  trustScore: z.number(),
  decision: z.string(),
  summary: z.string(),
  criticalFindings: z.array(z.object({
    area: z.string(),
    severity: z.string(),
    rationale: z.string(),
  })),
  strengths: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  recommendedControls: z.array(z.string()),
});
