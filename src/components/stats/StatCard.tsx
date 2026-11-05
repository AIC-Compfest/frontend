"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { StatArt, type StatArtName, type StatArtTone } from "./StatArt";

export type { StatArtName } from "./StatArt";

/** neutral uses the brand blue. positive is green, attention is red, and warning is orange. */
export type StatTone = StatArtTone;

export interface StatCardProps {
  label: string;
  value?: React.ReactNode;
  caption?: string;
  tone?: StatTone;
  art?: StatArtName;
  variant?: "default" | "compact";
  loading?: boolean;
  /** Replaces the headline figure, for cards that show a breakdown. */
  children?: React.ReactNode;
}

/**
 * Soft status card. The tone sets a pale tint, the label takes the tone's deep ink, and the
 * illustration uses the same hue. Figures use Figtree with tabular numerals.
 */
export function StatCard({
  label,
  value,
  caption,
  tone = "neutral",
  art,
  variant = "default",
  loading = false,
  children,
}: StatCardProps) {
  const compact = variant === "compact";
  // Long currency strings, such as full IDR amounts, step down a size so they stay on one line.
  const longValue = typeof value === "string" && value.length > 13;

  return (
    <div
      className={cn(
        "stat-card relative isolate flex flex-col overflow-hidden rounded-card",
        `stat-card--${tone}`,
        compact ? "min-h-[104px] p-3.5" : "min-h-[124px] p-4"
      )}
    >
      <p
        className={cn(
          "font-semibold uppercase leading-tight tracking-[.08em]",
          compact ? "pr-11 text-[11px]" : "pr-16 text-[12px]"
        )}
        style={{ color: "var(--stat-ink)" }}
      >
        {label}
      </p>

      {art && (
        <StatArt
          name={art}
          tone={tone}
          className={cn(
            "stat-art pointer-events-none absolute select-none top-1/2 -translate-y-1/2",
            compact ? "-right-4 h-[76px] w-[76px]" : "-right-6 h-28 w-28"
          )}
        />
      )}

      <div className={cn("mt-auto", compact ? "pt-3" : "pt-4")}>
        {loading ? (
          <div className={cn("animate-pulse rounded-control bg-white/70", compact ? "h-4 w-20" : "h-6 w-28")} />
        ) : (
          value !== undefined && (
            <p
              className={cn(
                "whitespace-nowrap font-semibold leading-none tabular-nums text-ink",
                longValue ? (compact ? "text-[16px]" : "text-[20px]") : compact ? "text-[18px]" : "text-[24px]"
              )}
            >
              {value}
            </p>
          )
        )}
        {!loading && children}
        {caption && <p className={cn("text-[13px] leading-5 text-body", compact ? "mt-1" : "mt-1.5")}>{caption}</p>}
      </div>
    </div>
  );
}
