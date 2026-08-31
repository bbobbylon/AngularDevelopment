# Contributing — Writing Lessons and Questions

**Version:** 1.0
**Last Updated:** 2026-08-29
**Status:** Final

## Overview

How to add a lesson, add practice questions, or change the curriculum without breaking
the guards that hold the content together. The bar for a lesson here is higher than
"summarise the documentation" — §2 is the important section.

## Table of Contents

- [1. Adding a lesson](#1-adding-a-lesson)
- [2. The depth standard](#2-the-depth-standard)
- [2A. The retention standard](#2a-the-retention-standard)
- [2B. The presentation standard](#2b-the-presentation-standard)
- [3. Lesson file anatomy](#3-lesson-file-anatomy)
- [4. Adding practice questions](#4-adding-practice-questions)
- [5. Option-length balancing](#5-option-length-balancing)
- [6. Documentation requirements](#6-documentation-requirements)
- [7. Storage keys](#7-storage-keys)
- [8. Before you commit](#8-before-you-commit)
- [9. Traps worth knowing](#9-traps-worth-knowing)

---

## 1. Adding a lesson

**Step 1** — create `src/app/lessons/<level>/<id>/<id>.ts`, exporting one standalone
component. `<level>` is `foundations`, `typescript`, `beginner`, `intermediate`, `expert`
or `projects`. `<id>` is kebab-case and becomes the route.

**Step 2** — add the entry to `CURRICULUM` in `src/app/core/curriculum.ts`, in the
position it should be read:

```ts
{
  id: 'my-topic',
  title: 'My Topic',
  summary: 'One line, shown on the dashboard card.',
  level: 'intermediate',
  category: 'Forms',
  loadComponent: () => import('../lessons/intermediate/my-topic/my-topic').then((m) => m.MyTopic),
},
```

**Step 3** — that's it. The route, the nav entry, the dashboard card and the per-track
counter all derive from `CURRICULUM`.

Omitting `loadComponent` is legal — the lesson is enumerated and routes to the shared
"coming soon" page. No lesson currently needs it, and a new lesson should not ship that
way.

---

## 2. The depth standard

**A lesson is not a documentation summary.** The Angular docs already exist and are
better at being reference material than anything written here would be. A lesson earns
its place by doing the three things the docs do not.

### 2.1 Demonstrate, don't assert

Every lesson needs at least one demo the reader can operate, and the demo should make
the _consequence_ visible rather than the feature. The difference:

| Weak                                        | Strong                                                                                                    |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| A button that increments a signal           | Two counters side by side, one signal and one plain field, with a render counter proving only one updates |
| Prose saying `OnPush` compares by reference | Two buttons — mutate and replace — and a child that visibly ignores the first                             |
| A note that async validators debounce       | Two identical fields, one debounced, each with a request counter. The gap is a number                     |

If a claim can be turned into something the reader can make happen, turn it into that.

### 2.2 Cover the failure modes

For each concept, ask: what goes wrong, and what does it look like when it does? That
material is what the reader cannot get elsewhere, because documentation describes the
supported path.

Examples of what this looks like in the existing lessons:

- `HttpParams.set()` returns a new instance; discarding it fails **silently**.
- A resolver's observable must complete, or the navigation hangs with no error.
- `canActivate` runs after the lazy chunk is already downloaded; only `canMatch` is
  early enough to prevent it.
- A `viewChild` is `undefined` until the view exists.
- A tooltip appended to `document.body` is not destroyed with its host.
- `[aria-expanded]` raises NG0303 — ARIA needs `[attr.aria-*]`.
- `snapshot` params go stale when the router reuses a component instance.

### 2.3 Go under the hood where it explains something

Not trivia — mechanism that makes behaviour predictable. What the compiler turns a
template into; why `markForCheck` walks up and `detectChanges` walks down; what
`@defer` compiles to; how a context object supplies `let` variables. Include it when
knowing it changes how the reader reasons; leave it out when it is just detail.

### 2.4 Say what you'd actually do

Where a feature has a "correct but rarely right" use, say so. Impure pipes work and are
usually the wrong answer next to a `computed`. `ngDoCheck` exists and is almost always a
mistake. `@angular/animations` is deprecated in favour of CSS. A lesson that only lists
capabilities leaves the reader unable to choose.

### 2.5 Length is not the metric

A short lesson with three sharp demos beats a long one restating the API surface.
`scripts/measure-lessons.mjs` reports sizes, but line count is a weak proxy — judge by
whether §2.1–§2.4 are satisfied.

---

## 2A. The retention standard

Depth is a comprehension tool. It is not a retention tool, and this app exists to get
someone through an exam, which is a memory problem as much as an understanding one. A
reader who follows a 400-line lesson while reading it can still fail to recall it two
weeks later.

So a lesson also has to be **built to stick**. The bar, in full, lives in `.claude/CLAUDE.md`
under "The Zero-to-Hero standard". The short version: teach the same idea in more than one
mode, give it a picture, give it an analogy, make the reader commit to an answer before you
give them one, and leave them one sentence they will still have in a fortnight.

### 2A.1 The teaching components

`src/app/shared/teaching/` exists so this is a matter of importing something rather than
inventing markup. Import from the barrel:

```ts
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
```

| Component        | Use it for                                        | Rough budget per lesson            |
| ---------------- | ------------------------------------------------- | ---------------------------------- |
| `<app-remember>` | The one sentence that must survive                | 1–2 (a hook, and at most one rule) |
| `<app-predict>`  | Ask before telling — commit, then reveal          | 1–2                                |
| `<app-quiz>`     | Active recall with explained wrong answers        | 1–2                                |
| `<app-flow>`     | A step diagram — sequences, pipelines, lifecycles | 1                                  |
| `<app-compare>`  | Before/after, old API/new API, wrong/right        | as needed                          |
| `<app-faq>`      | The doubts a learner hesitates to ask out loud    | 1, 3–5 items                       |

The budgets matter. Three `<app-remember>` boxes highlight nothing, and a page of quizzes
reads as a worksheet rather than a lesson. Two `<app-remember>`s are the ceiling and only
earn their place when they do different jobs — a `mnemonic` for the shape of the idea and
a `rule` for the thing you will actually get wrong. If both say the same thing, cut one.

### 2A.2 Writing the copy

- **Wrong answers need explanations too.** The `why` on an incorrect `QuizOption` is where
  the misconception actually gets corrected — it is the most valuable text in the component.
- **Strings support `backtick` code spans and `**bold**`.** `Quiz`, `Faq`, `Predict`, `Flow`
  and the whole presentation set take copy as data; backticks render as `<code>` and double
  asterisks as `<strong>`. Those two are the entire vocabulary. There is deliberately no
  HTML-in-strings escape hatch — see `shared/teaching/inline-code.ts` for why, and for why
  the list stops at two.
- **Long copy lives in the `.ts`.** Options arrays, FAQ items and code samples go in the
  component class as named fields, not inline in the template. It keeps the template
  readable and the strings diffable.
- **The analogy is prose, not a component.** There is no `<app-analogy>` because a good
  metaphor needs to be woven into the explanation, not boxed off beside it. Write it as a
  short "the mental model:" paragraph near the top.

### 2A.3 Checking a lesson

```bash
node scripts/audit-retention.mjs                    # every lesson, worst first
node scripts/audit-retention.mjs --detail signals   # which signals one lesson is missing
```

The scores are proxies, not judgements — a lesson can score 9/9 and still be dull. Use the
ranking to decide _what to look at_, then read it.

---

## 2B. The presentation standard

Depth makes a lesson correct. Retention makes it stick. Presentation decides whether the
reader gets far enough in to find out. The bar is recorded as **Bar 3** in
`.claude/CLAUDE.md`; `src/app/shared/brain/` and `src/brain-friendly.css` are how you meet
it without inventing markup. The rationale for every choice is in
[UI-DESIGN.md §9](UI-DESIGN.md#9-the-brain-friendly-layer).

### 2B.1 Opting a lesson in

```html
<article class="lesson bf" bfPage></article>
```

Both are required — see `shared/brain/bf-page.directive.ts` for why the class alone is not
enough. Then import what you need from the barrel:

```ts
import { BfPage, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
```

### 2B.2 The presentation set

| Component         | Use it for                                                    | Budget             |
| ----------------- | ------------------------------------------------------------- | ------------------ |
| `<app-chapter>`   | The lesson header. Numeral, track badge, "you are here" rail  | exactly 1          |
| `<app-code-lab>`  | Any substantial snippet, with numbered per-line notes         | 1 per real snippet |
| `<app-layers>`    | One thing _contains_ another — DI, CD, interceptors, closures | 0–1                |
| `<app-bubbles>`   | A two-party contract, staged as dialogue                      | 0–1, 4–6 turns     |
| `<app-tape-card>` | Three to five short parallel named things, in a `.bf-grid-3`  | one row            |
| `<app-napkin>`    | The one thing per section the reader should stop and _do_     | 1–2 per lesson     |

Reach for the one whose job matches. Using `<app-layers>` for a pipeline or
`<app-bubbles>` for a monologue is worse than using neither, because the shape then tells
the reader something untrue about the idea.

### 2B.3 Section rhythm

Every section opens with an eyebrow and a short declarative headline:

```html
<section>
  <p class="bf-eyebrow">The problem</p>
  <h2>Your data changed. Who tells the screen?</h2>
</section>
```

Headlines are sentences with a full stop, not noun phrases. "Change detection scheduling"
is a heading in a manual; "When does Angular decide to look?" is a heading in a book.

### 2B.4 Annotating code — the non-negotiable one

This is the most-repeated request in the project's history, and every previous attempt
drifted back to one sentence above a 30-line block. Do not do that.

```ts
protected readonly notes: CodeNote[] = [
  {
    line: 9,
    text: 'The whole game, on one line. It calls `ctx.count()`, compares the result with the value already parked in slot 1 using `===`, and touches the DOM **only if they differ**.',
  },
];
```

- **Say what the symbols are.** If a line introduces `rf`, `ctx`, `ɵɵadvance` or `asserts`,
  the note says what that is. "This sets the value" is a failing note.
- **Never assume the reader can read the snippet.** They are here because they cannot yet.
- Keep trailing `//` comments in the source too — the note and the comment do different
  jobs, and the highlighter colours the comment.
- `line` is **1-based** and counted against the raw string, so re-check the numbers after
  any edit to the sample.

### 2B.5 Colouring prose

Colour is a retention device here, spent deliberately. Four treatments, four meanings:

| Markup                    | Means                                   |
| ------------------------- | --------------------------------------- |
| `<strong>`                | the subject of the sentence — full ink  |
| `<span class="term">`     | new vocabulary, first technical use     |
| `<span class="key">`      | the highlighter — one or two per lesson |
| `<span class="bf-break">` | the thing that fails; naming the trap   |

If everything is marked, nothing is. A section with more than two or three of these has
lost the plot.

### 2B.6 What not to do

- **No hover or press effect may change layout.** Transform and opacity only, or an
  absolutely-positioned clipped overlay. A hover that resizes its host shoves the page
  around under the pointer.
- **No hard-coded colours.** Use the `--bf-*` tokens; the whole-shell remap depends on it.
- **All motion inside `prefers-reduced-motion: no-preference`.**
- **Do not restyle a shared component from a lesson stylesheet.** If the layer is wrong
  for every lesson, fix the layer.

---

## 3. Lesson file anatomy

A lesson is a folder, and it follows the same convention the lessons teach: markup in
`.html`, styles in `.css`, logic in `.ts`.

```
lessons/<level>/my-topic/
  my-topic.ts            # the lesson component
  my-topic.html          # its template
  my-topic.css           # only what this lesson's demos need
  my-topic.shared.ts     # ONLY if a demo child and the lesson share a declaration
  my-widget/             # one folder per demo component
    my-widget.ts | .html | .css
```

Three rules keep this from tangling:

- **A demo component gets its own folder** as soon as it exists, even a ten-line one.
  Name the folder after the class in kebab-case (`ToneCard` → `tone-card/`).
- **Imports run one way only:** lesson → demo child → shared. A child must never import
  its lesson.
- **If a child and the lesson both need something** — a service, an interface, a const —
  put it in `<lesson>.shared.ts` and have both import it. Leaving it in the lesson file
  would make the imports circular. Seven lessons currently have one; see
  `beginner/outputs/outputs.shared.ts` for the shape.

### 3.1 The `.ts`

```ts
import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MyWidget } from './my-widget/my-widget';

/**
 * Lesson: <Title> — <the one-line framing>.
 *
 * Covers <the API surface>.
 *
 * <A paragraph on what the demos prove and why that is the interesting part.>
 *
 * @see <level>/<other-lesson> — <how they relate>.
 */
@Component({
  selector: 'app-lesson-my-topic',
  imports: [RouterLink, MyWidget],
  templateUrl: './my-topic.html',
  styleUrl: './my-topic.css',
})
export class MyTopic { … }
```

Note `styleUrl`, singular — the Angular 17+ form. `styleUrls: []` still works but is not
used anywhere here.

### 3.2 The `.html`

```html
<article class="lesson">
  <span class="lesson__eyebrow">Intermediate · Forms</span>
  <h1>My Topic</h1>
  <p class="lead">…</p>

  <h2>Section</h2>
  <div class="demo">
    <div class="demo__title">Try it</div>
    <app-my-widget />
  </div>
  <div class="code"><pre>{{ someSample }}</pre></div>
  <div class="warn">…the trap…</div>

  <h2>Key takeaways</h2>
  <ul>
    …
  </ul>
  <p><a routerLink="/next-topic">Next: Next Topic →</a></p>
</article>
```

Code samples shown to the reader stay in the `.ts` as `protected readonly` template
literals and are rendered with `{{ }}`, not written as literal markup — that keeps
Angular from trying to parse them as a template.

**The JSDoc block goes above `@Component`, not between it and `export class`.** A
comment placed between the decorator and the class is not attached to the class — it
lands on nothing. This bit 42 lesson files once already.

**Code samples are template literals on the class**, not markup in the template — that
way braces, angle brackets and `@` symbols do not have to be escaped. See §9.

See [UI-DESIGN.md §4](UI-DESIGN.md#4-page-anatomy) for the full skeleton and the callout
classes.

---

## 4. Adding practice questions

All 424 questions live in `src/app/pages/practice/practice-data.ts`, grouped by category
with `// --- CATEGORY ---` banners. Practice, Mock Exam, Flashcards, Review and Exam Day
all read from it.

```ts
{
  id: 425,                        // next free number — NEVER renumber existing ones
  type: 'spot-the-bug',           // or multiple-choice | predict-output | fill-blank
  difficulty: 'mid',              // junior | mid | senior
  category: 'forms',
  question: 'What is wrong with this validator?',
  code: `…optional sample, plain text…`,
  options: [
    'It never completes, so the control stays PENDING forever',
    'It returns an object instead of null when valid',
    'It is registered in validators rather than asyncValidators',
    'It debounces with delay() instead of timer()',
  ],
  answer: 0,
  explanation:
    'An async validator must emit AND complete… (B) is backwards — null means valid. ' +
    '(C) would make it run synchronously and throw. (D) still completes, so it works.',
  hint: 'Watch the control status, not the value.',
  topicPath: 'async-validators',  // a lesson id — NO leading slash
},
```

### The rules, all enforced by `practice-data.spec.ts`

1. **Ids are permanent.** They key persisted answer state, the spaced-repetition queue
   and flashcard progress. Renumbering silently transfers a user's history onto a
   different question.
2. **Ids are unique.**
3. **`topicPath` is a bare lesson id.** `'signals'`, never `'/signals'`. A slash-prefixed
   value produces a link that looks right and 404s. The same guard covers
   `core/glossary-data.ts`.
4. **Explanations say why the wrong answers are wrong.** Correcting the answer without
   correcting the misconception teaches the answer, not the concept.
5. **Options are length-balanced.** See §5.

### Writing options that test knowledge

The bank was rewritten once to remove guessable patterns; these are the rules that
survived it.

**Text options**

- Roughly **equal length** — see §5 for why, and for how it is measured.
- Every distractor **plausible**: it should be something a reader who half-knows the
  topic would actually believe.
- Distractors should name a **real adjacent concept**, not a nonsense one. "`@Injectable`
  marks a class for dependency injection" is a good wrong answer to a question about
  `@Component`; "`@Component` cannot be used twice" is not.
- The correct answer should be obvious **only** to someone who knows the concept.

```ts
// weak — one real answer and three throwaways, all different lengths
options: ['@NgModule', '@Component', '@Injectable', '@Directive'];

// better — four real descriptions, comparable weight, all plausible
options: [
  '@NgModule — groups components into a module',
  '@Component — declares a reusable UI building block',
  '@Injectable — marks a class for dependency injection',
  '@Directive — adds behaviour to an existing element',
];
```

**Code options** (`spot-the-bug`, `predict-output`, `fill-blank`)

- Make the options **code blocks**, not prose descriptions of code. The reader should
  have to read the code.
- Keep them at roughly **equal visual weight** — same line count where possible.
- Every option **syntactically valid**; they should differ semantically, so a syntax
  error cannot be used to eliminate one.

**Explanations**

- Explain the correct answer in full, then say why each plausible wrong one fails.
- Teach the concept rather than announcing a verdict.
- Always include a `topicPath` so the reader can go and read about it.

---

## 5. Option-length balancing

Answer length is the classic tell in a hand-written bank: write one careful correct
answer and three lazy distractors, and the whole bank becomes guessable without reading
the question.

**The target is chance, not zero.** With four options, the longest one should be correct
about **25%** of the time. Driving it to 0% is the same exploit inverted — "never pick
the longest" becomes a strategy. Current aggregate: **25.9%** (110 of 424), with no
category badly off and zero questions where the correct answer is the shortest.

Tooling lives in `scripts/`:

| Script                                      | Purpose                                                       |
| ------------------------------------------- | ------------------------------------------------------------- |
| `measure-balance.mjs`                       | The report: per-category longest-correct %, mean rank, totals |
| `list-near-longest.mjs`                     | Questions where the correct option is close to longest        |
| `list-shortest.mjs`                         | Questions where the correct option is shortest                |
| `dump-category.mjs`                         | Dump one category for review                                  |
| `check-rebalance.mjs` / `check-rewrite.mjs` | Validate a proposed rewrite set                               |
| `apply-option-rewrites.mjs`                 | Apply a rewrite set                                           |
| `print-answers.mjs`                         | Print options, lengths and the answer for given question ids  |

A rewrite set is a module default-exporting `{ [id]: { options, answer, explanation? } }`,
passed to `apply-option-rewrites.mjs` as an argument. The 51 per-category sets used to
reach the current balance were deleted once applied — their effect is in
`practice-data.ts` and their text is in git history. Write a new one when rebalancing;
do not expect an existing one to be there.

After adding questions:

```bash
node scripts/measure-balance.mjs
```

Aim to keep the aggregate near 25%. Fix drift by lengthening distractors, not by
truncating correct answers into something imprecise — a distractor should be _plausible_,
which usually means it deserves the same care as the right answer anyway.

---

## 6. Documentation requirements

**Every declaration carries JSDoc.** Classes, methods, properties, interfaces, types,
getters, setters — the codebase currently has zero undocumented declarations, and the
intent is to keep it there.

What makes a good one here:

- **Say why, not just what.** `/** The user's name. */` on `name` is noise.
  `/** Read once at construction — deliberately NOT reactive, to demonstrate the
staleness trap. */` is the comment that was worth writing.
- **Document the non-obvious choice.** If something is deliberately naive, deliberately
  wrong, or deliberately different from the neighbouring code, that is exactly what the
  comment is for.
- **Cross-link with `{@link}` and `@see`.** Lesson class docs `@see` the related
  lessons; the reader following one topic finds the next.
- **`@param` / `@returns` on anything non-trivial.**

Placement: **above the decorator**, never between decorator and class (§3).

---

## 7. Storage keys

Never write a raw `localStorage` key. Add it to `STORAGE_KEYS` in `src/app/core/storage.ts`
and use `readJson` / `writeJson`:

```ts
import { STORAGE_KEYS, readJson, writeJson } from '../../core/storage';

const state = readJson(STORAGE_KEYS.myFeature, { items: [] });
writeJson(STORAGE_KEYS.myFeature, next);
```

- Suffix the key with `-v1`, and **bump the version whenever the stored shape changes**.
  Old entries then go unread and the caller's fallback applies, instead of a parse of an
  incompatible shape reaching live code.
- `readJson` never throws — storage unavailable, key missing and corrupt JSON all return
  the fallback. Keep it that way; study data is advisory, and a bad entry must not stop
  the app booting.
- If the Progress dashboard should reflect the new feature, add a **read** there. It
  never writes.

---

## 8. Before you commit

```bash
npm run verify                     # typecheck + tests + build — the gate CI applies
node scripts/measure-balance.mjs   # only if you touched the question bank
```

`verify` is the three steps below run in order; use them individually while iterating:

```bash
npm run format:check   # Prettier, or `npm run format` to fix
npm run typecheck      # tsconfig.app.json AND tsconfig.spec.json
npm run test:ci        # 21 files, 392 tests, single run
npm run build          # production build
```

CI runs the same set on every pull request, and the Pages deploy will not run unless it
passes. Two things worth knowing about what those checks cover:

- **Adding a lesson or page adds tests automatically.** The smoke and a11y suites walk
  `CURRICULUM` and the route table, so a new entry is mounted, rendered and scanned with
  axe-core without you writing a spec. The commonest new failure is an unlabelled form
  control in a demo — give every `input`, `select` and `textarea` an `aria-label` (or an
  `[attr.aria-label]` when the name depends on the row).
- **Formatting is gated, and templates use Prettier's `angular` parser.** This matters:
  the default `html` parser does not understand `@if` / `@for`, and flattens their
  bodies to column zero with the closing braces collapsed onto one line. The `angular`
  parser indents them exactly as they are written by hand. The override is in
  `.prettierrc`; do not remove it.
- **One file is in `.prettierignore`.** `task-manager.html` escapes braces as
  `{{ '{{' }}` inside a `<pre>`, and Prettier wraps one of those interpolations by
  inserting a newline _inside_ the quoted string — which is content, so the sample grows
  a blank line on every run. If you add a lesson that displays Angular syntax this way,
  check `npx prettier --check` twice: non-idempotency is the symptom.

`npm test` (or `npx ng test --watch=false`) is the way to run the suite — a bare
`vitest run` will not work, since the tests are driven by the Angular build's test
target.

**Note on `ng build`:** it frequently finishes successfully in a few seconds and then
never exits. Treat "Application bundle generation complete" in the output as success;
poll with a bounded timeout and kill the process rather than waiting on it.

---

## 9. Traps worth knowing

**JSDoc placement.** Between a decorator and its class, a comment attaches to nothing.
Above the decorator. Same for `@HostListener` on methods. A file-level comment placed
after the imports but before the first declaration silently becomes that declaration's
doc.

**`@Component({` inside a template literal.** Lesson code samples routinely contain
Angular decorators at column 0 inside backticks. Any tooling that scans for declarations
by pattern will find them and corrupt the file. The reliable test for "is this position
inside a template literal" is backtick parity — count backticks before the offset; odd
means inside.

**Braces in templates.** `{` and `}` are Angular template syntax. An example that needs
to _display_ an error object (`{ taken: true }`) has to arrive as a string from the
class, not be written inline in the template.

**`TestBed.tick()`** is the effect-flush API in this codebase. `flushEffects` appears
only inside lesson teaching content — do not reach for it in a spec.

**Curriculum ordering is meaningful.** `LEVELS` and the order within `CURRICULUM` are the
reading order, not an alphabetical list. Insert a lesson where a learner should meet it.

## Related documents

- [ARCHITECTURE.md](ARCHITECTURE.md) — structure and patterns
- [UI-DESIGN.md](UI-DESIGN.md) — the lesson skeleton and design tokens
- [SRS.md](SRS.md) — the requirements these conventions serve
