'use client';

import { useState } from 'react';
import { WalletButton } from './components/WalletButton';
import Dashboard from './components/Dashboard';
import AnalyzePanel from './components/AnalyzePanel';
import ComparisonPanel from './components/ComparisonPanel';
import BenchmarkPanel from './components/BenchmarkPanel';
import AuditPanel from './components/AuditPanel';
import ReportsPanel from './components/ReportsPanel';

type Tab = 'signal' | 'intake' | 'matchup' | 'rubrics' | 'ledger' | 'memo';

const tabs: Array<{ id: Tab; label: string; short: string; summary: string }> = [
  { id: 'signal', label: 'Portfolio Signal', short: 'Signal', summary: 'See the current application slate and review posture.' },
  { id: 'intake', label: 'Application Intake', short: 'Intake', summary: 'Submit a grant packet and generate a structured funding review.' },
  { id: 'matchup', label: 'Applicant Matchup', short: 'Matchup', summary: 'Put two applicants side by side for shortlist decisions.' },
  { id: 'rubrics', label: 'Rubric Benchmarks', short: 'Rubrics', summary: 'Test one application against impact, feasibility, transparency, or equity.' },
  { id: 'ledger', label: 'Council Ledger', short: 'Ledger', summary: 'Inspect the permanent trail of reviews, comparisons, and memos.' },
  { id: 'memo', label: 'Funding Memo', short: 'Memo', summary: 'Generate a board-ready summary of the whole docket.' },
];

function CommonwealMark() {
  return (
    <svg viewBox="0 0 160 160" className="h-16 w-16" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="cw-ring" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7CF5D6" />
          <stop offset="1" stopColor="#F4B66A" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="80" r="58" stroke="url(#cw-ring)" strokeWidth="6" />
      <circle cx="80" cy="80" r="24" stroke="#D9E4FF" strokeWidth="6" />
      <path d="M80 22v34M80 104v34M22 80h34M104 80h34" stroke="#D9E4FF" strokeWidth="6" strokeLinecap="round" />
      <path d="M44 44l20 20M96 96l20 20M116 44L96 64M64 96L44 116" stroke="#6E7FFF" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function OrbitMap() {
  return (
    <svg viewBox="0 0 420 120" className="h-20 w-full max-w-[420px]" fill="none" aria-hidden="true">
      <path d="M22 63C62 23 112 24 154 60C194 94 242 95 283 54C324 14 365 18 398 48" stroke="#6E7FFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 74C78 114 126 112 168 72C214 28 259 29 303 72C338 105 365 102 398 78" stroke="#7CF5D6" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="74" cy="44" r="8" fill="#F4B66A" />
      <circle cx="168" cy="71" r="6" fill="#D9E4FF" />
      <circle cx="301" cy="53" r="7" fill="#7CF5D6" />
      <circle cx="359" cy="88" r="5" fill="#6E7FFF" />
    </svg>
  );
}

function HaloField() {
  return (
    <svg viewBox="0 0 640 280" className="pointer-events-none absolute -right-12 top-0 hidden h-[280px] w-[640px] opacity-80 xl:block" fill="none" aria-hidden="true">
      <circle cx="468" cy="72" r="168" stroke="rgba(124,245,214,0.20)" strokeWidth="1.5" />
      <circle cx="468" cy="72" r="122" stroke="rgba(110,127,255,0.22)" strokeWidth="1.5" />
      <circle cx="468" cy="72" r="76" stroke="rgba(244,182,106,0.18)" strokeWidth="1.5" />
      <path d="M265 178C331 136 379 129 429 150C486 174 533 180 603 137" stroke="rgba(217,228,255,0.16)" strokeWidth="1.5" />
    </svg>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('signal');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeTabDetails = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg text-ink-main selection:bg-accent-cyan/20 selection:text-white">
      <div className="noise-layer" />
      <div className="atmosphere atmosphere-a" />
      <div className="atmosphere atmosphere-b" />

      <header className="app-navbar-wrap">
        <div className="app-navbar-shadow" />
        <nav className="app-navbar">
          <div className="app-navbar-brand">
            <div className="brand-medallion brand-medallion-sm">
              <CommonwealMark />
            </div>
            <div>
              <div className="app-navbar-kicker">GenLayer Grant Allocation Workspace</div>
              <h1 className="app-navbar-title">Commonweal</h1>
            </div>
          </div>

          <button
            type="button"
            className="app-navbar-menu-btn"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span className={`hamburger-line ${mobileMenuOpen ? 'hamburger-line-top-open' : ''}`} />
            <span className={`hamburger-line ${mobileMenuOpen ? 'hamburger-line-middle-open' : ''}`} />
            <span className={`hamburger-line ${mobileMenuOpen ? 'hamburger-line-bottom-open' : ''}`} />
          </button>

          <div className="app-navbar-links" aria-label="Primary navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`app-nav-link ${activeTab === tab.id ? 'app-nav-link-active' : ''}`}
              >
                {tab.short}
              </button>
            ))}
          </div>

          <div className="app-navbar-actions">
            <WalletButton />
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="app-mobile-menu">
            <div className="app-mobile-menu-links" aria-label="Mobile navigation">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`app-mobile-nav-link ${activeTab === tab.id ? 'app-mobile-nav-link-active' : ''}`}
                >
                  <span className="app-mobile-nav-short">{tab.short}</span>
                  <span className="app-mobile-nav-label">{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="app-mobile-menu-actions">
              <WalletButton />
            </div>
          </div>
        )}
      </header>

      <div className="relative mx-auto max-w-[1540px] px-4 pb-5 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pb-7 lg:pt-32">
        <div className="shell-card">
          <HaloField />

          <section className="hero-band">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
              <div>
                <div className="eyebrow">Capital Allocation Cockpit</div>
                <h2 className="hero-title mt-3">Review, compare, and release with a clear council trail.</h2>
                <p className="hero-copy mt-4">
                  Commonweal turns raw grant applications into structured funding signals so a committee can
                  defend why capital moved, why it paused, and what conditions came next.
                </p>
              </div>
              <div className="hero-side">
                <div className="text-accent-cyan/90">
                  <OrbitMap />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="mini-stat">
                    <div className="mini-stat-value">01</div>
                    <div className="mini-stat-label">Review</div>
                  </div>
                  <div className="mini-stat">
                    <div className="mini-stat-value">02</div>
                    <div className="mini-stat-label">Compare</div>
                  </div>
                  <div className="mini-stat">
                    <div className="mini-stat-value">03</div>
                    <div className="mini-stat-label">Release</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="px-4 py-5 sm:px-6 lg:px-8">
            <div className="active-panel-head">
              <div>
                <div className="eyebrow">Current Workspace</div>
                <h3 className="section-title mt-2">{activeTabDetails.label}</h3>
              </div>
              <p className="active-panel-copy">{activeTabDetails.summary}</p>
            </div>
          </section>

          <div className="px-4 pb-5 sm:px-6 sm:pb-7 lg:px-8">
            {activeTab === 'signal' && <Dashboard />}
            {activeTab === 'intake' && <AnalyzePanel />}
            {activeTab === 'matchup' && <ComparisonPanel />}
            {activeTab === 'rubrics' && <BenchmarkPanel />}
            {activeTab === 'ledger' && <AuditPanel />}
            {activeTab === 'memo' && <ReportsPanel />}
          </div>
        </div>
      </div>
    </main>
  );
}
