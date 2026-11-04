"use client";

import React, { useState } from "react";
import { ShipmentEvent } from "@/types/reconciliation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatIDR } from "@/lib/format";
import { chip, ChipTone, btnOutline, focusRing, label as labelClass } from "@/lib/dashboard-ui";

interface ReconciliationCardProps {
  event: ShipmentEvent;
  onViewProof: (fieldName: string, docTab: "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT") => void;
  onOpenDecisionModal: (action: "APPROVE" | "DISPUTE" | "REJECT") => void;
  onOpenDisputePackage: () => void;
}

const STATUS_CHIP: Record<string, { tone: ChipTone; text: string }> = {
  MATCH: { tone: "success", text: "MATCH" },
  APPROVED: { tone: "solidSuccess", text: "APPROVED" },
  EXCEPTION: { tone: "error", text: "EXCEPTION" },
  DUPLICATE: { tone: "navy", text: "DUPLICATE" },
  INSUFFICIENT_EVIDENCE: { tone: "warning", text: "UNCONFIRMED" },
};

export function ReconciliationCard({
  event,
  onViewProof,
  onOpenDecisionModal,
  onOpenDisputePackage,
}: ReconciliationCardProps) {
  const [showTrace, setShowTrace] = useState(true);

  const billed = event?.invoice?.billed_amount || 0;
  const expected = event?.pricing?.expected_total_charge || 0;
  const variance = (billed - expected) !== 0
    ? (billed - expected)
    : (event?.pricing?.difference_amount ?? 0);
  const absVariance = Math.abs(variance);
  const discrepancies = event?.reconciliation?.discrepancies || [];
  const statusChip = STATUS_CHIP[event?.reconciliation?.status ?? ""];

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-card p-0 text-ink shadow-none">
      {/* Transaction header */}
      <CardHeader className="space-y-1.5 border-b border-hairline bg-card p-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="font-semibold tabular-nums tracking-normal text-[16px] text-ink">
              {event?.invoice?.invoice_number || event?.shipment_id || "INV-UNKNOWN"}
            </CardTitle>
            {statusChip && <span className={chip(statusChip.tone)}>{statusChip.text}</span>}
          </div>

          <div className="text-right">
            <div className="text-[12px] font-semibold text-ink">
              Priority score: <span className="font-bold tabular-nums text-error-ink">{(event?.reconciliation?.priority_score ?? 0).toFixed(0)}</span>/100
            </div>
            <div className="mt-0.5 text-[12px] text-body">
              Deadline:{" "}
              <strong className={(event?.reconciliation?.days_remaining_to_dispute ?? 14) <= 7 ? "font-bold text-error-ink" : "font-medium text-ink"}>
                {event?.reconciliation?.days_remaining_to_dispute ?? 14}d
              </strong>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Main content */}
      <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Financial comparison */}
        <div className="grid grid-cols-3 gap-3 rounded-control border border-hairline bg-card p-3">
          <div>
            <div className={labelClass}>Billed amount</div>
            <div className="mt-1 text-[14px] font-semibold tabular-nums text-ink">{formatIDR(billed)}</div>
          </div>

          <div>
            <div className={labelClass}>Expected amount</div>
            <div className="mt-1 text-[14px] font-semibold tabular-nums text-ink">{formatIDR(expected)}</div>
          </div>

          <div className={absVariance > 0 ? (variance > 0 ? "text-error-ink" : "text-warning-ink") : "text-teal-ink"}>
            <div className="text-[12px] font-semibold uppercase tracking-[.08em]">Variance</div>
            <div className="mt-1 text-[14px] font-semibold tabular-nums">
              {variance > 0
                ? `+${formatIDR(variance)}`
                : variance < 0
                ? `-${formatIDR(absVariance)}`
                : formatIDR(0)}
            </div>
          </div>
        </div>

        {/* Mapped fields */}
        <div className="space-y-2">
          <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[.08em] text-ink">
            <Sparkles className="h-3.5 w-3.5 text-body" strokeWidth={1.75} aria-hidden="true" />
            <span>Mapped fields</span>
          </span>

          <div className="grid grid-cols-2 gap-3 rounded-control border border-hairline bg-canvas p-3 text-[12px]">
            {/* Invoice */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[.08em] text-body">Invoice</div>
              <div className="space-y-1.5">
                {event?.invoice?.invoice_number && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body">Invoice #:</span>
                    <span className="font-semibold tabular-nums text-ink">{event.invoice.invoice_number}</span>
                  </div>
                )}
                {event?.invoice?.billed_amount && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body">Billed:</span>
                    <span className="font-semibold tabular-nums text-ink">{formatIDR(event.invoice.billed_amount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipment */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[.08em] text-body">Shipment</div>
              <div className="space-y-1.5">
                {event?.shipment?.shipment_id && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body">ID:</span>
                    <span className="truncate font-semibold tabular-nums text-ink">{event.shipment.shipment_id}</span>
                  </div>
                )}
                {event?.shipment?.weight_actual_kg && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body">Weight:</span>
                    <span className="font-semibold tabular-nums text-ink">{event.shipment.weight_actual_kg} kg</span>
                  </div>
                )}
                {event?.shipment?.origin && event?.shipment?.destination && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body">Route:</span>
                    <span className="text-right font-semibold text-ink">{event.shipment.origin} → {event.shipment.destination}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contract */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[.08em] text-body">Contract</div>
              <div className="space-y-1.5">
                {event?.contract?.base_rate && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body">Base rate:</span>
                    <span className="font-semibold tabular-nums text-ink">{formatIDR(event.contract.base_rate)}</span>
                  </div>
                )}
                {event?.contract?.applicable_fuel_surcharge_percent !== undefined && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body">Fuel surcharge:</span>
                    <span className="font-semibold tabular-nums text-ink">{event.contract.applicable_fuel_surcharge_percent}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[.08em] text-body">Pricing</div>
              <div className="space-y-1.5">
                {event?.pricing?.expected_total_charge && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body">Expected:</span>
                    <span className="font-semibold tabular-nums text-ink">{formatIDR(event.pricing.expected_total_charge)}</span>
                  </div>
                )}
                {event?.pricing?.difference_amount !== undefined && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body">Diff:</span>
                    <span className={cn("font-semibold tabular-nums", event.pricing.difference_amount >= 0 ? "text-error-ink" : "text-teal-ink")}>
                      {event.pricing.difference_amount >= 0 ? "+" : ""}{formatIDR(event.pricing.difference_amount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Discrepancies */}
        {discrepancies.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[.08em] text-ink">
                <AlertTriangle className="h-3.5 w-3.5 text-error-ink" strokeWidth={1.75} aria-hidden="true" />
                <span>Identified discrepancies ({discrepancies.length})</span>
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={onOpenDisputePackage}
                className={cn(btnOutline, "h-7 gap-1 px-2.5 text-[12px] text-error-ink")}
              >
                <FileCheck2 className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                <span>Generate Dispute Package</span>
              </Button>
            </div>

            <div className="space-y-2">
              {discrepancies.map((disc, idx) => (
                <div key={idx} className="space-y-2 rounded-control border border-hairline bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={chip("error", "text-[10px] tabular-nums")}>{disc.code}</span>
                        <span className="text-[13px] font-semibold text-ink">{disc.description}</span>
                      </div>
                      {disc.remediation_hint && (
                        <p className="mt-1 text-[12px] leading-normal text-body">
                          <strong className="font-semibold text-ink">Remediation:</strong> {disc.remediation_hint}
                        </p>
                      )}
                    </div>

                    {disc.delta_amount ? (
                      <span className="shrink-0 text-[13px] font-semibold tabular-nums text-error-ink">
                        +{formatIDR(disc.delta_amount)}
                      </span>
                    ) : null}
                  </div>

                  {/* Proof jump */}
                  <div className="flex items-center justify-end border-t border-hairline pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        if (disc.code === "RATE_OVERCHARGE") onViewProof("billed_amount", "INVOICE");
                        else if (disc.code === "WRONG_ZONE") onViewProof("destination", "SURAT_JALAN");
                        else if (disc.code === "WEIGHT_DISCREPANCY") onViewProof("weight_actual_kg", "SURAT_JALAN");
                        else if (disc.code === "MISSING_SIGNATURE") onViewProof("signature_present", "POD");
                        else if (disc.code === "QUANTITY_MISMATCH") onViewProof("quantity_received", "POD");
                        else onViewProof("billed_amount", "INVOICE");
                      }}
                      className={cn("h-6 gap-1 px-2 text-[12px] font-semibold text-ink hover:bg-surface-soft", focusRing)}
                    >
                      <span>View Proof in Document</span>
                      <ArrowRight className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-control border border-teal/50 bg-teal-soft p-3 text-[13px] font-medium text-teal-ink">
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>All rate and logistics evidence checks match (Clean Match).</span>
          </div>
        )}
      </CardContent>

      {/* Deterministic price calculation trace */}
      <div className="border-t border-hairline bg-card">
        <button
          type="button"
          aria-expanded={showTrace}
          onClick={() => setShowTrace(!showTrace)}
          className={cn(
            "flex w-full cursor-pointer items-center justify-between bg-canvas p-3 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-soft",
            focusRing
          )}
        >
          <span className="flex items-center gap-1.5">
            <Calculator className="h-3.5 w-3.5 text-body" strokeWidth={1.75} aria-hidden="true" />
            <span>Deterministic price calculation trace</span>
          </span>
          {showTrace ? (
            <ChevronUp className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>

        {showTrace && (
          <div className="space-y-1 overflow-x-auto bg-navy-deep p-3 font-mono text-[11px] leading-relaxed text-navy-soft">
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
              const tier = trace?.weight_tier ?? "Not available";
              const money = (amount: number | undefined) =>
                amount === undefined ? "Not available" : `IDR ${amount.toLocaleString("en-US")}`;
              const value = (amount: number | undefined, suffix = "") => amount === undefined ? "Not available" : `${amount}${suffix}`;

              return (
                <>
                  <div className="font-bold text-teal">--- INTEGER IDR MATHEMATICAL AUDIT TRACE ---</div>
                  <div>Base rate tariff : {money(baseRate)} ({tier})</div>
                  <div>Weight used scale: {value(weight, " kg")} → Base: {money(baseAmt)}</div>
                  <div>Fuel surcharge   : {value(fuelPct, "%")} → {money(fuelAmt)}</div>
                  <div>Pre-tax subtotal : {money(preTax)}</div>
                  <div>VAT (PPN, {value(taxPct, "%")}) : {money(taxAmt)}</div>
                  <div className="border-t border-navy-muted/30 pt-1 font-bold text-teal">
                    Expected total   : {money(expTotal)} | Billed: {money(billTotal)}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Human-in-the-loop decision buttons */}
      <CardFooter className="flex items-center justify-between gap-3 border-t border-hairline bg-card p-3">
        <div className="text-[12px] font-medium text-body">
          Authorizer role: <strong className="font-semibold text-ink">taken from the signed-in session</strong>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => onOpenDecisionModal("REJECT")}
            className="h-8 bg-navy-deep px-3 text-[12px] font-semibold text-white hover:bg-navy"
          >
            Reject
          </Button>
          <Button
            type="button"
            onClick={() => onOpenDecisionModal("DISPUTE")}
            className="h-8 bg-error-ink px-3.5 text-[12px] font-semibold text-white hover:opacity-90"
          >
            Dispute Overcharge
          </Button>
          <Button
            type="button"
            onClick={() => onOpenDecisionModal("APPROVE")}
            className="h-8 bg-teal-ink px-4 text-[12px] font-semibold text-white hover:opacity-90"
          >
            Approve Payment
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
