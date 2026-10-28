"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, X, ChevronUp, ChevronDown } from "lucide-react";
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

const labelFor = (profile: DocumentProfile) =>
  profile.segments[0]?.document_type || profile.document.classification || "UNKNOWN";

const isMissingPrediction = (prediction: DocumentProfile["predictions"][number]) =>
  !hasSuggestion(prediction.predicted_value, prediction.predicted_raw_text);

const hasMalformedScalar = (profile: DocumentProfile) => profile.predictions.some((prediction) =>
  prediction.registry_visible !== false && typeof prediction.predicted_value === "string" &&
  (prediction.predicted_value.length > 160 || /[\r\n]/.test(prediction.predicted_value))
);

interface PredictionViewState {
  expandedPredicationId: string | null;
}

export function BatchHitlReviewModal_v2({ documentIds, onClose, onFinalized }: Props) {
  const [profiles, setProfiles] = useState<DocumentProfile[]>([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [reprocessing, setReprocessing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [viewState, setViewState] = useState<PredictionViewState>({ expandedPredicationId: null });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all(documentIds.map(getDocumentProfile))
      .then((items) => {
        if (!mounted) return;
        setProfiles(items);
        setActiveId(items[0]?.document.id || "");
      })
      .catch((reason: unknown) => mounted && setError(reason instanceof Error ? reason.message : "Profil audit tidak dapat dimuat"))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [documentIds]);

  useEffect(() => {
    if (!activeId) {
      setPdfUrl(null);
      return;
    }
    setPdfLoading(true);
    const url = `${API_V1}/documents/${activeId}/download`;
    setPdfUrl(url);
    setPdfLoading(false);
  }, [activeId]);

  const active = profiles.find((profile) => profile.document.id === activeId);
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

  const allApproved = useMemo(
    () => {
      if (profiles.length === 0) return false;
      return profiles.every((profile) => {
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
    },
    [profiles]
  );

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
    const batchId = profiles[0]?.document.ingest_batch_id;
    if (!batchId) {
      setError("Batch ID tidak ditemukan. Silakan pilih dokumen dari batch yang valid.");
      return;
    }

    const validationErrors: string[] = [];
    const validationLogs: string[] = [];

    console.log(`[FINALIZE] Starting batch validation for batch ID: ${batchId}`);
    console.log(`[FINALIZE] Documents to validate: ${profiles.length}`);

    profiles.forEach((profile, index) => {
      const docNum = index + 1;
      const filename = profile.document.filename;

      console.log(`[FINALIZE] Document ${docNum}: ${filename}`);

      if (profile.predictions.length === 0) {
        const msg = `Dokumen ${docNum} (${filename}): Belum ada ekstraksi field`;
        validationErrors.push(msg);
        validationLogs.push(`  ✗ ${msg}`);
      } else {
        console.log(`  ✓ Predictions: ${profile.predictions.length}`);
      }

      const pendingCount = pending(profile).length;
      if (pendingCount > 0) {
        const msg = `Dokumen ${docNum} (${filename}): ${pendingCount} field masih belum disetujui`;
        validationErrors.push(msg);
        validationLogs.push(`  ✗ ${msg}`);
      } else {
        console.log(`  ✓ All predictions decided`);
      }

      if (hasMalformedScalar(profile)) {
        const msg = `Dokumen ${docNum} (${filename}): Nilai field tidak valid, jalankan ulang AI`;
        validationErrors.push(msg);
        validationLogs.push(`  ✗ ${msg}`);
      } else {
        console.log(`  ✓ No malformed scalars`);
      }

      const docType = profile.segments[0]?.document_type || profile.document.classification;
      if (!docType || docType === "UNKNOWN") {
        const msg = `Dokumen ${docNum} (${filename}): Tipe dokumen tidak teridentifikasi`;
        validationErrors.push(msg);
        validationLogs.push(`  ✗ ${msg}`);
      } else {
        console.log(`  ✓ Document type: ${docType}`);
      }

      const hasApprovedOrCorrected = profile.predictions.some((pred) => {
        if (pred.registry_visible === false) return false;
        const decision = profile.decisions.find((d) => d.prediction_id === pred.id);
        return decision && (decision.decision_status === "APPROVED" || decision.decision_status === "CORRECTED");
      });

      if (!hasApprovedOrCorrected) {
        const msg = `Dokumen ${docNum} (${filename}): Tidak ada field yang disetujui`;
        validationErrors.push(msg);
        validationLogs.push(`  ✗ ${msg}`);
      } else {
        console.log(`  ✓ Has approved/corrected fields`);
      }
    });

    if (validationErrors.length > 0) {
      console.log(`[FINALIZE] Validation failed with ${validationErrors.length} error(s)`);
      validationLogs.forEach(log => console.log(log));
      setError(`Finalisasi tidak dapat dilakukan:\n${validationErrors.join("\n")}`);
      return;
    }

    console.log(`[FINALIZE] All validations passed, proceeding to finalize batch...`);

    setFinalizing(true);
    setError(null);
    try {
      console.log(`[FINALIZE] Calling finalizeDocumentBatch(${batchId})`);
      const event = await finalizeDocumentBatch(batchId);
      console.log(`[FINALIZE] Success! Event ID: ${event.event_id}`);
      console.log(`[FINALIZE] Reconciliation status: ${event.reconciliation?.status}`);
      onFinalized(event.event_id);
    } catch (reason) {
      const errorMsg = reason instanceof Error ? reason.message : "Finalisasi rekonsiliasi gagal";
      console.error(`[FINALIZE] Error:`, errorMsg);
      setError(errorMsg || "Finalisasi rekonsiliasi gagal");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label="Audit HITL batch">
      <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-[#1B2A4A]">
              <ShieldCheck className="h-5 w-5 text-sky-600" />
              Audit mapping dokumen
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Bandingkan PDF asli dengan hasil prediksi AI. Setujui atau koreksi setiap mapping.
            </p>
          </div>
          <Badge variant={allApproved ? "success" : "warning"}>
            {allApproved ? "Semua disetujui" : `${profiles.filter((p) => pending(p).length > 0).length} tab belum selesai`}
          </Badge>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-slate-500">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
            Memuat hasil ekstraksi...
          </div>
        ) : error && !active ? (
          <div className="m-5 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            {error}
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 pt-3">
              {profiles.map((profile) => (
                <button
                  key={profile.document.id}
                  onClick={() => setActiveId(profile.document.id)}
                  className={`border-b-2 px-3 pb-3 text-xs font-bold ${
                    activeId === profile.document.id
                      ? "border-sky-600 text-sky-700"
                      : "border-transparent text-slate-500"
                  }`}
                >
                  {labelFor(profile)}
                  {profiles.filter((candidate) => labelFor(candidate) === labelFor(profile)).length > 1
                    ? ` · ${profile.document.filename}`
                    : ""}{" "}
                  {pending(profile).length > 0 ? `(${pending(profile).length})` : "✓"}
                </button>
              ))}
            </div>

            {/* Main Content - Side by Side */}
            {active && (
              <div className="min-h-0 flex-1 overflow-y-auto">
                {error && (
                  <div className="mx-5 mt-5 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertCircle className="mr-1 inline h-3.5 w-3.5" />
                    {error}
                  </div>
                )}

                {/* Document Info Bar */}
                <div className="border-b border-slate-100 bg-slate-50 p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{active.document.filename}</p>
                      <p className="text-[11px] text-slate-500">
                        {labelFor(active)} · {active.predictions.length} field hasil ekstraksi
                      </p>
                      {hasMalformedScalar(active) && (
                        <p className="mt-1 text-[11px] font-medium text-amber-700">
                          Mapping lama berisi nilai scalar yang tidak valid. Jalankan ulang AI sebelum menyetujui dokumen.
                        </p>
                      )}
                      {pending(active).some(isMissingPrediction) && (
                        <p className="mt-1 text-[11px] font-medium text-amber-700">
                          Nilai kosong tidak akan disetujui otomatis; jalankan ulang AI atau isi koreksi pada field tersebut.
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(hasMalformedScalar(active) || pending(active).some(isMissingPrediction)) && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reprocessing}
                          onClick={reprocess}
                        >
                          {reprocessing ? (
                            <>
                              <Loader2 className="animate-spin" />
                              Mengekstrak...
                            </>
                          ) : (
                            "Jalankan ulang AI"
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={saving !== null || pending(active).length === 0}
                        onClick={() => approveDocument(active)}
                        className="bg-emerald-700 hover:bg-emerald-800"
                      >
                        <CheckCircle2 />
                        Setujui field tersedia
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Content Area - Grid Layout */}
                {visiblePredictions(active).length === 0 ? (
                  <div className="flex items-center justify-between gap-4 m-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                    <span>Belum ada mapping tersimpan. Jalankan ekstraksi ulang pada dokumen asli.</span>
                    <Button size="sm" disabled={reprocessing} onClick={reprocess}>
                      {reprocessing ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Mengekstrak...
                        </>
                      ) : (
                        "Jalankan ulang AI"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-full overflow-hidden">
                    {/* Left Side - Document Preview */}
                    <div className="w-2/5 border-r border-slate-200 overflow-y-auto bg-slate-100 p-4">
                      {pdfLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                      ) : pdfUrl ? (
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                          <iframe
                            src={`${pdfUrl}?t=${activeId}`}
                            className="w-full h-full"
                            style={{ minHeight: "600px" }}
                            title={`Document: ${active.document.filename}`}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                          Tidak dapat memuat dokumen
                        </div>
                      )}
                    </div>

                    {/* Right Side - Field Review */}
                    <div className="w-3/5 overflow-y-auto p-5 space-y-3">
                      {visiblePredictions(active).map((prediction) => {
                        const decision = decisionFor(active, prediction.id);
                        const isPending = decision?.decision_status === "PENDING_REVIEW";
                        const busy = saving === prediction.id;
                        const confidence = typeof prediction.score === "number" ? `${(prediction.score * 100).toFixed(1)}%` : "—";
                        const missingValue = isMissingPrediction(prediction);
                        const table = asTablePayload(prediction.predicted_value);
                        const valueText = displayValue(prediction.predicted_value, prediction.predicted_raw_text);
                        const sourceRawText = typeof prediction.decoder_metadata?.source_raw_text === "string" ? prediction.decoder_metadata.source_raw_text : prediction.predicted_raw_text;
                        const isExpanded = viewState.expandedPredicationId === prediction.id;

                        return (
                          <div
                            key={prediction.id}
                            className={`rounded-lg border transition-all ${
                              isPending
                                ? "border-amber-200 bg-amber-50"
                                : decision?.decision_status === "APPROVED"
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            {/* Field Header */}
                            <div className="px-4 py-3 cursor-pointer hover:bg-black/5" onClick={() => setViewState(prev => ({ expandedPredicationId: isExpanded ? null : prediction.id }))}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <button className="text-slate-400 hover:text-slate-600">
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </button>
                                  <div className="flex-1">
                                    <p className="font-bold text-slate-800 text-sm">{prediction.field_name}</p>
                                    <p className="text-xs text-slate-600 mt-1">{valueText}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-mono text-slate-600 px-2 py-1 bg-white rounded border border-slate-200">{confidence}</span>
                                  {!isPending && (
                                    <Badge variant={decision?.decision_status === "APPROVED" ? "success" : "default"} className="text-[10px]">
                                      {decision?.decision_status || "PENDING"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="border-t border-slate-200/50 px-4 py-3 space-y-3 bg-white/50">
                                {/* Display Value */}
                                <div>
                                  <p className="text-xs font-semibold text-slate-700 mb-1.5">Hasil Mapping:</p>
                                  {table ? (
                                    <TablePayloadView payload={table} />
                                  ) : (
                                    <p className={`text-sm p-2 rounded bg-white border border-slate-200 font-mono ${missingValue ? "text-amber-700" : "text-slate-800"}`}>
                                      {missingValue ? "Tidak ada kandidat — isi koreksi" : valueText}
                                    </p>
                                  )}
                                </div>

                                {/* Source Text */}
                                {sourceRawText && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700 mb-1.5">Cuplikan Sumber dari Dokumen:</p>
                                    <p className="text-xs p-2 rounded bg-slate-100 border border-slate-200 text-slate-700 whitespace-pre-wrap font-mono">
                                      {sourceRawText}
                                    </p>
                                  </div>
                                )}

                                {needsManualCheck(prediction) && (
                                  <div className="p-2 rounded bg-amber-100 border border-amber-200 text-xs font-medium text-amber-800">
                                    ⚠ Periksa manual - confidence rendah atau pattern tidak jelas
                                  </div>
                                )}

                                {/* Action Buttons */}
                                {isPending && (
                                  <div className="space-y-2 pt-2 border-t border-slate-200">
                                    {table ? (
                                      <textarea
                                        value={corrections[prediction.id] ?? JSON.stringify(table.rows.map((row) => row.cells ?? []), null, 2)}
                                        onChange={(event) => setCorrections((values) => ({ ...values, [prediction.id]: event.target.value }))}
                                        placeholder="Ketik baris JSON"
                                        className="w-full h-24 rounded-md border border-slate-300 p-2 font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                      />
                                    ) : (
                                      <input
                                        value={corrections[prediction.id] || ""}
                                        onChange={(event) => setCorrections((values) => ({ ...values, [prediction.id]: event.target.value }))}
                                        placeholder="Ketik nilai koreksi"
                                        className="w-full h-8 rounded-md border border-slate-300 px-2 text-xs focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                      />
                                    )}
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        size="sm"
                                        disabled={busy || missingValue}
                                        title={missingValue ? "Nilai kosong harus dikoreksi, tidak dapat disetujui" : undefined}
                                        onClick={() => apply(active, prediction.id, "ACCEPT_PREDICTION")}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                      >
                                        Terima
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={busy || !corrections[prediction.id]?.trim()}
                                        onClick={() => apply(active, prediction.id, "CORRECT_VALUE")}
                                      >
                                        Koreksi
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
          <div className="flex-1">
            {!allApproved && profiles.length > 0 && (
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700">Validasi Finalisasi:</p>
                {profiles.map((profile, idx) => {
                  const docNum = idx + 1;
                  const pendingCount = pending(profile).length;
                  const hasMalformed = hasMalformedScalar(profile);
                  const docType = profile.segments[0]?.document_type || profile.document.classification;
                  const isTypeValid = docType && docType !== "UNKNOWN";
                  const hasApproved = profile.predictions.some((pred) => {
                    if (pred.registry_visible === false) return false;
                    const decision = profile.decisions.find((d) => d.prediction_id === pred.id);
                    return decision && (decision.decision_status === "APPROVED" || decision.decision_status === "CORRECTED");
                  });

                  const issues = [];
                  if (profile.predictions.length === 0) issues.push("Belum ada ekstraksi");
                  if (pendingCount > 0) issues.push(`${pendingCount} field pending`);
                  if (hasMalformed) issues.push("Nilai tidak valid");
                  if (!isTypeValid) issues.push("Tipe dokumen tidak jelas");
                  if (!hasApproved) issues.push("Tidak ada field disetujui");

                  return (
                    <p
                      key={profile.document.id}
                      className={issues.length === 0 ? "text-emerald-700" : "text-amber-700"}
                    >
                      {issues.length === 0 ? "✓" : "○"} {profile.document.filename}: {issues.length === 0 ? "Ready" : issues.join(", ")}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Simpan & lanjutkan nanti
          </Button>
          <Button
            disabled={!allApproved || finalizing}
            onClick={finalize}
            title={!allApproved ? "Selesaikan semua tab sebelum finalisasi" : ""}
          >
            {finalizing ? (
              <>
                <Loader2 className="animate-spin" />
                Menjalankan validasi...
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
