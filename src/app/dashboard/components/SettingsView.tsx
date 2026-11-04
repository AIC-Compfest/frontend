"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { getSettings, updateSettings } from "@/lib/api";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { btnPrimary, inputClass, panel, panelHeader, panelTitle } from "@/lib/dashboard-ui";

export function SettingsView() {
  const [materialityRp, setMaterialityRp] = useState("50000");
  const [materialityPct, setMaterialityPct] = useState("2.0");
  const [weightTolerance, setWeightTolerance] = useState("0.5");
  const [disputeAlertDays, setDisputeAlertDays] = useState("7");
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSettings();
      if (data) {
        if (data.materiality_threshold_idr !== undefined) {
          setMaterialityRp(data.materiality_threshold_idr.toString());
        }
        if (data.materiality_percentage !== undefined) {
          setMaterialityPct(data.materiality_percentage.toString());
        }
        if (data.weight_tolerance_kg !== undefined) {
          setWeightTolerance(data.weight_tolerance_kg.toString());
        }
        if (data.dispute_alert_window_days !== undefined) {
          setDisputeAlertDays(data.dispute_alert_window_days.toString());
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load policy settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await updateSettings({
        materiality_threshold_idr: parseFloat(materialityRp || "0"),
        materiality_percentage: parseFloat(materialityPct || "0"),
        weight_tolerance_kg: parseFloat(weightTolerance || "0"),
        dispute_alert_window_days: parseInt(disputeAlertDays || "7", 10),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save policy settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-control border border-error/40 bg-error-soft p-3.5 text-[13px] font-medium text-error-ink">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <section className={cn(panel, "overflow-hidden")}>
        <header className={panelHeader}>
          <div className="space-y-1">
            <h2 className={panelTitle}>Tolerance Gates</h2>
            <p className="text-[13px] text-body">
              Discrepancies below these thresholds are recorded and evaluated deterministically.
            </p>
          </div>
        </header>

        <form onSubmit={handleSave} className="space-y-6 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mat-rp" className="text-[13px] text-ink">
                Materiality Threshold (IDR)
              </Label>
              <Input
                id="mat-rp"
                value={materialityRp}
                onChange={(e) => setMaterialityRp(e.target.value)}
                placeholder="50000"
                className={inputClass}
              />
              <p className="text-[12px] text-body">
                Variances ≤ {formatIDR(parseInt(materialityRp || "0", 10))} are flagged as minor
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mat-pct" className="text-[13px] text-ink">
                Materiality Percentage (%)
              </Label>
              <Input
                id="mat-pct"
                value={materialityPct}
                onChange={(e) => setMaterialityPct(e.target.value)}
                placeholder="2.0"
                className={inputClass}
              />
              <p className="text-[12px] text-body">Variances ≤ {materialityPct}% of invoice total</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight-tol" className="text-[13px] text-ink">
                Scale Weight Tolerance (kg)
              </Label>
              <Input
                id="weight-tol"
                value={weightTolerance}
                onChange={(e) => setWeightTolerance(e.target.value)}
                placeholder="0.5"
                className={inputClass}
              />
              <p className="text-[12px] text-body">
                Discrepancy tolerance between warehouse scale and 3PL billed weight
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disp-days" className="text-[13px] text-ink">
                Dispute Urgency Alert (Days)
              </Label>
              <Input
                id="disp-days"
                value={disputeAlertDays}
                onChange={(e) => setDisputeAlertDays(e.target.value)}
                placeholder="7"
                className={inputClass}
              />
              <p className="text-[12px] text-body">
                Transactions with ≤ {disputeAlertDays} days remaining are boosted in priority queue
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-hairline pt-5 sm:flex-row sm:items-center sm:justify-between">
            {isSaved ? (
              <div role="status" className="flex items-center gap-1.5 text-[13px] font-semibold text-teal-ink">
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                <span>Reconciliation policy saved.</span>
              </div>
            ) : (
              <span className="text-[13px] text-body">Policy changes take effect immediately across all active workers.</span>
            )}

            <Button type="submit" disabled={loading} className={cn(btnPrimary, "h-9 px-4")}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              )}
              <span>{loading ? "Saving..." : "Save Policy Config"}</span>
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
