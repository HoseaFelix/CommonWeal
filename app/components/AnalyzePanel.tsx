'use client'

import { useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeReview } from '@/app/lib/genlayer';
import { useVendorReviewStore } from '@/store/store';

type ReviewRecord = ReturnType<typeof normalizeReview>;

function DecisionSurface({ decision }: { decision: string }) {
  const color = decision.toLowerCase() === 'approve'
    ? 'text-success border-success/20 bg-success/10'
    : decision.toLowerCase() === 'conditional'
      ? 'text-warning border-warning/20 bg-warning/10'
      : 'text-destructive border-destructive/20 bg-destructive/10';

  return <div className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${color}`}>{decision}</div>;
}

export default function AnalyzePanel() {
  const { account, walletType } = useWallet();
  const [vendorName, setVendorName] = useState('');
  const [serviceScope, setServiceScope] = useState('');
  const [materials, setMaterials] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [review, setReview] = useState<ReviewRecord | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');

  const handleReview = async () => {
    if (!vendorName.trim() || !materials.trim()) {
      setError('Add a vendor name and source materials before starting review.');
      return;
    }

    if (!account?.address) {
      setError('Connect a wallet before writing a review on-chain.');
      return;
    }

    setLoading(true);
    setStatus('Submitting vendor dossier to GenLayer...');
    setReview(null);
    setTransactionHash('');
    setError('');

    try {
      const client = getGenlayerClient(account, walletType);
      const txHash = await client.writeContract({
        address: getContractAddress(),
        functionName: 'review_vendor',
        args: [vendorName.trim(), serviceScope.trim(), materials.trim()],
        value: 0n,
      });

      setTransactionHash(txHash);
      setStatus('Waiting for validator consensus on vendor posture...');

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        retries: 300,
        interval: 3000,
      });

      if (receipt.result !== 0 && receipt.result !== 6) {
        throw new Error(receipt.resultName || 'Vendor review failed during consensus');
      }

      setStatus('Loading finalized review...');

      const reviewsResult = await client.readContract({
        address: getContractAddress(),
        functionName: 'get_user_reviews',
        args: [account.address],
      });

      if (!Array.isArray(reviewsResult) || reviewsResult.length === 0) {
        throw new Error('Review completed, but no vendor review was returned.');
      }

      const latestReview = normalizeReview(reviewsResult[reviewsResult.length - 1]);
      useVendorReviewStore.setState({
        trustScore: latestReview.trust_score,
        decision: latestReview.decision,
        summary: latestReview.summary,
        criticalFindings: latestReview.critical_findings,
        strengths: latestReview.strengths,
        followUpQuestions: latestReview.follow_up_questions,
        recommendedControls: latestReview.recommended_controls,
      });

      setReview(latestReview);
      setStatus('Review finalized');
      setVendorName('');
      setServiceScope('');
      setMaterials('');
    } catch (caughtError) {
      console.error('Error reviewing vendor:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to review vendor');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel px-5 py-5 sm:px-6">
          <div className="eyebrow">Vendor Intake</div>
          <h2 className="mt-2 font-display text-2xl">Build a Vendor Dossier</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Combine trust center notes, DPA clauses, security answers, and procurement responses into
            one due diligence package. GenLayer validators return a trust score, a decision posture,
            critical findings, and the next questions your team should ask.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold">Vendor Name</label>
              <input
                type="text"
                className="field"
                placeholder="Example: Northwind Analytics"
                value={vendorName}
                onChange={(event) => setVendorName(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Service Scope</label>
              <input
                type="text"
                className="field"
                placeholder="Example: Customer data platform with subprocessors"
                value={serviceScope}
                onChange={(event) => setServiceScope(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Vendor Materials</label>
              <textarea
                rows={14}
                className="field resize-none"
                placeholder="Paste questionnaire answers, security summaries, privacy promises, insurance notes, DPA excerpts, trust center claims, and any procurement context here."
                value={materials}
                onChange={(event) => setMaterials(event.target.value)}
              />
              <div className="mt-2 text-xs text-text-muted">{materials.length} characters</div>
            </div>
            <button
              onClick={handleReview}
              disabled={loading || !vendorName.trim() || !materials.trim()}
              className="primary-btn w-full sm:w-auto"
            >
              {loading ? status || 'Reviewing vendor...' : 'Run Vendor Review'}
            </button>
            {error && (
              <div className="rounded-[1.2rem] border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5">
          <div className="panel px-5 py-5 sm:px-6">
            <div className="eyebrow">Expected Output</div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-text-main">
              <li>Trust score from 0 to 100 for procurement readiness.</li>
              <li>Decision posture: approve, conditional, or escalate.</li>
              <li>Critical findings grouped by risk area and severity.</li>
              <li>Follow-up questions for security, legal, or operations.</li>
              <li>Recommended controls or evidence to request next.</li>
            </ul>
          </div>
          <div className="panel px-5 py-5 sm:px-6">
            <div className="eyebrow">Best Inputs</div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-text-main">
              <li>Vendor security one-pager or trust center export.</li>
              <li>DPA excerpts, breach clauses, and retention language.</li>
              <li>Questionnaire responses from procurement or legal review.</li>
              <li>Service architecture notes or support commitments.</li>
            </ul>
          </div>
        </section>
      </div>

      {review && (
        <section className="space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
            <div className="panel px-5 py-5 sm:px-6">
              <div className="eyebrow">Trust Score</div>
              <div className="mt-3 text-5xl font-black text-accent-primary">{review.trust_score}</div>
              <div className="mt-4">
                <DecisionSurface decision={review.decision} />
              </div>
              {transactionHash && (
                <div className="mt-4 text-xs text-text-muted">
                  <div className="uppercase tracking-[0.2em]">Transaction</div>
                  <div className="mt-2 break-all font-mono">{transactionHash}</div>
                </div>
              )}
            </div>
            <div className="panel px-5 py-5 sm:px-6">
              <div className="eyebrow">Consensus Summary</div>
              <h3 className="mt-2 text-xl font-semibold">{review.vendor_name}</h3>
              <p className="mt-1 text-sm text-text-muted">{review.service_scope}</p>
              <p className="mt-4 text-sm leading-7 text-text-main">{review.summary}</p>
            </div>
          </div>

          {review.critical_findings.length > 0 && (
            <div className="panel px-5 py-5 sm:px-6">
              <div className="eyebrow">Critical Findings</div>
              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                {review.critical_findings.map((finding, index) => (
                  <article key={`${finding.area}-${index}`} className="rounded-[1.3rem] border border-edge bg-white/60 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold">{finding.area}</h4>
                      <span className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.18em] text-text-muted">
                        {finding.severity}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-text-main">{finding.rationale}</p>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="panel px-5 py-5 sm:px-6">
              <div className="eyebrow">Strengths</div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-text-main">
                {review.strengths.map((item, index) => (
                  <p key={`${item}-${index}`}>{item}</p>
                ))}
              </div>
            </div>
            <div className="panel px-5 py-5 sm:px-6">
              <div className="eyebrow">Follow-up Questions</div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-text-main">
                {review.follow_up_questions.map((item, index) => (
                  <p key={`${item}-${index}`}>{item}</p>
                ))}
              </div>
            </div>
            <div className="panel px-5 py-5 sm:px-6">
              <div className="eyebrow">Recommended Controls</div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-text-main">
                {review.recommended_controls.map((item, index) => (
                  <p key={`${item}-${index}`}>{item}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
