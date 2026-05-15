'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeMemo } from '@/app/lib/genlayer';

type MemoRecord = ReturnType<typeof normalizeMemo>;

export default function ReportsPanel() {
  const { account, walletType } = useWallet();
  const [memo, setMemo] = useState<(MemoRecord & { transactionHash: string; completedAt: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMemo(null);
  }, [account?.address]);

  const handleGenerateMemo = async () => {
    if (!account?.address) {
      setError('Connect a wallet before generating a funding memo.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const client = getGenlayerClient(account, walletType);
      const txHash = await client.writeContract({
        address: getContractAddress(),
        functionName: 'generate_funding_memo',
        args: [],
        value: 0n,
      });

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        retries: 300,
        interval: 3000,
      });

      if (receipt.result !== 0 && receipt.result !== 6) {
        throw new Error(receipt.resultName || 'Funding memo failed during consensus');
      }

      const ledgerResult = await client.readContract({
        address: getContractAddress(),
        functionName: 'get_user_ledger_entries',
        args: [account.address],
      });

      if (!Array.isArray(ledgerResult) || ledgerResult.length === 0) {
        throw new Error('Memo completed, but no ledger entries were returned.');
      }

      const memoEntry = [...ledgerResult].reverse().find((entry) => {
        const raw = entry instanceof Map ? Object.fromEntries(entry) : entry as Record<string, unknown>;
        return String(raw.action ?? raw[3] ?? '') === 'FUNDING_MEMO_CREATED';
      });

      if (!memoEntry) {
        throw new Error('Memo completed, but no memo entry was found.');
      }

      const rawEntry = memoEntry instanceof Map ? Object.fromEntries(memoEntry) : memoEntry as Record<string, unknown>;
      const memoId = String(rawEntry.resource_id ?? rawEntry[1] ?? '');

      const memoResult = await client.readContract({
        address: getContractAddress(),
        functionName: 'get_memo',
        args: [memoId],
      });

      setMemo({
        ...normalizeMemo(memoResult),
        transactionHash: txHash,
        completedAt: new Date().toLocaleString(),
      });
    } catch (caughtError) {
      console.error('Error generating funding memo:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to generate funding memo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="section-card">
        <div className="section-kicker">Committee Prep</div>
        <h2 className="section-title">Generate a Funding Memo</h2>
        <p className="section-copy">
          Roll the docket into one capital allocation view with viability averages, decline pressure,
          conditional releases, and the next diligence moves the committee should make.
        </p>

        <button
          onClick={handleGenerateMemo}
          disabled={loading}
          className="primary-btn mt-7 w-full sm:w-auto"
        >
          {loading ? 'Generating memo...' : 'Generate Memo'}
        </button>

        {error && (
          <div className="error-banner mt-4">
            {error}
          </div>
        )}

        {!memo && (
          <div className="mt-7 grid grid-cols-1 gap-4">
            <div className="section-card alt-card">
              <div className="section-kicker">Included Signals</div>
              <p className="mt-3 text-sm leading-7 text-ink-main">
                Total applications, average viability, release caution, and a short action list distilled
                from the questions your reviewers keep asking.
              </p>
            </div>
            <div className="section-card alt-card">
              <div className="section-kicker">Typical Uses</div>
              <p className="mt-3 text-sm leading-7 text-ink-main">
                Allocation committee syncs, capital release notes, shortlist meetings, and milestone planning.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-5">
        {memo && (
          <>
            <div className="section-card">
              <div className="section-kicker">Portfolio Signal</div>
              <div className="mt-3 text-5xl font-semibold text-accent-gold">{memo.portfolio_signal}</div>
              <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
                <div>
                  <div className="metric-label">Applications</div>
                  <div className="metric-value">{memo.total_applications}</div>
                </div>
                <div>
                  <div className="metric-label">Avg Viability</div>
                  <div className="metric-value">{memo.average_viability_score}</div>
                </div>
                <div>
                  <div className="metric-label">Declines</div>
                  <div className="metric-value text-danger">{memo.decline_count}</div>
                </div>
                <div>
                  <div className="metric-label">Conditional</div>
                  <div className="metric-value text-warning">{memo.conditional_count}</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-ink-dim">
                <div>{memo.completedAt}</div>
                <div className="mt-1 break-all font-mono">{memo.transactionHash}</div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-kicker">Key Actions</div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-ink-main">
                {memo.key_actions.map((item: string, index: number) => (
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
