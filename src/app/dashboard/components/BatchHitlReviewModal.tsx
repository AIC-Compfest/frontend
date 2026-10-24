"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentProfile, getDocumentProfile, reviewDocumentField } from "@/lib/api";

interface Props {
  documentIds: string[];
  onClose: () => void;
}

const decisionFor = (profile: DocumentProfile, predictionId: string) =>
  profile.decisions.find((decision) => decision.prediction_id === predictionId);

const labelFor = (profile: DocumentProfile) =>
  profile.segments[0]?.document_type || profile.document.classification || "UNKNOWN";

export function BatchHitlReviewModal({ documentIds, onClose }: Props) {
  const [profiles, setProfiles] = useState<DocumentProfile[]>([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<Record<string, string>>({});

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

  const active = profiles.find((profile) => profile.document.id === activeId);
  const pending = (profile: DocumentProfile) => profile.predictions.filter(
    (prediction) => decisionFor(profile, prediction.id)?.decision_status === "PENDING_REVIEW"
  );
  const allApproved = useMemo(
    () => profiles.length > 0 && profiles.every((profile) => profile.predictions.length > 0 && pending(profile).length === 0),
    [profiles]
  );

  const apply = async (profile: DocumentProfile, predictionId: string, action: "ACCEPT_PREDICTION" | "CORRECT_VALUE") => {
    setSaving(predictionId);
    setError(null);
    try {
      const updated = await reviewDocumentField(profile.document.id, {
        prediction_id: predictionId,
        action,
        reviewed_value: action === "CORRECT_VALUE" ? corrections[predictionId]?.trim() : undefined,
        reason: action === "CORRECT_VALUE" ? "Koreksi auditor pada audit batch HITL" : "Disetujui auditor pada audit batch HITL",
        reviewer_external_id: "frontend-reviewer",
      });
      setProfiles((items) => items.map((item) => item.document.id === updated.document.id ? updated : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Keputusan tidak tersimpan");
    } finally {
      setSaving(null);
    }
  };

  const approveDocument = async (profile: DocumentProfile) => {
    // Persist each field separately: the database retains an immutable review
    // record for every mapping, rather than a coarse document-only approval.
    for (const prediction of pending(profile)) {
      await apply(profile, prediction.id, "ACCEPT_PREDICTION");
    }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label="Audit HITL batch">
    <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-slate-200 p-5">
        <div><h2 className="flex items-center gap-2 text-base font-bold text-[#1B2A4A]"><ShieldCheck className="h-5 w-5 text-sky-600" />Audit mapping dokumen</h2><p className="mt-1 text-xs text-slate-500">Setujui atau koreksi setiap mapping. Semua tab harus selesai sebelum audit batch dapat ditutup.</p></div>
        <Badge variant={allApproved ? "success" : "warning"}>{allApproved ? "Semua disetujui" : `${profiles.filter((p) => pending(p).length > 0).length} tab belum selesai`}</Badge>
      </div>
      {loading ? <div className="p-16 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />Memuat hasil ekstraksi...</div> : error && !active ? <div className="m-5 rounded-lg bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="mr-2 inline h-4 w-4" />{error}</div> : <>
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 pt-3">
          {profiles.map((profile) => <button key={profile.document.id} onClick={() => setActiveId(profile.document.id)} className={`border-b-2 px-3 pb-3 text-xs font-bold ${activeId === profile.document.id ? "border-sky-600 text-sky-700" : "border-transparent text-slate-500"}`}>
            {labelFor(profile)} {pending(profile) ? `(${pending(profile).length})` : "✓"}
          </button>)}
        </div>
        {active && <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error && <div className="mb-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle className="mr-1 inline h-3.5 w-3.5" />{error}</div>}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-slate-800">{active.document.filename}</p><p className="text-[11px] text-slate-500">{labelFor(active)} · {active.predictions.length} field hasil ekstraksi</p></div><Button size="sm" disabled={saving !== null || pending(active).length === 0} onClick={() => approveDocument(active)} className="bg-emerald-700 hover:bg-emerald-800"><CheckCircle2 />Setujui semua field tab ini</Button></div>
          {active.predictions.length === 0 ? <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">Belum ada field untuk diaudit. Jalankan ulang ekstraksi setelah pipeline AI menghasilkan mapping.</p> : <div className="divide-y rounded-xl border border-slate-200">{active.predictions.map((prediction) => {
            const decision = decisionFor(active, prediction.id); const isPending = decision?.decision_status === "PENDING_REVIEW"; const busy = saving === prediction.id;
            return <div key={prediction.id} className="space-y-2 p-4"><div className="flex justify-between gap-4"><div><p className="text-xs font-bold text-slate-800">{prediction.field_name}</p><p className="mt-1 text-sm text-slate-900">{prediction.predicted_raw_text || String(prediction.predicted_value ?? "—")}</p><p className="mt-1 text-[10px] text-slate-400">Halaman {prediction.evidence_page || "—"} · skor {prediction.score?.toFixed(3) || "—"}</p></div><Badge variant={isPending ? "warning" : "success"}>{decision?.decision_status || prediction.prediction_status}</Badge></div>{isPending && <div className="flex flex-col gap-2 sm:flex-row"><input value={corrections[prediction.id] || ""} onChange={(event) => setCorrections((values) => ({ ...values, [prediction.id]: event.target.value }))} placeholder="Nilai koreksi (opsional)" className="h-8 flex-1 rounded-md border border-slate-200 px-2 text-xs" /><Button size="sm" disabled={busy} onClick={() => apply(active, prediction.id, "ACCEPT_PREDICTION")}>Terima</Button><Button size="sm" variant="outline" disabled={busy || !corrections[prediction.id]?.trim()} onClick={() => apply(active, prediction.id, "CORRECT_VALUE")}>Simpan koreksi</Button></div>}</div>;
          })}</div>}
        </div>}
      </>}
      <div className="flex justify-end gap-2 border-t border-slate-200 p-4"><Button variant="outline" onClick={onClose}>Simpan & lanjutkan nanti</Button><Button disabled={!allApproved} onClick={onClose}>Selesai audit batch</Button></div>
    </div>
  </div>;
}
