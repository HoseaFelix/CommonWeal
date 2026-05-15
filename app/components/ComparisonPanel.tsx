'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeApplication, normalizeComparison } from '@/app/lib/genlayer';

type ApplicationRecord = ReturnType<typeof normalizeApplication>;
type ComparisonRecord = ReturnType<typeof normalizeComparison>;

export default function ComparisonPanel() {
  const { account, walletType } = useWallet();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [applicationA, setApplicationA] = useState('');
  const [applicationB, setApplicationB] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<(ComparisonRecord & { transactionHash: string; completedAt: string }) | null>(null);
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
        console.error('Failed to load applications for comparison:', caughtError);
        setApplications([]);
      }
    };

    void loadApplications();
  }, [account, walletType]);

  const handleCompare = async () => {
    if (!applicationA || !applicationB || applicationA === applicationB) {
      setError('Select two different applications to compare.');
      return;
    }

    if (!account?.address) {
      setError('Connect a wallet before comparing applications.');
      return;
    }

    setLoading(true);
    setError('');
    setComparison(null);

    try {
      const client = getGenlayerClient(account, walletType);
      const txHash = await client.writeContract({
        address: getContractAddress(),
        functionName: 'compare_applications',
        args: [applicationA, applicationB],
        value: 0n,
      });

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        retries: 300,
        interval: 3000,
      });

      if (receipt.result !== 0 && receipt.result !== 6) {
        throw new Error(receipt.resultName || 'Application comparison failed during consensus');
      }

      const comparisonsResult = await client.readContract({
        address: getContractAddress(),
        functionName: 'get_user_comparisons',
        args: [account.address],
      });

      if (!Array.isArray(comparisonsResult) || comparisonsResult.length === 0) {
        throw new Error('Comparison completed, but no comparison record was returned.');
      }

      const latestComparison = normalizeComparison(comparisonsResult[comparisonsResult.length - 1]);
      setComparison({
        ...latestComparison,
        transactionHash: txHash,
        completedAt: new Date().toLocaleString(),
      });
      setApplicationA('');
      setApplicationB('');
    } catch (caughtError) {
      console.error('Error comparing applications:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to compare applications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="section-card">
        <div className="section-kicker">Committee Matchup</div>
        <h2 className="section-title">Compare Two Applicants</h2>
        <p className="section-copy">
          Put two reviewed applications into the same room. The network returns separation, overlapping risks,
          and a concise allocation recommendation you can use for shortlist meetings.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="field-label">Application A</label>
            <select value={applicationA} onChange={(event) => setApplicationA(event.target.value)} className="field">
              <option value="">Select an application...</option>
              {applications.map((application) => (
                <option key={application.application_id} value={application.application_id}>
                  {application.project_title} - {application.recommendation}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Application B</label>
            <select value={applicationB} onChange={(event) => setApplicationB(event.target.value)} className="field">
              <option value="">Select another application...</option>
              {applications.map((application) => (
                <option key={application.application_id} value={application.application_id}>
                  {application.project_title} - {application.recommendation}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || !applicationA || !applicationB}
          className="primary-btn mt-6 w-full sm:w-auto"
        >
          {loading ? 'Comparing applicants...' : 'Run Matchup'}
        </button>

        {error && (
          <div className="error-banner mt-4">
            {error}
          </div>
        )}

        {comparison && (
          <div className="mt-7 space-y-4">
            <div className="record-card">
              <div className="section-kicker">Separation Score</div>
              <div className="mt-3 text-6xl font-semibold text-accent-gold">{comparison.separation_score}</div>
              <p className="mt-4 text-sm leading-7 text-ink-main">{comparison.allocation_recommendation}</p>
              <div className="mt-4 text-xs text-ink-dim">
                <div>{comparison.completedAt}</div>
                <div className="mt-1 break-all font-mono">{comparison.transactionHash}</div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-kicker">Committee Rationale</div>
              <p className="mt-3 text-sm leading-8 text-ink-main">{comparison.rationale}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="section-card">
                <div className="section-kicker">Unique Advantages</div>
                <div className="mt-4 space-y-3 text-sm leading-7 text-ink-main">
                  {comparison.unique_advantages.map((item: string, index: number) => (
                    <p key={`${item}-${index}`}>{item}</p>
                  ))}
                </div>
              </div>
              <div className="section-card">
                <div className="section-kicker">Overlapping Risks</div>
                <div className="mt-4 space-y-3 text-sm leading-7 text-ink-main">
                  {comparison.overlapping_risks.map((item: string, index: number) => (
                    <p key={`${item}-${index}`}>{item}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="section-card">
          <div className="section-kicker">Best Moments To Use This</div>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-ink-main">
            <li>Shortlisting two strong applicants with limited capital.</li>
            <li>Checking whether a lower-budget team hides execution risk.</li>
            <li>Distinguishing visionary narratives from delivery-ready plans.</li>
          </ul>
        </div>
        <div className="section-card">
          <div className="section-kicker">What Comes Back</div>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-ink-main">
            <li>A separation score for how meaningfully the applicants differ.</li>
            <li>Advantages that justify prioritizing one release over another.</li>
            <li>Overlapping risks the committee should still treat carefully.</li>
            <li>A rationale phrased like a usable shortlist note.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
