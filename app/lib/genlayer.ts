'use client';

import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { privateKeyToAccount } from 'viem/accounts';

type WalletType = 'auto' | 'metamask' | null;

type WalletAccount = {
  address: string;
  privateKey?: string;
};

const APPLICATION_KEYS = [
  'application_id',
  'applicant_name',
  'project_title',
  'funding_request',
  'application_materials',
  'author',
  'viability_score',
  'recommendation',
  'thesis',
  'risk_flags',
  'strengths',
  'diligence_questions',
  'milestone_conditions',
  'timestamp',
] as const;

const RISK_FLAG_KEYS = ['area', 'severity', 'rationale'] as const;

const COMPARISON_KEYS = [
  'comparison_id',
  'application_a_id',
  'application_b_id',
  'author',
  'separation_score',
  'unique_advantages',
  'overlapping_risks',
  'allocation_recommendation',
  'rationale',
  'timestamp',
] as const;

const BENCHMARK_KEYS = [
  'benchmark_id',
  'application_id',
  'author',
  'rubric_type',
  'alignment_score',
  'uncovered_gaps',
  'evidence_signals',
  'diligence_priority',
  'release_posture',
  'timestamp',
] as const;

const LEDGER_KEYS = [
  'entry_id',
  'resource_id',
  'author',
  'action',
  'timestamp',
  'details',
] as const;

const MEMO_KEYS = [
  'memo_id',
  'workspace_owner',
  'author',
  'total_applications',
  'average_viability_score',
  'decline_count',
  'conditional_count',
  'portfolio_signal',
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

export function normalizeRiskFlags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const record = toPlainObject(item, RISK_FLAG_KEYS);
    return {
      area: String(record.area ?? ''),
      severity: String(record.severity ?? 'Medium'),
      rationale: String(record.rationale ?? ''),
    };
  });
}

export function normalizeApplication(rawValue: unknown) {
  const raw = toPlainObject(rawValue, APPLICATION_KEYS);

  return {
    application_id: String(raw.application_id ?? ''),
    applicant_name: String(raw.applicant_name ?? ''),
    project_title: String(raw.project_title ?? ''),
    funding_request: String(raw.funding_request ?? ''),
    application_materials: String(raw.application_materials ?? ''),
    author: String(raw.author ?? ''),
    viability_score: Number(raw.viability_score ?? 0),
    recommendation: String(raw.recommendation ?? ''),
    thesis: String(raw.thesis ?? ''),
    risk_flags: normalizeRiskFlags(raw.risk_flags ?? []),
    strengths: normalizeStringList(raw.strengths ?? []),
    diligence_questions: normalizeStringList(raw.diligence_questions ?? []),
    milestone_conditions: normalizeStringList(raw.milestone_conditions ?? []),
    timestamp: String(raw.timestamp ?? ''),
  };
}

export function normalizeComparison(rawValue: unknown) {
  const raw = toPlainObject(rawValue, COMPARISON_KEYS);

  return {
    comparison_id: String(raw.comparison_id ?? ''),
    application_a_id: String(raw.application_a_id ?? ''),
    application_b_id: String(raw.application_b_id ?? ''),
    author: String(raw.author ?? ''),
    separation_score: Number(raw.separation_score ?? 0),
    unique_advantages: normalizeStringList(raw.unique_advantages ?? []),
    overlapping_risks: normalizeStringList(raw.overlapping_risks ?? []),
    allocation_recommendation: String(raw.allocation_recommendation ?? ''),
    rationale: String(raw.rationale ?? ''),
    timestamp: String(raw.timestamp ?? ''),
  };
}

export function normalizeBenchmark(rawValue: unknown) {
  const raw = toPlainObject(rawValue, BENCHMARK_KEYS);

  return {
    benchmark_id: String(raw.benchmark_id ?? ''),
    application_id: String(raw.application_id ?? ''),
    author: String(raw.author ?? ''),
    rubric_type: String(raw.rubric_type ?? ''),
    alignment_score: Number(raw.alignment_score ?? 0),
    uncovered_gaps: normalizeStringList(raw.uncovered_gaps ?? []),
    evidence_signals: normalizeStringList(raw.evidence_signals ?? []),
    diligence_priority: String(raw.diligence_priority ?? ''),
    release_posture: String(raw.release_posture ?? ''),
    timestamp: String(raw.timestamp ?? ''),
  };
}

export function normalizeLedgerEntry(rawValue: unknown) {
  const raw = toPlainObject(rawValue, LEDGER_KEYS);

  return {
    entry_id: String(raw.entry_id ?? ''),
    resource_id: String(raw.resource_id ?? ''),
    author: String(raw.author ?? ''),
    action: String(raw.action ?? ''),
    timestamp: String(raw.timestamp ?? ''),
    details: String(raw.details ?? ''),
  };
}

export function normalizeMemo(rawValue: unknown) {
  const raw = toPlainObject(rawValue, MEMO_KEYS);

  return {
    memo_id: String(raw.memo_id ?? ''),
    workspace_owner: String(raw.workspace_owner ?? ''),
    author: String(raw.author ?? ''),
    total_applications: Number(raw.total_applications ?? 0),
    average_viability_score: Number(raw.average_viability_score ?? 0),
    decline_count: Number(raw.decline_count ?? 0),
    conditional_count: Number(raw.conditional_count ?? 0),
    portfolio_signal: String(raw.portfolio_signal ?? ''),
    key_actions: normalizeStringList(raw.key_actions ?? []),
    generated_at: String(raw.generated_at ?? ''),
  };
}
