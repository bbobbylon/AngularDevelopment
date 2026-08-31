# UI/UX Design Documentation

**Version:** 2.0
**Last Updated:** 2026-08-31
**Status:** Final

## Overview

The design system is deliberately small: a set of CSS custom properties, a handful of
shared classes for lesson anatomy, and native controls styled once globally. There is no
CSS framework and no component library. Lessons are read for long stretches, so
typography and contrast get the attention that decoration does not.

## Table of Contents

- [1. Design system](#1-design-system)
- [2. Component library](#2-component-library)
- [3. Layout patterns](#3-layout-patterns)
- [4. Page anatomy](#4-page-anatomy)
- [5. User flows](#5-user-flows)
- [6. Accessibility](#6-accessibility)
- [7. Styling conventions](#7-styling-conventions)
- [8. Motion](#8-motion)
- [9. The brain-friendly layer](#9-the-brain-friendly-layer)
- [10. Print](#10-print)

---

## 1. Design system

Everything lives in `src/styles.css` (366 lines). Both themes are defined as custom
properties on `:root`, with the dark theme overriding a subset.

### Colour

| Token           | Light     | Dark      | Role                             |
| --------------- | --------- | --------- | -------------------------------- |
| `--bg`          | `#fafafa` | `#0b0b0f` | Page background                  |
| `--bg-elevated` | `#f1f1f3` | `#17171c` | Inputs, subtle raised surfaces   |
| `--bg-card`     | `#ffffff` | `#141419` | Cards                            |
| `--surface`     | `#ffffff` | `#141419` | Panels, table headers            |
| `--border`      | `#e4e4e7` | `#27272e` | All borders and dividers         |
| `--text`        | `#18181b` | `#f4f4f5` | Body text                        |
| `--text-muted`  | `#6b6b76` | `#9d9dab` | Secondary text                   |
| `--accent`      | `#6366f1` | `#818cf8` | Primary — buttons, active states |
| `--accent-2`    | `#8b5cf6` | `#a78bfa` | Secondary accent                 |
| `--violet`      | `#7c3aed` | —         | Focus rings, emphasis            |
| `--green`       | `#10b981` | —         | Success, "correct", "live"       |
| `--amber`       | `#f59e0b` | —         | Warnings, "in progress"          |
| `--blue`        | `#4f46e5` | `#a5b4fc` | Links                            |

**Two tokens are intentionally theme-independent:**

```css
--code-bg: #1e1e2e; /* code panels are always dark */
--code-fg: #d4d4e4; /* fixed light text — never inherit --text here */
```

Code blocks stay dark in both themes so syntax highlighting keeps one palette. `--code-fg`
is fixed rather than inheriting `--text` because in light mode that would be near-black
text on a near-black panel — a bug worth naming, since it is the obvious "simplification".

**Syntax highlighting** (`shared/highlighter.ts` emits these classes):
`--hl-kw` `#c792ea` keyword · `--hl-str` `#c3e88d` string · `--hl-cmt` `#546e7a` comment
(italic) · `--hl-num` `#f78c6c` number · `--hl-dec` / `--hl-fn` `#82aaff` decorator and
function.

### Typography

| Use  | Stack                                                                            |
| ---- | -------------------------------------------------------------------------------- |
| Body | `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, sans-serif |
| Code | `JetBrains Mono`, `Fira Code`, `ui-monospace`, `SFMono-Regular`, monospace       |

| Element                 | Size    | Notes                                    |
| ----------------------- | ------- | ---------------------------------------- |
| `.lesson h1`            | 2rem    | One per page                             |
| `.lesson h2`            | 1.25rem | Section                                  |
| `.lesson h3`            | 1.02rem | Subsection                               |
| `.lead`                 | 1.1rem  | Opening paragraph — every lesson has one |
| `.lesson__eyebrow`      | 0.72rem | Uppercase, letter-spaced track label     |
| `.code`                 | 0.86rem |                                          |
| `.pill`, `.demo__title` | 0.72rem | Uppercase micro-labels                   |

### Spacing and shape

`--radius: 12px` for cards and panels; 8px for buttons and inputs; 999px for pills.
`--shadow` is a single soft elevation, heavier in dark mode. Gaps are 8–14px inside
components, larger between sections.

---

## 2. Component library

Shared UI lives in `src/app/shared/`:

| Component / directive     | Selector              | Purpose                                             |
| ------------------------- | --------------------- | --------------------------------------------------- |
| `TooltipDirective`        | `[appTooltip]`        | Hover/focus tooltip, positioned against the host    |
| `RevealOnScrollDirective` | `[appRevealOnScroll]` | Fade-and-rise as an element enters the viewport     |
| `FilterLessonsPipe`       | `filterLessons`       | Text filter over curriculum cards                   |
| `FilterTabsComponent`     | `<app-filter-tabs>`   | The pill row used by Practice, Flashcards, Glossary |
| `ToastsComponent`         | `<app-toasts>`        | Transient notifications, rendered by the root shell |
| `highlighter.ts`          | —                     | Tokenises code samples into `.hl-*` spans           |
| `download-file.ts`        | —                     | Blob + object-URL download (results export)         |
| `ComingSoon`              | route target          | Fallback for a lesson without a component           |

Native elements are styled globally rather than wrapped:

- **`button`** — accent background, 8px radius, brightness on hover, 1px press
  translate. `.ghost` for the secondary variant.
- **`input` / `select` / `textarea`** — elevated background, bordered, with a **2px
  violet focus outline at 1px offset**. Never removed; the focus ring is load-bearing
  for keyboard use.

Utilities: `.row` (flex, 10px gap, wraps), `.pill` (rounded micro-label), `.swatch`
(26px colour square).

---

## 3. Layout patterns

### Shell

The root component renders a fixed **topbar** (brand, primary nav, theme toggle), a
scroll-progress bar, the routed page, a **footer**, and the toast host. Only the routed
page changes on navigation.

### Responsive strategy

Fluid rather than breakpoint-driven. Grids use
`repeat(auto-fill, minmax(<min>, 1fr))` — usually a 220–280px minimum — so column counts
fall out of the available width instead of being declared per breakpoint. Content is
capped at a comfortable measure and centred. Everything works from roughly 360px up.

Wide content (tables, code blocks, diagrams) scrolls inside its own container; the page
body never scrolls horizontally.

---

## 4. Page anatomy

Every lesson uses the same skeleton, so a reader who has read one knows where to look in
all 100:

```html
<article class="lesson">
  <span class="lesson__eyebrow">Intermediate · RxJS</span>
  <!-- track · category -->
  <h1>Core Operators</h1>
  <p class="lead">One paragraph: what this is and why it matters.</p>

  <h2>Section</h2>
  <p>Explanation.</p>

  <div class="demo">
    <!-- interactive: buttons, inputs, output -->
    <div class="demo__title">Try it</div>
    …
  </div>

  <div class="code"><pre>…</pre></div>
  <!-- annotated sample -->

  <div class="tip">…</div>
  <!-- green: do this -->
  <div class="warn">…</div>
  <!-- amber: this bites -->
  <div class="note">…</div>
  <!-- neutral aside -->

  <h2>Key takeaways</h2>
  <ul>
    …
  </ul>
  <p><a routerLink="/next-lesson">Next: … →</a></p>
</article>
```

`.demo` is a bordered live area; `.demo__title` labels it with a marker glyph. The three
callouts share a shape and differ only in accent colour, so their meaning is learnable at
a glance.

Study-tool pages (Practice, Mock Exam, Progress) do not use `.lesson`; they are
card-grid layouts with their own component-scoped styles over the same tokens.

---

## 5. User flows

### Learning

```
Home ──filter/browse──► Lesson ──"Next: …"──► Lesson ──► …
  ▲                        │
  └────────────────────────┴──► Glossary term ──► the lesson defining it
```

### Assessment

```
Practice ──answer──► explanation ──"Study this topic"──► Lesson
    │
    └─wrong answers─┐
                    ▼
Mock Exam ──────► Review queue ──promote/demote──► Mastered
    │  (config → timed → review)
    ▼
 History
```

### Readiness

```
Exam Day ──► timed exam + 2 coding briefs ──► verdict ──► history
                                                │
Progress ◄──reads every feature's state─────────┘
```

Progress reads and never writes, so the arrow only ever points one way.

---

## 6. Accessibility

**Target: WCAG 2.1 AA — enforced, not aspirational.** `src/app/a11y.spec.ts` runs
axe-core over every lesson and every study-tool page on each test run, against the
`wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa` rule sets. A new page that ships an
unlabelled input fails the build.

The suite was written to check a claim this document had been making untested, and the
claim did not hold: it found 27 violations across 24 files. All are fixed. Every form
control in a demo now carries an accessible name, using `[attr.aria-label]` where the
name depends on the row (`'Mark ' + todo.title + ' done'`).

| Area             | Approach                                                                                                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Keyboard**     | Every control is a real `<button>` / `<a>` / form element. No click handlers on `<div>`s.                                                                                                     |
| **Focus**        | 2px violet outline at 1px offset on inputs; never removed anywhere.                                                                                                                           |
| **Contrast**     | Both themes meet 4.5:1 for body text. The a11y lesson ships a live contrast checker used to verify pairings. Checked by hand — axe cannot run `color-contrast` in jsdom, which has no layout. |
| **ARIA**         | Attribute binding (`[attr.aria-*]`), never property binding — `[aria-expanded]` raises NG0303 and is the commonest Angular ARIA mistake.                                                      |
| **Live regions** | Async status changes (saving, validation results) are announced, with the text varied so consecutive identical announcements are not swallowed.                                               |
| **Motion**       | `prefers-reduced-motion: reduce` disables scroll reveals and transitions.                                                                                                                     |
| **Semantics**    | Lessons are `<article>` with a single `<h1>` and a correct heading order.                                                                                                                     |

The `a11y` lesson is itself the reference implementation for these patterns.

---

## 7. Styling conventions

**Where styles live**

| Scope                                              | Location                                         |
| -------------------------------------------------- | ------------------------------------------------ |
| Tokens, resets, `.lesson` anatomy, native controls | `src/styles.css`                                 |
| Anything specific to one lesson                    | `<lesson>.css`, beside the component             |
| A demo component inside a lesson                   | `<child>/<child>.css`, in the child's own folder |
| Study-tool pages                                   | `<page>.css`, beside the page component          |

Every component references its stylesheet with `styleUrl` (singular). There are no
inline `styles: []` blocks left in the app — the only `styles: [` strings you will find
are inside lesson code samples, where they are teaching content rather than metadata.

**Naming** — BEM-ish for shared classes (`.lesson__eyebrow`, `.demo__title`); short
descriptive names for local ones. Component styles are view-encapsulated, so a local
`.box` cannot collide with another page's.

**Formatting** — Prettier, enforced in CI (`npm run format`). Templates are formatted
with the **`angular` parser**, not the default `html` one, which does not understand
`@if` / `@for` and would flatten their bodies to column zero. `htmlWhitespaceSensitivity`
is `"css"` so inline elements keep their significant whitespace; that is what produces
the occasional hanging `>` where a `<code>` or `<a>` has to wrap.

**The encapsulation gotcha worth knowing:** global print rules and anything styling the
app chrome must go in `src/styles.css`. The topbar, footer and toasts are rendered by the
root component's template, outside any page's encapsulated styles — a print rule written
inside the Glossary component compiles to a selector carrying Glossary's attribute and
silently never matches the topbar. This is why `@media print` lives globally, with a
comment saying so.

**Theming across encapsulation** — CSS custom properties inherit through the shadow/
emulated boundary and are the supported channel for a parent to influence a child's
styling. A parent writing `app-child .thing { … }` compiles to a selector the child's DOM
does not carry and never matches.

---

## 8. Motion

Small, fast, and always opt-out-able.

| Effect           | Detail                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Route transition | View Transitions API via `withViewTransitions()`; a 6px rise + fade, degrading to an instant swap where unsupported        |
| Scroll reveal    | `.reveal` → `.reveal--visible`, 0.55s, `cubic-bezier(0.16, 1, 0.3, 1)`, with a per-element `--reveal-delay` for staggering |
| Buttons          | 0.15s brightness, 0.05s press translate                                                                                    |
| Tooltip          | 0.12s fade-in                                                                                                              |
| Lesson entry     | `fade-in` on `.lesson`                                                                                                     |

All of it is suppressed under `prefers-reduced-motion: reduce`.

---

## 9. The brain-friendly layer

Added 2026-08-31, from a visual the author supplied after a long series of asks recorded
as **Bar 3** in `.claude/CLAUDE.md` and as §2.2 of the backlog. It is a second skin over
everything in §1–§8, not a replacement for it, and it is where the app's presentation is
heading.

### 9.1 Why a second skin rather than an edit

The original theme optimises for calm: one neutral column, restrained colour, everything
the same weight. That is a good reference manual and a bad teacher — a learner scrolling a
correct grey wall retains very little of it, and retention is the app's entire premise.
The brief was "bubbly, welcoming… notice how the brain naturally focuses on certain
things — those things should be the important stuff."

So the layer exists to make the eye land somewhere **on purpose**, and it is opt-in per
lesson because migrating 100 lessons is a rollout rather than a commit. A half-migrated
app where every page is _slightly_ redesigned reads worse than one where each page is
clearly old or clearly new.

A lesson opts in with two things on its root element:

```html
<article class="lesson bf" bfPage></article>
```

`class="bf"` scopes the typography and palette. The `bfPage` directive (
`shared/brain/bf-page.directive.ts`) adds `bf-page` to `<html>` for as long as the lesson
is mounted, which re-points the base theme's tokens at the warm palette so the top bar,
footer and progress bar warm up with the page. Without it the article looks like an
embedded iframe.

### 9.2 The four voices

Four self-hosted families, four jobs — `src/fonts.css`, files in `public/fonts/`, latin
and latin-ext subsets only (~200 kB actually fetched). When the voice changes, the
typeface changes, so the reader always knows who is speaking.

| Token            | Family           | Job                                                     |
| ---------------- | ---------------- | ------------------------------------------------------- |
| `--font-display` | Playfair Display | Headlines and chapter titles — the thing to remember    |
| `--font-body`    | Figtree          | All reading copy and UI. Now the app-wide body face     |
| `--font-hand`    | Caveat           | Margin voice: annotations, "you are here", captions     |
| `--font-mono`    | JetBrains Mono   | Every snippet, matching the IDE the reference came from |

Nothing outside `fonts.css` and the token block names a font, so a family is swapped in
one line. Code ligatures are **off** everywhere (`font-variant-ligatures: none`): a
learner reading about strict equality has to be able to count three `=` signs, and
JetBrains Mono would otherwise draw them as one glyph.

### 9.3 Palette

Warm paper in light, warm lamplight in dark — not one inverted into the other. Six hues,
six jobs, extending rather than contradicting the colour legend at the top of
`styles.css`. Every pair clears WCAG AA in both schemes.

| Token            | Light     | Dark      | Means                                             |
| ---------------- | --------- | --------- | ------------------------------------------------- |
| `--bf-bg`        | `#f6ecdb` | `#1c1815` | the page                                          |
| `--bf-surface`   | `#fffaf1` | `#2a2420` | a card, lifted off it                             |
| `--bf-surface-2` | `#ece0ca` | `#342d27` | a chip or well, recessed into it                  |
| `--bf-ink`       | `#241f1a` | `#f3ebe0` | text                                              |
| `--bf-ink-2`     | `#6b5f52` | `#b8aa9b` | secondary text                                    |
| `--bf-accent`    | `#b8551f` | `#e2764f` | **look here** — eyebrows, the hand voice, symbols |
| `--bf-gold`      | `#96690a` | `#e8c86a` | **commit to an answer** — predict/reveal, tape    |
| `--bf-olive`     | `#4e5f33` | `#a9bb7e` | **the way that works**                            |
| `--bf-danger`    | `#a4432c` | `#e08a6c` | **the trap**                                      |
| `--bf-blue`      | `#2c5b87` | `#8fb7de` | **someone is asking a question** — Q&A only       |
| `--bf-clay`      | `#c08e5e` | `#bd8b5e` | the solid object at the centre of a diagram       |

Body copy sits at 88% ink while headings and `<strong>` go to full ink. That one step is
most of what makes a scanned paragraph give up its point.

### 9.4 The presentation set — `src/app/shared/brain/`

`shared/teaching/` owns _retention_ devices; this set owns _presentation_. They compose,
and a migrated lesson uses both.

| Component       | Reach for it when                                                     |
| --------------- | --------------------------------------------------------------------- |
| `app-chapter`   | opening a lesson — ghost numeral, track badge, "you are here" rail    |
| `app-code-lab`  | any substantial snippet: an editor window with numbered line notes    |
| `app-layers`    | one thing _contains_ another (DI, CD, interceptors, closures, `pipe`) |
| `app-bubbles`   | a two-party contract learners get backwards — stage it as dialogue    |
| `app-tape-card` | three to five short parallel named things                             |
| `app-napkin`    | the one thing per section the reader should stop and _do_             |

`app-code-lab` is the answer to the most-repeated request in the project's history. Notes
are typed data (`{ line, text }`), the marker and the note light each other up, and both
directions are reachable from the keyboard. **A note must say what the symbols are, not
restate the line in English.**

### 9.5 Rules for extending it

- **Restyle, never restructure** the existing teaching components. Their markup and
  behaviour are covered by `teaching.spec.ts`; §14 of `brain-friendly.css` may only
  change how they look.
- **No hover or press effect may change layout.** Press feedback is `transform`/`opacity`
  or a clipped overlay — never a size, margin or padding change, or the page jitters
  under the pointer.
- **All motion sits inside a `prefers-reduced-motion: no-preference` guard.**
- **Nothing communicates by colour alone.** Every tinted panel also carries a label or a
  shape.
- **No hard-coded colours outside the token blocks.** The whole-shell remap in §3 of
  `brain-friendly.css` only works because both palettes speak in tokens.

### 9.6 Rollout state

Migrated as of 2026-08-31: `expert/change-detection` (the reference implementation — copy
its shape), `beginner/signals`, `intermediate/rxjs-subjects`, `typescript/narrowing`,
`foundations/arrays-objects-basics`. One per track, deliberately, so the layer is proven
against an absolute-beginner audience and an expert one before it goes wider. The
remaining 95 are tracked in `BACKLOG.md` §1.2.

---

## 10. Print

The Glossary offers a print button. Global `@media print` rules hide the scroll bar,
topbar, footer and toasts so the printed page is content only. As noted in §7, these
rules have to be global to reach the chrome.

## Related documents

- [ARCHITECTURE.md](ARCHITECTURE.md) — technical structure
- [SRS.md](SRS.md) — requirements, including the accessibility targets
- [CONTRIBUTING.md](CONTRIBUTING.md) — the lesson skeleton in practice
