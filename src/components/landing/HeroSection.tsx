"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  TrendingDown,
} from "lucide-react";

interface HeroSectionProps {
  onLaunchApp: () => void;
}

export function HeroSection({ onLaunchApp }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-[#EDF4FA]/60 via-[#F8FAFC] to-white">
      {/* Background Decorative Grid Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#CFE3F115_1px,transparent_1px),linear-gradient(to_bottom,#CFE3F115_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 flex flex-col items-center text-center lg:items-start lg:text-left space-y-6">
            {/* Innovation Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#8FB8D6]/60 shadow-2xs text-xs font-semibold text-[#243A5E]">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Evidence-First AI Engine • Compfest 18 Smart Logistics</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Stop 3PL Logistics Overcharges with{" "}
              <span className="bg-gradient-to-r from-[#243A5E] via-[#5F86A6] to-[#243A5E] bg-clip-text text-transparent">
                Evidence-First AI
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              Automatically reconcile messy <strong>Invoices, Surat Jalan, PODs, and Rate Contracts</strong> in microseconds. Detect unauthorized fuel surcharges, weight tier discrepancies, and duplicate billings with <strong>100% spatial Bounding Box proof</strong>.
            </p>

            {/* Key Value Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white/80 border border-slate-200/80 px-3 py-2 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Zero AI Hallucinations</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white/80 border border-slate-200/80 px-3 py-2 rounded-lg">
                <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                <span>82.83 µs Engine Latency</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white/80 border border-slate-200/80 px-3 py-2 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-[#243A5E] shrink-0" />
                <span>Append-Only Audit Trail</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-4 w-full sm:w-auto">
              <Button
                onClick={onLaunchApp}
                size="lg"
                className="w-full sm:w-auto bg-[#243A5E] text-white hover:bg-[#1C2E4A] gap-2 text-base px-7 shadow-md group"
              >
                <span>Launch Reviewer Workspace</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const el = document.getElementById("interactive-demo");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto text-slate-700 border-slate-300 hover:bg-slate-100 text-base"
              >
                Try Live Interactive Demo
              </Button>
            </div>

            {/* Social Proof Subtext */}
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <TrendingDown className="h-4 w-4 text-emerald-600" />
                Save up to 12.4% on 3PL freight spend
              </span>
              <span>•</span>
              <span>100% Deterministic Financial Math</span>
            </div>
          </div>

          {/* Right Column: Live Interactive Visual Mockup Preview */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Glow backdrop */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#8FB8D6] to-[#5F86A6] rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition duration-1000" />

              {/* Main Enterprise Card Container */}
              <div className="relative rounded-2xl bg-white border border-slate-200/90 shadow-xl overflow-hidden text-slate-800">
                {/* Window Top Bar */}
                <div className="bg-[#243A5E] px-4 py-3 text-white flex items-center justify-between border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-xs font-mono text-[#CFE3F1] ml-2">
                      TXN-000019 • Live Audit
                    </span>
                  </div>
                  <Badge variant="destructive" className="text-[10px] py-0">
                    RATE_OVERCHARGE
                  </Badge>
                </div>

                {/* Card Content Preview */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Discrepancy Spotlight Alert */}
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-rose-900 block">
                        Fuel Surcharge Overcharge Detected
                      </span>
                      <span className="text-rose-700">
                        Invoice charges <strong>18%</strong> (Rp 200.730) while Agreement <strong>CTR-001</strong> specifies <strong>14%</strong> (Rp 156.124).
                      </span>
                    </div>
                  </div>

                  {/* Financial Comparison Split */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Billed by 3PL
                      </span>
                      <span className="text-sm font-bold text-slate-900 font-tabular">
                        Rp 1.379.797
                      </span>
                    </div>
                    <div className="border-l border-slate-200 pl-3">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Contract Audited
                      </span>
                      <span className="text-sm font-bold text-emerald-700 font-tabular">
                        Rp 1.183.028
                      </span>
                    </div>
                  </div>

                  {/* Variance Banner */}
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-rose-100/60 border border-rose-200 text-xs">
                    <span className="font-semibold text-rose-900">
                      Recoverable Overcharge
                    </span>
                    <span className="font-extrabold text-rose-700 font-tabular text-sm">
                      +Rp 196.769 (14.2%)
                    </span>
                  </div>

                  {/* Document Proof BBox Mock */}
                  <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-white text-[11px] space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <FileText className="h-3.5 w-3.5 text-[#5F86A6]" />
                        Invoice Evidence Bounding Box
                      </span>
                      <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Conf: 99.4%
                      </span>
                    </div>
                    <div className="relative bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-[11px] text-slate-700">
                      <span>Billed Fuel (18%): </span>
                      <span className="bg-rose-100 text-rose-800 px-1 py-0.5 rounded border border-rose-300 font-bold">
                        Rp 200.730 [x: 0.65, y: 0.85]
                      </span>
                    </div>
                  </div>

                  {/* CTA Action in Mock */}
                  <div className="pt-1">
                    <button
                      onClick={onLaunchApp}
                      className="w-full py-2 px-3 bg-[#243A5E] text-white hover:bg-[#1C2E4A] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#8FB8D6]" />
                      <span>Inspect in Dual-Pane Workspace ➔</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
