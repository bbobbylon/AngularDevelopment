# Backlog

**Version:** 1.1
**Last Updated:** 2026-08-31
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

**Rollout: 19 of 100 lessons done.** The first pass took the weakest and most-read lessons:

| Lesson                            | Before | After |
| --------------------------------- | ------ | ----- |
| `beginner/signals`                | 3/9    | 9/9   |
| `beginner/components`             | 2/9    | 8/9   |
| `beginner/inputs`                 | 2/9    | 8/9   |
| `beginner/outputs`                | 3/9    | 8/9   |
| `intermediate/view-encapsulation` | 2/9    | 7/9   |

Second pass (2026-08-29), clearing everything below 3/9:

| Lesson                         | Before | After |
| ------------------------------ | ------ | ----- |
| `projects/task-manager`        | 1/9    | 9/9   |
| `projects/auth-flow`           | 1/9    | 9/9   |
| `projects/data-dashboard`      | 2/9    | 9/9   |
| `beginner/workspace-config`    | 2/9    | 9/9   |
| `intermediate/form-validation` | 2/9    | 9/9   |

**Two audit detectors were wrong** and were fixed in the same pass, so scores before and
after 2026-08-29 are not comparable:

- "Interactive demo" only matched `signal(` and missed `signal<Foo>(…)` with an explicit
  type argument — the more common spelling.
- It also required an event binding, so a lesson driven entirely by a reactive form
  (`[formGroup]`, `formControlName`) read as static. Both forms now count.

Together these under-scored four lessons that needed no work at all. Re-run the audit
before trusting an old ranking.

Third pass (2026-08-29), working down the 3/9 band. All nine went 3/9 → 9/9:

| Lesson                            | What it needed beyond the standard recipe                         |
| --------------------------------- | ----------------------------------------------------------------- |
| `beginner/class-style-binding`    | Compare of `[style.width]` vs `[style.width.px]`                  |
| `beginner/control-flow-for`       | Compare of the two keyed diffs on a prepend                       |
| `beginner/http-basics`            | New `.triggers` table: which calls actually send the request      |
| `intermediate/route-params`       | **A whole new interactive demo** — a URL dissector (see below)    |
| `intermediate/rxjs-operators`     | The four-receptionists analogy for the flattening operators       |
| `beginner/builtin-directives`     | Also corrected an outdated "silently does nothing" claim → NG8103 |
| `typescript/modules`              | Compare of static `import` vs dynamic `import()`                  |
| `intermediate/ng-template-outlet` | —                                                                 |
| `intermediate/content-projection` | —                                                                 |

`route-params` was the only one in the band failing the **Interactive demo** signal, so it
needed a real demo rather than copy: a live URL dissector that splits
`/users/42;view=grid?tag=ng&tag=rxjs&sort=name#bio` into path segments, matrix params, query
params (flagging repeated keys, which is what `getAll` exists for) and the fragment. That
demo is doing the teaching the prose could not — the four mechanisms are genuinely different
and people conflate them.

**Remaining:** 67 lessons. Distribution: **50 at 4/9**, 12 at 5/9, 1 at 6/9, 1 at 7/9,
3 at 8/9 — 33 lessons are at 9/9.

**The 3/9 band is now empty** (2026-09-01). The last fourteen went through in two sittings:
`json-and-apis`, `testing-services-http`, `structural-directives`, `attribute-directives`,
`keyof-typeof`, `testing-components`, `narrowing` and `arrays-objects-basics`, then
`rxjs-subjects`, `mapped-conditional`, `custom-pipes`, `performance`, `security` and
`services-di`. The floor is 4/9, so the next pass is the big one: 50 lessons that are
mostly missing the same five signals — **Visual, Analogy, Memory hook, Ask before telling,
Self-test**. That uniformity is the opportunity: the same six-block recipe below applies to
nearly every one of them, so they can be worked in batches by section rather than
individually researched.

**What the last six needed, and what generalises.** Every one of them was already _deep_ —
this band was never a content problem, it was a presentation problem, which is exactly the
distinction between bar 1 and bar 2. The reusable moves:

- **The analogy carries the most weight and is the hardest part.** The ones that worked all
  explain a _mechanism_, not a vibe: DI as the office supply cupboard you search outward from
  (which makes shadowing obvious for free), the sanitizer as airport security that screens by
  destination and confiscates items rather than rejecting passengers, performance as a
  restaurant where "slow to be seated" and "slow to get a refill" are unrelated complaints, a
  pipe as a lens filter that changes the photo and not the scene, and a type program as the
  ordinary program moved up one floor.
- **The visual should show something the prose cannot say in one line.** The four that landed
  were all _comparisons over time or structure_: the pure-vs-impure pipe timeline (2 runs out
  of 8 against 8 out of 8, with the mutation tick marked), the injector-tree walk with one
  lookup going all the way to root and another stopping immediately, the load/runtime timeline
  with each Web Vital marked where it is measured, and the four sanitization lanes with the
  bypass dropping out the bottom.
- **The `<app-predict>` should be a bug, not a quiz question.** The strongest ones were all
  _silent_ failures — `OnPush` plus `push()`, a pure pipe over a mutated array, a
  `providedIn: 'root'` service shadowed by a component `providers` entry, `IsNever<never>`.
  Each is something that compiles, throws nothing, and is wrong.
- **Wrong-answer `why` copy is where the teaching is.** Written properly, each distractor
  names a real belief someone holds (a guard is a security boundary; Angular deep-compares
  inputs; `track` can trigger a re-render). See §2A.

**Two authoring traps found in this pass**, both worth knowing before the 4/9 batch:

- A **double quote inside an `answer=` / `question=` attribute terminates the attribute** and
  Prettier fails with a misleading `Opening tag "app-predict" not terminated`. Use curly
  quotes (`“…”`) in projected copy, or move the copy to the `.ts`.
- **Braces in an attribute value** are the same hazard as braces in a `<pre>`. Prefer
  rephrasing (`` `providedIn: 'root'` `` instead of `` `@Injectable({ providedIn: 'root' })` ``)
  or bind from the `.ts`.

**Escaping braces in `<pre>` blocks.** Prettier's `angular` parser rejects a bare `{` inside
a template — Angular reads it as the start of an ICU expression, and you get
`SyntaxError: Unexpected character "EOF"` pointing at the end of the file rather than at the
brace. Any code sample written directly in HTML needs `{{ '{' }}` / `{{ '}' }}`. Samples
passed through a `.ts` string (a `Predict` `[code]` or a `Quiz` option) are unaffected, which
is one more reason to keep long copy in the `.ts`.

**On the `projects/` walkthroughs**, which turned out to need the full treatment rather
than just a diagram: the recipe that worked was an analogy for the architecture (warehouse
with one loading dock; festival wristband; production line), an `<app-flow>` of the runtime
loop rather than the file tree, and a `<app-predict>` on the framework-level trap the
project is built to teach — mutating a signal's array, `router.navigate()` from a guard,
calling a method from a template. Their "What you practiced" heading also had to become
"Recap — …" for the audit's recap detector to see it.

One content bug surfaced while writing the `data-dashboard` quiz: `filtered` both filtered
and sorted, so every header click invalidated the whole derivation chain including the
KPIs. Sorting is now a separate `sorted` selector, which is both faster and the thing the
lesson claims the architecture does.

Per lesson the pass is roughly: read it, add a "the mental model:" paragraph if the analogy
is missing, one `<app-remember>`, one `<app-predict>` on the classic trap, one `<app-quiz>`
on the idea learners get wrong, an `<app-flow>` if anything is a sequence, and an
`<app-faq>` of 3–5 real doubts. Budget an hour a lesson to do it properly; the copy is the
work, not the wiring.

### 1.2 Brain-friendly redesign — roll out to the whole app

**Requested 2026-08-31**, with a visual: the author supplied screenshots of a Head First
style Decorator chapter and asked for that treatment — _"Notice how bubbly, welcoming it
is. NOT JUST THE COLOR but font, spacing, interactiveness, brain-friendliness… notice how
the brain naturally focuses on certain things — those things should be the important stuff
of that section."_ This supersedes §2.2 as the concrete plan for Bar 3.

**Shipped 2026-08-31 — the layer and five pilot lessons.**

- `src/fonts.css` + `public/fonts/` — four self-hosted families (Playfair Display,
  Figtree, Caveat, JetBrains Mono), latin + latin-ext only. Figtree is now the app-wide
  body face and JetBrains Mono the app-wide code face; code ligatures are off everywhere.
- `src/brain-friendly.css` — the warm paper/lamplight palette in both schemes, the `.bf`
  lesson scope, prose colour rules, the whole-shell token remap on `html.bf-page`, and a
  restyle of all six existing teaching components.
- `src/app/shared/brain/` — `Chapter`, `CodeLab`, `Layers`, `Bubbles`, `TapeCard`,
  `Napkin`, `BfPage`.
- `segmentInlineCode` now supports `**bold**` alongside `` `backticks` `` so annotation
  copy can emphasise a word without reaching for HTML.
- Five lessons migrated, **one per track** so the layer is proven against an absolute
  beginner and an expert before it goes wider: `expert/change-detection` (the reference
  implementation), `beginner/signals`, `intermediate/rxjs-subjects`,
  `typescript/narrowing`, `foundations/arrays-objects-basics`. All five went through a
  full write pass and a separate adversarial review pass, and all five now score 9/9 on
  `audit-retention.mjs` (was 24 lessons at 9/9 before this batch, 28 after).

**Shipped 2026-09-03 — the theme is app-wide, unconditionally.** The author asked to make
sure the _entire_ app was brain-friendly, not just migrated lessons. `src/brain-friendly.css`
§3 now repoints the base theme's tokens (`--bg`, `--accent`, `--text`, …) at the warm
palette in an unconditional `:root` block — every page, chrome included, paints from the
same palette and typefaces the instant the stylesheet loads, whether or not that page has
been rewritten. This closed the "non-lesson pages read like a different app" gap flagged
below as an open question. Selector had to move from `html.bf-page` to `:root` (not just
drop the class): `:root`'s specificity beats a bare `html` type selector, so the remap
needed to match `styles.css`'s own `:root` selector (equal specificity, later file in
`angular.json`'s `styles` array wins) rather than a losing one. Verified with a headless
check of computed `--bg`/`--accent`/font-family on both a migrated and a completely
untouched page, in both colour schemes, plus the full test suite.

**Lessons — rollout: 37 of 100 done (as of 2026-09-04).** Four worst-first batches of 8
landed on top of the five pilots: `mapped-conditional`, `custom-pipes`, `performance`,
`security`, `services-di`, `pipes`, `control-flow-switch`, `resource-api` (batch 1);
`router-children-lazy`, `ngmodules`, `why-typescript-angular`, `functions-basics`,
`view-queries`, `after-render`, `ts-nullish`, `libraries-schematics` (batch 2);
`di-providers`, `control-flow-if`, `dom-and-events`, `ts-generics`, `ts-async`,
`http-interceptors`, `hydration`, `debugging-basics` (batch 3); `ts-utility-types`, `i18n`,
`decisions-loops`, `di-advanced`, `rxjs-observables`, `ts-enums`, `ts-types`,
`host-directives` (batch 4). Every batch went through a write pass, an independent
adversarial review pass, and a manual verification sweep (trap greps, `tsc --noEmit`,
`prettier --check`, `ng build`, a headless route check, `audit-retention.mjs`, and the full
test suite) before committing — agent self-reports were wrong often enough (placeholder
summaries, silent NG0100/build-break regressions, a real doc/code mismatch in the shared
`Layers` component a batch-4 reviewer caught) that trusting them without re-checking would
have shipped bugs.

**Lessons — remaining: 63.** Order them worst-first by `node scripts/audit-retention.mjs`,
exactly as §1.1 does — the two passes are now the same pass, because migrating a lesson
means rewriting it against the nine-point bar anyway. Six lessons already have a solid
retention pass from an earlier (pre-brain-friendly) session and just need the presentation
layer built on top rather than from scratch: `route-params`, `rxjs-operators`, `modules`,
`json-and-apis`, `attribute-directives`, `keyof-typeof`. Roughly an hour each; the copy is
the work, not the wiring. Read `src/app/lessons/expert/change-detection/change-detection.ts`
first: its class JSDoc records the teaching order the layer is designed around (pose the
problem → analogy → mechanism → same idea in four modes), and copying that shape is most of
the job.

**Non-lesson pages — new as of 2026-09-03, 5 of 15 done.** The theme flip above fixed
colour/type consistency for free; it does not fix a page's own hard-coded colours or give
it the warmth/motion a migrated lesson has. `home`, `certification`, `practice`,
`mock-exam`, `review` are restyled — a colour audit onto tokens, motion, and (where it
genuinely fits, e.g. Home's hero stats) reuse of a presentation component, while preserving
every existing feature exactly. These are NOT lessons: no Chapter/CodeLab/Quiz/Predict/Faq,
no `.lesson.bf` wrapper — forcing lesson-shaped teaching devices onto a dashboard or a
practice engine would be decoration without information. Three independent restyle passes
converged on the same real gap: `.bf-btn`/`.key`/`.term`/`.bf-break` in
`src/brain-friendly.css` are still scoped under `.lesson.bf` (and `.key`/`.term` have a
second, `.lesson`-scoped rule in `styles.css`) despite being usable-sounding — they render
unstyled on a non-lesson page. Hand-roll from the raw tokens instead, as all three did.
Remaining 10: `progress`, `coding-tasks`, `api-playground`, `exam-day`, `flashcards`,
`interview`, `glossary`, `bookmarks`, `coming-soon`, `not-found`.

**Traps worth knowing before the next batch** (each cost a build break to discover):

- A getter or an `afterRender`-family-written plain field bound directly in a template
  throws NG0100 unless the write goes through a `signal()` (see
  `expert/change-detection`'s JSDoc).
- In real template _body_ text (not just attribute strings), even a single unescaped `{`
  or `}` — e.g. a JS template-literal placeholder like `` `HTTP ${res.status}` `` inside a
  `<code>` sample — fails `ng build` with NG5002 and must be escaped individually as
  `{{ '{' }}`/`{{ '}' }}`, not just double-brace pairs.
- Full-page stylesheets (a restyled dashboard, not a lesson) are legitimately bigger than a
  single lesson's demo CSS. `angular.json`'s `anyComponentStyle` budget was raised from
  10kB/14kB to 16kB/20kB after `home.css`/`mock-exam.css` tripped the old warning threshold
  — no lesson currently exceeds 8.4kB, so this only gives headroom to full-page CSS.

**Open questions the author should settle:**

- **Fonts.** Caveat is a print-hand; the supplied screenshots use a more connected script.
  Swapping is a one-line change to `--font-hand`. Same for `--font-display` if Playfair
  Display is not the intended serif.
- **Light mode.** Both palettes are implemented and both pass contrast, but only the dark
  one has been reviewed against the reference, which was itself dark.

### 1.3 Coverage sweep — concepts that need more lessons or examples

**Requested 2026-08-31** alongside the redesign: _"do a full sweep of the app and see what
needs more lessons or examples for that specific concept."_

Swept all 100 lessons with 21 parallel agents, one per curriculum slice, each reading the
`.ts` as well as the `.html` — a lot of this app's teaching lives in quiz `why` text and
FAQ answers rather than in visible prose. Every claimed gap then went to a second agent
whose stated default was that the claim was **wrong** and which had to grep the lesson
before confirming it.

**Every finding is in [COVERAGE-SWEEP.md](COVERAGE-SWEEP.md)**, per lesson, with what to
add. The summary:

|                                |                                         |
| ------------------------------ | --------------------------------------- |
| Confirmed gaps                 | **401** — 193 high, 195 medium, 13 low  |
| Concepts with no lesson at all | **50**                                  |
| Biggest single kind            | missing failure mode (96)               |
| Heaviest tier                  | Intermediate (105 gaps over 26 lessons) |

**Four themes worth doing as a batch rather than lesson by lesson**, because they repeat
everywhere and are much cheaper and more coherent fixed together:

1. **Nothing ever fails.** 96 findings are a missing failure mode. The curriculum is
   strong on how an API works and weak on what it looks like when it breaks — no rejected
   promise, no NG error code read aloud, no rejected `git push`. A learner who has never
   seen the message cannot recognise it under pressure, which is exactly the situation
   this app exists to prepare them for.
2. **The Angular 21 surface is ahead of the curriculum.** `httpResource`, Signal Forms,
   `linkedSignal`, `router.events` and `EnvironmentProviders` are name-dropped and taught
   nowhere; 26 findings are an API that has moved under a lesson. This one decays further
   every release, so it is the most time-sensitive item in this file.
3. **The web platform underneath Angular is assumed.** No HTML lesson, no CSS lesson, and
   CORS named as a cause of failure three times without ever being explained — in a tier
   whose blurb promises "no prior experience assumed".
4. **Delivery stops at `ng build`.** Nothing covers what the output actually is, why a
   deep link 404s without a server rewrite, or how metadata reaches a crawler — in a tier
   called Rendering & Delivery.

**Suggested order.** Theme 2 first (it rots), then theme 1 folded into the redesign pass
in §1.2 — a lesson being rewritten for presentation is already open, and adding its
failure modes then costs a fraction of a separate visit. Themes 3 and 4 are new lessons,
so they are a decision about scope rather than a backlog item to grind through.

**A caution.** The adversarial pass dropped 12 of 413 raw claims (about 3%). That is a
sign the finders were careful, not proof every survivor is real — read the lesson before
acting on a line.

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
- **An interaction effect must never change layout.** Shipped 2026-08-30: a CSS-only press
  bloom on every `button`, painted in a pseudo-element clipped to the button's own box.
  The rejected version of this in a sibling project injected a sized element into the
  button, which joined the flow and shoved neighbouring buttons aside. Absolutely
  positioned or `transform`/`opacity` only — never width/height/padding.

Still to do here: panel/accordion open-close, list add/remove, richer route transitions.

### 2.2 Presentation pass — "brain-friendly", every subject

Requested repeatedly; escalated 2026-08-29 with a detailed critique. The standard is
recorded as **Bar 3** in `.claude/CLAUDE.md`. The user's own summary of the goal: put the
student "in the best possible position to land these jobs" — colour, visuals and active
recall are the levers, not more prose.

The critique, point by point, as acceptance criteria:

1. **Contrast tiers.** Page background darkest → cards one step lighter → code blocks a
   third tone entirely, near-black like a real terminal. Partly shipped 2026-08-30
   (`--code-bg: #0d1117`, `--measure`); the card tier still needs separating.
2. **Inline code restraint.** Reserve inline `<code>` for single symbols and short
   identifiers. Full expressions like `new Mocha(new Whip(new HouseBlend()))` belong on
   their own indented line, not mid-sentence — an eye that trips on a highlighted chip
   every few words cannot read prose. Global style softened 2026-08-30; the _authoring_
   habit still needs fixing lesson by lesson.
3. **Line length.** Cap prose at ~65–75 characters even inside a full-width card. Shipped
   2026-08-30 as `--measure: 68ch` with a `.full-width` opt-out.
4. **Don't cram code into narrow columns.** Three-up card rows holding real code force
   awkward wrapping and tiny effective font sizes. Either stack full-width, or keep the
   columns for short explanatory text and move the code to one shared full-width block.
5. **Colour must not do double duty.** When the accent is used for the badge, the H1, the
   section header _and_ body emphasis, nothing is special any more. Narrow the accent to
   one or two anchor uses; let a real syntax palette carry the code.
6. **Vertical rhythm.** More space above a heading than below it, so it attaches to the
   section it introduces. Shipped 2026-08-30 for `h2`/`h3`.

### 2.3 Line-by-line code annotation — **first pass complete 2026-08-30**

The single most-repeated request in the project's history. A one-line sentence above a
30-line block is a defect. Every snippet needs comments on the lines that carry the idea,
plus an annotated walkthrough for anything non-obvious. **Never assume the student can read
the snippet** — they are here because they cannot yet.

**Where it landed.** Measured with `scratchpad/audit-comments.mjs` (annotation ratio across
every `<pre>` block in a lesson `.html` and every multi-line template-string sample in a
lesson `.ts`):

|                                                | start | now       |
| ---------------------------------------------- | ----- | --------- |
| annotation ratio                               | 32.7% | **42.5%** |
| under-annotated blocks (≥8 lines, <2 comments) | 54    | **0**     |

Roughly 30 lessons were rewritten, worst-first. The biggest were `auth-flow` (256 loc),
`testing-components` (201), `task-manager` (132), `data-dashboard` (103),
`state-management` (96), `reactive-forms` (95), `decorators` (90), `services-di` (85).

Three real defects surfaced while annotating and were fixed rather than documented:

- `testing-services-http` — the marble test asserted an emission at frame 130 for a
  `debounceTime(300)` that actually fires at 430. Rewritten with time-progression syntax.
- `http-interceptors` — `inject(Router)` was called inside a `catchError` callback, which
  is outside the injection context and throws NG0203. Hoisted into the interceptor body.
- `resolvers`, `security`, `auth-flow` — guard/redirect samples now say _why_ a `UrlTree`
  beats `router.navigate()`, which was the trap the lesson's own Predict block tested.

**What "done" does not mean.** The metric counts comment density, not comment quality.
Ratio alone will happily reward noise, so treat 42.5% as a floor that stops regressions,
not a target to optimise. Two authoring rules worth keeping:

- A comment must say something the code does not. `// set loading to true` is worse than no
  comment; `// reset HERE only — the success branch navigates away` earns its line.
- **Comments cannot go inside a tag.** An HTML comment between an element's attributes is
  invalid, and in a lesson it teaches the wrong thing. Hoist the explanation above the
  element and cover the attributes as a group.

**Escaping traps, all hit at least once during this pass** — every one fails the build or
the format check, so run `npm run verify` before trusting a batch:

- Raw `{` / `}` in a `<pre>` inside a template → NG5002. Use `{{ '{' }}`.
- Raw `@` (`@for`, `@if`, `@Injectable`) in a template → parsed as a control-flow block.
  Use `&#64;`.
- Raw `<div>` / `<mark>` in a comment inside `<pre>` → opens a real tag and breaks the
  Prettier parse. Escape as `&lt;` / `&gt;`.
- A backtick inside a `.ts` template-string sample terminates the literal. Escape it or
  use quotes.

### 2.4 Syntax highlighting — finish the job

Shipped 2026-08-30: the token set went from 6 roles to 11 (types, properties, methods,
builtins, operators, dimmed punctuation), keywords are italic, and **the `Predict`
component's code is highlighted at all** — it renders `.predict__code pre`, which the
app-wide sweep in `app.ts` never selected, so every Predict sample in the curriculum had
been rendering as flat white text.

Remaining:

- The sweep still skips anything inside `.demo`, and only runs once per navigation, so
  code revealed later (accordions, `@defer`) is never tokenised. A directive or
  `MutationObserver` would fix both.
- No HTML/template mode — Angular template samples are tokenised with TypeScript rules.
- Consider whether `highlight()` should take an explicit `lang`.

### 2.5 Embedded live-coding editor (StackBlitz-style)

Requested 2026-08-29 for the practice / project / challenge pages: a real editor in the
page, the way StackBlitz embeds a full IDE. Options to evaluate, cheapest first:

- **CodeMirror 6** — ~200 kB, editing + TS highlighting + linting, no execution.
- **Monaco** (VS Code's editor) — real IntelliSense and the most familiar feel; heavy
  (~2 MB+), needs a web worker, awkward with the current zero-dependency stance.
- **WebContainers / StackBlitz SDK** — actually runs `npm install` and a dev server in the
  browser. Closest to the ask, biggest commitment, cross-origin isolation headers required.
- **Sandpack** (CodeSandbox) — middle ground; bundles and runs in-browser.

Note this collides with a documented selling point: the app currently advertises "zero
third-party UI or state libraries" and a hand-rolled highlighter. Decide deliberately.

### 2.6 "Code with me" guided sections

Requested 2026-08-29. For each concept that needs coding practice, a mode where the student
codes along with a companion: hints as they go, tips at the right moment, and nudges of the
form _"do you really want to implement it that way? Going this route instead gives you
X, Y, Z."_ Distinct from the existing Coding Tasks page, which grades a finished answer —
this one talks to you _while_ you write it. Depends on 2.5 for the editor.

### 2.7 Thin tracks

Raised 2026-08-29 about a sibling project. **Not applicable to this repo** — the curriculum
here is Angular + TypeScript only (foundations, TypeScript, beginner, intermediate, expert,
projects) and has no Ruby/Java/PHP tracks. The equivalent check here is lesson _depth_,
which §1.1 already tracks.

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

- [COVERAGE-SWEEP.md](COVERAGE-SWEEP.md) — every coverage finding from §1.3, per lesson
- [CONTRIBUTING.md](CONTRIBUTING.md) — the depth standard and how to add lessons
- [ARCHITECTURE.md](ARCHITECTURE.md) — how the app is built
- [UI-DESIGN.md](UI-DESIGN.md) — design system, motion, accessibility
