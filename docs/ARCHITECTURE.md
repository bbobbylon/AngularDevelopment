# Architecture Documentation

**Version:** 1.0
**Last Updated:** 2026-08-29
**Status:** Final

## Overview

A single-page Angular 21 application with no backend. The curriculum is data, the
routes are generated from it, every lesson and study tool is a lazily-loaded
standalone component, and all persistent state lives in the browser's `localStorage`
behind one typed registry.

## Table of Contents

- [1. System architecture](#1-system-architecture)
- [2. Technology stack](#2-technology-stack)
- [3. Directory structure](#3-directory-structure)
- [4. Key design patterns](#4-key-design-patterns)
- [5. Data models](#5-data-models)
- [6. Persistence layer](#6-persistence-layer)
- [7. Feature data flow](#7-feature-data-flow)
- [8. Testing strategy](#8-testing-strategy)
- [9. Performance](#9-performance)
- [10. Security](#10-security)
- [11. Decisions and trade-offs](#11-decisions-and-trade-offs)

---

## 1. System architecture

There is no server. The whole app is static files; everything runs in the browser.

```
                      ┌──────────────────────────────┐
                      │   core/curriculum.ts         │
                      │   CURRICULUM: Lesson[]       │  ← single source of truth
                      └──────────────┬───────────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 ▼                   ▼                   ▼
         app.routes.ts        pages/home           pages/glossary
       (one route per        (dashboard cards,    (terms link to
        lesson, lazy)         per-track counts)    lesson routes)

  ┌─────────────────────────────────────────────────────────────────┐
  │                        Study tools (pages/)                     │
  │                                                                 │
  │   practice ──┬──► review-queue ◄──┬── mock-exam                 │
  │              │                    │                             │
  │   flashcards ┘                    └── exam-day ──► coding-tasks │
  │                                                                 │
  │   All read/write through ▼                                      │
  └─────────────────────────────────────────────────────────────────┘
                             │
                  ┌──────────▼───────────┐
                  │   core/storage.ts    │  STORAGE_KEYS + readJson/writeJson
                  └──────────┬───────────┘
                             ▼
                        localStorage
                             │
                  ┌──────────▼───────────┐
                  │   pages/progress     │  read-only aggregator over every key
                  └──────────────────────┘
```

**Data flow in one sentence:** the curriculum generates the routes and the dashboard;
the question bank feeds Practice, Mock Exam, Flashcards and Exam Day; everything those
features learn about the user lands in `localStorage` through one module; and the
Progress dashboard reads all of it back without writing anything.

---

## 2. Technology stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Angular 21** | Standalone components throughout; no `NgModule` |
| Language | **TypeScript** (strict) | |
| Reactivity | **Signals** | `signal` / `computed` / `effect` / `linkedSignal`; RxJS only where streams genuinely help |
| Change detection | **Zoneless** | No `zone.js` |
| Routing | `provideRouter` with `withComponentInputBinding()` and `withViewTransitions()` | |
| HTTP | `provideHttpClient(withFetch())` | Only used by lessons demonstrating `HttpClient` against public demo APIs |
| Styling | Plain CSS + custom properties | No CSS framework, no preprocessor |
| Tests | **Vitest** via `@angular/build:unit-test`, jsdom | Run with `npm test` |
| Build | Angular CLI (`@angular/build`) | |
| Backend | **None** | Deliberate — see §11 |

Runtime dependencies are `@angular/*`, `rxjs` and `tslib`. Nothing else.

---

## 3. Directory structure

```
src/
├── main.ts                      bootstrapApplication
├── styles.css                   design tokens + shared .lesson/.demo/.code styles
└── app/
    ├── app.ts                   root shell: nav, theme toggle, toasts
    ├── app.config.ts            root providers
    ├── app.routes.ts            static routes + one generated per lesson
    │
    ├── core/                    app-wide, no UI
    │   ├── curriculum.ts        CURRICULUM — every lesson, in order
    │   ├── lesson.model.ts      Lesson / Level / LevelGroup types + LEVELS
    │   ├── storage.ts           STORAGE_KEYS registry + SSR-safe read/write
    │   ├── progress.service.ts  visited lessons, per-track completion
    │   ├── streak.service.ts    consecutive-day study streak
    │   ├── bookmarks.service.ts starred lessons/questions + notes
    │   ├── achievements.ts      badge definitions and unlock rules
    │   ├── glossary-data.ts     65 terms, each with a topicPath
    │   ├── toast.service.ts     transient notifications
    │   └── app-config.token.ts  injection token for app-level config
    │
    ├── shared/                  reusable UI
    │   ├── tooltip.directive.ts
    │   ├── reveal-on-scroll.directive.ts
    │   ├── filter-lessons.pipe.ts
    │   ├── filter-tabs.component.ts
    │   ├── toasts.component.ts
    │   ├── highlighter.ts       syntax highlighting for code samples
    │   ├── download-file.ts     Blob + object-URL download helper
    │   └── coming-soon/         fallback page for a lesson without a component
    │
    ├── pages/                   the study tools, one directory each
    │   ├── home/  practice/  mock-exam/  review/  progress/  flashcards/
    │   ├── coding-tasks/  exam-day/  glossary/  bookmarks/
    │   ├── api-playground/  interview/  certification/  not-found/
    │   │
    │   └── practice/            (the content hub other features build on)
    │       ├── practice-data.ts     CHALLENGES — 424 questions
    │       ├── practice-helpers.ts  OptionsShuffler, scoring helpers
    │       └── review-queue.ts      Leitner spaced-repetition store
    │
    └── lessons/
        ├── foundations/<id>/<id>.ts
        ├── typescript/<id>/<id>.ts
        ├── beginner/<id>/<id>.ts
        ├── intermediate/<id>/<id>.ts
        ├── expert/<id>/<id>.ts
        └── projects/<id>/<id>.ts
```

One file per lesson, template and styles inline. That is unusual for an Angular app and
deliberate here: a lesson is a teaching artefact, and having the explanation, the demo
markup, the demo code and the styles in one file means a reader can follow it without
jumping between four.

---

## 4. Key design patterns

### 4.1 Curriculum as data

`CURRICULUM` is an array of `Lesson` objects. `app.routes.ts` maps over it to produce a
lazy route per lesson; `pages/home` groups it by level and category to produce the
dashboard. Adding a lesson is a data edit, and the route, the nav entry and the card
all follow. A lesson without a `loadComponent` still gets a route — it lands on the
shared "coming soon" page rather than 404ing. (No lesson currently needs it; the
fallback exists so a half-written curriculum always compiles.)

### 4.2 Signal stores

The recurring state pattern, used by the study tools and taught by the
`state-management` lesson:

```ts
@Injectable({ providedIn: 'root' })
export class SomeStore {
  private readonly _items = signal<Item[]>(load());   // private, writable
  readonly items = this._items.asReadonly();          // public, read-only
  readonly stats = computed(() => derive(this._items()));  // never stored twice

  add(item: Item) { this._items.update((l) => [...l, item]); save(); }
}
```

No store library. `private` plus `asReadonly()` gives the encapsulation, `computed`
gives the derived views, and every mutation goes through a named method — so every
write is findable and no two pieces of state can disagree.

### 4.3 Derive, don't duplicate

Anything that can be computed is computed. The clearest instance is the data-dashboard
project: four filters, a sort key and a page number are the only writable state; the
filtered rows, the page count, the visible page and the summary totals are all
`computed`. There is no "recalculate" call to forget.

### 4.4 Lazy everything

Every route uses `loadComponent`. A visit to one lesson downloads that lesson's chunk
and nothing else — which matters, because 100 lessons with inline templates would be a
very large single bundle.

### 4.5 Shared content, independent features

Practice, Mock Exam, Flashcards and Exam Day all consume `CHALLENGES` from
`practice-data.ts`, and all report misses to `review-queue.ts`. The question bank is
written once; each feature decides how to present it.

---

## 5. Data models

### `Lesson` (`core/lesson.model.ts`)

| Field | Type | Meaning |
|---|---|---|
| `id` | `string` | kebab-case route segment, unique |
| `title` | `string` | Display title |
| `summary` | `string` | One line, shown on cards |
| `level` | `Level` | `foundations` \| `typescript` \| `beginner` \| `intermediate` \| `expert` \| `projects` |
| `category` | `string` | Grouping within a level, e.g. "Templates", "RxJS" |
| `loadComponent?` | `() => Promise<Type<unknown>>` | Lazy loader; omitted means "coming soon" |

### `Challenge` (`pages/practice/practice-data.ts`)

424 questions. Each carries its options, the correct index, a rich explanation
(including why the *wrong* answers are wrong), a category, a difficulty, and a
`topicPath` linking to the lesson that teaches it.

**`topicPath` is a lesson `id`, not a URL** — no leading slash. A `/`-prefixed value
produces a link that looks right and 404s. A test enforces this across the whole bank
and the glossary.

### `GlossaryTerm` (`core/glossary-data.ts`)

65 terms: `term`, `definition`, and a `topicPath` under the same rule.

### `ReviewItem` (`pages/practice/review-queue.ts`)

A Leitner box entry: the challenge id, its current box (higher = seen correctly more
often = shown less often), and when it is next due.

---

## 6. Persistence layer

`core/storage.ts` owns **every** `localStorage` key the app writes:

| Key | Shape | Owner |
|---|---|---|
| `ng-concepts-visited` | `string[]` of lesson ids | ProgressService |
| `ng-study-streak-v1` | `{current, longest, lastDate}` | StreakService |
| `ng-bookmarks-v1` | `Record<id, Bookmark>` | BookmarksService |
| `theme` | `'light' \| 'dark'` | App shell |
| `angular-practice-progress-v1` | `Record<challengeId, …>` | Practice |
| `angular-practice-adaptive-v1` | `{enabled, level, streak}` | Practice |
| `angular-review-queue-v1` | `Record<challengeId, ReviewItem>` | review-queue |
| `angular-review-mastered-v1` | `number[]` | review-queue |
| `angular-mock-exam-history-v1` | `ExamAttempt[]` | MockExam |
| `angular-coding-tasks-v1` | `Record<taskId, {done}>` | CodingTasks |
| `angular-exam-day-active-v1` | in-flight readiness check | ExamDay |
| `angular-exam-day-history-v1` | `ReadinessEntry[]` | ExamDay |

Two rules make this work:

- **Keys are versioned** (`-v<n>`). Bumping the suffix is the deliberate way to
  invalidate incompatible stored data: old entries are never read again and the reader
  falls back to its default. Never change a stored shape without bumping.
- **`readJson` never throws.** Storage unavailable, key absent, and stored JSON corrupt
  all collapse to the same answer: return the caller's fallback. Study data is
  advisory, never load-bearing — a corrupt entry must not stop the app booting.

The module has no Angular dependencies, so importing it from a lazy chunk costs
essentially nothing.

---

## 7. Feature data flow

**Practice → Review.** Answering wrong records the challenge in the Leitner queue.
`/review` then serves items whose box interval has elapsed; answering correctly
promotes an item a box, answering wrong demotes it to box 1. Graduated items move to
the mastered list.

**Mock Exam.** Three phases — config, active, review — over a subset of `CHALLENGES`
with a timer. On submission, misses go to the review queue and the attempt is appended
to the history.

**Exam Day.** A timed exam plus two coding briefs, producing a readiness verdict. The
in-flight state is persisted separately from the history so a refresh mid-check does
not lose it.

**Progress.** Reads every key above and writes none. It is a pure view over the other
features' state, which is why adding a feature only means adding a read here.

**Adaptive difficulty.** Practice tracks a rolling correct/incorrect streak and shifts
the difficulty of served questions accordingly, with the state persisted so it survives
a reload.

---

## 8. Testing strategy

18 spec files, 162 tests, in three groups:

1. **Unit tests over `core/`** — storage read/write and its failure modes, progress,
   streak (including date-boundary behaviour), bookmarks, achievements.
2. **Logic tests over the study tools** — option shuffling, scoring, the Leitner
   promotion/demotion rules, exam phase transitions, progress aggregation.
3. **Data-integrity guards over the content itself.** The most valuable of these
   verifies that every `topicPath` in the question bank and the glossary matches a real
   lesson `id` — it caught 43 dead study links on introduction. Others check for
   duplicate question ids and for answer-option length balance.

`TestBed.tick()` is the effect-flush API in this codebase. (`flushEffects` appears only
inside lesson *teaching content* — it is not the API these specs use.)

---

## 9. Performance

- **Route-level code splitting.** Every lesson and page is its own chunk.
- **Zoneless change detection.** No `zone.js`; signals notify the scheduler directly,
  and writes within a microtask coalesce into one render pass.
- **Derived state over stored state.** `computed` is lazy and cached, so a derivation
  nothing is reading costs nothing.
- **The Practice list renders in batches** behind a "Show more" button rather than
  building all 424 cards up front — each card is a code block, four option buttons and
  an explanation panel, so the unbatched version was tens of thousands of DOM nodes
  before first paint. A button rather than `@defer (on viewport)` because the cards are
  stateful and an explicit limit is testable; answer state is keyed by challenge id, so
  a card restores correctly whenever it is finally rendered.

Known bottleneck: some lesson files are large (a few over 600 lines with inline
templates). They are individually lazy, so this costs chunk size on one route rather
than app-wide startup.

---

## 10. Security

There is no backend, no authentication and no user data leaving the browser, which
removes most of the usual surface. What remains:

- **One `bypassSecurityTrust*` call in the whole codebase** — `security.ts` trusts a
  hard-coded resource URL to demonstrate the API. It is never applied to user input.
  The same lesson's live XSS demo runs a hostile payload *through* the sanitizer rather
  than around it.
- **No `innerHTML` with user-supplied content.** The code-sample highlighter operates on
  authored content only.
- **`localStorage` holds study progress only** — no credentials, no tokens, nothing
  personal.
- The `auth-flow` project ships a **mock** auth service. Its credentials are in the
  bundle by design; it exists to practise routing and guard patterns, and says so.

---

## 11. Decisions and trade-offs

**No backend.** The app is a study tool for one person at a time. A backend would add
accounts, hosting cost and a privacy surface in exchange for cross-device sync — which
is the only thing lost. Static hosting anywhere, zero running cost, nothing to breach.

**No state-management library.** Signal stores cover every case here in about forty
lines each. NgRx is taught in the `state-management` lesson rather than depended on,
which also keeps the lesson honest about when it is worth it.

**Inline templates in lesson files.** Costs the usual template-in-a-string ergonomics;
buys a lesson that reads as one document. For teaching artefacts that is the right
trade, and it is not the pattern the lessons *recommend* for application code.

**No CSS framework.** Custom properties and a small shared stylesheet. The lessons need
to demonstrate view encapsulation, `:host`, and theming honestly, which a utility
framework would obscure.

**Zoneless.** Matches what the app teaches, and the whole codebase is signal-based, so
there was nothing to migrate.

## Related documents

- [SRS.md](SRS.md) — requirements
- [UI-DESIGN.md](UI-DESIGN.md) — design system and interaction patterns
- [CONTRIBUTING.md](CONTRIBUTING.md) — writing lessons and questions
- [../DEPLOYMENT.md](../DEPLOYMENT.md) — build and deploy
- [CI-CD-PIPELINE.md](CI-CD-PIPELINE.md) — the pipelines
