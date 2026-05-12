'use client'
import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeReview } from '@/app/lib/genlayer';

type ReviewRecord = ReturnType<typeof normalizeReview>;

function DecisionTone(decision: string) {
  switch (decision.toLowerCase()) {
    case 'approve':
      return 'text-success';
    case 'conditional':
      return 'text-warning';
    default:
      return 'text-destructive';
  }
}

export default function Dashboard() {
  const { account, walletType } = useWallet();
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalVendors: 0,
    averageTrust: 0,
    escalatedCount: 0,
    conditionalCount: 0,
  });

  useEffect(() => {
    const loadReviews = async () => {
      if (!account?.address) {
        setReviews([]);
        setStats({ totalVendors: 0, averageTrust: 0, escalatedCount: 0, conditionalCount: 0 });
        return;
      }

      setLoading(true);
      try {
        const client = getGenlayerClient(account, walletType);
        const result = await client.readContract({
          address: getContractAddress(),
          functionName: 'get_user_reviews',
          args: [account.address],
        });

        const normalized = Array.isArray(result) ? result.map((item) => normalizeReview(item)) : [];
        setReviews(normalized);

        const averageTrust = normalized.length > 0
          ? Math.round(normalized.reduce((sum, review) => sum + Number(review.trust_score || 0), 0) / normalized.length)
          : 0;

        setStats({
          totalVendors: normalized.length,
          averageTrust,
          escalatedCount: normalized.filter((review) => review.decision.toLowerCase() === 'escalate').length,
          conditionalCount: normalized.filter((review) => review.decision.toLowerCase() === 'conditional').length,
        });
      } catch (error) {
        console.error('Failed to load vendor reviews:', error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    void loadReviews();
  }, [account, walletType]);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="panel px-5 py-5">
          <div className="eyebrow">Vendor Dossiers</div>
          <div className="mt-4 text-4xl font-bold text-accent-primary">{stats.totalVendors}</div>
          <p className="mt-2 text-sm text-text-muted">Active vendor reviews recorded for this wallet.</p>
        </div>
        <div className="panel px-5 py-5">
          <div className="eyebrow">Average Trust</div>
          <div className="mt-4 text-4xl font-bold text-accent-secondary">{stats.averageTrust}</div>
          <p className="mt-2 text-sm text-text-muted">Consensus score across your reviewed providers.</p>
        </div>
        <div className="panel px-5 py-5">
          <div className="eyebrow">Escalations</div>
          <div className="mt-4 text-4xl font-bold text-destructive">{stats.escalatedCount}</div>
          <p className="mt-2 text-sm text-text-muted">Vendors that need deeper legal or security review.</p>
        </div>
        <div className="panel px-5 py-5">
          <div className="eyebrow">Conditional</div>
          <div className="mt-4 text-4xl font-bold text-warning">{stats.conditionalCount}</div>
          <p className="mt-2 text-sm text-text-muted">Approvals that depend on remediation or evidence.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel px-5 py-5 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="eyebrow">Recent Reviews</div>
              <h2 className="mt-2 font-display text-2xl">Vendor Readiness Ledger</h2>
            </div>
            <div className="rounded-full border border-edge/80 px-3 py-1 text-xs uppercase tracking-[0.22em] text-text-muted">
              Last 5 entries
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-14">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-primary/30 border-t-accent-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="mt-5 rounded-[1.4rem] border border-dashed border-edge bg-white/40 px-6 py-12 text-center text-sm text-text-muted">
              No vendor dossiers yet. Start with a security packet, DPA, or questionnaire response.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {reviews.slice(0, 5).map((review) => (
                <article key={review.review_id} className="rounded-[1.4rem] border border-edge bg-white/55 px-5 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold">{review.vendor_name}</h3>
                      <p className="mt-1 text-sm text-text-muted">{review.service_scope}</p>
                    </div>
                    <div className={`rounded-full border border-current/20 px-3 py-1 text-sm font-semibold ${DecisionTone(review.decision)}`}>
                      {review.decision}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-text-main">{review.summary}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <div className="text-text-muted">Trust Score</div>
                      <div className="mt-1 font-semibold text-accent-primary">{review.trust_score}/100</div>
                    </div>
                    <div>
                      <div className="text-text-muted">Findings</div>
                      <div className="mt-1 font-semibold">{review.critical_findings.length}</div>
                    </div>
                    <div>
                      <div className="text-text-muted">Questions</div>
                      <div className="mt-1 font-semibold">{review.follow_up_questions.length}</div>
                    </div>
                    <div>
                      <div className="text-text-muted">Controls</div>
                      <div className="mt-1 font-semibold">{review.recommended_controls.length}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="panel px-5 py-5 sm:px-6">
            <div className="eyebrow">What This Workspace Tracks</div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-text-main">
              <li>Consensus review of vendor security and legal materials.</li>
              <li>Decision posture for procurement intake and escalation.</li>
              <li>Framework-specific readiness against trust requirements.</li>
              <li>Portfolio summaries you can turn into approval notes.</li>
            </ul>
          </div>
          <div className="panel px-5 py-5 sm:px-6">
            <div className="eyebrow">Good Starting Inputs</div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-text-main">
              <li>Security overviews and trust center exports.</li>
              <li>DPA, privacy notice, and incident response statements.</li>
              <li>Business continuity descriptions or procurement questionnaires.</li>
              <li>Any commitments the vendor made during sales review.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
