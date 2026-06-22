import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-functions-basics',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Programming from Zero</span>
      <h1>Functions</h1>
      <p class="lead">
        A function is a <strong>reusable set of instructions</strong> you can run
        whenever you want. Instead of writing the same steps over and over, you wrap
        them in a function once and "call" it by name. Functions are how programs are
        organised — Angular is, at its heart, thousands of small functions.
      </p>

      <h2>The vending-machine analogy</h2>
      <p>
        A function is like a vending machine. You put something <strong>in</strong>
        (your money and a choice), the machine does its <strong>work</strong> inside,
        and something comes <strong>out</strong>. In code those three parts are called
        <em>parameters</em> (the input), the <em>body</em> (the work), and the
        <em>return value</em> (the output).
      </p>
      <div class="code">
        <pre>function double(n) {{ '{' }}   // "n" is the input (a parameter)
  return n * 2;          // do the work, then send the answer OUT
{{ '}' }}

double(5);   // we "call" the function with 5 → it returns 10
double(8);   // call it again with 8 → returns 16</pre>
      </div>
      <p>
        <code>return</code> is the keyword that hands a value back to whoever called the
        function. Without it, the function does its work but gives nothing back.
      </p>

      <h2>Parameters vs arguments</h2>
      <ul>
        <li><strong>Parameter</strong> — the placeholder name in the definition (<code>n</code> above).</li>
        <li><strong>Argument</strong> — the real value you pass in when calling (<code>5</code>, <code>8</code>).</li>
        <li>A function can take several inputs, separated by commas: <code>function add(a, b)</code>.</li>
      </ul>

      <h2>Try it — a tip calculator function</h2>
      <div class="demo">
        <p class="demo__title">Live — the same function, different inputs</p>
        <div class="field">
          <label>Bill amount</label>
          <input type="number" [value]="bill()" (input)="bill.set(+$any($event.target).value)" />
        </div>
        <div class="field">
          <label>Tip percent</label>
          <input type="number" [value]="percent()" (input)="percent.set(+$any($event.target).value)" />
        </div>
        <div class="code"><pre>function tip(bill, percent) {{ '{' }}
  return bill * (percent / 100);
{{ '}' }}

tip({{ bill() }}, {{ percent() }})   →   {{ tipAmount() }}
total = bill + tip       →   {{ total() }}</pre></div>
      </div>

      <h2>The modern "arrow" style</h2>
      <p>
        You'll see functions written two ways. They do the same thing — the second
        (an <strong>arrow function</strong>) is shorter and is what Angular code uses
        most:
      </p>
      <div class="code">
        <pre>// classic:
function add(a, b) {{ '{' }} return a + b; {{ '}' }}

// arrow function (the =&gt; is read as "goes to"):
const add = (a, b) =&gt; a + b;

// you can store a function in a variable and pass it around — that's normal!</pre>
      </div>

      <div class="note">
        Functions let you <strong>name an idea</strong>. <code>calculateTotal()</code>,
        <code>isLoggedIn()</code>, <code>sendEmail()</code> — a well-named function reads
        like a sentence and hides the messy details inside. Good programs are mostly
        small, well-named functions calling each other.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>A function is reusable instructions: input (parameters) → work (body) → output (<code>return</code>).</li>
        <li>You <strong>call</strong> a function by writing its name with parentheses: <code>double(5)</code>.</li>
        <li>Arguments are the real values; parameters are the placeholder names.</li>
        <li>Arrow functions (<code>(a, b) =&gt; a + b</code>) are the compact, modern style.</li>
      </ul>

      <p><a routerLink="/arrays-objects-basics">Next: Arrays & Objects →</a></p>
    </article>
  `,
  styles: [
    `.field { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
     .field label { min-width: 110px; color: var(--text-muted); }`,
  ],
})
export class FunctionsBasics {
  protected readonly bill = signal(50);
  protected readonly percent = signal(18);
  protected readonly tipAmount = computed(() => (this.bill() * this.percent()) / 100);
  protected readonly total = computed(() => this.bill() + this.tipAmount());
}
