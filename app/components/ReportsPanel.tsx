'use client'
import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeReport } from '@/app/lib/genlayer';

type ReportRecord = ReturnType<typeof normalizeReport>;

export default function ReportsPanel() {
  const { account, walletType } = useWallet();
  const [report, setReport] = useState<(ReportRecord & { transactionHash: string; completedAt: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setReport(null);
  }, [account?.address]);

  const handleGenerateReport = async () => {
    if (!account?.address) {
      setError('Connect a wallet before generating a briefing.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const client = getGenlayerClient(account, walletType);
      const txHash = await client.writeContract({
        address: getContractAddress(),
        functionName: 'generate_due_diligence_report',
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

      const activityResult = await client.readContract({
        address: getContractAddress(),
        functionName: 'get_user_activity',
        args: [account.address],
      });

      if (!Array.isArray(activityResult) || activityResult.length === 0) {
        throw new Error('Report completed, but no activity entries were returned.');
      }

      const reportEntry = [...activityResult].reverse().find((entry) => {
        const raw = entry instanceof Map ? Object.fromEntries(entry) : entry as Record<string, unknown>;
        return String(raw.action ?? raw[3] ?? '') === 'REPORT_CREATED';
      });

      if (!reportEntry) {
        throw new Error('Report completed, but no report entry was found.');
      }

      const rawEntry = reportEntry instanceof Map ? Object.fromEntries(reportEntry) : reportEntry as Record<string, unknown>;
      const reportId = String(rawEntry.resource_id ?? rawEntry[1] ?? '');

      const reportResult = await client.readContract({
        address: getContractAddress(),
        functionName: 'get_report',
        args: [reportId],
      });

      setReport({
        ...normalizeReport(reportResult),
        transactionHash: txHash,
        completedAt: new Date().toLocaleString(),
      });
    } catch (caughtError) {
      console.error('Error generating due diligence report:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to generate due diligence report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="panel px-5 py-5 sm:px-6">
        <div className="eyebrow">Board-Ready Summary</div>
        <h2 className="mt-2 font-display text-2xl">Generate a Diligence Briefing</h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Roll your reviewed vendors into one portfolio view with trust averages, escalation counts,
          conditional approvals, and the next actions your team should take.
        </p>

        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="primary-btn mt-6 w-full sm:w-auto"
        >
          {loading ? 'Generating briefing...' : 'Generate Briefing'}
        </button>

        {error && (
          <div className="mt-4 rounded-[1.2rem] border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!report && (
          <div className="mt-6 grid grid-cols-1 gap-4">
            <div className="panel-soft px-5 py-5">
              <div className="eyebrow">Included Signals</div>
              <p className="mt-3 text-sm leading-6 text-text-main">
                Total vendors reviewed, average trust, escalation pressure, conditional approvals,
                and a short list of actions distilled from your follow-up questions.
              </p>
            </div>
            <div className="panel-soft px-5 py-5">
              <div className="eyebrow">Typical Uses</div>
              <p className="mt-3 text-sm leading-6 text-text-main">
                Procurement sign-off notes, weekly risk meetings, approval memos, and shortlist discussions.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-5">
        {report && (
          <>
            <div className="panel px-5 py-5 sm:px-6">
              <div className="eyebrow">Portfolio Posture</div>
              <div className="mt-3 text-4xl font-black text-accent-primary">{report.portfolio_posture}</div>
              <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div>
                  <div className="text-sm text-text-muted">Vendors</div>
                  <div className="mt-1 text-2xl font-bold">{report.total_vendors}</div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Average Trust</div>
                  <div className="mt-1 text-2xl font-bold">{report.average_trust_score}</div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Escalated</div>
                  <div className="mt-1 text-2xl font-bold text-destructive">{report.escalated_count}</div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Conditional</div>
                  <div className="mt-1 text-2xl font-bold text-warning">{report.conditional_count}</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-text-muted">
                <div>{report.completedAt}</div>
                <div className="mt-1 break-all font-mono">{report.transactionHash}</div>
              </div>
            </div>

            <div className="panel-soft px-5 py-5">
              <div className="eyebrow">Key Actions</div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-text-main">
                {report.key_actions.map((item: string, index: number) => (
                  <p key={`${item}-${index}`}>{item}</p>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
