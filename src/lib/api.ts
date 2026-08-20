/**
 * Centralized API Client Layer for Evidence-First AI 3PL Reconciliation Engine.
 * Single source of truth communicating with Go Backend & Supabase Database.
 */

import { getStoredToken } from "./auth";
import { QueueResponse, QueueItem, QueueSummary, DisputePackage } from "@/types/reconciliation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface HealthResponse {
  status: string;
  service?: string;
  version?: string;
  timestamp?: string;
}

export interface ContractItem {
  id: string;
  agreement_id: string;
  vendor_id: string;
  vendor_name: string;
  effective_from: string;
  effective_to: string;
  effective_range: string;
  fuel_surcharge_cap: string;
  dispute_window: string;
  minimum_charge: number;
  status: string;
}

export interface PolicySettings {
  id: string;
  materiality_threshold_idr: number;
  materiality_percentage: number;
  weight_tolerance_kg: number;
  dispute_alert_window_days: number;
  auto_approve_clean_match: boolean;
  enable_strict_zone_matching: boolean;
  updated_at?: string;
  updated_by?: string;
}

export interface AuditLogItem {
  id: string;
  event_id?: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  reason?: string;
  request_id?: string;
  created_at: string;
}

/**
 * Generic authenticated API request wrapper
 */
export async function fetchAPI<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = `HTTP Error ${response.status}`;
    try {
      const errBody = await response.json();
      if (errBody.error) errMsg = errBody.error;
    } catch {
      // ignore json parse error
    }
    throw new Error(errMsg);
  }

  return response.json();
}

/**
 * 1. Healthcheck
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/healthz`, {
      method: "GET",
      cache: "no-store",
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err: unknown) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "Failed to connect to backend",
    };
  }
}

/**
 * 2. Rate Agreements / Contracts (PKS)
 */
export async function getContracts(): Promise<{ data: ContractItem[]; total: number }> {
  return fetchAPI<{ data: ContractItem[]; total: number }>("/api/v1/contracts");
}

/**
 * 3. Policy & Tolerance Settings
 */
export async function getSettings(): Promise<PolicySettings> {
  return fetchAPI<PolicySettings>("/api/v1/settings");
}

export async function updateSettings(
  settings: Partial<PolicySettings>
): Promise<{ message: string; data: PolicySettings }> {
  return fetchAPI<{ message: string; data: PolicySettings }>("/api/v1/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

/**
 * 4. Reconciliation Queue & Detail
 */
export async function getReconciliationQueue(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  severity?: string;
  vendor?: string;
  search?: string;
}): Promise<QueueResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", params.page.toString());
  if (params?.page_size) query.set("page_size", params.page_size.toString());
  if (params?.status) query.set("status", params.status);
  if (params?.severity) query.set("severity", params.severity);
  if (params?.vendor) query.set("vendor", params.vendor);
  if (params?.search) query.set("search", params.search);

  const qs = query.toString();
  return fetchAPI<QueueResponse>(`/api/v1/reconcile/queue${qs ? `?${qs}` : ""}`);
}

export async function getReconciliationDetail(eventId: string) {
  return fetchAPI(`/api/v1/reconcile/${eventId}`);
}

export async function submitDecision(
  eventId: string,
  payload: {
    decision: string;
    reason: string;
    reviewer_id?: string;
    role?: string;
  }
) {
  return fetchAPI(`/api/v1/reconcile/${eventId}/decision`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getDisputePackage(
  eventId: string,
  reviewer?: string
): Promise<DisputePackage> {
  const qs = reviewer ? `?reviewer=${encodeURIComponent(reviewer)}` : "";
  return fetchAPI<DisputePackage>(`/api/v1/reconcile/${eventId}/dispute-package${qs}`);
}

/**
 * 5. Immutable Audit Trail
 */
export async function getAuditLogs(entityId?: string): Promise<{ data: AuditLogItem[]; total: number }> {
  const qs = entityId ? `?entity_id=${encodeURIComponent(entityId)}` : "";
  return fetchAPI<{ data: AuditLogItem[]; total: number }>(`/api/v1/audit${qs}`);
}
