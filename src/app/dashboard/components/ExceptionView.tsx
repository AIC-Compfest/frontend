"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QueueItem } from "@/types/reconciliation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RotateCw, AlertOctagon, Inbox, ArrowRight, ShieldAlert, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ExceptionViewProps {
  onSelectTransaction: (eventId: string) => void;
}

const API_BASE = "http://localhost:8080/api/v1";

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-[#1B2A4A] tracking-tight">
              Daftar Dokumen Anomali & Ditolak
            </h2>
            <Badge variant="destructive" className="text-[10px] font-bold py-0.5 px-2">
              Anomali Archive
            </Badge>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Kumpulan seluruh dokumen yang terdeteksi anomali, ditolak, duplikat, atau bukti tidak cukup. Get by status Exception.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchExceptions}
          disabled={isLoading}
          className="text-xs font-semibold gap-1.5 h-8.5 bg-white border-slate-300 shadow-xs cursor-pointer"
        >
          <RotateCw className={`h-3.5 w-3.5 text-[#1B2A4A] ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              statusFilter === tab.key
                ? "bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-rose-200 bg-rose-50/50 rounded-2xl shadow-2xs">
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Total Dokumen Anomali</div>
            <div className="text-2xl font-extrabold text-rose-950 mt-1">{items.length}</div>
            <div className="text-[11px] text-rose-700">Dokumen memerlukan tindakan atau eskalasi</div>
          </CardContent>
        </Card>
        <Card className="border border-amber-200 bg-amber-50/50 rounded-2xl shadow-2xs">
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Total Selisih Ditolak</div>
            <div className="text-2xl font-extrabold text-amber-950 mt-1 font-tabular">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalVariance)}
            </div>
            <div className="text-[11px] text-amber-700">Potensi kebocoran yang sudah dicegah</div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-slate-50/50 rounded-2xl shadow-2xs">
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Status Distribution</div>
            <div className="space-y-1 mt-2">
              {["EXCEPTION", "REJECTED", "DUPLICATE", "INSUFFICIENT_EVIDENCE"].map((s) => {
                const count = items.filter((i) => i.status === s).length;
                return count > 0 ? (
                  <div key={s} className="flex items-center justify-between text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(s)}`}>{s}</span>
                    <span className="font-mono font-bold text-slate-700">{count}</span>
                  </div>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
        <Input
          type="text"
          placeholder="Cari invoice, shipment ID, vendor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-8.5 text-xs bg-white border-slate-200 rounded-xl"
        />
      </div>

      {/* List */}
      <Card className="border border-slate-200 bg-white shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Daftar Dokumen Anomali ({items.length} dokumen)
          </span>
          <span className="text-[11px] text-rose-700 font-mono font-bold">
            Total Selisih: +{formatIDR(totalVariance)}
          </span>
        </CardHeader>
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
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-[#243A5E]">
                        {item.invoice_number}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </span>
                      <AlertOctagon className="h-3.5 w-3.5 text-rose-500" />
                    </div>
                    <div className="text-xs text-slate-600 font-semibold">
                      {item.vendor_name || item.vendor_id}
                      <span className="text-slate-400 font-normal mx-2">•</span>
                      <span className="font-mono">{item.shipment_id}</span>
                    </div>
                    {(item.primary_discrepancy || item.top_discrepancy) && (
                      <div className="text-[11px] text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 font-medium max-w-md">
                        Temuan: {item.primary_discrepancy || item.top_discrepancy}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-[11px] text-slate-500">
                      <span>Tagih: <strong className="text-slate-800">{formatIDR(item.billed_amount)}</strong></span>
                      <span>Ekspektasi: <strong className="text-slate-800">{formatIDR(item.expected_amount)}</strong></span>
                      {item.variance_amount > 0 && (
                        <span>Selisih: <strong className="text-rose-700 font-mono">+{formatIDR(item.variance_amount)}</strong></span>
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
