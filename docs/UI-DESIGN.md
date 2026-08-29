# UI/UX Design Documentation

**Version:** 1.0
**Last Updated:** 2026-08-29
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
- [9. Print](#9-print)

---

## 1. Design system

Everything lives in `src/styles.css` (366 lines). Both themes are defined as custom
properties on `:root`, with the dark theme overriding a subset.

### Colour

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#fafafa` | `#0b0b0f` | Page background |
| `--bg-elevated` | `#f1f1f3` | `#17171c` | Inputs, subtle raised surfaces |
| `--bg-card` | `#ffffff` | `#141419` | Cards |
| `--surface` | `#ffffff` | `#141419` | Panels, table headers |
| `--border` | `#e4e4e7` | `#27272e` | All borders and dividers |
| `--text` | `#18181b` | `#f4f4f5` | Body text |
| `--text-muted` | `#6b6b76` | `#9d9dab` | Secondary text |
| `--accent` | `#6366f1` | `#818cf8` | Primary — buttons, active states |
| `--accent-2` | `#8b5cf6` | `#a78bfa` | Secondary accent |
| `--violet` | `#7c3aed` | — | Focus rings, emphasis |
| `--green` | `#10b981` | — | Success, "correct", "live" |
| `--amber` | `#f59e0b` | — | Warnings, "in progress" |
| `--blue` | `#4f46e5` | `#a5b4fc` | Links |

**Two tokens are intentionally theme-independent:**

```css
--code-bg: #1e1e2e;   /* code panels are always dark */
--code-fg: #d4d4e4;   /* fixed light text — never inherit --text here */
```

Code blocks stay dark in both themes so syntax highlighting keeps one palette. `--code-fg`
is fixed rather than inheriting `--text` because in light mode that would be near-black
text on a near-black panel — a bug worth naming, since it is the obvious "simplification".

**Syntax highlighting** (`shared/highlighter.ts` emits these classes):
`--hl-kw` `#c792ea` keyword · `--hl-str` `#c3e88d` string · `--hl-cmt` `#546e7a` comment
(italic) · `--hl-num` `#f78c6c` number · `--hl-dec` / `--hl-fn` `#82aaff` decorator and
function.

### Typography

| Use | Stack |
|---|---|
| Body | `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, sans-serif |
| Code | `JetBrains Mono`, `Fira Code`, `ui-monospace`, `SFMono-Regular`, monospace |

| Element | Size | Notes |
|---|---|---|
| `.lesson h1` | 2rem | One per page |
| `.lesson h2` | 1.25rem | Section |
| `.lesson h3` | 1.02rem | Subsection |
| `.lead` | 1.1rem | Opening paragraph — every lesson has one |
| `.lesson__eyebrow` | 0.72rem | Uppercase, letter-spaced track label |
| `.code` | 0.86rem | |
| `.pill`, `.demo__title` | 0.72rem | Uppercase micro-labels |

### Spacing and shape

`--radius: 12px` for cards and panels; 8px for buttons and inputs; 999px for pills.
`--shadow` is a single soft elevation, heavier in dark mode. Gaps are 8–14px inside
components, larger between sections.

---

## 2. Component library

Shared UI lives in `src/app/shared/`:

| Component / directive | Selector | Purpose |
|---|---|---|
| `TooltipDirective` | `[appTooltip]` | Hover/focus tooltip, positioned against the host |
| `RevealOnScrollDirective` | `[appRevealOnScroll]` | Fade-and-rise as an element enters the viewport |
| `FilterLessonsPipe` | `filterLessons` | Text filter over curriculum cards |
| `FilterTabsComponent` | `<app-filter-tabs>` | The pill row used by Practice, Flashcards, Glossary |
| `ToastsComponent` | `<app-toasts>` | Transient notifications, rendered by the root shell |
| `highlighter.ts` | — | Tokenises code samples into `.hl-*` spans |
| `download-file.ts` | — | Blob + object-URL download (results export) |
| `ComingSoon` | route target | Fallback for a lesson without a component |

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
  <span class="lesson__eyebrow">Intermediate · RxJS</span>   <!-- track · category -->
  <h1>Core Operators</h1>
  <p class="lead">One paragraph: what this is and why it matters.</p>

  <h2>Section</h2>
  <p>Explanation.</p>

  <div class="demo">                       <!-- interactive: buttons, inputs, output -->
    <div class="demo__title">Try it</div>
    …
  </div>

  <div class="code"><pre>…</pre></div>     <!-- annotated sample -->

  <div class="tip">…</div>                 <!-- green: do this -->
  <div class="warn">…</div>                <!-- amber: this bites -->
  <div class="note">…</div>                <!-- neutral aside -->

  <h2>Key takeaways</h2>
  <ul>…</ul>
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

**Target: WCAG 2.1 AA.**

| Area | Approach |
|---|---|
| **Keyboard** | Every control is a real `<button>` / `<a>` / form element. No click handlers on `<div>`s. |
| **Focus** | 2px violet outline at 1px offset on inputs; never removed anywhere. |
| **Contrast** | Both themes meet 4.5:1 for body text. The a11y lesson ships a live contrast checker used to verify pairings. |
| **ARIA** | Attribute binding (`[attr.aria-*]`), never property binding — `[aria-expanded]` raises NG0303 and is the commonest Angular ARIA mistake. |
| **Live regions** | Async status changes (saving, validation results) are announced, with the text varied so consecutive identical announcements are not swallowed. |
| **Motion** | `prefers-reduced-motion: reduce` disables scroll reveals and transitions. |
| **Semantics** | Lessons are `<article>` with a single `<h1>` and a correct heading order. |

The `a11y` lesson is itself the reference implementation for these patterns.

---

## 7. Styling conventions

**Where styles live**

| Scope | Location |
|---|---|
| Tokens, resets, `.lesson` anatomy, native controls | `src/styles.css` |
| Anything specific to one lesson | `<lesson>.css`, beside the component |
| A demo component inside a lesson | `<child>/<child>.css`, in the child's own folder |
| Study-tool pages | `<page>.css`, beside the page component |

Every component references its stylesheet with `styleUrl` (singular). There are no
inline `styles: []` blocks left in the app — the only `styles: [` strings you will find
are inside lesson code samples, where they are teaching content rather than metadata.

**Naming** — BEM-ish for shared classes (`.lesson__eyebrow`, `.demo__title`); short
descriptive names for local ones. Component styles are view-encapsulated, so a local
`.box` cannot collide with another page's.

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

| Effect | Detail |
|---|---|
| Route transition | View Transitions API via `withViewTransitions()`; a 6px rise + fade, degrading to an instant swap where unsupported |
| Scroll reveal | `.reveal` → `.reveal--visible`, 0.55s, `cubic-bezier(0.16, 1, 0.3, 1)`, with a per-element `--reveal-delay` for staggering |
| Buttons | 0.15s brightness, 0.05s press translate |
| Tooltip | 0.12s fade-in |
| Lesson entry | `fade-in` on `.lesson` |

All of it is suppressed under `prefers-reduced-motion: reduce`.

---

## 9. Print

The Glossary offers a print button. Global `@media print` rules hide the scroll bar,
topbar, footer and toasts so the printed page is content only. As noted in §7, these
rules have to be global to reach the chrome.

## Related documents

- [ARCHITECTURE.md](ARCHITECTURE.md) — technical structure
- [SRS.md](SRS.md) — requirements, including the accessibility targets
- [CONTRIBUTING.md](CONTRIBUTING.md) — the lesson skeleton in practice
