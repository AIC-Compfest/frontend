"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  RotateCw,
  Building2,
  FileText,
  CheckCircle2,
  Truck,
  Phone,
  Mail,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { getContracts, ContractItem } from "@/lib/api";

const API_BASE = "http://localhost:8080/api/v1";

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

      // If no vendors from API, fall back to contracts data
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
      setError(err instanceof Error ? err.message : "Gagal memuat data mitra logistik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeMitras = mitras.filter((m) => m.is_active !== false);

  return (
    <div className="space-y-6 font-sans max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center shadow-sm">
              <Truck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-[#1B2A4A] tracking-tight">
              Mitra Logistik
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono text-slate-500 border-slate-200">
              vendors • rate_agreements
            </Badge>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Manajemen mitra 3PL terdaftar beserta kontrak PKS dan rate card yang digunakan dalam rekonsiliasi otomatis.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="text-xs font-semibold gap-1.5 h-8 text-slate-700 cursor-pointer"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-[#1B2A4A]/20 bg-[#1B2A4A]/5 rounded-2xl shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-[#1B2A4A] shrink-0" />
            <div>
              <div className="text-2xl font-extrabold text-[#1B2A4A]">{activeMitras.length}</div>
              <div className="text-[11px] text-slate-600 font-medium">Mitra 3PL Aktif</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-emerald-200 bg-emerald-50/40 rounded-2xl shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
            <div>
              <div className="text-2xl font-extrabold text-emerald-900">
                {mitras.filter((m) => m.contract).length}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">PKS Terhubung</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-amber-200 bg-amber-50/40 rounded-2xl shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-amber-600 shrink-0" />
            <div>
              <div className="text-2xl font-extrabold text-amber-900">
                {mitras.filter((m) => !m.contract).length}
              </div>
              <div className="text-[11px] text-amber-700 font-medium">Tanpa Kontrak PKS</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 space-y-2">
          <div className="animate-spin w-6 h-6 border-2 border-[#1B2A4A] border-t-transparent rounded-full mx-auto" />
          <span>Memuat data mitra logistik...</span>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mitras.map((m) => (
            <Card
              key={m.vendor_id}
              className="border border-slate-200 shadow-2xs hover:shadow-sm hover:border-sky-300 transition-all bg-white rounded-2xl overflow-hidden"
            >
              {/* Card Header */}
              <CardHeader className="p-4 pb-3 border-b border-slate-100 bg-slate-50/60 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-9 w-9 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Truck className="h-4.5 w-4.5" />
                  </div>
                  <Badge
                    variant={m.is_active !== false ? "success" : "outline"}
                    className="text-[9px] py-0 font-bold shrink-0 mt-0.5"
                  >
                    {m.is_active !== false ? "AKTIF" : "NON-AKTIF"}
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-extrabold text-slate-900 leading-tight">
                    {m.vendor_name}
                  </CardTitle>
                  <span className="font-mono text-[10px] text-slate-400 font-semibold">{m.vendor_id}</span>
                </div>
              </CardHeader>

              {/* Card Content */}
              <CardContent className="p-4 space-y-3 text-xs">
                {/* Contact Info */}
                {(m.contact_email || m.contact_phone) && (
                  <div className="space-y-1.5">
                    {m.contact_email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate text-[11px]">{m.contact_email}</span>
                      </div>
                    )}
                    {m.contact_phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="text-[11px]">{m.contact_phone}</span>
                      </div>
                    )}
                    {m.city && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="text-[11px]">{m.city}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Contract / PKS Details */}
                {m.contract ? (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <FileText className="h-3 w-3" />
                      Kontrak PKS Aktif
                    </div>

                    <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">ID Perjanjian:</span>
                        <span className="font-mono text-[10px] font-bold text-[#243A5E]">
                          {m.contract.agreement_id || m.contract.id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Calendar className="h-3 w-3" /> Masa Berlaku:
                        </span>
                        <span className="font-mono text-[11px] font-semibold">{m.contract.effective_range}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <DollarSign className="h-3 w-3" /> Fuel Surcharge:
                        </span>
                        <span className="font-bold text-[#243A5E] text-[11px]">{m.contract.fuel_surcharge_cap}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Dispute Window:</span>
                        <span className="font-bold text-amber-700 text-[11px]">{m.contract.dispute_window}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-700 flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Belum ada kontrak PKS terhubung untuk mitra ini.</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {mitras.length === 0 && !loading && (
            <div className="col-span-3 p-12 text-center text-xs text-slate-400">
              Belum ada mitra logistik terdaftar. Tambahkan data vendor di tabel vendors.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
