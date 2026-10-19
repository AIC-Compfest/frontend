/**
 * Shared runtime configuration. The backend origin comes from NEXT_PUBLIC_API_URL
 * (same variable used by `lib/api.ts`), defaulting to the local backend.
 */
export const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/+$/, "");
export const API_V1 = `${API_ORIGIN}/api/v1`;
