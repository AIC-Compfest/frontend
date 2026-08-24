"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Trash2,
  FileImage,
  Layers,
  Plus,
  Download,
  RotateCw,
  Eye,
  FileCheck2,
} from "lucide-react";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_SIZE_MB = 10;
const API_BASE = "http://localhost:8080/api/v1";

interface QueuedFile {
  id: string;
  file: File;
  docType: string;
  status: "READY" | "UPLOADING" | "SUCCESS" | "DUPLICATE" | "ERROR";
  errorMsg?: string;
  result?: {
    document_id?: string;
    status?: string;
    sha256_hash?: string;
    storage_url?: string;
    is_duplicate?: boolean;
  };
}

interface SavedDocItem {
  id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  sha256_hash: string;
  storage_path: string;
  status: string;
  classification: string;
  classification_confidence: number;
  created_at: string;
}

export function UploadDropzone() {
  const [fileQueue, setFileQueue] = useState<QueuedFile[]>([]);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Saved documents in Supabase DB state
  const [savedDocs, setSavedDocs] = useState<SavedDocItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Helper to format file size in KB or MB
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Fetch recent documents from Supabase via backend API
  const fetchRecentDocs = useCallback(async () => {
    try {
      setIsLoadingDocs(true);
      const res = await fetch(`${API_BASE}/documents?page_size=30`);
      if (!res.ok) throw new Error("Gagal mengambil data dokumen");
      const json = await res.json();
      setSavedDocs(json.data || []);
    } catch (err) {
      console.error("Fetch docs error:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentDocs();
  }, [fetchRecentDocs]);

  // Helper to detect default classification from file name
  const detectDocType = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("sj") || lower.includes("surat_jalan") || lower.includes("do_")) {
      return "SURAT_JALAN";
    }
    if (lower.includes("pod") || lower.includes("bukti") || lower.includes("tanda_terima")) {
      return "POD";
    }
    if (lower.includes("pks") || lower.includes("rate") || lower.includes("kontrak") || lower.includes("agreement")) {
      return "RATE_AGREEMENT";
    }
    return "AUTO";
  };

  // Add files to queue with 10 MB max size validation
  const handleFilesAdded = (files: FileList | File[]) => {
    setGlobalError(null);
    const newItems: QueuedFile[] = [];

    Array.from(files).forEach((f) => {
      const isSizeExceeded = f.size > MAX_FILE_SIZE_BYTES;
      newItems.push({
        id: `${f.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: f,
        docType: detectDocType(f.name),
        status: isSizeExceeded ? "ERROR" : "READY",
        errorMsg: isSizeExceeded
          ? `Ukuran file (${(f.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal 10 MB`
          : undefined,
      });
    });

    setFileQueue((prev) => [...prev, ...newItems]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemoveItem = (id: string) => {
    setFileQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setFileQueue([]);
    setGlobalError(null);
  };

  const handleUpdateDocType = (id: string, newType: string) => {
    setFileQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, docType: newType } : item))
    );
  };

  // Upload single file to backend API
  const uploadSingleItem = async (item: QueuedFile): Promise<QueuedFile> => {
    if (item.file.size > MAX_FILE_SIZE_BYTES) {
      return {
        ...item,
        status: "ERROR",
        errorMsg: `Ukuran file melebihi batas maksimal ${MAX_FILE_SIZE_MB} MB`,
      };
    }

    const formData = new FormData();
    formData.append("file", item.file);
    if (item.docType !== "AUTO") {
      formData.append("document_type", item.docType);
    }

    try {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Upload gagal (Status ${res.status})`);
      }

      const data = await res.json();
      return {
        ...item,
        status: data.is_duplicate ? "DUPLICATE" : "SUCCESS",
        result: {
          document_id: data.id || data.document_id,
          status: data.status || "EXTRACTED",
          sha256_hash: data.sha256_hash,
          storage_url: data.storage_url,
          is_duplicate: data.is_duplicate,
        },
      };
    } catch (err: unknown) {
      return {
        ...item,
        status: "ERROR",
        errorMsg: err instanceof Error ? err.message : "Gagal mengunggah dokumen",
      };
    }
  };

  // Batch upload all ready files
  const handleBatchUpload = async () => {
    const readyItems = fileQueue.filter((i) => i.status === "READY");
    if (readyItems.length === 0) return;

    setIsBatchUploading(true);
    setGlobalError(null);

    for (const item of readyItems) {
      setFileQueue((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: "UPLOADING" } : it))
      );

      const updated = await uploadSingleItem(item);

      setFileQueue((prev) =>
        prev.map((it) => (it.id === item.id ? updated : it))
      );
    }

    setIsBatchUploading(false);
    // Refresh the live documents table
    fetchRecentDocs();
  };

  const readyItemsCount = fileQueue.filter((i) => i.status === "READY").length;
  const successItemsCount = fileQueue.filter((i) => i.status === "SUCCESS" || i.status === "DUPLICATE").length;
  const errorItemsCount = fileQueue.filter((i) => i.status === "ERROR").length;

  return (
    <div className="space-y-6 max-w-5xl font-sans">
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-[#1B2A4A] tracking-tight">
          Document Ingest Hub (Multi-Upload)
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Unggah banyak dokumen logistik sekaligus (Invoice, Surat Jalan, POD, PKS) untuk ekstraksi otomatis AI dengan batas maksimal <strong>10 MB per file</strong>.
        </p>
      </div>

      {/* Upload Dropzone Card */}
      <Card className="border border-slate-200/90 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="p-6 pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-600" />
              <span>Multi-File Ingestion Pipeline</span>
            </CardTitle>
            <Badge variant="outline" className="bg-white text-sky-700 border-sky-300 font-mono text-[10px] font-bold">
              Maks. 10 MB / file
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-500 mt-1">
              Mendukung format PDF, JPG, PNG, dan TIFF. Dokumen diproses dengan verifikasi hash SHA-256 untuk mencegah duplikasi.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {/* Drag and Drop Zone Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer select-none ${
              isDragOver
                ? "border-sky-500 bg-sky-50/60 scale-[0.99]"
                : "border-slate-300 bg-slate-50/70 hover:bg-slate-100/60 hover:border-slate-400"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
              onChange={handleInputChange}
              className="hidden"
            />
            <div className="h-12 w-12 rounded-2xl bg-[#1B2A4A] text-sky-400 flex items-center justify-center shadow-xs">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-bold text-slate-800 block">
                Pilih beberapa file atau seret (*drag & drop*) ke sini
              </span>
              <span className="text-xs text-slate-500 block">
                Bisa submit banyak dokumen sekaligus (PDF, JPG, PNG &bull; Maks. 10 MB per dokumen)
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 text-xs font-semibold h-8 bg-white border-slate-300 pointer-events-none"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Pilih Dokumen
            </Button>
          </div>

          {/* Queue Actions & File List */}
          {fileQueue.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    Antrean Dokumen ({fileQueue.length} file)
                  </span>
                  {readyItemsCount > 0 && (
                    <Badge variant="brand" className="text-[10px] py-0">
                      {readyItemsCount} Siap Diunggah
                    </Badge>
                  )}
                  {successItemsCount > 0 && (
                    <Badge variant="success" className="text-[10px] py-0">
                      {successItemsCount} Berhasil
                    </Badge>
                  )}
                  {errorItemsCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] py-0">
                      {errorItemsCount} Error
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={isBatchUploading}
                    className="text-xs text-slate-500 hover:text-rose-600 h-8"
                  >
                    Bersihkan Semua
                  </Button>
                  <Button
                    type="button"
                    onClick={handleBatchUpload}
                    disabled={readyItemsCount === 0 || isBatchUploading}
                    className="bg-[#1B2A4A] text-white hover:bg-sky-600 font-bold text-xs h-8 px-4 gap-2 cursor-pointer"
                  >
                    {isBatchUploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Mengunggah Batch...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                        <span>Unggah Semua ({readyItemsCount})</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Items Card List */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {fileQueue.map((item) => {
                  const isPdf = item.file.name.toLowerCase().endsWith(".pdf");
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        item.status === "ERROR"
                          ? "bg-rose-50/50 border-rose-200 text-rose-900"
                          : item.status === "SUCCESS"
                          ? "bg-emerald-50/40 border-emerald-200 text-emerald-900"
                          : item.status === "DUPLICATE"
                          ? "bg-amber-50/40 border-amber-200 text-amber-900"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isPdf
                              ? "bg-rose-100 text-rose-700"
                              : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {isPdf ? <FileText className="h-4.5 w-4.5" /> : <FileImage className="h-4.5 w-4.5" />}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <span className="text-xs font-bold text-slate-900 block truncate" title={item.file.name}>
                            {item.file.name}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span>{formatFileSize(item.file.size)}</span>
                            <span>&bull;</span>
                            {item.status === "ERROR" ? (
                              <span className="text-rose-600 font-semibold flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {item.errorMsg || "Ukuran > 10 MB"}
                              </span>
                            ) : item.status === "SUCCESS" ? (
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Terunggah ({item.result?.document_id || "DOC-OK"})
                              </span>
                            ) : item.status === "DUPLICATE" ? (
                              <span className="text-amber-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Terverifikasi (Deduplikasi SHA-256)
                              </span>
                            ) : item.status === "UPLOADING" ? (
                              <span className="text-sky-600 font-semibold flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Sedang mengekstrak AI...
                              </span>
                            ) : (
                              <span className="text-slate-400">Siap diunggah</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls & Classification */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {item.status === "READY" && (
                          <select
                            value={item.docType}
                            onChange={(e) => handleUpdateDocType(item.id, e.target.value)}
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700"
                          >
                            <option value="AUTO">Auto (AI Clsf)</option>
                            <option value="INVOICE">Invoice</option>
                            <option value="SURAT_JALAN">Surat Jalan</option>
                            <option value="POD">POD</option>
                            <option value="RATE_AGREEMENT">PKS / Contract</option>
                          </select>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={item.status === "UPLOADING"}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                          title="Hapus dari antrean"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Global Error Banner */}
          {globalError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{globalError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LIVE SUPABASE DOCUMENTS REPOSITORY TABLE */}
      <Card className="border border-slate-200/90 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-emerald-600" />
              <span>Dokumen Tersimpan ({savedDocs.length})</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Metadata berkas yang siap dipakai dalam rekonsiliasi.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecentDocs}
            disabled={isLoadingDocs}
            className="text-xs font-semibold h-8 bg-white border-slate-300 gap-1.5 cursor-pointer"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLoadingDocs ? "animate-spin text-sky-600" : ""}`} />
            <span>{isLoadingDocs ? "Memuat..." : "Refresh"}</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {savedDocs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Belum ada dokumen yang terdaftar di database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Dokumen</th>
                    <th className="py-3 px-3">Tipe</th>
                    <th className="py-3 px-3">Ukuran</th>
                    <th className="py-3 px-3">Waktu Masuk</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {savedDocs.map((doc) => {
                    const isPdf = doc.filename.toLowerCase().endsWith(".pdf");
                    const dateFormatted = doc.created_at
                      ? new Date(doc.created_at).toLocaleString("id-ID", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "-";

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isPdf ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700"
                              }`}
                            >
                              {isPdf ? <FileText className="h-3.5 w-3.5" /> : <FileImage className="h-3.5 w-3.5" />}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <span className="font-bold text-slate-900 block truncate" title={doc.filename}>
                                {doc.filename}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block truncate">
                                {doc.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              doc.classification === "INVOICE"
                                ? "brand"
                                : doc.classification === "RATE_AGREEMENT"
                                ? "warning"
                                : "outline"
                            }
                            className="text-[10px] font-bold py-0"
                          >
                            {doc.classification || "DOCUMENT"}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {formatFileSize(doc.file_size)}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {dateFormatted}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            {doc.status || "COMPLETED"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={`${API_BASE}/documents/${doc.id}/download`}
                            download={doc.filename}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-sky-700 hover:text-white hover:bg-[#1B2A4A] transition-colors border border-sky-200"
                          >
                            <Download className="h-3 w-3" />
                            <span>Unduh</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
