## Overview

This brand reads like a calm, confident enterprise-tech company — the marketing surfaces are soft, blue-tinted, and airy, built around a single family of navy-to-teal blues rather than Coinbase's stark near-monochrome. Where Coinbase isolates its blue to rare CTA moments, this system treats blue as atmosphere: soft radial and mesh gradients built from `{colors.primary}` (#243a5e), `{colors.action}` (#0077cc), and `{colors.accent-teal}` (#00b4b3) sit behind hero copy as blurred geometric blobs, echoing the layered hexagon/blob artwork in the brand references. The canvas underneath stays almost white — `{colors.surface-soft}` (#e6eef5) and `{colors.canvas}` (#f7f9fb) — so the gradients read as light, not heavy.

Type pairs **Boldonse** for the logo and display headlines with **Figtree** for body, navigation, and UI copy. Boldonse only ships in one very heavy, blocky weight, so unlike Coinbase's deliberately light 400-weight display, this brand leans into that weight fully — display headlines are always bold and geometric, never softened. Figtree stays light and rounded underneath, so the contrast between a chunky headline and warm, humanist body text becomes the brand's typographic signature.

The page rhythm rotates two modes: bright near-white editorial sections and **soft gradient-blob hero bands** — pale blue canvases with two or three overlapping, blurred, semi-transparent geometric shapes (hexagons, blobs, soft-edged polygons) built from the primary/action/teal ramp. There is no dark hero mode; depth comes from layered translucent color, not from black canvases or drop shadows. A small four-point sparkle glyph in `{colors.action}` is scattered near headlines and CTAs as a recurring decorative mark.

**Key Characteristics:**
- Three-color blue ramp: `{colors.primary}` (#243a5e), `{colors.action}` (#0077cc), `{colors.accent-teal}` (#00b4b3) — used together as gradients, not as a single scarce accent.
- Heavy, blocky display type — Boldonse at its native weight, never mixed with Figtree inside the same headline.
- Editorial pill/rounded geometry carried over from the reference system: CTAs `{rounded.pill}` (100px), icon plates `{rounded.full}`, cards `{rounded.xl}` (24px).
- Soft gradient-blob hero bands: `{component.hero-band-gradient}` with layered translucent `{component.blob-shape}` decoration is the brand's strongest signature pattern, replacing the dark-hero/product-mockup pattern.
- Sparkle glyph (`{component.sparkle-glyph}`) as a recurring whitespace accent near headlines and CTAs.
- 96px section rhythm — generous editorial pacing, carried directly from the reference system.

## Colors

### Brand & Accent
- **Deep Navy** (`{colors.primary}` — #243a5e): The anchor brand color. Wordmark, primary CTA pill, ink-adjacent headline accents, the darkest stop in every gradient.
- **Action Blue** (`{colors.action}` — #0077cc): Mid-tone gradient stop and the color of interactive links, secondary CTAs, and the sparkle glyph.
- **Accent Teal** (`{colors.accent-teal}` — #00b4b3): Lightest, brightest stop in the gradient ramp. Used for highlight badges, positive/success states, and the brightest edge of blob shapes.
- **Primary Active** (`{colors.primary-active}` — #1a2c47): Press-state darken on the primary pill.
- **Primary Disabled** (`{colors.primary-disabled}` — #a9b6c9): Faded-navy tint for disabled CTAs.
- **Teal Soft** (`{colors.accent-teal-soft}` — #dff5f4): Pale teal tint for badge fills and success banners.

### Surface
- **Canvas** (`{colors.canvas}` — #f7f9fb): The default page floor — a near-white with a faint blue cast, not pure white.
- **Surface Soft** (`{colors.surface-soft}` — #e6eef5): Alternating band surface and the base tone behind gradient-blob heroes.
- **Surface Strong** (`{colors.surface-strong}` — #d7e3ee): Slightly deeper blue-gray, used behind secondary buttons, search pills, and icon plates.
- **Surface Card** (`{colors.surface-card}` — #ffffff): Pure white, reserved for cards and inputs that need to lift off the tinted canvas.

### Gradients
- **Hero Mesh** (`{gradient.hero-mesh}` — linear/radial blend of #243a5e → #0077cc → #00b4b3): The signature background treatment, rendered as soft overlapping blob shapes at low-to-mid opacity behind hero copy.
- **CTA Sheen** (`{gradient.cta-sheen}` — #243a5e → #0077cc, 135deg): Subtle gradient applied to the primary pill button on hover/press only; the resting state stays flat `{colors.primary}`.

### Hairlines
- **Hairline** (`{colors.hairline}` — #cddbe8): Default 1px divider on white/soft surfaces.
- **Hairline Soft** (`{colors.hairline-soft}` — #e6eef5): Lighter divider — same hex as `{colors.surface-soft}`.

### Text
- **Ink** (`{colors.ink}` — #12203a): Display headings, primary nav, body emphasis. A near-black derived from the primary navy, not a true black.
- **Body** (`{colors.body}` — #55637a): Default running text — cool blue-gray.
- **Body Strong** (`{colors.body-strong}` — #12203a): Same as ink, for stronger emphasis.
- **Muted** (`{colors.muted}` — #7c879c): Sub-titles, breadcrumbs, footer secondary.
- **Muted Soft** (`{colors.muted-soft}` — #aab4c4): Disabled link text.
- **On Primary** (`{colors.on-primary}` — #ffffff): White text on navy/gradient CTAs.
- **On Gradient** (`{colors.on-gradient}` — #ffffff): White text set over hero-mesh gradient bands.
- **On Gradient Soft** (`{colors.on-gradient-soft}` — #dce8f5): Muted off-white for secondary text over gradient bands.

### Semantic
- **Success** (`{colors.semantic-success}` — #00b4b3): Reuses the accent teal — positive states, confirmations, "up" indicators.
- **Error** (`{colors.semantic-error}` — #d6455a): Warnings, destructive actions, "down" indicators. Text and small fills only, never a large background.

## Typography

### Font Family
The system runs **Boldonse** (logo and display headlines only) and **Figtree** (body, navigation, captions, buttons, and tabular data). Both are Google Fonts. Fallback stack: `-apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.

The display/body split is stricter than the reference system: Boldonse is reserved for the wordmark and hero/section headlines only — it is a single-weight, high-contrast display face and would overwhelm the page if used anywhere else. Figtree, a warm rounded grotesque, carries every other weight of the type hierarchy from body copy down to numeric data.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-mega}` | 76px | Boldonse (native) | 1.02 | -0.5px | Homepage hero h1 |
| `{typography.display-xl}` | 60px | Boldonse (native) | 1.03 | -0.4px | Subsidiary heroes |
| `{typography.display-lg}` | 48px | Boldonse (native) | 1.05 | -0.3px | Section heads |
| `{typography.display-md}` | 36px | Boldonse (native) | 1.08 | -0.2px | CTA-band headlines |
| `{typography.display-sm}` | 28px | Figtree 700 | 1.15 | 0 | Sub-section heads |
| `{typography.title-lg}` | 24px | Figtree 700 | 1.2 | 0 | Card group titles |
| `{typography.title-md}` | 18px | Figtree 600 | 1.33 | 0 | Component titles, row primary |
| `{typography.title-sm}` | 16px | Figtree 600 | 1.25 | 0 | List labels |
| `{typography.body-md}` | 16px | Figtree 400 | 1.55 | 0 | Default body |
| `{typography.body-strong}` | 16px | Figtree 600 | 1.55 | 0 | Emphasized body |
| `{typography.body-sm}` | 14px | Figtree 400 | 1.5 | 0 | Footer body |
| `{typography.caption}` | 13px | Figtree 400 | 1.5 | 0 | Captions |
| `{typography.caption-strong}` | 12px | Figtree 600 | 1.5 | 0.2px | Badge pill labels (uppercase) |
| `{typography.number-display}` | 18px | Figtree 500 | 1.4 | 0 | Metrics, stats, percentages |
| `{typography.button}` | 16px | Figtree 600 | 1.15 | 0 | Standard CTA pill |
| `{typography.nav-link}` | 14px | Figtree 500 | 1.4 | 0 | Top-nav menu items |

### Principles
- **Boldonse never leaves the display tier.** It doesn't have a light weight to fall back on, so treating it as a body or UI font would break legibility — it is reserved for the wordmark and headlines.
- **Never mix Boldonse and Figtree inside the same headline** — same rule as the reference system, now for a stronger reason: the weight contrast between the two faces is extreme.
- **Figtree carries every numeric value** — metrics, stats, and percentages render in Figtree Medium rather than a separate mono face, since the brand has no licensed numeric typeface.

### Note on Fonts
Both **Boldonse** and **Figtree** are freely available on Google Fonts — no substitution is required.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.base}` 16px · `{spacing.md}` 20px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** `{spacing.section}` (96px) for every major editorial band — unchanged from the reference system.
- **Card internal padding:** `{spacing.xl}` (32px) for feature cards and stat cards.

### Grid & Container
- **Max content width:** ~1200px centered. Gradient-blob heroes are full-bleed.
- **Editorial body:** Single 12-column grid.
- **Feature card grids:** 2-up at desktop for hero splits, 3-up for benefit grids.
- **Footer:** 6-column link list at desktop.

### Whitespace Philosophy
Generous editorial pacing, carried directly from the reference system — 96px between bands, cards sit 24px apart. The gradient-blob decoration fills whitespace with color rather than density, so layouts can stay sparse without feeling empty.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | 80% of surfaces |
| Hairline border | 1px `{colors.hairline}` | Feature card outlines on white |
| Soft drop | `0 4px 16px rgba(36, 58, 94, 0.06)` | Single shadow tier — hovered cards, floating stat cards |
| Gradient depth | Layered translucent blob shapes | Hero depth (replaces the reference system's dark-hero photographic depth) |

### Decorative Depth
- **Layered gradient blobs** are the most distinctive decorative pattern — two or three semi-transparent, softly blurred hexagon/blob shapes in `{gradient.hero-mesh}` stack behind hero copy, largest and darkest at the back, smallest and brightest teal at the front.
- **Sparkle glyph** (`{component.sparkle-glyph}`): a small four-point star in `{colors.action}`, placed near headlines, stat callouts, or section titles as a recurring whitespace accent — the equivalent role Coinbase's accent yellow plays on asset glyphs, but used as a standalone mark rather than an icon fill.
- **Layered wordmark echo** (`{component.wordmark-echo}`): an optional flourish for cover slides or section dividers only — the wordmark repeated 2–3 times at decreasing opacity and a slight vertical offset in the teal-to-navy ramp. Used sparingly, never in-product.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Reserved (essentially unused) |
| `{rounded.xs}` | 4px | Inline tags |
| `{rounded.sm}` | 8px | Compact rows |
| `{rounded.md}` | 12px | Form inputs |
| `{rounded.lg}` | 16px | Mid-size cards |
| `{rounded.xl}` | 24px | Feature cards, stat cards, pricing tiers |
| `{rounded.pill}` | 100px | All CTA buttons, search pills, badges |
| `{rounded.full}` | 9999px | Icon circles, avatars, sparkle glyph container |

Carried directly from the reference system: pill for interactive, card-radius (24px) for containers, full circle for icons. Sharp corners absent.

## Components

### Top Navigation

**`top-nav-light`** — Default top nav. Background `{colors.canvas}`, text `{colors.ink}`, height 64px. Layout: wordmark (Boldonse) left, primary horizontal menu in Figtree, search-icon + Sign In + Sign Up CTAs right.

**`top-nav-on-gradient`** — Top nav over a gradient-blob hero band. Background transparent, text `{colors.on-gradient}`. Same layout.

### Buttons

**`button-primary`** — The signature navy pill. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}` (16px / 600), padding 12px × 20px, height 44px, rounded `{rounded.pill}`. On hover/press, background shifts to `{gradient.cta-sheen}`.

**`button-primary-active`** — Press state. Background `{colors.primary-active}`.

**`button-primary-disabled`** — Faded navy tint. Background `{colors.primary-disabled}`. Cursor not-allowed.

**`button-secondary-light`** — Soft-blue secondary on white/tinted surfaces. Background `{colors.surface-strong}`, text `{colors.ink}`, same pill geometry.

**`button-outline-on-gradient`** — Transparent pill with white outline, used over gradient-blob heroes. Background transparent, text `{colors.on-gradient}`, 1px white border.

**`button-tertiary-text`** — Inline text link. Background transparent, text `{colors.action}`, type `{typography.button}`.

**`button-pill-cta`** — Larger pill CTA used on the homepage hero. Same navy/gradient palette but 56px height and 16px × 32px padding for a prouder stance.

### Hero Bands

**`hero-band-gradient`** — The signature full-bleed gradient hero. Background `{colors.surface-soft}` with layered `{component.blob-shape}` decoration in `{gradient.hero-mesh}`, text `{colors.ink}` or `{colors.on-gradient}` depending on blob density behind it. Display headline in `{typography.display-mega}` (Boldonse), subhead in `{typography.body-md}`, one or two CTAs, sparkle glyph accents near the headline.

**`hero-band-light`** — Flat white-canvas variant for lower-emphasis pages. Background `{colors.canvas}`, text `{colors.ink}`, no blob decoration.

### Cards

**`blob-shape`** — The core decorative primitive. An SVG blob or soft hexagon, fill `{gradient.hero-mesh}` or a single stop from the ramp, 20–60% opacity, heavily blurred edge. Never used at full opacity or with a hard edge.

**`stat-card`** — Floating card used to surface a metric inside or near a gradient hero (e.g. "78% of enterprises…"). Background `{colors.surface-card}`, text `{colors.ink}`, rounded `{rounded.xl}`, padding 24–32px, soft-drop shadow. Number in `{typography.number-display}`, label in `{typography.body-sm}`.

**`feature-card`** — Used in 3-up and 2-up grids. Background `{colors.surface-card}`, text `{colors.ink}`, type `{typography.title-md}`, rounded `{rounded.xl}`, padding 32px, hairline border.

**`feature-card-inverted`** — A single feature or step highlighted with a solid navy fill instead of white, to draw the eye inside a grid of otherwise-light cards. Background `{colors.primary}`, text `{colors.on-primary}`, same geometry.

### Data Display

**`metric-row`** — Horizontal row pairing a label with a numeric value (e.g. revenue by year). Background transparent, 1px hairline divider. Value column in `{typography.number-display}`.

**`icon-plate-circular`** — Circular plate behind glyphs or avatars. Background `{colors.surface-strong}`, rounded `{rounded.full}`, 32px diameter.

**`sparkle-glyph`** — Standalone four-point star accent. Fill `{colors.action}` or a teal-to-navy gradient sliver, sized 16–32px, placed in headline whitespace or beside stat callouts.

### Pricing

**`pricing-tier-card`** — Standard pricing tier. Background `{colors.surface-card}`, rounded `{rounded.xl}`, padding 32px, 1px hairline border. Layout: tier name + price + feature checklist + CTA pill.

**`pricing-tier-featured`** — The featured tier. Background `{colors.primary}` with a subtle `{gradient.hero-mesh}` wash, text `{colors.on-primary}`. Same skeleton, inverted palette — visual inversion signals "highlighted choice" without ribbons.

### Forms

**`text-input`** — Standard text input. Background `{colors.surface-card}`, text `{colors.ink}`, rounded `{rounded.md}` (12px), padding 14px × 16px, height 48px, 1px hairline border. On focus, border thickens to 2px `{colors.action}`.

**`search-input-pill`** — Pill-shaped search bar. Background `{colors.surface-strong}`, rounded `{rounded.pill}`, padding 12px × 20px, height 44px.

### Tags & Badges

**`badge-pill`** — Small uppercase pill used as section labels. Background `{colors.accent-teal-soft}`, text `{colors.primary}`, type `{typography.caption-strong}`, rounded `{rounded.pill}`.

### CTA / Footer

**`cta-band-gradient`** — Pre-footer CTA band. Background `{gradient.hero-mesh}` at full opacity (no soft-canvas base), text `{colors.on-gradient}`, vertical padding 96px. Centered Boldonse headline + two CTAs.

**`footer-light`** — Closing canvas footer. Background `{colors.canvas}`, text `{colors.body}`. 6-column link list.

**`footer-link`** — Individual footer link. Background transparent, text `{colors.body}`.

**`legal-band`** — Bottom strip beneath footer columns. All text `{colors.muted}` at `{typography.caption}`.

## Do's and Don'ts

### Do
- Build gradients from the three-stop ramp — `{colors.primary}` → `{colors.action}` → `{colors.accent-teal}` — in that order, dark to light.
- Reserve Boldonse for the wordmark and display headlines only.
- Set every CTA as `{rounded.pill}` (100px); every icon plate as `{rounded.full}`; every card as `{rounded.xl}` (24px).
- Use blob-shape decoration to fill hero whitespace instead of photography or dark canvases.
- Keep the sparkle glyph small and occasional — one or two per section, not a repeating pattern.

### Don't
- Don't use Boldonse for body copy, buttons, or navigation — it's a single-weight display face and breaks legibility below headline size.
- Don't mix Boldonse and Figtree inside the same headline.
- Don't render a blob shape at full opacity or with a hard edge — the softness is the point.
- Don't add drop shadow tiers beyond the single soft-drop level.
- Don't use sharp `{rounded.none}` (0px) on CTAs.
- Don't use `{colors.semantic-error}` as a large background fill — text and small indicators only.
- Don't extract a CTA color from a third-party widget (cookie consent, chat launcher). The brand's CTA color is what appears on actual product CTAs, not on injected modals.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 640px | Hero h1 76→38px; feature card grid 1-up; blob decoration simplifies to a single shape; nav collapses to hamburger. |
| Tablet | 640–1024px | Hero h1 60px; feature card grid 2-up; two blob shapes retained. |
| Desktop | 1024–1280px | Full hero h1 76px; feature card grid 3-up; full three-blob hero decoration. |
| Wide | > 1280px | Content caps at 1200px; gradient hero full-bleed. |

### Touch Targets
- Primary CTA pill at 44px height — at WCAG AAA.
- Larger hero pill (`{component.button-pill-cta}`) at 56px — well above AAA.
- Icon circles at 32px — borderline; padded 8px row creates an effective 48px tap zone.
- Search pill at 44px height — at AAA.

### Collapsing Strategy
- Top nav switches to hamburger sheet below 768px. Sign Up CTA stays visible.
- Hero h1 steps down: 76 → 60 → 48 → 36 → 28px on smallest screens (matching the display token scale).
- Blob-shape hero decoration reduces from 3 shapes to 1 on mobile to avoid visual clutter.
- Pricing tier rows: 3-up → 2-up → 1-up.
- Metric rows stack vertically on mobile: label on top, value beneath.

## Iteration Guide

1. Focus on a single component at a time. Reference the token keys directly.
2. New CTAs default to `{rounded.pill}` (100px); new icon plates default to `{rounded.full}`. Cards use `{rounded.xl}`.
3. Variants live as separate entries inside the `components:` block.
4. Use `{token.refs}` everywhere — never inline hex.
5. Hover state documented only where it diverges meaningfully (e.g. the primary button's gradient sheen). Otherwise Default and Active/Pressed are the two documented states.
6. Boldonse for the wordmark and display tier only; Figtree 400/500/600/700 for everything else.
7. The three-color ramp should always appear together in gradients — avoid using `{colors.accent-teal}` or `{colors.action}` as an isolated flat CTA fill; that role belongs to `{colors.primary}`.

## Known Gaps

- Boldonse and Figtree are both open Google Fonts — no licensing or substitution concerns, unlike the reference system's licensed type family.
- In-product application surfaces (dashboards, data tables, workflow builders) are out of scope — this document covers marketing only.
- Animation timings for the blob-shape decoration (e.g. slow drift/parallax) are out of scope and should be specified separately if the hero becomes animated.
- Exact SVG construction of `{component.blob-shape}` (path data, blur radius) is not yet specified — treat the description here as directional until a component library exists.
