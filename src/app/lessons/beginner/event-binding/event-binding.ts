import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-event-binding',
  imports: [RouterLink],
  styles: [
    `
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Data Binding</span>
      <h1>Event Binding</h1>
      <p class="lead">
        Event binding — <code>(event)="statement"</code> — runs a template
        statement when a DOM event (or component output) fires. It is the
        view-to-class direction of data flow.
      </p>

      <h2>Clicks & the $event object</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row">
          <button (click)="clicks.set(clicks() + 1)">Clicked {{ clicks() }} times</button>
          <button class="ghost" (click)="clicks.set(0)">Reset</button>
        </div>
        <p style="margin-top:14px">Move your mouse over the box:</p>
        <div
          (mousemove)="track($event)"
          style="height:90px;border:1px dashed var(--border);border-radius:8px;display:grid;place-items:center"
        >
          x: {{ pos().x }}, y: {{ pos().y }}
        </div>
      </div>

      <div class="code">
        <pre>&lt;button (click)="clicks.set(clicks() + 1)"&gt;...&lt;/button&gt;
&lt;div (mousemove)="track($event)"&gt;...&lt;/div&gt;

track(e: MouseEvent) {{ '{' }} this.pos.set({{ '{' }} x: e.offsetX, y: e.offsetY {{ '}' }}); {{ '}' }}</pre>
      </div>

      <p>
        <code>$event</code> is the native DOM event (here a <code>MouseEvent</code>).
        For component outputs, <code>$event</code> is the emitted value instead.
      </p>

      <h2>Key & event modifiers</h2>
      <p>
        Angular supports pseudo-events for keys so you do not have to inspect
        <code>event.key</code> manually. You can also chain modifiers.
      </p>
      <div class="demo">
        <p class="demo__title">Live — press Enter to add</p>
        <div class="row">
          <input
            #box
            placeholder="type then press Enter"
            (keyup.enter)="add(box.value); box.value = ''"
            style="flex:1"
          />
          <button (click)="add(box.value); box.value=''">Add</button>
        </div>
        @if (items().length) {
          <ul>
            @for (item of items(); track $index) {
              <li>{{ item }}</li>
            }
          </ul>
        } @else {
          <p style="color:var(--text-muted)">No items yet.</p>
        }
      </div>

      <div class="code">
        <pre>&lt;input (keyup.enter)="add(box.value)" #box /&gt;
&lt;!-- also: (keydown.escape), (keyup.control.s) --&gt;</pre>
      </div>

      <h2>More key & modifier combinations</h2>
      <div class="code">
        <pre>(keyup.enter)          (keyup.escape)        (keydown.arrowup)
(keydown.control.s)    (keydown.shift.enter) (keydown.meta.k)   // ⌘K / Win+K
(keydown.alt.enter)</pre>
      </div>
      <p>
        Angular matches against <code>event.key</code>, so names are case-insensitive
        words (<code>enter</code>, <code>escape</code>, <code>arrowleft</code>).
      </p>

      <h2>preventDefault & component outputs</h2>
      <p>
        Angular has <strong>no</strong> built-in <code>.prevent</code>/<code>.stop</code>
        modifiers and returning <code>false</code> does nothing — call the DOM methods
        yourself. For a component's <code>output()</code>, <code>$event</code> is the
        emitted value, not a DOM event:
      </p>
      <div class="code">
        <pre>&lt;form (submit)="save($event)"&gt;          // save(e) {{ '{' }} e.preventDefault(); … {{ '}' }}
&lt;app-rating (rated)="onRated($event)"&gt;  // $event is the emitted number</pre>
      </div>

      <h2>Statements may assign (unlike interpolation)</h2>
      <p>
        Inside an event binding you <em>can</em> assign and run multiple statements
        separated by <code>;</code> — note <code>box.value = ''</code> above. Keep
        them short; complex logic belongs in a method.
      </p>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>No <code>.prevent</code>/<code>.stop</code> modifiers.</strong> Call
          <code>$event.preventDefault()</code> / <code>stopPropagation()</code> in a handler;
          returning <code>false</code> does nothing.</li>
        <li><strong>Heavy work in <code>(mousemove)</code>/<code>(scroll)</code>.</strong> They
          fire constantly and each runs change detection — throttle, or move the work off the
          hot path.</li>
        <li><strong><code>$event</code> is the emitted value for outputs.</strong> For a
          component <code>output()</code> it's <em>not</em> a DOM event — don't call
          <code>preventDefault()</code> on it.</li>
        <li><strong>Complex logic inline.</strong> Statements can assign and chain with
          <code>;</code>, but keep them short — real logic belongs in a method.</li>
        <li><strong>Key name casing.</strong> Pseudo-events match <code>event.key</code> as
          lowercase words: <code>(keyup.enter)</code>, <code>(keydown.arrowup)</code>, not
          <code>Enter</code>/<code>ArrowUp</code>.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>How do you stop a form from reloading the page on submit?</summary>
        <div>There's no <code>.prevent</code> modifier — bind <code>(submit)="save($event)"</code>
        and call <code>$event.preventDefault()</code> inside <code>save</code>.</div>
      </details>
      <details class="qa">
        <summary>What is <code>$event</code> for <code>(click)</code> vs a component output?</summary>
        <div>For DOM events it's the native event (e.g. <code>MouseEvent</code>). For an
        <code>output()</code> it's the emitted value.</div>
      </details>
      <details class="qa">
        <summary>How do you run something on Ctrl/⌘+S?</summary>
        <div>Pseudo-event combos: <code>(keydown.control.s)</code> or
        <code>(keydown.meta.s)</code> — and <code>preventDefault()</code> to stop the browser
        save dialog.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>(event)="stmt"</code> reacts to DOM events and component outputs.</li>
        <li><code>$event</code> is the payload — a DOM event, or the emitted value for outputs.</li>
        <li>Use pseudo-events like <code>(keyup.enter)</code> and combos like <code>(keydown.control.s)</code>.</li>
        <li>No <code>.prevent</code> modifier — call <code>preventDefault()</code> in your handler.</li>
        <li>Statements may assign and chain with <code>;</code>.</li>
      </ul>

      <p><a routerLink="/two-way-binding">Next: Two-Way Binding →</a></p>
    </article>
  `,
})
export class EventBinding {
  protected readonly clicks = signal(0);
  protected readonly pos = signal({ x: 0, y: 0 });
  protected readonly items = signal<string[]>([]);

  protected track(e: MouseEvent) {
    this.pos.set({ x: Math.round(e.offsetX), y: Math.round(e.offsetY) });
  }

  protected add(value: string) {
    const v = value.trim();
    if (v) {
      this.items.update((list) => [...list, v]);
    }
  }
}
