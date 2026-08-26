import Link from "next/link";
import { Sparkles, ShieldCheck, Lock, Award } from "lucide-react";
import { BRAND } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[#040612] text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/30 border border-indigo-500/30">
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">{BRAND.name}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Next-generation conversational lending intelligence. Combining deterministic financial rule-engines with verified GenAI explanation.
            </p>
          </div>

          {/* Solutions Col */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Lending Solutions</h4>
            <ul className="space-y-2">
              <li><Link href="/#solutions" className="hover:text-indigo-300 transition-colors">Prime Home Loans</Link></li>
              <li><Link href="/#solutions" className="hover:text-indigo-300 transition-colors">Express Personal Loans</Link></li>
              <li><Link href="/#solutions" className="hover:text-indigo-300 transition-colors">DrivePlus Vehicle Finance</Link></li>
              <li><Link href="/#solutions" className="hover:text-indigo-300 transition-colors">SME Enterprise Growth</Link></li>
            </ul>
          </div>

          {/* Architecture Col */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Hackathon Architecture</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Pod 1: GenAI & Orchestration</li>
              <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Pod 2: Backend Core & Matching</li>
              <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Pod 3: DB, ML & RAG Vector</li>
              <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Pod 4: Frontend UI/UX (Active)</li>
            </ul>
          </div>

          {/* Trust Col */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Trust & Security</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Deterministic Banking Calculations</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Lock className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>Zero Hallucination Financial Math</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Award className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Policy-Grounded LLM Explanations</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Cognizant Invictus Hackathon — Pod 4 Presentation Prototype. For demonstration purposes.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Branch: <code className="text-indigo-300 font-mono">pod4-frontend</code></span>
            <span className="text-slate-400">Next.js App Router + TypeScript</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
