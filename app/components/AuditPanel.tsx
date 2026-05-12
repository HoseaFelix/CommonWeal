'use client'
import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeActivityEntry } from '@/app/lib/genlayer';

type ActivityRecord = ReturnType<typeof normalizeActivityEntry>;

const ACTION_LABELS: Record<string, string> = {
  REVIEW_CREATED: 'Vendor review recorded',
  COMPARISON_CREATED: 'Vendor comparison recorded',
  BENCHMARK_CREATED: 'Framework benchmark recorded',
  REPORT_CREATED: 'Diligence report recorded',
};

export default function AuditPanel() {
  const { account, walletType } = useWallet();
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const loadActivity = async () => {
      if (!account?.address) {
        setActivity([]);
        return;
      }

      setLoading(true);
      try {
        const client = getGenlayerClient(account, walletType);
        const result = await client.readContract({
          address: getContractAddress(),
          functionName: 'get_user_activity',
          args: [account.address],
        });

        setActivity(Array.isArray(result) ? result.map((item) => normalizeActivityEntry(item)) : []);
      } catch (caughtError) {
        console.error('Failed to load activity log:', caughtError);
        setActivity([]);
      } finally {
        setLoading(false);
      }
    };

    void loadActivity();
  }, [account, walletType]);

  const actions = ['ALL', ...new Set(activity.map((entry) => entry.action))];
  const visibleEntries = filter === 'ALL' ? activity : activity.filter((entry) => entry.action === filter);

  return (
    <div className="space-y-5">
      <section className="panel px-5 py-5 sm:px-6">
        <div className="eyebrow">Permanent Activity</div>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-2xl">Decision Ledger</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              Every review, comparison, benchmark, and briefing is recorded with a durable activity entry.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action}
                onClick={() => setFilter(action)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  filter === action
                    ? 'bg-accent-primary text-[#fff8f1]'
                    : 'bg-white/60 text-text-muted hover:bg-white hover:text-text-main'
                }`}
              >
                {action === 'ALL' ? 'All activity' : ACTION_LABELS[action] || action}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-14">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-primary/30 border-t-accent-primary" />
        </div>
      ) : visibleEntries.length === 0 ? (
        <div className="panel px-6 py-12 text-center text-sm text-text-muted">
          No activity entries are available for this wallet yet.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleEntries.map((entry) => (
            <article key={entry.entry_id} className="panel-soft px-5 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold">{ACTION_LABELS[entry.action] || entry.action}</div>
                  <p className="mt-2 text-sm leading-6 text-text-main">{entry.details}</p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.18em] text-text-muted">
                  #{entry.timestamp}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-edge/70 pt-4 text-xs sm:grid-cols-3">
                <div>
                  <div className="text-text-muted">Resource</div>
                  <div className="mt-1 break-all font-mono text-text-main">{entry.resource_id}</div>
                </div>
                <div>
                  <div className="text-text-muted">Author</div>
                  <div className="mt-1 break-all font-mono text-text-main">{entry.author}</div>
                </div>
                <div>
                  <div className="text-text-muted">Action</div>
                  <div className="mt-1 text-text-main">{entry.action}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
