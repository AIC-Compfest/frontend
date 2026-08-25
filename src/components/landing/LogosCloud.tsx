"use client";
import React from "react";
import { ArrowRight } from "lucide-react";

export function LogosCloud() {
  const items = ["Invoices", "PODs", "Goods Delivery Note", "Rate Agreements", "Audit Trail", "Dispute Packages"];
  return <section className="overflow-hidden border-y border-[#CDDBE8] bg-white py-8"><div className="mx-auto flex max-w-[1440px] items-center gap-8 px-5 sm:px-8 lg:px-12"><div className="flex shrink-0 items-center gap-3 text-sm font-semibold text-[#243A5E]"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DFF5F4] text-[#007A78]"><ArrowRight className="h-4 w-4" /></span>One trace across the record</div><div className="min-w-0 overflow-hidden"><div className="marquee-track flex w-max items-center gap-10 text-sm text-[#7C879C]">{[...items, ...items].map((item, index) => <span key={`${item}-${index}`} className="flex items-center gap-10 whitespace-nowrap"><span>{item}</span><i className="h-1.5 w-1.5 rounded-full bg-[#00B4B3]" /></span>)}</div></div></div></section>;
}
