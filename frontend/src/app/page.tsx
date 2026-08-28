import { Hero } from "@/components/landing/Hero";
import { LoanSolutionsGrid } from "@/components/landing/LoanSolutionsGrid";
import { LoanInfoSection } from "@/components/landing/LoanInfoSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col bg-[#F5F7FA]">
      <Hero />
      <LoanSolutionsGrid />
      <LoanInfoSection />
      <HowItWorksSection />
      <AboutSection />
      <TrustSection />
      <FinalCtaSection />
    </main>
  );
}
