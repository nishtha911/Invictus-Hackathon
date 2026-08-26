import { Hero } from "@/components/landing/Hero";
import { LoanSolutionsGrid } from "@/components/landing/LoanSolutionsGrid";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TrustSection } from "@/components/landing/TrustSection";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col bg-mesh-gradient">
      <Hero />
      <LoanSolutionsGrid />
      <HowItWorksSection />
      <TrustSection />
    </main>
  );
}
