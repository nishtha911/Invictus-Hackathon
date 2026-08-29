import { Hero } from "@/components/landing/Hero";
import { PersonalisedIntakeSection } from "@/components/landing/PersonalisedIntakeSection";
import { LoanInfoSection } from "@/components/landing/LoanInfoSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { LoanShowcaseSection } from "@/components/landing/LoanShowcaseSection";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col bg-[#F5F7FA]">
      {/* 1. Main Hero Section */}
      <Hero />

      {/* 2. Personalised Loan Question Intake Section */}
      <PersonalisedIntakeSection />

      {/* 3. Loan Information Section */}
      <LoanInfoSection />

      {/* 4. How DhanSetu Works Section */}
      <HowItWorksSection />

      {/* 5. Combined About DhanSetu & Trust Section */}
      <AboutSection />

      {/* 6. Bottom Navy Animated Loan Showcase Section */}
      <LoanShowcaseSection />
    </main>
  );
}
