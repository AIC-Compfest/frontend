"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, HelpCircle } from "lucide-react";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does the system ensure zero AI hallucination in financial calculations?",
      a: "Veriflow separates document understanding from financial decisions. Extraction supports review, while contract matching, tolerance checks, and reconciliation outcomes remain traceable and reproducible.",
    },
    {
      q: "Do our 3PL logistics vendors need to install any software or portal?",
      a: "No. 3PL vendors continue their existing workflow by submitting standard PDF invoices, warehouse Surat Jalan scans, and smartphone POD photos via email or SFTP. When our system flags an overcharge, the Accounts Payable team generates an Official 3PL Dispute Claim Memo (PDF + JSON) citing specific MSA contractual clauses to send directly back to the vendor.",
    },
    {
      q: "How does the system handle blurry or rotated smartphone photos of PODs?",
      a: "The document workflow is designed for imperfect PDFs, scans, and phone captures. Low-confidence fields remain visible for human review instead of being silently guessed.",
    },
    {
      q: "What is the speed and latency profile of the reconciliation engine?",
      a: "The current demo is grounded in a synthetic reconciliation test set. Production performance depends on document quality, integrations, and review policy, so we present benchmark results as engineering evidence rather than a universal promise.",
    },
    {
      q: "How is audit immutability and compliance maintained?",
      a: "Every single human decision (Approve, Dispute, Reject) is permanently recorded in an append-only PostgreSQL ledger with millisecond UTC timestamps, reviewer identities, assigned roles, and mandatory audit reasons. Database triggers prevent any UPDATE or DELETE operations on the audit trail table.",
    },
  ];

  return (
    <section id="faq" className="py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider font-bold">
            Frequently Asked Questions
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#243A5E] tracking-tight">
            Everything You Need to Know
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Technical architecture, integration details, and enterprise compliance questions answered.
          </p>
        </div>

        {/* Accordion FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200/90 bg-slate-50/60 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-[#243A5E] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-[#5F86A6] shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#243A5E]" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
