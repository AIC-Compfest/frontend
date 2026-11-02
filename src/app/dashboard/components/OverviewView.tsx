"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QueueSummary } from "@/types/reconciliation";
import { API_V1 } from "@/lib/config";
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

const API_BASE = API_V1;

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

  const [vendors, setVendors] = useState<Array<{ vendor_id: string; vendor_name: string; is_active: boolean }>>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [currentLanguageIndex, setCurrentLanguageIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState<string>("00:00:00");

  const languages = [
    { greeting: "Welcome back!!" },
    { greeting: "Selamat datang kembali!!" },
    { greeting: "おかえりなさい!!" },
    { greeting: "환영합니다!!" },
    { greeting: "欢迎回来!!" },
    { greeting: "Добро пожаловать!!" },
  ];

  const subtitleText = "Logistics spend reconciliation and audit engine powered by automated 4-way matching.";

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
      const url = `${API_BASE}/reconcile/queue?page_size=1`;
      console.log("Fetching summary from:", url);
      
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!res.ok) {
        console.error("Response not OK:", res.status, res.statusText);
        return;
      }
      
      const data = await res.json();
      console.log("Summary data received:", data);
      
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err: any) {
      console.error("Fetch summary error:", err?.message || err);
      // Silently fail - use initial summary if fetch fails
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    setVendorsLoading(true);
    try {
      const url = `${API_BASE}/vendors`;
      console.log("Fetching vendors from:", url);
      
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!res.ok) {
        console.error("Vendors response not OK:", res.status, res.statusText);
        setVendors([]);
        return;
      }
      
      const data = await res.json();
      console.log("Vendors data received:", data);
      
      setVendors(data.vendors || []);
    } catch (err: any) {
      console.error("Vendor fetch error:", err?.message || err);
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialSummary || initialSummary.total_invoices_count === 0) {
      fetchSummary();
    }
    fetchVendors();
  }, [initialSummary, fetchSummary, fetchVendors]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLanguageIndex((prev) => (prev + 1) % languages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [languages.length]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalInvoiced = summary?.total_invoiced_amount ?? (summary as any)?.total_billed_idr ?? 0;
  const totalVariance = summary?.total_variance_amount ?? (summary as any)?.total_variance_idr ?? 0;
  const openExceptions = summary?.open_exceptions_count ?? 0;
  const cleanMatches = summary?.matches_count ?? (summary as any)?.clean_matches_count ?? 0;
  const totalInvoices = summary?.total_invoices_count ?? 0;

  return (
    <div className="space-y-6 font-sans max-w-7xl">
      {/* Minimal iPhone-style Intro - Dynamic Languages with Smooth Fade + Time Log */}
      <div className="space-y-3 py-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="h-[3.5rem] sm:h-[4rem] flex items-center overflow-hidden">
              <h1 
                key={currentLanguageIndex}
                className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 w-full animate-fadeOnlySmooth"
              >
                {languages[currentLanguageIndex].greeting}
              </h1>
            </div>
          </div>
          <div className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 font-mono">
            {currentTime}
          </div>
        </div>
        <style>{`
          @keyframes fadeOnlySmooth {
            0% { 
              opacity: 0;
            }
            20% { 
              opacity: 1;
            }
            80% { 
              opacity: 1;
            }
            100% { 
              opacity: 0;
            }
          }
          .animate-fadeOnlySmooth {
            animation: fadeOnlySmooth 3.5s ease-in-out forwards;
          }
        `}</style>
        <p className="text-base text-slate-600 max-w-xl">
          {subtitleText}
        </p>
      </div>

      {/* 2 BIG CARDS: REVIEW QUEUE & 3PL VENDORS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: REVIEW QUEUE & TRANSAKSI */}
        <Card className="border border-slate-200/90 shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col justify-between hover:border-sky-300 transition-all">
          <div>
            <CardHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-slate-900" />
                  Review Queue &amp; Transaksi
                </span>
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
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <AlertTriangle className="h-3.5 w-3.5 text-slate-900" />
                    <span>Perlu Review</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-tabular">
                    {openExceptions}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-900" />
                    <span>Sesuai Kontrak</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-tabular">
                    {cleanMatches}
                  </div>
                </div>
              </div>
            </CardContent>
          </div>

          <div className="p-4 px-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end">
            <Button
              onClick={onNavigateToQueue}
              size="sm"
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs gap-1.5 cursor-pointer rounded-lg"
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
                  <Truck className="h-4 w-4 text-slate-900" />
                  Mitra Logistik 3PL
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-900 font-tabular">
                    {vendorsLoading ? "..." : vendors.length}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    Vendor Logistik Terdaftar
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-3">
              {vendorsLoading ? (
                <span className="text-xs text-slate-400 animate-pulse">Memuat vendor...</span>
              ) : vendors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {vendors.map((v) => (
                    <span
                      key={v.vendor_id}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60"
                    >
                      {v.vendor_name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  Tidak ada vendor yang bekerja sama saat ini. Vendor akan terdaftar secara otomatis saat dokumen invoice/PKS baru diunggah.
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-4 px-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end">
            <Button
              onClick={onNavigateToContracts || onNavigateToQueue}
              size="sm"
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs gap-1.5 cursor-pointer rounded-lg"
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
