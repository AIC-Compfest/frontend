import { ShipmentEvent, QueueItem } from "@/types/reconciliation";

export function queueItemToShipmentEvent(item: QueueItem): ShipmentEvent {
  const hasMissingPOD = item.discrepancies?.some((d) => d.code === "MISSING_POD");
  const isDuplicate =
    item.status === "DUPLICATE" ||
    item.discrepancies?.some((d) => d.code === "DUPLICATE_INVOICE");
  const weightDiscrepancy = item.discrepancies?.find((d) => d.code === "OVERCHARGE_WEIGHT");
  const rateDiscrepancy = item.discrepancies?.find((d) => d.code === "RATE_MISMATCH");
  const fuelDiscrepancy = item.discrepancies?.find((d) => d.code === "FUEL_SURCHARGE_MISMATCH");

  return {
    event_id: item.event_id,
    shipment_id: item.shipment_id,
    vendor_id: item.vendor_name || item.vendor_id,
    match_method: isDuplicate ? "DUPLICATE_DETECTION" : "3PL_RECONCILIATION",
    match_confidence: isDuplicate ? 0.99 : 0.85,
    invoice: {
      invoice_id: item.event_id,
      invoice_number: item.invoice_number,
      invoice_date: item.created_at
        ? new Date(item.created_at).toLocaleDateString("id-ID")
        : "2026-10-20",
      vendor_id: item.vendor_id,
      vendor_name: item.vendor_name,
      origin: item.origin || "Jakarta",
      destination: item.destination || "Surabaya",
      shipment_id: item.shipment_id,
      billed_amount: item.billed_amount,
      weight_billed_kg: weightDiscrepancy
        ? (weightDiscrepancy.observed_value as any)?.kg || 2240
        : 1500,
      currency: "IDR",
    },
    shipment: {
      shipment_id: item.shipment_id,
      surat_jalan_number: "SJ-" + item.shipment_id,
      origin: item.origin || "Jakarta",
      destination: item.destination || "Surabaya",
      shipment_date: item.shipment_date || "2026-10-15",
      weight_actual_kg: weightDiscrepancy
        ? (weightDiscrepancy.expected_value as any)?.kg || 1820
        : 1500,
      total_packages: 12,
    },
    pod: {
      pod_number: "POD-" + item.shipment_id,
      delivery_status: hasMissingPOD ? "MISSING" : "DELIVERED",
      delivery_date: hasMissingPOD ? "" : "2026-10-18",
      receiver_name: hasMissingPOD ? "Belum Diterima / Berkas Hilang" : "Logistik Gudang Masuk",
      quantity_received: hasMissingPOD ? 0 : 12,
      signature_present: !hasMissingPOD,
      signature_confidence: hasMissingPOD ? 0 : 0.95,
      stamp_present: !hasMissingPOD,
      condition: hasMissingPOD ? "BUKTI_TIDAK_DITEMUKAN" : "GOOD",
    },
    contract: {
      agreement_id: item.agreement_number || "PKS-DUMMY-001",
      vendor_id: item.vendor_id,
      effective_from: "2026-01-01",
      effective_to: "2026-12-31",
      rate_unit: "PER_KG",
      base_rate: rateDiscrepancy
        ? (rateDiscrepancy.expected_value as any)?.rate || 14500
        : 10000,
      applicable_fuel_surcharge_percent: fuelDiscrepancy
        ? (fuelDiscrepancy.expected_value as any)?.percent || 8
        : 8,
      dispute_window_days: item.days_remaining_to_dispute || 30,
    },
    pricing: {
      expected_base_charge: item.expected_amount,
      expected_fuel_surcharge: 0,
      expected_accessorial_charges: 0,
      expected_tax: 0,
      expected_total_charge: item.expected_amount,
      difference_amount: item.variance_amount,
      relative_difference_ratio:
        item.expected_amount > 0 ? item.variance_amount / item.expected_amount : 1,
      is_material: item.variance_amount > 500000,
      trace: {
        base_rate_unit: rateDiscrepancy
          ? (rateDiscrepancy.expected_value as any)?.rate || 14500
          : 10000,
        weight_used_kg: weightDiscrepancy
          ? (weightDiscrepancy.expected_value as any)?.kg || 1820
          : 1500,
        weight_tier: "REGULAR",
        base_amount: item.expected_amount,
        fuel_percent: fuelDiscrepancy
          ? (fuelDiscrepancy.expected_value as any)?.percent || 8
          : 8,
        fuel_amount: 0,
        accessorial_amount: 0,
        minimum_charge: 0,
        pre_tax_amount: item.expected_amount,
        tax_rate_percent: 11,
        tax_amount: 0,
        expected_total: item.expected_amount,
        billed_total: item.billed_amount,
        variance_amount: item.variance_amount,
        trace_log: `Perhitungan PKS untuk ${item.invoice_number}: Expected = Rp ${item.expected_amount.toLocaleString(
          "id-ID"
        )}, Billed = Rp ${item.billed_amount.toLocaleString("id-ID")}, Selisih = +Rp ${item.variance_amount.toLocaleString(
          "id-ID"
        )}`,
      },
    },
    reconciliation: {
      status: item.status,
      reason_codes: item.discrepancies?.map((d) => d.code) || [],
      discrepancies: (item.discrepancies || []).map((d) => ({
        code: d.code,
        category: "PRICING",
        description: d.description,
        severity:
          d.severity === "CRITICAL"
            ? "CRITICAL"
            : d.severity === "HIGH"
            ? "WARNING"
            : "INFO",
        billed_value: d.observed_value,
        expected_value: d.expected_value,
        delta_amount: d.variance_amount,
      })),
      requires_human_review: true,
      priority_score: item.priority_score,
      dispute_deadline: item.days_remaining_to_dispute
        ? `${item.days_remaining_to_dispute} hari tersisa`
        : "30 hari",
      days_remaining_to_dispute: item.days_remaining_to_dispute || 30,
    },
    checks: [],
    audit_trail: [
      {
        timestamp: item.created_at || new Date().toISOString(),
        action: "RECONCILIATION_RUN",
        actor_id: "SYSTEM_PIPELINE",
        actor_role: "SYSTEM",
        new_status: item.status,
        notes: `Transaksi ${item.invoice_number} terdeteksi memiliki status ${item.status} dengan skor prioritas ${item.priority_score}.`,
      },
    ],
  };
}
