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
    <aside className="w-72 bg-[#E6EEF5] text-[#55637A] flex flex-col justify-between border-r border-[#CDDBE8] shrink-0 h-screen sticky top-0 font-sans select-none">
      {/* Brand Header */}
      <div className="m-3 rounded-3xl border border-white/80 bg-white/75 p-4 shadow-[0_12px_30px_rgba(36,58,94,.08)]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <VeriflowLogo className="h-8 w-auto" />
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#7C879C]">
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
                        ? "bg-[#243A5E] text-white font-bold shadow-[0_10px_20px_rgba(36,58,94,.18)]"
                        : item.disabled
                        ? "text-slate-500 opacity-40 cursor-not-allowed"
                        : "text-[#55637A] font-medium hover:bg-white/70 hover:text-[#243A5E]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#8FD7D4]" : "text-[#7C879C]"}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Navigation */}
      <div className="m-3 rounded-2xl border border-[#CDDBE8] bg-white/60 p-3 space-y-1">
        <Link
          href="/login"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#A34457] hover:bg-[#FDECEF] transition-colors"
        >
          <LogOut className="h-4 w-4 text-[#D6455A]" />
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}
