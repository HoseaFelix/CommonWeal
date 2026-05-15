'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeApplication, normalizeBenchmark } from '@/app/lib/genlayer';

type ApplicationRecord = ReturnType<typeof normalizeApplication>;
type BenchmarkRecord = ReturnType<typeof normalizeBenchmark>;

const RUBRICS = [
  { id: 'IMPACT', name: 'Public Impact', note: 'Outcome clarity, beneficiary value, durable change' },
  { id: 'FEASIBILITY', name: 'Feasibility', note: 'Delivery realism, team capacity, timeline discipline' },
  { id: 'TRANSPARENCY', name: 'Transparency', note: 'Budget traceability, governance, reporting accountability' },
  { id: 'EQUITY', name: 'Equity', note: 'Access, inclusion, fair distribution of benefit' },
];

export default function BenchmarkPanel() {
  const { account, walletType } = useWallet();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [selectedApplication, setSelectedApplication] = useState('');
  const [selectedRubric, setSelectedRubric] = useState('');
  const [benchmark, setBenchmark] = useState<(BenchmarkRecord & { transactionHash: string; completedAt: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadApplications = async () => {
      if (!account?.address) {
        setApplications([]);
        return;
      }

      try {
        const client = getGenlayerClient(account, walletType);
        const result = await client.readContract({
          address: getContractAddress(),
          functionName: 'get_user_applications',
          args: [account.address],
        });

        setApplications(Array.isArray(result) ? result.map((item) => normalizeApplication(item)) : []);
      } catch (caughtError) {
        console.error('Failed to load applications for rubric benchmark:', caughtError);
        setApplications([]);
      }
    };

    void loadApplications();
  }, [account, walletType]);

  const handleBenchmark = async () => {
    if (!selectedApplication || !selectedRubric) {
      setError('Choose an application and a rubric.');
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
        functionName: 'benchmark_application',
        args: [selectedApplication, selectedRubric],
        value: 0n,
      });

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        retries: 300,
        interval: 3000,
      });

      if (receipt.result !== 0 && receipt.result !== 6) {
        throw new Error(receipt.resultName || 'Rubric benchmark failed during consensus');
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
      setSelectedApplication('');
      setSelectedRubric('');
    } catch (caughtError) {
      console.error('Error benchmarking application:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to benchmark application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="section-card">
        <div className="section-kicker">Rubric Chamber</div>
        <h2 className="section-title">Benchmark Against Allocation Criteria</h2>
        <p className="section-copy">
          Test one application at a time against a funding rubric. This is where the committee can separate
          a strong story from a disbursement-ready plan.
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="field-label">Application</label>
            <select value={selectedApplication} onChange={(event) => setSelectedApplication(event.target.value)} className="field">
              <option value="">Select an application...</option>
              {applications.map((application) => (
                <option key={application.application_id} value={application.application_id}>
                  {application.project_title} - {application.recommendation}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Rubric</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {RUBRICS.map((rubric) => (
                <button
                  key={rubric.id}
                  onClick={() => setSelectedRubric(rubric.id)}
                  className={`rubric-card ${selectedRubric === rubric.id ? 'rubric-card-active' : ''}`}
                >
                  <div className="font-semibold text-ink-bright">{rubric.name}</div>
                  <div className="mt-1 text-sm text-ink-soft">{rubric.note}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleBenchmark}
            disabled={loading || !selectedApplication || !selectedRubric}
            className="primary-btn w-full sm:w-auto"
          >
            {loading ? 'Running rubric benchmark...' : 'Run Benchmark'}
          </button>

          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-5">
        {benchmark ? (
          <>
            <div className="section-card">
              <div className="section-kicker">Alignment Score</div>
              <div className="mt-3 text-6xl font-semibold text-accent-cyan">{benchmark.alignment_score}</div>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="metric-label">Diligence Priority</div>
                  <div className="metric-value">{benchmark.diligence_priority}</div>
                </div>
                <div>
                  <div className="metric-label">Release Posture</div>
                  <div className="metric-value">{benchmark.release_posture}</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-ink-dim">
                <div>{benchmark.completedAt}</div>
                <div className="mt-1 break-all font-mono">{benchmark.transactionHash}</div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-kicker">Uncovered Gaps</div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-ink-main">
                {benchmark.uncovered_gaps.map((item: string, index: number) => (
                  <p key={`${item}-${index}`}>{item}</p>
                ))}
              </div>
            </div>

            <div className="section-card">
              <div className="section-kicker">Evidence Signals</div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-ink-main">
                {benchmark.evidence_signals.map((item: string, index: number) => (
                  <p key={`${item}-${index}`}>{item}</p>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="section-card">
              <div className="section-kicker">Supported Rubrics</div>
              <div className="mt-4 space-y-4">
                {RUBRICS.map((rubric) => (
                  <div key={rubric.id} className="record-card">
                    <div className="font-semibold text-ink-bright">{rubric.name}</div>
                    <div className="mt-1 text-sm text-ink-soft">{rubric.note}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="section-card">
              <div className="section-kicker">What This Adds</div>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-ink-main">
                <li>Criterion-specific scoring rather than one blended recommendation.</li>
                <li>Visible missing evidence before the committee releases funds.</li>
                <li>Actionable conditions that can shape milestone-based grants.</li>
              </ul>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
