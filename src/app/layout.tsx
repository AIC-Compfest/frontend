import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Evidence-First AI 3PL Invoice Reconciliation Engine",
  description:
    "Evidence-first, human-in-the-loop 3PL invoice reconciliation platform for Smart Logistics (COMPFEST AI Innovation Challenge).",
  keywords: [
    "3PL",
    "Invoice Reconciliation",
    "Smart Logistics",
    "Evidence-First",
    "Human-in-the-Loop",
    "COMPFEST",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-slate-950 text-slate-100 min-h-full flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200`}
      >
        {children}
      </body>
    </html>
  );
}
