"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Check, Sparkles, ArrowRight, HelpCircle } from "lucide-react";

interface PricingSectionProps {
  onLaunchApp: () => void;
}

export function PricingSection({ onLaunchApp }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");

  const plans = [
    {
      name: "Pilot Starter",
      tagline: "For mid-size logistics teams evaluating AI reconciliation",
      priceMonthly: "Rp 4.500.000",
      priceAnnual: "Rp 3.600.000",
      period: "/ month",
      isPopular: false,
      features: [
        "Up to 1,500 shipments audited / month",
        "4 Standard Document Extractor Models",
        "Prioritized Review Queue with KPI Strip",
        "Interactive Dual-Pane Evidence Viewer",
        "Printable 3PL Dispute Packages (PDF)",
        "Standard Email & Community Support",
      ],
      buttonText: "Start 14-Day Free Pilot",
      buttonVariant: "outline" as const,
    },
    {
      name: "Growth Enterprise",
      tagline: "For high-volume shippers with complex multi-3PL contracts",
      priceMonthly: "Rp 14.500.000",
      priceAnnual: "Rp 11.600.000",
      period: "/ month",
      isPopular: true,
      badge: "MOST POPULAR",
      features: [
        "Up to 25,000 shipments audited / month",
        "Multi-Signal Signature & Stamp Detection",
        "Automated Rate Card & Addendum Matrix Compiler",
        "1-Click ERP JSON & Signed PDF Dispute Claim Export",
        "Append-Only Immutable PostgreSQL Audit Trail",
        "Supabase Private Cloud Storage & Dedicated API",
        "Priority 24/7 Support with 1-Hour SLA",
      ],
      buttonText: "Deploy Enterprise Workspace",
      buttonVariant: "default" as const,
    },
    {
      name: "Custom Logistics Scale",
      tagline: "For massive retail, FMCG, and ecommerce freight volumes",
      priceMonthly: "Custom",
      priceAnnual: "Custom",
      period: "based on volume",
      isPopular: false,
      features: [
        "Unlimited monthly shipment reconciliation",
        "Direct SAP S/4HANA & Oracle SCM Connector",
        "Dedicated On-Premise or Private VPC GPU Inference",
        "Custom OCR Noise Fine-Tuning for Proprietary Formats",
        "Custom Role-Based Access Control (RBAC)",
        "Dedicated Account Executive & Solution Engineer",
      ],
      buttonText: "Contact Enterprise Sales",
      buttonVariant: "outline" as const,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider font-bold">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#243A5E] tracking-tight">
            Plans that Pay for Themselves in Recovered Overcharges
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Average customers reclaim over <strong>Rp 180.000.000+</strong> in unauthorized 3PL freight charges within their first 90 days.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span
              onClick={() => setBillingCycle("MONTHLY")}
              className={`text-sm font-semibold cursor-pointer ${
                billingCycle === "MONTHLY" ? "text-[#243A5E]" : "text-slate-500"
              }`}
            >
              Monthly Billing
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "MONTHLY" ? "ANNUAL" : "MONTHLY")}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#243A5E] transition-colors focus:outline-none"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  billingCycle === "ANNUAL" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span
              onClick={() => setBillingCycle("ANNUAL")}
              className={`text-sm font-semibold cursor-pointer flex items-center gap-1.5 ${
                billingCycle === "ANNUAL" ? "text-[#243A5E]" : "text-slate-500"
              }`}
            >
              <span>Annual Billing</span>
              <Badge variant="success" className="text-[10px] py-0 px-1.5 font-bold">
                SAVE 20%
              </Badge>
            </span>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((p, i) => (
            <Card
              key={i}
              className={`flex flex-col justify-between rounded-2xl bg-white transition-all ${
                p.isPopular
                  ? "border-2 border-[#243A5E] shadow-xl relative scale-102 lg:-translate-y-2"
                  : "border border-slate-200/90 shadow-sm hover:shadow-md"
              }`}
            >
              {p.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#243A5E] text-white text-[11px] font-bold tracking-wider flex items-center gap-1 shadow-sm">
                  <Sparkles className="h-3 w-3 text-[#8FB8D6]" />
                  <span>{p.badge}</span>
                </div>
              )}

              <CardHeader className="space-y-3 pb-6">
                <div>
                  <CardTitle className="text-xl font-extrabold text-slate-900">
                    {p.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    {p.tagline}
                  </CardDescription>
                </div>

                <div className="pt-2">
                  <span className="text-3xl sm:text-4xl font-black text-[#243A5E] font-tabular tracking-tight">
                    {billingCycle === "ANNUAL" ? p.priceAnnual : p.priceMonthly}
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-1">
                    {p.period}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Included Capabilities:
                </div>
                <ul className="space-y-2.5">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4 border-t border-slate-100">
                <Button
                  onClick={onLaunchApp}
                  variant={p.buttonVariant}
                  className={`w-full font-bold text-xs py-2.5 ${
                    p.isPopular ? "bg-[#243A5E] text-white hover:bg-[#1C2E4A]" : ""
                  }`}
                >
                  {p.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
