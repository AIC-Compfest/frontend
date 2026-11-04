"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ShipmentEvent } from "@/types/reconciliation";
import { Card, CardHeader } from "@/components/ui/card";
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
import { formatIDR } from "@/lib/format";
import {
  chip,
  ChipTone,
  focusRing,
  label as labelClass,
  td,
  th,
} from "@/lib/dashboard-ui";
import { DocumentPageView, OverlayBox } from "@/components/evidence/DocumentPageView";

type DocTab = string; // Document IDs are used directly as tab keys

interface DocumentTabInfo {
  id: string;
  type: "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT";
  label: string;
  badge?: { label: string; tone: ChipTone };
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

function IconButton({
  label,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid h-6 w-6 place-items-center rounded-pop text-body transition-colors hover:bg-surface-soft hover:text-ink disabled:pointer-events-none disabled:opacity-40",
        focusRing,
        className
      )}
      {...props}
    />
  );
}

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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [documentTabs, setDocumentTabs] = useState<DocumentTabInfo[]>([]);

  // documentId is the activeDocumentTab itself (a document UUID)
  const documentId = activeDocumentTab;
  const segmentId = undefined; // segment_id filtering is no longer used
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

  // Fetch all documents in the ingest batch and create one tab per document
  useEffect(() => {
    if (!event.ingest_batch_id) return;

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

        for (const docId of docIds) {
          try {
            const segResp = await fetch(`${API_V1}/documents/${docId}/segments`, { signal: ctrl.signal });
            if (!segResp.ok) throw new Error(`Segments HTTP ${segResp.status}`);

            const segData = await segResp.json();
            let docType: "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT" = "INVOICE";

            // Use the first non-UNKNOWN document type found in the segments
            for (const seg of segData.segments || []) {
              if (seg.document_type && seg.document_type !== "UNKNOWN") {
                docType = seg.document_type;
                break;
              }
            }

            // Tab label and status badge
            let label = "";
            let badge: { label: string; tone: ChipTone } | undefined;

            switch (docType) {
              case "INVOICE":
                label = "Invoice";
                if (isDuplicate) {
                  badge = { label: "DUPLICATE", tone: "error" };
                }
                break;
              case "SURAT_JALAN":
                label = "Delivery Note (SJ)";
                break;
              case "POD":
                label = "Proof of Delivery (POD)";
                if (isPODMissing) {
                  badge = { label: "MISSING", tone: "error" };
                } else {
                  badge = { label: "AVAILABLE", tone: "success" };
                }
                break;
              case "RATE_AGREEMENT":
                label = "Rate Agreement (PKS)";
                break;
            }

            tabs.push({ id: docId, type: docType, label, badge });
          } catch (e) {
            console.error(`Failed to load segments for ${docId}:`, e);
          }
        }

        setDocumentTabs(tabs);

        // If the current document is not in the tabs, switch to the first tab
        if (tabs.length > 0 && !tabs.find((t) => t.id === documentId)) {
          onTabChange(tabs[0].id as DocTab);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          console.error("Failed to fetch batch documents:", e);
          // Fallback: a single tab for the invoice's document_id, when available
          const entity = entityFor(event, "INVOICE");
          if (entity?.document_id) {
            const docId = entity.document_id;
            setDocumentTabs([{
              id: docId,
              type: "INVOICE",
              label: "Invoice",
              badge: isDuplicate ? { label: "DUPLICATE", tone: "error" } : undefined,
            }]);
            if (documentId !== docId) {
              onTabChange(docId as DocTab);
            }
          }
        }
      });

    return () => ctrl.abort();
  }, [event.ingest_batch_id, isDuplicate, isPODMissing]);

  useEffect(() => {
    setRows([]);
    if (!documentId) return;
    const ctrl = new AbortController();
    fetch(`${API_V1}/documents/${documentId}/evidence`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((body) => setRows(body.evidence || []))
      .catch(() => {
        // Evidence rows are optional. Without them the viewer shows the page with no overlays.
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

    // All rows belong to the single document shown in this tab
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

  const lastPage = Math.max(pageCount, 1);

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-card p-0 text-ink shadow-none">
      {/* Header bar with one tab per document */}
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-hairline bg-surface-soft/70 p-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {documentTabs.map((tab) => {
            const isActive = documentId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id as DocTab)}
                className={cn(
                  "relative inline-flex h-7 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-control px-2.5 text-[12px] font-semibold transition-colors",
                  isActive ? "bg-navy text-white" : "text-body hover:bg-card hover:text-ink",
                  focusRing
                )}
              >
                <span>{tab.label}</span>
                {tab.badge && <span className={chip(tab.badge.tone, "px-1.5 py-0 text-[9px]")}>{tab.badge.label}</span>}
              </button>
            );
          })}
        </div>

        {fileUrl && (
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-1 rounded-control border border-hairline bg-card px-1.5 py-0.5">
              <IconButton
                label="Previous page"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              </IconButton>
              <span className="w-10 text-center text-[11px] font-semibold tabular-nums text-ink">
                {page}/{lastPage}
              </span>
              <IconButton
                label="Next page"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              </IconButton>
            </div>
            <div className="flex items-center gap-1 rounded-control border border-hairline bg-card px-1.5 py-0.5">
              <IconButton label="Zoom out" onClick={() => setZoom((z) => Math.max(z - 15, 60))}>
                <ZoomOut className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              </IconButton>
              <span className="w-8 text-center text-[11px] font-semibold tabular-nums text-ink">{zoom}%</span>
              <IconButton label="Zoom in" onClick={() => setZoom((z) => Math.min(z + 15, 240))}>
                <ZoomIn className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              </IconButton>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className={cn("h-6 rounded-pop px-1.5 text-[11px] font-semibold text-body hover:bg-surface-soft hover:text-ink", focusRing)}
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </CardHeader>

      {/* Main content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
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
          /* Canonical document proof sheet */
          <div className="flex h-full flex-col justify-start space-y-5 bg-canvas p-6">
            {/* 1. Invoice */}
            {activeDocumentTab === "INVOICE" && (
              <div className="space-y-5 rounded-card border border-hairline bg-card p-6">
                <div className="flex items-start justify-between gap-4 border-b border-hairline pb-4">
                  <div className="space-y-1">
                    <span className={chip("navy", "px-2 py-0.5 text-[10px] uppercase tracking-[.08em]")}>
                      Official 3PL invoice
                    </span>
                    <h3 className="mt-1 text-[20px] font-semibold tabular-nums text-ink">
                      {event.invoice.invoice_number || "INV-UNKNOWN"}
                    </h3>
                    <p className="flex items-center gap-1.5 text-[12px] font-medium text-body">
                      <Calendar className="h-3.5 w-3.5 text-muted" strokeWidth={1.75} aria-hidden="true" />
                      <span>Invoice date: {event.invoice.invoice_date || "-"}</span>
                    </p>
                  </div>

                  <div className="space-y-1 text-right">
                    {isDuplicate && (
                      <span className={chip("error", "gap-1")}>
                        <AlertTriangle className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                        <span>Duplicate invoice detected</span>
                      </span>
                    )}
                    <div className="text-[12px] text-body">
                      Reconciliation status:{" "}
                      <span className="font-semibold text-ink">{event.reconciliation.status}</span>
                    </div>
                  </div>
                </div>

                {isDuplicate && (
                  <div className="flex items-start gap-2.5 rounded-control border border-error/40 bg-error-soft p-3.5 text-[13px] text-error-ink">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    <div>
                      <strong className="block font-semibold">Duplicate invoice warning:</strong>
                      The same shipment number ({event.shipment_id}) was found on another invoice. Open the audit
                      trail to verify the source invoice number before deciding.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 rounded-control border border-hairline bg-canvas p-4 text-[12px]">
                  <div className="space-y-1">
                    <span className={labelClass}>Issuer (vendor)</span>
                    <p className="text-[14px] font-semibold text-ink">{event.invoice.vendor_name || event.vendor_id}</p>
                    <p className="text-[11px] tabular-nums text-body">ID: {event.invoice.vendor_id}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className={labelClass}>Shipment number</span>
                    <p className="text-[14px] font-semibold tabular-nums text-ink">{event.shipment_id}</p>
                    <p className="text-[11px] text-body">
                      Route: {event.invoice.origin} → {event.invoice.destination}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-panel border border-hairline">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th className={th}>Charge description</th>
                        <th className={cn(th, "text-right")}>Billed weight</th>
                        <th className={cn(th, "text-right")}>Billed amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={td}>
                          <span className="block font-semibold text-ink">Land and air cargo freight service</span>
                          <span className="text-[11px] text-muted">
                            Shipment Ref: {event.shipment_id} ({event.invoice.origin} - {event.invoice.destination})
                          </span>
                        </td>
                        <td className={cn(td, "text-right font-semibold")}>{event.invoice.weight_billed_kg} kg</td>
                        <td className={cn(td, "text-right font-semibold")}>{formatIDR(event.invoice.billed_amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Delivery note */}
            {activeDocumentTab === "SURAT_JALAN" && (
              <div className="space-y-5 rounded-card border border-hairline bg-card p-6">
                <div className="flex items-start justify-between gap-4 border-b border-hairline pb-4">
                  <div className="space-y-1">
                    <span className={chip("navy", "px-2 py-0.5 text-[10px] uppercase tracking-[.08em]")}>
                      Delivery note (SJ)
                    </span>
                    <h3 className="mt-1 text-[20px] font-semibold tabular-nums text-ink">
                      {event.shipment.surat_jalan_number || "SJ-" + event.shipment_id}
                    </h3>
                    <p className="flex items-center gap-1.5 text-[12px] font-medium text-body">
                      <Truck className="h-3.5 w-3.5 text-muted" strokeWidth={1.75} aria-hidden="true" />
                      <span>Shipment date: {event.shipment.shipment_date || "-"}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-control border border-hairline bg-canvas p-4 text-[12px]">
                  <div className="space-y-1">
                    <span className={cn(labelClass, "flex items-center gap-1")}>
                      <MapPin className="h-3 w-3 text-teal-ink" strokeWidth={1.75} aria-hidden="true" />
                      <span>Origin city</span>
                    </span>
                    <p className="text-[14px] font-semibold text-ink">{event.shipment.origin}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className={cn(labelClass, "flex items-center justify-end gap-1")}>
                      <MapPin className="h-3 w-3 text-error-ink" strokeWidth={1.75} aria-hidden="true" />
                      <span>Destination city</span>
                    </span>
                    <p className="text-[14px] font-semibold text-ink">{event.shipment.destination}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-control border border-hairline bg-card p-3.5">
                    <span className={labelClass}>Actual scale weight</span>
                    <span className="mt-1 block text-[16px] font-semibold tabular-nums text-ink">
                      {event.shipment.weight_actual_kg} kg
                    </span>
                  </div>
                  <div className="rounded-control border border-hairline bg-card p-3.5">
                    <span className={labelClass}>Packages</span>
                    <span className="mt-1 block text-[16px] font-semibold tabular-nums text-ink">
                      {event.shipment.total_packages} packages
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Proof of delivery */}
            {activeDocumentTab === "POD" && (
              <div className="space-y-5 rounded-card border border-hairline bg-card p-6">
                <div className="flex items-start justify-between gap-4 border-b border-hairline pb-4">
                  <div className="space-y-1">
                    <span className={chip("navy", "px-2 py-0.5 text-[10px] uppercase tracking-[.08em]")}>
                      Proof of Delivery (POD)
                    </span>
                    <h3 className="mt-1 text-[20px] font-semibold tabular-nums text-ink">
                      {event.pod.pod_number || "POD-" + event.shipment_id}
                    </h3>
                  </div>

                  {isPODMissing ? (
                    <span className={chip("solidError", "text-[11px]")}>POD NOT FOUND</span>
                  ) : (
                    <span className={chip("success", "text-[11px]")}>{event.pod.delivery_status || "DELIVERED"}</span>
                  )}
                </div>

                {isPODMissing ? (
                  <div className="space-y-2 rounded-control border border-error/40 bg-error-soft p-4">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-error-ink">
                      <XCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      <span>Proof of Delivery (POD) not found (MISSING_POD)</span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-error-ink">
                      The system found no valid physical or digital proof of receipt for this shipment number. Under
                      PKS clause 7.2, a shipment invoice without POD proof is marked{" "}
                      <strong>INSUFFICIENT_EVIDENCE</strong> and rejected for payment until a receiver-signed document
                      is provided.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 rounded-control border border-hairline bg-canvas p-4 text-[12px]">
                    <div>
                      <span className={labelClass}>Receiver</span>
                      <p className="mt-0.5 text-[14px] font-semibold text-ink">{event.pod.receiver_name}</p>
                    </div>
                    <div className="text-right">
                      <span className={labelClass}>Delivery date</span>
                      <p className="mt-0.5 text-[14px] font-semibold tabular-nums text-ink">{event.pod.delivery_date}</p>
                    </div>
                    <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={chip(event.pod.signature_present ? "success" : "error", "gap-1")}>
                          {event.pod.signature_present ? (
                            <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                          ) : (
                            <XCircle className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                          )}
                          Signature {event.pod.signature_present ? "present" : "missing"}
                        </span>
                        <span className={chip(event.pod.stamp_present ? "success" : "error", "gap-1")}>
                          {event.pod.stamp_present ? (
                            <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                          ) : (
                            <XCircle className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                          )}
                          Stamp {event.pod.stamp_present ? "present" : "missing"}
                        </span>
                      </div>
                      <span className="text-[11px] tabular-nums text-body">
                        Signature confidence:{" "}
                        {typeof event.pod.signature_confidence === "number"
                          ? `${(event.pod.signature_confidence * 100).toFixed(1)}%`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Rate agreement (PKS) */}
            {activeDocumentTab === "RATE_AGREEMENT" && (
              <div className="space-y-5 rounded-card border border-hairline bg-card p-6">
                <div className="flex items-start justify-between gap-4 border-b border-hairline pb-4">
                  <div className="space-y-1">
                    <span className={chip("navy", "px-2 py-0.5 text-[10px] uppercase tracking-[.08em]")}>
                      Rate agreement (PKS) / rate card
                    </span>
                    <h3 className="mt-1 text-[20px] font-semibold tabular-nums text-ink">
                      {event.contract.agreement_id}
                    </h3>
                    <p className="text-[12px] font-medium text-body">
                      Partner: <strong className="font-semibold text-ink">{event.invoice.vendor_name || event.vendor_id}</strong>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 rounded-control border border-hairline bg-canvas p-4 text-center text-[12px]">
                  <div>
                    <span className={labelClass}>Agreed rate</span>
                    <p className="mt-1 text-[14px] font-semibold tabular-nums text-ink">
                      {formatIDR(event.contract.base_rate)}
                    </p>
                  </div>
                  <div>
                    <span className={labelClass}>Dispute window</span>
                    <p className="mt-1 text-[14px] font-semibold tabular-nums text-ink">
                      {event.contract.dispute_window_days} days
                    </p>
                  </div>
                  <div>
                    <span className={labelClass}>Fuel surcharge cap</span>
                    <p className="mt-1 text-[14px] font-semibold tabular-nums text-ink">
                      {event.contract.applicable_fuel_surcharge_percent}%
                    </p>
                  </div>
                </div>

                <div className="rounded-control border border-hairline p-3.5 text-[13px] leading-relaxed text-body">
                  <strong className="font-semibold text-ink">Rate validation clause:</strong> Every invoice charge must
                  follow the route matrix and the actual scale weight recorded on the delivery note and verified by the
                  receiver&apos;s POD. Rate disputes must be filed within {event.contract.dispute_window_days} days of the
                  invoice date.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
