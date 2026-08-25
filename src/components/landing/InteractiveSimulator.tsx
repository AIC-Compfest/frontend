"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  Calculator,
  FileSearch,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    name: "Fuel surcharge overcharge",
    badge: "EXCEPTION",
    badgeVariant: "destructive",
    route: "Jakarta to Surabaya, 183.8 kg",
    billedAmount: 1379797,
    expectedAmount: 1183028,
    difference: 196769,
    discrepancyType: "RATE_OVERCHARGE",
    explanation:
      "The invoice applies an 18% fuel surcharge. Agreement CTR-001 caps the charge at 14%.",
    formula: "Base rate + contract fuel surcharge + PPN = expected amount",
    auditTrail: "10:14:02  SYSTEM_RECONCILE_ENGINE  Flagged RATE_OVERCHARGE",
    sampleBBox: "Invoice page 1 / fuel surcharge / confidence 99.4%",
  },
  {
    id: "CLEAN_MATCH",
    name: "Clean baseline match",
    badge: "MATCH",
    badgeVariant: "success",
    route: "Surabaya to Jakarta, 90.11 kg",
    billedAmount: 607392,
    expectedAmount: 607392,
    difference: 0,
    discrepancyType: "NONE",
    explanation:
      "Invoice, physical weight, signed POD, and contract tier match with zero variance.",
    formula: "Base rate + contract fuel surcharge + PPN = billed amount",
    auditTrail: "10:14:00  SYSTEM_RECONCILE_ENGINE  Auto-passed 13 checks",
    sampleBBox: "Invoice page 1 / total / confidence 99.8%",
  },
  {
    id: "WRONG_ZONE",
    name: "Wrong tariff zone",
    badge: "EXCEPTION",
    badgeVariant: "destructive",
    route: "Jakarta to Semarang, billed as Surabaya",
    billedAmount: 785000,
    expectedAmount: 557228,
    difference: 227772,
    discrepancyType: "WRONG_ZONE",
    explanation:
      "The Surat Jalan proves Semarang as the destination, but the invoice uses the higher Surabaya rate matrix.",
    formula: "Semarang contract base versus Surabaya invoiced base",
    auditTrail: "10:14:05  SYSTEM_RECONCILE_ENGINE  Flagged WRONG_ZONE",
    sampleBBox: "Surat Jalan page 1 / destination / confidence 98.8%",
  },
  {
    id: "QUANTITY_MISMATCH",
    name: "POD quantity mismatch",
    badge: "REVIEW",
    badgeVariant: "warning",
    route: "Bandung to Jakarta, industrial FMCG",
    billedAmount: 850000,
    expectedAmount: 850000,
    difference: 0,
    discrepancyType: "QUANTITY_MISMATCH",
    explanation:
      "The invoice charges 25 cartons while the signed POD records 21 received cartons.",
    formula: "25 billed cartons minus 21 received cartons = 4 pending credit",
    auditTrail: "10:14:08  SYSTEM_RECONCILE_ENGINE  Sent to human review",
    sampleBBox: "POD page 1 / received quantity / confidence 96.2%",
  },
];

interface InteractiveSimulatorProps {
  onLaunchApp: () => void;
}
export function InteractiveSimulator({
  onLaunchApp,
}: InteractiveSimulatorProps) {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const formatIDR = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  const isMatch = selectedScenario.badgeVariant === "success";
  return (
    <section
      id="interactive-demo"
      className="relative overflow-hidden bg-[#F7F9FB] py-32 md:py-44"
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="grid items-end gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold tracking-[.16em] text-[#0077CC]">
              SEE THE TRACE
            </p>
            <h2 className="mt-7 font-display text-5xl leading-[.98] tracking-tight text-[#12203A] md:text-7xl">
              Watch one charge become a clear decision.
            </h2>
          </div>
          <p className="max-w-xl justify-self-end text-lg leading-8 text-[#55637A]">
            Choose a case. The interface follows the same path your reviewer
            sees: evidence, rules, and a decision that can be explained.
          </p>
        </div>
        <div className="mt-16 grid gap-5 lg:grid-cols-[260px_1fr]">
          <div className="space-y-2">
            {SCENARIOS.map((scenario, index) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => setSelectedScenario(scenario)}
                className={`group flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-all ${selectedScenario.id === scenario.id ? "bg-[#243A5E] text-white shadow-[0_16px_36px_rgba(36,58,94,.18)]" : "bg-white text-[#55637A] hover:bg-[#E6EEF5]"}`}
              >
                <span
                  className={`font-mono text-xs ${selectedScenario.id === scenario.id ? "text-[#8FD7D4]" : "text-[#7C879C]"}`}
                >
                  0{index + 1}
                </span>
                <span className="text-sm font-semibold">{scenario.name}</span>
                <ArrowUpRight
                  className={`ml-auto h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${selectedScenario.id === scenario.id ? "text-[#8FD7D4]" : "text-[#7C879C]"}`}
                />
              </button>
            ))}
          </div>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#E6EEF5] p-5 shadow-[0_24px_70px_rgba(36,58,94,.10)] md:p-8">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-[#0077CC]/20" />
            <div className="relative grid gap-5 md:grid-cols-[1.1fr_.9fr]">
              <div>
                <div className="flex items-center justify-between border-b border-[#CDDBE8] pb-5">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#7C879C]">
                      Live case
                    </span>
                    <h3 className="mt-2 font-display text-3xl tracking-normal text-[#12203A]">
                      {selectedScenario.name}
                    </h3>
                    <p className="mt-1 text-sm text-[#55637A]">
                      {selectedScenario.route}
                    </p>
                  </div>
                  <span
                    className={`rounded-lg px-3 py-2 text-xs font-bold ${isMatch ? "bg-[#DFF5F4] text-[#007A78]" : "bg-[#FDECEF] text-[#A34457]"}`}
                  >
                    {selectedScenario.badge}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white p-4">
                    <span className="block text-[10px] uppercase tracking-wider text-[#7C879C]">
                      Billed
                    </span>
                    <strong className="mt-2 block text-base font-bold text-[#12203A] tabular-nums">
                      {formatIDR(selectedScenario.billedAmount)}
                    </strong>
                  </div>
                  <div className="rounded-2xl bg-[#DFF5F4] p-4">
                    <span className="block text-[10px] uppercase tracking-wider text-[#007A78]">
                      Expected
                    </span>
                    <strong className="mt-2 block text-base font-bold text-[#007A78] tabular-nums">
                      {formatIDR(selectedScenario.expectedAmount)}
                    </strong>
                  </div>
                  <div
                    className={`rounded-2xl p-4 ${selectedScenario.difference ? "bg-[#FDECEF] text-[#A34457]" : "bg-white text-[#55637A]"}`}
                  >
                    <span className="block text-[10px] uppercase tracking-wider">
                      Variance
                    </span>
                    <strong className="mt-2 block text-base font-bold tabular-nums">
                      {selectedScenario.difference
                        ? `+${formatIDR(selectedScenario.difference)}`
                        : "Rp 0"}
                    </strong>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#243A5E]">
                    <Calculator className="h-4 w-4 text-[#0077CC]" /> Rules
                    calculation
                  </div>
                  <p className="mt-4 font-mono text-xs leading-6 text-[#55637A]">
                    {selectedScenario.formula}
                  </p>
                </div>
                <p className="mt-5 max-w-xl text-sm leading-6 text-[#55637A]">
                  {selectedScenario.explanation}
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-2xl bg-[#243A5E] p-6 text-white">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      Evidence trail
                    </span>
                    <FileSearch className="h-5 w-5 text-[#8FD7D4]" />
                  </div>
                  <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4">
                    <span className="font-mono text-xs leading-6 text-[#DCE8F5]">
                      {selectedScenario.sampleBBox}
                    </span>
                  </div>
                  <div className="mt-5 flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8FD7D4]" />
                    <p className="text-xs leading-5 text-[#DCE8F5]">
                      Evidence is linked before a reviewer acts. No unsupported
                      value is silently promoted to truth.
                    </p>
                  </div>
                </div>
                <div className="mt-10 border-t border-white/15 pt-5">
                  <span className="text-[10px] uppercase tracking-widest text-[#8FD7D4]">
                    Audit ledger
                  </span>
                  <p className="mt-2 font-mono text-[11px] leading-5 text-[#DCE8F5]">
                    {selectedScenario.auditTrail}
                  </p>
                  <Button
                    onClick={onLaunchApp}
                    className="mt-6 w-full rounded-full bg-[#00B4B3] text-[#12203A] hover:bg-[#8FD7D4]"
                  >
                    Inspect in workspace{" "}
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
