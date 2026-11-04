# Verflo Dashboard Redesign: Agent Brief

You are revamping the reviewer dashboard of the Verflo frontend (Next.js 16 App Router, React 19, Tailwind CSS 4, lucide-react). The backend services and API client already exist and must keep working unchanged. Your job is presentation, copy, and cleanup. Behavior stays the same.

## 0. Read these first, in this order

1. `.agents/DESIGN.md` is the brand and marketing design system. Read all of it. Its colors, typography, and blob-hero rules apply to the landing page and to the brand moments in the app. Section 5 below overrides its rules for the working dashboard.
2. `.agents/skills/design-taste-frontend/SKILL.md`, `.agents/skills/brandkit/SKILL.md`, and `.agents/skills/redesign-existing-projects/SKILL.md`. Use them for taste and process. (The `.kiro` folder mirrors `.agents`, so the same files are there.)
3. This brief.
4. The landing page (`src/app/page.tsx` and `src/components/landing/*`) to see the marketing vibe you are matching.

Visual references, which the user will attach separately, are summarized in section 4. Use them for the sidebar and the table/card feel. Do not copy them literally.

## 1. Goal and scope

**In scope (restyle and copy):**
- App shell in `src/app/dashboard/page.tsx` (layout, header bar, page titles)
- `src/app/dashboard/components/Sidebar.tsx` (full rebuild, see section 6)
- List and overview views: `OverviewView`, `ReviewQueue` (`src/components/ReviewQueue.tsx`), `ExceptionView` (Anomaly Archive), `UploadDropzone` (Document Hub), `MitraLogistikView` (Logistics Partners), `DisputeListView`, `GlobalAuditLedgerView` (Audit Ledger Trail), `FinalApprovalView`, `SettingsView` (Policy & Tolerance)
- Brand tokens and fonts, wired into Tailwind and `globals.css`

**Restyle deferred. Copy and tokens only:** `EvidenceViewer`, `ReconciliationCard`, `DecisionModal`, `DisputePackageModal`, `AuditTrailView`, `BatchHitlReviewModal` (the live one, see section 9), and `components/evidence/DocumentPageView.tsx`. Replace hard-coded colors with tokens and translate their strings to English (section 8), but do not redesign their layouts yet.

**Out of scope:** the landing page, login, register, and home route. Do not change them except to share the font and token setup.

## 2. Hard constraints (do not change)

- **Routes and query params:** the dashboard reads `?role=` and `?event=`. Keep both working. `?event=` deep-links into the Evidence Workspace tab.
- **API calls and services:** every `fetch` URL, request body, and response handling stays as is. Do not touch `src/lib/api.ts`, `src/lib/config.ts`, `src/lib/auth.ts`, `src/lib/review.ts`, `src/app/api/*`, `src/types/*`, or `src/lib/field_registry.gen.ts`.
- **Data contracts:** keep every enum value exactly as it is, including `INVOICE`, `SURAT_JALAN`, `POD`, `RATE_AGREEMENT`, `UNKNOWN`, and the status values (`MATCH`, `EXCEPTION`, `DUPLICATE`, `INSUFFICIENT_EVIDENCE`, `REJECTED`, `APPROVED`, `DISPUTED`, and others). Only the displayed labels change.
- **Tab state:** the dashboard uses internal `currentTab` state with `DashboardTab` values. Keep that model. Do not convert tabs to URL routes.
- **Filename heuristics:** `UploadDropzone` classifies uploads by filename substrings (`sj`, `surat_jalan`, `do_`, `pod`, `bukti`, `tanda_terima`). Keep the logic exactly as it is.
- **Business logic:** no financial calculation in the frontend, and no change to decision logic, validation rules, or thresholds.
- **Dependencies:** do not add UI libraries. Use what is installed (Tailwind 4, lucide-react, the existing `components/ui/*` primitives). Tailwind 4 is in use, so define brand tokens with an `@theme` block in `globals.css`.
- **Verify icon names** exist in the installed `lucide-react` before using them.

## 3. Current app map (what you are working with)

- `src/app/layout.tsx`: root layout. Loads no fonts. Body uses `bg-[#F7F9FB]`.
- `src/app/globals.css`: declares `--font-sans: "Figtree"` and `--font-display: "Boldonse"`, but nothing loads those fonts. There is no `@theme` block. Hex values are repeated throughout the components.
- `src/app/dashboard/page.tsx`: the shell. Renders `<Sidebar>` on the left and a `<header>` plus `<main>` on the right. `currentTab` switches the view. The header title is a `{currentTab === ...}` chain. Also holds the dual-pane Evidence Workspace (the `WORKSPACE` tab, which is not listed in the sidebar and is reached via `handleSelectTransaction`).
- `src/app/dashboard/components/Sidebar.tsx`: fixed `w-72` panel with three sections, a brand card at the top, a sign-out link at the bottom, and props `queueCount` and `exceptionCount` that are received but never rendered.
- `src/components/logo/VeriflowLogo.jsx`: picks the SVG by `variant` prop. Available variants: default, `light`, `dark`, `icon`, `icon-light`, `icon-dark`. Files live in `/public`.
- `src/app/dashboard/components/*.tsx`: list views (see section 1).

Sidebar navigation (current labels, to be translated per section 8):

| Section | Tab | Current label |
|---|---|---|
| Reconciliation & Approval | OVERVIEW | Overview |
| | QUEUE | Review Queue |
| | EXCEPTIONS | Arsip Anomali |
| | FINAL_APPROVAL | Final Approval |
| Data & Master PKS | UPLOAD | Document Hub |
| | CONTRACTS | Mitra Logistik |
| Audit & Governance | DISPUTES | Dispute Packages |
| | AUDIT | Audit Ledger Trail |
| | SETTINGS | Policy & Tolerance |

## 4. Design direction and references

**The vibe:** the landing page is airy, blue-tinted, and confident. The dashboard should feel like the same product in its working clothes: calm, precise, and easy to scan. It should not feel like a generic admin template, and it should not feel like a marketing page.

**Reference notes (what to take from each):**
- Reference 1, the landing screenshot: brand tone, the navy/blue palette, pill buttons, hairline cards.
- Current dashboard screenshot: the baseline to beat. It has heavy hard-coded slate and sky colors, and it is cluttered with filler.
- Medical-app dashboard: icon rail proportions and generous icon spacing. Do not copy the pink floating notch.
- PinHome (teal sidebar, bookings): **the active nav item is a white shape that opens into the content area, with concave corners where it meets the main panel.** This is the target for our active state. Also the table row rhythm.
- Polytrox (orange orders): slim icon rail with a short bar marking the active icon. Status pills in table rows.
- Flight dashboard (green): a light active tab that connects to the content, plus stat tiles with a bold number and a small label.
- Finexy (finance): icon-only rail, bento-style stat tiles with a large number, a clean table with row checkboxes and small status dots, and a top segmented tab bar.
- Goodle Drive (blue): clean file table with hairline rows and a clear column header row.

Use these as the mood board, not as a template. The user will attach the images separately.

## 5. Dashboard design system (overrides DESIGN.md inside the app)

DESIGN.md is correct for the marketing pages. Inside the working dashboard, use the rules below. The user explicitly does not want every surface as rounded as the marketing page, because that makes dense data harder to read. Roundness is a tool here, not a fixed rule.

**Color tokens.** Add these to `globals.css` in an `@theme` block and use them everywhere, not hex values:

| Token | Hex | Use |
|---|---|---|
| `--color-navy` | `#243A5E` | Sidebar panel, primary buttons, active text |
| `--color-navy-deep` | `#1A2C47` | Pressed states, dark section labels on light |
| `--color-action` | `#0077CC` | Links, focus rings, active icon accent, selected filter |
| `--color-teal` | `#00B4B3` | Success accents, positive variance markers |
| `--color-teal-soft` | `#DFF5F4` | Success chip fill |
| `--color-canvas` | `#F7F9FB` | Page background. Also the active sidebar tab color (see section 6) |
| `--color-surface-soft` | `#E6EEF5` | Table header band, row hover, inactive chip fill |
| `--color-surface-strong` | `#D7E3EE` | Secondary buttons |
| `--color-card` | `#FFFFFF` | Cards, inputs, table body |
| `--color-hairline` | `#CDDBE8` | Borders, dividers |
| `--color-ink` | `#12203A` | Headings, KPI numbers, primary text |
| `--color-body` | `#55637A` | Body text |
| `--color-muted` | `#7C879C` | Labels, captions, timestamps |
| `--color-error` | `#D6455A` | Destructive actions, negative variance text |
| `--color-error-soft` | `#FDECEF` | Error chip fill |
| `--color-warning` | `#B7791F` (new) | Warning text. Not in DESIGN.md. Use sparingly |
| `--color-warning-soft` | `#FFF4DC` (new) | Warning chip fill. Not in DESIGN.md |

Remove every instance of `#1B2A4A`, `#1C2E4A`, and `#8FD7D4`-style one-offs. Remove mixed Tailwind palette usage like `slate-*`, `sky-*`, and `emerald-*` where a token fits. Emerald and sky are the common offenders.

**Typography.**
- Headings (page titles, section titles, card titles): **Boldonse** (loaded via `next/font/google`, see section 10). Page title about 28px. Section and card titles about 18–20px. Do not put Boldonse below 16px. Do not mix Boldonse and Figtree inside one heading.
- Everything else (body, table cells, labels, buttons, KPI numbers, inputs, nav): **Figtree**. Body 14px. Table text 13px. Labels 11–12px, uppercase, `tracking-[.08em]`, weight 600. KPI numbers 26–30px weight 600 with `tabular-nums`.
- Use `font-variant-numeric: tabular-nums` on every money, count, and timestamp.

**Radius (dashboard scale, not the marketing scale):**
- Sidebar panel: square. It is a full-height flush panel with no outer rounding.
- Active sidebar tab: 12px outer corners plus concave fillets where it meets the content (see section 6).
- Cards and panels: 14px.
- Buttons, inputs, selects: 10px.
- Table containers: 12px. Table rows: square.
- Status and count chips: pill (100px). These are badges.
- Icon plates: 8–10px square. Avatars and dots: full circle.
- Tooltips and popovers: 8px.

**Shadows and depth.** No shadow on cards; use a 1px hairline. Only the mobile drawer and popovers get a soft shadow: `0 8px 24px rgba(36,58,94,.12)`. No blobs, gradients, or sparkles inside the working UI except the overview header (section 7).

**Spacing.** 4px base. Page padding 24px desktop and 16px mobile. Card padding 20–24px. Table cell padding 12px 16px. Gaps between cards 16–20px. Density: airy between cards and sections, compact inside tables.

**Motion.** Sidebar width and the mobile drawer slide: 200ms, `cubic-bezier(0.16, 1, 0.3, 1)`. No other motion. Honor `prefers-reduced-motion`.

**Focus.** Every interactive element gets a visible 2px `--color-action` focus ring with a 2px offset. This matters most in the navy sidebar, where the ring must still be visible.

**Contrast.** Check WCAG AA for all text on navy and on canvas. Muted text on navy must still pass AA.

## 6. Sidebar (the main deliverable)

### 6.1 Look
- Solid navy panel, `--color-navy`. Full height, flush to the viewport edges, with a straight right edge. Width: expanded 256px, collapsed 72px.
- **Active item:** the selected tab is filled with `--color-canvas` (the same color as the content area) and has navy text. Its left corners are rounded, and it meets the content on the right. Where the active tab meets the content area, it has concave corners so the tab looks like it opens into the page. Implement the concave corners with two small pseudo-elements using radial gradients, or with an SVG notch. The active tab must look like one piece with the content area. This is the user's main request, so spend the effort here.
- **Inactive items:** text in `#DCE8F5` (on-gradient-soft) on navy. Icons in `#8FB8D6`. Hover: background `rgba(255,255,255,.08)`, text white.
- **Section labels** (expanded only): small uppercase, `#8FB8D6`, with generous space above each group. In the collapsed rail, replace the labels with a thin `rgba(255,255,255,.12)` divider between groups.
- Icons are 18px, stroke 1.75. Labels are 14px weight 500, and weight 600 when active.

### 6.2 Collapse and expand
- **Visible toggle:** a 32px square button at the top of the panel, next to the brand mark. Use lucide `PanelLeftClose` when expanded and `PanelLeftOpen` when collapsed (verify the names in the installed version). Give it a visible hover background and a tooltip reading "Collapse sidebar" or "Expand sidebar". The user asked that the toggle be clear, so do not hide it in a menu and do not make it icon-only without a tooltip.
- **Keyboard:** `Ctrl/Cmd + B` toggles the sidebar. Ignore the shortcut when focus is in an input, select, or textarea.
- **Icon rail tooltips:** when collapsed, every nav item shows a custom tooltip on hover and on keyboard focus, with the full label. Do not use the native `title` attribute as the only label. Add `aria-label` to each icon button.
- **Persistence:** store the collapsed state in `localStorage` under `verflo.sidebar.collapsed`. Read it in a `useEffect` after mount to avoid hydration mismatches. Default is expanded at 1024px and wider, and collapsed below that.
- **Transition:** animate the width over 200ms. Labels fade out before the width shrinks, so text never wraps mid-animation. Use `overflow-hidden` on labels.

### 6.3 Logo
- Expanded: `VeriflowLogo variant="light"` (the wordmark for navy backgrounds).
- Collapsed: `VeriflowLogo variant="icon-light"`.
- Keep the logo at the top of the panel, above the toggle or beside it. Keep it linked to `/`.

### 6.4 Badges
None. No live counts on nav items for now. Do not render `queueCount` or `exceptionCount`. Remove those props from the sidebar if nothing else uses them, and update the call site in `page.tsx` only if the prop removal forces it.

### 6.5 Mobile (below 768px)
- The sidebar is hidden by default and becomes a slide-over drawer from the left, 280px wide, with a backdrop of `rgba(18,32,58,.4)`.
- The header shows a labeled **Menu** button (lines icon plus the word "Menu") on the left. Make it obvious. Do not use an icon alone.
- Close the drawer on: the X button in the drawer, a backdrop click, the Escape key, or selecting a nav item. Lock body scroll while the drawer is open.
- The collapse toggle is hidden on mobile. The drawer is always fully expanded.
- Keep focus inside the drawer while it is open and return focus to the Menu button when it closes.

### 6.6 Footer
Keep "Sign Out" (it links to `/login`) at the bottom of the panel, as a quiet item with the same hover logic. Translate it to English. In the collapsed rail it is an icon with a tooltip.

## 7. Shell and header

- Page background: `--color-canvas`. Content max width: about 1400px. Remove the current `max-w-7xl` if it fights the new layout.
- Header: sticky, `--color-canvas` background at 92% opacity with `backdrop-blur`, bottom hairline. Left: the page title (Boldonse). Right: a neutral **Refresh** button and the role label.
- **Role label:** keep the role text (for example `UNAUTHENTICATED`) as a neutral chip. **Remove the emerald status dot,** because it is always green regardless of state and therefore means nothing.
- **Overview header (the only place blobs appear in the app):** behind the overview title block, place a soft, low-opacity, blurred hexagon or blob composition in the navy-to-teal ramp, similar to the landing hero. Keep it inside that block and make sure text stays readable. Do not add blobs to other views.

## 8. Overview view and filler removal

**`OverviewView.tsx` currently has filler that must go:**
- The rotating greeting array (`languages`, six languages including Japanese, Korean, Chinese, and Russian) and its `setInterval` and `currentLanguageIndex` state. Delete all of it.
- The live clock (`currentTime`, its `setInterval`, and the `font-mono` clock in the header). Delete it.
- The inline `<style>` block with `fadeOnlySmooth` keyframes. Delete it.
- `console.log` debug lines in `fetchSummary` and `fetchVendors`. Delete them.

**Replace it with:** a plain page header. Title "Overview". Subtitle: "Logistics spend reconciliation and audit engine powered by automated 4-way matching." (Keep this sentence in English; it is already English.)

**Layout:** a row of four stat tiles, then two larger cards.
- Stat tiles (use existing data, no new fetches): Total invoiced (IDR), Total variance (IDR), Open exceptions, Clean matches. Use a 4-up bento on desktop and a 2-up on tablet and 1-up on mobile. Number in Figtree 600 with tabular nums. Label in 12px uppercase.
- Card 1: Review Queue (logistics transactions count, Needs Review, Matches Contract, and an "Open Review Queue" button). Keep the same data and the same `onNavigateToQueue` handler.
- Card 2: Logistics Partners (vendor count and vendor list, with a "View Agreements (PKS)" button that calls `onNavigateToContracts`). Keep the loading and empty states, translated.

Keep every number bound to the same props and fields as the current code, including the fallbacks such as `(summary as any)?.total_billed_idr`. Do not change the data mapping.

**Money formatting:** keep `Intl.NumberFormat` with `IDR` and `maximumFractionDigits: 0`. Change the locale from `id-ID` to `en-US` so separators read in English (for example `IDR 1,379,797`). Show the currency code, not the symbol.

**Other filler and meaningless statuses to remove or fix across the dashboard:**
- The header's always-green dot (section 7).
- Any decorative badge whose text does not map to data. Keep a badge only when it reflects a real field or state.
- Commented-out code blocks in every dashboard file (see section 9).

## 9. Cleanup and dead code

**Delete these files:**
- `src/app/dashboard/components/BatchHitlReviewModal.tsx`. Not imported anywhere.
- `src/app/dashboard/components/BatchHitlReviewModal_v2.tsx`. Not imported anywhere.
- `src/app/dashboard/components/BatchHitlReviewModal_Dynamic.tsx`. Not imported anywhere.
- `src/app/dashboard/components/ContractsView.tsx`. Not imported anywhere (the CONTRACTS tab uses `MitraLogistikView`).
- `src/app/dashboard/components/TablePayloadView.tsx`. Only imported by the deleted modals. Delete it once those are gone, and grep again to confirm nothing else uses it.
- `src/app/dashboard/components/__fixtures__/surat_jalan_variation_1.profile.json`. No file imports it. Before deleting, grep for `surat_jalan_variation` across `src` and `tests`. If nothing references it, delete it.

**Keep and rename:** `src/app/dashboard/components/BatchHitlReviewModal_Compact.tsx` is the live modal. `UploadDropzone.tsx` imports it. Rename the file and the exported component to `BatchHitlReviewModal.tsx` / `BatchHitlReviewModal`, and update the import in `UploadDropzone.tsx`.

**Remove commented-out code** in these files: `page.tsx` (for example the commented Workspace nav item and the commented "Workspace connected" badge), `Sidebar.tsx` (commented `FileSearch` import and the commented Workspace item), `FinalApprovalView.tsx`, `UploadDropzone.tsx`, `MitraLogistikView.tsx`, `DisputeListView.tsx`, `OverviewView.tsx`, and the batch modal (now `BatchHitlReviewModal.tsx`). Keep comments that explain why something is non-obvious. Delete comments that restate code or describe removed features.

**Replace hard-coded hex** in dashboard files with tokens (section 5). Roughly 67 arbitrary `[#hex]` classes exist in `src/app/dashboard`. Also replace stray `slate-*`, `sky-*`, and `emerald-*` classes where a brand token fits.

**Other cleanup:**
- Remove `console.log` debug output in dashboard views.
- Do not change `setTimeout` usage that controls toasts or saved-state messages, and do not change `Math.random` ids. They work, so leave them.

## 10. Fonts and tokens setup

1. In `src/app/layout.tsx`, load Boldonse and Figtree with `next/font/google`. Expose them as CSS variables named `--font-boldonse` and `--font-figtree`, and apply both classes to `<html>`.
2. In `globals.css`, update `--font-sans` and `--font-display` to point at those variables, with the fallback stacks from DESIGN.md. Do not leave the old names pointing at fonts that never load.
3. Add the `@theme` token block from section 5 to `globals.css` so Tailwind generates classes such as `bg-navy`, `text-ink`, `border-hairline`, and `bg-canvas`.
4. Keep the existing utility classes (`font-tabular`, `card-border`, `transition-subtle`, scrollbar styles). Remove any that no file uses.
5. The landing page may keep its marketing-only classes. Do not change its look.

## 11. Language and copy

Switch every visible string reached from `/dashboard` to English. This covers the dashboard route and every component it renders, including the inner components (for copy only, see section 1). Keep error messages and toasts in English too.

**Glossary (use these exact terms so the app reads consistently):**

| Current (Indonesian or mixed) | English |
|---|---|
| Arsip Anomali | Anomaly Archive |
| Mitra Logistik / Mitra Logistik 3PL | Logistics Partners (3PL) |
| Data & Master PKS (section) | Data & Master Records |
| Document Ingest Dropzone (page title) | Document Hub |
| Surat Jalan (document type) | Delivery Note (SJ) |
| POD (document type) | Proof of Delivery (POD) |
| PKS / Contract (document type) | Rate Agreement (PKS) |
| INVOICE (document type) | Invoice |
| Dokumen sebelum sistem batch | Documents before batch system |
| Folder upload {id} | Batch {id} |
| Perlu Review | Needs Review |
| Sesuai Kontrak | Matches Contract |
| Total Transaksi Logistik | Logistics Transactions |
| Buka Review Queue | Open Review Queue |
| Lihat Kontrak (PKS) | View Agreements (PKS) |
| Lihat Bukti | View Evidence |
| Semua Anomali | All Anomalies |
| Ditolak (Rejected) | Rejected |
| Bukti Tidak Cukup | Insufficient Evidence |
| Dokumen Tersimpan | Saved Documents |
| Pilih Dokumen | Choose Files |
| Pilih beberapa file atau seret ke sini | Choose files or drag them here |
| Unggah & Audit Batch | Upload & Audit Batch |
| Bersihkan Semua | Clear All |
| Hapus dari antrean | Remove from queue |
| Simpan & lanjutkan nanti | Save & continue later |
| Keputusan | Decision |
| Setujui / Disetujui | Approve / Approved |
| Tolak / Ditolak | Reject / Rejected |
| Koreksi | Correction |
| Memuat... | Loading... |
| Tidak ada ... | No ... |
| Belum ada ... | No ... yet |
| Gagal memuat ... | Failed to load ... |
| Gagal menyimpan ... | Failed to save ... |
| Riwayat Seluruh Keputusan | Full Decision History |
| Policy & Tolerance Thresholds | Policy & Tolerance |
| Dual-Pane Evidence Workspace | Evidence Workspace |
| Spatial Proof Inspection | Proof Inspection |
| Official 3PL Dispute Packages | Dispute Packages |
| Immutable Audit Trail Ledger | Audit Ledger Trail |
| Executive Final Approval (SoD) | Final Approval |
| Overview & Risk Analytics | Overview |
| Priority Review Queue (Anomali) | Review Queue |

Keep the `SJ-` prefix on generated delivery note numbers in `EvidenceViewer`. It is a data fallback, not a label. Keep document number formats as the data supplies them.

If a string is not in the glossary, translate it in the same plain, short style, and list the new translation in your final report.

## 12. Acceptance checklist

Run these and report the results:
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Then check by hand:
- Sidebar expands and collapses, the toggle is clearly visible, the state survives a reload, and the collapsed rail shows icon-only items with tooltips.
- The active tab visually merges into the content area with concave corners.
- Logo switches between the full light wordmark and the light icon.
- Below 768px the sidebar is a drawer. The Menu button is labeled, and the drawer closes on X, backdrop, Escape, and item selection.
- Keyboard focus is visible on every control, including inside the navy sidebar.
- All routes still work: every tab, `?role=`, and `?event=` (which opens the Evidence Workspace).
- No Indonesian strings remain in `src/app/dashboard` or in the components it renders.
- No `console.log` debug lines remain in dashboard views.
- No `#1B2A4A`, `#1C2E4A`, or `slate-*` / `sky-*` / `emerald-*` classes remain in dashboard shell and list views.
- The three dead modal files and `ContractsView.tsx` are deleted, and the live modal is renamed and its import updated.
- Overview has no greeting rotator and no clock.
- The header has no green status dot.
- Money shows `IDR` with en-US grouping.

## 13. Open items to report back on

Flag these in your final summary so the user can confirm:
1. Whether "Boldonse for headings" means every heading, or only page titles. This brief uses it for all headings and Figtree for everything else.
2. The English number format (en-US grouping) for IDR amounts.
3. The glossary choices in section 11, especially "Logistics Partners" and "Rate Agreement."
4. Any component that could not be translated or restyled without changing behavior.
5. Any file you deleted beyond the list in section 9, with the reason.
