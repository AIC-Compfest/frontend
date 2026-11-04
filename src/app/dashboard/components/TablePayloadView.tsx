"use client";

import type { TablePayload } from "@/lib/review";

const fmt = (value: unknown): string => value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);

export function TablePayloadView({ payload }: { payload: TablePayload }) {
  const columns = payload.columns?.length ? payload.columns : (payload.headers ?? []).map((header) => ({ header, field: null }));
  if (payload.rows.length === 0) return <p className="text-xs text-body">No rows</p>;
  return <div className="overflow-x-auto rounded-control border border-hairline">
    <table className="w-full min-w-[480px] text-left text-xs">
      <thead className="bg-surface-soft text-[10px] uppercase tracking-wide text-body"><tr>{columns.map((column, index) => <th key={index} className="px-3 py-2 font-semibold">{column.header}{column.field ? <span className="block font-normal normal-case text-muted">{column.field}</span> : null}</th>)}</tr></thead>
      <tbody className="divide-y divide-hairline">{payload.rows.map((row, rowIndex) => <tr key={row.index ?? rowIndex} className="align-top">{columns.map((column, colIndex) => <td key={colIndex} className="px-3 py-2 text-ink">{fmt(row.cells?.[colIndex] ?? (column.field ? row.values?.[column.field] : undefined))}</td>)}</tr>)}</tbody>
    </table>
    {payload.truncated ? <p className="px-3 py-2 text-[11px] text-warning-ink">Table truncated at the display limit.</p> : null}
  </div>;
}
