import type { Metadata } from "next";
import { Boldonse, Figtree } from "next/font/google";
import "./globals.css";

const boldonse = Boldonse({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-boldonse",
  display: "swap",
  // Next.js has no fallback metrics for Boldonse. The theme's system fallback stack covers it.
  adjustFontFallback: false,
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Verflo | Evidence-led 3PL reconciliation",
  description:
    "Verflo gives instances working with third-party logistics finance teams one visual trail from billed amount to source document, contracted rate, and human decision.",
  keywords: [
    "3PL",
    "Invoice Reconciliation",
    "Verflo",
    "3PL reconciliation",
    "invoice audit",
    "shipment evidence",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${boldonse.variable} ${figtree.variable}`}>
      <body className="flex min-h-full flex-col bg-canvas font-sans text-ink antialiased selection:bg-teal/20 selection:text-navy">
        {children}
      </body>
    </html>
  );
}
