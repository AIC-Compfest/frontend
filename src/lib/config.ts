/**
 * Shared runtime configuration. The backend origin comes from NEXT_PUBLIC_API_URL
 * (same variable used by `lib/api.ts`). It must be configured for each deployment.
 */
export const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
export const API_V1 = `${API_ORIGIN}/api/v1`;

export function requireApiOrigin(): string {
  if (!API_ORIGIN) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  return API_ORIGIN;
}
