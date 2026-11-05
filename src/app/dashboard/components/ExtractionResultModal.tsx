"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { X, ZoomIn, ZoomOut, Download, AlertCircle, Loader2, ChevronRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_V1 } from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  btnGhost,
  btnOutline,
  btnPrimary,
  chip,
  focusRing,
  inputClass,
  panel,
  panelHeader,
  panelTitle,
  td,
  th,
} from "@/lib/dashboard-ui";
import { asTablePayload, displayValue } from "@/lib/review";

interface ExtractionResultModalProps {
  documentId: string;
  onClose: () => void;
}

interface BBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  page: number;
}

interface ExtractedField {
  field: string;
  value: unknown;
  confidence: number;
  source?: {
    bbox?: BBox;
    page?: number;
    text?: string;
  };
  predicted_raw_text?: string;
}

interface ExtractionResult {
  document_id: string;
  status: string;
  page_count: number;
  classification?: {
    document_type?: string;
    confidence?: number;
  };
  extracted_fields: ExtractedField[];
  pages: Array<{
    page_number: number;
    page_image?: {
      width: number;
      height: number;
    };
  }>;
}

export function ExtractionResultModal({ documentId, onClose }: ExtractionResultModalProps) {
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [showAllBoxes, setShowAllBoxes] = useState(true);

  // Image dimensions for rendering
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);

  useEffect(() => {
    const fetchExtraction = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch document extraction result
        const response = await fetch(`${API_V1}/documents/${documentId}/extraction`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to load extraction: ${response.statusText}`);
        }

        const data: ExtractionResult = await response.json();
        setExtraction(data);

        // Set initial image dimensions from first page
        if (data.pages && data.pages.length > 0) {
          const firstPage = data.pages[0];
          if (firstPage.page_image) {
            setImageWidth(firstPage.page_image.width);
            setImageHeight(firstPage.page_image.height);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load extraction result");
      } finally {
        setLoading(false);
      }
    };

    fetchExtraction();
  }, [documentId]);

  // Get page image URL
  const getPageImageUrl = useCallback((page: number) => {
    return `${API_V1}/documents/${documentId}/pages/${page}/image`;
  }, [documentId]);

  // Get fields for current page
  const fieldsOnPage = useMemo(() => {
    if (!extraction) return [];
    return extraction.extracted_fields.filter(
      (field) => field.source?.page === currentPage || field.source?.bbox?.page === currentPage
    );
  }, [extraction, currentPage]);

  // Get bounding box for field
  const getBBox = (field: ExtractedField): BBox | null => {
    if (field.source?.bbox) return field.source.bbox;
    return null;
  };

  // Convert normalized bbox to pixel coordinates
  const bboxToPixels = (bbox: BBox) => {
    if (!imageWidth || !imageHeight) return null;

    return {
      left: bbox.x0 * imageWidth,
      top: bbox.y0 * imageHeight,
      width: (bbox.x1 - bbox.x0) * imageWidth,
      height: (bbox.y1 - bbox.y0) * imageHeight,
    };
  };

  // Handle field click - highlight bbox and scroll to view
  const handleFieldClick = (fieldName: string) => {
    setHighlightedField(fieldName === highlightedField ? null : fieldName);

    // Find field and navigate to its page
    const field = extraction?.extracted_fields.find((f) => f.field === fieldName);
    if (field?.source?.page) {
      setCurrentPage(field.source.page);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className={cn(panel, "w-full max-w-md p-8")}>
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-sm text-neutral-600 dark:text-neutral-300">
              Loading extraction result...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !extraction) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className={cn(panel, "w-full max-w-md p-6")}>
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                Failed to Load Extraction
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {error || "Unknown error occurred"}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose} className={btnPrimary}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const docType = extraction.classification?.document_type || "UNKNOWN";
  const confidence = extraction.classification?.confidence || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={cn(panel, "w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col")}>
        {/* Header */}
        <div className={cn(panelHeader, "flex items-center justify-between border-b")}>
          <div>
            <h2 className={panelTitle}>Extraction Result</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(chip, "text-xs")}>
                {docType}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Confidence: {(confidence * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                • {extraction.page_count} page{extraction.page_count > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <Button onClick={onClose} className={btnGhost} size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Left: PDF/Image Viewer with Bounding Boxes */}
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            {/* Viewer Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={btnOutline}
                  size="sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-neutral-600 dark:text-neutral-300 px-2">
                  Page {currentPage} of {extraction.page_count}
                </span>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(extraction.page_count, p + 1))}
                  disabled={currentPage === extraction.page_count}
                  className={btnOutline}
                  size="sm"
                >
                  Next
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowAllBoxes(!showAllBoxes)}
                  className={btnOutline}
                  size="sm"
                  title={showAllBoxes ? "Hide all boxes" : "Show all boxes"}
                >
                  {showAllBoxes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className={btnOutline}
                  size="sm"
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-neutral-600 dark:text-neutral-300 px-1 w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  onClick={() => setZoom((z) => Math.min(2.0, z + 0.25))}
                  className={btnOutline}
                  size="sm"
                  disabled={zoom >= 2.0}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Document Viewer */}
            <div className="flex-1 relative overflow-auto bg-neutral-100 dark:bg-neutral-900 rounded-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="relative"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                  }}
                >
                  {/* Page Image */}
                  <img
                    src={getPageImageUrl(currentPage)}
                    alt={`Page ${currentPage}`}
                    className="max-w-none"
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      setImageWidth(img.naturalWidth);
                      setImageHeight(img.naturalHeight);
                    }}
                  />

                  {/* Bounding Boxes Overlay */}
                  {imageWidth > 0 && imageHeight > 0 && (
                    <svg
                      className="absolute inset-0 pointer-events-none"
                      width={imageWidth}
                      height={imageHeight}
                      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
                    >
                      {extraction.extracted_fields.map((field, idx) => {
                        const bbox = getBBox(field);
                        if (!bbox || bbox.page !== currentPage) return null;

                        const pixels = bboxToPixels(bbox);
                        if (!pixels) return null;

                        const isHighlighted = highlightedField === field.field;
                        const isVisible = showAllBoxes || isHighlighted;

                        if (!isVisible) return null;

                        return (
                          <g key={`${field.field}-${idx}`}>
                            <rect
                              x={pixels.left}
                              y={pixels.top}
                              width={pixels.width}
                              height={pixels.height}
                              fill={isHighlighted ? "rgba(59, 130, 246, 0.2)" : "rgba(34, 197, 94, 0.15)"}
                              stroke={isHighlighted ? "#3b82f6" : "#22c55e"}
                              strokeWidth={isHighlighted ? 3 : 2}
                              className="transition-all"
                            />
                            {isHighlighted && (
                              <text
                                x={pixels.left}
                                y={pixels.top - 4}
                                fontSize="12"
                                fill="#3b82f6"
                                fontWeight="bold"
                              >
                                {field.field}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Fields on Current Page */}
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {fieldsOnPage.length} field{fieldsOnPage.length !== 1 ? "s" : ""} on this page
            </div>
          </div>

          {/* Right: Field List */}
          <div className="w-[400px] flex flex-col gap-2 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Extracted Fields ({extraction.extracted_fields.length})
              </h3>
            </div>

            <div className="flex-1 overflow-auto space-y-2">
              {extraction.extracted_fields.map((field, idx) => {
                const isHighlighted = highlightedField === field.field;
                const table = asTablePayload(field.value);
                const hasSource = Boolean(field.source?.bbox);

                return (
                  <div
                    key={`${field.field}-${idx}`}
                    className={cn(
                      "border rounded-lg p-3 cursor-pointer transition-all",
                      isHighlighted
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600",
                      !hasSource && "opacity-60"
                    )}
                    onClick={() => hasSource && handleFieldClick(field.field)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                          {field.field}
                        </span>
                        {hasSource && (
                          <ChevronRight
                            className={cn(
                              "h-3 w-3 transition-transform",
                              isHighlighted && "rotate-90"
                            )}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          field.confidence >= 0.9
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : field.confidence >= 0.7
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                            : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        )}
                      >
                        {(field.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="text-sm text-neutral-600 dark:text-neutral-400 break-words">
                      {table ? (
                        <div className="mt-2">
                          <div className="text-xs text-neutral-500 mb-1">
                            Table ({table.rows.length} rows)
                          </div>
                          <div className="max-h-32 overflow-auto text-xs">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-neutral-100 dark:bg-neutral-800">
                                  {table.headers?.map((header, i) => (
                                    <th key={i} className={cn(th, "text-xs p-1")}>
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {table.rows.slice(0, 3).map((row, i) => (
                                  <tr key={i}>
                                    {row.cells?.map((cell, j) => (
                                      <td key={j} className={cn(td, "text-xs p-1")}>
                                        {String(cell || "")}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {table.rows.length > 3 && (
                              <div className="text-xs text-neutral-400 text-center mt-1">
                                +{table.rows.length - 3} more rows
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        displayValue(field.value, field.predicted_raw_text)
                      )}
                    </div>

                    {hasSource && field.source?.page && (
                      <div className="text-xs text-neutral-400 mt-1">
                        Page {field.source.page}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Document ID: {documentId}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => window.open(`${API_V1}/documents/${documentId}/download`, "_blank")}
              className={btnOutline}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Original
            </Button>
            <Button onClick={onClose} className={btnPrimary}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
