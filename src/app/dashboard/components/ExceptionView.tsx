"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QueueItem } from "@/types/reconciliation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RotateCw, AlertOctagon, Inbox, ArrowRight, ShieldAlert, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { API_V1 } from "@/lib/config";

interface ExceptionViewProps {
  onSelectTransaction: (eventId: string) => void;
}

const API_BASE = API_V1;

export function ExceptionView({ onSelectTransaction }: ExceptionViewProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("EXCEPTION,DUPLICATE,INSUFFICIENT_EVIDENCE,REJECTED");

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);

  const fetchExceptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      params.set("page_size", "100");
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${API_BASE}/reconcile/queue?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data anomali");
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

  const statusTabs = [
    { key: "EXCEPTION,DUPLICATE,INSUFFICIENT_EVIDENCE,REJECTED", label: "Semua Anomali", color: "text-rose-700" },
    { key: "EXCEPTION", label: "Exception", color: "text-rose-600" },
    { key: "REJECTED", label: "Ditolak (Rejected)", color: "text-slate-600" },
    { key: "DUPLICATE", label: "Duplikat", color: "text-orange-600" },
    { key: "INSUFFICIENT_EVIDENCE", label: "Bukti Tidak Cukup", color: "text-amber-600" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "EXCEPTION": return "bg-rose-100 text-rose-800 border-rose-300";
      case "REJECTED": return "bg-slate-100 text-slate-700 border-slate-300";
      case "DUPLICATE": return "bg-orange-100 text-orange-800 border-orange-300";
      case "INSUFFICIENT_EVIDENCE": return "bg-amber-100 text-amber-800 border-amber-300";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const totalVariance = items.reduce((s, i) => s + Math.max(0, i.variance_amount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl font-sans">
      {/* Summary Cards - Paling Atas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200 bg-white rounded-lg shadow-sm">
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Dokumen Anomali</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{items.length}</div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white rounded-lg shadow-sm">
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Selisih Ditolak</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-tabular">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalVariance)}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white rounded-lg shadow-sm">
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Distribution</div>
            <div className="space-y-1 mt-2">
              {["EXCEPTION", "REJECTED", "DUPLICATE", "INSUFFICIENT_EVIDENCE"].map((s) => {
                const count = items.filter((i) => i.status === s).length;
                return count > 0 ? (
                  <div key={s} className="flex items-center justify-between text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getStatusColor(s)}`}>{s}</span>
                    <span className="font-mono font-bold text-slate-700">{count}</span>
                  </div>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar - Search + Status Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari invoice, shipment ID, vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8.5 text-xs bg-white border-slate-200 rounded-xl"
          />
        </div>

        {/* Status Filter Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 cursor-pointer"
        >
          <option value="EXCEPTION,DUPLICATE,INSUFFICIENT_EVIDENCE,REJECTED">Semua Anomali</option>
          <option value="EXCEPTION">Exception</option>
          <option value="REJECTED">Ditolak (Rejected)</option>
          <option value="DUPLICATE">Duplikat</option>
          <option value="INSUFFICIENT_EVIDENCE">Bukti Tidak Cukup</option>
        </select>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchExceptions}
          disabled={isLoading}
          className="text-xs font-semibold gap-1.5 h-8.5 bg-white border-slate-300 shadow-xs cursor-pointer"
        >
          <RotateCw className={`h-3.5 w-3.5 text-slate-700 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* List */}
      <Card className="border border-slate-200 bg-white shadow-sm rounded-lg overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-slate-500 space-y-2">
              <div className="animate-spin w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full mx-auto" />
              <span>Mengambil data anomali...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400 space-y-2">
              <Inbox className="h-8 w-8 text-slate-300 mx-auto" />
              <p>Tidak ada dokumen anomali dalam kategori ini saat ini.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div
                  key={item.event_id}
                  className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-extrabold text-lg text-slate-900">
                        {item.invoice_number}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-rose-700">
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500">
                      <span>Tagih: <strong className="text-slate-800">{formatIDR(item.billed_amount)}</strong></span>
                      <span>Ekspektasi: <strong className="text-slate-800">{formatIDR(item.expected_amount)}</strong></span>
                      {item.variance_amount > 0 && (
                        <span>Selisih: <strong className="text-slate-800">+{formatIDR(item.variance_amount)}</strong></span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => onSelectTransaction(item.event_id)}
                    size="sm"
                    variant="outline"
                    className="bg-white border-slate-300 text-[#243A5E] hover:bg-slate-50 font-bold text-xs gap-1.5 h-8 cursor-pointer shrink-0"
                  >
                    <span>Lihat Bukti</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
