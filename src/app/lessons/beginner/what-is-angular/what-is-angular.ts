import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';
import { WaCounter } from './wa-counter/wa-counter';
import { WaCart } from './wa-cart/wa-cart';
import { WaNotify } from './wa-notify/wa-notify';

/**
 * Lesson: What is Angular? — the very first page of the whole curriculum.
 *
 * Rather than restate the marketing summary, this lesson tries to make one
 * sentence feel obvious rather than just true: *a framework is a machine that
 * keeps the screen in sync with your data.* A newcomer who has never touched a
 * frontend framework should leave with a real mental model of what a component
 * is, why Angular calls itself a framework rather than a library, and the
 * handful of ways beginners trip over the reactivity model in week one — not a
 * list of buzzwords.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. Being lesson one, the teaching order
 * matters even more than usual — nothing on this page may assume the reader
 * has seen Angular code before:
 *
 * 1. **Pose the problem before naming the solution.** The page opens on "you
 *    changed a value — the browser did not react," with a real
 *    `document.querySelector` snippet, before the word "framework" carries any
 *    weight of its own.
 * 2. **Analogy before vocabulary.** The Hollywood Principle ("don't call us,
 *    we'll call you") arrives before *component*, *decorator* or *signal* have
 *    to mean anything, staged twice — once in prose, once as a dialogue.
 * 3. **The same idea in several modes.** A before/after code comparison, a
 *    diagram of a component's three files becoming one unit, live demos, and
 *    two full `app-code-lab` walkthroughs of real Angular source.
 * 4. **Every substantial snippet is annotated line by line** via `app-code-lab`
 *    — and because this is the reader's first exposure to any Angular code at
 *    all, the notes explain what a decorator, a class and a template *are*,
 *    not just what one particular line does.
 *
 * ## Demos on this page
 *
 * - **the counter** (`WaCounter`) — the smallest complete component, proving a
 *   click can change a value without a single DOM call;
 * - **the notify trap** (`WaNotify`) — a signal and a plain field, mutated in
 *   different ways, so "nothing renders until something notifies Angular"
 *   becomes a number instead of a claim;
 * - **the cart** (`WaCart`) — one array signal driving two independent
 *   `computed` derivations, proving fine-grained reactivity past a single
 *   value.
 *
 * @see beginner/cli-project-structure — what every file this lesson mentions
 * actually looks like on disk.
 * @see beginner/signals — the full depth behind the signal/computed preview here.
 * @see expert/change-detection — the full mechanism behind the notify trap.
 */
@Component({
  selector: 'app-lesson-what-is-angular',
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
    Predict,
    Quiz,
    Remember,
    WaCounter,
    WaCart,
    WaNotify,
  ],
  templateUrl: './what-is-angular.html',
  styleUrl: './what-is-angular.css',
})
export class WhatIsAngular {
  // ── Presentation data ──────────────────────────────────────────────────────

  /** The first stretch of the Beginner track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'What is Angular?' },
    { label: 'CLI & Structure', id: 'cli-project-structure' },
    { label: 'Components', id: 'components' },
    { label: 'Interpolation', id: 'interpolation' },
    { label: 'Signals', id: 'signals' },
  ];

  // ── Section: the problem ────────────────────────────────────────────────────

  /**
   * Sample: the one-line manual DOM update that opens the lesson, before the
   * fuller before/after comparison below it.
   */
  protected readonly domLineSample = `document.getElementById('total').textContent = String(total);`;

  /**
   * Sample: the same behaviour as {@link declarativeSample}, done entirely by
   * hand. Shown first, and deliberately not Angular at all, so the reader has
   * something ordinary to compare the framework against.
   */
  protected readonly imperativeSample = `// plain JavaScript — no framework involved
const button = document.querySelector('#inc');
const output = document.querySelector('#total');
let total = 0;

button.addEventListener('click', () => {
  total = total + 1;                    // the value changes...
  output.textContent = String(total);   // ...and YOU write the DOM update, by hand
});`;

  /**
   * Sample: the imperative version's Angular equivalent — same outcome,
   * nobody touches the DOM.
   */
  protected readonly declarativeSample = `// the same behaviour, described declaratively
@Component({
  selector: 'app-total',
  template: \`
    <button (click)="total.set(total() + 1)">+1</button>
    <p>{{ total() }}</p>
  \`,
})
export class TotalView {
  total = signal(0);   // Angular writes the DOM update for you
}`;

  /**
   * Note under the imperative/declarative comparison. Kept as a field (rather
   * than a plain attribute in the template) purely because it needs to *show*
   * `{{ total() }}` as literal text — see `docs/CONTRIBUTING.md` §9 on why
   * that has to come from a bound string rather than typed straight into the
   * template.
   */
  protected readonly compareNote =
    'Same behaviour, two philosophies. On the left, the DOM write is a line you wrote, and you must repeat it everywhere this number is shown. On the right, `{{ total() }}` is a **standing instruction** — Angular re-runs it for you, wherever it appears, for as long as the component exists.';

  // ── Section: the mental model ───────────────────────────────────────────────

  /**
   * The Hollywood Principle, staged as a dialogue rather than left as a single
   * paragraph. This is the two-party relationship beginners reliably get
   * backwards — assuming *they* drive Angular, the way they would drive a
   * library — so it earns the dialogue treatment rather than a bullet point.
   */
  protected readonly hollywoodTalk: BubbleTurn[] = [
    {
      who: 'You, thinking in a library',
      says: "I'll call `renderCounter()` myself, right after I update the number.",
    },
    {
      who: 'Angular',
      says: "Don't. Hand me the component — I'll decide when to construct it, when to render it, and when to check it again.",
    },
    {
      who: 'You',
      says: 'That feels like giving up control. What do I get for it?',
    },
    {
      who: 'Angular',
      says: 'You describe the **what** — this template, these bindings. I own the **when**. You never remember to re-render anything, because you never call render at all.',
    },
    {
      who: 'You',
      says: 'So if I just change a signal and get on with my day—',
    },
    {
      who: 'Angular',
      says: "—I already noticed. That's the whole deal: don't call us, we'll call you.",
    },
  ];

  /**
   * The self-test for "framework vs library". The distractors are the three
   * ways people misplace the distinction — on size, on app shape, and on
   * language — rather than on who is in control, which is the only thing that
   * actually matters here.
   */
  protected readonly frameworkQuizOptions: QuizOption[] = [
    {
      text: 'Angular is simply a much bigger collection of functions than a typical library.',
      why: 'Size is not the line — a React app plus its usual router, state manager and form library can easily ship more code than a lean Angular one. The real difference is **who is in charge**: a library is code you call, a framework is code that calls you.',
    },
    {
      text: "Angular owns the application's structure and calls your code at the right moments — you plug components into it rather than wiring everything up yourself.",
      correct: true,
      why: "Exactly the Hollywood Principle: **don't call us, we'll call you**. You write a component and hand it to Angular; Angular decides when to construct it, when to render it, and when to check it again.",
    },
    {
      text: 'A framework can only be used to build single-page applications, while a library works anywhere.',
      why: 'App shape is not the line either — you can build a single-page app on top of a library just fine (React plus a router of your choice is exactly that). The framework/library split is about **control flow**, not about what kind of app comes out the other end.',
    },
    {
      text: 'Frameworks are written in TypeScript; libraries are not.',
      why: 'Language is orthogonal to this distinction — plenty of libraries ship TypeScript too (RxJS, which Angular itself is built on, is one). Being a framework is about **inversion of control**, not which language the source happens to be written in.',
    },
  ];

  // ── Section: anatomy of a component ─────────────────────────────────────────

  /**
   * Ask-before-telling on the property-binding syntax, previewed here because
   * it is a trap that bites in week one: HTML attributes and Angular bindings
   * look similar and are not the same thing. Kept as fields because the
   * prompt needs to show literal double quotes (`class="active"`), which
   * cannot appear unescaped inside a double-quoted template attribute — see
   * `docs/CONTRIBUTING.md` §9.
   */
  protected readonly classAttrPredictPrompt =
    'One more trap worth a first look: is `class="active"` the same kind of thing as `[class.active]="isActive"`?';

  /** Reveal for {@link classAttrPredictPrompt}. */
  protected readonly classAttrPredictAnswer =
    'They look like siblings and do different jobs. `class="active"` is a plain HTML attribute — it always applies that class, full stop. `[class.active]="isActive"` is a **property binding**: the square brackets tell Angular "evaluate this as TypeScript," so the class switches on and off automatically as `isActive` changes. The square brackets are the tell — they mean this is code, not a string — and you will meet the rest of that family properly in **Property & Attribute Binding**.';

  // ── Section: live proof — the counter ───────────────────────────────────────

  /**
   * Sample: the counter component, annotated — the smallest complete Angular
   * component. Deliberately illustrative rather than `WaCounter`'s literal
   * source (which uses `templateUrl`, not an inline `template`) — the point
   * here is the four ideas every component has, not this exact file.
   */
  protected readonly counterSample = `@Component({
  selector: 'app-wa-counter',          // the tag you write: <app-wa-counter />
  template: \`
    <p>{{ count() }}</p>               <!-- interpolation: prints & tracks the signal -->
    <p>doubled: {{ doubled() }}</p>     <!-- derived value, updates automatically -->
    <button (click)="count.set(count() + 1)">+1</button>  <!-- event binding -->
  \`,
})
export class WaCounter {
  count = signal(0);                    // a reactive value, starts at 0
  doubled = computed(() => this.count() * 2);  // recomputes only when count changes
}`;

  /**
   * Line-by-line walkthrough of {@link counterSample}. This is the reader's
   * first exposure to any Angular source, so every symbol gets named — a
   * decorator, a class, a template, a signal — rather than assuming any of it
   * reads as obvious yet.
   */
  protected readonly counterNotes: CodeNote[] = [
    {
      line: 1,
      text: 'An `@Component` is a **decorator** — a function, written with an `@` and placed directly above a class, that attaches extra information (metadata) to the class below it without changing what the class itself does. `({` opens an object literal holding that metadata; it closes on line 8. Nothing runs yet — this is configuration, not executing code.',
    },
    {
      line: 2,
      text: '`selector` is the custom HTML tag Angular registers for this component. Write `<app-wa-counter />` in **any** template in the app and Angular replaces it with a live instance of this class — the same way `<button>` is a tag the browser already understands, except you just defined this one yourself.',
    },
    {
      line: 3,
      text: "`template` is the HTML this component renders, held here as a multi-line string running down to line 7. A real project usually points at a separate `.html` file with `templateUrl` instead (that is exactly what `WaCounter`'s actual source does) — this sample inlines it so the whole component fits in one snippet.",
    },
    {
      line: 4,
      text: 'The double curly braces are **interpolation**. Angular prints whatever `count()` returns, right there in the HTML, and re-prints it automatically the instant `count` changes — nobody wrote code to keep this line up to date.',
    },
    {
      line: 5,
      text: 'The same interpolation, wired to a different value. Nothing links this line to `count` by name — `doubled` recalculates on its own, and interpolation simply shows whatever it currently returns.',
    },
    {
      line: 6,
      text: '`(click)="…"` is an **event binding**: the parentheses mean "run this expression when the click event fires." `count.set(count() + 1)` reads the signal\'s current value, adds one, and writes the result back in — no `addEventListener` anywhere, because this one line is the wiring.',
    },
    {
      line: 9,
      text: '`export` makes the class importable from other files. `class` starts an ordinary TypeScript class — the very thing decorated on line 1. `WaCounter` is just its name; nothing about the word "class" here is specific to Angular.',
    },
    {
      line: 10,
      text: '`signal(0)` creates a **signal**: a reactive box holding the value `0`. `count` is a field on this class pointing at that box. Reading it later as `count()` — note the parentheses — is what lets a template notice when the number inside changes.',
    },
    {
      line: 11,
      text: '`computed(fn)` creates a second signal whose value is **derived** by running `fn`. It is read-only — there is no `doubled.set(...)` anywhere — and its body only reruns when a signal it reads (here, `count`) actually changes.',
    },
  ];

  // ── Section: the cart ────────────────────────────────────────────────────────

  /**
   * Sample: the cart's state, showing one source of truth with two
   * derivations.
   */
  protected readonly cartSample = `export class WaCart {
  items = signal<{ id: number; name: string; price: number }[]>([]); // source of truth
  count = computed(() => this.items().length);                       // derived
  total = computed(() => this.items().reduce((s, i) => s + i.price, 0)); // derived

  add(name: string, price: number) {
    // new array (new reference) → the signal notifies; never push() in place
    this.items.update(list => [...list, { id: nextId++, name, price }]);
  }
}`;

  /** Line-by-line walkthrough of {@link cartSample}. */
  protected readonly cartNotes: CodeNote[] = [
    {
      line: 2,
      text: "The angle brackets are a TypeScript **generic**: they pin down exactly what shape lives inside the signal (an array of objects with `id`, `name` and `price`), so a typo like `.prise` is a compile error rather than a silent bug later. It starts as an empty array — the cart's single source of truth.",
    },
    {
      line: 3,
      text: '`count` never stores a number anywhere. It is a formula: every read of `count()` runs `this.items().length` (or hands back a cached answer, if `items` has not changed since the last read).',
    },
    {
      line: 4,
      text: 'Same idea, a different formula: `reduce` walks the array once, adding `price` across every item. Like `count`, this can never disagree with `items` — there is nothing to keep "in sync" by hand, because it is not a copy of anything.',
    },
    {
      line: 6,
      text: '`add` is an ordinary method — no decorator involved. It takes the two pieces of information a new cart line needs, and does the actual work.',
    },
    {
      line: 8,
      text: "`this.items.update(fn)` calls `fn` with the array's current value and stores whatever it returns. `[...list, {…}]` builds a **brand-new array** holding everything the old one had plus one more object — it never touches `list` itself. That new array is a new reference, and a new reference is exactly what tells the signal to notify its readers.",
    },
  ];

  // ── Section: how an app boots ───────────────────────────────────────────────

  /**
   * Sample: `main.ts` and `bootstrapApplication` — the standalone entry point,
   * with no root `NgModule` in sight.
   */
  protected readonly bootstrapSample = `// main.ts — the single entry point of the app
bootstrapApplication(App, {
  providers: [
    provideRouter(routes),     // turn on routing with your URL → component map
    provideHttpClient(),       // make HttpClient injectable for API calls
  ],
});`;

  /** Line-by-line walkthrough of {@link bootstrapSample}. */
  protected readonly bootstrapNotes: CodeNote[] = [
    {
      line: 2,
      text: '`bootstrapApplication` is a plain function — not a decorator, not a class — that exists for exactly one job: create the root component (`App`) and mount it into the page. This line is the very first thing that runs in the entire app.',
    },
    {
      line: 3,
      text: '`providers` lists app-wide services and features that any component is allowed to ask for, by dependency injection. This is where "batteries included" stops being a slogan: routing and HTTP are opt-in calls right here, not separate packages to wire together yourself.',
    },
    {
      line: 4,
      text: '`provideRouter(routes)` switches on the Angular Router using the URL-to-component map you define in `routes`. Leave this out and `routerLink` and the address bar do nothing.',
    },
    {
      line: 5,
      text: '`provideHttpClient()` makes the `HttpClient` service available to `inject()` anywhere in the app, for calling APIs. Neither call happens automatically — you opt into exactly the features your app actually uses.',
    },
  ];

  // ── Section: questions from the back row ────────────────────────────────────

  /** The doubts a total beginner reliably has and hesitates to ask out loud. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Do I need to know TypeScript before starting this?',
      a: 'Not to get through this page. Angular is TypeScript-first, but nothing here needs more than what a beginner script already uses — variables, functions, classes. Anything TypeScript-specific you hit (like the `readonly` you saw on `count`) gets explained the first time it shows up. Pick up more TypeScript as it comes up, rather than blocking on it now.',
    },
    {
      q: 'Is Angular the same as AngularJS?',
      a: 'No — different frameworks despite the name. **AngularJS** (sometimes called "Angular 1") is the original, now-retired framework from 2010. **Angular** (v2 and up — this curriculum covers v21) is a complete rewrite in TypeScript with almost nothing shared code-wise. If a tutorial mentions `$scope` or `ng-controller`, it is AngularJS — skip it.',
    },
    {
      q: 'Do I have to memorize every API on this page before moving on?',
      a: 'No. This page is a map, not a checklist. The goal is to leave knowing that a component is a class plus a template plus styles, and that state drives the DOM rather than the other way round — not to have `computed()` memorised. That gets its own lesson, with its own demos, a few pages from now. Recognising the shape when you meet it again is enough for today.',
    },
    {
      q: "Why does Angular need a build step at all? Can't I just write HTML, CSS and JS files and open one in a browser?",
      a: "You could — and that is closer to how a plain-library approach can look. Angular's compiler is what turns `{{ count() }}` into a fast, type-checked function ahead of time, and TypeScript itself has to be compiled down to JavaScript the browser can run. The build step is the price of both — and the CLI, in the next lesson, hides almost all of it behind one command.",
    },
    {
      q: 'React seems way more popular — is Angular still worth learning?',
      a: 'Popularity charts move; the underlying ideas mostly don\'t. Components, one-way data flow and reactive state are the shared vocabulary of every modern frontend framework, Angular included — learn them properly here and React, Vue or Svelte read as "the same ideas, different syntax" rather than a fresh mountain. And a large amount of long-lived, hiring software runs on Angular specifically, for exactly the reasons this page keeps circling back to: dependency injection and batteries-included tooling are what large codebases want.',
    },
  ];
}
