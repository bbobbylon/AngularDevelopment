import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A literal union — the modern alternative to a string enum. No runtime object
 * is emitted, and the values are just strings, so they cross a JSON boundary
 * unchanged.
 */
type Direction = 'north' | 'east' | 'south' | 'west';

const READ = 1 << 0;
const WRITE = 1 << 1;
const DELETE = 1 << 2;

/**
 * Lesson: Enums & literal unions — what a regular enum actually compiles to
 * (the IIFE and the reverse map), string enums' quasi-nominal behavior,
 * const enum inlining and why isolatedModules dislikes it, bit flags with a
 * live permissions demo, and the modern as-const-object pattern that replaces
 * most enums outright.
 */
@Component({
  selector: 'app-lesson-ts-enums',
  imports: [RouterLink],
  templateUrl: './enums.html',
  styleUrl: './enums.css',
})
export class Enums {
  /**
   * The directions, for the picker.
   */
  protected readonly directions: Direction[] = ['north', 'east', 'south', 'west'];
  /**
   * The selected direction.
   */
  protected readonly dir = signal<Direction>('north');

  /**
   * Read permission — bit 0.
   */
  protected readonly READ = READ;
  /**
   * Write permission — bit 1.
   */
  protected readonly WRITE = WRITE;
  /**
   * Delete permission — bit 2.
   */
  protected readonly DELETE = DELETE;
  /**
   * The permission bitmask. A single number holding all three flags, which is what
   * bit flags buy: one value to store, pass and compare.
   */
  protected readonly perms = signal(READ);
  /**
   * The mask in binary, zero-padded to three digits, so the demo shows the bits
   * rather than the decimal number they add up to.
   */
  protected readonly permsBinary = computed(() => this.perms().toString(2).padStart(3, '0'));

  /**
   * Whether a flag is set, by bitwise AND.
   *
   * @param flag The bit to test.
   */
  protected hasFlag(flag: number): boolean {
    return (this.perms() & flag) !== 0;
  }

  /**
   * Flips a flag, by bitwise XOR. XOR rather than OR because this has to turn a
   * flag *off* as well as on.
   *
   * @param flag The bit to flip.
   */
  protected toggle(flag: number) {
    this.perms.update((p) => p ^ flag);
  }

  /**
   * The selected direction in degrees.
   *
   * The lookup is typed `Record<Direction, number>`, so adding a direction to the
   * union makes this a compile error until the new case is handled — the property
   * a literal union has that a bare `string` does not.
   */
  protected degrees(): number {
    const map: Record<Direction, number> = { north: 0, east: 90, south: 180, west: 270 };
    return map[this.dir()];
  }
}
