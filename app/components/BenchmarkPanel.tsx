'use client'
import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeBenchmark, normalizeReview } from '@/app/lib/genlayer';

type ReviewRecord = ReturnType<typeof normalizeReview>;
type BenchmarkRecord = ReturnType<typeof normalizeBenchmark>;

const FRAMEWORKS = [
  { id: 'SOC2', name: 'SOC 2', note: 'Controls, monitoring, access discipline' },
  { id: 'ISO27001', name: 'ISO 27001', note: 'Governance, ISMS maturity, risk treatment' },
  { id: 'GDPR', name: 'GDPR', note: 'Data rights, subprocessors, retention' },
  { id: 'HIPAA', name: 'HIPAA', note: 'PHI safeguards and breach handling' },
];

export default function BenchmarkPanel() {
  const { account, walletType } = useWallet();
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [selectedReview, setSelectedReview] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');
  const [benchmark, setBenchmark] = useState<(BenchmarkRecord & { transactionHash: string; completedAt: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReviews = async () => {
      if (!account?.address) {
        setReviews([]);
        return;
      }

      try {
        const client = getGenlayerClient(account, walletType);
        const result = await client.readContract({
          address: getContractAddress(),
          functionName: 'get_user_reviews',
          args: [account.address],
        });

        setReviews(Array.isArray(result) ? result.map((item) => normalizeReview(item)) : []);
      } catch (caughtError) {
        console.error('Failed to load reviews for framework benchmark:', caughtError);
        setReviews([]);
      }
    };

    void loadReviews();
  }, [account, walletType]);

  const handleBenchmark = async () => {
    if (!selectedReview || !selectedFramework) {
      setError('Choose a vendor review and a framework.');
      return;
    }

    if (!account?.address) {
      setError('Connect a wallet before benchmarking.');
      return;
    }

    setLoading(true);
    setError('');
    setBenchmark(null);

    try {
      const client = getGenlayerClient(account, walletType);
      const txHash = await client.writeContract({
        address: getContractAddress(),
        functionName: 'benchmark_vendor',
        args: [selectedReview, selectedFramework],
        value: 0n,
      });

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        retries: 300,
        interval: 3000,
      });

      if (receipt.result !== 0 && receipt.result !== 6) {
        throw new Error(receipt.resultName || 'Framework benchmark failed during consensus');
      }

      const benchmarksResult = await client.readContract({
        address: getContractAddress(),
        functionName: 'get_user_benchmarks',
        args: [account.address],
      });

      if (!Array.isArray(benchmarksResult) || benchmarksResult.length === 0) {
        throw new Error('Benchmark completed, but no result was returned.');
      }

      const latestBenchmark = normalizeBenchmark(benchmarksResult[benchmarksResult.length - 1]);
      setBenchmark({
        ...latestBenchmark,
        transactionHash: txHash,
        completedAt: new Date().toLocaleString(),
      });
      setSelectedReview('');
      setSelectedFramework('');
    } catch (caughtError) {
      console.error('Error benchmarking vendor:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to benchmark vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="panel px-5 py-5 sm:px-6">
        <div className="eyebrow">Framework Review</div>
        <h2 className="mt-2 font-display text-2xl">Measure Evidence Coverage</h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Test a completed vendor review against one framework at a time. The benchmark highlights
          missing evidence, stronger signals, remediation urgency, and a practical approval posture.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">Reviewed Vendor</label>
            <select value={selectedReview} onChange={(event) => setSelectedReview(event.target.value)} className="field">
              <option value="">Select a reviewed vendor...</option>
              {reviews.map((review) => (
                <option key={review.review_id} value={review.review_id}>
                  {review.vendor_name} - {review.decision}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Framework</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FRAMEWORKS.map((framework) => (
                <button
                  key={framework.id}
                  onClick={() => setSelectedFramework(framework.id)}
                  className={`rounded-[1.2rem] border px-4 py-4 text-left transition ${
                    selectedFramework === framework.id
                      ? 'border-accent-primary bg-white text-text-main shadow-[0_12px_25px_rgba(150,81,55,0.12)]'
                      : 'border-edge bg-white/50 text-text-main hover:bg-white/80'
                  }`}
                >
                  <div className="font-semibold">{framework.name}</div>
                  <div className="mt-1 text-sm text-text-muted">{framework.note}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleBenchmark}
            disabled={loading || !selectedReview || !selectedFramework}
            className="primary-btn w-full sm:w-auto"
          >
            {loading ? 'Running framework benchmark...' : 'Run Benchmark'}
          </button>

          {error && (
            <div className="rounded-[1.2rem] border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-5">
        {benchmark ? (
          <>
            <div className="panel px-5 py-5 sm:px-6">
              <div className="eyebrow">Coverage Score</div>
              <div className="mt-3 text-5xl font-black text-accent-secondary">{benchmark.coverage_score}</div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-text-muted">Remediation Priority</div>
                  <div className="mt-1 font-semibold">{benchmark.remediation_priority}</div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Approval Posture</div>
                  <div className="mt-1 font-semibold">{benchmark.approval_posture}</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-text-muted">
                <div>{benchmark.completedAt}</div>
                <div className="mt-1 break-all font-mono">{benchmark.transactionHash}</div>
              </div>
            </div>

            <div className="panel-soft px-5 py-5">
              <div className="eyebrow">Uncovered Gaps</div>
              <div className="mt-3 space-y-3 text-sm leading-6 text-text-main">
                {benchmark.uncovered_gaps.map((item: string, index: number) => (
                  <p key={`${item}-${index}`}>{item}</p>
                ))}
              </div>
            </div>

            <div className="panel-soft px-5 py-5">
              <div className="eyebrow">Evidence Signals</div>
              <div className="mt-3 space-y-3 text-sm leading-6 text-text-main">
                {benchmark.evidence_signals.map((item: string, index: number) => (
                  <p key={`${item}-${index}`}>{item}</p>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="panel px-5 py-5 sm:px-6">
              <div className="eyebrow">Supported Frameworks</div>
              <div className="mt-4 space-y-4">
                {FRAMEWORKS.map((framework) => (
                  <div key={framework.id} className="rounded-[1.2rem] border border-edge bg-white/50 px-4 py-4">
                    <div className="font-semibold">{framework.name}</div>
                    <div className="mt-1 text-sm text-text-muted">{framework.note}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel px-5 py-5 sm:px-6">
              <div className="eyebrow">What This Adds</div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-text-main">
                <li>Framework-specific coverage scoring rather than general trust posture.</li>
                <li>Explicit evidence signals that support a conditional approval.</li>
                <li>Clear uncovered gaps that procurement can push back on quickly.</li>
              </ul>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
