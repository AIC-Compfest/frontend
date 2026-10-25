"use client";

import type { TablePayload } from "@/lib/review";

const fmt = (value: unknown): string => value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);

export function TablePayloadView({ payload }: { payload: TablePayload }) {
  const columns = payload.columns?.length ? payload.columns : (payload.headers ?? []).map((header) => ({ header, field: null }));
  if (payload.rows.length === 0) return <p className="text-xs text-slate-500">Tidak ada baris</p>;
  return <div className="overflow-x-auto rounded-md border border-slate-200">
    <table className="w-full min-w-[480px] text-left text-xs">
      <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr>{columns.map((column, index) => <th key={index} className="px-3 py-2 font-bold">{column.header}{column.field ? <span className="block font-normal normal-case text-slate-400">{column.field}</span> : null}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">{payload.rows.map((row, rowIndex) => <tr key={row.index ?? rowIndex} className="align-top">{columns.map((column, colIndex) => <td key={colIndex} className="px-3 py-2 text-slate-900">{fmt(row.cells?.[colIndex] ?? (column.field ? row.values?.[column.field] : undefined))}</td>)}</tr>)}</tbody>
    </table>
    {payload.truncated ? <p className="px-3 py-2 text-[11px] text-amber-700">Tabel dipotong pada batas tampilan.</p> : null}
  </div>;
}
