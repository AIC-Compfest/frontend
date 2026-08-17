"use client";

import React, { useState } from "react";
import { ShipmentEvent, BoundingBox } from "@/types/reconciliation";

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
        label: "Berat Timbangan Fisik",
        rawValue: `${event.shipment.weight_actual_kg} kg`,
        normalizedValue: `${event.shipment.weight_actual_kg}`,
        confidence: 0.98,
        bbox: event.shipment.field_evidence?.weight_actual?.bbox || { x1: 0.60, y1: 0.45, x2: 0.88, y2: 0.51 },
        isDiscrepant: false,
        isUncertain: false,
      });

      const isQtyMismatch = event.reconciliation.discrepancies.some((d) => d.code === "QUANTITY_MISMATCH");
      list.push({
        id: "sj_qty",
        fieldName: "total_packages",
        label: "Jumlah Koli Muat (Dispatch)",
        rawValue: `${event.shipment.total_packages} koli`,
        normalizedValue: `${event.shipment.total_packages}`,
        confidence: 0.95,
        bbox: { x1: 0.20, y1: 0.45, x2: 0.45, y2: 0.51 },
        isDiscrepant: isQtyMismatch,
        isUncertain: false,
      });
    } else if (activeDocumentTab === "POD") {
      const isQtyMismatch = event.reconciliation.discrepancies.some((d) => d.code === "QUANTITY_MISMATCH");
      const isMissingSig = event.reconciliation.discrepancies.some((d) => d.code === "SIGNATURE_MISSING");
      const isDateMismatch = event.reconciliation.discrepancies.some((d) => d.code === "POD_DATE_MISMATCH");

      if (event.pod.quantity_received !== undefined && event.pod.quantity_received !== null) {
        list.push({
          id: "pod_qty",
          fieldName: "quantity_received",
          label: "Jumlah Koli Diterima Fisik",
          rawValue: `${event.pod.quantity_received} koli`,
          normalizedValue: `${event.pod.quantity_received}`,
          confidence: 0.96,
          bbox: event.pod.field_evidence?.quantity_received?.bbox || { x1: 0.20, y1: 0.48, x2: 0.50, y2: 0.54 },
          isDiscrepant: isQtyMismatch,
          isUncertain: false,
        });
      } else {
        list.push({
          id: "pod_qty_none",
          fieldName: "quantity_received",
          label: "Jumlah Koli Diterima",
          rawValue: "None / Not Specified",
          normalizedValue: "null",
          confidence: 0.50,
          bbox: { x1: 0.20, y1: 0.48, x2: 0.50, y2: 0.54 },
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
    <div className="flex flex-col h-full bg-white rounded-lg border border-[#CFE3F1] shadow-xs overflow-hidden">
      {/* Document Tab Bar */}
      <div className="flex items-center justify-between border-b border-[#CFE3F1] bg-[#EDF4FA] px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTabChange("INVOICE")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-subtle ${
              activeDocumentTab === "INVOICE"
                ? "bg-white text-[#243A5E] shadow-xs border border-[#CFE3F1]"
                : "text-[#5F86A6] hover:text-[#243A5E]"
            }`}
          >
            Invoice (Faktur)
          </button>
          <button
            onClick={() => onTabChange("SURAT_JALAN")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-subtle ${
              activeDocumentTab === "SURAT_JALAN"
                ? "bg-white text-[#243A5E] shadow-xs border border-[#CFE3F1]"
                : "text-[#5F86A6] hover:text-[#243A5E]"
            }`}
          >
            Surat Jalan (SJ)
          </button>
          <button
            onClick={() => onTabChange("POD")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-subtle ${
              activeDocumentTab === "POD"
                ? "bg-white text-[#243A5E] shadow-xs border border-[#CFE3F1]"
                : "text-[#5F86A6] hover:text-[#243A5E]"
            }`}
          >
            POD (Tanda Terima)
          </button>
          <button
            onClick={() => onTabChange("RATE_AGREEMENT")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-subtle ${
              activeDocumentTab === "RATE_AGREEMENT"
                ? "bg-white text-[#243A5E] shadow-xs border border-[#CFE3F1]"
                : "text-[#5F86A6] hover:text-[#243A5E]"
            }`}
          >
            Rate Agreement (PKS)
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-[#CFE3F1] shadow-2xs">
          <button
            onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
            className="p-1 text-[#5F86A6] hover:text-[#243A5E] text-xs font-bold"
            title="Zoom Out"
          >
            −
          </button>
          <span className="font-mono text-[11px] text-[#243A5E] font-medium w-9 text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
            className="p-1 text-[#5F86A6] hover:text-[#243A5E] text-xs font-bold"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="ml-1 pl-1 border-l border-slate-200 text-[10px] text-[#5F86A6] hover:text-[#243A5E]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Document View Canvas Area */}
      <div className="flex-1 p-4 bg-slate-100/70 overflow-auto flex items-start justify-center relative min-h-[480px]">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
          className="w-[520px] bg-white rounded shadow-md border border-slate-300 p-6 relative select-none transition-subtle"
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
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  PAGE 1 OF 1
                </span>
              </div>
            </div>
          </div>

          {/* Document Content Simulation */}
          <div className="space-y-4 text-xs text-slate-700 font-sans leading-relaxed">
            {/* Meta Key-Values */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded border border-slate-200">
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
              <div className="border border-slate-200 rounded overflow-hidden">
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
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-2">
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
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-3">
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
                  <div className="border-2 border-dashed border-slate-300 rounded p-2 text-center w-28 h-14 flex items-center justify-center bg-white">
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
              <div className="border border-slate-200 rounded overflow-hidden">
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

          {/* SPATIAL BOUNDING BOX OVERLAYS */}
          <div className="absolute inset-0 pointer-events-none">
            {activeBBoxes.map((box) => {
              const isSelected = inspectedBBox?.id === box.id;
              const left = `${box.bbox.x1 * 100}%`;
              const top = `${box.bbox.y1 * 100}%`;
              const width = `${(box.bbox.x2 - box.bbox.x1) * 100}%`;
              const height = `${(box.bbox.y2 - box.bbox.y1) * 100}%`;

              let boxColorClasses = "border-emerald-500 bg-emerald-500/10 text-emerald-800";
              if (box.isDiscrepant) {
                boxColorClasses = "border-rose-600 bg-rose-600/15 text-rose-800 ring-2 ring-rose-500/30 animate-pulse";
              } else if (box.isUncertain) {
                boxColorClasses = "border-amber-500 border-dashed bg-amber-500/10 text-amber-800";
              }
              if (isSelected) {
                boxColorClasses = "border-[#243A5E] bg-[#8FB8D6]/30 text-[#243A5E] ring-2 ring-[#243A5E]";
              }

              return (
                <div
                  key={box.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBBoxClick(box);
                  }}
                  style={{ left, top, width, height }}
                  className={`absolute pointer-events-auto cursor-pointer border-2 rounded transition-subtle group ${boxColorClasses}`}
                >
                  <span
                    className={`absolute -top-5 left-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap ${
                      box.isDiscrepant
                        ? "bg-rose-600 text-white"
                        : isSelected
                        ? "bg-[#243A5E] text-white"
                        : "bg-white text-slate-800 border border-slate-300"
                    }`}
                  >
                    {box.label} ({(box.confidence * 100).toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bounding Box Evidence Inspector Popover */}
      {currentInspectedBBox && (
        <div className="border-t border-[#CFE3F1] bg-white p-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                currentInspectedBBox.isDiscrepant
                  ? "bg-rose-600 animate-ping"
                  : currentInspectedBBox.isUncertain
                  ? "bg-amber-500"
                  : "bg-emerald-600"
              }`}
            />
            <div>
              <div className="text-xs font-bold text-[#243A5E] flex items-center gap-2">
                <span>{currentInspectedBBox.label}</span>
                <span className="font-mono text-[10px] text-[#5F86A6]">[{currentInspectedBBox.fieldName}]</span>
                {currentInspectedBBox.isDiscrepant && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded border border-rose-200">
                    DISCREPANCY DETECTED
                  </span>
                )}
                {currentInspectedBBox.isUncertain && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded border border-amber-200">
                    UNCERTAIN EVIDENCE
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-3">
                <span>
                  Extracted: <strong className="text-slate-900 font-mono">{currentInspectedBBox.rawValue}</strong>
                </span>
                <span>•</span>
                <span>
                  Confidence:{" "}
                  <strong className="font-mono font-semibold text-slate-900">
                    {(currentInspectedBBox.confidence * 100).toFixed(1)}%
                  </strong>
                </span>
                <span>•</span>
                <span>Page 1</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setInspectedBBox(null)}
            className="text-xs text-[#5F86A6] hover:text-[#243A5E] font-medium"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
