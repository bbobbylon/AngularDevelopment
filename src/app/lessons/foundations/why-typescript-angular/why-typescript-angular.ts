import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Why TypeScript & Angular — compile-time vs runtime error catching
 * (with a live bug-hunt demo), what the TS compiler actually does, framework
 * vs library and inversion of control, what Angular provides out of the box
 * vs hand-rolled JS, where Angular sits vs React/Vue, and the curriculum map.
 */

interface BugHunt {
  id: number;
  code: string;
  jsOutcome: string;
  tsOutcome: string;
}

const HUNTS: BugHunt[] = [
  {
    id: 1,
    code: `function greet(name) {\n  return 'Hi ' + name.toUpperCase();\n}\ngreet(42);`,
    jsOutcome: '💥 Runtime crash — in production, when a user hits it: "name.toUpperCase is not a function".',
    tsOutcome: '❌ Caught while typing: with greet(name: string), the call greet(42) gets a red squiggle — "Argument of type number is not assignable to parameter of type string."',
  },
  {
    id: 2,
    code: `const user = { name: 'Ada', age: 36 };\nconsole.log(user.nmae);`,
    jsOutcome: '🤫 No crash at all — user.nmae is just undefined. The page quietly shows nothing where the name should be. Silent bugs are the worst bugs.',
    tsOutcome: '❌ Caught while typing: "Property \'nmae\' does not exist on type { name: string; age: number }. Did you mean \'name\'?" — it even suggests the fix.',
  },
  {
    id: 3,
    code: `const price = document\n  .querySelector('input').value;\nconst total = price * 1.2;   // price is a STRING`,
    jsOutcome: '🤔 Sometimes works! "10" * 1.2 coerces to 12 — until someone types "10,50" and total becomes NaN. The bug appears intermittently, weeks later.',
    tsOutcome: '❌ Caught while typing: value is typed as string, and string * number is an error. You are forced to convert deliberately: Number(price) * 1.2.',
  },
];

@Component({
  selector: 'app-lesson-why-typescript-angular',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Web Basics</span>
      <h1>Why TypeScript &amp; Angular?</h1>
      <p class="lead">
        You now know the building blocks: values, variables, functions, arrays,
        objects, decisions, loops, async, the DOM and events. This closing
        Foundations lesson connects them to the two tools the rest of the curriculum
        is about — not as a sales pitch, but so you understand <em>the specific
        problems each one exists to solve</em>. Tools make sense when their problems do.
      </p>

      <h2>The core idea: move errors earlier</h2>
      <p>
        Every bug is caught somewhere on this timeline — and each step to the right
        costs more:
      </p>
      <div class="code"><pre>as you type   →   at compile/build   →   at runtime (you testing)   →   in PRODUCTION
  free              cheap                  annoying                       expensive
  (red squiggle)    (build fails)          (crash while developing)       (user hits it,
                                                                           you debug blind)</pre></div>
      <p>
        JavaScript, by design, defers almost everything to runtime — the debugging
        lesson's whole field guide (TypeErrors, silent string-math) is JavaScript
        letting mistakes through until execution. <strong>TypeScript's one job is to
        drag those errors to the far left of the timeline.</strong>
      </p>

      <h2>Why TypeScript — see it catch real bugs</h2>
      <p>
        TypeScript = JavaScript + <strong>type annotations</strong>: you (or
        inference) declare what kind of value each thing holds, and a checker
        verifies every usage <em>before the code ever runs</em>. Each of these bugs
        appeared in earlier lessons — compare their fate in each language:
      </p>
      <div class="demo">
        <p class="demo__title">Live — same bug, two timelines</p>
        <div class="row" style="flex-wrap:wrap;margin-bottom:10px">
          @for (h of hunts; track h.id) {
            <button [class.ghost]="hunt().id !== h.id" (click)="huntId.set(h.id)">Bug #{{ h.id }}</button>
          }
        </div>
        <div class="code"><pre>{{ hunt().code }}</pre></div>
        <div class="vs">
          <div class="vs-col js"><h4>Plain JavaScript</h4><p>{{ hunt().jsOutcome }}</p></div>
          <div class="vs-col ts"><h4>TypeScript</h4><p>{{ hunt().tsOutcome }}</p></div>
        </div>
      </div>
      <p>Three things follow from types that beginners don't expect:</p>
      <ul>
        <li><strong>Autocomplete gets superpowers.</strong> The editor knows <code>user</code> has exactly <code>name</code> and <code>age</code>, so it can list them, catch typos, and rename a property across 200 files safely. Types aren't just checks — they're what makes the editor <em>understand</em> your code.</li>
        <li><strong>Types are documentation that can't go stale.</strong> <code>function pay(amount: number, currency: 'USD' | 'EUR')</code> tells the next reader (you, next month) precisely what's allowed — and the compiler enforces that the docs stay true.</li>
        <li><strong>Types vanish at runtime.</strong> The TypeScript compiler checks your code, then strips the annotations, emitting plain JavaScript for the browser. Zero performance cost — the safety all happens before shipping.</li>
      </ul>
      <div class="note">
        The trade-off is honest: more to write up front, and the compiler will
        sometimes refuse code you "know" is fine until you express <em>why</em> it's
        fine. That friction is the feature — the entire TypeScript track (next!)
        teaches you to say things precisely enough that the machine can defend them.
      </div>

      <h2>Why Angular — structure for real apps</h2>
      <p>
        The DOM lesson ended with the "line 6 problem": keeping the screen in sync
        with data <em>by hand</em>, times hundreds of connections. That's the first
        problem Angular solves — but a real app has a dozen more (navigation, forms,
        server data, testing…), and solving each by hand means inventing your own
        conventions for all of them. A <strong>framework</strong> is a complete,
        opinionated system that solves the standard problems one consistent way:
      </p>
      <table class="t">
        <tr><th>Need</th><th>Hand-rolled JS</th><th>Angular gives you</th></tr>
        <tr><td>UI in sync with data</td><td>querySelector + manual updates everywhere</td><td><strong>Templates + signals</strong> — declare what the screen should show; it syncs</td></tr>
        <tr><td>Reusable UI pieces</td><td>copy-pasted HTML + wiring code</td><td><strong>Components</strong> — self-contained template + logic + styles, composed like Lego</td></tr>
        <tr><td>"Pages" without reloads</td><td>hand-managed history + element swapping</td><td><strong>Router</strong> — URLs mapped to components (the SPA machinery from lesson one)</td></tr>
        <tr><td>Forms with validation</td><td>per-field event listeners and flag juggling</td><td><strong>Forms module</strong> — value + validity tracked as one model</td></tr>
        <tr><td>Server data</td><td>raw fetch, repeated error handling</td><td><strong>HttpClient</strong> — typed requests, interceptors, testability</td></tr>
        <tr><td>Confidence to change code</td><td>click around and pray</td><td><strong>Testing tools</strong> — components and services testable in isolation</td></tr>
      </table>
      <p>
        One more distinction that will orient you in every Angular discussion online:
      </p>
      <div class="note">
        <strong>Library vs framework = who calls whom.</strong> With a library,
        <em>you</em> run the show and call its functions when you want. With a
        framework, <em>it</em> runs the show — you fill in components, and Angular
        decides when to create them, re-render them, and destroy them. (You've seen
        this shape before: callbacks. A framework is inversion of control at
        app scale.) That's also why frameworks feel "magical" at first — the
        control flow starts in code you didn't write. The expert tier de-magics all
        of it.
      </div>
      <p>
        Where Angular sits in the ecosystem: <strong>React</strong> is a UI library
        (you assemble routing/forms/HTTP from third-party pieces),
        <strong>Vue</strong> sits in between, and <strong>Angular</strong> is the
        batteries-included end of the spectrum — one vendor, one coherent toolset,
        TypeScript-first since day one. That's why it's especially common in large
        companies and long-lived codebases, where consistency across dozens of
        developers outweighs flexibility.
      </p>

      <h2>How the two fit together</h2>
      <p>
        Angular isn't just <em>compatible</em> with TypeScript — it's designed around
        it. Your components declare typed inputs; templates are type-checked against
        your classes (a typo in <code>{{ '{{' }} user.nmae {{ '}}' }}</code> fails the
        <em>build</em>, thanks to <code>strictTemplates</code>); services are wired
        together using type information. The payoff compounds: framework structure
        plus compile-time checking is what lets a 100-developer codebase change
        daily without collapsing.
      </p>

      <h2>How to use this curriculum</h2>
      <ol>
        <li><strong>Foundations</strong> (✅ you just finished it!) — coding and the web from zero.</li>
        <li><strong>TypeScript Essentials</strong> — the language, from annotations to generics.</li>
        <li><strong>Beginner</strong> — core Angular: components, templates, binding, signals.</li>
        <li><strong>Intermediate</strong> — forms, routing, HTTP, RxJS, directives, testing.</li>
        <li><strong>Expert</strong> — change detection, performance, SSR, security, architecture.</li>
      </ol>
      <p>
        Every lesson has live demos. Don't just read — change the inputs, click the
        buttons, predict before you click, and check the source when curious (this
        entire app is an Angular codebase you can learn from). Prediction + surprise
        is how ideas stick.
      </p>
      <div class="tip">
        You don't need to memorise anything. Understand each lesson's <em>idea</em>,
        and know it's here to look up. The practice/exam tools in the navbar turn the
        same material into recall training when you're ready.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>"TypeScript prevents runtime errors" — what's the accurate version of that claim?</summary>
        <div>It prevents the <em>type-shaped class</em> of runtime errors (wrong
        property names, wrong argument types, string/number mix-ups) by catching them
        at compile time. Logic bugs, bad data from a server at runtime, and
        off-by-ones still get through — types check <em>shape</em>, not
        <em>correctness</em>. And it only checks what crosses the compiler: a JSON
        response is trusted to match the type you claimed for it.</div>
      </details>
      <details class="qa">
        <summary>Does shipping TypeScript slow the app down?</summary>
        <div>No — the browser never sees TypeScript. The compiler type-checks, then
        erases annotations and emits plain JavaScript. All the cost is at build time;
        the shipped code is the same JS you'd have written by hand (usually better
        organized).</div>
      </details>
      <details class="qa">
        <summary>What does "the framework calls your code" concretely mean in Angular?</summary>
        <div>You never write "create the component now, put it in the DOM here."
        You define the component; Angular instantiates it when the router (or a
        parent template) needs it, calls your lifecycle hooks at defined moments,
        re-renders when your data changes, and destroys it on navigation. Your code
        fills in the blanks of a control flow the framework owns — inversion of
        control.</div>
      </details>
      <details class="qa">
        <summary>When would plain JavaScript (no framework) actually be the right choice?</summary>
        <div>Small, mostly-static pages with a sprinkle of interactivity — a
        marketing site with one form, a simple widget. Frameworks earn their weight
        when state, screens and team size grow; for a 50-line enhancement, the
        framework's bundle and build pipeline are overhead. Engineering judgment is
        matching tool weight to problem weight.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>The whole game is <strong>moving errors earlier</strong>: production → runtime → compile time → as-you-type. TypeScript exists to do exactly that.</li>
        <li>Types also power <strong>autocomplete, safe refactoring and never-stale documentation</strong> — then vanish at runtime (zero shipping cost, checks shape not logic).</li>
        <li><strong>Angular</strong> is a batteries-included framework: components, templates-in-sync-with-data, router, forms, HttpClient, testing — one coherent, TypeScript-first system that scales to big teams.</li>
        <li><strong>Framework = inversion of control</strong>: it calls your code (like a callback, app-sized). Library = you call it. React is a library; Angular is the full workshop.</li>
        <li>Follow the tracks in order; interact with every demo; predict before you click.</li>
      </ul>

      <p><a routerLink="/ts-types">Next: start TypeScript → Types, Annotations &amp; Inference →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: .9rem; }
     .t th, .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
     .t th { font-size: .78rem; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); }

     .vs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
     @media (max-width: 640px) { .vs { grid-template-columns: 1fr; } }
     .vs-col { border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; font-size: .88rem; }
     .vs-col h4 { margin: 0 0 6px; font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; }
     .vs-col.js { border-left: 3px solid var(--amber); }
     .vs-col.ts { border-left: 3px solid var(--accent); }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class WhyTypescriptAngular {
  protected readonly hunts = HUNTS;
  protected readonly huntId = signal(1);
  protected readonly hunt = computed(() => this.hunts.find((h) => h.id === this.huntId())!);
}
