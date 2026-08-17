"use client";

import React from "react";
import { AuditTrailItem } from "@/types/reconciliation";

interface AuditTrailViewProps {
  auditTrail: AuditTrailItem[];
}

export function AuditTrailView({ auditTrail }: AuditTrailViewProps) {
  if (!auditTrail || auditTrail.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-[#5F86A6] bg-white rounded-lg border border-[#CFE3F1]">
        Belum ada riwayat audit manual untuk transaksi ini.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-[#CFE3F1] shadow-xs space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#243A5E] flex items-center gap-2">
        <svg className="w-4 h-4 text-[#5F86A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Immutable Audit Trail & Decision History ({auditTrail.length})</span>
      </h3>

      <div className="relative border-l-2 border-[#CFE3F1] ml-2 space-y-4 pl-4 py-1 text-xs">
        {auditTrail.map((item, idx) => {
          const dateStr = new Date(item.timestamp).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          return (
            <div key={idx} className="relative">
              {/* Dot */}
              <div
                className={`absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  item.action === "APPROVE"
                    ? "bg-emerald-600 ring-2 ring-emerald-200"
                    : item.action === "DISPUTE"
                    ? "bg-rose-600 ring-2 ring-rose-200"
                    : "bg-[#243A5E] ring-2 ring-[#CFE3F1]"
                }`}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-[#243A5E]">
                  {item.action}{" "}
                  <span className="text-[11px] font-normal text-[#5F86A6]">
                    by <strong className="text-slate-800">{item.actor_role}</strong> ({item.actor_id})
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">{dateStr}</div>
              </div>

              {item.notes && (
                <p className="mt-1 text-slate-700 bg-[#EDF4FA] p-2 rounded border border-[#CFE3F1] text-[11px] italic">
                  &quot;{item.notes}&quot;
                </p>
              )}

              {item.previous_status && (
                <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                  <span>Status:</span>
                  <span className="line-through">{item.previous_status}</span>
                  <span>➔</span>
                  <span className="font-bold text-slate-800">{item.new_status}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
