'use client'
import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeReport } from '@/app/lib/genlayer';

export default function ReportsPanel() {
  const { account, walletType } = useWallet();
  const [report, setReport] = useState<any>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setReport(null);
  }, [account?.address]);

  const handleGenerateReport = async () => {
    if (!account?.address) {
      setError('Please connect your wallet');
      return;
    }

    setGenerateLoading(true);
    setError('');

    try {
      const client = getGenlayerClient(account, walletType);
      const txHash = await client.writeContract({
        address: getContractAddress(),
        functionName: 'generate_compliance_report',
        args: [],
        value: 0n,
      });

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        retries: 300,
        interval: 3000,
      });

      if (receipt.result !== 0 && receipt.result !== 6) {
        throw new Error(receipt.resultName || 'Report generation failed during consensus');
      }

      const auditResult = await client.readContract({
        address: getContractAddress(),
        functionName: 'get_user_audit_trail',
        args: [account.address],
      });

      if (!Array.isArray(auditResult) || auditResult.length === 0) {
        throw new Error('Report finalized, but no audit trail entries were returned');
      }

      const reportAuditEntry = [...auditResult].reverse().find((entry) => {
        const raw = entry instanceof Map ? Object.fromEntries(entry) : entry as Record<string, unknown>;
        return String(raw.action ?? raw[3] ?? '') === 'REPORT_GENERATED';
      });

      if (!reportAuditEntry) {
        throw new Error('Report finalized, but no report audit entry was found');
      }

      const rawAudit = reportAuditEntry instanceof Map
        ? Object.fromEntries(reportAuditEntry)
        : reportAuditEntry as Record<string, unknown>;

      const reportId = String(rawAudit.policy_id ?? rawAudit[1] ?? '');
      if (!reportId) {
        throw new Error('Report finalized, but report ID could not be determined');
      }

      const reportResult = await client.readContract({
        address: getContractAddress(),
        functionName: 'get_report',
        args: [reportId],
      });

      const normalizedReport = normalizeReport(reportResult);

      setReport({
        message: 'Compliance report generated successfully!',
        transactionHash: txHash,
        completedAt: new Date().toLocaleString(),
        ...normalizedReport,
      });
    } catch (caughtError) {
      console.error('Error generating report:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to generate report');
    } finally {
      setGenerateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display mb-2">Compliance Reports</h2>
        <p className="text-text-muted">Generate aggregated compliance reports across all your policies.</p>
      </div>

      <button
        onClick={handleGenerateReport}
        disabled={generateLoading}
        className="px-8 py-3 rounded-lg bg-gradient-to-r from-accent-primary to-accent-secondary text-bg-dark font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
      >
        {generateLoading ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-bg-dark border-t-transparent"></div>
            Generating Report...
          </span>
        ) : (
          'Generate Report'
        )}
      </button>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          Warning: {error}
        </div>
      )}

      {report ? (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 via-green-500/10 to-bg-dark/40 border border-green-500/30">
            <h3 className="font-semibold mb-3 text-green-400">Report Created</h3>
            <p className="text-sm text-text-muted mb-2">{report.message}</p>
            <p className="text-xs text-text-muted break-all">{report.transactionHash}</p>
            <p className="text-xs text-text-muted/60 mt-2">{report.completedAt}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
              <div className="text-xs text-text-muted uppercase tracking-widest mb-2">Compliance Status</div>
              <div className="text-2xl font-bold text-accent-primary">{report.compliance_status}</div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
              <div className="text-xs text-text-muted uppercase tracking-widest mb-2">Report ID</div>
              <div className="text-sm font-mono text-text-main break-all">{report.report_id}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-card-dark/60 border border-card-border/50">
              <div className="text-xs text-text-muted uppercase tracking-widest mb-2">Total Policies</div>
              <div className="text-3xl font-bold text-accent-primary">{report.total_policies}</div>
            </div>
            <div className="p-6 rounded-2xl bg-card-dark/60 border border-card-border/50">
              <div className="text-xs text-text-muted uppercase tracking-widest mb-2">Avg Risk</div>
              <div className="text-3xl font-bold text-accent-secondary">{report.average_risk_score}/100</div>
            </div>
            <div className="p-6 rounded-2xl bg-card-dark/60 border border-card-border/50">
              <div className="text-xs text-text-muted uppercase tracking-widest mb-2">High Risk</div>
              <div className="text-3xl font-bold text-orange-400">{report.high_risk_count}</div>
            </div>
            <div className="p-6 rounded-2xl bg-card-dark/60 border border-card-border/50">
              <div className="text-xs text-text-muted uppercase tracking-widest mb-2">Critical</div>
              <div className="text-3xl font-bold text-red-400">{report.critical_risk_count}</div>
            </div>
          </div>

          {report.key_recommendations?.length > 0 && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
              <h3 className="font-semibold mb-4">Key Recommendations</h3>
              <div className="space-y-2">
                {report.key_recommendations.map((item: string, index: number) => (
                  <p key={`${item}-${index}`} className="text-sm text-text-main">{item}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-6 rounded-2xl bg-card-dark/60 border border-card-border/50">
            <h3 className="font-semibold mb-3">Aggregation</h3>
            <p className="text-sm text-text-muted">Combines data from all your analyzed policies</p>
          </div>
          <div className="p-6 rounded-2xl bg-card-dark/60 border border-card-border/50">
            <h3 className="font-semibold mb-3">Analysis</h3>
            <p className="text-sm text-text-muted">Calculates risk profiles and compliance status</p>
          </div>
          <div className="p-6 rounded-2xl bg-card-dark/60 border border-card-border/50">
            <h3 className="font-semibold mb-3">On-Chain</h3>
            <p className="text-sm text-text-muted">Permanently stored on the blockchain</p>
          </div>
        </div>
      )}
    </div>
  );
}
