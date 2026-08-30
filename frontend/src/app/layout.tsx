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
  icons: {
    icon: "/images/logo.png",
  },
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
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              color: "#132443",
              boxShadow: "0 10px 25px -5px rgba(19, 36, 67, 0.1)",
            },
          }}
        />
      </body>
    </html>
  );
}
