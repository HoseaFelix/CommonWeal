'use client';

import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { privateKeyToAccount } from 'viem/accounts';

type WalletType = 'auto' | 'metamask' | null;

type WalletAccount = {
  address: string;
  privateKey?: string;
};

export const ANALYSIS_KEYS = [
  'analysis_id',
  'policy_name',
  'policy_text',
  'author',
  'risk_score',
  'risk_level',
  'summary',
  'risky_clauses',
  'plain_english',
  'compliance_flags',
  'recommendations',
  'timestamp',
] as const;

export const AUDIT_KEYS = [
  'trail_id',
  'policy_id',
  'author',
  'action',
  'timestamp',
  'change_details',
] as const;

export const COMPARISON_KEYS = [
  'comparison_id',
  'policy_a_id',
  'policy_b_id',
  'author',
  'divergence_score',
  'key_differences',
  'shared_risks',
  'alignment_assessment',
  'harmonization_suggestions',
  'timestamp',
] as const;

export const BENCHMARK_KEYS = [
  'benchmark_id',
  'policy_analysis_id',
  'author',
  'standard_type',
  'compliance_score',
  'gaps',
  'strengths',
  'improvement_priority',
  'timeline_suggestion',
  'timestamp',
] as const;

export const REPORT_KEYS = [
  'report_id',
  'workspace_owner',
  'author',
  'total_policies',
  'average_risk_score',
  'high_risk_count',
  'critical_risk_count',
  'compliance_status',
  'key_recommendations',
  'generated_at',
] as const;

export function getContractAddress() {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error('Contract address not configured');
  }
  return address as `0x${string}`;
}

export function getGenlayerClient(account: WalletAccount | null, walletType: WalletType) {
  if (!account) {
    throw new Error('Please connect your wallet first');
  }

  if (walletType === 'auto') {
    if (!account.privateKey) {
      throw new Error('Auto wallet private key not available');
    }

    const viemAccount = privateKeyToAccount(
      (account.privateKey.startsWith('0x') ? account.privateKey : `0x${account.privateKey}`) as `0x${string}`
    );

    return createClient({
      chain: studionet,
      account: viemAccount,
    });
  }

  if (walletType === 'metamask') {
    return createClient({
      chain: studionet,
      account: account.address as `0x${string}`,
    });
  }

  throw new Error('Unsupported wallet type');
}

export function toPlainObject(
  value: unknown,
  keys?: readonly string[]
): Record<string, unknown> {
  if (value instanceof Map) {
    return Object.fromEntries(value);
  }

  if (Array.isArray(value)) {
    if (!keys) {
      return Object.fromEntries(value.map((item, index) => [String(index), item]));
    }
    return Object.fromEntries(keys.map((key, index) => [key, value[index]]));
  }

  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }

  return {};
}

export function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item));
}

export function normalizeClauses(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const record = toPlainObject(item);
    return {
      clause: String(record.clause ?? record[0] ?? ''),
      risk: String(record.risk ?? record[1] ?? 'Medium'),
      reason: String(record.reason ?? record[2] ?? ''),
    };
  });
}

export function normalizeAnalysis(rawValue: unknown) {
  const raw = toPlainObject(rawValue, ANALYSIS_KEYS);

  return {
    analysis_id: String(raw.analysis_id ?? ''),
    policy_name: String(raw.policy_name ?? ''),
    policy_text: String(raw.policy_text ?? ''),
    author: String(raw.author ?? ''),
    risk_score: Number(raw.risk_score ?? 0),
    risk_level: String(raw.risk_level ?? 'Unknown'),
    summary: String(raw.summary ?? ''),
    risky_clauses: normalizeClauses(raw.risky_clauses ?? []),
    plain_english: normalizeStringList(raw.plain_english ?? []),
    compliance_flags: normalizeStringList(raw.compliance_flags ?? []),
    recommendations: normalizeStringList(raw.recommendations ?? []),
    timestamp: String(raw.timestamp ?? ''),
  };
}

export function normalizeAuditEntry(rawValue: unknown) {
  const raw = toPlainObject(rawValue, AUDIT_KEYS);

  return {
    trail_id: String(raw.trail_id ?? ''),
    policy_id: String(raw.policy_id ?? ''),
    author: String(raw.author ?? ''),
    action: String(raw.action ?? ''),
    timestamp: String(raw.timestamp ?? ''),
    change_details: String(raw.change_details ?? ''),
  };
}

export function normalizeComparison(rawValue: unknown) {
  const raw = toPlainObject(rawValue, COMPARISON_KEYS);

  return {
    comparison_id: String(raw.comparison_id ?? ''),
    policy_a_id: String(raw.policy_a_id ?? ''),
    policy_b_id: String(raw.policy_b_id ?? ''),
    author: String(raw.author ?? ''),
    divergence_score: Number(raw.divergence_score ?? 0),
    key_differences: normalizeStringList(raw.key_differences ?? []),
    shared_risks: normalizeStringList(raw.shared_risks ?? []),
    alignment_assessment: String(raw.alignment_assessment ?? ''),
    harmonization_suggestions: normalizeStringList(raw.harmonization_suggestions ?? []),
    timestamp: String(raw.timestamp ?? ''),
  };
}

export function normalizeBenchmark(rawValue: unknown) {
  const raw = toPlainObject(rawValue, BENCHMARK_KEYS);

  return {
    benchmark_id: String(raw.benchmark_id ?? ''),
    policy_analysis_id: String(raw.policy_analysis_id ?? ''),
    author: String(raw.author ?? ''),
    standard_type: String(raw.standard_type ?? ''),
    compliance_score: Number(raw.compliance_score ?? 0),
    gaps: normalizeStringList(raw.gaps ?? []),
    strengths: normalizeStringList(raw.strengths ?? []),
    improvement_priority: String(raw.improvement_priority ?? ''),
    timeline_suggestion: String(raw.timeline_suggestion ?? ''),
    timestamp: String(raw.timestamp ?? ''),
  };
}

export function normalizeReport(rawValue: unknown) {
  const raw = toPlainObject(rawValue, REPORT_KEYS);

  return {
    report_id: String(raw.report_id ?? ''),
    workspace_owner: String(raw.workspace_owner ?? ''),
    author: String(raw.author ?? ''),
    total_policies: Number(raw.total_policies ?? 0),
    average_risk_score: Number(raw.average_risk_score ?? 0),
    high_risk_count: Number(raw.high_risk_count ?? 0),
    critical_risk_count: Number(raw.critical_risk_count ?? 0),
    compliance_status: String(raw.compliance_status ?? ''),
    key_recommendations: normalizeStringList(raw.key_recommendations ?? []),
    generated_at: String(raw.generated_at ?? ''),
  };
}
