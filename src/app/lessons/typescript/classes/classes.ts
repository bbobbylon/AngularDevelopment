import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Classes & access modifiers — what a class desugars to, field
 * initialization order, the soft-vs-hard privacy split (and how `private`
 * makes an otherwise-structural class nominal), parameter properties vs
 * inject(), inheritance with noImplicitOverride, `this`-loss and the
 * arrow-field fix with a live broken-vs-bound demo, abstract vs implements,
 * and the class-is-both-type-and-value duality.
 */

class Counter {
  // parameter properties: declare + assign in one place
  constructor(
    public readonly label: string,
    private value = 0,
  ) {}

  get current() {
    return this.value;
  }
  increment(by = 1) {
    this.value += by;
    return this;
  }
}

class Greeter {
  constructor(private name: string) {}

  // method — `this` depends on HOW it's called
  greetMethod() {
    return `hi from ${this?.name ?? 'undefined (this was lost!)'}`;
  }

  // arrow field — `this` captured lexically at construction
  greetArrow = () => `hi from ${this.name}`;
}

@Component({
  selector: 'app-lesson-ts-classes',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Type System</span>
      <h1>Classes & Access Modifiers</h1>
      <p class="lead">
        Angular is class-based — components, services, directives and pipes are all
        classes. Under the hood a class is still JavaScript's prototype system in
        formal dress: the class is a constructor function, methods live once on the
        prototype, and fields are per-instance. TypeScript layers access modifiers,
        parameter properties and abstract members on top — all erased at runtime
        except the JS-native <code>#private</code> form. Knowing which parts are
        real and which are compiler fiction is the theme of this page.
      </p>

      <h2>Fields, constructor &amp; methods — and initialization order</h2>
      <div class="code"><pre>class Counter {{ '{' }}
  private value = 0;          // field initializer
  static instances = 0;       // ONE slot shared by the class (Counter.instances)
  readonly id = crypto.randomUUID();

  constructor(public label: string) {{ '{' }} Counter.instances++; {{ '}' }}

  get current() {{ '{' }} return this.value; {{ '}' }}              // getter — computed on read
  set current(v: number) {{ '{' }} this.value = Math.max(0, v); {{ '}' }} // setter — validate on write
  increment(by = 1) {{ '{' }} this.value += by; return this; {{ '}' }}   // returns this → chainable
{{ '}' }}</pre></div>
      <p>Order matters and is exam bait:</p>
      <ul>
        <li><strong>Field initializers run as if pasted at the top of the constructor</strong>, in declaration order, <em>before</em> your constructor body. So <code>readonly id = …</code> is set before <code>Counter.instances++</code> executes.</li>
        <li>In a subclass, the base constructor (and base field initializers) complete before the subclass's field initializers run — which is why reading an overridden field from a base constructor sees the <em>base</em> value. Avoid calling overridable methods from constructors.</li>
        <li>Methods live on the prototype (one copy total); arrow-function fields live on <em>each instance</em> (one copy per object) — the trade-off behind the <code>this</code> section below.</li>
      </ul>

      <h2>Access modifiers — soft privacy vs hard privacy</h2>
      <table class="t">
        <tr><td><code>public</code></td><td>Default. Accessible everywhere.</td></tr>
        <tr><td><code>private</code></td><td>Only inside the declaring class — <strong>compile-time only</strong>; the property is plainly visible in the emitted JS, in DevTools, and via <code>obj['value']</code>.</td></tr>
        <tr><td><code>protected</code></td><td>The class and its subclasses.</td></tr>
        <tr><td><code>readonly</code></td><td>Set once (declaration or constructor), then immutable — compile-time, shallow.</td></tr>
        <tr><td><code>#name</code></td><td>JS-native <strong>hard</strong> private — enforced by the engine. Truly inaccessible outside the class; survives compilation because it IS JavaScript.</td></tr>
      </table>
      <div class="code"><pre>class Vault {{ '{' }}
  private soft = 'ts-only';
  #hard = 'engine-enforced';

  static isVault(x: unknown): x is Vault {{ '{' }} return #hard in x; {{ '}' }}  // brand check!
{{ '}' }}
const v = new Vault();
(v as any).soft;    // works at runtime — private was erased
(v as any).#hard;   // ❌ SyntaxError — the engine itself refuses</pre></div>
      <p>
        A subtle type-system consequence: <code>private</code>/<code>#</code> members
        make a class <strong>nominal</strong>. Two classes with identical shapes are
        normally interchangeable (structural typing), but a private member is only
        compatible with <em>the same declaration</em> — so
        <code>class A {{ '{' }} private x = 1 {{ '}' }}</code> and an identical
        <code>class B</code> are <em>not</em> assignable to each other. Teams exploit
        this for "branded" types that must not be mixed up.
      </p>
      <div class="note">
        Angular templates can only read <code>public</code> and <code>protected</code>
        members — hence the convention in this codebase: template-facing state is
        <code>protected</code>, true internals are <code>private</code>. The
        template type-checker enforces it at build time.
      </div>

      <h2>Parameter properties — and the <code>inject()</code> shift</h2>
      <div class="code"><pre>constructor(private http: HttpClient) {{ '{' }}{{ '}' }}
// sugar for:  private http; constructor(http) {{ '{' }} this.http = http; {{ '}' }}

// modern Angular avoids the constructor entirely:
private http = inject(HttpClient);</pre></div>
      <p>
        Parameter properties are why classic Angular constructors looked like
        dependency lists. The field-initializer form with <code>inject()</code> wins
        on three fronts: it works in field initializers themselves (so a field can
        depend on a service), it survives class inheritance without re-declaring
        constructor params, and it doesn't rely on parameter <em>decorator
        metadata</em>. One rule transfers: both forms only work in an
        <em>injection context</em> — construction time. Calling <code>inject()</code>
        later (in a click handler) throws.
      </p>

      <h2>Inheritance, <code>super</code> &amp; <code>override</code></h2>
      <div class="code"><pre>class Base {{ '{' }} greet() {{ '{' }} return 'hi'; {{ '}' }} {{ '}' }}
class Loud extends Base {{ '{' }}
  override greet() {{ '{' }} return super.greet().toUpperCase(); {{ '}' }}
{{ '}' }}</pre></div>
      <ul>
        <li>A subclass constructor <strong>must call <code>super()</code> before touching <code>this</code></strong> — the base class builds the object first; that's engine law, not a TS rule.</li>
        <li>This project enables <code>noImplicitOverride</code>: overriding without the <code>override</code> keyword is an error. The payoff is the reverse direction — if the <em>base</em> method is renamed or removed, every stale <code>override</code> becomes a compile error instead of silently forking behavior.</li>
        <li>Prefer composition to deep hierarchies: Angular itself moved from base-class patterns to composition (host directives, <code>inject()</code>-based helpers) for exactly the fragile-base-class reasons.</li>
      </ul>

      <h2><code>this</code> — the classic loss, live</h2>
      <div class="code"><pre>class Greeter {{ '{' }}
  constructor(private name: string) {{ '{' }}{{ '}' }}
  greetMethod() {{ '{' }} return \`hi from \${{ '{' }}this.name{{ '}' }}\`; {{ '}' }}   // this = whoever CALLS it
  greetArrow = () =&gt; \`hi from \${{ '{' }}this.name{{ '}' }}\`;       // this = captured at construction
{{ '}' }}
const g = new Greeter('Ada');
const fn = g.greetMethod;
fn();               // 💥 this is undefined — the method was detached from g
[1].map(g.greetArrow); // ✅ arrow field survives detachment</pre></div>
      <div class="demo">
        <p class="demo__title">Live — detach both and call them</p>
        <div class="row" style="margin-bottom:8px">
          <button (click)="callDetached()">detach &amp; call both</button>
        </div>
        @if (detachedResult(); as r) {
          <p>method: <strong>{{ r.method }}</strong></p>
          <p>arrow field: <strong>{{ r.arrow }}</strong></p>
        }
        <p style="font-size:.88rem;color:var(--text-muted)">
          Methods get <code>this</code> from the call site (<code>obj.m()</code> binds
          obj; bare <code>m()</code> binds undefined in strict mode). Arrow fields
          close over the instance. This is why event-handler callbacks passed by
          reference historically needed <code>.bind(this)</code> — arrow fields are
          the modern fix, at the cost of one function per instance.
        </p>
      </div>

      <h2>Abstract classes vs <code>implements</code></h2>
      <div class="code"><pre>abstract class Shape {{ '{' }}
  abstract area(): number;          // subclasses MUST implement — no body here
  describe() {{ '{' }} return \`area=\${{ '{' }}this.area(){{ '}' }}\`; {{ '}' }}  // shared concrete logic
{{ '}' }}
// new Shape();  ❌ cannot instantiate an abstract class

class Circle extends Shape implements Comparable {{ '{' }}
  constructor(private r: number) {{ '{' }} super(); {{ '}' }}
  area() {{ '{' }} return Math.PI * this.r ** 2; {{ '}' }}
{{ '}' }}</pre></div>
      <ul>
        <li><code>extends</code> inherits <em>implementation</em> (one base max); <code>implements</code> only <em>checks shape</em> (many allowed, zero runtime effect). Lifecycle hooks are the everyday example: <code>implements OnInit</code> makes the compiler verify <code>ngOnInit()</code> exists — but Angular calls the hook by name either way.</li>
        <li>Abstract classes survive to runtime (they're real constructors), which is why Angular DI can use one as a token: <code>{{ '{' }} provide: Logger, useClass: ConsoleLogger {{ '}' }}</code> with <code>abstract class Logger</code>. An interface could never be the token — it's erased.</li>
      </ul>

      <h2>A class is a type <em>and</em> a value</h2>
      <div class="code"><pre>class User {{ '{' }} name = ''; {{ '}' }}

const u: User = new User();      // type position: the INSTANCE shape
const ctor: typeof User = User;  // value position: the constructor itself
function make(C: new () =&gt; User) {{ '{' }} return new C(); {{ '}' }}  // constructor type</pre></div>
      <p>
        <code>User</code> the type means "an instance"; <code>typeof User</code>
        means "the constructor". The <code>new () =&gt; T</code> form is how factories
        and DI providers are typed — Angular's <code>useClass</code> accepts exactly
        a constructor type.
      </p>

      <h2>Try it</h2>
      <div class="demo">
        <p class="demo__title">Live — a Counter instance (note method chaining)</p>
        <div class="row">
          <button (click)="bump(1)">{{ label }} +1</button>
          <button class="ghost" (click)="bump(5)">+5</button>
          <span class="pill">current = {{ display() }}</span>
        </div>
        <p style="font-size:.88rem;color:var(--text-muted);margin-top:8px">
          The component holds one Counter built with parameter properties;
          <code>increment()</code> returns <code>this</code>, so
          <code>c.increment().increment(5)</code> chains. The signal mirrors
          <code>counter.current</code> because a plain class field isn't reactive —
          exactly why Angular state lives in signals, not raw class instances.
        </p>
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary><code>private</code> vs <code>#private</code> — name every difference that matters.</summary>
        <div>(1) Enforcement: <code>private</code> is erased — runtime access via
        <code>(obj as any).x</code> or DevTools works; <code>#x</code> is engine-enforced,
        inaccessible, full stop. (2) Typing: both make the class nominal for
        assignability. (3) Mechanics: <code>#x</code> can't be accessed dynamically
        (<code>obj['#x']</code> misses), supports the <code>#x in obj</code> brand
        check, and isn't visible in <code>JSON.stringify</code>/spread. (4) Tooling:
        <code>private</code> is friendlier to tests that poke internals — which is
        either a feature or the problem, depending on your test philosophy.</div>
      </details>
      <details class="qa">
        <summary>A base constructor calls <code>this.setup()</code>, which a subclass overrides using a subclass field. The field is undefined. Why?</summary>
        <div>Construction order: base constructor (including base field initializers)
        runs first, and it dispatches <code>setup()</code> <em>virtually</em> — the
        subclass override executes — but subclass field initializers haven't run
        yet. The override reads its own field too early. Fixes: don't call
        overridable methods from constructors, pass data via super() args, or use a
        lazy/init method invoked after construction. Angular sidesteps this by
        giving you <code>ngOnInit</code> as the "everything is wired now" hook.</div>
      </details>
      <details class="qa">
        <summary>Why can an abstract class be an Angular DI token when an interface can't?</summary>
        <div>DI tokens must exist <em>at runtime</em> to be map keys in the injector.
        An abstract class compiles to a real constructor function — a live object —
        so <code>provide: Logger</code> works and even gives you free typing plus
        the inability to instantiate the base. Interfaces are erased to nothing, so
        interface-shaped dependencies need an <code>InjectionToken</code> instead.
        The abstract-class-as-token pattern is the standard way to define swappable
        service contracts in Angular.</div>
      </details>
      <details class="qa">
        <summary><code>&lt;button (click)="this.save"&gt;</code>-style bugs: a callback passed as <code>obj.method</code> logs <code>this</code> as undefined. Three fixes, and their costs?</summary>
        <div>(1) Wrap at the call site: <code>() =&gt; obj.method()</code> — zero class
        changes, creates a closure per use. (2) Bind once:
        <code>this.method = this.method.bind(this)</code> in the constructor —
        keeps the method on the prototype but adds ceremony. (3) Arrow field:
        <code>method = () =&gt; …</code> — immune to detachment, but one function per
        instance and awkward to spy on prototypes in tests. In Angular templates
        you rarely hit this because <code>(click)="save()"</code> is already a call
        expression, not a reference.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Classes are constructor functions + prototypes; field initializers run before the constructor body, base before derived — never call overridables from constructors.</li>
        <li><code>private/protected/readonly</code> are compile-time (soft); <code>#name</code> is engine-enforced (hard). Any private member makes the class nominally typed.</li>
        <li>Parameter properties power classic constructor DI; <code>inject()</code> in field initializers is the modern form — both need an injection context.</li>
        <li><code>override</code> + <code>noImplicitOverride</code> guards both directions of rename drift; methods lose <code>this</code> when detached, arrow fields don't.</li>
        <li><code>abstract</code> = contract + shared code + runtime constructor (hence usable as a DI token); <code>implements</code> = erased shape check. A class name is an instance type; <code>typeof C</code> is the constructor.</li>
      </ul>

      <p><a routerLink="/ts-enums">Next: Enums &amp; Literal Unions →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 130px; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class Classes {
  private readonly counter = new Counter('clicks');
  protected readonly label = this.counter.label;
  protected readonly display = signal(this.counter.current);

  protected readonly detachedResult = signal<{ method: string; arrow: string } | null>(null);

  protected bump(by: number) {
    this.counter.increment(by);
    this.display.set(this.counter.current);
  }

  protected callDetached() {
    const g = new Greeter('Ada');
    const method = g.greetMethod;
    const arrow = g.greetArrow;
    this.detachedResult.set({ method: method(), arrow: arrow() });
  }
}
