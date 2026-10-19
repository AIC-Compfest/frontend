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
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_V1 } from "@/lib/config";
import { DocumentPageView, OverlayBox } from "@/components/evidence/DocumentPageView";

type DocTab = "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT";

interface EvidenceViewerProps {
  event: ShipmentEvent;
  selectedField: string | null;
  activeDocumentTab: DocTab;
  onTabChange: (tab: DocTab) => void;
  onSelectField: (fieldName: string | null) => void;
}

/** Row returned by GET /documents/:id/evidence (bbox normalized to the page image). */
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
  /** Canonical field name used by the reconciliation card (e.g. billed_amount). */
  canonical: string;
  label: string;
  value: string;
  confidence: number | null;
  page: number;
  bbox: { x1: number; y1: number; x2: number; y2: number };
  isDiscrepant: boolean;
  isUncertain: boolean;
}

const TABS: { key: DocTab; label: string }[] = [
  { key: "INVOICE", label: "Invoice (Faktur)" },
  { key: "SURAT_JALAN", label: "Surat Jalan" },
  { key: "POD", label: "POD (Bukti Kirim)" },
  { key: "RATE_AGREEMENT", label: "Rate Card (PKS)" },
];

/** Names the AI extractor may use for each canonical reconciliation field. */
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

/** Discrepancy code -> canonical fields it concerns. */
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

  const entity = entityFor(event, activeDocumentTab);
  const documentId = entity?.document_id;
  const segmentId = entity?.segment_id;
  const fileUrl = documentId ? `${API_V1}/documents/${documentId}/download` : null;

  // Evidence rows come from the DB through the backend; nothing is invented client-side.
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

    for (const r of rows) {
      if (segmentId && r.segment_id && r.segment_id !== segmentId) continue;
      if (r.bbox_x1 == null || r.bbox_y1 == null || r.bbox_x2 == null || r.bbox_y2 == null) continue;
      push(
        r.field_name,
        r.page_number,
        { x1: r.bbox_x1, y1: r.bbox_y1, x2: r.bbox_x2, y2: r.bbox_y2 },
        r.field_value,
        r.confidence
      );
    }
    // Entity-level evidence (already reconciled by the backend) fills gaps when the
    // evidence endpoint is unavailable.
    const fe: Record<string, EvidenceSource> = entity?.field_evidence || {};
    for (const [name, src] of Object.entries(fe)) {
      if (src?.bbox) push(name, src.page || 1, src.bbox, "", null);
    }
    return out.sort((a, b) => a.page - b.page || a.bbox.y1 - b.bbox.y1);
  }, [rows, segmentId, entity, discrepantFields]);

  const isSelected = (it: EvidenceItem) =>
    it.id === activeId ||
    (selectedField != null && (it.canonical === selectedField || it.fieldName === selectedField));

  // Jump to the first page that has evidence when the document/tab changes.
  useEffect(() => {
    setActiveId(null);
    setPage(items.length > 0 ? items[0].page : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, segmentId, activeDocumentTab]);

  // Follow field selection coming from the reconciliation card.
  useEffect(() => {
    if (!selectedField) return;
    const hit = items.find((i) => i.canonical === selectedField || i.fieldName === selectedField);
    if (hit) setPage(hit.page);
  }, [selectedField, items]);

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

  return (
    <Card className="flex flex-col h-full bg-white border border-slate-200 shadow-2xs overflow-hidden p-0">
      <CardHeader className="p-2.5 border-b border-slate-100 bg-[#EDF4FA]/70 flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {TABS.map((t) => (
            <Button
              key={t.key}
              size="sm"
              variant={activeDocumentTab === t.key ? "default" : "ghost"}
              onClick={() => onTabChange(t.key)}
              className="text-xs h-7 px-2.5 font-bold"
            >
              {t.label}
            </Button>
          ))}
        </div>

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
      </CardHeader>

      {/* Truthful evidence banner: counts only boxes that really exist for this document. */}
      {fileUrl && (
        <div
          className={cn(
            "px-3 py-1.5 border-b flex items-center gap-2 text-[11px]",
            items.length > 0
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          )}
        >
          {items.length > 0 ? (
            <CheckCircle2 className="h-3 w-3 shrink-0" />
          ) : (
            <AlertTriangle className="h-3 w-3 shrink-0" />
          )}
          <span>
            {items.length > 0 ? (
              <>
                <strong>{items.length} field</strong> memiliki bukti bbox pada dokumen asli.
              </>
            ) : rowsError ? (
              <>Bukti bbox tidak dapat dimuat ({rowsError}).</>
            ) : (
              <>Belum ada bukti bbox yang tersimpan untuk dokumen ini.</>
            )}
          </span>
        </div>
      )}

      <div className="flex-1 min-h-0">
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
          <div className="h-full flex flex-col items-center justify-center gap-2 text-xs text-slate-500 p-6 text-center">
            <Info className="h-5 w-5 text-slate-400" />
            Dokumen asli untuk {TABS.find((t) => t.key === activeDocumentTab)?.label} tidak terhubung ke transaksi
            ini, sehingga tidak ada yang bisa ditampilkan.
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50">
        <div className="px-3 pt-2 pb-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Field Evidence</span>
        </div>
        <div className="flex flex-col divide-y divide-slate-100 max-h-36 overflow-y-auto">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => select(it)}
              className={cn(
                "text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 transition-colors text-[11px]",
                isSelected(it) && "bg-blue-50"
              )}
            >
              {it.isDiscrepant || it.isUncertain ? (
                <AlertTriangle
                  className={cn("h-3 w-3 shrink-0", it.isDiscrepant ? "text-rose-500" : "text-amber-500")}
                />
              ) : (
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              )}
              <span className="flex-1 font-medium text-slate-700 truncate">{it.label}</span>
              {it.value && (
                <span className="font-mono text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[140px]">
                  {it.value}
                </span>
              )}
              <span className="text-[9px] text-slate-400 font-mono shrink-0">
                p{it.page}
                {it.confidence !== null ? ` ${(it.confidence * 100).toFixed(0)}%` : ""}
              </span>
            </button>
          ))}
          {items.length === 0 && (
            <div className="px-3 py-3 text-[11px] text-slate-400 text-center">
              Tidak ada field ber-bbox untuk dokumen ini.
            </div>
          )}
        </div>
      </div>

      {active && (
        <div className="p-3 bg-white border-t border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={active.isDiscrepant ? "destructive" : "success"} className="text-[10px] font-bold">
              {active.isDiscrepant ? "DISCREPANCY" : "OCR EVIDENCE"}
            </Badge>
            <span className="font-bold text-slate-800">{active.label}</span>
            {active.value && (
              <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{active.value}</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            hal {active.page} • [{active.bbox.x1.toFixed(3)}, {active.bbox.y1.toFixed(3)}, {active.bbox.x2.toFixed(3)},{" "}
            {active.bbox.y2.toFixed(3)}]
            {active.confidence !== null && ` • ${(active.confidence * 100).toFixed(1)}%`}
          </div>
        </div>
      )}
    </Card>
  );
}
