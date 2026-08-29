# Angular Concepts — Certification Study App

An interactive study app for the Angular certification tracks. **100 lessons**, each a
self-contained page with live, editable demos rather than a wall of prose — plus a
**424-question practice bank**, timed mock exams, spaced repetition, flashcards, coding
tasks and a progress dashboard.

Built on **Angular 21**: standalone components, signals, the built-in control flow
(`@if` / `@for` / `@switch`), the `input()` / `output()` / `model()` APIs, and a
zoneless change-detection setup.

**Status:** all 100 lessons are written and live. Nothing is a placeholder.

---

## Quick start

```bash
npm install
npm start        # dev server at http://localhost:4200
npm run build    # production build
npm test         # unit tests (Vitest via @angular/build:unit-test)
```

> Run tests with `npm test` (or `npx ng test --watch=false`). A bare `vitest run`
> will not work — the suite is driven by the Angular build's test target.

---

## What's in it

### The curriculum — 100 lessons across six tracks

| Track | Lessons | Covers |
|---|---|---|
| **Foundations** | 12 | How the web works, terminal & npm, Git, the DOM, async, debugging |
| **TypeScript** | 13 | Types, interfaces, generics, narrowing, `keyof`/`typeof`, utility types, decorators |
| **Beginner** | 24 | Components, templates, bindings, control flow, signals, DI, routing, forms, HTTP |
| **Intermediate** | 26 | Reactive forms, routing in depth, HTTP & interceptors, RxJS, directives, pipes, testing |
| **Expert** | 22 | Change detection, OnPush, zoneless, SSR & hydration, performance, security, i18n, a11y |
| **Projects** | 3 | Task manager, data dashboard, auth flow — the pieces assembled into working features |

Every lesson is **one standalone component per concept**, split the conventional
Angular way into `.ts` + `.html` + `.css`. Lessons whose demos need their own child
components give each child its own folder beside the lesson. Lessons are lazily
loaded, so opening one downloads only that chunk.

```
lessons/beginner/inputs/
  inputs.ts / inputs.html          # the lesson
  badge/badge.ts|.html|.css        # a demo component it renders
  coerce-demo/coerce-demo.ts|…
```

### The study tools

| Route | What it does |
|---|---|
| `/` | Home dashboard — the whole curriculum, filterable, with per-track progress |
| `/practice` | 424-question bank with shuffled options, explanations and adaptive difficulty |
| `/mock-exam` | Timed exam: configure → sit → review, with the misses fed to the review queue |
| `/review` | Spaced repetition over everything you got wrong (Leitner boxes) |
| `/flashcards` | Quick-recall cards generated from the same question bank |
| `/coding-tasks` | 17 hands-on tasks with acceptance criteria |
| `/exam-day` | Readiness check — a timed exam plus two coding briefs, with a verdict |
| `/progress` | Aggregate dashboard over every other feature's stored state |
| `/glossary` | 65 terms, each linked to the lesson that teaches it |
| `/bookmarks` | Starred lessons and questions, with notes |
| `/api-playground` | The HTTP request lifecycle, step by step |
| `/interview` | Interview-question drill |
| `/certification` | What the exam actually covers, and how to prepare |

All study state is kept in `localStorage` and is entirely local to your browser —
there is no backend and nothing leaves the machine.

---

## How it's put together

There is a **single source of truth for the curriculum**:

```
src/app/core/curriculum.ts     # every lesson, in order
src/app/core/lesson.model.ts   # the Lesson type + level metadata
```

Routes (`app.routes.ts`) and the home dashboard (`pages/home`) are both generated from
`CURRICULUM`, so adding a lesson to that array is all it takes for its route, its
navigation entry and its dashboard card to appear.

```
src/app/
├─ core/            curriculum, storage keys, and the app-wide services
├─ shared/          reusable directives, pipes and small components
├─ pages/           the study tools (practice, mock-exam, review, progress, …)
└─ lessons/
   ├─ foundations/<id>/
   ├─ typescript/<id>/
   ├─ beginner/<id>/
   ├─ intermediate/<id>/
   ├─ expert/<id>/
   └─ projects/<id>/
```

Shared lesson styling (`.lesson`, `.demo`, `.code`, callouts) lives in `src/styles.css`
so a lesson file only carries the styles unique to its own demos.

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the full picture.

---

## Adding a lesson

1. Create `src/app/lessons/<level>/<id>/<id>.ts` exporting a standalone component.
2. Add its entry to `CURRICULUM` in `src/app/core/curriculum.ts`, including a
   `loadComponent`:

   ```ts
   loadComponent: () => import('../lessons/beginner/my-topic/my-topic').then((m) => m.MyTopic),
   ```

3. That's it — route, navigation and dashboard card follow automatically.

Before writing the lesson itself, read
**[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)** — it covers the depth standard these
lessons are held to (live demos and edge cases, not documentation summaries), the
file layout, and the conventions for adding practice questions.

---

## Documentation

| Document | What's in it |
|---|---|
| [docs/SRS.md](docs/SRS.md) | What the app is for, who it's for, and what it must do |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical structure, data flow, and design decisions |
| [docs/UI-DESIGN.md](docs/UI-DESIGN.md) | Design system, layout patterns, accessibility |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | How to write a lesson or add practice questions |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Building and deploying (GitHub Pages, Docker, static hosts) |
| [docs/CI-CD-PIPELINE.md](docs/CI-CD-PIPELINE.md) | The CI/CD workflows |

---

## Tests

18 spec files, 162 tests, covering the `core/` services, the storage layer, the
practice/exam/review logic, and data-integrity guards over the content itself —
including one that verifies every `topicPath` in the question bank and glossary
points at a lesson that actually exists.

```bash
npm test
```
