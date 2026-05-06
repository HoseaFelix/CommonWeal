'use client'

import { useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { useFeedbackStore } from '@/store/store';
import { getContractAddress, getGenlayerClient, normalizeAnalysis } from '@/app/lib/genlayer';

type AnalysisResult = {
  message: string;
  transactionHash: string;
  timestamp: string;
};

type AnalysisRecord = {
  analysis_id: string;
  policy_name?: string;
  policy_text: string;
  author: string;
  risk_score: number | string;
  risk_level: string;
  summary: string;
  risky_clauses: Array<{ clause?: string; risk?: string; reason?: string }>;
  plain_english: string[];
  compliance_flags: string[];
  recommendations: string[];
  timestamp: number | string;
};

export default function AnalyzePanel() {
  const { account, walletType } = useWallet();
  const [policyText, setPolicyText] = useState('');
  const [policyName, setPolicyName] = useState('');
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!policyText.trim()) {
      setError('Please paste a policy before running analysis');
      return;
    }

    if (!account) {
      setError('Please connect your wallet');
      return;
    }

    setAnalyzeLoading(true);
    setStatus('Submitting to GenLayer...');
    setError('');
    setResult(null);
    setAnalysis(null);

    try {
      const client = getGenlayerClient(account, walletType);
      const contractAddress = getContractAddress();

      const txHash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'analyze_policy',
        args: [policyText.trim(), policyName.trim()],
        value: 0n,
      });

      setStatus('Waiting for validator consensus...');

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        retries: 300,
        interval: 3000,
      });

      if (receipt.result !== 0 && receipt.result !== 6) {
        throw new Error(receipt.resultName || 'Transaction failed during consensus');
      }

      setStatus('Fetching finalized analysis...');

      const userAnalysesResult = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: 'get_user_analyses',
        args: [account.address],
      });

      if (!Array.isArray(userAnalysesResult) || userAnalysesResult.length === 0) {
        throw new Error('Analysis finalized, but no results were returned for this wallet');
      }

      const latestRaw = userAnalysesResult[userAnalysesResult.length - 1];
      const latestAnalysis = normalizeAnalysis(latestRaw);

      console.log('Raw user analyses result:', userAnalysesResult);
      console.log('Normalized latest analysis:', latestAnalysis);

      useFeedbackStore.setState({
        riskScore: Number(latestAnalysis.risk_score || 0),
        riskLevel: latestAnalysis.risk_level,
        summary: latestAnalysis.summary,
        riskyClauses: latestAnalysis.risky_clauses.map((item) => ({
          clause: item.clause || '',
          risk: item.risk || 'Medium',
          reason: item.reason || '',
        })),
        plainEnglish: latestAnalysis.plain_english,
        complianceFlags: latestAnalysis.compliance_flags,
        recommendations: latestAnalysis.recommendations,
      });

      setAnalysis(latestAnalysis);
      setStatus('Analysis finalized');
      setResult({
        message: 'Policy analysis completed successfully.',
        transactionHash: txHash,
        timestamp: new Date().toLocaleString(),
      });
      setPolicyText('');
      setPolicyName('');
    } catch (caughtError) {
      console.error('Error analyzing policy:', caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to analyze policy');
      setStatus('');
    } finally {
      setAnalyzeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display mb-2">Analyze Policy</h2>
        <p className="text-text-muted">Submit a policy for AI-powered risk analysis with validator consensus.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
            <label className="block text-sm font-semibold mb-3">Policy Name</label>
            <input
              type="text"
              placeholder="e.g., Privacy Policy 2024, Terms of Service"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-bg-dark border border-card-border/50 text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary/50 transition-all"
            />
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
            <label className="block text-sm font-semibold mb-3">Policy Text</label>
            <textarea
              placeholder="Paste your policy document here..."
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 rounded-lg bg-bg-dark border border-card-border/50 text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary/50 transition-all resize-none"
            />
            <div className="mt-2 text-xs text-text-muted">
              {policyText.length} characters | Max 50,000
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzeLoading || !policyText.trim()}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-primary to-accent-secondary text-bg-dark font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            {analyzeLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-bg-dark border-t-transparent"></div>
                {status || 'Analyzing with GenLayer Consensus...'}
              </span>
            ) : (
              'Analyze Policy'
            )}
          </button>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              Warning: {error}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-primary/20 via-accent-primary/10 to-bg-dark/40 border border-accent-primary/30">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>OK</span> What You Get
            </h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>Risk Score (0-100)</li>
              <li>Risk Level Classification</li>
              <li>Risky Clauses Identified</li>
              <li>Compliance Flags</li>
              <li>Plain English Summary</li>
              <li>Actionable Recommendations</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>Info</span> How It Works
            </h3>
            <ol className="space-y-2 text-sm text-text-muted">
              <li>1. Submit your policy</li>
              <li>2. GenLayer validators process it</li>
              <li>3. Consensus is reached</li>
              <li>4. The result is finalized on-chain</li>
              <li>5. You can inspect the transaction hash</li>
            </ol>
          </div>

          {result && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 via-green-500/10 to-bg-dark/40 border border-green-500/30">
              <h3 className="font-semibold mb-3 text-green-400">Success</h3>
              <p className="text-sm text-text-muted mb-2">{result.message}</p>
              <p className="text-xs text-text-muted break-all">{result.transactionHash}</p>
              <p className="text-xs text-text-muted/60 mt-2">{result.timestamp}</p>
            </div>
          )}
        </div>
      </div>

      {analysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-card-dark/80 to-bg-dark/40 border border-card-border/40">
              <div className="text-xs uppercase tracking-widest text-text-muted mb-2">Risk Score</div>
              <div className="text-4xl font-black text-accent-primary">{Math.round(Number(analysis.risk_score || 0))}</div>
              <div className="text-xs text-text-muted mt-3">Risk Level</div>
              <div className="text-sm font-semibold text-text-main">{analysis.risk_level}</div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-card-dark/70 to-bg-dark/30 border border-card-border/40">
              <div className="text-xs uppercase tracking-widest text-text-muted mb-2">Executive Summary</div>
              <p className="text-sm text-text-main leading-relaxed">{analysis.summary}</p>
            </div>
          </div>

          {analysis.risky_clauses.length > 0 && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
              <h3 className="text-lg font-semibold mb-4">Risky Clauses</h3>
              <div className="space-y-3">
                {analysis.risky_clauses.map((item, index) => (
                  <div key={`${item.clause}-${index}`} className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-widest text-text-muted">Clause {index + 1}</span>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/10 text-red-400 uppercase tracking-widest">{item.risk}</span>
                    </div>
                    <p className="text-sm text-text-main">{item.clause}</p>
                    {item.reason && <p className="text-xs text-text-muted mt-2">Reason: {item.reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
              <h3 className="text-lg font-semibold mb-4">Plain English</h3>
              <div className="space-y-2">
                {analysis.plain_english.map((item, index) => (
                  <p key={`${item}-${index}`} className="text-sm text-text-main">{item}</p>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
              <h3 className="text-lg font-semibold mb-4">Compliance Flags</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.compliance_flags.map((flag, index) => (
                  <span key={`${flag}-${index}`} className="text-[11px] px-3 py-1 rounded-full border border-card-border/60 bg-card-dark/60 text-text-main">
                    {flag}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-card-dark/80 via-card-dark to-bg-dark/40 border border-card-border/50">
              <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
              <div className="space-y-2">
                {analysis.recommendations.map((item, index) => (
                  <p key={`${item}-${index}`} className="text-sm text-text-main">{item}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
