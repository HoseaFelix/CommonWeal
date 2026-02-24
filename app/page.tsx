'use server'
import Input from "./components/input";
import AnimatedContent from "./components/animatedContent";
import { WalletButton } from "./components/WalletButton";

export default async function Home() {
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
              <path d="M12 2l7 4v6c0 5.25-3.5 8.5-7 10-3.5-1.5-7-4.75-7-10V6l7-4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-display tracking-tight">Policy Risk Analyzer</h1>
            <div className="text-[10px] text-text-muted uppercase tracking-[0.3em] hidden sm:block font-semibold">
              Decentralized Compliance Intelligence
            </div>
          </div>
        </div>
        <WalletButton />
      </nav>

      <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 relative">
        {/* Hero */}
        <section className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card-dark/70 border border-card-border/50 text-xs uppercase tracking-[0.25em] text-text-muted">
              Risk Profiling
              <span className="text-accent-primary">GenLayer Consensus</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-display tracking-tight leading-tight">
              Stress-test policies with validator-grade AI consensus.
            </h2>
            <p className="text-sm sm:text-base text-text-muted max-w-xl">
              Drop in terms, privacy notices, or internal policies. The network returns a structured risk report, compliance flags, and plain-English explanations you can act on.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-card-dark/60 border border-card-border/50">
                <div className="text-xs text-text-muted uppercase tracking-widest">Focus</div>
                <div className="text-sm font-semibold">Regulatory Gaps</div>
              </div>
              <div className="p-4 rounded-xl bg-card-dark/60 border border-card-border/50">
                <div className="text-xs text-text-muted uppercase tracking-widest">Output</div>
                <div className="text-sm font-semibold">JSON + Summary</div>
              </div>
              <div className="p-4 rounded-xl bg-card-dark/60 border border-card-border/50">
                <div className="text-xs text-text-muted uppercase tracking-widest">Model</div>
                <div className="text-sm font-semibold">Validator Consensus</div>
              </div>
            </div>
          </div>

          <div className="premium-card overflow-hidden flex flex-col bg-gradient-to-br from-card-dark/90 via-card-dark to-bg-dark/40 border-card-border/60 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <Input />
          </div>
        </section>

        {/* Results */}
        <section className="max-w-[1200px] mx-auto mt-10">
          <div className="premium-card overflow-hidden bg-gradient-to-br from-card-dark/90 via-card-dark to-bg-dark/40 border-card-border/60">
            <AnimatedContent />
          </div>
        </section>

        {/* Value Row */}
        <section className="max-w-[1200px] mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-card-dark/60 border border-card-border/50">
            <div className="text-xs text-text-muted uppercase tracking-widest">Signal</div>
            <div className="text-lg font-semibold">Consensus-verified risk grading</div>
          </div>
          <div className="p-5 rounded-2xl bg-card-dark/60 border border-card-border/50">
            <div className="text-xs text-text-muted uppercase tracking-widest">Coverage</div>
            <div className="text-lg font-semibold">Clause-level detection</div>
          </div>
          <div className="p-5 rounded-2xl bg-card-dark/60 border border-card-border/50">
            <div className="text-xs text-text-muted uppercase tracking-widest">Output</div>
            <div className="text-lg font-semibold">Structured + human-readable</div>
          </div>
        </section>
      </div>

      {/* Powered by GenLayer Footer */}
      <div className="w-full border-t border-card-border/30 bg-card-dark/20 backdrop-blur-sm py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2">
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
