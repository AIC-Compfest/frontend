"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { QueueSummary, ShipmentEvent, QueueItem } from "@/types/reconciliation";
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
import { MitraLogistikView } from "./components/MitraLogistikView";
import { DisputeListView } from "./components/DisputeListView";
import { SettingsView } from "./components/SettingsView";
import { FinalApprovalView } from "./components/FinalApprovalView";
import { ExceptionView } from "./components/ExceptionView";
import { GlobalAuditLedgerView } from "./components/GlobalAuditLedgerView";

import { RotateCw, ShieldCheck, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { API_V1 } from "@/lib/config";
import { getStoredUser } from "@/lib/auth";

const API_BASE = API_V1;

function DashboardContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const eventParam = searchParams.get("event");
  const currentUser = getStoredUser();
  const userRole = currentUser?.role || roleParam || "UNAUTHENTICATED";

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
  const [batchTransactions, setBatchTransactions] = useState<QueueItem[]>([]);
  const [currentEvent, setCurrentEvent] = useState<ShipmentEvent | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);

  // Evidence Viewer Controls - activeDocTab is now a document ID (string UUID)
  const [activeDocTab, setActiveDocTab] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string | null>(null);

  // Modal States
  const [decisionModalAction, setDecisionModalAction] = useState<"APPROVE" | "DISPUTE" | "REJECT" | null>(null);
  const [isDisputePackageOpen, setIsDisputePackageOpen] = useState(false);

  // Fetch KPI Summary from Supabase Review Queue API
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/review-queue");
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
  const handleSelectTransaction = (eventId: string, allBatchItems?: QueueItem[]) => {
    setSelectedEventId(eventId);
    setSelectedField(null);
    setActiveDocTab(""); // Will be auto-set by EvidenceViewer
    if (allBatchItems?.length) setBatchTransactions(allBatchItems);

    // The review queue deliberately contains only a summary projection.  Always
    // load the canonical event so the evidence workspace never invents values.
    fetchEventDetail(eventId);

    setCurrentTab("WORKSPACE");
  };

  useEffect(() => {
    if (eventParam) handleSelectTransaction(eventParam);
  // The deep-link is consumed only when its URL parameter changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventParam]);

  // Handle "View Proof" from Discrepancy Card
  // Note: docTab parameter is for document type, but we now use document IDs as tabs
  // The EvidenceViewer will handle finding the right document of that type
  const handleViewProof = (fieldName: string, docTab: "INVOICE" | "SURAT_JALAN" | "POD" | "RATE_AGREEMENT") => {
    // Leave activeDocTab empty - EvidenceViewer will auto-select the first document on load
    // setActiveDocTab("");
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
        reviewer_id: currentUser?.id,
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
    <div className="min-h-screen bg-[#F7F9FB] text-[#12203A] flex font-sans">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        queueCount={queueSummary.total_invoices_count}
        exceptionCount={queueSummary.open_exceptions_count}
        userRole={userRole}
      />

      {/* 2. Main Content Right Panel */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#F7F9FB]/90 backdrop-blur-xl border-b border-[#CDDBE8] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-extrabold text-[#243A5E] tracking-tight">
              {currentTab === "OVERVIEW" && "Overview & Risk Analytics"}
              {currentTab === "QUEUE" && "Priority Review Queue (Anomali)"}
              {currentTab === "EXCEPTIONS" && "Arsip Dokumen Anomali & Ditolak"}
              {currentTab === "WORKSPACE" && "Dual-Pane Evidence Workspace"}
              {currentTab === "FINAL_APPROVAL" && "Executive Final Approval (SoD)"}
              {currentTab === "UPLOAD" && "Document Ingest Dropzone"}
              {currentTab === "CONTRACTS" && "Mitra Logistik (3PL)"}
              {currentTab === "DISPUTES" && "Official 3PL Dispute Packages"}
              {currentTab === "AUDIT" && "Immutable Audit Trail Ledger"}
              {currentTab === "SETTINGS" && "Policy & Tolerance Thresholds"}
            </h1>
            {/* <Badge variant="outline" className="rounded-full border-[#00B4B3]/30 bg-[#DFF5F4] text-[10px] font-mono text-[#007A78]">
              Workspace connected
            </Badge> */}
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
              <span>{userRole}</span>
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
              onNavigateToFinalApproval={() => setCurrentTab("FINAL_APPROVAL")}
            />
          )}

          {/* TAB 2.5: EXCEPTIONS - Archive of anomali / rejected / duplicate docs */}
          {currentTab === "EXCEPTIONS" && (
            <ExceptionView
              onSelectTransaction={handleSelectTransaction}
            />
          )}

          {/* TAB 3: FINAL APPROVAL (SoD) - Targeted queries: status=MATCH (Pending) & status=APPROVED (History) */}
          {currentTab === "FINAL_APPROVAL" && (
            <FinalApprovalView
              onSelectTransaction={handleSelectTransaction}
              onRefresh={fetchSummary}
              onNavigateToAudit={() => setCurrentTab("AUDIT")}
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

              {/* All Transactions in this Batch - Dynamic Selector */}
              {batchTransactions.length > 0 && (
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-amber-500" />
                      <span>Transaksi dalam Batch Ini ({batchTransactions.length} Tagihan)</span>
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      Pilih transaksi untuk memeriksa bukti &amp; perhitungan matematis
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {batchTransactions.map((tx) => {
                      const isActive =
                        (selectedEventId || currentEvent?.event_id) === tx.event_id;
                      return (
                        <button
                          key={tx.event_id}
                          type="button"
                          onClick={() =>
                            handleSelectTransaction(tx.event_id, batchTransactions)
                          }
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border text-left",
                            isActive
                              ? "bg-[#243A5E] text-white border-[#243A5E] shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          <span className="font-mono font-extrabold">{tx.invoice_number}</span>
                          <span
                            className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider",
                              tx.highest_severity === "CRITICAL"
                                ? "bg-rose-600 text-white"
                                : tx.highest_severity === "HIGH"
                                ? "bg-orange-500 text-white"
                                : tx.highest_severity === "MEDIUM"
                                ? "bg-amber-400 text-slate-900"
                                : "bg-emerald-600 text-white"
                            )}
                          >
                            {tx.highest_severity || "LOW"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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

          {/* TAB 6: MITRA LOGISTIK - Master vendor & PKS matrix */}
          {currentTab === "CONTRACTS" && <MitraLogistikView />}

          {/* TAB 7: DISPUTES - Targeted query for status=DISPUTED */}
          {currentTab === "DISPUTES" && (
            <DisputeListView
              onSelectTransaction={handleSelectTransaction}
            />
          )}

          {/* TAB 8: AUDIT - Global Immutable Audit Trail Ledger */}
          {currentTab === "AUDIT" && (
            <GlobalAuditLedgerView
              onSelectTransaction={handleSelectTransaction}
            />
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
