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
    }).format(val || 0);
  };

  const billed = event?.invoice?.billed_amount || 0;
  const expected = event?.pricing?.expected_total_charge || 0;
  const variance = (billed - expected) !== 0 
    ? (billed - expected) 
    : (event?.pricing?.difference_amount ?? 0);
  const absVariance = Math.abs(variance);
  const variancePct = expected > 0 ? ((absVariance / expected) * 100).toFixed(2) : "0.00";
  const discrepancies = event?.reconciliation?.discrepancies || [];

  return (
    <Card className="flex flex-col h-full bg-white border border-slate-200 shadow-2xs overflow-hidden p-0">
      {/* Transaction Header - Minimal */}
      <CardHeader className="p-4 pb-3 border-b border-slate-200 bg-white space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-extrabold text-slate-900 font-mono">
              {event?.invoice?.invoice_number || event?.shipment_id || "INV-UNKNOWN"}
            </CardTitle>
            {event?.reconciliation?.status === "MATCH" && (
              <Badge variant="success" className="text-[10px] font-bold py-0">
                MATCH
              </Badge>
            )}
            {event?.reconciliation?.status === "APPROVED" && (
              <Badge variant="success" className="text-[10px] font-bold py-0 bg-emerald-600 text-white">
                APPROVED
              </Badge>
            )}
            {event?.reconciliation?.status === "EXCEPTION" && (
              <Badge variant="destructive" className="text-[10px] font-bold py-0">
                EXCEPTION
              </Badge>
            )}
            {event?.reconciliation?.status === "DUPLICATE" && (
              <Badge variant="brand" className="text-[10px] font-bold py-0">
                DUPLICATE
              </Badge>
            )}
            {event?.reconciliation?.status === "INSUFFICIENT_EVIDENCE" && (
              <Badge variant="warning" className="text-[10px] font-bold py-0">
                UNCONFIRMED
              </Badge>
            )}
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold text-slate-900">
              Priority Score: <span className="font-mono text-rose-600 font-bold">{(event?.reconciliation?.priority_score ?? 0).toFixed(0)}</span>/100
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              Deadline: <strong className={(event?.reconciliation?.days_remaining_to_dispute ?? 14) <= 7 ? "text-rose-600 font-bold" : "text-slate-700 font-medium"}>
                {event?.reconciliation?.days_remaining_to_dispute ?? 14}d
              </strong>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Main Content Area */}
      <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Financial Comparison Summary */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded-lg border border-slate-200">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Billed Amount</div>
            <div className="text-sm font-bold font-tabular text-slate-900 mt-1">{formatIDR(billed)}</div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expected Amount</div>
            <div className="text-sm font-bold font-tabular text-slate-900 mt-1">{formatIDR(expected)}</div>
          </div>

          <div className={absVariance > 0 ? (variance > 0 ? "text-rose-600" : "text-amber-600") : "text-emerald-600"}>
            <div className="text-[10px] font-bold uppercase tracking-wider">Variance</div>
            <div className="text-sm font-bold font-tabular mt-1">
              {variance > 0
                ? `+${formatIDR(variance)}`
                : variance < 0
                ? `-${formatIDR(absVariance)}`
                : "Rp 0"}
            </div>
          </div>
        </div>

        {/* Mapped Fields */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-slate-600" />
            <span>Mapped Fields</span>
          </span>
          
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/50 rounded-lg border border-slate-200 text-xs">
            {/* Invoice Fields */}
            <div className="space-y-2">
              <div className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider">Invoice</div>
              <div className="space-y-1.5">
                {event?.invoice?.invoice_number && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Invoice #:</span>
                    <span className="font-mono font-semibold text-slate-900">{event.invoice.invoice_number}</span>
                  </div>
                )}
                {event?.invoice?.billed_amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Billed:</span>
                    <span className="font-mono font-semibold text-slate-900">{formatIDR(event.invoice.billed_amount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipment Fields */}
            <div className="space-y-2">
              <div className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider">Shipment</div>
              <div className="space-y-1.5">
                {event?.shipment?.shipment_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">ID:</span>
                    <span className="font-mono font-semibold text-slate-900 truncate">{event.shipment.shipment_id}</span>
                  </div>
                )}
                {event?.shipment?.weight_actual_kg && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Weight:</span>
                    <span className="font-mono font-semibold text-slate-900">{event.shipment.weight_actual_kg} kg</span>
                  </div>
                )}
                {event?.shipment?.origin && event?.shipment?.destination && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Route:</span>
                    <span className="font-mono font-semibold text-slate-900 text-right">{event.shipment.origin} → {event.shipment.destination}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contract Fields */}
            <div className="space-y-2">
              <div className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider">Contract</div>
              <div className="space-y-1.5">
                {event?.contract?.base_rate && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Base Rate:</span>
                    <span className="font-mono font-semibold text-slate-900">{formatIDR(event.contract.base_rate)}</span>
                  </div>
                )}
                {event?.contract?.applicable_fuel_surcharge_percent !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Fuel Surcharge:</span>
                    <span className="font-mono font-semibold text-slate-900">{event.contract.applicable_fuel_surcharge_percent}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Fields */}
            <div className="space-y-2">
              <div className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider">Pricing</div>
              <div className="space-y-1.5">
                {event?.pricing?.expected_total_charge && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Expected:</span>
                    <span className="font-mono font-semibold text-slate-900">{formatIDR(event.pricing.expected_total_charge)}</span>
                  </div>
                )}
                {event?.pricing?.difference_amount !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Diff:</span>
                    <span className={`font-mono font-semibold ${event.pricing.difference_amount >= 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {event.pricing.difference_amount >= 0 ? "+" : ""}{formatIDR(event.pricing.difference_amount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Discrepancies List */}
        {discrepancies.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                <span>Identified Discrepancies ({discrepancies.length})</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenDisputePackage}
                className="text-[11px] h-7 px-2.5 font-bold text-rose-600 border-rose-300 hover:bg-rose-50 gap-1"
              >
                <FileCheck2 className="h-3 w-3" />
                <span>Generate Dispute Package</span>
              </Button>
            </div>

            <div className="space-y-2">
              {discrepancies.map((disc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-lg border border-slate-200 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-[9px] py-0 font-mono">
                          {disc.code}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-900">{disc.description}</span>
                      </div>
                      {disc.remediation_hint && (
                        <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                          <strong>Remediasi:</strong> {disc.remediation_hint}
                        </p>
                      )}
                    </div>

                    {disc.delta_amount && (
                      <span className="text-xs font-bold text-rose-600 font-tabular shrink-0">
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
                      className="text-[11px] h-6 px-2 text-slate-700 hover:text-slate-900 font-bold hover:bg-slate-100 gap-1"
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
          <div className="p-3 bg-white rounded-lg border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Semua 13 verifikasi aturan tarif dan bukti logistik 100% cocok (Clean Match).</span>
          </div>
        )}
      </CardContent>

      {/* Deterministic Price Calculation Trace - Accordion */}
      <div className="border-t border-slate-200 bg-white">
        <button
          onClick={() => setShowTrace(!showTrace)}
          className="w-full p-3 bg-slate-50/60 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs font-bold text-slate-900 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Calculator className="h-3.5 w-3.5 text-slate-700" />
            <span>Deterministic price calculation trace</span>
          </span>
          {showTrace ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {showTrace && (
          <div className="p-3 bg-slate-900 text-slate-300 font-mono text-[11px] space-y-1 leading-relaxed overflow-x-auto">
            {(() => {
              const trace = event?.pricing?.trace;
              const baseRate = trace?.base_rate_unit ?? event?.contract?.base_rate;
              const weight = trace?.weight_used_kg ?? event?.invoice?.weight_billed_kg ?? event?.shipment?.weight_actual_kg;
              const baseAmt = trace?.base_amount ?? event?.pricing?.expected_base_charge;

              const fuelPct = trace?.fuel_percent ?? event?.contract?.applicable_fuel_surcharge_percent;
              const fuelAmt = trace?.fuel_amount ?? event?.pricing?.expected_fuel_surcharge;
              const preTax = trace?.pre_tax_amount;
              const taxPct = trace?.tax_rate_percent;
              const taxAmt = trace?.tax_amount ?? event?.pricing?.expected_tax;
              const expTotal = trace?.expected_total ?? event?.pricing?.expected_total_charge;
              const billTotal = trace?.billed_total ?? event?.invoice?.billed_amount;
              const tier = trace?.weight_tier ?? "Tidak tersedia";
              const idr = (amount: number | undefined) => amount === undefined ? "Tidak tersedia" : amount.toLocaleString("id-ID");
              const value = (amount: number | undefined, suffix = "") => amount === undefined ? "Tidak tersedia" : `${amount}${suffix}`;

              return (
                <>
                  <div className="text-cyan-400 font-bold">--- INTEGER IDR MATHEMATICAL AUDIT TRACE ---</div>
                  <div>Base Rate Tariff : Rp {idr(baseRate)} ({tier})</div>
                  <div>Weight Used Scale: {value(weight, " kg")} ➔ Base: Rp {idr(baseAmt)}</div>
                  <div>Fuel Surcharge   : {value(fuelPct, "%")} ➔ Rp {idr(fuelAmt)}</div>
                  <div>Pre-Tax Subtotal : Rp {idr(preTax)}</div>
                  <div>PPN Tax ({value(taxPct, "%")})   : Rp {idr(taxAmt)}</div>
                  <div className="text-emerald-400 font-bold border-t border-slate-700 pt-1">
                    Expected Total   : Rp {idr(expTotal)} | Billed: Rp {idr(billTotal)}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Human-in-the-Loop Decision Buttons */}
      <CardFooter className="p-3 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-600 font-medium">
          Authorizer Role: <strong className="text-slate-900">Mengikuti sesi pengguna</strong>
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
            className="bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs h-8 px-3.5"
          >
            Dispute Overcharge
          </Button>
          <Button
            size="sm"
            onClick={() => onOpenDecisionModal("APPROVE")}
            className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs h-8 px-4"
          >
            Approve Payment
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
