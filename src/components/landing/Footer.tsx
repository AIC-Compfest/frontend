import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import VeriflowLogo from "../logo/VeriflowLogo";

export function Footer() {
  return (
    <footer className="bg-[#E6EEF5] pt-24 md:pt-32">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#243A5E] p-8 text-white md:p-14">
          <div className="absolute -right-20 -top-32 h-[420px] w-[420px] rounded-full border border-[#8FD7D4]/20" />
          <div className="absolute -right-6 -top-20 h-[260px] w-[260px] rounded-full border border-[#8FD7D4]/20" />
          <div className="relative z-10 max-w-3xl">
            <p className="text-sm font-semibold tracking-[.16em] text-[#8FD7D4]">
              READY WHEN YOU ARE
            </p>
            <h2 className="mt-7 font-display text-5xl leading-[.98] tracking-normal md:text-7xl">
              Make the next payment easier to defend.
            </h2>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/dashboard"
                className="inline-flex h-14 items-center justify-center rounded-full bg-[#00B4B3] px-7 text-sm font-semibold text-[#12203A] transition-transform hover:-translate-y-1"
              >
                Open reviewer workspace{" "}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
              <a
                href="#faq"
                className="inline-flex h-14 items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Read the answers
              </a>
            </div>
          </div>
        </div>
        <div className="grid gap-10 py-14 md:grid-cols-[1.4fr_.6fr_.6fr] md:py-20">
          <div>
            <VeriflowLogo />
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#55637A]">
              Evidence-led reconciliation for 3PL finance and operations teams.
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[.16em] text-[#7C879C]">
              Explore
            </span>
            <div className="mt-5 space-y-3 text-sm text-[#243A5E]">
              <a className="block hover:text-[#0077CC]" href="#features">
                Features
              </a>
              <a className="block hover:text-[#0077CC]" href="#how-it-works">
                How it works
              </a>
              <a className="block hover:text-[#0077CC]" href="#benchmarks">
                Benchmark & Proof
              </a>
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[.16em] text-[#7C879C]">
              Workspace
            </span>
            <div className="mt-5 space-y-3 text-sm text-[#243A5E]">
              <Link className="block hover:text-[#0077CC]" href="/login">
                Sign In
              </Link>
              <Link className="block hover:text-[#0077CC]" href="/register">
                Create account
              </Link>
              <Link className="block hover:text-[#0077CC]" href="/dashboard">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#CDDBE8] py-6 text-xs text-[#7C879C] sm:flex-row sm:items-center sm:justify-between">
          <span>
            © 2026 LogiRecon AI • Built for COMPFEST 18 AI Innovation Challenge
            (Smart Logistics).
          </span>
          <span>Evidence, rules, and human review.</span>
        </div>
      </div>
    </footer>
  );
}
