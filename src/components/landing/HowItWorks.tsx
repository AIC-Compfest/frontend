"use client";
import React from "react";
import Image from "next/image";
import { Eye, FileCheck, GitCompare, UploadCloud } from "lucide-react";

export function HowItWorks() {
  const steps = [
    [
      UploadCloud,
      "Bring the record together",
      "Invoices, PODs, waybills, and agreements enter one evidence stream.",
    ],
    [
      Eye,
      "Read what is actually there",
      "Document understanding extracts fields and keeps uncertainty visible.",
    ],
    [
      GitCompare,
      "Compare against the promise",
      "Shipment facts and contracted rates meet in a deterministic audit.",
    ],
    [
      FileCheck,
      "Leave with a decision",
      "Approve clean work or send a complete, traceable dispute package.",
    ],
  ] as const;
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-[#E6EEF5] py-20 md:py-28"
    >
      <div className="mx-auto grid max-w-[1440px] gap-16 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-12">
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <p className="text-sm font-semibold tracking-[.16em] text-[#0077CC]">
            A SINGLE TRACE
          </p>
          <h2 className="mt-7 font-display text-5xl leading-[.98] tracking-tight text-[#12203A] md:text-7xl">
            A messy document has a better ending.
          </h2>
          <p className="mt-8 max-w-sm text-base leading-7 text-[#55637A]">
            Each stage adds context until your team can see what happened, why
            it matters, and what to do next.
          </p>
          <Image
            src="/polygon-symmetric.svg"
            alt=""
            aria-hidden="true"
            width={800}
            height={800}
            className="hidden w-800 lg:absolute lg:-left-50 lg:top-100 lg:block"
          />
        </div>
        <div className="relative">
          {steps.map(([Icon, title, description], index) => (
            <article
              key={title}
              className="group relative grid min-h-[160px] grid-cols-[72px_1fr] gap-3 border-t border-[#CDDBE8] py-10 first:border-t-0 first:pt-0"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#0077CC] shadow-[0_12px_30px_rgba(36,58,94,.08)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-3">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-sm text-[#7C879C]">
                  0{index + 1}
                </span>
                <h3 className="mt-2 font-semibold text-2xl tracking-[-.04em] text-[#12203A] md:text-4xl">
                  {title}
                </h3>
                <p className="mt-5 max-w-lg text-base leading-7 text-[#55637A]">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
