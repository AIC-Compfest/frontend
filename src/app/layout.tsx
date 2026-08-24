import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veriflow | Evidence-led 3PL reconciliation",
  description:
    "Veriflow helps 3PL finance and operations teams reconcile invoices against shipment evidence and contracted rates.",
  keywords: [
    "3PL",
    "Invoice Reconciliation",
    "Veriflow",
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
    <html lang="en" className="h-full">
      <body
        className="font-sans bg-[#F7F9FB] text-[#12203A] min-h-full flex flex-col antialiased selection:bg-[#00B4B3]/20 selection:text-[#243A5E]"
      >
        {children}
      </body>
    </html>
  );
}
