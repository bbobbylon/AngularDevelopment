import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/** A tiny generic container, like a typed box. */
class Box<T> {
  /**
   * @param value The wrapped value, exposed publicly via a parameter property.
   */
  constructor(public value: T) {}
  /**
   * Transforms the contents, returning a **new** `Box` of the result type.
   *
   * The second type parameter `U` is what makes this useful: the returned box's
   * type follows the function's return type, so `Box<number>.map(n => String(n))`
   * is a `Box<string>` without anyone saying so.
   *
   * @param fn Transform applied to the value.
   * @returns A new box holding the result.
   */
  map<U>(fn: (v: T) => U): Box<U> {
    return new Box(fn(this.value));
  }
}

/** Generic with a constraint: T must have an `id`. */
interface Entity {
  id: number;
}
/**
 * Finds an item by id.
 *
 * `T extends Entity` is the constraint that makes this both safe and useful: the
 * body can rely on `.id` existing, and the caller gets their *own* type back
 * rather than a widened `Entity`.
 *
 * @param items The collection to search.
 * @param id    The id to look for.
 * @returns The matching item, or `undefined`.
 */
function byId<T extends Entity>(items: T[], id: number): T | undefined {
  return items.find((i) => i.id === id);
}

/**
 * Lesson: Generics — how inference actually picks T (arguments, widening,
 * best-common-supertype, const type params), constraints including the
 * K-extends-keyof-T pattern, generic classes with type-threading map chains,
 * the return-only-generic-is-a-cast trap (http.get<T> included), defaults,
 * where generics power every Angular API, and when NOT to genericize.
 */
@Component({
  selector: 'app-lesson-ts-generics',
  imports: [RouterLink],
  templateUrl: './generics.html',
  styleUrl: './generics.css',
})
export class Generics {
  /**
   * The value fed into the `Box` demo.
   */
  protected readonly seed = signal(2);
  /**
   * The id looked up in the constraint demo.
   */
  protected readonly lookup = signal(1);

  /**
   * The collection searched by {@link byId}.
   */
  protected readonly users: Entity[] = [{ id: 1 }, { id: 2 }, { id: 3 }];

  /**
   * Runs the `Box` demo: wraps a number, maps it twice, and reports the result —
   * with the type changing along the chain.
   */
  protected boxResult(): string {
    return new Box(this.seed())
      .map((n) => n * 10)
      .map((n) => '#' + n).value;
  }

  /**
   * Runs the constrained-lookup demo.
   */
  protected found(): string {
    const u = byId(this.users, this.lookup());
    return u ? `user with id ${u.id}` : 'not found';
  }
}
