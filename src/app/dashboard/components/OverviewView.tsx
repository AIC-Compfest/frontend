"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QueueSummary } from "@/types/reconciliation";
import { API_V1 } from "@/lib/config";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  btnOutline,
  btnPrimary,
  chip,
  iconPlate,
  kpiValue,
  pageTitle,
  panel,
  panelTitle,
} from "@/lib/dashboard-ui";
import { StatCard } from "@/components/stats/StatCard";
import { ArrowRight, Inbox, Loader2, Truck } from "lucide-react";

interface OverviewViewProps {
  summary?: QueueSummary;
  onNavigateToQueue: () => void;
  onNavigateToContracts?: () => void;
}

interface Vendor {
  vendor_id: string;
  vendor_name: string;
  is_active: boolean;
}

const API_BASE = API_V1;

const EMPTY_SUMMARY: QueueSummary = {
  total_invoiced_amount: 0,
  total_variance_amount: 0,
  total_invoices_count: 0,
  open_exceptions_count: 0,
  urgent_disputes_count: 0,
  matches_count: 0,
};

export function OverviewView({
  summary: initialSummary,
  onNavigateToQueue,
  onNavigateToContracts,
}: OverviewViewProps) {
  const [summary, setSummary] = useState<QueueSummary>(initialSummary || EMPTY_SUMMARY);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/reconcile/queue?page_size=1`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        console.error("Summary response not OK:", res.status, res.statusText);
        return;
      }

      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      // Keep the initial summary when the request fails.
      console.error("Summary fetch error:", err);
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    setVendorsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/vendors`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        console.error("Vendors response not OK:", res.status, res.statusText);
        setVendors([]);
        return;
      }

      const data = await res.json();
      setVendors(data.vendors || []);
    } catch (err) {
      console.error("Vendor fetch error:", err);
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

  const totalInvoiced = summary?.total_invoiced_amount ?? (summary as any)?.total_billed_idr ?? 0;
  const totalVariance = summary?.total_variance_amount ?? (summary as any)?.total_variance_idr ?? 0;
  const openExceptions = summary?.open_exceptions_count ?? 0;
  const cleanMatches = summary?.matches_count ?? (summary as any)?.clean_matches_count ?? 0;
  const totalInvoices = summary?.total_invoices_count ?? 0;

  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-card border border-hairline bg-card px-6 py-7 sm:px-8">
        {/* The only decorative blobs in the app. They sit behind the title block at low opacity. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-[42%_58%_63%_37%/41%_44%_56%_59%] bg-[linear-gradient(135deg,var(--color-navy),var(--color-action),var(--color-teal))] opacity-[.14] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-44 -z-10 h-56 w-56 rounded-[58%_42%_35%_65%/52%_38%_62%_48%] bg-[linear-gradient(120deg,var(--color-teal),var(--color-action))] opacity-[.1] blur-2xl"
        />
        <h1 className={pageTitle}>Welcome back to Verflo!</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-body">
          Logistics spend reconciliation and audit engine powered by automated 4-way matching.
        </p>
      </section>

      {/* Stat cards: 2 across on wide screens, 2 on tablets, 1 on mobile */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        <StatCard
          label="Total invoiced"
          value={formatIDR(totalInvoiced)}
          caption={`Across ${totalInvoices} invoices`}
          tone="neutral"
          art="coins"
        />
        <StatCard
          label="Total variance"
          value={formatIDR(totalVariance)}
          caption={totalVariance > 0 ? "Potential leakage" : "No variance recorded"}
          tone={totalVariance > 0 ? "attention" : "positive"}
          art="drop"
        />
        {/* <StatCard
          label="Open exceptions"
          value={String(openExceptions)}
          caption={openExceptions > 0 ? "Waiting for review" : "Nothing waiting"}
          tone={openExceptions > 0 ? "warning" : "positive"}
          art="alert"
        />
        <StatCard
          label="Clean matches"
          value={String(cleanMatches)}
          caption="Matched to contract"
          tone="positive"
          art="seal"
        /> */}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Card 1: review queue */}
        <section aria-labelledby="overview-queue-title" className={cn(panel, "flex flex-col")}>
          <div className="space-y-6 p-6">
            <div className="flex items-center gap-3">
              <span className={iconPlate("navy")}>
                <Inbox className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h2 id="overview-queue-title" className={panelTitle}>
                Review Queue
              </h2>
            </div>

            <div className="space-y-1">
              <div className={kpiValue}>{totalInvoices}</div>
              <div className="text-[13px] font-semibold text-body">Logistics Transactions</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                variant="compact"
                label="Needs Review"
                value={openExceptions}
                tone={openExceptions > 0 ? "warning" : "positive"}
                art="alert"
              />
              <StatCard variant="compact" label="Matches Contract" value={cleanMatches} tone="positive" art="seal" />
            </div>
          </div>

          <div className="mt-auto flex justify-end border-t border-hairline bg-surface-soft/50 px-6 py-4">
            <button type="button" onClick={onNavigateToQueue} className={cn(btnPrimary, "px-4")}>
              <span>Open Review Queue</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* Card 2: logistics partners */}
        <section aria-labelledby="overview-partners-title" className={cn(panel, "flex flex-col")}>
          <div className="space-y-6 p-6">
            <div className="flex items-center gap-3">
              <span className={iconPlate("navy")}>
                <Truck className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h2 id="overview-partners-title" className={panelTitle}>
                Logistics Partners
              </h2>
            </div>

            <div className="space-y-1">
              <div className={kpiValue}>{vendorsLoading ? "..." : vendors.length}</div>
              <div className="text-[13px] font-semibold text-body">Registered logistics partners</div>
            </div>

            {vendorsLoading ? (
              <div className="flex items-center gap-2 text-[13px] text-body">
                <Loader2 className="h-4 w-4 animate-spin text-navy" aria-hidden="true" />
                <span>Loading partners...</span>
              </div>
            ) : vendors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {vendors.map((vendor) => (
                  <span key={vendor.vendor_id} className={chip("neutral", "py-1 text-[12px]")}>
                    {vendor.vendor_name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[13px] leading-6 text-body">
                No logistics partners are registered right now. A partner is added automatically when an invoice
                or rate agreement (PKS) is uploaded.
              </p>
            )}
          </div>

          <div className="mt-auto flex justify-end border-t border-hairline bg-surface-soft/50 px-6 py-4">
            <button
              type="button"
              onClick={onNavigateToContracts || onNavigateToQueue}
              className={cn(btnOutline, "px-4")}
            >
              <span>View Agreements (PKS)</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
