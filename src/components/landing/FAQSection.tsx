"use client";

import React, { useState } from "react";
import { Minus, Plus } from "lucide-react";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = [
    [
      "How does Veriflow handle financial calculations?",
      "Veriflow separates document understanding from financial decisions. Extraction supports review, while contract matching, tolerance checks, and reconciliation outcomes remain traceable and reproducible.",
    ],
    [
      "Do 3PL vendors need to install software?",
      "No. Vendors can continue submitting their existing PDF invoices, waybills, and POD photos. Your team reviews the connected evidence inside Veriflow.",
    ],
    [
      "What happens when a document is blurry or incomplete?",
      "Low-confidence fields remain visible for human review. Veriflow does not silently invent a value when evidence is insufficient.",
    ],
    [
      "How does the audit trail support a dispute?",
      "Approve, dispute, and reject actions are recorded with reviewer identity, reasons, source fields, and calculation context so the final package is easy to explain.",
    ],
    [
      "Can we start with one logistics workflow?",
      "Yes. The product can begin with invoice, POD, waybill, and rate agreement reconciliation before expanding to additional document types or teams.",
    ],
  ];
  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-[#F7F9FB] py-32 md:py-44"
    >
      <div className="mx-auto grid max-w-[1440px] gap-16 px-5 sm:px-8 lg:grid-cols-[.58fr_1.42fr] lg:px-12">
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <p className="text-sm font-semibold tracking-[.16em] text-[#0077CC]">
            FAQ
          </p>
          <h2 className="mt-7 max-w-md font-display text-5xl leading-[.98] tracking-tight text-[#12203A] md:text-7xl">
            A clearer guide to the workflow.
          </h2>
          <p className="mt-8 max-w-sm text-base leading-7 text-[#55637A]">
            Short answers for the people responsible for keeping payments
            accurate.
          </p>
        </div>
        <div className="border-t border-[#CDDBE8]">
          {faqs.map(([question, answer], index) => {
            const isOpen = openIndex === index;
            return (
              <div key={question} className="border-b border-[#CDDBE8]">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-5 py-7 text-left transition-colors hover:text-[#0077CC]"
                >
                  <span className="w-8 shrink-0 font-mono text-xs text-[#7C879C]">
                    0{index + 1}
                  </span>
                  <span className="flex-1 text-xl font-medium tracking-[-.03em] text-[#12203A] md:text-2xl">
                    {question}
                  </span>
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isOpen ? "bg-[#243A5E] text-white" : "bg-[#E6EEF5] text-[#243A5E]"}`}
                  >
                    {isOpen ? (
                      <Minus className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-8 pl-[52px] pr-16 text-base leading-7 text-[#55637A]">
                      {answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
