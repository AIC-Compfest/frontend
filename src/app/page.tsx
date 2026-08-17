"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QueueItem, QueueSummary, ShipmentEvent } from "@/types/reconciliation";
import { ReviewQueue } from "@/components/ReviewQueue";
import { EvidenceViewer } from "@/components/EvidenceViewer";
import { ReconciliationCard } from "@/components/ReconciliationCard";
import { DecisionModal } from "@/components/DecisionModal";
import { DisputePackageModal } from "@/components/DisputePackageModal";
import { AuditTrailView } from "@/components/AuditTrailView";

const API_BASE = "http://localhost:8080/api/v1";

export default function Home() {
  const [viewMode, setViewMode] = useState<"QUEUE" | "WORKSPACE">("QUEUE");
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [queueSummary, setQueueSummary] = useState<QueueSummary>({
    total_invoiced_amount: 0,
    total_variance_amount: 0,
    total_invoices_count: 0,
    open_exceptions_count: 0,
    urgent_disputes_count: 0,
    matches_count: 0,
  });
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);

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

  // Fetch Review Queue from Backend API
  const fetchQueue = useCallback(async () => {
    try {
      setIsLoadingQueue(true);
      const res = await fetch(`${API_BASE}/reconcile/queue`);
      if (!res.ok) throw new Error("Failed to fetch queue");
      const data = await res.json();
      setQueueItems(data.items || []);
      setQueueSummary(
        data.summary || {
          total_invoiced_amount: 0,
          total_variance_amount: 0,
          total_invoices_count: 0,
          open_exceptions_count: 0,
          urgent_disputes_count: 0,
          matches_count: 0,
        }
      );
    } catch (err) {
      console.error("Queue fetch error:", err);
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  // Fetch Single Transaction Reconciliation Event
  const fetchEventDetail = useCallback(async (eventId: string) => {
    try {
      setIsLoadingEvent(true);
      const res = await fetch(`${API_BASE}/reconcile/${eventId}`);
      if (!res.ok) throw new Error("Failed to fetch event detail");
      const data = await res.json();
      setCurrentEvent(data);
    } catch (err) {
      console.error("Event detail fetch error:", err);
    } finally {
      setIsLoadingEvent(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function initQueue() {
      try {
        const res = await fetch(`${API_BASE}/reconcile/queue`);
        if (!res.ok) throw new Error("Failed to fetch queue");
        const data = await res.json();
        if (isMounted) {
          setQueueItems(data.items || []);
          setQueueSummary(
            data.summary || {
              total_invoiced_amount: 0,
              total_variance_amount: 0,
              total_invoices_count: 0,
              open_exceptions_count: 0,
              urgent_disputes_count: 0,
              matches_count: 0,
            }
          );
          setIsLoadingQueue(false);
        }
      } catch (err) {
        console.error("Queue fetch error:", err);
        if (isMounted) {
          setIsLoadingQueue(false);
        }
      }
    }
    void initQueue();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Transaction Selection from Queue
  const handleSelectTransaction = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedField(null);
    setActiveDocTab("INVOICE");
    fetchEventDetail(eventId);
    setViewMode("WORKSPACE");
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
    fetchQueue(); // Sync queue status
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Top Enterprise Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#243A5E] text-white border-b border-[#243A5E]/80 shadow-sm px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8FB8D6] text-[#243A5E] flex items-center justify-center font-bold text-sm shadow-xs">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-white">
                  3PL Reconciliation Engine
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#5F86A6]/40 text-[#EDF4FA] border border-[#8FB8D6]/30">
                  PHASE 8
                </span>
              </div>
              <p className="text-[11px] text-[#CFE3F1]">Evidence-First AI Financial Verification System</p>
            </div>
          </div>

          {/* Breadcrumb & Navigation Tabs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-[#243A5E]/80 p-1 rounded-lg border border-[#5F86A6]/40">
              <button
                onClick={() => setViewMode("QUEUE")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-subtle ${
                  viewMode === "QUEUE"
                    ? "bg-[#8FB8D6] text-[#243A5E] shadow-xs"
                    : "text-[#CFE3F1] hover:text-white"
                }`}
              >
                Review Queue ({queueItems.length})
              </button>
              <button
                onClick={() => {
                  if (selectedEventId) setViewMode("WORKSPACE");
                }}
                disabled={!selectedEventId}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-subtle ${
                  viewMode === "WORKSPACE"
                    ? "bg-[#8FB8D6] text-[#243A5E] shadow-xs"
                    : !selectedEventId
                    ? "text-[#5F86A6] cursor-not-allowed opacity-60"
                    : "text-[#CFE3F1] hover:text-white"
                }`}
              >
                Evidence Workspace
              </button>
            </div>

            {/* Reviewer Role Context Badge */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#5F86A6]/30 border border-[#8FB8D6]/30 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-[#EDF4FA] font-medium">AP_MANAGER (Demo Mode)</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {viewMode === "QUEUE" ? (
          <ReviewQueue
            items={queueItems}
            summary={queueSummary}
            selectedEventId={selectedEventId}
            onSelectTransaction={handleSelectTransaction}
            isLoading={isLoadingQueue}
            onRefresh={fetchQueue}
          />
        ) : (
          <div className="flex flex-col gap-5 flex-1">
            {/* Breadcrumb Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#5F86A6]">
                <button
                  onClick={() => setViewMode("QUEUE")}
                  className="font-medium hover:text-[#243A5E] hover:underline"
                >
                  ← Back to Review Queue
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
                {/* Dual-Pane Layout: 45% Left (Evidence Viewer) / 55% Right (Reconciliation Card) */}
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
      </main>

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
