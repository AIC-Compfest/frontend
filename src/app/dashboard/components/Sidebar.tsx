"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  FileCheck2,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  UploadCloud,
  X,
  type LucideIcon,
} from "lucide-react";
import VeriflowLogo from "@/components/logo/VeriflowLogo";
import { cn } from "@/lib/utils";
import { focusRing } from "@/lib/dashboard-ui";

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

export const SIDEBAR_STORAGE_KEY = "verflo.sidebar.collapsed";

// Below this width the rail starts collapsed when no preference is saved yet.
const COLLAPSE_DEFAULT_BELOW_PX = 1024;
// Matches Tailwind's md breakpoint, where the sidebar becomes a fixed rail instead of a drawer.
const DESKTOP_MIN_PX = 768;

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

interface NavItem {
  id: DashboardTab;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Reconciliation & Approval",
    items: [
      { id: "OVERVIEW", label: "Overview", icon: LayoutDashboard },
      { id: "QUEUE", label: "Review Queue", icon: Inbox },
      { id: "EXCEPTIONS", label: "Anomaly Archive", icon: ShieldAlert },
      { id: "FINAL_APPROVAL", label: "Final Approval", icon: ShieldCheck },
    ],
  },
  {
    title: "Data & Master Records",
    items: [
      { id: "UPLOAD", label: "Document Hub", icon: UploadCloud },
      { id: "CONTRACTS", label: "Logistics Partners", icon: Building2 },
    ],
  },
  {
    title: "Audit & Governance",
    items: [
      { id: "DISPUTES", label: "Dispute Packages", icon: FileCheck2 },
      { id: "AUDIT", label: "Audit Ledger Trail", icon: History },
      { id: "SETTINGS", label: "Policy & Tolerance", icon: Sliders },
    ],
  },
];

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
}

interface SidebarProps {
  currentTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

interface TooltipState {
  label: string;
  top: number;
  left: number;
}

export function Sidebar({ currentTab, onTabChange, mobileOpen, onMobileOpenChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Read the saved preference after mount so the server and client render the same markup.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    } catch {
      stored = null;
    }
    setCollapsed(stored === null ? window.innerWidth < COLLAPSE_DEFAULT_BELOW_PX : stored === "true");
  }, []);

  const toggleCollapsed = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    setTooltip(null);
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    } catch {
      // Storage can be blocked (for example in private mode). The toggle still works for this visit.
    }
  }, [collapsed]);

  // Ctrl/Cmd + B toggles the rail on desktop. It is ignored while the user types in a field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== "b") return;
      if (isEditableTarget(event.target)) return;
      if (window.innerWidth < DESKTOP_MIN_PX) return;
      event.preventDefault();
      toggleCollapsed();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleCollapsed]);

  // Close the drawer once the viewport reaches the desktop layout, so body scroll is not left locked.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(`(min-width: ${DESKTOP_MIN_PX}px)`);
    const onChange = () => {
      if (media.matches) onMobileOpenChange(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [onMobileOpenChange]);

  // Drawer behavior: lock body scroll, close on Escape, and keep Tab focus inside the drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onMobileOpenChange(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const items = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const insideDrawer = active instanceof Node && drawerRef.current.contains(active);
      if (event.shiftKey && (!insideDrawer || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!insideDrawer || active === last)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen, onMobileOpenChange]);

  const showTooltip = (element: HTMLElement, label: string) => {
    const rect = element.getBoundingClientRect();
    setTooltip({ label, top: rect.top + rect.height / 2, left: rect.right + 12 });
  };
  const hideTooltip = () => setTooltip(null);

  const selectTab = (tab: DashboardTab) => {
    onTabChange(tab);
    onMobileOpenChange(false);
  };

  // Labels fade and shrink before the rail narrows. Expanded labels wait 100ms, so text never wraps mid-animation.
  const labelClass = cn(
    "min-w-0 overflow-hidden whitespace-nowrap text-[14px] transition-[opacity,width] duration-150 ease-out motion-reduce:transition-none",
    collapsed ? "md:w-0 md:opacity-0" : "opacity-100 delay-100"
  );

  const collapsedOnly = (classes: string) => (collapsed ? classes : "");

  return (
    <>
      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={() => onMobileOpenChange(false)}
          className="fixed inset-0 z-[45] bg-ink/40 md:hidden"
        />
      )}

      <aside
        id="dashboard-sidebar"
        ref={drawerRef}
        aria-label="Dashboard navigation"
        className={cn(
          "flex h-dvh shrink-0 flex-col bg-navy text-navy-soft transition-[width] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:w-[280px] max-md:shadow-drawer",
          // Opening only transitions transform, so visibility flips at once and focus can move into the drawer.
          // Closing also transitions visibility, so the drawer stays visible until the slide-out finishes.
          mobileOpen
            ? "max-md:visible max-md:translate-x-0 max-md:transition-transform motion-reduce:transition-none"
            : "max-md:invisible max-md:-translate-x-full max-md:transition-[transform,visibility] motion-reduce:transition-none",
          "md:sticky md:top-0 md:z-40",
          collapsed ? "md:w-[72px]" : "md:w-64"
        )}
      >
        {/* Brand row. On the collapsed rail the logo sits above the toggle. */}
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-5 pb-3 pt-5",
            collapsedOnly("md:flex-col md:gap-4 md:px-0 md:pb-4")
          )}
        >
          <Link href="/" aria-label="Verflo home" className={cn("rounded-pop", focusRing)}>
            <span className={cn("block", collapsedOnly("md:hidden"))}>
              <VeriflowLogo variant="light" className="h-7 w-auto" />
            </span>
            <span className={cn("hidden", collapsedOnly("md:block"))}>
              <VeriflowLogo variant="icon-light" className="h-8 w-8" />
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close menu"
              onClick={() => onMobileOpenChange(false)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-control text-navy-soft transition-colors hover:bg-white/[.08] hover:text-white md:hidden",
                focusRing
              )}
            >
              <X className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-keyshortcuts="Control+B Meta+B"
              onClick={toggleCollapsed}
              onMouseEnter={(event) => showTooltip(event.currentTarget, collapsed ? "Expand sidebar" : "Collapse sidebar")}
              onMouseLeave={hideTooltip}
              onFocus={(event) => showTooltip(event.currentTarget, collapsed ? "Expand sidebar" : "Collapse sidebar")}
              onBlur={hideTooltip}
              className={cn(
                "hidden h-8 w-8 place-items-center rounded-control text-navy-soft transition-colors hover:bg-white/[.08] hover:text-white md:grid",
                focusRing
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <nav aria-label="Dashboard sections" className="min-h-0 flex-1 overflow-y-auto pb-4 pt-1">
          {NAV_SECTIONS.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? "mt-6" : undefined}>
              {sectionIndex > 0 && (
                <div
                  aria-hidden="true"
                  className={cn("mx-3 mb-2 hidden h-px bg-white/[.12]", collapsedOnly("md:block"))}
                />
              )}
              <p
                className={cn(
                  "px-5 pb-2 text-[11px] font-semibold uppercase tracking-[.08em] text-navy-muted",
                  collapsedOnly("md:hidden")
                )}
              >
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={item.label}
                      aria-current={active ? "page" : undefined}
                      onClick={() => selectTab(item.id)}
                      onMouseEnter={(event) => collapsed && showTooltip(event.currentTarget, item.label)}
                      onMouseLeave={hideTooltip}
                      onFocus={(event) => collapsed && showTooltip(event.currentTarget, item.label)}
                      onBlur={hideTooltip}
                      className={cn(
                        "flex h-10 cursor-pointer items-center gap-3 px-3 text-[14px] font-medium transition-colors duration-150 motion-reduce:transition-none",
                        focusRing,
                        active
                        ? "sidebar-tab-active ml-3 mr-0 w-[244px] font-semibold text-navy"
                        : "ml-3 mr-3 w-[232px] rounded-control text-navy-soft hover:bg-white/[.08] hover:text-white",
                        collapsedOnly(cn("md:justify-center md:gap-0 md:px-0", active ? "w-[60px]" : "w-[48px]"))
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.75}
                        className={cn("h-[18px] w-[18px] shrink-0", active ? "text-action" : "text-navy-muted")}
                      />
                      <span className={labelClass}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 pb-4 pt-2">
          <Link
            href="/login"
            aria-label="Sign Out"
            onMouseEnter={(event) => collapsed && showTooltip(event.currentTarget, "Sign Out")}
            onMouseLeave={hideTooltip}
            onFocus={(event) => collapsed && showTooltip(event.currentTarget, "Sign Out")}
            onBlur={hideTooltip}
            className={cn(
              "flex h-10 items-center gap-3 rounded-control px-3 text-[14px] font-medium text-navy-soft transition-colors duration-150 hover:bg-white/[.08] hover:text-white motion-reduce:transition-none",
              collapsedOnly("md:justify-center md:gap-0 md:px-0"),
              focusRing
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0 text-navy-muted" strokeWidth={1.75} aria-hidden="true" />
            <span className={labelClass}>Sign Out</span>
          </Link>
        </div>
      </aside>

      {tooltip && (
        <div
          role="tooltip"
          style={{ top: tooltip.top, left: tooltip.left }}
          className="pointer-events-none fixed z-[60] -translate-y-1/2 whitespace-nowrap rounded-pop bg-ink px-2.5 py-1.5 text-xs font-medium text-white shadow-drawer max-md:hidden"
        >
          {tooltip.label}
        </div>
      )}
    </>
  );
}
