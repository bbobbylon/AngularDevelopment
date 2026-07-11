import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Arrays & objects — index mechanics, everyday array methods, object
 * keys vs dot/bracket access, nesting, and the single most consequential idea
 * for later Angular work: value vs REFERENCE (with a live shared-reference
 * demo), plus copying with spread and destructuring.
 */

interface Person {
  name: string;
  age: number;
  member: boolean;
}

@Component({
  selector: 'app-lesson-arrays-objects-basics',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Programming from Zero</span>
      <h1>Arrays &amp; Objects</h1>
      <p class="lead">
        Single values are useful, but real apps deal with <em>collections</em> and
        <em>structured</em> data. The two workhorses are <strong>arrays</strong>
        (ordered lists) and <strong>objects</strong> (labelled groups). Almost
        everything in Angular is arrays of objects — and hiding inside them is the
        concept (<em>references</em>) that will explain half the mysterious bugs
        you'll ever debug. We take both seriously here.
      </p>

      <h2>Arrays — ordered lists</h2>
      <p>An array is a list of values in square brackets. Each item has a position — an <strong>index</strong> — counting from <strong>0</strong>:</p>
      <div class="code"><pre>const fruits = ['apple', 'banana', 'cherry'];
//                 [0]      [1]       [2]

fruits[0]         // 'apple'    ← first item = index 0, not 1
fruits[2]         // 'cherry'
fruits.length     // 3
fruits[fruits.length - 1]   // 'cherry' — the classic "last item" formula
fruits[9]         // undefined  — off the end is not an error, just nothing</pre></div>
      <div class="note">
        Zero-based counting trips up every beginner: first = <code>[0]</code>, last =
        <code>[length - 1]</code>. Off-by-one mistakes here are so common they have a
        name (OBOE — off-by-one error). When a loop misses the last item or reads
        <code>undefined</code>, check the boundary first.
      </div>

      <h2>The everyday array toolkit</h2>
      <div class="code"><pre>const list = ['a', 'b', 'c'];

// grow & shrink (these MUTATE — change the array in place):
list.push('d');       // add to end        → ['a','b','c','d']
list.pop();           // remove from end   → ['a','b','c']   (returns 'd')
list.splice(1, 1);    // remove 1 at index 1 → ['a','c']

// ask questions (these don't change anything):
list.includes('b')          // true / false
list.indexOf('c')           // 1  (or -1 if absent)
list.find(x => x === 'c')   // 'c' — first item passing a test
list.join(', ')             // 'a, b, c' — array → string

// transform into NEW arrays (originals untouched — from Decisions & Loops):
list.map(x => x.toUpperCase())     // ['A','B','C']
list.filter(x => x !== 'b')        // ['a','c']
[...list].sort()                   // sorted COPY (bare .sort() mutates!)</pre></div>
      <p>
        Notice the two families: methods that <strong>mutate</strong> (push, pop,
        splice, sort) and methods that <strong>return a new array</strong> (map,
        filter, slice). Keep the distinction in your head — it becomes a hard rule in
        Angular, where handing out <em>new</em> arrays is how the framework notices
        change. More on why below.
      </p>

      <h2>Try it — a live array</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:10px">
          <input #f placeholder="add a fruit" (keyup.enter)="add(f.value); f.value=''" />
          <button (click)="add(f.value); f.value=''">Add</button>
        </div>
        <ul>
          @for (fruit of fruits(); track $index) {
            <li>
              <code>fruits[{{ $index }}]</code> = '{{ fruit }}'
              <button class="ghost" (click)="removeAt($index)">remove</button>
            </li>
          } @empty {
            <li style="color:var(--text-muted)">The array is empty: []</li>
          }
        </ul>
        <p class="pill">fruits.length = {{ fruits().length }} · last index = {{ fruits().length - 1 }}</p>
      </div>

      <h2>Objects — labelled groups</h2>
      <p>
        An array holds items by <em>position</em>; an object holds values by
        <strong>name</strong> (a <em>key</em>, also called a property). It groups
        related facts about one thing:
      </p>
      <div class="code"><pre>const person = {{ '{' }}
  name: 'Ada',       // key "name"   → value 'Ada'
  age: 36,           // key "age"    → value 36
  member: true,
{{ '}' }};

person.name          // 'Ada'  — dot access: the everyday way
person['name']       // 'Ada'  — bracket access: same thing, but…
const k = 'age';
person[k]            // 36     — …brackets accept a VARIABLE key. Dots can't.
person.age = 37;     // change a property
person.email         // undefined — missing keys aren't errors, just undefined</pre></div>
      <p>
        Values can be anything — including other objects and arrays. Real data nests,
        and you read it by chaining accessors left to right, one hop at a time:
      </p>
      <div class="code"><pre>const order = {{ '{' }}
  id: 42,
  customer: {{ '{' }} name: 'Ada', address: {{ '{' }} city: 'London' {{ '}' }} {{ '}' }},
  items: [ {{ '{' }} sku: 'A1', qty: 2 {{ '}' }}, {{ '{' }} sku: 'B2', qty: 1 {{ '}' }} ],
{{ '}' }};

order.customer.address.city   // 'London'  (object → object → object → value)
order.items[0].qty            // 2         (object → array → object → value)</pre></div>

      <div class="demo">
        <p class="demo__title">Live — one object's properties</p>
        <div class="field"><label>name</label><input [value]="person().name" (input)="setName($any($event.target).value)" /></div>
        <div class="field"><label>age</label><input type="number" [value]="person().age" (input)="setAge(+$any($event.target).value)" /></div>
        <div class="code"><pre>person = {{ json() }}

person.name → '{{ person().name }}'
person.age  → {{ person().age }}</pre></div>
      </div>

      <h2>The combo: arrays of objects</h2>
      <div class="code"><pre>const people = [
  {{ '{' }} name: 'Ada',   age: 36 {{ '}' }},
  {{ '{' }} name: 'Grace', age: 41 {{ '}' }},
  {{ '{' }} name: 'Alan',  age: 29 {{ '}' }},
];

people[1].name                          // 'Grace' — second record, its name
people.filter(p => p.age > 30)          // the over-30s (a new array)
people.map(p => p.name)                 // ['Ada','Grace','Alan']
people.find(p => p.name === 'Alan')     // the whole Alan object</pre></div>
      <p>
        A list of users, a cart of products, a feed of posts — all arrays of objects,
        all queried with the same map/filter/find vocabulary. The lesson list in this
        app's sidebar is literally one.
      </p>

      <h2>The big one: value vs reference</h2>
      <p>
        In Programming Basics you saw assignment <em>copy</em> a number from one box
        to another. Objects and arrays behave differently — and this difference is
        the root cause of a whole genus of bugs. A variable never holds the object
        itself; it holds a <strong>reference</strong> — an arrow pointing to where
        the object lives. Assignment copies <em>the arrow, not the object</em>:
      </p>
      <div class="code"><pre>// primitives: the VALUE is copied — independent boxes
let a = 5;
let b = a;      // b gets its own 5
a = 10;         // b is still 5 ✅

// objects: the REFERENCE is copied — one object, two arrows
const x = {{ '{' }} count: 5 {{ '}' }};
const y = x;    // y points at the SAME object
x.count = 10;
y.count         // 10 (!) — there was only ever one object</pre></div>
      <div class="demo">
        <p class="demo__title">Live — two variables, one object</p>
        <div class="row" style="margin-bottom:8px">
          <button (click)="bumpShared()">x.count++ (mutate via x)</button>
          <button class="ghost" (click)="cloneShared()">y = {{ '{' }}...x{{ '}' }} (make y a real copy)</button>
          <button class="ghost" (click)="resetShared()">Reset</button>
        </div>
        <div class="code"><pre>x.count → {{ sharedX().count }}
y.count → {{ sharedY().count }}   {{ linked() ? '← same object: y moved too!' : '← separate copy: y is independent now' }}</pre></div>
        <p style="color:var(--text-muted);font-size:.85rem">
          While x and y share one object, mutating through either arrow changes "both"
          — because there is no both. After the spread copy, they truly diverge.
        </p>
      </div>
      <p>Consequences you'll hit constantly:</p>
      <ul>
        <li><code>x === y</code> compares the <em>arrows</em>, not the contents: two identical-looking objects are <code>!==</code> unless they're literally the same one. (<code>{{ '{' }}a: 1{{ '}' }} === {{ '{' }}a: 1{{ '}' }}</code> is <code>false</code>.)</li>
        <li><code>const person</code> seals the <em>arrow</em>, not the object — <code>person.age = 37</code> is legal on a const. Only reassigning the variable is blocked.</li>
        <li>Pass an object into a function and the function receives the same arrow — its mutations are visible to the caller. Spooky action at a distance, unless the function copies first.</li>
        <li>Angular (and every modern framework) leans on reference checks to detect change cheaply: "new arrow = something changed". Mutate in place and the arrow stays the same — the classic <em>screen didn't update</em> bug you'll dissect properly in the OnPush lesson.</li>
      </ul>

      <h2>Copying and unpacking — spread &amp; destructuring</h2>
      <div class="code"><pre>// SPREAD (...) — copy contents into a fresh object/array:
const copy    = {{ '{' }} ...person {{ '}' }};              // new object, same properties
const updated = {{ '{' }} ...person, age: 37 {{ '}' }};     // copy + override one key ← THE
                                             //   pattern for updating state
const more    = [...fruits, 'date'];         // new array = old items + one

// ⚠️ spread is SHALLOW: one level deep. Nested objects are still shared arrows:
const c = {{ '{' }} ...order {{ '}' }};
c.customer === order.customer   // true — the inner object came along by reference

// DESTRUCTURING — unpack into variables, mirror-image of building:
const {{ '{' }} name, age {{ '}' }} = person;   // name = 'Ada', age = 36
const [first, second] = fruits;     // first = 'apple', second = 'banana'</pre></div>
      <p>
        <code>{{ '{' }} ...old, changed: newValue {{ '}' }}</code> is the single most-typed
        pattern in modern Angular state code — this lesson's own demo handlers use it
        (look at <code>setName</code> in the source: it builds a <em>new</em> person
        rather than mutating, so the signal sees a new reference and updates the view).
      </p>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why is <code>['a','b','c'][3]</code> not an error, and what is it?</summary>
        <div><code>undefined</code> — reading past the end just finds nothing there.
        The error comes one step later, when you treat it like a value:
        <code>list[3].toUpperCase()</code> throws "cannot read properties of
        undefined". When you see that message, hunt for the out-of-range read or
        missing key one line earlier.</div>
      </details>
      <details class="qa">
        <summary><code>const user = {{ '{' }}name: 'Ada'{{ '}' }}; user.name = 'Grace';</code> — does const stop this?</summary>
        <div>No. <code>const</code> seals the variable→object arrow, not the object's
        insides. Mutation is legal; only <code>user = otherThing</code> fails.
        Immutability of contents is a <em>discipline</em> (or TypeScript's
        <code>readonly</code>), not something const provides.</div>
      </details>
      <details class="qa">
        <summary>A function receives an array, sorts it, and suddenly the caller's list is reordered too. Why?</summary>
        <div>Arrays travel by reference, and <code>.sort()</code> mutates in place —
        the function reordered the caller's one-and-only array. Fix: sort a copy,
        <code>[...arr].sort(…)</code>. Interviewers love this one because it tests
        references AND the mutate-vs-copy method families at once.</div>
      </details>
      <details class="qa">
        <summary>After <code>const b = {{ '{' }}...a{{ '}' }}</code>, changing <code>b.settings.theme</code> also changes <code>a.settings.theme</code>. Explain.</summary>
        <div>Spread copies one level: <code>b</code> is a new object, but
        <code>b.settings</code> is the same inner object as <code>a.settings</code>
        (a copied arrow). That's "shallow copy". For independent nested state, copy
        the inner level too: <code>{{ '{' }}...a, settings: {{ '{' }}...a.settings, theme: 'dark'{{ '}' }}{{ '}' }}</code>.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Arrays are ordered (index from 0, last = <code>length - 1</code>); objects are named (keys, dot or bracket access); real data nests both, read left-to-right one hop at a time.</li>
        <li>Know the two method families: mutators (<code>push</code>, <code>splice</code>, <code>sort</code>) vs producers of new arrays (<code>map</code>, <code>filter</code>, <code>slice</code>).</li>
        <li><strong>Objects and arrays travel by reference</strong> — assignment copies the arrow, <code>===</code> compares arrows, const seals only the arrow, and functions mutate their caller's data unless they copy.</li>
        <li>Copy with spread (<code>{{ '{' }}...obj, key: newVal{{ '}' }}</code>) — remembering it's shallow — and unpack with destructuring.</li>
        <li>"New reference = change happened" is the deal you'll strike with Angular later; the habit of copying instead of mutating starts now.</li>
      </ul>

      <p><a routerLink="/decisions-loops">Next: Decisions &amp; Loops →</a></p>
    </article>
  `,
  styles: [
    `.field { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
     .field label { min-width: 70px; color: var(--text-muted); }
     ul { padding-left: 18px; }
     li { margin: 4px 0; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class ArraysObjectsBasics {
  protected readonly fruits = signal<string[]>(['apple', 'banana', 'cherry']);
  protected readonly person = signal<Person>({ name: 'Ada', age: 36, member: true });

  protected add(value: string) {
    const v = value.trim();
    if (v) this.fruits.update((list) => [...list, v]);
  }
  protected removeAt(i: number) {
    this.fruits.update((list) => list.filter((_, idx) => idx !== i));
  }
  protected setName(name: string) {
    // NEW object via spread — not mutation — so the signal's reference changes.
    this.person.update((p) => ({ ...p, name }));
  }
  protected setAge(age: number) {
    this.person.update((p) => ({ ...p, age }));
  }
  protected json() {
    return JSON.stringify(this.person());
  }

  /**
   * Shared-reference demo. We model the "one object, two arrows" situation with
   * a plain mutable object plus a version counter signal that forces re-render
   * (mutation alone wouldn't — which is itself the lesson's punchline).
   */
  private shared = { count: 5 };
  private sharedCopy: { count: number } | null = null; // null = still linked to `shared`
  private readonly version = signal(0);

  protected readonly linked = computed(() => {
    this.version();
    return this.sharedCopy === null;
  });
  protected readonly sharedX = computed(() => {
    this.version();
    return { ...this.shared };
  });
  protected readonly sharedY = computed(() => {
    this.version();
    return this.sharedCopy ? { ...this.sharedCopy } : { ...this.shared };
  });

  protected bumpShared() {
    this.shared.count++;
    this.version.update((v) => v + 1);
  }
  protected cloneShared() {
    this.sharedCopy = { ...this.shared };
    this.version.update((v) => v + 1);
  }
  protected resetShared() {
    this.shared = { count: 5 };
    this.sharedCopy = null;
    this.version.update((v) => v + 1);
  }
}
