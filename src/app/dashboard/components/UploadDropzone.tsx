"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { API_V1 } from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  btnGhost,
  btnOutline,
  btnPrimary,
  chip,
  emptyState,
  focusRing,
  iconPlate,
  panel,
  panelHeader,
  panelTitle,
  selectClass,
  td,
  th,
} from "@/lib/dashboard-ui";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileCheck2,
  FileImage,
  FileText,
  Folder,
  Layers,
  Loader2,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  UploadCloud,
  Eye,
} from "lucide-react";
import { BatchHitlReviewModal } from "./BatchHitlReviewModal";
import { ExtractionResultModal } from "./ExtractionResultModal";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_SIZE_MB = 10;
const API_BASE = API_V1;

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
  ingest_batch_id?: string;
}

// Helper to format file size in B, KB, or MB
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Helper to detect the default classification from the file name. Keep these substring rules as they are.
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

export function UploadDropzone() {
  const [fileQueue, setFileQueue] = useState<QueuedFile[]>([]);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ingestBatchIdRef = useRef(crypto.randomUUID());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [reviewDocumentIds, setReviewDocumentIds] = useState<string[] | null>(null);
  const [extractionResultDocId, setExtractionResultDocId] = useState<string | null>(null);

  // Saved documents in the database
  const [savedDocs, setSavedDocs] = useState<SavedDocItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Fetch recent documents from the backend API
  const fetchRecentDocs = useCallback(async () => {
    try {
      setIsLoadingDocs(true);
      const res = await fetch(`${API_BASE}/documents?page_size=30`);
      if (!res.ok) throw new Error("Failed to load documents");
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

  // Add files to the queue. Files over 10 MB are flagged as errors.
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
          ? `File size (${(f.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${MAX_FILE_SIZE_MB} MB limit`
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
    ingestBatchIdRef.current = crypto.randomUUID();
  };

  const handleUpdateDocType = (id: string, newType: string) => {
    setFileQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, docType: newType } : item))
    );
  };

  // Upload one file to the backend API
  const uploadSingleItem = async (item: QueuedFile): Promise<QueuedFile> => {
    if (item.file.size > MAX_FILE_SIZE_BYTES) {
      return {
        ...item,
        status: "ERROR",
        errorMsg: `File size exceeds the ${MAX_FILE_SIZE_MB} MB limit`,
      };
    }

    const formData = new FormData();
    formData.append("file", item.file);
    formData.append("ingest_batch_id", ingestBatchIdRef.current);
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
        throw new Error(errJson.error || `Upload failed (Status ${res.status})`);
      }

      const response = await res.json();
      const data = response.data ?? response;
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
        errorMsg: err instanceof Error ? err.message : "Failed to upload document",
      };
    }
  };

  // Upload every ready file in sequence
  const handleBatchUpload = async () => {
    const readyItems = fileQueue.filter((i) => i.status === "READY");
    if (readyItems.length === 0) {
      setGlobalError("Choose at least one document to start AI extraction and audit mapping.");
      return;
    }

    setIsBatchUploading(true);
    setGlobalError(null);

    const reviewedIDs: string[] = [];
    for (const item of readyItems) {
      setFileQueue((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: "UPLOADING" } : it))
      );

      const updated = await uploadSingleItem(item);

      if ((updated.status === "SUCCESS" || updated.status === "DUPLICATE") && updated.result?.document_id) {
        reviewedIDs.push(updated.result.document_id);
      }

      setFileQueue((prev) =>
        prev.map((it) => (it.id === item.id ? updated : it))
      );
    }

    setIsBatchUploading(false);
    // Refresh the saved documents table
    fetchRecentDocs();
    // Every successful upload opens the field-level review. One document is a valid unit of AI extraction and human approval.
    if (reviewedIDs.length > 0) setReviewDocumentIds([...new Set(reviewedIDs)]);
  };

  const readyItemsCount = fileQueue.filter((i) => i.status === "READY").length;
  const successItemsCount = fileQueue.filter((i) => i.status === "SUCCESS" || i.status === "DUPLICATE").length;
  const errorItemsCount = fileQueue.filter((i) => i.status === "ERROR").length;

  // Group saved documents by ingest batch
  const documentFolders = useMemo(() => {
    const groups = new Map<string, SavedDocItem[]>();
    savedDocs.forEach((doc) => {
      const key = doc.ingest_batch_id || "legacy";
      groups.set(key, [...(groups.get(key) || []), doc]);
    });
    return Array.from(groups.entries()).map(([id, documents]) => ({
      id,
      documents,
      label: id === "legacy" ? "Documents before batch system" : `Batch ${id.slice(0, 8)}`,
    }));
  }, [savedDocs]);

  return (
    <div className="space-y-6">
      {/* Upload card */}
      <section className={cn(panel, "overflow-hidden")}>
        <header className={panelHeader}>
          <div className="flex items-center gap-3">
            <span className={iconPlate("action")}>
              <Layers className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className={panelTitle}>Multi-File Ingestion Pipeline</h2>
              <p className="text-[13px] text-body">
                Supports PDF, JPG, PNG, and TIFF. Documents are checked with SHA-256 hashing to prevent duplicates.
              </p>
            </div>
          </div>
          <span className={chip("navy")}>Max {MAX_FILE_SIZE_MB} MB per file</span>
        </header>

        <div className="space-y-5 p-6">
          {/* Drop zone. A click anywhere on it opens the file picker. */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer select-none flex-col items-center justify-center gap-3 rounded-panel border-2 border-dashed p-8 text-center transition-colors",
              isDragOver
                ? "border-action bg-action/5"
                : "border-hairline bg-canvas hover:border-muted hover:bg-surface-soft"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
              onChange={handleInputChange}
              className="hidden"
              aria-label="Choose document files"
            />
            <span className={cn(iconPlate("navy"), "h-12 w-12 rounded-card")}>
              <UploadCloud className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <p className="text-[15px] font-semibold text-ink">Choose files or drag them here</p>
              <p className="text-[13px] text-body">
                Upload multiple documents at once (PDF, JPG, PNG • Max {MAX_FILE_SIZE_MB} MB per document)
              </p>
            </div>
            <Button type="button" variant="outline" className={cn(btnOutline, "mt-1 h-9")}>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Choose Files</span>
            </Button>
          </div>

          {/* Queue actions and file list */}
          {fileQueue.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold text-ink">Document queue ({fileQueue.length} files)</span>
                  {readyItemsCount > 0 && <span className={chip("navy")}>{readyItemsCount} ready to upload</span>}
                  {successItemsCount > 0 && <span className={chip("success")}>{successItemsCount} succeeded</span>}
                  {errorItemsCount > 0 && <span className={chip("error")}>{errorItemsCount} error</span>}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClearAll}
                    disabled={isBatchUploading}
                    className={cn(btnGhost, "h-9")}
                  >
                    Clear All
                  </Button>
                  <Button
                    type="button"
                    onClick={handleBatchUpload}
                    disabled={readyItemsCount < 2 || isBatchUploading}
                    className={cn(btnPrimary, "h-9")}
                  >
                    {isBatchUploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                        <span>Uploading batch...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        <span>Upload & Audit Batch ({readyItemsCount})</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {fileQueue.map((item) => {
                  const isPdf = item.file.name.toLowerCase().endsWith(".pdf");
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        "flex flex-col items-start justify-between gap-3 rounded-control border p-3.5 transition-colors sm:flex-row sm:items-center",
                        item.status === "ERROR"
                          ? "border-error/40 bg-error-soft/60"
                          : item.status === "SUCCESS"
                          ? "border-teal/60 bg-teal-soft/50"
                          : item.status === "DUPLICATE"
                          ? "border-warning/40 bg-warning-soft/60"
                          : "border-hairline bg-card"
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className={iconPlate(isPdf ? "error" : "action")}>
                          {isPdf ? (
                            <FileText className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                          ) : (
                            <FileImage className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <span className="block truncate text-[13px] font-semibold text-ink" title={item.file.name}>
                            {item.file.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 text-[12px] text-body">
                            <span className="tabular-nums">{formatFileSize(item.file.size)}</span>
                            <span aria-hidden="true">•</span>
                            {item.status === "ERROR" ? (
                              <span className="flex items-center gap-1 font-semibold text-error-ink">
                                <AlertCircle className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                                {item.errorMsg || `Over ${MAX_FILE_SIZE_MB} MB`}
                              </span>
                            ) : item.status === "SUCCESS" ? (
                              <span className="flex items-center gap-1 font-semibold text-teal-ink">
                                <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                                Uploaded ({item.result?.document_id || "DOC-OK"})
                              </span>
                            ) : item.status === "DUPLICATE" ? (
                              <span className="flex items-center gap-1 font-semibold text-warning-ink">
                                <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                                Verified (SHA-256 deduplication)
                              </span>
                            ) : item.status === "UPLOADING" ? (
                              <span className="flex items-center gap-1 font-semibold text-action-ink">
                                <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                                Extracting with AI...
                              </span>
                            ) : (
                              <span>Ready to upload</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Document type and remove control */}
                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                        {item.status === "SUCCESS" && item.result?.document_id && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setExtractionResultDocId(item.result!.document_id!)}
                            className={cn(btnPrimary, "h-8 text-xs")}
                          >
                            <Eye className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                            View Extraction
                          </Button>
                        )}
                        
                        {item.status === "READY" && (
                          <select
                            aria-label={`Document type for ${item.file.name}`}
                            value={item.docType}
                            onChange={(e) => handleUpdateDocType(item.id, e.target.value)}
                            className={cn(selectClass, "h-8 px-2.5 text-[12px] font-medium")}
                          >
                            <option value="AUTO">Auto (AI classification)</option>
                            <option value="INVOICE">Invoice</option>
                            <option value="SURAT_JALAN">Delivery Note (SJ)</option>
                            <option value="POD">Proof of Delivery (POD)</option>
                            <option value="RATE_AGREEMENT">Rate Agreement (PKS)</option>
                          </select>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={item.status === "UPLOADING"}
                          aria-label={`Remove ${item.file.name} from queue`}
                          title="Remove from queue"
                          className={cn(
                            "grid h-8 w-8 cursor-pointer place-items-center rounded-control text-muted transition-colors hover:bg-surface-soft hover:text-error-ink disabled:pointer-events-none disabled:opacity-40",
                            focusRing
                          )}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {globalError && (
            <div role="alert" className="flex items-center gap-2 rounded-control border border-error/40 bg-error-soft p-3.5 text-[13px] font-medium text-error-ink">
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>{globalError}</span>
            </div>
          )}
        </div>
      </section>

      {/* Saved documents */}
      <section className={cn(panel, "overflow-hidden")}>
        <header className={panelHeader}>
          <div className="flex items-center gap-3">
            <span className={iconPlate("success")}>
              <FileCheck2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className={panelTitle}>Saved Documents ({savedDocs.length})</h2>
              <p className="text-[13px] text-body">Document metadata ready for reconciliation.</p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={fetchRecentDocs}
            disabled={isLoadingDocs}
            className={cn(btnOutline, "h-9")}
          >
            <RotateCw className={cn("h-3.5 w-3.5", isLoadingDocs && "animate-spin")} strokeWidth={1.75} aria-hidden="true" />
            <span>{isLoadingDocs ? "Loading..." : "Refresh"}</span>
          </Button>
        </header>

        {savedDocs.length === 0 ? (
          <div className={emptyState}>No documents registered in the database yet.</div>
        ) : (
          <ul>
            {documentFolders.map((folder) => {
              const isExpanded = expandedFolders.has(folder.id);
              return (
                <li key={folder.id} className="border-b border-hairline last:border-b-0">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() =>
                      setExpandedFolders((previous) => {
                        const next = new Set(previous);
                        if (next.has(folder.id)) next.delete(folder.id);
                        else next.add(folder.id);
                        return next;
                      })
                    }
                    className={cn(
                      "flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-soft",
                      focusRing
                    )}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-body" strokeWidth={1.75} aria-hidden="true" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-body" strokeWidth={1.75} aria-hidden="true" />
                    )}
                    <Folder className="h-5 w-5 text-warning" strokeWidth={1.75} aria-hidden="true" />
                    <span className="font-semibold text-ink">{folder.label}</span>
                    <span className={chip("neutral")}>{folder.documents.length} files</span>
                  </button>

                  {isExpanded && (
                    <div className="overflow-x-auto border-t border-hairline">
                      <table className="w-full text-left">
                        <thead>
                          <tr>
                            <th className={th}>Document name</th>
                            <th className={th}>Type</th>
                            <th className={th}>Size</th>
                            <th className={th}>Received</th>
                            <th className={th}>Status</th>
                            <th className={cn(th, "text-right")}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {folder.documents.map((doc) => {
                            const isPdf = doc.filename.toLowerCase().endsWith(".pdf");
                            const dateFormatted = doc.created_at
                              ? new Date(doc.created_at).toLocaleString("en-US", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "-";

                            return (
                              <tr key={doc.id} className="border-b border-hairline last:border-b-0 transition-colors hover:bg-surface-soft">
                                <td className={td}>
                                  <div className="flex items-center gap-2.5">
                                    <span className={cn(iconPlate(isPdf ? "error" : "action"), "h-8 w-8 rounded-plate")}>
                                      {isPdf ? (
                                        <FileText className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                                      ) : (
                                        <FileImage className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                                      )}
                                    </span>
                                    <div className="min-w-0 max-w-xs">
                                      <span className="block truncate font-semibold text-ink" title={doc.filename}>
                                        {doc.filename}
                                      </span>
                                      <span className="block truncate text-[11px] tabular-nums text-muted">{doc.id}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className={td}>
                                  <span className={chip(doc.classification === "INVOICE" ? "navy" : doc.classification === "RATE_AGREEMENT" ? "warning" : "neutral")}>
                                    {doc.classification || "DOCUMENT"}
                                  </span>
                                </td>
                                <td className={cn(td, "text-body")}>{formatFileSize(doc.file_size)}</td>
                                <td className={cn(td, "text-body")}>{dateFormatted}</td>
                                <td className={td}>
                                  <span className={chip("success")}>
                                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                                    {doc.status || "COMPLETED"}
                                  </span>
                                </td>
                                <td className={cn(td, "text-right")}>
                                  <a
                                    href={`${API_BASE}/documents/${doc.id}/download`}
                                    download={doc.filename}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-control border border-hairline px-2.5 py-1 text-[12px] font-semibold text-action-ink transition-colors hover:bg-navy hover:text-white",
                                      focusRing
                                    )}
                                  >
                                    <Download className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                                    <span>Download</span>
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {reviewDocumentIds && (
        <BatchHitlReviewModal
          documentIds={reviewDocumentIds}
          onClose={() => setReviewDocumentIds(null)}
          onFinalized={(eventId) => {
            setReviewDocumentIds(null);
            window.location.assign(`/dashboard?event=${encodeURIComponent(eventId)}`);
          }}
        />
      )}

      {extractionResultDocId && (
        <ExtractionResultModal
          documentId={extractionResultDocId}
          onClose={() => setExtractionResultDocId(null)}
        />
      )}
    </div>
  );
}
