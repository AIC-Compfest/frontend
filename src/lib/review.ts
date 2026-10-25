export const WARN_THRESHOLD = 0.7;

export function needsManualCheck(prediction: { review_status?: string; low_confidence?: boolean; score?: number }): boolean {
  return prediction.review_status === "REVIEW" || prediction.low_confidence === true || (typeof prediction.score === "number" && prediction.score < WARN_THRESHOLD);
}

export interface TablePayload {
  kind: "table";
  role?: string;
  table_id?: string;
  pages?: number[];
  headers?: string[];
  columns?: Array<{ index?: number; header: string; field?: string | null }>;
  rows: Array<{ index?: number; cells?: unknown[]; values?: Record<string, unknown> }>;
  truncated?: boolean;
  [key: string]: unknown;
}

export function asTablePayload(value: unknown): TablePayload | null {
  if (value && typeof value === "object" && !Array.isArray(value) && (value as TablePayload).kind === "table" && Array.isArray((value as TablePayload).rows)) {
    return value as TablePayload;
  }
  if (Array.isArray(value) && value.length > 0 && value.every((row) => row && typeof row === "object" && !Array.isArray(row))) {
    const keys = Array.from(new Set(value.flatMap((row) => Object.keys(row as object))));
    return { kind: "table", headers: keys, columns: keys.map((header) => ({ header, field: header })),
      rows: (value as Record<string, unknown>[]).map((row, index) => ({ index: index + 1, cells: keys.map((key) => row[key]), values: row })) };
  }
  return null;
}

export function hasSuggestion(value: unknown, rawText?: string): boolean {
  if (value === null || value === undefined) return Boolean(rawText?.trim());
  if (typeof value === "string") return value.trim() !== "" || Boolean(rawText?.trim());
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

export function displayValue(value: unknown, rawText?: string): string {
  if (hasSuggestion(value, rawText)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    return rawText?.trim() || JSON.stringify(value);
  }
  return "Tidak ada kandidat — isi koreksi";
}
