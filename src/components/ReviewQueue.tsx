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
  Inbox,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
  TrendingDown,
  DollarSign,
  ThumbsUp,
  FileCheck2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewQueueProps {
  selectedEventId: string | null;
  onSelectTransaction: (eventId: string) => void;
  onRefresh?: () => void;
  onNavigateToFinalApproval?: () => void;
}

const API_BASE = "http://localhost:8080/api/v1";

// Anomali statuses that belong in Review Queue
const ANOMALI_STATUSES = "EXCEPTION,DUPLICATE,INSUFFICIENT_EVIDENCE";

export function ReviewQueue({
  selectedEventId,
  onSelectTransaction,
  onRefresh,
  onNavigateToFinalApproval,
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
  // Default: show anomali only (EXCEPTION, DUPLICATE, INSUFFICIENT_EVIDENCE)
  const [statusFilter, setStatusFilter] = useState<string>("ANOMALI");
  const [vendorFilter, setVendorFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

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

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Build actual status param for API
  const getStatusParam = () => {
    if (statusFilter === "ANOMALI") return ANOMALI_STATUSES;
    if (statusFilter === "ALL") return "";
    return statusFilter;
  };

  const fetchQueueData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const statusParam = getStatusParam();
      if (statusParam) params.set("status", statusParam);
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
        return <Badge variant="success" className="text-[10px] font-bold py-0">MATCH</Badge>;
      case "EXCEPTION":
        return <Badge variant="destructive" className="text-[10px] font-bold py-0">EXCEPTION</Badge>;
      case "DUPLICATE":
        return <Badge variant="brand" className="text-[10px] font-bold py-0">DUPLICATE</Badge>;
      case "APPROVED":
        return <Badge variant="success" className="text-[10px] font-bold py-0 bg-emerald-600 text-white">APPROVED</Badge>;
      case "DISPUTED":
        return <Badge variant="destructive" className="text-[10px] font-bold py-0 bg-orange-600 text-white">DISPUTED</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="text-[10px] font-bold py-0 text-slate-500">REJECTED</Badge>;
      case "INSUFFICIENT_EVIDENCE":
        return <Badge variant="warning" className="text-[10px] font-bold py-0">UNCONFIRMED</Badge>;
    }
  };

  const totalInvoiced = useMemo(
    () => items.reduce((sum, item) => sum + (item.billed_amount || 0), 0),
    [items]
  );
  const totalVariance = useMemo(
    () => items.reduce((sum, item) => sum + (item.variance_amount || 0), 0),
    [items]
  );
  const totalInvoicesCount = items.length;
  const openExceptionsCount = useMemo(
    () => items.filter((i) => ["EXCEPTION", "DUPLICATE", "INSUFFICIENT_EVIDENCE"].includes(i.status)).length,
    [items]
  );
  const urgentDisputesCount = useMemo(
    () => items.filter((i) => (i.days_remaining_to_dispute ?? 0) <= 7 && ["EXCEPTION", "DUPLICATE", "INSUFFICIENT_EVIDENCE"].includes(i.status)).length,
    [items]
  );
  const matchesCount = useMemo(
    () => items.filter((i) => i.status === "MATCH" || i.status === "APPROVED").length,
    [items]
  );

  return (
    <div className="space-y-6 max-w-7xl font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold max-w-sm",
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          )}
        >
          {toast.msg}
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all bg-white rounded-2xl">
          <CardHeader className="p-4 pb-1 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced Spend</span>
            <CardTitle className="text-xl font-extrabold text-slate-900 tracking-tight font-tabular">
              {formatCompactIDR(totalInvoiced)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-[#243A5E]" />
            <span>Dari {totalInvoicesCount} total tagihan di-audit</span>
          </CardContent>
        </Card>

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
            <span>{urgentDisputesCount} kasus sisa waktu ≤ 7 hari</span>
          </CardContent>
        </Card>

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
              <option value="ANOMALI">⚠️ Anomali (Default)</option>
              <option value="ALL">Semua Status</option>
              <option value="EXCEPTION">Exception</option>
              <option value="DUPLICATE">Duplicate</option>
              <option value="INSUFFICIENT_EVIDENCE">Unconfirmed</option>
              <option value="MATCH">Match (Lolos)</option>
              <option value="APPROVED">Approved</option>
              <option value="DISPUTED">Disputed</option>
              <option value="REJECTED">Rejected</option>
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
                <option key={v} value={v}>{v}</option>
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

        {/* Info Banner */}
        {statusFilter === "ANOMALI" && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-[11px] text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Menampilkan transaksi anomali saja (EXCEPTION, DUPLICATE, INSUFFICIENT_EVIDENCE). Transaksi MATCH langsung masuk <strong>Final Approval</strong>.</span>
          </div>
        )}

        {/* Table Body */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-slate-500 space-y-2">
              <div className="animate-spin w-6 h-6 border-2 border-[#1B2A4A] border-t-transparent rounded-full mx-auto" />
              <span>Memuat antrean rekonsiliasi...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400 space-y-2">
              <Inbox className="h-8 w-8 text-slate-300 mx-auto" />
              <p>Tidak ada transaksi anomali saat ini. Semua transaksi sudah bersih atau telah diproses.</p>
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
                    <th className="py-3 px-4 text-right">Bukti / Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {items.map((item) => {
                    const isSelected = selectedEventId === item.event_id;
                    const computedVariance = (item.billed_amount && item.expected_amount)
                      ? (item.billed_amount - item.expected_amount)
                      : (item.variance_amount || 0);
                    const isOvercharge = computedVariance > 0;
                    const isUndercharge = computedVariance < 0;
                    const isAnomalous = ["EXCEPTION", "DUPLICATE", "INSUFFICIENT_EVIDENCE"].includes(item.status);

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
                              {(item.priority_score || 0).toFixed(0)}
                            </span>
                          </div>
                        </td>

                        {/* Invoice & Shipment */}
                        <td className="py-3 px-3">
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 font-mono block">{item.invoice_number}</span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[140px]">{item.shipment_id}</span>
                          </div>
                        </td>

                        {/* Vendor Name */}
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 block truncate max-w-xs">{item.vendor_name || item.vendor_id}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.vendor_id}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">{renderStatusBadge(item.status)}</td>

                        {/* Primary Discrepancy */}
                        <td className="py-3 px-3">
                          {(item.primary_discrepancy || item.top_discrepancy || (computedVariance !== 0 && isAnomalous)) ? (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded border block truncate max-w-[170px] ${
                                isOvercharge
                                  ? "text-rose-700 bg-rose-50 border-rose-200"
                                  : "text-amber-700 bg-amber-50 border-amber-200"
                              }`}
                              title={item.primary_discrepancy || item.top_discrepancy || (isOvercharge ? `Overcharge +${formatIDR(computedVariance)}` : `Discrepancy -${formatIDR(Math.abs(computedVariance))}`)}
                            >
                              {item.primary_discrepancy || item.top_discrepancy || (isOvercharge ? `[RATE_OVERCHARGE] +${formatIDR(computedVariance)}` : `[PRICE_DISCREPANCY] -${formatIDR(Math.abs(computedVariance))}`)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Tidak ada anomali</span>
                          )}
                        </td>

                        {/* Billed Amount */}
                        <td className="py-3 px-3 font-mono font-medium text-slate-700">{formatIDR(item.billed_amount)}</td>

                        {/* Expected Amount */}
                        <td className="py-3 px-3 font-mono font-medium text-slate-600">{formatIDR(item.expected_amount)}</td>

                        {/* Variance */}
                        <td className="py-3 px-3">
                          {computedVariance === 0 ? (
                            <span className="text-slate-400 font-mono text-xs">Rp 0</span>
                          ) : isOvercharge ? (
                            <span className="font-mono text-xs font-bold text-rose-700">
                              +{formatIDR(computedVariance)}
                            </span>
                          ) : (
                            <span className="font-mono text-xs font-bold text-amber-700">
                              -{formatIDR(Math.abs(computedVariance))}
                            </span>
                          )}
                        </td>

                        {/* Action: Direct Evidence Inspection */}
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTransaction(item.event_id);
                            }}
                            className="h-7 px-3 text-[11px] font-bold text-[#243A5E] hover:text-white hover:bg-[#243A5E] border-slate-300 gap-1.5 shadow-2xs cursor-pointer ml-auto transition-all"
                            title="Inspect Bukti Spasial Dokumen di Evidence Workspace"
                          >
                            <span>Lihat Bukti</span>
                            <ArrowRight className="h-3.5 w-3.5" />
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
