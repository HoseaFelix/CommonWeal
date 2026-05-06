'use client'
import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeAuditEntry } from '@/app/lib/genlayer';

export default function AuditPanel() {
  const { account, walletType } = useWallet();
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const loadAudit = async () => {
      if (!account?.address) {
        setAuditTrail([]);
        return;
      }

      setAuditLoading(true);
      try {
        const client = getGenlayerClient(account, walletType);
        const result = await client.readContract({
          address: getContractAddress(),
          functionName: 'get_user_audit_trail',
          args: [account.address],
        });

        setAuditTrail(Array.isArray(result) ? result.map((item) => normalizeAuditEntry(item)) : []);
      } catch (caughtError) {
        console.error('Failed to load audit trail:', caughtError);
        setAuditTrail([]);
      } finally {
        setAuditLoading(false);
      }
    };

    void loadAudit();
  }, [account, walletType]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ANALYSIS_CREATED':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'COMPARISON_CREATED':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      case 'BENCHMARK_CREATED':
        return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
      case 'REPORT_GENERATED':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      ANALYSIS_CREATED: 'Policy Analyzed',
      COMPARISON_CREATED: 'Policies Compared',
      BENCHMARK_CREATED: 'Benchmark Run',
      REPORT_GENERATED: 'Report Generated',
    };
    return labels[action] || action;
  };

  const filteredAudit = filter === 'ALL'
    ? auditTrail
    : auditTrail.filter((item) => item.action === filter);

  const actions = ['ALL', ...new Set(auditTrail.map((item) => item.action))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display mb-2">Audit Trail</h2>
        <p className="text-text-muted">Complete activity log of all compliance operations performed by your workspace.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action}
            onClick={() => setFilter(action)}
            className={`px-4 py-2 rounded-lg border transition-all text-sm ${
              filter === action
                ? 'bg-accent-primary/20 border-accent-primary text-accent-primary'
                : 'bg-card-dark/60 border-card-border/50 text-text-muted hover:border-card-border'
            }`}
          >
            {action}
          </button>
        ))}
      </div>

      {auditLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent-primary border-r-2 border-accent-secondary"></div>
        </div>
      ) : filteredAudit.length === 0 ? (
        <div className="p-8 rounded-2xl bg-card-dark/60 border border-card-border/50 text-center">
          <div className="text-text-muted">No audit entries found</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAudit.map((entry, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-gradient-to-r from-card-dark/60 via-card-dark/40 to-bg-dark/40 border border-card-border/50 hover:border-card-border/80 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border mb-3 font-medium text-sm ${getActionColor(entry.action)}`}>
                    {getActionLabel(entry.action)}
                  </div>
                  <p className="text-sm text-text-muted">{entry.change_details}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-3 border-t border-card-border/30">
                <div>
                  <div className="text-text-muted mb-1">Resource ID</div>
                  <div className="font-mono text-text-main break-all">{entry.policy_id}</div>
                </div>
                <div>
                  <div className="text-text-muted mb-1">Author</div>
                  <div className="font-mono text-text-main truncate">{entry.author}</div>
                </div>
                <div>
                  <div className="text-text-muted mb-1">Timestamp</div>
                  <div className="font-mono text-text-main">#{entry.timestamp}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
