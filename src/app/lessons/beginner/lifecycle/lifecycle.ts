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
  readonly entries = signal<string[]>([]);
  add(msg: string) {
    this.entries.update((e) => [...e, `${this.entries().length + 1}. ${msg}`]);
  }
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
  @Input() value = 0;
  private readonly log = inject(LifecycleLog);

  ngOnChanges(changes: SimpleChanges) {
    const v = changes['value'];
    this.log.add(`ngOnChanges — value ${v.previousValue} → ${v.currentValue}`);
  }
  ngOnInit() {
    this.log.add('ngOnInit — component initialised');
  }
  ngDoCheck() {
    this.log.add('ngDoCheck — change detection ran');
  }
  ngAfterViewInit() {
    this.log.add('ngAfterViewInit — view & children ready');
  }
  ngOnDestroy() {
    this.log.add('ngOnDestroy — cleaning up 🧹');
  }
}

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
  protected readonly log = inject(LifecycleLog);
  protected readonly show = signal(false);
  protected readonly value = signal(0);

  protected toggle() {
    this.show.update((s) => !s);
  }
}
