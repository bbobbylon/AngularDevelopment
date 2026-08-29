import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Demo class for parameter properties, `readonly`, and a getter.
 */
class Counter {
  // parameter properties: declare + assign in one place
  /**
   * Declares and assigns its fields in one place using parameter properties —
   * `public readonly label` and `private value` are both declared *and* set by
   * appearing in the signature.
   *
   * @param label Display name, exposed read-only.
   * @param value Starting count, kept private.
   */
  constructor(
    public readonly label: string,
    private value = 0,
  ) {}

  /**
   * The count. A getter rather than a public field, so the value is readable
   * from outside but only writable through {@link increment}.
   */
  get current() {
    return this.value;
  }
  /**
   * Adds to the count and returns `this`, so calls can be chained.
   *
   * @param by How much to add.
   * @returns This counter.
   */
  increment(by = 1) {
    this.value += by;
    return this;
  }
}

/**
 * Demo class for the `this`-binding difference between a method and an arrow
 * property.
 */
class Greeter {
  /**
   * @param name Stored privately via a parameter property.
   */
  constructor(private name: string) {}

  // method — `this` depends on HOW it's called
  /**
   * A normal method: `this` is decided by **how it is called**, not where it is
   * defined. Pull it off the instance and call it bare and `this` is `undefined`
   * — which the `?.` here reports rather than crashing on.
   */
  greetMethod() {
    return `hi from ${this?.name ?? 'undefined (this was lost!)'}`;
  }

  // arrow field — `this` captured lexically at construction
  /**
   * An arrow **property**: `this` is captured from the enclosing instance when the
   * property is created, so it survives being detached.
   *
   * The trade-off the lesson names: this is a per-instance function object rather
   * than one shared on the prototype, so it costs memory per instance and cannot
   * be overridden by a subclass.
   */
  greetArrow = () => `hi from ${this.name}`;
}

/**
 * Lesson: Classes & access modifiers — what a class desugars to, field
 * initialization order, the soft-vs-hard privacy split (and how `private`
 * makes an otherwise-structural class nominal), parameter properties vs
 * inject(), inheritance with noImplicitOverride, `this`-loss and the
 * arrow-field fix with a live broken-vs-bound demo, abstract vs implements,
 * and the class-is-both-type-and-value duality.
 */
@Component({
  selector: 'app-lesson-ts-classes',
  imports: [RouterLink],
  templateUrl: './classes.html',
  styleUrl: './classes.css',
})
export class Classes {
  /**
   * The counter behind the live demo.
   */
  private readonly counter = new Counter('clicks');
  /**
   * Its label, read once — `readonly` on the class means it cannot change.
   */
  protected readonly label = this.counter.label;
  /**
   * The displayed count. A separate signal because {@link Counter} is a plain
   * class with no reactivity: {@link bump} has to push the new value across.
   */
  protected readonly display = signal(this.counter.current);

  /**
   * Result of the detached-call demo, or `null` before it has been run.
   */
  protected readonly detachedResult = signal<{ method: string; arrow: string } | null>(null);

  /**
   * Increments the counter and copies the new value into the signal.
   *
   * @param by How much to add.
   */
  protected bump(by: number) {
    this.counter.increment(by);
    this.display.set(this.counter.current);
  }

  /**
   * Runs the detached-call demo: pulls both the method and the arrow property off
   * a fresh instance, calls them bare, and shows that only the arrow still knows
   * what `this` was.
   */
  protected callDetached() {
    const g = new Greeter('Ada');
    const method = g.greetMethod;
    const arrow = g.greetArrow;
    this.detachedResult.set({ method: method(), arrow: arrow() });
  }
}
