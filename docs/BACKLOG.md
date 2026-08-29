# Backlog

**Version:** 1.0
**Last Updated:** 2026-08-29
**Status:** Living document

## Overview

Work that is wanted but not yet done, in rough priority order. Items move out of here
when they ship. This exists so "what's next?" has an answer that survives across sessions
rather than being re-derived each time.

## Table of Contents

- [1. Now](#1-now)
- [2. Next](#2-next)
- [3. Later](#3-later)
- [4. Done](#4-done)

---

## 1. Now

### 1.1 Retention pass over the lessons ("Zero to Hero")

The standing quality bar. Depth is largely achieved; **retention** is not. See
`.claude/CLAUDE.md` → "The Zero-to-Hero standard" for the nine-point bar,
`CONTRIBUTING.md` §2 for the depth bar it sits on top of, and §2A for the components and
conventions this work uses.

**Tooling and infrastructure: done (2026-08-29).**

- `node scripts/audit-retention.mjs` scores all 100 lessons against the nine points and
  ranks them worst-first.
- `src/app/shared/teaching/` provides `Remember`, `Predict`, `Quiz`, `Faq`, `Flow` and
  `Compare` — the six components that close the five gaps the audit found in ~95 lessons.
  Covered by 30 tests in `teaching.spec.ts`.

**Rollout: 5 of 100 lessons done.** The first pass took the weakest and most-read lessons:

| Lesson                            | Before | After |
| --------------------------------- | ------ | ----- |
| `beginner/signals`                | 3/9    | 9/9   |
| `beginner/components`             | 2/9    | 8/9   |
| `beginner/inputs`                 | 2/9    | 8/9   |
| `beginner/outputs`                | 3/9    | 8/9   |
| `intermediate/view-encapsulation` | 2/9    | 7/9   |

**Remaining:** 95 lessons. Distribution as of 2026-08-29 is 2 at 1/9, 8 at 2/9, 29 at 3/9,
46 at 4/9, 9 at 5/9. Work worst-first; the two 1/9 lessons are the `projects/` walkthroughs,
which have a different shape and may need a diagram and a recap more than a quiz.

Per lesson the pass is roughly: read it, add a "the mental model:" paragraph if the analogy
is missing, one `<app-remember>`, one `<app-predict>` on the classic trap, one `<app-quiz>`
on the idea learners get wrong, an `<app-flow>` if anything is a sequence, and an
`<app-faq>` of 3–5 real doubts. Budget an hour a lesson to do it properly; the copy is the
work, not the wiring.

---

## 2. Next

### 2.1 Animations and transitions

Requested 2026-08-29. The app should feel alive: button presses, link activation, route
changes, panel/accordion opens, list add/remove, toast entry/exit.

What already exists to build on, so this is an extension rather than a from-scratch job:

- **View Transitions** are already enabled — `withViewTransitions()` in `app.config.ts`,
  with `::view-transition-old/new(root)` keyframes in `styles.css`. Route changes already
  cross-fade; they could do much more (shared-element transitions between a dashboard card
  and the lesson it opens).
- **`RevealOnScrollDirective`** already fades content in on scroll.
- **`@keyframes fade-in`** and colour-scheme transitions exist in `styles.css`.

Constraints that are not optional:

- **Honour `prefers-reduced-motion: reduce`** — already respected for scroll reveals and
  transitions, and anything new must follow. This is a WCAG requirement and the a11y suite
  is a gate.
- Prefer CSS and the View Transitions API over `@angular/animations`, which is deprecated
  in favour of CSS — the `animations` lesson teaches exactly this, so using the deprecated
  package would contradict the curriculum.
- Animation is a teaching opportunity: whatever ships here should be worth pointing at from
  the relevant lessons.

---

## 3. Later

### 3.1 Shared-element route transitions

Depends on 2.1. Morph a dashboard lesson card into the lesson page header via
`view-transition-name`. High polish, moderate effort.

### 3.2 Multi-project hosting

The user is planning a centralized home for every project — "GitHub, but each repo is
replicated to a live website." The `aws/` directory is deliberately written as a reusable
template for exactly this — copy it, change `APP_NAME`, and another project is live. This
app becomes one entry in that. The portfolio-site idea in the machine-wide instructions is
the front door for it. Do not start unprompted.

---

## 4. Done

Kept short — detail lives in the docs each item updated.

| Shipped       | What                                                                      |
| ------------- | ------------------------------------------------------------------------- |
| 2026-08-29    | `aws/` boilerplate — S3 + CloudFront + OAC + ACM, four idempotent scripts |
| 2026-08-29    | Prettier normalization + `format:check` gated in CI                       |
| 2026-08-29    | axe-core a11y suite over every route; 27 WCAG violations found and fixed  |
| 2026-08-29    | Mount smoke tests for all lessons and pages (162 → 392 tests)             |
| 2026-08-29    | CI that actually runs tests; deploy gated behind it                       |
| 2026-08-29    | `scripts/` cleanup, 62 → 9 files                                          |
| 2026-08-28/29 | Component revamp — every component split into `.ts` + `.html` + `.css`    |
| 2026-08-28    | Inline JSDoc across the codebase; 727 undocumented declarations → 0       |
| 2026-08-28    | Docs consolidated into `docs/`                                            |

## Related Documents

- [CONTRIBUTING.md](CONTRIBUTING.md) — the depth standard and how to add lessons
- [ARCHITECTURE.md](ARCHITECTURE.md) — how the app is built
- [UI-DESIGN.md](UI-DESIGN.md) — design system, motion, accessibility
