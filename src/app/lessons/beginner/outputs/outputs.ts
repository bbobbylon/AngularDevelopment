import { DatePipe } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface RateEvent {
  stars: number;
  at: Date;
}

/** A child that emits events upward via output(). */
@Component({
  selector: 'app-rating',
  template: `
    <div class="rating">
      @for (star of stars; track star) {
        <button
          class="star"
          [class.on]="star <= current()"
          (click)="select(star)"
          [attr.aria-label]="star + ' stars'"
        >
          ★
        </button>
      }
      <button class="ghost" (click)="reset()">clear</button>
    </div>
  `,
  styles: [
    `
      .rating {
        display: inline-flex;
        gap: 4px;
        align-items: center;
      }
      .star {
        background: none;
        border: none;
        font-size: 1.6rem;
        line-height: 1;
        color: var(--border);
        padding: 0 2px;
      }
      .star.on {
        color: var(--amber);
      }
    `,
  ],
})
export class Rating {
  readonly max = input(5);
  readonly current = signal(0);
  protected get stars() {
    return Array.from({ length: this.max() }, (_, i) => i + 1);
  }

  /** output() returns an emitter; parents bind (rate)="..." */
  readonly rate = output<RateEvent>();
  readonly cleared = output<void>();

  protected select(stars: number) {
    this.current.set(stars);
    this.rate.emit({ stars, at: new Date() });
  }

  protected reset() {
    this.current.set(0);
    this.cleared.emit();
  }
}

@Component({
  selector: 'app-lesson-outputs',
  imports: [RouterLink, Rating, DatePipe],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Component Communication</span>
      <h1>Component Outputs</h1>
      <p class="lead">
        Outputs let a child notify its parent that something happened. The modern
        <code>output()</code> function creates a typed emitter; the parent listens
        with event-binding syntax <code>(outputName)="handler($event)"</code>.
      </p>

      <h2>Declaring & emitting</h2>
      <div class="code">
        <pre>export class Rating {{ '{' }}
  rate = output&lt;RateEvent&gt;();      // typed output
  select(stars: number) {{ '{' }}
    this.rate.emit({{ '{' }} stars, at: new Date() {{ '}' }});  // push a value up
  {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>Try it</h2>
      <div class="demo">
        <p class="demo__title">Live — child emits, parent reacts</p>
        <app-rating (rate)="onRate($event)" (cleared)="onClear()" />

        <p style="margin-top:14px">
          @if (last(); as r) {
            Parent received: <strong>{{ r.stars }} star(s)</strong>
            at {{ r.at | date: 'HH:mm:ss' }}
          } @else {
            Parent received: <em>nothing yet</em>
          }
        </p>
        @if (history().length) {
          <p class="pill">events fired: {{ history().length }}</p>
        }
      </div>

      <div class="code">
        <pre>&lt;app-rating (rate)="onRate($event)" (cleared)="onClear()" /&gt;

onRate(e: RateEvent) {{ '{' }} this.last.set(e); {{ '}' }}</pre>
      </div>

      <div class="note">
        <code>$event</code> in an output binding is the emitted value (here a
        <code>RateEvent</code>), not a DOM event. Outputs are how
        <code>[(two-way)]</code> binding works under the hood: an input
        <code>x</code> plus an output <code>xChange</code> — which is exactly what
        <code>model()</code> generates.
      </div>

      <h2>Outputs from an Observable</h2>
      <div class="code">
        <pre>import {{ '{' }} outputFromObservable {{ '}' }} from '&#64;angular/core/rxjs-interop';
// expose a stream as an output:
saved = outputFromObservable(this.savedSubject$);</pre>
      </div>
      <div class="note">
        Subscriptions to outputs are cleaned up automatically when the component is
        destroyed — no manual unsubscribe. Name outputs for the <em>event</em>
        (<code>saved</code>, <code>rate</code>), not <code>onSave</code>, and avoid native
        event names like <code>click</code>/<code>change</code> to prevent confusion with
        DOM events.
      </div>

      <h2>The classic &#64;Output / EventEmitter</h2>
      <p>The decorator equivalent you will meet in exams and older code:</p>
      <div class="code">
        <pre>&#64;Output() rate = new EventEmitter&lt;RateEvent&gt;();
this.rate.emit(payload);</pre>
      </div>
      <p>
        <code>output()</code> is preferred: it's not a full <code>Subject</code> (no
        <code>.subscribe</code> on the instance, no values pushed in from outside), which
        keeps the contract one-directional and clear.
      </p>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>output&lt;T&gt;()</code> creates a typed event emitter on a child.</li>
        <li>Emit with <code>.emit(value)</code>; the parent listens with <code>(name)</code>.</li>
        <li>The handler receives the emitted value as <code>$event</code>.</li>
        <li>Decorator form: <code>&#64;Output() x = new EventEmitter&lt;T&gt;()</code>.</li>
      </ul>

      <p><a routerLink="/services-di">Next: Services &amp; Dependency Injection →</a></p>
    </article>
  `,
})
export class Outputs {
  protected readonly last = signal<RateEvent | null>(null);
  protected readonly history = signal<RateEvent[]>([]);

  protected onRate(e: RateEvent) {
    this.last.set(e);
    this.history.update((h) => [...h, e]);
  }

  protected onClear() {
    this.last.set(null);
  }
}
