"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Inbox,
  FileSearch,
  UploadCloud,
  FileSpreadsheet,
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  LogOut,
  Building2,
  CheckCircle2,
} from "lucide-react";
import VeriflowLogo from "@/components/logo/VeriflowLogo";

export type DashboardTab =
  | "OVERVIEW"
  | "QUEUE"
  | "EXCEPTIONS"
  | "FINAL_APPROVAL"
  | "WORKSPACE"
  | "UPLOAD"
  | "CONTRACTS"
  | "DISPUTES"
  | "AUDIT"
  | "SETTINGS";

interface SidebarProps {
  currentTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  queueCount: number;
  exceptionCount: number;
  userRole: string;
  hasSelectedEvent: boolean;
}

export function Sidebar({
  currentTab,
  onTabChange,
  queueCount,
  exceptionCount,
  userRole,
  hasSelectedEvent,
}: SidebarProps) {
  const sections = [
    {
      title: "Reconciliation & Approval",
      items: [
        {
          id: "OVERVIEW" as DashboardTab,
          label: "Overview",
          icon: LayoutDashboard,
        },
        {
          id: "QUEUE" as DashboardTab,
          label: "Review Queue (Anomali)",
          icon: Inbox,
        },
        {
          id: "EXCEPTIONS" as DashboardTab,
          label: "Arsip Anomali & Ditolak",
          icon: ShieldAlert,
        },
        {
          id: "FINAL_APPROVAL" as DashboardTab,
          label: "Final Approval (SoD)",
          icon: ShieldCheck,
        },
        {
          id: "WORKSPACE" as DashboardTab,
          label: "Evidence Workspace",
          icon: FileSearch,
          disabled: !hasSelectedEvent,
        },
      ],
    },
    {
      title: "Data & Master PKS",
      items: [
        {
          id: "UPLOAD" as DashboardTab,
          label: "Document Hub",
          icon: UploadCloud,
        },
        {
          id: "CONTRACTS" as DashboardTab,
          label: "Mitra Logistik",
          icon: Building2,
        },
      ],
    },
    {
      title: "Audit & Governance",
      items: [
        {
          id: "DISPUTES" as DashboardTab,
          label: "Dispute Packages",
          icon: FileCheck2,
        },
        {
          id: "AUDIT" as DashboardTab,
          label: "Audit Ledger Trail",
          icon: ShieldCheck,
        },
        {
          id: "SETTINGS" as DashboardTab,
          label: "Policy & Tolerance",
          icon: Sliders,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#1B2A4A] text-slate-200 flex flex-col justify-between border-r border-[#243A5E]/60 shrink-0 h-screen sticky top-0 font-sans select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#243A5E]/70">
        <Link href="/" className="flex items-center gap-2.5 group">
          <VeriflowLogo variant="light" className="h-8 w-auto" />
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && onTabChange(item.id)}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-sky-500 text-white font-bold shadow-xs"
                        : item.disabled
                        ? "text-slate-500 opacity-40 cursor-not-allowed"
                        : "text-slate-300 font-medium hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-[#243A5E]/70 space-y-1">
        <Link
          href="/login"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-300 hover:bg-rose-900/30 transition-colors"
        >
          <LogOut className="h-4 w-4 text-rose-400" />
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}
