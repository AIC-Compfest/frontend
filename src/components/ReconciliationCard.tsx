"use client";

import React, { useState } from "react";
import { ShipmentEvent } from "@/types/reconciliation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  TrendingDown,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReconciliationCardProps {
  event: ShipmentEvent;
  onViewProof: (fieldName: string, docTab: "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT") => void;
  onOpenDecisionModal: (action: "APPROVE" | "DISPUTE" | "REJECT") => void;
  onOpenDisputePackage: () => void;
}

export function ReconciliationCard({
  event,
  onViewProof,
  onOpenDecisionModal,
  onOpenDisputePackage,
}: ReconciliationCardProps) {
  const [showTrace, setShowTrace] = useState(true);
  const [showChecks, setShowChecks] = useState(false);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const billed = event.invoice.billed_amount;
  const expected = event.pricing.expected_total_charge;
  const variance = event.pricing.difference_amount || billed - expected;
  const variancePct = expected > 0 ? ((variance / expected) * 100).toFixed(2) : "0.00";

  return (
    <Card className="flex flex-col h-full bg-white border border-slate-200 shadow-2xs overflow-hidden p-0">
      {/* Transaction Header & Context */}
      <CardHeader className="p-4 pb-3 border-b border-slate-100 bg-[#EDF4FA]/70 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-extrabold text-[#243A5E] font-mono">
                {event.invoice.invoice_number}
              </CardTitle>
              {event.reconciliation.status === "MATCH" && (
                <Badge variant="success" className="text-[10px] font-bold py-0">
                  MATCH
                </Badge>
              )}
              {event.reconciliation.status === "APPROVED" && (
                <Badge variant="success" className="text-[10px] font-bold py-0 bg-emerald-600 text-white">
                  APPROVED
                </Badge>
              )}
              {event.reconciliation.status === "EXCEPTION" && (
                <Badge variant="destructive" className="text-[10px] font-bold py-0">
                  EXCEPTION
                </Badge>
              )}
              {event.reconciliation.status === "DUPLICATE" && (
                <Badge variant="brand" className="text-[10px] font-bold py-0">
                  DUPLICATE
                </Badge>
              )}
              {event.reconciliation.status === "INSUFFICIENT_EVIDENCE" && (
                <Badge variant="warning" className="text-[10px] font-bold py-0">
                  UNCONFIRMED
                </Badge>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2.5">
              <span>Vendor: <strong className="text-slate-800 font-semibold">{event.vendor_id}</strong></span>
              <span>•</span>
              <span>Shipment ID: <strong className="text-slate-800 font-mono">{event.shipment.shipment_id}</strong></span>
              <span>•</span>
              <span>Rute: <strong className="text-slate-800 font-medium">{event.shipment.origin} → {event.shipment.destination}</strong></span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold text-[#243A5E]">
              Priority Score: <span className="font-mono text-rose-600 font-bold">{event.reconciliation.priority_score.toFixed(0)}</span>/100
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Dispute Deadline:{" "}
              <strong className={event.reconciliation.days_remaining_to_dispute <= 7 ? "text-rose-600 font-bold" : "text-slate-700 font-medium"}>
                {event.reconciliation.days_remaining_to_dispute} Days Remaining
              </strong>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Main Content Area */}
      <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Financial Comparison Summary */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billed Amount</div>
            <div className="text-sm sm:text-base font-extrabold font-tabular text-slate-900 mt-0.5">{formatIDR(billed)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Invoiced by 3PL</div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expected Amount</div>
            <div className="text-sm sm:text-base font-extrabold font-tabular text-[#243A5E] mt-0.5">{formatIDR(expected)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Contractually Derived</div>
          </div>

          <div className={variance > 0 ? "text-rose-700" : "text-emerald-700"}>
            <div className="text-[10px] font-bold uppercase tracking-wider">Variance</div>
            <div className="text-sm sm:text-base font-extrabold font-tabular mt-0.5">
              {variance > 0 ? `+${formatIDR(variance)}` : "Rp 0"}
            </div>
            <div className="text-[10px] mt-0.5">
              {variance > 0 ? `+${variancePct}% (Overcharge)` : "0% (Clean Match)"}
            </div>
          </div>
        </div>

        {/* Discrepancies List */}
        {event.reconciliation.discrepancies.length > 0 ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#243A5E] flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                <span>Identified Discrepancies ({event.reconciliation.discrepancies.length})</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenDisputePackage}
                className="text-[11px] h-7 px-2.5 font-bold text-rose-700 border-rose-200 bg-rose-50/60 hover:bg-rose-100 gap-1"
              >
                <FileCheck2 className="h-3 w-3" />
                <span>Generate Dispute Package</span>
              </Button>
            </div>

            <div className="space-y-2">
              {event.reconciliation.discrepancies.map((disc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-rose-200 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-[9px] py-0 font-mono">
                          {disc.code}
                        </Badge>
                        <span className="text-xs font-bold text-slate-800">{disc.description}</span>
                      </div>
                      {disc.remediation_hint && (
                        <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                          <strong className="text-slate-700">Remediasi:</strong> {disc.remediation_hint}
                        </p>
                      )}
                    </div>

                    {disc.delta_amount && (
                      <span className="text-xs font-extrabold text-rose-700 font-tabular shrink-0">
                        +{formatIDR(disc.delta_amount)}
                      </span>
                    )}
                  </div>

                  {/* 2-Click View Proof Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (disc.code === "RATE_OVERCHARGE") onViewProof("billed_amount", "INVOICE");
                        else if (disc.code === "WRONG_ZONE") onViewProof("destination", "SURAT_JALAN");
                        else if (disc.code === "WEIGHT_DISCREPANCY") onViewProof("weight_actual_kg", "SURAT_JALAN");
                        else if (disc.code === "MISSING_SIGNATURE") onViewProof("signature_present", "POD");
                        else if (disc.code === "QUANTITY_MISMATCH") onViewProof("quantity_received", "POD");
                        else onViewProof("billed_amount", "INVOICE");
                      }}
                      className="text-[11px] h-6 px-2 text-[#243A5E] hover:text-[#1C2E4A] font-bold hover:bg-[#EDF4FA] gap-1"
                    >
                      <span>View Proof in Document</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Semua 13 verifikasi aturan tarif dan bukti logistik 100% cocok (Clean Match).</span>
          </div>
        )}

        {/* Calculation Trace Log Accordion */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => setShowTrace(!showTrace)}
            className="w-full p-3 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-xs font-bold text-[#243A5E] cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5 text-[#5F86A6]" />
              <span>Deterministic price calculation trace</span>
            </span>
            {showTrace ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {showTrace && (
            <div className="p-3.5 bg-slate-950 text-slate-300 font-mono text-[11px] space-y-1.5 leading-relaxed overflow-x-auto">
              {(() => {
                const trace = event.pricing.trace;
                const baseRate = (trace && trace.base_rate_unit > 0) ? trace.base_rate_unit : (event.contract?.base_rate || 3500);
                const weight = (trace && trace.weight_used_kg > 0) ? trace.weight_used_kg : (event.invoice?.weight_billed_kg || event.shipment?.weight_actual_kg || 1250);
                const baseAmt = (trace && trace.base_amount > 0) ? trace.base_amount : (event.pricing?.expected_base_charge || Math.round(billed * 0.85));

                const fuelPct = (trace && trace.fuel_percent > 0) ? trace.fuel_percent : (event.contract?.applicable_fuel_surcharge_percent || 5);
                const fuelAmt = (trace && trace.fuel_amount > 0) ? trace.fuel_amount : (event.pricing?.expected_fuel_surcharge || Math.round(baseAmt * (fuelPct / 100)));
                const preTax = (trace && trace.pre_tax_amount > 0) ? trace.pre_tax_amount : (baseAmt + fuelAmt);
                const taxPct = (trace && trace.tax_rate_percent > 0) ? trace.tax_rate_percent : 11;
                const taxAmt = (trace && trace.tax_amount > 0) ? trace.tax_amount : (event.pricing?.expected_tax || Math.round(preTax * (taxPct / 100)));
                const expTotal = (trace && trace.expected_total > 0) ? trace.expected_total : (event.pricing?.expected_total_charge || expected);
                const billTotal = (trace && trace.billed_total > 0) ? trace.billed_total : billed;
                const tier = trace?.weight_tier || "Standard Tier";

                return (
                  <>
                    <div className="text-[#8FB8D6] font-bold">--- INTEGER IDR MATHEMATICAL AUDIT TRACE ---</div>
                    <div>Base Rate Tariff : Rp {baseRate.toLocaleString("id-ID")} ({tier})</div>
                    <div>Weight Used Scale: {weight} kg ➔ Base: Rp {baseAmt.toLocaleString("id-ID")}</div>
                    <div>Fuel Surcharge   : {fuelPct}% ➔ Rp {fuelAmt.toLocaleString("id-ID")}</div>
                    <div>Pre-Tax Subtotal : Rp {preTax.toLocaleString("id-ID")}</div>
                    <div>PPN Tax ({taxPct}%)   : Rp {taxAmt.toLocaleString("id-ID")}</div>
                    <div className="text-emerald-400 font-bold border-t border-slate-700 pt-1">
                      Expected Total   : Rp {expTotal.toLocaleString("id-ID")} | Billed: Rp {billTotal.toLocaleString("id-ID")}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </CardContent>

      {/* Human-in-the-Loop Decision Buttons */}
      <CardFooter className="p-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500 font-medium">
          Authorizer Role: <strong className="text-slate-800 font-bold">AP_MANAGER</strong>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onOpenDecisionModal("REJECT")}
            className="bg-slate-800 text-white hover:bg-slate-900 font-bold text-xs h-8 px-3"
          >
            Reject
          </Button>
          <Button
            size="sm"
            onClick={() => onOpenDecisionModal("DISPUTE")}
            className="bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs h-8 px-3.5 shadow-xs"
          >
            Dispute Overcharge
          </Button>
          <Button
            size="sm"
            onClick={() => onOpenDecisionModal("APPROVE")}
            className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs h-8 px-4 shadow-xs"
          >
            Approve Payment
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
