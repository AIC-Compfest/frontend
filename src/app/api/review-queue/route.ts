import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = (
  process.env.SUPABASE_URL || "https://vqquelixcnzrylvvnzng.supabase.co"
).replace(/\/+$/, "");

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Server configuration error: SUPABASE_SERVICE_ROLE_KEY missing" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ANOMALI";
    const severity = searchParams.get("severity") || "ALL";
    const vendor = searchParams.get("vendor") || "ALL";
    const search = searchParams.get("search") || "";

    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    };

    // Parallel fetch for summary and items
    const [summaryRes, itemsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/rpc/get_review_queue_summary`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
        cache: "no-store",
      }),
      fetch(`${SUPABASE_URL}/rest/v1/rpc/get_review_queue_items`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          p_status: status,
          p_severity: severity,
          p_vendor: vendor,
          p_search: search,
        }),
        cache: "no-store",
      }),
    ]);

    if (!summaryRes.ok) {
      const errText = await summaryRes.text();
      throw new Error(`Failed to fetch summary: ${summaryRes.status} ${errText}`);
    }

    if (!itemsRes.ok) {
      const errText = await itemsRes.text();
      throw new Error(`Failed to fetch queue items: ${itemsRes.status} ${errText}`);
    }

    const summary = await summaryRes.json();
    const rawItems = await itemsRes.json();

    // Transform into frontend QueueItem structure
    const items = (rawItems || []).map((row: any) => ({
      event_id: row.event_id,
      transaction_id: row.event_id,
      // TODO: Nomor invoice belum punya kolom khusus di tabel shipment_events.
      // Untuk sekarang diambil dari calculation_trace JSON via RPC view. Sumber sebenarnya nanti
      // dari ai_field_decisions (field invoice_number) lewat shipment_documents -> document_segments.
      invoice_number: row.invoice_number,
      shipment_id: row.shipment_number,
      vendor_id: row.vendor_id,
      vendor_name: row.vendor_name,
      status: row.display_status,
      shipment_event_status: row.shipment_event_status,
      case_id: row.case_id,
      case_number: row.case_number,
      case_status: row.case_status,
      priority_score: Number(row.priority_score) || 0,
      priority_level:
        row.highest_severity === "CRITICAL" || row.highest_severity === "HIGH"
          ? "HIGH"
          : row.highest_severity === "MEDIUM"
          ? "MEDIUM"
          : "LOW",
      highest_severity: row.highest_severity || "LOW",
      billed_amount: Number(row.billed_amount) || 0,
      expected_amount: row.expected_amount !== null ? Number(row.expected_amount) : 0,
      variance_amount: row.variance_amount !== null ? Number(row.variance_amount) : 0,
      discrepancy_count: Number(row.discrepancies_count) || 0,
      primary_discrepancy: row.primary_discrepancy || "",
      primary_discrepancy_code: row.primary_discrepancy_code || "",
      discrepancies: Array.isArray(row.discrepancies) ? row.discrepancies : [],
      days_remaining_to_dispute:
        row.days_remaining_to_dispute !== null
          ? Number(row.days_remaining_to_dispute)
          : 30,
      is_urgent: (Number(row.days_remaining_to_dispute) || 30) <= 7,
      origin: row.origin || "",
      destination: row.destination || "",
      shipment_date: row.shipment_date || "",
      agreement_number: row.agreement_number || "",
      calculation_trace: row.calculation_trace || {},
      created_at: row.created_at,
    }));

    return NextResponse.json({
      summary: {
        total_invoiced_amount: Number(summary.total_invoiced_amount) || 0,
        total_variance_amount: Number(summary.total_variance_amount) || 0,
        total_invoices_count: Number(summary.total_invoices_count) || 0,
        open_exceptions_count: Number(summary.open_exceptions_count) || 0,
        urgent_disputes_count: Number(summary.urgent_disputes_count) || 0,
        matches_count: Number(summary.matches_count) || 0,
      },
      items,
      total: items.length,
    });
  } catch (error: any) {
    console.error("Error in /api/review-queue:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
