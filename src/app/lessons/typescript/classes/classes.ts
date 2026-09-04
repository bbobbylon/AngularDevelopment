import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ── Demo classes used by the live "try it" and detachment demos ───────────────

/**
 * Demo class for parameter properties, `readonly`, a getter, and a chainable
 * method typed with the polymorphic `this` return type.
 */
class Counter {
  // parameter properties: declare + assign in one place
  /**
   * Declares and assigns its fields in one place using parameter properties —
   * `public readonly label` and `private value` are both declared *and* set by
   * appearing in the signature.
   *
   * @param label Display name, exposed read-only.
   * @param value Starting count, kept private.
   */
  constructor(
    public readonly label: string,
    private value = 0,
  ) {}

  /**
   * The count. A getter rather than a public field, so the value is readable
   * from outside but only writable through {@link increment}.
   */
  get current() {
    return this.value;
  }

  /**
   * Adds to the count and returns `this`, so calls can be chained.
   *
   * The `: this` return annotation is doing real work, not decoration — it is
   * what makes {@link increment} a *polymorphic* return type. Left off (or
   * written as `: Counter`), a subclass calling `increment()` would get back
   * `Counter`, not its own type, and lose access to anything the subclass
   * added. See the "this in a return type" section for the failing version.
   *
   * @param by How much to add.
   * @returns This counter — typed as whatever class actually called it.
   */
  increment(by = 1): this {
    this.value += by;
    return this;
  }
}

/**
 * Demo class for the `this`-binding difference between a method and an arrow
 * property.
 */
class Greeter {
  /**
   * @param name Stored privately via a parameter property.
   */
  constructor(private name: string) {}

  // method — `this` depends on HOW it's called
  /**
   * A normal method: `this` is decided by **how it is called**, not where it is
   * defined. Pull it off the instance and call it bare and `this` is `undefined`
   * — which the `?.` here reports rather than crashing on.
   */
  greetMethod() {
    return 'hi from ' + (this?.name ?? 'undefined (this was lost!)');
  }

  // arrow field — `this` captured lexically at construction
  /**
   * An arrow **property**: `this` is captured from the enclosing instance when the
   * property is created, so it survives being detached.
   *
   * The trade-off the lesson names: this is a per-instance function object rather
   * than one shared on the prototype, so it costs memory per instance and cannot
   * be overridden by a subclass.
   */
  greetArrow = () => 'hi from ' + this.name;
}

// ── The lesson component ──────────────────────────────────────────────────────

/**
 * Lesson: classes and access modifiers — what a class actually desugars to
 * (a constructor function plus one shared prototype), field-initializer order
 * across inheritance and the "calling an overridable method from a
 * constructor" trap, the soft-vs-hard privacy split (and how a private member
 * makes an otherwise-structural class nominal), the `strictPropertyInitializer`
 * error every Angular dev meets in week one and its four honest fixes, the
 * `useDefineForClassFields` field-shadowing trap and `declare`, parameter
 * properties vs `inject()`, `super`/`override`/`noImplicitOverride`, `this`
 * loss on detachment with a live broken-vs-bound demo, `this` as a polymorphic
 * *return* type for chainable APIs, `abstract` vs `implements` (including why
 * `implements` gives you no contextual typing), and the class-is-both-a-type-
 * and-a-value duality.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape set by `expert/change-detection`. The teaching order:
 *
 * 1. **Pose the problem first.** The lesson opens on "TypeScript erases nearly
 *    everything about a class at compile time — so which parts are real?" and
 *    puts a napkin prediction (`private` vs DevTools) in front of the reader
 *    before any keyword is explained.
 * 2. **Analogy, then vocabulary.** An apartment building — your own furniture
 *    (fields) inside your unit, one shared gym in the basement (prototype
 *    methods) — gives "instance" and "prototype" somewhere to live before those
 *    words appear, and explains the arrow-field trade-off for free.
 * 3. **The same idea in several modes** — a dialogue between an instance and its
 *    prototype, a desugared-to-plain-JS code lab, a concentric-rings diagram of
 *    the prototype chain, and a vertical flow of field-initializer order.
 * 4. **The erasure theme returns at every checkpoint.** Each section ends by
 *    asking "does this survive to runtime, or is it a compiler opinion?" —
 *    culminating in the closing `<app-remember>`, which states the whole
 *    lesson's throughline in one sentence.
 *
 * ## Coverage-sweep material folded in
 *
 * Four gaps `docs/COVERAGE-SWEEP.md` found in the previous version of this
 * lesson are now first-class sections rather than footnotes: the
 * `strictPropertyInitialization` error and its four responses (`!`, `declare`,
 * constructor assignment, honest `| null`); the `useDefineForClassFields`
 * field-shadowing trap and why Angular's own docs recommend `declare` for a
 * re-declared `@Input()`; the polymorphic `this` return type for chainable
 * APIs, demonstrated failing and passing; and why `implements` gives a method
 * parameter no contextual typing, contrasted with the object-literal case
 * where contextual typing *does* flow.
 */
@Component({
  selector: 'app-lesson-ts-classes',
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
  ],
  templateUrl: './classes.html',
  styleUrl: './classes.css',
})
export class Classes {
  /**
   * The counter behind the live "try it" demo.
   */
  private readonly counter = new Counter('clicks');
  /**
   * Its label, read once — `readonly` on the class means it cannot change.
   */
  protected readonly label = this.counter.label;
  /**
   * The displayed count. A separate signal because {@link Counter} is a plain
   * class with no reactivity: {@link bump} has to push the new value across.
   */
  protected readonly display = signal(this.counter.current);

  /**
   * Result of the detached-call demo, or `null` before it has been run.
   */
  protected readonly detachedResult = signal<{ method: string; arrow: string } | null>(null);

  /**
   * Increments the counter and copies the new value into the signal.
   *
   * @param by How much to add.
   */
  protected bump(by: number): void {
    this.counter.increment(by);
    this.display.set(this.counter.current);
  }

  /**
   * Runs the detached-call demo: pulls both the method and the arrow property off
   * a fresh instance, calls them bare, and shows that only the arrow still knows
   * what `this` was.
   */
  protected callDetached(): void {
    const g = new Greeter('Ada');
    const method = g.greetMethod;
    const arrow = g.greetArrow;
    this.detachedResult.set({ method: method(), arrow: arrow() });
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Type System track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Types', id: 'ts-types' },
    { label: 'Interfaces', id: 'ts-interfaces' },
    { label: 'Classes' },
    { label: 'Generics', id: 'ts-generics' },
    { label: 'Enums', id: 'ts-enums' },
    { label: 'Narrowing', id: 'ts-narrowing' },
  ];

  /**
   * An instance and its prototype, negotiating who owns what.
   *
   * This exchange exists because "where does a field live vs. where does a
   * method live" is the single fact that predicts almost every other question
   * in this lesson — why two methods compare equal with `===` but two fields
   * never do, why a method survives being copied onto a plain variable while
   * losing its `this`, and why an arrow field is the deliberate exception.
   */
  protected readonly instanceTalk: BubbleTurn[] = [
    {
      who: 'A Counter instance',
      says: 'I need to run `increment()`. Do I carry my own copy of it?',
    },
    {
      who: 'Counter.prototype',
      says: 'No — you and every other Counter share mine. Look me up on `Object.getPrototypeOf(you)`.',
    },
    {
      who: 'A Counter instance',
      says: 'And my `value` field — do you hold that for me too?',
    },
    {
      who: 'Counter.prototype',
      says: "That one's yours alone. Every instance gets its own slot; I never see it, and I couldn't tell two instances apart if I tried.",
    },
    {
      who: 'A Counter instance',
      says: 'So if I write `this.increment = () => {}` directly on myself?',
    },
    {
      who: 'Counter.prototype',
      says: "Then you've shadowed me — for you, and only you. Every other instance still finds me, exactly as before.",
    },
  ];

  /**
   * Sample: roughly what `class Counter { … }` compiles down to — a plain
   * constructor function plus one method on `.prototype`.
   */
  protected readonly desugarSample = `// roughly what "class Counter { … }" compiles to:
function Counter(label, value = 0) {
  this.label = label;
  this.value = value;
}

Counter.prototype.increment = function (by = 1) {
  this.value += by;
  return this;
};

const a = new Counter('a');
const b = new Counter('b');

a.increment === b.increment;   // true  — ONE function, shared by every instance
a.value === b.value;           // false — each instance owns its own slot`;

  /** Line-by-line walkthrough of {@link desugarSample}. */
  protected readonly desugarNotes: CodeNote[] = [
    {
      line: 2,
      text: '`function Counter(...)` — a constructor function is just a regular function, given the honour of being called with `new`. This IS the class; there is no separate hidden mechanism underneath.',
    },
    {
      line: 3,
      text: '`this.label = label` writes onto **this specific object being built**. Two calls to `new Counter(...)` write to two different objects, so this line is where per-instance state comes from.',
    },
    {
      line: 7,
      text: '`Counter.prototype.increment = ...` — the method is attached **once**, to the shared prototype object, entirely outside the constructor function. It never gets re-created per instance.',
    },
    {
      line: 15,
      text: 'Proof of the split: both instances resolve `increment` to the exact same function reference, because both look it up through the same `Counter.prototype`.',
    },
    {
      line: 16,
      text: "Proof of the other half: `value` is never `===` between instances, because line 3's assignment ran twice, once per object, writing two separate slots.",
    },
  ];

  /**
   * Sample: a constructor calling an overridable method — the classic
   * fragile-base-class trap, made concrete.
   */
  protected readonly fieldOrderSample = `class Base {
  constructor() {
    this.setup();          // calls the OVERRIDDEN version — that's how \`this\` works
  }
  setup() {
    console.log('Base.setup');
  }
}

class Derived extends Base {
  ready = true;             // hasn't run yet when Base's constructor calls setup()

  setup() {
    console.log('Derived.setup, ready =', this.ready);
  }
}

new Derived();
// logs: "Derived.setup, ready = undefined"`;

  /** The reveal for {@link fieldOrderSample}. */
  protected readonly fieldOrderAnswer =
    "`undefined`, not `true`. `this.setup()` inside `Base`'s constructor dispatches virtually — JavaScript does not know or care that it is currently running a base constructor, so it calls `Derived.setup`, exactly as `instanceof` would suggest. But construction order is base-first: `Base`'s constructor body — including this call — runs to completion **before a single `Derived` field initializer has executed**. The override reads its own field one beat too early, and gets the value every uninitialized field starts with.";

  /**
   * Field-initializer order across inheritance, drawn as a sequence.
   *
   * Vertical because the third step's detail needs a full sentence to land the
   * trap; a horizontal row would crush it into three words. The `warn` tone on
   * step 2 is the payload — it is the step {@link fieldOrderSample} exists to
   * make concrete.
   */
  protected readonly fieldOrderSteps: FlowStep[] = [
    {
      label: "Base's field initializers",
      detail: "Run first, top to bottom, before a single line of Base's own constructor body.",
    },
    {
      label: "Base's constructor body",
      detail:
        'Runs next. If it calls a method Derived overrides, THAT override runs here — while every Derived field is still unset.',
      tone: 'warn',
    },
    {
      label: "Derived's field initializers",
      detail:
        "Run only after Base's constructor has fully finished, never before — no matter how deep Derived's own logic looks.",
      tone: 'accent',
    },
    {
      label: "Derived's constructor body",
      detail: 'Runs last, with every field — inherited and its own — already in place.',
      tone: 'good',
    },
  ];

  /**
   * Sample: soft privacy (`private`, TypeScript-only) against hard privacy
   * (`#hard`, engine-enforced) — including the "brand check" the `#name in
   * obj` syntax makes possible.
   */
  protected readonly vaultSample = `class Vault {
  private soft = 'ts-only';
  #hard = 'engine-enforced';

  static isVault(x: unknown): x is Vault {
    return #hard in x;             // the "brand check" — only real Vaults have this slot
  }
}

const v = new Vault();
(v as any).soft;                   // 'ts-only' — private was erased, nothing stops this
(v as any).#hard;                  // SyntaxError — the engine itself refuses`;

  /** Line-by-line walkthrough of {@link vaultSample}. */
  protected readonly vaultNotes: CodeNote[] = [
    {
      line: 2,
      text: '`private` is a TypeScript **keyword**, not JavaScript. The compiler checks it while you write the file, then deletes it — the emitted field is a completely ordinary property.',
    },
    {
      line: 3,
      text: '`#hard` is real, current JavaScript syntax (ES2022) for a **private class field**. It is not erased — it is a genuinely different kind of property that only exists reachable from inside this class body.',
    },
    {
      line: 6,
      text: '`#hard in x` is the "ergonomic brand check": a real operator, not a method call, that answers "does this object have a `#hard` slot declared by THIS class" — and it works even when `x` is typed `unknown`, because private-name checks never throw on the wrong shape.',
    },
    {
      line: 11,
      text: 'Casting to `any` defeats every TypeScript-only check, `private` included — the field reads back fine, because at runtime it was never protected at all.',
    },
    {
      line: 12,
      text: "The cast does nothing here: `#hard` isn't a TypeScript rule the cast can bypass, it's a property that literally does not exist under that name outside `Vault`'s own class body. The engine throws before your code even runs.",
    },
  ];

  /**
   * Sample: the four honest responses to `strictPropertyInitialization`'s
   * "Property has no initializer" error (TS2564).
   */
  protected readonly strictInitSample = `class ProfileForm {
  form: FormGroup;                     // TS2564 — no initializer, and never assigned in the constructor

  constructor(private fb: FormBuilder) {}
}

class Inline {
  form = this.fb.group({ name: '' });  // 1. initialize inline — best when nothing but injected deps is needed

  constructor(private fb: FormBuilder) {}
}

class InConstructor {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = fb.group({ name: '' }); // 2. initialize in the constructor body
  }
}

class DefiniteAssignment {
  form!: FormGroup;                    // 3. an unchecked PROMISE, not a check — same trust class as \`as\`

  ngOnInit(): void {
    this.form = this.fb.group({ name: '' });
  }
}

class Honest {
  form: FormGroup | null = null;       // 4. model the absence honestly
}`;

  /** Line-by-line walkthrough of {@link strictInitSample}. */
  protected readonly strictInitNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The error every Angular codebase hits within the first week: a field is declared with a type but no value, `strictPropertyInitialization` requires every field to be set before the constructor returns, and nothing here sets it. TypeScript refuses to compile rather than let `form` silently be `undefined`.',
    },
    {
      line: 8,
      text: "Fix 1, and the best one when it applies: give the field a value right where it's declared. Field initializers can read `this` (see the mechanism section above), so `this.fb` is available even though the constructor hasn't run yet.",
    },
    {
      line: 17,
      text: 'Fix 2: assign it in the constructor body instead. Equivalent to fix 1 in every way that matters — pick whichever reads better for the class.',
    },
    {
      line: 22,
      text: 'Fix 3: the `!` **definite assignment assertion**. It is not a check — it is you personally promising the compiler "trust me, something assigns this before anything reads it," with exactly the same unchecked-trust profile as an `as` cast, just spelled at the field level instead of the expression level.',
    },
    {
      line: 30,
      text: "Fix 4: stop promising and say what's actually true. `FormGroup | null` costs you a null check at every read site, and in exchange nothing about this class can ever lie about its own state.",
    },
  ];

  /**
   * Sample: `useDefineForClassFields` — the legacy expectation. A class field
   * on the subclass, assumed to invoke the base's setter like a plain write.
   */
  protected readonly defineLegacySample = `class Base {
  #v = 0;
  get value() { return this.#v; }
  set value(n) {
    console.log('setter ran');
    this.#v = Math.max(0, n);
  }
}

class Legacy extends Base {
  value = 5;   // pre-ES2022 target: this WAS a plain assignment
}
// → logs "setter ran"; #v is now 5`;

  /**
   * Sample: `useDefineForClassFields` — what actually happens on this repo's
   * target (ES2022, the flag defaults to `true`).
   */
  protected readonly defineModernSample = `class Base {
  #v = 0;
  get value() { return this.#v; }
  set value(n) {
    console.log('setter ran');
    this.#v = Math.max(0, n);
  }
}

class Modern extends Base {
  value = 5;   // this repo's target: this DEFINES an own property
}
// → nothing logged. Modern.value reads 5, but #v is still 0`;

  /**
   * Sample: the fix — `declare` tells the compiler the field is owned
   * elsewhere and emits nothing, so the plain assignment below it is real.
   */
  protected readonly defineFixSample = `class Fixed extends Base {
  declare value: number;   // type info only — ZERO emitted JavaScript

  constructor() {
    super();
    this.value = 5;        // now a plain assignment → runs the inherited setter
  }
}`;

  /** Question for {@link defineFieldsQuiz}. Bound rather than inlined because it contains literal braces. */
  protected readonly defineFieldsQuestion =
    "A Base class declares set value(n) { … }. A subclass writes value = 5; as a plain field. On this repo's target (ES2022, useDefineForClassFields: true), what happens?";

  /**
   * The self-test on {@link defineLegacySample} / {@link defineModernSample}.
   *
   * The distractors are the two ways people explain this trap to themselves
   * wrongly: that TypeScript would catch it (it can't — this is pure runtime
   * semantics the type checker doesn't model), and that TypeScript would strip
   * the field (it never does, unless told to with `declare`).
   */
  protected readonly defineFieldsQuiz: QuizOption[] = [
    {
      text: 'It runs the inherited setter — a field assignment is just `this.value = 5` underneath.',
      why: 'That was true on older compile targets. Under `useDefineForClassFields`, a class field declaration uses `[[Define]]` semantics — closer to `Object.defineProperty` than to an assignment — and `[[Define]]` does not walk the prototype chain looking for an accessor to invoke.',
    },
    {
      text: 'It defines a brand-new own property called `value` on the instance. The inherited setter never runs.',
      correct: true,
      why: 'Right, and this is what makes the trap dangerous: nothing errors, nothing warns. `instance.value` reads back `5` either way, so the bug hides behind a value that LOOKS correct while `#v` — whatever the setter was actually guarding — never gets touched.',
    },
    {
      text: "TypeScript raises a compile error, because you can't shadow an accessor with a plain field.",
      why: "It compiles cleanly. TypeScript checks that `5` is assignable to `number` and stops there — it has no rule against a field shadowing an inherited accessor, because `[[Define]]` vs `[[Set]]` is a runtime semantics question the type checker doesn't model at all.",
    },
    {
      text: 'Nothing — TypeScript strips the field declaration since a setter with the same name already exists.',
      why: 'TypeScript never silently strips a class field; every one you write becomes real JavaScript, unless you mark it `declare` yourself. That IS the fix — `declare` is the one keyword that tells the compiler not to emit the field at all, because something else already owns the slot.',
    },
  ];

  /**
   * Sample: parameter properties, and the field-initializer form `inject()`
   * uses instead of a constructor parameter list.
   */
  protected readonly paramPropsSample = `class UserService {
  constructor(private http: HttpClient) {}
  // desugars to:
  //   private http;
  //   constructor(http) { this.http = http; }
}

class ModernUserService {
  private http = inject(HttpClient);   // field initializer — no constructor at all
}`;

  /** Line-by-line walkthrough of {@link paramPropsSample}. */
  protected readonly paramPropsNotes: CodeNote[] = [
    {
      line: 2,
      text: '`private` in front of a constructor **parameter** is sugar that does two jobs from one word: it declares `http` as a field on the class, AND assigns the incoming argument to it — exactly as spelled out in the comment below. This is why classic Angular constructors read like dependency lists.',
    },
    {
      line: 9,
      text: '`inject(HttpClient)` works here because a field initializer runs during construction, inside an **injection context** — the same context a constructor parameter list gets. Call `inject()` later, say from a click handler, and it throws: the injection context is already closed by then.',
    },
  ];

  /**
   * Sample: `super`, `override`, and `noImplicitOverride`.
   */
  protected readonly inheritanceSample = `class Base {
  greet() {
    return 'hi';
  }
}

class Loud extends Base {
  override greet() {
    return super.greet().toUpperCase();
  }
}`;

  /** Line-by-line walkthrough of {@link inheritanceSample}. */
  protected readonly inheritanceNotes: CodeNote[] = [
    {
      line: 8,
      text: '`override` is required here because this project turns on `noImplicitOverride` — the compiler now verifies that `Base` genuinely declares a `greet` to override. Omit it and the build fails, even though the code would run fine.',
    },
    {
      line: 9,
      text: '`super.greet()` calls the BASE implementation explicitly, then transforms its result. This is composing behavior on top of the base, not replacing it — `override` alone would let you replace it instead, just by not calling `super`.',
    },
  ];

  /**
   * Sample: the `this`-detachment demo, as annotated source.
   */
  protected readonly thisLossSample = `class Greeter {
  constructor(private name: string) {}

  greetMethod() {
    return 'hi from ' + (this?.name ?? 'MISSING');   // \`this\` depends on the CALL, not the definition
  }

  greetArrow = () => 'hi from ' + this.name;          // \`this\` captured once, at construction
}

const g = new Greeter('Ada');
const fn = g.greetMethod;
fn();                     // 'hi from MISSING' — this was undefined; \`this?.\` reported it politely
[1].map(g.greetArrow);    // 'hi from Ada' — arrow field survived detachment`;

  /** Line-by-line walkthrough of {@link thisLossSample}. */
  protected readonly thisLossNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Another parameter property — `private name` is declared and assigned in one word, exactly like the earlier `UserService` example.',
    },
    {
      line: 5,
      text: 'A normal **method**. `this` inside it is decided entirely by how the method is CALLED — `g.greetMethod()` binds `this` to `g`; a bare call binds nothing. The `this?.` here is defensive: it reports the loss instead of throwing.',
    },
    {
      line: 8,
      text: 'An arrow **field**. Arrow functions never have their own `this` — they close over whatever `this` was in scope where they were WRITTEN, which for a class field is the instance being constructed. That binding is locked in forever, at the cost of one function object per instance instead of one shared on the prototype.',
    },
    {
      line: 12,
      text: '`const fn = g.greetMethod` copies the FUNCTION VALUE, not a bound-to-`g` version of it — JavaScript has no such thing by default. This is the exact moment the method gets "detached" from `g`.',
    },
    {
      line: 14,
      text: "`g.greetArrow` is passed to `.map` the same way — also detached from `g` as a bare reference — and it still works, because its `this` was never `g`'s binding to begin with; it was captured permanently back at construction.",
    },
  ];

  // ── Copy that cannot live in the template ─────────────────────────────────
  //
  // Angular's template parser reads a bare `{` in text or in an attribute
  // value as the start of an ICU expression, so any copy containing braces has
  // to be bound rather than typed inline (CONTRIBUTING §2A). The rest of the
  // long strings live here too, so the template stays scannable.

  /** Sample: the failing chain — `increment` returns the base type, not `this`. */
  protected readonly chainWrongSample = `class Counter {
  private value = 0;

  increment(by = 1): Counter {   // ← returns the BASE type explicitly
    this.value += by;
    return this;
  }
}

class SteppedCounter extends Counter {
  step = 10;
  bump() {
    return this.increment(this.step);
  }
}

const s = new SteppedCounter();
s.increment(1).bump();`;

  /** The reveal for {@link chainWrongSample}. */
  protected readonly chainAnswer =
    "No — **TS2339: Property 'bump' does not exist on type 'Counter'.** `increment` is explicitly typed to return `Counter`, so `s.increment(1)` is `Counter`, even though `s` really is a `SteppedCounter` — the extra information about which subclass actually called it was thrown away the moment you wrote `: Counter`. Change the annotation to `: this` and it comes back: `this` as a return type means **'whatever type the caller's own type was'**, so `s.increment(1)` is `SteppedCounter` again and `.bump()` resolves.";

  /** The fixed version — `this` instead of the base class name. */
  protected readonly chainFixSample = `class Counter {
  private value = 0;

  increment(by = 1): this {   // ← polymorphic: "whatever type called me"
    this.value += by;
    return this;
  }
}

// now s.increment(1) is SteppedCounter, and .bump() resolves`;

  /**
   * Sample: `abstract` vs `implements` — the difference between inherited
   * implementation and a shape-only check.
   */
  protected readonly implementsSample = `interface Comparable {
  compareTo(other: this): number;
}

abstract class Shape {
  abstract area(): number;          // subclasses MUST implement — no body allowed here
  describe() {
    return 'area=' + this.area();   // shared, concrete logic
  }
}
// new Shape();   // TS2511 — cannot create an instance of an abstract class

class Circle extends Shape implements Comparable {
  constructor(private r: number) {
    super();
  }
  area() {
    return Math.PI * this.r ** 2;
  }
  compareTo(other: this) {
    return this.area() - other.area();
  }
}`;

  /** Line-by-line walkthrough of {@link implementsSample}. */
  protected readonly implementsNotes: CodeNote[] = [
    {
      line: 2,
      text: '`other: this` is a **this-typed parameter**: it says "whatever concrete class implements `Comparable`, `compareTo` only accepts one of the SAME class" — not just anything that happens to also be `Comparable`.',
    },
    {
      line: 6,
      text: '`abstract area(): number` has no body at all — it is a contract, not code. Every concrete subclass is compiler-forced to supply one.',
    },
    {
      line: 8,
      text: "`describe()` IS a real method body, inherited as-is by every subclass. Mixing a method that MUST be supplied with one that's ALREADY supplied is the entire value an abstract class adds over a plain interface.",
    },
    {
      line: 11,
      text: 'Abstract classes cannot be instantiated directly — the compiler rejects `new Shape()` even though `Shape` is a real, runtime constructor function underneath.',
    },
    {
      line: 13,
      text: '`extends` inherits **implementation** — one base class maximum. `implements` only **checks the shape** — as many as you like, and it leaves zero trace at runtime; the emitted JavaScript for this line is just `class Circle extends Shape`.',
    },
    {
      line: 20,
      text: 'Writing `other: this` here is not optional decoration — `implements` gives a method body no contextual typing at all, so every parameter needs its own annotation. The next section is entirely about what happens when you leave one off.',
    },
  ];

  /** Sample: `implements` gives a member no contextual typing. */
  protected readonly contextualWrongSample = `interface Repository<T> {
  save(item: T): void;
}

class UserRepo implements Repository<User> {
  save(item) {              // TS7006: Parameter 'item' implicitly has an 'any' type
    console.log(item);
  }
}`;

  /** Sample: an object literal assigned to an interface-typed variable IS contextually typed. */
  protected readonly contextualRightSample = `interface Repository<T> {
  save(item: T): void;
}

const repo: Repository<User> = {
  save(item) {               // item: User — inferred from the interface, no annotation needed
    console.log(item);
  },
};`;

  /**
   * Sample: a class as a type (an instance shape) and as a value (the
   * constructor itself), plus the constructor-type syntax DI providers use.
   */
  protected readonly typeValueSample = `class User {
  name = '';
}

const u: User = new User();          // type position: describes an INSTANCE shape
const ctor: typeof User = User;      // value position: the constructor itself

function make(C: new () => User): User {
  return new C();
}`;

  /** Line-by-line walkthrough of {@link typeValueSample}. */
  protected readonly typeValueNotes: CodeNote[] = [
    {
      line: 5,
      text: '`User` here is a **type**, and it means "an instance shaped like `User`" — the thing `new User()` produces, never the constructor itself.',
    },
    {
      line: 6,
      text: '`typeof User` means "the constructor function itself." `User` used bare, in a VALUE position, IS that constructor — callable with `new`, assignable, passable as an argument.',
    },
    {
      line: 8,
      text: '`new () => User` is a **constructor type**: "anything callable with `new` that produces a `User`." This is exactly the shape Angular DI\'s `useClass` wants — the provider needs something it can `new` up on demand, not an instance you hand it once.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "If `private` does nothing at runtime, what's even the point?",
      a: "Plenty, just not the point people assume. `private` buys you compiler-checked encapsulation — every accidental reach into internals from outside the class is caught at build time, before it ships — and it costs nothing at runtime because there's nothing to enforce. What it does NOT buy you is security: a field you're not supposed to touch is one `(obj as any).field` away from being touched anyway. If the value genuinely must be unreachable — a secret, a brand check nobody can forge — reach for `#private` instead; that one the engine itself refuses to hand over. And it refuses more thoroughly than you might expect: there's no dynamic escape hatch either, because `obj['#hard']` reaches for a normal string-keyed property that was never there in the first place — a private name isn't one — and `#hard` never shows up in `JSON.stringify(obj)` or `{ ...obj }`, which only ever see real, enumerable, string- or symbol-keyed properties.",
    },
    {
      q: "I keep hitting 'Property has no initializer' on fields Angular fills in for me — `@ViewChild`, resolvers. Do I have to use `!`?",
      a: "Often there's a better fix. If nothing reads the field before Angular sets it, `declare` is more honest than `!` — it tells the compiler 'something else owns this slot' without also claiming you assigned it inline. Save `!` for the case where you can point at the exact line that assigns it before first read; reach for `| null` when you genuinely can't.",
    },
    {
      q: "Why did my subclass field silently stop calling the base class's setter?",
      a: "You hit `useDefineForClassFields`, almost certainly without meaning to. On this repo's target (ES2022+), a class field declaration DEFINES a fresh own property instead of running an inherited setter, even one with the exact same name. `declare value: number;` on the subclass, plus assigning it in the constructor, restores the old behavior; the newer `accessor` keyword is the other fix. This is exactly why Angular's own docs tell you to `declare` an `@Input()` you're re-declaring in a subclass — without it, the inherited input machinery gets silently shadowed the same way.",
    },
    {
      q: 'Do I need `override` on every method, or just the ones that actually change behavior?',
      a: "Just the ones that genuinely override something the base class already declares. A brand-new method the subclass adds — one the base never had — takes no `override`, because there's nothing to override. This project turns on `noImplicitOverride`, so the compiler checks both directions: forget `override` on a real override and it errors; add it to a method that ISN'T overriding anything (a typo, or the base method got renamed away) and it errors just as loudly. That second case is the one worth appreciating — it's what catches a silently-forked method the moment the base class changes underneath it.",
    },
    {
      q: "Why can an abstract class be an Angular DI token when an interface can't?",
      a: "DI tokens have to exist AT RUNTIME, because they're used as keys in the injector's internal map. An abstract class compiles to a real constructor function — a live value a token can point to — so `{ provide: Logger, useClass: ConsoleLogger }` with `abstract class Logger` works, and you get free typing plus the inability to instantiate the base by accident. An interface is erased to nothing before the JavaScript is emitted, so an interface-shaped dependency needs an `InjectionToken` instead — there's no `Logger` left at runtime to hand the injector.",
    },
    {
      q: 'The detachment bug above looks scary. Do I have to worry about it in my own Angular templates?',
      a: "Mostly not, and it's worth seeing why: `(click)=\"save()\"` is a call expression, evaluated fresh on every click with `this` bound correctly by the parentheses — you're never handing Angular a bare method reference to detach in the first place. You DO hit the real bug the moment you pass a method as a VALUE instead of calling it: `items.map(this.transform)`, `someEmitter.subscribe(this.onNext)`, a callback prop. Three fixes, cheapest-to-set-up first: wrap it in an arrow at the call site — `() => this.transform(x)` — zero class changes, but a new closure every time it runs; `.bind(this)` once, usually in the constructor — keeps the original method on the prototype, but the bound copy is a second function that's awkward to spy on in tests; or make it an arrow field from the start, exactly what `greetArrow` above does — immune to detachment permanently, at the one-function-per-instance cost the mechanism section already named.",
    },
  ];

  /**
   * The self-test on the `this`-detachment demo.
   *
   * The distractors are the beliefs a learner brings in from other languages
   * (`this` follows the object) or from half-remembering the arrow-field fix
   * (assuming it applies to every method). The `why` on each names that
   * specific misconception rather than only restating the right answer.
   */
  protected readonly thisQuiz: QuizOption[] = [
    {
      text: "'Ada' — this still points at g, wherever the function ends up.",
      why: 'This is the mistake the whole section exists to correct. `this` is decided by HOW a function is called, never by where it was defined or which object it came from. A bare call — `fn()` — passes no receiver at all.',
    },
    {
      text: 'undefined — the method was detached from g the moment it was assigned to a plain variable.',
      correct: true,
      why: 'Exactly. `const fn = g.greetMethod` copies the function VALUE, not a binding to `g`. Called as `fn()`, `this` inside it is `undefined` — every file in this project compiles as strict mode, so there is no silent fallback to a global object.',
    },
    {
      text: "A compile error — TypeScript won't let you assign a method to a plain variable.",
      why: 'TypeScript happily allows this; a method reference is just a function value like any other. The type checker has no way to know it will later be called detached, so nothing here gets flagged.',
    },
    {
      text: "'Ada' — arrow-defined methods and normal methods behave identically once called.",
      why: "They don't, and that gap is the entire reason `greetArrow` exists as a second version in the same class. A normal method's `this` depends on the call site; an arrow-function FIELD captures `this` once, when the instance is built, and keeps it forever — which is exactly why only the arrow survives detachment two lines down.",
    },
  ];
}
