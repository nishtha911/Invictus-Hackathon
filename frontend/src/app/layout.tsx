import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "DhanSetuFin — Smart AI Recommendations",
  description: "Find your perfect loan in minutes with AI-powered matching.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-base text-slate-800 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#1e293b",
              fontFamily: "Outfit, sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
