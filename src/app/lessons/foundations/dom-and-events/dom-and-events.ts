import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: The DOM & events — the element tree (explorable live), nodes vs
 * attributes vs properties, the event object, bubbling demonstrated with a
 * live nested-box demo, addEventListener anatomy line by line, and the
 * manual-sync pain that motivates Angular's data binding.
 */

interface BubbleHit {
  layer: string;
  order: number;
}

@Component({
  selector: 'app-lesson-dom-and-events',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Web Basics</span>
      <h1>The DOM &amp; Events</h1>
      <p class="lead">
        We've covered values, functions and collections. Now: how does code actually
        <em>change what's on the screen</em>, and respond when you click? The answer is
        the <strong>DOM</strong> and <strong>events</strong>. Learn these two properly
        and every framework feature you meet later — bindings, listeners, change
        detection — stops being magic and becomes "oh, it's doing <em>that</em> for me".
      </p>

      <h2>The DOM: your page as a tree</h2>
      <p>
        When the browser loads HTML, it parses the text into a live, in-memory model
        called the <strong>DOM</strong> (Document Object Model): one object per
        element, nested exactly as the tags nest. Explore a small page — click any
        node:
      </p>
      <div class="demo">
        <p class="demo__title">Live — the HTML and its tree are the same thing</p>
        <div class="split">
          <div class="code" style="margin:0"><pre>&lt;body&gt;
  &lt;header&gt;
    &lt;h1&gt;My App&lt;/h1&gt;
  &lt;/header&gt;
  &lt;main&gt;
    &lt;p&gt;Welcome!&lt;/p&gt;
    &lt;button&gt;Click&lt;/button&gt;
  &lt;/main&gt;
&lt;/body&gt;</pre></div>
          <div class="tree">
            @for (n of nodes; track n.id) {
              <button
                class="tnode"
                [style.margin-left.px]="n.depth * 22"
                [class.sel]="selected() === n.id"
                (click)="selected.set(n.id)"
              >{{ n.tag }}</button>
            }
          </div>
        </div>
        <p style="font-size:.9rem;margin-top:10px"><strong>{{ selectedNode().tag }}:</strong> {{ selectedNode().info }}</p>
      </div>
      <ul>
        <li>Every element becomes a <strong>node</strong> with a parent, siblings and children — family-tree vocabulary is used literally (<code>parentElement</code>, <code>children</code>).</li>
        <li>The tree is <strong>live</strong>: change a node from JavaScript and the pixels update immediately. The HTML file is just the recipe; the DOM is the cake.</li>
        <li>Each node object carries <strong>properties</strong> you can read and write: <code>textContent</code> (its text), <code>value</code> (an input's current content), <code>classList</code> (its CSS classes), <code>style</code>…</li>
      </ul>

      <h2>Finding and changing nodes — the manual toolkit</h2>
      <div class="code"><pre>// find: CSS selectors, same syntax you style with
const btn   = document.querySelector('button');     // first match
const items = document.querySelectorAll('li.item'); // all matches

// read & change:
btn.textContent = 'Save';          // swap the text inside
btn.disabled = true;               // set a property
btn.classList.add('primary');      // add a CSS class
btn.remove();                      // delete the node from the tree

// create & insert:
const p = document.createElement('p');  // exists only in memory so far…
p.textContent = 'Saved!';
document.body.append(p);                // …now it's in the tree → on screen</pre></div>
      <p>
        Note the two-step in the last block: <code>createElement</code> makes a
        detached node; nothing appears until <code>append</code> attaches it to the
        tree. On-screen = in-the-tree, always.
      </p>

      <h2>Events: reacting to the user</h2>
      <p>
        An <strong>event</strong> is something that happens: a click, a key press, the
        mouse moving, a form submitting. You register a function — an
        <strong>event handler</strong> — and the browser calls it when that event
        fires. The registration line, dissected:
      </p>
      <div class="code"><pre>button.addEventListener('click', (event) => {{ '{' }} … {{ '}' }});
└──┬──┘ └───────┬──────┘ └──┬──┘  └──┬──┘
the node   "call me when"  which   your handler — receives an
to watch                   event   EVENT OBJECT full of details</pre></div>
      <ul>
        <li><strong>The event name is a string</strong>: <code>'click'</code>, <code>'input'</code> (every keystroke in a field), <code>'submit'</code>, <code>'keydown'</code>, <code>'mouseover'</code>, <code>'scroll'</code>…</li>
        <li><strong>The handler is just a function</strong> — usually an arrow function. You are handing it over to be called <em>later</em>, maybe never, maybe a thousand times.</li>
        <li><strong>The event object</strong> is the browser's incident report: <code>event.target</code> (the node it happened on), <code>event.key</code> (which key), <code>event.clientX/Y</code> (where the mouse was). And <code>event.preventDefault()</code> cancels the browser's built-in reaction — e.g. stops a form submit from reloading the page. You will call that one for the rest of your career.</li>
      </ul>

      <div class="demo">
        <p class="demo__title">Try it — clicking fires an event, the handler updates the page</p>
        <button (click)="onClick()">Click me</button>
        <button class="ghost" (click)="count.set(0)">Reset</button>
        <p style="margin-top:12px">
          This button has been clicked <strong style="font-size:1.3rem">{{ count() }}</strong> time(s).
        </p>
        @if (count() >= 5) {
          <p style="color:var(--green)">🎉 Nice clicking! Handler ran → data changed → screen synced.</p>
        }
      </div>

      <h2>Bubbling — one click, many listeners</h2>
      <p>
        Here's the part that surprises people: an event doesn't fire on just one
        element. After firing on the target it <strong>bubbles up</strong> through
        every ancestor — target, parent, grandparent, up to <code>body</code>. Click
        the innermost box and watch all three layers hear about it, inside-out:
      </p>
      <div class="demo">
        <p class="demo__title">Live — click the innermost box</p>
        <div class="bubble outer" (click)="hit('outer')">
          outer
          <div class="bubble middle" (click)="hit('middle')">
            middle
            <div class="bubble inner" (click)="hit('inner')">inner — click me</div>
          </div>
        </div>
        <div class="row" style="margin-top:10px">
          <button class="ghost" (click)="hits.set([])">Clear log</button>
        </div>
        <div class="console">
          @for (h of hits(); track h.order) {
            <div>{{ h.order }}. "{{ h.layer }}" heard the click</div>
          } @empty {
            <div class="dim">// the order the layers hear it appears here…</div>
          }
        </div>
        <p style="color:var(--text-muted);font-size:.85rem;margin-top:8px">
          Inner fires first, then the click travels outward. <code>event.stopPropagation()</code>
          would halt the journey; checking <code>event.target</code> tells an outer
          listener what was originally clicked.
        </p>
      </div>
      <p>
        Bubbling isn't a quirk — it's a feature you exploit: put <em>one</em> listener
        on a list instead of one per row ("event delegation"), and it hears clicks
        from every current <em>and future</em> row. Angular relies on the same
        mechanics under the hood for its event bindings.
      </p>

      <h2>The hard way — and why it doesn't scale</h2>
      <p>Wire the counter demo by hand and you must keep data and screen in sync yourself:</p>
      <div class="code"><pre>let count = 0;                                     // 1· the data
const button = document.querySelector('button');   // 2· find the button
const label  = document.querySelector('#count');   // 3· find the label

button.addEventListener('click', () => {{ '{' }}          // 4· react to the event
  count = count + 1;                               // 5· update the DATA
  label.textContent = 'Clicked ' + count + ' times'; // 6· update the SCREEN — by hand!
{{ '}' }});</pre></div>
      <p>
        Line 6 is the trap. Every place the data can change must remember to update
        every place the data is shown. Add a reset button? Another line 6. Show the
        count in the header too? Two more. A real app has <em>hundreds</em> of
        data-to-screen connections — miss one and you've shipped the classic bug: the
        screen shows stale data. There's a second, quieter problem: lines 2–3 are
        <strong>selector strings</strong> — rename an id in the HTML and the JS breaks
        with no warning until runtime.
      </p>

      <div class="note">
        <strong>This is the problem Angular exists to solve.</strong> You declare
        <em>what the screen should look like for the current data</em> —
        <code>{{ '{{' }} count() {{ '}}' }}</code> — and Angular runs line 6 for you,
        for every connection, whenever the data changes. The counter demo above IS
        Angular: <code>(click)="onClick()"</code> is <code>addEventListener</code>
        wearing template syntax, the handler updates only the data, and the DOM syncs
        itself. No <code>querySelector</code>, no stale-screen bugs, and the
        connections are type-checked at build time.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>What's the difference between the HTML file and the DOM?</summary>
        <div>The HTML file is static text — the recipe. The DOM is the live object
        tree the browser built from it — and it diverges the moment any script
        changes anything. "View source" shows the original HTML; the DevTools
        Elements panel shows the current DOM. In an Angular app they differ wildly:
        the HTML file is a nearly-empty shell, and virtually the whole DOM is built
        by the framework.</div>
      </details>
      <details class="qa">
        <summary>A click listener on a parent <code>&lt;ul&gt;</code> fires when you click an <code>&lt;li&gt;</code>. Why, and how do you know which li?</summary>
        <div>Bubbling: the click fires on the li, then travels up through the ul.
        Inside the handler, <code>event.target</code> is the element actually clicked
        (the li), while <code>event.currentTarget</code> is the element the listener
        is attached to (the ul). This one-listener-for-many-rows pattern is event
        delegation.</div>
      </details>
      <details class="qa">
        <summary>Why does a form reload the page when submitted, and how do you stop it?</summary>
        <div>The browser's default action for a form submit is a full-page request to
        the form's action URL — web-1.0 behaviour. Call
        <code>event.preventDefault()</code> in the submit handler to cancel it and
        handle the data with JavaScript instead. Angular's
        <code>(ngSubmit)</code> does this for you — now you know what it's
        suppressing.</div>
      </details>
      <details class="qa">
        <summary><code>document.querySelector('#total').textContent = sum;</code> is sprinkled through a codebase 14 times. What's the risk?</summary>
        <div>Manual DOM sync: every code path that changes <code>sum</code> must
        remember all 14 lines (miss one → stale screen), and all 14 depend on an id
        that nothing verifies. This exact maintenance nightmare is the pitch for
        declarative frameworks — one template expression, updated automatically.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>The <strong>DOM</strong> is the browser's live tree of element objects; on-screen = attached-to-the-tree. JavaScript reads and rewrites it via properties like <code>textContent</code> and <code>classList</code>.</li>
        <li><code>addEventListener(name, handler)</code> registers a function the browser calls with an <strong>event object</strong> (<code>target</code>, <code>key</code>, <code>preventDefault()</code>…).</li>
        <li>Events <strong>bubble</strong> from the target up through its ancestors — the basis of event delegation and of <code>target</code> vs <code>currentTarget</code>.</li>
        <li>Plain JS forces manual data→screen syncing (the "line 6 problem") — error-prone at scale.</li>
        <li><strong>Angular's core job:</strong> you update the data, it keeps the DOM in sync. Its <code>(click)</code> and <code>{{ '{{' }} … {{ '}}' }}</code> syntax are these exact primitives, automated.</li>
      </ul>

      <p><a routerLink="/async-basics">Next: Doing Things Later — Async →</a></p>
    </article>
  `,
  styles: [
    `.split { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
     @media (max-width: 640px) { .split { grid-template-columns: 1fr; } }

     .tree { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
     .tnode { background: var(--bg-elevated); color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 4px 14px; font-family: monospace; font-size: .82rem; }
     .tnode.sel { border-color: var(--accent); outline: 2px solid var(--accent); }

     .bubble { border: 2px solid var(--border); border-radius: 12px; padding: 14px; cursor: pointer; font-size: .82rem; color: var(--text-muted); }
     .bubble.outer { background: rgba(99,102,241,.06); }
     .bubble.middle { background: rgba(16,185,129,.08); margin-top: 6px; }
     .bubble.inner { background: rgba(245,158,11,.12); margin-top: 6px; font-weight: 600; color: var(--text); }
     .bubble:hover { border-color: var(--accent); }

     /* Fixed dark console — colours must not come from theme vars (see styles.css --code-fg note). */
     .console { background: var(--code-bg); color: var(--code-fg); border-radius: 8px; padding: 10px 14px; font-family: monospace; font-size: .82rem; min-height: 70px; margin-top: 8px; }
     .console .dim { color: #8b93a8; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class DomAndEvents {
  protected readonly count = signal(0);
  protected onClick() {
    this.count.update((c) => c + 1);
  }

  /** Explorable DOM tree — one entry per node with its depth and description. */
  protected readonly nodes = [
    { id: 'body', tag: '<body>', depth: 0, info: 'The root of everything visible. Parent of header and main.' },
    { id: 'header', tag: '<header>', depth: 1, info: 'A child of body, sibling of main, parent of the h1.' },
    { id: 'h1', tag: '<h1>', depth: 2, info: 'A leaf node. Its textContent property is "My App" — write to it and the heading changes instantly.' },
    { id: 'main', tag: '<main>', depth: 1, info: 'A child of body with two children of its own: the p and the button.' },
    { id: 'p', tag: '<p>', depth: 2, info: 'Sibling of the button — same parent (main).' },
    { id: 'button', tag: '<button>', depth: 2, info: 'The interactive one: it has properties like disabled, and events like click fire on it first before bubbling up through main and body.' },
  ];
  protected readonly selected = signal('body');
  protected readonly selectedNode = computed(
    () => this.nodes.find((n) => n.id === this.selected())!,
  );

  /** Bubbling demo — each layer logs when the click reaches it. */
  protected readonly hits = signal<BubbleHit[]>([]);
  protected hit(layer: string) {
    // Angular's (click) listens per-element; one physical click on the inner box
    // runs inner's handler first, then bubbles to middle's, then outer's.
    this.hits.update((h) => [...h, { layer, order: h.length + 1 }]);
  }
}
