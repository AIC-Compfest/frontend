"use client";

import React, { useState } from "react";
import { ShipmentEvent } from "@/types/reconciliation";

interface DecisionModalProps {
  isOpen: boolean;
  action: "APPROVE" | "DISPUTE" | "REJECT" | null;
  event: ShipmentEvent;
  onClose: () => void;
  onConfirm: (action: string, role: string, reason: string) => Promise<void>;
}

export function DecisionModal({
  isOpen,
  action,
  event,
  onClose,
  onConfirm,
}: DecisionModalProps) {
  const [role, setRole] = useState("AP_MANAGER");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !action) return null;

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleConfirm = async () => {
    if ((action === "DISPUTE" || action === "REJECT") && !reason.trim()) {
      setErrorMsg("Sanggahan atau penolakan wajib mencantumkan alasan tertulis.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await onConfirm(action, role, reason);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan keputusan review.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#CFE3F1] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#CFE3F1] bg-[#EDF4FA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                action === "APPROVE"
                  ? "bg-emerald-600"
                  : action === "DISPUTE"
                  ? "bg-rose-600"
                  : "bg-slate-700"
              }`}
            />
            <h3 className="font-bold text-sm text-[#243A5E]">
              {action === "APPROVE" && "Konfirmasi Persetujuan Faktur (Approve)"}
              {action === "DISPUTE" && "Pengajuan Sanggahan Sengketa Tagihan (Dispute)"}
              {action === "REJECT" && "Konfirmasi Penolakan Tagihan (Reject)"}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Nomor Faktur (Invoice):</span>
              <span className="font-mono font-semibold text-slate-800">{event.invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transporter / Vendor:</span>
              <span className="font-medium text-slate-800">{event.vendor_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Tagihan (Billed):</span>
              <span className="font-mono font-medium text-slate-800">{formatIDR(event.invoice.billed_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Sah Terkontrak (Expected):</span>
              <span className="font-mono font-medium text-[#243A5E]">
                {formatIDR(event.pricing.expected_total_charge)}
              </span>
            </div>
            {event.pricing.difference_amount > 0 && (
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-rose-600 font-semibold">Selisih Klaim Sengketa (Variance):</span>
                <span className="font-mono font-bold text-rose-600">
                  +{formatIDR(event.pricing.difference_amount)}
                </span>
              </div>
            )}
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Peran Otorisator (Reviewer Role - Demo Mode):
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-xs text-[#243A5E] bg-white border border-[#CFE3F1] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#5F86A6]"
            >
              <option value="AP_MANAGER">Accounts Payable Manager (AP_MANAGER)</option>
              <option value="FINANCE_CONTROLLER">Finance Controller (FINANCE_CONTROLLER)</option>
              <option value="LOGISTICS_MANAGER">Logistics Operations Manager (LOGISTICS_MANAGER)</option>
            </select>
          </div>

          {/* Reason Text Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan / Alasan Keputusan Manusia {action !== "APPROVE" && <span className="text-rose-600">*</span>}:
            </label>
            <textarea
              rows={3}
              placeholder={
                action === "APPROVE"
                  ? "Tambahkan catatan persetujuan opsional..."
                  : "Uraikan dasar sanggahan sesuai klausul tarif atau bukti fisik..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder-slate-400 bg-white border border-[#CFE3F1] rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-[#5F86A6]"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#CFE3F1] bg-[#EDF4FA] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-md transition-subtle"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-4 py-1.5 text-xs font-bold text-white rounded-md transition-subtle shadow-xs ${
              action === "APPROVE"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : action === "DISPUTE"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-slate-800 hover:bg-slate-900"
            }`}
          >
            {isSubmitting ? "Menyimpan..." : "Konfirmasi Keputusan"}
          </button>
        </div>
      </div>
    </div>
  );
}
