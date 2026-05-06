'use client'
import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeAnalysis, normalizeBenchmark } from '@/app/lib/genlayer';

const STANDARDS = [
  { id: 'GDPR', name: 'GDPR', description: 'General Data Protection Regulation' },
  { id: 'CCPA', name: 'CCPA', description: 'California Consumer Privacy Act' },
  { id: 'ISO27001', name: 'ISO 27001', description: 'Information Security Management' },
  { id: 'HIPAA', name: 'HIPAA', description: 'Health Insurance Portability & Accountability' },
];

export default function BenchmarkPanel() {
  const { account, walletType } = useWallet();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('');
  const [benchmark, setBenchmark] = useState<any>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalyses = async () => {
      if (!account?.address) {
        setAnalyses([]);
        return;
      }

      try {
        const client = getGenlayerClient(account, walletType);
        const result = await client.readContract({
          address: getContractAddress(),
          functionName: 'get_user_analyses',
          args: [account.address],
        });

        setAnalyses(Array.isArray(result) ? result.map((item) => normalizeAnalysis(item)) : []);
      } catch (caughtError) {
        console.error('Failed to load analyses for benchmarking:', caughtError);
        setAnalyses([]);
      }
    };

    void loadAnalyses();
  }, [account, walletType]);

  const handleBenchmark = async () => {
    if (!selectedPolicy || !selectedStandard) {
      setError('Please select both a policy and standard');
      return;
    }

    if (!account?.address) {
      setError('Please connect your wallet');
      return;
    }

    setBenchmarkLoading(true);
    setError('');

    try {
      const client = getGenlayerClient(account, walletType);
      const txHash = await client.writeContract({
        address: getContractAddress(),
        functionName: 'benchmark_against_standard',
        args: [selectedPolicy, selectedStandard],
        value: 0n,
      });

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        retries: 300,
        interval: 3000,
      });

      if (receipt.result !== 0 && receipt.result !== 6) {
        throw new Error(receipt.resultName || 'Benchmark failed during consensus');
      }

      const benchmarksResult = await client.readContract({
        address: getContractAddress(),
        functionName: 'get_user_benchmarks',
        args: [account.address],
      });

      if (!Array.isArray(benchmarksResult) || benchmarksResult.length === 0) {
        throw new Error('Benchmark finalized, but no benchmark result was returned');
      }

      const latestBenchmark = normalizeBenchmark(benchmarksResult[benchmarksResult.length - 1]);

      setBenchmark({
        message: `Policy benchmarked against ${selectedStandard}!`,
        transactionHash: txHash,
        completedAt: new Date().toLocaleString(),
        ...latestBenchmark,
      });
      setSelectedPolicy('');
      setSelectedStandard('');
    } catch (caughtError) {
      console.error('Error benchmarking:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to run benchmark');
    } finally {
      setBenchmarkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display mb-2">Compliance Benchmarking</h2>
        <p className="text-text-muted">Measure your policies against industry compliance standards and identify gaps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
            <label className="block text-sm font-semibold mb-3">Select Policy</label>
            <select
              value={selectedPolicy}
              onChange={(e) => setSelectedPolicy(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-bg-dark border border-card-border/50 text-text-main focus:outline-none focus:border-accent-primary/50 transition-all"
            >
              <option value="">Choose a policy to benchmark...</option>
              {analyses.map((analysis) => (
                <option key={analysis.analysis_id} value={analysis.analysis_id}>
                  {(analysis.policy_name || analysis.analysis_id)} - Risk: {analysis.risk_level}
                </option>
              ))}
            </select>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
            <label className="block text-sm font-semibold mb-3">Select Standard</label>
            <div className="grid grid-cols-2 gap-3">
              {STANDARDS.map((std) => (
                <button
                  key={std.id}
                  onClick={() => setSelectedStandard(std.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedStandard === std.id
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-card-border/50 bg-bg-dark hover:border-card-border'
                  }`}
                >
                  <div className="font-semibold text-sm">{std.name}</div>
                  <div className="text-xs text-text-muted">{std.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleBenchmark}
            disabled={benchmarkLoading || !selectedPolicy || !selectedStandard}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-primary to-accent-secondary text-bg-dark font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            {benchmarkLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-bg-dark border-t-transparent"></div>
                Running Benchmark...
              </span>
            ) : (
              'Run Benchmark'
            )}
          </button>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              Warning: {error}
            </div>
          )}

          {benchmark && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 via-green-500/10 to-bg-dark/40 border border-green-500/30">
                <h3 className="font-semibold mb-3 text-green-400">Benchmarked</h3>
                <p className="text-sm text-text-muted mb-2">{benchmark.message}</p>
                <p className="text-xs text-text-muted break-all">{benchmark.transactionHash}</p>
                <p className="text-xs text-text-muted/60 mt-2">{benchmark.completedAt}</p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
                <div className="text-xs text-text-muted uppercase tracking-widest mb-2">Compliance Score</div>
                <div className="text-4xl font-bold text-accent-tertiary mb-3">{benchmark.compliance_score}/100</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Priority</div>
                    <div className="text-text-main font-semibold">{benchmark.improvement_priority}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Timeline</div>
                    <div className="text-text-main font-semibold">{benchmark.timeline_suggestion}</div>
                  </div>
                </div>
              </div>

              {benchmark.gaps?.length > 0 && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
                  <h3 className="font-semibold mb-3">Gaps</h3>
                  <div className="space-y-2">
                    {benchmark.gaps.map((item: string, index: number) => (
                      <p key={`${item}-${index}`} className="text-sm text-text-main">{item}</p>
                    ))}
                  </div>
                </div>
              )}

              {benchmark.strengths?.length > 0 && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
                  <h3 className="font-semibold mb-3">Strengths</h3>
                  <div className="space-y-2">
                    {benchmark.strengths.map((item: string, index: number) => (
                      <p key={`${item}-${index}`} className="text-sm text-text-main">{item}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-tertiary/20 via-accent-tertiary/10 to-bg-dark/40 border border-accent-tertiary/30">
            <h3 className="font-semibold mb-3">Benchmark Results</h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>Compliance Score (0-100)</li>
              <li>Critical Gaps Identified</li>
              <li>Existing Strengths</li>
              <li>Priority Level</li>
              <li>Implementation Timeline</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
            <h3 className="font-semibold mb-3">Supported Standards</h3>
            <ul className="space-y-2 text-sm text-text-muted">
              {STANDARDS.map((std) => (
                <li key={std.id}>{std.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
