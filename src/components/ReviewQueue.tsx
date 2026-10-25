"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { QueueItem, QueueSummary } from "@/types/reconciliation";
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
  Folder,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewQueueProps {
  selectedEventId?: string | null;
  onSelectTransaction: (eventId: string, allBatchItems?: QueueItem[]) => void;
  onRefresh?: () => void;
  onNavigateToFinalApproval?: () => void;
}

export function ReviewQueue({
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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchQueueData = useCallback(
    async (isManualRefresh = false) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        if (severityFilter !== "ALL") params.set("severity", severityFilter);
        if (vendorFilter !== "ALL") params.set("vendor", vendorFilter);
        if (search.trim() !== "") params.set("search", search.trim());

        const res = await fetch(`/api/review-queue?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          throw new Error(errJson?.error || `Gagal mengambil data antrean (HTTP ${res.status})`);
        }

        const data = await res.json();
        setItems(data.items || []);
        if (data.summary) {
          setSummary(data.summary);
        }
        if (isManualRefresh) {
          showToast("Data antrean berhasil diperbarui", "success");
        }
        if (onRefresh) onRefresh();
      } catch (err: any) {
        console.error("Queue fetch error:", err);
        setErrorMessage(err?.message || "Terjadi kesalahan saat menghubungi server.");
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, severityFilter, vendorFilter, search, onRefresh, showToast]
  );

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  // Unique vendors from items
  const vendors = useMemo(() => {
    const set = new Set(items.map((i) => i.vendor_name || i.vendor_id));
    return Array.from(set).filter(Boolean);
  }, [items]);

  // Group items by ingest batch
  const folderGroups = useMemo(() => {
    const groups = new Map<string, QueueItem[]>();
    items.forEach((item) => {
      const key = item.ingest_batch_id || "batch-default";
      groups.set(key, [...(groups.get(key) || []), item]);
    });
    return Array.from(groups.entries()).map(([id, groupItems]) => {
      const totalBilled = groupItems.reduce((acc, it) => acc + (it.billed_amount || 0), 0);
      const totalVariance = groupItems.reduce((acc, it) => acc + (it.variance_amount || 0), 0);
      const hasCritical = groupItems.some((it) => it.highest_severity === "CRITICAL");
      const hasHigh = groupItems.some((it) => it.highest_severity === "HIGH");
      const highestSeverity = hasCritical ? "CRITICAL" : hasHigh ? "HIGH" : "MEDIUM";

      return {
        id,
        items: groupItems,
        label:
          id === "batch-default"
            ? "Antrean Tagihan Siap Audit"
            : `Batch Ingest ${id.slice(0, 8)}`,
        totalBilled,
        totalVariance,
        highestSeverity,
      };
    });
  }, [items]);

  const renderSeverityBadge = (severity?: string) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-2xs">
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-600 text-white shadow-2xs">
            HIGH
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
            MEDIUM
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
            LOW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-700">
            {severity || "-"}
          </span>
        );
    }
  };

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
        {/* Card 1: Total Invoiced Spend */}
        <Card className="border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all bg-white rounded-2xl">
          <CardHeader className="p-4 pb-1 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Invoiced Spend
            </span>
            <CardTitle className="text-xl font-extrabold text-slate-900 tracking-tight font-tabular">
              {isLoading ? (
                <div className="h-7 w-28 bg-slate-200 animate-pulse rounded" />
              ) : (
                formatCompactIDR(summary.total_invoiced_amount)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-[#243A5E]" />
            <span>Dari {summary.total_invoices_count} total tagihan di-audit</span>
          </CardContent>
        </Card>

        {/* Card 2: Potensi Kebocoran (Overcharge) */}
        <Card className="border border-rose-200/80 bg-rose-50/40 shadow-2xs hover:shadow-xs transition-all rounded-2xl">
          <CardHeader className="p-4 pb-1 space-y-0.5">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center justify-between">
              <span>Potensi Kebocoran (Overcharge)</span>
              <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
            </span>
            <CardTitle className="text-xl font-extrabold text-rose-950 tracking-tight font-tabular">
              {isLoading ? (
                <div className="h-7 w-28 bg-rose-200 animate-pulse rounded" />
              ) : (
                `+${formatCompactIDR(summary.total_variance_amount)}`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-rose-700">
            <span>Total selisih tarif dari kontrak PKS</span>
          </CardContent>
        </Card>

        {/* Card 3: Antrean Anomali Aktif */}
        <Card className="border border-amber-200/80 bg-amber-50/40 shadow-2xs hover:shadow-xs transition-all rounded-2xl">
          <CardHeader className="p-4 pb-1 space-y-0.5">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
              <span>Antrean Anomali Aktif</span>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            </span>
            <CardTitle className="text-xl font-extrabold text-amber-950 tracking-tight font-tabular">
              {isLoading ? (
                <div className="h-7 w-20 bg-amber-200 animate-pulse rounded" />
              ) : (
                `${summary.open_exceptions_count} Kasus`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-amber-700 flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>{summary.urgent_disputes_count} kasus sisa waktu ≤ 7 hari</span>
          </CardContent>
        </Card>

        {/* Card 4: Clean Matches / Siap Bayar */}
        <Card className="border border-emerald-200/80 bg-emerald-50/40 shadow-2xs hover:shadow-xs transition-all rounded-2xl">
          <CardHeader className="p-4 pb-1 space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
              <span>Clean Matches / Siap Bayar</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </span>
            <CardTitle className="text-xl font-extrabold text-emerald-950 tracking-tight font-tabular">
              {isLoading ? (
                <div className="h-7 w-20 bg-emerald-200 animate-pulse rounded" />
              ) : (
                `${summary.matches_count} Tagihan`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-emerald-700 flex items-center justify-between">
            <span>100% cocok dengan tarif &amp; bukti POD</span>
            {onNavigateToFinalApproval && summary.matches_count > 0 && (
              <button
                type="button"
                onClick={onNavigateToFinalApproval}
                className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>Final Approval</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter & Folder List Area */}
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
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-8.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Semua Tingkat Risiko</option>
              <option value="CRITICAL">Kritis (CRITICAL)</option>
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

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchQueueData(true)}
              disabled={isLoading}
              className="h-8.5 px-3 text-xs font-semibold bg-white border-slate-200 rounded-xl cursor-pointer gap-1.5"
              title="Refresh Data"
            >
              <RotateCw className={`h-3.5 w-3.5 text-slate-600 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </Button>
          </div>
        </CardHeader>

        {/* Info Banner */}
        {statusFilter === "ANOMALI" && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-[11px] text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Menampilkan folder berkas transaksi anomali (EXCEPTION, DUPLICATE, INSUFFICIENT_EVIDENCE).
              Transaksi MATCH langsung masuk ke <strong>Final Approval</strong>.
            </span>
          </div>
        )}

        {/* Content: Folder Cards Only (No Dropdown, No Per-File Rows) */}
        <CardContent className="p-0">
          {isLoading ? (
            /* Skeleton Loading State */
            <div className="p-6 space-y-4">
              <div className="h-20 bg-slate-100 animate-pulse rounded-2xl" />
              <div className="text-center text-xs text-slate-400 pt-2 flex items-center justify-center gap-2">
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                <span>Memuat folder antrean anomali dari Supabase...</span>
              </div>
            </div>
          ) : errorMessage ? (
            /* Error State */
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">Gagal Memuat Antrean Anomali</p>
                <p className="text-xs text-rose-600 max-w-md mx-auto">{errorMessage}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchQueueData(true)}
                className="text-xs font-semibold mt-2 cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5 mr-1.5" />
                <span>Coba Lagi</span>
              </Button>
            </div>
          ) : folderGroups.length === 0 || items.length === 0 ? (
            /* Empty State */
            <div className="p-16 text-center text-xs text-slate-400 space-y-2">
              <Inbox className="h-8 w-8 text-slate-300 mx-auto" />
              <p>Tidak ada transaksi anomali saat ini. Semua transaksi sudah bersih atau telah diproses.</p>
            </div>
          ) : (
            /* Folder Rows (Folder Saja, Tanpa Dropdown Baris File) */
            <div className="divide-y divide-slate-100">
              {folderGroups.map((folder) => {
                const firstItem = folder.items[0];
                const anomalyCount = folder.items.filter((i) =>
                  ["EXCEPTION", "DUPLICATE", "INSUFFICIENT_EVIDENCE"].includes(i.status)
                ).length;

                return (
                  <div
                    key={folder.id}
                    className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Folder Info */}
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                        <Folder className="h-6 w-6 text-amber-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{folder.label}</span>
                          <Badge
                            variant="outline"
                            className="text-[11px] font-semibold border-slate-300 text-slate-600"
                          >
                            {folder.items.length} transaksi
                          </Badge>
                          {anomalyCount > 0 && (
                            <Badge className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {anomalyCount} anomali
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500">
                          <span>
                            Total Tagihan:{" "}
                            <strong className="text-slate-800 font-mono">
                              {formatIDR(folder.totalBilled)}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Potensi Selisih:{" "}
                            <strong className="text-rose-700 font-mono">
                              +{formatIDR(folder.totalVariance)}
                            </strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            Risiko Tertinggi: {renderSeverityBadge(folder.highestSeverity)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button: Lihat Detail */}
                    {firstItem && (
                      <Button
                        size="sm"
                        onClick={() => onSelectTransaction(firstItem.event_id, folder.items)}
                        className="h-9 px-4 text-xs font-bold bg-[#243A5E] hover:bg-[#1B2A4A] text-white gap-2 shadow-xs cursor-pointer transition-all shrink-0 ml-auto md:ml-0"
                        title="Buka Lembar Kerja Seluruh Transaksi Batch"
                      >
                        <span>Lihat Detail</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
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
