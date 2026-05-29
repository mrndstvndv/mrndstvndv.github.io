# Typography Guide

## Best Practices (2026)

The following guidelines are synthesized from multiple modern web typography references:

- [web.dev/learn/design/typography](https://web.dev/learn/design/typography)
- [CSS Typography Best Practices — The Crit](https://thecrit.co/resources/css-typography-best-practices)
- [Web Typography Guide — design.dev](https://design.dev/guides/typography-web-design/)
- [Typography Hierarchy for Web Readability — Ink bot Design](https://inkbotdesign.com/typography-hierarchy/)
- [Responsive Typography Mastery — Timothy Graf](https://timgraf.com/ui/responsive-typography-mastery-fluid-scaling-hierarchy-and-readability-strategies-for-multi-device-ux-ui-in-2026/)

---

### Font Sizes

| Context | Recommended | Notes |
|---------|-------------|-------|
| **Desktop body** | 16–18px (1–1.125rem) | 18px for editorial/comfortable reading |
| **Mobile body** | **16px minimum** | Going below 16px hurts older readers |
| **H1** | 32–48px | Can scale up to 96px for hero sections |
| **H2** | 24–32px | Clearly smaller than H1, larger than H3 |
| **H3** | 20–24px | |
| **Small/caption** | 12–14px | |

### Type Scales

Sizes should follow a mathematical ratio, not be picked arbitrarily:

| Scale | Ratio | Vibe |
|-------|-------|------|
| Minor Third | **1.2** | **Most versatile, common choice** |
| Major Third | 1.25 | Clear hierarchy |
| Perfect Fourth | 1.333 | Bold, dramatic |
| Golden Ratio | 1.618 | Classic, harmonious |

### Line Height (Leading)

| Text Type | Line Height | Rule |
|-----------|-------------|------|
| Body text | **1.5–1.6** | Unitless values only |
| Headings | **1.1–1.3** | Tighter for impact |
| Small text | 1.6–1.8 | More space |

**Always use unitless values** (`line-height: 1.5` instead of `line-height: 24px`).

### Line Length (Measure)

- **Optimal:** 45–75 characters per line
- **Ideal:** 66 characters
- **CSS:** `max-width: 65ch` on text containers

### Vertical Spacing

- Paragraph margin should match line-height (e.g., `margin-bottom: 1.5em`)
- Heading margins use relative units (`em`) so they scale with heading size
- Consistent vertical rhythm reduces cognitive load

### Fluid Typography

Use `clamp()` to avoid breakpoint jumps:

```css
font-size: clamp(1rem, 0.5vw + 0.875rem, 1.125rem);
```

Three values: **minimum, preferred (usually vw-based), maximum**.

### Key Rules

1. **Use `rem` not `px`** for font sizes — respects user browser preferences
2. **Don't override `html { font-size: 16px; }`** — breaks accessibility
3. **Use `clamp()`** for fluid type instead of media queries
4. **Unitless line-height** always
5. **Use `ch`** for max-widths on text containers
6. **Never go below 16px body text** on mobile
7. **Use `text-wrap: balance`** on headings for better wrapping
8. **Limit font families** to 2–3 at most

---

## What We Adapted

### `src/style.css`

All typography rules are defined via CSS custom properties in `:root` for consistency and easy maintenance.

#### Type Scale (Minor Third — 1.2)

```css
--text-xs: 0.75rem;                                   /* 12px */
--text-sm: 0.875rem;                                  /* 14px */
--text-base: clamp(1rem, 0.5vw + 0.875rem, 1.125rem); /* 16–18px */
--text-lg: 1.25rem;                                   /* 20px */
--text-xl: 1.5rem;                                     /* 24px */
--text-2xl: 1.875rem;                                  /* 30px */
--text-3xl: 2.25rem;                                   /* 36px */
--text-4xl: 3rem;                                      /* 48px */
```

Body text uses **fluid scaling** via `clamp()` — it's 16px on small viewports and scales up to 18px on large screens. No media queries needed.

We chose Minor Third (1.2) because it's the most versatile ratio — provides clear hierarchy without being overly dramatic, which works well with the pixel font's chunky letterforms.

#### Line Heights

```css
--leading-tight: 1.2;    /* Headings */
--leading-snug: 1.4;
--leading-normal: 1.5;
--leading-relaxed: 1.6;  /* Body text */
--leading-loose: 1.7;
```

Heading line-height is **1.2** (tighter for visual impact).
Body line-height is **1.6** (optimal readability for the 16–18px range).
All values are **unitless** — they scale with font-size automatically.

#### Measure (Line Length)

```css
--measure-prose: 65ch;  /* Ideal ~66 characters per line */
--measure-narrow: 40ch;
```

Changed from a fixed `640px` to **`65ch`**, which adapts to the actual font size. At 16px base, this is roughly 650px; at 18px, it's ~730px. This keeps character count per line in the optimal range regardless of user zoom or font preferences.

#### Heading Hierarchy

| Element | Size | Top Margin | Letter Spacing |
|---------|------|-----------|----------------|
| `h1` | var(--text-3xl) = 2.25rem | 2.5rem | -0.02em |
| `h2` | var(--text-2xl) = 1.875rem | 2.25rem | -0.01em |
| `h3` | var(--text-xl) = 1.5rem | 1.75rem | — |
| `h4` | var(--text-lg) = 1.25rem | 1.5rem | — |

- All headings use `text-wrap: balance` to avoid orphaned words
- First heading on a page gets `margin-top: 0` to prevent excessive space at the top
- Subtle negative letter-spacing on h1/h2 compensates for the pixel font's square glyphs

#### Vertical Rhythm

```css
p { margin-bottom: 1.5em; }
```

Paragraph margin is set in `em` — scales with the paragraph's own font size, maintaining proportional spacing.

Code blocks (`pre.shiki`) use `margin-bottom: 1.5rem` to align with the vertical rhythm set by paragraphs.

#### What We Didn't Do

- **No `html { font-size: 16px; }`** — we leave the browser default intact so user preferences are respected
- **No `px` for font-sizes** — everything uses `rem`, `em`, or `clamp()`
- **No breakpoint-based font sizes** — fluid scaling via `clamp()` handles responsiveness
- **No extra font files** — the site uses Geist Pixel Square (headings + body) and Geist Mono (code), keeping it to 2 typefaces as recommended
