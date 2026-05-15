'use client';

import { useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeApplication } from '@/app/lib/genlayer';
import { useGrantApplicationStore } from '@/store/store';

type ApplicationRecord = ReturnType<typeof normalizeApplication>;

function RecommendationSurface({ recommendation }: { recommendation: string }) {
  const color = recommendation.toLowerCase() === 'fund'
    ? 'text-success border-success/25 bg-success/10'
    : recommendation.toLowerCase() === 'conditional'
      ? 'text-warning border-warning/25 bg-warning/10'
      : 'text-danger border-danger/25 bg-danger/10';

  return <div className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] ${color}`}>{recommendation}</div>;
}

export default function AnalyzePanel() {
  const { account, walletType } = useWallet();
  const [applicantName, setApplicantName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [fundingRequest, setFundingRequest] = useState('');
  const [applicationMaterials, setApplicationMaterials] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');

  const handleReview = async () => {
    if (!applicantName.trim() || !projectTitle.trim() || !applicationMaterials.trim()) {
      setError('Add an applicant, project title, and application packet before opening review.');
      return;
    }

    if (!account?.address) {
      setError('Connect a wallet before writing an on-chain allocation review.');
      return;
    }

    setLoading(true);
    setStatus('Submitting application dossier to GenLayer...');
    setApplication(null);
    setTransactionHash('');
    setError('');

    try {
      const client = getGenlayerClient(account, walletType);
      const txHash = await client.writeContract({
        address: getContractAddress(),
        functionName: 'review_application',
        args: [applicantName.trim(), projectTitle.trim(), fundingRequest.trim(), applicationMaterials.trim()],
        value: 0n,
      });

      setTransactionHash(txHash);
      setStatus('Waiting for allocator consensus on release readiness...');

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        retries: 300,
        interval: 3000,
      });

      if (receipt.result !== 0 && receipt.result !== 6) {
        throw new Error(receipt.resultName || 'Application review failed during consensus');
      }

      setStatus('Loading finalized application review...');

      const applicationsResult = await client.readContract({
        address: getContractAddress(),
        functionName: 'get_user_applications',
        args: [account.address],
      });

      if (!Array.isArray(applicationsResult) || applicationsResult.length === 0) {
        throw new Error('Review completed, but no application result was returned.');
      }

      const latestApplication = normalizeApplication(applicationsResult[applicationsResult.length - 1]);
      useGrantApplicationStore.setState({
        viabilityScore: latestApplication.viability_score,
        recommendation: latestApplication.recommendation,
        thesis: latestApplication.thesis,
        riskFlags: latestApplication.risk_flags,
        strengths: latestApplication.strengths,
        diligenceQuestions: latestApplication.diligence_questions,
        milestoneConditions: latestApplication.milestone_conditions,
      });

      setApplication(latestApplication);
      setStatus('Review finalized');
      setApplicantName('');
      setProjectTitle('');
      setFundingRequest('');
      setApplicationMaterials('');
    } catch (caughtError) {
      console.error('Error reviewing application:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to review application');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="section-card">
          <div className="section-kicker">Intake Chamber</div>
          <h2 className="section-title">Open a Funding Review</h2>
          <p className="section-copy">
            Paste the raw application packet exactly as the committee received it. The network produces a
            viability score, a release recommendation, risk flags, diligence questions, and milestone conditions
            you can attach to any disbursement decision.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label className="field-label">Applicant</label>
              <input
                type="text"
                className="field"
                placeholder="Example: Riverlight Labs"
                value={applicantName}
                onChange={(event) => setApplicantName(event.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Project Title</label>
              <input
                type="text"
                className="field"
                placeholder="Example: Flood early-warning network for coastal schools"
                value={projectTitle}
                onChange={(event) => setProjectTitle(event.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Funding Request</label>
              <input
                type="text"
                className="field"
                placeholder="Example: $85,000 over 9 months with 3 milestone releases"
                value={fundingRequest}
                onChange={(event) => setFundingRequest(event.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Application Packet</label>
              <textarea
                rows={15}
                className="field resize-none"
                placeholder="Paste the proposal narrative, theory of change, budget notes, team background, delivery plan, reporting commitments, references, and any reviewer context here."
                value={applicationMaterials}
                onChange={(event) => setApplicationMaterials(event.target.value)}
              />
              <div className="mt-2 text-xs uppercase tracking-[0.2em] text-ink-dim">{applicationMaterials.length} characters</div>
            </div>
            <button
              onClick={handleReview}
              disabled={loading || !applicantName.trim() || !projectTitle.trim() || !applicationMaterials.trim()}
              className="primary-btn w-full sm:w-auto"
            >
              {loading ? status || 'Reviewing application...' : 'Run Allocation Review'}
            </button>
            {error && (
              <div className="error-banner">
                {error}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5">
          <div className="section-card">
            <div className="section-kicker">Expected Output</div>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-ink-main">
              <li>Viability score from 0 to 100 for release readiness.</li>
              <li>Recommendation: fund, conditional, or decline.</li>
              <li>Risk flags grouped by area and severity.</li>
              <li>Diligence questions for the committee’s next pass.</li>
              <li>Milestone conditions to attach to any capital release.</li>
            </ul>
          </div>
          <div className="section-card">
            <div className="section-kicker">Best Inputs</div>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-ink-main">
              <li>Plain-language proposal and beneficiary definition.</li>
              <li>Budget and release schedule with cost assumptions.</li>
              <li>Team credentials and operational delivery history.</li>
              <li>Evidence of traction, pilots, partnerships, or demand.</li>
            </ul>
          </div>
        </section>
      </div>

      {application && (
        <section className="space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
            <div className="section-card">
              <div className="section-kicker">Viability Score</div>
              <div className="mt-4 text-6xl font-semibold text-accent-cyan">{application.viability_score}</div>
              <div className="mt-5">
                <RecommendationSurface recommendation={application.recommendation} />
              </div>
              {transactionHash && (
                <div className="mt-5 text-xs text-ink-dim">
                  <div className="uppercase tracking-[0.18em]">Transaction</div>
                  <div className="mt-2 break-all font-mono">{transactionHash}</div>
                </div>
              )}
            </div>
            <div className="section-card">
              <div className="section-kicker">Allocation Thesis</div>
              <h3 className="mt-2 text-2xl font-semibold text-ink-bright">{application.project_title}</h3>
              <p className="mt-1 text-sm uppercase tracking-[0.24em] text-ink-dim">{application.applicant_name}</p>
              <p className="mt-2 text-sm text-accent-gold">{application.funding_request}</p>
              <p className="mt-5 text-sm leading-8 text-ink-main">{application.thesis}</p>
            </div>
          </div>

          {application.risk_flags.length > 0 && (
            <div className="section-card">
              <div className="section-kicker">Risk Flags</div>
              <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                {application.risk_flags.map((flag, index) => (
                  <article key={`${flag.area}-${index}`} className="record-card">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-lg font-semibold text-ink-bright">{flag.area}</h4>
                      <span className="signal-chip">{flag.severity}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-ink-main">{flag.rationale}</p>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="section-card">
              <div className="section-kicker">Strengths</div>
              <div className="mt-5 space-y-3 text-sm leading-7 text-ink-main">
                {application.strengths.map((item, index) => (
                  <p key={`${item}-${index}`}>{item}</p>
                ))}
              </div>
            </div>
            <div className="section-card">
              <div className="section-kicker">Diligence Questions</div>
              <div className="mt-5 space-y-3 text-sm leading-7 text-ink-main">
                {application.diligence_questions.map((item, index) => (
                  <p key={`${item}-${index}`}>{item}</p>
                ))}
              </div>
            </div>
            <div className="section-card">
              <div className="section-kicker">Milestone Conditions</div>
              <div className="mt-5 space-y-3 text-sm leading-7 text-ink-main">
                {application.milestone_conditions.map((item, index) => (
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
