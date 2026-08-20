import React from "react";
import Link from "next/link";
import { ShieldCheck, ExternalLink, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Footer() {
  return (
    <footer className="bg-[#1C2E4A] text-slate-400 py-12 text-xs border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#243A5E] text-white">
                <ShieldCheck className="h-4 w-4 text-[#8FB8D6]" />
              </div>
              <span className="font-extrabold text-sm text-white tracking-tight">
                LogiRecon<span className="text-[#8FB8D6]">.AI</span>
              </span>
              <Badge className="bg-[#5F86A6]/40 text-[#EDF4FA] text-[9px] px-1.5 py-0">
                COMPFEST 18
              </Badge>
            </div>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              Evidence-First AI 3PL Invoice Reconciliation Engine built for the Compfest AI Innovation Challenge (Smart Logistics). Cross-auditing invoices, warehouse waybills, and rate contracts with deterministic financial math.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Architecture: Microsecond Go Engine • PP-Structure OCR • Supabase Cloud
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2.5">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Platform
            </span>
            <ul className="space-y-1.5">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Evidence Provenance
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  13 Verification Checks
                </a>
              </li>
              <li>
                <a href="#benchmarks" className="hover:text-white transition-colors">
                  Accuracy Benchmark (100%)
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Enterprise Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Standards */}
          <div className="space-y-2.5">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Compliance & Safety
            </span>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1">
                <span>• Zero LLMs for Financial Math</span>
              </li>
              <li className="flex items-center gap-1">
                <span>• Append-Only Audit Trail</span>
              </li>
              <li className="flex items-center gap-1">
                <span>• Human-in-the-Loop Authority</span>
              </li>
              <li className="flex items-center gap-1">
                <span>• Supabase Storage Signed URLs</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
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
