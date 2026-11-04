# Dashboard redesign report

This report covers the `/dashboard` route and follows `.agents/verflo-dashboard-redesign-brief.md`.

Not changed: the landing, login, register, and home pages (except the shared font and token setup), `src/lib/api.ts`, `config.ts`, `auth.ts`, `review.ts`, `src/lib/field_registry.gen.ts`, `src/types/*`, `src/app/api/*`, and the `components/ui/*` primitives.

## Summary

- The shell, sidebar, overview, and list views use the brand tokens, with Figtree for headings and text. Dashboard copy is English.
- The sidebar is rebuilt: navy rail, concave active tab, collapse toggle with a saved state, Ctrl/Cmd+B, tooltips, and a mobile drawer with a focus trap.
- Overview filler is gone. The overview has a new header, four stat tiles, and two cards.
- Dead modals, `ContractsView`, and an unused fixture are deleted. The live batch modal is renamed to `BatchHitlReviewModal.tsx`.
- `npm test` failed before because the repo had no test files and no Vitest config. I added the config and 15 tests.

Typecheck, tests, and the production build pass. Lint has 0 errors and 13 warnings (it had 100 warnings). The browser checks pass 81 of 81. Details are under Verification.

## What changed

### Fonts and tokens
- `src/app/layout.tsx` loads Boldonse (400) and Figtree with `next/font/google`. They are exposed as `--font-boldonse` and `--font-figtree` on `<html>`.
- `src/app/globals.css` has an `@theme` block with the brief's color tokens and the text companions described under Accessibility. `--font-sans` and `--font-display` point at the loaded fonts, with the DESIGN.md fallback stack.
- Removed `card-border` and `transition-subtle` (no file used them) and the root color variables that duplicated the theme. Kept the landing hero classes, `font-tabular`, and the scrollbar styles.
- `src/lib/dashboard-ui.ts` (new) holds shared class strings for panels, chips, buttons, fields, table cells, and the focus ring. Dashboard code applies them with `cn()` on top of the `components/ui` primitives, which keep their landing defaults.
- `src/lib/format.ts` (new) holds `formatIDR` (en-US, IDR, no decimals, for example `IDR 1,379,797`) and `formatCompactIDR` (`IDR 1.2B`, `IDR 3.5M`, `IDR 450K`).

### App shell (`src/app/dashboard/page.tsx`)
- The header is sticky, uses canvas at 92% opacity with a blur, and has a hairline bottom border. It holds the Menu button (below 768px), the page title, a neutral Refresh button, and the role chip. The green status dot is gone.
- Page titles come from one lookup table instead of a chain of conditionals.
- Removed dead code: the unused `batchTransactions` state, the unused props (`queueCount` and `exceptionCount` on the sidebar, `onNavigateToFinalApproval` on the queue, and `onSelectTransaction` on the overview), and an unused `docTab` parameter.
- `?role=` and `?event=` work as before. `?event=` opens the Evidence Workspace tab.

### Sidebar (`Sidebar.tsx`)
- Navy panel, 256px expanded and 72px collapsed. The width animates over 200ms with `cubic-bezier(0.16, 1, 0.3, 1)`. The animation is off under `prefers-reduced-motion`.
- Active tab: canvas fill, 12px left corners, and two concave fillets made from `radial-gradient` pseudo-elements (`.sidebar-tab-active` in `globals.css`), so the tab reads as part of the content area.
- Collapse toggle: a 32px square button beside the logo on desktop. It is labeled "Collapse sidebar" or "Expand sidebar".
- The preference is saved in `localStorage` under `verflo.sidebar.collapsed` and read after mount. Without a saved value, the rail starts expanded at 1024px and wider, and collapsed below that.
- Ctrl/Cmd+B toggles the rail on desktop. It is ignored in inputs, selects, textareas, and editable content.
- In the collapsed rail, every item has an `aria-label` and a tooltip that appears on hover and on keyboard focus. Labels fade before the width shrinks. Dividers replace the section titles.
- Mobile (below 768px): a 280px drawer with a backdrop. It closes on the X button, a backdrop click, Escape, or choosing an item. Body scroll is locked, Tab stays inside the drawer, and focus returns to the Menu button on close.
- The logo shows the wordmark when expanded and the icon when collapsed. It links to `/`. Sign Out links to `/login`.

### Overview (`OverviewView.tsx`)
- Removed the greeting rotator, the clock, the inline `<style>` block, and the `console.log` lines. The summary and vendor requests and the data bindings are unchanged, including the `total_billed_idr` and `clean_matches_count` fallbacks.
- Header: "Overview" with the brief's subtitle. A soft navy-to-teal blob sits behind the title block only.
- Four stat tiles: Total invoiced, Total variance, Open exceptions, and Clean matches. They show four columns from 1280px, two from 768px, and one below that.
- Two cards: Review Queue (transaction count, Needs Review, Matches Contract, and "Open Review Queue") and Logistics Partners (partner count, partner chips, and "View Agreements (PKS)"). The loading and empty states are translated.

### List views
- `src/components/ReviewQueue.tsx`: four KPI tiles with compact IDR, a labeled filter bar, and folder rows with a "View Details" button. The compact unit for billions is now "B". The old "M" meant miliar (billion), which an English reader would take for millions.
- `ExceptionView.tsx` (Anomaly Archive): three summary tiles, status chips, and rows with "View Evidence". Removed the unused `statusTabs` array.
- `UploadDropzone.tsx` (Document Hub): the filename heuristics are unchanged. The "Choose Files" button is now a focusable button. The old one had `pointer-events-none`, so it could not be used with a keyboard. Saved documents show en-US dates. The import points at `BatchHitlReviewModal`.
- `MitraLogistikView.tsx` (Logistics Partners): three KPI tiles and partner cards with status chips and the PKS details. Partner names use Figtree, because they are data.
- `DisputeListView.tsx` (Dispute Packages): total claimable in the header and "Inspect Memo" rows. The loading text said `status=EXCEPTION`, but the request fetches `DISPUTED`. It now reads "Loading disputed cases...".
- `GlobalAuditLedgerView.tsx` (Audit Ledger Trail): a segmented action filter and a timeline with action-colored dots. Removed the "PostgreSQL audit_events" badge, which does not come from the response. The header shows the entry count.
- `FinalApprovalView.tsx`: sub-tabs, KPI tiles, and tables. The route column now reads the `origin` and `destination` fields. Before, every row showed a hard-coded "JKT → SBY" and "TRUCKING_FTL". Release buttons are navy instead of emerald, so white text meets AA. The release dialog has `role="dialog"`. The sign-off request body is unchanged.
- `SettingsView.tsx` (Policy & Tolerance): English messages. The materiality hint uses en-US IDR. The success message no longer has an exclamation mark.

### Deferred components (tokens and copy only, layouts unchanged)
- `EvidenceViewer.tsx`: tokens, English, and tab badges `DUPLICATE`, `MISSING`, and `AVAILABLE`. Three hard-coded claims now come from data. The POD block shows signature presence, stamp presence, and signature confidence from `event.pod`. The header chip shows `pod.delivery_status`. Removed the fixed "Confidence: 95.0%", "Operasional Terverifikasi", and "PKS Aktif (2026)" text. Removed unused state (`rowsError`, `segmentsLoading`, `documentType`, `active`). The `SJ-` fallback prefix is kept.
- `ReconciliationCard.tsx`: tokens and English. Trace amounts use IDR with en-US grouping, and "PPN Tax" is now "VAT (PPN)". The "13 checks" count was hard-coded and not in the data, so it is replaced with a plain sentence. Removed unused state and variables.
- `DecisionModal.tsx`: tokens, English, and en-US IDR. Removed unused imports.
- `DisputePackageModal.tsx`: tokens, English, and `+IDR`. Removed the "MSA ENFORCED" badge. The memo stays monospace because it is aligned plain text.
- `AuditTrailView.tsx`: tokens, English, and en-US dates. Removed the "Append-Only Trigger Active" badge.
- `components/evidence/DocumentPageView.tsx`: tokens and English. The page shadow is now a hairline border.
- `TablePayloadView.tsx`: kept (see Deletions). Tokens and English.
- `BatchHitlReviewModal.tsx` (renamed from `BatchHitlReviewModal_Compact.tsx`): tokens and English. The emoji and symbol glyphs are now icons. Request bodies are unchanged, except that the two Indonesian `reason` strings are still there (open item 2).

## Glossary additions

These terms are not in the brief's glossary. Sentences were translated in the same style and are not listed one by one.

| Current text | English |
|---|---|
| Potensi Kebocoran | Potential Leakage |
| Antrean Anomali | Anomaly Queue |
| Total Dana Siap Cair | Total funds ready for release |
| Total Dana Dicairkan | Total funds disbursed |
| Total Faktur Disetujui | Total invoices approved |
| Kebocoran Finansial Dicegah / Potensi Kebocoran Dicegah | Financial leakage prevented / Potential leakage prevented |
| Menunggu Otorisasi | Awaiting authorization |
| Riwayat Otorisasi | Authorization history |
| Otorisator / Peran Otorisator | Authorizer / Authorizer role |
| Konfirmasi Otorisasi Pencairan Kas (SoD) | Confirm cash release authorization (SoD) |
| Tandatangani & Release Dana | Sign and release funds |
| Catatan Otorisasi Treasury / No. Batch Pembayaran | Treasury note / payment batch no. |
| Mitra 3PL Aktif | Active logistics partners |
| PKS Terhubung | Rate agreements (PKS) linked |
| Tanpa Kontrak PKS | No rate agreement (PKS) |
| Kontrak PKS Aktif | Active rate agreement (PKS) |
| ID Perjanjian | Agreement ID |
| Masa Berlaku | Effective period |
| Batas Dispute | Dispute window |
| Vendor Logistik Terdaftar | Registered logistics partners |
| Tagihan / Selisih | Billed / Variance |
| Lihat Detail | View Details |
| Duplikat | Duplicate |
| Semua Tingkat Risiko, Kritis, Risiko Tinggi, Risiko Sedang, Risiko Rendah | All risk levels, Critical, High risk, Medium risk, Low risk |
| Semua Mitra 3PL, Semua Vendor, Semua Status, Semua Aksi | All 3PL partners, All vendors, All statuses, All actions |
| Antrean Tagihan Siap Audit | Billing queue ready for audit |
| Terunggah, Terverifikasi (Deduplikasi SHA-256), Sedang mengekstrak AI, Siap diunggah | Uploaded, Verified (SHA-256 deduplication), Extracting with AI..., Ready to upload |
| Auto (AI Clsf) | Auto (AI classification) |
| Unduh | Download |
| Riwayat Seluruh Keputusan | Full Decision History |
| Keputusan / Dasar Keputusan | Decision / Notes / basis for decision |
| Peringatan Integritas Duplikasi Faktur | Duplicate invoice warning |
| Penerbit Faktur (Vendor) | Issuer (vendor) |
| Uraian Tagihan, Berat Tagih, Total Nilai Tagih | Charge description, Billed weight, Billed amount |
| Kota Asal / Kota Tujuan | Origin city / Destination city |
| Berat Aktual Timbangan | Actual scale weight |
| Jumlah Koli / Paket | Packages |
| Penerima Barang | Receiver |
| Tanggal Serah Terima | Delivery date |
| POD TIDAK DITEMUKAN | POD NOT FOUND |
| Tarif Disepakati | Agreed rate |
| Klausul Validasi Tarif | Rate validation clause |
| Remediasi | Remediation |
| Halaman sebelumnya / berikutnya | Previous page / Next page |
| Cuplikan sumber | Source snippet |
| Jalankan ulang AI, Setujui field tersedia, Terima, Koreksi, Ulang | Re-run AI, Approve available fields, Accept, Correct, Retry |
| Audit mapping dokumen | Document mapping audit |
| Finalisasi & buka review query | Finalize & open review |
| Nilai hasil mapping / Aksi audit | Mapped value / Audit action |
| Rincian Diskrepansi Terlampir | Attached discrepancy details |
| Dokumen asli | Original document |
| Memuat ... | Loading ... |
| Gagal memuat ... / Gagal menyimpan ... | Failed to load ... / Failed to save ... |
| Tidak ada ... / Belum ada ... | No ... / No ... yet |

Naming decisions: the sidebar item reads "Logistics Partners" and the page title reads "Logistics Partners (3PL)". The rate agreement document type reads "Rate Agreement (PKS)".

## Accessibility and contrast

I computed WCAG contrast for each token pair. The brief's text values below failed, so I changed them or added companion tokens.

| Pair | Brief value | Ratio | Result |
|---|---|---|---|
| Muted text on canvas / card / surface-soft | #7C879C | 3.43 / 3.62 / 3.09 | `--color-muted` is now #5F6B80: 5.10 / 5.38 / 4.59 |
| Action blue used as text on canvas | #0077CC | 4.41 | `--color-action-ink` #006BB3 for text: 5.30 |
| Error text on canvas / card / error-soft | #D6455A | 4.10 / 4.32 / 3.79 | `--color-error-ink` #B2364A for text and destructive buttons: 5.65 / 5.97 / 5.23 |
| Warning text on canvas / card / warning-soft | #B7791F | 3.45 / 3.64 / 3.33 | `--color-warning-ink` #8A5A14: 5.60 / 5.91 / 5.41 |
| Teal text or icons on canvas | #00B4B3 | 2.43 | `--color-teal-ink` #007070 for success text and icons: 5.60. The bright teal stays for decoration |

Pairs that already pass: navy on canvas 10.80, body on canvas 5.76, white on navy 11.40. In the navy rail, the inactive text (#DCE8F5) measures 9.18 and the section labels and icons (#8FB8D6) measure 5.43. Muted text on navy is only 3.15, so the rail uses `--color-navy-muted` instead. Action blue on navy is 2.45, so the focus ring has a canvas-colored gap. That puts the ring against canvas, where it measures 4.41.

Focus: dashboard controls share one focus class, a 2px action ring with a 2px canvas offset. I checked it by keyboard on the rail items. The other controls use the same class.

## Deletions

- Deleted, as the brief asked: `BatchHitlReviewModal_Compact.tsx` (renamed to `BatchHitlReviewModal.tsx`), `BatchHitlReviewModal_v2.tsx`, `BatchHitlReviewModal_Dynamic.tsx`, `ContractsView.tsx`, and `__fixtures__/surat_jalan_variation_1.profile.json`, along with its now-empty folder. The fixture name appears nowhere in the repo except the brief.
- Kept: `TablePayloadView.tsx`. The brief said only the deleted modals imported it. The live modal (`BatchHitlReviewModal.tsx`) also imports it and renders it for table fields, so deleting it would break that modal.
- The original `BatchHitlReviewModal.tsx` was dead code. The renamed live modal now sits at that path, which is why git shows the file as modified.
- Beyond the brief's list: I removed unused functions and state inside the files I rewrote (see What changed). I deleted no other files.
- Added: `vitest.config.mts`, `src/lib/format.ts`, `src/lib/dashboard-ui.ts`, `src/lib/format.test.ts`, and `src/app/dashboard/components/Sidebar.test.tsx`.

## Open items

1. **Heading font (resolved).** Dashboard headings and titles use Figtree. Page titles use weight 700, and panel, card, and modal titles use weight 600. Boldonse now appears only on the landing page and on the login and register headings.
2. **Indonesian audit reasons in requests.** `BatchHitlReviewModal` still sends two Indonesian `reason` strings with each acceptance or correction: "Disetujui auditor pada audit batch HITL" and "Koreksi auditor pada audit batch HITL". The brief bars request-body changes, so I left them. They appear in the Audit Ledger Trail. Changing them only affects new audit records, so confirm before I switch them to English.
3. **Shared primitives keep their palette.** `components/ui/*` (button, card, badge, input, label, separator) still uses slate, rose, emerald, and hex defaults. Landing, login, and register depend on those defaults. The dashboard overrides them through `dashboard-ui.ts`. Moving the primitives to tokens would change those pages, so I left that as a separate decision.
4. **Landing headline styling.** Landing headings now use line height 1.04 to 1.1 and letter spacing 0. The old values were 0.92 to 0.98 and -0.025em, which made Boldonse look cramped. Below 640px, the hero is 36.7px at 390px wide (was 44.8px), and section headings are 44px (was 48px). The hero also has 32px more top padding on phones, so the fixed navbar no longer covers its first line. DESIGN.md lists line heights of 1.02 to 1.08 and letter spacing of -0.2px to -0.5px, so these values are slightly looser than the table. Login and register headings keep their original spacing.
5. **Protected files with Indonesian text.** `src/lib/review.ts` returns an Indonesian fallback ("Tidak ada kandidat … isi koreksi") that includes an em dash. The modal never renders it, since it shows its own English text, but the string stays in the file. `src/lib/auth.ts` throws "Gagal melakukan registrasi.", "Sesi telah berakhir. Silakan login kembali.", and login uses "Email atau password salah.". Only the login and register flows reach those messages. The dashboard imports just `getStoredUser` from that file.
6. **Claims I kept without checking.** Settings says "Policy changes take effect immediately across all active workers." The dispute package footer says the package is "compliant with Master Service Agreement terms." Neither claim comes from the data, and this repo cannot confirm them. Confirm them or tell me to remove them.
7. **The overview title appears twice.** The header shows "Overview", and the overview block shows it again, as the brief asked. Dropping the header title on that one tab is a small change if you prefer.
8. **Phone header.** Below 640px the role chip is hidden and Refresh shows only its icon, so the page title has room. The role is still shown on larger screens.
9. **Stat tile breakpoints.** The four-up row starts at 1280px. At 1024px, the 256px rail would squeeze the IDR amounts.
10. **Number sizes.** KPI numbers use 26px. The overview tiles use 24px so `IDR 1,379,797` fits in a quarter-width tile at 1280px.
11. **Button colors.** Primary actions use navy. Approve actions use dark teal (#007070). The bright brand teal is not used for button fills, because white text on #00B4B3 measures only 2.57:1.
12. **Monospace exceptions.** The calculation trace, the dispute memo, and the raw OCR source snippets stay monospace, because their columns need alignment.
13. **Lint warnings.** Lint reports 13 warnings. Four are in dashboard code and were already there. They are the `window.location.assign` call in `UploadDropzone` (kept, so the redirect works as before), a missing `useMemo` dependency in the batch modal, and two `exhaustive-deps` warnings in `EvidenceViewer`. The other nine are in landing, `components/ui/button.tsx`, and `lib/api.ts`.
14. **Legacy docs.** `README_REVAMP_MASTER.md`, `README_BATCHHITL_V2.md`, `QUICK_START_DYNAMIC.md`, `INTEGRATION_GUIDE_V2.md`, and `DEPLOYMENT_CHECKLIST.md` still describe the deleted modal variants. I did not edit them.
15. **Build warning.** `next build` prints "Failed to find font override values for font `Boldonse`". Next.js has no fallback-metric data for that font. It is a warning only, and the build succeeds.
16. **Live data was not tested.** The backend is not running here. Queue rows, the evidence workspace, the batch review flow, and the release dialog were checked for layout and exceptions, in their empty and error states only. The POD bindings, the real chip values, and the release flow still need a pass against live data.
17. **Companion tokens.** The brief's values fail AA for text. I added `--color-action-ink`, `--color-error-ink`, `--color-warning-ink`, `--color-teal-ink`, `--color-navy-soft`, and `--color-navy-muted`, and I darkened `--color-muted`. If you want the brief's exact values, the affected text needs a larger size or a different color.

## Verification

Commands run in `frontend/` before and after the change:

| Check | Before | After |
|---|---|---|
| `npm run typecheck` | exit 0 | exit 0 |
| `npm run lint` | exit 0, 0 errors, 100 warnings | exit 0, 0 errors, 13 warnings |
| `npm test` | exit 1, "No test files found" | exit 0, 15 passed in 2 files |
| `npm run build` | exit 0 | exit 0, `/dashboard` static, one font warning (open item 15) |

Unit tests: `format.test.ts` (4 tests) covers the en-US IDR formatting and the compact units. `Sidebar.test.tsx` (11 tests) covers the collapse toggle, the saved state, Ctrl/Cmd+B (including the field exception), Escape, the focus trap, the backdrop, and the Sign Out link.

Browser checks: I drove headless Microsoft Edge over the DevTools protocol against the production build on port 3100. A dev process was already on port 3000, and I left it running.
- Sidebar and drawer: 38 of 38 passed. This covers the rail widths, the active-tab fillet styles, the collapse and reload persistence, tooltips, Ctrl+B, the title and `aria-current` changes, `?role=`, `?event=`, the 900px default, and the drawer's open and close paths with focus handling and scroll lock.
- View sweep: 36 of 36 passed. Each of the nine tabs renders its title and content, throws no uncaught page exception, and has no horizontal overflow at 1440px, 900px, or 390px.
- Focus and motion: 7 of 7 passed. Tab reaches the rail items and Sign Out, the focus ring is the action blue, the rail width animates over 200ms with the brief's easing, and reduced motion turns that animation off.
- Screenshots reviewed: expanded overview, collapsed rail, review queue, document hub, mobile drawer, and the mobile header.

Static audits over `src/app/dashboard` and the rendered components:
- No Indonesian UI text remains, except the batch modal `reason` strings (open item 2) and the protected files (open item 5). Code identifiers such as `isManualRefresh` and the internal `ANOMALI` filter value are not UI text.
- No hex values and no `slate-*`, `sky-*`, `emerald-*`, or other palette classes in the dashboard or deferred components. The shared primitives still have them (open item 3).
- No `console.log` in `src`.
- No commented-out code in the dashboard or deferred components. Commented-out JSX remains only in landing components, which are out of scope.
- No em dashes or en dashes in the files I wrote.
- No Boldonse in the dashboard. Boldonse stays on the landing headings and the login and register headings.

Line endings: the 26 files I wrote or changed use CRLF, to match the repo. Git's autocrlf warnings are gone.
