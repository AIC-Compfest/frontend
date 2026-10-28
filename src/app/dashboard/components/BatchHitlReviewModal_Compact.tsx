"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentProfile, finalizeDocumentBatch, getDocumentProfile, reprocessDocument, reviewDocumentField } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { FIELD_REGISTRY, type DocumentType } from "@/lib/field_registry.gen";
import { asTablePayload, displayValue, hasSuggestion, needsManualCheck } from "@/lib/review";
import { TablePayloadView } from "./TablePayloadView";
import { API_V1 } from "@/lib/config";

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
 * BatchHitlReviewModal_Compact
 * 
 * Layout: PDF (Kiri) | Tabel (Kanan)
 * PENTING: Hanya tampilkan dokumen dari SATU BATCH yang sama (ingest_batch_id)
 * Tab = 1 tab per dokumen DALAM batch tersebut
 * Contoh: 1 batch dengan 2 PDF → tampilkan 2 tab
 */
export function BatchHitlReviewModal_Compact({ documentIds, onClose, onFinalized }: Props) {
  const [profiles, setProfiles] = useState<DocumentProfile[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [reprocessing, setReprocessing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<Record<string, string>>({});

  // ========== CRITICAL FIX ==========
  // Load ONLY the first document to determine the batch ID
  // This prevents loading all documents from all batches
  useEffect(() => {
    let mounted = true;
    if (!documentIds || documentIds.length === 0) {
      setError("Tidak ada dokumen untuk di-audit");
      setLoading(false);
      return;
    }

    // Load ONLY the first document to get its batch ID
    getDocumentProfile(documentIds[0])
      .then((firstProfile) => {
        if (!mounted) return;

        // Get the batch ID from the first document
        const batchId = firstProfile.document.ingest_batch_id;
        if (!batchId) {
          setError("Dokumen tidak memiliki batch ID");
          setLoading(false);
          return;
        }

        // Load ONLY documents that belong to this batch
        const docsInBatch = documentIds.filter((docId) => {
          // We need to load each doc to check its batch ID
          // But we'll do this in parallel for efficiency
          return true; // We'll filter after loading all
        });

        // Load all document profiles for the batch
        Promise.all(docsInBatch.map(getDocumentProfile))
          .then((allProfiles) => {
            if (!mounted) return;

            // FILTER: Keep ONLY documents from the same batch
            const filtered = allProfiles.filter(
              (p) => p.document.ingest_batch_id === batchId
            );

            setProfiles(filtered);
            setActiveDocId(filtered[0]?.document.id || "");
          })
          .catch((reason: unknown) =>
            mounted && setError(reason instanceof Error ? reason.message : "Gagal memuat profil dokumen")
          )
          .finally(() => mounted && setLoading(false));
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setError(reason instanceof Error ? reason.message : "Profil audit tidak dapat dimuat");
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [documentIds]);

  // Use profiles directly (already filtered by batch)
  const currentBatchId = profiles[0]?.document.ingest_batch_id;
  const documentsInCurrentBatch = profiles; // Already filtered!

  const active = documentsInCurrentBatch.find((p) => p.document.id === activeDocId);
  
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
            throw new Error("Setiap baris tabel harus memiliki jumlah sel yang sama dengan header.");
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
        reason: action === "CORRECT_VALUE" ? "Koreksi auditor pada audit batch HITL" : "Disetujui auditor pada audit batch HITL",
        reviewer_external_id: getStoredUser()?.id,
      });
      setProfiles((items) => items.map((item) => item.document.id === updated.document.id ? updated : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Keputusan tidak tersimpan");
    } finally {
      setSaving(null);
    }
  };

  const approveDocument = async (profile: DocumentProfile) => {
    for (const prediction of pending(profile).filter((item) => !isMissingPrediction(item))) {
      await apply(profile, prediction.id, "ACCEPT_PREDICTION");
    }
  };

  const finalize = async () => {
    const batchId = currentBatchId;
    if (!batchId) {
      setError("Batch ID tidak ditemukan.");
      return;
    }

    const validationErrors: string[] = [];
    documentsInCurrentBatch.forEach((profile, index) => {
      const docNum = index + 1;
      if (profile.predictions.length === 0) {
        validationErrors.push(`Dokumen ${docNum}: Belum ada ekstraksi`);
      }
      if (pending(profile).length > 0) {
        validationErrors.push(`Dokumen ${docNum}: ${pending(profile).length} field pending`);
      }
      if (hasMalformedScalar(profile)) {
        validationErrors.push(`Dokumen ${docNum}: Nilai tidak valid`);
      }
    });

    if (validationErrors.length > 0) {
      setError(`Finalisasi tidak dapat dilakukan:\n${validationErrors.join("\n")}`);
      return;
    }

    setFinalizing(true);
    setError(null);
    try {
      const event = await finalizeDocumentBatch(batchId);
      onFinalized(event.event_id);
    } catch (reason) {
      const errorMsg = reason instanceof Error ? reason.message : "Finalisasi gagal";
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
      setError(reason instanceof Error ? reason.message : "Ekstraksi ulang gagal");
    } finally {
      setReprocessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2" role="dialog" aria-modal="true">
      <div className="flex max-h-[96vh] w-screen max-w-[1920px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-[#1B2A4A]">
              <ShieldCheck className="h-5 w-5 text-sky-600" />
              Audit mapping dokumen
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Batch {currentBatchId?.substring(0, 8)} · {documentsInCurrentBatch.length} dokumen
            </p>
          </div>
          <Badge variant={allApproved ? "success" : "warning"} className="text-xs px-2 py-0.5">
            {allApproved ? "Approved" : `${documentsInCurrentBatch.filter((p) => pending(p).length > 0).length} pending`}
          </Badge>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-slate-500">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
            Memuat {documentIds.length} dokumen...
          </div>
        ) : error && !active ? (
          <div className="m-5 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            {error}
          </div>
        ) : (
          <>
            {/* Tab Navigation - 1 tab per dokumen DALAM batch yang sama */}
            <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-6 pt-2 pb-1">
              {documentsInCurrentBatch.map((profile) => (
                <button
                  key={profile.document.id}
                  onClick={() => setActiveDocId(profile.document.id)}
                  className={`border-b-2 px-3 pb-2 text-xs font-bold transition-colors whitespace-nowrap ${
                    activeDocId === profile.document.id
                      ? "border-sky-600 text-sky-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {profile.document.filename}
                  {pending(profile).length > 0 ? ` (${pending(profile).length})` : ""}
                </button>
              ))}
            </div>

            {/* Main Content: PDF (Left) + Table (Right) */}
            {active && (
              <div className="min-h-0 flex-1 overflow-hidden flex">
                
                {/* LEFT SIDE: PDF/IMAGE - EMBEDDED (NO BUTTON!) */}
                <div className="w-5/12 border-r border-slate-200 bg-slate-100 p-4 overflow-y-auto">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
                    <iframe
                      src={`${API_V1}/documents/${active.document.id}/download`}
                      className="w-full h-full"
                      title={`Document: ${active.document.filename}`}
                    />
                  </div>
                </div>

                {/* RIGHT SIDE: FIELD TABLE */}
                <div className="w-7/12 overflow-y-auto p-5 flex flex-col">
                  {/* Document Info */}
                  <div className="mb-4 pb-4 border-b border-slate-200">
                    <p className="text-sm font-bold text-slate-800">{active?.document.filename}</p>
                    <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                      <span>{active?.segments[0]?.document_type || active?.document.classification}</span>
                      <span>•</span>
                      <span>{active?.predictions.length} field</span>
                    </div>
                    {active && hasMalformedScalar(active) && (
                      <p className="mt-1.5 text-xs font-medium text-amber-700">⚠️ Nilai tidak valid</p>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
                      {active && (hasMalformedScalar(active) || pending(active).some(isMissingPrediction)) && (
                        <Button size="sm" variant="outline" disabled={reprocessing} onClick={reprocess} className="h-8 text-xs px-3">
                          {reprocessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Jalankan ulang AI"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={saving !== null || !active || pending(active).length === 0}
                        onClick={() => active && approveDocument(active)}
                        className="bg-emerald-700 hover:bg-emerald-800 h-8 text-xs px-3"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Setujui field tersedia
                      </Button>
                    </div>
                  </div>

                  {/* Field Table */}
                  {visiblePredictions(active).length === 0 ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                      <span>Belum ada mapping. Jalankan ekstraksi ulang.</span>
                      <Button size="sm" variant="outline" disabled={reprocessing} onClick={reprocess} className="h-8 text-xs">
                        {reprocessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ulang"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-x-auto">
                      <table className="w-full min-w-[750px] text-left text-xs border border-slate-200 rounded-lg">
                        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0">
                          <tr>
                            <th className="px-4 py-3">FIELD</th>
                            <th className="px-4 py-3">NILAI HASIL MAPPING</th>
                            <th className="px-4 py-3">CONFIDENCE</th>
                            <th className="px-4 py-3 text-right">AKSI AUDIT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {visiblePredictions(active).map((prediction) => {
                            const decision = decisionFor(active, prediction.id);
                            const isPending = decision?.decision_status === "PENDING_REVIEW";
                            const busy = saving === prediction.id;
                            const confidence = typeof prediction.score === "number" ? `${(prediction.score * 100).toFixed(1)}%` : "—";
                            const missingValue = isMissingPrediction(prediction);
                            const table = asTablePayload(prediction.predicted_value);
                            const valueText = displayValue(prediction.predicted_value, prediction.predicted_raw_text);
                            const sourceRawText = typeof prediction.decoder_metadata?.source_raw_text === "string" 
                              ? prediction.decoder_metadata.source_raw_text 
                              : prediction.predicted_raw_text;

                            return (
                              <tr key={prediction.id} className="hover:bg-slate-50 align-top">
                                {/* Field Name */}
                                <td className="px-4 py-3 font-bold text-slate-800">
                                  {prediction.field_name}
                                </td>

                                {/* Value */}
                                <td className="px-4 py-3 text-slate-900">
                                  {table ? (
                                    <TablePayloadView payload={table} />
                                  ) : (
                                    <div>
                                      <p className={missingValue ? "text-amber-700 font-medium" : ""}>
                                        {missingValue ? "Tidak ada kandidat — isi koreksi" : valueText}
                                      </p>
                                      {sourceRawText && (
                                        <details className="mt-2 text-xs text-slate-500">
                                          <summary className="cursor-pointer">Cuplikan sumber</summary>
                                          <p className="mt-1 whitespace-pre-wrap font-mono text-[10px]">{sourceRawText}</p>
                                        </details>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Confidence */}
                                <td className="px-4 py-3 font-mono text-slate-700">
                                  {confidence}
                                </td>

                                {/* Action */}
                                <td className="px-4 py-3 text-right">
                                  {isPending ? (
                                    <div className="flex justify-end gap-2 items-center">
                                      {table ? (
                                        <textarea
                                          value={corrections[prediction.id] ?? JSON.stringify(table.rows.map((row) => row.cells ?? []), null, 2)}
                                          onChange={(event) => setCorrections((values) => ({ 
                                            ...values, 
                                            [prediction.id]: event.target.value 
                                          }))}
                                          placeholder="JSON"
                                          className="h-20 w-40 text-xs rounded border border-slate-300 p-2"
                                        />
                                      ) : (
                                        <input
                                          value={corrections[prediction.id] || ""}
                                          onChange={(event) => setCorrections((values) => ({ 
                                            ...values, 
                                            [prediction.id]: event.target.value 
                                          }))}
                                          placeholder="Koreksi"
                                          className="h-9 w-32 text-xs rounded border border-slate-300 px-3"
                                        />
                                      )}
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          disabled={busy || missingValue}
                                          onClick={() => apply(active, prediction.id, "ACCEPT_PREDICTION")}
                                          className="text-xs h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                          Terima
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={busy || !corrections[prediction.id]?.trim()}
                                          onClick={() => apply(active, prediction.id, "CORRECT_VALUE")}
                                          className="text-xs h-9 px-3"
                                        >
                                          Koreksi
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Badge variant={decision?.decision_status === "APPROVED" ? "success" : "default"} className="text-xs">
                                      {decision?.decision_status === "APPROVED" ? "✓ Approved" : "—"}
                                    </Badge>
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
        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex-1">
            {!allApproved && documentsInCurrentBatch.length > 0 && (
              <div className="text-sm text-slate-600 space-y-1">
                {documentsInCurrentBatch.map((profile) => {
                  const issues = [];
                  if (profile.predictions.length === 0) issues.push("Belum ada ekstraksi");
                  if (pending(profile).length > 0) issues.push(`${pending(profile).length} field pending`);
                  if (hasMalformedScalar(profile)) issues.push("Nilai tidak valid");
                  
                  return (
                    <p key={profile.document.id} className={issues.length === 0 ? "text-emerald-700" : "text-amber-700"}>
                      {issues.length === 0 ? "✓" : "○"} {profile.document.filename}: {issues.length === 0 ? "Ready" : issues.join(", ")}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
          <Button variant="outline" onClick={onClose} size="sm" className="text-sm px-4 h-9">
            Simpan & lanjutkan nanti
          </Button>
          <Button
            disabled={!allApproved || finalizing}
            onClick={finalize}
            size="sm"
            className="text-sm px-4 h-9"
          >
            {finalizing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validasi...
              </>
            ) : (
              "Finalisasi & buka review query"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
