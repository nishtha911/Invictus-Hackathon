import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingAssistant } from "@/components/shared/FloatingAssistant";
import { BRAND } from "@/lib/constants";
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
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.subtext,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-[#F5F7FA] text-[#081C2D] flex flex-col selection:bg-[#1F7A63]/20 selection:text-[#081C2D]">
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
              color: "#081C2D",
              boxShadow: "0 10px 25px -5px rgba(8, 28, 45, 0.1)",
            },
          }}
        />
      </body>
    </html>
  );
}
