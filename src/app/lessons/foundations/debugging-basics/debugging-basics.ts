import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-debugging-basics',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Your Dev Toolkit</span>
      <h1>Debugging & Reading Errors</h1>
      <p class="lead">
        Every programmer — beginner to expert — writes code that breaks. The skill isn't
        avoiding bugs; it's <strong>finding and fixing them calmly</strong>. Errors are
        not scary failures, they're the computer telling you exactly what's wrong and
        where. Learning to read them is a superpower.
      </p>

      <h2>Errors are messages, not insults</h2>
      <p>An error has three parts. Read them and most bugs solve themselves:</p>
      <div class="code">
        <pre>TypeError: Cannot read properties of undefined (reading 'name')
    at showUser (app.ts:42:18)
    at onClick (app.ts:30:5)

  ① the TYPE of error      → TypeError
  ② what went wrong        → tried to read 'name' on something that's undefined
  ③ WHERE it happened      → app.ts, line 42 (and the chain of calls that led there)</pre>
      </div>
      <p>
        That example says: "on line 42 you wrote <code>something.name</code>, but
        <code>something</code> was <code>undefined</code>." Now you know exactly where to
        look. The list of <code>at …</code> lines is the <strong>stack trace</strong> —
        the trail of function calls that led to the error, most recent first.
      </p>

      <h2>Common error types you'll meet</h2>
      <table class="t">
        <tr><td><code>TypeError</code></td><td>Used a value the wrong way — often reading a property of <code>undefined</code>/<code>null</code>.</td></tr>
        <tr><td><code>ReferenceError</code></td><td>Used a name that doesn't exist — usually a typo or a missing import.</td></tr>
        <tr><td><code>SyntaxError</code></td><td>The code is malformed — a missing <code>)</code>, <code>{{ '}' }}</code> or comma.</td></tr>
      </table>

      <h2>Tool #1: console.log</h2>
      <p>
        The humble, universal debugging tool: print a value to check what it
        <em>actually</em> is at a point in time. Half of all debugging is "I assumed this
        was X, but logging it showed it was Y."
      </p>
      <div class="code">
        <pre>console.log('user is:', user);          // inspect a value
console.log('reached step 2');           // confirm a line runs
console.table(listOfObjects);            // print an array nicely
console.error('something is wrong');     // print as a red error</pre>
      </div>

      <h2>Try it — read an error</h2>
      <div class="demo">
        <p class="demo__title">Live — trigger a bug, then read what it tells you</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="triggerBug()">Run buggy code</button>
          <button class="ghost" (click)="clear()">clear</button>
        </div>
        @if (log()) {
          <div class="code"><pre>{{ log() }}</pre></div>
          <p style="color:var(--green)">
            👆 The message names the problem (reading 'city' of undefined) and the line.
            The fix: check the value exists first, e.g. <code>user.address?.city</code>.
          </p>
        }
      </div>

      <h2>Tool #2: the browser DevTools</h2>
      <p>Press <strong>F12</strong> (or right-click → Inspect) to open DevTools — your cockpit:</p>
      <ul>
        <li><strong>Console</strong> — see your <code>console.log</code> output and any errors.</li>
        <li><strong>Elements</strong> — inspect the live HTML/CSS of the page.</li>
        <li><strong>Network</strong> — watch every request your app makes and the responses.</li>
        <li><strong>Sources</strong> — set a <strong>breakpoint</strong> to pause code on a line and inspect every variable at that moment.</li>
      </ul>

      <div class="tip">
        A calm debugging recipe: <strong>(1)</strong> read the error message fully —
        type, message, line. <strong>(2)</strong> Go to that line. <strong>(3)</strong>
        <code>console.log</code> the values involved to check your assumptions.
        <strong>(4)</strong> Fix, re-run, repeat. Search the exact error text online —
        someone has hit it before. You'll get faster every single day.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>An error tells you the <strong>type</strong>, <strong>what</strong> went wrong, and <strong>where</strong> (the stack trace) — read all three.</li>
        <li><code>TypeError</code> (wrong use of a value), <code>ReferenceError</code> (unknown name), <code>SyntaxError</code> (malformed code) are the common ones.</li>
        <li><code>console.log</code> reveals what a value <em>actually</em> is — your most-used tool.</li>
        <li>DevTools (F12) give you the Console, Network tab and breakpoints; debug methodically, don't panic.</li>
      </ul>

      <p><a routerLink="/why-typescript-angular">Next: Why TypeScript & Angular? →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin: 8px 0; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 150px; white-space: nowrap; }`,
  ],
})
export class DebuggingBasics {
  protected readonly log = signal('');

  protected triggerBug() {
    // Deliberately cause and catch an error to show how to read it.
    try {
      const user: { address?: { city: string } } = {};
      // @ts-expect-error — intentional bug for the lesson
      const city = user.address.city;
      this.log.set(String(city));
    } catch (e) {
      const err = e as Error;
      this.log.set(
        `${err.name}: ${err.message}\n    at triggerBug (debugging-basics.ts:?)\n    at onClick (...)`,
      );
    }
  }
  protected clear() {
    this.log.set('');
  }
}
