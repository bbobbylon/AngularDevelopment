import { JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Predict, Quiz, type QuizOption, Remember } from '../../../shared/teaching';

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
  imports: [RouterLink, JsonPipe, Predict, Quiz, Remember],
  templateUrl: './utility-types.html',
  styleUrl: './utility-types.css',
})
export class UtilityTypes {
  /**
   * The shallow-`Readonly` puzzle used by the ask-before-telling block.
   *
   * `Readonly<T>` only stamps `readonly` on T's own top-level properties — it
   * never recurses into the object each property points to. Reassigning the
   * property is blocked; mutating THROUGH it is not.
   *
   * Held in the class rather than the template because the snippet is full of
   * `{`/`}`, which Angular's parser reads as control-flow syntax in an attribute.
   */
  protected readonly shallowReadonlySample = `interface State {
  user: { name: string };
}

const s: Readonly<State> = { user: { name: 'Ada' } };

s.user = { name: 'Bob' };      // ①
s.user.name = 'Grace';         // ②`;

  /**
   * The self-test, on distributive conditionals over an empty union. Every
   * wrong answer invents behavior for the "no members to distribute over"
   * case instead of recognizing it produces an empty union too.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: 'never — Exclude<T, U> is a distributive conditional, and distributing over an empty union (never) yields never straight back, without ever actually evaluating the extends check.',
      correct: true,
      why: "This is exactly why the demo above prints 'never' as the K union when no keys are selected: an empty selection is never at the type level, and any distributive conditional applied to never simply stays never — there's nothing to distribute over, so neither branch of the conditional ever runs.",
    },
    {
      text: "'x' — with no members to exclude, the conditional falls through to its false branch and returns the exclusion argument itself.",
      why: "Distributive conditionals don't have a 'nothing to check, return the other side' fallback. An empty union has zero members to distribute over, so the result is an empty union (never) — not a fallback value pulled from U.",
    },
    {
      text: "It's a compile error — Exclude requires at least one member in its first type argument.",
      why: "There's no such arity requirement. never is a perfectly ordinary type argument, and TypeScript happily evaluates (or rather, trivially skips) the distribution over it.",
    },
    {
      text: 'any — TypeScript widens an empty union to any when a conditional type has nothing concrete to distribute over.',
      why: 'TypeScript never silently widens to any here. An empty union stays exactly what it is — never — all the way through a distributive conditional.',
    },
  ];

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
