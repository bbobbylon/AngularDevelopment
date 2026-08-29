import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * One arm of the {@link Pet} union.
 */
interface Cat {
  type: 'cat';
  meow(): string;
}
/**
 * The other arm of the {@link Pet} union.
 */
interface Dog {
  type: 'dog';
  bark(): string;
}
/**
 * A union of two object types sharing a literal `type` field — the discriminant
 * that makes narrowing possible.
 */
type Pet = Cat | Dog;

// user-defined type guard
/**
 * A user-defined type guard.
 *
 * The `p is Cat` return type is the whole point: to the compiler this is not a
 * function returning `boolean`, it is a function that *proves* something. Inside
 * an `if (isCat(p))` the type is narrowed to `Cat`, which a plain `boolean`
 * return would not achieve.
 *
 * @param p The pet to test.
 * @returns Whether it is a cat — and, to the type system, evidence of it.
 */
function isCat(p: Pet): p is Cat {
  return p.type === 'cat';
}

/**
 * The classic three-state load union.
 *
 * Modelled as a union rather than as `{ loading: boolean; data?: string[];
 * error?: string }` on purpose: the union makes the impossible states
 * unrepresentable, so "loaded but also errored" cannot be constructed at all.
 */
type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; data: string[] }
  | { status: 'error'; message: string };

/**
 * Lesson: Narrowing & guards — how control-flow analysis actually tracks
 * types per reference, every built-in guard with its pitfall (typeof null,
 * cross-realm instanceof, truthiness on falsy values), discriminated unions
 * with a live loading/loaded/error state demo, user-defined guards and why
 * they're trusted rather than checked, assertion functions, exhaustiveness,
 * and where narrowing is lost (closures, aliasing, mutation).
 */
@Component({
  selector: 'app-lesson-ts-narrowing',
  imports: [RouterLink],
  templateUrl: './narrowing.html',
  styleUrl: './narrowing.css',
})
export class Narrowing {
  /**
   * The animal-sound demo's output.
   */
  protected readonly sound = signal('—');
  /**
   * The load state in the discriminated-union demo.
   */
  protected readonly state = signal<LoadState>({ status: 'loading' });

  /**
   * Switches to the loading state.
   */
  protected setLoading() {
    this.state.set({ status: 'loading' });
  }
  /**
   * Switches to the loaded state, with data attached — only legal on this arm.
   */
  protected setLoaded() {
    this.state.set({ status: 'loaded', data: ['alpha', 'beta', 'gamma'] });
  }
  /**
   * Switches to the error state, with a message attached — only legal on this arm.
   */
  protected setError() {
    this.state.set({ status: 'error', message: 'HTTP 500 — server exploded' });
  }

  /**
   * The loaded data, or an empty array. The `status` check is what makes `s.data`
   * reachable; without it the property does not exist on the union.
   */
  protected loadedData(): string[] {
    const s = this.state();
    return s.status === 'loaded' ? s.data : [];
  }

  /**
   * The error message, or an empty string, narrowed the same way.
   */
  protected errorMessage(): string {
    const s = this.state();
    return s.status === 'error' ? s.message : '';
  }

  /**
   * Builds a pet of the chosen kind and calls its sound through {@link isCat},
   * so the guard is doing the work rather than a cast.
   *
   * @param type Which animal to make.
   */
  protected pick(type: 'cat' | 'dog') {
    const pet: Pet =
      type === 'cat'
        ? { type: 'cat', meow: () => '🐱 meow' }
        : { type: 'dog', bark: () => '🐶 woof' };
    this.sound.set(isCat(pet) ? pet.meow() : pet.bark());
  }
}
