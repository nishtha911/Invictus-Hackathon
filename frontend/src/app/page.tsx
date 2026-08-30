import { Hero } from "@/components/landing/Hero";
import { LoanInfoSection } from "@/components/landing/LoanInfoSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { AboutSection } from "@/components/landing/AboutSection";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col bg-[#F5F7FA]">
      {/* 1. Main Hero Section */}
      <Hero />

      {/* 2. Loan Information & Selection Section */}
      <LoanInfoSection />

      {/* 3. How Cognis Bank Works Section */}
      <HowItWorksSection />

      {/* 4. Combined About Cognis Bank & Trust Section */}
      <AboutSection />
    </main>
  );
}
