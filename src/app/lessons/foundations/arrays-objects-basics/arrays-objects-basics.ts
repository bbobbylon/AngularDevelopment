import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The demo object's shape.
 */
interface Person {
  name: string;
  age: number;
  member: boolean;
}

/**
 * Lesson: Arrays & objects — index mechanics, everyday array methods, object
 * keys vs dot/bracket access, nesting, and the single most consequential idea
 * for later Angular work: value vs REFERENCE (with a live shared-reference
 * demo), plus copying with spread and destructuring.
 */
@Component({
  selector: 'app-lesson-arrays-objects-basics',
  imports: [RouterLink],
  templateUrl: './arrays-objects-basics.html',
  styleUrl: './arrays-objects-basics.css',
})
export class ArraysObjectsBasics {
  /**
   * The list in the array demo.
   */
  protected readonly fruits = signal<string[]>(['apple', 'banana', 'cherry']);
  /**
   * The object in the object demo.
   */
  protected readonly person = signal<Person>({ name: 'Ada', age: 36, member: true });

  /**
   * Appends a value, ignoring blank input.
   *
   * Builds a **new** array with a spread rather than pushing. `push` mutates in
   * place, so the signal's reference would not change and nothing would re-render
   * — the single most common signals mistake, demonstrated here on purpose.
   *
   * @param value The raw input text.
   */
  protected add(value: string) {
    const v = value.trim();
    if (v) this.fruits.update((list) => [...list, v]);
  }
  /**
   * Removes the entry at an index, again by building a new array.
   *
   * @param i Index to drop.
   */
  protected removeAt(i: number) {
    this.fruits.update((list) => list.filter((_, idx) => idx !== i));
  }
  /**
   * Sets the name, replacing the object rather than mutating it.
   *
   * @param name The new name.
   */
  protected setName(name: string) {
    // NEW object via spread — not mutation — so the signal's reference changes.
    this.person.update((p) => ({ ...p, name }));
  }
  /**
   * Sets the age, likewise by replacement.
   *
   * @param age The new age.
   */
  protected setAge(age: number) {
    this.person.update((p) => ({ ...p, age }));
  }
  /**
   * The object as JSON, so the demo can show the whole value changing at once.
   */
  protected json() {
    return JSON.stringify(this.person());
  }

  /**
   * Shared-reference demo. We model the "one object, two arrows" situation with
   * a plain mutable object plus a version counter signal that forces re-render
   * (mutation alone wouldn't — which is itself the lesson's punchline).
   */
  private shared = { count: 5 };
  /**
   * The second reference in the shared-reference demo. `null` means `y` is still
   * the *same object* as {@link shared}; cloning points it at a copy.
   */
  private sharedCopy: { count: number } | null = null; // null = still linked to `shared`
  /**
   * A tick bumped whenever the demo mutates a plain object.
   *
   * Needed because the shared-reference demo deliberately works on non-signal
   * objects: mutation is invisible to Angular, so something has to tell the view
   * that anything happened. That it is needed at all is the lesson.
   */
  private readonly version = signal(0);

  /**
   * Whether `x` and `y` still point at one object — the demo's headline state.
   */
  protected readonly linked = computed(() => {
    this.version();
    return this.sharedCopy === null;
  });
  /**
   * A snapshot of `x` for rendering.
   *
   * Copied through a `computed` that reads {@link version}, because the demo
   * mutates a plain object rather than a signal: without the version bump there
   * would be nothing for Angular to notice. That is the lesson stated in
   * mechanism — mutation is invisible.
   */
  protected readonly sharedX = computed(() => {
    this.version();
    return { ...this.shared };
  });
  /**
   * A snapshot of `y`: the clone if one has been made, otherwise the same object
   * as `x`.
   */
  protected readonly sharedY = computed(() => {
    this.version();
    return this.sharedCopy ? { ...this.sharedCopy } : { ...this.shared };
  });

  /**
   * Mutates the shared object and bumps {@link version} so the view catches up.
   * Both `x` and `y` change together while they are still linked.
   */
  protected bumpShared() {
    this.shared.count++;
    this.version.update((v) => v + 1);
  }
  /**
   * Points `y` at a copy. From here the two move independently — the moment the
   * demo exists to show.
   */
  protected cloneShared() {
    this.sharedCopy = { ...this.shared };
    this.version.update((v) => v + 1);
  }
  /**
   * Resets both references back to one shared object.
   */
  protected resetShared() {
    this.shared = { count: 5 };
    this.sharedCopy = null;
    this.version.update((v) => v + 1);
  }
}
