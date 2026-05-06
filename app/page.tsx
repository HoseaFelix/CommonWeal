'use client'
import { useState } from 'react';
import { WalletButton } from "./components/WalletButton";
import Dashboard from "./components/Dashboard";
import AnalyzePanel from "./components/AnalyzePanel";
import ComparisonPanel from "./components/ComparisonPanel";
import BenchmarkPanel from "./components/BenchmarkPanel";
import AuditPanel from "./components/AuditPanel";
import ReportsPanel from "./components/ReportsPanel";

type Tab = 'dashboard' | 'analyze' | 'compare' | 'benchmark' | 'audit' | 'reports';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'analyze', label: 'Analyze Policy', icon: '📋' },
    { id: 'compare', label: 'Compare', icon: '⚖️' },
    { id: 'benchmark', label: 'Benchmark', icon: '🎯' },
    { id: 'audit', label: 'Audit Trail', icon: '📜' },
    { id: 'reports', label: 'Reports', icon: '📈' },
  ] as const;

  return (
    <main className="min-h-screen bg-bg-dark text-text-main flex flex-col font-body relative overflow-hidden selection:bg-accent-primary/20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-32 h-[420px] w-[420px] rounded-full bg-accent-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-[320px] w-[320px] rounded-full bg-accent-tertiary/10 blur-3xl" />
        <div className="absolute bottom-[-120px] right-1/4 h-[360px] w-[360px] rounded-full bg-accent-secondary/10 blur-3xl" />
      </div>

      {/* Top Navigation */}
      <nav className="w-full px-6 py-4 flex justify-between items-center border-b border-card-border/30 bg-card-dark/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-primary via-accent-secondary to-accent-tertiary flex items-center justify-center text-bg-dark font-bold shadow-lg relative overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 relative z-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-display tracking-tight">ComplianceHub</h1>
            <div className="text-[10px] text-text-muted uppercase tracking-[0.3em] hidden sm:block font-semibold">
              Enterprise Risk & Compliance Platform
            </div>
          </div>
        </div>
        <WalletButton />
      </nav>

      {/* Tab Navigation */}
      <div className="w-full border-b border-card-border/30 bg-card-dark/10 backdrop-blur-sm sticky top-[73px] z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-accent-primary text-accent-primary'
                    : 'border-transparent text-text-muted hover:text-text-main hover:border-accent-primary/50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative overflow-y-auto">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'analyze' && <AnalyzePanel />}
          {activeTab === 'compare' && <ComparisonPanel />}
          {activeTab === 'benchmark' && <BenchmarkPanel />}
          {activeTab === 'audit' && <AuditPanel />}
          {activeTab === 'reports' && <ReportsPanel />}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full border-t border-card-border/30 bg-card-dark/20 backdrop-blur-sm py-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2">
          <span className="text-sm text-text-muted">Powered by</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-accent-primary/10 to-accent-tertiary/10 border border-accent-primary/30">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-accent-primary to-accent-tertiary"></div>
            <span className="text-sm font-semibold text-accent-primary">GenLayer</span>
          </div>
          <span className="text-xs text-text-muted/60 ml-2">• Decentralized Intelligence</span>
        </div>
      </div>
    </main>
  );
}
