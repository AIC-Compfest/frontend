"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QueueItem } from "@/types/reconciliation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Inbox, RotateCw, Search } from "lucide-react";
import { API_V1 } from "@/lib/config";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  btnOutline,
  chip,
  ChipTone,
  emptyState,
  inputClass,
  kpiValue,
  label,
  panel,
  selectClass,
} from "@/lib/dashboard-ui";

interface ExceptionViewProps {
  onSelectTransaction: (eventId: string) => void;
}

const API_BASE = API_V1;

const ALL_ANOMALY_STATUSES = "EXCEPTION,DUPLICATE,INSUFFICIENT_EVIDENCE,REJECTED";

const STATUS_TONES: Record<string, ChipTone> = {
  EXCEPTION: "error",
  REJECTED: "neutral",
  DUPLICATE: "warning",
  INSUFFICIENT_EVIDENCE: "action",
};

export function ExceptionView({ onSelectTransaction }: ExceptionViewProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_ANOMALY_STATUSES);

  const fetchExceptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      params.set("page_size", "100");
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${API_BASE}/reconcile/queue?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load anomaly data");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Exception fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  const totalVariance = items.reduce((s, i) => s + Math.max(0, i.variance_amount || 0), 0);
  const distribution = ["EXCEPTION", "REJECTED", "DUPLICATE", "INSUFFICIENT_EVIDENCE"]
    .map((status) => ({ status, count: items.filter((i) => i.status === status).length }))
    .filter((entry) => entry.count > 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={cn(panel, "space-y-3 p-5")}>
          <span className={label}>Total anomaly documents</span>
          <div className={kpiValue}>{items.length}</div>
        </div>
        <div className={cn(panel, "space-y-3 p-5")}>
          <span className={label}>Total rejected variance</span>
          <div className={kpiValue}>{formatIDR(totalVariance)}</div>
        </div>
        <div className={cn(panel, "space-y-3 p-5")}>
          <span className={label}>Status distribution</span>
          {distribution.length === 0 ? (
            <p className="text-[13px] text-body">No documents</p>
          ) : (
            <ul className="space-y-2">
              {distribution.map((entry) => (
                <li key={entry.status} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className={chip(STATUS_TONES[entry.status] ?? "neutral")}>{entry.status}</span>
                  <span className="font-semibold tabular-nums text-ink">{entry.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.75} aria-hidden="true" />
          <Input
            type="text"
            aria-label="Search anomalies"
            placeholder="Search invoice, shipment ID, or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(inputClass, "pl-9")}
          />
        </div>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
        >
          <option value={ALL_ANOMALY_STATUSES}>All anomalies</option>
          <option value="EXCEPTION">Exception</option>
          <option value="REJECTED">Rejected</option>
          <option value="DUPLICATE">Duplicate</option>
          <option value="INSUFFICIENT_EVIDENCE">Insufficient evidence</option>
        </select>

        <Button
          type="button"
          variant="outline"
          onClick={fetchExceptions}
          disabled={isLoading}
          className={cn(btnOutline, "h-10 px-3")}
        >
          <RotateCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} strokeWidth={1.75} aria-hidden="true" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* List */}
      <section className={cn(panel, "overflow-hidden")}>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-[13px] text-body">
            <RotateCw className="h-4 w-4 animate-spin text-navy" strokeWidth={1.75} aria-hidden="true" />
            <span>Fetching anomaly data...</span>
          </div>
        ) : items.length === 0 ? (
          <div className={emptyState}>
            <Inbox className="h-8 w-8 text-muted" strokeWidth={1.5} aria-hidden="true" />
            <p>No anomaly documents in this category right now.</p>
          </div>
        ) : (
          <ul>
            {items.map((item) => (
              <li
                key={item.event_id}
                className="flex flex-col gap-4 border-b border-hairline px-5 py-4 transition-colors last:border-b-0 hover:bg-surface-soft sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold tabular-nums text-ink">{item.invoice_number}</span>
                    <span className={chip(STATUS_TONES[item.status] ?? "neutral")}>{item.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-body tabular-nums">
                    <span>
                      Billed: <strong className="font-semibold text-ink">{formatIDR(item.billed_amount)}</strong>
                    </span>
                    <span>
                      Expected: <strong className="font-semibold text-ink">{formatIDR(item.expected_amount)}</strong>
                    </span>
                    {item.variance_amount > 0 && (
                      <span>
                        Variance:{" "}
                        <strong className="font-semibold text-error-ink">+{formatIDR(item.variance_amount)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSelectTransaction(item.event_id)}
                  className={cn(btnOutline, "h-9 shrink-0 px-4")}
                >
                  <span>View Evidence</span>
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
