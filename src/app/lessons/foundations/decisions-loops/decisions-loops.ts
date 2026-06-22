import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-decisions-loops',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Programming from Zero</span>
      <h1>Decisions & Loops</h1>
      <p class="lead">
        So far our code runs straight down, top to bottom. Real programs need to
        <strong>make decisions</strong> ("if the user is logged in, show the dashboard")
        and <strong>repeat work</strong> ("for every product, show a card"). Those two
        powers — branching and looping — turn instructions into actual behavior.
      </p>

      <h2>Making decisions with <code>if</code></h2>
      <p>
        An <code>if</code> statement runs a block of code <em>only when</em> a condition
        is <code>true</code>. Add <code>else</code> for the other case:
      </p>
      <div class="code">
        <pre>const age = 20;

if (age &gt;= 18) {{ '{' }}
  console.log('You can vote.');     // runs when the condition is true
{{ '}' }} else {{ '{' }}
  console.log('Too young to vote.'); // runs otherwise
{{ '}' }}

// chain more conditions with "else if":
if (score &gt; 90) grade = 'A';
else if (score &gt; 80) grade = 'B';
else grade = 'C';</pre>
      </div>
      <p>
        The condition in the parentheses is anything that evaluates to <code>true</code>
        or <code>false</code> — usually a comparison like <code>&gt;</code>,
        <code>&lt;</code>, <code>===</code> (equal), <code>!==</code> (not equal).
      </p>

      <div class="demo">
        <p class="demo__title">Live — a decision in action</p>
        <div class="field">
          <label>Your age</label>
          <input type="number" [value]="age()" (input)="age.set(+$any($event.target).value)" />
        </div>
        <div class="code"><pre>if (age &gt;= 18) {{ '{' }} message = 'You can vote 🗳️' {{ '}' }}
else        {{ '{' }} message = 'Too young to vote' {{ '}' }}

→ {{ voteMessage() }}</pre></div>
      </div>

      <h2>Repeating with loops</h2>
      <p>A <strong>loop</strong> runs the same block many times. The classic <code>for</code> loop counts:</p>
      <div class="code">
        <pre>for (let i = 0; i &lt; 3; i++) {{ '{' }}
  console.log('Hello number ' + i);
{{ '}' }}
// prints: Hello number 0, Hello number 1, Hello number 2

// "for...of" walks through every item in an array — cleaner:
for (const fruit of ['apple', 'banana']) {{ '{' }}
  console.log(fruit);
{{ '}' }}</pre>
      </div>

      <h2>The modern way: map & filter</h2>
      <p>
        Most of the time you won't write raw loops. Arrays come with built-in helper
        functions that loop <em>for</em> you. These two are everywhere in Angular:
      </p>
      <ul>
        <li><strong><code>map</code></strong> — transform every item into a new one (same count).</li>
        <li><strong><code>filter</code></strong> — keep only the items that pass a test (fewer items).</li>
      </ul>
      <div class="code">
        <pre>const nums = [1, 2, 3, 4, 5, 6];

nums.map(n =&gt; n * 10);        // [10, 20, 30, 40, 50, 60]   ← transform each
nums.filter(n =&gt; n % 2 === 0); // [2, 4, 6]                  ← keep the even ones</pre>
      </div>
      <p>
        Notice each takes a small arrow function describing <em>what to do with one
        item</em>. That tiny function is called once per item, automatically.
      </p>

      <div class="demo">
        <p class="demo__title">Live — map & filter the numbers 1–8</p>
        <p>start: <code>[{{ nums.join(', ') }}]</code></p>
        <div class="row" style="margin:8px 0">
          <button [class.ghost]="mode() !== 'all'" (click)="mode.set('all')">all</button>
          <button [class.ghost]="mode() !== 'even'" (click)="mode.set('even')">filter: even</button>
          <button [class.ghost]="mode() !== 'times3'" (click)="mode.set('times3')">map: × 3</button>
        </div>
        <p>result: <code style="color:var(--green)">[{{ result().join(', ') }}]</code></p>
      </div>

      <div class="note">
        Why prefer <code>map</code>/<code>filter</code> over a raw <code>for</code> loop?
        They read like plain English ("filter the even numbers"), they don't change the
        original array, and they're exactly how you'll render lists in Angular templates.
        You'll meet their template cousin, <code>&#64;for</code>, soon.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>if</code>/<code>else</code> run code conditionally based on a true/false test.</li>
        <li>Loops repeat work; <code>for...of</code> walks an array's items.</li>
        <li><code>map</code> transforms every item; <code>filter</code> keeps the ones that pass a test.</li>
        <li>Both take a small function applied to each item — the modern, readable style.</li>
      </ul>

      <p><a routerLink="/dom-and-events">Next: The DOM & Events →</a></p>
    </article>
  `,
  styles: [
    `.field { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
     .field label { min-width: 90px; color: var(--text-muted); }`,
  ],
})
export class DecisionsLoops {
  protected readonly age = signal(20);
  protected readonly voteMessage = computed(() =>
    this.age() >= 18 ? 'You can vote 🗳️' : 'Too young to vote',
  );

  protected readonly nums = [1, 2, 3, 4, 5, 6, 7, 8];
  protected readonly mode = signal<'all' | 'even' | 'times3'>('all');
  protected readonly result = computed(() => {
    switch (this.mode()) {
      case 'even':
        return this.nums.filter((n) => n % 2 === 0);
      case 'times3':
        return this.nums.map((n) => n * 3);
      default:
        return this.nums;
    }
  });
}
