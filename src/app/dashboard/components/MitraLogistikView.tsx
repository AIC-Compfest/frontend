"use client";

import React, { useEffect, useState, useCallback } from "react";
import { API_V1 } from "@/lib/config";
import { cn } from "@/lib/utils";
import { chip, iconPlate, label, panel, emptyState } from "@/lib/dashboard-ui";
import { StatCard, type StatArtName, type StatTone } from "@/components/stats/StatCard";
import { AlertCircle, Building2, Calendar, DollarSign, FileText, Loader2, Mail, Phone, Truck } from "lucide-react";
import { getContracts, ContractItem } from "@/lib/api";

const API_BASE = API_V1;

interface VendorItem {
  vendor_id: string;
  vendor_name: string;
  vendor_code?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  is_active: boolean;
}

interface MitraWithContract extends VendorItem {
  contract?: ContractItem;
}

export function MitraLogistikView() {
  const [mitras, setMitras] = useState<MitraWithContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch vendors and contracts in parallel
      const [vendorRes, contractsRes] = await Promise.all([
        fetch(`${API_BASE}/vendors`),
        getContracts().catch(() => ({ data: [] })),
      ]);

      let vendors: VendorItem[] = [];
      if (vendorRes.ok) {
        const vData = await vendorRes.json();
        vendors = vData.vendors || [];
      }

      const contracts: ContractItem[] = contractsRes.data || [];

      // Merge vendors with their contracts
      const merged: MitraWithContract[] = vendors.map((v) => ({
        ...v,
        contract: contracts.find(
          (c) =>
            c.vendor_id === v.vendor_id ||
            c.agreement_id?.includes(v.vendor_id) ||
            c.vendor_name === v.vendor_name
        ),
      }));

      // If the vendor API returns nothing, fall back to the contracts data
      if (merged.length === 0 && contracts.length > 0) {
        setMitras(
          contracts.map((c) => ({
            vendor_id: c.vendor_id || c.id,
            vendor_name: c.vendor_name || c.id,
            is_active: c.status === "ACTIVE" || c.status === "active",
            contract: c,
          }))
        );
      } else {
        setMitras(merged);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load logistics partner data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeMitras = mitras.filter((m) => m.is_active !== false);

  const withoutAgreement = mitras.filter((m) => !m.contract).length;
  const stats: { label: string; value: number; tone: StatTone; art: StatArtName; caption: string }[] = [
    { label: "Active logistics partners", value: activeMitras.length, tone: "neutral", art: "truck", caption: "Registered and active" },
    {
      label: "Rate agreements (PKS) linked",
      value: mitras.filter((m) => m.contract).length,
      tone: "positive",
      art: "documents",
      caption: "Partners with a rate agreement",
    },
    {
      label: "No rate agreement (PKS)",
      value: withoutAgreement,
      tone: withoutAgreement > 0 ? "warning" : "positive",
      art: "alert",
      caption: withoutAgreement > 0 ? "Needs a rate agreement" : "Every partner is covered",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            caption={stat.caption}
            tone={stat.tone}
            art={stat.art}
            loading={loading}
          />
        ))}
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-control border border-error/40 bg-error-soft p-3.5 text-[13px] font-medium text-error-ink">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 px-6 py-16 text-[13px] text-body">
          <Loader2 className="h-4 w-4 animate-spin text-navy" strokeWidth={1.75} aria-hidden="true" />
          <span>Loading logistics partner data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {mitras.map((m) => {
            const isActive = m.is_active !== false;
            return (
              <article key={m.vendor_id} className={cn(panel, "flex flex-col overflow-hidden")}>
                <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
                  <div className="min-w-0 space-y-1">
                    <span className="block text-[16px] font-semibold leading-snug text-ink">{m.vendor_name}</span>
                    <span className="block text-[12px] font-medium tabular-nums text-muted">{m.vendor_id}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={iconPlate("navy")}>
                      <Truck className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span className={chip(isActive ? "success" : "neutral")}>{isActive ? "Active" : "Inactive"}</span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 px-5 py-4 text-[13px]">
                  {(m.contact_email || m.contact_phone || m.city) && (
                    <div className="space-y-2 text-body">
                      {m.contact_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
                          <span className="truncate">{m.contact_email}</span>
                        </div>
                      )}
                      {m.contact_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
                          <span className="tabular-nums">{m.contact_phone}</span>
                        </div>
                      )}
                      {m.city && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
                          <span>{m.city}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {m.contract ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-body" strokeWidth={1.75} aria-hidden="true" />
                        <span className={label}>Active rate agreement (PKS)</span>
                      </div>

                      <dl className="space-y-2 rounded-control border border-hairline bg-canvas p-3.5 text-[12px]">
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-body">Agreement ID</dt>
                          <dd className="font-semibold tabular-nums text-navy">{m.contract.agreement_id || m.contract.id}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="flex items-center gap-1 text-body">
                            <Calendar className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                            Effective period
                          </dt>
                          <dd className="font-semibold tabular-nums text-ink">{m.contract.effective_range}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="flex items-center gap-1 text-body">
                            <DollarSign className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                            Fuel surcharge cap
                          </dt>
                          <dd className="font-semibold tabular-nums text-navy">{m.contract.fuel_surcharge_cap}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-body">Dispute window</dt>
                          <dd className="font-semibold tabular-nums text-warning-ink">{m.contract.dispute_window}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : (
                    <div className="mt-auto flex items-start gap-2 rounded-control border border-warning/40 bg-warning-soft p-3 text-[12px] text-warning-ink">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      <span>No rate agreement (PKS) is linked to this partner yet.</span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {mitras.length === 0 && !loading && (
            <div className={cn(panel, "md:col-span-2 xl:col-span-3")}>
              <div className={emptyState}>
                <Truck className="h-8 w-8 text-muted" strokeWidth={1.5} aria-hidden="true" />
                <p>No logistics partners are registered yet. Add vendor records to the vendors table.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
