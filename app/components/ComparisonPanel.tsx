'use client'
import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeAnalysis, normalizeComparison } from '@/app/lib/genlayer';

export default function ComparisonPanel() {
  const { account, walletType } = useWallet();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(false);
  const [policyA, setPolicyA] = useState('');
  const [policyB, setPolicyB] = useState('');
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparison, setComparison] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalyses = async () => {
      if (!account?.address) {
        setAnalyses([]);
        return;
      }

      setAnalysesLoading(true);
      try {
        const client = getGenlayerClient(account, walletType);
        const result = await client.readContract({
          address: getContractAddress(),
          functionName: 'get_user_analyses',
          args: [account.address],
        });

        setAnalyses(Array.isArray(result) ? result.map((item) => normalizeAnalysis(item)) : []);
      } catch (caughtError) {
        console.error('Failed to load analyses for comparison:', caughtError);
        setAnalyses([]);
      } finally {
        setAnalysesLoading(false);
      }
    };

    void loadAnalyses();
  }, [account, walletType]);

  const handleCompare = async () => {
    if (!policyA || !policyB || policyA === policyB) {
      setError('Please select two different policies to compare');
      return;
    }

    if (!account?.address) {
      setError('Please connect your wallet');
      return;
    }

    setComparisonLoading(true);
    setError('');
    setComparison(null);

    try {
      const client = getGenlayerClient(account, walletType);
      const txHash = await client.writeContract({
        address: getContractAddress(),
        functionName: 'compare_policies',
        args: [policyA, policyB],
        value: 0n,
      });

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        retries: 300,
        interval: 3000,
      });

      if (receipt.result !== 0 && receipt.result !== 6) {
        throw new Error(receipt.resultName || 'Comparison failed during consensus');
      }

      const comparisonsResult = await client.readContract({
        address: getContractAddress(),
        functionName: 'get_user_comparisons',
        args: [account.address],
      });

      if (!Array.isArray(comparisonsResult) || comparisonsResult.length === 0) {
        throw new Error('Comparison finalized, but no comparison result was returned');
      }

      const latestComparison = normalizeComparison(comparisonsResult[comparisonsResult.length - 1]);

      setComparison({
        message: 'Policy comparison completed!',
        transactionHash: txHash,
        completedAt: new Date().toLocaleString(),
        ...latestComparison,
      });
      setPolicyA('');
      setPolicyB('');
    } catch (caughtError) {
      console.error('Error comparing policies:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to compare policies');
    } finally {
      setComparisonLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display mb-2">Compare Policies</h2>
        <p className="text-text-muted">Analyze divergences, shared risks, and harmonization opportunities between two policies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
              <label className="block text-sm font-semibold mb-3">Policy A</label>
              <select
                value={policyA}
                onChange={(e) => setPolicyA(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-bg-dark border border-card-border/50 text-text-main focus:outline-none focus:border-accent-primary/50 transition-all"
              >
                <option value="">Select first policy...</option>
                {analyses.map((analysis) => (
                <option key={analysis.analysis_id} value={analysis.analysis_id}>
                    {(analysis.policy_name || analysis.analysis_id)} - {analysis.risk_level}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
              <label className="block text-sm font-semibold mb-3">Policy B</label>
              <select
                value={policyB}
                onChange={(e) => setPolicyB(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-bg-dark border border-card-border/50 text-text-main focus:outline-none focus:border-accent-primary/50 transition-all"
              >
                <option value="">Select second policy...</option>
                {analyses.map((analysis) => (
                <option key={analysis.analysis_id} value={analysis.analysis_id}>
                    {(analysis.policy_name || analysis.analysis_id)} - {analysis.risk_level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleCompare}
            disabled={comparisonLoading || !policyA || !policyB}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-primary to-accent-secondary text-bg-dark font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            {comparisonLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-bg-dark border-t-transparent"></div>
                Comparing Policies...
              </span>
            ) : (
              'Compare Now'
            )}
          </button>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              Warning: {error}
            </div>
          )}

          {!analysesLoading && analyses.length === 0 && (
            <div className="p-6 rounded-lg bg-card-dark/60 border border-card-border/50 text-center text-text-muted">
              Analyze at least 2 policies before comparing
            </div>
          )}

          {comparison && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 via-green-500/10 to-bg-dark/40 border border-green-500/30">
                <h3 className="font-semibold mb-3 text-green-400">Complete</h3>
                <p className="text-sm text-text-muted mb-2">{comparison.message}</p>
                <p className="text-xs text-text-muted break-all">{comparison.transactionHash}</p>
                <p className="text-xs text-text-muted/60 mt-2">{comparison.completedAt}</p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
                <div className="text-xs text-text-muted uppercase tracking-widest mb-2">Divergence Score</div>
                <div className="text-4xl font-bold text-accent-secondary mb-3">{comparison.divergence_score}/100</div>
                <div className="text-xs text-text-muted uppercase tracking-widest mb-2">Alignment Assessment</div>
                <p className="text-sm text-text-main">{comparison.alignment_assessment}</p>
              </div>

              {comparison.key_differences?.length > 0 && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
                  <h3 className="font-semibold mb-3">Key Differences</h3>
                  <div className="space-y-2">
                    {comparison.key_differences.map((item: string, index: number) => (
                      <p key={`${item}-${index}`} className="text-sm text-text-main">{item}</p>
                    ))}
                  </div>
                </div>
              )}

              {comparison.shared_risks?.length > 0 && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
                  <h3 className="font-semibold mb-3">Shared Risks</h3>
                  <div className="space-y-2">
                    {comparison.shared_risks.map((item: string, index: number) => (
                      <p key={`${item}-${index}`} className="text-sm text-text-main">{item}</p>
                    ))}
                  </div>
                </div>
              )}

              {comparison.harmonization_suggestions?.length > 0 && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
                  <h3 className="font-semibold mb-3">Harmonization Suggestions</h3>
                  <div className="space-y-2">
                    {comparison.harmonization_suggestions.map((item: string, index: number) => (
                      <p key={`${item}-${index}`} className="text-sm text-text-main">{item}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-secondary/20 via-accent-secondary/10 to-bg-dark/40 border border-accent-secondary/30">
            <h3 className="font-semibold mb-3">Comparison Includes</h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>Divergence Score (0-100)</li>
              <li>Key Differences</li>
              <li>Shared Risks</li>
              <li>Alignment Assessment</li>
              <li>Harmonization Suggestions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
