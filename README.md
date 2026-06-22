# Angular Concepts — Certification Study Repo

An interactive, hands-on reference covering **every Angular concept** needed for the
beginner, intermediate and expert certification tracks — plus the supporting
TypeScript a professional Angular developer is expected to know.

Built on **Angular 21** (standalone components, signals, the built-in control flow
`@if` / `@for` / `@switch`, and the `input()` / `output()` / `model()` APIs).

## Running it

```bash
npm install
npm start        # dev server at http://localhost:4200
npm run build    # production build
npm test         # unit tests (Vitest)
```

The home page is a dashboard of the **whole curriculum**, grouped by track and
category, with a filter bar. Each card opens a self-contained, interactive lesson.

## How it's organized

There is a single source of truth for the curriculum:

```
src/app/core/curriculum.ts     <- every concept is listed here
src/app/core/lesson.model.ts   <- the Lesson type + level metadata
```

Routes (`app.routes.ts`) and the home dashboard (`pages/home`) are both generated
from `CURRICULUM`. Every concept is enumerated, so the full scope is always
visible. A lesson with a `loadComponent` is **live**; one without routes to a
shared **"coming soon"** page until its component is written. The app always
compiles regardless of how many lessons are finished.

```
src/app/
├─ core/                  curriculum data + model (the master list)
├─ pages/home/            the dashboard / index
├─ shared/coming-soon/    placeholder page for unwritten lessons
└─ lessons/
   ├─ typescript/<id>/    TypeScript essentials
   ├─ beginner/<id>/      core Angular
   ├─ intermediate/<id>/  forms, routing, HTTP, RxJS, directives, testing
   └─ expert/<id>/        change detection, SSR, performance, security, …
```

Each lesson is **one standalone component per concept** (inline template +
styles) so the entire concept lives in a single readable file. Shared lesson
styling (`.lesson`, `.demo`, `.code`, callouts) lives in `src/styles.css`.

## Adding / finishing a lesson

1. Create `src/app/lessons/<level>/<id>/<id>.ts` exporting a standalone component.
2. In `core/curriculum.ts`, add a `loadComponent` to that concept's entry:

   ```ts
   loadComponent: () => import('../lessons/beginner/my-topic/my-topic').then((m) => m.MyTopic),
   ```

3. Done — the route, navigation entry and "Live" badge appear automatically.

## Status

Track progress on the home dashboard — each track shows an `x/total ready`
counter, and live lessons are marked with a green **Live** badge. The TypeScript
and Beginner foundations are implemented first; intermediate and expert lessons
are being filled in.
