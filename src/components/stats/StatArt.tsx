"use client";

import React, { useId } from "react";

/*
 * Glossy, dimensional illustrations for stat cards. Each one is hand-built SVG with gradients,
 * a soft highlight, and a drop shadow. Colors come from the card's tone, so each object sits in the
 * same hue family as its card. Each illustration is tilted and cropped at the card edge to look less stiff.
 */

export type StatArtTone = "neutral" | "positive" | "attention" | "warning";
export type StatArtName = "coins" | "drop" | "alert" | "seal" | "shield" | "documents" | "truck";

interface Palette {
  hi: string;
  mid: string;
  lo: string;
  ink: string;
  pale: string;
}

/* Illustration colors per tone. Each set stays in the hue of its card's tint. */
const PALETTES: Record<StatArtTone, Palette> = {
  neutral: { hi: "#EAF6FF", mid: "#4D9BEA", lo: "#1B4F8F", ink: "#1B2F52", pale: "#CFE3F8" },
  positive: { hi: "#F1FFF9", mid: "#2CC48E", lo: "#0A7A58", ink: "#0A5E47", pale: "#CBF0DF" },
  attention: { hi: "#FFF1F4", mid: "#F5667F", lo: "#B3223F", ink: "#8E1A31", pale: "#FBD3DC" },
  warning: { hi: "#FFF6EC", mid: "#FFB05A", lo: "#C2530F", ink: "#7A2A05", pale: "#FCD9B8" },
};

/* Tilt per illustration, in degrees. Small angles keep the objects lively without looking skewed. */
const ROTATION: Record<StatArtName, number> = {
  coins: -10,
  drop: 12,
  alert: -9,
  seal: 6,
  shield: -8,
  documents: 9,
  truck: -5,
};

type ArtRenderer = (id: string, p: Palette) => React.ReactNode;

const DROP_PATH = "M60 12 C60 12 25 56 25 80 C25 99 40.5 111 60 111 C79.5 111 95 99 95 80 C95 56 60 12 60 12 Z";
const SHIELD_PATH = "M60 12 L98 25 V56 C98 82 81 98 60 108 C39 98 22 82 22 56 V25 Z";

/** Scalloped rosette outline, built once from a sine wave around a circle. */
function buildSealPath(): string {
  const steps = 180;
  const points: string[] = [];
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    const radius = 41 + 3.2 * Math.cos(16 * angle);
    points.push(`${(60 + radius * Math.cos(angle)).toFixed(2)} ${(60 + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return `M${points.join(" L")} Z`;
}

const SEAL_PATH = buildSealPath();

function liftFilter(id: string, p: Palette) {
  return (
    <filter id={`${id}-lift`} x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor={p.lo} floodOpacity="0.35" />
    </filter>
  );
}

function gloss(cx: number, cy: number, rx: number, ry: number, rotate: number) {
  return (
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#FFFFFF" opacity={0.7} transform={`rotate(${rotate} ${cx} ${cy})`} />
  );
}

function sparkle(x: number, y: number, scale: number, color: string) {
  const s = scale;
  const d = `M${x} ${y - 8 * s} L${x + 2 * s} ${y - 2 * s} L${x + 8 * s} ${y} L${x + 2 * s} ${y + 2 * s} L${x} ${y + 8 * s} L${x - 2 * s} ${y + 2 * s} L${x - 8 * s} ${y} L${x - 2 * s} ${y - 2 * s} Z`;
  return <path d={d} fill={color} />;
}

const coins: ArtRenderer = (id, p) => (
  <>
    <defs>
      {liftFilter(id, p)}
      <linearGradient id={`${id}-side`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={p.mid} />
        <stop offset="1" stopColor={p.lo} />
      </linearGradient>
      <radialGradient id={`${id}-face`} cx="0.36" cy="0.3" r="0.85">
        <stop offset="0" stopColor={p.hi} />
        <stop offset="0.6" stopColor={p.mid} />
        <stop offset="1" stopColor={p.lo} />
      </radialGradient>
    </defs>
    <g filter={`url(#${id}-lift)`}>
      {[96, 82, 68].map((base) => (
        <g key={base}>
          <path
            d={`M20 ${base - 8} V${base} A40 16 0 0 0 100 ${base} V${base - 8} A40 16 0 0 1 20 ${base - 8} Z`}
            fill={`url(#${id}-side)`}
          />
          <ellipse cx="60" cy={base - 8} rx="40" ry="16" fill={`url(#${id}-face)`} />
          <ellipse cx="60" cy={base - 8} rx="27" ry="10.5" fill="none" stroke={p.lo} strokeOpacity={0.4} strokeWidth={1.6} />
        </g>
      ))}
    </g>
    {gloss(46, 57, 12, 4, -12)}
    {sparkle(100, 20, 1.3, p.mid)}
  </>
);

const drop: ArtRenderer = (id, p) => (
  <>
    <defs>
      {liftFilter(id, p)}
      <radialGradient id={`${id}-drop`} cx="0.36" cy="0.32" r="0.9">
        <stop offset="0" stopColor={p.hi} />
        <stop offset="0.5" stopColor={p.mid} />
        <stop offset="1" stopColor={p.lo} />
      </radialGradient>
    </defs>
    <g filter={`url(#${id}-lift)`}>
      <path d={DROP_PATH} fill={`url(#${id}-drop)`} />
      <path d="M86 74 C86 92 76 104 60 109 C80 104 90 94 90 80 Z" fill={p.lo} opacity={0.25} />
    </g>
    {gloss(45, 72, 6, 11, 18)}
    <g transform="translate(74 18) scale(0.36)">
      <path d={DROP_PATH} fill={`url(#${id}-drop)`} />
    </g>
    <ellipse cx="60" cy="113" rx="26" ry="4" fill={p.lo} opacity={0.2} />
  </>
);

const alert: ArtRenderer = (id, p) => (
  <>
    <defs>
      {liftFilter(id, p)}
      <linearGradient id={`${id}-tri`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={p.hi} />
        <stop offset="0.55" stopColor={p.mid} />
        <stop offset="1" stopColor={p.lo} />
      </linearGradient>
    </defs>
    <g filter={`url(#${id}-lift)`}>
      <path
        d="M60 14 L106 98 Q110 106 100 106 L20 106 Q10 106 14 98 Z"
        fill={`url(#${id}-tri)`}
        stroke={p.hi}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </g>
    <path d="M32 92 L55 38 L60 38 L37 94 Z" fill={p.hi} opacity={0.5} />
    <rect x="54.5" y="46" width="11" height="36" rx="5.5" fill={p.ink} />
    <circle cx="60" cy="93" r="6.5" fill={p.ink} />
  </>
);

const seal: ArtRenderer = (id, p) => (
  <>
    <defs>
      {liftFilter(id, p)}
      <radialGradient id={`${id}-badge`} cx="0.36" cy="0.3" r="0.9">
        <stop offset="0" stopColor={p.hi} />
        <stop offset="1" stopColor={p.pale} />
      </radialGradient>
      <linearGradient id={`${id}-core`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={p.mid} />
        <stop offset="1" stopColor={p.lo} />
      </linearGradient>
    </defs>
    <g filter={`url(#${id}-lift)`}>
      <path d={SEAL_PATH} fill={`url(#${id}-badge)`} stroke={p.mid} strokeOpacity={0.5} strokeWidth={1.5} />
      <circle cx="60" cy="60" r="27" fill={`url(#${id}-core)`} />
    </g>
    <path d="M47 61 L57 71 L74 52" fill="none" stroke={p.hi} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    {gloss(51, 42, 9, 3.5, -22)}
  </>
);

const shield: ArtRenderer = (id, p) => (
  <>
    <defs>
      {liftFilter(id, p)}
      <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stopColor={p.hi} />
        <stop offset="1" stopColor={p.pale} />
      </linearGradient>
      <linearGradient id={`${id}-core`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={p.mid} />
        <stop offset="1" stopColor={p.lo} />
      </linearGradient>
    </defs>
    <g filter={`url(#${id}-lift)`}>
      <path d={SHIELD_PATH} fill={`url(#${id}-body)`} stroke={p.mid} strokeOpacity={0.5} strokeWidth={1.5} />
    </g>
    <path d={SHIELD_PATH} fill={`url(#${id}-core)`} transform="translate(60 58) scale(0.76) translate(-60 -58)" />
    <path d="M47 60 L57 70 L74 50" fill="none" stroke={p.hi} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    {gloss(44, 30, 8, 3.5, -30)}
  </>
);

const documents: ArtRenderer = (id, p) => (
  <>
    <defs>
      {liftFilter(id, p)}
      <linearGradient id={`${id}-page`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={p.hi} />
        <stop offset="1" stopColor={p.pale} />
      </linearGradient>
    </defs>
    <g filter={`url(#${id}-lift)`}>
      <rect x="36" y="14" width="58" height="72" rx="9" fill={p.mid} opacity={0.45} transform="rotate(10 65 50)" />
      <rect x="28" y="22" width="58" height="72" rx="9" fill={p.pale} transform="rotate(-4 57 58)" />
      <rect x="22" y="30" width="62" height="74" rx="10" fill={`url(#${id}-page)`} />
    </g>
    <rect x="34" y="50" width="38" height="5" rx="2.5" fill={p.mid} />
    <rect x="34" y="62" width="46" height="5" rx="2.5" fill={p.pale} />
    <rect x="34" y="74" width="28" height="5" rx="2.5" fill={p.pale} />
    <circle cx="82" cy="88" r="11" fill={p.mid} />
    <path d="M77 88 L81 92 L88 84" fill="none" stroke={p.hi} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </>
);

const truck: ArtRenderer = (id, p) => (
  <>
    <defs>
      {liftFilter(id, p)}
      <linearGradient id={`${id}-box`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={p.hi} />
        <stop offset="1" stopColor={p.pale} />
      </linearGradient>
      <linearGradient id={`${id}-cab`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={p.mid} />
        <stop offset="1" stopColor={p.lo} />
      </linearGradient>
    </defs>
    <g filter={`url(#${id}-lift)`} transform="translate(-6 0)">
      <rect x="8" y="34" width="66" height="50" rx="9" fill={`url(#${id}-box)`} />
      <path d="M78 52 H96 Q101 52 104 57 L112 70 Q114 74 114 78 V84 H78 Z" fill={`url(#${id}-cab)`} />
      <path d="M85 58 H95 Q97 58 98 60 L104 69 H85 Z" fill={p.hi} opacity={0.9} />
      <rect x="14" y="66" width="54" height="5" rx="2.5" fill={p.lo} />
      <circle cx="30" cy="88" r="11" fill={p.ink} />
      <circle cx="30" cy="88" r="4.5" fill={p.pale} />
      <circle cx="94" cy="88" r="11" fill={p.ink} />
      <circle cx="94" cy="88" r="4.5" fill={p.pale} />
    </g>
  </>
);

const RENDERERS: Record<StatArtName, ArtRenderer> = {
  coins,
  drop,
  alert,
  seal,
  shield,
  documents,
  truck,
};

export interface StatArtProps {
  name: StatArtName;
  tone: StatArtTone;
  className?: string;
}

/** Decorative 3D-style illustration for a stat card, tinted to the card's tone and tilted. */
export function StatArt({ name, tone, className }: StatArtProps) {
  // useId keeps gradient and filter ids unique when the same illustration renders more than once.
  const id = `stat-art-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ transform: `rotate(${ROTATION[name]}deg)` }}
    >
      {RENDERERS[name](id, PALETTES[tone])}
    </svg>
  );
}
