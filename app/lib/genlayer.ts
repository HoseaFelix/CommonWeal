'use client';

import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { privateKeyToAccount } from 'viem/accounts';

type WalletType = 'auto' | 'metamask' | null;

type WalletAccount = {
  address: string;
  privateKey?: string;
};

const REVIEW_KEYS = [
  'review_id',
  'vendor_name',
  'service_scope',
  'materials',
  'author',
  'trust_score',
  'decision',
  'summary',
  'critical_findings',
  'strengths',
  'follow_up_questions',
  'recommended_controls',
  'timestamp',
] as const;

const FINDING_KEYS = ['area', 'severity', 'rationale'] as const;

const COMPARISON_KEYS = [
  'comparison_id',
  'review_a_id',
  'review_b_id',
  'author',
  'differentiation_score',
  'standout_strengths',
  'shared_exposures',
  'recommendation',
  'decision_rationale',
  'timestamp',
] as const;

const BENCHMARK_KEYS = [
  'benchmark_id',
  'review_id',
  'author',
  'framework_type',
  'coverage_score',
  'uncovered_gaps',
  'evidence_signals',
  'remediation_priority',
  'approval_posture',
  'timestamp',
] as const;

const ACTIVITY_KEYS = [
  'entry_id',
  'resource_id',
  'author',
  'action',
  'timestamp',
  'details',
] as const;

const REPORT_KEYS = [
  'report_id',
  'workspace_owner',
  'author',
  'total_vendors',
  'average_trust_score',
  'escalated_count',
  'conditional_count',
  'portfolio_posture',
  'key_actions',
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

export function toPlainObject(value: unknown, keys?: readonly string[]): Record<string, unknown> {
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

export function normalizeFindings(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const record = toPlainObject(item, FINDING_KEYS);
    return {
      area: String(record.area ?? ''),
      severity: String(record.severity ?? 'Medium'),
      rationale: String(record.rationale ?? ''),
    };
  });
}

export function normalizeReview(rawValue: unknown) {
  const raw = toPlainObject(rawValue, REVIEW_KEYS);

  return {
    review_id: String(raw.review_id ?? ''),
    vendor_name: String(raw.vendor_name ?? ''),
    service_scope: String(raw.service_scope ?? ''),
    materials: String(raw.materials ?? ''),
    author: String(raw.author ?? ''),
    trust_score: Number(raw.trust_score ?? 0),
    decision: String(raw.decision ?? ''),
    summary: String(raw.summary ?? ''),
    critical_findings: normalizeFindings(raw.critical_findings ?? []),
    strengths: normalizeStringList(raw.strengths ?? []),
    follow_up_questions: normalizeStringList(raw.follow_up_questions ?? []),
    recommended_controls: normalizeStringList(raw.recommended_controls ?? []),
    timestamp: String(raw.timestamp ?? ''),
  };
}

export function normalizeComparison(rawValue: unknown) {
  const raw = toPlainObject(rawValue, COMPARISON_KEYS);

  return {
    comparison_id: String(raw.comparison_id ?? ''),
    review_a_id: String(raw.review_a_id ?? ''),
    review_b_id: String(raw.review_b_id ?? ''),
    author: String(raw.author ?? ''),
    differentiation_score: Number(raw.differentiation_score ?? 0),
    standout_strengths: normalizeStringList(raw.standout_strengths ?? []),
    shared_exposures: normalizeStringList(raw.shared_exposures ?? []),
    recommendation: String(raw.recommendation ?? ''),
    decision_rationale: String(raw.decision_rationale ?? ''),
    timestamp: String(raw.timestamp ?? ''),
  };
}

export function normalizeBenchmark(rawValue: unknown) {
  const raw = toPlainObject(rawValue, BENCHMARK_KEYS);

  return {
    benchmark_id: String(raw.benchmark_id ?? ''),
    review_id: String(raw.review_id ?? ''),
    author: String(raw.author ?? ''),
    framework_type: String(raw.framework_type ?? ''),
    coverage_score: Number(raw.coverage_score ?? 0),
    uncovered_gaps: normalizeStringList(raw.uncovered_gaps ?? []),
    evidence_signals: normalizeStringList(raw.evidence_signals ?? []),
    remediation_priority: String(raw.remediation_priority ?? ''),
    approval_posture: String(raw.approval_posture ?? ''),
    timestamp: String(raw.timestamp ?? ''),
  };
}

export function normalizeActivityEntry(rawValue: unknown) {
  const raw = toPlainObject(rawValue, ACTIVITY_KEYS);

  return {
    entry_id: String(raw.entry_id ?? ''),
    resource_id: String(raw.resource_id ?? ''),
    author: String(raw.author ?? ''),
    action: String(raw.action ?? ''),
    timestamp: String(raw.timestamp ?? ''),
    details: String(raw.details ?? ''),
  };
}

export function normalizeReport(rawValue: unknown) {
  const raw = toPlainObject(rawValue, REPORT_KEYS);

  return {
    report_id: String(raw.report_id ?? ''),
    workspace_owner: String(raw.workspace_owner ?? ''),
    author: String(raw.author ?? ''),
    total_vendors: Number(raw.total_vendors ?? 0),
    average_trust_score: Number(raw.average_trust_score ?? 0),
    escalated_count: Number(raw.escalated_count ?? 0),
    conditional_count: Number(raw.conditional_count ?? 0),
    portfolio_posture: String(raw.portfolio_posture ?? ''),
    key_actions: normalizeStringList(raw.key_actions ?? []),
    generated_at: String(raw.generated_at ?? ''),
  };
}
