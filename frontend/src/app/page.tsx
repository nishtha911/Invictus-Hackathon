import { Hero } from "@/components/landing/Hero";
import { LoanSolutionsGrid } from "@/components/landing/LoanSolutionsGrid";
import { LoanInfoSection } from "@/components/landing/LoanInfoSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col bg-[#F5F7FA]">
      <Hero />
      <LoanSolutionsGrid />
      <LoanInfoSection />
      <HowItWorksSection />
      <TrustSection />
      <AboutSection />
      <FinalCtaSection />
    </main>
  );
}
