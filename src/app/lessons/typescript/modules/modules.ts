import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember, RichText } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

/**
 * One import form, with the code that writes it and what it actually binds.
 */
interface ImportKind {
  label: string;
  code: string;
  explain: string;
}

const IMPORT_KINDS: ImportKind[] = [
  {
    label: 'named',
    code: `import { makeUser, VERSION } from './user';`,
    explain:
      'Pick specific exports by their exact names — the braces are a (limited) destructuring-like syntax. Tooling loves this form: auto-import, find-all-references, and rename refactors all key off the shared name. Tree-shaking can drop unimported siblings.',
  },
  {
    label: 'named + rename',
    code: `import { makeUser as create } from './user';`,
    explain:
      '"as" renames on the way in — for collisions (two modules both export a "Config") or clarity. The exporting file is untouched; the alias is local to this importer.',
  },
  {
    label: 'default',
    code: `import Logger from './logger';`,
    explain:
      "No braces = the default export. YOU choose the local name, which is exactly its weakness: three files can call it Logger, Log and L, and rename-refactoring can't connect them. Hence the Angular-world preference for named exports.",
  },
  {
    label: 'namespace',
    code: `import * as utils from './utils';`,
    explain:
      'Bundle every export into one object: utils.formatDate(…), utils.clamp(…). Good when a module is a grab-bag of helpers and the prefix reads well; the price is that bundlers find it harder to prove which members are unused.',
  },
  {
    label: 'side-effect',
    code: `import './polyfills';`,
    explain:
      'Imports NOTHING — it just runs the module\'s top-level code once. Used for polyfills and registrations (zone.js was historically loaded this way). If you delete an import and behaviour changes despite "nothing" being imported, it was one of these.',
  },
  {
    label: 'type-only',
    code: `import type { User } from './user';`,
    explain:
      'Declares the import is types-only, so it is FULLY ERASED from the emitted JavaScript — no runtime dependency edge at all. Required discipline under isolatedModules (this project has it on), and it can even break real circular-import crashes when the cycle is types-only.',
  },
];

/**
 * Lesson: Modules, Imports & Exports — ES modules as TypeScript uses them.
 *
 * Covers named against default exports, `import type`, re-exports and barrel
 * files, and why a module's *file* is its boundary. Also the Angular-specific
 * point that ES modules are not `NgModule`s: in standalone Angular the two are
 * unrelated, and conflating them is a common source of confusion for anyone
 * arriving from older tutorials.
 *
 * Also covers module resolution, barrels and the mechanics of a circular
 * import, why `isolatedModules` cares about type-only imports, dynamic
 * `import()` as the engine behind lazy loading, and the fact that module
 * state is a singleton — evaluated once, shared by every importer.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`), following the shape
 * of the reference implementation in `lessons/expert/change-detection/`:
 *
 * 1. **Pose the problem before naming it.** The page opens on two files
 *    colliding in a shared global scope — a `Napkin` asks the reader to guess
 *    which of two near-identical setups crashes — before "module" carries any
 *    weight of its own.
 * 2. **Analogy before vocabulary.** The shop-with-one-window frame, staged
 *    twice: once in prose, once as a `Bubbles` dialogue between a module and
 *    the file trying to import from it.
 * 3. **The same idea in several modes.** A before/after scope `Compare`, a
 *    row of `TapeCard`s for the three ways a specifier resolves, a hand-drawn
 *    `<svg>` of the barrel cycle, and five separate `CodeLab` walkthroughs of
 *    real module syntax.
 * 4. **Every substantial snippet is annotated line by line** via `CodeLab` —
 *    the exports vocabulary, a barrel file, `import type`, dynamic `import()`,
 *    and the module-singleton counter all get numbered, paired notes rather
 *    than one sentence above the block.
 *
 * The existing `Compare` of static `import` against dynamic `import()` — the
 * lesson's strongest pre-existing device — is preserved verbatim inside the
 * new dynamic-import section, just rehoused.
 */
@Component({
  selector: 'app-lesson-ts-modules',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
    RichText,
  ],
  templateUrl: './modules.html',
  styleUrl: './modules.css',
})
export class Modules {
  // ── Presentation data ──────────────────────────────────────────────────────

  /** The stretch of the TypeScript track either side of this lesson, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Mapped & Conditional Types', id: 'ts-mapped-conditional' },
    { label: 'Decorators', id: 'ts-decorators' },
    { label: 'Modules, Imports & Exports' },
    { label: 'Promises & async/await', id: 'ts-async' },
    { label: 'Optional Chaining', id: 'ts-nullish' },
  ];

  // ── Section: the mental model ───────────────────────────────────────────────

  /**
   * The shop analogy, staged as a dialogue between a module and a file trying
   * to import from it. This is the two-party relationship a beginner to
   * modules reliably gets backwards — assuming anything written in a file is
   * automatically reachable from outside it — so it earns the dialogue
   * treatment rather than a paragraph.
   */
  protected readonly shopTalk: BubbleTurn[] = [
    {
      who: 'Another file',
      says: 'I need your `helper` function — hand it over.',
    },
    {
      who: 'The module',
      says: "Never heard of it. I never put it in the window, so as far as you're concerned it doesn't exist.",
    },
    {
      who: 'Another file',
      says: "Fine — what's actually in the window?",
    },
    {
      who: 'The module',
      says: '`makeUser`, `VERSION`, and a default export. Take any of those.',
    },
    {
      who: 'Another file',
      says: 'Deal. And if you rename that private helper of yours next month?',
    },
    {
      who: 'The module',
      says: 'Rename it, delete it, rewrite it entirely — you were never able to reach it, so nothing you wrote can break.',
    },
  ];

  // ── Section: the mechanism (scope) ──────────────────────────────────────────

  /**
   * Sample: the same two declarations, run as a plain `<script>` pair. Left
   * side of the scope `Compare` — deliberately not a module at all, so the
   * reader has something ordinary to compare the module version against.
   */
  protected readonly globalScriptSample = `// plain <script> tags, both loaded on the same page:
var config = { region: 'us' };     // GLOBAL — every other script can read AND overwrite this
var helper = () => 1;              // so can this — whichever script runs last, wins`;

  /**
   * Sample: the exact same two declarations, in a module file. Right side of
   * the scope `Compare`.
   */
  protected readonly moduleScopeSample = `// the exact same code, in a module file:
const config = { region: 'us' };   // private to THIS FILE — nothing outside can see it
const helper = () => 1;            // also private — unless you explicitly export it

export const VERSION = '1.0';      // the only thing anyone outside this file can reach`;

  /** Note under the scope comparison. */
  protected readonly scopeCompareNote =
    'Same declarations, same values. The only thing that changed is the **file** they live in — a module gives every one of them file-private scope by default, and `export` is the one keyword that opts a binding back out of that.';

  // ── Section: exports vocabulary ─────────────────────────────────────────────

  /**
   * Sample: every shape `export` can take in one file — inline at the
   * declaration, a renamed list export, and the one-per-module default.
   */
  protected readonly exportsSample = `export interface User {
  id: number;
}

export function makeUser(): User {
  return { id: 1 };
}

export const VERSION = '1.0';

const helper = () => {
  /* … */
};
export { helper as publicHelper };

export default class Logger {}`;

  /** Line-by-line walkthrough of {@link exportsSample}. */
  protected readonly exportsNotes: CodeNote[] = [
    {
      line: 1,
      text: '`export` glued directly onto a declaration — the most common form. `interface User` describes an object shape; putting `export` in front of it, instead of at the bottom of the file, is purely a style choice with identical effect.',
    },
    {
      line: 5,
      text: 'Same idea for a function: `export` in front means anyone who imports this file can call `makeUser()`. Nothing about the function itself changes — only its visibility.',
    },
    {
      line: 9,
      text: '`export const` — a plain value, exported the same way. This is what a re-exporting barrel (further down the page) actually collects and forwards.',
    },
    {
      line: 11,
      text: 'No `export` here. `helper` is back-room stock: usable anywhere in this file, invisible everywhere else — until the next line says otherwise.',
    },
    {
      line: 14,
      text: '`export { helper as publicHelper };` is a **list export**, added at the bottom rather than inline, and it renames on the way out. Consumers see `publicHelper`; this file still calls it `helper` internally. Compare this with `import … as …`, which renames on the way *in* instead.',
    },
    {
      line: 16,
      text: '`export default` — at most one of these per module, and it needs no name here at all. The class is still called `Logger` in this file; the importer chooses whatever local name it likes, which is exactly the trade-off the next section is about.',
    },
  ];

  /** Note under the exports demo tip. Kept as a field purely for the backtick-heavy copy. */
  protected readonly namedExportsTip =
    "House style for Angular codebases: **named exports everywhere**. They're refactor-safe, auto-importable, and grep-able. Default exports have one modern niche — Angular's lazy routes accept them without the `.then(m => m.X)` selector: `loadComponent: () => import('./admin-page')` just works when the file default-exports the component.";

  // ── Section: resolution ─────────────────────────────────────────────────────

  /** Sample: the three ways a specifier resolves, recapped as one block after the tape cards. */
  protected readonly resolutionSample = `import { User } from './user';                 // relative → a FILE next to this one
import { inject } from '@angular/core';         // bare → node_modules/@angular/core
import { CartService } from '@app/core/cart';   // aliased → tsconfig "paths"`;

  // ── Section: how a module actually loads ────────────────────────────────────

  /**
   * What happens the first time a module is imported. Worth drawing because two of
   * the lesson's headline facts — that module state is a singleton, and that a
   * circular import produces a half-initialised object rather than an obvious
   * error — are both consequences of steps in this one sequence.
   */
  protected readonly loading = [
    {
      label: 'Something imports `./user`',
      detail: 'The first import is what triggers everything below',
    },
    {
      label: 'Its own imports resolve first',
      detail: 'Depth-first. A module cannot run before what it depends on',
      tone: 'accent' as const,
    },
    {
      label: 'Top-level code runs — once',
      detail: 'Every `const`, every side effect, exactly one time',
    },
    { label: 'The module is cached', detail: 'Its exports are recorded against the resolved path' },
    {
      label: 'Every later import is a cache hit',
      detail: 'No re-run, no second copy. This is why module state is a singleton',
      tone: 'good' as const,
    },
  ];

  // ── Section: barrels ─────────────────────────────────────────────────────────

  /** Sample: a barrel file, and the tidy import it buys consumers. */
  protected readonly barrelSample = `// core/index.ts — the barrel
export * from './user';
export { Logger } from './logger';
export { Logger as AppLogger } from './logger';

// consumers get one tidy import:
import { User, Logger } from './core';`;

  /** Line-by-line walkthrough of {@link barrelSample}. */
  protected readonly barrelNotes: CodeNote[] = [
    {
      line: 2,
      text: '`export * from` forwards **every** named export of `./user` without listing them — convenient, and the reason a barrel can go stale silently when `./user` gains a new export nobody meant to make public.',
    },
    {
      line: 3,
      text: 'A targeted re-export: only `Logger` is forwarded, under its own name.',
    },
    {
      line: 4,
      text: 'Re-exporting the *same* `Logger` again, renamed. Two consumers can now ask for `Logger` or `AppLogger` from this one barrel and get the identical class — useful when a rename is in progress and old call sites have not caught up yet.',
    },
    {
      line: 7,
      text: "What a consumer actually writes: one import, pulling from two different real files (`user.ts` and `logger.ts`) through the barrel that fronts them. This tidiness is the entire reason barrels exist — and the entire reason the next section's bug is worth knowing about.",
    },
  ];

  /** The barrel cycle Predict sample. */
  protected readonly cycleSample = `// core/index.ts  (the barrel)
export * from './order-service';
export * from './user-service';

// core/user-service.ts
import { OrderService } from './index';   // ← imports its own barrel
export class UserService {
  private orders = new OrderService();
}

// Dev server: fine. Production build: crash.
// What is the error, and why only in production?`;

  // ── Section: type-only imports ──────────────────────────────────────────────

  /** Sample: a whole-import erasure next to a mixed import with one erased piece. */
  protected readonly typeOnlySample = `import type { User } from './user';        // whole import erased from the JS output
import { type User, makeUser } from './user';  // mixed: type part erased, function kept`;

  /** Line-by-line walkthrough of {@link typeOnlySample}. */
  protected readonly typeOnlyNotes: CodeNote[] = [
    {
      line: 1,
      text: '`import type` right after `import` marks the **entire statement** as types-only. TypeScript erases the whole line from the compiled JavaScript — there is no `require`/`import` of `./user` left at runtime at all.',
    },
    {
      line: 2,
      text: 'The mixed form: `type` sits in front of just `User` inside the braces. Only that piece is erased — `makeUser` survives as a real runtime import on the same line. Two nearly identical lines, two different runtime footprints.',
    },
  ];

  // ── Section: dynamic import() ───────────────────────────────────────────────

  /** Sample: static import versus dynamic `import()`, ending in the router's actual usage. */
  protected readonly dynamicImportSample = `// static import: top of file, ALWAYS in the initial bundle
import { Chart } from './charts';

// dynamic import(): an EXPRESSION returning a Promise — bundler splits the file
const { Chart } = await import('./charts');

// Angular's router uses exactly this — every lesson in this app is a lazy chunk:
const adminRoute = {
  path: 'admin',
  loadComponent: () => import('./admin').then((m) => m.Admin),
};`;

  /** Line-by-line walkthrough of {@link dynamicImportSample}. */
  protected readonly dynamicImportNotes: CodeNote[] = [
    {
      line: 2,
      text: 'A static `import` is a **declaration**, hoisted to the top of the file by the language itself. It must resolve at build time, and its code lands in the initial bundle whether or not this route is ever visited.',
    },
    {
      line: 5,
      text: "`import(...)` here is an **expression** — an ordinary function call that returns a `Promise` of the module's export object. `await` unwraps that promise. Because the bundler can see the literal string `'./charts'`, it carves the file into its own chunk, fetched over the network only when this line actually runs.",
    },
    {
      line: 10,
      text: '`loadComponent` is a thin wrapper over the line above: the arrow function delays the `import()` call until the route activates, and `.then((m) => m.Admin)` reaches into the resolved module object to pick out the component class.',
    },
  ];

  /** Note under the static/dynamic `Compare` — preserved from the pre-migration lesson. */
  protected readonly dynamicCompareNote =
    'Same module, same exports. The only difference is when the bytes reach the user — and that difference is the entire mechanism behind Angular lazy loading.';

  /** Left panel of the static/dynamic `Compare` — preserved from the pre-migration lesson. */
  protected readonly staticImportPanel = `import { Chart } from './charts';

// A declaration, hoisted to the top.
// Must resolve at build time.
// → lands in the initial bundle
// → downloaded by every visitor,
//   including the ones who never
//   open a chart`;

  /** Right panel of the static/dynamic `Compare` — preserved from the pre-migration lesson. */
  protected readonly dynamicImportPanel = `const { Chart } = await import('./charts');

// An expression returning a Promise.
// Bundler sees the literal path.
// → './charts' becomes its own chunk
// → fetched the first time this
//   line actually runs
// → nothing for visitors who never
//   open a chart`;

  // ── Section: module state is a singleton ────────────────────────────────────

  /** Sample: the module-level counter that proves a module is evaluated once and cached. */
  protected readonly counterSample = `// counter.ts
let count = 0;                 // module-level state — private to this file
export const next = () => ++count;

// a.ts
import { next } from './counter';
next(); // → 1

// b.ts — a completely different file
import { next } from './counter';
next(); // → 2, NOT 1 — same \`count\`, because the module ran once and is cached`;

  /** Line-by-line walkthrough of {@link counterSample}. */
  protected readonly counterNotes: CodeNote[] = [
    {
      line: 2,
      text: '`let count = 0` is module-scoped state — invisible outside this file, since it is never exported. It still exists exactly once, no matter how many files import from here.',
    },
    {
      line: 3,
      text: '`export const next` is the only door out. Every importer gets the *same function*, closed over the *same* `count` — not a fresh copy each time.',
    },
    {
      line: 7,
      text: "`a.ts`'s call is what actually triggers `counter.ts` to run its top-level code, for the first and only time, then increments `count` to `1`.",
    },
    {
      line: 11,
      text: '`b.ts` is a completely unrelated file, yet it reaches the same cached module instance — so `next()` continues from `1`, landing on `2`, not restarting at `1`.',
    },
  ];

  /** Choices for the module-singleton check. */
  protected readonly singletonOptions: QuizOption[] = [
    {
      text: '`1` — each importing file gets its own copy of the module',
      why: 'This is the intuition from `class` or from a factory function, where each consumer constructs its own. Modules do not work that way: they are evaluated once and cached against their resolved path, and every importer is handed the same object.',
    },
    {
      text: '`2` — both files share one `count`',
      correct: true,
      why: 'A module runs its top-level code exactly once, on first import, and every later import is a cache hit. So `count` is one variable that both files are incrementing. This is genuinely useful — it is the simplest singleton in JavaScript — and genuinely dangerous, because the coupling is invisible at the call site. Angular DI gives you the same single-instance behaviour with an injector you can override in a test, which is why services beat module-level `let`.',
    },
    {
      text: '`2`, but only because `a.ts` happened to run first',
      why: 'The sharing is not an ordering accident — it would be one shared `count` regardless of who imports first. Order decides which call sees `1`; it does not decide whether the state is shared.',
    },
    {
      text: 'Unpredictable — bundlers may or may not deduplicate the module',
      why: 'Single evaluation per resolved specifier is part of the ES module specification, not a bundler optimisation. The one way to get two copies is to resolve the same file by two different paths, which is a build misconfiguration rather than normal behaviour.',
    },
  ];

  // ── Section: pulling it together ────────────────────────────────────────────

  /** Tip under the pulling-it-together recap table. */
  protected readonly pullTogetherTip =
    'Reach for **named** by default, **default** only for a lazy-route component, and **type-only** the moment `isolatedModules` or a linter asks for it. The other three forms — namespace, side-effect, and letting a bundler resolve a runtime string — are all things you will *recognise* far more often than you will *write*.';

  // ── Section: questions from the back row ────────────────────────────────────

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Are ES modules the same thing as Angular `NgModule`s?',
      a: 'No, and the shared word is one of the more expensive collisions in the Angular vocabulary. An ES module is a *file* — a language feature about scope and imports. An `NgModule` was an Angular construct for declaring which components see which directives, and standalone components removed the need for it entirely. You use ES modules constantly; you will probably never write an `NgModule` again.',
    },
    {
      q: 'Is there an actual, concrete difference between a default export and a named one — not just a style preference?',
      a: "Yes, and it shows up the moment something gets renamed. Rename a named export and every import updates with it, because tooling can see they share one symbol. A default export has no name of its own — each importing file invents its own local name, so three files can end up calling the same class `Logger`, `Log` and `L`, and a rename tool has no thread connecting them. That is the entire practical argument behind 'prefer named exports', not just a style guide's opinion.",
    },
    {
      q: 'Should I use barrel files at all?',
      a: "For the public surface of a library, yes — that is exactly what an `index.ts` is for. Inside your own app, be sparing. A barrel adds a hop for the bundler to reason through, and it invites the cycle where a folder's own files import their own barrel. The rule that avoids nearly all the pain: never import your own barrel from inside the folder it describes.",
    },
    {
      q: 'Why does `import type` exist when TypeScript already erases types?',
      a: 'Because under `isolatedModules` — which this project uses, and which any modern build with esbuild or SWC effectively requires — each file is transpiled in isolation. The transpiler cannot open `./user` to check whether `User` is a type it should erase or a class it must keep, so you tell it locally. The bonus is real: an erased import creates no runtime dependency edge, so a cycle that was only ever about types simply stops existing.',
    },
    {
      q: 'Does a namespace import (`import * as utils`) hurt tree-shaking?',
      a: 'It can. Bundlers have got good at proving which members of a namespace object you actually touch, but the analysis is harder than for named imports and it gives up more easily — particularly if the object is passed around or indexed dynamically. Named imports state your intent in a form the bundler never has to infer, which is the main reason they are house style.',
    },
    {
      q: 'Can I `import()` a path built at runtime?',
      a: 'You can write it, and it will fail to code-split usefully. The bundler needs to see the target at build time to carve out a chunk for it; `import(someString)` gives it nothing to work with, so it either bundles everything that could match or leaves you with a runtime failure. This is why lazy routes are always written as an arrow function around a literal path.',
    },
  ];

  /**
   * The import forms the demo can step through.
   */
  protected readonly kinds = IMPORT_KINDS;
  /**
   * Which import form is currently selected.
   */
  protected readonly kind = signal<ImportKind>(IMPORT_KINDS[0]);
}
