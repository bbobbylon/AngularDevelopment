import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-event-binding',
  imports: [RouterLink],
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
