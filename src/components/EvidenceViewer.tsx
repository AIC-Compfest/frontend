"use client";

import React, { useState } from "react";
import { ShipmentEvent, BoundingBox } from "@/types/reconciliation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Layers,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  bbox: BoundingBox;
  isDiscrepant: boolean;
  isUncertain: boolean;
}

export function EvidenceViewer({
  event,
  selectedField,
  activeDocumentTab,
  onTabChange,
  onSelectField,
}: EvidenceViewerProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [inspectedBBox, setInspectedBBox] = useState<BBoxItem | null>(null);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Compile active bounding boxes based on current tab
  const activeBBoxes: BBoxItem[] = React.useMemo(() => {
    const list: BBoxItem[] = [];

    if (activeDocumentTab === "INVOICE") {
      const isOvercharge = event.reconciliation.discrepancies.some((d) => d.code === "RATE_OVERCHARGE");
      const isWrongZone = event.reconciliation.discrepancies.some((d) => d.code === "WRONG_ZONE");

      list.push({
        id: "inv_total",
        fieldName: "billed_amount",
        label: "Grand Total Tagihan",
        rawValue: formatIDR(event.invoice.billed_amount),
        normalizedValue: `${event.invoice.billed_amount}`,
        confidence: 0.99,
        bbox: event.invoice.field_evidence?.billed_amount?.bbox || { x1: 0.65, y1: 0.85, x2: 0.95, y2: 0.92 },
        isDiscrepant: isOvercharge,
        isUncertain: false,
      });

      list.push({
        id: "inv_dest",
        fieldName: "destination",
        label: "Kota Tujuan Tagih",
        rawValue: event.invoice.destination || "JAKARTA",
        normalizedValue: event.invoice.destination || "JAKARTA",
        confidence: 0.98,
        bbox: event.invoice.field_evidence?.destination?.bbox || { x1: 0.35, y1: 0.32, x2: 0.65, y2: 0.38 },
        isDiscrepant: isWrongZone,
        isUncertain: false,
      });

      list.push({
        id: "inv_weight",
        fieldName: "weight_billed_kg",
        label: "Berat Tagih (Billed Weight)",
        rawValue: `${event.invoice.weight_billed_kg} kg`,
        normalizedValue: `${event.invoice.weight_billed_kg}`,
        confidence: 0.97,
        bbox: { x1: 0.35, y1: 0.40, x2: 0.55, y2: 0.45 },
        isDiscrepant: false,
        isUncertain: false,
      });
    } else if (activeDocumentTab === "SURAT_JALAN") {
      list.push({
        id: "sj_id",
        fieldName: "shipment_id",
        label: "Nomor Surat Jalan / Ref",
        rawValue: event.shipment.shipment_id,
        normalizedValue: event.shipment.shipment_id,
        confidence: 0.96,
        bbox: event.shipment.field_evidence?.shipment_id?.bbox || { x1: 0.20, y1: 0.15, x2: 0.55, y2: 0.21 },
        isDiscrepant: false,
        isUncertain: false,
      });

      list.push({
        id: "sj_weight",
        fieldName: "weight_actual_kg",
        label: "Berat Timbangan Fisik Gudang",
        rawValue: `${event.shipment.weight_actual_kg} kg`,
        normalizedValue: `${event.shipment.weight_actual_kg}`,
        confidence: 0.95,
        bbox: event.shipment.field_evidence?.weight_actual_kg?.bbox || { x1: 0.55, y1: 0.40, x2: 0.85, y2: 0.46 },
        isDiscrepant: event.reconciliation.discrepancies.some((d) => d.code === "WEIGHT_DISCREPANCY"),
        isUncertain: false,
      });

      list.push({
        id: "sj_dest",
        fieldName: "destination",
        label: "Destinasi Fisik Surat Jalan",
        rawValue: event.shipment.destination,
        normalizedValue: event.shipment.destination,
        confidence: 0.98,
        bbox: event.shipment.field_evidence?.destination?.bbox || { x1: 0.35, y1: 0.32, x2: 0.65, y2: 0.38 },
        isDiscrepant: event.reconciliation.discrepancies.some((d) => d.code === "WRONG_ZONE"),
        isUncertain: false,
      });
    } else if (activeDocumentTab === "POD") {
      const isMissingSig = event.reconciliation.discrepancies.some((d) => d.code === "MISSING_SIGNATURE");
      const isDateMismatch = event.reconciliation.discrepancies.some((d) => d.code === "DATE_MISMATCH");
      const isQtyMismatch = event.reconciliation.discrepancies.some((d) => d.code === "QUANTITY_MISMATCH");

      if (event.pod.quantity_received !== undefined && event.pod.quantity_received !== null) {
        list.push({
          id: "pod_qty",
          fieldName: "quantity_received",
          label: "Jumlah Koli Diterima (Received Qty)",
          rawValue: `${event.pod.quantity_received} Koli`,
          normalizedValue: `${event.pod.quantity_received}`,
          confidence: 0.94,
          bbox: event.pod.field_evidence?.quantity_received?.bbox || { x1: 0.20, y1: 0.45, x2: 0.50, y2: 0.52 },
          isDiscrepant: isQtyMismatch,
          isUncertain: false,
        });
      } else {
        list.push({
          id: "pod_qty_missing",
          fieldName: "quantity_received",
          label: "Jumlah Koli Fisik (Not Stated on POD)",
          rawValue: "TIDAK TERCANTUM PADA BUKTI POD",
          normalizedValue: "null",
          confidence: 0.0,
          bbox: { x1: 0.20, y1: 0.45, x2: 0.65, y2: 0.52 },
          isDiscrepant: false,
          isUncertain: true,
        });
      }

      const sigConfidence = event.pod.signature_confidence || 0.95;
      const isSigUncertain = event.pod.signature_present && sigConfidence < 0.70;

      list.push({
        id: "pod_sig",
        fieldName: "signature_present",
        label: "Tanda Tangan Fisik Penerima (Signature Presence)",
        rawValue: event.pod.signature_present
          ? (isSigUncertain ? "TANDA TANGAN MERAGUKAN (Review Diperlukan)" : "HADIR / TERDETEKSI (Signature Present)")
          : "TIDAK DITEMUKAN (Signature Missing)",
        normalizedValue: `${event.pod.signature_present}`,
        confidence: sigConfidence,
        bbox: event.pod.field_evidence?.signature_present?.bbox || { x1: 0.55, y1: 0.68, x2: 0.92, y2: 0.88 },
        isDiscrepant: isMissingSig,
        isUncertain: isSigUncertain,
      });

      if (event.pod.stamp_present) {
        list.push({
          id: "pod_stamp",
          fieldName: "stamp_present",
          label: "Stempel Resmi Perusahaan (Company Stamp)",
          rawValue: "TERDETEKSI (Stamp Present)",
          normalizedValue: "true",
          confidence: 0.94,
          bbox: event.pod.field_evidence?.stamp_present?.bbox || { x1: 0.68, y1: 0.68, x2: 0.92, y2: 0.86 },
          isDiscrepant: false,
          isUncertain: false,
        });
      }

      list.push({
        id: "pod_date",
        fieldName: "delivery_date",
        label: "Tanggal Serah Terima POD",
        rawValue: event.pod.delivery_date || "2026-08-10",
        normalizedValue: event.pod.delivery_date || "2026-08-10",
        confidence: 0.92,
        bbox: event.pod.field_evidence?.delivery_date?.bbox || { x1: 0.20, y1: 0.25, x2: 0.55, y2: 0.31 },
        isDiscrepant: isDateMismatch,
        isUncertain: false,
      });
    } else if (activeDocumentTab === "RATE_AGREEMENT") {
      const isOvercharge = event.reconciliation.discrepancies.some((d) => d.code === "RATE_OVERCHARGE");
      list.push({
        id: "ctr_base_rate",
        fieldName: "base_rate",
        label: "Tarif Terkontrak (Rate Card)",
        rawValue: formatIDR(event.contract.base_rate),
        normalizedValue: `${event.contract.base_rate}`,
        confidence: 0.99,
        bbox: event.contract.field_evidence?.base_rate?.bbox || { x1: 0.55, y1: 0.40, x2: 0.88, y2: 0.46 },
        isDiscrepant: isOvercharge,
        isUncertain: false,
      });

      list.push({
        id: "ctr_fuel",
        fieldName: "fuel_surcharge_percent",
        label: "Fuel Surcharge Agreement",
        rawValue: `${event.contract.applicable_fuel_surcharge_percent}%`,
        normalizedValue: `${event.contract.applicable_fuel_surcharge_percent}`,
        confidence: 0.99,
        bbox: { x1: 0.55, y1: 0.58, x2: 0.85, y2: 0.64 },
        isDiscrepant: false,
        isUncertain: false,
      });
    }

    return list;
  }, [activeDocumentTab, event]);

  const currentInspectedBBox = (selectedField ? activeBBoxes.find((b) => b.fieldName === selectedField) : null) ?? inspectedBBox;

  const handleBBoxClick = (box: BBoxItem) => {
    setInspectedBBox(box);
    onSelectField(box.fieldName);
  };

  return (
    <Card className="flex flex-col h-full bg-white border border-slate-200 shadow-2xs overflow-hidden p-0">
      {/* Document Tab Bar */}
      <CardHeader className="p-2.5 border-b border-slate-100 bg-[#EDF4FA]/70 flex flex-row items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Button
            size="sm"
            variant={activeDocumentTab === "INVOICE" ? "default" : "ghost"}
            onClick={() => onTabChange("INVOICE")}
            className="text-xs h-7 px-2.5 font-bold"
          >
            Invoice (Faktur)
          </Button>
          <Button
            size="sm"
            variant={activeDocumentTab === "SURAT_JALAN" ? "default" : "ghost"}
            onClick={() => onTabChange("SURAT_JALAN")}
            className="text-xs h-7 px-2.5 font-bold"
          >
            Surat Jalan
          </Button>
          <Button
            size="sm"
            variant={activeDocumentTab === "POD" ? "default" : "ghost"}
            onClick={() => onTabChange("POD")}
            className="text-xs h-7 px-2.5 font-bold"
          >
            POD (Bukti Kirim)
          </Button>
          <Button
            size="sm"
            variant={activeDocumentTab === "RATE_AGREEMENT" ? "default" : "ghost"}
            onClick={() => onTabChange("RATE_AGREEMENT")}
            className="text-xs h-7 px-2.5 font-bold"
          >
            Rate Card (PKS)
          </Button>
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

      {/* Document View Canvas Area */}
      <CardContent className="flex-1 p-4 bg-slate-100/70 overflow-auto flex items-start justify-center relative min-h-[480px]">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
          className="w-[520px] bg-white rounded-xl shadow-md border border-slate-300 p-6 relative select-none transition-all"
        >
          {/* Simulated Physical Document Header */}
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
              <div className="text-right">
                <Badge variant="outline" className="text-[10px] font-mono font-bold bg-slate-50">
                  PAGE 1 OF 1
                </Badge>
              </div>
            </div>
          </div>

          {/* Document Content Simulation */}
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

            {/* Document Specific Simulation Table */}
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
                      <td className="p-2">Jasa Ekspedisi Reguler ({event.shipment.origin} → {event.invoice.destination})</td>
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
                  <span className="font-mono font-semibold">{event.shipment.awb_number || "AWB-2026-001"}</span>
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
                      <td className="p-2 font-medium">{event.shipment.origin} → {event.shipment.destination}</td>
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

          {/* Interactive Bounding Boxes Overlay */}
          {activeBBoxes.map((box) => {
            const isSelected = (selectedField === box.fieldName) || (inspectedBBox?.id === box.id);
            const style: React.CSSProperties = {
              position: "absolute",
              left: `${box.bbox.x1 * 100}%`,
              top: `${box.bbox.y1 * 100}%`,
              width: `${(box.bbox.x2 - box.bbox.x1) * 100}%`,
              height: `${(box.bbox.y2 - box.bbox.y1) * 100}%`,
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
                  "border-2 rounded cursor-pointer transition-all duration-150 group z-20 flex items-start justify-end p-0.5",
                  borderColor
                )}
                title={`${box.label}: ${box.rawValue} (Conf: ${(box.confidence * 100).toFixed(1)}%)`}
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

      {/* Inspected Bounding Box Info Panel */}
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
            <span>•</span>
            <span>BBox: [{(currentInspectedBBox.bbox.x1).toFixed(2)}, {(currentInspectedBBox.bbox.y1).toFixed(2)}]</span>
          </div>
        </div>
      )}
    </Card>
  );
}
