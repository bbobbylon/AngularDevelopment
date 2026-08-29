import { JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The shape the utility-type demos transform.
 */
interface User {
  id: number;
  name: string;
  email: string;
}

const USER_KEYS = ['id', 'name', 'email'] as const;
/**
 * The union of `User`'s keys, derived from the runtime array with an indexed
 * access on `typeof`. One source of truth: the array drives both the picker in
 * the UI and the type used to check it.
 */
type UserKey = (typeof USER_KEYS)[number];

/**
 * Lesson: Utility types — the built-ins shown WITH their actual one-line
 * definitions (they're all mapped/conditional types you could write yourself),
 * homomorphic modifier preservation, the Pick-validates-keys/Omit-doesn't
 * asymmetry, union filtering via distribution, function/promise extractors,
 * a live Partial-patch demo and a live Pick/Omit key selector.
 */
@Component({
  selector: 'app-lesson-ts-utility-types',
  imports: [RouterLink, JsonPipe],
  templateUrl: './utility-types.html',
  styleUrl: './utility-types.css',
})
export class UtilityTypes {
  /**
   * The starting record that patches are applied over.
   */
  private readonly base: User = { id: 1, name: 'Ada', email: 'ada@example.com' };
  /**
   * The pending changes. Typed `Partial<User>` — every field optional — which is
   * exactly what a patch is, and why `Partial` exists.
   */
  protected readonly patch = signal<Partial<User>>({});
  /**
   * The base with the patch applied. Typed as a full `User` again: spreading a
   * `Partial` over a complete value restores completeness.
   */
  protected readonly merged = computed<User>(() => ({ ...this.base, ...this.patch() }));

  /**
   * The keys available in the Pick/Omit demo.
   */
  protected readonly userKeys = USER_KEYS;
  /**
   * Which keys are selected. Seeded with one so the demo opens on a non-empty
   * result.
   */
  protected readonly selected = signal<Set<UserKey>>(new Set<UserKey>(['email']));

  /**
   * Toggles a key in the selection.
   *
   * @param k The key to toggle.
   */
  protected toggleKey(k: UserKey) {
    this.selected.update((s) => {
      const next = new Set(s);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  /**
   * The selection rendered as a type-level union, e.g. `'id' | 'name'` — or
   * `never` when nothing is selected, which is what an empty union actually is.
   */
  protected keyUnion(): string {
    const keys = [...this.selected()];
    return keys.length ? keys.map((k) => `'${k}'`).join(' | ') : 'never';
  }

  /**
   * The runtime equivalent of `Pick<User, …>`: an object with only the selected
   * keys.
   */
  protected pickResult(): Partial<User> {
    const out: Partial<User> = {};
    for (const k of this.selected()) (out as Record<string, unknown>)[k] = this.base[k];
    return out;
  }

  /**
   * The runtime equivalent of `Omit<User, …>`: an object with everything *except*
   * the selected keys. Shown beside {@link pickResult} because the pair is easier
   * to remember as complements than separately.
   */
  protected omitResult(): Partial<User> {
    const out: Partial<User> = {};
    for (const k of this.userKeys) {
      if (!this.selected().has(k)) (out as Record<string, unknown>)[k] = this.base[k];
    }
    return out;
  }
}
