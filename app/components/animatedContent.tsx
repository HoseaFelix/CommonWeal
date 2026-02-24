'use client'

import { useFeedbackStore, useErrorStore } from '@/store/store'
import { PolicyData } from '@/types'
import React from 'react'

const AnimatedContent = () => {
  const { error } = useErrorStore()
  const {
    riskScore,
    riskLevel,
    summary,
    riskyClauses,
    plainEnglish,
    complianceFlags,
    recommendations,
  } = useFeedbackStore() as PolicyData

  const hasFeedback =
    summary.trim() !== '' ||
    riskyClauses.length > 0 ||
    plainEnglish.length > 0 ||
    complianceFlags.length > 0 ||
    recommendations.length > 0 ||
    riskScore > 0

  const safeScore = Number.isFinite(riskScore) ? riskScore : 0
  const scoreColor =
    safeScore >= 75 ? 'text-destructive' :
    safeScore >= 45 ? 'text-warning' :
    'text-success'

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-card-border/50 flex justify-between items-center bg-card-dark/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-tertiary/20 to-accent-secondary/10 border border-card-border/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.248 6.253 2 10.5 2 15.5S6.248 24.747 12 24.747s10-4.747 10-10.247S17.752 6.253 12 6.253z" />
            </svg>
          </div>
          <h3 className="font-semibold text-text-main">Risk Report</h3>
        </div>
        {!hasFeedback && <span className="text-xs text-text-muted/70 px-3 py-1.5 rounded-full bg-card-dark border border-card-border/30 font-medium">Waiting for input</span>}
      </div>

      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {!hasFeedback && !error && (
          <div className="h-full flex flex-col items-center justify-center text-text-muted/60 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-card-dark border border-card-border flex items-center justify-center shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C6.248 6.253 2 10.5 2 15.5S6.248 24.747 12 24.747s10-4.747 10-10.247S17.752 6.253 12 6.253z" />
              </svg>
            </div>
            <div className="space-y-2 text-center max-w-sm">
              <h4 className="text-lg font-semibold text-text-main">Risk Analysis Ready</h4>
              <p className="text-sm text-text-muted">Run a policy through GenLayer consensus to surface risks and compliance gaps.</p>
            </div>
          </div>
        )}

        {hasFeedback && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5 pb-6 border-b border-card-border/30">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-card-dark/80 to-bg-dark/40 border border-card-border/40 flex flex-col justify-between">
                <div className="text-xs uppercase tracking-widest text-text-muted">Risk Score</div>
                <div className={`text-4xl font-black ${scoreColor}`}>{Math.round(safeScore)}</div>
                <div className="text-xs text-text-muted">Risk Level</div>
                <div className="text-sm font-semibold text-text-main">{riskLevel || "Unclassified"}</div>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-card-dark/70 to-bg-dark/30 border border-card-border/40">
                <div className="text-xs uppercase tracking-widest text-text-muted mb-2">Executive Summary</div>
                <p className="text-sm text-text-main leading-relaxed">{summary}</p>
              </div>
            </div>

            {/* Risky Clauses */}
            {riskyClauses.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">Risky Clauses</h2>
                <div className="grid gap-3">
                  {riskyClauses.map((item, index) => (
                    <div key={index} className="p-4 rounded-xl bg-gradient-to-r from-destructive/5 to-transparent border border-destructive/20 hover:border-destructive/40 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-widest text-text-muted">Clause {index + 1}</span>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-destructive/10 text-destructive uppercase tracking-widest">{item.risk}</span>
                      </div>
                      <p className="text-sm text-text-main leading-relaxed">{item.clause}</p>
                      {item.reason && (
                        <p className="text-xs text-text-muted mt-2">Reason: {item.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plain English */}
            {plainEnglish.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">Plain English</h2>
                <div className="space-y-2">
                  {plainEnglish.map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-gradient-to-r from-accent-secondary/10 to-transparent border border-accent-secondary/30">
                      <p className="text-sm text-text-main">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance Flags */}
            {complianceFlags.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">Compliance Flags</h2>
                <div className="flex flex-wrap gap-2">
                  {complianceFlags.map((flag, index) => (
                    <span key={index} className="text-[11px] px-3 py-1 rounded-full border border-card-border/60 bg-card-dark/60 text-text-main">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">Recommendations</h2>
                <div className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm p-3.5 rounded-lg bg-gradient-to-r from-accent-tertiary/10 to-transparent border border-accent-tertiary/30">
                      <span className="mt-0.5 text-accent-tertiary">•</span>
                      <span className="text-text-main">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AnimatedContent
