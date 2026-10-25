"use client";

import React, { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

/** A box in normalized page coordinates (0..1, origin top-left), relative to the rendered page. */
export interface OverlayBox {
  id: string;
  page: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  tone: "default" | "selected" | "discrepant" | "uncertain";
  title?: string;
}

interface LoadedFile {
  kind: "pdf" | "image";
  pdf?: PDFDocumentProxy;
  imageUrl?: string;
  pageCount: number;
}

interface DocumentPageViewProps {
  /** Absolute URL of the ORIGINAL uploaded file (served by backend /documents/:id/download). */
  fileUrl: string;
  mimeType?: string;
  page: number;
  zoom: number;
  boxes: OverlayBox[];
  onPageCount: (count: number) => void;
  onBoxClick: (id: string) => void;
}

const TONE_CLASS: Record<OverlayBox["tone"], string> = {
  default: "border-sky-500/80 bg-sky-400/10 hover:bg-sky-400/25",
  selected: "border-blue-600 bg-blue-500/25 ring-2 ring-blue-500/60 z-20",
  discrepant: "border-rose-600 bg-rose-500/20 ring-2 ring-rose-500/50 z-10",
  uncertain: "border-amber-500 bg-amber-400/20 z-10",
};

// Parsed documents are cached per URL so switching tabs that share one bundle file is instant.
const fileCache = new Map<string, Promise<LoadedFile>>();

async function loadFile(url: string): Promise<LoadedFile> {
  const res = await fetch(url);
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) detail = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const buf = await res.arrayBuffer();

  if (contentType.includes("pdf")) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
    return { kind: "pdf", pdf, pageCount: pdf.numPages };
  }
  if (contentType.startsWith("image/") && !contentType.includes("tiff")) {
    const blob = new Blob([buf], { type: contentType });
    return { kind: "image", imageUrl: URL.createObjectURL(blob), pageCount: 1 };
  }
  throw new Error(`Format ${contentType || "tidak dikenal"} tidak dapat ditampilkan di browser`);
}

export function DocumentPageView({
  fileUrl,
  page,
  zoom,
  boxes,
  onPageCount,
  onBoxClick,
}: DocumentPageViewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);

  // Load the original file.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFile(null);
    let p = fileCache.get(fileUrl);
    if (!p) {
      p = loadFile(fileUrl);
      fileCache.set(fileUrl, p);
      p.catch(() => fileCache.delete(fileUrl));
    }
    p.then((f) => {
      if (cancelled) return;
      setFile(f);
      onPageCount(f.pageCount);
      setLoading(false);
    }).catch((e: Error) => {
      if (cancelled) return;
      setError(e.message);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl]);

  // Track available width so the page always fits the pane at 100% zoom.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const targetWidth = Math.max(200, (containerWidth - 24) * (zoom / 100));

  // Render the PDF page onto a canvas.
  useEffect(() => {
    if (!file || file.kind !== "pdf" || !file.pdf || !canvasRef.current || containerWidth === 0) return;
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null;
    (async () => {
      const pageNo = Math.min(Math.max(page, 1), file.pageCount);
      const pdfPage = await file.pdf!.getPage(pageNo);
      if (cancelled) return;
      const base = pdfPage.getViewport({ scale: 1 });
      const cssScale = targetWidth / base.width;
      const dpr = window.devicePixelRatio || 1;
      const viewport = pdfPage.getViewport({ scale: cssScale * dpr });
      const canvas = canvasRef.current!;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${targetWidth}px`;
      canvas.style.height = `${targetWidth * (base.height / base.width)}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      task = pdfPage.render({ canvas, canvasContext: ctx, viewport });
      try {
        await task.promise;
      } catch {
        /* render cancelled by a newer render */
      }
    })().catch((e) => !cancelled && setError(String(e?.message || e)));
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [file, page, targetWidth, containerWidth]);

  const pageBoxes = boxes.filter((b) => b.page === page);

  return (
    <div ref={wrapRef} className="w-full h-full overflow-auto bg-slate-200/70 p-3">
      {loading && (
        <div className="py-16 text-center text-xs text-slate-500">Memuat dokumen asli...</div>
      )}
      {error && (
        <div className="m-4 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          Dokumen asli tidak dapat ditampilkan: {error}
        </div>
      )}
      {!error && file && (
        <div
          className="relative mx-auto bg-white shadow-md"
          style={{ width: targetWidth }}
        >
          {file.kind === "pdf" ? (
            <canvas ref={canvasRef} className="block" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.imageUrl}
              alt="Dokumen asli"
              className="block w-full h-auto select-none"
              draggable={false}
            />
          )}
          {/* Overlay shares the page box exactly, so % coordinates map 1:1 to the page image. */}
          <div className="absolute inset-0">
            {pageBoxes.map((b) => (
              <button
                key={b.id}
                type="button"
                title={b.title}
                aria-label={b.title}
                onClick={() => onBoxClick(b.id)}
                className={`absolute border-2 rounded-[2px] transition-colors cursor-pointer ${TONE_CLASS[b.tone]}`}
                style={{
                  left: `${b.x1 * 100}%`,
                  top: `${b.y1 * 100}%`,
                  width: `${(b.x2 - b.x1) * 100}%`,
                  height: `${(b.y2 - b.y1) * 100}%`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
