import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Predict, Quiz, type QuizOption, Remember } from '../../../shared/teaching';

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
  imports: [RouterLink, Predict, Quiz, Remember],
  templateUrl: './generics.html',
  styleUrl: './generics.css',
})
export class Generics {
  /**
   * The empty-array puzzle used by the ask-before-telling block.
   *
   * `firstOf<T>` looks perfectly type-safe — T flows from the argument into the
   * return, exactly the "two positions" pattern the lesson recommends. But the
   * shape check and the value check are different things: an empty array still
   * satisfies `T[]`, so `items[0]` is `undefined` at runtime while the compiler
   * remains fully convinced it's a `T`.
   *
   * Held in the class rather than the template because the snippet is full of
   * `{`/`}`, which Angular's parser reads as control-flow syntax in an attribute.
   */
  protected readonly firstOfBugSample = `function firstOf<T>(items: T[]): T {
  return items[0];   // items[0] on an empty array is undefined — T says otherwise
}

const names = firstOf(['Ada', 'Alan', 'Grace']);
console.log(names.toUpperCase());   // fine

const empty: number[] = [];
const oops = firstOf(empty);        // TypeScript infers oops: number
console.log(oops.toFixed(2));       // ???`;

  /**
   * The self-test, on whether a class's fixed `T` and a method's fresh `U` are
   * related across chained calls. Every wrong answer imagines some memory or
   * carry-over between calls that generic inference doesn't have.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: "No — each call to map<U> infers its own U purely from that call's own callback. The second map has no idea the first map's U happened to be string; it only sees whatever type Box currently holds going into it.",
      correct: true,
      why: 'This is why the chain can freely change type at every link: number → string → boolean, however many maps long. Each map<U> is a fresh, independent inference, solved only from the value flowing into that one call — nothing is remembered or reused from earlier links.',
    },
    {
      text: 'Yes — once the first map call fixes U to string, every later map on that same chain is locked to U = string too.',
      why: "U belongs to the METHOD call, not the object. Box<T> is one instance with one T, but map<U> is invoked fresh each time — the compiler solves a brand-new U from that specific callback's return type, with no memory of a previous call's U.",
    },
    {
      text: "It's allowed for two calls, but a third .map() in the same chain is a compile error because U can only be reused twice.",
      why: 'There is no such limit. Each .map() call is independent type inference; you can chain as many as you like, each one free to change the type again.',
    },
    {
      text: 'It depends on whether Box<T> was declared with a default type parameter — without a default, U calls are locked together.',
      why: 'Defaults only supply a fallback when a type argument is omitted entirely (like ApiResult<T = unknown>). They have no bearing on whether separate method calls share a type parameter — method-level generics are always solved per call, default or not.',
    },
  ];

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
    return new Box(this.seed()).map((n) => n * 10).map((n) => '#' + n).value;
  }

  /**
   * Runs the constrained-lookup demo.
   */
  protected found(): string {
    const u = byId(this.users, this.lookup());
    return u ? `user with id ${u.id}` : 'not found';
  }
}
