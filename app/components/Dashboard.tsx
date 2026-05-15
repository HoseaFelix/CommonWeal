'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeApplication } from '@/app/lib/genlayer';

type ApplicationRecord = ReturnType<typeof normalizeApplication>;

function RecommendationTone(recommendation: string) {
  switch (recommendation.toLowerCase()) {
    case 'fund':
      return 'text-success';
    case 'conditional':
      return 'text-warning';
    default:
      return 'text-danger';
  }
}

export default function Dashboard() {
  const { account, walletType } = useWallet();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalApplications: 0,
    averageViability: 0,
    declineCount: 0,
    conditionalCount: 0,
  });

  useEffect(() => {
    const loadApplications = async () => {
      if (!account?.address) {
        setApplications([]);
        setStats({ totalApplications: 0, averageViability: 0, declineCount: 0, conditionalCount: 0 });
        return;
      }

      setLoading(true);
      try {
        const client = getGenlayerClient(account, walletType);
        const result = await client.readContract({
          address: getContractAddress(),
          functionName: 'get_user_applications',
          args: [account.address],
        });

        const normalized = Array.isArray(result) ? result.map((item) => normalizeApplication(item)) : [];
        setApplications(normalized);

        const averageViability = normalized.length > 0
          ? Math.round(normalized.reduce((sum, application) => sum + Number(application.viability_score || 0), 0) / normalized.length)
          : 0;

        setStats({
          totalApplications: normalized.length,
          averageViability,
          declineCount: normalized.filter((application) => application.recommendation.toLowerCase() === 'decline').length,
          conditionalCount: normalized.filter((application) => application.recommendation.toLowerCase() === 'conditional').length,
        });
      } catch (error) {
        console.error('Failed to load applications:', error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    void loadApplications();
  }, [account, walletType]);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="stat-card">
          <div className="stat-label">Docket</div>
          <div className="stat-value text-accent-cyan">{stats.totalApplications}</div>
          <p className="stat-note">Applications tracked in this council workspace.</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Mean Viability</div>
          <div className="stat-value text-accent-gold">{stats.averageViability}</div>
          <p className="stat-note">Consensus-weighted score across your current slate.</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Declines</div>
          <div className="stat-value text-danger">{stats.declineCount}</div>
          <p className="stat-note">Applications that need to stay off the release track.</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Conditional</div>
          <div className="stat-value text-warning">{stats.conditionalCount}</div>
          <p className="stat-note">Projects that need milestones before disbursement.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="section-card">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="section-kicker">Recent Signals</div>
              <h2 className="section-title">Allocation Docket</h2>
            </div>
            <div className="signal-chip">latest 5</div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="loader-ring" />
            </div>
          ) : applications.length === 0 ? (
            <div className="empty-state mt-6">
              No grant applications yet. Start with a proposal narrative, budget notes, team background, or impact plan.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {applications.slice(0, 5).map((application) => (
                <article key={application.application_id} className="record-card">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold text-ink-bright">{application.project_title}</h3>
                      <p className="mt-1 text-sm uppercase tracking-[0.24em] text-ink-dim">{application.applicant_name}</p>
                      <p className="mt-2 text-sm text-ink-soft">{application.funding_request}</p>
                    </div>
                    <div className={`status-pill ${RecommendationTone(application.recommendation)}`}>
                      {application.recommendation}
                    </div>
                  </div>

                  <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-main">{application.thesis}</p>

                  <div className="mt-5 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                      <div className="metric-label">Viability</div>
                      <div className="metric-value text-accent-cyan">{application.viability_score}/100</div>
                    </div>
                    <div>
                      <div className="metric-label">Risk Flags</div>
                      <div className="metric-value">{application.risk_flags.length}</div>
                    </div>
                    <div>
                      <div className="metric-label">Questions</div>
                      <div className="metric-value">{application.diligence_questions.length}</div>
                    </div>
                    <div>
                      <div className="metric-label">Milestones</div>
                      <div className="metric-value">{application.milestone_conditions.length}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="section-card">
            <div className="section-kicker">What This Council Tracks</div>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-ink-main">
              <li>Application quality, feasibility, and disbursement readiness.</li>
              <li>Visible execution risk before capital leaves the treasury.</li>
              <li>Rubric-aligned scoring for impact, transparency, and equity.</li>
              <li>Portfolio memos that read like committee prep, not raw logs.</li>
            </ul>
          </div>
          <div className="section-card">
            <div className="section-kicker">Good Source Material</div>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-ink-main">
              <li>Application narratives, milestone plans, and budget breakdowns.</li>
              <li>Founder or team bios, prior delivery record, and references.</li>
              <li>Evidence of beneficiary demand, letters, pilots, or traction.</li>
              <li>Governance notes, reporting commitments, and release schedule.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
