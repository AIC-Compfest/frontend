"use client";

import React, { useState } from "react";
import { ShipmentEvent } from "@/types/reconciliation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, XCircle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatIDR } from "@/lib/format";
import { btnOutline, focusRing, selectClass, textareaClass } from "@/lib/dashboard-ui";

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

  if (!isOpen || !action || !event) return null;

  // Defensive: handle missing invoice and pricing data
  const invoice = event.invoice || {};
  const pricing = event.pricing || {};
  const invoiceNumber = invoice?.invoice_number || "N/A";
  const billedAmount = invoice?.billed_amount ?? 0;
  const expectedAmount = pricing?.expected_total_charge ?? 0;
  const differenceAmount = pricing?.difference_amount ?? 0;
  const vendorId = event?.vendor_id || "N/A";

  const handleConfirm = async () => {
    if ((action === "DISPUTE" || action === "REJECT") && !reason.trim()) {
      setErrorMsg("Disputes and rejections require a written reason.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await onConfirm(action, role, reason);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save the review decision.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    action === "APPROVE"
      ? "Confirm invoice approval (Approve)"
      : action === "DISPUTE"
      ? "Submit dispute claim (Dispute)"
      : "Confirm invoice rejection (Reject)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg overflow-hidden rounded-card border border-hairline bg-card p-0 text-ink shadow-drawer">
        {/* Modal header */}
        <CardHeader
          className={cn(
            "flex flex-row items-center justify-between border-b p-5 pb-4",
            action === "APPROVE"
              ? "border-teal/40 bg-teal-soft/70"
              : action === "DISPUTE"
              ? "border-error/40 bg-error-soft/70"
              : "border-hairline bg-surface-soft"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex items-center justify-center rounded-plate p-1.5 text-white",
                action === "APPROVE" ? "bg-teal-ink" : action === "DISPUTE" ? "bg-error-ink" : "bg-navy"
              )}
            >
              {action === "APPROVE" && <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
              {action === "DISPUTE" && <AlertTriangle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
              {action === "REJECT" && <XCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
            </div>
            <div>
              <CardTitle className="font-sans text-[16px] font-semibold tracking-normal text-ink">{title}</CardTitle>
              <CardDescription className="mt-0.5 text-[12px] text-body">
                The reviewer decision is recorded permanently in the Audit Ledger Trail.
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

        {/* Modal body */}
        <CardContent className="space-y-4 p-5 text-[13px]">
          {/* Summary */}
          <div className="space-y-2 rounded-control border border-hairline bg-canvas p-3.5">
            <div className="flex justify-between gap-3">
              <span className="text-body">Invoice number:</span>
              <span className="font-semibold tabular-nums text-ink">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-body">Logistics partner:</span>
              <span className="font-semibold text-ink">{vendorId}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-body">Billed total:</span>
              <span className="font-semibold tabular-nums text-ink">{formatIDR(billedAmount)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-body">Expected total (agreed rate):</span>
              <span className="font-semibold tabular-nums text-navy">{formatIDR(expectedAmount)}</span>
            </div>
            {differenceAmount > 0 && (
              <div className="flex justify-between gap-3 border-t border-hairline pt-2">
                <span className="font-semibold text-error-ink">Disputed variance:</span>
                <span className="font-semibold tabular-nums text-error-ink">+{formatIDR(differenceAmount)}</span>
              </div>
            )}
          </div>

          {/* Reviewer role */}
          <div className="space-y-1.5">
            <Label htmlFor="decision-role" className="text-[12px] text-ink">
              Reviewer role
            </Label>
            <select
              id="decision-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={cn(selectClass, "w-full font-semibold")}
            >
              <option value="AP_MANAGER">Accounts Payable Manager (AP_MANAGER)</option>
              <option value="FINANCE_CONTROLLER">Finance Controller (FINANCE_CONTROLLER)</option>
              <option value="LOGISTICS_MANAGER">Logistics Operations Manager (LOGISTICS_MANAGER)</option>
            </select>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="decision-reason" className="text-[12px] text-ink">
              Notes / basis for decision {action !== "APPROVE" && <span className="text-error-ink">*</span>}
            </Label>
            <textarea
              id="decision-reason"
              rows={3}
              placeholder={
                action === "APPROVE"
                  ? "Add an optional approval note..."
                  : "Describe the basis for the dispute, citing the rate clause or physical evidence..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={cn(textareaClass, "w-full p-2.5 text-[13px] placeholder:text-muted")}
            />
          </div>

          {errorMsg && (
            <div role="alert" className="flex items-center gap-2 rounded-control border border-error/40 bg-error-soft p-2.5 text-[13px] font-semibold text-error-ink">
              <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}
        </CardContent>

        {/* Modal footer */}
        <CardFooter className="flex items-center justify-end gap-2.5 border-t border-hairline bg-surface-soft/60 p-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className={cn(btnOutline, "h-9 px-4 text-[13px]")}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={cn(
              "h-9 px-4 text-[13px] font-semibold text-white shadow-none",
              action === "APPROVE"
                ? "bg-teal-ink hover:opacity-90"
                : action === "DISPUTE"
                ? "bg-error-ink hover:opacity-90"
                : "bg-navy hover:bg-navy-deep"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                <span>Saving...</span>
              </>
            ) : (
              "Confirm decision"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
