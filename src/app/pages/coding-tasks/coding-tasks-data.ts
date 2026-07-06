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
  {
    id: 9,
    title: 'Custom truncate pipe with word-boundary logic',
    difficulty: 'junior',
    category: 'Pipes',
    timeboxMinutes: 15,
    scenario:
      'Build a standalone truncate pipe: {{ text | truncate:25 }} shortens long text to at most the given number of characters and appends an ellipsis (…). The limit is optional and defaults to 50, strings already within the limit pass through untouched, and the cut must land on a word boundary — never mid-word.',
    requirements: [
      'The pipe is standalone, named truncate, and implements PipeTransform',
      'transform takes an optional limit parameter defaulting to 50',
      'Strings at or under the limit are returned unchanged (no stray ellipsis)',
      'Longer strings are cut at the last word boundary before the limit, then … is appended',
      'The pipe stays pure (no pure: false) — and you can say why that is correct here',
    ],
    starterCode: `import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(value: string): string {
    // TODO
    return value;
  }
}

// Usage to make work:
// {{ post.body | truncate:25 }}
// {{ post.body | truncate }}      <- default limit 50`,
    hints: [
      'An optional parameter with a default gives you both call forms: transform(value: string, limit = 50).',
      'slice(0, limit) first, then lastIndexOf(" ") on the slice to back up to the previous word boundary.',
      'Pure pipes re-run only when the input REFERENCE changes. Strings are immutable primitives, so a changed string is always a new reference — purity costs you nothing and skips re-running on every change-detection pass.',
    ],
    solutionCode: `import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 50): string {
    if (!value || value.length <= limit) return value;
    const cut = value.slice(0, limit);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
  }
}`,
    explanation:
      'The grading points: the early return for short strings (a pipe that appends … to everything fails the pass-through requirement), the word-boundary back-off (slice then lastIndexOf, with the lastSpace > 0 guard so a single long word still truncates instead of returning empty), and the default parameter making the limit optional. The purity question is the conceptual check: pipes are pure by default and only re-execute when the input reference changes — since strings are immutable, every new value IS a new reference, so pure is both correct and fast. Reaching for pure: false here is the classic overkill answer; it would re-run the pipe on every change-detection cycle for zero benefit.',
    topicPath: 'custom-pipes',
  },
  {
    id: 10,
    title: 'Hover-highlight attribute directive',
    difficulty: 'mid',
    category: 'Directives',
    timeboxMinutes: 25,
    scenario:
      'Build an [appHighlight] attribute directive: while the pointer hovers the host element its background becomes the configured color, and it clears on leave. The color is passed through the selector itself — appHighlight="tomato" — and an empty value falls back to gold. Use host metadata and signals, not @HostListener/@HostBinding decorators or manual addEventListener.',
    requirements: [
      'Standalone directive with selector [appHighlight]',
      'The color input is ALIASED to the selector, so appHighlight="tomato" configures it — no second attribute',
      'mouseenter/mouseleave are wired via the host metadata object, and hover state lives in a signal',
      'The background binds via host metadata too, falling back to gold when the input is empty, and clearing (null) when not hovered',
      'It works on any element: <p appHighlight>, <button appHighlight="teal">',
    ],
    starterCode: `import { Directive } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
})
export class Highlight {
  // TODO: aliased color input + hover state + host bindings
}

// Usage to make work:
// <p appHighlight>Hovers gold (default)</p>
// <button appHighlight="teal">Hovers teal</button>`,
    hints: [
      'input() takes an options object with an alias: input("", { alias: "appHighlight" }).',
      'The host object maps events and bindings declaratively: { "(mouseenter)": "…", "[style.backgroundColor]": "…" }.',
      'Binding null to a style REMOVES it — the ternary should produce null in the not-hovered branch, not an empty string.',
    ],
    solutionCode: `import { Directive, input, signal } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  host: {
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'hovered.set(false)',
    '[style.backgroundColor]': 'hovered() ? (color() || "gold") : null',
  },
})
export class Highlight {
  /** Aliased to the selector: appHighlight="tomato" sets this input. */
  readonly color = input('', { alias: 'appHighlight' });
  readonly hovered = signal(false);
}

/* Parent:
@Component({
  imports: [Highlight],
  template: \`
    <p appHighlight>Hovers gold (default)</p>
    <button appHighlight="teal">Hovers teal</button>
  \`,
})
export class Demo {}
*/`,
    explanation:
      'Three grader checkpoints. First, the alias trick: aliasing the input to the selector name is the idiomatic pattern for single-input directives (ngModel, routerLink all do it) — it is what lets appHighlight="teal" both attach the directive and configure it. Second, host metadata over decorators: the host object is the current style guide recommendation (@HostListener/@HostBinding still work but the metadata form is declarative, tree-shakes better, and keeps all host interaction visible in one place). Third, the null branch: style bindings remove the style when the expression is null/undefined, which is how the highlight cleanly disappears on mouseleave — an empty-string background is a subtle bug (it overrides inherited backgrounds with "nothing"). Renderer2/addEventListener answers work but miss the point of the declarative API.',
    topicPath: 'attribute-directives',
  },
  {
    id: 11,
    title: 'Multi-slot card with content projection',
    difficulty: 'mid',
    category: 'Components',
    timeboxMinutes: 25,
    scenario:
      'Build a reusable <app-card> shell with three projection slots: a title area, a default body, and a footer. Parents target the title and footer with attributes (card-title, card-footer); anything unmatched flows into the body. When a parent projects no title, the card shows "Untitled card" as fallback content.',
    requirements: [
      'app-card is standalone and renders three <ng-content> slots',
      'Title and footer slots select on ATTRIBUTES: select="[card-title]" and select="[card-footer]"',
      'Content matching neither selector lands in the default (unselected) slot',
      'The title slot renders fallback content ("Untitled card") when nothing is projected into it',
      'A demo parent projects into all three slots to prove the routing',
    ],
    starterCode: `import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  template: \`
    <div class="card">
      <!-- TODO: header slot / body slot / footer slot -->
    </div>
  \`,
})
export class Card {}

// Parent usage to make work:
// <app-card>
//   <h3 card-title>Quarterly report</h3>
//   <p>Body paragraph one…</p>
//   <p>Body paragraph two…</p>
//   <button card-footer>Read more</button>
// </app-card>`,
    hints: [
      'select takes a CSS selector — [card-title] matches any element carrying that attribute.',
      'The slot WITHOUT a select attribute is the catch-all: every unmatched top-level node projects there.',
      'Fallback content goes between the ng-content tags: <ng-content select="[card-title]">Untitled card</ng-content> — it renders only when nothing matches.',
    ],
    solutionCode: `import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  template: \`
    <div class="card">
      <header class="card-head">
        <ng-content select="[card-title]">Untitled card</ng-content>
      </header>
      <section class="card-body">
        <ng-content />
      </section>
      <footer class="card-foot">
        <ng-content select="[card-footer]" />
      </footer>
    </div>
  \`,
  styles: [\`
    .card { border: 1px solid #ddd; border-radius: 12px; overflow: hidden; }
    .card-head { padding: 12px 16px; background: #f8f8f8; font-weight: 600; }
    .card-body { padding: 16px; }
    .card-foot { padding: 10px 16px; border-top: 1px solid #eee; }
  \`],
})
export class Card {}

/* Parent:
@Component({
  imports: [Card],
  template: \`
    <app-card>
      <h3 card-title>Quarterly report</h3>
      <p>Body paragraph one…</p>
      <p>Body paragraph two…</p>
      <button card-footer>Read more</button>
    </app-card>
  \`,
})
export class Demo {}
*/`,
    explanation:
      'Projection routing is a first-match system: each top-level projected node is tested against the selected slots and falls through to the unselected catch-all — which is why BOTH body paragraphs land in the middle slot without any selector. Attribute selectors (select="[card-title]") are preferred over element selectors for slots because they compose with any element (h1 today, div tomorrow) instead of forcing a tag. The fallback content between the ng-content tags is the modern (v18+) answer to "did anyone project a title?" — the old workaround was wrapping the slot in a div and sniffing children in AfterContentInit, an order of magnitude more code. One trap a grader probes: projected content belongs to the PARENT (its bindings, its lifecycle) — ng-content is a rendering slot, not a component boundary, so wrapping a slot in @if does not lazily create the projected nodes.',
    topicPath: 'content-projection',
  },
  {
    id: 12,
    title: 'Typed configuration with an InjectionToken',
    difficulty: 'senior',
    category: 'Dependency Injection',
    timeboxMinutes: 30,
    scenario:
      'Give an app typed, injectable configuration: an InjectionToken<ApiConfig> carrying { baseUrl, version } with a tree-shakable root default, consumed via inject() in an ApiService that builds request URLs from it, and overridable per-environment (or per-test) with a single provider entry. No string tokens, no config imports inside the service.',
    requirements: [
      'API_CONFIG is an InjectionToken<ApiConfig> — the interface types every consumer and provider',
      'The token declares a providedIn: "root" factory default, so zero providers are needed for the happy path',
      'ApiService reads it with inject(API_CONFIG) — no constructor parameter decorators',
      'buildUrl(path) composes baseUrl + version + path purely from the injected config',
      'A test or bootstrap override swaps the config with { provide: API_CONFIG, useValue: … } and a wrong shape fails to compile',
    ],
    starterCode: `import { Injectable } from '@angular/core';

export interface ApiConfig {
  baseUrl: string;
  version: string;
}

// TODO: the token with a root-level default factory

@Injectable({ providedIn: 'root' })
export class ApiService {
  // TODO: inject the token and implement buildUrl
  buildUrl(path: string): string {
    return path;
  }
}

// Must support:
// apiService.buildUrl('users/7')  -> 'https://api.example.com/v1/users/7'
// TestBed override:
// { provide: API_CONFIG, useValue: { baseUrl: 'http://localhost:3000', version: 'v2' } }`,
    hints: [
      'new InjectionToken<ApiConfig>("API_CONFIG", { providedIn: "root", factory: () => ({ … }) }) — the factory IS the default value.',
      'Interfaces vanish at runtime, which is exactly why they cannot be DI tokens themselves — the token object is the runtime handle, the generic is the compile-time contract.',
      'In a spec: TestBed.configureTestingModule({ providers: [{ provide: API_CONFIG, useValue: fake }] }) — the explicit provider wins over the token default.',
    ],
    solutionCode: `import { Injectable, InjectionToken, inject } from '@angular/core';

export interface ApiConfig {
  baseUrl: string;
  version: string;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  providedIn: 'root',
  factory: () => ({ baseUrl: 'https://api.example.com', version: 'v1' }),
});

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly config = inject(API_CONFIG);

  buildUrl(path: string): string {
    return \`\${this.config.baseUrl}/\${this.config.version}/\${path}\`;
  }
}

/* Override — per environment bootstrap or per test:
providers: [
  { provide: API_CONFIG, useValue: { baseUrl: 'http://localhost:3000', version: 'v2' } },
]

TypeScript enforces the shape:
{ provide: API_CONFIG, useValue: { baseUrl: 123 } }   // compile error
*/`,
    explanation:
      'The senior insight is WHY the token exists: interfaces are erased at compile time, so "inject the ApiConfig interface" is impossible — the InjectionToken is the runtime stand-in, and its generic parameter is what makes every useValue and every inject() call type-checked. The factory default is the tree-shakable pattern: no NgModule/bootstrap provider entry needed, and apps that never inject it pay nothing. The override mechanics are plain DI precedence — an explicit provider at any level beats the token default, which is what makes per-test fakes one line. Graders probe two failure modes: hardcoding config inside the service (now untestable without patching globals) and using a string token ("api.config"), which typos silently at runtime instead of failing at compile time.',
    topicPath: 'di-providers',
  },
  {
    id: 13,
    title: 'Component spec: render, interact, assert',
    difficulty: 'mid',
    category: 'Testing',
    timeboxMinutes: 30,
    scenario:
      'You are handed a working signal-based Counter component (shown in the starter). Write its spec: verify the initial render, that clicking + increments the DISPLAYED value, and that clicking - at zero clamps rather than going negative. Assert against the DOM, not just component fields, and detect changes correctly around each interaction.',
    requirements: [
      'TestBed.configureTestingModule imports the standalone component; the fixture is created fresh in beforeEach',
      'The initial-render test asserts "Count: 0" from the rendered DOM (nativeElement / By.css)',
      'The increment test simulates a real click on the + button and calls fixture.detectChanges() BEFORE asserting',
      'A separate test proves decrement at 0 stays at 0 (the clamp)',
      'Buttons are located by their rendered text or a data-testid — not by brittle nth-child positions',
    ],
    starterCode: `// counter.ts (GIVEN — do not modify)
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: \`
    <p>Count: {{ count() }}</p>
    <button (click)="decrement()">-</button>
    <button (click)="increment()">+</button>
  \`,
})
export class Counter {
  readonly count = signal(0);
  increment(): void { this.count.update((c) => c + 1); }
  decrement(): void { this.count.update((c) => Math.max(0, c - 1)); }
}

// counter.spec.ts — TODO: write the spec
describe('Counter', () => {
  // …
});`,
    hints: [
      'Standalone components go in imports, not declarations: TestBed.configureTestingModule({ imports: [Counter] }).',
      'Find buttons robustly: fixture.debugElement.queryAll(By.css("button")).find(b => b.nativeElement.textContent.trim() === "+").',
      'The fixture does not auto-detect: click, THEN fixture.detectChanges(), THEN read the paragraph text.',
    ],
    solutionCode: `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Counter } from './counter';

describe('Counter', () => {
  let fixture: ComponentFixture<Counter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Counter] }).compileComponents();
    fixture = TestBed.createComponent(Counter);
    fixture.detectChanges(); // initial render
  });

  function text(): string {
    return fixture.nativeElement.querySelector('p').textContent.trim();
  }

  function button(label: string): HTMLButtonElement {
    return fixture.debugElement
      .queryAll(By.css('button'))
      .find((b) => b.nativeElement.textContent.trim() === label)!.nativeElement;
  }

  it('renders the initial count', () => {
    expect(text()).toBe('Count: 0');
  });

  it('increments the displayed count on +', () => {
    button('+').click();
    fixture.detectChanges();
    expect(text()).toBe('Count: 1');
  });

  it('clamps at zero on -', () => {
    button('-').click();
    fixture.detectChanges();
    expect(text()).toBe('Count: 0');
  });
});`,
    explanation:
      'What separates a passing spec from a good one here: asserting the DOM. A test that calls component.increment() and expects component.count() === 1 never proves the template binding works — the certification rubric explicitly wants the rendered output checked. The detectChanges choreography is the other core skill: the click handler updates the signal, but the fixture re-renders only when you ask (outside zoneless auto-detect setups), so click → detectChanges → assert is the rhythm. Locating buttons by text keeps the spec resilient to template reshuffles; nth-child selectors are the flaky-test smell graders dock. The clamp test earns its own it() because it encodes a REQUIREMENT, not an implementation detail — if someone later removes Math.max, exactly one clearly-named test goes red.',
    topicPath: 'testing-components',
  },
  {
    id: 14,
    title: 'Defer a heavy chart with @defer',
    difficulty: 'mid',
    category: 'Performance',
    timeboxMinutes: 20,
    scenario:
      'A dashboard renders a heavy <app-sales-chart> far below the fold. Keep its code out of the initial bundle and its rendering off the critical path: defer it until it scrolls into view, show a fixed-height skeleton before then, show a loading indicator (minimum 500ms, to avoid a flash) while the chunk downloads, handle load failure, and prefetch the chunk during browser idle time so the swap feels instant.',
    requirements: [
      'The chart renders inside @defer (on viewport) — not at page load',
      '@placeholder shows a fixed-height skeleton so the page does not jump when the chart swaps in',
      '@loading (minimum 500ms) shows while the deferred chunk loads',
      '@error renders a fallback if the chunk fails to load',
      'prefetch on idle fetches the chunk early WITHOUT rendering it — and the chart component is referenced nowhere else eagerly (otherwise it silently joins the main bundle)',
    ],
    starterCode: `import { Component } from '@angular/core';
import { SalesChart } from './sales-chart';

@Component({
  selector: 'app-dashboard',
  imports: [SalesChart],
  template: \`
    <h1>Dashboard</h1>
    <p>KPIs, tables, and 2000px of content above the fold…</p>

    <!-- TODO: defer this -->
    <app-sales-chart />
  \`,
})
export class Dashboard {}`,
    hints: [
      'The full shape: @defer (on viewport; prefetch on idle) { … } @placeholder { … } @loading (minimum 500ms) { … } @error { … }.',
      'on viewport needs something IN the viewport to observe — the @placeholder block serves as that anchor.',
      'Deferability is a compiler decision: the component must be standalone and referenced ONLY inside @defer blocks. One stray eager reference (even in the same file) and it is bundled eagerly with no warning.',
    ],
    solutionCode: `import { Component } from '@angular/core';
import { SalesChart } from './sales-chart';

@Component({
  selector: 'app-dashboard',
  imports: [SalesChart],
  template: \`
    <h1>Dashboard</h1>
    <p>KPIs, tables, and 2000px of content above the fold…</p>

    @defer (on viewport; prefetch on idle) {
      <app-sales-chart />
    } @placeholder {
      <div class="chart-skeleton" style="height: 320px">Chart loads when visible…</div>
    } @loading (minimum 500ms) {
      <div class="chart-skeleton" style="height: 320px">Loading chart…</div>
    } @error {
      <p role="alert">The chart failed to load. Refresh to retry.</p>
    }
  \`,
})
export class Dashboard {}`,
    explanation:
      'Two distinct wins are being tested and they are not the same thing: @defer splits the CODE (SalesChart lands in its own lazy chunk, shrinking the initial bundle) AND delays the RENDER (no chart work until the trigger fires). prefetch on idle decouples fetching from rendering — the chunk downloads during idle time, so when the user scrolls down the swap is instant, but the rendering cost is still deferred. The placeholder doubles as the IntersectionObserver anchor for on viewport and its fixed height prevents layout shift (a Core Web Vitals point graders watch). minimum 500ms on @loading prevents the 50ms spinner flash on fast connections. The silent killer requirement is the last one: the compiler only makes a component deferrable if every reference to it is inside @defer blocks — a single eager reference elsewhere quietly pulls it into the main bundle, which is why you verify with the build stats, not by trusting the template.',
    topicPath: 'deferrable-views',
  },
  {
    id: 15,
    title: 'Star rating as a ControlValueAccessor',
    difficulty: 'senior',
    category: 'Forms',
    timeboxMinutes: 40,
    scenario:
      'Take a star-rating widget and make it a first-class form control: usable with formControlName inside a reactive form, initialized by the form value, propagating clicks back to the form, marking itself touched on blur, and honoring form.disable(). Implement ControlValueAccessor and register it with NG_VALUE_ACCESSOR.',
    requirements: [
      'The component implements ControlValueAccessor: writeValue, registerOnChange, registerOnTouched, setDisabledState',
      'It provides itself via NG_VALUE_ACCESSOR with multi: true (and forwardRef or an arrow provider)',
      'Form → view: writeValue updates the rendered stars when the form sets a value',
      'View → form: clicking star N calls the registered onChange(N); leaving the widget calls onTouched (touched/dirty semantics work)',
      'form.disable() visibly disables the stars and blocks clicks — no (click) handlers firing while disabled',
    ],
    starterCode: `import { Component, signal } from '@angular/core';

// Make this work:
// <form [formGroup]="form">
//   <app-star-rating formControlName="rating" />
// </form>
// this.form = fb.group({ rating: [3] });
// this.form.controls.rating.disable();

@Component({
  selector: 'app-star-rating',
  template: \`
    @for (star of [1, 2, 3, 4, 5]; track star) {
      <button type="button" (click)="rate(star)">
        {{ star <= value() ? '★' : '☆' }}
      </button>
    }
  \`,
})
export class StarRating {
  readonly value = signal(0);
  rate(star: number): void {
    this.value.set(star);
  }
}`,
    hints: [
      'The provider: { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StarRating), multi: true } — multi because many CVAs can coexist in one injector.',
      'Store the callbacks: registerOnChange hands you the function the FORM wants called on every user change; default them to no-ops so the component also works outside a form.',
      'writeValue must NOT call onChange — it is the form talking to you, and echoing it back can loop. Track touched with a (focusout) on a wrapper so tabbing away marks the control touched.',
    ],
    solutionCode: `import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-star-rating',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StarRating), multi: true },
  ],
  template: \`
    <span (focusout)="markTouched()">
      @for (star of [1, 2, 3, 4, 5]; track star) {
        <button type="button"
          [disabled]="disabled()"
          [attr.aria-label]="'Rate ' + star + ' of 5'"
          (click)="rate(star)">
          {{ star <= value() ? '★' : '☆' }}
        </button>
      }
    </span>
  \`,
  styles: [\`button { border: none; background: none; cursor: pointer; font-size: 1.3rem; } button:disabled { cursor: default; opacity: .45; }\`],
})
export class StarRating implements ControlValueAccessor {
  readonly value = signal(0);
  readonly disabled = signal(false);

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  // --- form -> view ---
  writeValue(value: number | null): void {
    this.value.set(value ?? 0);
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // --- plumbing: the form hands us its callbacks ---
  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // --- view -> form ---
  rate(star: number): void {
    if (this.disabled()) return;
    this.value.set(star);
    this.onChange(star);
  }
  markTouched(): void {
    this.onTouched();
  }
}`,
    explanation:
      'CVA is a two-way protocol and the grading follows the directions of data flow. Form → view: writeValue (initial value, setValue/reset) and setDisabledState (form.disable()) — crucially writeValue must not re-emit through onChange, or setValue loops and dirties the control the form just cleaned. View → form: the component never talks to the FormControl directly; it calls the callbacks the form REGISTERED, which is what keeps the widget reusable in template-driven forms too. The no-op defaults matter — they let the component render outside any form without null checks. NG_VALUE_ACCESSOR is multi: true because the injector collects accessors and formControlName picks the match; forwardRef breaks the class-referencing-itself-in-its-own-decorator cycle. The senior follow-up a grader asks: why does [disabled] on the button beat a CSS-only disable? Because setDisabledState must actually prevent interaction (clicks on pointer-events:none elements still fire via keyboard), and real <button disabled> is the accessible answer.',
    topicPath: 'control-value-accessor',
  },
  {
    id: 16,
    title: 'OnPush todo list with immutable updates',
    difficulty: 'senior',
    category: 'Change Detection',
    timeboxMinutes: 35,
    scenario:
      'Build a parent/child todo pair where the child list renders with ChangeDetectionStrategy.OnPush and receives the todos through an input. Add and toggle must update the child correctly WITHOUT any markForCheck/detectChanges calls — meaning every mutation in the parent has to produce new references. Include (in a comment) the one-sentence reason a push()-based version renders stale under OnPush.',
    requirements: [
      'TodoList (child) sets changeDetection: ChangeDetectionStrategy.OnPush and takes todos via input()',
      'Toggling fires an output from the child; the PARENT owns all state changes',
      'add() replaces the array: [...todos, newTodo] — no push()',
      'toggle(id) maps to a new array AND a new object for the toggled todo ({ ...t, done: !t.done })',
      'No manual CD anywhere (no markForCheck, no detectChanges) — and a comment states why mutation breaks OnPush',
    ],
    starterCode: `import { Component } from '@angular/core';

export interface Todo { id: number; title: string; done: boolean; }

// Child: render the list, emit toggles. Must be OnPush.
@Component({
  selector: 'app-todo-list',
  template: \`
    <!-- TODO: @for over todos, click toggles -->
  \`,
})
export class TodoList {
  // TODO
}

// Parent: owns the array; add + toggle immutably.
@Component({
  selector: 'app-todos',
  template: \`
    <input #box placeholder="New todo" />
    <button (click)="add(box.value); box.value = ''">Add</button>
    <!-- TODO: <app-todo-list … /> -->
  \`,
})
export class Todos {
  // TODO
}`,
    hints: [
      'OnPush skips a component unless (among other triggers) an INPUT REFERENCE changed — Object.is comparison, so a pushed-into array is "the same" input.',
      'toggle needs two new references: the array (so the child re-renders) and the toggled item (so anything OnPush keyed on the item also updates).',
      'Signal inputs pair naturally with OnPush: input() in the child, and the parent state in a signal it updates with .update(list => …).',
    ],
    solutionCode: `import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

export interface Todo { id: number; title: string; done: boolean; }

@Component({
  selector: 'app-todo-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <ul>
      @for (todo of todos(); track todo.id) {
        <li>
          <label>
            <input type="checkbox" [checked]="todo.done" (change)="toggled.emit(todo.id)" />
            <span [style.textDecoration]="todo.done ? 'line-through' : null">{{ todo.title }}</span>
          </label>
        </li>
      } @empty {
        <li>Nothing to do 🎉</li>
      }
    </ul>
  \`,
})
export class TodoList {
  readonly todos = input.required<Todo[]>();
  readonly toggled = output<number>();
}

@Component({
  selector: 'app-todos',
  imports: [TodoList],
  template: \`
    <input #box placeholder="New todo" />
    <button (click)="add(box.value); box.value = ''">Add</button>
    <app-todo-list [todos]="todos()" (toggled)="toggle($event)" />
  \`,
})
export class Todos {
  // Why immutability: OnPush re-checks the child only when an input's REFERENCE
  // changes (Object.is) — todos.push(...) keeps the same array reference, so the
  // child is skipped and renders stale data.
  private nextId = 1;
  readonly todos = signal<Todo[]>([]);

  add(title: string): void {
    const trimmed = title.trim();
    if (!trimmed) return;
    this.todos.update((list) => [...list, { id: this.nextId++, title: trimmed, done: false }]);
  }

  toggle(id: number): void {
    this.todos.update((list) =>
      list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }
}`,
    explanation:
      'This is the OnPush contract in one artifact: an OnPush component is re-checked when an input reference changes, one of its own template events fires, or a signal it reads changes — and nothing else. todos.push() fails the first clause (same array reference, Object.is says "unchanged", child skipped), which is THE classic stale-view bug and exactly what the required comment must articulate. The fix is structural sharing: a new array for every list change, plus a new object for the changed item — untouched items keep their references, which also keeps @for (track todo.id) cheap since unchanged rows are not re-created. Child events still render correctly even under OnPush (the event-fired clause), which sometimes masks the bug in demos — graders check add() specifically because it has no child event to hide behind. The unidirectional shape (input down, output up, parent owns mutations) is the architecture point: the child stays a pure projection of its inputs, trivially testable and reusable.',
    topicPath: 'onpush',
  },
];
