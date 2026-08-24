"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, RotateCw } from "lucide-react";
import { getContracts, ContractItem } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function ContractsView() {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContractsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getContracts();
      setContracts(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat kontrak rate card");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractsList();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-[#243A5E]">
            Active Rate Agreements (PKS Matrix)
          </h2>
          <p className="text-xs text-slate-500">
            Review active master service agreements and the tariff rules used during reconciliation.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchContractsList}
          disabled={loading}
          className="text-xs font-semibold gap-1.5 h-8 text-slate-700"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Contracts</span>
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Memuat rate agreements...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contracts.map((c) => (
            <Card key={c.id} className="border border-slate-200 shadow-2xs hover:shadow-xs transition-all bg-white">
              <CardHeader className="p-4 pb-2 space-y-1.5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#243A5E] bg-[#EDF4FA] px-2 py-0.5 rounded border border-[#8FB8D6]/40">
                    {c.id}
                  </span>
                  <Badge variant="outline" className="text-[9px] py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                    {c.status}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 leading-tight">
                  {c.vendor_name || c.vendor_id}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="h-3 w-3" /> Validity:
                  </span>
                  <span className="font-mono text-[11px] font-semibold">{c.effective_range}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px] text-slate-500">Fuel Surcharge Cap:</span>
                  <span className="font-bold text-[#243A5E]">{c.fuel_surcharge_cap}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px] text-slate-500">Dispute Window:</span>
                  <span className="font-bold text-amber-700">{c.dispute_window}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Agreement Reference
                  </span>
                  <span className="font-mono text-[11px] text-slate-700 block bg-slate-50 p-1.5 rounded border border-slate-200">
                    {c.agreement_id}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
