"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Save, RotateCw } from "lucide-react";
import { getSettings, updateSettings } from "@/lib/api";

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
      setError(err instanceof Error ? err.message : "Gagal memuat setting kebijakan");
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
      setError(err instanceof Error ? err.message : "Gagal menyimpan setting kebijakan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-[#243A5E]">
            Reconciliation Policy & Thresholds
          </h2>
          <p className="text-xs text-slate-500">
            Configure financial materiality rules, weight tolerance limits, and automated dispute urgency windows.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPolicy}
          disabled={loading}
          className="text-xs font-semibold gap-1.5 h-8 text-slate-700"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Reload</span>
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
          {error}
        </div>
      )}

      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">
            Enterprise financial tolerance gates
          </CardTitle>
          <CardDescription className="text-xs">
            Discrepancies below these thresholds are recorded and evaluated deterministically.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="mat-rp">Materiality Threshold (IDR)</Label>
                <Input
                  id="mat-rp"
                  value={materialityRp}
                  onChange={(e) => setMaterialityRp(e.target.value)}
                  placeholder="50000"
                />
                <span className="text-[10px] text-slate-400">
                  Variances &le; Rp {parseInt(materialityRp || "0", 10).toLocaleString("id-ID")} are flagged as minor
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mat-pct">Materiality Percentage (%)</Label>
                <Input
                  id="mat-pct"
                  value={materialityPct}
                  onChange={(e) => setMaterialityPct(e.target.value)}
                  placeholder="2.0"
                />
                <span className="text-[10px] text-slate-400">
                  Variances &le; {materialityPct}% of invoice total
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="weight-tol">Scale Weight Tolerance (kg)</Label>
                <Input
                  id="weight-tol"
                  value={weightTolerance}
                  onChange={(e) => setWeightTolerance(e.target.value)}
                  placeholder="0.5"
                />
                <span className="text-[10px] text-slate-400">
                  Discrepancy tolerance between warehouse scale and 3PL billed weight
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="disp-days">Dispute Urgency Alert (Days)</Label>
                <Input
                  id="disp-days"
                  value={disputeAlertDays}
                  onChange={(e) => setDisputeAlertDays(e.target.value)}
                  placeholder="7"
                />
                <span className="text-[10px] text-slate-400">
                  Transactions with &le; {disputeAlertDays} days remaining are boosted in priority queue
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {isSaved ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Kebijakan rekonsiliasi berhasil disimpan!</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Policy changes take effect immediately across all active workers.</span>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="bg-[#243A5E] text-white hover:bg-[#1C2E4A] font-bold text-xs gap-1.5"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? "Menyimpan..." : "Save Policy Config"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
