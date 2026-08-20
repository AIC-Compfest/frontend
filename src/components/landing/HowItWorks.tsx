import React from "react";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, Eye, GitCompare, FileCheck } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: UploadCloud,
      title: "Automated Ingestion",
      description:
        "3PL Invoices, warehouse Surat Jalan PDFs, smartphone POD photos, and Rate Agreements are ingested with SHA-256 deduplication and secure cloud storage.",
    },
    {
      num: "02",
      icon: Eye,
      title: "Spatial AI Understanding",
      description:
        "Computer Vision deskews images, extracts multi-page line items, verifies wet signatures, and maps every value to visual Bounding Box coordinates.",
    },
    {
      num: "03",
      icon: GitCompare,
      title: "Deterministic 13-Check Audit",
      description:
        "Our compiled Go engine matches shipments across all 4 documents, recalculates base rates and fuel surcharges, and flags overcharges in 82.8 µs.",
    },
    {
      num: "04",
      icon: FileCheck,
      title: "Action & Legal Dispute Memo",
      description:
        "Accounts Payable approves valid invoices or generates an official 3PL dispute claim memo citing contract clauses to reclaim company money.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider font-bold">
            The 4-Step Pipeline
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#243A5E] tracking-tight">
            How Messy 3PL Documents Turn Into Audited Truth
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            From unstandardized scanned PDFs to legally backed dispute claim packages in four seamless stages.
          </p>
        </div>

        {/* 4 Steps Horizontal Flow */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 hover:bg-[#EDF4FA]/60 hover:border-[#8FB8D6] transition-all group relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#243A5E] text-white shadow-xs group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5 text-[#8FB8D6]" />
                  </div>
                  <span className="text-2xl font-black text-slate-300 font-tabular font-mono">
                    {s.num}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#243A5E] transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
