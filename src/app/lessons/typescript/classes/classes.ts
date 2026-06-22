import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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

@Component({
  selector: 'app-lesson-ts-classes',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Type System</span>
      <h1>Classes & Access Modifiers</h1>
      <p class="lead">
        Angular is class-based — components, services, directives and pipes are all
        classes. TypeScript adds access modifiers, parameter properties, accessors and
        abstract members on top of standard JS classes (all erased at runtime except
        the JS-native <code>#private</code> form).
      </p>

      <h2>Fields, constructor & methods</h2>
      <div class="code">
        <pre>class Counter {{ '{' }}
  private value = 0;          // field with initializer
  static instances = 0;       // shared across all instances (Counter.instances)
  readonly id = crypto.randomUUID();

  constructor(public label: string) {{ '{' }} Counter.instances++; {{ '}' }}

  get current() {{ '{' }} return this.value; {{ '}' }}              // getter
  set current(v: number) {{ '{' }} this.value = Math.max(0, v); {{ '}' }} // setter
  increment(by = 1) {{ '{' }} this.value += by; return this; {{ '}' }}   // returns this → chainable
{{ '}' }}</pre>
      </div>

      <h2>Access modifiers</h2>
      <table class="t">
        <tr><td><code>public</code></td><td>Default. Accessible everywhere.</td></tr>
        <tr><td><code>private</code></td><td>Only inside the declaring class (compile-time only — still visible at runtime).</td></tr>
        <tr><td><code>protected</code></td><td>Inside the class and its subclasses.</td></tr>
        <tr><td><code>readonly</code></td><td>Set once (in declaration or constructor), then immutable.</td></tr>
        <tr><td><code>#name</code></td><td>JS-native <strong>hard</strong> private — actually inaccessible at runtime, not just hidden by types.</td></tr>
      </table>
      <div class="note">
        Angular templates can only read <code>public</code> and <code>protected</code>
        members — that's why component fields used in templates are typically
        <code>protected</code>. <code>private</code> is a TS-only contract;
        <code>#private</code> is enforced by the JS engine itself.
      </div>

      <h2>Parameter properties (shorthand)</h2>
      <p>
        Declaring a modifier on a constructor parameter both declares the field and
        assigns it — exactly how classic Angular DI is written:
      </p>
      <div class="code">
        <pre>constructor(private http: HttpClient) {{ '{' }}{{ '}' }}
// equivalent to: private http; constructor(http) {{ '{' }} this.http = http; {{ '}' }}
// modern alternative avoids the constructor entirely:
private http = inject(HttpClient);</pre>
      </div>

      <h2>Inheritance & super</h2>
      <div class="code">
        <pre>class Base {{ '{' }} greet() {{ '{' }} return 'hi'; {{ '}' }} {{ '}' }}
class Loud extends Base {{ '{' }}
  override greet() {{ '{' }} return super.greet().toUpperCase(); {{ '}' }}
{{ '}' }}</pre>
      </div>
      <p>
        This project enables <code>noImplicitOverride</code>, so overriding a base
        method <strong>requires</strong> the <code>override</code> keyword — catching the
        bug where a rename silently breaks the link to the parent method.
      </p>

      <h2>Abstract classes & implementing interfaces</h2>
      <div class="code">
        <pre>abstract class Shape {{ '{' }}
  abstract area(): number;          // subclasses MUST implement
  describe() {{ '{' }} return \`area=\${{ '{' }}this.area(){{ '}' }}\`; {{ '}' }}  // shared concrete method
{{ '}' }}
// new Shape();  ❌ cannot instantiate an abstract class

class Circle extends Shape implements Comparable {{ '{' }}
  constructor(private r: number) {{ '{' }} super(); {{ '}' }}
  area() {{ '{' }} return Math.PI * this.r ** 2; {{ '}' }}
{{ '}' }}</pre>
      </div>
      <p>
        <code>extends</code> inherits implementation; <code>implements</code> only
        checks a class satisfies an interface's shape (a class can implement several).
        Angular's lifecycle hooks work this way — <code>implements OnInit</code>.
      </p>

      <h2>Try it</h2>
      <div class="demo">
        <p class="demo__title">Live — a Counter instance (note method chaining)</p>
        <div class="row">
          <button (click)="bump(1)">{{ label }} +1</button>
          <button class="ghost" (click)="bump(5)">+5</button>
          <span class="pill">current = {{ display() }}</span>
        </div>
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Components/services/etc. are classes — fields, static members, getters/setters, inheritance.</li>
        <li><code>private</code>/<code>protected</code>/<code>readonly</code> are compile-time; <code>#name</code> is true runtime privacy.</li>
        <li>Parameter properties are the shorthand behind constructor DI; <code>inject()</code> is the modern alternative.</li>
        <li><code>abstract</code> defines a contract with shared code; <code>implements</code> checks shape (lifecycle hooks).</li>
        <li>Templates can read <code>public</code>/<code>protected</code> members only.</li>
      </ul>

      <p><a routerLink="/ts-enums">Next: Enums &amp; Literal Unions →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 130px; }`,
  ],
})
export class Classes {
  private readonly counter = new Counter('clicks');
  protected readonly label = this.counter.label;
  protected readonly display = signal(this.counter.current);

  protected bump(by: number) {
    this.counter.increment(by);
    this.display.set(this.counter.current);
  }
}
