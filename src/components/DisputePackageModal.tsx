"use client";

import React, { useState, useEffect } from "react";
import { DisputePackage } from "@/types/reconciliation";

interface DisputePackageModalProps {
  isOpen: boolean;
  eventId: string;
  onClose: () => void;
}

export function DisputePackageModal({
  isOpen,
  eventId,
  onClose,
}: DisputePackageModalProps) {
  const [pkg, setPkg] = useState<DisputePackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen || !eventId) return;

    let isMounted = true;

    async function loadDisputePackage() {
      try {
        const res = await fetch(`http://localhost:8080/api/v1/reconcile/${eventId}/dispute-package`);
        if (!res.ok) throw new Error("Gagal mengambil paket klaim sengketa.");
        const data = await res.json();
        if (isMounted) {
          setPkg(data);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Gagal memuat paket sengketa.";
          setErrorMsg(msg);
          setIsLoading(false);
        }
      }
    }

    void loadDisputePackage();

    return () => {
      isMounted = false;
    };
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  const handleDownloadJSON = () => {
    if (!pkg) return;
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dispute_package_${pkg.invoice_number.replace(/[/\\?%*:|"<>]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintMemo = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#CFE3F1] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#CFE3F1] bg-[#EDF4FA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#243A5E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="font-bold text-sm text-[#243A5E]">
              Official 3PL Billing Dispute Claim Package (PRD §39)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-[#5F86A6] text-xs">
              <div className="animate-spin w-6 h-6 border-2 border-[#243A5E] border-t-transparent rounded-full mx-auto mb-2" />
              Mengompilasi paket klaim hukum dan jejak bukti...
            </div>
          ) : errorMsg ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
              {errorMsg}
            </div>
          ) : pkg ? (
            <div className="space-y-4">
              {/* Formatted Memo Box */}
              <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner overflow-x-auto">
                {pkg.formatted_memo}
              </div>

              {/* Structured Discrepancy Breakdown */}
              <div className="p-3 bg-[#EDF4FA] rounded-lg border border-[#CFE3F1] text-xs space-y-2">
                <div className="font-bold text-[#243A5E] uppercase tracking-wider text-[11px]">
                  Rincian Diskrepansi Terlampir ({pkg.discrepancies?.length || 0})
                </div>
                {pkg.discrepancies?.map((disc, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border border-[#CFE3F1] flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-rose-700">{disc.code}</span>:{" "}
                      <span className="text-slate-700">{disc.description}</span>
                    </div>
                    {disc.delta_amount && (
                      <span className="font-mono font-bold text-rose-600 whitespace-nowrap">
                        +Rp {disc.delta_amount.toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#CFE3F1] bg-[#EDF4FA] flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#5F86A6]">
            Legal claim package compliant with Master Service Agreement terms.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintMemo}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#243A5E] bg-white border border-[#CFE3F1] hover:bg-[#EDF4FA] rounded-md transition-subtle shadow-xs"
            >
              Print / Export PDF Memo
            </button>
            <button
              onClick={handleDownloadJSON}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#243A5E] hover:bg-[#243A5E]/90 rounded-md transition-subtle shadow-xs"
            >
              Download JSON Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
