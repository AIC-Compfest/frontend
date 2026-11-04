"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { QueueItem, QueueSummary } from "@/types/reconciliation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowRight, Folder, Inbox, RotateCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCompactIDR, formatIDR } from "@/lib/format";
import {
  btnOutline,
  emptyState,
  iconPlate,
  inputClass,
  kpiValue,
  label,
  panel,
  selectClass,
} from "@/lib/dashboard-ui";

interface ReviewQueueProps {
  selectedEventId?: string | null;
  onSelectTransaction: (eventId: string, allBatchItems?: QueueItem[]) => void;
  onRefresh?: () => void;
}

const EMPTY_SUMMARY: QueueSummary = {
  total_invoiced_amount: 0,
  total_variance_amount: 0,
  total_invoices_count: 0,
  open_exceptions_count: 0,
  urgent_disputes_count: 0,
  matches_count: 0,
};

export function ReviewQueue({ onSelectTransaction, onRefresh }: ReviewQueueProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [summary, setSummary] = useState<QueueSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // Default: anomalies only (EXCEPTION, DUPLICATE, INSUFFICIENT_EVIDENCE)
  const [statusFilter, setStatusFilter] = useState<string>("ANOMALI");
  const [vendorFilter, setVendorFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchQueueData = useCallback(
    async (isManualRefresh = false) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        if (severityFilter !== "ALL") params.set("severity", severityFilter);
        if (vendorFilter !== "ALL") params.set("vendor", vendorFilter);
        if (search.trim() !== "") params.set("search", search.trim());

        const res = await fetch(`/api/review-queue?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          throw new Error(errJson?.error || `Failed to load the anomaly queue (HTTP ${res.status})`);
        }

        const data = await res.json();
        setItems(data.items || []);
        if (data.summary) {
          setSummary(data.summary);
        }
        if (isManualRefresh) {
          showToast("Queue data refreshed", "success");
        }
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error("Queue fetch error:", err);
        setErrorMessage(err instanceof Error ? err.message : "Something went wrong while contacting the server.");
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, severityFilter, vendorFilter, search, onRefresh, showToast]
  );

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  // Unique vendors from the current items
  const vendors = useMemo(() => {
    const set = new Set(items.map((i) => i.vendor_name || i.vendor_id));
    return Array.from(set).filter(Boolean);
  }, [items]);

  // Group items by ingest batch
  const folderGroups = useMemo(() => {
    const groups = new Map<string, QueueItem[]>();
    items.forEach((item) => {
      const key = item.ingest_batch_id || "batch-default";
      groups.set(key, [...(groups.get(key) || []), item]);
    });
    return Array.from(groups.entries()).map(([id, groupItems]) => {
      const totalBilled = groupItems.reduce((acc, it) => acc + (it.billed_amount || 0), 0);
      const totalVariance = groupItems.reduce((acc, it) => acc + (it.variance_amount || 0), 0);
      return {
        id,
        items: groupItems,
        label: id === "batch-default" ? "Billing queue ready for audit" : `Batch ${id.slice(0, 8)}`,
        totalBilled,
        totalVariance,
      };
    });
  }, [items]);

  const kpis = [
    { label: "Total Invoiced Spend", value: formatCompactIDR(summary.total_invoiced_amount) },
    { label: "Potential Leakage", value: `+${formatCompactIDR(summary.total_variance_amount)}` },
    { label: "Anomaly Queue", value: `${summary.open_exceptions_count}` },
    { label: "Clean Matches", value: `${summary.matches_count}` },
  ];

  const selectFilter = (value: string, onChange: (value: string) => void, ariaLabel: string, children: React.ReactNode) => (
    <select aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      {children}
    </select>
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div
          role="status"
          className={cn(
            "fixed right-4 top-4 z-50 max-w-sm rounded-control px-4 py-3 text-[13px] font-semibold text-white shadow-drawer",
            toast.type === "success" ? "bg-navy" : "bg-error-ink"
          )}
        >
          {toast.msg}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={cn(panel, "space-y-3 p-5")}>
            <span className={label}>{kpi.label}</span>
            {isLoading ? (
              <div className="h-7 w-32 animate-pulse rounded-control bg-surface-soft" />
            ) : (
              <div className={kpiValue}>{kpi.value}</div>
            )}
          </div>
        ))}
      </div>

      {/* Filters and folder list */}
      <section className={cn(panel, "overflow-hidden")}>
        <div className="flex flex-col gap-3 border-b border-hairline px-5 py-4 sm:flex-row sm:items-center">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.75} aria-hidden="true" />
            <Input
              type="text"
              aria-label="Search queue"
              placeholder="Search invoice number, shipment ID, or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(inputClass, "pl-9")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectFilter(
              statusFilter,
              setStatusFilter,
              "Filter by status",
              <>
                <option value="ANOMALI">Anomalies</option>
                <option value="ALL">All statuses</option>
                <option value="EXCEPTION">Exception</option>
                <option value="DUPLICATE">Duplicate</option>
                <option value="INSUFFICIENT_EVIDENCE">Unconfirmed</option>
              </>
            )}

            {selectFilter(
              severityFilter,
              setSeverityFilter,
              "Filter by risk level",
              <>
                <option value="ALL">All risk levels</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High risk</option>
                <option value="MEDIUM">Medium risk</option>
                <option value="LOW">Low risk</option>
              </>
            )}

            {selectFilter(
              vendorFilter,
              setVendorFilter,
              "Filter by vendor",
              <>
                <option value="ALL">All vendors</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => fetchQueueData(true)}
              disabled={isLoading}
              className={cn(btnOutline, "h-10 px-3")}
              title="Refresh data"
            >
              <RotateCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} strokeWidth={1.75} aria-hidden="true" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 p-6">
            <div className="h-20 animate-pulse rounded-control bg-surface-soft" />
            <div className="flex items-center justify-center gap-2 text-[13px] text-body">
              <RotateCw className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
              <span>Loading anomaly batches from Supabase...</span>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="space-y-3 p-12 text-center">
            <div className={cn(iconPlate("error"), "mx-auto h-12 w-12 rounded-full")}>
              <AlertCircle className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-[14px] font-semibold text-ink">Failed to load the anomaly queue</p>
              <p className="mx-auto max-w-md text-[13px] text-error-ink">{errorMessage}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchQueueData(true)}
              className={cn(btnOutline, "mt-2 h-9")}
            >
              <RotateCw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Try again</span>
            </Button>
          </div>
        ) : folderGroups.length === 0 || items.length === 0 ? (
          <div className={emptyState}>
            <Inbox className="h-8 w-8 text-muted" strokeWidth={1.5} aria-hidden="true" />
            <p>No anomaly transactions right now. Everything is clean or already processed.</p>
          </div>
        ) : (
          <ul>
            {folderGroups.map((folder) => {
              const firstItem = folder.items[0];
              return (
                <li
                  key={folder.id}
                  className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-4 transition-colors last:border-b-0 hover:bg-surface-soft"
                >
                  <div className={iconPlate("navy")}>
                    <Folder className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-[14px] font-semibold text-ink">{folder.label}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-body tabular-nums">
                      <span>
                        Billed: <span className="font-semibold text-ink">{formatIDR(folder.totalBilled)}</span>
                      </span>
                      <span aria-hidden="true">•</span>
                      <span>
                        Variance:{" "}
                        <span className="font-semibold text-error-ink">+{formatIDR(folder.totalVariance)}</span>
                      </span>
                    </div>
                  </div>

                  {firstItem && (
                    <Button
                      type="button"
                      onClick={() => onSelectTransaction(firstItem.event_id, folder.items)}
                      className={cn(btnOutline, "h-9 shrink-0 px-4")}
                    >
                      <span>View Details</span>
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
