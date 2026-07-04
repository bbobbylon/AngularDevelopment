import type { Difficulty } from '../practice/practice-data';

/**
 * Task bank for the Coding-Task Simulator (/coding-tasks) — hands-on build
 * exercises in the style of the certificates.dev practical exam: a timeboxed
 * brief, a requirements checklist you verify yourself, starter code to copy
 * into your own scratch project, and a model solution to compare against.
 *
 * Unlike the Practice bank (recognition: pick the right option), these tasks
 * exercise RECALL AND SYNTHESIS: you write real code with no options to lean
 * on. There is deliberately no in-browser editor — the exam (and real work)
 * happens in a real editor with real tooling, so the page acts as the brief +
 * rubric, not the IDE.
 *
 * Same content escape rules as practice-data.ts: code fields are template
 * literals (escape backticks and \${), prose fields are single-quoted strings
 * (escape every apostrophe).
 */
export interface CodingTask {
  /** Sequential id — keys the completion/checklist state in localStorage. */
  id: number;
  title: string;
  difficulty: Difficulty;
  /** Free-form label shown as a badge (not tied to the practice Category union). */
  category: string;
  /** Suggested timebox in minutes — exam pacing, not a hard limit. */
  timeboxMinutes: number;
  /** The brief: what to build and why, as an examiner would phrase it. */
  scenario: string;
  /** Acceptance criteria — each becomes a self-check checkbox. */
  requirements: string[];
  /** Code the candidate starts from (copy into a scratch project). */
  starterCode: string;
  /** Progressive hints, mildest first. */
  hints: string[];
  /** A complete reference implementation. */
  solutionCode: string;
  /** What the solution demonstrates and the traps a grader looks for. */
  explanation: string;
  /** Lesson route for deeper study (must match a curriculum id). */
  topicPath?: string;
}

export const CODING_TASKS: CodingTask[] = [
  {
    id: 1,
    title: 'Signal counter with derived state',
    difficulty: 'junior',
    category: 'Signals',
    timeboxMinutes: 15,
    scenario:
      'Build a click counter component. It shows the current count, a doubled value, and a parity label ("even"/"odd"), with increment, decrement and reset buttons. Decrement must never take the count below zero. All state must be signal-based — no plain class fields for anything the template reads.',
    requirements: [
      'count is a signal(0); the template reads it with count()',
      'doubled and parity are computed() values — NOT recalculated methods or duplicated fields',
      'increment/decrement use update(); decrement clamps at 0',
      'Reset sets the count back to 0 via set()',
      'The buttons work without any manual change-detection calls',
    ],
    starterCode: `import { Component } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: \`
    <!-- show count, doubled, parity; wire the three buttons -->
    <button>-</button>
    <button>+</button>
    <button>Reset</button>
  \`,
})
export class Counter {
  // TODO: signal state + derived values
}`,
    hints: [
      'signal(), computed() and update() all come from @angular/core.',
      'Clamp inside the update callback: update(c => Math.max(0, c - 1)).',
      'parity can derive from count() with a ternary — computeds can read other computeds too.',
    ],
    solutionCode: `import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: \`
    <p>Count: {{ count() }} · doubled: {{ doubled() }} · {{ parity() }}</p>
    <button (click)="decrement()">-</button>
    <button (click)="increment()">+</button>
    <button (click)="reset()">Reset</button>
  \`,
})
export class Counter {
  readonly count = signal(0);
  readonly doubled = computed(() => this.count() * 2);
  readonly parity = computed(() => (this.count() % 2 === 0 ? 'even' : 'odd'));

  increment(): void {
    this.count.update((c) => c + 1);
  }

  decrement(): void {
    this.count.update((c) => Math.max(0, c - 1));
  }

  reset(): void {
    this.count.set(0);
  }
}`,
    explanation:
      'The grading points: derived values live in computed() (single source of truth — doubled and parity can never drift from count), mutations go through set/update, and the clamp lives in the update callback rather than an if-guard around the call site. A common miss is writing doubled as a method — it works, but recomputes on every change-detection pass and signals-vs-methods is exactly what the task tests. Everything renders reactively because the template reads signals; no zone tricks or markForCheck needed.',
    topicPath: 'signals',
  },
  {
    id: 2,
    title: 'Filtered list with modern control flow',
    difficulty: 'junior',
    category: 'Templates',
    timeboxMinutes: 20,
    scenario:
      'Render a product list with a text filter. Typing in the search box narrows the list case-insensitively by name; an empty state shows when nothing matches. Use signal-based state and the built-in @for/@if control flow — no *ngFor/*ngIf, no pipes.',
    requirements: [
      'The search term is a signal, updated from the input event',
      'The visible list is a computed() combining products + term (no filtering in the template expression)',
      'The list renders with @for and a track expression on product.id — not $index',
      '@empty (or an @if) renders "No products match" when the filter clears the list',
      'Matching is case-insensitive',
    ],
    starterCode: `import { Component } from '@angular/core';

interface Product { id: number; name: string; price: number; }

const PRODUCTS: Product[] = [
  { id: 1, name: 'Keyboard', price: 49 },
  { id: 2, name: 'Mouse', price: 29 },
  { id: 3, name: 'Monitor', price: 199 },
  { id: 4, name: 'Mousepad', price: 9 },
];

@Component({
  selector: 'app-product-list',
  template: \`
    <input placeholder="Filter products…" />
    <!-- TODO: render the filtered list -->
  \`,
})
export class ProductList {
  // TODO
}`,
    hints: [
      'Read the value in the event binding: (input)="term.set($any($event.target).value)" — or type the handler parameter properly.',
      '@for (p of filtered(); track p.id) { … } @empty { … }',
      'Lowercase both sides once, inside the computed.',
    ],
    solutionCode: `import { Component, computed, signal } from '@angular/core';

interface Product { id: number; name: string; price: number; }

const PRODUCTS: Product[] = [
  { id: 1, name: 'Keyboard', price: 49 },
  { id: 2, name: 'Mouse', price: 29 },
  { id: 3, name: 'Monitor', price: 199 },
  { id: 4, name: 'Mousepad', price: 9 },
];

@Component({
  selector: 'app-product-list',
  template: \`
    <input placeholder="Filter products…" (input)="onTerm($event)" />
    <ul>
      @for (p of filtered(); track p.id) {
        <li>{{ p.name }} — \\\${{ p.price }}</li>
      } @empty {
        <li>No products match.</li>
      }
    </ul>
  \`,
})
export class ProductList {
  readonly term = signal('');
  readonly filtered = computed(() => {
    const t = this.term().toLowerCase();
    return PRODUCTS.filter((p) => p.name.toLowerCase().includes(t));
  });

  onTerm(event: Event): void {
    this.term.set((event.target as HTMLInputElement).value);
  }
}`,
    explanation:
      'Graders look for three things. First, the filter lives in a computed — filtering inline in the template re-runs on every CD cycle and cannot be reused or tested. Second, track p.id: with track $index, deleting a filtered item makes Angular rebind every following row instead of removing one DOM node (and stateful rows would show the wrong data). Third, @empty is the idiomatic empty state for @for — a separate @if on filtered().length works but duplicates the condition. Typed event handling (event.target as HTMLInputElement) beats $any() in strict templates.',
    topicPath: 'control-flow-for',
  },
  {
    id: 3,
    title: 'Reactive form with a custom cross-field validator',
    difficulty: 'mid',
    category: 'Forms',
    timeboxMinutes: 30,
    scenario:
      'Build a registration form (email, password, confirmPassword) with reactive forms. Email and password have standard validators; a CUSTOM validator on the form group rejects the form when the two passwords differ. Error messages appear only after the user has touched a field, and the submit button disables while the form is invalid.',
    requirements: [
      'The form uses FormGroup/FormControl (or NonNullableFormBuilder) — no ngModel',
      'email has required + email validators; password has required + minLength(8)',
      'A custom validator on the GROUP returns { passwordMismatch: true } when the passwords differ',
      'The mismatch error only shows after confirmPassword is touched',
      'Submit is disabled while invalid; submitting logs the raw value and resets the form',
    ],
    starterCode: `import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  template: \`
    <form>
      <input placeholder="Email" />
      <input type="password" placeholder="Password" />
      <input type="password" placeholder="Confirm password" />
      <button type="submit">Register</button>
    </form>
  \`,
})
export class Register {
  // TODO: build the form + validator
}`,
    hints: [
      'A cross-field validator has the signature (control: AbstractControl) => ValidationErrors | null and reads child controls with control.get(…).',
      'Pass it in the group options: new FormGroup({...}, { validators: passwordsMatch }).',
      'Group-level errors live on form.errors, not on the confirm control — check form.hasError("passwordMismatch") together with the touched state.',
    ],
    solutionCode: `import { Component, inject } from '@angular/core';
import {
  AbstractControl, NonNullableFormBuilder, ReactiveFormsModule,
  ValidationErrors, Validators,
} from '@angular/forms';

/** Group validator: valid only when password === confirmPassword. */
function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pass = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="email" placeholder="Email" />
      @if (form.controls.email.touched && form.controls.email.invalid) {
        <p class="error">A valid email is required.</p>
      }

      <input type="password" formControlName="password" placeholder="Password" />
      @if (form.controls.password.touched && form.controls.password.hasError('minlength')) {
        <p class="error">At least 8 characters.</p>
      }

      <input type="password" formControlName="confirmPassword" placeholder="Confirm password" />
      @if (form.controls.confirmPassword.touched && form.hasError('passwordMismatch')) {
        <p class="error">Passwords do not match.</p>
      }

      <button type="submit" [disabled]="form.invalid">Register</button>
    </form>
  \`,
})
export class Register {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: [''],
    },
    { validators: passwordsMatch },
  );

  submit(): void {
    if (this.form.invalid) return;
    console.log(this.form.getRawValue());
    this.form.reset();
  }
}`,
    explanation:
      'The discriminating requirement is WHERE the validator lives: password matching needs two controls, so it must sit on the group — a validator on confirmPassword alone would not re-run when password changes afterwards (stale validity, the classic bug). Errors from group validators land on form.errors, hence form.hasError("passwordMismatch") in the template rather than checking the control. NonNullableFormBuilder keeps value types string instead of string | null, which matters the moment getRawValue() feeds an API call. The touched guards are UX table stakes: red errors before the user typed anything reads as broken.',
    topicPath: 'form-validation',
  },
  {
    id: 4,
    title: 'Debounced typeahead with switchMap',
    difficulty: 'mid',
    category: 'RxJS + HTTP',
    timeboxMinutes: 35,
    scenario:
      'Build a user search box against https://jsonplaceholder.typicode.com/users?name_like=TERM. Requests fire only after the user pauses typing (300ms), identical consecutive terms do not refetch, out-of-order responses can never overwrite newer ones, and results render via a signal. Show a loading indicator while a request is in flight.',
    requirements: [
      'The term flows through a stream with debounceTime(300) and distinctUntilChanged()',
      'switchMap (not mergeMap/concatMap) performs the HTTP call so stale requests are cancelled',
      'Results are exposed to the template as a signal (toSignal or manual signal set)',
      'A loading signal is true from keystroke-accepted to response-received',
      'No manual subscribe left dangling — the pipeline is torn down with the component',
    ],
    starterCode: `import { Component } from '@angular/core';

// GET https://jsonplaceholder.typicode.com/users?name_like=TERM
// returns User[] — { id: number; name: string; email: string; … }

@Component({
  selector: 'app-user-search',
  template: \`
    <input placeholder="Search users…" />
    <!-- TODO: loading indicator + results -->
  \`,
})
export class UserSearch {
  // TODO
}`,
    hints: [
      'Bridge signal → observable with toObservable(term), pipe the operators, then observable → signal with toSignal(stream, { initialValue: [] }).',
      'switchMap cancels the previous inner HTTP request via unsubscription — that is the out-of-order guarantee.',
      'Flip loading inside tap(() => loading.set(true)) before switchMap and back in the projection (or tap after).',
    ],
    solutionCode: `import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';

interface User { id: number; name: string; email: string; }

@Component({
  selector: 'app-user-search',
  template: \`
    <input placeholder="Search users…" (input)="onTerm($event)" />
    @if (loading()) { <p>Searching…</p> }
    <ul>
      @for (user of results(); track user.id) {
        <li>{{ user.name }} — {{ user.email }}</li>
      } @empty {
        @if (!loading()) { <li>No matches.</li> }
      }
    </ul>
  \`,
})
export class UserSearch {
  private readonly http = inject(HttpClient);

  readonly term = signal('');
  readonly loading = signal(false);

  readonly results = toSignal(
    toObservable(this.term).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loading.set(true)),
      switchMap((t) =>
        this.http.get<User[]>(
          'https://jsonplaceholder.typicode.com/users',
          { params: { name_like: t } },
        ).pipe(tap(() => this.loading.set(false))),
      ),
    ),
    { initialValue: [] as User[] },
  );

  onTerm(event: Event): void {
    this.term.set((event.target as HTMLInputElement).value);
  }
}`,
    explanation:
      'This is THE canonical RxJS interview task because every operator earns its place: debounceTime batches keystrokes, distinctUntilChanged suppresses the no-op refetch after backspacing to the same term, and switchMap encodes "only the latest matters" — a slow response for "an" arriving after the response for "ang" is impossible because the earlier inner observable was unsubscribed (HTTP abort) the moment the new term arrived. mergeMap would race, concatMap would queue behind slow responses; both fail the out-of-order requirement. toSignal manages the subscription lifecycle (unsubscribes on destroy), satisfying the no-dangling-subscribe rule without takeUntilDestroyed. Inner-pipe placement of the loading-off tap keeps it tied to the response that actually lands.',
    topicPath: 'rxjs-interop',
  },
  {
    id: 5,
    title: 'Parent-child contract with input(), output() and model()',
    difficulty: 'mid',
    category: 'Components',
    timeboxMinutes: 30,
    scenario:
      'Build a reusable <app-rating> star widget. The parent passes the maximum stars (input with default 5, must be required-free), reads/writes the current value through two-way binding, and receives a (hovered) event streaming the star index under the cursor. Use the signal-based APIs: input(), model(), output() — no decorators.',
    requirements: [
      'max = input(5) with a number type; value = model(0) supports [(value)] two-way binding',
      'hovered = output<number>() emits the star index on mouseenter',
      'Clicking star N sets value to N through the model signal (parent updates automatically)',
      'Stars render from a computed() array derived from max() — no template loops over magic numbers',
      'A parent usage example shows [(value)]="rating" working',
    ],
    starterCode: `import { Component } from '@angular/core';

@Component({
  selector: 'app-rating',
  template: \`
    <!-- render max() stars; filled up to value() -->
  \`,
})
export class Rating {
  // TODO: input / model / output
}

// Parent usage to make work:
// <app-rating [max]="5" [(value)]="rating" (hovered)="preview($event)" />`,
    hints: [
      'model() creates a WritableSignal that ALSO wires the valueChange output Angular needs for [(value)].',
      'Derive the stars: computed(() => Array.from({ length: this.max() }, (_, i) => i + 1)).',
      'Set from the child with this.value.set(n) — that is what propagates to the parent binding.',
    ],
    solutionCode: `import { Component, computed, input, model, output } from '@angular/core';

@Component({
  selector: 'app-rating',
  template: \`
    @for (star of stars(); track star) {
      <button
        type="button"
        [attr.aria-label]="'Rate ' + star + ' of ' + max()"
        [class.filled]="star <= value()"
        (click)="value.set(star)"
        (mouseenter)="hovered.emit(star)">
        {{ star <= value() ? '★' : '☆' }}
      </button>
    }
  \`,
  styles: [\`button { border: none; background: none; cursor: pointer; font-size: 1.4rem; } .filled { color: goldenrod; }\`],
})
export class Rating {
  readonly max = input(5);
  readonly value = model(0);
  readonly hovered = output<number>();

  readonly stars = computed(() =>
    Array.from({ length: this.max() }, (_, i) => i + 1),
  );
}

/* Parent:
@Component({
  imports: [Rating],
  template: '<app-rating [max]="5" [(value)]="rating" (hovered)="preview($event)" />',
})
export class Parent {
  readonly rating = signal(3);
  preview(star: number): void { console.log('previewing', star); }
}
*/`,
    explanation:
      'The task separates the three communication primitives by their contracts: input() is one-way parent→child (read-only signal in the child), output() is a fire-and-forget event, and model() is the two-way pair — under the hood it is an input PLUS a valueChange output, which is exactly what the [(value)] banana-in-a-box desugars to ([value] + (valueChange)). Writing this.value.set(star) in the child is what makes the parent\'s signal update; a plain input() would be read-only and force the emit-and-reassign dance. The computed stars array keeps the template loop honest when max changes at runtime. Bonus grader points: real <button> elements with aria-labels instead of clickable spans.',
    topicPath: 'outputs',
  },
  {
    id: 6,
    title: 'Guarded lazy admin route with a functional guard',
    difficulty: 'senior',
    category: 'Routing',
    timeboxMinutes: 35,
    scenario:
      'Add an /admin section to an app: lazily loaded (its code must not be in the initial bundle), protected by a functional CanActivate guard that checks AuthService.isAdmin(), and redirecting non-admins to /login while preserving the attempted URL so login can return them there.',
    requirements: [
      'The route uses loadComponent (or loadChildren) — no eager import of the admin component anywhere',
      'The guard is a CanActivateFn using inject() — not a class implementing CanActivate',
      'Non-admins are redirected via a UrlTree return value — NOT router.navigate() inside the guard',
      'The attempted URL rides along (query param or router state) and login navigates back to it',
      'The guard is attached with canActivate: [adminGuard] on the lazy route',
    ],
    starterCode: `// auth.service.ts (given)
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAdmin = signal(false);
  login(asAdmin: boolean): void { this.isAdmin.set(asAdmin); }
}

// app.routes.ts — TODO: add the guarded lazy /admin route
export const routes = [
  // …
];`,
    hints: [
      'A CanActivateFn receives (route, state) — state.url is the attempted URL.',
      'Return router.createUrlTree(["/login"], { queryParams: { returnUrl: state.url } }) for the redirect.',
      'Returning a UrlTree cancels the navigation and starts the redirect atomically; imperative navigate() inside a guard causes race conditions.',
    ],
    solutionCode: `// admin.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAdmin()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

// app.routes.ts
import { Routes } from '@angular/router';
import { adminGuard } from './admin.guard';

export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin').then((m) => m.Admin),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
];

// login.ts — returning to the attempted URL after login
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  template: \`<button (click)="loginAsAdmin()">Log in as admin</button>\`,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loginAsAdmin(): void {
    this.auth.login(true);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
    this.router.navigateByUrl(returnUrl);
  }
}`,
    explanation:
      'Two senior discriminators here. First, the UrlTree return: a guard that calls router.navigate() and returns false triggers TWO navigations that can race (the original cancellation and the imperative redirect); returning a UrlTree makes the redirect part of the SAME navigation transaction — atomic, cancel-safe, and testable as a pure return value. Second, lazy loading only works if nothing else imports the admin component eagerly — one stray import type-only excepted pulls it into the initial bundle silently (verify with the build stats). The returnUrl round-trip is the standard pattern; using state.url captures child paths and query params of the blocked attempt, not just "/admin".',
    topicPath: 'route-guards',
  },
  {
    id: 7,
    title: 'Signal store service with persistence',
    difficulty: 'senior',
    category: 'State',
    timeboxMinutes: 40,
    scenario:
      'Build a CartStore service: private writable state, public readonly signals, derived totals, intention-revealing mutation methods with immutable updates, and localStorage persistence that survives reloads and never breaks in SSR or private-browsing mode.',
    requirements: [
      'The items signal is private and writable; consumers see only asReadonly()/computed projections',
      'itemCount and totalPrice are computed() — derived, never stored',
      'add() merges quantity when the product is already in the cart; remove() and clear() exist',
      'Every mutation produces NEW array/object references (no in-place push/mutation)',
      'State loads from localStorage at construction and saves on every change via effect() — both wrapped so a missing/blocked localStorage cannot throw',
    ],
    starterCode: `import { Injectable } from '@angular/core';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  // TODO
}`,
    hints: [
      'Guard storage with typeof localStorage === "undefined" plus try/catch — SSR has no localStorage and Safari private mode throws on setItem.',
      'The merge in add(): map the existing item to { ...it, quantity: it.quantity + 1 } — a new object inside a new array.',
      'effect(() => save(this._items())) in the constructor runs in an injection context and re-runs on every change.',
    ],
    solutionCode: `import { Injectable, computed, effect, signal } from '@angular/core';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

const STORAGE_KEY = 'cart-v1';

function load(): CartItem[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: CartItem[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage full or blocked — the cart still works in memory
  }
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _items = signal<CartItem[]>(load());

  readonly items = this._items.asReadonly();
  readonly itemCount = computed(() =>
    this._items().reduce((sum, it) => sum + it.quantity, 0));
  readonly totalPrice = computed(() =>
    this._items().reduce((sum, it) => sum + it.price * it.quantity, 0));

  constructor() {
    effect(() => save(this._items()));
  }

  add(product: { id: number; name: string; price: number }): void {
    this._items.update((items) => {
      const existing = items.find((it) => it.productId === product.id);
      return existing
        ? items.map((it) =>
            it.productId === product.id
              ? { ...it, quantity: it.quantity + 1 }
              : it)
        : [...items, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }

  remove(productId: number): void {
    this._items.update((items) => items.filter((it) => it.productId !== productId));
  }

  clear(): void {
    this._items.set([]);
  }
}`,
    explanation:
      'This bundles the store discipline the exam cares about into one artifact. The readonly projection makes out-of-band writes a type error, so mutations are auditable in three named methods. Immutability is functional, not stylistic: signals compare with Object.is, so an in-place quantity++ followed by set(sameArray) would notify nobody — the map + spread creates the new references change propagation depends on. Persistence via effect() is the reactive way to say "whenever state changes, save it" (one place, impossible to forget on a new mutation method), and the try/catch + typeof guards are what make it production-grade: SSR executes this class with no localStorage at all. Deriving totals as computeds means they cannot desynchronize from items — the single-source-of-truth rule.',
    topicPath: 'state-management',
  },
  {
    id: 8,
    title: 'Auth interceptor with 401 recovery',
    difficulty: 'senior',
    category: 'HTTP',
    timeboxMinutes: 40,
    scenario:
      'Write a functional HTTP interceptor that attaches a Bearer token to every API request, skips public auth endpoints, and on a 401 response clears the session and redirects to /login — rethrowing every other error untouched. Register it with the standalone provider API.',
    requirements: [
      'It is an HttpInterceptorFn (functional) using inject() — not a class interceptor',
      'The request is CLONED to add the Authorization header (requests are immutable)',
      'Requests to /auth/ endpoints pass through without a token',
      'catchError handles ONLY status 401 (logout + redirect); other errors rethrow via throwError',
      'Registered with provideHttpClient(withInterceptors([authInterceptor])) in app.config.ts',
    ],
    starterCode: `// Given:
// AuthService { token(): string | null; logout(): void }

// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // TODO
  return next(req);
};

// app.config.ts — TODO: register it`,
    hints: [
      'req.clone({ setHeaders: { Authorization: "Bearer " + token } }) — setHeaders merges instead of replacing the header map.',
      'Check err instanceof HttpErrorResponse && err.status === 401 inside catchError.',
      'Rethrow with throwError(() => err) — the factory form — so downstream subscribers still see the original error.',
    ],
    solutionCode: `// auth.interceptor.ts
import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.token();
  const isAuthEndpoint = req.url.includes('/auth/');

  const outgoing = token && !isAuthEndpoint
    ? req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } })
    : req;

  return next(outgoing).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthEndpoint) {
        auth.logout();
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url },
        });
      }
      return throwError(() => err);
    }),
  );
};

// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};`,
    explanation:
      'Grading hinges on the immutability and error-transparency contracts. HttpRequest is immutable BY DESIGN so that a retried request is identical to the original — mutating req in place is both impossible (readonly) and conceptually wrong; clone({ setHeaders }) is the sanctioned path. The /auth/ skip prevents the classic login-loop: a stale token attached to the login call itself 401s, which logs you out of the login page. Rethrowing NON-401 errors is what keeps component-level error handling working — an interceptor that swallows errors turns every failed request into a silent hang downstream. The functional style (HttpInterceptorFn + inject) is the current API; withInterceptors places it in the ordered chain, and 401-vs-403 discrimination (unauthenticated vs unauthorized) is the follow-up a grader will probe.',
    topicPath: 'http-interceptors',
  },
];
