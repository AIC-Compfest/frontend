"use client";

import React, { useState, useMemo } from "react";
import { QueueItem, QueueSummary, ReconciliationStatus } from "@/types/reconciliation";

interface ReviewQueueProps {
  items: QueueItem[];
  summary: QueueSummary;
  selectedEventId: string | null;
  onSelectTransaction: (eventId: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ReviewQueue({
  items,
  summary,
  selectedEventId,
  onSelectTransaction,
  isLoading,
  onRefresh,
}: ReviewQueueProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [vendorFilter, setVendorFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatCompactIDR = (val: number) => {
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} jt`;
    if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)} rb`;
    return `Rp ${val}`;
  };

  // Unique vendors for filter
  const vendors = useMemo(() => {
    const set = new Set(items.map((i) => i.vendor_id));
    return Array.from(set);
  }, [items]);

  // Client-side filtering
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (vendorFilter !== "ALL" && item.vendor_id !== vendorFilter) return false;
      if (severityFilter !== "ALL" && item.priority_level !== severityFilter) return false;
      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const inv = item.invoice_number.toLowerCase();
        const shp = item.shipment_id.toLowerCase();
        const vName = item.vendor_name.toLowerCase();
        const disc = (item.primary_discrepancy || "").toLowerCase();
        if (!inv.includes(q) && !shp.includes(q) && !vName.includes(q) && !disc.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [items, statusFilter, vendorFilter, severityFilter, search]);

  const getStatusBadge = (status: ReconciliationStatus) => {
    switch (status) {
      case "MATCH":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            MATCH
          </span>
        );
      case "EXCEPTION":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            EXCEPTION
          </span>
        );
      case "DUPLICATE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            DUPLICATE
          </span>
        );
      case "INSUFFICIENT_EVIDENCE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            UNCONFIRMED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (score: number, level: string) => {
    if (level === "HIGH") {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
          HIGH ({score.toFixed(0)})
        </span>
      );
    }
    if (level === "MEDIUM") {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          MED ({score.toFixed(0)})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
        LOW ({score.toFixed(0)})
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#243A5E] tracking-tight">Invoice Reconciliation Queue</h1>
          <p className="text-xs text-[#5F86A6] mt-0.5">
            Audit 3PL billing anomalies, verify spatial evidence, and resolve discrepancies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#243A5E] bg-white border border-[#CFE3F1] rounded-md hover:bg-[#EDF4FA] transition-subtle shadow-xs"
          >
            <svg
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#5F86A6]" : "text-[#5F86A6]"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isLoading ? "Syncing..." : "Refresh Queue"}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-[#CFE3F1] shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#5F86A6]">Total Invoiced</div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-lg font-bold font-tabular text-[#243A5E]">
              {formatCompactIDR(summary.total_invoiced_amount)}
            </div>
            <span className="text-[11px] font-medium text-slate-500">{summary.total_invoices_count} invoices</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#CFE3F1] shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#5F86A6]">Financial Exposure</div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-lg font-bold font-tabular text-rose-600">
              {formatCompactIDR(summary.total_variance_amount)}
            </div>
            <span className="text-[11px] font-medium text-rose-600 font-semibold">Overcharge Risk</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#CFE3F1] shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#5F86A6]">Open Exceptions</div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-lg font-bold font-tabular text-[#243A5E]">
              {summary.open_exceptions_count}
            </div>
            <span className="text-[11px] font-medium text-amber-600">Needs Review</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#CFE3F1] shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#5F86A6]">Urgent Disputes</div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-lg font-bold font-tabular text-rose-600">
              {summary.urgent_disputes_count}
            </div>
            <span className="text-[11px] font-medium text-rose-600">≤ 7 Days Left</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-[#CFE3F1] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex-1 min-w-[240px] relative">
          <svg
            className="w-4 h-4 text-[#5F86A6] absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search invoice number, shipment ID, vendor, or discrepancy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-[#243A5E] placeholder-[#5F86A6]/70 bg-[#EDF4FA]/50 border border-[#CFE3F1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5F86A6] focus:bg-white transition-subtle"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs text-[#243A5E] bg-white border border-[#CFE3F1] rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#5F86A6]"
          >
            <option value="ALL">All Statuses</option>
            <option value="EXCEPTION">Exceptions Only</option>
            <option value="MATCH">Matches Only</option>
            <option value="DUPLICATE">Duplicates</option>
            <option value="INSUFFICIENT_EVIDENCE">Insufficient Evidence</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs text-[#243A5E] bg-white border border-[#CFE3F1] rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#5F86A6]"
          >
            <option value="ALL">All Priority Levels</option>
            <option value="HIGH">High Priority (≥ 70)</option>
            <option value="MEDIUM">Medium Priority (40-69)</option>
            <option value="LOW">Low Priority (&lt; 40)</option>
          </select>

          {/* Vendor Filter */}
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="text-xs text-[#243A5E] bg-white border border-[#CFE3F1] rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#5F86A6]"
          >
            <option value="ALL">All 3PL Vendors</option>
            {vendors.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Review Table */}
      <div className="bg-white rounded-lg border border-[#CFE3F1] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EDF4FA] border-b border-[#CFE3F1] text-[#243A5E] font-semibold">
              <tr>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Invoice No.</th>
                <th className="py-2.5 px-3">Vendor</th>
                <th className="py-2.5 px-3">Shipment Ref</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Discrepancy</th>
                <th className="py-2.5 px-3 text-right font-tabular">Billed</th>
                <th className="py-2.5 px-3 text-right font-tabular">Expected</th>
                <th className="py-2.5 px-3 text-right font-tabular">Variance</th>
                <th className="py-2.5 px-3">Dispute Window</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CFE3F1]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-[#5F86A6]">
                    No transactions matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = item.event_id === selectedEventId;
                  return (
                    <tr
                      key={item.event_id}
                      onClick={() => onSelectTransaction(item.event_id)}
                      className={`cursor-pointer transition-subtle hover:bg-[#EDF4FA]/60 ${
                        isSelected ? "bg-[#EDF4FA] ring-1 ring-inset ring-[#8FB8D6]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">{getPriorityBadge(item.priority_score, item.priority_level)}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#243A5E] font-mono">
                        {item.invoice_number}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <div className="font-medium">{item.vendor_name}</div>
                        <div className="text-[10px] text-[#5F86A6]">{item.vendor_id}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        <div>{item.shipment_id}</div>
                        {item.awb_number && <div className="text-[10px] text-[#5F86A6]">{item.awb_number}</div>}
                      </td>
                      <td className="py-2.5 px-3">{getStatusBadge(item.status)}</td>
                      <td className="py-2.5 px-3">
                        {item.primary_discrepancy ? (
                          <span className="inline-block font-mono text-[11px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {item.primary_discrepancy}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-tabular font-medium text-slate-800">
                        {formatIDR(item.billed_amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-tabular text-slate-600">
                        {formatIDR(item.expected_amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-tabular font-semibold">
                        {item.variance_amount > 0 ? (
                          <span className="text-rose-600">+{formatIDR(item.variance_amount)}</span>
                        ) : item.variance_amount < 0 ? (
                          <span className="text-emerald-600">{formatIDR(item.variance_amount)}</span>
                        ) : (
                          <span className="text-slate-400">Rp 0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-xs">
                        {item.days_remaining_to_dispute <= 7 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                            <svg className="w-3.5 h-3.5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {item.days_remaining_to_dispute}d left
                          </span>
                        ) : (
                          <span className="text-slate-600">{item.days_remaining_to_dispute}d left</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTransaction(item.event_id);
                          }}
                          className={`px-2.5 py-1 text-xs font-semibold rounded transition-subtle shadow-xs ${
                            isSelected
                              ? "bg-[#243A5E] text-white"
                              : "bg-white text-[#243A5E] border border-[#CFE3F1] hover:bg-[#EDF4FA]"
                          }`}
                        >
                          {isSelected ? "Inspecting" : "Inspect"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
