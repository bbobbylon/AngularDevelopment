import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { BrainPower, NoDumbQuestions } from '../../../shared/shapes';
import type { NdqItem } from '../../../shared/shapes';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';
import { highlight } from '../../../shared/highlighter';

/**
 * One candidate value for the shape-checker demo.
 */
interface CandidateShape {
  label: string;
  value: string;
  verdict: 'ok' | 'error';
  explain: string;
}

/**
 * The five shapes the live checker demo cycles through.
 *
 * Candidates 4 and 5 are the pair this lesson is really about: the exact same
 * three fields, one assigned through a variable and one assigned as a fresh
 * literal, with opposite verdicts. Everything the "narrower rule" section
 * argues in prose, this demo lets the reader actually trigger.
 */
const CANDIDATES: CandidateShape[] = [
  {
    label: 'exact match',
    value: `{ id: 1, name: 'Ada', createdAt: new Date() }`,
    verdict: 'ok',
    explain:
      'Every required member present with the right type. email? may be absent — that is what the ? grants.',
  },
  {
    label: 'missing name',
    value: `{ id: 1, createdAt: new Date() }`,
    verdict: 'error',
    explain: `Property 'name' is missing in type … but required in type 'User'. Required members are non-negotiable; the error names exactly what's absent.`,
  },
  {
    label: 'wrong type for id',
    value: `{ id: '1', name: 'Ada', createdAt: new Date() }`,
    verdict: 'error',
    explain: `Types of property 'id' are incompatible: string is not assignable to number. Shape checks are per-member and recursive.`,
  },
  {
    label: 'extra property (variable)',
    value: `const x = { id: 1, name: 'Ada', createdAt: new Date(), nickname: 'A' }; const u: User = x;`,
    verdict: 'ok',
    explain:
      'Structural typing: MORE than required is compatible when assigned via a variable. The nickname is simply invisible through the User lens.',
  },
  {
    label: 'extra property (literal)',
    value: `const u: User = { id: 1, name: 'Ada', createdAt: new Date(), nickname: 'A' };`,
    verdict: 'error',
    explain: `Object literal may only specify known properties. Fresh literals get the stricter "excess property check" — an unknown key in a literal is almost always a typo, so TS flags it at the assignment.`,
  },
];

/**
 * Lesson: interfaces vs type aliases — what actually decides whether a value
 * "is" an interface (its **shape**, never a declared name or an `implements`),
 * the excess-property check as the one narrow exception to that generosity,
 * every member form, `extends` against intersection, declaration merging as
 * the interface-only superpower, callable/index/generic/hybrid signatures, and
 * what `implements` really checks.
 *
 * ## Shape: `no-dumb-questions`
 *
 * The lesson opens on the misconception this topic reliably produces — "so
 * something has to declare the relationship, right?" — and lets {@link ndq}
 * carry the entire explanation, escalating from "no `implements` anywhere, yet
 * it compiles" through the literal-vs-variable excess-property split, to where
 * this bites at work (two unrelated types turning out interchangeable) and the
 * one-line fix (nominal branding, when you actually need it). `app-brain-power`
 * poses an open question about primitive aliases (`Celsius`/`Fahrenheit`, both
 * secretly `number`), `app-layers` answers the shape question as a containment
 * figure (the checklist only reaches as deep as its own fields ask), a quiz
 * checks the variable-vs-literal case, and the block closes on `app-napkin`
 * with the hiring-checklist analogy. See `docs/CONTRIBUTING.md` §2C.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape set by `expert/change-detection` and `typescript/narrowing`.
 * After the shape block, "the mental model, in full" replays the same object
 * from the block against the hiring-checklist analogy at full length, then the
 * rest of the page carries on in the order it always did:
 *
 * 1. **Analogy, then vocabulary.** A hiring checklist — matched by field, not
 *    by letterhead — gives "structural typing" somewhere to attach before the
 *    term appears, and goes one level past the "duck typing" cliché into the
 *    actual mechanism: a member-by-member walk, with one narrow, separately
 *    named exception.
 * 2. **The same idea in four modes** — a dialogue between the interface, the
 *    object and the compiler; a hand-drawn diagram with arrows landing on
 *    matching fields (and one that doesn't); annotated code; and a live
 *    checker the reader can feed both a variable and a fresh literal.
 * 3. **The excess-property check gets its own paragraph and its own predict**,
 *    per the brief — it is a narrower rule bolted onto structural typing, not
 *    structural typing itself, and treating the two as one idea is the most
 *    common way this topic gets mis-taught.
 *
 * @see typescript/narrowing — the sibling lesson on what the compiler does
 * once a value's *type* is established; this one is about what establishes it.
 * @see typescript/classes — where `implements` and access modifiers meet.
 */
@Component({
  selector: 'app-lesson-ts-interfaces',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    BrainPower,
    NoDumbQuestions,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './interfaces.html',
  styleUrl: './interfaces.css',
})
export class Interfaces {
  /**
   * The example shapes the live checker demo can switch between.
   */
  protected readonly candidates = CANDIDATES;

  /**
   * Which shape the demo is currently showing.
   */
  protected readonly candidate = signal<CandidateShape>(CANDIDATES[0]);

  /**
   * The selected candidate's source, tokenised into `<span class="hl-*">`
   * markup.
   *
   * Highlighted here rather than by the app-wide sweep in `app.ts`, which
   * deliberately skips any `<pre>` inside a `.demo` — this block's content
   * changes on every click, and a tokeniser that only ran once per navigation
   * would leave four of the five candidates displayed as flat, unhighlighted
   * text. Safe to bind with `[innerHTML]`: {@link highlight} escapes every
   * character it emits, so the sample is displayed as source rather than
   * parsed as markup.
   */
  protected readonly highlightedCandidate = computed(() => highlight(this.candidate().value));

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Type System track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Types', id: 'ts-types' },
    { label: 'Interfaces' },
    { label: 'Classes', id: 'ts-classes' },
    { label: 'Generics', id: 'ts-generics' },
    { label: 'Enums', id: 'ts-enums' },
    { label: 'Narrowing', id: 'ts-narrowing' },
  ];

  /**
   * The shape block's spine: seven questions escalating from "nothing declared
   * the relationship, so how is this legal" through the literal-vs-variable
   * excess-property split, to where this actually bites at work and the
   * one-sentence fix. Carries the entire explanation on its own — see
   * `NoDumbQuestions`'s own doc comment for why that is the point.
   */
  protected readonly ndq: NdqItem[] = [
    {
      q: "Nothing here says `implements User`. Shouldn't SOMETHING have to declare that relationship before it's legal?",
      a: "No — and that refusal is the whole lesson. TypeScript never checks for a declaration at all. It checks the object's **shape**: does it have every field the interface lists, with a compatible type in each? Tick every box and you're in, whether or not the object has ever heard of `User`.",
    },
    {
      q: "That feels like a loophole. Doesn't Java or C# require the declaration?",
      a: "They do, and that's the point of comparison, not a loophole in TypeScript. Java and C# are **nominal**: a class is only a `Point` if it wrote `implements Point`, in writing, once. TypeScript is **structural** by design: compatibility is recomputed from the shape every single time, and no declaration is ever cached or required.",
    },
    {
      q: "I gave the object an extra field the interface never asked for. Doesn't over-delivering fail the check?",
      a: "Not through a variable, it doesn't. `const x = { id: 1, name: 'Ada', nickname: 'A' }; const u: User = x;` compiles cleanly — `nickname` is simply invisible through the `User` lens. Structural typing only ever asks 'do you have what I need,' never 'do you have ONLY what I need.'",
    },
    {
      q: 'But I tried that exact object as a fresh literal instead of a variable, and TypeScript flagged the extra field. Which is it?',
      a: "Both, and the difference is the **path**, not the data. `const u: User = { id: 1, name: 'Ada', nickname: 'A' };` — a literal written right there in the assignment — gets a stricter second pass called the excess-property check, because an unrecognised key on a brand-new object is almost always a typo. Store that identical object in a variable first and the check never runs; ordinary structural comparison takes over, extra fields and all.",
    },
    {
      q: "Where does the loophole-that-isn't actually bite people at work?",
      a: "Two unrelated domain types that happen to share a shape become silently interchangeable. Pass an `Invoice` where a `Receipt` was expected — no error, no warning — because TypeScript only ever compared fields, and if both happen to declare `amount: number` and `date: Date`, that's a match as far as the compiler is concerned. It never asked whether the two concepts should be swappable.",
    },
    {
      q: 'Wait — so if `Car` and `Boat` both happen to declare `wheels: number` and `drive(): void`, a `Car` type-checks as a `Boat`?',
      a: "Yes, on the spot, with nothing linking the two declarations at all. Rename either interface and the answer doesn't change — TypeScript never records or checks which name a value was built against. All that survives to comparison time is the shape.",
    },
    {
      q: "So what's the one-line fix, if I actually need two same-shaped types to stay apart?",
      a: "Brand one of them — add a property no real data would ever have, like `readonly __brand: 'UserId'`, so the shapes genuinely diverge. That's the whole trick behind TypeScript's 'nominal typing' pattern: it isn't a language feature, it's structural typing given a field to disagree about on purpose.",
    },
  ];

  /**
   * The shape block's quiz: the same variable-vs-literal split the excess-
   * property section below covers in full, checked once up front so the
   * reader commits to an answer before the deeper explanation arrives.
   */
  protected readonly ndqBlockQuiz: QuizOption[] = [
    {
      text: 'Yes — `raw` has every field `User` asks for; the extra `role` is simply invisible through the `User` lens.',
      correct: true,
      why: '`raw` is a variable, not a fresh literal, so it never faces the excess-property check. Once a value has a binding of its own, TypeScript compares it to `User` structurally — and structural typing was never bothered by extra fields in the first place.',
    },
    {
      text: 'No — `role` is a property `User` never declared, so TypeScript rejects the assignment.',
      why: "This is the excess-property check's rule, applied to the wrong case. That stricter pass only fires on a **fresh literal** written directly in the assignment. `raw` already exists as its own variable by the time it meets `User`, so the stricter check never runs.",
    },
    {
      text: 'Only if `role` is declared as optional on `User`.',
      why: "`User` doesn't need to mention `role` at all, optional or otherwise. Structural typing only checks that every field `User` **does** ask for is present and compatible — it has nothing to say about fields it never listed.",
    },
    {
      text: 'It depends on whether `strict` mode is enabled in `tsconfig.json`.',
      why: 'Structural typing itself is not a strictness flag — it is how TypeScript compares object types, on or off. `strict` changes things like implicit `any` and null-checking; it has no effect on whether extra fields through a variable are allowed.',
    },
  ];

  /** Sample for the opening puzzle: a value that satisfies `User` unasked. */
  protected readonly openingSample = `interface User {
  id: number;
  name: string;
}

function greet(u: User): string {
  return 'Hi, ' + u.name;
}

greet({ id: 1, name: 'Ada' });
// compiles — but where did this object ever agree to be a User?`;

  /**
   * The interface, the object and the compiler, negotiating.
   *
   * Staged as a three-way exchange rather than described in a paragraph
   * because the relationship has three genuinely different jobs in it — the
   * interface only ever states a requirement, the object only ever presents
   * itself, and the compiler is the only party that actually compares the
   * two — and learners routinely collapse those into "the object knows it
   * implements the interface", which is precisely backwards.
   */
  protected readonly mechanismTalk: BubbleTurn[] = [
    {
      who: 'The interface',
      says: 'I am `Point`. Anyone who wants to be treated as me needs an `x: number` and a `y: number`. That is the whole application form.',
    },
    {
      who: 'The object literal',
      says: 'Here is `{ x: 1, y: 2, z: 3 }`. Nobody ever told me to `implement` you — I did not know you existed until this line.',
    },
    {
      who: 'The compiler',
      says: "Didn't ask you to know. I checked your fields against the form: `x`? Present, right type. `y`? Present, right type. You're in.",
    },
    {
      who: 'The object literal',
      says: 'What about `z`? It is not on your form anywhere.',
    },
    {
      who: 'The compiler',
      says: "Passed to me through a variable, I never even look for stowaways — the form doesn't mention `z`, so `z` is invisible from here. Hand yourself to me as a **fresh literal**, though, right there in the assignment, and I check for stray fields too. `z` gets flagged, because an unrecognised key on a brand-new object is almost always a typo.",
    },
  ];

  /** Sample: the Java/C# side of the nominal-vs-structural comparison. */
  protected readonly nominalSample = `interface Point {
    int getX();
    int getY();
}

class Coord implements Point {   // must say so, explicitly
    public int getX() { return x; }
    public int getY() { return y; }
}`;

  /** Sample: the TypeScript side of the same comparison. */
  protected readonly structuralCompareSample = `interface Point {
  x: number;
  y: number;
}

const coord = { x: 1, y: 2 };   // no "implements" anywhere
const p: Point = coord;         // ...and none was needed`;

  /** Sample: structural typing, worked through a small function. */
  protected readonly structuralSample = `interface Point {
  x: number;
  y: number;
}

function show(p: Point): void {
  console.log(p.x + ', ' + p.y);
}

// no "implements Point" anywhere — and none is required
show({ x: 1, y: 2 });

const coord = { x: 3, y: 4, label: 'home' };
show(coord);   // extra "label" is fine — coord has everything Point asks for`;

  /** Line-by-line walkthrough of {@link structuralSample}. */
  protected readonly structuralNotes: CodeNote[] = [
    {
      line: 1,
      text: '`interface Point` declares a shape only. There is no runtime trace of it anywhere — it is erased before the JavaScript ships.',
    },
    {
      line: 6,
      text: '`p: Point` promises only that whatever arrives has an `x` and a `y` of the right type. It says nothing about how that object came to exist.',
    },
    {
      line: 10,
      text: 'The whole lesson, in one comment. Unlike Java’s `implements` or C#’s `:`, TypeScript never asks an object to **declare** that it satisfies `Point` — it only ever checks.',
    },
    {
      line: 11,
      text: 'A fresh object literal, checked directly against the shape `show` demands. `x` and `y` are both present with the right types, so this compiles with no class, no keyword, no ceremony at all.',
    },
    {
      line: 13,
      text: '`coord` is inferred as `{ x: number; y: number; label: string }` — three fields, not two.',
    },
    {
      line: 14,
      text: '`coord` has **more** than `Point` asks for, and that is fine — satisfying an interface means having everything it requires, never *exactly* what it requires. Handed over as a variable like this, the compiler does not even look for stowaways. That changes the moment a fresh literal is handed over instead — the very next section is that exact exception.',
    },
  ];

  /**
   * The first self-test: structural typing across two unrelated interfaces.
   *
   * The distractors are the three ways a learner imports nominal-typing
   * instincts into TypeScript: assuming the interface's name matters, assuming
   * `implements` is what makes two interfaces compatible, and assuming an
   * explicit cast is required even when the shapes already match.
   */
  protected readonly structuralQuiz: QuizOption[] = [
    {
      text: 'No — `Car` and `Boat` are different named types, so TypeScript keeps them apart.',
      why: 'This is the nominal-typing instinct, and it runs exactly backwards here. The compiler never records or checks which interface name a value was built against — once the object exists, the name is gone. All that is left to compare is the shape.',
    },
    {
      text: 'Yes — the two shapes are identical, so TypeScript treats the types as compatible regardless of their names.',
      correct: true,
      why: '`Car` and `Boat` never have to know about each other. TypeScript compares members: does the `Car` value have a `wheels: number` and a `drive(): void`? Yes — so it satisfies `Boat` too, on the spot, with no declaration linking the two at all.',
    },
    {
      text: 'Only if `Car` is written to `implements Boat`.',
      why: '`implements` is not even legal between two interfaces — it is a keyword for a **class** signing on to a shape. Two interfaces never need it to be compatible; compatibility is computed from their members every time, not declared once and cached.',
    },
    {
      text: 'Yes, but only with an explicit `as Boat` cast first.',
      why: "A cast tells the compiler something it cannot verify on its own. Here it can verify it on its own — the shapes already match — so a cast would do zero work. Reach for `as` when the shapes genuinely differ and you know something the checker doesn't; using it when structural typing already agrees just hides a check you never needed to hide.",
    },
  ];

  /** Sample for the excess-property predict: the same three fields, two paths. */
  protected readonly excessSample = `interface Point {
  x: number;
  y: number;
}

const p1: Point = { x: 1, y: 2, z: 3 };

const obj = { x: 1, y: 2, z: 3 };
const p2: Point = obj;`;

  /** The reveal for {@link excessSample}. */
  protected readonly excessAnswer =
    "`p1` is the error — `Object literal may only specify known properties, and 'z' does not exist in type 'Point'.` `p2` compiles cleanly with the exact same three fields. The difference is not the data, it's the **path**: `p1` hands the compiler a **fresh literal**, written right there in the assignment, and fresh literals get the stricter **excess property check** — because an unrecognised key on a brand-new object is almost always a typo, and the compiler loses nothing by asking. `obj`, once it exists as its own named binding with its own inferred type (`{ x: number; y: number; z: number }`), is just an ordinary value being checked structurally against `Point` — and structural typing was never bothered by extra properties in the first place. Same three fields, two different rules, because one of them is a place a typo can still be caught and the other is one step too late to bother.";

  /**
   * Second self-test: the intersection/extends failure-timing split.
   *
   * The distractors each collapse the two mechanisms into one, in a different
   * direction — assuming both fail the same way, assuming the intersection is
   * the strict one, or assuming `never` prevents nothing at all.
   */
  protected readonly extendsQuiz: QuizOption[] = [
    {
      text: 'No difference — both are compile errors on the same line.',
      why: 'Half right. `extends` does fail on that exact line. The intersection does not — `type PetT` is a perfectly legal declaration all by itself; nothing about it is wrong until something tries to actually build one.',
    },
    {
      text: '`extends` fails immediately, right at the declaration; the intersection fails later, at whatever tries to construct a `PetT`, with `name` reduced to `never`.',
      correct: true,
      why: "Exactly — `extends` is a promise the compiler checks the moment you make it. An intersection with a conflict doesn't complain about the type at all; it silently computes `string & number`, which is `never`, and you only find out when some code tries to put a value in that slot and can't.",
    },
    {
      text: 'The intersection fails immediately, because `&` requires two fully compatible types up front.',
      why: 'Backwards. `&` never validates compatibility at the declaration — it just combines member lists and lets any resulting conflict resolve to `never`. Nothing stops you from declaring `PetT`; only from ever using it.',
    },
    {
      text: 'Neither fails — `never` is a valid type for a property, so both compile and run fine.',
      why: '`never` is a valid *type*, but no value can ever have it — so while the type declaration itself is legal, nothing can ever satisfy it. The line that assigns `name: 5` (or anything at all) is where the `never` turns into an actual, unavoidable error.',
    },
  ];

  /** Sample: `extends` on a conflicting member, vs. the intersection equivalent. */
  protected readonly extendsSample = `interface Animal {
  name: string;
}

interface Loggable {
  log(): void;
}

interface Pet extends Animal {
  owner: string;
}

interface Dog extends Animal, Loggable {
  breed: string;
}

type Admin = User & { role: 'admin' };
type Staff = User & Loggable;`;

  /** Line-by-line walkthrough of {@link extendsSample}. */
  protected readonly extendsNotes: CodeNote[] = [
    {
      line: 9,
      text: '`extends` says `Pet` has everything `Animal` has, **plus** `owner`. It is checked immediately: redeclare `name` here with an incompatible type and the error appears right on this line, not somewhere downstream.',
    },
    {
      line: 13,
      text: 'An interface can extend **more than one** at once, comma-separated. `Dog` now needs `name`, `log()`, and `breed`, all three.',
    },
    {
      line: 17,
      text: '`&` is **intersection** — the `type` equivalent of `extends`. It glues two shapes into one that needs everything from both sides.',
    },
    {
      line: 18,
      text: 'Any two types can be intersected, including two interfaces with no relationship to each other at all. `Staff` now needs everything `User` has and everything `Loggable` has.',
    },
  ];

  /** Sample for the declaration-merging predict. */
  protected readonly mergeTrapSample = `// config.ts — declared once, near the top of the module:
interface Config {
  name: string;
}

// … forty lines later, added by a teammate who forgot this already exists:
interface Config {
  retries: number;
}

const c: Config = { name: 'svc', retries: 3 };`;

  /** The reveal for {@link mergeTrapSample}. */
  protected readonly mergeTrapAnswer =
    "No — and that's the surprise if you're coming from a language where a duplicate name is always an error. TypeScript **merges** the two declarations into a single interface with both `name` and `retries`; this is called **declaration merging**, and it is not a gap in the checker, it's a deliberate feature — the sanctioned way to add fields to a type you don't own, like teaching `Window` about a script your `index.html` injects. Try the identical mistake with `type Config = { name: string }` declared twice instead and you get a hard stop: **TS2300 — Duplicate identifier 'Config'.** A `type` is a single binding — redeclaring the name re-binds it, the same way redeclaring a `const` would. An interface is a declaration that **accumulates**. One footnote worth knowing: merging is not a free pass on conflicts — redeclare `name` a second time as `number` instead of adding a new field, and merging fails right at that property, the same way `extends` does.";

  /** Sample: declaration merging, augmenting `Window`. */
  protected readonly mergeSample = `// analytics.d.ts — teach TS about a script your index.html injects:
declare global {
  interface Window {
    myAnalytics?: { track(event: string): void };
  }
}

// anywhere in the app — now fully type-checked:
window.myAnalytics?.track('view');`;

  /** Line-by-line walkthrough of {@link mergeSample}. */
  protected readonly mergeNotes: CodeNote[] = [
    {
      line: 2,
      text: '`declare global { }` is how a module reaches into **ambient**, whole-program scope. Without it, this augmentation would only apply inside this one file.',
    },
    {
      line: 3,
      text: '`Window` is a real, library-defined interface from `lib.dom.d.ts`. Re-declaring it here does not replace it — TypeScript **merges** this declaration into the existing one, adding a field the DOM types never shipped with.',
    },
    {
      line: 4,
      text: '`myAnalytics?` is optional, matching reality: the field only exists once the injected script has actually run.',
    },
    {
      line: 9,
      text: '`?.` is optional chaining. Paired with the optional field above, this line calls `track` only if the script loaded; otherwise the whole expression evaluates to `undefined`, with no runtime error either way.',
    },
  ];

  /** Sample: callable, index, generic and hybrid signatures. */
  protected readonly beyondSample = `interface Handler {
  (event: string): void;
}

interface Dictionary {
  [key: string]: number;
}

interface Repo<T> {
  get(id: number): T | undefined;
  save(item: T): void;
}

interface Counter {
  (start: number): string;
  reset(): void;
  count: number;
}`;

  /** Line-by-line walkthrough of {@link beyondSample}. */
  protected readonly beyondNotes: CodeNote[] = [
    {
      line: 2,
      text: "A **callable signature** — no method name, just a parameter list and return type. `Handler` describes something you invoke directly: `myHandler('click')`. For a plain function type like this, the alias form `type Handler = (event: string) => void` usually reads better.",
    },
    {
      line: 6,
      text: "An **index signature**: `[key: string]: number` says any key that's a string maps to a `number`, for keys you don't know ahead of time. `Record<string, number>` (Utility Types lesson) is increasingly the more readable way to say the same thing.",
    },
    {
      line: 9,
      text: '`<T>` makes this a **generic** contract — a family of shapes, not one. `Repo<User>` and `Repo<Order>` are distinct, fully-checked instantiations of the same interface.',
    },
    {
      line: 15,
      text: 'A **hybrid**: this interface is callable (line 15) *and* has ordinary members (lines 16–17). It is exactly how old-school jQuery’s `$` was typed — call it like a function, or read a property off it like an object.',
    },
  ];

  /** Sample: `implements`, checked against a generic interface. */
  protected readonly implementsSample = `interface Repo<T> {
  get(id: number): T | undefined;
  save(item: T): void;
}

class FileRepo implements Repo<File> {
  get(id: number) { return undefined; }
  save(item: File) { /* … */ }
}
// implements CHECKS the class against the shape.
// It adds no code and no runtime linkage — a class may implement many interfaces.`;

  /** Line-by-line walkthrough of {@link implementsSample}. */
  protected readonly implementsNotes: CodeNote[] = [
    {
      line: 6,
      text: '`implements` makes the compiler verify `FileRepo` really has everything `Repo<File>` needs — `get` and `save`, with compatible signatures. It is exactly how Angular checks lifecycle hooks: `class MyComp implements OnInit` fails to compile if you never wrote `ngOnInit()`.',
    },
    {
      line: 7,
      text: 'This body genuinely just returns `undefined` — `implements` checks **shape**, never behaviour. A `get` that always returns nothing satisfies the interface exactly as well as a correct one would.',
    },
    {
      line: 10,
      text: 'Unlike extending a class, `implements` adds **no code** — no inherited fields, no shared method bodies. It is a compile-time promise, checked once, then erased along with everything else interface-shaped.',
    },
    {
      line: 11,
      text: 'A class can `implements` several interfaces at once, comma-separated — the class-side mirror of an interface `extends`-ing several. And because interfaces are erased, none of it survives to runtime: `instanceof Repo` is not legal TypeScript.',
    },
  ];

  /** Sample: every member form an interface offers. */
  protected readonly memberSample = `interface User {
  id: number;
  name: string;
  email?: string;
  readonly createdAt: Date;
  greet(): string;
  onSave: (u: User) => void;
}

type UserT = { id: number; name: string };`;

  /** Line-by-line walkthrough of {@link memberSample}. */
  protected readonly memberNotes: CodeNote[] = [
    {
      line: 2,
      text: 'A **required** property. Every value assigned to `User` must have an `id`, with exactly `number` or something assignable to it — there is no leniency here.',
    },
    {
      line: 4,
      text: 'The `?` makes this **optional**. Reads of `user.email` come back typed `string | undefined`, so you have to narrow before calling a `string`-only method on it. Omitting the key is legal; explicitly passing `undefined` usually is too — the `exactOptionalPropertyTypes` flag is what tells those two cases apart.',
    },
    {
      line: 5,
      text: '`readonly` blocks *reassignment* — `user.createdAt = new Date()` is a compile error. It does **not** freeze the value: `Date` still has mutating methods like `setFullYear()`, and TypeScript lets you call them. Shallow, and compile-time only — nothing enforces it once the code is running.',
    },
    {
      line: 6,
      text: 'Method shorthand. Internally almost identical to a function-typed property, with one real difference: methods are checked **bivariantly**, a looser rule for parameter compatibility kept around for historical reasons.',
    },
    {
      line: 7,
      text: 'A property whose value happens to be a function — checked **strictly** (contravariantly) under `strictFunctionTypes`. For callbacks you actually pass around, this form is the safer one, and it is the house style in strict codebases.',
    },
    {
      line: 10,
      text: '`type` describes the identical shape with `=` instead of a declaration. Structurally, `UserT` and the required part of `User` are completely interchangeable — TypeScript compares shapes, never the keyword that built them.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why does Angular dependency injection need an `InjectionToken` for an interface-typed dependency?',
      a: "Because interfaces don't survive to runtime. `inject(MyInterface)` would need something to actually look up in the injector, and after compilation `MyInterface` simply is not there to look up — it was erased along with every other type. Classes survive, because a class is also a real constructor function at runtime, which is why services in Angular are always classes, and interface-shaped configuration gets a separate `InjectionToken` as its runtime stand-in. One erasure fact explains a whole corner of Angular's API design.",
    },
    {
      q: "`type A = { x: string } & { x: number }` — is that an error? What type is `A['x']`?",
      a: "No error at the declaration — intersections merge silently, whatever the result. But `A['x']` is `string & number`, which TypeScript collapses to `never`, because no value can simultaneously be a `string` and a `number`. Nothing stops `A` from existing; it just becomes a type nothing can ever satisfy, and you find out the moment something tries to construct one, with a message that names `never` rather than the conflict that caused it. Do the identical conflict through `extends` on two interfaces instead and it errors immediately, at the interface — the early-vs-late split in action.",
    },
    {
      q: 'I need `User` with every field optional except `id`. Interface, or type?',
      a: "`type` — this needs computation, not declaration: `type UserPatch = Partial<User> & Pick<User, 'id'>`. Mapped and conditional machinery (`Partial`, `Pick`, and everything like them) only exists on the `type` side, which is the actual, deep reason behind the 'unions and computed shapes go to `type`' rule — it isn't a style preference, `interface` genuinely cannot express this.",
    },
    {
      q: '`interface` or `type` — which one should I actually reach for?',
      a: "For plain object and class shapes, `interface` — especially anything a consumer might extend, since `extends` gives a clearer error than the intersection equivalent. For unions, tuples, function types, or anything computed from another type, `type` is your only option, so the choice makes itself. Where either would genuinely work, the honest answer is that it barely matters: pick one convention with your team and stop re-litigating it per file — consistency is worth more than either keyword's marginal advantage.",
    },
    {
      q: 'Can an interface have a method with a default implementation — a body, not just a signature?',
      a: 'No, and that is the actual line between an interface and a class. An interface is erased before your code ships, so it can never carry executable code — only a shape for the compiler to check. The moment you want a method body multiple types can share, you have outgrown an interface and want an **abstract class** instead, which can mix required-but-unimplemented members with ones that already have a body. If you only need the shape, keep the interface; the instant you need behaviour, reach for a class.',
    },
  ];
}
