import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A deliberately hole-y shape: both the address and its city are optional, so
 * the demo needs two links of optional chaining to reach the city.
 */
interface Profile {
  name: string;
  address?: { city?: string };
  prefs?: { theme?: string };
}

/**
 * The falsy values worth distinguishing. `0`, `''` and `false` are falsy but
 * perfectly valid data; `null` and `undefined` are absence. Conflating the two
 * groups is exactly the bug `??` exists to prevent.
 */
type Falsyish = 0 | '' | false | null | undefined;

/**
 * One falsy value with a label, for the `||` against `??` comparison.
 */
interface FalsyCase {
  label: string;
  value: Falsyish;
}

const FALSY_CASES: FalsyCase[] = [
  { label: '0', value: 0 },
  { label: "''", value: '' },
  { label: 'false', value: false },
  { label: 'null', value: null },
  { label: 'undefined', value: undefined },
];

/**
 * Lesson: Optional chaining & nullish coalescing — exact short-circuit
 * semantics (?. always yields undefined, never null; the whole chain tail is
 * skipped), the || vs ?? falsy-vs-nullish distinction with a live comparison
 * demo, the logical-assignment trio, both flavors of the ! assertion, and how
 * strictNullChecks makes all of it matter.
 */
@Component({
  selector: 'app-lesson-ts-nullish',
  imports: [RouterLink],
  templateUrl: './nullish.html',
  styleUrl: './nullish.css',
})
export class Nullish {
  /**
   * The profile in the optional-chaining demo. Starts `null` so the demo opens on
   * the case that would throw without `?.`.
   */
  protected readonly profile = signal<Profile | null>(null);

  /**
   * The falsy values to compare.
   */
  protected readonly falsyCases = FALSY_CASES;
  /**
   * Which one is selected.
   */
  protected readonly picked = signal<FalsyCase>(FALSY_CASES[0]);

  /**
   * The selected value through `||`.
   *
   * Falls back on **any** falsy value — so a real `0` or `''` is silently
   * replaced by the fallback. Shown next to {@link nullishResult} so the
   * difference is visible rather than asserted.
   */
  protected orResult(): string {
    const v = this.picked().value;
    return JSON.stringify((v || 'fallback') as unknown);
  }

  /**
   * The selected value through `??`. Falls back only on `null` or `undefined`, so
   * `0` and `''` survive.
   */
  protected nullishResult(): string {
    const v = this.picked().value;
    return JSON.stringify((v ?? 'fallback') as unknown);
  }

  /**
   * Loads a complete profile — every link in the chain present.
   */
  protected full() {
    this.profile.set({ name: 'Ada', address: { city: 'London' } });
  }
  /**
   * Loads a profile with no address — the middle link missing.
   */
  protected partial() {
    this.profile.set({ name: 'Ada' });
  }
  /**
   * Clears the profile entirely — the outermost link missing.
   */
  protected empty() {
    this.profile.set(null);
  }

  /**
   * The city, reached through two optional links with a fallback.
   *
   * One expression that survives all three demo states: without `?.` this throws
   * on a null profile, and without `??` it renders `undefined`.
   */
  protected city(): string {
    return this.profile()?.address?.city ?? 'Unknown';
  }
}
