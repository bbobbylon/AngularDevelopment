import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-dom-and-events',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Web Basics</span>
      <h1>The DOM & Events</h1>
      <p class="lead">
        We've covered values, functions and collections. Now: how does code actually
        <em>change what's on the screen</em>, and respond when you click? The answer is
        the <strong>DOM</strong> and <strong>events</strong> — and understanding the
        pain of doing this by hand is exactly why Angular exists.
      </p>

      <h2>The DOM: your page as a tree</h2>
      <p>
        When the browser loads HTML, it builds a live, in-memory model of the page
        called the <strong>DOM</strong> (Document Object Model). It's a tree of
        <em>elements</em> nested inside each other — like a family tree:
      </p>
      <div class="code">
        <pre>&lt;body&gt;
  &lt;header&gt;
    &lt;h1&gt;My App&lt;/h1&gt;
  &lt;/header&gt;
  &lt;main&gt;
    &lt;button&gt;Click me&lt;/button&gt;
  &lt;/main&gt;
&lt;/body&gt;

// as a tree:  body → header → h1
//             body → main → button</pre>
      </div>
      <p>
        JavaScript can read and change this tree while the page is running — add an
        element, change text, hide something. That's how a page updates without
        reloading.
      </p>

      <h2>Events: reacting to the user</h2>
      <p>
        An <strong>event</strong> is something that happens: a click, a key press, the
        mouse moving, a form submitting. You attach a function — called an
        <strong>event handler</strong> — that the browser runs when that event fires.
      </p>
      <div class="code">
        <pre>The flow:   user clicks  →  browser fires a "click" event  →
            your handler function runs  →  it updates the DOM  →
            you see the change on screen</pre>
      </div>

      <div class="demo">
        <p class="demo__title">Try it — clicking fires an event, the handler updates the page</p>
        <button (click)="onClick()">Click me</button>
        <button class="ghost" (click)="count.set(0)">Reset</button>
        <p style="margin-top:12px">
          This button has been clicked <strong style="font-size:1.3rem">{{ count() }}</strong> time(s).
        </p>
        @if (count() >= 5) {
          <p style="color:var(--green)">🎉 Nice clicking! The page changed because your handler updated a value.</p>
        }
      </div>

      <h2>The hard way (plain JavaScript)</h2>
      <p>Doing this by hand means finding elements and updating them yourself, every time:</p>
      <div class="code">
        <pre>let count = 0;
const button = document.querySelector('button');   // find the element
const label = document.querySelector('#count');     // find the label

button.addEventListener('click', () =&gt; {{ '{' }}     // attach a handler
  count = count + 1;
  label.textContent = 'Clicked ' + count + ' times'; // manually update the DOM
{{ '}' }});</pre>
      </div>
      <p>
        That's manageable for one button. But a real app has hundreds of elements that
        all depend on changing data. Keeping the screen in sync with your data
        <em>by hand</em> becomes a nightmare of bugs.
      </p>

      <div class="note">
        <strong>This is the problem Angular solves.</strong> Instead of you finding
        elements and updating them, you describe <em>what the screen should look like
        for the current data</em>, and Angular keeps the DOM in sync automatically. The
        button above is Angular: <code>(click)="onClick()"</code> attaches the handler
        and <code>{{ '{{' }} count() {{ '}}' }}</code> shows the value — when the value
        changes, the text updates itself. No <code>querySelector</code>, no manual DOM
        updates.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>The <strong>DOM</strong> is the browser's live tree of page elements that code can change.</li>
        <li>An <strong>event</strong> (click, keypress…) runs an <strong>event handler</strong> function.</li>
        <li>Plain JS makes you find elements and update the DOM manually — error-prone at scale.</li>
        <li><strong>Angular keeps the DOM in sync with your data for you</strong> — that's its core job.</li>
      </ul>

      <p><a routerLink="/async-basics">Next: Doing Things Later — Async →</a></p>
    </article>
  `,
})
export class DomAndEvents {
  protected readonly count = signal(0);
  protected onClick() {
    this.count.update((c) => c + 1);
  }
}
