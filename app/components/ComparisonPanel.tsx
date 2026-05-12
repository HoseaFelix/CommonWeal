'use client'
import { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getContractAddress, getGenlayerClient, normalizeComparison, normalizeReview } from '@/app/lib/genlayer';

type ReviewRecord = ReturnType<typeof normalizeReview>;
type ComparisonRecord = ReturnType<typeof normalizeComparison>;

export default function ComparisonPanel() {
  const { account, walletType } = useWallet();
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [reviewA, setReviewA] = useState('');
  const [reviewB, setReviewB] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<(ComparisonRecord & { transactionHash: string; completedAt: string }) | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReviews = async () => {
      if (!account?.address) {
        setReviews([]);
        return;
      }

      try {
        const client = getGenlayerClient(account, walletType);
        const result = await client.readContract({
          address: getContractAddress(),
          functionName: 'get_user_reviews',
          args: [account.address],
        });

        setReviews(Array.isArray(result) ? result.map((item) => normalizeReview(item)) : []);
      } catch (caughtError) {
        console.error('Failed to load reviews for comparison:', caughtError);
        setReviews([]);
      }
    };

    void loadReviews();
  }, [account, walletType]);

  const handleCompare = async () => {
    if (!reviewA || !reviewB || reviewA === reviewB) {
      setError('Select two different vendor reviews to compare.');
      return;
    }

    if (!account?.address) {
      setError('Connect a wallet before comparing vendors.');
      return;
    }

    setLoading(true);
    setError('');
    setComparison(null);

    try {
      const client = getGenlayerClient(account, walletType);
      const txHash = await client.writeContract({
        address: getContractAddress(),
        functionName: 'compare_vendors',
        args: [reviewA, reviewB],
        value: 0n,
      });

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        retries: 300,
        interval: 3000,
      });

      if (receipt.result !== 0 && receipt.result !== 6) {
        throw new Error(receipt.resultName || 'Vendor comparison failed during consensus');
      }

      const comparisonsResult = await client.readContract({
        address: getContractAddress(),
        functionName: 'get_user_comparisons',
        args: [account.address],
      });

      if (!Array.isArray(comparisonsResult) || comparisonsResult.length === 0) {
        throw new Error('Comparison completed, but no comparison record was returned.');
      }

      const latestComparison = normalizeComparison(comparisonsResult[comparisonsResult.length - 1]);
      setComparison({
        ...latestComparison,
        transactionHash: txHash,
        completedAt: new Date().toLocaleString(),
      });
      setReviewA('');
      setReviewB('');
    } catch (caughtError) {
      console.error('Error comparing vendors:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to compare vendors');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="panel px-5 py-5 sm:px-6">
        <div className="eyebrow">Side-by-Side Review</div>
        <h2 className="mt-2 font-display text-2xl">Choose Between Vendors</h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Compare two completed vendor reviews to surface differentiation, repeated exposure patterns,
          and a concise recommendation for procurement, legal, or security leadership.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">Vendor Review A</label>
            <select value={reviewA} onChange={(event) => setReviewA(event.target.value)} className="field">
              <option value="">Select a reviewed vendor...</option>
              {reviews.map((review) => (
                <option key={review.review_id} value={review.review_id}>
                  {review.vendor_name} - {review.decision}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Vendor Review B</label>
            <select value={reviewB} onChange={(event) => setReviewB(event.target.value)} className="field">
              <option value="">Select another reviewed vendor...</option>
              {reviews.map((review) => (
                <option key={review.review_id} value={review.review_id}>
                  {review.vendor_name} - {review.decision}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || !reviewA || !reviewB}
          className="primary-btn mt-5 w-full sm:w-auto"
        >
          {loading ? 'Comparing vendors...' : 'Compare Vendors'}
        </button>

        {error && (
          <div className="mt-4 rounded-[1.2rem] border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {comparison && (
          <div className="mt-6 space-y-4">
            <div className="rounded-[1.5rem] border border-edge bg-white/55 px-5 py-5">
              <div className="eyebrow">Differentiation Score</div>
              <div className="mt-3 text-5xl font-black text-accent-secondary">{comparison.differentiation_score}</div>
              <p className="mt-4 text-sm leading-6 text-text-main">{comparison.recommendation}</p>
              <div className="mt-4 text-xs text-text-muted">
                <div>{comparison.completedAt}</div>
                <div className="mt-1 break-all font-mono">{comparison.transactionHash}</div>
              </div>
            </div>

            <div className="panel-soft px-5 py-5">
              <div className="eyebrow">Decision Rationale</div>
              <p className="mt-3 text-sm leading-7 text-text-main">{comparison.decision_rationale}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="panel-soft px-5 py-5">
                <div className="eyebrow">Standout Strengths</div>
                <div className="mt-3 space-y-3 text-sm leading-6 text-text-main">
                  {comparison.standout_strengths.map((item: string, index: number) => (
                    <p key={`${item}-${index}`}>{item}</p>
                  ))}
                </div>
              </div>
              <div className="panel-soft px-5 py-5">
                <div className="eyebrow">Shared Exposures</div>
                <div className="mt-3 space-y-3 text-sm leading-6 text-text-main">
                  {comparison.shared_exposures.map((item: string, index: number) => (
                    <p key={`${item}-${index}`}>{item}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="panel px-5 py-5 sm:px-6">
          <div className="eyebrow">Ideal Use Cases</div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-text-main">
            <li>Choosing between similar SaaS vendors with different trust profiles.</li>
            <li>Comparing the maturity of data processors before contract signature.</li>
            <li>Pressure-testing whether a lower-cost vendor introduces hidden risk.</li>
          </ul>
        </div>
        <div className="panel px-5 py-5 sm:px-6">
          <div className="eyebrow">What Comes Back</div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-text-main">
            <li>A differentiation score for how separated the two vendors are.</li>
            <li>Standout strengths that support a recommendation.</li>
            <li>Shared exposures that still need contract or evidence follow-up.</li>
            <li>A decision rationale that can go directly into approval notes.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
