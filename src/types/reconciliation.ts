/**
 * Canonical Reconciliation Types matching schemas/canonical_schema.json and backend-api Go models.
 */

export type ReconciliationStatus =
  | "MATCH"
  | "EXCEPTION"
  | "MISSING"
  | "DUPLICATE"
  | "INSUFFICIENT_EVIDENCE"
  | "RESOLVED"
  | "APPROVED"
  | "REJECTED"
  | "DISPUTE"
  | "DISPUTED";

export type DiscrepancySeverity = "CRITICAL" | "WARNING" | "INFO";

export type DiscrepancyCategory =
  | "PRICING"
  | "SHIPMENT"
  | "DOCUMENTATION"
  | "TEMPORAL"
  | "DUPLICATE"
  | "CONFIDENCE";

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface EvidenceSource {
  document_id: string;
  page: number;
  bbox?: BoundingBox;
  /** Coordinate space of bbox — 'normalized_01' means values are in [0,1] */
  coordinate_space?: "normalized_01" | "pdf_points" | "pixels";
  /** Original page dimensions for coordinate transformation */
  page_width_pts?: number;
  page_height_pts?: number;
}

/**
 * DocumentSegment — a logical document within a physical uploaded file.
 * One physical PDF can contain multiple segments (Invoice, SJ, POD, etc.)
 */
export interface DocumentSegment {
  id: string;
  document_id: string;
  segment_number: number;
  document_type: "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT" | "UNKNOWN";
  start_page: number;
  end_page: number;
  page_count: number;
  classification_confidence: number;
  classification_method: string;
  extraction_status: "PENDING" | "EXTRACTING" | "EXTRACTED" | "FAILED" | "REQUIRES_HUMAN_REVIEW";
  domain_entity_type?: string;
  domain_entity_id?: string;
  requires_human_review?: boolean;
  created_at: string;
  updated_at: string;
}

/** Response from GET /documents/:id/segments */
export interface SegmentedDocument {
  id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  sha256_hash: string;
  status: string;
  page_count: number;
  segments: DocumentSegment[];
  created_at: string;
  updated_at: string;
}


export interface DiscrepancyItem {
  code: string;
  category: DiscrepancyCategory;
  description: string;
  severity: DiscrepancySeverity;
  billed_value?: unknown;
  expected_value?: unknown;
  delta_amount?: number;
  evidence_pointer?: EvidenceSource;
  remediation_hint?: string;
}

export interface CalculationTrace {
  base_rate_unit: number;
  weight_used_kg: number;
  weight_tier: string;
  base_amount: number;
  fuel_percent: number;
  fuel_amount: number;
  accessorial_amount: number;
  minimum_charge: number;
  pre_tax_amount: number;
  tax_rate_percent: number;
  tax_amount: number;
  expected_total: number;
  billed_total: number;
  variance_amount: number;
  trace_log: string;
}

export interface PricingResult {
  expected_base_charge: number;
  expected_fuel_surcharge: number;
  expected_accessorial_charges: number;
  expected_tax: number;
  expected_total_charge: number;
  difference_amount: number;
  relative_difference_ratio: number;
  is_material: boolean;
  trace: CalculationTrace;
}

export interface ReconciliationCheck {
  check_code: string;
  status: "PASS" | "FAIL" | "UNCERTAIN";
  expected: unknown;
  actual: unknown;
  difference?: unknown;
  confidence: number;
  evidence?: EvidenceSource;
  description?: string;
}

export interface AuditTrailItem {
  timestamp: string;
  action: string;
  actor_id: string;
  actor_role: string;
  previous_status?: string;
  new_status: string;
  notes?: string;
}

export interface InvoiceCanonical {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  vendor_id: string;
  vendor_name?: string;
  service_type?: string;
  origin?: string;
  destination?: string;
  /** PRIMARY entity resolution key — use this first for matching */
  shipment_id?: string;
  /** Secondary entity resolution key */
  awb_number?: string;
  weight_billed_kg: number;
  base_charge_billed?: number;
  fuel_surcharge_billed?: number;
  tax_billed?: number;
  billed_amount: number;
  currency: string;
  /** Provenance: which document segment produced this record */
  document_id?: string;
  segment_id?: string;
  field_evidence?: Record<string, EvidenceSource>;
}

export interface ShipmentCanonical {
  surat_jalan_number: string;
  shipment_id: string;
  awb_number?: string;
  shipment_date: string;
  origin: string;
  destination: string;
  weight_actual_kg: number;
  total_packages: number;
  item_description?: string;
  document_id?: string;
  segment_id?: string;
  field_evidence?: Record<string, EvidenceSource>;
}

export interface PODCanonical {
  pod_number: string;
  delivery_status: string;
  delivery_date?: string;
  receiver_name?: string;
  quantity_received?: number;
  signature_present: boolean;
  signature_confidence: number;
  stamp_present: boolean;
  condition?: string;
  document_id?: string;
  segment_id?: string;
  field_evidence?: Record<string, EvidenceSource>;
}

export interface ContractCanonical {
  agreement_id: string;
  vendor_id: string;
  effective_from: string;
  effective_to: string;
  rate_unit: string;
  base_rate: number;
  applicable_fuel_surcharge_percent: number;
  minimum_charge?: number;
  dispute_window_days: number;
  document_id?: string;
  segment_id?: string;
  field_evidence?: Record<string, EvidenceSource>;
}


export interface ReconciliationDecision {
  status: ReconciliationStatus;
  reason_codes: string[];
  discrepancies: DiscrepancyItem[];
  requires_human_review: boolean;
  priority_score: number;
  dispute_deadline: string;
  days_remaining_to_dispute: number;
}

export interface ShipmentEvent {
  event_id: string;
  shipment_id: string;
  vendor_id: string;
  match_method: string;
  match_confidence: number;
  invoice: InvoiceCanonical;
  shipment: ShipmentCanonical;
  pod: PODCanonical;
  contract: ContractCanonical;
  pricing: PricingResult;
  reconciliation: ReconciliationDecision;
  checks: ReconciliationCheck[];
  audit_trail: AuditTrailItem[];
}

export interface QueueItem {
  event_id: string;
  transaction_id: string;
  invoice_number: string;
  vendor_id: string;
  vendor_name: string;
  shipment_id: string;
  awb_number: string;
  status: ReconciliationStatus;
  primary_discrepancy?: string;
  top_discrepancy?: string;
  discrepancy_count: number;
  billed_amount: number;
  expected_amount: number;
  variance_amount: number;
  priority_score: number;
  priority_level: "HIGH" | "MEDIUM" | "LOW";
  dispute_deadline: string;
  days_remaining_to_dispute: number;
  is_urgent: boolean;
}

export interface QueueSummary {
  total_invoiced_amount: number;
  total_variance_amount: number;
  total_invoices_count: number;
  open_exceptions_count: number;
  urgent_disputes_count: number;
  matches_count: number;
}

export interface DisputePackage {
  package_id: string;
  generated_at: string;
  invoice_number: string;
  vendor_id: string;
  vendor_name: string;
  shipment_id: string;
  awb_number: string;
  billed_amount: number;
  expected_amount: number;
  dispute_amount: number;
  discrepancies: DiscrepancyItem[];
  contract_clause: string;
  calculation_trace: CalculationTrace;
  reviewer_action: string;
  reviewer_role: string;
  reviewer_reason: string;
  formatted_memo: string;
}

export interface QueueResponse {
  summary: QueueSummary;
  items: QueueItem[];
  total: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
}

