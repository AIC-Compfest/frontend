import { cn } from "@/lib/utils";

/*
 * Shared class strings for dashboard surfaces. They are token-based and sit on top of the
 * components/ui primitives, which keep their landing-page defaults. Pass them through cn()
 * so that they override the primitive's base classes.
 */

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

export const pageTitle =
  "font-sans text-[22px] font-bold leading-tight tracking-normal text-ink md:text-[28px]";

export const panel = "rounded-card border border-hairline bg-card text-ink shadow-none";

export const panelHeader =
  "flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4";

export const panelTitle =
  "font-sans text-[18px] font-semibold leading-snug tracking-normal text-ink";

export const label = "text-[12px] font-semibold uppercase tracking-[.08em] text-muted";

export const kpiValue = "text-[26px] font-semibold leading-none tabular-nums text-ink";

export const tableWrap = "overflow-hidden rounded-panel border border-hairline bg-card";

export const th =
  "border-b border-hairline bg-surface-soft px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[.08em] text-body";

export const td = "px-4 py-3 align-middle text-[13px] text-ink tabular-nums";

export const trHover = "border-b border-hairline last:border-b-0 transition-colors hover:bg-surface-soft";

export const emptyState = "flex flex-col items-center justify-center gap-2 px-6 py-14 text-center text-[13px] text-body";

export const fieldBase =
  "rounded-control border border-hairline bg-card text-[13px] text-ink shadow-none placeholder:text-muted " +
  focusRing;

export const inputClass = cn("h-10 px-3", fieldBase);
export const selectClass = cn("h-10 cursor-pointer px-3 font-medium", fieldBase);
export const textareaClass = cn("p-3", fieldBase);

export const btnBase =
  "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-control px-4 text-[13px] font-semibold shadow-none active:scale-[0.98] [&_svg]:shrink-0 " +
  focusRing;

export const btnPrimary = cn(btnBase, "bg-navy text-white hover:bg-navy-deep");
export const btnSecondary = cn(btnBase, "bg-surface-strong text-navy hover:bg-hairline");
export const btnOutline = cn(btnBase, "border border-hairline bg-card text-ink hover:bg-surface-soft");
export const btnGhost = cn(btnBase, "text-body hover:bg-surface-soft hover:text-ink");
export const btnDanger = cn(btnBase, "bg-error-ink text-white hover:opacity-90");

export type ChipTone =
  | "neutral"
  | "navy"
  | "action"
  | "success"
  | "warning"
  | "error"
  | "solidNavy"
  | "solidSuccess"
  | "solidError";

const chipTones: Record<ChipTone, string> = {
  neutral: "bg-surface-soft text-body",
  navy: "bg-surface-soft text-navy",
  action: "bg-action/10 text-action-ink",
  success: "bg-teal-soft text-teal-ink",
  warning: "bg-warning-soft text-warning-ink",
  error: "bg-error-soft text-error-ink",
  solidNavy: "bg-navy text-white",
  solidSuccess: "bg-teal-ink text-white",
  solidError: "bg-error-ink text-white",
};

/** Status and count chip. Pill-shaped, uppercase only when the text itself is uppercase. */
export function chip(tone: ChipTone, extra?: string): string {
  return cn(
    "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-5",
    chipTones[tone],
    extra
  );
}

/** Square icon plate, 9px radius. */
export function iconPlate(tone: "neutral" | "navy" | "action" | "success" | "warning" | "error" = "neutral") {
  const tones = {
    neutral: "bg-surface-soft text-navy",
    navy: "bg-navy text-navy-muted",
    action: "bg-action/10 text-action",
    success: "bg-teal-soft text-teal-ink",
    warning: "bg-warning-soft text-warning-ink",
    error: "bg-error-soft text-error-ink",
  } as const;
  return cn("grid h-9 w-9 shrink-0 place-items-center rounded-plate", tones[tone]);
}
