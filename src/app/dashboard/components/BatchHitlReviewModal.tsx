"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Circle, Loader2, ShieldCheck, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentProfile, finalizeDocumentBatch, getDocumentProfile, reprocessDocument, reviewDocumentField } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { FIELD_REGISTRY, type DocumentType } from "@/lib/field_registry.gen";
import { asTablePayload, displayValue, hasSuggestion } from "@/lib/review";
import { TablePayloadView } from "./TablePayloadView";
import { API_V1 } from "@/lib/config";
import { cn } from "@/lib/utils";
import { btnOutline, btnPrimary, chip, focusRing, inputClass, textareaClass, th } from "@/lib/dashboard-ui";
import { DocumentPageView, OverlayBox } from "@/components/evidence/DocumentPageView";

interface Props {
  documentIds: string[];
  onClose: () => void;
  onFinalized: (eventId: string) => void;
}

const decisionFor = (profile: DocumentProfile, predictionId: string) =>
  profile.decisions.find((decision) => decision.prediction_id === predictionId);

const isMissingPrediction = (prediction: DocumentProfile["predictions"][number]) =>
  !hasSuggestion(prediction.predicted_value, prediction.predicted_raw_text);

const hasMalformedScalar = (profile: DocumentProfile) => profile.predictions.some((prediction) =>
  prediction.registry_visible !== false && typeof prediction.predicted_value === "string" &&
  (prediction.predicted_value.length > 160 || /[\r\n]/.test(prediction.predicted_value))
);

/**
 * BatchHitlReviewModal (live modal; previously BatchHitlReviewModal_Compact)
 *
 * Layout: PDF (left) | field table (right)
 * Only documents from ONE ingest batch (ingest_batch_id) are shown.
 * One tab per document inside that batch.
 */
export function BatchHitlReviewModal({ documentIds, onClose, onFinalized }: Props) {
  const [profiles, setProfiles] = useState<DocumentProfile[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [reprocessing, setReprocessing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);

  // Load the first document to find the batch ID, then load and filter the whole batch.
  // This keeps documents from other batches out of the modal.
  useEffect(() => {
    let mounted = true;
    if (!documentIds || documentIds.length === 0) {
      setError("No documents to audit");
      setLoading(false);
      return;
    }

    getDocumentProfile(documentIds[0])
      .then((firstProfile) => {
        if (!mounted) return;

        const batchId = firstProfile.document.ingest_batch_id;
        if (!batchId) {
          setError("Document has no batch ID");
          setLoading(false);
          return;
        }

        const docsInBatch = documentIds;

        Promise.all(docsInBatch.map(getDocumentProfile))
          .then((allProfiles) => {
            if (!mounted) return;

            // Keep only documents from the same batch
            const filtered = allProfiles.filter(
              (p) => p.document.ingest_batch_id === batchId
            );

            setProfiles(filtered);
            setActiveDocId(filtered[0]?.document.id || "");
          })
          .catch((reason: unknown) =>
            mounted && setError(reason instanceof Error ? reason.message : "Failed to load document profile")
          )
          .finally(() => mounted && setLoading(false));
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setError(reason instanceof Error ? reason.message : "Audit profile could not be loaded");
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [documentIds]);

  // profiles already holds only the documents of one batch
  const currentBatchId = profiles[0]?.document.ingest_batch_id;
  const documentsInCurrentBatch = profiles;

  const active = documentsInCurrentBatch.find((p) => p.document.id === activeDocId);

  // Create overlay boxes from evidence data
  const overlayBoxes: OverlayBox[] = useMemo(() => {
    if (!active) return [];
    
    const boxes: OverlayBox[] = [];
    for (const ev of active.evidence) {
      if (ev.bbox_x1 == null || ev.bbox_y1 == null || ev.bbox_x2 == null || ev.bbox_y2 == null) continue;
      
      const isHighlighted = highlightedField === ev.field_name;
      boxes.push({
        id: ev.id,
        page: ev.page_number,
        x1: ev.bbox_x1,
        y1: ev.bbox_y1,
        x2: ev.bbox_x2,
        y2: ev.bbox_y2,
        tone: isHighlighted ? "selected" : "default",
        title: `${ev.field_name}: ${ev.field_value}`,
      });
    }
    
    return boxes;
  }, [active, highlightedField]);

  const pending = (profile: DocumentProfile) => profile.predictions.filter(
    (prediction) => decisionFor(profile, prediction.id)?.decision_status === "PENDING_REVIEW" && visiblePredictions(profile).some((item) => item.id === prediction.id)
  );

  const visiblePredictions = (profile: DocumentProfile) => {
    const documentType = (profile.segments[0]?.document_type || profile.document.classification || "UNKNOWN") as DocumentType;
    const fields = FIELD_REGISTRY[documentType] ?? [];
    const order = new Map(fields.map((field, index) => [field.name, index]));
    return profile.predictions.filter((prediction) => prediction.registry_visible !== false && order.has(prediction.field_name))
      .sort((a, b) => order.get(a.field_name)! - order.get(b.field_name)!);
  };

  const allApproved = useMemo(() => {
    if (documentsInCurrentBatch.length === 0) return false;
    return documentsInCurrentBatch.every((profile) => {
      if (profile.predictions.length === 0) return false;
      if (pending(profile).length > 0) return false;
      if (hasMalformedScalar(profile)) return false;
      const docType = profile.segments[0]?.document_type || profile.document.classification;
      if (!docType || docType === "UNKNOWN") return false;
      const hasApprovedOrCorrected = profile.predictions.some((pred) => {
        if (pred.registry_visible === false) return false;
        const decision = profile.decisions.find((d) => d.prediction_id === pred.id);
        return decision && (decision.decision_status === "APPROVED" || decision.decision_status === "CORRECTED");
      });
      return hasApprovedOrCorrected;
    });
  }, [documentsInCurrentBatch]);

  const apply = async (profile: DocumentProfile, predictionId: string, action: "ACCEPT_PREDICTION" | "CORRECT_VALUE") => {
    setSaving(predictionId);
    setError(null);
    try {
      const prediction = profile.predictions.find((item) => item.id === predictionId);
      let reviewedValue: unknown;
      if (action === "CORRECT_VALUE") {
        const table = asTablePayload(prediction?.predicted_value);
        if (table) {
          const rows = JSON.parse(corrections[predictionId] || "[]") as unknown;
          if (!Array.isArray(rows) || rows.some((row) => !Array.isArray(row) || row.length !== (table.headers ?? []).length)) {
            throw new Error("Each table row must have the same number of cells as the header.");
          }
          reviewedValue = { ...table, rows: rows.map((cells, index) => ({ index: index + 1, cells })) };
        } else {
          reviewedValue = corrections[predictionId]?.trim();
        }
      }
      const updated = await reviewDocumentField(profile.document.id, {
        prediction_id: predictionId,
        action,
        reviewed_value: reviewedValue,
        // Audit reason text sent to the backend. The Indonesian wording is kept on purpose: request bodies are out of scope for the translation pass.
        reason: action === "CORRECT_VALUE" ? "Koreksi auditor pada audit batch HITL" : "Disetujui auditor pada audit batch HITL",
        reviewer_external_id: getStoredUser()?.id,
      });
      setProfiles((items) => items.map((item) => item.document.id === updated.document.id ? updated : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Decision was not saved");
    } finally {
      setSaving(null);
    }
  };

  const isMissing = isMissingPrediction;

  const approveDocument = async (profile: DocumentProfile) => {
    for (const prediction of pending(profile).filter((item) => !isMissing(item))) {
      await apply(profile, prediction.id, "ACCEPT_PREDICTION");
    }
  };

  const finalize = async () => {
    const batchId = currentBatchId;
    if (!batchId) {
      setError("Batch ID not found.");
      return;
    }

    const validationErrors: string[] = [];
    documentsInCurrentBatch.forEach((profile, index) => {
      const docNum = index + 1;
      if (profile.predictions.length === 0) {
        validationErrors.push(`Document ${docNum}: No extraction yet`);
      }
      if (pending(profile).length > 0) {
        validationErrors.push(`Document ${docNum}: ${pending(profile).length} fields pending`);
      }
      if (hasMalformedScalar(profile)) {
        validationErrors.push(`Document ${docNum}: Invalid value`);
      }
    });

    if (validationErrors.length > 0) {
      setError(`Finalization cannot be completed:\n${validationErrors.join("\n")}`);
      return;
    }

    setFinalizing(true);
    setError(null);
    try {
      const event = await finalizeDocumentBatch(batchId);
      onFinalized(event.event_id);
    } catch (reason) {
      const errorMsg = reason instanceof Error ? reason.message : "Finalization failed";
      setError(errorMsg);
    } finally {
      setFinalizing(false);
    }
  };

  const reprocess = async () => {
    if (!active) return;
    setReprocessing(true);
    setError(null);
    try {
      await reprocessDocument(active.document.id);
      const refreshed = await getDocumentProfile(active.document.id);
      setProfiles((items) => items.map((item) => item.document.id === refreshed.document.id ? refreshed : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Re-extraction failed");
    } finally {
      setReprocessing(false);
    }
  };

  const issuesFor = (profile: DocumentProfile) => {
    const issues: string[] = [];
    if (profile.predictions.length === 0) issues.push("No extraction yet");
    if (pending(profile).length > 0) issues.push(`${pending(profile).length} fields pending`);
    if (hasMalformedScalar(profile)) issues.push("Invalid value");
    return issues;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-2" role="dialog" aria-modal="true" aria-labelledby="batch-review-title">
      <div className="flex max-h-[96vh] w-screen max-w-[1920px] flex-col overflow-hidden rounded-card border border-hairline bg-card shadow-drawer">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-4">
          <div>
            <h2 id="batch-review-title" className="flex items-center gap-2 font-sans text-[16px] font-semibold text-ink">
              <ShieldCheck className="h-5 w-5 text-navy" strokeWidth={1.75} aria-hidden="true" />
              Document mapping audit
            </h2>
            <p className="mt-0.5 text-[12px] tabular-nums text-body">
              Batch {currentBatchId?.substring(0, 8)} · {documentsInCurrentBatch.length} documents
            </p>
          </div>
          <span className={chip(allApproved ? "success" : "warning", "text-xs")}>
            {allApproved ? "Approved" : `${documentsInCurrentBatch.filter((p) => pending(p).length > 0).length} pending`}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center text-[13px] text-body">
            <Loader2 className="h-6 w-6 animate-spin text-navy" strokeWidth={1.75} aria-hidden="true" />
            Loading {documentIds.length} documents...
          </div>
        ) : error && !active ? (
          <div role="alert" className="m-5 flex items-center gap-2 rounded-control border border-error/40 bg-error-soft p-4 text-[13px] text-error-ink">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* Document tabs: one per document in this batch */}
            <div role="tablist" className="flex gap-2 overflow-x-auto border-b border-hairline px-6 pb-1 pt-2">
              {documentsInCurrentBatch.map((profile) => {
                const isActive = activeDocId === profile.document.id;
                const count = pending(profile).length;
                return (
                  <button
                    key={profile.document.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveDocId(profile.document.id)}
                    className={cn(
                      "cursor-pointer whitespace-nowrap border-b-2 px-3 pb-2 text-[12px] font-semibold transition-colors",
                      isActive ? "border-navy text-navy" : "border-transparent text-body hover:text-ink",
                      focusRing
                    )}
                  >
                    {profile.document.filename}
                    {count > 0 ? ` (${count})` : ""}
                  </button>
                );
              })}
            </div>

            {/* Main content: document (left) and field table (right) */}
            {active && (
              <div className="flex min-h-0 flex-1 overflow-hidden">
                {/* Left: original document with bounding boxes */}
                <div className="w-5/12 flex flex-col border-r border-hairline bg-surface-soft">
                  {/* Zoom and page controls */}
                  <div className="flex items-center justify-between gap-2 border-b border-hairline bg-card px-3 py-2">
                    <div className="flex items-center gap-1 rounded-control border border-hairline bg-card px-1.5 py-0.5">
                      <button
                        type="button"
                        aria-label="Previous page"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-pop text-body transition-colors hover:bg-surface-soft hover:text-ink disabled:pointer-events-none disabled:opacity-40",
                          focusRing
                        )}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      </button>
                      <span className="w-14 text-center text-[11px] font-semibold tabular-nums text-ink">
                        {currentPage}/{pageCount}
                      </span>
                      <button
                        type="button"
                        aria-label="Next page"
                        disabled={currentPage >= pageCount}
                        onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-pop text-body transition-colors hover:bg-surface-soft hover:text-ink disabled:pointer-events-none disabled:opacity-40",
                          focusRing
                        )}
                      >
                        <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-1 rounded-control border border-hairline bg-card px-1.5 py-0.5">
                      <button
                        type="button"
                        aria-label="Zoom out"
                        onClick={() => setZoom((z) => Math.max(z - 15, 60))}
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-pop text-body transition-colors hover:bg-surface-soft hover:text-ink",
                          focusRing
                        )}
                      >
                        <ZoomOut className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      </button>
                      <span className="w-10 text-center text-[11px] font-semibold tabular-nums text-ink">{zoom}%</span>
                      <button
                        type="button"
                        aria-label="Zoom in"
                        onClick={() => setZoom((z) => Math.min(z + 15, 240))}
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-pop text-body transition-colors hover:bg-surface-soft hover:text-ink",
                          focusRing
                        )}
                      >
                        <ZoomIn className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoom(100)}
                        className={cn("h-6 rounded-pop px-1.5 text-[11px] font-semibold text-body hover:bg-surface-soft hover:text-ink", focusRing)}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  
                  {/* Document viewer with bbox overlays */}
                  <div className="flex-1 overflow-hidden">
                    <DocumentPageView
                      fileUrl={`${API_V1}/documents/${active.document.id}/download`}
                      page={currentPage}
                      zoom={zoom}
                      boxes={overlayBoxes}
                      onPageCount={setPageCount}
                      onBoxClick={(id) => {
                        const evidence = active.evidence.find((ev) => ev.id === id);
                        if (evidence) {
                          setHighlightedField(evidence.field_name);
                          setCurrentPage(evidence.page_number);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Right: field table */}
                <div className="flex w-7/12 flex-col overflow-y-auto p-5">
                  <div className="mb-4 border-b border-hairline pb-4">
                    <p className="text-[14px] font-semibold text-ink">{active?.document.filename}</p>
                    <div className="mt-1 flex items-center gap-4 text-[12px] text-body">
                      <span>{active?.segments[0]?.document_type || active?.document.classification}</span>
                      <span aria-hidden="true">•</span>
                      <span className="tabular-nums">{active?.predictions.length} fields</span>
                    </div>
                    {active && hasMalformedScalar(active) && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-warning-ink">
                        <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        Invalid value
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {active && (hasMalformedScalar(active) || pending(active).some(isMissing)) && (
                        <Button type="button" variant="outline" disabled={reprocessing} onClick={reprocess} className={cn(btnOutline, "h-8 px-3 text-[12px]")}>
                          {reprocessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" /> : "Re-run AI"}
                        </Button>
                      )}
                      <Button
                        type="button"
                        disabled={saving !== null || !active || pending(active).length === 0}
                        onClick={() => active && approveDocument(active)}
                        className={cn(btnPrimary, "h-8 px-3 text-[12px]")}
                      >
                        <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                        Approve available fields
                      </Button>
                    </div>
                  </div>

                  {/* Field table */}
                  {visiblePredictions(active).length === 0 ? (
                    <div className="flex items-center justify-between gap-3 rounded-control border border-warning/40 bg-warning-soft p-4 text-[13px] text-warning-ink">
                      <span>No mapping yet. Re-run extraction.</span>
                      <Button type="button" variant="outline" disabled={reprocessing} onClick={reprocess} className={cn(btnOutline, "h-8 px-3 text-[12px]")}>
                        {reprocessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" /> : "Retry"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-x-auto">
                      <table className="w-full min-w-[750px] border border-hairline text-left text-[12px]">
                        <thead className="sticky top-0">
                          <tr>
                            <th className={th}>Field</th>
                            <th className={th}>Mapped value</th>
                            <th className={th}>Confidence</th>
                            <th className={cn(th, "text-right")}>Audit action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visiblePredictions(active).map((prediction) => {
                            const decision = decisionFor(active, prediction.id);
                            const isPending = decision?.decision_status === "PENDING_REVIEW";
                            const busy = saving === prediction.id;
                            const confidence = typeof prediction.score === "number" ? `${(prediction.score * 100).toFixed(1)}%` : "N/A";
                            const missingValue = isMissing(prediction);
                            const table = asTablePayload(prediction.predicted_value);
                            const valueText = displayValue(prediction.predicted_value, prediction.predicted_raw_text);
                            const sourceRawText = typeof prediction.decoder_metadata?.source_raw_text === "string"
                              ? prediction.decoder_metadata.source_raw_text
                              : prediction.predicted_raw_text;

                            return (
                              <tr 
                                key={prediction.id} 
                                className={cn(
                                  "border-b border-hairline align-top last:border-b-0 hover:bg-surface-soft cursor-pointer transition-colors",
                                  highlightedField === prediction.field_name && "bg-action/10"
                                )}
                                onClick={() => {
                                  setHighlightedField(prediction.field_name);
                                  // Find the evidence for this field and jump to its page
                                  const evidence = active.evidence.find((ev) => ev.field_name === prediction.field_name);
                                  if (evidence) {
                                    setCurrentPage(evidence.page_number);
                                  }
                                }}
                              >
                                <td className="px-4 py-3 font-semibold text-ink">{prediction.field_name}</td>

                                <td className="px-4 py-3 text-ink">
                                  {table ? (
                                    <TablePayloadView payload={table} />
                                  ) : (
                                    <div>
                                      <p className={missingValue ? "font-medium text-warning-ink" : ""}>
                                        {missingValue ? "No candidate, enter a correction" : valueText}
                                      </p>
                                      {sourceRawText && (
                                        <details className="mt-2 text-[12px] text-body">
                                          <summary className="cursor-pointer">Source snippet</summary>
                                          <p className="mt-1 whitespace-pre-wrap font-mono text-[10px]">{sourceRawText}</p>
                                        </details>
                                      )}
                                    </div>
                                  )}
                                </td>

                                <td className="px-4 py-3 tabular-nums text-body">{confidence}</td>

                                <td className="px-4 py-3 text-right">
                                  {isPending ? (
                                    <div className="flex items-center justify-end gap-2">
                                      {table ? (
                                        <textarea
                                          value={corrections[prediction.id] ?? JSON.stringify(table.rows.map((row) => row.cells ?? []), null, 2)}
                                          onChange={(event) => setCorrections((values) => ({
                                            ...values,
                                            [prediction.id]: event.target.value
                                          }))}
                                          placeholder="JSON"
                                          className={cn(textareaClass, "h-20 w-40 p-2 text-[12px]")}
                                        />
                                      ) : (
                                        <input
                                          value={corrections[prediction.id] || ""}
                                          onChange={(event) => setCorrections((values) => ({
                                            ...values,
                                            [prediction.id]: event.target.value
                                          }))}
                                          placeholder="Correction"
                                          aria-label={`Correction for ${prediction.field_name}`}
                                          className={cn(inputClass, "h-9 w-32 px-3 text-[12px]")}
                                        />
                                      )}
                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          disabled={busy || missingValue}
                                          onClick={() => apply(active, prediction.id, "ACCEPT_PREDICTION")}
                                          className={cn(btnPrimary, "h-9 px-3 text-[12px]")}
                                        >
                                          Accept
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          disabled={busy || !corrections[prediction.id]?.trim()}
                                          onClick={() => apply(active, prediction.id, "CORRECT_VALUE")}
                                          className={cn(btnOutline, "h-9 px-3 text-[12px]")}
                                        >
                                          Correct
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className={chip(decision?.decision_status === "APPROVED" ? "success" : "neutral")}>
                                      {decision?.decision_status === "APPROVED" ? (
                                        <>
                                          <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                                          Approved
                                        </>
                                      ) : (
                                        decision?.decision_status ?? "N/A"
                                      )}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-hairline bg-surface-soft/60 px-6 py-4">
          <div className="flex-1">
            {!allApproved && documentsInCurrentBatch.length > 0 && (
              <ul className="space-y-1 text-[13px] text-body">
                {documentsInCurrentBatch.map((profile) => {
                  const issues = issuesFor(profile);
                  const ready = issues.length === 0;
                  return (
                    <li key={profile.document.id} className={cn("flex items-center gap-2", ready ? "text-teal-ink" : "text-warning-ink")}>
                      {ready ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      )}
                      <span>
                        {profile.document.filename}: {ready ? "Ready" : issues.join(", ")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <Button type="button" variant="outline" onClick={onClose} className={cn(btnOutline, "h-9 px-4 text-[13px]")}>
            Save &amp; continue later
          </Button>
          <Button
            type="button"
            disabled={!allApproved || finalizing}
            onClick={finalize}
            className={cn(btnPrimary, "h-9 px-4 text-[13px]", focusRing)}
          >
            {finalizing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                Validating...
              </>
            ) : (
              "Finalize & open review"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
