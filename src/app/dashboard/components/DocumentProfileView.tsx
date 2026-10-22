"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentProfile, getDocumentProfile, reviewDocumentField } from "@/lib/api";

interface DocumentProfileViewProps {
  documentId: string;
  onBack: () => void;
}

const decisionFor = (profile: DocumentProfile, predictionId: string) =>
  profile.decisions.find((decision) => decision.prediction_id === predictionId);

export function DocumentProfileView({ documentId, onBack }: DocumentProfileViewProps) {
  const [profile, setProfile] = useState<DocumentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<Record<string, string>>({});

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setProfile(await getDocumentProfile(documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat profil dokumen");
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const pendingCount = useMemo(
    () => profile?.predictions.filter((prediction) => decisionFor(profile, prediction.id)?.decision_status === "PENDING_REVIEW").length ?? 0,
    [profile]
  );

  const review = async (predictionId: string, action: "ACCEPT_PREDICTION" | "CORRECT_VALUE" | "MARK_UNKNOWN" | "REJECT") => {
    if (!profile) return;
    try {
      setReviewing(predictionId);
      const updated = await reviewDocumentField(documentId, {
        prediction_id: predictionId,
        action,
        reviewed_value: action === "CORRECT_VALUE" ? corrections[predictionId] : undefined,
        reason: action === "CORRECT_VALUE" ? "Koreksi reviewer pada workspace HITL" : "Keputusan reviewer pada workspace HITL",
        reviewer_external_id: "frontend-reviewer",
      });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan keputusan HITL");
    } finally {
      setReviewing(null);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-500"><Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />Memuat profil dokumen...</div>;
  }
  if (error || !profile) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"><AlertCircle className="mr-2 inline h-4 w-4" />{error || "Profil tidak tersedia"}<Button variant="ghost" size="sm" onClick={loadProfile} className="ml-3">Coba lagi</Button></div>;
  }

  const { document } = profile;
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-xs font-semibold text-sky-700 hover:underline">← Kembali ke Document Hub</button>
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="flex-row items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/60">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-[#1B2A4A]"><FileText className="h-5 w-5 text-sky-600" />{document.filename}</CardTitle>
            <p className="mt-1 font-mono text-[10px] text-slate-400">{document.id}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge variant="success">{document.status}</Badge>
            <Badge variant="brand">{document.classification || "UNKNOWN"}</Badge>
            <Badge variant={pendingCount ? "warning" : "success"}>{pendingCount} pending HITL</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 p-5 text-xs sm:grid-cols-4">
          <div><span className="text-slate-400">Pages</span><strong className="mt-1 block text-slate-800">{profile.pages.length}</strong></div>
          <div><span className="text-slate-400">Segments</span><strong className="mt-1 block text-slate-800">{profile.segments.length}</strong></div>
          <div><span className="text-slate-400">Evidence fields</span><strong className="mt-1 block text-slate-800">{profile.evidence.length}</strong></div>
          <div><span className="text-slate-400">Pipeline</span><strong className="mt-1 block text-slate-800">{profile.pipeline?.status || "NOT RUN"}</strong></div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100"><CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-sky-600" />HITL Field Review</CardTitle><p className="text-xs text-slate-500">Validasi atau koreksi nilai model sebelum menjadi keputusan bisnis.</p></CardHeader>
        <CardContent className="p-0">
          {profile.predictions.length === 0 ? <div className="p-6 text-center text-xs text-slate-500">Belum ada prediksi field. Model dapat berstatus no_model_for_doc_type.</div> : (
            <div className="divide-y divide-slate-100">
              {profile.predictions.map((prediction) => {
                const decision = decisionFor(profile, prediction.id);
                const status = decision?.decision_status || prediction.prediction_status;
                const busy = reviewing === prediction.id;
                return (
                  <div key={prediction.id} className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><p className="text-xs font-bold text-slate-800">{prediction.field_name}</p><p className="mt-1 text-sm text-slate-900">{prediction.predicted_raw_text || String(prediction.predicted_value ?? "—")}</p><p className="mt-1 text-[10px] text-slate-400">Page {prediction.evidence_page || "—"} · Score {prediction.score?.toFixed(3) || "—"}</p></div>
                      <Badge variant={status === "APPROVED" ? "success" : status === "PENDING_REVIEW" ? "warning" : "outline"}>{status}</Badge>
                    </div>
                    {status === "PENDING_REVIEW" && (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button size="sm" disabled={busy} onClick={() => review(prediction.id, "ACCEPT_PREDICTION")} className="bg-emerald-700 text-xs hover:bg-emerald-800"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Terima</Button>
                        <input value={corrections[prediction.id] || ""} onChange={(event) => setCorrections((current) => ({ ...current, [prediction.id]: event.target.value }))} placeholder="Nilai koreksi..." className="h-9 flex-1 rounded-md border border-slate-200 px-3 text-xs outline-none focus:border-sky-500" />
                        <Button size="sm" variant="outline" disabled={busy || !corrections[prediction.id]?.trim()} onClick={() => review(prediction.id, "CORRECT_VALUE")} className="text-xs">Koreksi</Button>
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => review(prediction.id, "MARK_UNKNOWN")} className="text-xs"><XCircle className="mr-1 h-3.5 w-3.5" />Unknown</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
