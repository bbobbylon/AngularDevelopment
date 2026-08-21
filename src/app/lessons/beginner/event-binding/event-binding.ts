import { Component, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Live-demo child for the "component outputs" section. It is deliberately NOT
 * the `Rating` component from the outputs.ts lesson — this one exists purely to
 * give event-binding a real, emitting child so `$event` for a custom output can
 * be shown behaving, not just described in prose.
 */
@Component({
  selector: 'app-star-rating',
  template: `
    <div class="row" role="radiogroup" aria-label="Rating">
      @for (star of stars; track star) {
        <button
          type="button"
          class="star"
          [class.star--filled]="star <= (hover() || value())"
          [attr.aria-label]="star + ' stars'"
          (mouseenter)="hover.set(star)"
          (mouseleave)="hover.set(0)"
          (click)="rate(star)"
        >★</button>
      }
    </div>
  `,
  styles: [
    `
      .star {
        background: transparent;
        border: none;
        font-size: 1.5rem;
        line-height: 1;
        padding: 2px 4px;
        color: var(--border);
        cursor: pointer;
      }
      .star--filled {
        color: var(--amber);
      }
    `,
  ],
})
export class StarRating {
  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly value = signal(0);
  protected readonly hover = signal(0);

  /** A typed custom event — the parent's `$event` is inferred as `number`. */
  readonly rated = output<number>();

  protected rate(star: number) {
    this.value.set(star);
    this.rated.emit(star);
  }
}

@Component({
  selector: 'app-lesson-event-binding',
  imports: [RouterLink, StarRating],
  styles: [
    `
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }

      table.ll { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 4px 0 20px; }
      table.ll th, table.ll td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
      table.ll th { background: var(--bg-elevated); }
      table.ll td:first-child { white-space: nowrap; font-family: "JetBrains Mono", "Fira Code", ui-monospace, monospace; font-size: .82rem; }
    `,
  ],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Data Binding</span>
      <h1>Event Binding</h1>
      <p class="lead">
        Event binding — <code>(event)="statement"</code> — runs a template
        <strong>statement</strong> when a DOM event (or a component's custom
        <code>output()</code>) fires. It is the view-to-class direction of data
        flow: the user does something, and your class finds out.
      </p>

      <div class="note">
        <strong>Syntax cue.</strong> Square brackets <code>[prop]="expr"</code> flow
        data <em>into</em> the DOM (property binding — read <code>expr</code>, never
        assign). Parentheses <code>(event)="stmt"</code> flow data <em>out</em> to
        your class (event binding — may assign, may run several statements). The
        combined <code>[(ngModel)]</code> "banana in a box" does both at once —
        that's next lesson's topic.
      </div>

      <h2>Clicks &amp; the $event object</h2>
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

      <div class="code"><pre>{{ clickMousemoveSample }}</pre></div>

      <h3>Line-by-line</h3>
      <table class="ll">
        <tr><th>Code</th><th>What it does &amp; why</th></tr>
        <tr>
          <td>(click)="clicks.set(...)"</td>
          <td>
            <code>(click)</code> attaches Angular's binding to the native <code>click</code>
            DOM event. Unlike an interpolation expression (which must be a pure, repeatable
            read), the right-hand side is a <strong>template statement</strong> — it is
            allowed to have side effects. Here it reads the signal by calling
            <code>clicks()</code>, adds 1, and writes the new value with <code>.set()</code>.
          </td>
        </tr>
        <tr>
          <td>(click)="clicks.set(0)"</td>
          <td>Same mechanism as above, just with a literal replacement value instead of one
            derived from the current signal — resets the counter outright.</td>
        </tr>
        <tr>
          <td>(mousemove)="track($event)"</td>
          <td>
            Binds to the native <code>mousemove</code> event, which the browser fires
            continuously — potentially dozens of times per second — while the pointer moves
            inside the element. <code>$event</code> is passed positionally as the sole
            argument to <code>track</code>.
          </td>
        </tr>
        <tr>
          <td>track(e: MouseEvent) {{ '{' }} … {{ '}' }}</td>
          <td>
            For a <em>native DOM</em> event binding, <code>$event</code> is typed as the
            real DOM interface — here a <code>MouseEvent</code> — so TypeScript can check
            that <code>e.offsetX</code>/<code>e.offsetY</code> actually exist. It is not
            <code>any</code>.
          </td>
        </tr>
        <tr>
          <td>this.pos.set({{ '{' }} x: …, y: … {{ '}' }})</td>
          <td>
            Builds a brand-new object literal and swaps it in wholesale rather than
            mutating the previous one in place. This is the signal convention: consumers
            (here, the template reading <code>pos().x</code> / <code>pos().y</code>) are
            notified by a fresh value, and it plays safely with <code>OnPush</code>
            children if this state were ever passed down as an input.
          </td>
        </tr>
      </table>

      <p>
        <code>$event</code> is the native DOM event (here a <code>MouseEvent</code>).
        For component outputs, <code>$event</code> is the emitted value instead — see
        "preventDefault &amp; component outputs" below.
      </p>

      <h2>Key &amp; event modifiers</h2>
      <p>
        Angular supports pseudo-events for keys so you do not have to inspect
        <code>event.key</code> manually inside every handler. You can also chain
        modifiers with dots.
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

      <div class="code"><pre>{{ keyupEnterSample }}</pre></div>

      <h3>Line-by-line</h3>
      <table class="ll">
        <tr><th>Code</th><th>What it does &amp; why</th></tr>
        <tr>
          <td>#box</td>
          <td>
            A <strong>template reference variable</strong> pointing at the native
            <code>&lt;input&gt;</code> element itself (no directive is applied here, so
            it's the raw <code>HTMLInputElement</code>). This gives the template direct
            DOM access via <code>box.value</code> without wiring up <code>ngModel</code>
            or a signal for this simple case.
          </td>
        </tr>
        <tr>
          <td>(keyup.enter)="…"</td>
          <td>
            A <strong>key-modifier pseudo-event</strong>. Angular still listens for the
            real <code>keyup</code> DOM event, but the compiler inserts a guard so your
            statement only runs when <code>event.key</code>, lower-cased, equals
            <code>'enter'</code>. Every other keyup is filtered out before your code sees it.
          </td>
        </tr>
        <tr>
          <td>add(box.value); box.value = ''</td>
          <td>
            Two statements chained with <code>;</code>. First, call the component method
            with the input's current value; then assign back to the element's
            <code>.value</code> property directly, which mutates the real DOM node and
            visually clears the field. Interpolation cannot assign — only an event
            binding's statement context can.
          </td>
        </tr>
        <tr>
          <td>(click)="add(box.value); box.value=''"</td>
          <td>The exact same two-statement pattern, reused verbatim on a different
            triggering event (a button click instead of Enter) — proof the logic lives
            in the statement, not the event name.</td>
        </tr>
      </table>

      <h2>Key modifier combinations</h2>
      <p>
        Angular matches modifiers against the real <code>KeyboardEvent</code>: the key
        name is a case-insensitive word (<code>enter</code>, <code>escape</code>,
        <code>arrowleft</code>), and you can chain multiple modifier words with dots —
        Angular checks that <em>all</em> of them are true (e.g. both <code>ctrlKey</code>
        and <code>key === 's'</code>).
      </p>
      <table class="ll">
        <tr><th>Binding</th><th>Fires when…</th><th>Notes</th></tr>
        <tr>
          <td>(keyup.enter)</td>
          <td><code>keyup</code> and <code>event.key === 'Enter'</code></td>
          <td>The classic "submit on Enter" pattern used above.</td>
        </tr>
        <tr>
          <td>(keyup.escape)</td>
          <td><code>keyup</code> and key is Escape</td>
          <td>Common for closing dialogs/menus without a Cancel click.</td>
        </tr>
        <tr>
          <td>(keydown.arrowup)</td>
          <td><code>keydown</code> and key is ArrowUp</td>
          <td><code>keydown</code> fires immediately on press and repeats while held —
            unlike <code>keyup</code>, which fires once on release. Pick the one your
            interaction actually needs.</td>
        </tr>
        <tr>
          <td>(keydown.control.s)</td>
          <td><code>keydown</code>, key <code>'s'</code>, <strong>and</strong>
            <code>ctrlKey</code> true</td>
          <td>Modifiers chain left-to-right with dots; Angular requires every listed
            modifier to be pressed.</td>
        </tr>
        <tr>
          <td>(keydown.shift.enter)</td>
          <td><code>keydown</code>, Enter, <strong>and</strong> <code>shiftKey</code></td>
          <td>Pairs naturally with plain <code>(keydown.enter)</code> for a
            "Enter submits, Shift+Enter adds a newline" text-box pattern.</td>
        </tr>
        <tr>
          <td>(keydown.meta.k)</td>
          <td><code>keydown</code>, key <code>'k'</code>, <strong>and</strong>
            <code>metaKey</code></td>
          <td><code>meta</code> is ⌘ on macOS and the Windows key on Windows — it is
            <em>not</em> the same as <code>control</code>, so a Ctrl+K press will not
            match this binding.</td>
        </tr>
      </table>

      <h2>preventDefault &amp; component outputs</h2>
      <p>
        Angular has <strong>no</strong> built-in <code>.prevent</code>/<code>.stop</code>
        modifiers, and returning <code>false</code> from a handler does nothing — you
        call the DOM methods yourself. For a component's <code>output()</code>,
        <code>$event</code> is the <em>emitted value</em>, not a DOM event at all:
      </p>
      <div class="code"><pre>{{ outputSample }}</pre></div>

      <h3>Line-by-line</h3>
      <table class="ll">
        <tr><th>Code</th><th>What it does &amp; why</th></tr>
        <tr>
          <td>(submit)="save($event)"</td>
          <td>Binds the native <code>submit</code> event fired by the <code>&lt;form&gt;</code>;
            <code>$event</code> is explicitly threaded through as a <code>SubmitEvent</code>.</td>
        </tr>
        <tr>
          <td>e.preventDefault()</td>
          <td>There is no <code>.prevent</code> modifier in Angular (unlike, say, a
            <code>@submit.prevent</code> in some other frameworks) — you must call the
            real browser API yourself, before the browser performs its default
            full-page navigation/reload on submit.</td>
        </tr>
        <tr>
          <td>&lt;app-star-rating (rated)="onRated($event)" /&gt;</td>
          <td><code>rated</code> is <em>not</em> a DOM event — it is a custom
            <code>output&lt;number&gt;()</code> property declared on the
            <code>StarRating</code> child. Binding <code>(rated)="…"</code> subscribes
            to that output using the exact same parenthesis syntax as a native event.</td>
        </tr>
        <tr>
          <td>onRated(n: number) {{ '{' }} … {{ '}' }}</td>
          <td>
            <code>$event</code> resolves to whatever the child passed to
            <code>.emit(...)</code> — here a plain <code>number</code>. Calling
            <code>$event.preventDefault()</code> in this handler would fail at runtime:
            there is no DOM event to prevent, only a value that already happened.
          </td>
        </tr>
      </table>

      <div class="demo">
        <p class="demo__title">Live — $event for a custom output()</p>
        <app-star-rating (rated)="onRated($event)" />
        <p style="margin-top:12px">
          Parent received via <code>$event</code>:
          <strong>{{ lastRating() }} ★</strong>
          <span class="pill" style="margin-left:8px">emitted {{ ratingEvents() }} time(s)</span>
        </p>
        <p style="color:var(--text-muted);font-size:.85rem">
          Hovering only updates the child's own local <code>hover</code> signal — nothing
          is emitted. A click calls <code>rate()</code>, which both commits the child's
          <code>value</code> signal <em>and</em> calls <code>this.rated.emit(star)</code>.
          That emission is what this lesson's <code>onRated($event)</code> receives —
          same binding syntax as a click, completely different kind of payload.
        </p>
      </div>

      <h2>Statements vs. expressions</h2>
      <p>
        Interpolation (<code>{{ '{{' }} … {{ '}}' }}</code>) and property bindings
        (<code>[prop]="expr"</code>) must be pure, side-effect-free
        <strong>expressions</strong> — Angular is free to re-evaluate them any number of
        times per check, so they must never assign or mutate. Event bindings are the one
        place a template runs <strong>statements</strong>: you can assign
        (<code>box.value = ''</code> above), and chain several statements with
        <code>;</code>. Angular still recommends keeping the statement short — real logic
        belongs in a method — because a long inline statement is hard to read in a diff
        and impossible to unit test directly.
      </p>

      <h2>Under the hood — what a listener binding actually does</h2>
      <p>
        <code>(click)="doThing()"</code> does not simply become
        <code>element.addEventListener('click', () =&gt; this.doThing())</code> in some
        loose sense — the template compiler generates a listener <em>instruction</em> that
        Angular runs once per component instance to register a real DOM listener via
        <code>Renderer2</code>. Crucially, it wraps your statement in its own function
        first:
      </p>
      <div class="code"><pre>{{ underTheHoodSample }}</pre></div>
      <ul>
        <li>
          <strong>Your statement runs first,</strong> with <code>$event</code> supplied
          as an argument and <code>this</code> bound to the component instance.
        </li>
        <li>
          <strong>Then Angular marks the view dirty</strong> — this component's view
          <em>and every ancestor up to the root</em>. This is exactly one of the five
          official triggers that re-check an <code>OnPush</code> view (see the
          <a routerLink="/onpush">OnPush lesson</a>): "an event bound in its own
          template." It is why a click handler always re-renders its own component, no
          matter what change-detection strategy is in play.
        </li>
        <li>
          <strong>Marking is not the same as rendering.</strong> The dirty flag is set
          synchronously inside the handler, but the actual re-render pass is scheduled —
          in this zoneless app, Angular's scheduler coalesces it into a microtask so that
          several events firing back-to-back still produce one pass, not one per event.
          Code that runs immediately after your statement, in the same handler, will not
          see the DOM already reflecting the new state.
        </li>
        <li>
          <strong>One real listener, not one per row.</strong> Angular registers a single
          native listener per templated binding at creation time; it does not call
          <code>addEventListener</code> again on every change-detection pass.
        </li>
      </ul>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>No <code>.prevent</code>/<code>.stop</code> modifiers.</strong> Call
          <code>$event.preventDefault()</code> / <code>stopPropagation()</code> in a handler;
          returning <code>false</code> does nothing.</li>
        <li><strong>A bare identifier never calls the method.</strong>
          <code>(click)="save"</code> evaluates the identifier <code>save</code> as a
          statement and discards the result — it never invokes anything. It must be
          <code>(click)="save()"</code> (or <code>save($event)</code>).</li>
        <li><strong>Brackets vs. parentheses.</strong> <code>[click]="…"</code> is
          property-binding syntax and <code>click</code> isn't a DOM property, so it
          either does nothing useful or errors — event listeners always need
          <code>(click)</code>.</li>
        <li><strong>Heavy work in <code>(mousemove)</code>/<code>(scroll)</code>.</strong> They
          fire constantly, and each firing marks the view dirty and can trigger a render
          pass — throttle, or move the work off the hot path.</li>
        <li><strong><code>$event</code> is the emitted value for outputs.</strong> For a
          component <code>output()</code> it's <em>not</em> a DOM event — don't call
          <code>preventDefault()</code> on it, as the line-by-line breakdown above shows.</li>
        <li><strong>Complex logic inline.</strong> Statements can assign and chain with
          <code>;</code>, but keep them short — real logic belongs in a method.</li>
        <li><strong>Key name casing.</strong> Pseudo-events match <code>event.key</code> as
          lowercase words: <code>(keyup.enter)</code>, <code>(keydown.arrowup)</code>, not
          <code>Enter</code>/<code>ArrowUp</code>.</li>
        <li><strong><code>meta</code> vs <code>control</code>.</strong>
          <code>(keydown.meta.k)</code> only matches ⌘/Win-key combos — a Ctrl+K press
          will not trigger it; you'd need a separate <code>(keydown.control.k)</code> binding.</li>
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
        <code>output()</code> it's the emitted value — a plain <code>number</code>,
        <code>string</code>, object, etc., depending on how the output was typed.</div>
      </details>
      <details class="qa">
        <summary>How do you run something on Ctrl/⌘+S?</summary>
        <div>Pseudo-event combos: <code>(keydown.control.s)</code> or
        <code>(keydown.meta.s)</code> — and <code>preventDefault()</code> to stop the browser
        save dialog.</div>
      </details>
      <details class="qa">
        <summary>You bind <code>(click)="save"</code> (no parentheses) and nothing happens on click. Why?</summary>
        <div>Without <code>()</code>, the statement just evaluates the bare identifier
        <code>save</code> — a reference to the method — and discards the result; it never
        calls it. It must be <code>(click)="save()"</code>.</div>
      </details>
      <details class="qa">
        <summary>Does firing an event handler re-render the component immediately, in the same call?</summary>
        <div>The handler runs, then Angular marks the view (and its ancestors) dirty —
        synchronously. But the actual refresh is <em>scheduled</em>, not run inline; in
        this zoneless app it's coalesced into a microtask so several events firing in a
        row still produce a single render pass, not one per event.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>(event)="stmt"</code> reacts to DOM events and component outputs, and runs a
          <strong>statement</strong> — not a pure expression like interpolation.</li>
        <li><code>$event</code> is the payload — a DOM event, or the emitted value for outputs.</li>
        <li>Use pseudo-events like <code>(keyup.enter)</code> and combos like <code>(keydown.control.s)</code>.</li>
        <li>No <code>.prevent</code> modifier — call <code>preventDefault()</code> in your handler.</li>
        <li>Statements may assign and chain with <code>;</code>, unlike interpolation or property bindings.</li>
        <li>Angular wraps every template listener so that, after your statement runs, it marks the
          view and its ancestors dirty — one of the five official <code>OnPush</code> re-check triggers.</li>
      </ul>

      <p><a routerLink="/two-way-binding">Next: Two-Way Binding →</a></p>
    </article>
  `,
})
export class EventBinding {
  protected readonly clicks = signal(0);
  protected readonly pos = signal({ x: 0, y: 0 });
  protected readonly items = signal<string[]>([]);
  protected readonly lastRating = signal(0);
  protected readonly ratingEvents = signal(0);

  protected track(e: MouseEvent) {
    this.pos.set({ x: Math.round(e.offsetX), y: Math.round(e.offsetY) });
  }

  protected add(value: string) {
    const v = value.trim();
    if (v) {
      this.items.update((list) => [...list, v]);
    }
  }

  protected onRated(n: number) {
    this.lastRating.set(n);
    this.ratingEvents.update((c) => c + 1);
  }

  readonly clickMousemoveSample = `<button (click)="clicks.set(clicks() + 1)">...</button>
<div (mousemove)="track($event)">...</div>

track(e: MouseEvent) {
  this.pos.set({ x: Math.round(e.offsetX), y: Math.round(e.offsetY) });
}`;

  readonly keyupEnterSample = `<input #box (keyup.enter)="add(box.value); box.value = ''" />
<button (click)="add(box.value); box.value=''">Add</button>

<!-- also valid: (keydown.escape), (keyup.control.s) -->`;

  readonly outputSample = `<form (submit)="save($event)">…</form>

save(e: SubmitEvent) {
  e.preventDefault();     // Angular has no .prevent modifier — do it yourself
  // ...persist the form data
}

<app-star-rating (rated)="onRated($event)" />

onRated(n: number) {
  this.lastRating.set(n);  // $event is the emitted number, not a DOM Event
}`;

  readonly underTheHoodSample = `// what (click)="doThing($event)" roughly compiles to
ɵɵlistener('click', function EventBinding_click_listener($event) {
  ctx.doThing($event);         // your statement — this = the component instance
  markViewDirty(currentView);  // + every ancestor up to the root
});

// registered ONCE via Renderer2 when the view is created:
renderer.listen(buttonEl, 'click', thatWrapperFunction);`;
}
