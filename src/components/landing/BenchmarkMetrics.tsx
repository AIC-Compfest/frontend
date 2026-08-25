"use client";
import React from "react";
import {
  ArrowUpRight,
  Check,
  Fingerprint,
  Layers3,
  ShieldCheck,
} from "lucide-react";

export function BenchmarkMetrics() {
  const metrics = [
    ["20 / 20", "ground-truth cases resolved"],
    ["13", "reconciliation checks"],
    ["0.00%", "false auto-approval rate"],
  ];
  return (
    <section
      id="benchmarks"
      className="relative overflow-hidden bg-[#243A5E] py-32 text-white md:py-44"
    >
      <div className="absolute inset-0 opacity-20 hero-grid" />
      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <p className="text-sm font-semibold tracking-[.16em] text-[#8FD7D4]">
              PROOF OVER PROMISES
            </p>
            <h2 className="mt-7 font-display text-5xl leading-[.98] tracking-tight md:text-7xl">
              The safety case is visible.
            </h2>
            <p className="mt-8 max-w-sm text-base leading-7 text-[#DCE8F5]">
              Veriflow measures what matters to a finance reviewer: whether a
              decision is supported, reproducible, and safe to act on.
            </p>
            {/* <a
              href="#interactive-demo"
              className="mt-10 inline-flex items-center text-sm font-semibold text-[#8FD7D4]"
            >
              See the live calculation <ArrowUpRight className="ml-2 h-4 w-4" />
            </a> */}
          </div>
          <div className="grid grid-flow-dense grid-cols-1 gap-4 md:grid-cols-2">
            <article className="relative overflow-hidden rounded-[2rem] bg-[#174C84] p-8 md:col-span-2">
              <Layers3 className="h-7 w-7 text-[#8FD7D4]" />
              <strong className="mt-12 block font-display text-6xl tracking-normal text-white">
                Evidence first.
              </strong>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#DCE8F5]">
                Every result is a chain of extracted fields, contract rules,
                calculations, and reviewer action.
              </p>
              <span className="absolute -right-10 -top-20 text-[18rem] font-bold leading-none text-white/5">
                /
              </span>
            </article>
            {metrics.map(([value, label], index) => (
              <article
                key={label}
                className="group rounded-[2rem] border border-white/15 bg-white/8 p-7 transition-transform duration-500 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#8FD7D4]">
                    0{index + 1}
                  </span>
                  {/* <ArrowUpRight className="h-4 w-4 text-white/45 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /> */}
                </div>
                <strong className="mt-12 block font-display text-4xl tracking-tight">
                  {value}
                </strong>
                <p className="mt-3 text-sm leading-6 text-[#DCE8F5]">{label}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="mt-16 grid gap-4 border-t border-white/15 pt-6 text-sm text-[#DCE8F5] sm:grid-cols-3">
          <span className="flex items-center gap-3">
            <Fingerprint className="h-5 w-5 text-[#8FD7D4]" /> Source-linked
            fields
          </span>
          <span className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#8FD7D4]" /> Human decision
            authority
          </span>
          <span className="flex items-center gap-3">
            <Check className="h-5 w-5 text-[#8FD7D4]" /> Reproducible
            calculations
          </span>
        </div>
      </div>
    </section>
  );
}
