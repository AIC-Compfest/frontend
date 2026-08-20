"use client";

import React, { useState } from "react";
import { ShipmentEvent } from "@/types/reconciliation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  ShieldAlert,
  Loader2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      <Card className="max-w-lg w-full bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-0">
        {/* Modal Header */}
        <CardHeader
          className={cn(
            "p-5 pb-4 border-b flex flex-row items-center justify-between",
            action === "APPROVE"
              ? "bg-emerald-50/70 border-emerald-100"
              : action === "DISPUTE"
              ? "bg-rose-50/70 border-rose-100"
              : "bg-slate-50 border-slate-200"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "p-1.5 rounded-lg flex items-center justify-center text-white",
                action === "APPROVE"
                  ? "bg-emerald-600"
                  : action === "DISPUTE"
                  ? "bg-rose-600"
                  : "bg-slate-800"
              )}
            >
              {action === "APPROVE" && <CheckCircle2 className="h-4 w-4" />}
              {action === "DISPUTE" && <AlertTriangle className="h-4 w-4" />}
              {action === "REJECT" && <XCircle className="h-4 w-4" />}
            </div>
            <div>
              <CardTitle className="text-sm font-extrabold text-slate-900">
                {action === "APPROVE" && "Konfirmasi Persetujuan Faktur (Approve)"}
                {action === "DISPUTE" && "Pengajuan Sanggahan Sengketa (Dispute)"}
                {action === "REJECT" && "Konfirmasi Penolakan Tagihan (Reject)"}
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500 mt-0.5">
                Pencatatan otoritas reviewer ke Audit Ledger permanen
              </CardDescription>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>

        {/* Modal Body */}
        <CardContent className="p-5 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 font-sans">
            <div className="flex justify-between">
              <span className="text-slate-500">Nomor Faktur (Invoice):</span>
              <span className="font-mono font-bold text-slate-900">{event.invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transporter / Vendor:</span>
              <span className="font-semibold text-slate-800">{event.vendor_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Tagihan (Billed):</span>
              <span className="font-mono font-bold text-slate-900">{formatIDR(event.invoice.billed_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Sah Terkontrak (Expected):</span>
              <span className="font-mono font-bold text-[#243A5E]">
                {formatIDR(event.pricing.expected_total_charge)}
              </span>
            </div>
            {event.pricing.difference_amount > 0 && (
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-rose-700 font-bold">Selisih Klaim Sengketa:</span>
                <span className="font-mono font-extrabold text-rose-700">
                  +{formatIDR(event.pricing.difference_amount)}
                </span>
              </div>
            )}
          </div>

          {/* Role Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="decision-role">Peran Otorisator (Reviewer Role)</Label>
            <select
              id="decision-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-xs text-slate-800 font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#243A5E]"
            >
              <option value="AP_MANAGER">Accounts Payable Manager (AP_MANAGER)</option>
              <option value="FINANCE_CONTROLLER">Finance Controller (FINANCE_CONTROLLER)</option>
              <option value="LOGISTICS_MANAGER">Logistics Operations Manager (LOGISTICS_MANAGER)</option>
            </select>
          </div>

          {/* Reason Text Area */}
          <div className="space-y-1.5">
            <Label htmlFor="decision-reason">
              Catatan / Dasar Keputusan {action !== "APPROVE" && <span className="text-rose-600">*</span>}
            </Label>
            <textarea
              id="decision-reason"
              rows={3}
              placeholder={
                action === "APPROVE"
                  ? "Tambahkan catatan persetujuan opsional..."
                  : "Uraikan dasar sanggahan sesuai klausul tarif atau bukti fisik..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#243A5E]"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </CardContent>

        {/* Modal Footer */}
        <CardFooter className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={cn(
              "text-xs font-bold text-white shadow-xs",
              action === "APPROVE"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : action === "DISPUTE"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-slate-800 hover:bg-slate-900"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              "Konfirmasi Keputusan"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
