'use client'
import { useState } from 'react';
import { WalletButton } from "./components/WalletButton";
import Dashboard from "./components/Dashboard";
import AnalyzePanel from "./components/AnalyzePanel";
import ComparisonPanel from "./components/ComparisonPanel";
import BenchmarkPanel from "./components/BenchmarkPanel";
import AuditPanel from "./components/AuditPanel";
import ReportsPanel from "./components/ReportsPanel";

type Tab = 'overview' | 'intake' | 'compare' | 'frameworks' | 'activity' | 'briefing';

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'intake', label: 'Vendor Intake' },
  { id: 'compare', label: 'Compare' },
  { id: 'frameworks', label: 'Frameworks' },
  { id: 'activity', label: 'Activity' },
  { id: 'briefing', label: 'Briefing' },
];

function LedgerMark() {
  return (
    <svg viewBox="0 0 160 160" className="h-14 w-14" fill="none" aria-hidden="true">
      <rect x="16" y="16" width="128" height="128" rx="30" stroke="currentColor" strokeWidth="7" />
      <path d="M50 54h60M50 80h60M50 106h36" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <path d="M106 104l10 10 20-28" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignalBand() {
  return (
    <svg viewBox="0 0 320 80" className="h-14 w-full max-w-[320px]" fill="none" aria-hidden="true">
      <path d="M1 40h58l16-18 24 38 22-28 18 14 31-26 20 17h129" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="75" cy="22" r="6" fill="currentColor" />
      <circle cx="170" cy="20" r="6" fill="currentColor" />
      <circle cx="219" cy="37" r="6" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <main className="min-h-screen text-text-main selection:bg-accent-primary/15">
      <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="panel paper-grid relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(90deg,rgba(150,81,55,0.12),transparent_35%,rgba(49,91,87,0.12))]" />
          <nav className="relative flex flex-col gap-6 border-b border-edge/70 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-[1.8rem] border border-edge/80 bg-panel p-3 text-accent-primary shadow-[0_12px_24px_rgba(47,35,26,0.08)]">
                <LedgerMark />
              </div>
              <div>
                <div className="eyebrow">GenLayer Vendor Due Diligence</div>
                <h1 className="mt-2 font-display text-3xl sm:text-4xl">VendorLens</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
                  A procurement workspace for reviewing vendor materials, comparing decision readiness,
                  measuring framework coverage, and publishing defensible approval briefs on-chain.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="hidden text-accent-secondary sm:block">
                <SignalBand />
              </div>
              <WalletButton />
            </div>
          </nav>

          <div className="border-b border-edge/70 px-3 py-3 sm:px-6">
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-accent-secondary text-[#f6f0e7] shadow-[0_10px_22px_rgba(49,91,87,0.18)]'
                      : 'bg-white/55 text-text-muted hover:bg-white/85 hover:text-text-main'
                  }`}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            {activeTab === 'overview' && <Dashboard />}
            {activeTab === 'intake' && <AnalyzePanel />}
            {activeTab === 'compare' && <ComparisonPanel />}
            {activeTab === 'frameworks' && <BenchmarkPanel />}
            {activeTab === 'activity' && <AuditPanel />}
            {activeTab === 'briefing' && <ReportsPanel />}
          </div>
        </div>
      </div>
    </main>
  );
}
