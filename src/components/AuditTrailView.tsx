"use client";

import React from "react";
import { AuditTrailItem } from "@/types/reconciliation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, History, User, Clock, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditTrailViewProps {
  auditTrail: AuditTrailItem[];
}

export function AuditTrailView({ auditTrail }: AuditTrailViewProps) {
  if (!auditTrail || auditTrail.length === 0) {
    return (
      <Card className="border border-slate-200 bg-white">
        <CardContent className="p-6 text-center text-xs text-slate-500">
          <History className="h-5 w-5 text-slate-400 mx-auto mb-1.5 opacity-60" />
          Belum ada riwayat audit manual untuk transaksi ini.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-2xs">
      <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#243A5E] flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#5F86A6]" />
          <span>Immutable Audit Trail & Decision Ledger ({auditTrail.length})</span>
        </CardTitle>
        <Badge variant="outline" className="text-[10px] font-mono font-bold bg-slate-50">
          Append-Only Trigger Active
        </Badge>
      </CardHeader>

      <CardContent className="p-4 pt-3">
        <div className="relative border-l-2 border-slate-200 ml-2 space-y-4 pl-4 py-1 text-xs">
          {auditTrail.map((item, idx) => {
            const dateStr = new Date(item.timestamp).toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            return (
              <div key={idx} className="relative">
                {/* Dot */}
                <div
                  className={cn(
                    "absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full border-2 border-white",
                    item.action === "APPROVE"
                      ? "bg-emerald-600 ring-2 ring-emerald-100"
                      : item.action === "DISPUTE"
                      ? "bg-rose-600 ring-2 ring-rose-100"
                      : "bg-[#243A5E] ring-2 ring-slate-100"
                  )}
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.action === "APPROVE"
                          ? "success"
                          : item.action === "DISPUTE"
                          ? "destructive"
                          : "default"
                      }
                      className="text-[10px] py-0 px-2 font-bold font-mono"
                    >
                      {item.action}
                    </Badge>
                    <span className="text-[11px] text-slate-500">
                      by <strong className="text-slate-800 font-semibold">{item.actor_role}</strong> ({item.actor_id})
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{dateStr}</span>
                  </div>
                </div>

                {item.notes && (
                  <p className="mt-1.5 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-[11px] italic font-sans">
                    &quot;{item.notes}&quot;
                  </p>
                )}

                {item.previous_status && (
                  <div className="mt-1.5 text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                    <span>Status:</span>
                    <span className="line-through text-slate-400">{item.previous_status}</span>
                    <span>➔</span>
                    <span className="font-bold text-slate-800">{item.new_status}</span>
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
