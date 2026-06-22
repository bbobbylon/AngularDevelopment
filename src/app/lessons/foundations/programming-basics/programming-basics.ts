import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-programming-basics',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Programming from Zero</span>
      <h1>Programming Basics: Values & Variables</h1>
      <p class="lead">
        Programming is writing instructions for a computer to follow, step by step.
        Those instructions almost always work with <strong>values</strong> — pieces of
        information — and store them in <strong>variables</strong>. Master these two
        ideas and everything else builds on them.
      </p>

      <h2>What is a value?</h2>
      <p>A value is a single piece of data. The everyday kinds you'll use constantly:</p>
      <table class="t">
        <tr><td><strong>Number</strong></td><td><code>42</code>, <code>3.14</code>, <code>-7</code> — for counting and math.</td></tr>
        <tr><td><strong>String</strong></td><td><code>'Ada'</code>, <code>'hello world'</code> — text, always written inside quotes.</td></tr>
        <tr><td><strong>Boolean</strong></td><td><code>true</code> or <code>false</code> — a yes/no, on/off answer.</td></tr>
      </table>

      <h2>What is a variable?</h2>
      <p>
        A variable is a <strong>labelled box</strong> that holds a value so you can use
        it later by name. You create one with <code>let</code> (a box you can change)
        or <code>const</code> (a box whose value stays fixed):
      </p>
      <div class="code">
        <pre>let score = 0;          // a box named "score" holding the number 0
const name = 'Ada';     // a box named "name" holding the text 'Ada'

score = 10;             // ✅ allowed — let can change
// name = 'Grace';      // ❌ error — const cannot change</pre>
      </div>
      <p>
        The <code>=</code> sign here does <strong>not</strong> mean "equals" like in
        maths. It means <em>"put the value on the right into the box on the left."</em>
        We call that <strong>assignment</strong>.
      </p>

      <h2>Try it — a live variable</h2>
      <div class="demo">
        <p class="demo__title">Live — change the value in the box, watch it get used</p>
        <div class="field">
          <label><code>const name</code> =</label>
          <input [value]="name()" (input)="name.set($any($event.target).value)" placeholder="type a name" />
        </div>
        <div class="field">
          <label><code>let age</code> =</label>
          <input type="number" [value]="age()" (input)="age.set(+$any($event.target).value)" style="width:120px" />
        </div>
        <div class="code"><pre>greeting = 'Hi, ' + name + '! You are ' + age + '.'
         → "{{ greeting() }}"

nextYear = age + 1   → {{ age() + 1 }}</pre></div>
        <p style="color:var(--text-muted);font-size:.85rem">
          The boxes <code>name</code> and <code>age</code> are reused by name to build
          new values. Change either box and every line that uses it updates.
        </p>
      </div>

      <h2>Doing things with values</h2>
      <div class="code">
        <pre>// math on numbers:
2 + 3        // 5
10 - 4       // 6
6 * 7        // 42
20 / 4       // 5

// joining strings (this is also "+", but it glues text together):
'Hello, ' + 'world'   // 'Hello, world'

// comparing — these produce a boolean (true/false):
5 &gt; 3        // true
5 === 5      // true   (=== means "exactly equal to")
'a' === 'b'  // false</pre>
      </div>
      <div class="note">
        Notice <code>===</code> (three equals) asks "are these the same?" and gives back
        <code>true</code>/<code>false</code>, while a single <code>=</code> <em>assigns</em>
        a value into a variable. Mixing them up is the most common beginner slip — they
        are completely different jobs.
      </div>

      <h2>Comments — notes for humans</h2>
      <div class="code">
        <pre>// anything after two slashes is a comment.
// the computer ignores it — it's a note to yourself or your team.
let total = 5; // you can also put one at the end of a line</pre>
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>A <strong>value</strong> is a piece of data: a number, a string (text), or a boolean (true/false).</li>
        <li>A <strong>variable</strong> is a named box that stores a value; <code>const</code> can't change, <code>let</code> can.</li>
        <li><code>=</code> means <em>assign</em> (put into the box); <code>===</code> means <em>compare</em>.</li>
        <li>You combine values with operators like <code>+</code>, <code>*</code>, <code>&gt;</code>, <code>===</code>.</li>
      </ul>

      <p><a routerLink="/functions-basics">Next: Functions →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin: 8px 0; }
     .t td { padding: 10px 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 120px; }
     .field { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
     .field label { min-width: 130px; color: var(--text-muted); }`,
  ],
})
export class ProgrammingBasics {
  protected readonly name = signal('Ada');
  protected readonly age = signal(36);
  protected readonly greeting = computed(
    () => `Hi, ${this.name()}! You are ${this.age()}.`,
  );
}
