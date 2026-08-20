"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { QueueItem, QueueSummary, ReconciliationStatus } from "@/types/reconciliation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  RotateCw,
  Filter,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
  TrendingDown,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewQueueProps {
  selectedEventId: string | null;
  onSelectTransaction: (eventId: string) => void;
  onRefresh?: () => void;
}

const API_BASE = "http://localhost:8080/api/v1";

export function ReviewQueue({
  selectedEventId,
  onSelectTransaction,
  onRefresh,
}: ReviewQueueProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [summary, setSummary] = useState<QueueSummary>({
    total_invoiced_amount: 0,
    total_variance_amount: 0,
    total_invoices_count: 0,
    open_exceptions_count: 0,
    urgent_disputes_count: 0,
    matches_count: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [vendorFilter, setVendorFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  const formatIDR = (val?: number | null) => {
    const num = val ?? 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatCompactIDR = (val?: number | null) => {
    if (val === undefined || val === null || isNaN(val)) return "Rp 0";
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} jt`;
    if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)} rb`;
    return `Rp ${val.toLocaleString("id-ID")}`;
  };

  // Fetch Queue from Database targeted with exact params
  const fetchQueueData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (severityFilter !== "ALL") params.set("severity", severityFilter);
      if (vendorFilter !== "ALL") params.set("vendor", vendorFilter);
      if (search.trim() !== "") params.set("search", search.trim());
      params.set("page_size", "50");

      const res = await fetch(`${API_BASE}/reconcile/queue?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data antrean");
      const data = await res.json();
      setItems(data.items || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Queue fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, severityFilter, vendorFilter, search]);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  // Unique vendors from items
  const vendors = useMemo(() => {
    const set = new Set(items.map((i) => i.vendor_id));
    return Array.from(set);
  }, [items]);

  const renderStatusBadge = (status: ReconciliationStatus) => {
    switch (status) {
      case "MATCH":
        return (
          <Badge variant="success" className="text-[10px] font-bold py-0">
            MATCH
          </Badge>
        );
      case "EXCEPTION":
        return (
          <Badge variant="destructive" className="text-[10px] font-bold py-0">
            EXCEPTION
          </Badge>
        );
      case "DUPLICATE":
        return (
          <Badge variant="brand" className="text-[10px] font-bold py-0">
            DUPLICATE
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="success" className="text-[10px] font-bold py-0 bg-emerald-600 text-white">
            APPROVED
          </Badge>
        );
      case "INSUFFICIENT_EVIDENCE":
        return (
          <Badge variant="warning" className="text-[10px] font-bold py-0">
            UNCONFIRMED
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] font-bold py-0">
            {status}
          </Badge>
        );
    }
  };

  const totalInvoiced = summary?.total_invoiced_amount ?? (summary as any)?.total_billed_idr ?? 0;
  const totalVariance = summary?.total_variance_amount ?? (summary as any)?.total_variance_idr ?? 0;
  const totalInvoicesCount = summary?.total_invoices_count ?? items.length;
  const openExceptionsCount = summary?.open_exceptions_count ?? 0;
  const urgentDisputesCount = summary?.urgent_disputes_count ?? 0;
  const matchesCount = summary?.matches_count ?? 0;

  return (
    <div className="space-y-6 max-w-7xl font-sans">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Invoiced Spend */}
        <Card className="border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all bg-white rounded-2xl">
          <CardHeader className="p-4 pb-1 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Invoiced Spend
            </span>
            <CardTitle className="text-xl font-extrabold text-slate-900 tracking-tight font-tabular">
              {formatCompactIDR(totalInvoiced)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-[#243A5E]" />
            <span>Dari {totalInvoicesCount} total tagihan di-audit</span>
          </CardContent>
        </Card>

        {/* KPI 2: Total Variance */}
        <Card className="border border-rose-200/80 bg-rose-50/40 shadow-2xs hover:shadow-xs transition-all rounded-2xl">
          <CardHeader className="p-4 pb-1 space-y-0.5">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center justify-between">
              <span>Potensi Kebocoran (Overcharge)</span>
              <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
            </span>
            <CardTitle className="text-xl font-extrabold text-rose-950 tracking-tight font-tabular">
              +{formatCompactIDR(totalVariance)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-rose-700">
            <span>Total selisih tarif dari kontrak PKS</span>
          </CardContent>
        </Card>

        {/* KPI 3: Open Exceptions */}
        <Card className="border border-amber-200/80 bg-amber-50/40 shadow-2xs hover:shadow-xs transition-all rounded-2xl">
          <CardHeader className="p-4 pb-1 space-y-0.5">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
              <span>Antrean Anomali Aktif</span>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            </span>
            <CardTitle className="text-xl font-extrabold text-amber-950 tracking-tight font-tabular">
              {openExceptionsCount} Kasus
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-amber-700 flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>{urgentDisputesCount} kasus sisa waktu &le; 7 hari</span>
          </CardContent>
        </Card>

        {/* KPI 4: Clean Matches */}
        <Card className="border border-emerald-200/80 bg-emerald-50/40 shadow-2xs hover:shadow-xs transition-all rounded-2xl">
          <CardHeader className="p-4 pb-1 space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
              <span>Clean Matches / Siap Bayar</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </span>
            <CardTitle className="text-xl font-extrabold text-emerald-950 tracking-tight font-tabular">
              {matchesCount} Tagihan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-emerald-700">
            <span>100% cocok dengan tarif &amp; bukti POD</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Table Area */}
      <Card className="border border-slate-200/90 shadow-2xs bg-white rounded-2xl overflow-hidden">
        {/* Toolbar & Filter Bar */}
        <CardHeader className="p-4 pb-3 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nomor invoice, shipment ID, atau vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8.5 text-xs bg-white border-slate-200 rounded-xl"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="EXCEPTION">Exception (Anomali)</option>
              <option value="MATCH">Match (Cocok)</option>
              <option value="APPROVED">Approved (Sah)</option>
              <option value="DUPLICATE">Duplicate</option>
              <option value="INSUFFICIENT_EVIDENCE">Unconfirmed</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-8.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Semua Tingkat Risiko</option>
              <option value="HIGH">Risiko Tinggi (HIGH)</option>
              <option value="MEDIUM">Risiko Sedang (MEDIUM)</option>
              <option value="LOW">Risiko Rendah (LOW)</option>
            </select>

            {/* Vendor Filter */}
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="h-8.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Semua Vendor</option>
              {vendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQueueData}
              disabled={isLoading}
              className="h-8.5 px-2.5 text-xs font-semibold bg-white border-slate-200 rounded-xl cursor-pointer"
            >
              <RotateCw className={`h-3.5 w-3.5 text-slate-600 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        {/* Table Body */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-slate-500 space-y-2">
              <div className="animate-spin w-6 h-6 border-2 border-[#1B2A4A] border-t-transparent rounded-full mx-auto" />
              <span>Memuat antrean rekonsiliasi dari database Supabase...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400 space-y-2">
              <Inbox className="h-8 w-8 text-slate-300 mx-auto" />
              <p>Tidak ada transaksi yang cocok dengan filter pencarian.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Prioritas</th>
                    <th className="py-3 px-3">Nomor Faktur / Ref</th>
                    <th className="py-3 px-3">Mitra 3PL</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Temuan Utama</th>
                    <th className="py-3 px-3">Nilai Tagih</th>
                    <th className="py-3 px-3">Ekspektasi</th>
                    <th className="py-3 px-3">Selisih</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {items.map((item) => {
                    const isSelected = selectedEventId === item.event_id;
                    const isOvercharge = item.variance_amount > 0;

                    return (
                      <tr
                        key={item.event_id}
                        onClick={() => onSelectTransaction(item.event_id)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          isSelected ? "bg-[#EDF4FA]/70 font-semibold" : ""
                        }`}
                      >
                        {/* Priority Score */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${
                                item.priority_level === "HIGH"
                                  ? "bg-rose-500"
                                  : item.priority_level === "MEDIUM"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                            />
                            <span className="font-mono text-xs font-bold text-slate-700">
                              {item.priority_score.toFixed(0)}
                            </span>
                          </div>
                        </td>

                        {/* Invoice & Shipment */}
                        <td className="py-3 px-3">
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 font-mono block">
                              {item.invoice_number}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[140px]">
                              {item.shipment_id}
                            </span>
                          </div>
                        </td>

                        {/* Vendor Name */}
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 block truncate max-w-xs">
                            {item.vendor_name || item.vendor_id}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.vendor_id}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          {renderStatusBadge(item.status)}
                        </td>

                        {/* Primary Discrepancy */}
                        <td className="py-3 px-3">
                          {(item.primary_discrepancy || item.top_discrepancy || (item.variance_amount > 0 && item.status === "EXCEPTION" ? `[RATE_OVERCHARGE] +${formatIDR(item.variance_amount)}` : "")) ? (
                            <span
                              className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 block truncate max-w-[170px]"
                              title={item.primary_discrepancy || item.top_discrepancy || `Overcharge +${formatIDR(item.variance_amount)}`}
                            >
                              {item.primary_discrepancy || item.top_discrepancy || `[RATE_OVERCHARGE] +${formatIDR(item.variance_amount)}`}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Tidak ada anomali
                            </span>
                          )}
                        </td>

                        {/* Billed Amount */}
                        <td className="py-3 px-3 font-mono font-medium text-slate-700">
                          {formatIDR(item.billed_amount)}
                        </td>

                        {/* Expected Amount */}
                        <td className="py-3 px-3 font-mono font-medium text-slate-600">
                          {formatIDR(item.expected_amount)}
                        </td>

                        {/* Variance */}
                        <td className="py-3 px-3">
                          {item.variance_amount === 0 ? (
                            <span className="text-slate-400 font-mono text-xs">Rp 0</span>
                          ) : (
                            <span
                              className={`font-mono text-xs font-bold ${
                                isOvercharge ? "text-rose-700" : "text-emerald-700"
                              }`}
                            >
                              {isOvercharge ? "+" : ""}
                              {formatIDR(item.variance_amount)}
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTransaction(item.event_id);
                            }}
                            className="h-7 px-2 text-[11px] font-bold text-slate-600 hover:text-[#1B2A4A] hover:bg-slate-100 gap-1 cursor-pointer"
                          >
                            <span>Periksa Bukti</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
