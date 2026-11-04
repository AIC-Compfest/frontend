"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AuditTrailItem } from "@/types/reconciliation";
import { ArrowRight, Clock, History, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_V1 } from "@/lib/config";
import { chip, ChipTone, emptyState, focusRing, panel, panelHeader, panelTitle } from "@/lib/dashboard-ui";

const API_BASE = API_V1;

const ACTIONS = ["ALL", "RELEASE", "APPROVE", "DISPUTE", "REJECT"] as const;

const ACTION_CHIP: Record<string, ChipTone> = {
  RELEASE: "action",
  APPROVE: "success",
  DISPUTE: "warning",
  REJECT: "error",
};

const ACTION_DOT: Record<string, string> = {
  RELEASE: "bg-action",
  APPROVE: "bg-teal-ink",
  DISPUTE: "bg-warning",
  REJECT: "bg-error-ink",
};

export function GlobalAuditLedgerView() {
  const [logs, setLogs] = useState<AuditTrailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>("ALL");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/audit/all`);
      if (!res.ok) throw new Error("Failed to load the audit log");
      const data = await res.json();
      setLogs(data.audit_trail || []);
    } catch (err) {
      console.error("Audit fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((item) => {
    if (filterAction === "ALL") return true;
    return item.action === filterAction;
  });

  return (
    <div className="space-y-6">
      {/* Segmented action filter */}
      <div role="group" aria-label="Filter by action" className="inline-flex max-w-full flex-wrap gap-1 rounded-control border border-hairline bg-card p-1">
        {ACTIONS.map((act) => {
          const active = filterAction === act;
          return (
            <button
              key={act}
              type="button"
              aria-pressed={active}
              onClick={() => setFilterAction(act)}
              className={cn(
                "h-8 cursor-pointer rounded-pop px-3 text-[12px] font-semibold transition-colors",
                active ? "bg-navy text-white" : "text-body hover:bg-surface-soft hover:text-ink",
                focusRing
              )}
            >
              {act === "ALL" ? "All actions" : act}
            </button>
          );
        })}
      </div>

      <section className={cn(panel, "overflow-hidden")}>
        <header className={panelHeader}>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className={panelTitle}>Full Decision History</h2>
            <span className={chip("neutral")}>{filteredLogs.length} entries</span>
          </div>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-body">
              <Loader2 className="h-4 w-4 animate-spin text-navy" strokeWidth={1.75} aria-hidden="true" />
              <span>Loading audit log...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className={emptyState}>
              <History className="h-8 w-8 text-muted" strokeWidth={1.5} aria-hidden="true" />
              <p>No manual decisions recorded in the audit ledger yet.</p>
            </div>
          ) : (
            <ol className="relative ml-3 space-y-6 border-l-2 border-hairline py-1 pl-6 text-[13px]">
              {filteredLogs.map((item, idx) => {
                const dateStr = item.timestamp
                  ? new Date(item.timestamp).toLocaleString("en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "-";

                return (
                  <li key={idx} className="relative">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-2 ring-surface-soft",
                        ACTION_DOT[item.action] ?? "bg-navy"
                      )}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={chip(ACTION_CHIP[item.action] ?? "navy")}>{item.action}</span>
                        <span className="text-[12px] text-body">
                          by <strong className="font-semibold text-ink">{item.actor_role || "REVIEWER"}</strong> (
                          {item.actor_id || "SYSTEM"})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] tabular-nums text-muted">
                        <Clock className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="mt-2 rounded-control border border-hairline bg-surface-soft/60 p-3 text-[12px] italic text-body">
                        &quot;{item.notes}&quot;
                      </p>
                    )}

                    {(item.previous_status || item.new_status) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-body">
                        <span>Status transition:</span>
                        {item.previous_status && (
                          <>
                            <span className="text-muted line-through">{item.previous_status}</span>
                            <ArrowRight className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                          </>
                        )}
                        <span className="rounded-pop bg-surface-soft px-1.5 py-0.5 font-semibold tabular-nums text-ink">
                          {item.new_status}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
