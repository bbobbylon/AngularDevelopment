import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Chapter, CodeLab } from '../../../shared/brain';
import type { ChapterStop, CodeNote } from '../../../shared/brain';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * Demo class for parameter properties, `readonly`, and a getter.
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
   * @param by How much to add.
   * @returns This counter.
   */
  increment(by = 1) {
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
    return `hi from ${this?.name ?? 'undefined (this was lost!)'}`;
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
  greetArrow = () => `hi from ${this.name}`;
}

/**
 * Lesson: Classes & access modifiers — what a class desugars to, field
 * initialization order, the soft-vs-hard privacy split (and how `private`
 * makes an otherwise-structural class nominal), parameter properties vs
 * inject(), inheritance with noImplicitOverride, `this`-loss and the
 * arrow-field fix with a live broken-vs-bound demo, abstract vs implements,
 * and the class-is-both-type-and-value duality.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9); shape and teaching order copied from
 * `expert/change-detection`, the reference implementation.
 *
 * 1. **Pose the problem before naming it** is less apt here than for a
 *    runtime-behaviour lesson — this page opens on the lead's own claim
 *    instead ("a class is JavaScript's prototype system in formal dress")
 *    and spends the rest of the page proving which parts of the dress are
 *    real.
 * 2. **Analogy next, mechanism after.** "A sign on the door vs a locked
 *    door" gives the reader somewhere to put `private` and `#hard` before
 *    those words arrive — and it's the exact question the exam corner asks
 *    first.
 * 3. **Then the same idea in several modes** — a construction-order flow
 *    diagram, a predict on the exact bug that order causes, a quiz on
 *    runtime privacy, and six line-annotated snippets — because redundancy
 *    across modes is the retention tool, not repetition within one.
 * 4. **Every snippet is annotated line by line** via `app-code-lab`. This
 *    lesson is unusually code-dense — it's a lesson *about* class syntax —
 *    so unlike most migrations, all six samples get full notes rather than
 *    leaving the illustrative ones plain.
 */
@Component({
  selector: 'app-lesson-ts-classes',
  imports: [RouterLink, BfPage, Chapter, CodeLab, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './classes.html',
  styleUrl: './classes.css',
})
export class Classes {
  /**
   * The counter behind the live demo.
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
  protected bump(by: number) {
    this.counter.increment(by);
    this.display.set(this.counter.current);
  }

  /**
   * Runs the detached-call demo: pulls both the method and the arrow property off
   * a fresh instance, calls them bare, and shows that only the arrow still knows
   * what `this` was.
   */
  protected callDetached() {
    const g = new Greeter('Ada');
    const method = g.greetMethod;
    const arrow = g.greetArrow;
    this.detachedResult.set({ method: method(), arrow: arrow() });
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** Neighbouring TypeScript concepts, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Types', id: 'ts-types' },
    { label: 'Interfaces', id: 'ts-interfaces' },
    { label: 'Classes' },
    { label: 'Generics', id: 'ts-generics' },
    { label: 'Enums', id: 'ts-enums' },
    { label: 'Narrowing', id: 'ts-narrowing' },
  ];

  /** Sample: field initializers, a static counter, and a getter/setter pair. */
  readonly fieldsSample = `class Counter {
  private value = 0;          // field initializer
  static instances = 0;       // ONE slot shared by the class (Counter.instances)
  readonly id = crypto.randomUUID();

  constructor(public label: string) { Counter.instances++; }

  get current() { return this.value; }              // getter — computed on read
  set current(v: number) { this.value = Math.max(0, v); } // setter — validate on write
  increment(by = 1) { this.value += by; return this; }   // returns this → chainable
}`;

  /** Line-by-line walkthrough of {@link fieldsSample}. */
  protected readonly fieldsNotes: CodeNote[] = [
    {
      line: 2,
      text: 'A field initializer — runs before **any** constructor code, base or derived, as if pasted at the very top.',
    },
    {
      line: 3,
      text: '`static` fields live on the **class itself**, not on instances — one slot total, shared by every `Counter`. Access it as `Counter.instances`, never `this.instances`.',
    },
    {
      line: 4,
      text: "`readonly` is checked at compile time only: TypeScript stops you writing `id = …` again anywhere else in the class, but nothing stops a runtime `(c as any).id = 'x'`.",
    },
    {
      line: 6,
      text: '`public label` in the constructor signature is a **parameter property** — shorthand that both declares the field and assigns it, in one place. `Counter.instances++` runs after every field initializer above it has already set up the instance.',
    },
    {
      line: 8,
      text: 'A getter — reads like a property (`c.current`, no parens) but runs code on every access.',
    },
    {
      line: 9,
      text: 'A setter completes the pair — `c.current = 5` runs this instead of just overwriting a field, which is what makes validation on write possible.',
    },
    {
      line: 10,
      text: 'Returning `this` is what makes `c.increment().increment(5)` chain — each call returns the same instance for the next call to land on.',
    },
  ];

  /**
   * The construction-order mnemonic, as a picture. `warn`-toned steps are
   * where the predict below's bug actually happens — a subclass override
   * dispatched from the base constructor runs before the subclass's own
   * field initializers do.
   */
  protected readonly constructionFlow: FlowStep[] = [
    { label: 'Base field inits', detail: 'Run first, in declaration order.' },
    {
      label: 'Base constructor body',
      detail: "An override call here dispatches to the SUBCLASS's method — real polymorphism.",
      tone: 'warn',
    },
    {
      label: 'Derived field inits',
      detail: "…but these haven't run yet — one step too late for the call above to see them.",
      tone: 'warn',
    },
    {
      label: 'Derived constructor body',
      detail: 'Runs last. Only now is the object fully built.',
      tone: 'good',
    },
  ];

  /** Sample: hard vs soft privacy, and the brand-check trick `#hard` enables. */
  readonly privacySample = `class Vault {
  private soft = 'ts-only';
  #hard = 'engine-enforced';

  static isVault(x: unknown): x is Vault { return #hard in x; }  // brand check!
}
const v = new Vault();
(v as any).soft;    // works at runtime — private was erased
(v as any).#hard;   // ❌ SyntaxError — the engine itself refuses`;

  /** Line-by-line walkthrough of {@link privacySample}. */
  protected readonly privacyNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The sign on the door: `private` is a compile-time-only check. It exists purely to make TypeScript complain if other TypeScript code reaches in — the emitted JavaScript for this line is an ordinary, fully public field.',
    },
    {
      line: 3,
      text: 'The locked door: `#hard` is a native JavaScript feature, not a TypeScript invention. The engine itself refuses access from outside the class body — no cast, no trick, gets past it.',
    },
    {
      line: 5,
      text: '`#hard in x` is a **brand check** — asks "does this specific object have my private field" without ever reading its value. Only real `Vault` instances answer true, which is what makes it useful for verifying an object actually came from this class.',
    },
    {
      line: 8,
      text: "Compiles and runs with no error. `as any` defeats TypeScript's compile-time check, and there's nothing left underneath to catch the read — `private` doesn't exist anymore by the time this executes.",
    },
    {
      line: 9,
      text: 'A `SyntaxError`, not a TypeScript error — this fails even in a plain `.js` file with no type checker in sight. The engine parses `#hard` as a private name and refuses the reference outright.',
    },
  ];

  /** Sample: parameter properties and their modern `inject()` replacement. */
  readonly paramPropsSample = `constructor(private http: HttpClient) {}
// sugar for:  private http; constructor(http) { this.http = http; }

// modern Angular avoids the constructor entirely:
private http = inject(HttpClient);`;

  /** Line-by-line walkthrough of {@link paramPropsSample}. */
  protected readonly paramPropsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'One word — `private` — turns an ordinary constructor parameter into **both** a field declaration and an assignment. Nothing else in the class needs to mention `http` again.',
    },
    {
      line: 2,
      text: 'What that sugar actually expands to: a separate field declaration, plus a plain assignment inside the constructor body. Two lines pretending to be zero.',
    },
    {
      line: 5,
      text: "`inject()` reads the current injector directly, with no constructor parameter needed at all — which is what lets a **field initializer itself** depend on an injected service, something a parameter property can't do for another field.",
    },
  ];

  /** Sample: `override` and `noImplicitOverride`. */
  readonly overrideSample = `class Base { greet() { return 'hi'; } }
class Loud extends Base {
  override greet() { return super.greet().toUpperCase(); }
}`;

  /** Line-by-line walkthrough of {@link overrideSample}. */
  protected readonly overrideNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The method being overridden. Lives once on `Base.prototype` — every `Base` instance shares this exact function object.',
    },
    {
      line: 3,
      text: "`override` is TypeScript-only and compiles away completely. Its whole job is making the compiler verify a method by this name really exists on `Base` — rename or remove `greet` up there and this line becomes a compile error instead of a silent fork. `super.greet()` calls the base version explicitly, which is how `Loud` reuses `'hi'` instead of redefining it.",
    },
  ];

  /** Sample: a method losing `this` on detachment, and the arrow-field fix. */
  readonly thisLossSample = `class Greeter {
  constructor(private name: string) {}
  greetMethod() { return \`hi from \${this.name}\`; }   // this = whoever CALLS it
  greetArrow = () => \`hi from \${this.name}\`;       // this = captured at construction
}
const g = new Greeter('Ada');
const fn = g.greetMethod;
fn();               // 💥 this is undefined — the method was detached from g
[1].map(g.greetArrow); // ✅ arrow field survives detachment`;

  /** Line-by-line walkthrough of {@link thisLossSample}. */
  protected readonly thisLossNotes: CodeNote[] = [
    {
      line: 3,
      text: "A normal method. `this` inside it is decided **entirely by how it's called** — `g.greetMethod()` binds `this` to `g`, but the function itself carries no memory of which object it belongs to.",
    },
    {
      line: 4,
      text: 'An arrow function assigned as a field. Arrow functions never have their own `this` — they close over whatever `this` was in scope when the arrow was created, which here is the instance under construction. That binding is permanent.',
    },
    {
      line: 7,
      text: "Pulling the method off the instance into a bare variable. The function itself is unchanged, but it's no longer attached to `g` — nothing about `fn` remembers where it came from.",
    },
    {
      line: 8,
      text: '`this` inside is `undefined` (strict mode), because nothing sits to the left of this call. `this` was never "in" the function — it was supplied by `g.` at the call site, and that\'s gone.',
    },
    {
      line: 9,
      text: "Passed by reference into `.map`, exactly like line 8's detachment — but this one works, because `greetArrow` never depended on a call site to know `this` in the first place.",
    },
  ];

  /** Sample: `abstract` (real, shared logic + a runtime constructor) vs `implements` (erased). */
  readonly abstractSample = `abstract class Shape {
  abstract area(): number;          // subclasses MUST implement — no body here
  describe() { return \`area=\${this.area()}\`; }  // shared concrete logic
}
// new Shape();  ❌ cannot instantiate an abstract class

class Circle extends Shape implements Comparable {
  constructor(private r: number) { super(); }
  area() { return Math.PI * this.r ** 2; }
}`;

  /** Line-by-line walkthrough of {@link abstractSample}. */
  protected readonly abstractNotes: CodeNote[] = [
    {
      line: 2,
      text: "No body — `abstract` means every concrete subclass **must** supply one. TypeScript enforces this at compile time; there's nothing to call at runtime because `Shape` itself can never be constructed.",
    },
    {
      line: 3,
      text: "Concrete, shared logic every subclass gets for free, and which already relies on `area()` existing — it doesn't care **how** a subclass computes it, only that it can.",
    },
    {
      line: 5,
      text: 'Rejected at compile time — `Shape` has an unimplemented member, so `new` on it is illegal by construction, not by convention.',
    },
    {
      line: 7,
      text: '`extends` (one base, brings real implementation) and `implements` (any number, checks shape only, zero runtime effect) doing different jobs on the same line — `Comparable` contributes nothing to the compiled output, only a compile-time obligation.',
    },
    {
      line: 9,
      text: "This satisfies `Shape`'s contract. Leave it out and the `class Circle` line itself becomes the compile error — not a runtime crash somewhere later.",
    },
  ];

  /**
   * The predict: the construction-order bug in concrete, runnable form,
   * different wording from the matching FAQ item on purpose (a lesson
   * should make the same trap unmistakable from more than one angle).
   */
  protected readonly predictCode = `class Base {
  constructor() { this.setup(); }
  setup() {}
}
class Derived extends Base {
  ready = true;
  override setup() {
    console.log(this.ready);   // ?
  }
}
new Derived();`;

  /**
   * The self-test: runtime privacy, paired with the sign-vs-lock analogy
   * above. Distractors name the two ways learners get `private` vs `#hard`
   * backwards (CONTRIBUTING §2A: the `why` on a wrong answer is where the
   * correction actually happens).
   */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'Neither — both `private` and `#hard` block outside access.',
      why: "True for `#hard`, false for `private`. TypeScript's access modifiers are a compile-time-only check; the compiler erases them and emits a completely ordinary public field.",
    },
    {
      text: 'Only `soft` — `private` is erased at compile time, so the emitted JS field is just a normal property.',
      correct: true,
      why: '`(vault as any).soft` — or even plain DevTools — reads it with no resistance at all. `#hard` is real, engine-enforced privacy: no cast, no trick reaches it from outside the class body.',
    },
    {
      text: 'Only `#hard` — the `#` syntax is newer, so it must be the one TypeScript enforces at compile time.',
      why: "Backwards. `#hard` is a native JavaScript feature enforced by the engine itself — TypeScript's **own** `private` keyword is the one that's compile-time-only and vanishes on build.",
    },
    {
      text: 'Both — once compiled, all class fields become inaccessible from outside.',
      why: "Compiling doesn't add protection, it can only remove what TypeScript was checking. `soft` compiles down to an ordinary mutable property with zero runtime protection.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: '`private` vs `#private` — name every difference that matters.',
      a: "(1) Enforcement: `private` is erased — runtime access via `(obj as any).x` or DevTools works; `#x` is engine-enforced, inaccessible, full stop. (2) Typing: both make the class nominal for assignability. (3) Mechanics: `#x` can't be accessed dynamically (`obj['#x']` misses), supports the `#x in obj` brand check, and isn't visible in `JSON.stringify`/spread. (4) Tooling: `private` is friendlier to tests that poke internals — which is either a feature or the problem, depending on your test philosophy.",
    },
    {
      q: 'Why must `super()` run before a subclass constructor touches `this`?',
      a: "Because `this` doesn't exist yet. The base class is what actually allocates the object — a subclass constructor is really just \"more setup to run after the base finishes building it.\" Reading `this.name` before `super()` isn't a style violation, it's a genuine `ReferenceError`: engine law, not a TypeScript rule.",
    },
    {
      q: "Why can an abstract class be an Angular DI token when an interface can't?",
      a: 'DI tokens must exist *at runtime* to be map keys in the injector. An abstract class compiles to a real constructor function — a live object — so `provide: Logger` works and even gives free typing plus the inability to instantiate the base. Interfaces are erased to nothing, so interface-shaped dependencies need an `InjectionToken` instead.',
    },
    {
      q: '`<button (click)="this.save">`-style bugs: a callback passed as `obj.method` logs `this` as undefined. Three fixes, and their costs?',
      a: '(1) Wrap at the call site: `() => obj.method()` — zero class changes, creates a closure per use. (2) Bind once: `this.method = this.method.bind(this)` in the constructor — keeps the method on the prototype but adds ceremony. (3) Arrow field: `method = () => …` — immune to detachment, but one function per instance and awkward to spy on in tests. Angular templates rarely hit this because `(click)="save()"` is already a call expression, not a bare reference.',
    },
  ];
}
