# Backlog

**Version:** 1.5
**Last Updated:** 2026-09-12
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

**Batches 5–7 — 17 more lessons landed 2026-09-05, rollout now 54 of 100.** Batch 5 was a
single lesson, `zoneless`, manually verified after the rewrite agent produced complete,
well-formed work but errored at the final report-submission call — the same failure
pattern hit again in batch 6 (below) and once more in batch 7's coordinating session, so
treat it as a known, recoverable failure mode rather than a reason to distrust the work:
verify by hand (`tsc --noEmit`, `prettier --check`, a headless load, `audit-retention.mjs`)
rather than re-running the agent. Batch 6: `deferrable-views`, `typescript/classes`,
`animations`, `pwa-service-worker`, `view-transitions`, `beginner/two-way-binding`,
`beginner/property-binding`, `expert/rxjs-advanced`, plus `ts-decorators` migrated outside
the 1–8 numbering (same failed-report-call pattern, landed at 8/9 on manual verification).
Batch 7: `expert/control-value-accessor`, `beginner/event-binding`, `expert/onpush`,
`beginner/let-block`, `expert/dynamic-components`, `typescript/decorators`,
`intermediate/http-crud`, `intermediate/form-arrays` — run by a second, concurrent session
that also verified every lesson individually (`prettier`, `tsc --noEmit`,
`audit-retention.mjs` to 9/9, a polled `ng build`) before committing each one.
**`typescript/decorators` is the same file as batch 6's `ts-decorators`** — a second,
unrelated session picked it as worst-scoring because this section hadn't been updated to
reflect batch 6 yet (see the trap below). Its batch-7 pass fully superseded the batch-6
one and reached 9/9, so nothing needs redoing, but batch 7 therefore added 7 _new_ lessons,
not 8. Net new since the 37-of-100 count above: 10 (batches 5–6) + 7 (batch 7) = 17.

**Batch 8 — 8 more lessons landed 2026-09-06, rollout now 62 of 100.** Cleared the entire
4/9 band and the two smallest of the 5/9 band: `intermediate/async-validators`,
`intermediate/route-guards`, `intermediate/testing-components`, `typescript/interfaces`,
`beginner/template-forms`, `intermediate/reactive-forms`, `beginner/interpolation`,
`foundations/terminal-and-npm`. Run as 8 parallel fresh agents, each scoped to touch only
its own lesson folder; the coordinating session independently verified every one before
committing it individually (`prettier --check`, `tsc --noEmit`, `audit-retention.mjs` to
9/9, greps for the raw-`{`/raw-`@`/accessible-name traps) plus one full `npm run test:ci`
and one production `ng build` at the end of the batch — not per lesson, to avoid running
eight builds/test-suites concurrently. All 8 landed at 9/9 with no rewrites needed.

One real regression surfaced only in the full-suite run, not in per-lesson checks: **the
a11y WCAG scan timeout (`src/app/a11y.spec.ts`, `SCAN_TIMEOUT_MS`) had to be raised from
30s to 60s.** `intermediate/testing-components` is now the densest lesson in the curriculum
(16 `<app-code-lab>` blocks) and ran ~21s in isolation — comfortably under 30s alone, but
tipped past it under the memory/GC pressure of mounting and destroying ~120 other lesson
components earlier in the same suite run. This is the same constant that was already raised
once before, from a 5s default, for `/interview`. Content density is legitimate here (bar 1
depth), so the fix was the timeout, not trimming the lesson.

**Batch 9 — 8 more lessons landed 2026-09-06, rollout now 70 of 100.** `expert/ssr`,
`foundations/programming-basics`, `foundations/how-the-web-works`, `foundations/git-basics`,
`expert/ngmodules-migration`, `beginner/what-is-angular`, `beginner/cli-project-structure`,
`expert/a11y`. Verified the same way as batch 8: `prettier --check`, `tsc --noEmit`,
`audit-retention.mjs` to 9/9 per lesson, one full `npm run test:ci` and one production
`ng build` at the end. `expert/a11y` needed a second visual beyond its existing 2×2
"painted on screen" × "in the accessibility tree" table — the audit's **Visual** check
(diagram/SVG/`app-layers`/`app-flow`) and **Table** check are scored independently, so a
lesson can satisfy Table without Visual. Added an inline SVG showing what the table
can't: `aria-hidden` is inherited, so a perfectly accessible button nested inside a hidden
ancestor is pruned along with it. If a lesson's presentation pass leaves it short only on
Visual with a comparison table already in place, this is the pattern — a second, genuinely
different visual, not a rename of the table's class to game the regex.

One real regression, caught only by the full-suite run: `ngmodules-migration.html` uses
`<app-napkin>` but batch 9's commit for that lesson never added `Napkin` to its `.ts`
imports (NG8001), while `cli-project-structure.ts` imported `Napkin` but never used it
(NG8113) — a copy-paste mixup between the two lessons' commits. Fixed in a standalone
commit before the a11y commit. Per-lesson `tsc --noEmit` didn't catch it because template
diagnostics like NG8001 only surface during the full Angular compiler build `ng test`/
`ng build` runs, not from `tsc` alone — worth remembering for the next batch's
verification pass.

**Batch 10 — 8 more lessons landed 2026-09-06, rollout now 78 of 100.** Cleared the rest of
the sub-9/9 band: `expert/state-management` (5/9), `intermediate/resolvers` (5/9),
`foundations/async-basics` (6/9), `intermediate/view-encapsulation` (7/9),
`beginner/outputs`, `beginner/components` (8/9 each, missing Table), `beginner/inputs`
(8/9, missing Visual), `intermediate/signals-advanced` (already 9/9, presentation-only).
Verified the same way as batches 8–9: `prettier --check`, `tsc --noEmit`,
`audit-retention.mjs` to 9/9 per lesson, one full `npm run test:ci` and one production
`ng build` at the end. `state-management`'s five annotated code samples (`storeSample`,
`persistSample`, `ngrxSignalsSample`, `ngrxClassicSample`, `asyncSample`) had every
`CodeNote` line number manually cross-checked against the actual sample string, not just
trusted from the agent's report. `resolvers` surfaced a real-looking missing `first`
import, but it was inside a code-sample **string literal** shown as a demo, not the
lesson's own actual imports (which were already correct) — worth the double-take before
"fixing" a sample that was never broken.

One cosmetic fix: `view-encapsulation`'s `<app-chapter number="11">` didn't match its
track's convention (`grep -n 'number="' src/app/lessons/intermediate/*/*.html` shows
small per-track-local numbers, 1–4) or its own `stops` rail, where View Encapsulation is
the 4th stop — corrected to `number="4"`.

One cross-cutting fix, caught only by the full-suite run, not per-lesson checks: **the
lesson smoke-test timeout (`src/app/lessons/lessons.smoke.spec.ts`) had to be raised from
vitest's 5000ms default to 20000ms.** Three different, unrelated lessons
(`testing-components`, `security`, `libraries-schematics`) each tipped past 5s in
different runs of the full suite, never the same lesson twice — cumulative GC/memory
pressure from mounting and destroying ~100 increasingly dense lessons in one spec file,
not any one lesson being slow in isolation. Exactly the same shape as the a11y
`SCAN_TIMEOUT_MS` fix in batch 8: the fix is headroom, not trimming content. Expect this
class of timeout to need raising again as density keeps growing.

**Batch 11 — 8 more lessons landed 2026-09-06, rollout now 86 of 100.** All already 9/9,
presentation-only: `beginner/lifecycle`, `beginner/class-style-binding`,
`intermediate/rxjs-interop`, `intermediate/form-validation`, `beginner/control-flow-for`,
`beginner/workspace-config`, `beginner/routing-basics`, `beginner/http-basics`. Run as 8
parallel fresh agents; verified the same way as batches 8–10 — `prettier --check`,
`tsc --noEmit`, `audit-retention.mjs` to 9/9, and every `CodeNote` line number manually
recounted against its exact sample string, not trusted from the agent's report.

Two path corrections worth recording: `routing-basics` and `http-basics` both live under
`beginner/`, not `intermediate/` — the coordinating session's own batch prompt guessed the
wrong tier for both, and both agents caught it themselves via `curriculum.ts` before doing
any work. If a lesson's assigned path 404s, check `curriculum.ts` for its real one rather
than assuming the backlog list is wrong about the lesson itself.

One real bug found by independent verification, not tooling: `form-validation`'s
`customValidatorNotes` had a note anchored to line 9 (a plain comment) describing the
`hasDigit()` call that actually sits on line 10. Caught by manually recounting the sample
string line-by-line, exactly the discipline that has now caught a real bug in three of the
last four batches — keep doing it, it is not theatre.

One more real regression, caught only by a real `ng build` (not `tsc --noEmit`, which
cannot see template diagnostics): `lifecycle.html` used `<app-napkin>` but the lesson's own
commit never added `Napkin` to its `.ts` imports (NG8001) — the same class of miss as the
`ngmodules-migration`/`Napkin` bug in batch 9. Two concurrently-running batch-11 agents,
each building their own unrelated lesson, independently noticed the resulting build failure
and flagged it — a small win of running full builds inside agent verification even when
their own lesson isn't the culprit. Fixed in a standalone commit before continuing.

**Batch 12 — 8 more lessons landed 2026-09-06, rollout now 94 of 100.** All already 9/9,
presentation-only: `intermediate/rxjs-operators`, `typescript/keyof-typeof`,
`typescript/modules`, `intermediate/structural-directives`,
`intermediate/ng-template-outlet`, `beginner/builtin-directives`,
`intermediate/route-params`, `intermediate/content-projection`. Run as 8 parallel fresh
agents; verified the same way as batches 8–11 — `prettier --check`, `tsc --noEmit`,
`audit-retention.mjs` to 9/9, and every `CodeNote` line number manually recounted against
its exact sample string. This was the cleanest batch yet: no bugs found in any of the 8
lessons' pre-existing content or in any agent's CodeNote line numbers — a genuine result,
not a skipped check, but keep recounting anyway; it has caught a real bug in 3 of the last
5 batches and there is no way to tell which batch is next without doing it.

Load-bearing pre-existing content was preserved rather than rewritten, per the batch
prompts: `route-params`' live URL-dissector demo (path/matrix/query/fragment parsing,
including the `getAll` vs `get` repeated-query-key trap) came through byte-identical;
`rxjs-operators`' four-receptionists analogy, `builtin-directives`' NG8103 correction, and
`modules`' static-vs-dynamic-`import()` `Compare` were all kept and rehoused rather than
reinvented.

The session hit an API rate limit right before this batch's first launch attempt (all 8
agents failed immediately, `HTTP 429`, reset time given as a specific clock time) — it
cleared on its own once that time passed, and a straight relaunch of all 8 with the same
prompts worked with no other change needed. Separately, this batch's coordinating session
saw the full test suite and a bare `ng build` both exit 0 with truncated/missing output on
the first attempt, then pass cleanly with full output on an immediate retry — matching the
project's already-documented environment segfault flakiness (see the ng-build/test
segfault memory), not a real regression; one of the 8 agents independently confirmed the
same flakiness exists on a clean `master` with no lesson changes at all, and that `npm ci`
(which also repaired a corrupted cached esbuild/rollup tarball) reliably clears it.

**Batch 13 — the final 6 lessons landed 2026-09-06, rollout now 100 of 100. Lesson rollout
complete.** `foundations/json-and-apis`, `intermediate/attribute-directives`,
`intermediate/testing-services-http`, `projects/data-dashboard`, `projects/task-manager`,
`projects/auth-flow` — the last three `projects/`-tier, full interactive builds (a JSON/API
explorer, a Kanban board, a JWT login flow, a sales dashboard) rather than single-concept
lessons. Run as 6 parallel fresh agents; verified the same way as every batch since 8 —
`prettier --check` (`task-manager.html` excluded per its `.prettierignore` entry — see
`CONTRIBUTING.md` §8), `tsc --noEmit`, `audit-retention.mjs` to 9/9, and every `CodeNote`
line number manually recounted against its exact sample string using `awk`-numbered ground
truth rather than eyeballing tool output — visually parsing dense code blocks by eye proved
unreliable partway through this batch and produced one false positive that a second,
programmatic count corrected.

Off-by-one `CodeNote` bugs survived the agents' own drafts and were caught only by this
manual recount: `intermediate/attribute-directives`' `badgeNotes` had the `.update()` note
tagged line 22 instead of 21, and the `#b="appBadge"` note tagged line 27 instead of 26; its
`tooltipNotes` had the `if (this.tip)` guard note tagged line 26 instead of 25;
`projects/data-dashboard`'s `writersNotes` had the `setSort()` page-reset note tagged line
12 instead of 13. All four fixed in place before committing. Every other `CodeNote` across
all 6 lessons' ~45 annotated samples checked out exactly. This continues the pattern from
every prior batch's manual pass: real bugs keep surviving agents' own verification, so the
recount is load-bearing, not a formality.

Each agent also self-caught real content bugs in its own first draft before handing off,
independently confirmed correct once fixed: `testing-services-http`'s `coldOptions` quiz
distractor originally claimed `provideHttpClient()`/`provideHttpClientTesting()` order
doesn't matter, contradicting the lesson's own code — corrected to say Angular resolves the
last provider for a token, so order does matter; `task-manager` had 8 instances of
unsupported single-`*asterisk*` emphasis (the shared `RichText` renderer only supports
backtick spans and `**bold**`) across both new and pre-existing Faq/Quiz/Flow copy;
`auth-flow` self-caught and fixed 6 off-by-line-number `CodeNote` bugs in its own first
draft, and its live demo form correctly binds `email`/`password` signals through
`[ngModel]`/`(ngModelChange)` rather than `[(ngModel)]`, since a signal isn't a plain
settable property — worth a second look if that wiring is ever touched again;
`attribute-directives` fixed a dead unused `ElementRef`/`Renderer2` injection in
`BadgeDirective`, a broken "Next" link that skipped the now-existing `structural-directives`
lesson, and a redundant `.t` CSS class per `brain-friendly.css`'s own guidance that a
migrated lesson can delete its table CSS entirely.

Full `npm run test:ci` (469/469, all 23 spec files) and a production `ng build` both passed
clean at the end of this batch, confirming all 6 lessons are mutually compatible and the
rollout is genuinely finished, not just individually verified.

**Non-lesson pages — 15 of 15 done as of 2026-09-07.** The theme flip above fixed
colour/type consistency for free; it does not fix a page's own hard-coded colours or give
it the warmth/motion a migrated lesson has. All fifteen are now restyled — a colour audit
onto tokens, motion, and (where it genuinely fits, e.g. Home's hero stats) reuse of a
presentation component, while preserving every existing feature exactly. `home`,
`certification`, `practice`, `mock-exam`, `review` landed on master 2026-09-03/04;
the other ten (`progress`, `coding-tasks`, `api-playground`, `exam-day`,
`flashcards`, `interview`, `glossary`, `bookmarks`, `coming-soon`, `not-found`)
landed 2026-09-05 on the `claude/brain-friendly-redesign-m21bo1` branch and reached
master in the 2026-09-07 merge described below. These are NOT lessons: no Chapter/CodeLab/Quiz/Predict/Faq,
no `.lesson.bf` wrapper — forcing lesson-shaped teaching devices onto a dashboard or a
practice engine would be decoration without information. Three independent restyle passes
converged on the same real gap: `.bf-btn`/`.key`/`.term`/`.bf-break` in
`src/brain-friendly.css` are still scoped under `.lesson.bf` (and `.key`/`.term` have a
second, `.lesson`-scoped rule in `styles.css`) despite being usable-sounding — they render
unstyled on a non-lesson page. Hand-roll from the raw tokens instead, as all three did.

**2026-09-07 — branch merged, §1.1 and §1.2 both closed.** The
`claude/brain-friendly-redesign-m21bo1` branch had diverged from master on 2026-09-04.
Master went on to finish the lesson rollout (batches 7–13); the branch finished the ten
non-lesson pages, added `.good`/`.bad` as aliases of `.right`/`.wrong` in
`styles.css` (seven shipped lessons still use the old names), and fixed a real WCAG AA
failure app-wide — the base `button` rule painted white on `--accent`, 3.03:1 in the
dark scheme; it now paints `--bg` on `--accent-solid` (`brain-friendly.css` §3 has the
numbers). The merge took master's versions of the eight lessons both sides had rewritten
(`property-binding`, `two-way-binding`, `animations`, `deferrable-views`,
`pwa-service-worker`, `view-transitions`, `typescript/classes`,
`typescript/decorators`) because master's batch-7..13 passes were the later ones;
everything else merged clean. `npm run verify` passed afterwards (469/469, production
build) — but only after three batch-12 lessons (`content-projection`,
`structural-directives`, `keyof-typeof`) were run through Prettier: they had been
committed unformatted and master's `format:check` step had been failing on them.

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
- **Log a landed batch here immediately, not at the next session boundary.** Two
  concurrent sessions both independently picked `ts-decorators`/`typescript/decorators` as
  a worst-scoring lesson on 2026-09-05, because this section still said "37 of 100" while
  batches 5–6 (which already included it) were committed but not yet recorded here. The
  second pass fully overwrote the first; both reached the brain-friendly bar so no harm
  was done, but it was a wasted full rewrite. If two batches can run concurrently, this
  file is the shared source of truth for what is already spoken for — keep it current.

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

**Theme 2 progress (2026-09-08).** The three "concept with no lesson" gaps that the batch
rewrites had not already absorbed are now real lessons, written against the full 9/9 +
brain-friendly bar from the first line (no stub phase reached master unwritten for more than
a day — the 2026-09-07 scaffold commit existed only so routes and smoke tests could be wired
while the lessons were drafted in parallel):

| Lesson            | Route            | Owns                                                                                                                                     |
| ----------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Signal Forms      | `/signal-forms`  | `form()` over a signal model, schema rules, `[formField]`, field state as signals, `submit()` with server-error mapping                  |
| Navigation Events | `/router-events` | the ordered event stream, the three terminal outcomes + `NavigationSkipped`, the un-stickable progress bar, `withNavigationErrorHandler` |
| httpResource()    | `/http-resource` | URL-as-computation, `undefined` = idle, `parse`, `defaultValue`, `HttpErrorResponse` in `error()`, GET-shaped by design                  |

Curriculum is **103 lessons**. The sibling lessons' chapter rails (`stops`) were extended so
the new pages appear in the Forms, Routing and HTTP tracks' "you are here" strips. The other
theme-2 names — `linkedSignal`, `EnvironmentProviders`/`provideX`, `httpResource` inside
`resource-api` — were already absorbed by the §1.2 rewrites, so theme 2 is **closed**. Themes
1, 3 and 4 remain as described above.

**Trap logged:** a field-initializer `httpResource()` (or anything else that opens a
`PendingTasks` entry on mount) hangs `lessons.smoke.spec.ts`, because the suite mounts with
`provideHttpClientTesting()` and awaits `whenStable()` with nothing flushing the request. The
`http-resource` lesson's live demo starts with a URL factory that returns `undefined` (idle)
until the reader clicks — which is also the lesson's own teaching device for the idle state.

**Theme 1 progress (2026-09-11) — closed.** Worked the full "96 findings, 66 lessons" failure-mode
list from [COVERAGE-SWEEP.md](COVERAGE-SWEEP.md) via ~14 parallel forks batched by tier, each told
to re-verify a finding against the live lesson before writing anything rather than trust the
document blindly. That caution paid off immediately: the very first batch (foundations) reported
back that all 4 of its assigned lessons were **already fully covered** by an earlier, undocumented
rewrite pass that COVERAGE-SWEEP.md had never been updated to reflect. Direct verification (grep
each flagged lesson for the finding's own key terms, not just its coverage-sweep tag) turned up
**19 lessons total** already done pre-session with zero edits needed: foundations
(`debugging-basics`, `decisions-loops`, `dom-and-events`, `functions-basics`), beginner
(`control-flow-if`, `services-di`), typescript (`async`, `mapped-conditional`, `types`,
`utility-types`), intermediate (`custom-pipes`, `http-interceptors`, `resource-api`,
`router-children-lazy`, `view-queries`), and expert (`di-advanced`, `libraries-schematics`,
`i18n`, `security`, `zoneless`). The remaining **46 lessons** got real new failure-mode sections —
one live demo or wrong-way/right-way pair per finding, added into the lesson's existing flow, no
restyling — spanning every tier: foundations (5), typescript (3, including a new
`typescript/modules` CommonJS-interop section that had zero prior coverage), beginner (15),
intermediate (11), expert (9), and projects (3, all of `auth-flow`/`data-dashboard`/
`task-manager`). A handful of COVERAGE-SWEEP.md's own findings were skipped as out-of-scope for
this pass because they were tagged `sub-concept`/`thin-example`, not `failure-mode` — themes 3 and
4 (or a future dedicated pass) are the right place for those, not this one. Full `npm run verify`
gate (format, typecheck, tests, build) passed clean on the complete result. **Lesson for next time
a coverage-style document drives a large batch pass: treat it as a hypothesis to verify per lesson,
not a checklist to execute — it had been silently stale in over a quarter of its own entries.**

One genuine gap survived that batch: the foundations fork explicitly skipped
`foundations/terminal-and-npm`'s "Node version mismatch" finding for scope/budget reasons. Closed
it on 2026-09-12 — a third demo card next to the lesson's existing port-in-use/'ng' not recognized
pair, showing the CLI's own minimum-Node-version error and the three-part fix (the package.json
`"engines"` field, a Node version manager, and why "just install the newest Node" is wrong because
odd-numbered majors aren't LTS), tied back to the caret-range semver section earlier in the same
lesson. Verify gate re-run clean. **Theme 1 is now fully closed — all 96 findings, zero gaps.**

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

**Shipped 2026-09-12 — panel open/close, list add/remove, toast entry/exit.** All CSS,
all `transform`/`opacity`, all collapsed to 0.01ms under `prefers-reduced-motion`:

- **`animate.enter` / `animate.leave`** (Angular 21's native replacement for the
  deprecated package — the `animations` lesson teaches it, so the app now practises it)
  on toasts (`toast-in`/`toast-out`), the Predict reveal and CodeLab output
  (`reveal-in`), and row removal on Bookmarks and the task-manager board (`row-out`,
  with `row-in` on the board's cards so a column move animates). Keyframes live in
  `styles.css` next to `fade-in`.
- **Accordion open/close.** `<details class="faq__item">` animates its height via
  `::details-content` + `interpolate-size: allow-keywords` on `:root`. Browsers without
  `::details-content` keep the instant open.
- **Route transitions keep the chrome still.** `view-transition-name: topbar` / `footer`
  pin the header and footer out of the root cross-fade, so only the page body moves.

Still to do here: shared-element route transitions (§3.1).

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

**Shipped 2026-09-12 — all three remaining items closed.**

- **`html` and `css` modes.** `highlight(code, 'html')` is a second, two-state scanner
  (`highlightMarkup`) rather than another `LangConfig`: it colours tag names
  (`.hl-tag`), plain attributes (`.hl-attr`) and Angular binding syntax (`.hl-bind` —
  `[prop]`, `(event)`, `*ngIf`, `#ref`, louder on purpose), hands binding values and
  `{{ }}` to the TypeScript scanner, and knows `@if/@for/@let` blocks and `<!-- -->`.
  `css` is a `LangConfig` with `--vars` as `.hl-var`. Three new token classes in
  `styles.css`, with Darcula overrides (plus the previously missing `.hl-flag/.hl-var/
.hl-key` ones) in `brain-friendly.css`. `CheatLang` widened to match.
- **Template islands.** ~78 samples show a class _and_ its template in one string.
  Neither scanner alone is right, so in `ts`/`css` mode a line that _starts_ with a tag,
  `<!--`, `{{` or a template block is handed to the markup scanner up to the line the
  construct closes on, and the TypeScript scanner resumes after. Mid-line `<` stays an
  operator, generics stay types, `@Component` stays a decorator. Those samples keep
  `ts` — no third mode, no per-block tagging.
- **Explicit language everywhere.** `CodeLab` gained `hlLang` (default `'auto'`, inferred
  from the `file` label — `.html`, `.css`, `.json`, `terminal —`, `console —` — via the
  exported `langFromFilename`); `Predict` gained `hlLang`. (Not `lang` — that is the global attribute for the content's natural language, and axe's `valid-lang` rule failed 23 lessons the first time round.) 105 blocks across 52 templates
  were tagged in one sweep: `data-lang` on plain `<pre>{{ … }}</pre>`, `hlLang` on
  ~20 Predicts and 14 CodeLabs, and the API playground's request/response panels now
  tokenise as JSON (keys bold, not identifiers).
- **`HighlightCode` directive** (`pre[hlCode]`, `hlLang`) for code inside `.demo` and
  anything revealed late. It owns the element's `innerHTML` so it cannot clobber a live
  binding the way the sweep did (two demos had been frozen by that — see its file
  header), re-highlights whenever the source or language changes, and stamps `data-hl`
  so the navigation sweep in `app.ts` leaves it alone. Thirteen demo blocks converted.

What is left is small: the navigation sweep is still the mechanism for static `<pre>`s
(fine — they never change), and `bash`/`java`/`python` samples do not get islands
(nothing in the curriculum needs them).

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

**Decided and in progress (2026-09-13): CodeMirror 6.** `src/app/shared/editor/` has
`CodeEditor` (a `<textarea>` that upgrades to CodeMirror via a lazy `import()`, so a reader
who never opens an editor pays nothing for it and one who does gets `.hl-*` colouring
shared with the static highlighter — see `cm-setup.ts`), `CodeRunner` + `runner/harness.ts`
(TypeScript/JavaScript run in a sandboxed Web Worker, console captured and replayed), and
`HtmlPreview` (a sandboxed `srcdoc` iframe for markup). All four have full coverage —
`editor.spec.ts` and `cm-setup.spec.ts` (the latter against a real `EditorView`, since
Angular's unit-test runner rejects `vi.mock` on relative imports; `CodeEditor` is instead
tested through a `CM_MODULE` injection token, the same DI seam `CodeRunner` already gave
`Worker` as `WORKER_FACTORY`). **Not yet wired into any page** — that's the next step, and
the practice/project/challenge pages this was requested for are where it belongs first.

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

### 2.8 Documentation pass — every file, every member, and the map

**Requested 2026-09-07, with an explicit sequencing rule: this runs _after_ whatever
features and enhancements remain, not interleaved with them.** A documentation pass over
code that is still moving has to be redone, so it goes last. The ask, in the author's
words: make sure all the methods/variables — everything — are documented in comments in
the code, plus an overall concise doc for the app; each file explained thoroughly, how it
relates to other files in the project, and how it relates to the project overall.

**What is still ahead of it** (the "features/enhancements that remain", as of the day it
was filed — §1.1 and §1.2 are closed):

- §1.3 theme 2 — the Angular 21 surface (`httpResource`, Signal Forms, `linkedSignal`,
  `router.events`, `EnvironmentProviders`) is the time-sensitive one. Theme 1 (failure
  modes) was meant to fold into the §1.2 rewrites, which are now finished, so it is its
  own pass. Themes 3 and 4 are scope decisions for the author.
- §2.1 — panel/accordion open-close, list add/remove, richer route transitions.
- §2.2 items 1, 2, 4, 5 — largely absorbed by the brain-friendly rollout; verify each
  against a migrated lesson and close the ones that hold.
- §2.4 — the highlighter's `MutationObserver` sweep, an HTML/template mode, explicit
  `lang`.
- §2.5 / §2.6 — the live editor and "code with me"; author decisions, not backlog grind.

**Where it stands** (measured 2026-09-07 with `node scripts/audit-docs.mjs`, which is the
standing measure for this item the way `audit-retention.mjs` is for §1.1). The
2026-08-28 JSDoc sweep (§4) covered _declarations_, not _files_:

| what                                                    | total | documented | missing |
| ------------------------------------------------------- | ----: | ---------: | ------: |
| classes, interfaces, functions, enums, accessors        |   407 |        407 |       0 |
| class properties                                        | 3,141 |      3,108 |      33 |
| class methods                                           |   542 |        525 |      17 |
| top-level `const`s                                      |   136 |         92 |      44 |
| type aliases                                            |    56 |         55 |       1 |
| interface members                                       |   426 |        178 |     248 |
| **files with a top-of-file "what this file is" header** |   252 |     **19** | **233** |

So the member-level gap is small — 343 declarations, three-quarters of them interface
fields in data models (`cheat-sheet.model.ts`, `lesson.model.ts`) and quiz/demo option
shapes inside lessons — and the real gap is the one the author named: a per-file header
that says what the file is for, what it depends on, what depends on it, and where it sits
in the app. Every class has JSDoc, but it describes the component, not the file's place in
the project.

**Scope — three deliverables:**

1. **Every `.ts` file gets a header block above its imports.** Purpose in one or two
   sentences; _uses_ — what it imports and why; _used by_ — what imports it (the route
   table, a barrel, a parent lesson); _place in the app_ — which layer of ARCHITECTURE.md
   §1 it belongs to. Spec files included: say which behaviour the spec guards. `.html` /
   `.css` files get a one-line comment header only where the file is not obvious from its
   `.ts` sibling (shared components, `styles.css`, `brain-friendly.css`, `fonts.css`).
2. **Every remaining member gets a JSDoc line** — the 343 above, to zero. Interface members
   carry the unit, shape, or reason, not a restatement of the name. Same rule as §2.3: a
   comment must say something the code does not; `/** The title. */` on `title` is worse
   than nothing.
3. **One concise map, `docs/FILE-MAP.md`.** Every directory and every non-lesson file, one
   line each — purpose plus nearest relationships — and one line per lesson folder, since
   all lessons share one shape that is documented once at the top. ARCHITECTURE.md §3 is
   the seed but is already stale (no `shared/brain/`, no `scripts/`, `aws/`, `.github/`,
   `public/fonts/`); fix it there and have the map link into it rather than duplicate the
   prose. Cross-link every file header's _place in the app_ line to the same section names
   so the two stay in lockstep.

**Gate.** `node scripts/audit-docs.mjs` reports 0 undocumented members and 0 files without
a header; CONTRIBUTING.md gains a short "documenting a file" section with the header shape
so new files follow it; the audit joins `npm run verify` if it stays fast (it is ~1s now).

**Order of work when it starts.** `core/` and `shared/` first — they are the most
imported, so their headers anchor everyone else's _used by_ lines — then `pages/`, then
`app.*`, `main.ts` and the styles, then lessons. Lessons are ~200 of the 252 files but
the most uniform: a template header plus the lesson-specific sentence is most of the work,
and it can run as parallel per-track agents the way the §1.2 batches did — with the same
lesson learned there: verify each batch by re-running the audit, not by trusting the
agent's report.

### 2.9 User accounts, cloud-synced progress, and account security

Requested 2026-09-12. Right now every piece of user state — visited lessons, bookmarks,
streak, practice history, review queue, mock-exam history, coding-task submissions — lives
in `localStorage` only, which means progress is per-browser, per-device, and gone the
moment site data is cleared. The ask: real user accounts (register/sign-in) so progress
follows the learner across devices, a standard profile/settings page, and modern
account-security options — MFA/2FA and passkeys, not just a password.

**Scope, as requested:**

- Register / sign in (account creation + authentication).
- Server-side persistence of the state that today lives only in `localStorage` — progress,
  bookmarks, streak, practice/mock-exam/review history, coding-task submissions — keyed to
  the account.
- A standard profile/settings page.
- MFA/2FA.
- Passkeys (WebAuthn).

**This needs a real backend for the first time in this repo's life.** Everything shipped so
far is a fully static, zero-dependency Angular app — the README's own "zero third-party UI
or state library" claim, and both live deployments (GitHub Pages, a static build; Render, a
Dockerized nginx container — see DEPLOYMENT.md) assume no server at all. When this is
picked up, the machine-wide `scaffold-spring-backend` recipe/skill is the standing pattern
for this exact shape of work: Spring Boot + JDBC (not JPA) + stateless JWT, with
register/login/profile already in its template. Passkeys and MFA are extensions on top of
that base, not something the template covers out of the box — they need their own design
pass (WebAuthn library choice, TOTP vs. another 2FA factor, recovery-code flow) before
implementation starts.

**Not scoped yet, and worth deciding before implementation starts:**

- Where the backend/database actually runs. Both current deployments are static-content-only
  hosts; a real backend needs its own always-on host plus a real database, a materially
  bigger and costlier commitment than either.
- Whether existing `localStorage` progress should be _migrated_ into an account on first
  sign-in, or whether accounts start fresh — a UX decision, not just a technical one.
- Social/OAuth sign-in (Google, GitHub) — not requested, but a common companion to
  "sign in/register," worth asking about explicitly rather than assuming either way.

This is easily the largest scope expansion since the app's initial build. Treat it as its
own project phase — its own SRS/ARCHITECTURE updates, per this machine's Documentation
Standards — not a quick item folded into an existing pass, and not something to start before
§1.3 theme 2, §2.1–§2.7 and §2.8 above are actually done, per the same "finish what's
already open before starting the next big thing" rule §2.8 itself was filed under.

### 2.10 Page shapes — vary the Head First format per lesson

**Requested 2026-09-13.** The author's words: _"right now it's all the same boring setup. Title,
then what looks to be a text message conversation, and so on. I was thinking a VARIETY of the
styles that are used in Head First Design Patterns, not just each page uses a piece of the
variety and shoves it all on the same page."_ Deferred behind §2.5/§2.6 at the author's
request the same day; the editor comes first.

**The audit that confirms it** (device order of all 103 brain-friendly lessons, 2026-09-13):

| Pattern                                            | Lessons    |
| -------------------------------------------------- | ---------- |
| Open with Chapter → Napkin                         | 88 of 103  |
| Open with Chapter → Napkin → Remember              | 63 of 103  |
| Close with a FAQ                                   | 103 of 103 |
| Contain CodeLab, Predict, Quiz, FAQ _and_ Remember | 103 of 103 |
| Contain the Bubbles conversation                   | 91 of 103  |

Every lesson is the same frame with the same full deck shuffled in the middle. Head First
does the opposite: each chapter picks a different _dominant_ format and a different subset,
so the variety is between chapters, not inside each page.

**The plan, in the order it should be built:**

1. **New formats we do not have** (a third shared set, own barrel, each with tests):
   Fireside Chat (two concepts argue, a moderator closes — a different shape from Bubbles),
   Exposed (an interview with the API), Master and Student (a koan), Sharpen Your Pencil
   (write-in blanks, reveal later), Code Magnets (drag scrambled fragments into order — the
   editor from §2.5 can host this), Who Does What (matching), Be the Compiler (trace the code
   by hand), Watch It (hazard-striped warning), Toolbox (cumulative per track), Brain Power (a
   question deliberately left open), Meanwhile (a running storyline with a recurring cast),
   and a Crossword at chapter end. "Code with me" from §2.6 is a Workshop-format device too.
2. **Lesson archetypes instead of one recipe** — Story, Investigation, Debate, Workshop,
   Interview, Field Guide, Puzzle. Each names its opening device, its dominant device, a cap of
   about five devices, and what it must _not_ use. A `shape` field on the `Lesson` model
   records the choice; adjacent lessons in a track never share one.
3. **CONTRIBUTING §2C** replacing "hit the nine points with these six components" with "hit
   them through your archetype's devices", and `scripts/audit-variety.mjs` flagging any lesson
   whose opening pair or device set matches its neighbours — the successor to the retention
   audit, which this work must not regress (the nine-point bar stays; the devices vary).
4. **Pilot on the new lessons** from §1.3 themes 3 and 4 (HTML, CSS, origins & CORS, strings,
   deploying a SPA, SEO & metadata), one archetype each, so the formats are proven on pages
   with no rewrite cost.
5. **Then rotate the existing 103**, tier by tier, worst offenders (the 63 Chapter → Napkin →
   Remember openers) first.

**Reference check against a sibling project (2026-09-13).** The author pointed at four page
shapes from another project's standalone visualizer pages and asked whether this app already
has the same variety. It does not yet — none of the four exist here as a _whole-page, single-
dominant-device, no-cards_ shape, which is exactly the gap §2.10 was filed to close. Mapping
them onto the plan above:

- **Shape A — "There Are No Dumb Questions"** (a giant opening sentence, then a Q&A sidebar
  that carries the entire lesson; no cards, no dialogue). We already have `Faq`, but only ever
  as a closer (103 of 103 lessons) — never promoted to the page's spine. Not one of the seven
  named archetypes; needs its own, e.g. **Q&A-led**.
- **Shape B — "The Receipt"** (an itemised bill, then a brutal two-column contrast, then a
  pipeline chain, then arrows scribbled at code; ends loud). We already have `Compare` for the
  two-column part, but the itemised/pipeline/receipt framing around it doesn't exist. Not one
  of the seven named archetypes; needs its own, e.g. **Ledger**.
- **Shape C — "The Whiteboard"** (one big figure with hand-drawn arrows; prose serves the
  picture, not the other way round). We already have `Napkin`, but only ever as a supporting
  aside, never blown up to be the whole page. Closest to the planned **Field Guide** archetype
  but not identical — Field Guide was scoped around reference-lookup pages, not one dominant
  diagram; worth folding in or naming a **Diagram-led** archetype instead.
- **Shape D — "The Argument"** (8–10 bubbles between personified components, split by a
  moderator beat; no cards at all). This one we already planned for: `Bubbles` exists (used in
  91 of 103 lessons, though always alongside other devices, never alone) and **Brain Power**
  is already on the "formats we do not have" list above. Together they're the **Debate**
  archetype already named in step 2 — just not built as a standalone, cards-free page yet.

Net: 3 of 4 shapes need a new named archetype/device added to the lists above (Q&A-led,
Ledger, Diagram-led or a Field-Guide redefinition); the 4th (Debate) was already on the plan
and just needs building.

**Decided and started the same day, 2026-09-13.** The "editor first" deferral is superseded
at the author's request; §2.5's editor stays built-and-tested but unwired for now. Reading the
sibling pages themselves corrected the plan above in two places. **(a) A shape is the lesson's
opening block, not the whole page.** In Dev Hub it is a ~50–60-line block with a fixed frame —
handwritten deck → lead device → Brain Power or one quiz check → Post-it note — and the rest
of the page stays conventional. That is what makes it cheap enough to roll across 103 lessons:
the block replaces the Chapter → Napkin → Remember opener and everything after it keeps its
existing material. **(b) The §1.3 theme 3/4 lessons** that step 4 planned to pilot on do not
exist yet, so the pilots are existing lessons. What is being built: a third shared set,
`src/app/shared/shapes/` (own barrel, one spec), with six devices — `BrainPower`, `Scribble`
(the handwritten call-out that "points" by quoting a label), `NoDumbQuestions` (`Faq` promoted
to the spine, all open), `Receipt`, `Chain` and `Whiteboard` (the frame for one big figure,
lifting the `.dia-*` SVG stylesheet duplicated across ten lesson CSS files into global `.wb-*`
classes) — plus the `.bf-big` / `.bf-say` / `.bf-principle` / `.bf-answer` typographic classes;
`shape?: Shape` on the `Lesson` model (optional — `undefined` is the "not yet rotated" signal);
`scripts/audit-variety.mjs`; and CONTRIBUTING §2C, which is now the rule. **Pilots landed
2026-09-13, one per shape:** `view-encapsulation` (no-dumb-questions), `deferrable-views`
(receipt), `http-interceptors` (whiteboard), `rxjs-interop` (argument) — all four still 9/9 on
the retention audit, the variety audit green. Three things the pilots settled for everyone after
them: the "deck" is the Chapter's `hand` line, never a second handwritten subtitle (`.bf-deck`
was built and then removed); the paragraph that answers a Brain Power is the layer's
`.bf-answer`, not a per-lesson rule; text on a solid figure box is `.wb-text--on-solid`
(clay-ink — surface-on-clay fails contrast). The variety audit also now blanks attribute values
before scanning, so a scribble quoting `<app-chart />` is not counted as a device. One content
correction fell out of pilot A: the old view-encapsulation lesson said ShadowDom stops "fonts
and design tokens" — it does not; inherited values and custom properties cross a shadow root,
only outside _rules_ stop matching. The whole-page archetypes of step
2 and the other devices named in step 1 (Fireside Chat, Exposed, Master and Student, Sharpen
Your Pencil, Code Magnets, Who Does What, Be the Compiler, Watch It, Toolbox, Meanwhile,
Crossword) are deferred to a later pass; the `Shape` union only ever lists shapes whose device
set exists. Step 5 — rotating the other 99 — is the next piece of work once the pilots land.

**Batch 1 of step 5, landed 2026-09-16.** First rotation batch off the worst-offender list
(the Chapter → Napkin → Remember openers), eight lessons spread across six tracks
(`foundations`, `typescript`, `beginner` ×2, `intermediate` ×2, `expert`, `projects`) and
mixing all four shapes evenly so no track's neighbours repeat one:

| Lesson             | Track        | Shape               | The kind of gotcha                                                    |
| ------------------ | ------------ | ------------------- | --------------------------------------------------------------------- |
| `debugging-basics` | foundations  | `no-dumb-questions` | misconception (red text feels hostile; it's a fixed 3-part report)    |
| `ts-narrowing`     | typescript   | `argument`          | tension (a predicate and the compiler are both right; nobody lied)    |
| `lifecycle`        | beginner     | `whiteboard`        | structure (parent/child hooks interleave in two opposite directions)  |
| `http-basics`      | beginner     | `receipt`           | cost (one keystroke without cancellation = one wasted round trip)     |
| `rxjs-subjects`    | intermediate | `receipt`           | cost (three `next()` calls into a dead Subject, zero deliveries)      |
| `route-guards`     | intermediate | `whiteboard`        | structure (`canActivate` vs `canActivateChild` cascade, side by side) |
| `onpush`           | expert       | `argument`          | tension (the data changed; the reference didn't; both are correct)    |
| `data-dashboard`   | projects     | `no-dumb-questions` | misconception (one write ⇒ everyone recomputes — it doesn't)          |

`rxjs-subjects` got `receipt` rather than `argument` specifically because its curriculum
neighbour `rxjs-interop` already owns `argument` — picking shape by gotcha-kind still has to
yield to the adjacent-lessons-never-share-a-shape rule when both would otherwise fit.

Each rotation replaced only the opening block (CONTRIBUTING §2C) — the analogy, mnemonic and
dialogue devices those lessons already had were relocated into a "the mental model" section
immediately after the block rather than deleted, so no existing teaching content was lost, just
resequenced. Three lessons had a quiz/flow/code-lab already tightly coupled to a demo further
down the page (`cascadeQuizOptions` + `guardOrderFlow` in `route-guards`; `bridgeSample` +
`cancelOptions` in `http-basics`); those were moved up into the block and replaced downstream
with a callback line, rather than duplicated. `scripts/audit-variety.mjs` and
`scripts/audit-retention.mjs` are green for all eight (9/9 retention, unchanged from
pre-rotation — the shapes varied the devices, they did not touch the bar). Declared-shape
count: 4 (pilots) → 12, landing at an even 3 apiece. Remaining undeclared: 103 − 12 = **91**,
next up for batch 2.

**Batch 2 of step 5, landed 2026-09-16.** Second rotation batch off the same worst-offender
list, eight lessons across five tracks (`foundations`, `typescript`, `beginner` ×2,
`intermediate` ×2, `expert` ×2), keeping all four shapes exactly even:

| Lesson               | Track        | Shape               | The kind of gotcha                                                                                                                                           |
| -------------------- | ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `decisions-loops`    | foundations  | `argument`          | tension (`i++` and `splice` both keep their promise; the array renumbering mid-walk is what skips an element)                                                |
| `ts-nullish`         | typescript   | `whiteboard`        | structure (one missing link short-circuits the WHOLE rest of an optional chain, not just the next property)                                                  |
| `control-flow-for`   | beginner     | `argument`          | tension (`track $index` and Angular's node reuse both do exactly what they promise; a reordered row's half-typed input attaches to a stranger's data anyway) |
| `outputs`            | beginner     | `no-dumb-questions` | misconception (`.emit()` feels like it calls the parent's handler directly; the child never touches the parent at all)                                       |
| `di-providers`       | intermediate | `whiteboard`        | structure (a component's own `providers` array doesn't merge with root's — it silently forks a "singleton" into two live instances)                          |
| `custom-pipes`       | intermediate | `receipt`           | cost (forty change-detection checks on one unchanged price; a getter redoes the formatting work all forty times)                                             |
| `zoneless`           | expert       | `no-dumb-questions` | misconception (a plain-field write outside a signal "doesn't happen"; it happens in memory and nobody is ever told)                                          |
| `dynamic-components` | expert       | `receipt`           | cost (five toasts created via `createComponent()`; four never `destroy()`ed and quietly outlive the session)                                                 |

Same relocation discipline as batch 1: each rotation replaced only the opening block, and any
pre-existing device that was already tightly coupled to a demo further down the page got moved
into the block instead of duplicated, with a callback line left at its old spot —
`duplicateProviderQuiz` (+ a new `duplicateProviderSteps` flow) in `di-providers`,
`setTimeoutQuizOptions` in `zoneless`, and `quizOptions` in `dynamic-components`. `outputs`'
closing FAQ was also rewritten with four genuinely different doubts, since its old ones now
overlapped the new no-dumb-questions block almost verbatim. `scripts/audit-variety.mjs` is
green (20 declared shapes, 5/5/5/5, no forbidden device, no shared-shape neighbours) and
`scripts/audit-retention.mjs` still shows all 103 lessons at 9/9. Declared-shape count: 12 → 20.
Remaining undeclared: 103 − 20 = **83**, next up for batch 3.

**Batch 3 of step 5, landed 2026-09-18.** Third rotation batch, drawn from the
`node scripts/audit-variety.mjs` warning list (undeclared lessons whose opening pair literally
repeats the lesson before them — the worst of the worst offenders), eight lessons across four
tracks (`typescript`, `beginner` ×2, `intermediate` ×3, `expert` ×2), keeping all four shapes
exactly even:

| Lesson                  | Track        | Shape               | The kind of gotcha                                                                                                                                                          |
| ----------------------- | ------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ts-interfaces`         | typescript   | `no-dumb-questions` | misconception (nothing ever writes `implements User`; structural typing checks shape, never a declared name)                                                                |
| `signals`               | beginner     | `no-dumb-questions` | misconception ("doesn't Angular watch the field?" — reading a signal IS the subscription; nothing watches)                                                                  |
| `form-validation`       | intermediate | `argument`          | tension (a fresh required control really is `INVALID`, and the page genuinely shows nothing wrong — `touched` is the gate, and nobody but a template author ever writes it) |
| `builtin-directives`    | beginner     | `argument`          | tension (`*ngIf` and `*ngFor` each want the same one tag as their own stencil; nesting order is a choice, not a default Angular can guess)                                  |
| `hydration`             | expert       | `receipt`           | cost (a destructive bootstrap discards every server-rendered node — focus, scroll position, a mid-frame `<video>` — and pays to rebuild all of it)                          |
| `structural-directives` | intermediate | `receipt`           | cost (`[hidden]` leaves the whole component alive — subscriptions, timers, `ngOnDestroy` never called — behind invisible pixels)                                            |
| `view-transitions`      | expert       | `whiteboard`        | structure (two photographs and a curtain between them; only an element sharing a name tag in both morphs instead of cross-fading)                                           |
| `rxjs-operators`        | intermediate | `whiteboard`        | structure (four flattening operators, one figure — only `concatMap` makes a newer call wait behind an older one still running)                                              |

Same relocation discipline as batches 1–2: each rotation replaced only the opening block, and
any pre-existing device tightly coupled to a demo further down the page got moved into the block
instead of duplicated, with a callback line left at its old spot — `enableSample`/`enableNotes`
(the `provideClientHydration()` code-lab) in `hydration`, and the `choosing` decision-flow in
`rxjs-operators`. Two lessons had a `<app-predict>` that didn't fit the new block but was too
useful to lose: `view-transitions`' "forget one line, predict what breaks" predict moved into
its own "The trap, predicted" section, and `rxjs-operators`' "how many results should you
actually see" predict moved down to sit next to the live type-ahead demo it predicts, in both
cases immediately after the relocated mental-model section. `structural-directives`' "Live #1"
tip, which used to say "that answers the napkin question from the top of the page," was reworded
to point at the receipt instead, since the napkin it referenced no longer exists at the top.
`scripts/audit-variety.mjs` is green (28 declared shapes, 7/7/7/7, no forbidden device, no
shared-shape neighbours) and `scripts/audit-retention.mjs` still shows all 103 lessons at 9/9 —
every touched lesson gained new depth (fresh brain-power questions like the `Celsius`/
`Fahrenheit` primitive-aliasing gotcha in `ts-interfaces`, or the "does change detection still
walk a hidden component" question in `structural-directives`) rather than just reshuffling
existing prose. `npm run typecheck` is green. Declared-shape count: 20 → 28. Remaining
undeclared: 103 − 28 = **75**, next up for batch 4.

**Batch 4 of step 5, landed 2026-09-19.** Fourth rotation batch, seven lessons across three
tracks (`typescript` ×2, `intermediate` ×4, `expert` ×1) — one short of the usual eight, since
this was also the batch that recovered a prior session's work after a session-wide API rate
limit killed the agent mid-round, and the seven lessons it had already finished (content written,
verified clean, never committed) were the ones carried forward rather than padded out to a round
number for its own sake:

| Lesson                 | Track        | Shape               | The kind of gotcha                                                                                                                                                                 |
| ---------------------- | ------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `form-arrays`          | intermediate | `argument`          | tension (`patchValue()` silently skips indices that don't exist yet, `setValue()` throws on any length mismatch — neither ever resizes the array itself, and that's on the caller) |
| `route-params`         | intermediate | `whiteboard`        | structure (one URL carries four separate parameter mechanisms — path, matrix, query, fragment — and only the fragment never reaches the server at all)                             |
| `router-events`        | intermediate | `no-dumb-questions` | misconception (a loading bar wired to show on `NavigationStart` and hide on `NavigationEnd` never comes back down the first time a guard rejects the navigation)                   |
| `ng-template-outlet`   | intermediate | `whiteboard`        | structure (one `<ng-template>` pressed by three separate `[ngTemplateOutlet]` bindings produces three fully independent DOM trees, not one shared one)                             |
| `libraries-schematics` | expert       | `receipt`           | cost (what a generated library actually commits a team to shipping publicly forever, and how consumers get it onto their machines and keep it current)                             |
| `async`                | typescript   | `receipt`           | cost/mental model (a `Promise` is a claim ticket standing in for a value that isn't there yet, not the value itself)                                                               |
| `modules`              | typescript   | `no-dumb-questions` | misconception (nothing in one `.ts` file exists to any other file until an `import`/`export` keyword says otherwise — which rewrites what "collision" even means)                  |

Recovery, not a rewrite: rather than trust the interrupted session's own hand-off, re-read every
one of the seven lessons' opening blocks in full against `docs/CONTRIBUTING.md` §2C's shape
contracts before touching anything further — all seven were genuinely complete and internally
consistent (the declared shape's device sequence present, nothing forbidden, content specific to
that lesson rather than reshuffled boilerplate), so the only remaining work was `curriculum.ts`'s
seven `shape:` fields (already present and correct) plus full verification, not authoring.
`scripts/audit-variety.mjs` is green (35 declared shapes: `argument` 8, `no-dumb-questions` 9,
`receipt` 9, `whiteboard` 9 — no forbidden device, no shared-shape neighbours) and
`scripts/audit-retention.mjs` still shows all 103 lessons at 9/9. `npm run format:check` and
`npm run typecheck` are both green across the full repo, and `npx ng build` succeeds.

**One thing worth flagging honestly.** The full `npm run test:ci` run in this session's sandbox
(1301s for 593 tests) showed 7 failures — but every one of them was a bare timeout
(`Test timed out in 20000ms`/`60000ms`), never a content or assertion failure, and only one of
the seven touched lessons (`libraries-schematics`) appeared among them, alongside four entirely
untouched lessons (`testing-components`, `testing-services-http`, `task-manager`, `auth-flow`)
and one a11y spec (`data-dashboard`) that also timed out. Re-ran `libraries-schematics`'s own
smoke + a11y tests in isolation (`ng test --filter="libraries-schematics"`) and both passed
cleanly in 12.66s — confirming the timeout was this session's sandbox running the full suite
back-to-back under resource contention, not a defect this batch introduced. Worth a routine
re-run in CI (which isn't resource-constrained the same way) rather than assumed fixed.

Declared-shape count: 28 → 35. Remaining undeclared: 103 − 35 = **68**, next up for batch 5.

**Batch 5 of step 5, landed 2026-09-20.** Fifth rotation batch, seven lessons across three
tracks (`expert` ×3, `foundations` ×2, `intermediate` ×2). `audit-variety.mjs`'s warning list
was empty going in — the worst-offender queue batches 1–3 drew from is worked down — so every
lesson here was chosen by reading its actual content and asking which of the four shapes its
real gotcha is, not from a ranked list. `argument` was one behind the other three shapes at the
start of the session (8 vs. 9/9/9) and got two of the seven; the rest split across the other
shapes by fit, landing one lesson short of perfectly even (11/11 vs. 10/10) rather than forcing
a tie:

| Lesson                   | Track        | Shape               | The kind of gotcha                                                                                                                                                                   |
| ------------------------ | ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `state-management`       | expert       | `argument`          | tension (two components each declare their own `signal<CartItem[]>` field; both signals work exactly as documented, and the bug is that a shared field name isn't a shared instance) |
| `control-value-accessor` | expert       | `argument`          | tension (`writeValue`, `onChange` and `FormControl` each behave exactly as documented; the echo loop is the one call connecting IN to OUT, not a bug in either method)               |
| `di-advanced`            | expert       | `whiteboard`        | structure (one `inject()` call walks two entire trees in a strict order — the element chain, then the environment chain — and a `NullInjectorError` means both came up empty)        |
| `testing-services-http`  | intermediate | `receipt`           | cost (a test green for eight months, one assertion written, zero times executed — `flush()` is what turns "compiles" into "actually ran")                                            |
| `content-projection`     | intermediate | `whiteboard`        | structure (a projected node keeps the PARENT's view-encapsulation attribute forever; moving into a child's DOM changes where it's drawn, never who compiled it)                      |
| `async-basics`           | foundations  | `no-dumb-questions` | misconception (a synchronous loop really does freeze the page; async code never gets a separate thread, only a place in line for the same one lane)                                  |
| `why-typescript-angular` | foundations  | `receipt`           | cost (the same typo caught free-as-you-type vs. hours-later-in-production — TypeScript's whole job is dragging that total back to the first row)                                     |

Five of the seven relocated a pre-existing device instead of duplicating it, continuing batches
3–4's discipline: `di-advanced`'s "hang on" predict-napkin moved down to sit immediately before
the live modifier demo it actually predicts; `control-value-accessor` relocated its own napkin
the same way, and separately moved its existing echo-loop quiz UP into the block (a callback
`<div class="tip">` now sits at its old spot in the "echo loop" section instead of a second copy
of the same question); `testing-services-http` relocated an `app-compare` + `app-predict` pair
up into the block for the same reason, leaving one callback line where the pair used to sit and
keeping the deeper `coldOptions` quiz in place since it is a genuinely different bug (a cold
observable never subscribed to, not a silent pass); `content-projection` folded its old napkin's
exact question into the block's own `app-brain-power`, word for word, rather than dropping it.
`why-typescript-angular` retired a hand-rolled `.dia-*` SVG bar chart entirely in favour of
`app-receipt` telling the identical "four moments" story with the shared component instead of
bespoke markup — and deliberately did **not** reuse its own `greet`/`user`/`price` bug-hunt
examples in the block's compare, since their whole point is a later "the file extension alone
isn't the safety" reveal the block would have spoiled; it invented a fresh `setStatus`/union-type
example instead. Two lessons had a stale in-page callback ("answers the napkin question above")
pointing at content the rotation removed — reworded in place rather than left dangling, in
`why-typescript-angular` and `content-projection`.

One real build warning surfaced and was fixed, not waved off: relocating
`testing-services-http`'s only `app-napkin` usage out of the template left `Napkin` imported but
unused, and `npx ng build` caught it as `NG8113` — removed from both the import and the
`@Component` imports array, confirmed with a clean rebuild.

`scripts/audit-variety.mjs` is green (42 declared shapes: `argument` 10, `no-dumb-questions` 10,
`receipt` 11, `whiteboard` 11 — no forbidden device, no shared-shape neighbours) and
`scripts/audit-retention.mjs` still shows all 103 lessons at 9/9. `npm run format:check` (after
`prettier --write` on the 13 touched files — Prettier's own reformatting, re-verified clean
afterward), `npm run typecheck`, and `npx ng build` (0 warnings after the `Napkin` fix) are all
green. `npm run test:ci` ran the full suite clean in this session — **28/28 test files, 593/593
tests passing**, no timeouts and no flakiness this time, unlike the sandbox contention batch 4
flagged.

Declared-shape count: 35 → 42. Remaining undeclared: 103 − 42 = **61**, next up for batch 6.

**Batch 6 of step 5, landed 2026-09-20.** Fourth-consecutive rate-limit recovery round: the
agent finished the content for all four lessons below (writing/fact-checking/wiring each one)
before a session-wide API rate limit killed it, so the recovery work was re-verifying and
re-wiring rather than re-authoring — the exact pattern batch 4's recovery established. Four
lessons across three tracks (`beginner` ×2, `intermediate` ×1, `typescript` ×1):

| Lesson             | Track        | Shape       | The kind of gotcha                                                                                                                                                                          |
| ------------------- | ------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pipes`             | beginner     | `receipt`   | cost (three separate `\| async` bindings on one cold, HTTP-shaped source read like one value on the page — they're three independent `AsyncPipe` subscriptions, three separate network requests) |
| `services-di`       | beginner     | `whiteboard`| structure (`CartService` and `CounterService` are injected with identical syntax — `inject()`, same shape — but one's `providedIn: 'root'` converges every consumer on one instance while the other's component-level `providers: [Service]` gives each consumer its own, fully isolated copy) |
| `async-validators`  | intermediate | `receipt`   | cost (typing "admin" with no debounce fires 5 separate 700ms server round trips, one per keystroke — 4 of them checking a username nobody was ever going to submit)                          |
| `decorators`        | typescript   | `whiteboard`| structure (`@First()` above `@Second()` on the same method: their *factories* — the plain `()` calls — evaluate top to bottom, but the *decorators* those factories return apply bottom to top, so the same two decorators run in opposite order depending which pass you're asking about) |

**Recovery specifics.** Three of the four lessons (`pipes`, `services-di`, `decorators`) already
had their `curriculum.ts` `shape:` field set when the crash was discovered; `async-validators`
did not, even though its HTML/TS content was fully written and its data bindings were complete
(verified by grepping every `[prop]="x"` reference in the template against a matching `readonly x`
in the `.ts` file — all present). Added the missing `shape: 'receipt'` entry rather than
re-authoring anything. Also investigated an apparent red flag before trusting the file: the new
"THE SHAPE — The Receipt" opening block sits at the top of `async-validators.html`, but a much
later, pre-existing section is *also* literally titled "3. THE SHAPE" — a coincidental naming
collision (that older section describes an `AsyncValidatorFn`'s TypeScript contract, unrelated to
the CONTRIBUTING §2C page-opening convention) rather than a duplicated or half-finished edit,
confirmed by comparing against `pipes.html`'s identical old-numbered-sections-continue-after-the-
new-block structure from this same batch.

`scripts/audit-variety.mjs` is green (46 declared shapes: `argument` 10, `no-dumb-questions` 10,
`receipt` 13, `whiteboard` 13 — no forbidden device, no shared-shape neighbours) and
`scripts/audit-retention.mjs` still shows all 103 lessons at 9/9. `npm run format:check` (ran
`prettier --write` on the four touched HTML/TS files first — none had been formatted yet when the
crash hit — then re-verified clean across the full repo), `npm run typecheck`, and `npx ng build`
(0 warnings, checked explicitly this time after batch 5's `NG8113` catch) are all green. `npm run
test:ci` — every test file and test passing, no timeouts.

Declared-shape count: 42 → 46. Remaining undeclared: 103 − 46 = **57**, next up for batch 7.

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
| 2026-09-07    | Brain-friendly branch merged to master; 100/100 lessons + 15/15 pages     |
| 2026-09-06    | Lesson rollout complete — every lesson through the retention + brain pass |
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
