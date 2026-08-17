"use client";

import React, { useState } from "react";
import { ShipmentEvent } from "@/types/reconciliation";

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
    <div className="flex flex-col h-full bg-white rounded-lg border border-[#CFE3F1] shadow-xs overflow-hidden">
      {/* Transaction Header & Context */}
      <div className="p-4 border-b border-[#CFE3F1] bg-[#EDF4FA]/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#243A5E] font-mono">{event.invoice.invoice_number}</h2>
              {event.reconciliation.status === "MATCH" && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  MATCH
                </span>
              )}
              {event.reconciliation.status === "EXCEPTION" && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  EXCEPTION
                </span>
              )}
              {event.reconciliation.status === "DUPLICATE" && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  DUPLICATE
                </span>
              )}
              {event.reconciliation.status === "INSUFFICIENT_EVIDENCE" && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  UNCONFIRMED
                </span>
              )}
            </div>
            <div className="text-xs text-[#5F86A6] mt-1 flex flex-wrap items-center gap-3">
              <span>Vendor: <strong className="text-slate-800 font-medium">{event.vendor_id}</strong></span>
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
              <strong className={event.reconciliation.days_remaining_to_dispute <= 7 ? "text-rose-600 font-semibold" : "text-slate-700 font-medium"}>
                {event.reconciliation.days_remaining_to_dispute} Days Remaining
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {/* Financial Comparison Summary */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-[#EDF4FA] rounded-lg border border-[#CFE3F1]">
          <div>
            <div className="text-[11px] font-medium text-[#5F86A6] uppercase tracking-wider">Billed Amount</div>
            <div className="text-base font-bold font-tabular text-slate-900 mt-0.5">{formatIDR(billed)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Invoiced by 3PL</div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[#5F86A6] uppercase tracking-wider">Expected Amount</div>
            <div className="text-base font-bold font-tabular text-[#243A5E] mt-0.5">{formatIDR(expected)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Contractually Derived</div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[#5F86A6] uppercase tracking-wider">Variance</div>
            <div className="text-base font-bold font-tabular mt-0.5">
              {variance > 0 ? (
                <span className="text-rose-600">+{formatIDR(variance)}</span>
              ) : variance < 0 ? (
                <span className="text-emerald-600">{formatIDR(variance)}</span>
              ) : (
                <span className="text-slate-500">Rp 0 (0.0%)</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {variance > 0 ? `+${variancePct}% Overcharge` : "100% Reconciled"}
            </div>
          </div>
        </div>

        {/* Discrepancy Items / Audit Findings */}
        {event.reconciliation.discrepancies.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Billing Exceptions Detected ({event.reconciliation.discrepancies.length})</span>
              </h3>
            </div>

            <div className="space-y-2">
              {event.reconciliation.discrepancies.map((disc, idx) => {
                let targetTab: "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT" = "INVOICE";
                let fieldName = "billed_amount";

                if (disc.code === "RATE_OVERCHARGE") {
                  targetTab = "INVOICE";
                  fieldName = "billed_amount";
                } else if (disc.code === "WRONG_ZONE") {
                  targetTab = "INVOICE";
                  fieldName = "destination";
                } else if (disc.code === "QUANTITY_MISMATCH") {
                  targetTab = "POD";
                  fieldName = "quantity_received";
                } else if (disc.code === "SIGNATURE_MISSING") {
                  targetTab = "POD";
                  fieldName = "signature_present";
                } else if (disc.code === "POD_DATE_MISMATCH") {
                  targetTab = "POD";
                  fieldName = "delivery_date";
                }

                return (
                  <div
                    key={idx}
                    className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg flex items-start justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-900 bg-rose-200/60 px-1.5 py-0.5 rounded">
                          {disc.code}
                        </span>
                        <span className="text-[11px] font-semibold text-rose-700 uppercase">{disc.category}</span>
                      </div>
                      <p className="text-xs text-slate-800 mt-1 leading-relaxed">{disc.description}</p>
                      {disc.remediation_hint && (
                        <p className="text-[11px] text-[#5F86A6] mt-1 italic">Hint: {disc.remediation_hint}</p>
                      )}
                    </div>

                    <button
                      onClick={() => onViewProof(fieldName, targetTab)}
                      className="px-2.5 py-1 text-xs font-semibold text-[#243A5E] bg-white border border-[#CFE3F1] hover:bg-[#EDF4FA] rounded-md transition-subtle shadow-xs whitespace-nowrap"
                    >
                      View Proof ➔
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transparent Calculation Trace Accordion */}
        <div className="border border-[#CFE3F1] rounded-lg overflow-hidden">
          <button
            onClick={() => setShowTrace(!showTrace)}
            className="w-full flex items-center justify-between p-3 bg-[#EDF4FA] text-xs font-bold text-[#243A5E] hover:bg-[#CFE3F1]/50 transition-subtle"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#5F86A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Deterministic Calculation Trace (Integer IDR)</span>
            </div>
            <span className="text-slate-400 text-xs font-mono">{showTrace ? "▲ Collapse" : "▼ Expand"}</span>
          </button>

          {showTrace && (
            <div className="p-3.5 bg-white space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 font-mono text-[11px] text-slate-700 rounded border border-slate-200 leading-relaxed overflow-x-auto">
                {event.pricing.trace?.trace_log || "Base Rate + Fuel Surcharge (14%) + PPN (11%)"}
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tarif Dasar Terkontrak:</span>
                  <span className="font-mono font-medium">{formatIDR(event.contract.base_rate)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Fuel Surcharge ({event.contract.applicable_fuel_surcharge_percent}%):</span>
                  <span className="font-mono font-medium">{formatIDR(event.pricing.expected_fuel_surcharge)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">PPN (11.0%):</span>
                  <span className="font-mono font-medium">{formatIDR(event.pricing.expected_tax)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Total Sah (Expected):</span>
                  <span className="font-mono font-bold text-[#243A5E]">{formatIDR(event.pricing.expected_total_charge)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 13 Independent Verification Checks */}
        <div className="border border-[#CFE3F1] rounded-lg overflow-hidden">
          <button
            onClick={() => setShowChecks(!showChecks)}
            className="w-full flex items-center justify-between p-3 bg-[#EDF4FA] text-xs font-bold text-[#243A5E] hover:bg-[#CFE3F1]/50 transition-subtle"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#5F86A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>13 Independent Verification Checks ({event.checks?.length || 13})</span>
            </div>
            <span className="text-slate-400 text-xs font-mono">{showChecks ? "▲ Collapse" : "▼ Expand"}</span>
          </button>

          {showChecks && (
            <div className="p-3 bg-white">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="pb-1.5 font-medium">Check Area</th>
                    <th className="pb-1.5 font-medium">Status</th>
                    <th className="pb-1.5 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {event.checks?.map((chk, idx) => (
                    <tr key={idx} className="py-1.5">
                      <td className="py-1.5 font-medium text-slate-800">{chk.check_code}</td>
                      <td className="py-1.5">
                        {chk.status === "PASS" && (
                          <span className="text-emerald-700 font-semibold">✓ PASS</span>
                        )}
                        {chk.status === "FAIL" && (
                          <span className="text-rose-600 font-semibold">✕ FAIL</span>
                        )}
                        {chk.status === "UNCERTAIN" && (
                          <span className="text-amber-600 font-semibold">⚠ UNCERTAIN</span>
                        )}
                      </td>
                      <td className="py-1.5 font-mono text-slate-500">{(chk.confidence * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Human Reviewer Action Toolbar */}
      <div className="p-3.5 border-t border-[#CFE3F1] bg-[#EDF4FA]/80 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onOpenDisputePackage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#243A5E] bg-white border border-[#CFE3F1] rounded-md hover:bg-[#EDF4FA] transition-subtle shadow-xs"
        >
          <svg className="w-4 h-4 text-[#5F86A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export Dispute Package</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenDecisionModal("REJECT")}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-subtle shadow-xs"
          >
            Reject Invoice
          </button>

          <button
            onClick={() => onOpenDecisionModal("DISPUTE")}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-subtle shadow-xs flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Submit Dispute</span>
          </button>

          <button
            onClick={() => onOpenDecisionModal("APPROVE")}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-subtle shadow-xs"
          >
            Approve Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
