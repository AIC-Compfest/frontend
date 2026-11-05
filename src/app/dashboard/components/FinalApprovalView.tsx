"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { QueueItem } from "@/types/reconciliation";
import { API_V1 } from "@/lib/config";
import { getStoredUser } from "@/lib/auth";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/stats/StatCard";
import {
  btnGhost,
  btnOutline,
  btnPrimary,
  chip,
  emptyState,
  focusRing,
  iconPlate,
  inputClass,
  panel,
  panelHeader,
  panelTitle,
  selectClass,
  td,
  textareaClass,
  th,
  trHover,
} from "@/lib/dashboard-ui";
import {
  ArrowUpRight,
  CheckCheck,
  CheckCircle2,
  History,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";

interface FinalApprovalViewProps {
  onSelectTransaction: (eventId: string) => void;
  onRefresh?: () => void;
  onNavigateToAudit?: () => void;
}

const API_BASE = API_V1;

export function FinalApprovalView({ onSelectTransaction, onRefresh, onNavigateToAudit }: FinalApprovalViewProps) {
  const [sodTab, setSodTab] = useState<"PENDING" | "HISTORY">("PENDING");
  const [search, setSearch] = useState("");
  const [filterVendor, setFilterVendor] = useState("ALL");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [notes, setNotes] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch data for the active sub-tab and filters
  const fetchSodData = useCallback(async () => {
    setIsLoading(true);
    try {
      // PENDING: MATCH (auto-pass clean) plus APPROVED (anomalies approved by an AP manager). Both await Finance Controller sign-off.
      // HISTORY: APPROVED items that went through the Finance Controller release.
      const targetStatus = sodTab === "PENDING" ? "MATCH,APPROVED" : "APPROVED";
      const params = new URLSearchParams();
      params.set("status", targetStatus);
      if (filterVendor !== "ALL") params.set("vendor", filterVendor);
      if (search.trim() !== "") params.set("search", search.trim());
      params.set("page_size", "50");

      const res = await fetch(`${API_BASE}/reconcile/queue?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load the authorization queue");
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

  // Totals for the current view
  const totalDisbursementSum = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.expected_amount || item.billed_amount), 0);
  }, [items]);

  const totalLeakageSum = useMemo(() => {
    return items.reduce((acc, item) => acc + Math.max(0, item.variance_amount || 0), 0);
  }, [items]);

  const selectedTotal = useMemo(() => {
    return items
      .filter((i) => selectedIds.includes(i.event_id))
      .reduce((acc, i) => acc + (i.expected_amount || i.billed_amount), 0);
  }, [items, selectedIds]);

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
      // Send one decision per selected invoice with role FINANCE_CONTROLLER
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
      // Open the audit ledger after a successful release
      setTimeout(() => {
        if (onNavigateToAudit) onNavigateToAudit();
      }, 1500);
    } catch (err) {
      console.error("Authorization error:", err);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const switchTab = (tab: "PENDING" | "HISTORY") => {
    setSodTab(tab);
    setSelectedIds([]);
  };

  const subTab = (tab: "PENDING" | "HISTORY", text: string) => (
    <button
      type="button"
      aria-pressed={sodTab === tab}
      onClick={() => switchTab(tab)}
      className={cn(
        "h-9 cursor-pointer rounded-pop px-4 text-[13px] font-semibold transition-colors",
        sodTab === tab ? "bg-navy text-white" : "text-body hover:bg-surface-soft hover:text-ink",
        focusRing
      )}
    >
      {text}
    </button>
  );

  const routeOf = (item: QueueItem) =>
    item.origin && item.destination ? `${item.origin} → ${item.destination}` : "-";

  const searchField = (
    <div className="relative min-w-[220px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.75} aria-hidden="true" />
      <Input
        type="text"
        aria-label="Search transactions"
        placeholder="Search invoice number, shipment ID, or vendor..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={cn(inputClass, "pl-9")}
      />
    </div>
  );

  const vendorSelect = (
    <select
      aria-label="Filter by 3PL partner"
      value={filterVendor}
      onChange={(e) => setFilterVendor(e.target.value)}
      className={selectClass}
    >
      <option value="ALL">All 3PL partners ({vendors.length})</option>
      {vendors.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div role="group" aria-label="Authorization view" className="inline-flex flex-wrap gap-1 rounded-control border border-hairline bg-card p-1">
        {subTab("PENDING", "Awaiting authorization")}
        {subTab("HISTORY", "Authorization history")}
      </div>

      {sodTab === "PENDING" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Total funds ready for release"
              value={formatIDR(totalDisbursementSum)}
              caption="Awaiting Finance Controller sign-off"
              tone="neutral"
              art="coins"
            />
            <StatCard
              label="Clean matches"
              value={`${items.length} invoices`}
              caption="Matched to contract"
              tone="positive"
              art="seal"
            />
            <StatCard label="Potential leakage prevented" value={formatIDR(totalLeakageSum)} tone="positive" art="shield" />
          </div>

          <section className={cn(panel, "overflow-hidden")}>
            <header className={cn(panelHeader, "items-center")}>
              {searchField}
              <div className="flex flex-wrap items-center gap-3">
                {vendorSelect}
                <span className="inline-flex items-center gap-1.5 text-[13px] text-body">
                  <History className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  {items.length} transactions
                </span>
              </div>
            </header>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-6 py-16 text-[13px] text-body">
                <Loader2 className="h-4 w-4 animate-spin text-navy" strokeWidth={1.75} aria-hidden="true" />
                <span>Loading pending transactions...</span>
              </div>
            ) : items.length === 0 ? (
              <div className={emptyState}>No records</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className={cn(th, "w-12 text-center")}>
                        <input
                          type="checkbox"
                          aria-label="Select all transactions"
                          checked={selectedIds.length === items.length && items.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 cursor-pointer accent-navy"
                        />
                      </th>
                      <th className={th}>Invoice / reference</th>
                      <th className={th}>3PL partner</th>
                      <th className={th}>Route</th>
                      <th className={th}>Approved amount (disbursement)</th>
                      <th className={cn(th, "text-right")}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const isSelected = selectedIds.includes(item.event_id);
                      return (
                        <tr key={item.event_id} className={cn(trHover, isSelected && "bg-action/5")}>
                          <td className={cn(td, "text-center")}>
                            <input
                              type="checkbox"
                              aria-label={`Select invoice ${item.invoice_number}`}
                              checked={isSelected}
                              onChange={() => handleToggleSelect(item.event_id)}
                              className="h-4 w-4 cursor-pointer accent-navy"
                            />
                          </td>

                          <td className={td}>
                            <span className="block font-semibold text-ink">{item.invoice_number}</span>
                            <span className="block text-[11px] tabular-nums text-muted">{item.shipment_id}</span>
                          </td>

                          <td className={td}>
                            <span className="block max-w-xs truncate font-semibold text-ink">
                              {item.vendor_name || item.vendor_id}
                            </span>
                            <span className="block text-[11px] tabular-nums text-muted">{item.vendor_id}</span>
                          </td>

                          <td className={cn(td, "text-body")}>{routeOf(item)}</td>

                          <td className={td}>
                            <span className="font-semibold tabular-nums text-ink">
                              {formatIDR(item.expected_amount || item.billed_amount)}
                            </span>
                          </td>

                          <td className={cn(td, "text-right")}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onSelectTransaction(item.event_id)}
                                className={cn(btnGhost, "h-8 px-2.5 text-[12px]")}
                              >
                                View Evidence
                              </Button>
                              <Button
                                type="button"
                                onClick={() => {
                                  setSelectedIds([item.event_id]);
                                  setShowConfirmModal(true);
                                }}
                                className={cn(btnPrimary, "h-8 px-3 text-[12px]")}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
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
          </section>
        </div>
      )}

      {sodTab === "HISTORY" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Total funds disbursed"
              value={formatIDR(totalDisbursementSum)}
              tone="neutral"
              art="coins"
            />
            <StatCard
              label="Total invoices approved"
              value={`${items.length} invoices`}
              tone="positive"
              art="seal"
            />
            <StatCard label="Financial leakage prevented" value={formatIDR(totalLeakageSum)} tone="positive" art="shield" />
          </div>

          <section className={cn(panel, "overflow-hidden")}>
            <header className={cn(panelHeader, "items-center")}>
              {searchField}
              {vendorSelect}
            </header>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-6 py-16 text-[13px] text-body">
                <Loader2 className="h-4 w-4 animate-spin text-navy" strokeWidth={1.75} aria-hidden="true" />
                <span>Loading authorization history...</span>
              </div>
            ) : items.length === 0 ? (
              <div className={emptyState}>
                <span className={iconPlate("neutral")}>
                  <History className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h3 className="pt-2 text-[15px] font-semibold text-ink">No authorization history yet</h3>
                <p className="max-w-md">
                  Transactions released by the Finance Controller are recorded here permanently.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => switchTab("PENDING")}
                  className={cn(btnOutline, "mt-3 h-9")}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-ink" strokeWidth={1.75} aria-hidden="true" />
                  <span>View awaiting authorizations</span>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className={th}>Invoice / reference</th>
                      <th className={th}>3PL partner</th>
                      <th className={th}>Route</th>
                      <th className={th}>Billed amount</th>
                      <th className={th}>Authorized amount</th>
                      <th className={th}>Approval status</th>
                      <th className={th}>Authorizer</th>
                      <th className={cn(th, "text-right")}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.event_id} className={trHover}>
                        <td className={td}>
                          <span className="block font-semibold text-ink">{item.invoice_number}</span>
                          <span className="block text-[11px] tabular-nums text-muted">{item.shipment_id}</span>
                        </td>

                        <td className={td}>
                          <span className="block max-w-xs truncate font-semibold text-ink">
                            {item.vendor_name || item.vendor_id}
                          </span>
                          <span className="block text-[11px] tabular-nums text-muted">{item.vendor_id}</span>
                        </td>

                        <td className={cn(td, "text-body")}>{routeOf(item)}</td>

                        <td className={cn(td, "text-body")}>{formatIDR(item.billed_amount)}</td>

                        <td className={td}>
                          <span className="font-semibold tabular-nums text-ink">
                            {formatIDR(item.expected_amount || item.billed_amount)}
                          </span>
                        </td>

                        <td className={td}>
                          <span className={chip("success")}>
                            <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                            APPROVED &amp; RELEASED
                          </span>
                        </td>

                        <td className={td}>
                          <span className="block text-[12px] font-semibold text-ink">FINANCE_CONTROLLER</span>
                          <span className="block text-[11px] font-medium text-teal-ink">Tier-2 signed off</span>
                        </td>

                        <td className={cn(td, "text-right")}>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onSelectTransaction(item.event_id)}
                            className={cn(btnGhost, "h-8 px-2.5 text-[12px]")}
                          >
                            <span>View Evidence</span>
                            <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Release confirmation */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sod-confirm-title"
            className="w-full max-w-md space-y-5 rounded-card border border-hairline bg-card p-6 shadow-drawer"
          >
            <div className="flex items-start gap-3">
              <span className={iconPlate("success")}>
                <ShieldCheck className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <h3 id="sod-confirm-title" className={panelTitle}>
                  Confirm cash release authorization (SoD)
                </h3>
                <p className="text-[13px] text-body">
                  Final approval for {selectedIds.length} transactions before the payment transfer.
                </p>
              </div>
            </div>

            <dl className="space-y-2 rounded-control border border-hairline bg-canvas p-4 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-body">Selected transactions:</dt>
                <dd className="font-semibold tabular-nums text-ink">{selectedIds.length} invoices</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-body">Authorizer role:</dt>
                <dd className="font-semibold text-teal-ink">FINANCE_CONTROLLER</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-hairline pt-2">
                <dt className="font-semibold text-ink">Total funds to release:</dt>
                <dd className="font-semibold tabular-nums text-ink">{formatIDR(selectedTotal)}</dd>
              </div>
            </dl>

            <div className="space-y-2">
              <label htmlFor="sod-notes" className="block text-[12px] font-semibold text-ink">
                Treasury note / payment batch no. (optional)
              </label>
              <textarea
                id="sod-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Example: Approved for BCA Corporate transfer batch 2026-08-20"
                rows={2}
                className={cn(textareaClass, "w-full text-[13px]")}
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-hairline pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowConfirmModal(false)}
                disabled={isAuthorizing}
                className={cn(btnGhost, "h-9")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleExecuteFinalApproval}
                disabled={isAuthorizing}
                className={cn(btnPrimary, "h-9 px-4")}
              >
                {isAuthorizing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    <span>Sign and release funds</span>
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
