import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingAssistant } from "@/components/shared/FloatingAssistant";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cognis Bank | Smart Loan Guidance",
  description:
    "Explore suitable home, car, business, gold and other loan options with Cognis Bank through a guided digital lending experience for the Cognizant Hackathon.",
  keywords: [
    "Cognis Bank",
    "Cognizant Hackathon",
    "Home Loan",
    "Car Loan",
    "Business Loan",
    "Gold Loan",
    "Personal Loan",
    "EMI Calculator",
    "Digital Lending Advisor",
  ],
  authors: [{ name: "Cognis Bank Engineering Team" }],
  // Favicon is served from src/app/icon.png (Next app-icon convention).
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased scroll-smooth`}>
      <body className="min-h-screen bg-[#F5F7FA] text-[#132443] flex flex-col selection:bg-[#1F7A63]/20 selection:text-[#132443]">
        <Navbar />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
        <FloatingAssistant />
        <Toaster
          position="top-right"
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid #E4E9F0",
              color: "#132443",
              boxShadow: "0 8px 24px -6px rgba(19, 36, 67, 0.12)",
            },
          }}
        />
      </body>
    </html>
  );
}
