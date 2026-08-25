"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AuditTrailItem } from "@/types/reconciliation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, History, Clock, RotateCw, User, FileText, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = "http://localhost:8080/api/v1";

interface GlobalAuditLedgerViewProps {
  onSelectTransaction?: (eventId: string) => void;
}

export function GlobalAuditLedgerView({ onSelectTransaction }: GlobalAuditLedgerViewProps) {
  const [logs, setLogs] = useState<AuditTrailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>("ALL");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/audit/all`);
      if (!res.ok) throw new Error("Gagal mengambil audit log");
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

  const getActionBadge = (action: string) => {
    switch (action) {
      case "APPROVE":
        return <Badge variant="success" className="text-[10px] py-0 px-2 font-bold font-mono">APPROVE</Badge>;
      case "DISPUTE":
        return <Badge variant="destructive" className="text-[10px] py-0 px-2 font-bold font-mono">DISPUTE</Badge>;
      case "REJECT":
        return <Badge variant="outline" className="text-[10px] py-0 px-2 font-bold font-mono text-rose-700 border-rose-300">REJECT</Badge>;
      default:
        return <Badge variant="default" className="text-[10px] py-0 px-2 font-bold font-mono">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-[#1B2A4A] tracking-tight">
              Immutable Audit Trail Ledger
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono text-slate-500 border-slate-200">
              Append-Only • Cryptographically Logged
            </Badge>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Catatan permanen setiap keputusan persetujuan, penolakan, dan sengketa dari AP Manager dan Finance Controller.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="text-xs font-semibold gap-1.5 h-8.5 bg-white border-slate-300 shadow-xs cursor-pointer"
          >
            <RotateCw className={`h-3.5 w-3.5 text-[#1B2A4A] ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Ledger</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["ALL", "APPROVE", "DISPUTE", "REJECT"].map((act) => (
          <button
            key={act}
            onClick={() => setFilterAction(act)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              filterAction === act
                ? "bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {act === "ALL" ? "Semua Aksi" : act}
          </button>
        ))}
      </div>

      {/* Audit Log Card */}
      <Card className="border border-slate-200 bg-white shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#243A5E] flex items-center gap-2">
            <History className="h-4 w-4 text-[#5F86A6]" />
            <span>Riwayat Seluruh Keputusan ({filteredLogs.length} Entri)</span>
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono font-bold bg-slate-50">
            PostgreSQL audit_events
          </Badge>
        </CardHeader>

        <CardContent className="p-6">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <div className="animate-spin w-6 h-6 border-2 border-[#1B2A4A] border-t-transparent rounded-full mx-auto" />
              <span>Memuat log audit...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <span>Belum ada log keputusan manual yang tercatat di audit ledger.</span>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pl-6 py-2 text-xs">
              {filteredLogs.map((item, idx) => {
                const dateStr = item.timestamp
                  ? new Date(item.timestamp).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "-";

                return (
                  <div key={idx} className="relative">
                    {/* Status Dot */}
                    <div
                      className={cn(
                        "absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-white",
                        item.action === "APPROVE"
                          ? "bg-emerald-600 ring-2 ring-emerald-100"
                          : item.action === "DISPUTE"
                          ? "bg-orange-600 ring-2 ring-orange-100"
                          : item.action === "REJECT"
                          ? "bg-rose-600 ring-2 ring-rose-100"
                          : "bg-[#243A5E] ring-2 ring-slate-100"
                      )}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getActionBadge(item.action)}
                        <span className="text-[11px] text-slate-600">
                          oleh <strong className="text-slate-900 font-bold">{item.actor_role || "REVIEWER"}</strong> ({item.actor_id || "SYSTEM"})
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="mt-2 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] italic font-sans">
                        &quot;{item.notes}&quot;
                      </p>
                    )}

                    {(item.previous_status || item.new_status) && (
                      <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-2 font-mono">
                        <span>Status Transition:</span>
                        {item.previous_status && (
                          <>
                            <span className="line-through text-slate-400">{item.previous_status}</span>
                            <span>➔</span>
                          </>
                        )}
                        <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{item.new_status}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
