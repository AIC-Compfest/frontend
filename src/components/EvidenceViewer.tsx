"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ShipmentEvent, EvidenceSource } from "@/types/reconciliation";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Truck,
  ShieldAlert,
  Calendar,
  MapPin,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_V1 } from "@/lib/config";
import { DocumentPageView, OverlayBox } from "@/components/evidence/DocumentPageView";

type DocTab = string; // Now we use document IDs directly as tab keys

interface DocumentTabInfo {
  id: string;
  type: "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT";
  label: string;
  badge?: { label: string; color: string };
}

interface EvidenceViewerProps {
  event: ShipmentEvent;
  selectedField: string | null;
  activeDocumentTab: DocTab;
  onTabChange: (tab: DocTab) => void;
  onSelectField: (fieldName: string | null) => void;
}

interface EvidenceRow {
  segment_id: string;
  page_number: number;
  field_name: string;
  field_value: string;
  confidence: number;
  bbox_x1: number | null;
  bbox_y1: number | null;
  bbox_x2: number | null;
  bbox_y2: number | null;
}

interface EvidenceItem {
  id: string;
  fieldName: string;
  canonical: string;
  label: string;
  value: string;
  confidence: number | null;
  page: number;
  bbox: { x1: number; y1: number; x2: number; y2: number };
  isDiscrepant: boolean;
  isUncertain: boolean;
}

const FIELD_ALIASES: Record<string, string[]> = {
  billed_amount: ["billed_amount", "grand_total", "total_amount"],
  destination: ["destination", "receiver_address", "receiver_city"],
  origin: ["origin", "sender_address", "sender_city"],
  weight_billed_kg: ["weight_billed_kg", "billed_weight_kg", "weight", "actual_weight_kg"],
  weight_actual_kg: ["weight_actual_kg", "actual_weight_kg", "weight"],
  invoice_number: ["invoice_number", "invoice_id"],
  invoice_date: ["invoice_date", "date"],
  surat_jalan_number: ["surat_jalan_number", "shipment_id"],
  awb_number: ["awb_number", "awb"],
  total_packages: ["total_packages", "quantity"],
  shipment_date: ["shipment_date"],
  quantity_received: ["quantity_received", "quantity"],
  signature_present: ["signature_present", "signature_bbox", "signature"],
  stamp_present: ["stamp_present", "stamp"],
  delivery_date: ["delivery_date"],
  agreement_id: ["agreement_id", "vendor_name"],
  base_rate: ["base_rate", "rate_matrix"],
  fuel_surcharge_percent: ["fuel_surcharge_percent", "applicable_fuel_surcharge_percent", "surcharge_rules"],
  effective_from: ["effective_from", "effective_to"],
};

const DISCREPANCY_FIELDS: Record<string, string[]> = {
  RATE_OVERCHARGE: ["billed_amount", "base_rate"],
  WRONG_ZONE: ["destination"],
  WEIGHT_DISCREPANCY: ["weight_billed_kg", "weight_actual_kg"],
  MISSING_SIGNATURE: ["signature_present"],
  DATE_MISMATCH: ["delivery_date"],
  QUANTITY_MISMATCH: ["quantity_received", "total_packages"],
};

function canonicalOf(fieldName: string): string {
  for (const [canon, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(fieldName)) return canon;
  }
  return fieldName;
}

function humanize(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function entityFor(event: ShipmentEvent, tab: DocTab) {
  switch (tab) {
    case "INVOICE":
      return event.invoice;
    case "SURAT_JALAN":
      return event.shipment;
    case "POD":
      return event.pod;
    case "RATE_AGREEMENT":
      return event.contract;
  }
}

const bboxKey = (page: number, b: { x1: number; y1: number; x2: number; y2: number }) =>
  `${page}|${b.x1.toFixed(3)}|${b.y1.toFixed(3)}|${b.x2.toFixed(3)}|${b.y2.toFixed(3)}`;

export function EvidenceViewer({
  event,
  selectedField,
  activeDocumentTab,
  onTabChange,
  onSelectField,
}: EvidenceViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [rows, setRows] = useState<EvidenceRow[]>([]);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [documentTabs, setDocumentTabs] = useState<DocumentTabInfo[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);

  // documentId is now the activeDocumentTab itself (a document UUID)
  const documentId = activeDocumentTab;
  const docTabInfo = documentTabs.find((t) => t.id === documentId);
  const documentType = docTabInfo?.type;
  const segmentId = undefined; // Not using segment_id filtering anymore
  const fileUrl = documentId ? `${API_V1}/documents/${documentId}/download` : null;

  const isPODMissing = useMemo(() => {
    return (
      event?.pod?.delivery_status === "MISSING" ||
      event?.reconciliation?.discrepancies?.some((d) => d.code === "MISSING_POD")
    );
  }, [event]);

  const isDuplicate = useMemo(() => {
    return (
      event?.reconciliation?.status === "DUPLICATE" ||
      event?.reconciliation?.discrepancies?.some((d) => d.code === "DUPLICATE_INVOICE")
    );
  }, [event]);

  // Fetch all documents in the ingest batch and create tabs
  useEffect(() => {
    if (!event.ingest_batch_id) return;

    setSegmentsLoading(true);
    const ctrl = new AbortController();

    fetch(`${API_V1}/documents?batch=${encodeURIComponent(event.ingest_batch_id)}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ data: Array<{ id: string; classification: string }> }>;
      })
      .then(async (response) => {
        const docIds = response.data?.map((d: { id: string }) => d.id) || [];
        if (docIds.length === 0) throw new Error("No documents in batch");

        const tabs: DocumentTabInfo[] = [];
        const docTypeMap: Record<string, "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT"> = {};

        for (const docId of docIds) {
          try {
            const segResp = await fetch(`${API_V1}/documents/${docId}/segments`, { signal: ctrl.signal });
            if (!segResp.ok) throw new Error(`Segments HTTP ${segResp.status}`);
            
            const segData = await segResp.json();
            let docType: "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT" = "INVOICE";
            
            // Find the first non-UNKNOWN document type in segments
            for (const seg of segData.segments || []) {
              if (seg.document_type && seg.document_type !== "UNKNOWN") {
                docType = seg.document_type;
                break;
              }
            }

            docTypeMap[docId] = docType;

            // Generate tab label and badge
            let label = "";
            let badge: { label: string; color: string } | undefined;

            switch (docType) {
              case "INVOICE":
                label = "Invoice (Faktur)";
                if (isDuplicate) {
                  badge = { label: "DUPLIKAT", color: "bg-rose-50 text-rose-700 border-rose-200" };
                }
                break;
              case "SURAT_JALAN":
                label = "Surat Jalan";
                break;
              case "POD":
                label = "POD (Bukti Kirim)";
                if (isPODMissing) {
                  badge = { label: "HILANG", color: "bg-rose-50 text-rose-700 border-rose-200" };
                } else {
                  badge = { label: "TERSEDIA", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
                }
                break;
              case "RATE_AGREEMENT":
                label = "Rate Card (PKS)";
                break;
            }

            tabs.push({ id: docId, type: docType, label, badge });
          } catch (e) {
            console.error(`Failed to load segments for ${docId}:`, e);
          }
        }

        setDocumentTabs(tabs);

        // If current documentId is not in tabs, switch to first tab
        if (tabs.length > 0 && !tabs.find((t) => t.id === documentId)) {
          onTabChange(tabs[0].id as DocTab);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          console.error("Failed to fetch batch documents:", e);
          // Fallback: create a default tab using entity's document_id if available
          const entity = entityFor(event, "INVOICE");
          if (entity?.document_id) {
            const docId = entity.document_id;
            const defaultType: "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT" = "INVOICE";
            setDocumentTabs([{
              id: docId,
              type: defaultType,
              label: "Invoice (Faktur)",
              badge: isDuplicate ? { label: "DUPLIKAT", color: "bg-rose-50 text-rose-700 border-rose-200" } : undefined,
            }]);
            if (documentId !== docId) {
              onTabChange(docId as DocTab);
            }
          }
        }
      })
      .finally(() => setSegmentsLoading(false));

    return () => ctrl.abort();
  }, [event.ingest_batch_id, isDuplicate, isPODMissing]);

  // Dynamic Tabs reflecting the actual state of this transaction
  const dynamicTabs = useMemo(() => {
    return documentTabs;
  }, [documentTabs]);

  useEffect(() => {
    setRows([]);
    setRowsError(null);
    if (!documentId) return;
    const ctrl = new AbortController();
    fetch(`${API_V1}/documents/${documentId}/evidence`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((body) => setRows(body.evidence || []))
      .catch((e) => {
        if (e.name !== "AbortError") setRowsError(e.message);
      });
    return () => ctrl.abort();
  }, [documentId]);

  const discrepantFields = useMemo(() => {
    const set = new Set<string>();
    for (const d of event.reconciliation?.discrepancies || []) {
      (DISCREPANCY_FIELDS[d?.code] || []).forEach((f) => set.add(f));
    }
    return set;
  }, [event]);

  const items: EvidenceItem[] = useMemo(() => {
    const out: EvidenceItem[] = [];
    const seen = new Set<string>();
    const push = (
      fieldName: string,
      page: number,
      bbox: { x1: number; y1: number; x2: number; y2: number },
      value: string,
      confidence: number | null
    ) => {
      const key = bboxKey(page, bbox) + "|" + fieldName;
      if (seen.has(key)) return;
      seen.add(key);
      const canonical = canonicalOf(fieldName);
      out.push({
        id: key,
        fieldName,
        canonical,
        label: humanize(fieldName),
        value,
        confidence,
        page,
        bbox,
        isDiscrepant: discrepantFields.has(canonical),
        isUncertain: confidence !== null && confidence > 0 && confidence < 0.7,
      });
    };

    // Use all rows since we're showing one document per tab
    for (const r of rows) {
      if (r.bbox_x1 == null || r.bbox_y1 == null || r.bbox_x2 == null || r.bbox_y2 == null) continue;
      push(
        r.field_name,
        r.page_number,
        { x1: r.bbox_x1, y1: r.bbox_y1, x2: r.bbox_x2, y2: r.bbox_y2 },
        r.field_value,
        r.confidence
      );
    }
    
    return out.sort((a, b) => a.page - b.page || a.bbox.y1 - b.bbox.y1);
  }, [rows, discrepantFields]);

  const isSelected = (it: EvidenceItem) =>
    it.id === activeId ||
    (selectedField != null && (it.canonical === selectedField || it.fieldName === selectedField));

  useEffect(() => {
    setActiveId(null);
    setPage(items.length > 0 ? items[0].page : 1);
  }, [documentId, segmentId, activeDocumentTab]);

  const boxes: OverlayBox[] = items.map((it) => ({
    id: it.id,
    page: it.page,
    x1: it.bbox.x1,
    y1: it.bbox.y1,
    x2: it.bbox.x2,
    y2: it.bbox.y2,
    tone: isSelected(it) ? "selected" : it.isDiscrepant ? "discrepant" : it.isUncertain ? "uncertain" : "default",
    title: `${it.label}${it.value ? `: ${it.value}` : ""}`,
  }));

  const select = (it: EvidenceItem) => {
    setActiveId(it.id);
    setPage(it.page);
    onSelectField(it.canonical);
  };

  const active = items.find(isSelected) || null;
  const lastPage = Math.max(pageCount, 1);

  const formatIDR = (val?: number | null) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <Card className="flex flex-col h-full bg-white border border-slate-200 shadow-2xs overflow-hidden p-0">
      {/* Header Bar with Document Tabs - One per document, no navigation buttons */}
      <CardHeader className="p-2.5 border-b border-slate-100 bg-[#EDF4FA]/70 flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {dynamicTabs.map((tab) => (
            <Button
              key={tab.id}
              size="sm"
              variant={documentId === tab.id ? "default" : "ghost"}
              onClick={() => onTabChange(tab.id as DocTab)}
              className={cn(
                "text-xs h-7 px-2.5 font-bold cursor-pointer relative",
                documentId === tab.id ? "bg-[#243A5E] text-white" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    "ml-1.5 text-[9px] px-1 py-0.2 rounded font-extrabold border",
                    tab.badge.color || "bg-amber-100 text-amber-800 border-amber-200"
                  )}
                >
                  {tab.badge.label}
                </span>
              )}
            </Button>
          ))}
        </div>

        {fileUrl && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-slate-200">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                title="Halaman sebelumnya"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="text-[10px] font-mono font-bold text-slate-700 w-10 text-center">
                {page}/{lastPage}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                title="Halaman berikutnya"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-slate-200">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom((z) => Math.max(z - 15, 60))}
                className="h-6 w-6"
                title="Zoom Out"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-[10px] font-mono font-bold text-slate-700 w-8 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom((z) => Math.min(z + 15, 240))}
                className="h-6 w-6"
                title="Zoom In"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setZoom(100)} className="h-6 px-1.5 text-[10px]">
                Reset
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {fileUrl ? (
          <DocumentPageView
            fileUrl={fileUrl}
            page={page}
            zoom={zoom}
            boxes={boxes}
            onPageCount={setPageCount}
            onBoxClick={(id) => {
              const it = items.find((i) => i.id === id);
              if (it) select(it);
            }}
          />
        ) : (
          /* Canonical Document Proof Sheet */
          <div className="p-6 h-full flex flex-col justify-start space-y-5 bg-slate-50/50">
            {/* 1. TAB INVOICE */}
            {activeDocumentTab === "INVOICE" && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#243A5E] bg-blue-50 px-2 py-0.5 rounded">
                      Faktur Penagihan 3PL Resmi
                    </span>
                    <h3 className="text-xl font-mono font-black text-slate-900 mt-1">
                      {event.invoice.invoice_number || "INV-UNKNOWN"}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Tanggal Faktur: {event.invoice.invoice_date || "-"}</span>
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    {isDuplicate && (
                      <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-bold gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Faktur Terindikasi Duplikat</span>
                      </Badge>
                    )}
                    <div className="text-xs text-slate-500">
                      Status Rekonsiliasi:{" "}
                      <span className="font-bold text-slate-800">{event.reconciliation.status}</span>
                    </div>
                  </div>
                </div>

                {isDuplicate && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
                    <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block">Peringatan Integritas Duplikasi Faktur:</strong>
                      Nomor shipment yang sama ({event.shipment_id}) telah terdeteksi pada dokumen invoice lain.
                      Buka jejak audit untuk memverifikasi nomor invoice sumber sebelum mengambil keputusan.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Penerbit Faktur (Vendor)</span>
                    <p className="font-bold text-slate-800 text-sm">{event.invoice.vendor_name || event.vendor_id}</p>
                    <p className="text-[11px] text-slate-500 font-mono">ID: {event.invoice.vendor_id}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Nomor Pengiriman (Shipment)</span>
                    <p className="font-bold text-slate-800 font-mono text-sm">{event.shipment_id}</p>
                    <p className="text-[11px] text-slate-500">
                      Rute: {event.invoice.origin} → {event.invoice.destination}
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Uraian Tagihan</th>
                        <th className="py-2.5 px-3 text-right">Berat Tagih</th>
                        <th className="py-2.5 px-3 text-right">Total Nilai Tagih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800 block">Jasa Angkut Logistik Cargo Darat/Udara</span>
                          <span className="text-[11px] text-slate-400">
                            Shipment Ref: {event.shipment_id} ({event.invoice.origin} - {event.invoice.destination})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                          {event.invoice.weight_billed_kg} kg
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-sm">
                          {formatIDR(event.invoice.billed_amount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. TAB SURAT JALAN */}
            {activeDocumentTab === "SURAT_JALAN" && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#243A5E] bg-blue-50 px-2 py-0.5 rounded">
                      Surat Jalan Pengiriman (SJ)
                    </span>
                    <h3 className="text-xl font-mono font-black text-slate-900 mt-1">
                      {event.shipment.surat_jalan_number || "SJ-" + event.shipment_id}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-slate-400" />
                      <span>Tanggal Pengiriman: {event.shipment.shipment_date || "-"}</span>
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-bold border-slate-300">
                    Operasional Terverifikasi
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-emerald-600" />
                      <span>Kota Asal (Origin)</span>
                    </span>
                    <p className="font-bold text-slate-800 text-sm">{event.shipment.origin}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-end gap-1">
                      <MapPin className="h-3 w-3 text-rose-600" />
                      <span>Kota Tujuan (Destination)</span>
                    </span>
                    <p className="font-bold text-slate-800 text-sm">{event.shipment.destination}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Berat Aktual Timbangan</span>
                    <span className="font-mono text-base font-extrabold text-slate-800 mt-1 block">
                      {event.shipment.weight_actual_kg} kg
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Jumlah Koli / Paket</span>
                    <span className="font-mono text-base font-extrabold text-slate-800 mt-1 block">
                      {event.shipment.total_packages} Koli
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. TAB POD (BUKTI KIRIM) */}
            {activeDocumentTab === "POD" && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#243A5E] bg-blue-50 px-2 py-0.5 rounded">
                      Proof of Delivery (POD)
                    </span>
                    <h3 className="text-xl font-mono font-black text-slate-900 mt-1">
                      {event.pod.pod_number || "POD-" + event.shipment_id}
                    </h3>
                  </div>

                  {isPODMissing ? (
                    <Badge className="bg-rose-600 text-white border-rose-700 text-xs font-black">
                      POD TIDAK DITEMUKAN
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
                      DELIVERED &amp; TERVERIFIKASI
                    </Badge>
                  )}
                </div>

                {isPODMissing ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>Berkas Bukti Serah Terima (POD) Tidak Ditemukan (MISSING_POD)</span>
                    </div>
                    <p className="text-xs text-rose-700 leading-relaxed">
                      Sistem tidak mendeteksi adanya bukti tanda terima fisik / digital yang sah untuk nomor pengiriman ini.
                      Sesuai PKS pasal 7.2, tagihan pengiriman tanpa bukti POD berstatus <strong>INSUFFICIENT_EVIDENCE</strong>{" "}
                      dan ditolak untuk pembayaran hingga berkas bertanda tangan penerima diserahkan.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Penerima Barang</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{event.pod.receiver_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Tanggal Serah Terima</span>
                      <p className="font-bold text-slate-800 font-mono text-sm mt-0.5">{event.pod.delivery_date}</p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Tanda Tangan &amp; Stempel Basah Lengkap</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">Confidence: 95.0%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. TAB RATE AGREEMENT (PKS) */}
            {activeDocumentTab === "RATE_AGREEMENT" && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#243A5E] bg-blue-50 px-2 py-0.5 rounded">
                      Perjanjian Kerjasama (PKS) / Rate Card
                    </span>
                    <h3 className="text-xl font-mono font-black text-slate-900 mt-1">
                      {event.contract.agreement_id}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Mitra: <strong className="text-slate-800">{event.invoice.vendor_name || event.vendor_id}</strong>
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-bold border-slate-300">
                    PKS Aktif (2026)
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Tarif Disepakati</span>
                    <p className="font-extrabold text-slate-800 text-sm font-mono mt-1">
                      {formatIDR(event.contract.base_rate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Batas Dispute</span>
                    <p className="font-extrabold text-slate-800 text-sm font-mono mt-1">
                      {event.contract.dispute_window_days} Hari
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Fuel Surcharge Cap</span>
                    <p className="font-extrabold text-slate-800 text-sm font-mono mt-1">
                      {event.contract.applicable_fuel_surcharge_percent}%
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <strong>Klausul Validasi Tarif:</strong> Seluruh tagihan invoice wajib mengacu pada matriks rute dan
                  berat aktual timbangan yang tercatat di Surat Jalan dan diverifikasi oleh POD penerima. Sengketa atas
                  selisih tarif wajib diajukan maksimal {event.contract.dispute_window_days} hari sejak faktur terbit.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
