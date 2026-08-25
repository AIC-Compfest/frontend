"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QueueItem } from "@/types/reconciliation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCw, ArrowRight, AlertTriangle, Inbox } from "lucide-react";

interface DisputeListViewProps {
  onSelectTransaction: (eventId: string) => void;
}

const API_BASE = "http://localhost:8080/api/v1";

export function DisputeListView({ onSelectTransaction }: DisputeListViewProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Fetch specifically DISPUTED records — these are anomali that AP_MANAGER formally disputed
  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reconcile/queue?status=DISPUTED&page_size=50`);
      if (!res.ok) throw new Error("Gagal mengambil data paket sengketa");
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
    <div className="space-y-6 max-w-7xl font-sans">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-[#243A5E] tracking-tight">
              Official 3PL Dispute Packages
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono text-slate-500">
              status=EXCEPTION
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Daftar paket sanggahan klaim overcharge yang dibuat dari kasus anomali yang telah ditinjau.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchDisputes}
          disabled={isLoading}
          className="text-xs font-semibold gap-1.5 h-8.5 bg-white border-slate-300 shadow-xs cursor-pointer"
        >
          <RotateCw className={`h-3.5 w-3.5 text-[#1B2A4A] ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Claims</span>
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Pending / Active Dispute Claims ({items.length})
          </span>
          <span className="text-[11px] text-slate-700 font-mono font-bold">
            Total Claimable: <strong className="text-rose-700">{formatIDR(totalClaimable)}</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-xs text-slate-500 space-y-2">
            <div className="animate-spin w-6 h-6 border-2 border-[#1B2A4A] border-t-transparent rounded-full mx-auto" />
            <span>Mengambil kasus sanggahan status=EXCEPTION...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400 space-y-2">
            <Inbox className="h-8 w-8 text-slate-300 mx-auto" />
            <p>Tidak ada sengketa klaim anomali aktif saat ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div
                key={item.event_id}
                className="p-4 hover:bg-[#EDF4FA]/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#243A5E]">
                      {item.invoice_number}
                    </span>
                    <Badge variant="destructive" className="text-[9px] py-0">
                      {item.primary_discrepancy || "OVERCHARGE"}
                    </Badge>
                    <span className="text-xs text-slate-600 font-semibold">
                      {item.vendor_name || item.vendor_id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-3">
                    <span>AWB / SJ: {item.shipment_id}</span>
                    <span>&bull;</span>
                    <span>Billed: {formatIDR(item.billed_amount)}</span>
                    <span>&bull;</span>
                    <span>Expected: {formatIDR(item.expected_amount)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-rose-700 font-tabular block">
                      +{formatIDR(item.variance_amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Batas Waktu: {item.days_remaining_to_dispute} hari tersisa
                    </span>
                  </div>

                  <Button
                    onClick={() => onSelectTransaction(item.event_id)}
                    size="sm"
                    className="bg-[#243A5E] text-white hover:bg-[#1C2E4A] font-bold text-xs gap-1.5 h-8 cursor-pointer"
                  >
                    <span>Inspect Memo</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
