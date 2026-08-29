import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const THEME = {
  primary: '#dd0031',
  accent: '#7c4dff',
  success: '#2ec16b',
} as const;

/**
 * The keys of the theme object, derived rather than written out.
 *
 * `typeof THEME` lifts the runtime value into the type world; `keyof` then takes
 * its keys. Adding a colour to `THEME` widens this automatically — which is the
 * point: one source of truth instead of a value and a matching union that drift.
 */
type ThemeKey = keyof typeof THEME; // 'primary' | 'accent' | 'success'

const ROLES = ['admin', 'editor', 'viewer'] as const;

/**
 * Lesson: keyof / typeof / indexed access — deriving types FROM values so
 * nothing drifts, each operator dissected with edge cases, the type-safe
 * getter built up parameter by parameter, a live derived-keys demo, and the
 * single-source-of-truth pattern (const object → keys → values → unions)
 * used across real Angular codebases.
 */
@Component({
  selector: 'app-lesson-ts-keyof-typeof',
  imports: [RouterLink],
  templateUrl: './keyof-typeof.html',
  styleUrl: './keyof-typeof.css',
})
export class KeyofTypeof {
  /**
   * The theme keys, for the picker. The assertion is needed because
   * `Object.keys` is typed as `string[]` — it cannot promise no extra keys exist
   * at runtime.
   */
  protected readonly keys = Object.keys(THEME) as ThemeKey[];
  /**
   * The selected key.
   */
  protected readonly key = signal<ThemeKey>('primary');
  /**
   * Its value. Indexing `THEME` by a `ThemeKey` is checked at compile time, so a
   * typo here would not build.
   */
  protected readonly value = computed(() => THEME[this.key()]);

  /**
   * The `as const` role tuple, whose literal types drive the demo.
   */
  protected readonly roles = ROLES;
  /**
   * Which role is selected.
   */
  protected readonly roleIndex = signal(0);
  /**
   * The selected role — typed as the literal union, not `string`, because the
   * source array is `as const`.
   */
  protected readonly role = computed(() => this.roles[this.roleIndex()]);
}
