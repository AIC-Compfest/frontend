"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ShipmentEvent, BoundingBox, EvidenceSource } from "@/types/reconciliation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  FileText,
  Layers,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EvidenceViewerProps {
  event: ShipmentEvent;
  selectedField: string | null;
  activeDocumentTab: "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT";
  onTabChange: (tab: "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT") => void;
  onSelectField: (fieldName: string | null) => void;
}

interface BBoxItem {
  id: string;
  fieldName: string;
  label: string;
  rawValue: string;
  normalizedValue: string;
  confidence: number;
  /** bbox is null when no real evidence exists for this field */
  bbox: BoundingBox | null;
  /** True when bbox came from OCR evidence (real), false when it's estimated/missing */
  hasRealEvidence: boolean;
  page: number;
  isDiscrepant: boolean;
  isUncertain: boolean;
  evidenceSource?: EvidenceSource;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Build BBoxItem list from canonical field_evidence
// All evidence MUST come from field_evidence (OCR-traced bboxes).
// If field_evidence is absent, the field renders without a bbox overlay.
// ─────────────────────────────────────────────────────────────────────────────

function buildBBoxItems(
  event: ShipmentEvent,
  tab: "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT"
): BBoxItem[] {
  const items: BBoxItem[] = [];
  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const isOvercharge = event.reconciliation.discrepancies.some(
    (d) => d.code === "RATE_OVERCHARGE"
  );
  const isWrongZone = event.reconciliation.discrepancies.some(
    (d) => d.code === "WRONG_ZONE"
  );
  const isWeightMismatch = event.reconciliation.discrepancies.some(
    (d) => d.code === "WEIGHT_DISCREPANCY"
  );
  const isMissingSig = event.reconciliation.discrepancies.some(
    (d) => d.code === "MISSING_SIGNATURE"
  );
  const isDateMismatch = event.reconciliation.discrepancies.some(
    (d) => d.code === "DATE_MISMATCH"
  );
  const isQtyMismatch = event.reconciliation.discrepancies.some(
    (d) => d.code === "QUANTITY_MISMATCH"
  );

  /**
   * Create a BBoxItem from field_evidence.
   * If evidenceKey has no bbox → hasRealEvidence = false, bbox = null.
   * No hardcoded fallback coordinates. Ever.
   */
  function makeItem(
    id: string,
    fieldName: string,
    label: string,
    rawValue: string,
    normalizedValue: string,
    confidence: number,
    evidenceSource: EvidenceSource | undefined,
    isDiscrepant: boolean,
    isUncertain: boolean
  ): BBoxItem {
    const hasRealEvidence = !!(evidenceSource?.bbox);
    return {
      id,
      fieldName,
      label,
      rawValue,
      normalizedValue,
      confidence,
      bbox: evidenceSource?.bbox ?? null,
      hasRealEvidence,
      page: evidenceSource?.page ?? 1,
      isDiscrepant,
      isUncertain,
      evidenceSource,
    };
  }

  if (tab === "INVOICE") {
    const inv = event.invoice;
    items.push(makeItem(
      "inv_total", "billed_amount", "Grand Total Tagihan",
      formatIDR(inv.billed_amount), `${inv.billed_amount}`,
      0.99, inv.field_evidence?.billed_amount, isOvercharge, false
    ));
    items.push(makeItem(
      "inv_dest", "destination", "Kota Tujuan Tagih",
      inv.destination ?? "—", inv.destination ?? "",
      0.98, inv.field_evidence?.destination, isWrongZone, false
    ));
    items.push(makeItem(
      "inv_weight", "weight_billed_kg", "Berat Tagih (Billed Weight)",
      `${inv.weight_billed_kg} kg`, `${inv.weight_billed_kg}`,
      0.97, inv.field_evidence?.weight_billed_kg, false, false
    ));
    items.push(makeItem(
      "inv_number", "invoice_number", "Nomor Invoice",
      inv.invoice_number, inv.invoice_number,
      0.99, inv.field_evidence?.invoice_number, false, false
    ));
    items.push(makeItem(
      "inv_date", "invoice_date", "Tanggal Invoice",
      inv.invoice_date, inv.invoice_date,
      0.97, inv.field_evidence?.invoice_date, false, false
    ));

  } else if (tab === "SURAT_JALAN") {
    const sj = event.shipment;
    items.push(makeItem(
      "sj_id", "shipment_id", "Nomor Surat Jalan / Ref",
      sj.shipment_id, sj.shipment_id,
      0.96, sj.field_evidence?.shipment_id, false, false
    ));
    items.push(makeItem(
      "sj_weight", "weight_actual_kg", "Berat Timbangan Fisik Gudang",
      `${sj.weight_actual_kg} kg`, `${sj.weight_actual_kg}`,
      0.95, sj.field_evidence?.weight_actual_kg, isWeightMismatch, false
    ));
    items.push(makeItem(
      "sj_dest", "destination", "Destinasi Fisik Surat Jalan",
      sj.destination, sj.destination,
      0.98, sj.field_evidence?.destination, isWrongZone, false
    ));
    if (sj.awb_number) {
      items.push(makeItem(
        "sj_awb", "awb_number", "AWB / Resi Number",
        sj.awb_number, sj.awb_number,
        0.96, sj.field_evidence?.awb_number, false, false
      ));
    }

  } else if (tab === "POD") {
    const pod = event.pod;
    if (pod.quantity_received !== undefined && pod.quantity_received !== null) {
      items.push(makeItem(
        "pod_qty", "quantity_received", "Jumlah Koli Diterima (Received Qty)",
        `${pod.quantity_received} Koli`, `${pod.quantity_received}`,
        0.94, pod.field_evidence?.quantity_received, isQtyMismatch, false
      ));
    } else {
      items.push({
        id: "pod_qty_missing",
        fieldName: "quantity_received",
        label: "Jumlah Koli Fisik (Not Stated on POD)",
        rawValue: "TIDAK TERCANTUM PADA BUKTI POD",
        normalizedValue: "null",
        confidence: 0.0,
        bbox: null,
        hasRealEvidence: false,
        page: 1,
        isDiscrepant: false,
        isUncertain: true,
      });
    }

    const sigConfidence = pod.signature_confidence || 0.95;
    const isSigUncertain = pod.signature_present && sigConfidence < 0.70;
    items.push(makeItem(
      "pod_sig", "signature_present", "Tanda Tangan Fisik Penerima (Signature Presence)",
      pod.signature_present
        ? (isSigUncertain ? "TANDA TANGAN MERAGUKAN" : "HADIR / TERDETEKSI")
        : "TIDAK DITEMUKAN",
      `${pod.signature_present}`,
      sigConfidence,
      pod.field_evidence?.signature_present,
      isMissingSig, isSigUncertain
    ));

    if (pod.stamp_present) {
      items.push(makeItem(
        "pod_stamp", "stamp_present", "Stempel Resmi Perusahaan",
        "TERDETEKSI (Stamp Present)", "true",
        0.94, pod.field_evidence?.stamp_present, false, false
      ));
    }

    items.push(makeItem(
      "pod_date", "delivery_date", "Tanggal Serah Terima POD",
      pod.delivery_date ?? "—", pod.delivery_date ?? "",
      0.92, pod.field_evidence?.delivery_date, isDateMismatch, false
    ));

  } else if (tab === "RATE_AGREEMENT") {
    const ctr = event.contract;
    items.push(makeItem(
      "ctr_base_rate", "base_rate", "Tarif Terkontrak (Rate Card)",
      new Intl.NumberFormat("id-ID", {style:"currency",currency:"IDR",maximumFractionDigits:0}).format(ctr.base_rate),
      `${ctr.base_rate}`,
      0.99, ctr.field_evidence?.base_rate, isOvercharge, false
    ));
    items.push(makeItem(
      "ctr_fuel", "fuel_surcharge_percent", "Fuel Surcharge Agreement",
      `${ctr.applicable_fuel_surcharge_percent}%`, `${ctr.applicable_fuel_surcharge_percent}`,
      0.99, ctr.field_evidence?.fuel_surcharge_percent, false, false
    ));
    items.push(makeItem(
      "ctr_effective", "effective_from", "Masa Berlaku Perjanjian",
      `${ctr.effective_from} s/d ${ctr.effective_to}`, ctr.effective_from,
      0.98, ctr.field_evidence?.effective_from, false, false
    ));
  }

  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// EvidenceViewer Component
// ─────────────────────────────────────────────────────────────────────────────

export function EvidenceViewer({
  event,
  selectedField,
  activeDocumentTab,
  onTabChange,
  onSelectField,
}: EvidenceViewerProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [inspectedBBox, setInspectedBBox] = useState<BBoxItem | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const activeBBoxes = React.useMemo(
    () => buildBBoxItems(event, activeDocumentTab),
    [activeDocumentTab, event]
  );

  const currentInspectedBBox =
    (selectedField
      ? activeBBoxes.find((b) => b.fieldName === selectedField)
      : null) ?? inspectedBBox;

  const handleBBoxClick = (box: BBoxItem) => {
    setInspectedBBox(box);
    onSelectField(box.fieldName);
  };

  // Count how many fields have real vs missing evidence
  const realEvidenceCount = activeBBoxes.filter((b) => b.hasRealEvidence).length;
  const totalFields = activeBBoxes.length;
  const missingEvidenceCount = totalFields - realEvidenceCount;

  const TABS = [
    { key: "INVOICE", label: "Invoice (Faktur)" },
    { key: "SURAT_JALAN", label: "Surat Jalan" },
    { key: "POD", label: "POD (Bukti Kirim)" },
    { key: "RATE_AGREEMENT", label: "Rate Card (PKS)" },
  ] as const;

  return (
    <Card className="flex flex-col h-full bg-white border border-slate-200 shadow-2xs overflow-hidden p-0">
      {/* Document Tab Bar */}
      <CardHeader className="p-2.5 border-b border-slate-100 bg-[#EDF4FA]/70 flex flex-row items-center justify-between">
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

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoomLevel((z) => Math.max(z - 15, 60))}
            className="h-6 w-6 text-slate-600 hover:text-slate-900"
            title="Zoom Out"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="text-[10px] font-mono font-bold text-slate-700 w-8 text-center">
            {zoomLevel}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoomLevel((z) => Math.min(z + 15, 160))}
            className="h-6 w-6 text-slate-600 hover:text-slate-900"
            title="Zoom In"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoomLevel(100)}
            className="h-6 px-1.5 text-[10px] text-[#5F86A6] hover:text-[#243A5E]"
          >
            Reset
          </Button>
        </div>
      </CardHeader>

      {/* Evidence Quality Banner */}
      {missingEvidenceCount > 0 && (
        <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-[11px] text-amber-800">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>
            <strong>{missingEvidenceCount}/{totalFields} field</strong> tidak memiliki bukti OCR bbox.
            Koordinat spasial tidak tersedia dari dokumen asli.
          </span>
        </div>
      )}
      {missingEvidenceCount === 0 && totalFields > 0 && (
        <div className="px-3 py-1.5 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2 text-[11px] text-emerald-800">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <span>
            Semua <strong>{totalFields} field</strong> memiliki bukti OCR bbox dari dokumen asli.
          </span>
        </div>
      )}

      {/* Document Canvas Area */}
      <CardContent
        className="flex-1 p-4 bg-slate-100/70 overflow-auto flex items-start justify-center relative min-h-[480px]"
        ref={canvasContainerRef}
      >
        {/*
         * ARCHITECTURE NOTE:
         * This div simulates a document canvas for demonstration purposes.
         * In production, this should be replaced with a PDF.js renderer that:
         *   1. Fetches the actual PDF from storage (GET /documents/:id/file)
         *   2. Renders each page to a <canvas> element using PDF.js
         *   3. Overlays BBoxItem divs on top of the canvas using the normalized
         *      bbox coordinates converted to canvas pixel space:
         *        left = bbox.x1 * canvas.width
         *        top  = bbox.y1 * canvas.height
         *        width = (bbox.x2 - bbox.x1) * canvas.width
         *        height = (bbox.y2 - bbox.y1) * canvas.height
         *
         * The current implementation renders a structured HTML representation
         * of the document data as a fallback for environments where the PDF
         * storage is not accessible. BBox overlays are shown only for fields
         * that have real OCR evidence (hasRealEvidence = true).
         *
         * TODO: Integrate PDF.js renderer and remove this HTML simulation.
         * See ARCHITECTURE_AUDIT.md §3 for full requirements.
         */}
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
          className="w-[520px] bg-white rounded-xl shadow-md border border-slate-300 p-6 relative select-none transition-all"
        >
          {/* Document Header */}
          <div className="border-b-2 border-slate-800 pb-3 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-sm text-slate-900 tracking-wide">
                  {activeDocumentTab === "INVOICE" && "PT CEPAT LOGISTIK NUSANTARA — INVOICE"}
                  {activeDocumentTab === "SURAT_JALAN" && "SURAT JALAN & PENGANTAR BARANG"}
                  {activeDocumentTab === "POD" && "BUKTI PENYERAHAN BARANG (PROOF OF DELIVERY)"}
                  {activeDocumentTab === "RATE_AGREEMENT" && "PERJANJIAN KERJASAMA TARIF LOGISTIK (RATE CARD)"}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Ref ID:{" "}
                  {activeDocumentTab === "INVOICE" && event.invoice.invoice_number}
                  {activeDocumentTab === "SURAT_JALAN" && event.shipment.surat_jalan_number}
                  {activeDocumentTab === "POD" && event.pod.pod_number}
                  {activeDocumentTab === "RATE_AGREEMENT" && event.contract.agreement_id}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className="text-[10px] font-mono font-bold bg-slate-50">
                  PAGE 1 OF 1
                </Badge>
                <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">
                  SIMULATED VIEW
                </Badge>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="space-y-4 text-xs text-slate-700 font-sans leading-relaxed">
            {/* Meta Key-Values */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Vendor / Transporter</div>
                <div className="font-semibold text-slate-800">{event.vendor_id}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Tanggal Dokumen</div>
                <div className="font-semibold text-slate-800">{event.shipment.shipment_date}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Kota Asal (Origin)</div>
                <div className="font-medium text-slate-800">{event.shipment.origin}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Kota Tujuan (Destination)</div>
                <div className="font-medium text-slate-800">{event.shipment.destination}</div>
              </div>
            </div>

            {/* Invoice Table */}
            {activeDocumentTab === "INVOICE" && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-800">
                    <tr>
                      <th className="p-2">Deskripsi Layanan</th>
                      <th className="p-2 text-right">Berat Tagih</th>
                      <th className="p-2 text-right">Jumlah (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2">
                        Jasa Ekspedisi ({event.shipment.origin} → {event.invoice.destination})
                      </td>
                      <td className="p-2 text-right font-mono">{event.invoice.weight_billed_kg} kg</td>
                      <td className="p-2 text-right font-mono">{formatIDR(event.invoice.billed_amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeDocumentTab === "SURAT_JALAN" && (
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor Resi / AWB:</span>
                  <span className="font-mono font-semibold">{event.shipment.awb_number || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Koli / Colly:</span>
                  <span className="font-mono font-semibold">{event.shipment.total_packages} Karton</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Berat Aktual Timbangan:</span>
                  <span className="font-mono font-semibold">{event.shipment.weight_actual_kg} kg</span>
                </div>
              </div>
            )}

            {activeDocumentTab === "POD" && (
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Serah Terima:</span>
                  <span className="font-semibold text-emerald-700">{event.pod.delivery_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Koli Fisik Diterima:</span>
                  <span className="font-mono font-semibold">
                    {event.pod.quantity_received !== undefined && event.pod.quantity_received !== null
                      ? `${event.pod.quantity_received} Karton`
                      : "Tidak tertera pada bukti POD"}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-slate-500">Penerima & Stempel</div>
                    <div className="font-medium text-slate-800">Gudang Penerima Retail</div>
                  </div>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 text-center w-28 h-14 flex items-center justify-center bg-white">
                    {event.pod.signature_present ? (
                      <span className="text-[10px] font-bold text-indigo-700">✓ TTD & CAP BASAH</span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-600">✕ TANPA TTD</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeDocumentTab === "RATE_AGREEMENT" && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-800">
                    <tr>
                      <th className="p-2">Rute Terkontrak</th>
                      <th className="p-2">Layanan</th>
                      <th className="p-2 text-right">Tarif Dasar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 font-medium">
                        {event.shipment.origin} → {event.shipment.destination}
                      </td>
                      <td className="p-2">REGULAR</td>
                      <td className="p-2 text-right font-mono font-bold text-[#243A5E]">
                        {formatIDR(event.contract.base_rate)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
           * BOUNDING BOX OVERLAYS
           * Only rendered for fields with REAL OCR evidence (hasRealEvidence=true).
           * Fields without bbox evidence show in the field list below but NOT
           * as overlays on the document, because hardcoded coordinates would
           * be misleading (they don't point to real locations in the document).
           *
           * In the PDF.js version, these overlays will be positioned on the
           * actual rendered PDF canvas using canvas-relative pixel coordinates.
           ───────────────────────────────────────────────────────────── */}
          {activeBBoxes
            .filter((box) => box.hasRealEvidence && box.bbox !== null)
            .map((box) => {
              const { bbox } = box;
              if (!bbox) return null;

              const isSelected =
                selectedField === box.fieldName || inspectedBBox?.id === box.id;

              const style: React.CSSProperties = {
                position: "absolute",
                left: `${bbox.x1 * 100}%`,
                top: `${bbox.y1 * 100}%`,
                width: `${(bbox.x2 - bbox.x1) * 100}%`,
                height: `${(bbox.y2 - bbox.y1) * 100}%`,
              };

              let borderColor = "border-sky-500 bg-sky-500/10";
              if (box.isDiscrepant) {
                borderColor = "border-rose-600 bg-rose-500/20 animate-pulse";
              } else if (box.isUncertain) {
                borderColor = "border-amber-500 bg-amber-500/20";
              }
              if (isSelected) {
                borderColor = "border-[#243A5E] bg-[#5F86A6]/30 ring-2 ring-[#243A5E]";
              }

              return (
                <div
                  key={box.id}
                  style={style}
                  onClick={() => handleBBoxClick(box)}
                  className={cn(
                    "border-2 rounded cursor-pointer transition-all duration-150 z-20 flex items-start justify-end p-0.5",
                    borderColor
                  )}
                  title={`${box.label}: ${box.rawValue} (OCR Conf: ${(box.confidence * 100).toFixed(1)}%)\nBBox: [${bbox.x1.toFixed(3)}, ${bbox.y1.toFixed(3)}, ${bbox.x2.toFixed(3)}, ${bbox.y2.toFixed(3)}]`}
                >
                  <Badge
                    variant={box.isDiscrepant ? "destructive" : "default"}
                    className="text-[9px] px-1 py-0 font-mono scale-90 origin-top-right shadow-2xs"
                  >
                    {(box.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
              );
            })}
        </div>
      </CardContent>

      {/* Field Evidence List — ALL fields, not just those with bbox */}
      <div className="border-t border-slate-200 bg-slate-50">
        <div className="px-3 pt-2 pb-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Field Evidence
          </span>
        </div>
        <div className="flex flex-col divide-y divide-slate-100 max-h-36 overflow-y-auto">
          {activeBBoxes.map((box) => (
            <button
              key={box.id}
              onClick={() => handleBBoxClick(box)}
              className={cn(
                "text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 transition-colors text-[11px]",
                (selectedField === box.fieldName || inspectedBBox?.id === box.id) && "bg-blue-50"
              )}
            >
              {/* Evidence status indicator */}
              {box.isUncertain ? (
                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
              ) : box.isDiscrepant ? (
                <AlertTriangle className="h-3 w-3 text-rose-500 shrink-0" />
              ) : box.hasRealEvidence ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              ) : (
                <Info className="h-3 w-3 text-slate-400 shrink-0" />
              )}
              <span className="flex-1 font-medium text-slate-700 truncate">{box.label}</span>
              <span className="font-mono text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[140px]">
                {box.rawValue}
              </span>
              {!box.hasRealEvidence && (
                <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300 bg-amber-50 shrink-0">
                  NO BBOX
                </Badge>
              )}
              {box.hasRealEvidence && (
                <span className="text-[9px] text-slate-400 font-mono shrink-0">
                  p{box.page} {(box.confidence * 100).toFixed(0)}%
                </span>
              )}
            </button>
          ))}
          {activeBBoxes.length === 0 && (
            <div className="px-3 py-3 text-[11px] text-slate-400 text-center">
              Tidak ada field yang tersedia untuk dokumen ini.
            </div>
          )}
        </div>
      </div>

      {/* Inspected BBox Info Panel */}
      {currentInspectedBBox && (
        <div className="p-3 bg-white border-t border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge
              variant={currentInspectedBBox.isDiscrepant ? "destructive" : "success"}
              className="text-[10px] font-bold"
            >
              {currentInspectedBBox.isDiscrepant ? "DISCREPANCY" : "MATCHED EVIDENCE"}
            </Badge>
            <span className="font-bold text-slate-800">{currentInspectedBBox.label}:</span>
            <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
              {currentInspectedBBox.rawValue}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
            <span>OCR Confidence: {(currentInspectedBBox.confidence * 100).toFixed(1)}%</span>
            {currentInspectedBBox.bbox ? (
              <>
                <span>•</span>
                <span>
                  BBox: [{currentInspectedBBox.bbox.x1.toFixed(3)}, {currentInspectedBBox.bbox.y1.toFixed(3)},&nbsp;
                  {currentInspectedBBox.bbox.x2.toFixed(3)}, {currentInspectedBBox.bbox.y2.toFixed(3)}]
                </span>
                <span>•</span>
                <span className="text-emerald-600 font-bold">✓ OCR EVIDENCE</span>
              </>
            ) : (
              <>
                <span>•</span>
                <span className="text-amber-600 font-bold">⚠ NO SPATIAL EVIDENCE</span>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
