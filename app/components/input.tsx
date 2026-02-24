"use client";
import { useErrorStore, useFeedbackStore } from "@/store/store";
import { GENLAYER_CONFIG, POLICY_METHODS, POLICY_CONFIG } from "@/constants/genlayer_config";
import { useWallet } from "@/app/context/WalletContext";
import React, { useState } from "react";
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { privateKeyToAccount } from 'viem/accounts';

const Input = () => {
  const [policyText, setPolicyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const { account, walletType } = useWallet();

  const getClient = async () => {
    if (!account) throw new Error("Wallet not connected");

    let client;
    
    if (walletType === 'auto') {
      if (!account.privateKey) throw new Error("Private key not available");
      const viemAccount = privateKeyToAccount(
        (account.privateKey.startsWith('0x') ? account.privateKey : `0x${account.privateKey}`) as `0x${string}`
      );
      client = createClient({
        chain: studionet,
        account: viemAccount,
      });
    } else if (walletType === 'metamask') {
      client = createClient({
        chain: studionet,
        account: account.address as `0x${string}`,
      });
    }
    
    return client;
  };

  const analyzePolicy = async (policy: string) => {
    try {
      const client = await getClient();
      if (!client) throw new Error("Client initialization failed");

      setStatus("Submitting to GenLayer...");
      
      const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || GENLAYER_CONFIG.CONTRACT_ADDRESS;
      if (!address) {
        throw new Error("Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
      }
      
      const txHash = await client.writeContract({
        address: address as `0x${string}`,
        functionName: POLICY_METHODS.ANALYZE_POLICY,
        args: [policy],
        value: 0n,
      });

      console.log("Transaction submitted:", txHash);
      setStatus("Processing risk assessment (this may take 30-60 seconds)...");
      
      let receipt;
      try {
        receipt = await client.waitForTransactionReceipt({
          hash: txHash,
          retries: 300,
          interval: 3000,
        });
      } catch (waitError) {
        console.error("Wait error:", waitError);
        throw new Error(`Transaction did not finalize within expected time. Hash: ${txHash}`);
      }

      console.log("Transaction finalized!");
      
      if (receipt.result !== 0 && receipt.result !== 6) {
        console.error("Transaction failed:", receipt.result, receipt.resultName);
        throw new Error(`Transaction failed: ${receipt.resultName || 'Unknown error'}`);
      }

      setStatus("Fetching analysis results...");

      // Get the latest analysis ID
      const latestAnalysisId = await client.readContract({
        address: address as `0x${string}`,
        functionName: POLICY_METHODS.GET_LATEST_ANALYSIS_ID,
        args: [],
      }) as string;
      
      if (!latestAnalysisId || latestAnalysisId === '') {
        throw new Error('No analysis ID returned');
      }

      console.log("Latest analysis ID:", latestAnalysisId);

      // Fetch the analysis result
      const analysisResult = await client.readContract({
        address: address as `0x${string}`,
        functionName: POLICY_METHODS.GET_ANALYSIS,
        args: [latestAnalysisId],
      }) as Record<string, unknown>;

      console.log("Analysis result (raw):", analysisResult);
      console.log("Analysis result type:", typeof analysisResult);
      console.log("Is Map?:", analysisResult instanceof Map);

      // Convert Map to object if needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any = analysisResult;
      if (analysisResult instanceof Map) {
        result = Object.fromEntries(analysisResult);
      }

      console.log("Analysis result (converted):", result);

      // Extract values with fallbacks
      const riskScore = Number(result.risk_score ?? result.riskScore ?? 0);
      const riskLevel = String(result.risk_level ?? result.riskLevel ?? "Unknown");
      const summary = String(result.summary ?? result.overview ?? "");

      const riskyClausesRaw = result.risky_clauses ?? result.riskyClauses ?? [];
      const riskyClauses = Array.isArray(riskyClausesRaw)
        ? riskyClausesRaw.map((item: unknown) => {
            if (typeof item === "string") {
              return { clause: item, risk: "Medium", reason: "" };
            }
            if (item && typeof item === "object") {
              const record = item as Record<string, unknown>;
              return {
                clause: String(record.clause ?? record.text ?? record.snippet ?? ""),
                risk: String(record.risk ?? record.level ?? "Medium"),
                reason: String(record.reason ?? record.rationale ?? ""),
              };
            }
            return { clause: String(item), risk: "Medium", reason: "" };
          })
        : [];

      const plainEnglishRaw = result.plain_english ?? result.plainEnglish ?? [];
      const plainEnglish = Array.isArray(plainEnglishRaw)
        ? plainEnglishRaw.map((p: unknown) => String(p))
        : [String(plainEnglishRaw)];

      const complianceRaw = result.compliance_flags ?? result.complianceFlags ?? [];
      const complianceFlags = Array.isArray(complianceRaw)
        ? complianceRaw.map((c: unknown) => String(c))
        : [String(complianceRaw)];

      const recommendationsRaw = result.recommendations ?? result.actions ?? [];
      const recommendations = Array.isArray(recommendationsRaw)
        ? recommendationsRaw.map((r: unknown) => String(r))
        : [String(recommendationsRaw)];

      console.log("Parsed data:", { riskScore, riskLevel, summary, riskyClauses, plainEnglish, complianceFlags, recommendations });

      // Update store
      useFeedbackStore.setState({
        riskScore,
        riskLevel,
        summary,
        riskyClauses,
        plainEnglish,
        complianceFlags,
        recommendations,
      });

      useErrorStore.getState().clearError();
      setStatus("Done ✅");

    } catch (err: unknown) {
      console.error("Analysis Error:", err);
      useErrorStore.getState().setError(
        (err instanceof Error ? err.message : String(err)) || "Policy analysis failed"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    if (!account) {
      useErrorStore.getState().setError("Please connect your wallet first");
      return;
    }

    const trimmedPolicy = policyText.trim();
    if (!trimmedPolicy) {
      useErrorStore.getState().setError("Please paste a policy or terms text");
      return;
    }

    if (trimmedPolicy.length > POLICY_CONFIG.MAX_CHARS) {
      useErrorStore.getState().setError(`Input must be under ${POLICY_CONFIG.MAX_CHARS} characters`);
      return;
    }

    try {
      setLoading(true);
      await analyzePolicy(trimmedPolicy);
    } catch (error) {
      console.error(error);
      useErrorStore.getState().setError("Analysis failed. See console.");
    } finally {
      setLoading(false);
      setPolicyText("");
      setStatus("");
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-card-border/60">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-main tracking-tight">Policy Intake</h3>
            <p className="text-xs text-text-muted mt-1">
              Paste terms, privacy, or compliance language for decentralized risk analysis.
            </p>
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted/80">GenLayer</div>
        </div>
      </div>

      {/* Form Body */}
      <div className="flex-1 p-6 flex flex-col">
        <form
          onSubmit={handleSubmit}
          className="w-full h-full flex flex-col gap-4"
        >
          <div className="flex-1 relative group">
            <label className="text-xs font-semibold text-text-muted mb-2 block uppercase tracking-wider">Policy Text</label>
            <textarea
              disabled={loading}
              onChange={(e) => setPolicyText(e.target.value)}
              value={policyText}
              placeholder={loading ? status : "Paste your policy, privacy notice, or terms here..."}
              className="w-full h-full min-h-[260px] p-4 premium-input bg-card-dark resize-none focus:ring-1 focus:ring-accent-primary/50"
            />
            <div className="absolute bottom-4 right-4 text-xs text-text-muted/60">
              {policyText.length} / {POLICY_CONFIG.MAX_CHARS}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-card-border/60 flex justify-between items-center gap-4">
            <div className="text-xs text-text-muted">
              Estimated cost: <span className="text-accent-secondary font-mono font-semibold">~0.01 GEN</span>
            </div>
            <button
              type="submit"
              disabled={loading || !policyText.trim() || !account}
              className="premium-btn px-6 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Assessing Risk...</span>
                </>
              ) : (
                <>
                  <span>Run Analysis</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Input;
