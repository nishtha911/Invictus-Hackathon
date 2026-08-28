import Link from "next/link";
import { Home, Compass, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center min-h-[70vh] bg-[#F5F7FA] px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F5F1] text-[#1F7A63] border border-emerald-100 shadow-xs">
          <Compass className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-[#1F7A63] bg-[#E8F5F1] px-3 py-1 rounded-full border border-emerald-100">
            ERROR 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#081C2D] tracking-tight">
            Looks like this path doesn&apos;t lead to a loan solution.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The page you are looking for may have moved, expired, or does not exist in our active routing directory.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>

          <Link
            href="/#loans"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#081C2D] bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#081C2D] hover:bg-[#081C2D] hover:text-white transition-colors cursor-pointer"
          >
            <span>Explore Loans</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
