"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QueueItem } from "@/types/reconciliation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Inbox, Loader2 } from "lucide-react";
import { API_V1 } from "@/lib/config";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { btnPrimary, chip, emptyState, panel, panelHeader, panelTitle, trHover } from "@/lib/dashboard-ui";

interface DisputeListViewProps {
  onSelectTransaction: (eventId: string) => void;
}

const API_BASE = API_V1;

export function DisputeListView({ onSelectTransaction }: DisputeListViewProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the DISPUTED records: anomalies that an AP manager formally disputed
  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reconcile/queue?status=DISPUTED&page_size=50`);
      if (!res.ok) throw new Error("Failed to load dispute packages");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Dispute fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const totalClaimable = items.reduce((sum, i) => sum + Math.max(0, i.variance_amount || 0), 0);

  return (
    <section className={cn(panel, "overflow-hidden")}>
      <header className={panelHeader}>
        <h2 className={panelTitle}>Pending / Active Dispute Claims ({items.length})</h2>
        <span className="text-[13px] text-body">
          Total claimable:{" "}
          <strong className="font-semibold tabular-nums text-error-ink">{formatIDR(totalClaimable)}</strong>
        </span>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 px-6 py-16 text-[13px] text-body">
          <Loader2 className="h-4 w-4 animate-spin text-navy" strokeWidth={1.75} aria-hidden="true" />
          <span>Loading disputed cases...</span>
        </div>
      ) : items.length === 0 ? (
        <div className={emptyState}>
          <Inbox className="h-8 w-8 text-muted" strokeWidth={1.5} aria-hidden="true" />
          <p>No active dispute claims right now.</p>
        </div>
      ) : (
        <ul>
          {items.map((item) => (
            <li
              key={item.event_id}
              className={cn(
                "flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
                trHover
              )}
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold tabular-nums text-ink">{item.invoice_number}</span>
                  <span className={chip("error")}>{item.primary_discrepancy || "OVERCHARGE"}</span>
                  <span className="text-[13px] font-semibold text-body">{item.vendor_name || item.vendor_id}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-body tabular-nums">
                  <span>AWB / SJ: {item.shipment_id}</span>
                  <span aria-hidden="true">•</span>
                  <span>Billed: {formatIDR(item.billed_amount)}</span>
                  <span aria-hidden="true">•</span>
                  <span>Expected: {formatIDR(item.expected_amount)}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <div className="space-y-1 text-right">
                  <div className="text-[14px] font-semibold tabular-nums text-error-ink">+{formatIDR(item.variance_amount)}</div>
                  <div className="text-[12px] tabular-nums text-body">
                    Deadline: {item.days_remaining_to_dispute} days left
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => onSelectTransaction(item.event_id)}
                  className={cn(btnPrimary, "h-9 px-4")}
                >
                  <span>Inspect Memo</span>
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
