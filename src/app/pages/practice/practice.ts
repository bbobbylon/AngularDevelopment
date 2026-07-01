import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OptionsShuffler } from './practice-helpers';

type Difficulty = 'junior' | 'mid' | 'senior';
type Category = 'all' | 'components' | 'signals' | 'rxjs' | 'forms' | 'routing' | 'testing' | 'performance' | 'typescript';
type ChallengeType = 'multiple-choice' | 'spot-the-bug' | 'predict-output' | 'fill-blank';

interface Challenge {
  id: number;
  type: ChallengeType;
  difficulty: Difficulty;
  category: Exclude<Category, 'all'>;
  question: string;
  code?: string;
  options?: string[];
  answer: number | string;
  explanation: string;
  hint?: string;
  topicPath?: string;
}

const CHALLENGES: Challenge[] = [
  // --- COMPONENTS ---
  {
    id: 1, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'Which decorator turns a class into an Angular component?',
    options: [
      '@NgModule — groups related components and services into a module',
      '@Component — declares a reusable UI element with template and styles',
      '@Injectable — marks a class available for dependency injection',
      '@Directive — adds behavior to elements without creating a template',
    ],
    answer: 1,
    explanation: '@Component marks a class as an Angular component and configures its template, styles, and selector. It creates a self-contained, reusable UI building block. Why others fail: (A) @NgModule groups multiple components and services into a feature or shared module. (C) @Injectable enables any class (services, guards, resolvers) to be injected; not specific to components. (D) @Directive adds reusable behavior to existing elements without managing its own view.',
    topicPath: 'components',
  },
  {
    id: 2, type: 'spot-the-bug', difficulty: 'junior', category: 'components',
    question: 'This component has a bug. What is it?',
    code: `@Component({
  selector: 'app-greeting',
  template: '<h1>Hello {{ name }}</h1>',
})
export class GreetingComponent {
  name = 'World';
}`,
    options: [
      'The selector must start with a custom prefix like "my-" instead of "app-"',
      'The template correctly uses {{ name }} interpolation syntax (the question displays it escaped)',
      'The component must implement the OnInit lifecycle hook interface',
      'The standalone: true flag is missing from the @Component decorator',
    ],
    answer: 3,
    explanation: 'Modern Angular uses standalone-first architecture. In projects without NgModules, components must declare standalone: true in their @Component decorator, either explicitly or implicitly through schema assumptions. The template syntax {{ name }} is correct. Why others fail: (A) Selectors can use any prefix; "app-" is conventional. (B) Interpolation is correct syntax. (C) OnInit is only required if you need lifecycle hooks.',
  },
  {
    id: 3, type: 'predict-output', difficulty: 'mid', category: 'components',
    question: 'What does fixture.nativeElement.querySelector(".count").textContent contain after this test runs?',
    code: `@Component({
  standalone: true,
  template: '<span class="count">{{ count }}</span><button (click)="count++">+</button>',
})
class Counter { count = 0; }

// In the test:
fixture.nativeElement.querySelector('button').click();
fixture.nativeElement.querySelector('button').click();
fixture.detectChanges();`,
    options: ['0 — count was never incremented before the query', '1 — detectChanges runs once after the second click', '2 — each click increments by 1, detectChanges re-renders', 'undefined — the span contains no text initially'],
    answer: 2,
    explanation: 'Each click() increments count by 1. Two clicks make count = 2. fixture.detectChanges() triggers Angular\'s change detection and re-renders the template with the updated value, so the span text becomes "2". Why others fail: (A) Clicks happen before detectChanges. (B) detectChanges renders the final state. (D) The span displays the interpolated value once detectChanges runs.',
  },
  {
    id: 4, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'When does ngOnChanges fire relative to component initialization?',
    options: [
      'Only once during initial component creation, before ngOnInit runs',
      'Every time change detection runs, regardless of whether @Input values change',
      'Before ngOnInit on first render if inputs exist; then whenever an @Input reference changes',
      'Only when the component is destroyed or an @Input is removed from the template',
    ],
    answer: 2,
    explanation: 'ngOnChanges fires before ngOnInit on the first render (if the component has @Input properties), then fires again whenever any @Input reference changes. It receives a SimpleChanges object showing previous and current values. Note: it does NOT fire for signal inputs — those are reactive by default and do not use ngOnChanges. Why others fail: (A) Fires on first render but also on subsequent @Input changes. (B) Fires on @Input changes, not on every CD pass. (D) Fires throughout the component lifecycle, not just at end.',
  },

  // --- SIGNALS ---
  {
    id: 5, type: 'predict-output', difficulty: 'junior', category: 'signals',
    question: 'What does count() return after this code runs?',
    code: `const count = signal(0);
count.set(5);
count.update(n => n * 2);`,
    options: [
      'count() returns 0 (the initial value before any modifications)',
      'count() returns 5 (the value after set(), before update())',
      'count() returns 10 (set to 5, then multiplied by 2)',
      'count() returns 25 (5 squared due to update)',
    ],
    answer: 2,
    explanation: 'signal(0) creates a signal with initial value 0. set(5) replaces the value with 5. update(n => n * 2) reads the current value (5) and updates it to 5 * 2 = 10. So count() returns 10. Why others fail: (A) 0 is the initial state before modifications. (B) 5 was the intermediate value after set(), but before update() runs. (D) The callback multiplies by 2, not squares the value.',
    topicPath: 'signals',
  },
  {
    id: 6, type: 'spot-the-bug', difficulty: 'junior', category: 'signals',
    question: 'This computed signal has a bug. What is it?',
    code: `const price = signal(100);
const tax = signal(0.2);
const total = computed(() => {
  return price + tax;  // ???
});`,
    options: [
      'computed() cannot be assigned to const; must use let with a specific generic type',
      'price and tax are signals — must call as functions to read: price() + price() * tax()',
      'Cannot add a numeric signal with a decimal signal due to type incompatibility',
      'computed() must return an Observable<T>, not a plain numeric value',
    ],
    answer: 1,
    explanation: 'Signals are getter functions — to read their current value you must call them: price() and tax(). Writing price + tax tries to add the signal function objects together (resulting in NaN), not their values. The fix is: return price() + price() * tax() for the calculated total. Why others fail: (A) const is the correct declaration for computed. (C) Addition works on numbers regardless of integer or decimal type. (D) computed() returns a Signal<T>, not an Observable.',
  },
  {
    id: 7, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What is the key difference between computed() and effect()?',
    options: [
      'computed() is lazy and memoized, returning a Signal<T>; effect() runs immediately with side effects on each dependency change',
      'They are functionally identical; effect() is just the recommended async alternative to computed()',
      'computed() works in templates; effect() works only in services and components',
      'effect() returns a writable signal; computed() returns a read-only signal value',
    ],
    answer: 0,
    explanation: 'computed() derives a new signal value from other signals — it is lazy (only runs when read) and memoized (cached until dependencies change), returning Signal<T>. effect() runs arbitrary side-effect code (logging, DOM writes, API calls) whenever its reactive dependencies change. Use computed() for derived state; use effect() for imperative side effects. Why others fail: (B) They serve different purposes. (C) Both can be used in any context. (D) Both return their respective types.',
  },
  {
    id: 8, type: 'spot-the-bug', difficulty: 'senior', category: 'signals',
    question: 'This store has a serious encapsulation problem. What is it?',
    code: `@Injectable({ providedIn: 'root' })
export class CartStore {
  readonly items = signal<Item[]>([]);  // exposed writable signal!

  readonly total = computed(() =>
    this.items().reduce((s, i) => s + i.price, 0)
  );
}

// In a component:
cartStore.items.set([]);   // can mutate store directly`,
    options: [
      'signal() cannot be used in services; must use BehaviorSubject instead',
      'items should be private with a public readonly via .asReadonly() to prevent direct mutations',
      'computed() is not allowed to reference signals from the same store class',
      'Services with writable state must extend NgRx StoreModule or provide lifecycle hooks',
    ],
    answer: 1,
    explanation: 'Exposing a writable signal publicly breaks encapsulation — any component can mutate store state directly, bypassing validation or business logic. The fix: make it private readonly _items = signal([]) and expose readonly items = this._items.asReadonly(). All mutations should go through explicit methods like add(item) and remove(id). Why others fail: (A) Signals work perfectly in services. (C) computed() can reference signals from the same class. (D) Signals are a simpler alternative to NgRx.',
  },

  // --- RxJS ---
  {
    id: 9, type: 'multiple-choice', difficulty: 'junior', category: 'rxjs',
    question: 'What is the key difference between map() and switchMap()?',
    options: [
      'map() transforms values synchronously; switchMap() discards previous requests when a new one arrives',
      'map() is for filtering streams; switchMap() is for transforming values',
      'They are aliases for the same operator with different names',
      'switchMap() works only with Observables; map() works with any iterable',
    ],
    answer: 0,
    explanation: 'map() transforms each emitted value using a synchronous function (like Array.map for streams). switchMap() projects each value to a new inner Observable and automatically cancels/unsubscribes from the previous inner Observable, "switching" to the new one. This makes switchMap() essential for HTTP requests where you want to discard stale responses (e.g., typeahead search). Why others fail: (B) switchMap() is not for filtering; use filter() for that. (C) They are completely different operators with distinct use cases. (D) Both work with Observables; switchMap() is actually designed for Observable-returning functions.',
    topicPath: 'rxjs-operators',
  },
  {
    id: 10, type: 'spot-the-bug', difficulty: 'mid', category: 'rxjs',
    question: 'This component has a memory leak. Where is it?',
    code: `@Component({ standalone: true, template: '...' })
export class DataComponent implements OnInit {
  data = signal<User[]>([]);

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.users$.subscribe(users => {
      this.data.set(users);
    });
  }
}`,
    options: [
      'signal() cannot be modified inside a subscribe callback; must use signals() instead',
      'The subscription is never unsubscribed; component destruction leaves the subscription active',
      'users$ must be transformed with the async pipe before subscribing in TypeScript',
      'ngOnInit cannot contain manual subscriptions; async operations must use async/await',
    ],
    answer: 1,
    explanation: 'When the component is destroyed, the subscription to users$ keeps running, creating a memory leak and potential errors when updating a destroyed component. Fix options: (1) Use takeUntilDestroyed(inject(DestroyRef)) in the pipe. (2) Use toSignal(this.userService.users$) which auto-unsubscribes. (3) Use the async pipe in the template instead of manual subscribe. Why others fail: (A) Signals can be set in subscribe callbacks. (C) The async pipe is an alternative, not a requirement. (D) Manual subscriptions are fine if properly cleaned up.',
  },
  {
    id: 11, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'Which flattening operator should you use for an HTTP search that cancels stale requests?',
    options: [
      'mergeMap — runs all requests concurrently and emits all results',
      'concatMap — queues requests sequentially for guaranteed order',
      'switchMap — cancels previous request and switches to the new one',
      'exhaustMap — ignores new requests while one is in flight',
    ],
    answer: 2,
    explanation: 'switchMap cancels the previous inner Observable when a new value arrives — perfect for typeahead search where you want to discard stale HTTP requests. If the user types again, the old request is cancelled and the new one runs. Why others fail: (A) mergeMap runs all concurrently, so stale responses can arrive late and overwrite newer data. (B) concatMap queues them sequentially, which is too slow for search. (D) exhaustMap ignores new requests while one is pending, which prevents rapid searches from working correctly.',
  },
  {
    id: 12, type: 'predict-output', difficulty: 'mid', category: 'rxjs',
    question: 'What values does this Observable emit to console.log?',
    code: `of(1, 2, 3).pipe(
  filter(n => n % 2 !== 0),
  map(n => n * 10)
).subscribe(console.log);`,
    options: ['1, 2, 3 — all values are emitted unchanged', '10, 20, 30 — all values are multiplied by 10', '10, 30 — odd numbers filtered then multiplied', '1, 3 — filter keeps odds but map is not applied'],
    answer: 2,
    explanation: 'filter(n => n % 2 !== 0) keeps only odd numbers: 1 and 3. map(n => n * 10) multiplies each by 10: 10 and 30. So console.log is called twice with 10, then 30. Why others fail: (A) Filter removes the even number (2). (B) Filter removes 2 before map runs. (D) Map is definitely applied to filtered values.',
  },

  // --- FORMS ---
  {
    id: 13, type: 'multiple-choice', difficulty: 'junior', category: 'forms',
    question: 'What is the fundamental difference between Template-driven and Reactive forms?',
    options: [
      'Template-driven is faster; Reactive is more powerful and flexible',
      'Template-driven uses ngModel and derives state from template; Reactive uses FormControl/FormGroup in component',
      'They are equivalent; different teams just prefer different syntax',
      'Reactive forms support signals; Template-driven only works with zones',
    ],
    answer: 1,
    explanation: 'Template-driven forms (FormsModule, ngModel) let the template drive the form model — easier for simple forms but harder to test and validate. Reactive forms (ReactiveFormsModule, FormControl/FormGroup/FormBuilder) define the structure in the component class — explicit, testable, and required for complex forms with dynamic controls. Why others fail: (A) Speed is similar; power/flexibility is the real difference. (C) They are architecturally different approaches. (D) Both can work with signals or zones.',
  },
  {
    id: 14, type: 'spot-the-bug', difficulty: 'mid', category: 'forms',
    question: 'Why does this reactive form validation fail when the user enters valid data?',
    code: `form = new FormGroup({
  email: new FormControl('', [Validators.required, Validators.email]),
});

// template:
// <input [formControl]="form.get('email')" />`,
    options: [
      'FormGroup requires FormBuilder; direct constructor is deprecated',
      'form.get("email") returns AbstractControl | null; must cast or use type-safe accessor',
      'Validators.email is not included in @angular/forms; must import separately',
      'The form needs ngSubmit before change detection recognizes validation state',
    ],
    answer: 1,
    explanation: 'form.get("email") returns AbstractControl | null (could be undefined), but [formControl] expects FormControl<T>. This type mismatch causes binding issues. Fix: create a typed control variable: emailCtrl = this.form.get("email") as FormControl; then use [formControl]="emailCtrl". Better yet, use FormBuilder which is type-safe. Why others fail: (A) FormBuilder is recommended but direct constructor works. (C) Validators.email is built-in. (D) Validation runs regardless of ngSubmit.',
  },

  // --- ROUTING ---
  {
    id: 15, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'What should a route guard\'s CanActivateFn return to allow navigation?',
    options: [
      'null to indicate no decision has been made',
      'true to allow, false to block, or UrlTree to redirect',
      'void to indicate the guard is complete',
      'An Observable that emits true or false',
    ],
    answer: 1,
    explanation: 'CanActivateFn returns: true (or Promise/Observable of true) to allow navigation, false to block it, or a UrlTree (created via Router.createUrlTree()) to redirect. Returning false just blocks the current route; returning a UrlTree redirects to another route — this is the correct way to send unauthenticated users to /login. Why others fail: (A) null/undefined is falsy and blocks. (C) void is not a valid guard return. (D) It can return an Observable, but not required.',
  },
  {
    id: 16, type: 'spot-the-bug', difficulty: 'mid', category: 'routing',
    question: 'This guard allows unauthenticated users through. What is the bug?',
    code: `export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) {
    return true;
  }
  inject(Router).navigate(['/login']);
  // missing return!
};`,
    options: [
      'inject() cannot be called inside a function guard; must be in constructor',
      'When isLoggedIn() is false, the function returns undefined, which Angular allows as truthy',
      'Router.navigate() is async; must await or use createUrlTree() instead',
      'CanActivateFn must return an Observable, not a synchronous boolean',
    ],
    answer: 1,
    explanation: 'When isLoggedIn() is false, navigate() is called but the function falls off the end and returns undefined. Angular treats undefined as allowing navigation (falsy but not explicitly false). The fix: return inject(Router).createUrlTree(["/login"]) which both redirects AND explicitly blocks. Never call navigate() in a guard — return a UrlTree. Why others fail: (A) inject() works fine in function guards. (C) createUrlTree() is synchronous. (D) It can return Observable but sync boolean is fine.',
  },

  // --- TESTING ---
  {
    id: 17, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'Why is httpMock.verify() important in afterEach with HttpTestingController?',
    options: [
      'It closes the HTTP connection and prevents port exhaustion',
      'It asserts all expected requests were flushed; fails if requests were made but not handled',
      'It resets component and service state between tests',
      'It is optional for GET requests but required for POST/PUT',
    ],
    answer: 1,
    explanation: 'httpMock.verify() asserts that every HTTP request made during the test was explicitly handled (flushed or errored). If a request was made but never handled, verify() throws, catching silent test failures. Without verify(), unhandled requests pass silently, hiding bugs. Place it in afterEach() to run after every test. Why others fail: (A) It does not close connections; that is handled by unsubscribe. (C) It does not reset state. (D) It is required for all request types, not just POST/PUT.',
  },
  {
    id: 18, type: 'spot-the-bug', difficulty: 'mid', category: 'testing',
    question: 'Does this test correctly verify that users data loads?',
    code: `it('loads users', () => {
  let users: User[] | undefined;
  service.getUsers().subscribe(u => users = u);

  http.expectOne('/api/users').flush([{ id: 1, name: 'Ada' }]);

  expect(users![0].name).toBe('Ada');
});`,
    options: [
      'No — HttpTestingController.flush() is asynchronous and users remains undefined',
      'Yes — flush() is synchronous and immediately delivers the response',
      'No — expectOne() should use match() for multiple requests',
      'No — subscribe() requires fakeAsync() or async wrapper',
    ],
    answer: 1,
    explanation: 'This test is correct! HttpTestingController.flush() is synchronous — it immediately delivers the mocked response and resolves the Observable. The subscribe callback runs synchronously, setting users, and then expect() correctly sees the value. The test passes for the right reasons. Why others fail: (A) flush() is explicitly synchronous. (C) expectOne() is correct for single request. (D) fakeAsync is not required for HttpTestingController tests.',
  },

  // --- PERFORMANCE ---
  {
    id: 19, type: 'spot-the-bug', difficulty: 'mid', category: 'performance',
    question: 'This template causes poor performance. What is the issue?',
    code: `@Component({
  template: \`
    <ul>
      @for (item of getFilteredItems(); track item.id) {
        <li>{{ item.name }}</li>
      }
    </ul>
  \`
})
class ProductList {
  items = signal<Product[]>([...]);
  getFilteredItems() {
    return this.items().filter(i => i.active);
  }
}`,
    options: [
      'track item.id is incorrect; should use track $index for numeric indexing',
      'getFilteredItems() method is called on every CD pass, filtering repeatedly even when items unchanged',
      '@for cannot call methods; must use a template variable or pipe',
      'signal() cannot be used in components with methods; violates reactive rules',
    ],
    answer: 1,
    explanation: 'getFilteredItems() is a method call in the template. Angular invokes it on every change-detection pass — potentially dozens of times per second. Each call filters the entire array. Fix: replace with a computed signal: readonly filteredItems = computed(() => this.items().filter(i => i.active)). computed() is memoized — only re-runs when items changes. Why others fail: (A) track item.id is correct for identity tracking. (C) @for can call methods. (D) Signals and methods coexist fine.',
  },
  {
    id: 20, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'Which is the correct way to mark an LCP image with fetchpriority in Angular?',
    options: [
      '<img src="/hero.jpg" fetchpriority="high"> — raw HTML attribute',
      '<img ngSrc="/hero.jpg" width="1200" height="600" priority> — NgOptimizedImage with priority',
      '<img [src]="heroUrl" [fetchpriority]="\'high\'"> — property binding for priority',
      'Angular does not natively support fetchpriority; use plain HTML',
    ],
    answer: 1,
    explanation: 'NgOptimizedImage (ngSrc) with the priority attribute tells Angular to add both fetchpriority="high" and a <link rel="preload"> in the document head — both critical for LCP. This is the optimized, recommended approach. Why others fail: (A) Raw fetchpriority works but misses the preload hint and Angular\'s optimization. (C) [fetchpriority] property binding does not work because it is not a DOM property. (D) Angular has full support via NgOptimizedImage.',
  },

  // --- TYPESCRIPT ---
  {
    id: 21, type: 'predict-output', difficulty: 'junior', category: 'typescript',
    question: 'What is the inferred TypeScript type of result?',
    code: `function identity<T>(value: T): T {
  return value;
}
const result = identity(42);`,
    options: ['any — no type information is available', 'number — inferred from the argument type', 'T — the generic type variable', 'unknown — TypeScript cannot determine the type'],
    answer: 1,
    explanation: 'TypeScript infers the generic type parameter T from the argument. identity(42) passes the number literal 42, so T is inferred as number. result has type number (not T, which is a placeholder resolved at compile time). Why others fail: (A) T is inferred, not any. (C) T is a type parameter resolved at call time; result is number. (D) T is known through inference.',
  },
  {
    id: 22, type: 'multiple-choice', difficulty: 'mid', category: 'typescript',
    question: 'What are the key differences between interface and type?',
    options: [
      'They are identical; use whichever feels natural to you',
      'interface supports declaration merging and extends; type supports unions and conditional types',
      'type is for primitives; interface is only for object shapes',
      'interface is deprecated; type is the modern standard',
    ],
    answer: 1,
    explanation: 'Both describe object shapes, but differ: interface supports declaration merging (redefine same name to extend it — useful for augmenting third-party types) and uses extends for inheritance. type supports unions (A | B), intersections (A & B), mapped types, and conditional types. In Angular: use interface for data models, type for unions/utility types. Why others fail: (A) They have distinct capabilities. (C) Both work with primitives and objects. (D) Both are current; interface is not deprecated.',
  },
  {
    id: 23, type: 'spot-the-bug', difficulty: 'mid', category: 'typescript',
    question: 'Why does TypeScript show an error on the last line?',
    code: `function getUser(id: number): User | undefined {
  return users.find(u => u.id === id);
}

const user = getUser(1);
console.log(user.name);  // TS error!`,
    options: [
      'getUser() should return a Promise, not a union type',
      'user could be undefined; TypeScript strict null checks prevent unsafe access',
      'console.log does not accept objects; must convert to string',
      'Arrow functions in arrays require explicit return type annotations',
    ],
    answer: 1,
    explanation: 'getUser returns User | undefined. TypeScript\'s strict null checks prevent accessing .name on a potentially undefined value — this is a safety feature. Fix options: (1) if (user) console.log(user.name), (2) user?.name (optional chaining), or (3) user!.name (non-null assertion — only if certain it exists). Why others fail: (A) Union type is correct. (C) console.log accepts any type. (D) Arrow function return types do not require annotations.',
  },
  {
    id: 24, type: 'multiple-choice', difficulty: 'senior', category: 'typescript',
    question: 'What does this mapped type produce?',
    code: `type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

type User = { id: number; name: string };
type ReadonlyUser = Readonly<User>;`,
    options: [
      '{ id: number; name: string } — no changes applied',
      '{ readonly id: number; readonly name: string } — all properties readonly',
      '{ id: Readonly<number>; name: Readonly<string> } — wrapped in Readonly',
      'A type error — readonly cannot apply to primitive properties',
    ],
    answer: 1,
    explanation: 'Mapped types iterate keys with [K in keyof T]. This type adds readonly to every property. ReadonlyUser becomes { readonly id: number; readonly name: string }. Attempting user.id = 5 is a compile error. This is the actual TypeScript Readonly utility type. Why others fail: (A) readonly is applied. (C) readonly modifies properties, not wraps them. (D) readonly works on any property type.',
  },
  {
    id: 25, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'With ChangeDetectionStrategy.OnPush, which will NOT trigger re-check?',
    options: [
      'An @Input() reference is reassigned to a new object',
      'An event fires inside the component or its children',
      'A signal the template accesses changes value',
      'An array property is mutated with push (same reference)',
    ],
    answer: 3,
    explanation: 'OnPush components only re-check when: @Input references change, events fire, signals change, or async pipe emits. Mutating an array/object in place (push, splice, obj.prop = x) does NOT change the reference — Angular sees the same object and skips re-check. Always update immutably: this.items = [...this.items, newItem]. Why others fail: (A) Reference change triggers re-check. (B) Events trigger re-check. (C) Signal changes trigger re-check.',
  },

  // --- MORE COMPONENTS ---
  {
    id: 26, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'Which @defer trigger loads deferred content when the browser is idle?',
    options: [
      'on immediate — loads as soon as the block is encountered',
      'on idle — loads when requestIdleCallback fires (browser is quiet)',
      'on viewport — loads when the placeholder scrolls into view',
      'on interaction — loads on first click or focus in placeholder',
    ],
    answer: 1,
    explanation: '"on idle" triggers when the browser fires requestIdleCallback — waits for a quiet moment. "on immediate" loads instantly (no deferral). "on viewport" loads when placeholder scrolls into view. "on interaction" loads on first user interaction. Use "on idle" for helpful content not critical to first paint. Why others fail: (A) immediate has no deferral. (C) viewport is for visibility-based loading. (D) interaction requires user action.',
  },
  {
    id: 27, type: 'spot-the-bug', difficulty: 'senior', category: 'components',
    question: 'This output declaration has a type mismatch. What is wrong?',
    code: `@Component({ standalone: true, template: '<button (click)="save()">Save</button>' })
export class EditorComponent {
  readonly saved = output<number>();

  save() {
    this.saved.emit('done');
  }
}`,
    options: [
      'output() should use @Output() decorator instead',
      'emit() is called with string "done" but output is typed as output<number>()',
      'output() cannot be used inside methods; call it in the class body only',
      'The component must implement AfterViewInit to use output()',
    ],
    answer: 1,
    explanation: 'output<number>() declares the event emits a number. Calling emit("done") passes a string — a compile-time type error. TypeScript will catch this. Fix: emit the correct type, e.g., this.saved.emit(42). The output() API (Angular 17+) is fully typed, unlike EventEmitter which accepts any. Why others fail: (A) output() is the modern API. (C) output() is called in class body; emit() is in methods. (D) No lifecycle requirement.',
  },
  {
    id: 28, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'What is the architectural relationship between @Component and @Directive?',
    options: [
      '@Component and @Directive are completely separate decorators',
      '@Component is @Directive + template — component renders DOM; directive augments existing elements',
      '@Directive is a simplified version of @Component for small features',
      'They are aliases; the framework automatically chooses based on usage',
    ],
    answer: 1,
    explanation: '@Component extends @Directive under the hood. Every component is a directive that additionally has a template and encapsulated view. @Directive augments an existing element (adds classes, listens to events, DOM manipulation) without creating new DOM. @Component creates and renders a self-contained view. Use @Directive for reusable behaviors; @Component for UI building blocks. Why others fail: (A) They have an inheritance relationship. (C) @Directive is not simplified; directives are powerful. (D) They are not aliases.',
  },

  // --- MORE SIGNALS ---
  {
    id: 29, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What does toSignal(obs$, { initialValue: [] }) guarantee that plain toSignal(obs$) does not?',
    options: [
      'The Observable is eagerly subscribed before component renders',
      'Return type is Signal<T[]> not Signal<T[] | undefined>; has initial value synchronously',
      'The signal auto-unsubscribes after the first emission',
      'The Observable is shared via multicasting to all subscribers',
    ],
    answer: 1,
    explanation: 'toSignal() without initialValue returns Signal<T | undefined> because the Observable may not have emitted yet. Reading the signal before first emission returns undefined. With { initialValue: [] }, the return type is Signal<T[]> (no undefined) and the signal immediately holds the initial value. Use initialValue when your template cannot handle undefined. Why others fail: (A) Both subscribe eagerly. (C) Neither auto-unsubscribes after one emission. (D) Neither handles multicasting by default.',
  },
  {
    id: 30, type: 'spot-the-bug', difficulty: 'senior', category: 'signals',
    question: 'This effect() will throw a runtime error. What causes it?',
    code: `@Component({ standalone: true, template: '{{ count() }}' })
export class Counter {
  count = signal(0);

  constructor() {
    effect(() => {
      console.log('count is', this.count());
      this.count.set(this.count() + 1);
    });
  }
}`,
    options: [
      'effect() cannot be created in a constructor',
      'Reading count() then setting it in same effect causes infinite reactive cycle — Angular detects and throws',
      'computed() must be used instead for numeric state derivation',
      'effect() cannot call signal.set(); only read-only operations allowed',
    ],
    answer: 1,
    explanation: 'The effect reads count() (registering a dependency) then calls count.set(), which triggers the effect again → infinite loop. Angular detects this and throws. Fix: if you need derived state use computed(). If you must write in an effect, wrap the read in untracked(() => this.count()) so it is not a dependency. Never write to a signal that the same effect reads. Why others fail: (A) effect() works in constructors. (C) computed() is read-only. (D) set() is allowed.',
  },
  {
    id: 31, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'What capability does linkedSignal() offer that computed() lacks?',
    options: [
      'linkedSignal() creates a permanent link between two signals',
      'linkedSignal() is writable — defaults to derived value but can be overridden with .set()',
      'linkedSignal() is the signal equivalent of RxJS shareReplay(1)',
      'linkedSignal() converts a signal to an Observable automatically',
    ],
    answer: 1,
    explanation: 'computed() is always read-only. linkedSignal() is BOTH reactive AND writable: when source changes, it resets to the derived value; but you can also call .set() to override it independently. Example: selectedItem defaults to items()[0] but the user can pick a different item. computed() cannot model this (no write path). Why others fail: (A) It is not permanent; resets on source change. (C) It is not about multicasting. (D) linkedSignal() stays as a signal.',
  },

  // --- MORE RxJS ---
  {
    id: 32, type: 'predict-output', difficulty: 'mid', category: 'rxjs',
    question: 'If 3 components subscribe to this service property, how many HTTP requests run?',
    code: `@Injectable({ providedIn: 'root' })
export class UserService {
  readonly users$ = this.http.get<User[]>('/api/users');
  constructor(private http: HttpClient) {}
}`,
    options: ['1 request — shared across all subscriptions', '3 requests — one per subscription', '0 requests — cold observables never execute', 'Depends on Zone.js timer configuration'],
    answer: 1,
    explanation: 'http.get() returns a cold Observable — each subscription starts a new HTTP request from scratch. Three subscriptions = three separate requests. Fix: add shareReplay(1): users$ = this.http.get(...).pipe(shareReplay(1)). This executes once, multicasts the response to all subscribers, and replays it to future subscribers. Why others fail: (A) Without shareReplay it is cold. (C) Cold observables DO execute when subscribed. (D) Zone.js does not affect this.',
  },
  {
    id: 33, type: 'multiple-choice', difficulty: 'senior', category: 'rxjs',
    question: 'What is the fundamental difference between combineLatest() and zip()?',
    options: [
      'They are interchangeable; different naming for the same operator',
      'combineLatest emits on any source change; zip emits on paired values at same index',
      'zip() is for arrays only; combineLatest() is for Observables',
      'combineLatest is deprecated; zip is the modern replacement',
    ],
    answer: 1,
    explanation: 'combineLatest([a$, b$]) emits whenever ANY source emits, using the latest value from each. If a$ emits 10 times and b$ emits once, you get 10 emissions. zip([a$, b$]) waits for BOTH sources to emit their Nth value before emitting the Nth pair — steps through in lockstep. Use combineLatest for reactive state; use zip for one-to-one event pairing. Why others fail: (A) They have different emission strategies. (C) Both work with Observables. (D) Both are current.',
  },
  {
    id: 34, type: 'spot-the-bug', difficulty: 'senior', category: 'rxjs',
    question: 'This polling component has a memory leak. What is the cause?',
    code: `@Component({ standalone: true, template: '{{ status }}' })
export class PollingComponent implements OnInit {
  status = 'idle';
  constructor(private api: ApiService) {}

  ngOnInit() {
    interval(5000).pipe(
      switchMap(() => this.api.getStatus())
    ).subscribe(s => this.status = s);
  }
}`,
    options: [
      'interval() must be created outside the component class',
      'Subscription never cleaned up; component destroyed but interval keeps firing forever',
      'switchMap() is the wrong operator for interval polling',
      'ngOnInit cannot contain manual subscriptions; must use async pipe',
    ],
    answer: 1,
    explanation: 'When the component is destroyed, the interval Observable keeps emitting every 5 seconds. Each tick fires an HTTP request and updates a destroyed component — a leak. Fix: add takeUntilDestroyed(inject(DestroyRef)) to auto-unsubscribe: interval(5000).pipe(switchMap(...), takeUntilDestroyed(inject(DestroyRef))).subscribe(...). Or use resource() which ties lifetime to the component. Why others fail: (A) interval() works fine in components. (C) switchMap() is correct for polling. (D) Manual subscriptions are fine if cleaned up.',
  },

  // --- MORE FORMS ---
  {
    id: 35, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What is the correct way to add a control to FormArray at runtime?',
    options: [
      'formArray.controls.push(new FormControl("")) — mutate raw controls array',
      'formArray.add(new FormControl("")) — use FormArray add method',
      'formArray.push(new FormControl("")) — use FormArray push method',
      'formArray.append(new FormControl("")) — use FormArray append method',
    ],
    answer: 2,
    explanation: 'FormArray.push() appends a control AND triggers value/status notifications. Pushing directly to .controls bypasses the notification mechanism — form state does not update. Always use FormArray methods: push() to append, insert(index, control) for position-specific, removeAt(index) to remove. Never mutate .controls directly. Why others fail: (A) Bypasses notifications. (B) add() does not exist. (D) append() does not exist.',
  },
  {
    id: 36, type: 'spot-the-bug', difficulty: 'senior', category: 'forms',
    question: 'Why does FormGroup.setValue() throw when given incomplete data?',
    code: `form = new FormGroup({
  firstName: new FormControl(''),
  lastName: new FormControl(''),
});

loadProfile(profile: UserProfile) {
  this.form.setValue({
    firstName: profile.firstName,
    // lastName is missing!
  });
}`,
    options: [
      'setValue() does not exist; must use set() method instead',
      'setValue() is strict — requires all controls; omitting lastName throws error',
      'FormGroup requires FormBuilder; direct constructor is unsupported',
      'Object keys must match formControlName in template exactly',
    ],
    answer: 1,
    explanation: 'setValue() is strict — throws "Must supply a value for form control with name: \'lastName\'" if any control is omitted. Use patchValue() for partial updates: it updates only provided keys, ignoring missing ones. Rule: use setValue() when loading a complete model (all keys guaranteed); use patchValue() for partial updates. Why others fail: (A) setValue() is correct. (C) FormBuilder is recommended but direct constructor works. (D) Object structure must match form structure, not template.',
  },
  {
    id: 37, type: 'multiple-choice', difficulty: 'senior', category: 'forms',
    question: 'What does an async validator emit while validation is pending?',
    options: [
      'null — same as a passing synchronous validator',
      'Observable<ValidationErrors | null>; control.status is "PENDING"; resolves to null (valid) or errors (invalid)',
      'true (pending) or false (complete) status',
      'A ValidationPending sentinel object',
    ],
    answer: 1,
    explanation: 'Async validators return Observable<ValidationErrors | null> or Promise<ValidationErrors | null>. While running, the FormControl.status is "PENDING". On completion: null = valid, ValidationErrors object = invalid. In templates: check control.status === "PENDING" to show a loading spinner. Apply debounceTime inside validators to avoid hammering the server on every keystroke. Why others fail: (A) Returns observable, not null. (C) Status is a string. (D) No sentinel needed.',
  },

  // --- MORE ROUTING ---
  {
    id: 38, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'When CanMatchFn returns false vs CanActivateFn returns false, what happens?',
    options: [
      'Both block navigation to the current route without fallback',
      'CanMatchFn skips route and tries next; CanActivateFn blocks entirely',
      'CanMatchFn is only checked for lazy-loaded routes',
      'CanActivateFn always runs before CanMatchFn evaluation',
    ],
    answer: 1,
    explanation: 'CanMatchFn returning false makes the router skip this route definition and try the next matching route — enables "role-based routing" with multiple routes at the same path. CanActivateFn returning false blocks the already-matched route; no fallback route is tried. Use canMatch for "different components, same URL"; use canActivate for "block access or redirect to login". Why others fail: (A) They behave differently. (C) CanMatchFn works on all routes. (D) Both run, but CanMatchFn runs first.',
  },
  {
    id: 39, type: 'spot-the-bug', difficulty: 'senior', category: 'routing',
    question: 'This lazy route configuration has a type mismatch. What is wrong?',
    code: `export const routes: Routes = [
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.module')
        .then(m => m.SettingsModule),
  },
];`,
    options: [
      'import() cannot be used in a routes array; must be declared at module level',
      'loadComponent expects a component class; SettingsModule is an NgModule',
      'The path must start with a slash for lazy routes: "/settings"',
      'loadComponent requires a canActivate guard to protect the route',
    ],
    answer: 1,
    explanation: 'loadComponent is for lazy-loading standalone components. It expects the promise to resolve to a component class, not an NgModule. Providing SettingsModule causes a runtime error. Fix: for modules use loadChildren: () => import("./settings/settings.module").then(m => m.SettingsModule); for standalone routes use loadChildren: () => import("./settings/settings.routes").then(m => m.SETTINGS_ROUTES). Why others fail: (A) import() works fine. (C) Paths do not need slashes. (D) Guards are optional.',
  },

  // --- MORE TESTING ---
  {
    id: 40, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'What does fakeAsync() allow you to do in a test?',
    options: [
      'Run tests in parallel on separate threads',
      'Control time synchronously with tick(ms) and flushMicrotasks()',
      'Skip async setup in beforeEach',
      'Mock HTTP requests without HttpTestingController',
    ],
    answer: 1,
    explanation: 'fakeAsync() patches all timer APIs (setTimeout, setInterval, Promises) to use a virtual clock. Inside the test, call tick(500) to advance time 500ms synchronously — this runs any scheduled callbacks. Use flushMicrotasks() to drain pending Promises. This makes debounce, throttle, and delay logic testable without actually waiting. Without fakeAsync you must use async/await or done() callbacks. Why others fail: (A) fakeAsync runs in the same thread. (C) Does not affect setup. (D) That is HttpTestingController\'s job.',
  },
  {
    id: 41, type: 'spot-the-bug', difficulty: 'senior', category: 'testing',
    question: 'Why does this test pass even when the component is broken?',
    code: `it('shows the user name', () => {
  component.user = { name: 'Alice', email: 'alice@test.com' };
  const el = fixture.nativeElement.querySelector('.user-name');
  expect(el.textContent).toContain('Alice');
});`,
    options: [
      'querySelector always returns null in unit tests',
      'fixture.detectChanges() was never called — DOM is not re-rendered',
      'component.user should be set via a signal instead',
      'toContain should be toBe for exact text matching',
    ],
    answer: 1,
    explanation: 'Assigning component.user changes the TypeScript value but does not run change detection. The DOM still shows whatever was rendered from the previous detectChanges() call. The test passes only if the initial render happens to contain "Alice". Fix: call fixture.detectChanges() after setting the property to trigger re-render. This updates the DOM before the assertion. Why others fail: (A) querySelector works in tests. (C) Plain objects work; signals are optional. (D) toContain is correct for substring matching.',
  },
  {
    id: 42, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'What advantage do Angular Component Harnesses have over raw querySelector?',
    options: [
      'Harnesses are 10x faster than DOM queries',
      'Harnesses expose semantic API (type, click, getValue) so tests survive DOM refactors',
      'Harnesses only work with Angular Material components',
      'Harnesses automatically add accessibility attributes',
    ],
    answer: 1,
    explanation: 'querySelector tests are brittle — changing div to button, renaming a CSS class, or restructuring DOM breaks them even if behavior is unchanged. Harnesses wrap the component behind a semantic behavioral API. When you refactor the DOM, only the harness implementation changes; tests stay the same. Angular Material ships harnesses for every component. For custom components, extend ComponentHarness. Test behaviors, not implementation. Why others fail: (A) Speed is similar. (C) Harnesses work with any component. (D) Harnesses do not add attributes.',
  },

  // --- MORE PERFORMANCE ---
  {
    id: 43, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'What does "prefetch on idle" do in an @defer block?',
    options: [
      'Loads and renders the deferred block as soon as browser is idle',
      'Downloads the lazy chunk during idle time so rendering triggers instantly',
      'Disables the deferred block on slow network connections',
      'Inlines the deferred chunk back into the main bundle',
    ],
    answer: 1,
    explanation: '@defer separates "when to prefetch" from "when to render". Example: @defer (on interaction; prefetch on idle) downloads the chunk during idle time before the user interacts, so interaction renders immediately without delay. Without prefetch, interaction has latency while downloading. This is Angular\'s equivalent of <link rel="prefetch"> scoped to a component. Combine with "on viewport" for below-fold content. Why others fail: (A) Renders only when trigger fires. (C) Prefetch happens regardless of connection. (D) Prefetch does not inline.',
  },
  {
    id: 44, type: 'spot-the-bug', difficulty: 'senior', category: 'performance',
    question: 'This image causes CLS and dev-mode warnings. What is missing?',
    code: `<img ngSrc="/assets/hero.webp" alt="Hero banner" priority />`,
    options: [
      'ngSrc requires absolute URLs; relative paths are not supported',
      'width and height attributes required — browser cannot reserve layout space',
      'priority attribute conflicts with ngSrc',
      '.webp format is not supported by NgOptimizedImage',
    ],
    answer: 1,
    explanation: 'NgOptimizedImage requires explicit width and height on every image. These establish the aspect ratio so the browser reserves exact layout space before the image loads — preventing CLS (Cumulative Layout Shift). Without them, the image loads, DOM shifts, causing visual jank. NgOptimizedImage throws a dev-mode error if width/height are missing. Fix: <img ngSrc="/assets/hero.webp" width="1200" height="400" alt="Hero banner" priority />. Width/height set intrinsic dimensions, not CSS display size. Why others fail: (A) Relative paths work fine. (C) priority is required. (D) .webp is supported.',
  },
  {
    id: 45, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'What is the single most impactful technique to reduce initial JS download?',
    options: [
      'Disable optimization in angular.json to reduce minification overhead',
      'Route-level code splitting with loadComponent/loadChildren per lazy route',
      'Remove TypeScript type annotations to shrink bundle',
      'Use OnPush change detection on all components',
    ],
    answer: 1,
    explanation: 'Route-level code splitting has the highest ROI. Each lazy route becomes a separate chunk downloaded only when the user navigates there. The initial load includes only the app shell and entry route. Everything else defers. Additional techniques: @defer for below-fold components, tree-shaking unused exports, custom preload strategy to load important routes in background. Why others fail: (A) Optimization improves performance. (C) Types are stripped at compile time. (D) OnPush improves runtime performance, not bundle size.',
  },

  // --- MORE TYPESCRIPT ---
  {
    id: 46, type: 'predict-output', difficulty: 'mid', category: 'typescript',
    question: 'What is the TypeScript type of Keys?',
    code: `const config = { host: 'localhost', port: 3000, debug: true };
type Keys = keyof typeof config;`,
    options: [
      'string — any property name',
      '"host" | "port" | "debug" — literal property names',
      'string | number | boolean — value types',
      'never — no valid keys',
    ],
    answer: 1,
    explanation: 'keyof T produces a union of literal property key names. typeof config is { host: string; port: number; debug: boolean }. keyof typeof config is "host" | "port" | "debug". This is useful for type-safe accessors: function get<T, K extends keyof T>(obj: T, key: K): T[K] — TypeScript infers the return type from the specific key. Use it to reference an object\'s keys at the type level. Why others fail: (A) keyof produces literal unions, not string. (C) keyof produces property names, not value types. (D) There are valid keys.',
  },
  {
    id: 47, type: 'multiple-choice', difficulty: 'senior', category: 'typescript',
    question: 'What does "as const" do to an array that a regular type annotation does not?',
    code: `const ROLES = ['admin', 'editor', 'viewer'] as const;`,
    options: [
      'Makes the array immutable at runtime (prevents push/splice)',
      'Narrows type to readonly ["admin", "editor", "viewer"]; lets you derive union types',
      'Converts array to a const enum at compile time',
      'Prevents the values from being tree-shaken',
    ],
    answer: 1,
    explanation: 'Without "as const", ROLES has type string[] — TypeScript only knows it is an array of strings, not which strings. With "as const", the type is readonly ["admin", "editor", "viewer"] — every literal is preserved. This lets you derive a union: type Role = typeof ROLES[number] gives "admin" | "editor" | "viewer". Without "as const" you would get string. This pattern is more tree-shake-friendly than const enums and transparent at runtime. Why others fail: (A) Does not make runtime immutable. (C) Not a const enum. (D) Does not prevent tree-shaking.',
  },

  // --- ARCHITECTURE ---
  {
    id: 48, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'If a service is in BOTH root injector and component.providers, which instance do descendants get?',
    options: [
      'The root singleton instance — root always takes precedence',
      'The component-scoped instance — nearest injector in the tree wins',
      'Both instances merged into an array',
      'Angular throws a duplicate provider error',
    ],
    answer: 1,
    explanation: 'Angular\'s DI walks UP the injector tree and uses the FIRST match. Providing a service in component.providers creates a brand-new instance scoped to that subtree — completely isolated from the root instance. Descendants in that subtree get the local instance; everything outside gets the root instance. Use this to give a feature isolated state (e.g., edit dialog with its own FormStore that doesn\'t affect global data). Why others fail: (A) Nearest always wins. (C) DI does not merge instances. (D) Duplicates are allowed and useful.',
  },
  {
    id: 49, type: 'spot-the-bug', difficulty: 'senior', category: 'components',
    question: 'These two services cause a cyclic dependency error. Why?',
    code: `@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private router: RouterService) {}
}

@Injectable({ providedIn: 'root' })
export class RouterService {
  constructor(private auth: AuthService) {}
}`,
    options: [
      'providedIn: "root" services cannot use constructor injection at all',
      'AuthService needs RouterService to construct, which needs AuthService — infinite loop',
      'Services cannot reference each other at root scope',
      'Constructor parameters require an @Inject() decorator',
    ],
    answer: 1,
    explanation: 'Circular dependencies deadlock DI: AuthService cannot be created until RouterService is created, but RouterService cannot be created until AuthService is created. Angular throws "Cannot instantiate cyclic dependency!" Fix options: (1) Extract shared logic into a third NavigationStateService that both depend on. (2) Refactor so one does not need the other. (3) Lazy-inject using inject() inside a method (defers resolution past construction). Circular dependencies usually signal a missing abstraction. Why others fail: (A) Constructor injection works. (C) Services can reference each other if not circular. (D) @Inject() is optional here.',
  },
  {
    id: 50, type: 'multiple-choice', difficulty: 'senior', category: 'routing',
    question: 'You want /dashboard to render AdminDashboard or UserDashboard based on role. How?',
    options: [
      'CanActivateFn — return true for admins, false for users (blocks but does not redirect)',
      'CanMatchFn — returning false skips route and tries next, enabling role-based routing',
      'CanLoadFn — prevents chunk loading for non-admins',
      'Route resolvers — pre-fetch user role and pass it to the component',
    ],
    answer: 1,
    explanation: 'CanMatchFn returning false causes the router to skip that route entirely and try the next route definition. So: [{ path: "dashboard", canMatch: [isAdmin], loadComponent: () => AdminDashboard }, { path: "dashboard", loadComponent: () => UserDashboard }]. Admins match the first route; non-admins fall through to the second. CanMatchFn is specifically designed for "different components, same URL" routing. Why others fail: (A) CanActivateFn blocks but does not try other routes. (C) CanLoadFn is for chunk loading, not routing. (D) Resolvers are for data, not component selection.',
  },

  // ─── COMPONENTS 51-65 ───────────────────────────────────────────────────────
  {
    id: 51, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What does `@HostBinding("class.active") isActive = false` do on a directive?',
    options: [
      'It emits an "active" event when the host element is clicked',
      'It adds the "active" CSS class to the host element whenever isActive is true, and removes it when false',
      'It binds the host element\'s class attribute as a read-only string',
      'It is equivalent to [class]="isActive" on a child element',
    ],
    answer: 1,
    explanation: 'B is correct: `@HostBinding("class.active")` binds a class on the directive\'s own host element — the element the directive selector matches. When `isActive` is true the class is added; false removes it. This is the declarative alternative to `renderer.addClass(el, "active")`. A is wrong — that is @Output/EventEmitter. C is wrong — it is not read-only. D is wrong — @HostBinding targets the host itself, not a child.',
  },
  {
    id: 52, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What is the difference between `@ContentChild` and `@ContentChildren`?',
    options: [
      '@ContentChild returns the first match; @ContentChildren returns a QueryList of all matches',
      '@ContentChild is for components; @ContentChildren is for directives',
      '@ContentChildren is asynchronous; @ContentChild is synchronous',
      'They are identical — @ContentChildren is just the plural alias',
    ],
    answer: 0,
    explanation: 'A is correct: `@ContentChild` returns the first projected element matching the selector (or undefined). `@ContentChildren` returns a live `QueryList<T>` of ALL matching projected elements, which updates when content changes. B is wrong — both work with components and directives. C is wrong — both are synchronous once content is initialised. D is wrong — they behave differently for multiple matches.',
  },
  {
    id: 53, type: 'spot-the-bug', difficulty: 'mid', category: 'components',
    question: 'What is wrong with this usage of ngTemplateOutlet?',
    code: `<ng-template #greeting let-name>
  <p>Hello {{ name }}</p>
</ng-template>

<ng-container [ngTemplateOutlet]="greeting"></ng-container>`,
    options: [
      'ngTemplateOutlet must be used on <ng-template>, not <ng-container>',
      'The template context variable `name` is never passed — add [ngTemplateOutletContext]="{ $implicit: userName }"',
      'let-name is invalid syntax; use let-name="name" without a value',
      'ng-template cannot contain interpolation',
    ],
    answer: 1,
    explanation: 'B is correct: `let-name` declares a local variable bound from the context\'s `$implicit` property, but no context is passed via `[ngTemplateOutletContext]`. Without it, `name` is `undefined` and the paragraph renders "Hello ". Fix: add `[ngTemplateOutletContext]="{ $implicit: \'World\' }"`. A is wrong — `<ng-container>` is the correct host for `ngTemplateOutlet`. C is wrong — `let-name` (no value) binds `$implicit` by convention. D is wrong — templates support interpolation.',
  },
  {
    id: 54, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'When is `ngAfterContentInit` called relative to `ngAfterViewInit`?',
    options: [
      'ngAfterViewInit fires first because the view renders before content is projected',
      'ngAfterContentInit fires first because projected content is initialised before the component\'s own view',
      'They fire simultaneously in the same change detection pass',
      'The order depends on whether the component uses OnPush',
    ],
    answer: 1,
    explanation: 'B is correct: Angular\'s lifecycle order is ngOnInit → ngAfterContentInit → ngAfterContentChecked → ngAfterViewInit → ngAfterViewChecked. Content projection (what goes into `<ng-content>`) is resolved before the component\'s own view is fully initialised. Use `ngAfterContentInit` to work with `@ContentChild` queries and `ngAfterViewInit` for `@ViewChild` queries. A reverses the order. C is wrong — they are separate lifecycle phases. D is wrong — OnPush does not change lifecycle order.',
  },
  {
    id: 55, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'Which syntax projects content into a named slot `<ng-content select="[footer]">`?',
    options: [
      '<app-card><footer>Save</footer></app-card>',
      '<app-card><span slot="footer">Save</span></app-card>',
      '<app-card><span footer>Save</span></app-card>',
      '<app-card footer="Save"></app-card>',
    ],
    answer: 2,
    explanation: 'C is correct: `select="[footer]"` is an attribute CSS selector — it matches any element that has a `footer` attribute. So `<span footer>Save</span>` matches. A is wrong — `<footer>` is the element tag selector, not `[footer]` attribute selector; use `select="footer"` for that. B is wrong — `slot=""` is Web Component syntax, not Angular. D is wrong — that is a property binding to the parent\'s `footer` input.',
  },
  {
    id: 56, type: 'predict-output', difficulty: 'senior', category: 'components',
    question: 'What does this template render when `items = [1, 2, 3]`?',
    code: `<ng-template #row let-n>
  <li>{{ n * 2 }}</li>
</ng-template>

<ul>
  @for (item of items; track item) {
    <ng-container [ngTemplateOutlet]="row"
      [ngTemplateOutletContext]="{ $implicit: item }">
    </ng-container>
  }
</ul>`,
    options: ['<li>1</li><li>2</li><li>3</li>', '<li>2</li><li>4</li><li>6</li>', 'Nothing — ngTemplateOutlet inside @for is not supported', '<li>NaN</li><li>NaN</li><li>NaN</li>'],
    answer: 1,
    explanation: 'B is correct: each `@for` iteration passes the current item as `$implicit` context. Inside the template, `let-n` binds to `$implicit`, so `n` is 1, 2, 3. The expression `n * 2` produces 2, 4, 6. A is wrong — the template doubles the value. C is wrong — `ngTemplateOutlet` works inside any control flow. D is wrong — numbers multiply correctly.',
  },
  {
    id: 57, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'When is `ViewContainerRef.createEmbeddedView(templateRef, context)` used over `ngTemplateOutlet`?',
    options: [
      'createEmbeddedView is older and should never be used — always prefer ngTemplateOutlet',
      'createEmbeddedView is imperative/programmatic — use it when you need to dynamically insert a template into a container at runtime from TypeScript code, such as in a modal service or a custom structural directive',
      'createEmbeddedView compiles a template string at runtime; ngTemplateOutlet only works with pre-defined ng-template elements',
      'createEmbeddedView returns a Promise; ngTemplateOutlet is synchronous',
    ],
    answer: 1,
    explanation: 'B is correct: `createEmbeddedView` is the imperative API for inserting a `TemplateRef` into a `ViewContainerRef` from TypeScript. It is the building block that `*ngIf` and custom structural directives use under the hood. `ngTemplateOutlet` is the declarative template equivalent. Use `createEmbeddedView` when the insertion logic must live in a service or factory. A is wrong — both have valid use cases. C is wrong — both require a `TemplateRef`. D is wrong — both are synchronous.',
  },
  {
    id: 58, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'What is the key structural difference between an attribute directive and a structural directive?',
    options: [
      'Attribute directives use @Directive; structural directives use @Component',
      'Structural directives manipulate the DOM layout by adding, removing, or replacing elements via ViewContainerRef + TemplateRef; attribute directives only change appearance or behaviour of an existing element',
      'Attribute directives require a selector with [], structural directives require a selector with *',
      'Structural directives can only be applied to <ng-template> elements',
    ],
    answer: 1,
    explanation: 'B is correct: structural directives (like `*ngIf`, `*ngFor`) receive a `TemplateRef` and a `ViewContainerRef` and physically add or remove DOM content. The `*` prefix is syntactic sugar for `<ng-template>`. Attribute directives (`[highlight]`, `[appTooltip]`) leave the DOM structure intact and only modify the host element\'s properties, classes, styles, or events. A is wrong — both use `@Directive`. C describes the selector convention but not the fundamental difference. D is wrong.',
  },
  {
    id: 59, type: 'spot-the-bug', difficulty: 'junior', category: 'components',
    question: 'This component tries to access a ViewChild in ngOnInit. What is wrong?',
    code: `@Component({
  standalone: true,
  template: '<canvas #myCanvas></canvas>',
})
export class ChartComponent implements OnInit {
  @ViewChild('myCanvas') canvas!: ElementRef<HTMLCanvasElement>;

  ngOnInit() {
    const ctx = this.canvas.nativeElement.getContext('2d');
    // draw chart...
  }
}`,
    options: [
      'ElementRef requires the Renderer2 service to access nativeElement',
      'canvas will be undefined in ngOnInit because the view has not been initialised yet — move this code to ngAfterViewInit',
      'The template variable must match the class field name exactly',
      '@ViewChild requires { static: true } to work at all',
    ],
    answer: 1,
    explanation: 'B is correct: `@ViewChild` queries are resolved after the component\'s view is created, which happens AFTER `ngOnInit`. In `ngOnInit` the canvas is still `undefined`, causing a null-reference error. Move DOM access to `ngAfterViewInit`. A is wrong — `nativeElement` is a direct property, no Renderer2 needed for reading. C is wrong — the string `"myCanvas"` matches the `#myCanvas` template variable regardless of the class field name. D is wrong — `{ static: true }` only matters for queries that must be available in ngOnInit (elements not inside *ngIf/@if).',
  },
  {
    id: 60, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'What does `ViewEncapsulation.None` do to a component\'s styles?',
    options: [
      'Styles are completely removed — the component uses only global CSS',
      'Styles are applied globally with no scoping — they leak out and can affect other components',
      'Styles use real browser Shadow DOM for complete isolation',
      'Each style rule is inlined on the element\'s style attribute',
    ],
    answer: 1,
    explanation: 'B is correct: `ViewEncapsulation.None` adds the component\'s styles to the global stylesheet without any scoping attributes. Every rule can potentially match elements in other components — a dangerous choice for shared components. Use `None` only for global reset or theming components. `Emulated` (default) scopes via generated attributes like `[_ngcontent-abc]`. `ShadowDom` uses native Shadow DOM isolation. A is wrong — styles are still written. C describes `ShadowDom`. D describes inline styles.',
  },
  {
    id: 61, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'An `@Input()` is decorated with `transform: numberAttribute`. What does this do?',
    options: [
      'It validates that only numbers can be passed — non-numbers throw at runtime',
      'It automatically converts the bound value to a number using Angular\'s built-in `numberAttribute` function — so `<app-item count="5">` (string "5") arrives as the number 5',
      'It applies a CSS transform to the element when the input changes',
      'It makes the input accept only Angular Number objects, not primitives',
    ],
    answer: 1,
    explanation: 'B is correct: `@Input({ transform: numberAttribute })` (Angular 16+) pipes the bound value through a transform function before assigning it to the property. Since HTML attributes are always strings, `count="5"` arrives as the string `"5"` — without the transform. With it, Angular converts `"5"` to the number `5` automatically. A is wrong — it converts, not validates/throws. C is wrong — `transform` refers to the input transform function, not CSS. D is wrong.',
  },
  {
    id: 62, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'What is the difference between `afterRender()` and `afterNextRender()`?',
    options: [
      'afterRender runs once; afterNextRender runs after every render cycle',
      'afterNextRender runs once after the next browser paint and is then cleaned up; afterRender runs after every render cycle for the lifetime of the component — use it for work that must re-run after every DOM update',
      'They are identical; afterNextRender is just a shorthand for afterRender with { once: true }',
      'afterRender is for SSR; afterNextRender is browser-only',
    ],
    answer: 1,
    explanation: 'B is correct: `afterNextRender()` fires exactly once after the next browser paint — useful for one-time setup like initialising a third-party chart library. `afterRender()` fires after every render cycle for the component\'s lifetime — useful for work that must react to every DOM update (e.g., measuring element dimensions after each layout change). Both run in the browser only (not SSR). A reverses the two. C is wrong — they are distinct APIs. D is wrong — both are browser-only.',
  },
  {
    id: 63, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'A component\'s template has `{{ getUser() }}`. Why can this be a performance problem?',
    options: [
      'Method calls in templates are forbidden in Angular 17+',
      'Angular calls `getUser()` on every change detection cycle. If it is expensive or returns a new object reference each time, it causes unnecessary work and potential ExpressionChangedAfterItHasBeenChecked errors',
      'Method calls in templates bypass OnPush change detection',
      'Template expressions cannot call class methods — only access properties',
    ],
    answer: 1,
    explanation: 'B is correct: Angular re-evaluates every template expression on each change detection cycle. A method called in a template runs every cycle — if it is expensive (filtering a large array) or returns a new object each call, it wastes CPU and can cause infinite detection loops. The fix: use a computed signal, a `get` accessor with memoisation, or the `async` pipe. A is wrong — calls are allowed. C is wrong — OnPush still calls template methods when it runs detection. D is wrong.',
  },
  {
    id: 64, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What does `@Component({ host: { "(click)": "handleClick($event)" } })` do?',
    options: [
      'It attaches a click listener to the component\'s first child element',
      'It is equivalent to `@HostListener("click", ["$event"])` — it attaches the event listener to the component\'s host element declaratively in the metadata',
      'It prevents click events from reaching child elements',
      'It overrides the browser\'s default click behaviour for the component',
    ],
    answer: 1,
    explanation: 'B is correct: the `host` metadata object supports event bindings like `"(click)": "handler($event)"` and property bindings like `"[class.active]": "isActive"`. This is the metadata equivalent of `@HostListener` and `@HostBinding`. Both approaches produce identical results. A is wrong — it targets the host, not a child. C is wrong — it does not stop propagation to children. D is wrong — use `event.preventDefault()` inside the handler for that.',
  },
  {
    id: 65, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'What is the Directive Composition API (`hostDirectives`) and what problem does it solve?',
    options: [
      'It allows multiple components to share the same template by declaring a parent directive',
      'It attaches one or more directives to a component\'s host element declaratively, composing behaviours without class inheritance — a component can gain drag-and-drop, tooltip, and focus-trap behaviours by listing them in hostDirectives',
      'It enables a directive to be applied to multiple element types by listing valid host selectors',
      'It provides a way to override a parent component\'s directive without creating a subclass',
    ],
    answer: 1,
    explanation: 'B is correct: `hostDirectives: [CdkDrag, { directive: TooltipDir, inputs: ["text: tip"] }]` attaches these directive behaviours to the component at the framework level — the component class has no reference to them. This is composition over inheritance: mix orthogonal behaviours (drag, tooltip, focustrap) on any component without creating deep class hierarchies. Inputs and outputs can be selectively forwarded to the host. A, C, D are all incorrect descriptions.',
  },

  // ─── SIGNALS 66-80 ──────────────────────────────────────────────────────────
  {
    id: 66, type: 'spot-the-bug', difficulty: 'mid', category: 'signals',
    question: 'This effect has a resource-leak problem. What is it?',
    code: `effect(() => {
  const id = this.userId();
  const sub = this.http.get('/api/user/' + id).subscribe(user => {
    this.user.set(user);
  });
});`,
    options: [
      'http.get cannot be called inside an effect',
      'The subscription created by .subscribe() is never cleaned up — if userId changes rapidly each new effect run creates another subscription and they all run concurrently',
      'this.user.set() cannot be called inside an effect',
      'effect() re-runs synchronously on every change detection cycle',
    ],
    answer: 1,
    explanation: 'B is correct: each time `userId` changes, the effect re-runs and creates a NEW subscription, but the previous one is never unsubscribed. Multiple in-flight HTTP requests accumulate. Fix: use the cleanup function — `effect((onCleanup) => { const sub = ...; onCleanup(() => sub.unsubscribe()); })` — or better, replace the pattern with `resource(() => ({ request: this.userId(), loader: ({ request: id }) => firstValueFrom(this.http.get(\'/api/user/\' + id)) }))`. C is wrong — `set()` is allowed in effects (though using computed() is cleaner for derived values).',
  },
  {
    id: 67, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What does `signal([], { equal: (a, b) => a.length === b.length })` achieve?',
    options: [
      'The signal only stores arrays — the equal function is a type guard',
      'Angular uses the custom equality function to decide whether to notify consumers — here, if two arrays have the same length, Angular treats them as equal and skips re-renders even if contents differ',
      'The signal throws if you try to set an array with a different length',
      'It enables deep equality checking for nested array items',
    ],
    answer: 1,
    explanation: 'B is correct: signals use `Object.is()` by default. A custom `equal` function overrides this — Angular only notifies dependents when the function returns `false`. Here, two arrays of equal length are treated as identical regardless of content. This is a performance optimisation for cases where length is the only thing views care about. A is wrong — no type guard. C is wrong — it does not throw. D is wrong — the function shown compares only length.',
  },
  {
    id: 68, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What does `toObservable(mySignal)` return and when does it emit?',
    options: [
      'A Promise that resolves to the signal\'s current value',
      'An Observable that emits the signal\'s current value immediately upon subscription, then emits again whenever the signal changes — it uses an effect internally',
      'A Subject that you must manually push values into',
      'An Observable that emits once with the final value when the component is destroyed',
    ],
    answer: 1,
    explanation: 'B is correct: `toObservable(signal)` from `@angular/core/rxjs-interop` creates an Observable that emits the current value synchronously on subscription (via `ReplaySubject(1)` semantics) and then emits on every subsequent signal change. It creates an internal `effect()` to watch the signal and push to the Subject. Use it to bridge signals with RxJS operators. A is wrong — it is an Observable, not a Promise. C is wrong — it is auto-managed. D is wrong — it is a live stream.',
  },
  {
    id: 69, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'What does `untracked(() => this.sideEffectValue())` do inside a `computed()` or `effect()`?',
    options: [
      'It prevents the signal read from being tracked as a dependency of the enclosing reactive context — the computed/effect will NOT re-run when sideEffectValue changes',
      'It logs the signal read to the Angular DevTools without creating a dependency',
      'It creates a one-time snapshot of the signal value that never updates',
      'It throws if called inside a computed — use it only in effects',
    ],
    answer: 0,
    explanation: 'A is correct: `untracked()` executes a function outside the reactive tracking context. Any signals read inside `untracked()` are NOT registered as dependencies. This is useful when you need a signal\'s value for a side-effect purpose but do not want the computed/effect to re-run when that signal changes. B is wrong — no DevTools logging occurs. C is wrong — it does not snapshot; the value is live if called again later. D is wrong — `untracked` works in both computed and effect.',
  },
  {
    id: 70, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'What is the recommended pattern for a signal-based service store in Angular?',
    options: [
      'Export a single global signal object and mutate it from any component',
      'Create an @Injectable service with private writable signals, expose public readonly computed signals or .asReadonly(), and expose explicit named mutation methods — this enforces unidirectional data flow',
      'Use a BehaviorSubject for state and pipe it to a signal with toSignal() in each component',
      'Store all state in the router query params as signals synchronise with the URL automatically',
    ],
    answer: 1,
    explanation: 'B is correct: the "mini-store" pattern: private `_items = signal<Item[]>([])`, public `readonly items = this._items.asReadonly()`, public `addItem(item: Item)` method. This gives components read access but only the service can mutate state, preventing race conditions and making state flows traceable. A is wrong — global mutable signals produce untraceable mutations. C works but mixes paradigms unnecessarily. D is wrong — router query params do not auto-sync with signals.',
  },
  {
    id: 71, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What are the three status values a `resource()` can have?',
    options: [
      '"loading", "loaded", "error"',
      '"idle", "loading", "resolved", "error", "refreshing" — five statuses',
      'ResourceStatus.Idle, ResourceStatus.Loading, ResourceStatus.Resolved, ResourceStatus.Error, ResourceStatus.Refreshing',
      '"pending", "complete", "failed"',
    ],
    answer: 2,
    explanation: 'C is correct: Angular\'s `resource()` API exposes a `status` signal with the `ResourceStatus` enum values: `Idle` (not yet fetched), `Loading` (initial fetch in progress), `Resolved` (data available), `Error` (fetch failed), `Refreshing` (re-fetching while existing data is shown). Check `resource.isLoading()` as a convenience boolean. A and D use wrong names. B gets the count right but uses string names incorrectly.',
  },
  {
    id: 72, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'When would you use `rxResource()` instead of `resource()`?',
    options: [
      'rxResource() is faster — always prefer it over resource()',
      'When the data fetching logic uses RxJS Observables (e.g., HttpClient) rather than Promises — rxResource() takes a loader that returns an Observable; resource() takes one that returns a Promise',
      'rxResource() caches results permanently; resource() never caches',
      'rxResource() works in SSR; resource() is browser-only',
    ],
    answer: 1,
    explanation: 'B is correct: `rxResource()` (from `@angular/core/rxjs-interop`) accepts a `loader` returning an `Observable<T>`, while `resource()` accepts one returning `Promise<T>`. Since Angular\'s `HttpClient` returns Observables, `rxResource()` integrates naturally without needing `firstValueFrom()`. Both expose the same `value`, `status`, `isLoading`, and `error` signals. A is wrong — neither is universally faster. C is wrong — neither provides permanent caching. D is wrong — both have SSR limitations.',
  },
  {
    id: 73, type: 'predict-output', difficulty: 'junior', category: 'signals',
    question: 'What happens when this component is used as `<app-counter>` without the `start` binding?',
    code: `@Component({ standalone: true, template: '{{ count() }}' })
export class CounterComponent {
  readonly start = input.required<number>();
  readonly count = computed(() => this.start() * 2);
}`,
    options: [
      'The component renders "0" — required inputs default to 0',
      'Angular throws a runtime error: required input "start" must be provided',
      'The component renders "NaN" because start is undefined',
      'TypeScript prevents compilation if start is not bound in the parent template',
    ],
    answer: 1,
    explanation: 'B is correct: `input.required<T>()` enforces that the parent must provide a value. Angular throws a runtime error at component initialisation if the binding is missing. The error message is "Required input \'start\' is not provided." A is wrong — there is no default-to-zero behaviour. C is wrong — it never reaches rendering. D is wrong — the check is at runtime, not compile time (though Angular\'s language service in strict mode may warn).',
  },
  {
    id: 74, type: 'multiple-choice', difficulty: 'junior', category: 'signals',
    question: 'How do you emit a value from a component output created with `output()`?',
    options: [
      'this.myOutput.next(value)',
      'this.myOutput.emit(value)',
      'this.myOutput.set(value)',
      'this.myOutput.push(value)',
    ],
    answer: 1,
    explanation: 'B is correct: `output()` returns an `OutputEmitterRef` and you call `.emit(value)` to fire it — identical to `EventEmitter.emit()`. A is wrong — `.next()` is the Subject/Observable API. C is wrong — `.set()` is the signal write API. D is wrong — `.push()` is the Array API. The `output()` function is the modern replacement for `@Output() myOutput = new EventEmitter()`.',
  },
  {
    id: 75, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What is `linkedSignal()` and when should you prefer it over `computed()`?',
    options: [
      'linkedSignal() chains two signals so setting one automatically sets the other bidirectionally',
      'linkedSignal() creates a writable signal whose value is reset to a computation result whenever its source changes — use it when a default is derived from another signal but the user should be able to override it',
      'linkedSignal() is a performance-optimised version of computed() for deeply nested objects',
      'linkedSignal() links a signal to an Observable stream so it updates automatically',
    ],
    answer: 1,
    explanation: 'B is correct: `linkedSignal({ source: items, computation: items => items[0] })` creates a writable signal that resets to `items[0]` whenever `items` changes, but can be overridden by the user in between resets. `computed()` is purely derived and read-only. Use `linkedSignal()` for "selected item defaults to first but user can change" patterns. A is wrong — it is not bidirectional linking. C is wrong. D is wrong.',
  },
  {
    id: 76, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What does `readonly items = viewChildren(ItemComponent)` return?',
    options: [
      'An array of ItemComponent instances',
      'A Signal<ReadonlyArray<ItemComponent>> — a signal wrapping all matching child component instances in the view, updating when children are added or removed',
      'A QueryList<ItemComponent> that emits changes',
      'A single ItemComponent instance — use @ViewChildren for the plural form',
    ],
    answer: 1,
    explanation: 'B is correct: `viewChildren(ItemComponent)` (Angular 17+) is the signal-based plural query. It returns a `Signal<ReadonlyArray<T>>` — you read it as `this.items()` and it reactively updates when the list changes. A is wrong — it is a signal, not a plain array. C is wrong — `QueryList` is the old `@ViewChildren` API. D is wrong — `viewChildren` IS the plural form.',
  },
  {
    id: 77, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What is the key difference between `signal()` state and `FormControl` reactive state?',
    options: [
      'Signals are synchronous and type-safe; FormControl is async and uses Observable streams for value and status changes — choose based on whether you need form validation integration',
      'FormControl is faster for rendering; signal() is faster for services',
      'Signals cannot hold complex objects; FormControl is designed for nested data',
      'They are equivalent — Angular automatically converts signals to FormControls',
    ],
    answer: 0,
    explanation: 'A is correct: signals are synchronous reactive primitives ideal for UI state; `FormControl` provides an Observable-based API with built-in validation, dirty/touched/pristine tracking, and integration with Angular Forms directives (`formControlName`, validators). For a simple counter or toggle, use signal(). For a form field that needs validation, error display, and `FormGroup` coordination, use `FormControl`. B, C, D are all false.',
  },
  {
    id: 78, type: 'spot-the-bug', difficulty: 'senior', category: 'signals',
    question: 'Why will this computed() throw a runtime error?',
    code: `const divisor = signal(0);
const result = computed(() => {
  if (divisor() === 0) throw new Error('Division by zero');
  return 100 / divisor();
});

// template:
// {{ result() }}`,
    options: [
      'computed() does not allow conditional logic',
      'Throwing inside computed() marks it as errored and re-throws the error to every consumer that reads it — the template will throw, crashing change detection unless caught in the template',
      'The error is swallowed silently and result() returns undefined',
      'computed() catches the error and returns null automatically',
    ],
    answer: 1,
    explanation: 'B is correct: if a `computed()` getter throws, Angular stores the error and re-throws it every time the computed signal is read. Any template expression that reads it will throw during change detection. Handle this by either catching inside the computed (`try/catch` returning a fallback), or guarding reads with `@if (divisor() !== 0)`. A is wrong — conditional logic is fine. C is wrong — errors are not swallowed. D is wrong — no automatic null fallback.',
  },
  {
    id: 79, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'How do you run code after ALL pending signal effects have flushed in a test?',
    options: [
      'Call fixture.detectChanges() twice',
      'Use TestBed\'s `flushEffects()` (or `tick()` in fakeAsync) — effects are scheduled asynchronously and do not flush synchronously during detectChanges()',
      'Effects flush automatically when you read a signal — no special test code needed',
      'Wrap the assertion in setTimeout(() => { ... }, 0)',
    ],
    answer: 1,
    explanation: 'B is correct: Angular effects are scheduled microtasks. In tests, `TestBed.flushEffects()` (Angular 18+) or `tick()` inside `fakeAsync()` forces all pending effects to run immediately. Without it, assertions run before the effect fires and the test sees stale state. A is wrong — `detectChanges()` runs change detection but does not guarantee effect flushing. C is wrong — reading a signal does not trigger effect execution. D is wrong — using setTimeout makes tests brittle.',
  },
  {
    id: 80, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'Why should you avoid writing `effect(() => { this.b.set(this.a() + 1); })`?',
    options: [
      'set() is not allowed inside an effect',
      'This creates a reactive chain through a side effect instead of a pure derivation — use computed() or linkedSignal() instead. Effects that synchronise one signal\'s value to another are an anti-pattern because they fire asynchronously, can cause glitches, and are harder to reason about',
      'The effect will throw because it creates a dependency cycle',
      'Effects that call set() are deprecated in Angular 18+',
    ],
    answer: 1,
    explanation: 'B is correct: the Angular team explicitly discourages using `effect()` to copy signal values from one to another. `computed()` is synchronous, lazy, and glitch-free — it guarantees the derived value is always consistent. `effect()` fires asynchronously after render, meaning there is a brief window where `b` has not yet updated. Use `const b = computed(() => a() + 1)` instead. A is wrong — you CAN set inside effects (with `allowSignalWrites: true` or the modern API). C is wrong — cycles only occur if both signals read each other. D is wrong.',
  },

  // ─── RXJS 81-95 ─────────────────────────────────────────────────────────────
  {
    id: 81, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'What is the difference between `shareReplay(1)` and `share()`?',
    options: [
      'share() replays the last value to late subscribers; shareReplay(1) does not',
      'shareReplay(1) multicasts AND replays the last emission to any new subscriber even after the source completes; share() multicasts to current subscribers only — a new subscriber after completion gets nothing',
      'They are identical — shareReplay is just an alias with a buffer size',
      'share() refCounts the subscription automatically; shareReplay(1) keeps the source alive forever',
    ],
    answer: 1,
    explanation: 'B is correct: `share()` is equivalent to `multicast(new Subject()).refCount()` — when all subscribers unsubscribe the source is torn down; late subscribers miss past emissions. `shareReplay(1)` (with `refCount: true`) replays the last value to any new subscriber even after the source completes — critical for HTTP requests used by multiple components. A reverses them. C is wrong. D partially true for `shareReplay({ bufferSize: 1, refCount: false })` — the default refCount behaviour changed in RxJS 6.4.',
  },
  {
    id: 82, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'In `catchError`, what is the difference between returning `of(null)` vs returning `EMPTY`?',
    options: [
      'of(null) completes the stream; EMPTY throws a new error',
      'of(null) emits one null value then completes — the subscriber receives null; EMPTY completes immediately without emitting any value — the subscriber receives nothing',
      'EMPTY emits undefined; of(null) emits null — they are functionally equivalent',
      'of(null) retries the source; EMPTY cancels the subscription',
    ],
    answer: 1,
    explanation: 'B is correct: `of(null)` creates an Observable that emits `null` once and completes — your `next` handler fires with null. `EMPTY` completes immediately without any emission — your `next` handler never fires, only `complete` does. Use `of(fallback)` when the consumer needs a value on error; use `EMPTY` when you want to silently swallow the error and complete the stream. A is wrong. C is wrong — they behave differently. D is wrong.',
  },
  {
    id: 83, type: 'predict-output', difficulty: 'junior', category: 'rxjs',
    question: 'What does this Observable emit?',
    code: `import { of } from 'rxjs';
import { startWith } from 'rxjs/operators';

of(1, 2, 3).pipe(
  startWith(0)
).subscribe(console.log);`,
    options: ['1, 2, 3', '0, 1, 2, 3', '0', '0, 1, 2, 3, 0'],
    answer: 1,
    explanation: 'B is correct: `startWith(0)` prepends the specified value(s) BEFORE the source emits. The output is 0, 1, 2, 3 — the prepended value first, then the source values. A is wrong — startWith is missing from the output. C is wrong — all values are emitted. D is wrong — startWith does not append.',
  },
  {
    id: 84, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'What does the `scan()` operator do?',
    options: [
      'It scans the source Observable for a specific value and filters non-matching emissions',
      'It accumulates emissions like Array.reduce() — it passes each value plus the accumulated result to a function and emits each intermediate accumulated value',
      'It buffers all emissions and emits them as a single array when the source completes',
      'It is identical to reduce() but works on hot Observables',
    ],
    answer: 1,
    explanation: 'B is correct: `scan((acc, val) => acc + val, 0)` on `of(1, 2, 3)` emits 1, 3, 6 — unlike `reduce()` which only emits the final value. `scan()` emits after EVERY item, making it perfect for building a running total, an accumulated array (`scan((acc, item) => [...acc, item], [])`), or an event log. A is wrong — that is `filter`. C is wrong — that is `toArray()`. D is wrong — `reduce()` emits only the final value (and only when the source completes); `scan()` emits each intermediate value.',
  },
  {
    id: 85, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'When should you use `throttleTime(1000)` vs `debounceTime(1000)`?',
    options: [
      'throttleTime waits 1s after the last event; debounceTime emits every 1s',
      'debounceTime emits only after 1s of silence (ideal for search inputs); throttleTime emits the first event then ignores events for 1s (ideal for scroll or resize handlers where you want a regular pulse)',
      'They are identical — use whichever is already imported',
      'throttleTime is deprecated; always use debounceTime',
    ],
    answer: 1,
    explanation: 'B is correct: `debounceTime(300)` waits for a pause — fire only after the user stops typing for 300ms. `throttleTime(1000)` rate-limits — fire immediately but then ignore events for 1000ms. Use debounce for inputs, search, autocomplete. Use throttle for scroll, resize, drag, or any rapid event where you want a guaranteed max frequency. A reverses them. C is wrong. D is wrong.',
  },
  {
    id: 86, type: 'multiple-choice', difficulty: 'junior', category: 'rxjs',
    question: 'What is the RxJS way to fire a callback every 500ms indefinitely?',
    options: [
      'Observable.interval(500)',
      'interval(500) from "rxjs" — emits 0, 1, 2, 3... every 500ms',
      'timer(500) from "rxjs"',
      'fromEvent(window, "timer", 500)',
    ],
    answer: 1,
    explanation: 'B is correct: `interval(500)` from the `rxjs` package emits an incrementing integer (0, 1, 2...) every 500ms indefinitely. You subscribe and clean up via `takeUntilDestroyed()` or `unsubscribe()`. A is wrong — no `Observable.interval` static method exists. C is wrong — `timer(500)` fires ONCE after 500ms and completes; `timer(500, 500)` repeats. D is wrong — `fromEvent` is for DOM events.',
  },
  {
    id: 87, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'What does `withLatestFrom(b$)` do when applied to source Observable `a$`?',
    options: [
      'It merges a$ and b$ so they run in parallel',
      'When a$ emits, it also grabs the latest value from b$ (without subscribing to b$ again) and emits both as a tuple [aValue, bValue] — b$ must have emitted at least once or the combined value is dropped',
      'It replaces a$ emissions with the latest b$ value',
      'It subscribes to b$ first and waits for it to complete before a$ can emit',
    ],
    answer: 1,
    explanation: 'B is correct: `withLatestFrom(b$)` combines the latest `a$` emission with the most recent `b$` value. It only subscribes to `b$` once (when the outer Observable subscribes) and reads its cached latest value on each `a$` emission. If `b$` has not yet emitted, the `a$` value is silently dropped. Use it for "on this action, also grab the current state". A is wrong — it is not merge. C is wrong. D is wrong.',
  },
  {
    id: 88, type: 'multiple-choice', difficulty: 'senior', category: 'rxjs',
    question: 'What is the purpose of `defer(() => observable$)` in RxJS?',
    options: [
      'It delays the subscription to observable$ by one microtask',
      'It creates a new Observable instance (and runs the factory function) for each new subscriber — making an eager Observable behave as if it were cold/lazy per subscriber',
      'It stores the Observable reference and replays it later when subscribed',
      'It is equivalent to shareReplay(1) but without caching',
    ],
    answer: 1,
    explanation: 'B is correct: `defer(factory)` calls `factory()` fresh for each subscriber, ensuring each gets a brand new Observable. Use it when the Observable depends on a value that may change between subscriptions (e.g., `defer(() => of(Date.now()))`), or to defer the creation of a hot Observable until subscription. A is wrong — it is not a time delay. C is wrong. D is wrong — defer has no caching.',
  },
  {
    id: 89, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'Which is the RECOMMENDED modern way to clean up a subscription in an Angular service?',
    options: [
      'Store the subscription and call unsubscribe() in ngOnDestroy',
      'Use takeUntilDestroyed(this.destroyRef) from @angular/core/rxjs-interop — it auto-completes the stream when the injection context is destroyed, no ngOnDestroy required',
      'Always use the async pipe so Angular manages the subscription lifecycle',
      'Use take(1) to ensure the Observable completes after one emission',
    ],
    answer: 1,
    explanation: 'B is correct: `takeUntilDestroyed()` (Angular 16+) is the cleanest pattern for services and components. Inject `DestroyRef` (or use the overload `takeUntilDestroyed(inject(DestroyRef))`). The stream auto-completes when the context is destroyed — no `ngOnDestroy` boilerplate. A works but is verbose. C works for templates but not service-side subscriptions. D only works for single-emission Observables.',
  },
  {
    id: 90, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'What does `pairwise()` emit?',
    options: [
      'It emits values in pairs, waiting until two values have arrived, then emitting [prev, curr] and resetting',
      'It emits [previousValue, currentValue] for every emission after the first — the first emission is always skipped because there is no previous',
      'It combines two Observables into pairs like zip()',
      'It is identical to bufferCount(2)',
    ],
    answer: 1,
    explanation: 'B is correct: `pairwise()` on `of(1, 2, 3, 4)` emits `[1,2]`, `[2,3]`, `[3,4]` — sliding window of the previous and current value. The first value is always dropped because there is no previous to pair it with. Use it to detect direction changes (previous route vs current route), calculate deltas, or animate between states. A is wrong — pairwise does not reset. C is wrong — zip takes multiple sources. D is wrong — bufferCount(2) would emit [1,2] then [3,4] (non-overlapping).',
  },
  {
    id: 91, type: 'multiple-choice', difficulty: 'senior', category: 'rxjs',
    question: 'In an Angular service, `http.get("/config")` is called in the constructor. What is the problem?',
    options: [
      'HttpClient cannot be used in service constructors',
      'http.get() is a cold Observable — it is created but NOT executed because nothing subscribes to it. The HTTP request never fires unless someone subscribes (or uses async pipe / toSignal)',
      'The request fires but the response is lost because there is no subscriber',
      'Angular will retry the request automatically if the constructor subscription fails',
    ],
    answer: 1,
    explanation: 'B is correct: `http.get()` returns a COLD Observable. Simply calling it creates an Observable object but no HTTP request is made until a subscriber calls `.subscribe()`. This is the most common Angular gotcha for developers coming from Promises. Fix: `.subscribe(res => this.config = res)`, use `toSignal(http.get(...))`, or store and expose the Observable for consumers to subscribe. A is wrong — HttpClient works in constructors. C is wrong — if no one subscribes there is no request at all. D is wrong.',
  },
  {
    id: 92, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'What is the practical difference between `first()` and `take(1)`?',
    options: [
      'first() requires an Observable to emit at least one value — it throws an EmptyError if the source completes without emitting; take(1) completes silently if no value ever arrives',
      'take(1) waits for the Observable to complete; first() unsubscribes immediately after one emission',
      'first() applies only to BehaviorSubject; take(1) works on any Observable',
      'They are identical in all cases',
    ],
    answer: 0,
    explanation: 'A is correct: `first()` throws `EmptyError` if the source completes without emitting — it REQUIRES a value. `take(1)` completes silently after 0 or 1 emissions. `first(predicate)` also finds the first matching value and throws if none match. Use `take(1)` when a no-emission case is acceptable; use `first()` when a missing value is an error condition. B is wrong — both unsubscribe after one emission. C is wrong. D is wrong.',
  },
  {
    id: 93, type: 'spot-the-bug', difficulty: 'senior', category: 'rxjs',
    question: 'This retry logic has a bug. What is it?',
    code: `this.http.get('/api/data').pipe(
  retry(3),
  catchError(err => {
    console.error(err);
    return throwError(() => err);
  })
).subscribe();`,
    options: [
      'retry() must come after catchError()',
      'retry(3) retries on ANY error including 404 — it should use retryWhen or retry({ count: 3, delay: (err) => ... }) to retry only on transient errors (5xx, network) and immediately rethrow client errors (4xx)',
      'catchError cannot re-throw — return EMPTY instead',
      'The subscription will be garbage collected because no reference is stored',
    ],
    answer: 1,
    explanation: 'B is correct: `retry(3)` blindly retries on any error — including 404 Not Found or 403 Forbidden that will NEVER succeed no matter how many times you retry. Best practice: use `retry({ count: 3, delay: (err) => err.status >= 500 ? timer(1000) : throwError(() => err) })` to retry only server errors. A is wrong — retry before catchError is correct. C is wrong — `throwError(() => err)` is valid inside catchError. D is wrong — unroothed subscriptions are valid for one-shot operations though storing is good practice.',
  },
  {
    id: 94, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'What does `combineLatest([a$, b$]).pipe(filter(([a, b]) => a !== null && b !== null))` solve?',
    options: [
      'It prevents combineLatest from subscribing until both a$ and b$ have emitted',
      'combineLatest emits as soon as ALL sources have emitted at least once — the filter guards against null values that slip through from BehaviorSubject initial null states, preventing downstream processing of incomplete data',
      'filter() forces combineLatest to only emit when BOTH streams have new values simultaneously',
      'It converts a hot combineLatest into a cold Observable',
    ],
    answer: 1,
    explanation: 'B is correct: `combineLatest` emits after every source has emitted at least once. But if you initialise `BehaviorSubject`s with `null` as a placeholder, the first combined emission will be `[null, null]` — potentially causing errors in the downstream. The `filter` guards against this initial null state. A is wrong — combineLatest subscribes immediately to all sources. C is wrong — it emits whenever ANY source emits a new value (after the first combined emission). D is wrong.',
  },
  {
    id: 95, type: 'multiple-choice', difficulty: 'senior', category: 'rxjs',
    question: 'How does the `iif(condition, trueObs$, falseObs$)` operator work?',
    options: [
      'It subscribes to both Observables and emits values from whichever emits first',
      'It evaluates the condition FUNCTION at subscription time (lazily, not eagerly) and subscribes to either trueObs$ or falseObs$ based on the result — re-evaluates for each new subscriber',
      'It creates a conditional merge of two Observables based on each emitted value',
      'iif() is deprecated — use iif(condition) ? trueObs$ : falseObs$ instead',
    ],
    answer: 1,
    explanation: 'B is correct: `iif(() => this.isAdmin, adminObs$, userObs$)` defers the condition check to subscription time. The condition function is called fresh for each subscriber, so if the condition changes between subscriptions, different subscribers may get different Observables. This is distinct from `condition ? trueObs$ : falseObs$` which evaluates eagerly at construction time. A is wrong — only one Observable is subscribed to. D is wrong — iif() is not deprecated.',
  },

  // ─── FORMS 96-108 ────────────────────────────────────────────────────────────
  {
    id: 96, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What does `new FormControl("", { updateOn: "blur" })` change about validation?',
    options: [
      'The control\'s value is reset on every blur event',
      'Validators run and valueChanges emits only when the user leaves the field (blur), not on every keystroke — useful for expensive validators or to avoid showing errors while typing',
      'The control becomes read-only after the first blur',
      'The control automatically marks itself as touched on blur (the default already does this)',
    ],
    answer: 1,
    explanation: 'B is correct: by default `updateOn` is `"change"` — validators run and `valueChanges` fires on every keystroke. `"blur"` defers this to when focus leaves the field, and `"submit"` defers to form submission. This is a UX improvement: the user does not see a "required" error as they begin typing. A is wrong — value is not reset. C is wrong. D is wrong — marking touched is separate from `updateOn`.',
  },
  {
    id: 97, type: 'multiple-choice', difficulty: 'senior', category: 'forms',
    question: 'How do you implement a cross-field validator that ensures `password === confirmPassword`?',
    options: [
      'Add the validator to both FormControls individually',
      'Add a validator to the FormGroup: `new FormGroup({ password, confirmPassword }, { validators: passwordMatchValidator })` — the group-level validator receives the FormGroup as its AbstractControl and can compare child control values',
      'Use a custom async validator that calls the server to verify the match',
      'Subscribe to password.valueChanges and manually set an error on confirmPassword',
    ],
    answer: 1,
    explanation: 'B is correct: group-level validators receive the `FormGroup` itself. Inside the validator: `const g = control as FormGroup; return g.get("password")?.value === g.get("confirmPassword")?.value ? null : { mismatch: true }`. This keeps the logic co-located with the group. A is wrong — individual validators cannot access sibling controls. C is wrong — server validation is unneeded for a client-side match check. D works but is imperative and error-prone.',
  },
  {
    id: 98, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What is the key difference between `FormGroup.value` and `FormGroup.getRawValue()`?',
    options: [
      'getRawValue() returns values as strings; value returns typed values',
      'value excludes disabled controls (their values are omitted); getRawValue() includes ALL controls regardless of disabled state',
      'getRawValue() triggers validation; value does not',
      'They are identical in modern Angular',
    ],
    answer: 1,
    explanation: 'B is correct: `FormGroup.value` omits any control that is `disabled` — this protects against inadvertently submitting fields the user cannot edit. `getRawValue()` returns the complete model including disabled controls. Use `getRawValue()` when you need to read a disabled field\'s value (e.g., a pre-filled user ID in a record-update form). A is wrong. C is wrong. D is wrong — they differ for disabled controls.',
  },
  {
    id: 99, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What does `AbstractControl.markAllAsTouched()` do and when is it useful?',
    options: [
      'It resets all controls to their initial value and marks them pristine',
      'It marks every control in a FormGroup (recursively including nested groups and arrays) as touched — used when the user submits a form without touching all fields to display validation errors for unvisited fields',
      'It triggers async validators on all controls simultaneously',
      'It is equivalent to calling patchValue({}) on the group',
    ],
    answer: 1,
    explanation: 'B is correct: Angular validation errors are typically shown only after `touched === true`. If a user skips required fields and hits Submit, calling `this.form.markAllAsTouched()` in the submit handler forces all error messages to appear. `markAllAsTouched()` recursively touches every control in nested `FormGroup`s and `FormArray`s. A is wrong — that is `reset()`. C is wrong. D is wrong.',
  },
  {
    id: 100, type: 'multiple-choice', difficulty: 'senior', category: 'forms',
    question: 'What is the purpose of `FormBuilder.nonNullable.group({ name: "Alice" })`?',
    options: [
      'It prevents null values from being submitted to the server',
      'Controls created via nonNullable will reset to their initial value (not null) when `reset()` is called — without it, reset() sets all controls to null by default',
      'It adds a Validators.required validator to all controls automatically',
      'It makes all controls read-only so values cannot be changed to null',
    ],
    answer: 1,
    explanation: 'B is correct: by default, `formControl.reset()` sets the value to `null`. `FormBuilder.nonNullable` (or `new FormControl("initial", { nonNullable: true })`) changes `reset()` to restore the initial value. This is critical for typed forms — `FormControl<string>` should never hold `null | string` unless intended. A is wrong — nonNullable has no effect on server submission. C is wrong — no Validators are added. D is wrong — the control is not read-only.',
  },
  {
    id: 101, type: 'spot-the-bug', difficulty: 'mid', category: 'forms',
    question: 'This async validator has a potential race condition. What is it?',
    code: `checkUsername(control: AbstractControl) {
  return this.http.get('/api/check?user=' + control.value).pipe(
    map(res => res.available ? null : { taken: true })
  );
}`,
    options: [
      'map() cannot return null — use filter() instead',
      'If the user types fast, multiple in-flight requests overlap. A later response may arrive before an earlier one, overwriting a correct "taken" error with a stale "available" result. Fix: pipe through switchMap to cancel previous requests',
      'The validator must return an Observable<ValidationErrors | null>, not an Observable from http.get()',
      'Async validators must return a Promise, not an Observable',
    ],
    answer: 1,
    explanation: 'B is correct: Angular calls the async validator on every value change (or on blur with `updateOn: "blur"`). Without debouncing and cancellation, rapid typing spawns multiple concurrent HTTP requests. If request for "ali" arrives after "alice" was already validated, the form shows stale state. Fix: wrap in `switchMap`: `return control.valueChanges.pipe(debounceTime(300), take(1), switchMap(val => http.get(...)), ...)`. The validator itself should also be debounced at the control level. A is wrong. C is wrong — http.get() returns the correct type. D is wrong — Observables are valid.',
  },
  {
    id: 102, type: 'multiple-choice', difficulty: 'junior', category: 'forms',
    question: 'Which reactive forms approach allows you to listen to all value changes in a FormGroup?',
    options: [
      'Subscribe to each FormControl\'s valueChanges individually',
      'Subscribe to `this.form.valueChanges` — it emits the current form value as an object whenever any control changes',
      'Use `(ngModelChange)` on the form tag',
      'Override `ngOnChanges` and check the form as a SimpleChange',
    ],
    answer: 1,
    explanation: 'B is correct: `FormGroup.valueChanges` is an Observable that emits the full form value object whenever any control changes. You can pipe it through `debounceTime`, `distinctUntilChanged`, etc. for autosave or preview features. A works but is verbose and misses nested changes. C is template-driven syntax and does not apply to reactive forms. D is for @Input() change detection, not form changes.',
  },
  {
    id: 103, type: 'multiple-choice', difficulty: 'senior', category: 'forms',
    question: 'What are the required methods to implement `ControlValueAccessor`?',
    options: [
      'setValue(), getValue(), validate()',
      'writeValue(), registerOnChange(), registerOnTouched() — plus the optional setDisabledState()',
      'ngModelChange(), ngModelWrite(), ngModelDisable()',
      'onChange(), onTouch(), onDisable()',
    ],
    answer: 1,
    explanation: 'B is correct: Angular calls `writeValue(val)` to push a new value into your control\'s UI; you call the function registered via `registerOnChange(fn)` to notify Angular when the user changes the value; you call the function from `registerOnTouched(fn)` when the user interacts (for touched state). `setDisabledState(isDisabled)` is optional but recommended. Provide as `NG_VALUE_ACCESSOR` with `multi: true`. A, C, D use non-existent method names.',
  },
  {
    id: 104, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What does `FormControl.statusChanges` emit?',
    options: [
      'It emits the validation error object when validation fails',
      'It emits "VALID", "INVALID", or "PENDING" whenever the control\'s status changes — useful for showing a spinner while async validation is running',
      'It emits the number of failed validators as a count',
      'It emits only when a control transitions from VALID to INVALID',
    ],
    answer: 1,
    explanation: 'B is correct: `control.statusChanges` is an Observable<FormControlStatus> emitting `"VALID"`, `"INVALID"`, `"PENDING"`, or `"DISABLED"` on every status transition. The `"PENDING"` state is particularly useful: subscribe and show a spinner while async validators are in flight. A is wrong — that is `control.errors`. C is wrong. D is wrong — it emits on every transition, not just VALID→INVALID.',
  },
  {
    id: 105, type: 'multiple-choice', difficulty: 'senior', category: 'forms',
    question: 'What is the benefit of the typed Reactive Forms API (`FormGroup<{ name: FormControl<string> }>`) introduced in Angular 14?',
    options: [
      'It automatically adds Validators.required to all fields',
      'FormGroup.value and control.value are fully typed — TypeScript knows the type of each field, catching errors like accessing a non-existent control name at compile time',
      'It enables two-way binding between FormGroup and an interface directly',
      'Typed forms automatically serialize to JSON for server submission',
    ],
    answer: 1,
    explanation: 'B is correct: before typed forms, `form.get("name")?.value` returned `any`. With typed forms, `this.form.controls.name.value` is `string` — TypeScript catches typos in control names and type mismatches at compile time. This dramatically reduces runtime errors in large forms. A is wrong. C is wrong — reactive forms are still explicitly wired. D is wrong — serialization is unchanged.',
  },
  {
    id: 106, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'How do you dynamically add a control to a FormGroup at runtime?',
    options: [
      'this.form.controls["newField"] = new FormControl("")',
      'this.form.addControl("newField", new FormControl(""))',
      'this.form.push(new FormControl(""))',
      'this.form.patch({ newField: new FormControl("") })',
    ],
    answer: 1,
    explanation: 'B is correct: `FormGroup.addControl(name, control)` registers the control and triggers valueChanges/statusChanges. A is wrong — directly assigning to `.controls` bypasses Angular\'s internal bookkeeping; the form model does not update properly. C is wrong — `push` is the `FormArray` method. D is wrong — `patchValue` updates values, not structure.',
  },
  {
    id: 107, type: 'multiple-choice', difficulty: 'junior', category: 'forms',
    question: 'What is the difference between `form.setValue()` and `form.patchValue()`?',
    options: [
      'setValue() triggers validation; patchValue() bypasses validators',
      'setValue() is strict — every key in the FormGroup must be provided or it throws; patchValue() is lenient — only provided keys are updated, missing keys are ignored',
      'patchValue() only works on FormArray; setValue() is for FormGroup',
      'They are identical in behaviour and output',
    ],
    answer: 1,
    explanation: 'B is correct: `setValue()` requires an object with a key for EVERY control in the group — omitting any key throws "Must supply a value for form control with name: X". `patchValue()` only updates the controls whose keys are present in the object; unspecified controls retain their current value. Use `setValue()` for full model replacement; `patchValue()` for partial updates (e.g., pre-filling only some fields from an API response). A is wrong — both trigger validation. C is wrong. D is wrong.',
  },
  {
    id: 108, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'How do you add a validator to a `FormControl` after it has been created?',
    options: [
      'control.validators.push(Validators.required)',
      'control.addValidators(Validators.minLength(5)) followed by control.updateValueAndValidity()',
      'control.setValidators() replaces and addValidators() appends — call updateValueAndValidity() after either to re-run validation',
      'Both B and C are correct — B describes addValidators, C clarifies the full picture',
    ],
    answer: 3,
    explanation: 'D is correct: `addValidators(v)` appends without removing existing validators; `setValidators(v)` replaces all validators. In both cases you MUST call `control.updateValueAndValidity()` afterwards to re-trigger validation with the new set of validators. A is wrong — validators is not a public mutable array. B alone is incomplete (misses updateValueAndValidity). C alone is the explanation. D captures the complete picture.',
  },

  // ─── ROUTING 109-120 ──────────────────────────────────────────────────────────
  {
    id: 109, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'How do you define a child route in Angular?',
    options: [
      'Add a second { path: } entry with a "/" prefix',
      'Use the `children: []` property on a parent route — the parent component must have a `<router-outlet>` for children to render into',
      'Nest `<router-outlet>` elements in the template without any config',
      'Use `parentRoute.addChild(childRoute)` at runtime',
    ],
    answer: 1,
    explanation: 'B is correct: `{ path: "admin", component: AdminLayout, children: [{ path: "users", component: UsersPage }] }`. The parent `AdminLayout` template must contain `<router-outlet>` — that is where the child renders. Navigating to `/admin/users` renders `AdminLayout` in the root outlet and `UsersPage` in the nested outlet. A is wrong — "/" prefix in children creates absolute paths. C is wrong — outlets need routes configured. D is wrong — no runtime `addChild` API.',
  },
  {
    id: 110, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'How do you navigate to `/products/42?sort=price#reviews` programmatically?',
    options: [
      'router.navigate(["/products/42?sort=price#reviews"])',
      'router.navigate(["/products", 42], { queryParams: { sort: "price" }, fragment: "reviews" })',
      'router.navigateByUrl("/products/42", { queryParams: { sort: "price" } })',
      'router.go("/products/42?sort=price#reviews")',
    ],
    answer: 1,
    explanation: 'B is correct: `router.navigate(["/products", 42], { queryParams: { sort: "price" }, fragment: "reviews" })` is the clean, structured way. A is wrong — putting the full URL string inside the array and including query/fragment there is incorrect syntax. C is wrong — `navigateByUrl` takes a full URL string as the first arg; query params cannot be in extras. D is wrong — no `router.go()` method exists.',
  },
  {
    id: 111, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'What is the difference between `route.snapshot.paramMap.get("id")` and `route.paramMap.pipe(map(m => m.get("id")))`?',
    options: [
      'snapshot only works for the first navigation; paramMap observable works for all navigations',
      'snapshot is a single read of the current params — it does not update if params change without recreating the component. paramMap is an Observable that emits whenever params change (e.g., navigating from /users/1 to /users/2 with the same component instance)',
      'They are identical — use snapshot for performance in production',
      'paramMap Observable is only available in Angular 16+ with withComponentInputBinding()',
    ],
    answer: 1,
    explanation: 'B is correct: when Angular reuses a component instance for a param change (e.g., navigating between /products/1 and /products/2), `snapshot` is stale — it reflects the params from the initial activation. `paramMap` Observable emits on every change. With `withComponentInputBinding()` you can skip `ActivatedRoute` entirely and receive params as signal inputs. A is partially true but imprecise. C is wrong. D is wrong — paramMap Observable has existed since Angular 4.',
  },
  {
    id: 112, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'What does `{ path: "**", component: NotFoundPage }` do in a route config?',
    options: [
      'It matches all routes and is used as the default/home page',
      'It is a wildcard that matches any URL not matched by preceding routes — used for 404 pages. Must be the LAST route in the array',
      'It matches all routes that start with double asterisks',
      'It enables regex-based route matching',
    ],
    answer: 1,
    explanation: 'B is correct: `**` is the catch-all wildcard — it matches any URL. Because Angular\'s router tries routes in order, placing `**` last ensures all specific routes are checked first. If placed first, it would capture every navigation. A is wrong — use `path: ""` for home/default. C is wrong — `**` does not require a literal `**` in the URL. D is wrong — regex routing uses a different API.',
  },
  {
    id: 113, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'How do you listen to all navigation events (start, end, error) for analytics?',
    options: [
      'Override ngOnInit in AppComponent and call router.getCurrentNavigation()',
      'Subscribe to `router.events` and filter with the NavigationStart, NavigationEnd, NavigationError event classes',
      'Use the window.history API to listen for popstate events',
      'Add a RouterInterceptor to the providers array',
    ],
    answer: 1,
    explanation: 'B is correct: `this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(...)` is the canonical pattern. `Router.events` is a hot Observable that emits `NavigationStart`, `RouteConfigLoadStart`, `RoutesRecognized`, `NavigationEnd`, `NavigationCancel`, `NavigationError`, etc. Use it for page view tracking, loading indicators, or scroll restoration. A gives only the current navigation snapshot. C is lower-level and misses Angular-specific events. D is wrong — no RouterInterceptor exists.',
  },
  {
    id: 114, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'What does `RouterLink` with `[routerLinkActive]="\'active\'"` add to the element?',
    options: [
      'It adds the Angular-generated attribute selector to the element for encapsulation',
      'It adds the CSS class "active" to the element when the current URL matches (or starts with) the linked route — useful for nav menu highlighting',
      'It disables the link when the route is active to prevent self-navigation',
      'It only applies to elements where `routerLink` points to an exact URL match',
    ],
    answer: 1,
    explanation: 'B is correct: `routerLinkActive` dynamically adds/removes a CSS class based on whether the current route matches. By default it matches prefix — `/products/123` also activates a link to `/products`. Use `[routerLinkActiveOptions]="{ exact: true }"` for exact matching. A is wrong — that is View Encapsulation. C is wrong — the link remains clickable. D is wrong — prefix matching is the default.',
  },
  {
    id: 115, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'What is the execution order when navigating to a route with both `canMatch` and `canActivate` guards?',
    options: [
      'canActivate runs first, then canMatch',
      'canMatch runs first (route selection phase). If it returns true, canActivate runs (activation phase). canMatch false skips the route entirely; canActivate false blocks it',
      'They run in parallel',
      'The order depends on the order they appear in the route config',
    ],
    answer: 1,
    explanation: 'B is correct: Angular\'s navigation pipeline is: (1) Route matching — `canMatch` guards run here to decide which route definition to use. (2) Route activation — `canActivate`, `canActivateChild`, and resolvers run here. `canMatch` returning false means this route is not considered at all and the router tries the next definition for the same URL. `canActivate` returning false blocks access but the route WAS matched. A reverses the order. C is wrong. D is wrong.',
  },
  {
    id: 116, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'How do you pass static data to a component via a route?',
    options: [
      'Use a query parameter: `/page?title=Home`',
      'Use the `data` property in the route config: `{ path: "home", component: HomePage, data: { title: "Home" } }` — access it via `route.snapshot.data["title"]` or as an input with `withComponentInputBinding()`',
      'Add a resolve function that returns a static object',
      'Pass it as a route path parameter: `/page/Home`',
    ],
    answer: 1,
    explanation: 'B is correct: the `data` property holds arbitrary static values attached to a route. Unlike `resolve`, no async loading occurs — the data is available immediately in `route.snapshot.data`. Use it for page titles, breadcrumb labels, or permission keys. A is visible in the URL and must be parsed. C works but adds unnecessary async overhead for static data. D encodes data in the URL which changes routing structure.',
  },
  {
    id: 117, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'What does `<router-outlet name="sidebar">` do?',
    options: [
      'It creates a sidebar CSS layout next to the main outlet',
      'It creates a named auxiliary outlet — routes can target it with `{ outlets: { sidebar: ["help"] } }` to render a second independent component alongside the primary outlet',
      'It disables the default router-outlet and replaces it with a custom implementation',
      'Named outlets are deprecated — use multiple primary outlets instead',
    ],
    answer: 1,
    explanation: 'B is correct: auxiliary (named) outlets allow multiple independent route sections on the same page. Navigate to them with `router.navigate([{ outlets: { sidebar: ["help"] } }])` or `[routerLink]="[{ outlets: { sidebar: [\'help\'] } }]"`. They appear in the URL as `(sidebar:help)`. Use them for side panels, notifications, or modals driven by the URL. A is wrong — it is not a CSS layout. C is wrong. D is wrong — named outlets are a supported feature.',
  },
  {
    id: 118, type: 'multiple-choice', difficulty: 'senior', category: 'routing',
    question: 'How do you implement a custom preloading strategy to preload only routes with `data: { preload: true }`?',
    options: [
      'Set `preloadingStrategy: PreloadAllModules` and use route guards to skip unwanted routes',
      'Create a class implementing `PreloadingStrategy` with a `preload(route, load)` method that calls `load()` only when `route.data?.["preload"]` is true, otherwise returns `of(null)`, then provide it in `withPreloading(CustomStrategy)`',
      'Add `lazy: "eager"` to the routes you want preloaded in the route config',
      'Custom preloading is not supported — only PreloadAllModules or NoPreloading exist',
    ],
    answer: 1,
    explanation: 'B is correct: implement `PreloadingStrategy.preload(route, load): Observable<unknown>`. Return `load()` to preload, `of(null)` to skip. Provide it: `provideRouter(routes, withPreloading(CustomStrategy))`. This lets you be selective — preload priority routes after the critical path loads. A is wrong — guards do not affect preloading. C is wrong — no `lazy: "eager"` property exists. D is wrong — custom strategies are officially supported.',
  },
  {
    id: 119, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'What does `router.navigate(["../sibling"], { relativeTo: this.route })` do?',
    options: [
      'Navigates to a sibling route — "../" goes up one level in the route tree, then "sibling" selects the target route',
      'Navigates to the root and then finds the "sibling" route',
      'Navigates backwards in browser history by one step',
      '../ is invalid in Angular navigation arrays',
    ],
    answer: 0,
    explanation: 'A is correct: relative navigation with `relativeTo: this.route` treats the URL like a file path. `["../sibling"]` navigates up one route level (out of the current route) then into "sibling". Without `relativeTo`, the path is interpreted as absolute. This is essential in feature modules where routes should not hardcode absolute paths. B is wrong. C is wrong — use `location.back()` for browser history. D is wrong — relative paths are fully supported.',
  },
  {
    id: 120, type: 'multiple-choice', difficulty: 'senior', category: 'routing',
    question: 'What is `NavigationExtras.skipLocationChange` and when would you use it?',
    options: [
      'It prevents the router from updating the browser\'s URL during navigation — the component changes but the URL stays the same',
      'It skips the canDeactivate guard for the current component',
      'It prevents adding the new URL to the browser\'s history stack (replaceState instead of pushState)',
      'It causes navigation to skip all guards and resolvers',
    ],
    answer: 0,
    explanation: 'A is correct: `router.navigate(["/internal"], { skipLocationChange: true })` navigates to a route and renders its component without updating the URL in the address bar. The browser back button goes to the previous URL. Use it for internal redirects, modal-like navigation where the URL should not change, or wizard steps you do not want bookmarked. C describes `replaceUrl: true`. B and D are wrong.',
  },

  // ─── TESTING 121-132 ──────────────────────────────────────────────────────────
  {
    id: 121, type: 'multiple-choice', difficulty: 'junior', category: 'testing',
    question: 'What does `TestBed.inject(MyService)` return?',
    options: [
      'A new instance of MyService created outside Angular\'s DI',
      'The same instance of MyService that components under test will receive from Angular\'s DI — the singleton from the test injector',
      'A Jest/Jasmine mock of MyService',
      'It throws — services must be accessed via the component fixture',
    ],
    answer: 1,
    explanation: 'B is correct: `TestBed.inject(Token)` retrieves the instance from the test module\'s injector — the same instance that will be injected into tested components. This lets you call service methods directly to set up state or verify calls. A is wrong — it uses the DI system, not `new`. C is wrong — it returns the real (or provided mock) service. D is wrong.',
  },
  {
    id: 122, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'How do you set an `@Input()` binding on a component in a TestBed test?',
    options: [
      'fixture.componentInstance.myInput = value; then fixture.detectChanges()',
      'TestBed.configureTestingModule({ inputs: { myInput: value } })',
      'fixture.setInput("myInput", value) — Angular 14+ API that also triggers change detection',
      'Both A and C are correct',
    ],
    answer: 3,
    explanation: 'D is correct: both approaches work. A (`fixture.componentInstance.myInput = value` followed by `fixture.detectChanges()`) is the classic approach — manually set the property and trigger detection. C (`fixture.setInput("myInput", value)`) is the Angular 14+ helper that sets the property AND triggers detection in one call. Additionally it properly handles required signal inputs. B is wrong — no such TestBed config option exists.',
  },
  {
    id: 123, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'What is the difference between `DebugElement.triggerEventHandler("click", event)` and `nativeElement.click()`?',
    options: [
      'nativeElement.click() is always preferred for accuracy; triggerEventHandler is legacy',
      'nativeElement.click() fires real browser events that bubble and propagate; triggerEventHandler fires the Angular event binding directly without a real browser event — useful for testing event handlers with custom event objects or when click() does not trigger Angular bindings',
      'triggerEventHandler works only with (click) bindings; nativeElement.click() works with any event',
      'They are identical in a jsdom testing environment',
    ],
    answer: 1,
    explanation: 'B is correct: `nativeElement.click()` dispatches a native browser event — it bubbles, it can be observed with addEventListener, but in a jsdom test environment it may not trigger Angular bindings reliably for all event types. `triggerEventHandler("click", mockEvent)` directly invokes the Angular event handler registered via `(click)="..."` — it is more reliable for unit testing and lets you pass a synthetic event object. A is wrong. C is wrong. D is wrong.',
  },
  {
    id: 124, type: 'multiple-choice', difficulty: 'junior', category: 'testing',
    question: 'In a unit test using `HttpClientTestingModule`, why do you call `httpMock.verify()` in `afterEach`?',
    options: [
      'To reset the HTTP client between tests',
      'To assert that no unexpected HTTP requests were made — if a test leaves unflushed requests the next test may be contaminated; verify() fails if any requests are outstanding',
      'To flush all pending requests with a 200 OK response automatically',
      'verify() is only needed when testing error scenarios',
    ],
    answer: 1,
    explanation: 'B is correct: `HttpTestingController.verify()` checks that no outstanding (unflushed) requests remain after the test. Unflushed requests from one test can bleed into the next if not cleaned up. A failing `verify()` is a signal that your test triggered an HTTP call you did not account for. A is wrong — the mock is reset by TestBed teardown. C is wrong — requests are flushed manually with `expectOne().flush()`. D is wrong — verify() should always be called.',
  },
  {
    id: 125, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'How do you test that a component method called `this.router.navigate(["/home"])` actually navigates?',
    options: [
      'Import RouterModule and check window.location.href',
      'Provide a `RouterTestingHarness` or spy on `router.navigate`: `const spy = spyOn(router, "navigate")`, then assert `expect(spy).toHaveBeenCalledWith(["/home"])`',
      'Use fakeAsync and tick() to flush the navigation',
      'Call fixture.detectChanges() and check the DOM for router-outlet changes',
    ],
    answer: 1,
    explanation: 'B is correct: for unit tests, spy on `router.navigate` with `jasmine.createSpy()` or `spyOn()`. No real navigation occurs — just verify the correct arguments were passed. For integration tests use `RouterTestingHarness` (Angular 15+) which renders the actual routed component. A is wrong — `window.location` does not change in unit tests. C is wrong — faking time does not help verify navigation. D is wrong — router-outlet does not render in simple unit tests without full router setup.',
  },
  {
    id: 126, type: 'spot-the-bug', difficulty: 'mid', category: 'testing',
    question: 'What is wrong with this test?',
    code: `it('should show user name', () => {
  const fixture = TestBed.createComponent(ProfileComponent);
  expect(fixture.nativeElement.textContent).toContain('Alice');
});`,
    options: [
      'TestBed.createComponent() must be called inside beforeEach, not inside it()',
      'fixture.detectChanges() is never called — Angular does not run initial change detection automatically in tests, so the template has not rendered yet when the assertion runs',
      'textContent returns an array in jsdom, not a string',
      'The component must implement OnInit for textContent to be populated',
    ],
    answer: 1,
    explanation: 'B is correct: Angular does NOT run change detection automatically when you call `createComponent()`. The template is compiled but not rendered until `fixture.detectChanges()` is called. Without it, `textContent` is empty or stale. Always call `detectChanges()` at least once before asserting DOM state. A is wrong — createComponent() inside `it()` is valid. C is wrong — textContent is a string. D is wrong — OnInit is called during detectChanges.',
  },
  {
    id: 127, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'What does `NO_ERRORS_SCHEMA` do in a TestBed configuration?',
    options: [
      'It prevents all error messages from appearing in the test output',
      'It tells Angular to ignore unknown elements and attributes in templates — enabling shallow rendering where child components are not compiled or imported',
      'It disables form validation for the duration of the test',
      'It makes all HTTP errors return 200 OK instead of throwing',
    ],
    answer: 1,
    explanation: 'B is correct: `schemas: [NO_ERRORS_SCHEMA]` suppresses "unknown element" and "unknown property" errors in tests. Child components become empty placeholders — they do not need to be imported or declared. This enables fast, isolated unit tests for a single component\'s logic. The trade-off: you miss integration bugs where a child input name was renamed. Use `CUSTOM_ELEMENTS_SCHEMA` if you only want to silence custom element warnings. A, C, D are all wrong.',
  },
  {
    id: 128, type: 'multiple-choice', difficulty: 'junior', category: 'testing',
    question: 'You need to test a custom pipe. What is the simplest approach?',
    options: [
      'Configure a full TestBed with the pipe declared and test via a component fixture',
      'Instantiate the pipe class directly with `new MyPipe()` and call `transform()` — pipes are pure TypeScript classes and do not need TestBed for unit testing',
      'Use Jasmine\'s `createSpy()` to mock the pipe\'s transform method',
      'Pipes cannot be unit tested — only integration tested via their host component',
    ],
    answer: 1,
    explanation: 'B is correct: a pure standalone pipe is a simple class — `const pipe = new TruncatePipe(); expect(pipe.transform("hello world", 5)).toBe("hello...")`. No TestBed needed. This is the fastest type of unit test in Angular. If the pipe has dependencies (injected services), you can either inject them via TestBed or mock them manually. A works but is heavier than necessary for a pure pipe. C is for mocking, not testing. D is wrong.',
  },
  {
    id: 129, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'How do you test a component that uses `resource()` to fetch data?',
    options: [
      'Use HttpClientTestingModule and flush requests normally',
      'Provide a test double for the resource loader via component providers, or use provideHttpClientTesting() with TestBed and flush the underlying HTTP requests that resource() makes internally',
      'resource() cannot be tested — mock the service that wraps it instead',
      'Wrap the test in fakeAsync() and tick() to wait for the resource to resolve',
    ],
    answer: 1,
    explanation: 'B is correct: `resource()` uses `HttpClient` internally when given an HTTP loader (via `rxResource()`). With `provideHttpClientTesting()`, the `HttpTestingController` intercepts requests made by the resource. Flush them: `httpMock.expectOne("/api/data").flush(mockData)`, then call `fixture.detectChanges()` to re-render with the resolved value. Alternatively, provide a custom loader function in tests that returns a resolved Promise directly. A is close but misses the explicit flushing step. D is wrong — resource() is not purely time-based.',
  },
  {
    id: 130, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'What is the advantage of `ComponentFixture.whenStable()` over using `tick()` in `fakeAsync()`?',
    options: [
      'whenStable() is faster because it does not use fake timers',
      'whenStable() returns a Promise that resolves when all pending async tasks have completed — it works in regular async tests without needing fakeAsync; tick() requires fakeAsync and advances virtual time',
      'whenStable() also flushes HTTP requests; tick() does not',
      'They are interchangeable — choose based on team preference',
    ],
    answer: 1,
    explanation: 'B is correct: `await fixture.whenStable()` works in `async` tests (using `async/await`) and waits for Angular\'s task queue (Promises, microtasks, change detection) to drain. `tick()` is only available inside `fakeAsync()` and advances virtual time. Use `whenStable()` when you prefer `async/await` syntax or when the exact time does not matter; use `fakeAsync + tick()` for time-sensitive tests with debounces or delays. A is wrong — whenStable uses the real microtask queue. C is wrong.',
  },
  {
    id: 131, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'You want to provide a mock for `AuthService` in a test. Which approach correctly replaces it in DI?',
    options: [
      'import { AuthService } from "./auth.service"; const mock = {}; // no DI needed',
      'TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: mockAuthService }] })',
      'TestBed.configureTestingModule({ declarations: [AuthService] })',
      'Override AuthService globally with jest.mock("./auth.service")',
    ],
    answer: 1,
    explanation: 'B is correct: `{ provide: AuthService, useValue: mockAuthService }` replaces the real service in the test injector. Any component that injects `AuthService` receives your mock. `mockAuthService` can be a jasmine spy object: `jasmine.createSpyObj("AuthService", ["login", "logout"])`. A does not replace it in DI. C is wrong — declarations is for components/pipes/directives. D mocks the module but does not integrate with Angular DI.',
  },
  {
    id: 132, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'What is the purpose of `fakeAsync()` + `flush()` vs `fakeAsync()` + `tick(500)`?',
    options: [
      'flush() is faster; tick() is more accurate',
      'tick(500) advances virtual time by exactly 500ms; flush() drains ALL pending macro-tasks regardless of their scheduled time — useful when you do not care about exact timing and just want everything to complete',
      'flush() only flushes Promises; tick() flushes both Promises and timers',
      'They are identical — flush() is just shorthand for tick(Number.MAX_SAFE_INTEGER)',
    ],
    answer: 1,
    explanation: 'B is correct: `tick(ms)` precisely advances the virtual clock by the specified milliseconds — useful for debounce/throttle time assertions. `flush()` exhausts all pending macro-tasks (setTimeout, setInterval) in one go without specifying time — useful when you just need "everything done" without caring about precise timing. A is wrong. C is wrong — both handle both. D is wrong — they are conceptually different tools.',
  },

  // ─── PERFORMANCE 133-142 ──────────────────────────────────────────────────────
  {
    id: 133, type: 'multiple-choice', difficulty: 'junior', category: 'performance',
    question: 'What does adding `priority` to `NgOptimizedImage` do?',
    options: [
      'It boosts the image\'s z-index so it renders above other elements',
      'It adds `fetchpriority="high"` and `preload` link hints for the image — telling the browser to download this image as soon as possible, improving Largest Contentful Paint (LCP) for above-the-fold hero images',
      'It caches the image in the service worker permanently',
      'It prevents lazy loading — the image loads on initial page parse',
    ],
    answer: 1,
    explanation: 'B is correct: marking an image as `priority` with `NgOptimizedImage` (`<img ngSrc="hero.jpg" priority>`) injects a `<link rel="preload">` tag and sets `fetchpriority="high"` on the `<img>`. This instructs the browser to download the image at the highest priority, critical for LCP images. Angular also warns if a large above-the-fold image is missing the `priority` attribute. A is wrong — no z-index change. C is wrong. D is close but B is the full correct answer.',
  },
  {
    id: 134, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'Why does using `@defer (on idle)` for a heavy chart component improve performance?',
    options: [
      'It compresses the chart component\'s bundle at runtime',
      'The chart component and its dependencies are excluded from the initial JS bundle. They download as a separate chunk only when the browser is idle — reducing initial parse/execute time, improving Time to Interactive (TTI) and LCP',
      'The chart renders in a Web Worker, keeping the main thread free',
      'It caches the chart data in IndexedDB for offline use',
    ],
    answer: 1,
    explanation: 'B is correct: `@defer` creates code-split points at build time. The chart library (potentially hundreds of KB) is not included in the initial bundle and is not parsed or executed until the trigger fires (here: browser idle time, via `requestIdleCallback`). This directly improves TTI because the main thread is free from parsing a large chart library during startup. A, C, D are incorrect descriptions.',
  },
  {
    id: 135, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'What is the `track` expression in `@for` and why does it matter for performance?',
    options: [
      'It is a CSS selector that tracks which items to animate',
      'track provides a stable identity key for each item. When the array changes, Angular uses it to reuse existing DOM nodes rather than destroying and recreating them — critical for large lists and list animations',
      'It limits rendering to only the tracked items',
      'track is only needed when using animations — without it @for still performs efficiently',
    ],
    answer: 1,
    explanation: 'B is correct: without `track`, Angular has no way to match old DOM nodes to new data items when the list changes — it destroys and recreates every element. With `track item.id`, Angular identifies which items are new, moved, or removed and surgically updates only those parts. For a 1000-item list where 1 item is added, `track` means one insertion instead of 1000 re-renders. A, C, D are all wrong.',
  },
  {
    id: 136, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'How do you enable Angular\'s virtual scrolling for a large list?',
    options: [
      'Add `overflow: auto; height: 300px` CSS to the list container',
      'Use `CdkVirtualScrollViewport` from `@angular/cdk/scrolling` with `itemSize` — it renders only the items currently visible in the viewport, recycling DOM nodes as the user scrolls',
      'Set `*ngFor` with `trackBy` and `[limit]="20"` to only show 20 items',
      'Virtual scrolling is built into `@for` — no extra package needed',
    ],
    answer: 1,
    explanation: 'B is correct: `<cdk-virtual-scroll-viewport itemSize="50" style="height: 400px"><div *cdkVirtualFor="let item of items">...</div></cdk-virtual-scroll-viewport>`. The CDK only renders the visible items plus a small buffer, keeping the DOM to ~20 nodes regardless of list size. A is CSS overflow scrolling — all DOM nodes are still rendered. C is wrong — `*ngFor` has no `[limit]`. D is wrong.',
  },
  {
    id: 137, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'How do you analyse which third-party packages are contributing most to your Angular bundle size?',
    options: [
      'Run `ng build --verbose` and check the console output',
      'Run `ng build --stats-json` to generate a webpack stats file, then open it with `webpack-bundle-analyzer` (npx webpack-bundle-analyzer dist/.../stats.json) to see a visual treemap of every module and its size',
      'Check the `dist/` folder sizes after build',
      'Use the Network tab in DevTools and multiply by compression ratio',
    ],
    answer: 1,
    explanation: 'B is correct: `webpack-bundle-analyzer` (or `source-map-explorer`) parses the stats file and shows an interactive treemap where larger rectangles = larger bundle contributions. You can see which imports are duplicated, which libraries are unexpectedly large, and which tree-shaking opportunities exist. A gives verbose chunk info but not per-module breakdown. C gives total sizes but not granular insight. D is indirect and inaccurate.',
  },
  {
    id: 138, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'What is the purpose of `isPlatformBrowser(this.platformId)` in an Angular component?',
    options: [
      'It checks if the app is running in a Chromium-based browser',
      'It guards browser-only APIs (localStorage, window, document, IntersectionObserver) from running during Server-Side Rendering — on the server, these globals do not exist and calling them would crash the SSR render',
      'It detects if the app is installed as a PWA',
      'It is required before using any Angular DI service',
    ],
    answer: 1,
    explanation: 'B is correct: during SSR, Angular runs in Node.js where browser globals like `window`, `localStorage`, and `document` do not exist. `isPlatformBrowser(platformId)` (where `platformId = inject(PLATFORM_ID)`) returns `true` only in the browser. Wrap browser-only code: `if (isPlatformBrowser(this.platformId)) { localStorage.setItem(...) }`. A is wrong — it detects browser vs server, not browser type. C and D are wrong.',
  },
  {
    id: 139, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'What causes "Change Detection running N times per second" and how do you diagnose it?',
    options: [
      'Enable zone.js debug mode and it shows the source of each trigger',
      'Open Angular DevTools Profiler — it shows change detection cycles, their duration, and which components triggered them. Common causes: untracked setInterval/setTimeout in Zone.js apps, WebSocket message handlers, or infinite effect chains',
      'Add console.log to ngDoCheck on every component',
      'Run lighthouse in CI — it reports excessive change detection as a performance issue',
    ],
    answer: 1,
    explanation: 'B is correct: Angular DevTools (Chrome extension) Profiler records change detection cycles frame by frame, showing which components are re-rendered and why. Common causes in Zone.js apps: `setInterval` not cleaned up (fires CD every tick), `requestAnimationFrame` callbacks, WebSocket messages, or a third-party library that triggers browser events. In signals-based apps, an `effect()` that sets a signal which triggers another effect is a common cause. A and C are partial workarounds. D is wrong.',
  },
  {
    id: 140, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'What does `@defer (when isLoaded())` do?',
    options: [
      'It defers the block until `isLoaded` emits true via an Observable',
      'It renders the deferred block once the boolean expression `isLoaded()` evaluates to true — the condition is checked reactively on every change detection cycle until it becomes true',
      'It downloads the deferred chunk when isLoaded is called as a function',
      'when() requires a Promise — use on() for synchronous conditions',
    ],
    answer: 1,
    explanation: 'B is correct: `@defer (when condition)` accepts any boolean expression. Angular re-evaluates it each change detection cycle. Once it becomes `true`, the deferred block\'s JavaScript chunk is downloaded and rendered. If the condition starts as `true`, the block renders immediately after the chunk loads. The parentheses call `isLoaded()` as a signal — this is a common pattern. A is wrong — it takes a boolean, not an Observable. C is wrong. D is wrong.',
  },
  {
    id: 141, type: 'multiple-choice', difficulty: 'junior', category: 'performance',
    question: 'What does the `loading="lazy"` attribute on `<img>` do vs Angular\'s `NgOptimizedImage`?',
    options: [
      'They are identical — NgOptimizedImage just adds the loading="lazy" attribute',
      'Both defer image loading until the image is near the viewport, but NgOptimizedImage also provides: automatic srcset generation, size validation warnings, LCP priority hints, built-in placeholder blur, and format optimisation — significantly more than the native attribute alone',
      'loading="lazy" uses IntersectionObserver; NgOptimizedImage uses a service worker',
      'NgOptimizedImage is only for background images; loading="lazy" is for inline <img>',
    ],
    answer: 1,
    explanation: 'B is correct: native `loading="lazy"` is a single browser hint. `NgOptimizedImage` wraps it plus: automatic `srcset`/`sizes` generation for responsive images, `width`/`height` requirement (preventing CLS), `fill` mode for fluid images, priority/preload management, image CDN loader support, and dev-time warnings. Use NgOptimizedImage in Angular projects for the full set of optimisations. A is wrong. C is wrong. D is wrong.',
  },
  {
    id: 142, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'When should you use `ChangeDetectorRef.detach()` on a component?',
    options: [
      'When the component is inside an *ngIf to prevent double detection',
      'For components that display only occasionally-changing data from an external source — detach removes the component from Angular\'s automatic change detection tree; you manually call detectChanges() only when data actually changes, reducing CD overhead',
      'When using OnPush — detach is required for OnPush to work',
      'After every async operation to prevent memory leaks',
    ],
    answer: 1,
    explanation: 'B is correct: `cdr.detach()` disconnects a component from the change detection tree entirely. Angular skips it completely during every global CD cycle. You call `cdr.detectChanges()` only when you know data changed — e.g., in a WebSocket handler or a `requestAnimationFrame` callback. This is the most aggressive CD optimisation, useful for high-frequency data visualisations (stock tickers, live charts). A is wrong. C is wrong — OnPush still participates in CD. D is wrong.',
  },

  // ─── TYPESCRIPT 143-150 ──────────────────────────────────────────────────────
  {
    id: 143, type: 'multiple-choice', difficulty: 'junior', category: 'typescript',
    question: 'What does the `Partial<User>` utility type do?',
    options: [
      'It creates a new type with only the first half of User\'s properties',
      'It makes all properties of User optional (adds `?` to each) — useful for update/patch payloads where only some fields are provided',
      'It removes all optional properties from User, leaving only required ones',
      'It is equivalent to User | undefined',
    ],
    answer: 1,
    explanation: 'B is correct: `Partial<T>` maps every property of `T` to `T[K] | undefined` with `?`. Example: `Partial<{ name: string; age: number }>` becomes `{ name?: string; age?: number }`. Perfect for PATCH request payloads or update functions where you only supply changed fields. A is wrong. C describes `Required<T>` (removes ?). D is wrong.',
  },
  {
    id: 144, type: 'multiple-choice', difficulty: 'mid', category: 'typescript',
    question: 'What is the difference between `Pick<User, "name" | "email">` and `Omit<User, "password">`?',
    options: [
      'Pick selects named properties to keep; Omit selects named properties to exclude — they produce the same result when the excluded set equals the full set minus the picked set',
      'Pick only works on interfaces; Omit works on classes',
      'Omit is deprecated — always use Pick instead',
      'They are identical when used on the same set of properties',
    ],
    answer: 0,
    explanation: 'A is correct: `Pick<User, "name" | "email">` creates a type with ONLY `name` and `email`. `Omit<User, "password">` creates a type with all User properties EXCEPT `password`. They can produce the same result but from opposite directions. Use `Pick` when you know exactly which properties you want; use `Omit` when you want most properties minus a few sensitive ones (like password). B is wrong. C is wrong. D is wrong in general.',
  },
  {
    id: 145, type: 'predict-output', difficulty: 'mid', category: 'typescript',
    question: 'What is the type of `config` after this code?',
    code: `const config = {
  host: 'localhost',
  port: 3000,
} as const;`,
    options: [
      '{ host: string; port: number }',
      '{ readonly host: "localhost"; readonly port: 3000 }',
      'Readonly<{ host: string; port: number }>',
      'The code throws — as const cannot be used on object literals',
    ],
    answer: 1,
    explanation: 'B is correct: `as const` creates a deeply readonly type where each value is narrowed to its literal type — `"localhost"` not `string`, `3000` not `number`. This prevents accidental mutation and enables exhaustive type checking. A is the widened type without `as const`. C is wrong — `Readonly<>` makes properties readonly but does not narrow to literal types. D is wrong.',
  },
  {
    id: 146, type: 'multiple-choice', difficulty: 'mid', category: 'typescript',
    question: 'What does the TypeScript `keyof typeof` pattern do?',
    options: [
      'typeof extracts the type of a value; keyof gets the union of all property names of that type — together they create a string union of an object\'s keys',
      'It is equivalent to Object.keys() at runtime',
      'typeof gets the TypeScript class; keyof lists its method names',
      'They are separate operators that cannot be chained',
    ],
    answer: 0,
    explanation: 'A is correct: `const Colors = { RED: "#f00", GREEN: "#0f0" } as const; type ColorKey = keyof typeof Colors` produces `"RED" | "GREEN"`. `typeof Colors` gets the type of the object; `keyof` extracts the union of its keys. This is used extensively for typed dictionaries, enum-like objects, and Angular `@Input` validators. B is wrong — it is a type operation, not runtime. C is wrong. D is wrong.',
  },
  {
    id: 147, type: 'multiple-choice', difficulty: 'mid', category: 'typescript',
    question: 'What does `function wrap<T extends object>(val: T): T` guarantee about `T`?',
    options: [
      'T must be a class instance, not a plain object literal',
      'T extends object constrains T to any non-primitive type — T can be an object, array, or function, but not string, number, boolean, null, or undefined',
      'T must implement a specific interface named "object"',
      'T is guaranteed to have at least one property',
    ],
    answer: 1,
    explanation: 'B is correct: `T extends object` in TypeScript means T must be assignable to the `object` type — i.e., any non-primitive (not string, number, boolean, bigint, symbol, null, undefined). This is useful when you need to use `Object.keys(val)` safely inside the function. A is wrong — plain object literals `{}` satisfy `extends object`. C is wrong. D is wrong — `{}` with no properties satisfies the constraint.',
  },
  {
    id: 148, type: 'multiple-choice', difficulty: 'senior', category: 'typescript',
    question: 'What does `type IsString<T> = T extends string ? "yes" : "no"` evaluate to for `IsString<"hello">` vs `IsString<number>`?',
    options: [
      'Both evaluate to "yes" because all values extend string in some way',
      '"yes" for IsString<"hello"> because "hello" extends string; "no" for IsString<number> because number does not extend string',
      'TypeScript throws — conditional types cannot use string literals',
      '"yes" for IsString<number> because Number objects have string representation',
    ],
    answer: 1,
    explanation: 'B is correct: conditional types evaluate the `extends` condition at compile time. `"hello" extends string` is `true` → resolves to `"yes"`. `number extends string` is `false` → resolves to `"no"`. This pattern is powerful for creating type-level logic used in library types like `NonNullable<T>`, `ReturnType<T>`, and Angular\'s `InputSignal` types. A, C, D are all wrong.',
  },
  {
    id: 149, type: 'multiple-choice', difficulty: 'senior', category: 'typescript',
    question: 'What does `type ReturnOf<T> = T extends (...args: never[]) => infer R ? R : never` do?',
    options: [
      'It returns the function\'s argument types',
      'It uses `infer R` inside a conditional type to capture and expose the return type of a function — `infer` tells TypeScript to extract and name a type from the matched pattern',
      'It prevents generic functions from returning undefined',
      'infer is a runtime keyword — this code runs when the function is called',
    ],
    answer: 1,
    explanation: 'B is correct: `infer` is TypeScript\'s way to "pattern match and capture" a type within conditional types. Here, if `T` is a function, `infer R` captures its return type into `R`. This is how `ReturnType<T>` is defined in TypeScript\'s standard library. A is wrong — `infer R` captures the RETURN type here, not parameters. C is wrong. D is wrong — `infer` is purely a compile-time construct.',
  },
  {
    id: 150, type: 'multiple-choice', difficulty: 'senior', category: 'typescript',
    question: 'What is `Parameters<typeof MyFunction>` used for?',
    options: [
      'It counts the number of parameters a function has',
      'It extracts the parameter types of a function as a tuple type — useful for creating typed wrappers, decorators, or proxy functions that must accept the same arguments as the original',
      'It validates that MyFunction has the correct number of parameters at runtime',
      'Parameters<> works only on class constructors, not standalone functions',
    ],
    answer: 1,
    explanation: 'B is correct: `Parameters<T>` extracts function parameter types as a tuple. `function save(id: number, name: string) {}; type Args = Parameters<typeof save>` gives `[id: number, name: string]`. Combined with spread: `function memoize<T extends (...args: never[]) => unknown>(fn: T) { return (...args: Parameters<T>) => fn(...args); }`. A is wrong — it is a type, not a count. C is wrong — compile-time only. D is wrong.',
  },


  // ─── ARCHITECTURE 151-165 ────────────────────────────────────────────────────
  {
    id: 151, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What is the purpose of `InjectionToken<T>` in Angular?',
    options: [
      'It creates a type-safe string key for providing non-class values through DI — avoiding the "magic string" anti-pattern',
      'It is a decorator that marks a class as injectable',
      'It prevents multiple instances of a service from being created',
      'It is used to inject primitive values like numbers into templates',
    ],
    answer: 0,
    topicPath: 'di-providers',
    explanation: 'A is correct: `InjectionToken<T>` creates a unique DI token for values that are not classes — configuration objects, string constants, feature flags. Example: `const API_URL = new InjectionToken<string>("apiUrl")` then `provide: API_URL, useValue: "https://..."`. Inject it with `inject(API_URL)`. B is wrong — that is `@Injectable`. C is wrong — it has no singleton enforcement. D is wrong.',
  },
  {
    id: 152, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'What is the difference between `@Input()` and `input()` in Angular?',
    options: [
      '@Input() is deprecated — always use input() in Angular 17+',
      'input() returns a Signal<T> and is signal-based; @Input() uses the traditional decorator approach and accesses the value directly as a class property. With input(), you read the value as a function call: this.name()',
      'input() can only accept string values; @Input() accepts any type',
      'They are identical — input() is just syntactic sugar for @Input()',
    ],
    answer: 1,
    topicPath: 'inputs',
    explanation: 'B is correct: `readonly name = input<string>()` creates a signal-based input — access the value with `this.name()`. `@Input() name!: string` stores the value as a plain property. Signal inputs participate in the reactive graph, making computed() and effect() that read them automatically reactive. @Input() is still fully supported and not deprecated. A is wrong. C is wrong. D is wrong — they have meaningfully different behaviour.',
  },
  {
    id: 153, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What happens if you call `signal.set()` with the same value as the current one?',
    options: [
      'Angular always notifies dependents, even if the value is the same',
      'Angular uses Object.is() equality by default — if the new value is the same reference/primitive, dependents are NOT notified and no re-render occurs',
      'Angular throws a "duplicate set" error',
      'The signal\'s version counter still increments even with equal values',
    ],
    answer: 1,
    topicPath: 'signals',
    explanation: 'B is correct: signals use `Object.is()` by default to check equality. If you `set()` the same primitive value or the same object reference, Angular skips notification of dependents entirely. This is a key performance optimisation. To force notification even with equal values, call `.update()` with a new object reference, or provide a custom `equal: () => false` function. A is wrong. C is wrong. D is wrong.',
  },
  {
    id: 154, type: 'spot-the-bug', difficulty: 'senior', category: 'components',
    question: 'Why does this component have a memory leak?',
    code: `@Component({ template: '<p>{{ count }}</p>' })
export class TimerComponent implements OnInit {
  count = 0;
  ngOnInit() {
    setInterval(() => this.count++, 1000);
  }
}`,
    options: [
      'setInterval cannot be used inside Angular components',
      'The interval is never cleared — when the component is destroyed, the interval keeps running, incrementing count and triggering change detection on a destroyed view',
      'count++ is a mutation that Angular\'s OnPush cannot detect',
      'ngOnInit fires before the component is in the DOM so setInterval has no effect',
    ],
    answer: 1,
    topicPath: 'lifecycle',
    explanation: 'B is correct: `setInterval` continues to fire after the component is destroyed because no `clearInterval` is called in `ngOnDestroy`. The callback tries to update `count` and may trigger change detection on a destroyed view, causing "ExpressionChangedAfterItHasBeenChecked" or "ViewDestroyedError". Fix: store the handle (`this.timer = setInterval(...)`) and call `clearInterval(this.timer)` in `ngOnDestroy()`. A is wrong. C is wrong. D is wrong.',
  },
  {
    id: 155, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'What does `forkJoin([a$, b$, c$])` do?',
    options: [
      'It merges a$, b$, c$ and emits every value from all three as they arrive',
      'It waits for ALL source Observables to complete, then emits a single array of their LAST values — like Promise.all() for Observables',
      'It subscribes to a$, then b$, then c$ sequentially',
      'It emits the first value from whichever Observable emits first, then unsubscribes from all',
    ],
    answer: 1,
    topicPath: 'rxjs-advanced',
    explanation: 'B is correct: `forkJoin` subscribes to all sources simultaneously and waits for ALL to complete, then emits `[lastValueOfA, lastValueOfB, lastValueOfC]`. Perfect for parallel HTTP requests where you need all responses before proceeding. If any source never completes or errors, forkJoin never emits. A describes `merge`. C describes `concat`. D describes `race`.',
  },
  {
    id: 156, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'What is the correct way to make a route lazy-loaded in Angular?',
    options: [
      '{ path: "admin", component: () => import("./admin") }',
      '{ path: "admin", loadComponent: () => import("./admin/admin").then(m => m.AdminComponent) }',
      '{ path: "admin", lazy: true, component: AdminComponent }',
      '{ path: "admin", defer: () => AdminComponent }',
    ],
    answer: 1,
    topicPath: 'router-children-lazy',
    explanation: 'B is correct: `loadComponent` accepts a function returning a dynamic import Promise. Angular creates a separate bundle for `AdminComponent` and only downloads it when the user navigates to `/admin`. `loadChildren` is used for lazy route modules. A is wrong — the `component` property does not accept a function. C is wrong — no `lazy: true` property exists. D is wrong.',
  },
  {
    id: 157, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What does `Validators.compose([v1, v2])` do vs providing an array to FormControl?',
    options: [
      'compose() runs validators in parallel; an array runs them sequentially',
      'They are functionally identical — `new FormControl("", [v1, v2])` and `new FormControl("", Validators.compose([v1, v2]))` produce the same result. compose() merges validators into one for cases where a single validator function is needed',
      'compose() short-circuits on first error; an array runs all validators always',
      'compose() works only for async validators',
    ],
    answer: 1,
    topicPath: 'form-validation',
    explanation: 'B is correct: Angular\'s form control automatically composes multiple validators from an array, so `[v1, v2]` and `Validators.compose([v1, v2])` are equivalent. `compose()` is useful when an API expects a single `ValidatorFn` but you need to combine multiple — for example, passing to `AbstractControl.setValidators()`. A is wrong — all validators always run. C is wrong — no short-circuiting occurs. D is wrong.',
  },
  {
    id: 158, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'What does `spectator.detectChanges()` do differently from `fixture.detectChanges()` in Angular testing?',
    options: [
      'Spectator\'s detectChanges() flushes all pending Promises automatically',
      'Functionally they are equivalent — spectator wraps TestBed to provide a nicer API. `spectator.detectChanges()` is equivalent to `fixture.detectChanges()` but reads more idiomatically with Spectator\'s query helpers',
      'Spectator\'s detectChanges() runs all effects synchronously',
      'fixture.detectChanges() only works in fakeAsync zones; spectator.detectChanges() works anywhere',
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct: Spectator is a testing utility library that wraps Angular\'s TestBed with a more ergonomic API. `spectator.detectChanges()` calls `fixture.detectChanges()` internally. The main Spectator benefits are: simpler service mocking, fluent query methods (`spectator.query("button")`), and factory functions that reduce TestBed boilerplate. A, C, D describe behaviours neither has. Understanding that Spectator is a wrapper — not a replacement — is important.',
  },
  {
    id: 159, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'Why does `ChangeDetectionStrategy.OnPush` significantly reduce unnecessary re-renders?',
    options: [
      'OnPush skips ALL change detection for the component and its children',
      'OnPush only re-runs change detection for a component when: (1) an @Input reference changes, (2) an event originates inside the component, (3) an async pipe resolves, or (4) markForCheck() is called — skipping renders when none of these occur',
      'OnPush uses Web Workers to run change detection off the main thread',
      'OnPush automatically applies to all child components recursively',
    ],
    answer: 1,
    topicPath: 'onpush',
    explanation: 'B is correct: by default Angular re-checks every component on every change detection cycle triggered anywhere in the app. OnPush breaks this by only marking a component dirty — and checking it — under specific conditions: a new @Input reference, a component event, async pipe new value, or a manual `markForCheck()`. With signals, signal reads automatically mark the component. A is wrong — OnPush does not skip detection entirely. C is wrong. D is wrong — it must be set per-component.',
  },
  {
    id: 160, type: 'multiple-choice', difficulty: 'junior', category: 'typescript',
    question: 'What is the difference between `unknown` and `any` in TypeScript?',
    options: [
      'unknown is faster at runtime; any is a compile-time-only hint',
      'any turns off all type checking for that value; unknown is a type-safe alternative — you can assign anything to unknown, but you must perform a type check (typeof, instanceof, or narrowing) before using it as a specific type',
      'any only works on primitive types; unknown works on all types',
      'They are identical in TypeScript 5.0+',
    ],
    answer: 1,
    topicPath: 'ts-types',
    explanation: 'B is correct: `any` opts out of TypeScript entirely — no errors regardless of how you use it. `unknown` is the type-safe "escape hatch" — everything is assignable to it, but TypeScript forces you to narrow (`typeof x === "string"`, `instanceof MyClass`) before operating on it. Prefer `unknown` over `any` for untyped external data (API responses, JSON.parse results). A is wrong. C is wrong. D is wrong.',
  },
  {
    id: 161, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What is `ng-container` and when should you use it?',
    options: [
      'A real DOM element that groups styles without affecting layout',
      'A virtual grouping element that renders no DOM node — use it to apply structural directives without introducing an extra element, or to group multiple elements for projection',
      'A slot element for content projection — equivalent to <slot> in Web Components',
      'A wrapper that prevents Angular change detection for its children',
    ],
    answer: 1,
    topicPath: 'builtin-directives',
    explanation: 'B is correct: `<ng-container>` is Angular\'s virtual element — it disappears from the rendered DOM. Use it when you need to apply `@if`, `@for`, or a directive but adding a `<div>` or `<span>` would break CSS layout (flexbox/grid children, table rows, etc.). Also used to group elements for `ngTemplateOutlet`. A is wrong — it renders no DOM node. C is wrong — `ng-content` handles projection. D is wrong.',
  },
  {
    id: 162, type: 'multiple-choice', difficulty: 'junior', category: 'signals',
    question: 'What is the difference between `effect()` and `computed()`?',
    options: [
      'effect() is for synchronous logic; computed() is for async',
      'computed() creates a new derived signal whose value is lazily recalculated when dependencies change; effect() runs arbitrary side-effect code (DOM manipulation, logging, HTTP calls) when dependencies change — it does not produce a value',
      'effect() re-runs on every change detection cycle; computed() re-runs only when read',
      'They are interchangeable — use whichever reads more clearly',
    ],
    answer: 1,
    topicPath: 'signals',
    explanation: 'B is correct: `computed()` is for derived state — it produces a read-only signal. `effect()` is for side effects — it produces nothing and is used for things that must happen when state changes (saving to localStorage, updating a third-party chart, logging). A key distinction: `computed()` is lazy (only recalculates when read); `effect()` is eager (runs after every change, scheduled asynchronously). Never use `effect()` purely for derived values — that is `computed()`\'s job. A is wrong. C is wrong. D is wrong.',
  },
  {
    id: 163, type: 'spot-the-bug', difficulty: 'mid', category: 'rxjs',
    question: 'This search implementation has a race condition. What is the problem?',
    code: `searchControl.valueChanges.pipe(
  mergeMap(term => this.http.get('/search?q=' + term))
).subscribe(results => this.results = results);`,
    options: [
      'mergeMap cannot be used with HttpClient',
      'mergeMap subscribes to every new HTTP request concurrently — if "ang" resolves after "angular", results shows stale data for "ang". Use switchMap to cancel the previous request on each new keystroke',
      'valueChanges does not emit on the initial value',
      'mergeMap requires a resultSelector argument',
    ],
    answer: 1,
    topicPath: 'rxjs-operators',
    explanation: 'B is correct: `mergeMap` (aka `flatMap`) subscribes to all inner Observables concurrently. For search, if the user types quickly, multiple HTTP requests fly simultaneously. Responses arrive out of order — a slow earlier request can overwrite a fast later one. Fix: `switchMap` automatically unsubscribes from the previous inner Observable when a new value arrives, ensuring only the latest request\'s response is used. A is wrong. C is wrong — valueChanges emits on every change after subscription. D is wrong.',
  },
  {
    id: 164, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'What is `ActivatedRoute` and how do you access route parameters with it?',
    options: [
      'ActivatedRoute is the router itself — use it to navigate programmatically',
      'ActivatedRoute represents the currently activated route. Inject it and read `route.snapshot.paramMap.get("id")` for a one-time read, or subscribe to `route.paramMap` for live updates when params change without component recreation',
      'ActivatedRoute is only available in root components, not in lazy-loaded ones',
      'ActivatedRoute is deprecated — use inject(ActivatedRouteSnapshot) instead',
    ],
    answer: 1,
    topicPath: 'route-params',
    explanation: 'B is correct: `inject(ActivatedRoute)` (or constructor injection) gives you the active route. `route.snapshot.paramMap.get("id")` reads the current value once. `route.paramMap` is an Observable that emits whenever route params change, which happens when navigating between routes that share the same component instance. With `withComponentInputBinding()`, params automatically map to signal inputs. A is wrong — use `Router` for navigation. C is wrong. D is wrong.',
  },
  {
    id: 165, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'What is the Angular `@defer` `prefetch` modifier and when would you use it?',
    options: [
      'prefetch is a CSS optimization hint — unrelated to @defer',
      '`@defer (on interaction; prefetch on idle)` separates loading from rendering: it prefetches the deferred bundle while the browser is idle, but only renders the content when the user interacts — combining good UX (no load delay on interaction) with good performance (idle-time download)',
      'prefetch forces the deferred block to render immediately after prefetch',
      'prefetch is equivalent to using <link rel="prefetch"> in the HTML head',
    ],
    answer: 1,
    topicPath: 'deferrable-views',
    explanation: 'B is correct: Angular\'s `@defer` supports combining a render trigger with a separate prefetch trigger. `@defer (on viewport; prefetch on idle)` means: start downloading the JS bundle when the browser is idle, but only render the content when the element enters the viewport. This gives near-instant render on interaction because the bundle is already cached. A is wrong. C is wrong — prefetch does not trigger rendering. D is similar in concept but is a manual approach without Angular\'s bundle splitting.',
  },

  // ─── MORE PRACTICE CHALLENGES 166-200 ────────────────────────────────────────
  {
    id: 166, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What does `ViewEncapsulation.ShadowDom` do differently from the default `Emulated`?',
    options: [
      'ShadowDom uses native browser Shadow DOM — styles are truly isolated using the browser\'s own scoping mechanism, and external CSS cannot penetrate the shadow root; Emulated uses Angular-generated attribute selectors to simulate this scoping in browsers without Shadow DOM support',
      'ShadowDom prevents all event bubbling out of the component',
      'ShadowDom is faster because it skips Angular\'s style compilation step',
      'Emulated uses inline styles; ShadowDom uses stylesheets',
    ],
    answer: 0,
    topicPath: 'components',
    explanation: 'A is correct: `ViewEncapsulation.ShadowDom` attaches a real Shadow DOM to the host element — native browser isolation, styles truly cannot leak in or out, and `::ng-deep` does not work through it. `Emulated` (default) simulates scoping by adding `[_ngcontent-xxx]` attributes without using Shadow DOM, meaning `::ng-deep` can still penetrate it and styles apply to dynamically created content more reliably. B is wrong — ShadowDom does not affect event propagation (custom events can use `composed: true`). C and D are wrong.',
  },
  {
    id: 167, type: 'multiple-choice', difficulty: 'junior', category: 'forms',
    question: 'What does `[formGroup]="myForm"` do in a template?',
    options: [
      'It binds the form\'s submit event to the myForm method',
      'It links the `<form>` element to a FormGroup instance — enabling the reactive forms directives (`formControlName`, `formGroupName`) to connect their inputs to the corresponding controls in the model',
      'It imports the FormGroup class into the template',
      'It automatically calls `myForm.reset()` when the form is submitted',
    ],
    answer: 1,
    topicPath: 'reactive-forms',
    explanation: 'B is correct: `[formGroup]="myForm"` sets up the reactive forms context. It bridges the FormGroup model in the component class with the `<form>` element in the template. Child `formControlName="email"` directives then look up their controls in `myForm`. Without `[formGroup]`, `formControlName` has no context to look controls up in and throws. A is wrong — use `(ngSubmit)` for submission. C is wrong. D is wrong.',
  },
  {
    id: 168, type: 'predict-output', difficulty: 'mid', category: 'typescript',
    question: 'What is the type of `result` after this code?',
    code: `type Result = 'success' | 'error' | 'pending';
const r: Result = 'success';
const result = r === 'success' ? 'done' : r;`,
    options: [
      '"done" | "success" | "error" | "pending"',
      '"done" | "error" | "pending"',
      'string',
      '"done" | Result',
    ],
    answer: 1,
    topicPath: 'ts-narrowing',
    explanation: 'B is correct: TypeScript\'s control flow analysis narrows types through conditional expressions. In the false branch of `r === "success" ? ... : r`, TypeScript knows `r` cannot be `"success"` (it was eliminated in the true branch), so the type narrows to `"error" | "pending"`. The full type of `result` is `"done" | "error" | "pending"`. This is discriminated union narrowing in action. A is too wide. C is wrong — TypeScript keeps it narrow. D is wrong.',
  },
  {
    id: 169, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What is `toSignal()` and what are its limitations?',
    options: [
      'toSignal() converts a Promise to a signal; it cannot handle Observables',
      'toSignal(obs$) from @angular/core/rxjs-interop wraps an Observable as a read-only Signal. It must be called in an injection context. The signal holds the current Observable value; before the first emission it holds undefined (or an initialValue if provided). The subscription is automatically cleaned up when the injection context is destroyed',
      'toSignal() creates a two-way binding between an Observable and a signal',
      'toSignal() works the same as takeUntilDestroyed — it only handles cleanup',
    ],
    answer: 1,
    topicPath: 'rxjs-interop',
    explanation: 'B is correct: `toSignal(obs$)` returns `Signal<T | undefined>` unless you provide `{ initialValue: T }` (making it `Signal<T>`) or `{ requireSync: true }` (for synchronous sources like BehaviorSubject). Call it at class construction time inside an injection context. It subscribes immediately and unsubscribes automatically on destroy. A is wrong — it works with Observables, not Promises. C is wrong. D is wrong.',
  },
  {
    id: 170, type: 'multiple-choice', difficulty: 'senior', category: 'rxjs',
    question: 'What does `exhaustMap` do and when should you prefer it over `switchMap`?',
    options: [
      'exhaustMap cancels the current inner Observable when a new source value arrives — opposite of switchMap',
      'exhaustMap ignores new source values while an inner Observable is active — use it for form submission buttons where concurrent duplicate submissions must be prevented; switchMap cancels the old one, exhaustMap ignores the new one',
      'exhaustMap is identical to concatMap but runs in parallel',
      'exhaustMap subscribes to all inner Observables and emits whichever completes first',
    ],
    answer: 1,
    topicPath: 'rxjs-operators',
    explanation: 'B is correct: while `switchMap` cancels the in-progress inner Observable on each new source value, `exhaustMap` ignores new source values entirely while an inner Observable is still active. Perfect for a Save button — if a save is in progress, additional clicks are silently ignored until the current save completes. Use `switchMap` for cancellable operations (search), `concatMap` for ordering, `mergeMap` for parallelism, `exhaustMap` for ignoring duplicates. A describes the wrong operator. C is wrong. D describes `race`.',
  },
  {
    id: 171, type: 'multiple-choice', difficulty: 'junior', category: 'testing',
    question: 'What is a spy in Jasmine testing and how is it created?',
    options: [
      'A spy is a mock HTTP server created with `HttpClientTestingModule`',
      'A spy is a function wrapper that records calls, arguments, and return values without executing real logic. Create one with `spyOn(obj, "method")` (wraps existing method) or `jasmine.createSpy("name")` (standalone). Assert with `expect(spy).toHaveBeenCalledWith(args)`',
      'A spy is used only for testing Angular routing — it intercepts router.navigate() calls',
      'A spy is a TypeScript interface partial that satisfies the type checker with mock values',
    ],
    answer: 1,
    topicPath: 'testing-services-http',
    explanation: 'B is correct: Jasmine spies are the primary tool for test isolation. `spyOn(service, "login")` replaces `service.login` with a spy that you can configure: `.and.returnValue(of(user))`, `.and.throwError("fail")`, or `.and.callThrough()` (calls real impl). After the test: `expect(service.login).toHaveBeenCalledWith({ email, password })`. A is wrong — that is `HttpTestingController`. C is wrong. D describes TypeScript mocking patterns, not Jasmine spies.',
  },
  {
    id: 172, type: 'multiple-choice', difficulty: 'junior', category: 'signals',
    question: 'What is the difference between `signal.update()` and `signal.set()`?',
    options: [
      'update() triggers change detection; set() does not',
      'set(value) replaces the signal\'s current value with a new one; update(fn) passes the current value to a function and replaces it with the function\'s return value — useful for immutable updates like `items.update(arr => [...arr, newItem])`',
      'update() is for objects; set() is for primitives',
      'They are identical — update(fn) is just shorthand for set(fn(signal()))',
    ],
    answer: 1,
    topicPath: 'signals',
    explanation: 'B is correct: `set(value)` takes a direct value. `update(fn)` takes a function that receives the current value and returns the new one — avoiding the need to read the signal separately before setting. `counter.update(v => v + 1)` is cleaner than `counter.set(counter() + 1)`. D is close but misses the point — `update` is for ergonomics and avoids an extra read expression. A is wrong — both trigger dependents. C is wrong.',
  },
  {
    id: 173, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'What does `CanDeactivateFn` guard do?',
    options: [
      'It prevents users from activating a route unless a condition is met',
      'It is called when navigating AWAY from a route — allowing you to show a "You have unsaved changes, are you sure?" confirmation before leaving',
      'It deactivates a route, making it inaccessible without reload',
      'It clears route parameters when leaving a component',
    ],
    answer: 1,
    topicPath: 'route-guards',
    explanation: 'B is correct: `CanDeactivateFn<T>` receives the component instance and allows or blocks leaving. The component typically implements a `canDeactivate()` method or has a `isDirty` signal that the guard checks. Return `true` to allow navigation, `false` to block, or a `UrlTree` to redirect. This is the correct hook for "unsaved changes" warnings. A describes `CanActivateFn`. C and D are wrong.',
  },
  {
    id: 174, type: 'multiple-choice', difficulty: 'mid', category: 'typescript',
    question: 'What does `Record<string, User>` do?',
    options: [
      'It creates an array of Users with string indices',
      'It creates an object type where every key is a string and every value is a User — equivalent to `{ [key: string]: User }` but more readable and works with type aliases',
      'It records changes to User objects for undo/redo',
      'It maps a User to a string for serialization',
    ],
    answer: 1,
    topicPath: 'ts-utility-types',
    explanation: 'B is correct: `Record<K, V>` is a mapped type that creates an object type with keys of type `K` and values of type `V`. `Record<string, User>` is equivalent to `{ [key: string]: User }`. Use it for dictionaries: `Record<UserId, User>`, `Record<"loading" | "success" | "error", boolean>`. A is wrong — it is not an array. C and D are wrong.',
  },
  {
    id: 175, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'What is `provideExperimentalZonelessChangeDetection()` and what does enabling it require?',
    options: [
      'It removes Zone.js from the bundle and makes Angular rely entirely on explicit markForCheck() calls',
      'It removes Zone.js\'s automatic change detection patching and requires components to use signals, the async pipe, or markForCheck() to notify Angular when state changes — enabling true zoneless apps with smaller bundles and better performance',
      'It is equivalent to running Angular in strict mode — no performance benefit',
      'It enables Web Workers for all change detection cycles',
    ],
    answer: 1,
    topicPath: 'zoneless',
    explanation: 'B is correct: `provideExperimentalZonelessChangeDetection()` replaces Zone.js-based automatic change detection. Without Zone.js patching `setTimeout`, `addEventListener`, etc., Angular only knows about changes through signals, async pipe emissions, or `markForCheck()`. Benefits: smaller bundle (Zone.js removed), faster change detection, better SSR compatibility. The whole app must be signal-aware — any class property mutation will NOT be detected. A is partially right but incomplete. C and D are wrong.',
  },
  {
    id: 176, type: 'predict-output', difficulty: 'junior', category: 'rxjs',
    question: 'What does this code log?',
    code: `import { of, map } from 'rxjs';

const doubled$ = of(1, 2, 3).pipe(
  map(x => x * 2)
);

doubled$.subscribe(console.log);
doubled$.subscribe(console.log);`,
    options: [
      '2, 4, 6 (once — shared between both subscribers)',
      '2, 4, 6, 2, 4, 6 (each subscription independently re-runs the cold Observable)',
      'An error — you cannot subscribe twice to an Observable',
      '2, 2, 4, 4, 6, 6 (values interleaved between subscribers)',
    ],
    answer: 1,
    topicPath: 'rxjs-observables',
    explanation: 'B is correct: `of(1,2,3)` is a COLD Observable — every `subscribe()` call creates a brand new, independent execution. Both subscriptions run the full sequence independently, logging 2, 4, 6 twice. This contrasts with HOT Observables (like `fromEvent`, `Subject`) which share one execution. A would be the behaviour of a hot/multicasted Observable. C is wrong — multiple subscriptions are fully supported. D is wrong — cold Observables do not interleave.',
  },
  {
    id: 177, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What is the purpose of `FormArray` and when should you use it?',
    options: [
      'FormArray is an array of primitive values like strings — use it instead of FormControl for multi-value inputs',
      'FormArray manages an ordered, dynamic list of AbstractControls (FormControls, FormGroups, or nested FormArrays) — use it for dynamic form rows like a list of phone numbers, address entries, or line items that the user can add/remove at runtime',
      'FormArray is a deprecated alternative to FormGroup for flat forms',
      'FormArray binds to a <select multiple> element for multi-value selection',
    ],
    answer: 1,
    topicPath: 'form-arrays',
    explanation: 'B is correct: `FormArray` is the right tool when the number of controls is dynamic. `this.form.get("phones") as FormArray` holds an arbitrary number of phone `FormGroup`s. Use `array.push(new FormGroup({...}))` to add and `array.removeAt(i)` to remove. `array.controls` iterates the current controls. A is wrong. C is wrong — it is not deprecated. D is wrong.',
  },
  {
    id: 178, type: 'multiple-choice', difficulty: 'junior', category: 'testing',
    question: 'What is the role of `HttpClientTestingModule` in Angular tests?',
    options: [
      'It provides a real HTTP client that makes actual network requests to a local test server',
      'It replaces the real HTTP client with a mock that intercepts requests — allowing you to flush controlled responses with `HttpTestingController` without making real network requests',
      'It validates that all HTTP URLs in the app are reachable',
      'It is a test wrapper for the fetch API, not Angular\'s HttpClient',
    ],
    answer: 1,
    topicPath: 'testing-services-http',
    explanation: 'B is correct: `provideHttpClientTesting()` (or `HttpClientTestingModule` in older APIs) installs an interceptor that captures all `HttpClient` requests. In your test, inject `HttpTestingController` and use `httpMock.expectOne("/api/users").flush(mockData)` to return controlled data. No network calls are made. A is wrong — no real requests. C is wrong. D is wrong.',
  },
  {
    id: 179, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'What is the Angular `afterRender` phase system and why does it matter?',
    options: [
      'afterRender phases control which components render first in the component tree',
      'Angular\'s afterRender runs callbacks in four ordered phases: earlyRead → write → mixedReadWrite → read. This ordering prevents layout thrashing: reads after writes instead of alternating read/write/read/write in random order, which forces the browser to recalculate layout multiple times',
      'Phases are used by the Angular animations engine to sequence transitions',
      'afterRender phases only apply in server-side rendering contexts',
    ],
    answer: 1,
    topicPath: 'after-render',
    explanation: 'B is correct: `afterRender({ read: () => { /* measure DOM */ }, write: () => { /* update DOM */ } })` lets Angular batch DOM reads before DOM writes. Without phase control, alternating read-then-write patterns cause the browser to reflow the page on each pair (layout thrashing). Batching all reads first, then all writes, reduces reflows to one. A, C, D are wrong.',
  },
  {
    id: 180, type: 'spot-the-bug', difficulty: 'senior', category: 'performance',
    question: 'Why will this OnPush component NOT update when the service data changes?',
    code: `@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '{{ service.items[0].name }}'
})
export class ListComponent {
  constructor(readonly service: ItemService) {}
}

// In ItemService:
items: Item[] = [];
addItem(item: Item) {
  this.items.push(item); // mutates the array
}`,
    options: [
      'OnPush does not support accessing service properties directly in templates',
      'The service mutates the existing array reference with push(). OnPush checks if the @Input or observed Observable/signal changed — since the array reference is the same object, Angular does not detect the change and skips re-rendering the component',
      'The template should use the async pipe to observe service.items',
      'OnPush components cannot inject services in the constructor',
    ],
    answer: 1,
    topicPath: 'onpush',
    explanation: 'B is correct: `OnPush` only re-checks a component when an @Input reference changes, an Observable emits (via async pipe), a signal changes, or `markForCheck()` is called. `Array.push()` mutates the SAME array reference — the reference does not change, so OnPush skips the check entirely. Fix: either use `this.items = [...this.items, item]` (new reference), or use a `signal<Item[]>([])` in the service which OnPush automatically tracks. A is wrong. C is one solution but not the diagnosis. D is wrong.',
  },
  {
    id: 181, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'What is a route `resolver` and when should you use one?',
    options: [
      'A resolver is a guard that prevents navigation based on user permissions',
      'A resolver pre-fetches data BEFORE a route activates — the component receives the resolved data via ActivatedRoute\'s data map. Use it when a component cannot render without its data, avoiding a loading flash. The trade-off: navigation appears to "hang" while resolving, so pair with a loading indicator',
      'A resolver transforms route parameters before they reach the component',
      'Resolvers are deprecated — use resource() inside the component instead',
    ],
    answer: 1,
    topicPath: 'resolvers',
    explanation: 'B is correct: `ResolveFn<T>` returns a value or Observable — Angular waits for it to complete before activating the route. Access the result in the component: `route.snapshot.data["product"]` or via signal input with `withComponentInputBinding()`. Use resolvers when you want zero loading state UI. Skip them when you prefer to show a skeleton/spinner — load in the component instead. A describes guards. C is wrong. D is wrong — resolvers are still the preferred pre-fetch pattern.',
  },
  {
    id: 182, type: 'multiple-choice', difficulty: 'junior', category: 'typescript',
    question: 'What does `Required<T>` do?',
    options: [
      'It adds the `required` attribute to all form inputs of type T',
      'It makes all properties of T required by removing the `?` optional modifier — the inverse of Partial<T>',
      'It makes a class implement all members of an interface T',
      'It is equivalent to NonNullable<T>',
    ],
    answer: 1,
    topicPath: 'ts-utility-types',
    explanation: 'B is correct: `Required<T>` removes `?` from every property, making them all mandatory. `Required<{ name?: string; age?: number }>` becomes `{ name: string; age: number }`. Use it when you receive a Partial (e.g., from an API patch endpoint) and need to assert that you have filled all required fields before saving. A is wrong. C is wrong. D is wrong — `NonNullable` removes `null | undefined` from the type itself.',
  },
  {
    id: 183, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What does `@ViewChild(MyComponent, { static: true })` vs `{ static: false }` mean?',
    options: [
      'static: true makes the view query available in ngOnInit; static: false makes it available in ngAfterViewInit. static: true only works for elements not inside @if/@for blocks',
      'static: true caches the result — the query runs only once; static: false runs the query on every change detection cycle',
      'They control whether the child component can be modified from the parent',
      'static: true is the default; static: false is needed only for dynamic components',
    ],
    answer: 0,
    topicPath: 'view-queries',
    explanation: 'A is correct: `static: true` resolves the query once BEFORE change detection runs, making it available in `ngOnInit`. Only use `static: true` for elements that always exist in the template (not inside structural directives like `@if`/`@for`). `static: false` (default) resolves after change detection, available in `ngAfterViewInit`, and correctly handles conditionally rendered elements. With the modern signal `viewChild()` API, the distinction is handled automatically. B, C, D are wrong.',
  },
  {
    id: 184, type: 'multiple-choice', difficulty: 'junior', category: 'rxjs',
    question: 'What is the purpose of the `async` pipe in Angular templates?',
    options: [
      'It makes template expressions run asynchronously so they do not block rendering',
      'It subscribes to an Observable or Promise in the template and automatically unsubscribes when the component is destroyed — displaying the latest emitted value',
      'It converts a Promise to an Observable before use in the template',
      'It is required to use async/await in Angular component methods',
    ],
    answer: 1,
    topicPath: 'rxjs-interop',
    explanation: 'B is correct: `{{ data$ | async }}` or `@if (user$ | async; as user)` subscribes to the Observable and renders the current value. Crucially, it automatically calls `unsubscribe()` in `ngOnDestroy`, preventing memory leaks. Multiple async pipes on the same Observable create multiple subscriptions — use `shareReplay(1)` or a single `@let` variable to share one subscription. A, C, D are wrong descriptions.',
  },
  {
    id: 185, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'What is the "Arrange, Act, Assert" (AAA) pattern and why is it important?',
    options: [
      'It is a CSS methodology for Angular component styling',
      'AAA is a testing structure: Arrange (set up the test data and state), Act (perform the action being tested), Assert (verify the expected outcome). It makes tests readable, identifies where setup ends and behavior begins, and prevents tangled test logic',
      'It is Angular\'s three-phase change detection cycle',
      'It refers to Angular\'s Accessibility (a11y), Animation, and API testing strategy',
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct: the AAA pattern gives every test a predictable shape. Arrange: `const service = TestBed.inject(AuthService); service.login.and.returnValue(of(user))`. Act: `component.submit()`. Assert: `expect(router.navigate).toHaveBeenCalledWith(["/dashboard"])`. This separation makes tests self-documenting and pinpoints failures precisely. It is universally applicable across Jasmine, Jest, and Vitest. A, C, D are wrong.',
  },
  {
    id: 186, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'How does `contentChild()` differ from `viewChild()` in Angular?',
    options: [
      'viewChild() queries the component\'s own template; contentChild() queries elements projected into the component via ng-content — content that the parent passes in',
      'contentChild() is for CSS selectors; viewChild() is for component/directive types',
      'viewChild() is signal-based; contentChild() returns a plain reference',
      'They are identical — contentChild is an alias for viewChild in Angular 17+',
    ],
    answer: 0,
    topicPath: 'content-projection',
    explanation: 'A is correct: `viewChild(MyComponent)` queries within the component\'s own template. `contentChild(MyComponent)` queries content that was projected from OUTSIDE via `<ng-content>`. Example: a tab panel component uses `contentChild` to find tab headers that parents project in. Both return signals — `viewChild()` resolves to `Signal<MyComponent | undefined>`. B, C, D are wrong.',
  },
  {
    id: 187, type: 'multiple-choice', difficulty: 'junior', category: 'performance',
    question: 'What does the `trackBy` (or `track` in @for) function do for list rendering performance?',
    options: [
      'It sorts the list before rendering by the tracked property',
      'It provides Angular with a stable identity for each item so that when the list changes, Angular can reuse existing DOM nodes for items that are still present (identified by the tracked key) instead of destroying and recreating the entire list',
      'It prevents Angular from re-rendering items that have not changed their value',
      'It applies CSS will-change: transform to list items for GPU acceleration',
    ],
    answer: 1,
    topicPath: 'control-flow-for',
    explanation: 'B is correct: without `track`, Angular has no way to match old and new items — it destroys all DOM nodes and creates new ones on any data change. With `track item.id` (or `trackBy: fn`), Angular identifies which items are new, moved, or removed and surgically updates the DOM. For a list of 1000 items where 1 changes, `track` means one node update instead of 1000 re-renders. A is wrong — no sorting. C is wrong. D is wrong.',
  },
  {
    id: 188, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'What does `inject()` do and how does it differ from constructor injection?',
    options: [
      'inject() bypasses Angular\'s DI system — it directly instantiates the service',
      'inject(Token) resolves a dependency from the current injection context without requiring a constructor parameter. It can be used in class initializers, factory functions, and standalone functions (like guards), making DI available outside class constructors. Constructor injection requires the value to be listed as a constructor parameter',
      'inject() only works for services; constructor injection works for all tokens',
      'inject() is slower than constructor injection because it looks up the token each time',
    ],
    answer: 1,
    topicPath: 'services-di',
    explanation: 'B is correct: `const router = inject(Router)` in a class property initializer, a `CanActivateFn` guard, or a factory function resolves the dependency from the nearest injector. This is more flexible than constructor injection — you can compose DI usage in standalone functions. Both approaches use the same DI hierarchy. A is wrong — inject() fully participates in DI. C is wrong — both handle all tokens. D is wrong — same underlying resolution.',
  },
  {
    id: 189, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What problem does `resource()` solve compared to subscribing to an HTTP Observable in a constructor?',
    options: [
      'resource() automatically caches responses indefinitely; Observable subscriptions do not',
      'resource() ties async data loading directly to the signal graph — when a request signal changes (like a selected ID), resource() automatically re-fetches, tracks loading/error/resolved state in signals, and cancels in-flight requests. An Observable subscription requires manual cleanup, manual error state tracking, and manual re-fetch orchestration',
      'resource() is only for HTTP requests; Observables work with any async source',
      'resource() is faster because it uses the Fetch API directly instead of HttpClient',
    ],
    answer: 1,
    topicPath: 'resource-api',
    explanation: 'B is correct: `resource()` integrates async loading with Angular\'s reactive graph. When you do `const id = signal(1); const user = resource({ request: id, loader: ({request}) => fetch(...) })`, changing `id` automatically triggers a re-fetch and the `user.isLoading()`, `user.value()`, `user.error()` signals update accordingly. With a manual Observable subscription, you write all this orchestration yourself. A is wrong — no permanent caching. C is wrong. D is wrong.',
  },
  {
    id: 190, type: 'multiple-choice', difficulty: 'mid', category: 'typescript',
    question: 'What is a discriminated union and why is it useful for Angular state modeling?',
    options: [
      'A union type that excludes one of its members using Exclude<T, U>',
      'A union of object types where a shared literal property (the "discriminant") lets TypeScript narrow to a specific variant. Example: `type State = { status: "loading" } | { status: "success"; data: User } | { status: "error"; message: string }` — TypeScript knows exactly which properties exist after checking `state.status`',
      'A union that only accepts discriminated values defined in an enum',
      'A union type where only one member can be assigned at a time — an "exclusive or" type',
    ],
    answer: 1,
    topicPath: 'ts-narrowing',
    explanation: 'B is correct: discriminated unions are the TypeScript way to model "states with different shapes". After `if (state.status === "success")`, TypeScript knows `state.data: User` exists. In Angular, this pattern models loading states, form states, or any "tagged variant" data cleanly — no optional properties, no `null` checks everywhere, exhaustive switch statements. A, C, D are wrong descriptions.',
  },
  {
    id: 191, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'What is the purpose of `ngOnChanges` and how does it relate to signal inputs?',
    options: [
      'ngOnChanges fires whenever any signal in the component changes',
      'ngOnChanges fires when one or more @Input()-decorated properties change, receiving a SimpleChanges object with previous and current values. With signal inputs (input()), ngOnChanges does NOT fire — instead, the signal itself notifies dependents reactively when the parent sets a new value',
      'ngOnChanges fires once after all lifecycle hooks complete',
      'ngOnChanges replaces ngOnInit when the component has @Input() bindings',
    ],
    answer: 1,
    topicPath: 'inputs',
    explanation: 'B is correct: `ngOnChanges(changes: SimpleChanges)` fires before `ngOnInit` and before each change detection cycle when @Input properties change. It gives you previous/current values and whether it is the first change. With signal inputs (`input()`), Angular\'s signal graph handles reactivity — compute values in `computed()` or react in `effect()` instead of `ngOnChanges`. The lifecycle hook is not called for signal inputs. A is wrong. C is wrong. D is wrong.',
  },
  {
    id: 192, type: 'multiple-choice', difficulty: 'senior', category: 'rxjs',
    question: 'What is a `ReplaySubject(1)` and how does it differ from `BehaviorSubject`?',
    options: [
      'They are identical — ReplaySubject(1) is an alias for BehaviorSubject with no initial value',
      'Both replay the last value to late subscribers, but BehaviorSubject requires an initial value at construction and always has a current value; ReplaySubject(1) starts empty — it only replays once it has received at least one emission. Use ReplaySubject(1) when there is no meaningful initial state',
      'ReplaySubject(1) emits values asynchronously; BehaviorSubject is synchronous',
      'ReplaySubject replays values to all current subscribers; BehaviorSubject only replays to new subscribers',
    ],
    answer: 1,
    topicPath: 'rxjs-subjects',
    explanation: 'B is correct: the key practical difference is the initial state requirement. `BehaviorSubject` must be constructed with a value (`new BehaviorSubject<User | null>(null)`) and always has a `.value` getter. `ReplaySubject(1)` is empty until the first `next()` call — late subscribers get nothing if no value has been emitted yet. Use BehaviorSubject when there is a sensible initial state; use ReplaySubject(1) when "no value yet" is a valid state you want to preserve. A, C, D are wrong.',
  },
  {
    id: 193, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'How do you apply a CSS class conditionally in Angular templates?',
    options: [
      '[className]="isActive ? \'active\' : \'\'"',
      '[class.active]="isActive" — Angular adds the "active" class when isActive is truthy and removes it when falsy',
      'ngClass="{{ isActive }}"',
      'style.className="active"',
    ],
    answer: 1,
    topicPath: 'class-style-binding',
    explanation: 'B is correct: `[class.className]="expression"` is the idiomatic Angular single-class binding. For multiple conditional classes: `[ngClass]="{ active: isActive, disabled: isDisabled }"` or `[class]="{ active: isActive }"`. A works but requires managing the empty string carefully. C is wrong syntax. D is wrong — `style` is for CSS properties, not class names.',
  },
  {
    id: 194, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What does `AbstractControl.dirty` mean and how does it differ from `touched`?',
    options: [
      'dirty means validation failed; touched means the user interacted',
      'dirty is true when the control\'s value has been changed from its initial value by the user; touched is true when the control has been focused and then blurred (lost focus). A control can be touched without being dirty (user clicked in and out without typing)',
      'They are identical — both become true when the user types in the field',
      'dirty tracks async validation state; touched tracks sync validation state',
    ],
    answer: 1,
    topicPath: 'form-validation',
    explanation: 'B is correct: `dirty` tracks VALUE changes; `touched` tracks focus/blur interactions. Typical pattern: show validation errors when `control.invalid && control.touched` (user has visited but has an error). Show "unsaved changes" warnings when `form.dirty` (value changed from saved state). `markAsDirty()` and `markAsTouched()` can set these programmatically. A is wrong. C is wrong. D is wrong.',
  },
  {
    id: 195, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'What is Angular\'s "signal-based component" model and what does it enable?',
    options: [
      'Components that use signals instead of templates for rendering',
      'Components that express ALL reactive state through signals — inputs, outputs, queries, and internal state. This enables Angular to eventually support zoneless change detection with fine-grained, automatic updates: only the parts of the DOM that depend on a changed signal re-render, without scanning the full component tree',
      'Components that cannot use Zone.js — they require zoneless mode',
      'A special component class that extends SignalComponent instead of the base Component',
    ],
    answer: 1,
    topicPath: 'zoneless',
    explanation: 'B is correct: the signal-based component model (`input()`, `output()`, `viewChild()`, `signal()`, `computed()`) gives Angular a complete picture of which reactive values drive which DOM nodes. This is the foundation for fine-grained reactivity where only the specific DOM nodes reading a changed signal update — not the entire component. You can use signals without zoneless mode today, and adding zoneless mode on top gives the full performance benefit. A, C, D are wrong.',
  },
  {
    id: 196, type: 'spot-the-bug', difficulty: 'mid', category: 'forms',
    question: 'What is wrong with this form submission handler?',
    code: `onSubmit() {
  if (this.form.valid) {
    this.userService.save(this.form.value);
  } else {
    console.log('invalid');
  }
}`,
    options: [
      'form.valid cannot be checked synchronously',
      'If the form has disabled controls, their values are omitted from form.value. The saved data silently misses those fields. Use form.getRawValue() to include all controls regardless of disabled state',
      'The save() call should be wrapped in try/catch',
      'You must call form.markAllAsTouched() before checking form.valid',
    ],
    answer: 1,
    topicPath: 'reactive-forms',
    explanation: 'B is correct: `FormGroup.value` silently excludes disabled controls. If your form has a pre-filled, disabled "userId" field, `this.form.value` will NOT include it. `this.form.getRawValue()` returns ALL controls regardless of disabled state. This is a subtle bug that causes silent data loss — the save request goes through but without the disabled field\'s value. A is wrong. C is wrong for this question\'s purpose. D is a UX improvement, not a bug fix.',
  },
  {
    id: 197, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'What is `routerLinkActiveOptions: { exact: true }` used for?',
    options: [
      'It makes the router perform exact URL matching for routing decisions',
      'It ensures `routerLinkActive` only adds the active class when the URL matches EXACTLY — without it, a link to "/" would also be marked active on "/about" because "/" is a prefix of every URL',
      'It disables partial matching for route parameters',
      'exact: true is the default — you need exact: false to enable prefix matching',
    ],
    answer: 1,
    topicPath: 'routing-basics',
    explanation: 'B is correct: by default, `routerLinkActive` uses prefix matching — a link to `/` is considered active on any URL. `[routerLinkActiveOptions]="{ exact: true }"` switches to exact matching, so the home link is only highlighted on the root `/`. This is critical for navigation menus where the home/dashboard link should not always appear active. A is wrong — this is a CSS class question, not a routing decision. C is wrong. D is wrong.',
  },
  {
    id: 198, type: 'multiple-choice', difficulty: 'mid', category: 'typescript',
    question: 'What is a type guard and how do you write a user-defined one?',
    options: [
      'A type guard is a runtime validator generated by TypeScript — it runs automatically before function calls',
      'A type guard is a function that returns a boolean AND has a return type of `value is Type`. TypeScript uses this type predicate to narrow the type inside `if` blocks. Example: `function isUser(v: unknown): v is User { return typeof v === "object" && v !== null && "name" in v; }`',
      'A type guard is a try/catch wrapper that catches TypeScript type errors at runtime',
      'Type guards only work with primitive types — use instanceof for objects',
    ],
    answer: 1,
    topicPath: 'ts-narrowing',
    explanation: 'B is correct: user-defined type guards use the `value is Type` return type syntax. When the function returns `true`, TypeScript narrows the type of `value` to `Type` in the enclosing `if` block. They are essential for narrowing `unknown` API responses, discriminated unions, and any "is this thing of type X?" check. A is wrong — TypeScript does not generate runtime validators. C is wrong. D is wrong — type guards work with any type.',
  },
  {
    id: 199, type: 'multiple-choice', difficulty: 'junior', category: 'signals',
    question: 'Can you read a signal inside an `@if` block in a template, and will it be reactive?',
    options: [
      'No — signals inside @if blocks do not update because the block may not re-render',
      'Yes — Angular\'s template compiler tracks every signal read in any template expression, including inside @if, @for, and @switch. When the signal changes, Angular re-evaluates the relevant template block',
      'Only if you call detectChanges() manually after each signal update',
      'Yes, but only for OnPush components — default change detection ignores signal reads',
    ],
    answer: 1,
    topicPath: 'signals',
    explanation: 'B is correct: Angular\'s template engine tracks signal reads throughout the entire template, including inside control flow blocks. If `showAdmin()` is a signal read inside `@if (showAdmin())`, and if `user()` inside that block is a signal, both are tracked. When either signal changes, Angular re-evaluates the template. Signal tracking in templates is one of the core benefits of Angular\'s reactivity model. A, C, D are wrong.',
  },
  {
    id: 200, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'What is the Angular `@let` template syntax and what problem does it solve?',
    options: [
      '@let creates a template variable that can be reassigned — unlike `#ref` variables',
      '@let declares a local template variable that caches a computed expression, avoiding repeated evaluation. Example: `@let user = currentUser$ | async; @if (user) { {{ user.name }} {{ user.email }} }` — the async pipe subscribes once, and `user` is used multiple times without creating multiple subscriptions',
      '@let imports an external variable from the component class into the template',
      '@let is the template version of TypeScript\'s `let` — it replaces @const for mutable values',
    ],
    answer: 1,
    topicPath: 'let-block',
    explanation: 'B is correct: `@let name = expression` (Angular 18+) evaluates the expression once and binds the result to a local name within the template scope. It solves the "double pipe" problem: instead of writing `(user$ | async)?.name` and `(user$ | async)?.email` (two subscriptions), write `@let user = user$ | async` once and reference `user.name`, `user.email`. Works with any expression — signal calls, pipe chains, method calls. A, C, D are wrong.',
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

@Component({
  selector: 'app-practice',
  imports: [RouterLink],
  styles: [`
    .practice-hero { text-align: center; padding: 48px 24px 32px; }
    .practice-hero h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); margin: 12px 0; }
    .practice-hero p { max-width: 640px; margin: 0 auto 24px; color: var(--text-muted); }
    .stats-row { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px; }
    .stat-box { text-align: center; padding: 12px 20px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }
    .stat-box strong { display: block; font-size: 1.6rem; }
    .stat-box span { font-size: .82rem; color: var(--text-muted); }
    .filters { display: flex; gap: 8px; flex-wrap: wrap; padding: 0 24px 16px; max-width: 900px; margin: 0 auto; }
    .filters button { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; font-size: .84rem; color: var(--text); }
    .filters button.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .challenges { max-width: 900px; margin: 0 auto; padding: 0 24px 60px; display: flex; flex-direction: column; gap: 16px; }
    .challenge-card { border: 1px solid var(--border); border-radius: 14px; overflow: hidden; background: var(--surface); }
    .challenge-card.answered-correct { border-color: #22c55e; }
    .challenge-card.answered-wrong { border-color: #ef4444; }
    .ch-header { display: flex; align-items: flex-start; gap: 12px; padding: 16px 20px 12px; cursor: pointer; }
    .ch-badges { display: flex; gap: 6px; align-items: center; flex-shrink: 0; flex-wrap: wrap; }
    .badge-diff { font-size: .72rem; padding: 3px 8px; border-radius: 20px; font-weight: 600; }
    .badge-diff.junior { background: #dcfce7; color: #166534; }
    .badge-diff.mid { background: #fef9c3; color: #854d0e; }
    .badge-diff.senior { background: #fee2e2; color: #991b1b; }
    .badge-type { font-size: .72rem; padding: 3px 8px; border-radius: 20px; background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); }
    .ch-question { font-weight: 500; font-size: .95rem; flex: 1; }
    .ch-number { font-size: .82rem; color: var(--text-muted); flex-shrink: 0; margin-left: auto; }
    .ch-body { padding: 0 20px 16px; }
    .ch-code { background: #1e1e2e; color: #cdd6f4; border-radius: 8px; padding: 14px 16px; font-size: .82rem; font-family: monospace; white-space: pre-wrap; margin: 10px 0; overflow-x: auto; }
    .options { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; }
    .opt { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; font-size: .9rem; background: transparent; text-align: left; color: var(--text); transition: background .15s; }
    .opt:hover:not(:disabled) { background: var(--surface); }
    .opt.selected { border-color: #6366f1; background: rgba(99,102,241,.08); }
    .opt.correct { border-color: #22c55e; background: rgba(34,197,94,.1); }
    .opt.wrong { border-color: #ef4444; background: rgba(239,68,68,.1); }
    .opt:disabled { cursor: default; }
    .opt-letter { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: .78rem; font-weight: 600; flex-shrink: 0; }
    .ch-submit { margin: 12px 0 0; padding: 8px 20px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: .9rem; }
    .ch-submit:disabled { opacity: 0.5; cursor: default; }
    .explanation { margin: 12px 0 0; padding: 12px 16px; border-radius: 10px; font-size: .88rem; line-height: 1.5; }
    .explanation.correct { background: rgba(34,197,94,.1); border: 1px solid #22c55e; }
    .explanation.wrong { background: rgba(239,68,68,.08); border: 1px solid #ef4444; }
    .explanation strong { display: block; margin-bottom: 4px; }
    .progress-bar-outer { height: 8px; background: var(--border); border-radius: 4px; margin: 0 24px 16px; max-width: 900px; }
    .progress-bar-inner { height: 100%; background: #22c55e; border-radius: 4px; transition: width .3s; }
    .empty-state { text-align: center; padding: 60px 24px; color: var(--text-muted); }
    .reset-btn { margin: 0 24px 0; padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; font-size: .84rem; color: var(--text); }
  `],
  template: `
    <div class="practice-hero">
      <span class="pill">Interactive Practice</span>
      <h1>Practice Challenges</h1>
      <p>
        200 challenges across all levels — spot bugs, predict output, and answer
        multiple-choice questions. Every answer comes with a full explanation.
        Questions are randomized each session.
      </p>
      <div class="stats-row">
        <div class="stat-box">
          <strong>{{ totalVisible() }}</strong>
          <span>challenges</span>
        </div>
        <div class="stat-box">
          <strong>{{ answeredCount() }}</strong>
          <span>answered</span>
        </div>
        <div class="stat-box">
          <strong>{{ correctCount() }}</strong>
          <span>correct</span>
        </div>
        <div class="stat-box">
          <strong>{{ scorePercent() }}%</strong>
          <span>score</span>
        </div>
      </div>
    </div>

    <div class="filters">
      @for (cat of categoryFilters; track cat.id) {
        <button [class.active]="activeCategory() === cat.id" (click)="activeCategory.set(cat.id)">
          {{ cat.label }}
        </button>
      }
    </div>

    <div class="filters" style="margin-top:0;padding-top:0">
      @for (d of diffFilters; track d.id) {
        <button [class.active]="activeDiff() === d.id" (click)="activeDiff.set(d.id)">
          {{ d.label }}
        </button>
      }
      <button class="reset-btn" (click)="reshuffle()" style="margin-left:auto">🔀 Shuffle</button>
      @if (answeredCount() > 0) {
        <button class="reset-btn" (click)="reset()">Reset all</button>
      }
    </div>

    @if (answeredCount() > 0) {
      <div style="max-width:900px;margin:0 auto;padding:0 24px 8px">
        <div class="progress-bar-outer" style="margin:0">
          <div class="progress-bar-inner" [style.width]="scorePercent() + '%'"></div>
        </div>
      </div>
    }

    <div class="challenges">
      @if (visibleChallenges().length === 0) {
        <div class="empty-state">No challenges match the selected filters.</div>
      }
      @for (ch of visibleChallenges(); track ch.id) {
        <div class="challenge-card"
          [class.answered-correct]="getState(ch.id).answered && getState(ch.id).correct"
          [class.answered-wrong]="getState(ch.id).answered && !getState(ch.id).correct">

          <div class="ch-header" (click)="toggleExpand(ch.id)">
            <div style="flex:1">
              <div class="ch-badges">
                <span class="badge-diff {{ ch.difficulty }}">{{ ch.difficulty }}</span>
                <span class="badge-type">{{ typeLabel(ch.type) }}</span>
                <span class="badge-type" style="background:rgba(99,102,241,.1);border-color:#6366f1;color:#6366f1">{{ ch.category }}</span>
              </div>
              <p class="ch-question" style="margin:6px 0 0">{{ ch.question }}</p>
            </div>
            <span class="ch-number">#{{ ch.id }}</span>
          </div>

          @if (isExpanded(ch.id) || getState(ch.id).answered) {
            <div class="ch-body">
              @if (ch.code) {
                <div class="ch-code">{{ ch.code }}</div>
              }

              @if (ch.options) {
                <div class="options">
                  @for (opt of getShuffledChallengeOptions(ch).options; track $index) {
                    <button class="opt"
                      [class.selected]="getState(ch.id).selected === $index && !getState(ch.id).answered"
                      [class.correct]="getState(ch.id).answered && $index === getShuffledChallengeOptions(ch).correctIndex"
                      [class.wrong]="getState(ch.id).answered && getState(ch.id).selected === $index && $index !== getShuffledChallengeOptions(ch).correctIndex"
                      [disabled]="getState(ch.id).answered"
                      (click)="selectOption(ch.id, $index)">
                      <span class="opt-letter">{{ letters[$index] }}</span>
                      {{ opt }}
                    </button>
                  }
                </div>
                @if (!getState(ch.id).answered) {
                  <button class="ch-submit"
                    [disabled]="getState(ch.id).selected === null"
                    (click)="submit(ch)">
                    Submit Answer
                  </button>
                }
              }

              @if (getState(ch.id).answered) {
                <div class="explanation" [class.correct]="getState(ch.id).correct" [class.wrong]="!getState(ch.id).correct">
                  <strong>{{ getState(ch.id).correct ? '✓ Correct!' : '✗ Not quite.' }}</strong>

                  @if (!getState(ch.id).correct) {
                    <div style="margin-top:8px;padding:8px;background:rgba(226,29,72,.08);border-radius:4px;font-size:.85rem">
                      <strong>Correct answer: {{ getCorrectOptionLetter(ch) }}</strong>
                    </div>
                  }

                  <div style="margin-top:12px">
                    {{ ch.explanation }}
                  </div>

                  @if (ch.topicPath) {
                    <a [routerLink]="'/' + ch.topicPath" target="_blank" style="display:inline-block;margin-top:12px;font-size:.82rem;color:var(--blue);text-decoration:underline">
                      📚 Study this topic in detail →
                    </a>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class Practice {
  private readonly states = signal<Record<number, { selected: number | null; answered: boolean; correct: boolean; expanded: boolean }>>({});
  private readonly shuffledAll = signal(shuffle(CHALLENGES));
  private readonly optionsShuffler = new OptionsShuffler();

  readonly activeCategory = signal<Category>('all');
  readonly activeDiff = signal<'all' | Difficulty>('all');

  readonly visibleChallenges = computed(() => {
    const cat = this.activeCategory();
    const diff = this.activeDiff();
    return this.shuffledAll().filter((c) => {
      const catOk = cat === 'all' || c.category === cat;
      const diffOk = diff === 'all' || c.difficulty === diff;
      return catOk && diffOk;
    });
  });

  readonly totalVisible = computed(() => this.visibleChallenges().length);

  readonly answeredCount = computed(() =>
    Object.values(this.states()).filter((s) => s.answered).length,
  );
  readonly correctCount = computed(() =>
    Object.values(this.states()).filter((s) => s.answered && s.correct).length,
  );
  readonly scorePercent = computed(() => {
    const total = this.answeredCount();
    return total === 0 ? 0 : Math.round((this.correctCount() / total) * 100);
  });

  readonly letters = ['A', 'B', 'C', 'D'];

  readonly categoryFilters: { id: Category; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'components', label: 'Components' },
    { id: 'signals', label: 'Signals' },
    { id: 'rxjs', label: 'RxJS' },
    { id: 'forms', label: 'Forms' },
    { id: 'routing', label: 'Routing' },
    { id: 'testing', label: 'Testing' },
    { id: 'performance', label: 'Performance' },
    { id: 'typescript', label: 'TypeScript' },
  ];

  readonly diffFilters: { id: 'all' | Difficulty; label: string }[] = [
    { id: 'all', label: 'All levels' },
    { id: 'junior', label: 'Junior' },
    { id: 'mid', label: 'Mid' },
    { id: 'senior', label: 'Senior' },
  ];

  /**
   * Get shuffled options for a challenge
   * Options are shuffled once per session and reused for consistency
   */
  getShuffledChallengeOptions(ch: Challenge) {
    if (!ch.options) return { options: [], correctIndex: -1 };
    return this.optionsShuffler.getShuffledOptions(ch.id, ch.options, ch.answer as number);
  }

  /**
   * Check if the selected option is correct (accounting for shuffled positions)
   */
  isAnswerCorrect(ch: Challenge, selectedIndex: number): boolean {
    if (!ch.options) return false;
    const shuffled = this.getShuffledChallengeOptions(ch);
    return selectedIndex === shuffled.correctIndex;
  }

  /**
   * Get the correct option letter for display (A, B, C, D)
   */
  getCorrectOptionLetter(ch: Challenge): string {
    if (!ch.options) return '';
    const shuffled = this.getShuffledChallengeOptions(ch);
    return this.letters[shuffled.correctIndex] || '';
  }

  getState(id: number) {
    return this.states()[id] ?? { selected: null, answered: false, correct: false, expanded: false };
  }

  isExpanded(id: number) {
    return this.getState(id).expanded;
  }

  toggleExpand(id: number) {
    const cur = this.getState(id);
    if (cur.answered) return;
    this.states.update((s) => ({ ...s, [id]: { ...cur, expanded: !cur.expanded } }));
  }

  selectOption(id: number, index: number) {
    const cur = this.getState(id);
    if (cur.answered) return;
    this.states.update((s) => ({ ...s, [id]: { ...cur, selected: index } }));
  }

  submit(ch: Challenge) {
    const cur = this.getState(ch.id);
    if (cur.answered || cur.selected === null) return;
    const correct = this.isAnswerCorrect(ch, cur.selected);
    this.states.update((s) => ({
      ...s,
      [ch.id]: { ...cur, answered: true, correct, expanded: true },
    }));
  }

  reset() {
    this.states.set({});
  }

  reshuffle() {
    this.shuffledAll.set(shuffle(CHALLENGES));
    this.states.set({});
    this.optionsShuffler.reset();  // Reset option shuffles when reshuffling questions
  }

  typeLabel(type: ChallengeType): string {
    const map: Record<ChallengeType, string> = {
      'multiple-choice': 'Multiple Choice',
      'spot-the-bug': 'Spot the Bug',
      'predict-output': 'Predict Output',
      'fill-blank': 'Fill in the Blank',
    };
    return map[type];
  }
}
