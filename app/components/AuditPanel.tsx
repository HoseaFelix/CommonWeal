'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeLedgerEntry } from '@/app/lib/genlayer';

type LedgerRecord = ReturnType<typeof normalizeLedgerEntry>;

const ACTION_LABELS: Record<string, string> = {
  APPLICATION_REVIEWED: 'Application reviewed',
  APPLICATIONS_COMPARED: 'Applicants compared',
  RUBRIC_BENCHMARKED: 'Rubric benchmark recorded',
  FUNDING_MEMO_CREATED: 'Funding memo generated',
};

export default function AuditPanel() {
  const { account, walletType } = useWallet();
  const [entries, setEntries] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const loadEntries = async () => {
      if (!account?.address) {
        setEntries([]);
        return;
      }

      setLoading(true);
      try {
        const client = getGenlayerClient(account, walletType);
        const result = await client.readContract({
          address: getContractAddress(),
          functionName: 'get_user_ledger_entries',
          args: [account.address],
        });

        setEntries(Array.isArray(result) ? result.map((item) => normalizeLedgerEntry(item)) : []);
      } catch (caughtError) {
        console.error('Failed to load ledger entries:', caughtError);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    void loadEntries();
  }, [account, walletType]);

  const actions = ['ALL', ...new Set(entries.map((entry) => entry.action))];
  const visibleEntries = filter === 'ALL' ? entries : entries.filter((entry) => entry.action === filter);

  return (
    <div className="space-y-5">
      <section className="section-card">
        <div className="section-kicker">Immutable Trail</div>
        <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="section-title">Council Ledger</h2>
            <p className="section-copy">
              Every review, matchup, benchmark, and memo is written into a durable operational record.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action}
                onClick={() => setFilter(action)}
                className={`filter-chip ${filter === action ? 'filter-chip-active' : ''}`}
              >
                {action === 'ALL' ? 'All entries' : ACTION_LABELS[action] || action}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="loader-ring" />
        </div>
      ) : visibleEntries.length === 0 ? (
        <div className="empty-state">No ledger entries are available for this wallet yet.</div>
      ) : (
        <div className="space-y-3">
          {visibleEntries.map((entry) => (
            <article key={entry.entry_id} className="record-card">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-gold">
                    {ACTION_LABELS[entry.action] || entry.action}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-ink-main">{entry.details}</p>
                </div>
                <div className="signal-chip">#{entry.timestamp}</div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 border-t border-white/10 pt-5 text-xs sm:grid-cols-3">
                <div>
                  <div className="metric-label">Resource</div>
                  <div className="mt-1 break-all font-mono text-ink-main">{entry.resource_id}</div>
                </div>
                <div>
                  <div className="metric-label">Author</div>
                  <div className="mt-1 break-all font-mono text-ink-main">{entry.author}</div>
                </div>
                <div>
                  <div className="metric-label">Action</div>
                  <div className="mt-1 text-ink-main">{entry.action}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
