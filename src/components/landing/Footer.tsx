import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import VeriflowLogo from "../logo/VeriflowLogo";

export function Footer() {
  return (
    <footer className="bg-[#F7F9FB] text-[#55637A] py-12 text-xs border-t border-[#CDDBE8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <VeriflowLogo />
            <p className="text-[#55637A] text-xs max-w-sm leading-relaxed">
              Evidence-led reconciliation for 3PL finance teams. Veriflow connects invoices, shipment documents, and contracted rates so every decision is explainable.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2.5">
            <span className="font-bold text-[#12203A] uppercase tracking-wider text-[11px]">
              Platform
            </span>
            <ul className="space-y-1.5">
              <li>
                    <a href="#features" className="hover:text-[#0077CC] transition-colors">
                  Evidence Provenance
                </a>
              </li>
              <li>
                    <a href="#how-it-works" className="hover:text-[#0077CC] transition-colors">
                  13 Verification Checks
                </a>
              </li>
              <li>
                    <a href="#benchmarks" className="hover:text-[#0077CC] transition-colors">
                  Benchmark & Proof
                </a>
              </li>
              <li>
                    <a href="#pricing" className="hover:text-[#0077CC] transition-colors">
                  Enterprise Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Standards */}
          <div className="space-y-2.5">
            <span className="font-bold text-[#12203A] uppercase tracking-wider text-[11px]">
              Compliance & Safety
            </span>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1">
                <span>• Deterministic financial rules</span>
              </li>
              <li className="flex items-center gap-1">
                <span>• Append-Only Audit Trail</span>
              </li>
              <li className="flex items-center gap-1">
                <span>• Human-in-the-Loop Authority</span>
              </li>
              <li className="flex items-center gap-1">
                <span>• Evidence-linked decisions</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#E6EEF5] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#7C879C]">
          <p>© 2026 LogiRecon AI • Built for COMPFEST 18 AI Innovation Challenge (Smart Logistics).</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Engineered with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> for Enterprise Logistics
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
