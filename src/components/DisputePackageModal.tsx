"use client";

import React, { useState, useEffect } from "react";
import { DisputePackage } from "@/types/reconciliation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Download,
  Printer,
  X,
  ShieldCheck,
  Loader2,
  AlertCircle,
  FileCheck2,
} from "lucide-react";

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
      <Card className="max-w-3xl w-full max-h-[90vh] flex flex-col bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-0">
        {/* Header */}
        <CardHeader className="p-4 pb-3 border-b border-slate-100 bg-[#EDF4FA]/70 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#243A5E] text-[#8FB8D6]">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-extrabold text-[#243A5E]">
                Official 3PL billing dispute claim package
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500">
                Official claim memo with MSA contractual clauses & trace logs
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

        {/* Body */}
        <CardContent className="flex-1 p-5 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-[#5F86A6] text-xs">
              <Loader2 className="h-6 w-6 animate-spin text-[#243A5E] mx-auto mb-2" />
              Mengompilasi paket klaim hukum dan jejak bukti...
            </div>
          ) : errorMsg ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : pkg ? (
            <div className="space-y-4">
              {/* Formatted Memo Box */}
              <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner overflow-x-auto">
                {pkg.formatted_memo}
              </div>

              {/* Structured Discrepancy Breakdown */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-[#243A5E] uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Rincian Diskrepansi Terlampir ({pkg.discrepancies?.length || 0})</span>
                  <Badge variant="destructive" className="text-[9px] py-0">
                    MSA ENFORCED
                  </Badge>
                </div>
                {pkg.discrepancies?.map((disc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-rose-700">{disc.code}</span>:{" "}
                      <span className="text-slate-700">{disc.description}</span>
                    </div>
                    {disc.delta_amount && (
                      <span className="font-mono font-bold text-rose-700 whitespace-nowrap ml-2">
                        +Rp {disc.delta_amount.toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>

        {/* Footer Actions */}
        <CardFooter className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 font-medium">
            Legal claim package compliant with Master Service Agreement terms.
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintMemo}
              className="text-xs font-semibold gap-1.5 h-8 bg-white"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Export PDF</span>
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadJSON}
              className="bg-[#243A5E] text-white hover:bg-[#1C2E4A] font-bold text-xs gap-1.5 h-8 shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download JSON</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
