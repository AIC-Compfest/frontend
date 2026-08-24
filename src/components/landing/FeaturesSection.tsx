"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileSearch,
  Calculator,
  PenTool,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: FileSearch,
      badge: "EVIDENCE-FIRST PROVENANCE",
      title: "100% Spatial Bounding Box Provenance",
      description:
        "Every extracted fact, from shipment dates to billed charges, can be linked to source evidence. When reviewing a discrepancy, one click takes the reviewer to the relevant proof.",
      metric: "Zero Hallucination Guarantee",
      color: "from-blue-500/10 to-indigo-500/5",
      borderColor: "border-blue-200",
    },
    {
      icon: Calculator,
      badge: "DETERMINISTIC FINANCIAL CORE",
      title: "Pure Integer IDR Pricing & 13 Verification Checks",
      description:
        "No LLMs are ever used for money calculation. Our Go Engine executes pure deterministic integer arithmetic with 11% PPN tax, fuel surcharge percentages, and origin-destination rate matrix lookups, delivering sub-millisecond precision.",
      metric: "Source-linked reconciliation",
      color: "from-emerald-500/10 to-teal-500/5",
      borderColor: "border-emerald-200",
    },
    {
      icon: PenTool,
      badge: "COMPUTER VISION VERIFICATION",
      title: "Multi-Signal Wet Signature & Stamp Presence",
      description:
        "POD delivery slips captured via smartphone cameras are automatically analyzed using stroke density, morphological contours, and color-space segmentation to verify official stamps and receiver signatures before any invoice is approved.",
      metric: "Protects Against Fictitious Deliveries",
      color: "from-amber-500/10 to-orange-500/5",
      borderColor: "border-amber-200",
    },
    {
      icon: FileSpreadsheet,
      badge: "LEGAL CLAIM AUTOMATION",
      title: "1-Click Official 3PL Dispute Package Generator",
      description:
        "When an overcharge is confirmed, the system automatically generates an Official 3PL Invoice Dispute Claim Memo citing Master Service Agreement (MSA) legal clauses, calculation trace logs, and exportable ERP JSON payloads.",
      metric: "Export Printable PDF + ERP JSON",
      color: "from-rose-500/10 to-pink-500/5",
      borderColor: "border-rose-200",
    },
  ];

  return (
    <section id="features" className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider font-bold">
            Core Architectural Moat
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#243A5E] tracking-tight">
            Built for Financial Auditability, Not Just Optical Character Recognition
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            Standard OCR only extracts text. <strong>Veriflow</strong> connects logistics documents, contract terms, and financial decisions so teams can act with confidence.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card
                key={i}
                className="overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-all hover:border-[#8FB8D6] bg-white group"
              >
                <div className={`p-6 sm:p-8 bg-gradient-to-br ${f.color} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#243A5E] text-white shadow-xs group-hover:scale-105 transition-transform">
                      <Icon className="h-6 w-6 text-[#8FB8D6]" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono font-bold bg-white text-slate-700">
                      {f.badge}
                    </Badge>
                  </div>

                  <div className="space-y-2 pt-2">
                    <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-[#243A5E] transition-colors">
                      {f.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600 leading-relaxed">
                      {f.description}
                    </CardDescription>
                  </div>

                  <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#243A5E]">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{f.metric}</span>
                    </div>
                    <span className="text-slate-400 group-hover:text-[#243A5E] transition-colors font-semibold flex items-center gap-1">
                      Learn More <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
