"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { QueueSummary, ShipmentEvent } from "@/types/reconciliation";
import { ReviewQueue } from "@/components/ReviewQueue";
import { EvidenceViewer } from "@/components/EvidenceViewer";
import { ReconciliationCard } from "@/components/ReconciliationCard";
import { DecisionModal } from "@/components/DecisionModal";
import { DisputePackageModal } from "@/components/DisputePackageModal";
import { AuditTrailView } from "@/components/AuditTrailView";

// Dashboard views and sidebar
import { Sidebar, DashboardTab } from "./components/Sidebar";
import { OverviewView } from "./components/OverviewView";
import { UploadDropzone } from "./components/UploadDropzone";
import { MitraLogistikView } from "./components/MitraLogistikView";
import { DisputeListView } from "./components/DisputeListView";
import { SettingsView } from "./components/SettingsView";
import { FinalApprovalView } from "./components/FinalApprovalView";
import { ExceptionView } from "./components/ExceptionView";
import { GlobalAuditLedgerView } from "./components/GlobalAuditLedgerView";

import { ArrowLeft, Loader2, Menu, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_V1 } from "@/lib/config";
import { getStoredUser } from "@/lib/auth";
import { btnOutline, focusRing, pageTitle } from "@/lib/dashboard-ui";

const API_BASE = API_V1;

const PAGE_TITLES: Record<DashboardTab, string> = {
  OVERVIEW: "Overview",
  QUEUE: "Review Queue",
  EXCEPTIONS: "Anomaly Archive",
  FINAL_APPROVAL: "Final Approval",
  WORKSPACE: "Evidence Workspace",
  UPLOAD: "Document Hub",
  CONTRACTS: "Logistics Partners (3PL)",
  DISPUTES: "Dispute Packages",
  AUDIT: "Audit Ledger Trail",
  SETTINGS: "Policy & Tolerance",
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const eventParam = searchParams.get("event");
  const currentUser = getStoredUser();
  const userRole = currentUser?.role || roleParam || "UNAUTHENTICATED";

  const [currentTab, setCurrentTab] = useState<DashboardTab>("OVERVIEW");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerWasOpen = useRef(false);
  const [queueSummary, setQueueSummary] = useState<QueueSummary>({
    total_invoiced_amount: 0,
    total_variance_amount: 0,
    total_invoices_count: 0,
    open_exceptions_count: 0,
    urgent_disputes_count: 0,
    matches_count: 0,
  });

  // Selected transaction and workspace state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [currentEvent, setCurrentEvent] = useState<ShipmentEvent | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);

  // Evidence viewer controls. activeDocTab holds a document ID (UUID).
  const [activeDocTab, setActiveDocTab] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [activeDocumentType, setActiveDocumentType] = useState<"INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT">("INVOICE");

  // Modal state
  const [decisionModalAction, setDecisionModalAction] = useState<"APPROVE" | "DISPUTE" | "REJECT" | null>(null);
  const [isDisputePackageOpen, setIsDisputePackageOpen] = useState(false);

  // Fetch the KPI summary from the review queue API
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/review-queue");
      if (!res.ok) throw new Error("Failed to load the KPI summary");
      const data = await res.json();
      if (data.summary) {
        setQueueSummary(data.summary);
      }
    } catch (err) {
      console.error("Summary fetch error:", err);
    }
  }, []);

  // Fetch one reconciliation event for the dual-pane evidence view
  const fetchEventDetail = useCallback(async (eventId: string) => {
    try {
      setIsLoadingEvent(true);
      const res = await fetch(`${API_BASE}/reconcile/${eventId}`);
      if (!res.ok) throw new Error("Failed to load the reconciliation event");
      const data = await res.json();
      setCurrentEvent(data);
    } catch (err) {
      console.error("Event detail fetch error:", err);
    } finally {
      setIsLoadingEvent(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Open the evidence workspace for a transaction picked in the queue, overview, or archive
  const handleSelectTransaction = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedField(null);
    // Leave activeDocTab empty so EvidenceViewer selects the first document on load.
    setActiveDocTab("");

    // The review queue deliberately contains only a summary projection. Always load the
    // canonical event so the evidence workspace never invents values.
    fetchEventDetail(eventId);

    setCurrentTab("WORKSPACE");
  };

  useEffect(() => {
    if (eventParam) handleSelectTransaction(eventParam);
  // The deep-link is consumed only when its URL parameter changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventParam]);

  // Return focus to the Menu button when the mobile drawer closes.
  useEffect(() => {
    if (drawerOpen) {
      drawerWasOpen.current = true;
      return;
    }
    if (drawerWasOpen.current) {
      drawerWasOpen.current = false;
      menuButtonRef.current?.focus();
    }
  }, [drawerOpen]);

  // Open the field-level proof for a discrepancy. EvidenceViewer picks the document from the field name.
  const handleViewProof = (fieldName: string) => {
    setSelectedField(fieldName);
  };

  // Submit a reviewer decision
  const handleConfirmDecision = async (action: string, role: string, reason: string) => {
    if (!selectedEventId) return;

    const res = await fetch(`${API_BASE}/reconcile/${selectedEventId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        reviewer_role: role,
        reviewer_id: currentUser?.id,
        reason,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save the decision.");
    }

    const updatedEvent = await res.json();
    setCurrentEvent(updatedEvent);
    fetchSummary();
  };

  return (
    <div className="flex min-h-dvh bg-canvas text-ink">
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        mobileOpen={drawerOpen}
        onMobileOpenChange={setDrawerOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-hairline bg-canvas/[.92] px-6 backdrop-blur-md max-md:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-controls="dashboard-sidebar"
              aria-expanded={drawerOpen}
              className={cn(btnOutline, "h-9 px-3 md:hidden")}
            >
              <Menu className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              <span>Menu</span>
            </button>
            <h1 className={cn(pageTitle, "truncate")}>{PAGE_TITLES[currentTab]}</h1>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button type="button" onClick={fetchSummary} className={cn(btnOutline, "h-9 px-3 sm:px-4")}>
              <RotateCw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Refresh</span>
            </button>
            <span className="hidden h-7 items-center rounded-full bg-surface-soft px-3 text-[12px] font-semibold tracking-[.02em] text-navy sm:inline-flex">
              {userRole}
            </span>
          </div>
        </header>

        {/* Dynamic view body. Each tab requests its own targeted payload. */}
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-6 max-md:p-4">
          {currentTab === "OVERVIEW" && (
            <OverviewView
              summary={queueSummary}
              onNavigateToQueue={() => setCurrentTab("QUEUE")}
              onNavigateToContracts={() => setCurrentTab("CONTRACTS")}
            />
          )}

          {/* Targeted query with server-side status, severity, and vendor filters */}
          {currentTab === "QUEUE" && (
            <ReviewQueue
              selectedEventId={selectedEventId}
              onSelectTransaction={handleSelectTransaction}
              onRefresh={fetchSummary}
            />
          )}

          {currentTab === "EXCEPTIONS" && <ExceptionView onSelectTransaction={handleSelectTransaction} />}

          {/* Targeted queries: status=MATCH (pending) and status=APPROVED (history) */}
          {currentTab === "FINAL_APPROVAL" && (
            <FinalApprovalView
              onSelectTransaction={handleSelectTransaction}
              onRefresh={fetchSummary}
              onNavigateToAudit={() => setCurrentTab("AUDIT")}
            />
          )}

          {/* Dual-pane spatial evidence. Opened from the queue, overview, archive, or ?event= */}
          {currentTab === "WORKSPACE" && (
            <div className="space-y-6">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[13px] text-body">
                <button
                  type="button"
                  onClick={() => setCurrentTab("QUEUE")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-pop font-semibold text-action-ink underline-offset-4 hover:underline",
                    focusRing
                  )}
                >
                  <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  <span>Back to Review Queue</span>
                </button>
                <span aria-hidden="true">/</span>
                <span className="font-semibold text-navy tabular-nums">
                  {currentEvent?.invoice?.invoice_number || "Transaction Detail"}
                </span>
                <span aria-hidden="true">/</span>
                <span>Proof Inspection</span>
              </nav>

              {isLoadingEvent || !currentEvent ? (
                <div className="flex flex-col items-center gap-3 py-20 text-center text-[13px] text-body">
                  <Loader2 className="h-6 w-6 animate-spin text-navy" aria-hidden="true" />
                  <span>Loading reconciliation data and document evidence...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Dual pane: evidence viewer on the left, reconciliation card on the right */}
                  <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
                    <div className="h-[680px] lg:col-span-6">
                      <EvidenceViewer
                        event={currentEvent}
                        selectedField={selectedField}
                        activeDocumentTab={activeDocTab}
                        onTabChange={setActiveDocTab}
                        onSelectField={setSelectedField}
                        onDocumentTypeChange={setActiveDocumentType}
                      />
                    </div>

                    <div className="h-[680px] lg:col-span-6">
                      <ReconciliationCard
                        event={currentEvent}
                        activeDocumentType={activeDocumentType}
                        activeDocumentId={activeDocTab}
                        onViewProof={handleViewProof}
                        onOpenDecisionModal={(action) => setDecisionModalAction(action)}
                        onOpenDisputePackage={() => setIsDisputePackageOpen(true)}
                      />
                    </div>
                  </div>

                  <AuditTrailView auditTrail={currentEvent.audit_trail} />
                </div>
              )}
            </div>
          )}

          {currentTab === "UPLOAD" && <UploadDropzone />}

          {currentTab === "CONTRACTS" && <MitraLogistikView />}

          {currentTab === "DISPUTES" && <DisputeListView onSelectTransaction={handleSelectTransaction} />}

          {currentTab === "AUDIT" && <GlobalAuditLedgerView />}

          {currentTab === "SETTINGS" && <SettingsView />}
        </main>
      </div>

      {/* Decision confirmation modal */}
      {currentEvent && (
        <DecisionModal
          isOpen={decisionModalAction !== null}
          action={decisionModalAction}
          event={currentEvent}
          onClose={() => setDecisionModalAction(null)}
          onConfirm={handleConfirmDecision}
        />
      )}

      {/* Dispute package modal */}
      {selectedEventId && (
        <DisputePackageModal
          isOpen={isDisputePackageOpen}
          eventId={selectedEventId}
          onClose={() => setIsDisputePackageOpen(false)}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center gap-2 bg-canvas text-[13px] text-body">
          <Loader2 className="h-5 w-5 animate-spin text-navy" aria-hidden="true" />
          <span>Loading dashboard...</span>
        </div>
      }
    >
      <DashboardContent />
    </React.Suspense>
  );
}
