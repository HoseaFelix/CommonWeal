'use client'
import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeAnalysis } from '@/app/lib/genlayer';

export default function Dashboard() {
  const { account, walletType } = useWallet();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPolicies: 0,
    averageRisk: 0,
    highRiskCount: 0,
    criticalCount: 0,
  });

  useEffect(() => {
    const loadAnalyses = async () => {
      if (!account?.address) {
        setAnalyses([]);
        setStats({
          totalPolicies: 0,
          averageRisk: 0,
          highRiskCount: 0,
          criticalCount: 0,
        });
        return;
      }

      setAnalysesLoading(true);
      try {
        const client = getGenlayerClient(account, walletType);
        const analysesResult = await client.readContract({
          address: getContractAddress(),
          functionName: 'get_user_analyses',
          args: [account.address],
        });

        const normalized = Array.isArray(analysesResult)
          ? analysesResult.map((item) => normalizeAnalysis(item))
          : [];

        setAnalyses(normalized);

        if (normalized.length > 0) {
          const avgRisk = normalized.reduce((sum, analysis) => sum + Number(analysis.risk_score || 0), 0) / normalized.length;
          const high = normalized.filter((analysis) => analysis.risk_level.toLowerCase() === 'high').length;
          const critical = normalized.filter((analysis) => analysis.risk_level.toLowerCase() === 'critical').length;

          setStats({
            totalPolicies: normalized.length,
            averageRisk: Math.round(avgRisk),
            highRiskCount: high,
            criticalCount: critical,
          });
        } else {
          setStats({
            totalPolicies: 0,
            averageRisk: 0,
            highRiskCount: 0,
            criticalCount: 0,
          });
        }
      } catch (error) {
        console.error('Failed to load analyses:', error);
        setAnalyses([]);
      } finally {
        setAnalysesLoading(false);
      }
    };

    void loadAnalyses();
  }, [account, walletType]);

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-green-400 bg-green-500/10 border-green-500/30';
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-2">Total Policies</div>
          <div className="text-4xl font-bold text-accent-primary mb-1">{stats.totalPolicies}</div>
          <div className="text-xs text-text-muted">analyzed & stored</div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-2">Avg Risk Score</div>
          <div className="text-4xl font-bold text-accent-secondary mb-1">{stats.averageRisk}/100</div>
          <div className="text-xs text-text-muted">portfolio-wide</div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-2">High Risk</div>
          <div className="text-4xl font-bold text-orange-400 mb-1">{stats.highRiskCount}</div>
          <div className="text-xs text-text-muted">policies flagged</div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-2">Critical</div>
          <div className="text-4xl font-bold text-red-400 mb-1">{stats.criticalCount}</div>
          <div className="text-xs text-text-muted">require attention</div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-display mb-6">Recent Policy Analyses</h2>

        {analysesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent-primary border-r-2 border-accent-secondary"></div>
          </div>
        ) : analyses.length === 0 ? (
          <div className="p-8 rounded-2xl bg-card-dark/60 border border-card-border/50 text-center">
            <div className="text-text-muted">No policies analyzed yet. Start by analyzing your first policy.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.slice(0, 5).map((analysis, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-gradient-to-r from-card-dark/60 via-card-dark/40 to-bg-dark/40 border border-card-border/50 hover:border-card-border/80 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{analysis.policy_name || `Analysis #${analysis.analysis_id}`}</h3>
                    <p className="text-sm text-text-muted line-clamp-2">{analysis.summary}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg border text-sm font-medium ${getRiskColor(analysis.risk_level)}`}>
                    {analysis.risk_level}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-text-muted text-xs mb-1">Risk Score</div>
                    <div className="font-semibold text-accent-primary">{analysis.risk_score}/100</div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs mb-1">Risky Clauses</div>
                    <div className="font-semibold">{analysis.risky_clauses?.length || 0}</div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs mb-1">Flags</div>
                    <div className="font-semibold">{analysis.compliance_flags?.length || 0}</div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs mb-1">Recommendations</div>
                    <div className="font-semibold">{analysis.recommendations?.length || 0}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
