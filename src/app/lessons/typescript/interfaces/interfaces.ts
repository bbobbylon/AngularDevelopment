import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * One candidate value for the shape-checker demo.
 */
interface CandidateShape {
  label: string;
  value: string;
  verdict: 'ok' | 'error';
  explain: string;
}

const CANDIDATES: CandidateShape[] = [
  {
    label: 'exact match',
    value: `{ id: 1, name: 'Ada', createdAt: new Date() }`,
    verdict: 'ok',
    explain: 'Every required member present with the right type. email? may be absent — that is what the ? grants.',
  },
  {
    label: 'missing name',
    value: `{ id: 1, createdAt: new Date() }`,
    verdict: 'error',
    explain: `Property 'name' is missing in type … but required in type 'User'. Required members are non-negotiable; the error names exactly what's absent.`,
  },
  {
    label: 'wrong type for id',
    value: `{ id: '1', name: 'Ada', createdAt: new Date() }`,
    verdict: 'error',
    explain: `Types of property 'id' are incompatible: string is not assignable to number. Shape checks are per-member and recursive.`,
  },
  {
    label: 'extra property (variable)',
    value: `const x = { id: 1, name: 'Ada', createdAt: new Date(), nickname: 'A' }; const u: User = x;`,
    verdict: 'ok',
    explain: 'Structural typing: MORE than required is compatible when assigned via a variable. The nickname is simply invisible through the User lens.',
  },
  {
    label: 'extra property (literal)',
    value: `const u: User = { id: 1, name: 'Ada', createdAt: new Date(), nickname: 'A' };`,
    verdict: 'error',
    explain: `Object literal may only specify known properties. Fresh literals get the stricter "excess property check" — an unknown key in a literal is almost always a typo, so TS flags it at the assignment.`,
  },
];

/**
 * Lesson: Interfaces vs Type Aliases — two ways to name a shape, and when each
 * one is the right call.
 *
 * Covers `extends` against `&`, declaration merging (interfaces only), and the
 * things only a type alias can express: unions, tuples, mapped and conditional
 * types, and aliases of primitives.
 *
 * The demo switches between candidate shapes so the same value can be seen
 * satisfying — and failing — different declarations.
 *
 * Also dissects member syntax (optional, `readonly`, methods against function
 * properties), where `extends` and intersection disagree on conflicting
 * members, declaration merging as the module-augmentation tool, callable /
 * index / hybrid / generic signatures, and what `implements` actually checks.
 */
@Component({
  selector: 'app-lesson-ts-interfaces',
  imports: [RouterLink],
  templateUrl: './interfaces.html',
  styleUrl: './interfaces.css',
})
export class Interfaces {
  /**
   * The example shapes the demo can switch between.
   */
  protected readonly candidates = CANDIDATES;
  /**
   * Which shape the demo is currently showing.
   */
  protected readonly candidate = signal<CandidateShape>(CANDIDATES[0]);
}
