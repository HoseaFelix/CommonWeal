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
    { id: 'dashboard', label: 'Dashboard', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M5 9h3V4H5v5zm5 0h3V2H10v7zm5 0h3V6h-3v3z"/></svg> },
    { id: 'analyze', label: 'Analyze Policy', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg> },
    { id: 'compare', label: 'Compare', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 14H2v2h7v-2zm6-2H2v2h13V12zm0-6H2v2h13V6z"/></svg> },
    { id: 'benchmark', label: 'Benchmark', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg> },
    { id: 'audit', label: 'Audit Trail', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg> },
    { id: 'reports', label: 'Reports', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM9 7h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2z"/></svg> },
  ] as const;

  return (
    <main className="min-h-screen bg-bg-dark text-text-main flex flex-col font-body relative overflow-hidden selection:bg-accent-primary/20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-32 h-[420px] w-[420px] rounded-full bg-accent-primary/10 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-32 h-[320px] w-[320px] rounded-full bg-accent-secondary/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[-120px] right-1/4 h-[360px] w-[360px] rounded-full bg-accent-tertiary/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Top Navigation */}
      <nav className="w-full px-6 py-4 flex justify-between items-center border-b border-card-border/30 bg-card-dark/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-primary via-accent-secondary to-accent-tertiary flex items-center justify-center text-bg-dark font-bold shadow-lg relative overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 relative z-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l8 3v7c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V5l8-3z"/>
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
                className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap text-sm font-medium flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-accent-primary text-accent-primary'
                    : 'border-transparent text-text-muted hover:text-text-main hover:border-accent-primary/50'
                }`}
              >
                {tab.icon}
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
