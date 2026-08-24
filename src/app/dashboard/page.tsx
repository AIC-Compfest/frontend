"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { QueueSummary, ShipmentEvent } from "@/types/reconciliation";
import { ReviewQueue } from "@/components/ReviewQueue";
import { EvidenceViewer } from "@/components/EvidenceViewer";
import { ReconciliationCard } from "@/components/ReconciliationCard";
import { DecisionModal } from "@/components/DecisionModal";
import { DisputePackageModal } from "@/components/DisputePackageModal";
import { AuditTrailView } from "@/components/AuditTrailView";

// Dashboard Views & Sidebar
import { Sidebar, DashboardTab } from "./components/Sidebar";
import { OverviewView } from "./components/OverviewView";
import { UploadDropzone } from "./components/UploadDropzone";
import { ContractsView } from "./components/ContractsView";
import { DisputeListView } from "./components/DisputeListView";
import { SettingsView } from "./components/SettingsView";
import { FinalApprovalView } from "./components/FinalApprovalView";

import { RotateCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = "http://localhost:8080/api/v1";

function DashboardContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "AP_MANAGER";

  const [currentTab, setCurrentTab] = useState<DashboardTab>("OVERVIEW");
  const [queueSummary, setQueueSummary] = useState<QueueSummary>({
    total_invoiced_amount: 0,
    total_variance_amount: 0,
    total_invoices_count: 0,
    open_exceptions_count: 0,
    urgent_disputes_count: 0,
    matches_count: 0,
  });

  // Selected Transaction & Workspace State
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [currentEvent, setCurrentEvent] = useState<ShipmentEvent | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);

  // Evidence Viewer Controls
  const [activeDocTab, setActiveDocTab] = useState<"INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT">("INVOICE");
  const [selectedField, setSelectedField] = useState<string | null>(null);

  // Modal States
  const [decisionModalAction, setDecisionModalAction] = useState<"APPROVE" | "DISPUTE" | "REJECT" | null>(null);
  const [isDisputePackageOpen, setIsDisputePackageOpen] = useState(false);

  // Fetch KPI Summary from Backend API
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/reconcile/queue?page_size=1`);
      if (!res.ok) throw new Error("Gagal mengambil ringkasan KPI");
      const data = await res.json();
      if (data.summary) {
        setQueueSummary(data.summary);
      }
    } catch (err) {
      console.error("Summary fetch error:", err);
    }
  }, []);

  // Fetch Single Transaction Reconciliation Event (Dual-Pane Evidence)
  const fetchEventDetail = useCallback(async (eventId: string) => {
    try {
      setIsLoadingEvent(true);
      const res = await fetch(`${API_BASE}/reconcile/${eventId}`);
      if (!res.ok) throw new Error("Gagal mengambil rincian event rekonsiliasi");
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

  // Handle Transaction Selection from Queue or Overview
  const handleSelectTransaction = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedField(null);
    setActiveDocTab("INVOICE");
    fetchEventDetail(eventId);
    setCurrentTab("WORKSPACE");
  };

  // Handle "View Proof" from Discrepancy Card
  const handleViewProof = (fieldName: string, docTab: "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT") => {
    setActiveDocTab(docTab);
    setSelectedField(fieldName);
  };

  // Handle Reviewer Decision Submission
  const handleConfirmDecision = async (action: string, role: string, reason: string) => {
    if (!selectedEventId) return;

    const res = await fetch(`${API_BASE}/reconcile/${selectedEventId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        reviewer_role: role,
        reviewer_id: "USER-AP-001",
        reason,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal menyimpan keputusan.");
    }

    const updatedEvent = await res.json();
    setCurrentEvent(updatedEvent);
    fetchSummary();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        queueCount={queueSummary.total_invoices_count}
        exceptionCount={queueSummary.open_exceptions_count}
        userRole={roleParam}
        hasSelectedEvent={selectedEventId !== null}
      />

      {/* 2. Main Content Right Panel */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-extrabold text-[#243A5E] tracking-tight">
              {currentTab === "OVERVIEW" && "Overview & Risk Analytics"}
              {currentTab === "QUEUE" && "Priority Review Queue"}
              {currentTab === "WORKSPACE" && "Dual-Pane Evidence Workspace"}
              {currentTab === "FINAL_APPROVAL" && "Executive Final Approval (SoD)"}
              {currentTab === "UPLOAD" && "Document Ingest Dropzone"}
              {currentTab === "CONTRACTS" && "Active Rate Agreements (PKS)"}
              {currentTab === "DISPUTES" && "Official 3PL Dispute Packages"}
              {currentTab === "AUDIT" && "Immutable Audit Trail Ledger"}
              {currentTab === "SETTINGS" && "Policy & Tolerance Thresholds"}
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono text-slate-500">
              Workspace connected
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSummary}
              className="text-xs font-semibold gap-1.5 h-8 text-slate-700 cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh Data</span>
            </Button>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#EDF4FA] border border-[#8FB8D6]/40 text-xs font-bold text-[#243A5E]">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{roleParam}</span>
            </div>
          </div>
        </header>

        {/* Dynamic View Body - Each Tab Requests its own targeted DB payload */}
        <main className="p-6 flex-1 max-w-7xl w-full mx-auto">
          {/* TAB 1: OVERVIEW */}
          {currentTab === "OVERVIEW" && (
            <OverviewView
              summary={queueSummary}
              onNavigateToQueue={() => setCurrentTab("QUEUE")}
              onNavigateToContracts={() => setCurrentTab("CONTRACTS")}
              onSelectTransaction={handleSelectTransaction}
            />
          )}

          {/* TAB 2: QUEUE - Targeted query with server-side status/severity/vendor filter */}
          {currentTab === "QUEUE" && (
            <ReviewQueue
              selectedEventId={selectedEventId}
              onSelectTransaction={handleSelectTransaction}
              onRefresh={fetchSummary}
            />
          )}

          {/* TAB 3: FINAL APPROVAL (SoD) - Targeted queries: status=MATCH (Pending) & status=APPROVED (History) */}
          {currentTab === "FINAL_APPROVAL" && (
            <FinalApprovalView
              onSelectTransaction={handleSelectTransaction}
              onRefresh={fetchSummary}
            />
          )}

          {/* TAB 4: WORKSPACE - Dual-Pane Spatial Evidence */}
          {currentTab === "WORKSPACE" && (
            <div className="space-y-6">
              {/* Breadcrumb Toolbar */}
              <div className="flex items-center justify-between text-xs text-[#5F86A6]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentTab("QUEUE")}
                    className="font-medium hover:text-[#243A5E] hover:underline cursor-pointer"
                  >
                    ← Kembali ke Review Queue
                  </button>
                  <span>/</span>
                  <span className="font-mono font-semibold text-[#243A5E]">
                    {currentEvent?.invoice?.invoice_number || "Transaction Detail"}
                  </span>
                  <span>/</span>
                  <span className="text-slate-500">Spatial Proof Inspection</span>
                </div>
              </div>

              {isLoadingEvent || !currentEvent ? (
                <div className="py-20 text-center text-[#5F86A6] text-xs">
                  <div className="animate-spin w-8 h-8 border-2 border-[#243A5E] border-t-transparent rounded-full mx-auto mb-3" />
                  Memuat data rekonsiliasi dan bukti dokumen...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Dual-Pane Layout: 50% Left (Evidence Viewer) / 50% Right (Reconciliation Card) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    <div className="lg:col-span-6 xl:col-span-6 h-[680px]">
                      <EvidenceViewer
                        event={currentEvent}
                        selectedField={selectedField}
                        activeDocumentTab={activeDocTab}
                        onTabChange={setActiveDocTab}
                        onSelectField={setSelectedField}
                      />
                    </div>

                    <div className="lg:col-span-6 xl:col-span-6 h-[680px]">
                      <ReconciliationCard
                        event={currentEvent}
                        onViewProof={handleViewProof}
                        onOpenDecisionModal={(action) => setDecisionModalAction(action)}
                        onOpenDisputePackage={() => setIsDisputePackageOpen(true)}
                      />
                    </div>
                  </div>

                  {/* Audit Trail Timeline */}
                  <AuditTrailView auditTrail={currentEvent.audit_trail} />
                </div>
              )}
            </div>
          )}

          {/* TAB 5: UPLOAD - Document Ingest */}
          {currentTab === "UPLOAD" && <UploadDropzone />}

          {/* TAB 6: CONTRACTS - Fetches from rate_agreements */}
          {currentTab === "CONTRACTS" && <ContractsView />}

          {/* TAB 7: DISPUTES - Targeted query for status=EXCEPTION */}
          {currentTab === "DISPUTES" && (
            <DisputeListView
              onSelectTransaction={handleSelectTransaction}
            />
          )}

          {/* TAB 8: AUDIT - Fetches from audit_events */}
          {currentTab === "AUDIT" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-[#243A5E]">
                  Append-Only Immutable Audit Ledger
                </h2>
                <p className="text-xs text-slate-500">
                  Cryptographically secured audit trail recording every automated check and human reviewer action.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
                {currentEvent ? (
                  <AuditTrailView auditTrail={currentEvent.audit_trail} />
                ) : (
                  <div className="text-center py-12 text-xs text-slate-500">
                    <ShieldCheck className="h-8 w-8 text-[#5F86A6] mx-auto mb-2 opacity-60" />
                    <span>Select an invoice in the Review Queue to inspect its complete immutable audit timeline.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: SETTINGS */}
          {currentTab === "SETTINGS" && <SettingsView />}
        </main>
      </div>

      {/* Decision Confirmation Modal */}
      {currentEvent && (
        <DecisionModal
          isOpen={decisionModalAction !== null}
          action={decisionModalAction}
          event={currentEvent}
          onClose={() => setDecisionModalAction(null)}
          onConfirm={handleConfirmDecision}
        />
      )}

      {/* Dispute Package Modal */}
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
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-xs text-slate-500">
          <div className="animate-spin w-6 h-6 border-2 border-[#243A5E] border-t-transparent rounded-full mr-2" />
          Memuat enterprise dashboard...
        </div>
      }
    >
      <DashboardContent />
    </React.Suspense>
  );
}
