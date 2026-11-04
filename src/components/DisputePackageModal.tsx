"use client";

import React, { useState, useEffect } from "react";
import { DisputePackage } from "@/types/reconciliation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDisputePackage } from "@/lib/api";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { btnOutline, btnPrimary, focusRing } from "@/lib/dashboard-ui";
import { AlertCircle, Download, FileCheck2, Loader2, Printer, X } from "lucide-react";

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
        const data = await getDisputePackage(eventId);
        if (isMounted) {
          setPkg(data);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to load the dispute package.";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <Card className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-card border border-hairline bg-card p-0 text-ink shadow-drawer">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between border-b border-hairline bg-surface-soft/70 p-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-plate bg-navy p-1.5 text-navy-muted">
              <FileCheck2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="font-display text-[16px] font-normal tracking-normal text-navy">
                Official 3PL billing dispute claim package
              </CardTitle>
              <CardDescription className="mt-0.5 text-[12px] text-body">
                Official claim memo with MSA contractual clauses and trace logs
              </CardDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn("rounded-pop p-1 text-muted transition-colors hover:bg-white/80 hover:text-ink", focusRing)}
          >
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </CardHeader>

        {/* Body */}
        <CardContent className="flex-1 space-y-4 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-[13px] text-body">
              <Loader2 className="h-6 w-6 animate-spin text-navy" strokeWidth={1.75} aria-hidden="true" />
              <span>Compiling the claim package and evidence trail...</span>
            </div>
          ) : errorMsg ? (
            <div role="alert" className="flex items-center gap-2 rounded-control border border-error/40 bg-error-soft p-3 text-[13px] text-error-ink">
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          ) : pkg ? (
            <div className="space-y-4">
              {/* Formatted memo. Monospace is kept because the memo is aligned plain text. */}
              <div className="overflow-x-auto whitespace-pre-wrap rounded-control border border-navy-deep bg-navy-deep p-4 font-mono text-[12px] leading-relaxed text-navy-soft">
                {pkg.formatted_memo}
              </div>

              {/* Discrepancy breakdown */}
              <div className="space-y-2 rounded-control border border-hairline bg-canvas p-3.5 text-[13px]">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[.08em] text-navy">
                  <span>Attached discrepancy details ({pkg.discrepancies?.length || 0})</span>
                </div>
                {pkg.discrepancies?.map((disc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-control border border-hairline bg-card p-2.5 text-[13px]"
                  >
                    <div>
                      <span className="font-semibold tabular-nums text-error-ink">{disc.code}</span>:{" "}
                      <span className="text-body">{disc.description}</span>
                    </div>
                    {disc.delta_amount ? (
                      <span className="ml-2 whitespace-nowrap font-semibold tabular-nums text-error-ink">
                        +{formatIDR(disc.delta_amount)}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex flex-col items-start justify-between gap-3 border-t border-hairline bg-surface-soft/60 p-4 sm:flex-row sm:items-center">
          <span className="text-[12px] text-body">
            Legal claim package compliant with Master Service Agreement terms.
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handlePrintMemo} className={cn(btnOutline, "h-8 px-3 text-[12px]")}>
              <Printer className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Print / Export PDF</span>
            </Button>
            <Button type="button" onClick={handleDownloadJSON} className={cn(btnPrimary, "h-8 px-3 text-[12px]")}>
              <Download className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Download JSON</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
