import {
  AfterViewInit,
  Component,
  DoCheck,
  Injectable,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/** Shared, lesson-scoped log so parent and child see the same entries. */
@Injectable()
class LifecycleLog {
  /**
   * The log lines, numbered as they arrive.
   */
  readonly entries = signal<string[]>([]);
  /**
   * Appends a line.
   *
   * @param msg What happened.
   */
  add(msg: string) {
    this.entries.update((e) => [...e, `${this.entries().length + 1}. ${msg}`]);
  }
  /**
   * Clears the log.
   */
  clear() {
    this.entries.set([]);
  }
}

/** A child whose every lifecycle hook records into the shared log. */
@Component({
  selector: 'app-lifecycle-child',
  template: `<div class="child">👶 child component (value = {{ value }})</div>`,
  styles: [
    `
      .child {
        padding: 12px 14px;
        border: 1px dashed var(--violet);
        border-radius: 8px;
        background: rgba(124, 77, 255, 0.08);
      }
    `,
  ],
})
export class LifecycleChild
  implements OnChanges, OnInit, DoCheck, AfterViewInit, OnDestroy
{
  /**
   * A plain `@Input()` rather than the modern `input()`, on purpose: `ngOnChanges`
   * only fires for decorator inputs, and this lesson needs to demonstrate it.
   */
  @Input() value = 0;
  /**
   * The shared log, so the child's hooks report into the parent's panel.
   */
  private readonly log = inject(LifecycleLog);

  /**
   * Fires before `ngOnInit` and again on every input change, with the previous and
   * current values.
   *
   * Largely unnecessary once inputs are signals — a `computed` or an `effect` over
   * an `input()` reacts to the same change with less ceremony — but it is still
   * the only hook that hands you the *previous* value.
   *
   * @param changes The changed inputs.
   */
  ngOnChanges(changes: SimpleChanges) {
    const v = changes['value'];
    this.log.add(`ngOnChanges — value ${v.previousValue} → ${v.currentValue}`);
  }
  /**
   * Runs once, after the first `ngOnChanges` and before the first render. With
   * signals a field initialiser usually does the same job.
   */
  ngOnInit() {
    this.log.add('ngOnInit — component initialised');
  }
  /**
   * Runs on **every** change-detection pass, which is why it is the hook most
   * likely to be a performance problem. Almost always the wrong tool: if you need
   * to react to a change, react to the thing that changed.
   */
  ngDoCheck() {
    this.log.add('ngDoCheck — change detection ran');
  }
  /**
   * Runs once, after the component's own view and its children exist. The first
   * point at which a `viewChild` is safe to touch.
   */
  ngAfterViewInit() {
    this.log.add('ngAfterViewInit — view & children ready');
  }
  /**
   * The cleanup hook: unsubscribe, clear timers, disconnect observers. Fires when
   * the component is removed, which in this demo is when the toggle hides it.
   */
  ngOnDestroy() {
    this.log.add('ngOnDestroy — cleaning up 🧹');
  }
}

/**
 * Lesson: Lifecycle Hooks — the order Angular calls them in, and which ones you
 * still need.
 *
 * The demo mounts and unmounts a child that logs every hook it receives, so the
 * sequence is observed rather than memorised — including the parts that surprise
 * people, like `ngOnChanges` running *before* `ngOnInit`, and content hooks
 * running before view hooks.
 *
 * The modern framing the lesson gives: most of these hooks existed to work
 * around the lack of reactivity. With signals, `ngOnChanges` is usually a
 * `computed`, and `ngOnInit` is usually just a field initialiser. The two that
 * remain genuinely necessary are `ngOnDestroy` for cleanup and the
 * `afterNextRender` / `afterEveryRender` family for work that needs real DOM.
 */
@Component({
  selector: 'app-lesson-lifecycle',
  imports: [RouterLink, LifecycleChild],
  providers: [LifecycleLog],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Components & Templates</span>
      <h1>Lifecycle Hooks</h1>
      <p class="lead">
        As Angular creates, updates and destroys a component it calls a sequence
        of <em>lifecycle hooks</em>. Implement the matching interface and method to
        run code at the right moment.
      </p>

      <h2>Try it — drive the hooks</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:14px">
          <button (click)="toggle()">{{ show() ? 'Destroy' : 'Create' }} child</button>
          <button class="ghost" [disabled]="!show()" (click)="value.set(value() + 1)">
            Change &#64;Input (value = {{ value() }})
          </button>
          <button class="ghost" (click)="log.clear()">Clear log</button>
        </div>

        @if (show()) {
          <app-lifecycle-child [value]="value()" />
        }

        <h3>Hook log</h3>
        @if (log.entries().length) {
          <ol class="log">
            @for (line of log.entries(); track $index) {
              <li>{{ line }}</li>
            }
          </ol>
        } @else {
          <p style="color:var(--text-muted)">Create the child to see hooks fire.</p>
        }
      </div>

      <h2>The hooks, in order</h2>
      <table class="hooks">
        <tr><th>Hook</th><th>When it runs</th></tr>
        <tr><td><code>ngOnChanges</code></td><td>Before init and whenever an &#64;Input changes (gets a <code>SimpleChanges</code>).</td></tr>
        <tr><td><code>ngOnInit</code></td><td>Once, after the first <code>ngOnChanges</code>. Do your setup here.</td></tr>
        <tr><td><code>ngDoCheck</code></td><td>Every change-detection run. Use sparingly — it fires a lot.</td></tr>
        <tr><td><code>ngAfterContentInit</code></td><td>Once, after projected content (<code>ng-content</code>) is initialised.</td></tr>
        <tr><td><code>ngAfterContentChecked</code></td><td>After every check of projected content.</td></tr>
        <tr><td><code>ngAfterViewInit</code></td><td>Once, after the component's view &amp; child views are ready.</td></tr>
        <tr><td><code>ngAfterViewChecked</code></td><td>After every check of the view &amp; child views.</td></tr>
        <tr><td><code>ngOnDestroy</code></td><td>Just before Angular destroys the component. Clean up here.</td></tr>
      </table>

      <div class="note">
        <strong>constructor vs ngOnInit:</strong> the constructor runs at
        instantiation, before inputs are set and before the view exists — keep it to DI
        (<code>inject()</code>). By <code>ngOnInit</code> the inputs are bound, so that's
        where setup belongs. <strong>Parent/child order:</strong> a child's
        <code>ngOnInit</code> and <code>ngAfterViewInit</code> fire <em>before</em> the
        parent's <code>ngAfterViewInit</code> — children are ready before the parent's
        view is considered complete.
      </div>

      <div class="tip">
        In modern Angular you often <em>avoid</em> hooks entirely: use
        <code>signal</code>/<code>computed</code> instead of <code>ngOnChanges</code>,
        <code>afterNextRender</code> instead of <code>ngAfterViewInit</code>, and
        <code>takeUntilDestroyed()</code> / <code>DestroyRef</code> instead of
        <code>ngOnDestroy</code>. But knowing the hooks is still essential.
      </div>
      <div class="warn">
        Avoid changing state inside <code>ngAfterViewInit</code>/<code>...Checked</code>
        that a binding already read this pass — in dev mode that triggers
        <code>ExpressionChangedAfterItHasBeenCheckedError</code>. Defer such updates
        (a signal write, or <code>queueMicrotask</code>).
      </div>

      <h2>Under the hood</h2>
      <ul>
        <li><strong>Hooks are plain method calls, not events.</strong> There's no
          <code>EventEmitter</code> or observable underneath — Angular's change-detection
          tree walk simply invokes <code>instance.ngOnInit()</code>,
          <code>instance.ngDoCheck()</code>, etc. directly, in a fixed order, on every
          component that implements them. Naming the method right (<code>ngOnInit</code>,
          not <code>OnInit</code>) is what makes it get called — the interface itself is
          TypeScript-only and erased at runtime.</li>
        <li><strong>The tree walk explains the parent/child ordering.</strong> Angular
          checks components top-down (parent creates &amp; initialises its children as it
          renders them), which is why a child's <code>ngOnInit</code> always runs before
          its own <code>ngAfterViewInit</code> — but the "view ready" hooks
          (<code>ngAfterViewInit</code>/<code>ngAfterViewChecked</code>) fire bottom-up: a
          parent's view isn't "complete" until every child's view is, so children report
          in first.</li>
        <li><strong><code>ngOnChanges</code> only sees decorator <code>&#64;Input()</code>s.</strong>
          It's populated by Angular's binding-diff machinery, which only tracks the inputs
          it set up in the compiled template instructions — a signal written internally,
          or a value read via a plain <code>@Input</code>-less field, never appears in
          <code>SimpleChanges</code>. That's one reason <code>input()</code>-based
          components lean on <code>computed()</code>/<code>effect()</code> instead.</li>
        <li><strong><code>ngDoCheck</code> fires on every CD pass, app-wide, once
          <em>anything</em> triggers it</strong> — a click anywhere, an HTTP response, a
          timer — not just when this component's own data changes. That's what makes it
          expensive to implement carelessly and why the "Try it" log above grows fast even
          from unrelated interactions.</li>
      </ul>

      <h2>Key takeaways</h2>
      <ul>
        <li>Hooks let you run code at specific moments of a component's life.</li>
        <li><code>ngOnInit</code> for setup, <code>ngOnDestroy</code> for cleanup.</li>
        <li><code>ngOnChanges</code> reports decorator-<code>&#64;Input</code> changes via <code>SimpleChanges</code>.</li>
        <li>Prefer signals &amp; <code>DestroyRef</code> in new code where you can.</li>
      </ul>

      <p><a routerLink="/inputs">Next: Component Inputs →</a></p>
    </article>
  `,
  styles: [
    `
      .log {
        background: var(--code-bg);
        color: var(--code-fg);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px 12px 12px 32px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.82rem;
        max-height: 220px;
        overflow: auto;
      }
      .hooks {
        width: 100%;
        border-collapse: collapse;
      }
      .hooks th,
      .hooks td {
        text-align: left;
        padding: 8px;
        border-bottom: 1px solid var(--border);
        vertical-align: top;
      }
      .hooks td:first-child {
        white-space: nowrap;
      }
    `,
  ],
})
export class Lifecycle {
  /**
   * The shared log the child writes into.
   */
  protected readonly log = inject(LifecycleLog);
  /**
   * Whether the child is mounted — toggling it is what drives the whole demo.
   */
  protected readonly show = signal(false);
  /**
   * The value bound to the child's input, so `ngOnChanges` can be provoked without
   * remounting.
   */
  protected readonly value = signal(0);

  /**
   * Mounts or unmounts the child, producing the init or destroy hooks.
   */
  protected toggle() {
    this.show.update((s) => !s);
  }
}
