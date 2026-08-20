"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calculator,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  badge: string;
  badgeVariant: "success" | "destructive" | "warning";
  route: string;
  billedAmount: number;
  expectedAmount: number;
  difference: number;
  discrepancyType: string;
  explanation: string;
  formula: string;
  auditTrail: string;
  sampleBBox: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "RATE_OVERCHARGE",
    name: "Scenario A: Fuel Surcharge Overcharge",
    badge: "EXCEPTION",
    badgeVariant: "destructive",
    route: "Jakarta ➔ Surabaya (183.8 kg)",
    billedAmount: 1379797,
    expectedAmount: 1183028,
    difference: 196769,
    discrepancyType: "RATE_OVERCHARGE",
    explanation:
      "3PL Invoice charges 18% fuel surcharge (Rp 200.730). Master Agreement CTR-001 specifies maximum 14% (Rp 156.124).",
    formula:
      "Base Rate (Rp 934.904) + Fuel 14% (Rp 130.887) + PPN 11% (Rp 117.237) = Expected Rp 1.183.028 | Billed Rp 1.379.797",
    auditTrail: "2026-08-18 10:14:02 UTC | SYSTEM_RECONCILE_ENGINE | Flagged RATE_OVERCHARGE (Variance: +Rp 196.769)",
    sampleBBox: "Invoice Page 1 • [x: 0.65, y: 0.85, w: 0.30, h: 0.05] (Confidence: 99.4%)",
  },
  {
    id: "CLEAN_MATCH",
    name: "Scenario B: 100% Clean Baseline Match",
    badge: "MATCH",
    badgeVariant: "success",
    route: "Surabaya ➔ Jakarta (90.11 kg)",
    billedAmount: 607392,
    expectedAmount: 607392,
    difference: 0,
    discrepancyType: "NONE (AUTO-PASS ELIGIBLE)",
    explanation:
      "Invoice, Surat Jalan physical weight (84.33 kg), POD wet signature, and Contract tier all match with 0% variance.",
    formula:
      "Base Rate (Rp 480.000) + Fuel 14% (Rp 67.200) + PPN 11% (Rp 60.192) = Expected Rp 607.392 | Billed Rp 607.392",
    auditTrail: "2026-08-18 10:14:00 UTC | SYSTEM_RECONCILE_ENGINE | Auto-Passed 13/13 Verification Checks",
    sampleBBox: "Invoice Page 1 • Total Match [x: 0.70, y: 0.88] (Confidence: 99.8%)",
  },
  {
    id: "WRONG_ZONE",
    name: "Scenario C: Wrong Tariff Zone Mapping",
    badge: "EXCEPTION",
    badgeVariant: "destructive",
    route: "Jakarta ➔ Semarang (Billed as Surabaya)",
    billedAmount: 785000,
    expectedAmount: 557228,
    difference: 227772,
    discrepancyType: "WRONG_ZONE",
    explanation:
      "Surat Jalan proves destination is SEMARANG, but 3PL invoiced using the more expensive SURABAYA rate matrix.",
    formula:
      "Semarang Contract Base (Rp 450.000) vs Surabaya Invoiced Base (Rp 630.000) -> Overcharge: +Rp 227.772",
    auditTrail: "2026-08-18 10:14:05 UTC | SYSTEM_RECONCILE_ENGINE | Flagged WRONG_ZONE against Surat Jalan destination",
    sampleBBox: "Surat Jalan Page 1 • Destination 'SEMARANG' [x: 0.40, y: 0.35]",
  },
  {
    id: "QUANTITY_MISMATCH",
    name: "Scenario D: Missing Physical Cartons on POD",
    badge: "EXCEPTION",
    badgeVariant: "warning",
    route: "Bandung ➔ Jakarta (Industrial FMCG)",
    billedAmount: 850000,
    expectedAmount: 850000,
    difference: 0,
    discrepancyType: "QUANTITY_MISMATCH",
    explanation:
      "Invoice charges full 25 cartons, but receiver POD physically noted and signed for only 21 cartons (4 missing).",
    formula:
      "Billed Quantity (25 koli) - Received Quantity on POD (21 koli) = 4 Missing Cartons Pending Credit Note",
    auditTrail: "2026-08-18 10:14:08 UTC | SYSTEM_RECONCILE_ENGINE | Quantity received 21 < Billed 25 on signed POD",
    sampleBBox: "POD Page 1 • Signed Quantity '21 KOLI' [x: 0.20, y: 0.50]",
  },
];

interface InteractiveSimulatorProps {
  onLaunchApp: () => void;
}

export function InteractiveSimulator({ onLaunchApp }: InteractiveSimulatorProps) {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section id="interactive-demo" className="py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider font-bold">
            Interactive Test Drive
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#243A5E] tracking-tight">
            Simulate Real 3PL Discrepancy Audits in Real-Time
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Select a real-world logistics scenario below to see how our engine cross-reconciles evidence, checks contract terms, and flags overcharges in microseconds.
          </p>
        </div>

        {/* Scenario Selection Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setSelectedScenario(sc)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                selectedScenario.id === sc.id
                  ? "bg-[#243A5E] text-white shadow-md scale-102"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
              }`}
            >
              {sc.name.split(":")[0]}
            </button>
          ))}
        </div>

        {/* Live Simulation Card */}
        <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200/90 bg-[#F8FAFC] shadow-lg overflow-hidden">
          {/* Header Bar */}
          <div className="bg-[#243A5E] p-4 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8FB8D6] text-[#243A5E]">
                <Zap className="h-4 w-4 fill-[#243A5E]" />
              </div>
              <div>
                <span className="font-bold text-sm block">{selectedScenario.name}</span>
                <span className="text-xs text-[#CFE3F1] font-mono">{selectedScenario.route}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#CFE3F1] font-mono hidden sm:inline">Execution Time: 82.8 µs</span>
              <Badge
                variant={selectedScenario.badgeVariant === "success" ? "success" : "destructive"}
                className="text-xs font-bold"
              >
                {selectedScenario.badge}
              </Badge>
            </div>
          </div>

          {/* Body Split Grid */}
          <div className="p-6 grid md:grid-cols-12 gap-6">
            {/* Left: Financial Math & Findings (7 Cols) */}
            <div className="md:col-span-7 space-y-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-[#5F86A6] uppercase tracking-wider block">
                  Deterministic Financial Comparison
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Billed Charge</span>
                    <span className="font-extrabold text-slate-900 text-sm font-tabular">
                      {formatIDR(selectedScenario.billedAmount)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200/60">
                    <span className="text-[10px] text-emerald-700 block">Audited Expected</span>
                    <span className="font-extrabold text-emerald-800 text-sm font-tabular">
                      {formatIDR(selectedScenario.expectedAmount)}
                    </span>
                  </div>
                  <div
                    className={`p-2.5 rounded-lg border ${
                      selectedScenario.difference > 0
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-[10px] block font-semibold">
                      {selectedScenario.difference > 0 ? "Overcharge" : "Variance"}
                    </span>
                    <span className="font-extrabold text-sm font-tabular">
                      {selectedScenario.difference > 0 ? `+${formatIDR(selectedScenario.difference)}` : "Rp 0"}
                    </span>
                  </div>
                </div>

                {/* Formula Breakdown */}
                <div className="p-3 bg-[#EDF4FA]/60 rounded-lg border border-[#8FB8D6]/30 text-xs space-y-1">
                  <span className="font-bold text-[#243A5E] flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5" />
                    Transparent Mathematical Trace Log:
                  </span>
                  <p className="font-mono text-[11px] text-slate-700 leading-relaxed">
                    {selectedScenario.formula}
                  </p>
                </div>
              </div>

              {/* Finding Description */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                  <AlertTriangle
                    className={`h-4 w-4 ${
                      selectedScenario.badgeVariant === "success" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  />
                  AI Discrepancy Classification:
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedScenario.explanation}
                </p>
              </div>
            </div>

            {/* Right: Spatial BBox Evidence & Audit Trail (5 Cols) */}
            <div className="md:col-span-5 space-y-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#5F86A6]" />
                  Spatial Proof Provenance:
                </span>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 font-mono text-[11px] text-slate-700">
                  {selectedScenario.sampleBBox}
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Hallucination Risk:</span>
                  <span className="font-bold text-emerald-600">0.0% (Deterministic)</span>
                </div>
              </div>

              {/* Audit Log Preview */}
              <div className="p-4 bg-[#243A5E] text-white rounded-xl space-y-2 text-xs">
                <span className="font-bold text-[#CFE3F1] block flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-[#8FB8D6]" />
                  Immutable Audit Ledger:
                </span>
                <p className="font-mono text-[10px] text-slate-300 leading-normal">
                  {selectedScenario.auditTrail}
                </p>
              </div>

              {/* Action Button */}
              <Button
                onClick={onLaunchApp}
                className="w-full bg-[#243A5E] text-white hover:bg-[#1C2E4A] gap-2 text-xs font-bold py-2.5"
              >
                <span>Inspect Full 20-Transaction Queue in App</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
