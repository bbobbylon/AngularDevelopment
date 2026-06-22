import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-async-basics',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Programming from Zero</span>
      <h1>Doing Things Later: Async</h1>
      <p class="lead">
        Some things are instant (<code>2 + 2</code>). Others take <em>time</em> —
        loading data from a server, waiting for a timer, reading a file. Your program
        can't freeze while it waits, so it does the slow thing
        <strong>asynchronously</strong>: it kicks it off, keeps going, and deals with the
        result when it arrives. This idea is everywhere in web apps.
      </p>

      <h2>The coffee-shop analogy</h2>
      <p>
        You order a coffee and the barista gives you a <strong>buzzer</strong>. You don't
        stand frozen at the counter — you go sit down (your program keeps running). When
        the coffee is ready, the buzzer goes off (a result arrives) and you go collect it.
        That buzzer is the heart of asynchronous code: <em>"I'll let you know when it's
        done."</em>
      </p>

      <h2>Three ways to handle "later" (the evolution)</h2>
      <p><strong>1. Callbacks</strong> — pass a function to run when it's done:</p>
      <div class="code">
        <pre>setTimeout(() =&gt; {{ '{' }}
  console.log('2 seconds passed!');   // runs LATER, not now
{{ '}' }}, 2000);
console.log('this prints FIRST');     // the program didn't wait</pre>
      </div>
      <p>
        Callbacks work, but nesting many of them gets messy (the dreaded "callback
        pyramid"). So a cleaner tool appeared:
      </p>
      <p><strong>2. Promises</strong> — an object representing a value that will arrive:</p>
      <div class="code">
        <pre>loadUser()
  .then(user =&gt; console.log('got', user))   // runs on success
  .catch(err =&gt; console.error('oops', err)); // runs on failure</pre>
      </div>
      <p>A Promise is the buzzer itself — you attach what to do when it resolves (succeeds) or rejects (fails).</p>
      <p><strong>3. async / await</strong> — write async code that <em>reads</em> like normal top-to-bottom code (the modern favorite):</p>
      <div class="code">
        <pre>async function showUser() {{ '{' }}
  try {{ '{' }}
    const user = await loadUser();   // "pause here until the Promise resolves"
    console.log('got', user);
  {{ '}' }} catch (err) {{ '{' }}
    console.error('oops', err);
  {{ '}' }}
{{ '}' }}</pre>
      </div>
      <p>
        <code>await</code> pauses inside the function until the Promise settles, then
        continues — without freezing the rest of the app. It's the same Promise
        underneath, just easier to read.
      </p>

      <h2>Try it — start something slow</h2>
      <div class="demo">
        <p class="demo__title">Live — a simulated 1.2s load</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="load()" [disabled]="status() === 'loading'">Load user data</button>
          <span class="pill">status: {{ status() }}</span>
        </div>
        @if (status() === 'loading') {
          <p>⏳ Working… (the page is still responsive — try clicking around)</p>
        } @else if (status() === 'done') {
          <p style="color:var(--green)">✅ Got it: {{ result() }}</p>
        } @else {
          <p style="color:var(--text-muted)">Press the button to start.</p>
        }
      </div>

      <div class="note">
        Angular mostly uses a cousin of Promises called <strong>Observables</strong>
        (covered later) for data over time, but the core idea is identical: start
        something slow, don't freeze, handle the result when it arrives. Master this
        mindset now and the rest clicks into place.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><strong>Asynchronous</strong> = start a slow task, keep running, handle the result later.</li>
        <li><strong>Callbacks</strong> → <strong>Promises</strong> (<code>.then</code>/<code>.catch</code>) → <strong>async/await</strong> (cleanest).</li>
        <li><code>await</code> pauses inside an <code>async</code> function until a Promise settles — without freezing the app.</li>
        <li>Use <code>try/catch</code> around <code>await</code> to handle failures.</li>
      </ul>

      <p><a routerLink="/json-and-apis">Next: Data on the Web — JSON & APIs →</a></p>
    </article>
  `,
})
export class AsyncBasics {
  protected readonly status = signal<'idle' | 'loading' | 'done'>('idle');
  protected readonly result = signal('');

  protected async load() {
    this.status.set('loading');
    this.result.set('');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    this.result.set('{ name: "Ada", role: "admin" }');
    this.status.set('done');
  }
}
