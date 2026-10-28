"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { QueueItem } from "@/types/reconciliation";
import { API_V1 } from "@/lib/config";
import { getStoredUser } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  CheckCircle2,
  Search,
  RotateCw,
  CheckCheck,
  FileCheck2,
  DollarSign,
  Lock,
  Sparkles,
  History,
  ArrowUpRight,
  UserCheck,
} from "lucide-react";

interface FinalApprovalViewProps {
  onSelectTransaction: (eventId: string) => void;
  onRefresh?: () => void;
  onNavigateToAudit?: () => void;
}

const API_BASE = API_V1;

export function FinalApprovalView({
  onSelectTransaction,
  onRefresh,
  onNavigateToAudit,
}: FinalApprovalViewProps) {
  const [sodTab, setSodTab] = useState<"PENDING" | "HISTORY">("PENDING");
  const [search, setSearch] = useState("");
  const [filterVendor, setFilterVendor] = useState("ALL");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [notes, setNotes] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const formatIDR = (val?: number | null) => {
    const num = val ?? 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Fetch data from database specifically targeted to active sub-tab and filters
  const fetchSodData = useCallback(async () => {
    setIsLoading(true);
    try {
      // PENDING: fetch MATCH (auto-pass clean) + APPROVED (AP_MANAGER approved anomali)
      // Both statuses are ready for Finance Controller final sign-off
      // HISTORY: fetch only APPROVED items that went through FC final release
      const targetStatus = sodTab === "PENDING" ? "MATCH,APPROVED" : "APPROVED";
      const params = new URLSearchParams();
      params.set("status", targetStatus);
      if (filterVendor !== "ALL") params.set("vendor", filterVendor);
      if (search.trim() !== "") params.set("search", search.trim());
      params.set("page_size", "50");

      const res = await fetch(`${API_BASE}/reconcile/queue?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data antrean SoD");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("SoD fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sodTab, filterVendor, search]);

  useEffect(() => {
    fetchSodData();
  }, [fetchSodData]);

  const vendors = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.vendor_id)));
  }, [items]);

  // Totals for current view
  const totalDisbursementSum = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.expected_amount || item.billed_amount), 0);
  }, [items]);

  const totalLeakageSum = useMemo(() => {
    return items.reduce((acc, item) => acc + Math.max(0, item.variance_amount || 0), 0);
  }, [items]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(items.map((i) => i.event_id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExecuteFinalApproval = async () => {
    if (selectedIds.length === 0) return;
    setIsAuthorizing(true);

    try {
      // Send decision for each selected invoice with role FINANCE_CONTROLLER
      for (const id of selectedIds) {
        await fetch(`${API_BASE}/reconcile/${id}/decision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "APPROVE",
            reviewer_id: getStoredUser()?.id,
            role: "FINANCE_CONTROLLER",
            reason: notes || "Final SoD Payment Release Authorized by Finance Controller",
          }),
        }).catch(() => {});
      }

      setSelectedIds([]);
      setShowConfirmModal(false);
      setNotes("");
      fetchSodData();
      if (onRefresh) onRefresh();
      // Navigate to Audit Ledger after successful final approval
      setTimeout(() => {
        if (onNavigateToAudit) onNavigateToAudit();
      }, 1500);
    } catch (err) {
      console.error("Authorization error:", err);
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl font-sans">
      {/* 1. Top Header - Simplified */}
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Final Approval
        </h2>
      </div>

      {/* 2. Sub-Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSodTab("PENDING");
              setSelectedIds([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sodTab === "PENDING"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Menunggu Otorisasi</span>
          </button>

          <button
            onClick={() => {
              setSodTab("HISTORY");
              setSelectedIds([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sodTab === "HISTORY"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <History className="h-4 w-4" />
            <span>Riwayat Otorisasi</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: PENDING APPROVAL TAB (Query: status=MATCH)                         */}
      {/* ========================================================================= */}
      {sodTab === "PENDING" && (
        <div className="space-y-6">
          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
              <CardHeader className="p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Dana Siap Cair
                </span>
                <CardTitle className="text-2xl font-bold text-slate-900 font-tabular">
                  {formatIDR(totalDisbursementSum)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
              <CardHeader className="p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Clean Matches
                </span>
                <CardTitle className="text-2xl font-bold text-slate-900 font-tabular">
                  {items.length} Tagihan
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
              <CardHeader className="p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Potensi Kebocoran Dicegah
                </span>
                <CardTitle className="text-2xl font-bold text-slate-900 font-tabular">
                  {formatIDR(totalLeakageSum)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filter & Table Area */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari nomor invoice, shipment ID, atau vendor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8.5 text-xs bg-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={filterVendor}
                  onChange={(e) => setFilterVendor(e.target.value)}
                  className="h-8.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="ALL">Semua Mitra 3PL ({vendors.length})</option>
                  {vendors.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <div className="text-xs text-slate-600 font-medium">
                  <History className="inline h-3.5 w-3.5 mr-1" />
                  Riwayat: {items.length} transaksi
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-16 text-center text-xs text-slate-500 space-y-2">
                  <div className="animate-spin w-6 h-6 border-2 border-[#1B2A4A] border-t-transparent rounded-full mx-auto" />
                  <span>Mengambil data transaksi status=MATCH...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCheck className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-800">
                      Semua Tagihan Terverifikasi Telah Disetujui
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Tidak ada tagihan yang sedang menunggu otorisasi final saat ini. Anda dapat melihat riwayat transaksi yang telah disetujui pada tab Riwayat Otorisasi.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSodTab("HISTORY")}
                    className="text-xs font-bold gap-1.5 h-8 bg-white border-slate-300 cursor-pointer"
                  >
                    <History className="h-3.5 w-3.5 text-sky-600" />
                    <span>Lihat Riwayat Persetujuan (status=APPROVED)</span>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === items.length && items.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-3 px-3">Nomor Faktur / Ref</th>
                        <th className="py-3 px-3">Mitra 3PL</th>
                        <th className="py-3 px-3">Rute & Layanan</th>
                        <th className="py-3 px-3">Nilai Disetujui (Disbursement)</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {items.map((item) => {
                        const isSelected = selectedIds.includes(item.event_id);

                        return (
                          <tr
                            key={item.event_id}
                            className={`transition-colors ${
                              isSelected ? "bg-sky-50/50" : "hover:bg-slate-50/70"
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(item.event_id)}
                                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                            </td>

                            <td className="py-3 px-3">
                              <div className="min-w-0">
                                <span className="font-extrabold text-slate-900 font-mono block">
                                  {item.invoice_number}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {item.shipment_id}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-semibold text-slate-800 block truncate max-w-xs">
                                {item.vendor_name || item.vendor_id}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.vendor_id}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-slate-600">
                              <span className="font-medium text-slate-800 block">
                                JKT → SBY
                              </span>
                              <span className="text-[10px] text-slate-400">TRUCKING_FTL</span>
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-extrabold font-mono text-emerald-700 text-sm">
                                {formatIDR(item.expected_amount || item.billed_amount)}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onSelectTransaction(item.event_id)}
                                  className="text-[11px] h-7 px-2 font-bold text-slate-600 hover:text-[#1B2A4A] hover:bg-slate-100 cursor-pointer"
                                >
                                  Detail Bukti
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedIds([item.event_id]);
                                    setShowConfirmModal(true);
                                  }}
                                  className="text-[11px] h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Release</span>
                                </Button>
                              </div>
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
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: APPROVED HISTORY TAB (Query: status=APPROVED)                      */}
      {/* ========================================================================= */}
      {sodTab === "HISTORY" && (
        <div className="space-y-6">
          {/* 4 Summary KPI Cards for History */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
              <CardHeader className="p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Dana Dicairkan
                </span>
                <CardTitle className="text-2xl font-bold text-slate-900 font-tabular">
                  {formatIDR(totalDisbursementSum)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
              <CardHeader className="p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Faktur Disetujui
                </span>
                <CardTitle className="text-2xl font-bold text-slate-900 font-tabular">
                  {items.length} Tagihan
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
              <CardHeader className="p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Kebocoran Finansial Dicegah
                </span>
                <CardTitle className="text-2xl font-bold text-slate-900 font-tabular">
                  {formatIDR(totalLeakageSum)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* History Table */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari nomor invoice, shipment ID, atau vendor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8.5 text-xs bg-white"
                />
              </div>

              <select
                value={filterVendor}
                onChange={(e) => setFilterVendor(e.target.value)}
                className="h-8.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Mitra 3PL ({vendors.length})</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-16 text-center text-xs text-slate-500 space-y-2">
                  <div className="animate-spin w-6 h-6 border-2 border-[#1B2A4A] border-t-transparent rounded-full mx-auto" />
                  <span>Mengambil data riwayat status=APPROVED...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                    <History className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-800">
                      Belum Ada Riwayat Otorisasi (status=APPROVED)
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Transaksi yang telah di-release oleh Financial Controller akan tercatat di sini secara permanen.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSodTab("PENDING")}
                    className="text-xs font-bold gap-1.5 h-8 bg-white border-slate-300 cursor-pointer"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Lihat Tagihan Menunggu Otorisasi</span>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Nomor Faktur / Ref</th>
                        <th className="py-3 px-3">Mitra 3PL</th>
                        <th className="py-3 px-3">Rute & Layanan</th>
                        <th className="py-3 px-3">Nilai Tagih Awal</th>
                        <th className="py-3 px-3">Nilai Sah Dicairkan</th>
                        <th className="py-3 px-3">Status Persetujuan</th>
                        <th className="py-3 px-3">Otorisator</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {items.map((item) => {
                        return (
                          <tr
                            key={item.event_id}
                            className="hover:bg-slate-50/70 transition-colors bg-emerald-50/15"
                          >
                            <td className="py-3 px-4">
                              <div className="min-w-0">
                                <span className="font-extrabold text-slate-900 font-mono block">
                                  {item.invoice_number}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {item.shipment_id}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-semibold text-slate-800 block truncate max-w-xs">
                                {item.vendor_name || item.vendor_id}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.vendor_id}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-slate-600">
                              <span className="font-medium text-slate-800 block">
                                JKT → SBY
                              </span>
                              <span className="text-[10px] text-slate-400">TRUCKING_FTL</span>
                            </td>

                            <td className="py-3 px-3 font-mono font-medium text-slate-600">
                              {formatIDR(item.billed_amount)}
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-extrabold font-mono text-emerald-700 text-sm">
                                {formatIDR(item.expected_amount || item.billed_amount)}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <Badge variant="success" className="text-[10px] font-bold py-0.5 px-2 gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>APPROVED &amp; RELEASED</span>
                              </Badge>
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-mono text-[11px] font-bold text-slate-700 block">
                                FINANCE_CONTROLLER
                              </span>
                              <span className="text-[10px] text-emerald-600 font-medium">
                                Tier-2 Signed Off
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onSelectTransaction(item.event_id)}
                                  className="text-[11px] h-7 px-2.5 font-bold text-slate-700 hover:text-[#1B2A4A] hover:bg-slate-100 gap-1 cursor-pointer"
                                >
                                  <span>Detail Bukti</span>
                                  <ArrowUpRight className="h-3 w-3" />
                                </Button>
                              </div>
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
      )}

      {/* 3. Confirmation Sign-off Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1B2A4A]">
                  Konfirmasi Otorisasi Pencairan Kas (SoD)
                </h3>
                <p className="text-xs text-slate-500">
                  Persetujuan akhir ({selectedIds.length} transaksi) untuk transfer pembayaran.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Jumlah Transaksi Terpilih:</span>
                <strong className="text-slate-900">{selectedIds.length} Tagihan</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Peran Otorisator:</span>
                <strong className="text-emerald-700 font-mono">FINANCE_CONTROLLER</strong>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1.5 font-bold">
                <span>Total Dana yang Di-release:</span>
                <span className="text-emerald-700 font-mono text-sm">
                  {formatIDR(
                    items
                      .filter((i) => selectedIds.includes(i.event_id))
                      .reduce((acc, i) => acc + (i.expected_amount || i.billed_amount), 0)
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Catatan Otorisasi Treasury / No. Batch Pembayaran (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Disetujui untuk transfer batch BCA Corporate 2026-08-20"
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
                disabled={isAuthorizing}
                className="text-xs font-semibold text-slate-500 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteFinalApproval}
                disabled={isAuthorizing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 gap-1.5 cursor-pointer"
              >
                {isAuthorizing ? (
                  <span>Mengotorisasi...</span>
                ) : (
                  <>
                    <CheckCheck className="h-4 w-4" />
                    <span>Tandatangani & Release Dana</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
