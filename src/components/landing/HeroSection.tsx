"use client";

import React from "react";
import Image from "next/image";
import { ArrowDownRight, ArrowUpRight, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps { onLaunchApp: () => void; }

export function HeroSection({ onLaunchApp }: HeroSectionProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#E6EEF5] pt-20 pb-24 md:pt-28 md:pb-40">
      <div className="absolute inset-0 pointer-events-none hero-grid" />
      <Image src="/polygon-asymmetric.svg" alt="" width={574} height={574} className="hero-polygon hero-polygon-left" aria-hidden="true" />
      <Image src="/polygon-symmetric.svg" alt="" width={539} height={539} className="hero-polygon hero-polygon-right" aria-hidden="true" />
      <div className="relative z-10 mx-auto grid max-w-[1440px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)] lg:px-12">
        <div className="max-w-4xl">
          <p className="hero-reveal mb-8 text-sm font-semibold tracking-[0.16em] text-[#0077CC]">THE VERIFLOW OPERATING LAYER</p>
          <h1 className="hero-reveal hero-reveal-delay-1 font-display max-w-6xl text-[clamp(3.4rem,6.6vw,7.25rem)] leading-[.92] tracking-tight text-[#12203A] text-balance">From disconnected documents to <span className="text-[#0077CC]">verified transactions.</span></h1>
          <p className="hero-reveal hero-reveal-delay-2 mt-9 max-w-[58ch] text-lg leading-8 text-[#55637A] md:text-xl">Veriflow gives 3PL finance teams one visual trail from billed amount to source document, contracted rate, and human decision.</p>
          <div className="hero-reveal hero-reveal-delay-3 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={onLaunchApp} size="lg" className="group h-14 rounded-full bg-[#243A5E] px-7 text-white shadow-[0_18px_42px_rgba(36,58,94,.22)] transition-transform hover:-translate-y-1 hover:bg-[#174C84] active:translate-y-0">Open reviewer workspace <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></Button>
            <a href="#how-it-works" className="inline-flex h-14 items-center justify-center rounded-full px-6 text-sm font-semibold text-[#243A5E] transition-colors hover:bg-white/70">See how evidence connects <ArrowDownRight className="ml-2 h-4 w-4" /></a>
          </div>
        </div>
        <div className="hero-reveal hero-reveal-delay-2 relative min-h-[530px] lg:min-h-[620px]">
          <div className="audit-orbit absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#0077CC]/20" />
          <div className="audit-orbit audit-orbit-slow absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#00B4B3]/25" />
          <div className="relative z-10 mx-auto mt-8 max-w-[480px] rotate-[3deg] rounded-[2rem] border border-white/80 bg-white/85 p-3 shadow-[0_35px_90px_rgba(36,58,94,.18)] backdrop-blur-xl transition-transform duration-700 hover:rotate-0">
            <div className="rounded-[1.45rem] bg-[#F7F9FB] p-5 sm:p-7">
              <div className="flex items-center justify-between border-b border-[#CDDBE8] pb-5"><div><span className="font-mono text-[10px] uppercase tracking-[.18em] text-[#7C879C]">Review case</span><strong className="mt-1 block text-lg text-[#12203A]">INV-2408-019</strong></div><span className="flex items-center gap-1.5 text-xs font-semibold text-[#007A78]"><span className="h-2 w-2 rounded-full bg-[#00B4B3]" /> Evidence linked</span></div>
              <div className="mt-7 rounded-2xl border border-[#CDDBE8] bg-white p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6EEF5] text-[#0077CC]"><FileText className="h-5 w-5" /></span><div><strong className="block text-sm text-[#12203A]">Fuel surcharge</strong><span className="text-xs text-[#7C879C]">Invoice against rate agreement</span></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#F7F9FB] p-3"><span className="block text-[10px] uppercase tracking-wider text-[#7C879C]">Billed</span><strong className="mt-1 block text-lg font-bold text-[#12203A]">18%</strong></div><div className="rounded-xl bg-[#DFF5F4] p-3"><span className="block text-[10px] uppercase tracking-wider text-[#007A78]">Contract</span><strong className="mt-1 block text-lg font-bold text-[#007A78]">14%</strong></div></div></div>
              <div className="mt-4 rounded-2xl bg-[#243A5E] p-5 text-white"><div className="flex items-center justify-between"><span className="text-sm text-[#DCE8F5]">Decision path</span><span className="font-mono text-xs text-[#8FD7D4]">3 / 3</span></div><div className="mt-4 flex items-center gap-2 text-xs"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00B4B3] text-[#12203A]"><Check className="h-4 w-4" /></span><span>Document evidence</span><i className="h-px flex-1 bg-white/20" /><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00B4B3] text-[#12203A]"><Check className="h-4 w-4" /></span><span>Human review</span></div></div>
            </div>
          </div>
          <div className="hero-float-card absolute bottom-0 left-0 z-20 max-w-[210px] rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_18px_40px_rgba(36,58,94,.16)] backdrop-blur-xl"><span className="font-mono text-[10px] uppercase tracking-widest text-[#7C879C]">Recoverable</span><strong className="mt-1 block text-2xl text-[#243A5E]">Rp 196.769</strong><span className="mt-1 block text-xs text-[#007A78]">Exception surfaced before approval</span></div>
        </div>
      </div>
    </section>
  );
}
