import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember, RichText } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * One bug-hunt exercise: a snippet of plain JavaScript with a real defect, the fate it
 * meets in each language, and a line-by-line breakdown of the snippet itself.
 *
 * `code` is deliberately valid in **both** languages unchanged — no annotation is added to
 * it — because the whole point of the exercise is to ask "what happens to this exact file
 * depending on what you saved it as", not to show off TypeScript-only syntax. (That syntax
 * gets its own snippet, {@link paySample}, right before this demo.)
 */
interface BugHunt {
  id: number;
  /** Filename shown in the code-lab's title bar — also doubles as a label. */
  file: string;
  code: string;
  /** Line-by-line notes for {@link code}, recomputed reactively as the reader switches bugs. */
  notes: CodeNote[];
  jsOutcome: string;
  tsOutcome: string;
}

const HUNTS: BugHunt[] = [
  {
    id: 1,
    file: 'greet.js — or .ts?',
    code: `function greet(name) {
  return 'Hi ' + name.toUpperCase();
}

greet(42);`,
    notes: [
      {
        line: 1,
        text: '`name` has no type — nothing after it says what kind of value is allowed. In a `.ts` file with no `noImplicitAny`, an untyped parameter like this is **silently** typed `any`, which turns checking off for it completely.',
      },
      {
        line: 2,
        text: '`.toUpperCase()` exists on **strings**, not numbers. This line is a promise that whatever `name` turns out to be, it has that method.',
      },
      {
        line: 5,
        text: '`greet(42)` — a number, not a string. Because `name` was never annotated, TypeScript has no promise to check this call against, so it compiles exactly like plain JavaScript and waits to fail until this line actually **runs**.',
      },
    ],
    jsOutcome:
      '💥 Crashes at runtime, the instant this line runs: `name.toUpperCase is not a function`. Nothing complained while you typed it and nothing complained when the file loaded — only the call itself blows up, in whatever environment happens to run it first.',
    tsOutcome:
      "❌ Caught while typing — but only once `name` is actually annotated `name: string`. Leave the parameter bare and this compiles exactly like the JavaScript above, and fails at the exact same moment, because an unannotated parameter is quietly `any`. The `.ts` extension isn't what catches this. The colon is.",
  },
  {
    id: 2,
    file: 'user.js — or .ts?',
    code: `const user = { name: 'Ada', age: 36 };

console.log(user.nmae);`,
    notes: [
      {
        line: 1,
        text: 'No annotation needed here at all — TypeScript **infers** the type of `user` straight from the object literal: `{ name: string; age: number }`. That inferred shape becomes something every later line is checked against, for free.',
      },
      {
        line: 3,
        text: "`nmae` is not a key on the inferred shape — `name` is. TypeScript compares the property you asked for against the exact set of keys it recorded on line 1 and refuses to compile a lookup that can't possibly exist. Plain JavaScript keeps no such record, so it just answers `undefined` and moves on.",
      },
    ],
    jsOutcome:
      "🤫 No crash at all. `user.nmae` is simply `undefined`, and the page quietly shows nothing where the name should be. Nobody sees an error — they see a blank space and assume that's just how the page looks.",
    tsOutcome:
      "❌ Caught while typing, with zero annotations added anywhere: `Property 'nmae' does not exist on type '{ name: string; age: number }'. Did you mean 'name'?` TypeScript **inferred** the object's shape from the literal above and checks every later read against it automatically.",
  },
  {
    id: 3,
    file: 'price.js — or .ts?',
    code: `const input = document.querySelector('input');
const price = input.value;

const total = price * 1.2;`,
    notes: [
      {
        line: 1,
        text: "`document.querySelector('input')` — TypeScript ships with types for the whole DOM, and it recognises the string `'input'` specifically, so the result here is typed `HTMLInputElement | null` **without you writing a single annotation**. The `| null` is TypeScript being honest: nothing guarantees an `<input>` actually exists on the page.",
      },
      {
        line: 2,
        text: '`.value` on an input element is typed `string` — always, even for `type="number"` inputs. The browser only ever hands you text; deciding it\'s a number is a decision **you** make, not one the DOM makes for you.',
      },
      {
        line: 4,
        text: '`price` is `string`, and `*` on a string is not legal TypeScript. This line is flagged the moment it\'s written — long before anyone types "10,50" into a form and finds out the hard way.',
      },
    ],
    jsOutcome:
      "🤔 Works — some of the time. `'10' * 1.2` coerces cleanly to `12`. It keeps working for every tester who types plain digits, and breaks the day a real customer pastes `'10,50'` from a spreadsheet: `'10,50' * 1.2` is `NaN`, silently, weeks after anyone tested this code.",
    tsOutcome:
      "❌ Caught immediately, and for free: TypeScript's built-in DOM types already know `.value` is `string`, with no annotation from you at all. `price * 1.2` is flagged the moment it's written — `The left-hand side of an arithmetic operation must be of type 'any', 'number' or 'bigint'` — long before the one spreadsheet paste that would have broken it in production.",
  },
];

/**
 * Lesson: Why TypeScript & Angular — compile-time vs runtime error catching, taken all the
 * way down to the mechanism (what the compiler actually compares, and why an unannotated
 * parameter still slips through); TypeScript as a superset with an honest counterweight
 * (`any`/`as` switch checking off, so ".ts" alone is not safety); framework vs library and
 * inversion of control, argued from a diagram rather than asserted; where Angular sits next
 * to React and Vue; how the two tools are designed around each other (`strictTemplates`);
 * and the curriculum map that sends the reader into the rest of the app.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`), copying
 * the section rhythm of the reference implementation, `expert/change-detection`: pose the
 * problem, then an analogy, then the mechanism in several modes.
 *
 * ## Why the bug-hunt demo's code sample is a reactive `<app-code-lab>`
 *
 * The three {@link HUNTS} snippets used to render as a single `.code pre` bound to
 * `{{ hunt().code }}`. That selector is exactly what the app-wide syntax-highlighting sweep
 * in `app.ts` targets — but that sweep runs once, on navigation, by overwriting the
 * element's `innerHTML`. A `.code pre` whose *content* keeps changing after that (every
 * click of a hunt button) is fighting the sweep for ownership of the same DOM node, and the
 * outcome is not something this lesson should depend on staying lucky. `<app-code-lab>`
 * sidesteps the whole problem: it derives its highlighted lines from `code()` with its own
 * `computed()`, so switching {@link hunt} re-highlights correctly, on every click, by
 * construction — and it gets each bug a full line-by-line annotation for free, which a
 * plain `.code` block never could.
 */
@Component({
  selector: 'app-lesson-why-typescript-angular',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
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
  templateUrl: './why-typescript-angular.html',
  styleUrl: './why-typescript-angular.css',
})
export class WhyTypescriptAngular {
  /**
   * The bug-hunt exercises.
   */
  protected readonly hunts = HUNTS;
  /**
   * Which exercise is selected.
   */
  protected readonly huntId = signal(1);
  /**
   * The selected exercise. The non-null assertion is safe because {@link huntId}
   * is only ever set from an id in {@link hunts}.
   */
  protected readonly hunt = computed(() => this.hunts.find((h) => h.id === this.huntId())!);

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Web Basics track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'How the Web Works', id: 'how-the-web-works' },
    { label: 'The DOM & Events', id: 'dom-and-events' },
    { label: 'Why TypeScript & Angular?' },
  ];

  /**
   * Sample: a fully annotated function — the actual TypeScript syntax the bug-hunt
   * snippets deliberately avoid, since those have to stay valid in both languages.
   */
  protected readonly paySample = `function pay(amount: number, currency: 'USD' | 'EUR') {
  return amount + ' ' + currency;
}

pay(42, 'USD');     // ✅ compiles
pay('42', 'USD');   // ❌ Argument of type 'string' is not assignable to parameter of type 'number'.`;

  /** Line-by-line walkthrough of {@link paySample}. */
  protected readonly payNotes: CodeNote[] = [
    {
      line: 1,
      text: "The colon is a **type annotation**: `amount: number` means 'this must be a number, or the file will not compile.' `currency: 'USD' | 'EUR'` is a **literal union type** — not `string`, but exactly one of these two specific strings. `|` reads as 'or.'",
    },
    {
      line: 5,
      text: "Types line up: `42` is a `number`, `'USD'` is one of the two allowed strings. TypeScript has nothing to say, so this call is exactly as valid as the plain JavaScript underneath it.",
    },
    {
      line: 6,
      text: "`'42'` is a **string** — even though it's 'a number, as text.' The compiler doesn't run this line to find out what would happen; it compares the type you wrote against the type you promised and refuses to proceed if they disagree.",
    },
  ];

  /**
   * The exchange a rejected call actually sets off — dramatising {@link payNotes}'
   * line 6. The relationship learners get backwards is that the compiler somehow
   * "runs" the bad call to discover it fails; it never does. It only ever compares
   * promises against usages, once, and moves on.
   */
  protected readonly compilerTalk: BubbleTurn[] = [
    {
      who: 'Your code',
      says: "I'm calling `pay('42', 'USD')` — that's basically a number, right?",
    },
    {
      who: 'TypeScript',
      says: "`'42'` is a **string**. `pay` promised its first parameter would be a `number`. I'm not letting this through.",
    },
    {
      who: 'Your code',
      says: "But `'42' * 2` works fine once this actually runs — JavaScript coerces it.",
    },
    {
      who: 'TypeScript',
      says: "Sure, **at runtime**. I'm not runtime. I never see this code execute — I only compare what you wrote against what you promised, once, before any of it runs.",
    },
    { who: 'Your code', says: "Fine — `pay(Number(raw), 'USD')`." },
    { who: 'TypeScript', says: 'Now we agree. Compiling.' },
  ];

  /** Sample: a template typo, kept out of the .html so Angular never parses the braces inside it as its own template syntax. */
  protected readonly templateTypoSample = `<p>{{ user.nmae }}</p>`;

  /**
   * The prompt for the `strictTemplates` {@link Predict}, kept out of the `.html` for
   * the same reason as {@link templateTypoSample}: it names the interpolation
   * `{{ user.nmae }}` in prose, and writing that literally in the template's own
   * markup — even inside a plain string attribute — would have Angular try to parse
   * it as a real binding against a `user` property this component doesn't have.
   */
  protected readonly templateTypoPrompt =
    "This app's own templates are type-checked too. Say a component has `user: { name: string }`, and a template somewhere binds `{{ user.nmae }}` — the exact same typo as the bug-hunt demo above. Does Angular catch it, and if so, when?";

  /**
   * Sample: the TypeScript source for the erasure {@link Compare}, kept as a `.ts`
   * field (rather than written inline as HTML) so its braces are just string data,
   * never something Angular's own template parser has to be kept away from.
   */
  protected readonly erasureTsSample = `function double(n: number): number {
  return n * 2;
}

double(21);`;

  /** Sample: the same function after `tsc` erases every annotation. */
  protected readonly erasureJsSample = `function double(n) {
  return n * 2;
}

double(21);`;

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: '"TypeScript prevents runtime errors" — is that actually true?',
      a: "Only for the **type-shaped** class of them — wrong argument types, typo'd property names, string/number mix-ups. It catches those because it checks the shape of your data against what you promised, before anything runs. It has no opinion on whether your logic is correct, and it trusts a `fetch()` response to match the type you gave it, whether or not the server actually sends that shape.",
    },
    {
      q: "Doesn't writing all these types just slow me down?",
      a: "A little, up front — you're deciding some things you could have left vague. Inference claws most of it back: write `const n = 5` and TypeScript already knows `n` is a `number`, with zero annotations from you. The extra typing shows up mainly at function boundaries, which is exactly where a mismatch is most worth catching.",
    },
    {
      q: 'If `any` turns checking off, why does it exist at all?',
      a: "Because sometimes you genuinely don't know a type yet — untyped third-party JS, data shaped only at runtime, a fast prototype. `any` is an honest escape hatch **when you reach for it on purpose**. The trap is picking it up by accident: an unannotated parameter is `any` by default unless `noImplicitAny` is on, which is why a codebase's real safety is a question of how much `any` (and its cousin `as`) is hiding in it, not whether the file extension says `.ts`.",
    },
    {
      q: 'What does "the framework calls your code" actually mean, concretely, in Angular?',
      a: 'You never write `new MyComponent()` and place it in the DOM yourself. You define the class; Angular constructs it when the router or a parent template needs one, calls your lifecycle hooks at defined moments, re-renders it when your data changes, and destroys it on navigation. Your code fills in the blanks of a control flow Angular owns, not the other way around.',
    },
    {
      q: 'When would plain JavaScript, no framework at all, actually be the right call?',
      a: "A small, mostly-static page with a sprinkle of interactivity — a marketing page with one form, a single widget. Frameworks earn their weight once state, screens and team size grow; for a 50-line enhancement, Angular's build pipeline is pure overhead. Matching tool weight to problem weight is a skill in itself.",
    },
  ];

  /**
   * Self-test 1 — the implicit-`any` trap, the single most important correction in
   * the lesson. The distractors are the three real misreadings of what ".ts" buys
   * you: that it checks types it was never told about, that it "fixes" a bad call
   * at runtime, and that inference alone would have caught an unannotated misuse.
   */
  protected readonly implicitAnyQuizOptions: QuizOption[] = [
    {
      text: 'TypeScript refuses to compile — passing a number where a string is expected is exactly what it exists to catch.',
      why: "This is the trap in believing 'it's a `.ts` file' is the safety. Without an annotation, `id`'s type defaults to **implicit** `any`, which turns checking off for that parameter entirely — TypeScript raises nothing because it isn't checking. Add `id: string` to the signature and this exact call would fail to compile.",
    },
    {
      text: 'It compiles, and crashes at runtime with `id.trim is not a function` — the same failure as if the file were still `.js`.',
      correct: true,
      why: 'Right. Renaming a file to `.ts` does nothing on its own — safety comes from **annotations**, or from `noImplicitAny`, which forces you to write them. An unannotated parameter is silently `any`, and `any` is the one type TypeScript never checks. `.ts` is a tool, not a spell — it only protects the code you actually put a type on.',
    },
    {
      text: 'It compiles and runs correctly — TypeScript converts the number to a string automatically before the call.',
      why: 'TypeScript never converts anything at runtime — it has no runtime of its own. It either accepts what you wrote as written, or refuses to compile it. If this runs without error, that is because nothing was checked, not because anything was silently fixed.',
    },
    {
      text: "It fails to compile with `Property 'trim' does not exist on type 'number'`.",
      why: "That's the message you'd get if `id` were explicitly typed `number` — but it isn't typed at all here. An **inferred or implicit** `any` parameter gets no such check. This describes what `noImplicitAny` would force, not what a bare `.ts` file with no annotations gives you for free.",
    },
  ];

  /**
   * Self-test 2 — library vs framework, argued from the {@link ioc} diagram rather
   * than restated as a definition. Each wrong option names a real Angular API that
   * *looks* like something you call, and the `why` corrects exactly that.
   */
  protected readonly iocQuizOptions: QuizOption[] = [
    {
      text: '`array.map(fn)` — you decide exactly when this runs.',
      correct: true,
      why: 'Exactly. You call `map`, whenever you choose, and it hands the result straight back to you. Nothing about it decides anything on your behalf — that is the whole definition of a library: it offers functions, and you stay in control of the call.',
    },
    {
      text: "`ngOnInit()` — you write it, so you're the one who decides when it runs.",
      why: 'Backwards. You write the **body**, but you never call `ngOnInit()` yourself — Angular does, at a moment it chooses, when it constructs the component. Supplying the code that runs is not the same as controlling when it runs.',
    },
    {
      text: "An `@Injectable` service's constructor — you write `new MyService()` wherever you need one.",
      why: "In an Angular app you almost never write `new` for a service — the injector constructs it and hands you the instance when something asks for it by type. Reaching for `new` yourself is usually a sign you've stepped **outside** the framework's control, not proof you're using a library.",
    },
    {
      text: "A route guard's `canActivate` — you call it manually before every navigation.",
      why: 'The router calls it, at a moment the router decides (mid-navigation), and reacts to whatever it returns. You wrote the function; you never call it.',
    },
  ];

  /**
   * The framework's control diagram: control starts outside the reader's own code
   * (the browser, then Angular) and only reaches their method last — the exact
   * inversion a library never performs.
   */
  protected readonly ioc = {
    core: { label: 'Your component method', sub: 'ngOnInit(), a click handler…' },
    rings: [
      { label: 'The browser', sub: 'a click, a route change, a timer fires' },
      { label: 'Angular', sub: 'decides whether, when and how to call you' },
    ],
  };

  /**
   * The .js → .ts migration ladder from the coverage sweep: rename, then strict
   * flags one at a time, then the strictest flag last — the order most real
   * codebases actually follow, rather than flipping every flag on day one.
   */
  protected readonly migrationLadder: FlowStep[] = [
    {
      label: 'Rename .js → .ts',
      detail: 'Every valid JS file is already valid TS — nothing is checked yet, nothing breaks.',
    },
    {
      label: 'Turn on strict flags, one at a time',
      detail:
        '`strictNullChecks` first, usually. Each flag lights up files that were quietly unsafe all along.',
      tone: 'accent',
    },
    {
      label: 'Fix what lights up',
      detail:
        'File by file, not all at once — a half-migrated codebase is still allowed to compile.',
    },
    {
      label: 'noImplicitAny last',
      detail:
        'The strictest flag of all. By now most real gaps are already gone, so this mostly catches what is left.',
      tone: 'good',
    },
  ];
}
