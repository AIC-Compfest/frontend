"use client";

import React from "react";
import { AuditTrailItem } from "@/types/reconciliation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck, History, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { chip } from "@/lib/dashboard-ui";

interface AuditTrailViewProps {
  auditTrail: AuditTrailItem[];
}

export function AuditTrailView({ auditTrail }: AuditTrailViewProps) {
  if (!auditTrail || auditTrail.length === 0) {
    return (
      <Card className="rounded-card border border-hairline bg-card text-ink shadow-none">
        <CardContent className="p-6 text-center text-xs text-body">
          <History className="mx-auto mb-1.5 h-5 w-5 text-muted opacity-60" strokeWidth={1.75} aria-hidden="true" />
          No manual audit history for this transaction yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-card border border-hairline bg-card text-ink shadow-none">
      <CardHeader className="flex flex-row items-center justify-between border-b border-hairline p-4 pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-[16px] font-normal tracking-normal text-ink">
          <ShieldCheck className="h-4 w-4 text-navy" strokeWidth={1.75} aria-hidden="true" />
          <span>Audit Ledger Trail ({auditTrail.length})</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-3">
        <div className="relative ml-2 space-y-4 border-l-2 border-hairline py-1 pl-4 text-xs">
          {auditTrail.map((item, idx) => {
            const dateStr = new Date(item.timestamp).toLocaleString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            return (
              <div key={idx} className="relative">
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface-soft",
                    item.action === "APPROVE"
                      ? "bg-teal-ink"
                      : item.action === "DISPUTE"
                      ? "bg-error-ink"
                      : "bg-navy"
                  )}
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={chip(item.action === "APPROVE" ? "solidSuccess" : item.action === "DISPUTE" ? "solidError" : "solidNavy", "px-2 py-0 text-[10px]")}>
                      {item.action}
                    </span>
                    <span className="text-[11px] text-body">
                      by <strong className="font-semibold text-ink">{item.actor_role}</strong> ({item.actor_id})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] tabular-nums text-muted">
                    <Clock className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                    <span>{dateStr}</span>
                  </div>
                </div>

                {item.notes && (
                  <p className="mt-1.5 rounded-control border border-hairline bg-surface-soft/60 p-2.5 text-[11px] italic text-body">
                    &quot;{item.notes}&quot;
                  </p>
                )}

                {item.previous_status && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] tabular-nums text-body">
                    <span>Status:</span>
                    <span className="text-muted line-through">{item.previous_status}</span>
                    <span aria-hidden="true">→</span>
                    <span className="font-semibold text-ink">{item.new_status}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
