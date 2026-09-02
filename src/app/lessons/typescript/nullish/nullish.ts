import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * A deliberately hole-y shape: both the address and its city are optional, so
 * the demo needs two links of optional chaining to reach the city.
 */
interface Profile {
  name: string;
  address?: { city?: string };
}

/**
 * The falsy values worth distinguishing. `0`, `''` and `false` are falsy but
 * perfectly valid data; `null` and `undefined` are absence. Conflating the two
 * groups is exactly the bug `??` exists to prevent — and, as the third section
 * of this lesson shows, a default parameter draws that line in a different
 * place again.
 */
type Falsyish = 0 | '' | false | null | undefined;

/**
 * One falsy value with a label, for the `||` vs `??` vs default-value bench.
 */
interface FalsyCase {
  label: string;
  value: Falsyish;
}

const FALSY_CASES: FalsyCase[] = [
  { label: '0', value: 0 },
  { label: "''", value: '' },
  { label: 'false', value: false },
  { label: 'null', value: null },
  { label: 'undefined', value: undefined },
];

// ── Long copy and code samples ──────────────────────────────────────────────
//
// Kept out of the template per CONTRIBUTING §2A.2 / §3.2: it keeps the .html
// scannable, keeps every multi-line sample diffable, and — because several of
// these contain a literal `{` — sidesteps Angular's template parser reading a
// brace in static text as the start of an ICU expression.

/**
 * The relay for `user?.address?.city` when `address` is the link that turns
 * out to be missing. Staged as a dialogue rather than described in prose
 * because the relationship people get backwards is *which* checkpoint stops
 * the chain, and a conversation makes that concrete: only one party ever says
 * "I stop here."
 */
const CHAIN_TALK: BubbleTurn[] = [
  { who: 'Your code', says: 'Give me `user?.address?.city`.' },
  { who: 'The first `?.`', says: '`user` is not null or undefined. Carry on — to `.address`.' },
  { who: 'The second `?.`', says: '`address` turned out to be `undefined`. Right here, I stop.' },
  { who: 'The rest of the chain', says: '`.city` never runs. Not read, not evaluated — nothing.' },
  {
    who: 'The whole expression',
    says: 'My value is `undefined`. Not `null` — even though the link that was actually missing here was `address`, not `user`.',
  },
];

/**
 * The idiom, drawn as a two-stage pipeline: `?.` converts "might crash" into
 * "might be undefined", and `??` converts that into "always a value".
 */
const IDIOM_STEPS: FlowStep[] = [
  {
    label: 'user?.address?.city',
    detail: 'Might crash → might be undefined. One `?.` per link that can actually be nullish.',
    tone: 'accent',
  },
  {
    label: "?? 'Unknown'",
    detail: 'Might be undefined → always a value. The floor under the whole expression.',
    tone: 'good',
  },
  {
    label: 'const city: string',
    detail: 'The compiler agrees. No assertion, no cast — nothing left to prove.',
    tone: 'good',
  },
];

/**
 * `user?.address?.city ?? 'Unknown'`, unrolled by hand into the plain `if`s
 * it means. Not a claim about literal compiler output — a mental unrolling,
 * chosen because it makes the "always undefined, never null" rule and the
 * short-circuited-tail rule visible as ordinary control flow instead of magic.
 */
const DESUGAR_SAMPLE = `// Stage 1 — what \`user?.address?.city\` means on its own:
let rawCity: string | undefined;
if (user === null || user === undefined) {
  rawCity = undefined; // user itself was nullish
} else if (user.address === null || user.address === undefined) {
  rawCity = undefined; // address was nullish — .city never runs
} else {
  rawCity = user.address.city;
}

// Stage 2 — what \`?? 'Unknown'\` does to that result:
const city: string = rawCity === null || rawCity === undefined ? 'Unknown' : rawCity;`;

const DESUGAR_NOTES: CodeNote[] = [
  {
    line: 3,
    text: 'This is what "nullish" means, spelled out: two comparisons, no coercion. Every `?.` and `??` in this lesson runs exactly this check at each step — never a truthiness test.',
  },
  {
    line: 4,
    text: 'Whichever link turns out to be missing, the result is always the same constant — `undefined`. Never `null`, even here, where the thing that was actually absent could just as easily have been `null`. Optional chaining normalizes every short-circuit to one value.',
  },
  {
    line: 5,
    text: 'Reached only if `user` survived line 3. This is the **second** link, and it needs its **own** nullish check — the `?.` after `user` protects nothing past `.address`. Delete this check and a missing `address` throws instead of short-circuiting.',
  },
  {
    line: 8,
    text: 'The only branch that actually reads `.city`. It is reached only once every earlier link has been proven non-nullish, which is why this line can never throw.',
  },
  {
    line: 12,
    text: "The whole job of `??`, unrolled: check `rawCity` for null-or-undefined, and only then substitute the fallback. Notice what it is **not** checking — `rawCity`'s truthiness. An empty string or a `0` sitting in `rawCity` would sail straight through untouched.",
  },
];

/**
 * The coverage-sweep finding this lesson exists to fix: a destructuring
 * default silently keeps an explicit `null` instead of replacing it, because
 * `.json()` is typed `Promise<any>` and hides the mismatch from the compiler.
 */
const API_BUG_SAMPLE = `async function loadProfile(): Promise<string[]> {
  const body = await fetch('/api/profile').then((r) => r.json());
  // body really is: { name: 'Ada', tags: null }  ← the API sends explicit nulls

  const { tags = [] } = body;
  return tags.map((t: string) => t.toUpperCase());
  //     ^ TypeError: Cannot read properties of null (reading 'map')
}`;

const API_BUG_NOTES: CodeNote[] = [
  {
    line: 2,
    text: '`.json()` is typed to return `Promise<any>` in the DOM lib — there is no shape-checking here at all. `body` is `any`, so TypeScript will not warn about any of the next three lines, however wrong they turn out to be. This bug is not a compiler failure; it is a compiler that was never asked.',
  },
  {
    line: 3,
    text: "Real APIs do this constantly: a field the server has nothing to say about comes back as literal `null`, not as a missing key. `JSON.stringify` even encourages it — it **drops** `undefined` properties but **keeps** `null` ones, so `null` is often the only spelling a server has for 'nothing here'.",
  },
  {
    line: 5,
    text: '`= []` is a **destructuring default**, and at a glance it looks exactly like `??`. It is not: a destructuring default fires only when the property is `undefined` — missing entirely, or explicitly set to `undefined`. `tags` is `null`, not `undefined`, so the default is skipped and `tags` comes out as `null`.',
  },
  {
    line: 6,
    text: "`tags` is `null` at this point, and `null` has no `.map`. `TypeError: Cannot read properties of null (reading 'map')`, thrown at runtime, in production, the first time this endpoint actually omits the field.",
  },
];

/**
 * Two more facts about defaults, kept as one plain illustration rather than
 * an annotated CodeLab: nested destructuring defaults each fire on their own
 * `undefined` independently, and a default expression is evaluated lazily —
 * at most once, and only when the parameter is actually missing.
 */
const NESTED_DEFAULT_SAMPLE = `// nested destructuring defaults — each "= ..." fires only on ITS OWN undefined
function greeting({ name, prefs: { theme = 'dark' } = {} } = {}) {
  return name + ' — ' + theme;
}

greeting();                                       // 'undefined — dark'  (prefs missing -> {} -> theme missing -> 'dark')
greeting({ name: 'Ada', prefs: {} });              // 'Ada — dark'        (prefs present, theme missing)
greeting({ name: 'Ada', prefs: { theme: null } }); // 'Ada — null'        theme IS null, not undefined: default skipped

// and a default expression is evaluated lazily — at most once, only when needed:
function withDefault(x = sideEffect()) {
  return x;
}
withDefault('given'); // sideEffect() never runs
withDefault(); // sideEffect() runs exactly once, right here`;

/**
 * The logical-assignment trio, plus proof that the right-hand side of `??=`
 * is skipped entirely — not just the assignment — when it doesn't fire.
 */
const LOGICAL_ASSIGN_SAMPLE = `options.timeout ??= 3000;     // assign only if currently null/undefined
cache.user ||= fetchGuest();  // assign only if currently falsy
draft &&= sanitize(draft);    // assign only if currently truthy

// the right-hand side is skipped entirely when the assignment does not fire:
let hits = 0;
const loud = () => (hits++, 'computed');

let cached: string | undefined = 'already set';
cached ??= loud();  // loud() never runs
console.log(hits);  // 0`;

const LOGICAL_ASSIGN_NOTES: CodeNote[] = [
  {
    line: 1,
    text: '`??=` reads `options.timeout`, and if — and only if — it is `null` or `undefined`, assigns `3000` to it. If `timeout` is already `0`, a real deliberate value, this line does nothing, which is exactly the defaulting behavior `||=` gets wrong.',
  },
  {
    line: 2,
    text: "`||=` runs its right side whenever the left is **falsy**. If `cache.user` is `0`, `''` or `false` for some legitimate reason, this overwrites it — which is why `||=` earns its place in this trio far less often than the other two.",
  },
  {
    line: 3,
    text: "`&&=` is the mirror image: it assigns only when the current value is truthy. Handy for 'transform this, but only if it already exists' — sanitizing a draft that might not have been created yet, without a separate `if`.",
  },
  {
    line: 7,
    text: '`loud` counts every time it actually runs, using the comma operator to increment and return in one expression — a small trick so the whole logger fits on one line with no block body to hide inside.',
  },
  {
    line: 10,
    text: "This is the payload of the whole sample. `cached` is already `'already set'` — non-nullish — so `??=` doesn't just skip the assignment, it skips evaluating `loud()` **at all**. Compare that to `cached = cached ?? loud()`, which calls `loud()` on every execution whether the result is used or not.",
  },
  {
    line: 11,
    text: '`0`. `loud()` genuinely never ran. This is what makes `??=` the right tool for lazy initialization — an expensive default (a network call, a heavy computation) pays its cost only the first time it is actually needed.',
  },
];

/**
 * The two `!` flavors: non-null assertion in expression position, and
 * definite-assignment assertion in declaration position. Same character,
 * different position, different promise — the pairing people conflate.
 */
const BANG_ASSERT_SAMPLE = `// 1. Non-null assertion (expression position): "trust me, not null"
const el = document.querySelector('#app')!;
el.classList.add('ready');

// 2. Definite assignment assertion (declaration position):
class Report {
  data!: string[]; // populated by ngOnInit, not the constructor
}`;

const BANG_ASSERT_NOTES: CodeNote[] = [
  {
    line: 2,
    text: "`querySelector` returns `Element | null` — it cannot know in advance whether your selector matches anything. The trailing `!` tells the compiler 'trust me, this is never null,' with **zero runtime check**. Get it wrong and `el` is `null` here, silently.",
  },
  {
    line: 3,
    text: 'This line only compiles because of the assertion on line 2 — without it, `el` would still be `Element | null` and `.classList` would be a compile error. Nothing about THIS line changed; the promise was made one line up.',
  },
  {
    line: 7,
    text: "`data!: string[]` is a **definite assignment assertion** — the `!` sits right after the property name, not after a value. It tells the compiler 'trust me, this field is assigned before anything reads it,' even though there is no initializer and no assignment in the constructor. This is the flavor people mix up with the first one: same character, completely different position, completely different promise.",
  },
];

/** The two expressions the parens-trap Predict asks the reader to compare. */
const PARENS_SAMPLE = `const user: { address?: { city: string } } | null = null;

user?.address.city;    // ?
(user?.address).city;  // ?`;

/**
 * The self-test on `||` silently swallowing a deliberate `0` — the canonical
 * interview question for this lesson, kept from the original page.
 */
const VOLUME_QUIZ: QuizOption[] = [
  {
    text: '50 — the default overrides the real, muted value.',
    correct: true,
    why: "Exactly the bug. `||` doesn't ask 'is a value stored?' — it asks 'is the value truthy?', and `0` fails that test even though it is precisely the value the user chose. The fix is `settings.volume ?? 50`, which asks the right question: null-or-undefined, not truthy-or-falsy.",
  },
  {
    text: '0 — the stored value always beats a fallback.',
    why: 'That is the behavior you want, and it is what `??` gives you. This code uses `||`, though, which discards **any** falsy value regardless of whether it was deliberately set.',
  },
  {
    text: '50 the first time only, then 0 forever after.',
    why: "`||` is not stateful — there is no caching or one-time check here. It re-evaluates the same way on every single read, so the bug is permanent and consistent, not intermittent. That consistency is actually why it is easy to miss: it never looks like it's misbehaving, it just looks wrong.",
  },
  {
    text: "A TypeError — `||` doesn't work on numbers.",
    why: '`||` works on every type; it only ever examines truthiness. Nothing throws here — the code runs cleanly and produces the wrong number silently, which is worse than a crash because nothing points at the bug.',
  },
];

/**
 * Question text for the defaults-quiz, kept as a field (rather than an inline
 * template attribute) because it contains a literal `{`/`}` pair, which the
 * Angular template parser would otherwise read as the start of an ICU
 * expression in static text.
 */
const DEFAULTS_QUIZ_QUESTION =
  '`function connect(retries = 3) { ... }` is called as `connect(null)`. What is `retries` inside the function?';

/**
 * The self-test on the coverage-sweep finding: defaults trigger on
 * `undefined` only, never on `null`.
 */
const DEFAULTS_QUIZ: QuizOption[] = [
  {
    text: '`null` — the exact value you passed, untouched.',
    correct: true,
    why: "Default values fire on exactly one condition: the argument is `undefined` — omitted, or explicitly `undefined`. `null` is a value you chose on purpose, so JavaScript leaves it alone. If you want `null` treated as absent too, that's `retries ?? 3` inside the function, or `connect(input ?? 3)` at the call site — the default parameter alone won't do it.",
  },
  {
    text: '`3` — `null` is nullish, and defaults treat nullish values as absent.',
    why: "That's `??`'s rule, not a default parameter's. The two look like siblings and agree on everything except this one input: `??` catches both `null` and `undefined`; a default parameter catches only `undefined`.",
  },
  {
    text: '`undefined` — passing `null` clears the parameter back to its unset state.',
    why: 'Nothing clears anything. The parameter holds whatever you actually passed. You passed `null`, so `retries` is `null` — a real, present value, not an absent one.',
  },
  {
    text: "It throws — you can't pass `null` where a default is declared.",
    why: 'A default parameter is sugar for a check-and-assign at the top of the function body; nothing about it validates the argument. Any value is accepted silently, `null` included — which is exactly why this bug is so easy to ship.',
  },
];

/** The doubts this lesson reliably leaves behind. */
const QUESTIONS: FaqItem[] = [
  {
    q: 'When is `x!.y` defensible over `x?.y`?',
    a: "When absence would be a programmer error, not a normal state — reading a map entry you inserted two lines earlier, say. There, `?.` would quietly continue with `undefined` and move the failure somewhere mysterious downstream, while `!` at least fails at the true location if you're wrong. Better still: an explicit guard that throws a message naming what went missing. Rule of thumb: `?.` for 'absence is normal', an assertion or a real throw for 'absence is a bug'.",
  },
  {
    q: 'I turned strictNullChecks off — do `?.` and `??` even matter then?',
    a: "They still run exactly the same way at runtime — both are real JavaScript operators, not compiler tricks, so `?.`'s short-circuit and `??`'s null-or-undefined check happen with or without the flag. What changes is whether the **compiler** makes you deal with absence in the first place: with the flag off, `null` and `undefined` are silently assignable to everything, so nothing forces the check to exist at all. Turn it off and these operators become optional insurance instead of a requirement — which is exactly why virtually every modern TypeScript project, Angular's own defaults included, turns it on.",
  },
  {
    q: 'My API sends `null` for missing fields. Why not `undefined`, like TypeScript wants?',
    a: "Because JSON has no `undefined` — it isn't a JSON value, so a server literally cannot send it. `null` is the only spelling 'nothing here' can take over the wire, which is also why `JSON.stringify` drops `undefined` properties entirely but keeps `null` ones. The common house rule: normalize at the boundary, once, with `??` — `const tags = body.tags ?? []` — so only one absent value (`undefined`, your app's own convention) flows through the rest of the codebase, instead of two.",
  },
  {
    q: "Does `??=` evaluate its right-hand side even when it doesn't end up assigning?",
    a: "No — and that's the whole reason it exists. `cached ??= expensive()` only calls `expensive()` if `cached` is currently `null` or `undefined`; if `cached` already holds a value, the call never happens. Compare that to `cached = cached ?? expensive()`, which calls `expensive()` on every single execution, whether or not the result is used. `??=` (and its siblings `||=`/`&&=`) are the one place in this lesson where skipping the right-hand side, not just the assignment, is the actual point.",
  },
  {
    q: 'How is `user?.greet?.()` different from `user?.greet()`?',
    a: "Each `?.` only guards the thing directly to its **left**. The first one checks that `user` itself isn't nullish before reading `.greet`. The second one — the one right before the parentheses — checks that `greet` itself isn't nullish before calling it, which matters when `greet` is an optional callback prop that might genuinely not be provided. Drop the second `?.` and `user?.greet()` throws `TypeError: user.greet is not a function` the moment `greet` is missing, even though `user` was never the problem.",
  },
];

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Lesson: optional chaining & nullish coalescing — exact short-circuit
 * semantics (`?.` always yields `undefined`, never `null`; the whole chain
 * tail is skipped, not just the next link), the `||` vs `??` falsy-vs-nullish
 * distinction with a live comparison bench, the third member of the family
 * that nobody mentions (default parameters and destructuring defaults trigger
 * on `undefined` only, never on `null` — a live API bug, not a curiosity),
 * the logical-assignment trio and the laziness that makes `??=` useful, both
 * flavors of the `!` assertion, the syntax positions `?.` is simply illegal
 * in, `noUncheckedIndexedAccess`, and how all of it reads in Angular
 * templates.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape set by `expert/change-detection`. The teaching order:
 *
 * 1. **Pose the problem first.** The lesson opens on the crash three-deep
 *    property access causes, and puts a napkin prediction in front of the
 *    reader before naming either operator.
 * 2. **Analogy, then vocabulary.** A chain of checkpoints — not one lock —
 *    gives the reader somewhere to put "short-circuits the whole tail" before
 *    that phrase appears.
 * 3. **The same idea in four modes** — a dialogue staging exactly which
 *    checkpoint stops a chain, a diagram of the two-operator idiom as a
 *    pipeline, a hand-unrolled `if`-equivalent, and two live demos.
 * 4. **The trap nobody teaches gets a section of its own.** Default
 *    parameters and destructuring defaults look like a third spelling of
 *    `??` and are not: they trigger on `undefined` only, never on `null`,
 *    which is a live, silent bug the moment an API sends an explicit
 *    `null` — see `docs/COVERAGE-SWEEP.md`'s finding for this lesson.
 *
 * ## Demos
 *
 * Two, both signal-driven: the optional-chaining demo (full / missing-address
 * / null-profile, reaching a computed `city()` through two guarded links),
 * and the falsy-vs-nullish-vs-default bench (pick a falsy value, compare all
 * three operators against it at once).
 */
@Component({
  selector: 'app-lesson-ts-nullish',
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
  ],
  templateUrl: './nullish.html',
  styleUrl: './nullish.css',
})
export class Nullish {
  // ── Demo 1: optional chaining through a partial profile ───────────────────

  /**
   * The profile in the optional-chaining demo. Starts `null` so the demo
   * opens on the case that would throw without `?.`.
   */
  protected readonly profile = signal<Profile | null>(null);

  /** Loads a complete profile — every link in the chain present. */
  protected full(): void {
    this.profile.set({ name: 'Ada', address: { city: 'London' } });
  }
  /** Loads a profile with no address — the middle link missing. */
  protected partial(): void {
    this.profile.set({ name: 'Ada' });
  }
  /** Clears the profile entirely — the outermost link missing. */
  protected empty(): void {
    this.profile.set(null);
  }

  /**
   * The city, reached through two optional links with a fallback.
   *
   * One expression that survives all three demo states: without `?.` this
   * throws on a null profile, and without `??` it renders `undefined`.
   */
  protected city(): string {
    return this.profile()?.address?.city ?? 'Unknown';
  }

  // ── Demo 2: `||` vs `??` vs a default value, side by side ─────────────────

  /** The falsy values to compare. */
  protected readonly falsyCases = FALSY_CASES;
  /** Which one is selected. */
  protected readonly picked = signal<FalsyCase>(FALSY_CASES[0]);

  /**
   * The selected value through `||`.
   *
   * Falls back on **any** falsy value — so a real `0` or `''` is silently
   * replaced. Shown beside {@link nullishResult} and {@link defaultResult} so
   * the three-way difference is visible rather than asserted.
   */
  protected orResult(): string {
    const v = this.picked().value;
    return JSON.stringify((v || 'fallback') as unknown);
  }

  /**
   * The selected value through `??`. Falls back only on `null` or
   * `undefined`, so `0` and `''` survive.
   */
  protected nullishResult(): string {
    const v = this.picked().value;
    return JSON.stringify((v ?? 'fallback') as unknown);
  }

  /**
   * What a default parameter would do with the same value — the third
   * column, and the whole point of the "third member of the family"
   * section further down. A default fires on exactly one test: `=== undefined`.
   * `null` is left completely untouched, unlike with `??`.
   */
  protected defaultResult(): string {
    const v = this.picked().value;
    return JSON.stringify((v === undefined ? 'fallback' : v) as unknown);
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Language Features track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Decorators', id: 'ts-decorators' },
    { label: 'Modules', id: 'ts-modules' },
    { label: 'Async', id: 'ts-async' },
    { label: 'Nullish Coalescing' },
  ];

  /** The relay dialogue for {@link CHAIN_TALK}. */
  protected readonly chainTalk = CHAIN_TALK;

  /** The two-stage idiom, drawn as a pipeline. */
  protected readonly idiomSteps = IDIOM_STEPS;

  /** Sample: `user?.address?.city ?? 'Unknown'`, unrolled by hand. */
  protected readonly desugarSample = DESUGAR_SAMPLE;
  /** Line-by-line walkthrough of {@link desugarSample}. */
  protected readonly desugarNotes = DESUGAR_NOTES;

  /** Sample: the destructuring-default-vs-null API bug. */
  protected readonly apiBugSample = API_BUG_SAMPLE;
  /** Line-by-line walkthrough of {@link apiBugSample}. */
  protected readonly apiBugNotes = API_BUG_NOTES;

  /** Sample: nested destructuring defaults, and the laziness of a default expression. */
  protected readonly nestedDefaultSample = NESTED_DEFAULT_SAMPLE;

  /** Sample: the logical-assignment trio, plus proof `??=` skips its right side entirely. */
  protected readonly logicalAssignSample = LOGICAL_ASSIGN_SAMPLE;
  /** Line-by-line walkthrough of {@link logicalAssignSample}. */
  protected readonly logicalAssignNotes = LOGICAL_ASSIGN_NOTES;

  /** Sample: the two `!` assertion flavors. */
  protected readonly bangAssertSample = BANG_ASSERT_SAMPLE;
  /** Line-by-line walkthrough of {@link bangAssertSample}. */
  protected readonly bangAssertNotes = BANG_ASSERT_NOTES;

  /** Sample for the parens-defeat-short-circuiting Predict. */
  protected readonly parensSample = PARENS_SAMPLE;
  /** The reveal for {@link parensSample}. */
  protected readonly parensAnswer =
    '`user?.address.city` is `undefined` — the `?.` on `user` short-circuits the **entire rest of the chain**, `.address.city` included, the moment `user` is nullish. `(user?.address).city` throws `TypeError: Cannot read properties of undefined`. The parentheses **end** the optional chain: everything inside them evaluates first (`user?.address` → `undefined`, safely), and then `.city` is read from that result as an ordinary — unprotected — property access. The rule: `?.` only protects what is still inside the *same* chain expression; a `(...)` boundary is not part of it.';

  /** The volume-slider self-test. */
  protected readonly volumeQuiz = VOLUME_QUIZ;

  /** Question text for the defaults-and-null self-test — bound rather than
   * inlined in the template because it contains a literal `{`/`}` pair. */
  protected readonly defaultsQuizQuestion = DEFAULTS_QUIZ_QUESTION;
  /** The default-parameters-and-null self-test. */
  protected readonly defaultsQuiz = DEFAULTS_QUIZ;

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = QUESTIONS;
}
