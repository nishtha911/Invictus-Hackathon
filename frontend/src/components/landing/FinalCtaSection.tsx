"use client";

import Link from "next/link";
import { ArrowRight, User } from "lucide-react";
import { motion } from "motion/react";

export function FinalCtaSection() {
  return (
    <section className="py-16 sm:py-20 bg-[#081C2D] text-white border-t border-[#0f2c44]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-3xl mx-auto space-y-6"
        >
          <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#4ade80]">
            FAST, CLEAR & POLICY-GROUNDED
          </p>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Ready to Find the Right Loan for Your Needs?
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Experience our transparent digital loan advisor in under 2 minutes. Get exact EMI calculations, clear eligibility insights, and connect with a dedicated specialist.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/advisor"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-6 py-3.5 text-sm font-semibold text-white shadow-xs transition-all hover:scale-[1.01]"
            >
              <span>Start Loan Advisory</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/80 hover:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01]"
            >
              <User className="h-4 w-4 text-slate-400" />
              <span>Customer Login</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
