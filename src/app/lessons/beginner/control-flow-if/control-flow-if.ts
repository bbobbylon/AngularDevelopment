import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The demo's user, deliberately nullable so `@if (user(); as u)` has something
 * to narrow.
 */
interface User {
  name: string;
  role: 'admin' | 'member';
}

/**
 * Lesson: the built-in @if / @else if / @else control flow.
 *
 * Beyond the syntax: the `; as` alias and the truthiness trap it hides (a live
 * demo where `@if (count(); as c)` wrongly disappears at 0), what @if compiles
 * to and why a false branch destroys DOM + component state (a live "type, hide,
 * show" demo contrasting @if against [hidden]), the *ngIf → @if migration
 * including the then/else template-ref pattern that @if replaced, and the
 * pitfalls that show up in exams.
 */
@Component({
  selector: 'app-lesson-control-flow-if',
  imports: [RouterLink],
  styleUrl: './control-flow-if.css',
  templateUrl: './control-flow-if.html',
})
export class ControlFlowIf {
  /**
   * The signed-in user, or `null`. Starts `null` so the demo opens on the `@else`.
   */
  protected readonly user = signal<User | null>(null);

  /**
   * Signs a user in with the given role.
   *
   * @param role Which role to sign in as.
   */
  protected logIn(role: 'admin' | 'member') {
    this.user.set({ name: role === 'admin' ? 'Root' : 'Sam', role });
  }

  // --- truthiness-trap demo ---
  /**
   * Drives the `@if`/`@else if`/`@else` chain demo.
   */
  protected readonly count = signal(3);

  // --- destroy-vs-hidden demo ---
  /**
   * Drives the destroy-vs-hide demo.
   *
   * The point it makes: `@if` **removes** the element from the DOM, destroying the
   * component and its state, whereas `[hidden]` or `display: none` leaves it alive
   * and merely invisible. Toggling this and watching the boxes' internal counters
   * reset is the difference made concrete.
   */
  protected readonly showBoxes = signal(true);

  // --- code samples (class properties so braces/backticks need no template escaping) ---
  /**
   * Sample: the full `@if` / `@else if` / `@else` form with an `as` alias.
   */
  protected readonly basicSample = `<!-- The condition is any template expression. user() is a signal call, so
     @if re-evaluates automatically whenever that signal changes. -->
<!-- "; as u" aliases the RESULT of the condition. Inside this block u is
     the non-null user, so you never write user()!.name or call user()
     three times. Note the SEMICOLON — a comma is a syntax error here. -->
@if (user(); as u) {
  <p>Welcome, {{ u.name }}</p>
<!-- @else if / @else must sit on the same line as the closing brace. Put
     them on a new line and Angular reads them as separate blocks. -->
} @else if (loading()) {
  <p>Loading…</p>
} @else {
  <!-- Only reached when user() is falsy AND loading() is falsy. Branches
     are checked top-down and exactly one runs. -->
  <p>Please log in</p>
}
<!-- Unlike *ngIf, @if is built into the compiler: nothing to import, and
     the untaken branches are never created in the DOM at all. -->`;

  /**
   * Sample: `@if` with the `async` pipe, unwrapping the observable once into a
   * non-null binding — the pattern that replaces a nest of `*ngIf` aliases.
   */
  protected readonly asyncSample = `@if (user$ | async; as user) {
  <h2>{{ user.name }}</h2>   <!-- unwrapped once, non-null here -->
}`;

  /**
   * Sample: migrating `*ngIf` with `then`/`else` template refs to `@if`.
   */
  protected readonly migrationSample = `<!-- BEFORE — *ngIf with then/else template refs -->
<!-- The else branch has to live in a SEPARATE named ng-template, referenced
     by #loading. Two places to read, and they can drift apart. -->
<!-- Also note "as user" here uses a SPACE, while @if uses a semicolon —
     one of the small syntax differences that trips people mid-migration. -->
<div *ngIf="user$ | async as user; else loading">{{ user.name }}</div>
<ng-template #loading><spinner /></ng-template>

<!-- AFTER — inline @else, no template references -->
<!-- Same behaviour, one contiguous block you can read top to bottom. The
     ng-template and the #loading reference both disappear. -->
@if (user$ | async; as user) {
  <div>{{ user.name }}</div>
} @else {
  <spinner />
}
<!-- Bonus: no CommonModule import. *ngIf is a directive that must be
     imported; @if is compiler syntax, so it is always available. -->`;
}
