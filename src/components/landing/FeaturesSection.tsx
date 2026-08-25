"use client";
import React from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  Calculator,
  FileCheck2,
  FileSearch,
  PenTool,
} from "lucide-react";

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-[#F7F9FB] py-20 md:py-28"
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="grid items-end gap-10 lg:grid-cols-[.86fr_1.14fr]">
          <h2 className="font-display max-w-2xl text-5xl leading-[.98] tracking-tight text-[#12203A] md:text-7xl">
            The work behind a confident approval.
          </h2>
          <h3 className="max-w-xl justify-self-end text-2xl leading-8 text-[#55637A]">
            The product is designed around the moment an operations team has to
            answer one question:{" "}
            <span className="font-bold">can this charge be trusted?</span>
          </h3>
        </div>

        <div className="mt-12 grid grid-flow-dense grid-cols-1 gap-5 md:grid-cols-12">
          <article
            className="group relative min-h-[360px] overflow-hidden rounded-[2rem] bg-[#243A5E] p-8 text-white md:col-span-8 md:row-span-2 md:p-12"
            onClick={() => (window.location.href = "#interactive-demo")}
            style={{ cursor: "pointer" }}
          >
            <Image
              src="/polygon-symmetric.svg"
              alt=""
              aria-hidden="true"
              width={539}
              height={539}
              className="absolute -right-20 -top-24 w-[430px] opacity-30 transition-transform duration-1000 group-hover:rotate-12 group-hover:scale-110"
            />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <FileSearch className="h-8 w-8 text-[#8FD7D4]" />
                <h3 className="mt-14 max-w-lg font-display text-4xl leading-[1.02] tracking-normal md:text-6xl">
                  Evidence stays attached to the decision.
                </h3>
              </div>

              <div className="mt-10 flex items-end justify-between gap-6">
                <p className="max-w-sm text-sm leading-6 text-[#DCE8F5]">
                  Move from a discrepancy to the source field without losing the
                  context around it.
                </p>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00B4B3] text-[#12203A] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>
            </div>
          </article>

          <article className="group relative min-h-[218px] overflow-hidden rounded-[2rem] border border-[#CDDBE8] bg-white p-8 md:col-span-4 md:p-9">
            <Calculator className="h-7 w-7 text-[#0077CC]" />
            <h3 className="mt-4 text-2xl font-semibold tracking-[-.03em] text-[#12203A]">
              Rules handle the money.
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#55637A]">
              Rates, surcharges, tax, and tolerance checks stay reproducible.
            </p>
            <span className="absolute bottom-8 right-8 text-4xl font-bold text-[#E6EEF5]">
              01
            </span>
          </article>
          <article className="group relative min-h-[218px] overflow-hidden rounded-[2rem] bg-[#DFF5F4] p-8 md:col-span-4 md:p-9">
            <PenTool className="h-7 w-7 text-[#007A78]" />
            <h3 className="mt-4 text-2xl font-semibold tracking-[-.03em] text-[#12203A]">
              Humans keep authority.
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#366C6B]">
              The system prioritizes uncertainty. Your reviewer makes the call.
            </p>
            <span className="absolute bottom-8 right-8 text-4xl font-bold text-white/80">
              02
            </span>
          </article>
          <article className="group relative min-h-[218px] overflow-hidden rounded-[2rem] border border-[#CDDBE8] bg-[#E6EEF5] p-8 md:col-span-12 md:p-9">
            <FileCheck2 className="h-7 w-7 text-[#174C84]" />
            <h3 className="mt-4 text-2xl font-semibold tracking-[-.03em] text-[#12203A]">
              Exceptions become action.
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#55637A]">
              Turn a confirmed overcharge into an evidence-backed dispute
              package.
            </p>
            <span className="absolute bottom-8 right-8 text-4xl font-bold text-white/90">
              03
            </span>
          </article>
        </div>
      </div>
    </section>
  );
}
