"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QueueSummary } from "@/types/reconciliation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Truck,
  ArrowRight,
  Inbox,
  FileSpreadsheet,
} from "lucide-react";

interface OverviewViewProps {
  summary?: QueueSummary;
  onNavigateToQueue: () => void;
  onNavigateToContracts?: () => void;
  onSelectTransaction: (eventId: string) => void;
}

const API_BASE = "http://localhost:8080/api/v1";

export function OverviewView({
  summary: initialSummary,
  onNavigateToQueue,
  onNavigateToContracts,
}: OverviewViewProps) {
  const [summary, setSummary] = useState<QueueSummary>(
    initialSummary || {
      total_invoiced_amount: 0,
      total_variance_amount: 0,
      total_invoices_count: 0,
      open_exceptions_count: 0,
      urgent_disputes_count: 0,
      matches_count: 0,
    }
  );

  const formatIDR = (val?: number | null) => {
    const num = val ?? 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/reconcile/queue?page_size=1`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Overview summary fetch error:", err);
    }
  }, []);

  useEffect(() => {
    if (!initialSummary || initialSummary.total_invoices_count === 0) {
      fetchSummary();
    }
  }, [initialSummary, fetchSummary]);

  const totalInvoiced = summary?.total_invoiced_amount ?? (summary as any)?.total_billed_idr ?? 0;
  const totalVariance = summary?.total_variance_amount ?? (summary as any)?.total_variance_idr ?? 0;
  const openExceptions = summary?.open_exceptions_count ?? 0;
  const cleanMatches = summary?.matches_count ?? (summary as any)?.clean_matches_count ?? 0;
  const totalInvoices = summary?.total_invoices_count ?? 0;

  return (
    <div className="space-y-6 font-sans max-w-7xl">
      {/* Sleek Enterprise Top Banner */}
      <div className="p-6 rounded-2xl bg-[#1B2A4A] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm border border-slate-700/50">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] px-2 py-0.5 font-semibold">
              3PL AUDIT ENGINE &bull; AUGUST 2026
            </Badge>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Automated 4-Way Matching Active
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Logistics Spend &amp; Reconciliation Overview
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Pusat monitoring tagihan logistik, verifikasi kontrak PKS rate, dan penyelesaian overcharge anomali vendor langsung dari database Supabase.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={onNavigateToQueue}
            className="bg-sky-500 text-white hover:bg-sky-400 font-bold text-xs h-10 px-4 gap-2 shadow-xs cursor-pointer rounded-xl"
          >
            <span>Review Queue ({openExceptions})</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2 BIG CARDS: REVIEW QUEUE & 3PL VENDORS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: REVIEW QUEUE & TRANSAKSI */}
        <Card className="border border-slate-200/90 shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col justify-between hover:border-sky-300 transition-all">
          <div>
            <CardHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-sky-600" />
                  Review Queue &amp; Transaksi
                </span>
                <Badge variant="outline" className="bg-white text-slate-700 font-bold text-xs border-slate-200 px-2 py-0.5 font-mono">
                  Supabase Live
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-900 font-tabular">
                    {totalInvoices}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    Total Transaksi Logistik
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Total nilai tagihan terbit: <strong className="text-slate-800 font-mono">{formatIDR(totalInvoiced)}</strong>
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    <span>Perlu Review</span>
                  </div>
                  <div className="text-2xl font-black text-rose-800 font-tabular">
                    {openExceptions} <span className="text-xs font-medium text-rose-600">kasus</span>
                  </div>
                  <div className="text-[11px] text-rose-700 font-semibold font-mono">
                    +{formatIDR(totalVariance)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Sesuai Kontrak</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-800 font-tabular">
                    {cleanMatches} <span className="text-xs font-medium text-emerald-600">match</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    100% Validasi Auto-Pass
                  </div>
                </div>
              </div>
            </CardContent>
          </div>

          <div className="p-4 px-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {openExceptions > 0 ? `${openExceptions} anomali membutuhkan keputusan sanggahan` : "Semua transaksi telah teraudit"}
            </span>
            <Button
              onClick={onNavigateToQueue}
              size="sm"
              className="bg-[#1B2A4A] text-white hover:bg-sky-600 font-bold text-xs gap-1.5 cursor-pointer rounded-lg"
            >
              <span>Buka Review Queue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>

        {/* CARD 2: MITRA 3PL VENDOR & KONTRAK */}
        <Card className="border border-slate-200/90 shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col justify-between hover:border-sky-300 transition-all">
          <div>
            <CardHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Truck className="h-4 w-4 text-sky-600" />
                  Mitra Logistik 3PL
                </span>
                <Badge variant="outline" className="bg-white text-slate-700 font-bold text-xs border-slate-200 px-2 py-0.5 font-mono">
                  rate_agreements
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-900 font-tabular">
                    5
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    Vendor Logistik Terdaftar
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Perjanjian tarif PKS terhubung aktif di database Supabase
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-3">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 block">
                  Daftar Mitra 3PL Aktif:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "PT Cepat Logistik Nusantara",
                    "PT Trans Express Indonesia",
                    "PT Kargo Andalan Utama",
                    "PT Sinar Logistik Mandiri",
                    "PT Aruna Freight Solusi",
                  ].map((v) => (
                    <span
                      key={v}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 text-xs text-sky-900 flex items-center gap-2.5">
                <FileSpreadsheet className="h-4 w-4 text-sky-600 shrink-0" />
                <span>
                  Aturan tarif dasar (*base rate*), *min weight*, PPN 11%, dan *lead-time SLA* teraudit secara otomatis.
                </span>
              </div>
            </CardContent>
          </div>

          <div className="p-4 px-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              5 Master PKS aktif &bull; Supabase Storage
            </span>
            <Button
              onClick={onNavigateToContracts || onNavigateToQueue}
              size="sm"
              variant="outline"
              className="border-slate-300 text-slate-800 hover:bg-[#1B2A4A] hover:text-white font-bold text-xs gap-1.5 cursor-pointer rounded-lg"
            >
              <span>Lihat Kontrak (PKS)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
