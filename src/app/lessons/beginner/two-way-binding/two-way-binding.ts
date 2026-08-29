import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Stepper } from './stepper/stepper';

/**
 * Lesson: two-way binding, from the syntax sugar down to the emission rules.
 *
 * Covers the exact desugaring of [(x)], the x/xChange naming contract, the
 * model() API in depth (including when valueChange does and does NOT fire),
 * splitting the banana to intercept writes, ngModel with ngModelOptions,
 * the assignability rule, the legacy @Input/@Output pattern, and the
 * pitfalls that show up in exams and code review.
 *
 * The Stepper below is a real child component used by several live demos.
 */
@Component({
  selector: 'app-lesson-two-way-binding',
  imports: [RouterLink, FormsModule, Stepper],
  styleUrl: './two-way-binding.css',
  templateUrl: './two-way-binding.html',
})
export class TwoWayBinding {
  /**
   * The plainly-bound value in the basic `[(value)]` demo.
   */
  protected readonly count = signal(5);

  // --- emission-rules demo ---
  /**
   * The value in the emission-rules demo.
   */
  protected readonly logged = signal(5);
  /**
   * A log of what emitted and what did not — the demo's actual output.
   */
  protected readonly log = signal<string[]>([]);
  /**
   * Handles a change that came **from the child**, and logs it.
   *
   * @param v The new value.
   */
  onLoggedChange(v: number) {
    this.logged.set(v);
    this.log.update((l) => [`valueChange emitted: ${v}  (child clicked)`, ...l].slice(0, 8));
  }
  /**
   * Writes the value **from the parent** and logs that no `valueChange` fired.
   *
   * The asymmetry is the lesson: a `model()` emits when the *child* writes it, not
   * when the parent does. Otherwise binding a parent's write back into its own
   * handler would loop.
   */
  setFromParent() {
    this.logged.set(42);
    this.log.update((l) => ['parent wrote 42 — input updated, NO valueChange', ...l].slice(0, 8));
  }

  // --- split-banana clamp demo ---
  /**
   * The value in the clamping demo.
   */
  protected readonly clamped = signal(5);
  /**
   * Sets the value, clamped to 0–10.
   *
   * The reason to split `[(x)]` into `[x]` and `(xChange)`: the sugar writes every
   * emission straight into state, so there is nowhere to reject or adjust one. The
   * long form gives you that seam back.
   *
   * @param v The value the child proposed.
   */
  setClamped(v: number) {
    this.clamped.set(Math.max(0, Math.min(10, v)));
  }

  // --- ngModel demos ---
  /**
   * Text bound with `[(ngModel)]` on each keystroke.
   */
  protected readonly text = signal('');
  /**
   * Text bound with `[(ngModel)]` on blur, to contrast the update timing.
   */
  protected readonly blurText = signal('');
  /**
   * The `[(ngModel)]` select demo's value.
   */
  protected readonly framework = signal('signals');
  /**
   * The `[(ngModel)]` checkbox demo's value.
   */
  protected readonly agree = signal(false);

  // --- code samples (kept as properties so braces/backticks need no template escaping) ---
  /**
   * Sample: `[(value)]` desugared into its `[value]` + `(valueChange)` pair.
   */
  readonly desugarSample = `<app-stepper [(value)]="count" />

<!-- is exactly equivalent to -->
<app-stepper [value]="count" (valueChange)="count = $event" />

<!-- and when count is a WritableSignal, the write-back becomes -->
<app-stepper [value]="count()" (valueChange)="count.set($event)" />`;

  /**
   * Sample: the `model()` API, including `model.required()`.
   */
  readonly modelApiSample = `export class Stepper {
  value = model(0);                        // input "value" + output "valueChange"
  size  = model.required<number>();        // parent MUST bind it (or NG8008 at compile time)
  width = model(0, { alias: 'dimension' }); // parent binds [(dimension)]

  inc() {
    this.value.update(v => v + 1);         // child-side write → valueChange emits
  }
}

// inside the child, value is a full signal:
doubled = computed(() => this.value() * 2); // reacts to parent AND child writes`;

  /**
   * Sample: splitting the banana-in-a-box to intercept a change before it lands.
   */
  readonly splitBananaSample = `<!-- sugar: every child emission lands in state unchecked -->
<app-stepper [(value)]="clamped" />

<!-- explicit pair: the parent owns the policy -->
<app-stepper [value]="clamped()" (valueChange)="setClamped($event)" />`;

  /**
   * Sample: `[(ngModel)]` and the `FormsModule` import it needs.
   */
  readonly ngModelSample = `import { FormsModule } from '@angular/forms';
// add FormsModule to the component's imports array

<input [(ngModel)]="text" />                              <!-- text: string -->
<input type="checkbox" [(ngModel)]="agree" />             <!-- boolean -->
<select [(ngModel)]="framework"> ... </select>            <!-- option value -->

<!-- commit on blur instead of every keystroke -->
<input [(ngModel)]="draft" [ngModelOptions]="{ updateOn: 'blur' }" />

<!-- inside a <form>: a name is required (or opt out with standalone) -->
<form>
  <input name="email" [(ngModel)]="email" />
  <input [(ngModel)]="scratch" [ngModelOptions]="{ standalone: true }" />
</form>`;

  /**
   * Sample: the legacy `@Input()` + `@Output() xChange` pair, and the naming rule
   * that made the sugar work.
   */
  readonly legacySample = `export class Stepper {
  @Input() value = 0;
  @Output() valueChange = new EventEmitter<number>();  // name MUST be value + "Change"

  inc() {
    this.value++;
    this.valueChange.emit(this.value);  // forget this line → parent silently desyncs
  }
}`;
}
