/**
 * API client helper for backend communication.
 * The base URL is configured via NEXT_PUBLIC_API_URL environment variable.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface HealthResponse {
  status: string;
  service?: string;
  version?: string;
  timestamp?: string;
}

/**
 * Check backend liveness endpoint GET /healthz
 */
export async function checkBackendHealth(): Promise<{
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/healthz`, {
      method: "GET",
      cache: "no-store",
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
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
 * Generic API request wrapper
 */
export async function fetchAPI<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options?.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errBody = await response.json();
      errorDetail = errBody.message || JSON.stringify(errBody);
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}
