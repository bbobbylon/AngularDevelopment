/**
 * Shared practice data — the single source of truth for the challenge bank.
 *
 * Both the self-paced Practice page (`practice.ts`) and the timed Mock Exam
 * (`../mock-exam/mock-exam.ts`) import `CHALLENGES`, the `Challenge` type, the
 * category/difficulty unions, and the `shuffle` helper from here so the two
 * features never drift out of sync. Add or edit challenges in this file only.
 */
export type Difficulty = 'junior' | 'mid' | 'senior';
export type Category = 'all' | 'components' | 'templates' | 'styling' | 'signals' | 'rxjs' | 'forms' | 'routing' | 'testing' | 'performance' | 'typescript' | 'security' | 'a11y' | 'state' | 'i18n' | 'tooling';
export type ChallengeType = 'multiple-choice' | 'spot-the-bug' | 'predict-output' | 'fill-blank';

/** Filter chip lists shared by the Practice, Mock Exam and Flashcards pages. */
export const CATEGORY_FILTERS: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'components', label: 'Components' },
  { id: 'templates', label: 'Templates & HTML' },
  { id: 'styling', label: 'Styling & CSS' },
  { id: 'signals', label: 'Signals' },
  { id: 'rxjs', label: 'RxJS' },
  { id: 'forms', label: 'Forms' },
  { id: 'routing', label: 'Routing' },
  { id: 'testing', label: 'Testing' },
  { id: 'performance', label: 'Performance' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'security', label: 'Security' },
  { id: 'a11y', label: 'Accessibility' },
  { id: 'state', label: 'State & Architecture' },
  { id: 'i18n', label: 'i18n' },
  { id: 'tooling', label: 'Tooling & Config' },
];

export const DIFF_FILTERS: { id: 'all' | Difficulty; label: string }[] = [
  { id: 'all', label: 'All levels' },
  { id: 'junior', label: 'Junior' },
  { id: 'mid', label: 'Mid' },
  { id: 'senior', label: 'Senior' },
];

export interface Challenge {
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

export const CHALLENGES: Challenge[] = [
  // --- COMPONENTS ---
  {
    id: 1, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'Which decorator turns a class into an Angular component?',
    options: [
      "@NgModule — groups related components and services into one shared module",
      "@Component — declares a reusable UI element with a template and styles",
      "@Injectable — marks a class as available for dependency injection",
      "@Directive — adds behavior to an existing element without its own template",
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
      "The selector must start with a custom prefix like \"my-\" rather than \"app-\"",
      "The {{ name }} interpolation is written incorrectly and will not bind at all",
      "The component must implement the OnInit lifecycle-hook interface to render",
      "The standalone: true flag is missing from the @Component decorator",
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
    options: [
      "0 — count is never incremented before the query reads it",
      "1 — detectChanges only runs once, after the second click",
      "2 — each click adds 1 and detectChanges re-renders the span",
      "undefined — the span initially contains no text node to read at all",
    ],
    answer: 2,
    explanation: 'Each click() increments count by 1. Two clicks make count = 2. fixture.detectChanges() triggers Angular\'s change detection and re-renders the template with the updated value, so the span text becomes "2". Why others fail: (A) Clicks happen before detectChanges. (B) detectChanges renders the final state. (D) The span displays the interpolated value once detectChanges runs.',
  },
  {
    id: 4, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'When does ngOnChanges fire relative to component initialization?',
    options: [
      "Only once, during initial creation, right before ngOnInit runs",
      "On every change-detection pass, whether or not any @Input changed",
      "Before ngOnInit on the first render, then on each @Input reference change",
      "Only when the component is destroyed or an @Input is removed from the DOM",
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
      "computed() cannot be a const; use let with an explicit generic type",
      "price and tax are signals — call them to read: price() + tax()",
      "A numeric signal and a decimal signal cannot be added due to typing",
      "computed() must return an Observable, not a plain numeric value here",
    ],
    answer: 1,
    explanation: 'Signals are getter functions — to read their current value you must call them: price() and tax(). Writing price + tax tries to add the signal function objects together (resulting in NaN), not their values. The fix is: return price() + price() * tax() for the calculated total. Why others fail: (A) const is the correct declaration for computed. (C) Addition works on numbers regardless of integer or decimal type. (D) computed() returns a Signal<T>, not an Observable.',
  },
  {
    id: 7, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What is the key difference between computed() and effect()?',
    options: [
      "computed() is lazy and memoized (a Signal); effect() runs side effects",
      "They behave identically; effect() is just the async form recommended here",
      "computed() works only in templates; effect() only in services/components",
      "effect() returns a writable signal; computed() returns a read-only one",
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
      "signal() cannot be used inside services; use a BehaviorSubject instead",
      "items is a public writable signal; keep it private, expose asReadonly()",
      "computed() may not reference other signals from its own store class here",
      "Stateful services must extend the NgRx StoreModule or add lifecycle hooks",
    ],
    answer: 1,
    explanation: 'Exposing a writable signal publicly breaks encapsulation — any component can mutate store state directly, bypassing validation or business logic. The fix: make it private readonly _items = signal([]) and expose readonly items = this._items.asReadonly(). All mutations should go through explicit methods like add(item) and remove(id). Why others fail: (A) Signals work perfectly in services. (C) computed() can reference signals from the same class. (D) Signals are a simpler alternative to NgRx.',
  },

  // --- RxJS ---
  {
    id: 9, type: 'multiple-choice', difficulty: 'junior', category: 'rxjs',
    question: 'What is the key difference between map() and switchMap()?',
    options: [
      "map() transforms synchronously; switchMap() cancels stale ones",
      "map() is for filtering streams; switchMap() is for transforming",
      "They are aliases for the same operator, just with different names",
      "switchMap() works only with Observables; map() with any iterable",
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
      "signal() cannot be modified inside a subscribe callback at all",
      "The subscription is never unsubscribed; it leaks after destroy",
      "users$ must be piped through async before subscribing in TS",
      "ngOnInit cannot hold manual subscriptions; use async/await",
    ],
    answer: 1,
    explanation: 'When the component is destroyed, the subscription to users$ keeps running, creating a memory leak and potential errors when updating a destroyed component. Fix options: (1) Use takeUntilDestroyed(inject(DestroyRef)) in the pipe. (2) Use toSignal(this.userService.users$) which auto-unsubscribes. (3) Use the async pipe in the template instead of manual subscribe. Why others fail: (A) Signals can be set in subscribe callbacks. (C) The async pipe is an alternative, not a requirement. (D) Manual subscriptions are fine if properly cleaned up.',
  },
  {
    id: 11, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'Which flattening operator should you use for an HTTP search that cancels stale requests?',
    options: [
      "mergeMap — runs all requests concurrently and emits every result",
      "concatMap — queues the requests sequentially for guaranteed order",
      "switchMap — cancels the previous request and switches to the new",
      "exhaustMap — ignores new requests while one is still in flight",
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
      "Template-driven is faster; Reactive is the more powerful, flexible one",
      "Template-driven derives its state from ngModel; Reactive uses FormControl",
      "They are equivalent; teams merely prefer one form syntax over the other",
      "Reactive forms support signals; Template-driven works only with zones here",
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
      "FormGroup requires FormBuilder; the direct constructor is deprecated now",
      "form.get(\"email\") returns AbstractControl | null; cast it to FormControl",
      "Validators.email is not in @angular/forms; you must import it separately",
      "The form needs an ngSubmit before change detection sees validation state",
    ],
    answer: 1,
    explanation: 'form.get("email") returns AbstractControl | null (could be undefined), but [formControl] expects FormControl<T>. This type mismatch causes binding issues. Fix: create a typed control variable: emailCtrl = this.form.get("email") as FormControl; then use [formControl]="emailCtrl". Better yet, use FormBuilder which is type-safe. Why others fail: (A) FormBuilder is recommended but direct constructor works. (C) Validators.email is built-in. (D) Validation runs regardless of ngSubmit.',
  },

  // --- ROUTING ---
  {
    id: 15, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'What should a route guard\'s CanActivateFn return to allow navigation?',
    options: [
      "null, to indicate that no decision has yet been made",
      "true to allow, false to block, or a UrlTree to redirect",
      "void, to indicate that the guard has finished running",
      "An Observable that emits either true or false eventually",
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
      "inject() cannot be called in a function guard; use the constructor",
      "On false it returns undefined, which Angular treats as allow",
      "Router.navigate() is async; await it or use createUrlTree()",
      "CanActivateFn must return an Observable, not a sync boolean",
    ],
    answer: 1,
    explanation: 'When isLoggedIn() is false, navigate() is called but the function falls off the end and returns undefined. Angular treats undefined as allowing navigation (falsy but not explicitly false). The fix: return inject(Router).createUrlTree(["/login"]) which both redirects AND explicitly blocks. Never call navigate() in a guard — return a UrlTree. Why others fail: (A) inject() works fine in function guards. (C) createUrlTree() is synchronous. (D) It can return Observable but sync boolean is fine.',
  },

  // --- TESTING ---
  {
    id: 17, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'Why is httpMock.verify() important in afterEach with HttpTestingController?',
    options: [
      "It closes the HTTP connection and so it prevents any port exhaustion here",
      "It asserts every expected request was flushed; unhandled ones then fail",
      "It resets the component and the service state in between the test runs",
      "It is optional for GET requests but is required for POST and PUT ones",
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
      "track item.id is wrong here; you should use track $index for indexing",
      "getFilteredItems() runs on every CD pass, re-filtering unchanged data",
      "@for is not able to call methods; use a template variable or a pipe here",
      "signal() cannot be used in a component that also has methods like this",
    ],
    answer: 1,
    explanation: 'getFilteredItems() is a method call in the template. Angular invokes it on every change-detection pass — potentially dozens of times per second. Each call filters the entire array. Fix: replace with a computed signal: readonly filteredItems = computed(() => this.items().filter(i => i.active)). computed() is memoized — only re-runs when items changes. Why others fail: (A) track item.id is correct for identity tracking. (C) @for can call methods. (D) Signals and methods coexist fine.',
  },
  {
    id: 20, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'Which is the correct way to mark an LCP image with fetchpriority in Angular?',
    options: [
      "<img src=\"/hero.jpg\" fetchpriority=\"high\"> — as a raw HTML attribute",
      "<img ngSrc=\"/hero.jpg\" width height priority> — NgOptimizedImage way",
      "<img [src]=\"heroUrl\" [fetchpriority]=\"'high'\"> — a property binding",
      "Angular has no native fetchpriority support; just use plain HTML for it",
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
      "They are completely identical — use whichever one feels natural to you",
      "interface supports declaration merging and extends; type supports unions",
      "type is only for primitive values, while interface is only for object shapes",
      "interface is deprecated; type is now the modern standard to use",
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
      "getUser() should return a Promise instead of a plain union type",
      "user may be undefined; strict null checks block the unsafe access",
      "console.log does not accept objects; you must convert to a string",
      "Arrow functions inside arrays need an explicit return type annotation",
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
      "{ id: number; name: string } — the mapped type applies no changes",
      "{ readonly id: number; readonly name: string } — all props readonly",
      "{ id: Readonly<number>; name: Readonly<string> } — each value wrapped",
      "A type error — readonly cannot be applied to primitive properties",
    ],
    answer: 1,
    explanation: 'Mapped types iterate keys with [K in keyof T]. This type adds readonly to every property. ReadonlyUser becomes { readonly id: number; readonly name: string }. Attempting user.id = 5 is a compile error. This is the actual TypeScript Readonly utility type. Why others fail: (A) readonly is applied. (C) readonly modifies properties, not wraps them. (D) readonly works on any property type.',
  },
  {
    id: 25, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'With ChangeDetectionStrategy.OnPush, which will NOT trigger re-check?',
    options: [
      "An @Input() reference is reassigned to point at a brand-new object value",
      "A DOM event fires inside the component or one of its child components",
      "A signal the template reads updates to a brand-new value",
      "An array property is mutated in place with push (same reference)",
    ],
    answer: 3,
    explanation: 'OnPush components only re-check when: @Input references change, events fire, signals change, or async pipe emits. Mutating an array/object in place (push, splice, obj.prop = x) does NOT change the reference — Angular sees the same object and skips re-check. Always update immutably: this.items = [...this.items, newItem]. Why others fail: (A) Reference change triggers re-check. (B) Events trigger re-check. (C) Signal changes trigger re-check.',
  },

  // --- MORE COMPONENTS ---
  {
    id: 26, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'Which @defer trigger loads deferred content when the browser is idle?',
    options: [
      "on immediate — loads as soon as the deferred block is first encountered",
      "on idle — loads when requestIdleCallback fires and the browser is quiet",
      "on viewport — loads once the placeholder scrolls into the viewport",
      "on interaction — loads on the first click, focus, or keydown in the placeholder",
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
      "output() must be replaced by the older @Output() decorator instead",
      "emit(\"done\") passes a string but the output is typed output<number>()",
      "output() cannot be called inside methods — only in the class body",
      "The component must implement AfterViewInit before it is allowed to use output()",
    ],
    answer: 1,
    explanation: 'output<number>() declares the event emits a number. Calling emit("done") passes a string — a compile-time type error. TypeScript will catch this. Fix: emit the correct type, e.g., this.saved.emit(42). The output() API (Angular 17+) is fully typed, unlike EventEmitter which accepts any. Why others fail: (A) output() is the modern API. (C) output() is called in class body; emit() is in methods. (D) No lifecycle requirement.',
  },
  {
    id: 28, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'What is the architectural relationship between @Component and @Directive?',
    options: [
      "@Component and @Directive are entirely separate, unrelated decorators",
      "@Component is @Directive plus a template — it renders its own DOM view",
      "@Directive is a simplified, cut-down version of @Component for small jobs",
      "They are aliases; the framework picks one based on how you use the class",
    ],
    answer: 1,
    explanation: '@Component extends @Directive under the hood. Every component is a directive that additionally has a template and encapsulated view. @Directive augments an existing element (adds classes, listens to events, DOM manipulation) without creating new DOM. @Component creates and renders a self-contained view. Use @Directive for reusable behaviors; @Component for UI building blocks. Why others fail: (A) They have an inheritance relationship. (C) @Directive is not simplified; directives are powerful. (D) They are not aliases.',
  },

  // --- MORE SIGNALS ---
  {
    id: 29, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What does toSignal(obs$, { initialValue: [] }) guarantee that plain toSignal(obs$) does not?',
    options: [
      "The Observable is eagerly subscribed well before the component renders",
      "Type is Signal<T[]>, not Signal<T[] | undefined>; value exists at once",
      "The signal auto-unsubscribes immediately after its very first emission",
      "The Observable is shared via multicasting across every one of the subscribers",
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
      "effect() is not allowed to be created inside a component constructor",
      "Reading then setting count() in one effect makes an infinite cycle",
      "You must use computed() instead for any kind of numeric state derivation",
      "effect() cannot call signal.set(); only read-only operations are allowed",
    ],
    answer: 1,
    explanation: 'The effect reads count() (registering a dependency) then calls count.set(), which triggers the effect again → infinite loop. Angular detects this and throws. Fix: if you need derived state use computed(). If you must write in an effect, wrap the read in untracked(() => this.count()) so it is not a dependency. Never write to a signal that the same effect reads. Why others fail: (A) effect() works in constructors. (C) computed() is read-only. (D) set() is allowed.',
  },
  {
    id: 31, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'What capability does linkedSignal() offer that computed() lacks?',
    options: [
      "linkedSignal() forges a permanent, unbreakable link between two signals",
      "linkedSignal() is writable — defaults to the derived value but takes .set()",
      "linkedSignal() is the signal-world equivalent of RxJS shareReplay(1)",
      "linkedSignal() converts a signal into an Observable stream automatically for you",
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
      "They are interchangeable — just different names for one operator",
      "combineLatest emits on any change; zip pairs values by index",
      "zip() is for arrays only; combineLatest() is for Observables",
      "combineLatest is deprecated; zip is the modern replacement",
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
      "interval() must be created outside of the component class",
      "Never cleaned up; the interval keeps firing after destroy",
      "switchMap() is the wrong operator for interval-based polling",
      "ngOnInit cannot hold manual subscriptions; use the async pipe",
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
      "setValue() does not actually exist; you must use the set() method instead",
      "setValue() is strict — it needs every control, so omitting lastName throws",
      "FormGroup requires a FormBuilder; the direct constructor is not supported",
      "The object keys have to match each formControlName in the template exactly",
    ],
    answer: 1,
    explanation: 'setValue() is strict — throws "Must supply a value for form control with name: \'lastName\'" if any control is omitted. Use patchValue() for partial updates: it updates only provided keys, ignoring missing ones. Rule: use setValue() when loading a complete model (all keys guaranteed); use patchValue() for partial updates. Why others fail: (A) setValue() is correct. (C) FormBuilder is recommended but direct constructor works. (D) Object structure must match form structure, not template.',
  },
  {
    id: 37, type: 'multiple-choice', difficulty: 'senior', category: 'forms',
    question: 'What does an async validator emit while validation is pending?',
    options: [
      "null — exactly the same as a passing synchronous validator would return",
      "Observable<ValidationErrors | null>; status is PENDING, resolves later",
      "A boolean: true while it is pending, or false once the check is complete",
      "Some kind of ValidationPending sentinel object while it is still running",
    ],
    answer: 1,
    explanation: 'Async validators return Observable<ValidationErrors | null> or Promise<ValidationErrors | null>. While running, the FormControl.status is "PENDING". On completion: null = valid, ValidationErrors object = invalid. In templates: check control.status === "PENDING" to show a loading spinner. Apply debounceTime inside validators to avoid hammering the server on every keystroke. Why others fail: (A) Returns observable, not null. (C) Status is a string. (D) No sentinel needed.',
  },

  // --- MORE ROUTING ---
  {
    id: 38, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'When CanMatchFn returns false vs CanActivateFn returns false, what happens?',
    options: [
      "Both simply block navigation to the current route with no fallback",
      "CanMatch skips the route and tries the next; CanActivate blocks",
      "CanMatchFn is only ever checked for lazy-loaded routes",
      "CanActivateFn always runs before CanMatchFn is evaluated",
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
      "It runs the tests in parallel across several separate OS-level threads",
      "Control time synchronously via tick(ms) and flushMicrotasks() calls",
      "It lets you skip all of the async setup done inside the beforeEach block",
      "Mock the HTTP requests entirely without any HttpTestingController at all",
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
      "querySelector will always return null when you are inside a unit test",
      "fixture.detectChanges() was never called, so the DOM never re-rendered",
      "The component.user field should really be set via a signal instead here",
      "toContain should have been toBe for doing an exact text-match comparison",
    ],
    answer: 1,
    explanation: 'Assigning component.user changes the TypeScript value but does not run change detection. The DOM still shows whatever was rendered from the previous detectChanges() call. The test passes only if the initial render happens to contain "Alice". Fix: call fixture.detectChanges() after setting the property to trigger re-render. This updates the DOM before the assertion. Why others fail: (A) querySelector works in tests. (C) Plain objects work; signals are optional. (D) toContain is correct for substring matching.',
  },
  {
    id: 42, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'What advantage do Angular Component Harnesses have over raw querySelector?',
    options: [
      "Harnesses run about ten times faster than the raw DOM queries do here",
      "They expose a semantic API (click, getValue) so tests survive refactors",
      "Harnesses will only ever work with the Angular Material components here",
      "Harnesses automatically add all of the needed accessibility attributes",
    ],
    answer: 1,
    explanation: 'querySelector tests are brittle — changing div to button, renaming a CSS class, or restructuring DOM breaks them even if behavior is unchanged. Harnesses wrap the component behind a semantic behavioral API. When you refactor the DOM, only the harness implementation changes; tests stay the same. Angular Material ships harnesses for every component. For custom components, extend ComponentHarness. Test behaviors, not implementation. Why others fail: (A) Speed is similar. (C) Harnesses work with any component. (D) Harnesses do not add attributes.',
  },

  // --- MORE PERFORMANCE ---
  {
    id: 43, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'What does "prefetch on idle" do in an @defer block?',
    options: [
      "Loads AND renders the deferred block the moment the browser goes idle",
      "Downloads the lazy chunk during idle so later rendering is instant",
      "Disables the whole deferred block whenever on a slow network connection",
      "Inlines the deferred chunk straight back into the main app bundle again",
    ],
    answer: 1,
    explanation: '@defer separates "when to prefetch" from "when to render". Example: @defer (on interaction; prefetch on idle) downloads the chunk during idle time before the user interacts, so interaction renders immediately without delay. Without prefetch, interaction has latency while downloading. This is Angular\'s equivalent of <link rel="prefetch"> scoped to a component. Combine with "on viewport" for below-fold content. Why others fail: (A) Renders only when trigger fires. (C) Prefetch happens regardless of connection. (D) Prefetch does not inline.',
  },
  {
    id: 44, type: 'spot-the-bug', difficulty: 'senior', category: 'performance',
    question: 'This image causes CLS and dev-mode warnings. What is missing?',
    code: `<img ngSrc="/assets/hero.webp" alt="Hero banner" priority />`,
    options: [
      "ngSrc requires absolute URLs here; relative paths are just not supported",
      "width and height are required — the browser cannot reserve layout space",
      "The priority attribute directly conflicts with ngSrc and cannot be used",
      "The .webp image format is simply not supported by NgOptimizedImage here",
    ],
    answer: 1,
    explanation: 'NgOptimizedImage requires explicit width and height on every image. These establish the aspect ratio so the browser reserves exact layout space before the image loads — preventing CLS (Cumulative Layout Shift). Without them, the image loads, DOM shifts, causing visual jank. NgOptimizedImage throws a dev-mode error if width/height are missing. Fix: <img ngSrc="/assets/hero.webp" width="1200" height="400" alt="Hero banner" priority />. Width/height set intrinsic dimensions, not CSS display size. Why others fail: (A) Relative paths work fine. (C) priority is required. (D) .webp is supported.',
  },
  {
    id: 45, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'What is the single most impactful technique to reduce initial JS download?',
    options: [
      "Disable optimization in angular.json to cut the minification overhead",
      "Route-level code splitting with loadComponent/loadChildren per route",
      "Remove all of the TypeScript type annotations to shrink the bundle down",
      "Apply OnPush change detection to every single one of your components here",
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
      "string — it allows any arbitrary property name at all",
      "\"host\" | \"port\" | \"debug\" — a union of literal key names",
      "string | number | boolean — the union of the value types",
      "never — the object has no valid keys to extract",
    ],
    answer: 1,
    explanation: 'keyof T produces a union of literal property key names. typeof config is { host: string; port: number; debug: boolean }. keyof typeof config is "host" | "port" | "debug". This is useful for type-safe accessors: function get<T, K extends keyof T>(obj: T, key: K): T[K] — TypeScript infers the return type from the specific key. Use it to reference an object\'s keys at the type level. Why others fail: (A) keyof produces literal unions, not string. (C) keyof produces property names, not value types. (D) There are valid keys.',
  },
  {
    id: 47, type: 'multiple-choice', difficulty: 'senior', category: 'typescript',
    question: 'What does "as const" do to an array that a regular type annotation does not?',
    code: `const ROLES = ['admin', 'editor', 'viewer'] as const;`,
    options: [
      "Makes the array fully immutable at runtime, blocking push and splice",
      "Narrows to readonly [\"admin\",\"editor\",\"viewer\"], enabling union types",
      "Converts the array into a const enum at compile time instead",
      "Stops the array's literal values from being tree-shaken from the bundle",
    ],
    answer: 1,
    explanation: 'Without "as const", ROLES has type string[] — TypeScript only knows it is an array of strings, not which strings. With "as const", the type is readonly ["admin", "editor", "viewer"] — every literal is preserved. This lets you derive a union: type Role = typeof ROLES[number] gives "admin" | "editor" | "viewer". Without "as const" you would get string. This pattern is more tree-shake-friendly than const enums and transparent at runtime. Why others fail: (A) Does not make runtime immutable. (C) Not a const enum. (D) Does not prevent tree-shaking.',
  },

  // --- ARCHITECTURE ---
  {
    id: 48, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'If a service is in BOTH root injector and component.providers, which instance do descendants get?',
    options: [
      "The root singleton instance — the root injector always takes precedence",
      "The component-scoped instance — the nearest injector in the tree wins",
      "Both instances, merged together into an array of providers",
      "Angular throws a duplicate-provider compilation error at build time",
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
      "providedIn: \"root\" services cannot use constructor injection at all",
      "AuthService needs RouterService to build, which needs AuthService back",
      "Two services are simply not allowed to reference each other at root scope",
      "Constructor parameters must each carry an explicit @Inject() decorator",
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
      "It emits a custom \"active\" event whenever the host element is clicked by the user",
      "It toggles the \"active\" class on the host element to match the isActive field",
      "It binds the host element's class attribute as a read-only string value",
      "It is equivalent to putting [class]=\"isActive\" on a child element",
    ],
    answer: 1,
    explanation: 'B is correct: `@HostBinding("class.active")` binds a class on the directive\'s own host element — the element the directive selector matches. When `isActive` is true the class is added; false removes it. This is the declarative alternative to `renderer.addClass(el, "active")`. A is wrong — that is @Output/EventEmitter. C is wrong — it is not read-only. D is wrong — @HostBinding targets the host itself, not a child.',
  },
  {
    id: 52, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What is the difference between `@ContentChild` and `@ContentChildren`?',
    options: [
      "@ContentChild returns the first match; @ContentChildren returns a QueryList",
      "@ContentChild is for components while @ContentChildren is only for directives",
      "@ContentChildren resolves asynchronously; @ContentChild resolves synchronously",
      "They are identical — @ContentChildren is merely the plural alias of the other",
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
      "ngTemplateOutlet must be placed on an <ng-template> element, never on an <ng-container>",
      "The name context variable is never passed — add [ngTemplateOutletContext]",
      "let-name is invalid syntax; you must write let-name=\"name\" with a value",
      "<ng-template> elements are not allowed to contain interpolation bindings",
    ],
    answer: 1,
    explanation: 'B is correct: `let-name` declares a local variable bound from the context\'s `$implicit` property, but no context is passed via `[ngTemplateOutletContext]`. Without it, `name` is `undefined` and the paragraph renders "Hello ". Fix: add `[ngTemplateOutletContext]="{ $implicit: \'World\' }"`. A is wrong — `<ng-container>` is the correct host for `ngTemplateOutlet`. C is wrong — `let-name` (no value) binds `$implicit` by convention. D is wrong — templates support interpolation.',
  },
  {
    id: 54, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'When is `ngAfterContentInit` called relative to `ngAfterViewInit`?',
    options: [
      "ngAfterViewInit fires first, because the component view renders before content projects",
      "ngAfterContentInit fires first — projected content initializes before the view",
      "They both fire simultaneously in the same change-detection pass",
      "The order depends on whether the component uses OnPush change detection",
    ],
    answer: 1,
    explanation: 'B is correct: Angular\'s lifecycle order is ngOnInit → ngAfterContentInit → ngAfterContentChecked → ngAfterViewInit → ngAfterViewChecked. Content projection (what goes into `<ng-content>`) is resolved before the component\'s own view is fully initialised. Use `ngAfterContentInit` to work with `@ContentChild` queries and `ngAfterViewInit` for `@ViewChild` queries. A reverses the order. C is wrong — they are separate lifecycle phases. D is wrong — OnPush does not change lifecycle order.',
  },
  {
    id: 55, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'Which syntax projects content into a named slot `<ng-content select="[footer]">`?',
    options: [
      "<app-card><footer>Save</footer></app-card>",
      "<app-card><span slot=\"footer\">Save</span></app-card>",
      "<app-card><span footer>Save</span></app-card>",
      "<app-card footer=\"Save\"></app-card>",
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
    options: [
      "<li>1</li><li>2</li><li>3</li>",
      "<li>2</li><li>4</li><li>6</li>",
      "Nothing — ngTemplateOutlet is not supported inside an @for block",
      "<li>NaN</li><li>NaN</li><li>NaN</li>",
    ],
    answer: 1,
    explanation: 'B is correct: each `@for` iteration passes the current item as `$implicit` context. Inside the template, `let-n` binds to `$implicit`, so `n` is 1, 2, 3. The expression `n * 2` produces 2, 4, 6. A is wrong — the template doubles the value. C is wrong — `ngTemplateOutlet` works inside any control flow. D is wrong — numbers multiply correctly.',
  },
  {
    id: 57, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'When is `ViewContainerRef.createEmbeddedView(templateRef, context)` used over `ngTemplateOutlet`?',
    options: [
      "createEmbeddedView is older and deprecated — always prefer ngTemplateOutlet",
      "createEmbeddedView is imperative — insert a template from TypeScript at runtime",
      "createEmbeddedView compiles a template string; ngTemplateOutlet needs a fixed one",
      "createEmbeddedView returns a Promise, whereas ngTemplateOutlet is synchronous",
    ],
    answer: 1,
    explanation: 'B is correct: `createEmbeddedView` is the imperative API for inserting a `TemplateRef` into a `ViewContainerRef` from TypeScript. It is the building block that `*ngIf` and custom structural directives use under the hood. `ngTemplateOutlet` is the declarative template equivalent. Use `createEmbeddedView` when the insertion logic must live in a service or factory. A is wrong — both have valid use cases. C is wrong — both require a `TemplateRef`. D is wrong — both are synchronous.',
  },
  {
    id: 58, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'What is the key structural difference between an attribute directive and a structural directive?',
    options: [
      "Attribute directives use @Directive while structural ones use @Component",
      "Structural directives add/remove DOM via TemplateRef; attribute ones restyle it",
      "Attribute directives need a [] selector; structural directives need a * selector",
      "Structural directives can only ever be applied to <ng-template> elements",
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
      "ElementRef requires the Renderer2 service before you can ever read its nativeElement",
      "canvas is undefined in ngOnInit — the view is not built yet; use ngAfterViewInit",
      "The template variable name must exactly match the class field name",
      "@ViewChild does not work at all unless you pass { static: true } to it",
    ],
    answer: 1,
    explanation: 'B is correct: `@ViewChild` queries are resolved after the component\'s view is created, which happens AFTER `ngOnInit`. In `ngOnInit` the canvas is still `undefined`, causing a null-reference error. Move DOM access to `ngAfterViewInit`. A is wrong — `nativeElement` is a direct property, no Renderer2 needed for reading. C is wrong — the string `"myCanvas"` matches the `#myCanvas` template variable regardless of the class field name. D is wrong — `{ static: true }` only matters for queries that must be available in ngOnInit (elements not inside *ngIf/@if).',
  },
  {
    id: 60, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'What does `ViewEncapsulation.None` do to a component\'s styles?',
    options: [
      "Styles are completely removed — the component then relies only on global CSS rules",
      "Styles go global with no scoping — they leak out and hit other components",
      "Styles use real browser Shadow DOM for complete, native isolation",
      "Each individual style rule is inlined onto the element's style attribute",
    ],
    answer: 1,
    explanation: 'B is correct: `ViewEncapsulation.None` adds the component\'s styles to the global stylesheet without any scoping attributes. Every rule can potentially match elements in other components — a dangerous choice for shared components. Use `None` only for global reset or theming components. `Emulated` (default) scopes via generated attributes like `[_ngcontent-abc]`. `ShadowDom` uses native Shadow DOM isolation. A is wrong — styles are still written. C describes `ShadowDom`. D describes inline styles.',
  },
  {
    id: 61, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'An `@Input()` is decorated with `transform: numberAttribute`. What does this do?',
    options: [
      "It validates the input at runtime, throwing whenever a non-number value is passed",
      "It coerces the bound value to a number, so count=\"5\" arrives as the number 5",
      "It applies a CSS transform to the element whenever the input changes",
      "It makes the input accept only boxed Number objects, never primitives",
    ],
    answer: 1,
    explanation: 'B is correct: `@Input({ transform: numberAttribute })` (Angular 16+) pipes the bound value through a transform function before assigning it to the property. Since HTML attributes are always strings, `count="5"` arrives as the string `"5"` — without the transform. With it, Angular converts `"5"` to the number `5` automatically. A is wrong — it converts, not validates/throws. C is wrong — `transform` refers to the input transform function, not CSS. D is wrong.',
  },
  {
    id: 62, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'What is the difference between `afterRender()` and `afterNextRender()`?',
    options: [
      "afterRender runs once; afterNextRender runs after every render cycle",
      "afterNextRender runs once after the next paint; afterRender runs after each one",
      "They are completely identical — afterNextRender is afterRender with { once: true }",
      "afterRender is only for SSR, whereas afterNextRender is browser-only",
    ],
    answer: 1,
    explanation: 'B is correct: `afterNextRender()` fires exactly once after the next browser paint — useful for one-time setup like initialising a third-party chart library. `afterRender()` fires after every render cycle for the component\'s lifetime — useful for work that must react to every DOM update (e.g., measuring element dimensions after each layout change). Both run in the browser only (not SSR). A reverses the two. C is wrong — they are distinct APIs. D is wrong — both are browser-only.',
  },
  {
    id: 63, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'A component\'s template has `{{ getUser() }}`. Why can this be a performance problem?',
    options: [
      "Method calls inside templates are forbidden outright in Angular 17+",
      "Angular re-runs getUser() on every change-detection cycle — wasteful and risky",
      "Method calls in a template silently bypass OnPush change detection",
      "Template expressions are only ever allowed to read properties, never call methods",
    ],
    answer: 1,
    explanation: 'B is correct: Angular re-evaluates every template expression on each change detection cycle. A method called in a template runs every cycle — if it is expensive (filtering a large array) or returns a new object each call, it wastes CPU and can cause infinite detection loops. The fix: use a computed signal, a `get` accessor with memoisation, or the `async` pipe. A is wrong — calls are allowed. C is wrong — OnPush still calls template methods when it runs detection. D is wrong.',
  },
  {
    id: 64, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What does `@Component({ host: { "(click)": "handleClick($event)" } })` do?',
    options: [
      "It attaches a click event listener onto the component's first child element instead",
      "It is the metadata form of @HostListener — a click listener on the host element",
      "It stops click events from reaching any of the child elements",
      "It overrides the browser's default click behavior for the component",
    ],
    answer: 1,
    explanation: 'B is correct: the `host` metadata object supports event bindings like `"(click)": "handler($event)"` and property bindings like `"[class.active]": "isActive"`. This is the metadata equivalent of `@HostListener` and `@HostBinding`. Both approaches produce identical results. A is wrong — it targets the host, not a child. C is wrong — it does not stop propagation to children. D is wrong — use `event.preventDefault()` inside the handler for that.',
  },
  {
    id: 65, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'What is the Directive Composition API (`hostDirectives`) and what problem does it solve?',
    options: [
      "It lets several components share a single template by all declaring one parent directive",
      "It attaches directives to a component's host, composing behavior without subclassing",
      "It lets one directive apply to many element types via multiple host selectors",
      "It overrides a parent component's directive without creating a subclass",
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
      "http.get() is simply not allowed to be called inside of an effect",
      "The .subscribe() is never cleaned up, so rapid changes stack subscriptions",
      "this.user.set() is simply not allowed to be called inside of an effect",
      "effect() re-runs synchronously on every single change-detection cycle here",
    ],
    answer: 1,
    explanation: 'B is correct: each time `userId` changes, the effect re-runs and creates a NEW subscription, but the previous one is never unsubscribed. Multiple in-flight HTTP requests accumulate. Fix: use the cleanup function — `effect((onCleanup) => { const sub = ...; onCleanup(() => sub.unsubscribe()); })` — or better, replace the pattern with `resource(() => ({ request: this.userId(), loader: ({ request: id }) => firstValueFrom(this.http.get(\'/api/user/\' + id)) }))`. C is wrong — `set()` is allowed in effects (though using computed() is cleaner for derived values).',
  },
  {
    id: 67, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What does `signal([], { equal: (a, b) => a.length === b.length })` achieve?',
    options: [
      "The signal will only ever store arrays — the equal function is a type guard",
      "Same-length arrays are treated as equal, so consumers are not notified",
      "The signal throws whenever you set an array of a different length than before",
      "It switches on deep structural equality checking for the nested array items",
    ],
    answer: 1,
    explanation: 'B is correct: signals use `Object.is()` by default. A custom `equal` function overrides this — Angular only notifies dependents when the function returns `false`. Here, two arrays of equal length are treated as identical regardless of content. This is a performance optimisation for cases where length is the only thing views care about. A is wrong — no type guard. C is wrong — it does not throw. D is wrong — the function shown compares only length.',
  },
  {
    id: 68, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What does `toObservable(mySignal)` return and when does it emit?',
    options: [
      "A Promise that resolves once to the signal's current value on read",
      "An Observable that emits the value now, then on every later change",
      "A Subject you must manually push the signal's values into yourself",
      "An Observable that emits once with the final value on component destroy",
    ],
    answer: 1,
    explanation: 'B is correct: `toObservable(signal)` from `@angular/core/rxjs-interop` creates an Observable that emits the current value synchronously on subscription (via `ReplaySubject(1)` semantics) and then emits on every subsequent signal change. It creates an internal `effect()` to watch the signal and push to the Subject. Use it to bridge signals with RxJS operators. A is wrong — it is an Observable, not a Promise. C is wrong — it is auto-managed. D is wrong — it is a live stream.',
  },
  {
    id: 69, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'What does `untracked(() => this.sideEffectValue())` do inside a `computed()` or `effect()`?',
    options: [
      "The read is not tracked as a dependency, so the context will not re-run",
      "It logs the signal read to the Angular DevTools without a dependency",
      "It takes a one-time snapshot of the value that then never updates again",
      "It throws if used inside a computed — it is valid only within effects",
    ],
    answer: 0,
    explanation: 'A is correct: `untracked()` executes a function outside the reactive tracking context. Any signals read inside `untracked()` are NOT registered as dependencies. This is useful when you need a signal\'s value for a side-effect purpose but do not want the computed/effect to re-run when that signal changes. B is wrong — no DevTools logging occurs. C is wrong — it does not snapshot; the value is live if called again later. D is wrong — `untracked` works in both computed and effect.',
  },
  {
    id: 70, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'What is the recommended pattern for a signal-based service store in Angular?',
    options: [
      "Export one global signal object and mutate it freely from any component",
      "Private writable signals, public readonly/asReadonly, named mutators",
      "Keep state in a BehaviorSubject and pipe it to a signal in each component",
      "Store all of the state in the router query params so it syncs to the URL",
    ],
    answer: 1,
    explanation: 'B is correct: the "mini-store" pattern: private `_items = signal<Item[]>([])`, public `readonly items = this._items.asReadonly()`, public `addItem(item: Item)` method. This gives components read access but only the service can mutate state, preventing race conditions and making state flows traceable. A is wrong — global mutable signals produce untraceable mutations. C works but mixes paradigms unnecessarily. D is wrong — router query params do not auto-sync with signals.',
  },
  {
    id: 71, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What are the three status values a `resource()` can have?',
    options: [
      "Just three: \"loading\", \"loaded\", and \"error\"",
      "\"idle\", \"loading\", \"resolved\", \"error\", \"refreshing\" — five string values",
      "Idle, Loading, Resolved, Error, Refreshing (the ResourceStatus enum)",
      "Just three: \"pending\", \"complete\", and \"failed\"",
    ],
    answer: 2,
    explanation: 'C is correct: Angular\'s `resource()` API exposes a `status` signal with the `ResourceStatus` enum values: `Idle` (not yet fetched), `Loading` (initial fetch in progress), `Resolved` (data available), `Error` (fetch failed), `Refreshing` (re-fetching while existing data is shown). Check `resource.isLoading()` as a convenience boolean. A and D use wrong names. B gets the count right but uses string names incorrectly.',
  },
  {
    id: 72, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'When would you use `rxResource()` instead of `resource()`?',
    options: [
      "rxResource() is always faster, so you should just prefer it every time",
      "When the loader returns an Observable (HttpClient) instead of a Promise",
      "rxResource() caches its results permanently; resource() never caches at all",
      "rxResource() works under SSR while resource() is strictly browser-only",
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
      "It chains two signals so setting one sets the other, bidirectionally",
      "A writable signal that resets to a derived value when its source changes",
      "A performance-tuned variant of computed() for deeply nested object trees",
      "It links a signal to an Observable stream so it updates automatically here",
    ],
    answer: 1,
    explanation: 'B is correct: `linkedSignal({ source: items, computation: items => items[0] })` creates a writable signal that resets to `items[0]` whenever `items` changes, but can be overridden by the user in between resets. `computed()` is purely derived and read-only. Use `linkedSignal()` for "selected item defaults to first but user can change" patterns. A is wrong — it is not bidirectional linking. C is wrong. D is wrong.',
  },
  {
    id: 76, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What does `readonly items = viewChildren(ItemComponent)` return?',
    options: [
      "A plain array holding the matching ItemComponent instances in the view",
      "A Signal<ReadonlyArray<ItemComponent>> that updates as children change",
      "A QueryList<ItemComponent> that emits whenever the children change here",
      "One ItemComponent instance — use viewChildren for the plural form here",
    ],
    answer: 1,
    explanation: 'B is correct: `viewChildren(ItemComponent)` (Angular 17+) is the signal-based plural query. It returns a `Signal<ReadonlyArray<T>>` — you read it as `this.items()` and it reactively updates when the list changes. A is wrong — it is a signal, not a plain array. C is wrong — `QueryList` is the old `@ViewChildren` API. D is wrong — `viewChildren` IS the plural form.',
  },
  {
    id: 77, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What is the key difference between `signal()` state and `FormControl` reactive state?',
    options: [
      "Signals are synchronous and type-safe; FormControl is Observable-based",
      "FormControl renders faster; signal() is the faster option for services",
      "Signals cannot hold complex objects; FormControl is built for nested data",
      "They are equivalent — Angular converts signals to FormControls for you",
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
      "computed() flatly does not allow any conditional logic inside its body",
      "A throw marks the computed errored and re-throws to every reader of it",
      "The error is swallowed silently, so result() simply returns undefined",
      "computed() catches the thrown error for you and returns null in its place",
    ],
    answer: 1,
    explanation: 'B is correct: if a `computed()` getter throws, Angular stores the error and re-throws it every time the computed signal is read. Any template expression that reads it will throw during change detection. Handle this by either catching inside the computed (`try/catch` returning a fallback), or guarding reads with `@if (divisor() !== 0)`. A is wrong — conditional logic is fine. C is wrong — errors are not swallowed. D is wrong — no automatic null fallback.',
  },
  {
    id: 79, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'How do you run code after ALL pending signal effects have flushed in a test?',
    options: [
      "Simply call fixture.detectChanges() a second consecutive time",
      "Use TestBed.flushEffects() (or tick() in fakeAsync); they are async",
      "Effects flush automatically once you read a signal — no test code needed",
      "Wrap the assertion in a setTimeout(() => { ... }, 0) callback instead",
    ],
    answer: 1,
    explanation: 'B is correct: Angular effects are scheduled microtasks. In tests, `TestBed.flushEffects()` (Angular 18+) or `tick()` inside `fakeAsync()` forces all pending effects to run immediately. Without it, assertions run before the effect fires and the test sees stale state. A is wrong — `detectChanges()` runs change detection but does not guarantee effect flushing. C is wrong — reading a signal does not trigger effect execution. D is wrong — using setTimeout makes tests brittle.',
  },
  {
    id: 80, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'Why should you avoid writing `effect(() => { this.b.set(this.a() + 1); })`?',
    options: [
      "Calling set() inside any effect is simply not allowed by the framework",
      "It syncs one signal to another via a side effect — use computed() instead",
      "The effect will throw because doing this creates a real dependency cycle here",
      "Effects that call set() were formally deprecated back in Angular 18+",
    ],
    answer: 1,
    explanation: 'B is correct: the Angular team explicitly discourages using `effect()` to copy signal values from one to another. `computed()` is synchronous, lazy, and glitch-free — it guarantees the derived value is always consistent. `effect()` fires asynchronously after render, meaning there is a brief window where `b` has not yet updated. Use `const b = computed(() => a() + 1)` instead. A is wrong — you CAN set inside effects (with `allowSignalWrites: true` or the modern API). C is wrong — cycles only occur if both signals read each other. D is wrong.',
  },

  // ─── RXJS 81-95 ─────────────────────────────────────────────────────────────
  {
    id: 81, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'What is the difference between `shareReplay(1)` and `share()`?',
    options: [
      "share() replays the last value to late subscribers; shareReplay does not",
      "shareReplay(1) replays the last value to new subscribers; share does not",
      "They are identical — shareReplay is just an alias with a buffer",
      "share() refcounts automatically; shareReplay keeps the source alive",
    ],
    answer: 1,
    explanation: 'B is correct: `share()` is equivalent to `multicast(new Subject()).refCount()` — when all subscribers unsubscribe the source is torn down; late subscribers miss past emissions. `shareReplay(1)` (with `refCount: true`) replays the last value to any new subscriber even after the source completes — critical for HTTP requests used by multiple components. A reverses them. C is wrong. D partially true for `shareReplay({ bufferSize: 1, refCount: false })` — the default refCount behaviour changed in RxJS 6.4.',
  },
  {
    id: 82, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'In `catchError`, what is the difference between returning `of(null)` vs returning `EMPTY`?',
    options: [
      "of(null) completes the stream; EMPTY throws a brand-new error",
      "of(null) emits one null then completes; EMPTY emits nothing",
      "EMPTY emits undefined; of(null) emits null — effectively the same",
      "of(null) retries the source; EMPTY cancels the subscription",
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
      "It scans the source for a value and filters non-matching ones",
      "It accumulates like Array.reduce but emits each running result",
      "It buffers all emissions and emits them as one array at the end",
      "It is identical to reduce() but works on hot Observables",
    ],
    answer: 1,
    explanation: 'B is correct: `scan((acc, val) => acc + val, 0)` on `of(1, 2, 3)` emits 1, 3, 6 — unlike `reduce()` which only emits the final value. `scan()` emits after EVERY item, making it perfect for building a running total, an accumulated array (`scan((acc, item) => [...acc, item], [])`), or an event log. A is wrong — that is `filter`. C is wrong — that is `toArray()`. D is wrong — `reduce()` emits only the final value (and only when the source completes); `scan()` emits each intermediate value.',
  },
  {
    id: 85, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'When should you use `throttleTime(1000)` vs `debounceTime(1000)`?',
    options: [
      "throttleTime waits 1s after the last event; debounceTime every 1s",
      "debounceTime emits after 1s of silence; throttleTime emits first",
      "They are identical — use whichever one is already imported",
      "throttleTime is deprecated; you should always use debounceTime",
    ],
    answer: 1,
    explanation: 'B is correct: `debounceTime(300)` waits for a pause — fire only after the user stops typing for 300ms. `throttleTime(1000)` rate-limits — fire immediately but then ignore events for 1000ms. Use debounce for inputs, search, autocomplete. Use throttle for scroll, resize, drag, or any rapid event where you want a guaranteed max frequency. A reverses them. C is wrong. D is wrong.',
  },
  {
    id: 86, type: 'multiple-choice', difficulty: 'junior', category: 'rxjs',
    question: 'What is the RxJS way to fire a callback every 500ms indefinitely?',
    options: [
      "Observable.interval(500) — the static creation helper method",
      "interval(500) from \"rxjs\" — emits 0, 1, 2... every 500ms",
      "timer(500) from \"rxjs\" — the recurring timer creator",
      "fromEvent(window, \"timer\", 500) — a timer DOM event",
    ],
    answer: 1,
    explanation: 'B is correct: `interval(500)` from the `rxjs` package emits an incrementing integer (0, 1, 2...) every 500ms indefinitely. You subscribe and clean up via `takeUntilDestroyed()` or `unsubscribe()`. A is wrong — no `Observable.interval` static method exists. C is wrong — `timer(500)` fires ONCE after 500ms and completes; `timer(500, 500)` repeats. D is wrong — `fromEvent` is for DOM events.',
  },
  {
    id: 87, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'What does `withLatestFrom(b$)` do when applied to source Observable `a$`?',
    options: [
      "It merges a$ and b$ so the two run fully in parallel",
      "When a$ emits, it grabs b$'s latest and pairs them as a tuple",
      "It replaces each a$ emission with the latest b$ value",
      "It subscribes to b$ first and waits for it to complete before a$",
    ],
    answer: 1,
    explanation: 'B is correct: `withLatestFrom(b$)` combines the latest `a$` emission with the most recent `b$` value. It only subscribes to `b$` once (when the outer Observable subscribes) and reads its cached latest value on each `a$` emission. If `b$` has not yet emitted, the `a$` value is silently dropped. Use it for "on this action, also grab the current state". A is wrong — it is not merge. C is wrong. D is wrong.',
  },
  {
    id: 88, type: 'multiple-choice', difficulty: 'senior', category: 'rxjs',
    question: 'What is the purpose of `defer(() => observable$)` in RxJS?',
    options: [
      "It delays the subscription to observable$ by one microtask",
      "It runs the factory fresh for each subscriber, making it lazy",
      "It stores the Observable reference and replays it on subscribe",
      "It is equivalent to shareReplay(1) but without any caching",
    ],
    answer: 1,
    explanation: 'B is correct: `defer(factory)` calls `factory()` fresh for each subscriber, ensuring each gets a brand new Observable. Use it when the Observable depends on a value that may change between subscriptions (e.g., `defer(() => of(Date.now()))`), or to defer the creation of a hot Observable until subscription. A is wrong — it is not a time delay. C is wrong. D is wrong — defer has no caching.',
  },
  {
    id: 89, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'Which is the RECOMMENDED modern way to clean up a subscription in an Angular service?',
    options: [
      "Store the subscription and call unsubscribe() in ngOnDestroy",
      "Use takeUntilDestroyed(this.destroyRef); it auto-completes",
      "Always use the async pipe so Angular manages the lifecycle",
      "Use take(1) so the Observable completes after one emission",
    ],
    answer: 1,
    explanation: 'B is correct: `takeUntilDestroyed()` (Angular 16+) is the cleanest pattern for services and components. Inject `DestroyRef` (or use the overload `takeUntilDestroyed(inject(DestroyRef))`). The stream auto-completes when the context is destroyed — no `ngOnDestroy` boilerplate. A works but is verbose. C works for templates but not service-side subscriptions. D only works for single-emission Observables.',
  },
  {
    id: 90, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'What does `pairwise()` emit?',
    options: [
      "It emits values in pairs, waiting for two then resetting",
      "It emits [prev, curr] for every emission after the first",
      "It combines two Observables into pairs, exactly like zip()",
      "It is functionally identical to bufferCount(2) in every case",
    ],
    answer: 1,
    explanation: 'B is correct: `pairwise()` on `of(1, 2, 3, 4)` emits `[1,2]`, `[2,3]`, `[3,4]` — sliding window of the previous and current value. The first value is always dropped because there is no previous to pair it with. Use it to detect direction changes (previous route vs current route), calculate deltas, or animate between states. A is wrong — pairwise does not reset. C is wrong — zip takes multiple sources. D is wrong — bufferCount(2) would emit [1,2] then [3,4] (non-overlapping).',
  },
  {
    id: 91, type: 'multiple-choice', difficulty: 'senior', category: 'rxjs',
    question: 'In an Angular service, `http.get("/config")` is called in the constructor. What is the problem?',
    options: [
      "HttpClient simply cannot be used inside service constructors",
      "http.get() is cold; nothing subscribes, so no request fires",
      "The request fires but the response is lost with no subscriber",
      "Angular retries the request automatically if it fails once",
    ],
    answer: 1,
    explanation: 'B is correct: `http.get()` returns a COLD Observable. Simply calling it creates an Observable object but no HTTP request is made until a subscriber calls `.subscribe()`. This is the most common Angular gotcha for developers coming from Promises. Fix: `.subscribe(res => this.config = res)`, use `toSignal(http.get(...))`, or store and expose the Observable for consumers to subscribe. A is wrong — HttpClient works in constructors. C is wrong — if no one subscribes there is no request at all. D is wrong.',
  },
  {
    id: 92, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'What is the practical difference between `first()` and `take(1)`?',
    options: [
      "first() throws EmptyError on no emit; take(1) stays silent",
      "take(1) waits for completion; first() unsubscribes after one",
      "first() applies only to BehaviorSubject; take(1) to any source",
      "They are completely identical in every possible case",
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
      "retry() must always be placed after catchError() in the pipe",
      "retry(3) retries on ANY error, even a 404; filter to transient",
      "catchError is not allowed to re-throw an error; return EMPTY instead",
      "The subscription is GC'd because no reference is stored",
    ],
    answer: 1,
    explanation: 'B is correct: `retry(3)` blindly retries on any error — including 404 Not Found or 403 Forbidden that will NEVER succeed no matter how many times you retry. Best practice: use `retry({ count: 3, delay: (err) => err.status >= 500 ? timer(1000) : throwError(() => err) })` to retry only server errors. A is wrong — retry before catchError is correct. C is wrong — `throwError(() => err)` is valid inside catchError. D is wrong — unroothed subscriptions are valid for one-shot operations though storing is good practice.',
  },
  {
    id: 94, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'What does `combineLatest([a$, b$]).pipe(filter(([a, b]) => a !== null && b !== null))` solve?',
    options: [
      "It stops combineLatest subscribing until both a$ and b$ emit",
      "combineLatest emits once all have; the filter drops null states",
      "filter() forces emission only when BOTH streams change together",
      "It converts a hot combineLatest into a cold Observable",
    ],
    answer: 1,
    explanation: 'B is correct: `combineLatest` emits after every source has emitted at least once. But if you initialise `BehaviorSubject`s with `null` as a placeholder, the first combined emission will be `[null, null]` — potentially causing errors in the downstream. The `filter` guards against this initial null state. A is wrong — combineLatest subscribes immediately to all sources. C is wrong — it emits whenever ANY source emits a new value (after the first combined emission). D is wrong.',
  },
  {
    id: 95, type: 'multiple-choice', difficulty: 'senior', category: 'rxjs',
    question: 'How does the `iif(condition, trueObs$, falseObs$)` operator work?',
    options: [
      "It subscribes to both of them and then emits from whichever is first",
      "It checks the condition lazily at subscription, per subscriber",
      "It creates a conditional merge based on each emitted value",
      "iif() is now deprecated — use a plain ternary of observables",
    ],
    answer: 1,
    explanation: 'B is correct: `iif(() => this.isAdmin, adminObs$, userObs$)` defers the condition check to subscription time. The condition function is called fresh for each subscriber, so if the condition changes between subscriptions, different subscribers may get different Observables. This is distinct from `condition ? trueObs$ : falseObs$` which evaluates eagerly at construction time. A is wrong — only one Observable is subscribed to. D is wrong — iif() is not deprecated.',
  },

  // ─── FORMS 96-108 ────────────────────────────────────────────────────────────
  {
    id: 96, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What does `new FormControl("", { updateOn: "blur" })` change about validation?',
    options: [
      "The control's current value is reset on every single blur event fired",
      "Validators and valueChanges fire on blur, not on each keystroke typed",
      "The control becomes read-only right after the very first blur happens",
      "The control marks itself touched on blur (which the default already does)",
    ],
    answer: 1,
    explanation: 'B is correct: by default `updateOn` is `"change"` — validators run and `valueChanges` fires on every keystroke. `"blur"` defers this to when focus leaves the field, and `"submit"` defers to form submission. This is a UX improvement: the user does not see a "required" error as they begin typing. A is wrong — value is not reset. C is wrong. D is wrong — marking touched is separate from `updateOn`.',
  },
  {
    id: 97, type: 'multiple-choice', difficulty: 'senior', category: 'forms',
    question: 'How do you implement a cross-field validator that ensures `password === confirmPassword`?',
    options: [
      "Add the very same validator to each of the two FormControls individually",
      "Add a validator to the FormGroup; it can compare the two child values",
      "Use a custom async validator that calls the server to verify the match",
      "Subscribe to valueChanges and manually set an error on confirmPassword",
    ],
    answer: 1,
    explanation: 'B is correct: group-level validators receive the `FormGroup` itself. Inside the validator: `const g = control as FormGroup; return g.get("password")?.value === g.get("confirmPassword")?.value ? null : { mismatch: true }`. This keeps the logic co-located with the group. A is wrong — individual validators cannot access sibling controls. C is wrong — server validation is unneeded for a client-side match check. D works but is imperative and error-prone.',
  },
  {
    id: 98, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What is the key difference between `FormGroup.value` and `FormGroup.getRawValue()`?',
    options: [
      "getRawValue() returns the values as strings; value returns typed values",
      "value drops disabled controls; getRawValue() includes every control",
      "getRawValue() triggers validation to run, whereas plain value does not",
      "They are completely identical in every modern version of Angular today",
    ],
    answer: 1,
    explanation: 'B is correct: `FormGroup.value` omits any control that is `disabled` — this protects against inadvertently submitting fields the user cannot edit. `getRawValue()` returns the complete model including disabled controls. Use `getRawValue()` when you need to read a disabled field\'s value (e.g., a pre-filled user ID in a record-update form). A is wrong. C is wrong. D is wrong — they differ for disabled controls.',
  },
  {
    id: 99, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What does `AbstractControl.markAllAsTouched()` do and when is it useful?',
    options: [
      "It resets every control to its initial value and then marks them all pristine",
      "It recursively marks every control in the group touched, revealing errors",
      "It triggers the async validators on all of the controls simultaneously",
      "It is basically equivalent to calling patchValue({}) on the whole group",
    ],
    answer: 1,
    explanation: 'B is correct: Angular validation errors are typically shown only after `touched === true`. If a user skips required fields and hits Submit, calling `this.form.markAllAsTouched()` in the submit handler forces all error messages to appear. `markAllAsTouched()` recursively touches every control in nested `FormGroup`s and `FormArray`s. A is wrong — that is `reset()`. C is wrong. D is wrong.',
  },
  {
    id: 100, type: 'multiple-choice', difficulty: 'senior', category: 'forms',
    question: 'What is the purpose of `FormBuilder.nonNullable.group({ name: "Alice" })`?',
    options: [
      "It prevents any null values from ever being submitted to the server here",
      "Controls reset to their initial value, not null, when reset() is called",
      "It adds a Validators.required validator onto every one of the controls",
      "It makes each control read-only so their values cannot be set to null",
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
      "map() is not allowed to return null here — you must use filter() instead",
      "Fast typing overlaps requests; a stale response can win — use switchMap",
      "The validator must return Observable<ValidationErrors | null>, not this",
      "Async validators are required to return a Promise, never an Observable",
    ],
    answer: 1,
    explanation: 'B is correct: Angular calls the async validator on every value change (or on blur with `updateOn: "blur"`). Without debouncing and cancellation, rapid typing spawns multiple concurrent HTTP requests. If request for "ali" arrives after "alice" was already validated, the form shows stale state. Fix: wrap in `switchMap`: `return control.valueChanges.pipe(debounceTime(300), take(1), switchMap(val => http.get(...)), ...)`. The validator itself should also be debounced at the control level. A is wrong. C is wrong — http.get() returns the correct type. D is wrong — Observables are valid.',
  },
  {
    id: 102, type: 'multiple-choice', difficulty: 'junior', category: 'forms',
    question: 'Which reactive forms approach allows you to listen to all value changes in a FormGroup?',
    options: [
      "Subscribe to every single FormControl's valueChanges individually here",
      "Subscribe to form.valueChanges; it emits the value object on any change",
      "Use the (ngModelChange) event directly on the form tag in the template",
      "Override ngOnChanges and inspect the whole form as a SimpleChange object",
    ],
    answer: 1,
    explanation: 'B is correct: `FormGroup.valueChanges` is an Observable that emits the full form value object whenever any control changes. You can pipe it through `debounceTime`, `distinctUntilChanged`, etc. for autosave or preview features. A works but is verbose and misses nested changes. C is template-driven syntax and does not apply to reactive forms. D is for @Input() change detection, not form changes.',
  },
  {
    id: 103, type: 'multiple-choice', difficulty: 'senior', category: 'forms',
    question: 'What are the required methods to implement `ControlValueAccessor`?',
    options: [
      "The three are setValue(), getValue(), and validate() on the accessor",
      "writeValue(), registerOnChange(), registerOnTouched() (plus disabled)",
      "They are ngModelChange(), ngModelWrite(), and ngModelDisable() methods",
      "The three are simply onChange(), onTouch(), and onDisable() by name here",
    ],
    answer: 1,
    explanation: 'B is correct: Angular calls `writeValue(val)` to push a new value into your control\'s UI; you call the function registered via `registerOnChange(fn)` to notify Angular when the user changes the value; you call the function from `registerOnTouched(fn)` when the user interacts (for touched state). `setDisabledState(isDisabled)` is optional but recommended. Provide as `NG_VALUE_ACCESSOR` with `multi: true`. A, C, D use non-existent method names.',
  },
  {
    id: 104, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What does `FormControl.statusChanges` emit?',
    options: [
      "It emits the validation errors object each time that validation fails",
      "It emits VALID, INVALID or PENDING whenever the control's status changes",
      "It emits the total number of currently failed validators, as a count",
      "It only emits when a control moves from VALID straight to the INVALID state",
    ],
    answer: 1,
    explanation: 'B is correct: `control.statusChanges` is an Observable<FormControlStatus> emitting `"VALID"`, `"INVALID"`, `"PENDING"`, or `"DISABLED"` on every status transition. The `"PENDING"` state is particularly useful: subscribe and show a spinner while async validators are in flight. A is wrong — that is `control.errors`. C is wrong. D is wrong — it emits on every transition, not just VALID→INVALID.',
  },
  {
    id: 105, type: 'multiple-choice', difficulty: 'senior', category: 'forms',
    question: 'What is the benefit of the typed Reactive Forms API (`FormGroup<{ name: FormControl<string> }>`) introduced in Angular 14?',
    options: [
      "It automatically adds a Validators.required validator to all of the fields",
      "form.value and control.value are fully typed; typos are caught at compile",
      "It enables two-way binding between a FormGroup and an interface directly",
      "Typed forms will automatically serialize themselves to JSON for a server",
    ],
    answer: 1,
    explanation: 'B is correct: before typed forms, `form.get("name")?.value` returned `any`. With typed forms, `this.form.controls.name.value` is `string` — TypeScript catches typos in control names and type mismatches at compile time. This dramatically reduces runtime errors in large forms. A is wrong. C is wrong — reactive forms are still explicitly wired. D is wrong — serialization is unchanged.',
  },
  {
    id: 106, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'How do you dynamically add a control to a FormGroup at runtime?',
    options: [
      "Assign it: this.form.controls[\"newField\"] = new FormControl(\"\") directly here",
      "Call this.form.addControl(\"newField\", new FormControl(\"\")) to register it",
      "Call this.form.push(new FormControl(\"\")) to add the new field to it here",
      "Use this.form.patch({ newField: new FormControl(\"\") }) to add it in here",
    ],
    answer: 1,
    explanation: 'B is correct: `FormGroup.addControl(name, control)` registers the control and triggers valueChanges/statusChanges. A is wrong — directly assigning to `.controls` bypasses Angular\'s internal bookkeeping; the form model does not update properly. C is wrong — `push` is the `FormArray` method. D is wrong — `patchValue` updates values, not structure.',
  },
  {
    id: 107, type: 'multiple-choice', difficulty: 'junior', category: 'forms',
    question: 'What is the difference between `form.setValue()` and `form.patchValue()`?',
    options: [
      "setValue() triggers validation while patchValue() bypasses all validators",
      "setValue() needs every key or it throws; patchValue() updates only some",
      "patchValue() works only on a FormArray while setValue() is for a FormGroup",
      "They are entirely identical in both their behaviour and their output here",
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
      "Add a second { path: } entry that carries a \"/\" prefix",
      "Use children: [] on the parent, which needs a router-outlet",
      "Nest router-outlet elements in the template with no route config",
      "Call parentRoute.addChild(childRoute) at app runtime",
    ],
    answer: 1,
    explanation: 'B is correct: `{ path: "admin", component: AdminLayout, children: [{ path: "users", component: UsersPage }] }`. The parent `AdminLayout` template must contain `<router-outlet>` — that is where the child renders. Navigating to `/admin/users` renders `AdminLayout` in the root outlet and `UsersPage` in the nested outlet. A is wrong — "/" prefix in children creates absolute paths. C is wrong — outlets need routes configured. D is wrong — no runtime `addChild` API.',
  },
  {
    id: 110, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'How do you navigate to `/products/42?sort=price#reviews` programmatically?',
    options: [
      "router.navigate([\"/products/42?sort=price#reviews\"])",
      "router.navigate([\"/products\", 42], { queryParams, fragment })",
      "router.navigateByUrl(\"/products/42\", { queryParams: { sort } })",
      "router.go(\"/products/42?sort=price#reviews\") does it",
    ],
    answer: 1,
    explanation: 'B is correct: `router.navigate(["/products", 42], { queryParams: { sort: "price" }, fragment: "reviews" })` is the clean, structured way. A is wrong — putting the full URL string inside the array and including query/fragment there is incorrect syntax. C is wrong — `navigateByUrl` takes a full URL string as the first arg; query params cannot be in extras. D is wrong — no `router.go()` method exists.',
  },
  {
    id: 111, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'What is the difference between `route.snapshot.paramMap.get("id")` and `route.paramMap.pipe(map(m => m.get("id")))`?',
    options: [
      "snapshot works only on first navigation; the observable on all",
      "snapshot reads current params once; paramMap emits on changes",
      "They are identical — use snapshot for production performance",
      "The paramMap observable exists only in Angular 16+ builds",
    ],
    answer: 1,
    explanation: 'B is correct: when Angular reuses a component instance for a param change (e.g., navigating between /products/1 and /products/2), `snapshot` is stale — it reflects the params from the initial activation. `paramMap` Observable emits on every change. With `withComponentInputBinding()` you can skip `ActivatedRoute` entirely and receive params as signal inputs. A is partially true but imprecise. C is wrong. D is wrong — paramMap Observable has existed since Angular 4.',
  },
  {
    id: 112, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'What does `{ path: "**", component: NotFoundPage }` do in a route config?',
    options: [
      "It matches all routes and serves as the default home page",
      "A wildcard matching any unmatched URL — must be placed LAST",
      "It matches all routes that literally start with two asterisks",
      "It enables regex-based route matching within the config",
    ],
    answer: 1,
    explanation: 'B is correct: `**` is the catch-all wildcard — it matches any URL. Because Angular\'s router tries routes in order, placing `**` last ensures all specific routes are checked first. If placed first, it would capture every navigation. A is wrong — use `path: ""` for home/default. C is wrong — `**` does not require a literal `**` in the URL. D is wrong — regex routing uses a different API.',
  },
  {
    id: 113, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'How do you listen to all navigation events (start, end, error) for analytics?',
    options: [
      "Override ngOnInit and then call router.getCurrentNavigation()",
      "Subscribe to router.events, filtering by the event classes",
      "Use the window.history API to listen for popstate events",
      "Add a RouterInterceptor to the app's providers array",
    ],
    answer: 1,
    explanation: 'B is correct: `this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(...)` is the canonical pattern. `Router.events` is a hot Observable that emits `NavigationStart`, `RouteConfigLoadStart`, `RoutesRecognized`, `NavigationEnd`, `NavigationCancel`, `NavigationError`, etc. Use it for page view tracking, loading indicators, or scroll restoration. A gives only the current navigation snapshot. C is lower-level and misses Angular-specific events. D is wrong — no RouterInterceptor exists.',
  },
  {
    id: 114, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'What does `RouterLink` with `[routerLinkActive]="\'active\'"` add to the element?',
    options: [
      "It adds Angular's generated attribute selector for encapsulation",
      "It adds the \"active\" CSS class when the URL matches the route",
      "It disables the link while active to prevent self-navigation",
      "It applies only when routerLink points to an exact URL match",
    ],
    answer: 1,
    explanation: 'B is correct: `routerLinkActive` dynamically adds/removes a CSS class based on whether the current route matches. By default it matches prefix — `/products/123` also activates a link to `/products`. Use `[routerLinkActiveOptions]="{ exact: true }"` for exact matching. A is wrong — that is View Encapsulation. C is wrong — the link remains clickable. D is wrong — prefix matching is the default.',
  },
  {
    id: 115, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'What is the execution order when navigating to a route with both `canMatch` and `canActivate` guards?',
    options: [
      "canActivate runs first, and only then does canMatch run afterward",
      "canMatch runs first (selection); canActivate then (activation)",
      "They both run in parallel during the same phase",
      "The order depends on where they appear in the route config",
    ],
    answer: 1,
    explanation: 'B is correct: Angular\'s navigation pipeline is: (1) Route matching — `canMatch` guards run here to decide which route definition to use. (2) Route activation — `canActivate`, `canActivateChild`, and resolvers run here. `canMatch` returning false means this route is not considered at all and the router tries the next definition for the same URL. `canActivate` returning false blocks access but the route WAS matched. A reverses the order. C is wrong. D is wrong.',
  },
  {
    id: 116, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'How do you pass static data to a component via a route?',
    options: [
      "Use a query parameter inside the URL, such as /page?title=Home",
      "Use the route's data property, read via snapshot.data[\"key\"]",
      "Add a resolve function that returns a static object value",
      "Pass it as a route path parameter, like /page/Home",
    ],
    answer: 1,
    explanation: 'B is correct: the `data` property holds arbitrary static values attached to a route. Unlike `resolve`, no async loading occurs — the data is available immediately in `route.snapshot.data`. Use it for page titles, breadcrumb labels, or permission keys. A is visible in the URL and must be parsed. C works but adds unnecessary async overhead for static data. D encodes data in the URL which changes routing structure.',
  },
  {
    id: 117, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'What does `<router-outlet name="sidebar">` do?',
    options: [
      "It creates a sidebar CSS layout beside the main outlet",
      "A named auxiliary outlet targeted via { outlets: {...} }",
      "It replaces the default router-outlet with a custom one",
      "Named outlets are deprecated — use multiple primary ones",
    ],
    answer: 1,
    explanation: 'B is correct: auxiliary (named) outlets allow multiple independent route sections on the same page. Navigate to them with `router.navigate([{ outlets: { sidebar: ["help"] } }])` or `[routerLink]="[{ outlets: { sidebar: [\'help\'] } }]"`. They appear in the URL as `(sidebar:help)`. Use them for side panels, notifications, or modals driven by the URL. A is wrong — it is not a CSS layout. C is wrong. D is wrong — named outlets are a supported feature.',
  },
  {
    id: 118, type: 'multiple-choice', difficulty: 'senior', category: 'routing',
    question: 'How do you implement a custom preloading strategy to preload only routes with `data: { preload: true }`?',
    options: [
      "Set PreloadAllModules and then use guards to skip unwanted routes",
      "Implement PreloadingStrategy; call load() only when data says so",
      "Add lazy: \"eager\" to the routes you want preloaded",
      "Custom preloading is unsupported — only the two built-ins exist",
    ],
    answer: 1,
    explanation: 'B is correct: implement `PreloadingStrategy.preload(route, load): Observable<unknown>`. Return `load()` to preload, `of(null)` to skip. Provide it: `provideRouter(routes, withPreloading(CustomStrategy))`. This lets you be selective — preload priority routes after the critical path loads. A is wrong — guards do not affect preloading. C is wrong — no `lazy: "eager"` property exists. D is wrong — custom strategies are officially supported.',
  },
  {
    id: 119, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'What does `router.navigate(["../sibling"], { relativeTo: this.route })` do?',
    options: [
      "Navigates to a sibling — \"../\" goes up one level, then in",
      "Navigates to the root first, then finds the \"sibling\" route",
      "Navigates backwards in the browser history by one step",
      "../ is not valid inside Angular navigation command arrays",
    ],
    answer: 0,
    explanation: 'A is correct: relative navigation with `relativeTo: this.route` treats the URL like a file path. `["../sibling"]` navigates up one route level (out of the current route) then into "sibling". Without `relativeTo`, the path is interpreted as absolute. This is essential in feature modules where routes should not hardcode absolute paths. B is wrong. C is wrong — use `location.back()` for browser history. D is wrong — relative paths are fully supported.',
  },
  {
    id: 120, type: 'multiple-choice', difficulty: 'senior', category: 'routing',
    question: 'What is `NavigationExtras.skipLocationChange` and when would you use it?',
    options: [
      "It navigates but does not update the browser's URL bar",
      "It skips the canDeactivate guard for the current component",
      "It replaces history instead of pushing (replaceState)",
      "It makes navigation skip all guards and resolvers entirely",
    ],
    answer: 0,
    explanation: 'A is correct: `router.navigate(["/internal"], { skipLocationChange: true })` navigates to a route and renders its component without updating the URL in the address bar. The browser back button goes to the previous URL. Use it for internal redirects, modal-like navigation where the URL should not change, or wizard steps you do not want bookmarked. C describes `replaceUrl: true`. B and D are wrong.',
  },

  // ─── TESTING 121-132 ──────────────────────────────────────────────────────────
  {
    id: 121, type: 'multiple-choice', difficulty: 'junior', category: 'testing',
    question: 'What does `TestBed.inject(MyService)` return?',
    options: [
      "A brand-new instance of MyService built outside of Angular's DI system",
      "The same DI singleton the tested components receive from the injector",
      "A Jasmine or a Jest generated mock stand-in of the real MyService class",
      "It throws — services must be reached only through the component fixture",
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
      "nativeElement.click() is always best for accuracy; the other is legacy",
      "click() fires real bubbling browser events; the other fires the binding",
      "triggerEventHandler only works with (click); nativeElement.click() any event",
      "They are entirely identical when running in a jsdom test environment here",
    ],
    answer: 1,
    explanation: 'B is correct: `nativeElement.click()` dispatches a native browser event — it bubbles, it can be observed with addEventListener, but in a jsdom test environment it may not trigger Angular bindings reliably for all event types. `triggerEventHandler("click", mockEvent)` directly invokes the Angular event handler registered via `(click)="..."` — it is more reliable for unit testing and lets you pass a synthetic event object. A is wrong. C is wrong. D is wrong.',
  },
  {
    id: 124, type: 'multiple-choice', difficulty: 'junior', category: 'testing',
    question: 'In a unit test using `HttpClientTestingModule`, why do you call `httpMock.verify()` in `afterEach`?',
    options: [
      "To reset the underlying HTTP client cleanly in between the tests here",
      "To assert no unexpected requests remain; leftovers contaminate the next",
      "To flush every one of the pending requests with an automatic 200 OK here",
      "verify() is only ever needed when you are testing the error scenarios",
    ],
    answer: 1,
    explanation: 'B is correct: `HttpTestingController.verify()` checks that no outstanding (unflushed) requests remain after the test. Unflushed requests from one test can bleed into the next if not cleaned up. A failing `verify()` is a signal that your test triggered an HTTP call you did not account for. A is wrong — the mock is reset by TestBed teardown. C is wrong — requests are flushed manually with `expectOne().flush()`. D is wrong — verify() should always be called.',
  },
  {
    id: 125, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'How do you test that a component method called `this.router.navigate(["/home"])` actually navigates?',
    options: [
      "Import RouterModule and then inspect the window.location.href value here",
      "Spy on router.navigate and assert toHaveBeenCalledWith([\"/home\"]) on it",
      "Use fakeAsync with a tick() call to flush the pending navigation here",
      "Call fixture.detectChanges() and check the DOM for a router-outlet change",
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
      "createComponent() must be called inside beforeEach(), never inside it()",
      "detectChanges() is never called, so the template has not rendered yet",
      "textContent returns an array within jsdom rather than an ordinary string",
      "The component must implement OnInit for its textContent to be populated",
    ],
    answer: 1,
    explanation: 'B is correct: Angular does NOT run change detection automatically when you call `createComponent()`. The template is compiled but not rendered until `fixture.detectChanges()` is called. Without it, `textContent` is empty or stale. Always call `detectChanges()` at least once before asserting DOM state. A is wrong — createComponent() inside `it()` is valid. C is wrong — textContent is a string. D is wrong — OnInit is called during detectChanges.',
  },
  {
    id: 127, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'What does `NO_ERRORS_SCHEMA` do in a TestBed configuration?',
    options: [
      "It prevents every kind of error message from showing in the test output",
      "It tells Angular to ignore unknown elements/attributes — a shallow render",
      "It disables all of the form validation for the whole duration of the test",
      "It makes every HTTP error return a 200 OK instead of actually throwing",
    ],
    answer: 1,
    explanation: 'B is correct: `schemas: [NO_ERRORS_SCHEMA]` suppresses "unknown element" and "unknown property" errors in tests. Child components become empty placeholders — they do not need to be imported or declared. This enables fast, isolated unit tests for a single component\'s logic. The trade-off: you miss integration bugs where a child input name was renamed. Use `CUSTOM_ELEMENTS_SCHEMA` if you only want to silence custom element warnings. A, C, D are all wrong.',
  },
  {
    id: 128, type: 'multiple-choice', difficulty: 'junior', category: 'testing',
    question: 'You need to test a custom pipe. What is the simplest approach?',
    options: [
      "Configure a full TestBed with the pipe declared and test via a fixture",
      "Instantiate it with new MyPipe() and call transform() — no TestBed needed",
      "Use Jasmine's createSpy() to mock out the pipe's own transform method",
      "Pipes cannot be unit tested — only integration tested via a host component",
    ],
    answer: 1,
    explanation: 'B is correct: a pure standalone pipe is a simple class — `const pipe = new TruncatePipe(); expect(pipe.transform("hello world", 5)).toBe("hello...")`. No TestBed needed. This is the fastest type of unit test in Angular. If the pipe has dependencies (injected services), you can either inject them via TestBed or mock them manually. A works but is heavier than necessary for a pure pipe. C is for mocking, not testing. D is wrong.',
  },
  {
    id: 129, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'How do you test a component that uses `resource()` to fetch data?',
    options: [
      "Use HttpClientTestingModule and then flush the requests in the normal way here",
      "Provide a test loader, or use provideHttpClientTesting() and flush the HTTP",
      "resource() cannot be tested — just mock the service that wraps it instead",
      "Wrap the whole test in fakeAsync() and tick() to wait for it to resolve",
    ],
    answer: 1,
    explanation: 'B is correct: `resource()` uses `HttpClient` internally when given an HTTP loader (via `rxResource()`). With `provideHttpClientTesting()`, the `HttpTestingController` intercepts requests made by the resource. Flush them: `httpMock.expectOne("/api/data").flush(mockData)`, then call `fixture.detectChanges()` to re-render with the resolved value. Alternatively, provide a custom loader function in tests that returns a resolved Promise directly. A is close but misses the explicit flushing step. D is wrong — resource() is not purely time-based.',
  },
  {
    id: 130, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'What is the advantage of `ComponentFixture.whenStable()` over using `tick()` in `fakeAsync()`?',
    options: [
      "whenStable() is faster only because it does not use any fake timers here",
      "whenStable() resolves when async tasks finish; it works without fakeAsync",
      "whenStable() also flushes the HTTP requests, whereas tick() does not do so",
      "They are interchangeable — just choose based on your own team preference",
    ],
    answer: 1,
    explanation: 'B is correct: `await fixture.whenStable()` works in `async` tests (using `async/await`) and waits for Angular\'s task queue (Promises, microtasks, change detection) to drain. `tick()` is only available inside `fakeAsync()` and advances virtual time. Use `whenStable()` when you prefer `async/await` syntax or when the exact time does not matter; use `fakeAsync + tick()` for time-sensitive tests with debounces or delays. A is wrong — whenStable uses the real microtask queue. C is wrong.',
  },
  {
    id: 131, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'You want to provide a mock for `AuthService` in a test. Which approach correctly replaces it in DI?',
    options: [
      "import { AuthService }; const mock = {}; with no DI wiring needed at all",
      "providers: [{ provide: AuthService, useValue: mockAuthService }] does it",
      "TestBed.configureTestingModule({ declarations: [AuthService] }) does it",
      "Override AuthService globally by using jest.mock(\"./auth.service\") instead",
    ],
    answer: 1,
    explanation: 'B is correct: `{ provide: AuthService, useValue: mockAuthService }` replaces the real service in the test injector. Any component that injects `AuthService` receives your mock. `mockAuthService` can be a jasmine spy object: `jasmine.createSpyObj("AuthService", ["login", "logout"])`. A does not replace it in DI. C is wrong — declarations is for components/pipes/directives. D mocks the module but does not integrate with Angular DI.',
  },
  {
    id: 132, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'What is the purpose of `fakeAsync()` + `flush()` vs `fakeAsync()` + `tick(500)`?',
    options: [
      "flush() is simply the faster one, while tick() is the more accurate one",
      "tick(500) advances exactly 500ms; flush() drains all pending macro-tasks",
      "flush() only flushes the Promises; tick() flushes both Promises and timers",
      "They are identical — flush() is just shorthand for tick(MAX_SAFE_INTEGER)",
    ],
    answer: 1,
    explanation: 'B is correct: `tick(ms)` precisely advances the virtual clock by the specified milliseconds — useful for debounce/throttle time assertions. `flush()` exhausts all pending macro-tasks (setTimeout, setInterval) in one go without specifying time — useful when you just need "everything done" without caring about precise timing. A is wrong. C is wrong — both handle both. D is wrong — they are conceptually different tools.',
  },

  // ─── PERFORMANCE 133-142 ──────────────────────────────────────────────────────
  {
    id: 133, type: 'multiple-choice', difficulty: 'junior', category: 'performance',
    question: 'What does adding `priority` to `NgOptimizedImage` do?',
    options: [
      "It boosts the image's z-index so that it renders above other elements",
      "It adds fetchpriority=high and a preload hint, improving the image LCP",
      "It caches the image inside the service worker permanently for later use",
      "It prevents lazy loading — the image loads during the initial page parse",
    ],
    answer: 1,
    explanation: 'B is correct: marking an image as `priority` with `NgOptimizedImage` (`<img ngSrc="hero.jpg" priority>`) injects a `<link rel="preload">` tag and sets `fetchpriority="high"` on the `<img>`. This instructs the browser to download the image at the highest priority, critical for LCP images. Angular also warns if a large above-the-fold image is missing the `priority` attribute. A is wrong — no z-index change. C is wrong. D is close but B is the full correct answer.',
  },
  {
    id: 134, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'Why does using `@defer (on idle)` for a heavy chart component improve performance?',
    options: [
      "It compresses the chart component's own JS bundle at runtime on the fly",
      "The chart is excluded from the initial bundle; it loads on idle instead",
      "The chart renders inside a Web Worker, keeping the main thread free here",
      "It caches all of the chart's data inside IndexedDB for later offline use",
    ],
    answer: 1,
    explanation: 'B is correct: `@defer` creates code-split points at build time. The chart library (potentially hundreds of KB) is not included in the initial bundle and is not parsed or executed until the trigger fires (here: browser idle time, via `requestIdleCallback`). This directly improves TTI because the main thread is free from parsing a large chart library during startup. A, C, D are incorrect descriptions.',
  },
  {
    id: 135, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'What is the `track` expression in `@for` and why does it matter for performance?',
    options: [
      "It is a CSS selector that tracks exactly which items should be animated",
      "track gives each item a stable identity so Angular reuses the DOM nodes",
      "It limits the rendering so that only the tracked items are ever drawn",
      "track is only ever needed with animations; @for is efficient without it",
    ],
    answer: 1,
    explanation: 'B is correct: without `track`, Angular has no way to match old DOM nodes to new data items when the list changes — it destroys and recreates every element. With `track item.id`, Angular identifies which items are new, moved, or removed and surgically updates only those parts. For a 1000-item list where 1 item is added, `track` means one insertion instead of 1000 re-renders. A, C, D are all wrong.',
  },
  {
    id: 136, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'How do you enable Angular\'s virtual scrolling for a large list?',
    options: [
      "Add overflow: auto and height: 300px CSS onto the list's container div here",
      "Use CdkVirtualScrollViewport with itemSize — it renders only visible rows",
      "Set *ngFor with trackBy and a [limit]=\"20\" to only ever show 20 items",
      "Virtual scrolling is built right into @for — no extra package is needed",
    ],
    answer: 1,
    explanation: 'B is correct: `<cdk-virtual-scroll-viewport itemSize="50" style="height: 400px"><div *cdkVirtualFor="let item of items">...</div></cdk-virtual-scroll-viewport>`. The CDK only renders the visible items plus a small buffer, keeping the DOM to ~20 nodes regardless of list size. A is CSS overflow scrolling — all DOM nodes are still rendered. C is wrong — `*ngFor` has no `[limit]`. D is wrong.',
  },
  {
    id: 137, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'How do you analyse which third-party packages are contributing most to your Angular bundle size?',
    options: [
      "Run ng build --verbose and then read through all of the console output",
      "Run ng build --stats-json, then open it in webpack-bundle-analyzer",
      "Just check the sizes of the files in the dist/ folder after a build",
      "Use the DevTools Network tab and multiply it by the compression ratio",
    ],
    answer: 1,
    explanation: 'B is correct: `webpack-bundle-analyzer` (or `source-map-explorer`) parses the stats file and shows an interactive treemap where larger rectangles = larger bundle contributions. You can see which imports are duplicated, which libraries are unexpectedly large, and which tree-shaking opportunities exist. A gives verbose chunk info but not per-module breakdown. C gives total sizes but not granular insight. D is indirect and inaccurate.',
  },
  {
    id: 138, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'What is the purpose of `isPlatformBrowser(this.platformId)` in an Angular component?',
    options: [
      "It checks whether the app is running in a Chromium-based browser or not",
      "It guards browser-only APIs from running during SSR, where they crash",
      "It detects whether or not the app is currently installed as a PWA here",
      "It is required before you are allowed to use any Angular DI service here",
    ],
    answer: 1,
    explanation: 'B is correct: during SSR, Angular runs in Node.js where browser globals like `window`, `localStorage`, and `document` do not exist. `isPlatformBrowser(platformId)` (where `platformId = inject(PLATFORM_ID)`) returns `true` only in the browser. Wrap browser-only code: `if (isPlatformBrowser(this.platformId)) { localStorage.setItem(...) }`. A is wrong — it detects browser vs server, not browser type. C and D are wrong.',
  },
  {
    id: 139, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'What causes "Change Detection running N times per second" and how do you diagnose it?',
    options: [
      "Enable zone.js debug mode and it reveals the source of each CD trigger",
      "Open the Angular DevTools Profiler — it shows CD cycles and their causes",
      "Add a console.log inside the ngDoCheck of every single component you have",
      "Run Lighthouse in CI — it flags excessive change detection as an issue",
    ],
    answer: 1,
    explanation: 'B is correct: Angular DevTools (Chrome extension) Profiler records change detection cycles frame by frame, showing which components are re-rendered and why. Common causes in Zone.js apps: `setInterval` not cleaned up (fires CD every tick), `requestAnimationFrame` callbacks, WebSocket messages, or a third-party library that triggers browser events. In signals-based apps, an `effect()` that sets a signal which triggers another effect is a common cause. A and C are partial workarounds. D is wrong.',
  },
  {
    id: 140, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'What does `@defer (when isLoaded())` do?',
    options: [
      "It defers the block until isLoaded finally emits true via an Observable",
      "It renders the block once isLoaded() becomes true, re-checked each cycle",
      "It downloads the deferred chunk when isLoaded is invoked as a function",
      "when() requires a Promise — use on() for any synchronous conditions here",
    ],
    answer: 1,
    explanation: 'B is correct: `@defer (when condition)` accepts any boolean expression. Angular re-evaluates it each change detection cycle. Once it becomes `true`, the deferred block\'s JavaScript chunk is downloaded and rendered. If the condition starts as `true`, the block renders immediately after the chunk loads. The parentheses call `isLoaded()` as a signal — this is a common pattern. A is wrong — it takes a boolean, not an Observable. C is wrong. D is wrong.',
  },
  {
    id: 141, type: 'multiple-choice', difficulty: 'junior', category: 'performance',
    question: 'What does the `loading="lazy"` attribute on `<img>` do vs Angular\'s `NgOptimizedImage`?',
    options: [
      "They are identical — NgOptimizedImage just adds the loading=lazy attribute",
      "Both lazy-load, but NgOptimizedImage adds srcset, LCP hints, and warnings",
      "loading=lazy uses IntersectionObserver; NgOptimizedImage a service worker",
      "NgOptimizedImage is only for background images; loading=lazy for inline img",
    ],
    answer: 1,
    explanation: 'B is correct: native `loading="lazy"` is a single browser hint. `NgOptimizedImage` wraps it plus: automatic `srcset`/`sizes` generation for responsive images, `width`/`height` requirement (preventing CLS), `fill` mode for fluid images, priority/preload management, image CDN loader support, and dev-time warnings. Use NgOptimizedImage in Angular projects for the full set of optimisations. A is wrong. C is wrong. D is wrong.',
  },
  {
    id: 142, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'When should you use `ChangeDetectorRef.detach()` on a component?',
    options: [
      "When the component is inside an *ngIf, to prevent any double detection",
      "For rarely-changing external data — detach, then detectChanges() yourself",
      "When using OnPush — a detach() call is required for OnPush to work at all",
      "After every async operation you run, in order to prevent any memory leaks",
    ],
    answer: 1,
    explanation: 'B is correct: `cdr.detach()` disconnects a component from the change detection tree entirely. Angular skips it completely during every global CD cycle. You call `cdr.detectChanges()` only when you know data changed — e.g., in a WebSocket handler or a `requestAnimationFrame` callback. This is the most aggressive CD optimisation, useful for high-frequency data visualisations (stock tickers, live charts). A is wrong. C is wrong — OnPush still participates in CD. D is wrong.',
  },

  // ─── TYPESCRIPT 143-150 ──────────────────────────────────────────────────────
  {
    id: 143, type: 'multiple-choice', difficulty: 'junior', category: 'typescript',
    question: 'What does the `Partial<User>` utility type do?',
    options: [
      "It creates a type with only the first half of User's properties",
      "It makes every property of User optional by adding ? to each",
      "It removes all optional properties, leaving only the required ones",
      "It is roughly equivalent to the type User | undefined",
    ],
    answer: 1,
    explanation: 'B is correct: `Partial<T>` maps every property of `T` to `T[K] | undefined` with `?`. Example: `Partial<{ name: string; age: number }>` becomes `{ name?: string; age?: number }`. Perfect for PATCH request payloads or update functions where you only supply changed fields. A is wrong. C describes `Required<T>` (removes ?). D is wrong.',
  },
  {
    id: 144, type: 'multiple-choice', difficulty: 'mid', category: 'typescript',
    question: 'What is the difference between `Pick<User, "name" | "email">` and `Omit<User, "password">`?',
    options: [
      "Pick keeps named properties; Omit excludes named properties",
      "Pick only works on interfaces, whereas Omit works on classes",
      "Omit is deprecated now — you should always use Pick instead",
      "They are identical when used on the same set of properties",
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
      "typeof gets a value's type; keyof gets the union of its keys",
      "It is basically equivalent to Object.keys() but at runtime",
      "typeof gets the class; keyof then lists that class's methods",
      "They are separate operators that cannot be chained together",
    ],
    answer: 0,
    explanation: 'A is correct: `const Colors = { RED: "#f00", GREEN: "#0f0" } as const; type ColorKey = keyof typeof Colors` produces `"RED" | "GREEN"`. `typeof Colors` gets the type of the object; `keyof` extracts the union of its keys. This is used extensively for typed dictionaries, enum-like objects, and Angular `@Input` validators. B is wrong — it is a type operation, not runtime. C is wrong. D is wrong.',
  },
  {
    id: 147, type: 'multiple-choice', difficulty: 'mid', category: 'typescript',
    question: 'What does `function wrap<T extends object>(val: T): T` guarantee about `T`?',
    options: [
      "T must be a real class instance rather than just a plain object literal",
      "T is any non-primitive: object, array or function, never a primitive",
      "T must implement a specific interface literally named \"object\"",
      "T is guaranteed to have at least one property defined on it",
    ],
    answer: 1,
    explanation: 'B is correct: `T extends object` in TypeScript means T must be assignable to the `object` type — i.e., any non-primitive (not string, number, boolean, bigint, symbol, null, undefined). This is useful when you need to use `Object.keys(val)` safely inside the function. A is wrong — plain object literals `{}` satisfy `extends object`. C is wrong. D is wrong — `{}` with no properties satisfies the constraint.',
  },
  {
    id: 148, type: 'multiple-choice', difficulty: 'senior', category: 'typescript',
    question: 'What does `type IsString<T> = T extends string ? "yes" : "no"` evaluate to for `IsString<"hello">` vs `IsString<number>`?',
    options: [
      "Both evaluate to \"yes\" — every value extends string in some way",
      "\"yes\" for \"hello\" (extends string); \"no\" for number (does not)",
      "TypeScript throws — conditional types cannot use string literals",
      "\"yes\" for number, since Number objects have a string form",
    ],
    answer: 1,
    explanation: 'B is correct: conditional types evaluate the `extends` condition at compile time. `"hello" extends string` is `true` → resolves to `"yes"`. `number extends string` is `false` → resolves to `"no"`. This pattern is powerful for creating type-level logic used in library types like `NonNullable<T>`, `ReturnType<T>`, and Angular\'s `InputSignal` types. A, C, D are all wrong.',
  },
  {
    id: 149, type: 'multiple-choice', difficulty: 'senior', category: 'typescript',
    question: 'What does `type ReturnOf<T> = T extends (...args: never[]) => infer R ? R : never` do?',
    options: [
      "It returns the function's argument types as a tuple",
      "infer R captures and names the function's return type in the branch",
      "It stops any generic function from ever returning an undefined value",
      "infer is a runtime keyword, so this executes on each function call",
    ],
    answer: 1,
    explanation: 'B is correct: `infer` is TypeScript\'s way to "pattern match and capture" a type within conditional types. Here, if `T` is a function, `infer R` captures its return type into `R`. This is how `ReturnType<T>` is defined in TypeScript\'s standard library. A is wrong — `infer R` captures the RETURN type here, not parameters. C is wrong. D is wrong — `infer` is purely a compile-time construct.',
  },
  {
    id: 150, type: 'multiple-choice', difficulty: 'senior', category: 'typescript',
    question: 'What is `Parameters<typeof MyFunction>` used for?',
    options: [
      "It counts how many parameters a given function declares",
      "It extracts a function's parameter types as a tuple type",
      "It validates a function's parameter count at runtime instead",
      "Parameters<> works only on constructors, not plain functions",
    ],
    answer: 1,
    explanation: 'B is correct: `Parameters<T>` extracts function parameter types as a tuple. `function save(id: number, name: string) {}; type Args = Parameters<typeof save>` gives `[id: number, name: string]`. Combined with spread: `function memoize<T extends (...args: never[]) => unknown>(fn: T) { return (...args: Parameters<T>) => fn(...args); }`. A is wrong — it is a type, not a count. C is wrong — compile-time only. D is wrong.',
  },


  // ─── ARCHITECTURE 151-165 ────────────────────────────────────────────────────
  {
    id: 151, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What is the purpose of `InjectionToken<T>` in Angular?',
    options: [
      "A type-safe DI key for non-class values, avoiding the \"magic string\" anti-pattern",
      "A decorator that marks a class as injectable into the DI system",
      "A guard that prevents more than one instance of a service being created",
      "A helper used to inject primitive values such as numbers directly into your templates",
    ],
    answer: 0,
    topicPath: 'di-providers',
    explanation: 'A is correct: `InjectionToken<T>` creates a unique DI token for values that are not classes — configuration objects, string constants, feature flags. Example: `const API_URL = new InjectionToken<string>("apiUrl")` then `provide: API_URL, useValue: "https://..."`. Inject it with `inject(API_URL)`. B is wrong — that is `@Injectable`. C is wrong — it has no singleton enforcement. D is wrong.',
  },
  {
    id: 152, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'What is the difference between `@Input()` and `input()` in Angular?',
    options: [
      "@Input() is deprecated — you should always use input() in Angular 17+",
      "input() returns a Signal read as this.name(); @Input() is a plain property",
      "input() can only accept string values, whereas @Input() accepts any type",
      "They are identical — input() is just syntactic sugar over the @Input() decorator",
    ],
    answer: 1,
    topicPath: 'inputs',
    explanation: 'B is correct: `readonly name = input<string>()` creates a signal-based input — access the value with `this.name()`. `@Input() name!: string` stores the value as a plain property. Signal inputs participate in the reactive graph, making computed() and effect() that read them automatically reactive. @Input() is still fully supported and not deprecated. A is wrong. C is wrong. D is wrong — they have meaningfully different behaviour.',
  },
  {
    id: 153, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What happens if you call `signal.set()` with the same value as the current one?',
    options: [
      "Angular always notifies dependents, even when the value is unchanged",
      "By default Object.is() equality skips notifying dependents on equal values",
      "Angular immediately throws a \"duplicate set\" error at you in this case",
      "The signal's internal version counter still increments even on the equal values",
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
      "setInterval is simply not allowed to be used inside an Angular component",
      "The interval is never cleared, so it keeps firing after the view is destroyed",
      "count++ is a mutation that OnPush change detection is unable to detect",
      "ngOnInit runs before the component is in the DOM, so setInterval does nothing",
    ],
    answer: 1,
    topicPath: 'lifecycle',
    explanation: 'B is correct: `setInterval` continues to fire after the component is destroyed because no `clearInterval` is called in `ngOnDestroy`. The callback tries to update `count` and may trigger change detection on a destroyed view, causing "ExpressionChangedAfterItHasBeenChecked" or "ViewDestroyedError". Fix: store the handle (`this.timer = setInterval(...)`) and call `clearInterval(this.timer)` in `ngOnDestroy()`. A is wrong. C is wrong. D is wrong.',
  },
  {
    id: 155, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'What does `forkJoin([a$, b$, c$])` do?',
    options: [
      "It merges the sources and emits every value as they each arrive",
      "It waits for ALL to complete, then emits their last values",
      "It subscribes to a$, then b$, then c$ strictly sequentially",
      "It emits the first value from whichever emits first, then stops",
    ],
    answer: 1,
    topicPath: 'rxjs-advanced',
    explanation: 'B is correct: `forkJoin` subscribes to all sources simultaneously and waits for ALL to complete, then emits `[lastValueOfA, lastValueOfB, lastValueOfC]`. Perfect for parallel HTTP requests where you need all responses before proceeding. If any source never completes or errors, forkJoin never emits. A describes `merge`. C describes `concat`. D describes `race`.',
  },
  {
    id: 156, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'What is the correct way to make a route lazy-loaded in Angular?',
    options: [
      "{ path: \"admin\", component: () => import(\"./admin\") }",
      "{ path: \"admin\", loadComponent: () => import(...).then(...) }",
      "{ path: \"admin\", lazy: true, component: AdminComponent } loads it",
      "{ path: \"admin\", defer: () => AdminComponent } loads it",
    ],
    answer: 1,
    topicPath: 'router-children-lazy',
    explanation: 'B is correct: `loadComponent` accepts a function returning a dynamic import Promise. Angular creates a separate bundle for `AdminComponent` and only downloads it when the user navigates to `/admin`. `loadChildren` is used for lazy route modules. A is wrong — the `component` property does not accept a function. C is wrong — no `lazy: true` property exists. D is wrong.',
  },
  {
    id: 157, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What does `Validators.compose([v1, v2])` do vs providing an array to FormControl?',
    options: [
      "compose() runs the validators in parallel; an array runs them one by one",
      "They are identical; compose() just merges the validators into one fn",
      "compose() short-circuits on the first error; an array always runs them all",
      "compose() only works for the async validators, never the synchronous ones",
    ],
    answer: 1,
    topicPath: 'form-validation',
    explanation: 'B is correct: Angular\'s form control automatically composes multiple validators from an array, so `[v1, v2]` and `Validators.compose([v1, v2])` are equivalent. `compose()` is useful when an API expects a single `ValidatorFn` but you need to combine multiple — for example, passing to `AbstractControl.setValidators()`. A is wrong — all validators always run. C is wrong — no short-circuiting occurs. D is wrong.',
  },
  {
    id: 158, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'What does `spectator.detectChanges()` do differently from `fixture.detectChanges()` in Angular testing?',
    options: [
      "Spectator's detectChanges() also flushes all pending Promises for you here",
      "They are equivalent — Spectator just wraps TestBed with a nicer API here",
      "Spectator's detectChanges() runs every one of the effects synchronously",
      "fixture's only works in fakeAsync zones; Spectator's version works anywhere",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct: Spectator is a testing utility library that wraps Angular\'s TestBed with a more ergonomic API. `spectator.detectChanges()` calls `fixture.detectChanges()` internally. The main Spectator benefits are: simpler service mocking, fluent query methods (`spectator.query("button")`), and factory functions that reduce TestBed boilerplate. A, C, D describe behaviours neither has. Understanding that Spectator is a wrapper — not a replacement — is important.',
  },
  {
    id: 159, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'Why does `ChangeDetectionStrategy.OnPush` significantly reduce unnecessary re-renders?',
    options: [
      "OnPush entirely skips ALL of the change detection for the component and children",
      "OnPush re-checks only on input-ref change, event, async pipe, or markForCheck",
      "OnPush uses Web Workers to run its change detection off the main thread",
      "OnPush automatically applies itself to every child component recursively",
    ],
    answer: 1,
    topicPath: 'onpush',
    explanation: 'B is correct: by default Angular re-checks every component on every change detection cycle triggered anywhere in the app. OnPush breaks this by only marking a component dirty — and checking it — under specific conditions: a new @Input reference, a component event, async pipe new value, or a manual `markForCheck()`. With signals, signal reads automatically mark the component. A is wrong — OnPush does not skip detection entirely. C is wrong. D is wrong — it must be set per-component.',
  },
  {
    id: 160, type: 'multiple-choice', difficulty: 'junior', category: 'typescript',
    question: 'What is the difference between `unknown` and `any` in TypeScript?',
    options: [
      "unknown is faster at runtime; any is only a compile-time hint",
      "any disables all checking; unknown forces a check before use",
      "any only works on primitives; unknown works on all types",
      "They are completely identical in TypeScript 5.0 and later",
    ],
    answer: 1,
    topicPath: 'ts-types',
    explanation: 'B is correct: `any` opts out of TypeScript entirely — no errors regardless of how you use it. `unknown` is the type-safe "escape hatch" — everything is assignable to it, but TypeScript forces you to narrow (`typeof x === "string"`, `instanceof MyClass`) before operating on it. Prefer `unknown` over `any` for untyped external data (API responses, JSON.parse results). A is wrong. C is wrong. D is wrong.',
  },
  {
    id: 161, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What is `ng-container` and when should you use it?',
    options: [
      "A real DOM element that groups styles without affecting the page layout",
      "A virtual element that renders no DOM node — host structural directives on it",
      "A projection slot element — the direct equivalent of <slot> in Web Components",
      "A wrapper that switches off Angular change detection for all of its children",
    ],
    answer: 1,
    topicPath: 'builtin-directives',
    explanation: 'B is correct: `<ng-container>` is Angular\'s virtual element — it disappears from the rendered DOM. Use it when you need to apply `@if`, `@for`, or a directive but adding a `<div>` or `<span>` would break CSS layout (flexbox/grid children, table rows, etc.). Also used to group elements for `ngTemplateOutlet`. A is wrong — it renders no DOM node. C is wrong — `ng-content` handles projection. D is wrong.',
  },
  {
    id: 162, type: 'multiple-choice', difficulty: 'junior', category: 'signals',
    question: 'What is the difference between `effect()` and `computed()`?',
    options: [
      "effect() is for synchronous logic while computed() is meant for async",
      "computed() derives a lazy signal value; effect() runs side effects only",
      "effect() re-runs each change-detection cycle; computed() only when read",
      "They are interchangeable — just use whichever one happens to read cleaner",
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
      "The mergeMap operator simply cannot be used together with HttpClient",
      "mergeMap runs concurrently, so stale results can win; use switchMap",
      "valueChanges does not emit on the initial control value",
      "mergeMap requires a resultSelector second argument",
    ],
    answer: 1,
    topicPath: 'rxjs-operators',
    explanation: 'B is correct: `mergeMap` (aka `flatMap`) subscribes to all inner Observables concurrently. For search, if the user types quickly, multiple HTTP requests fly simultaneously. Responses arrive out of order — a slow earlier request can overwrite a fast later one. Fix: `switchMap` automatically unsubscribes from the previous inner Observable when a new value arrives, ensuring only the latest request\'s response is used. A is wrong. C is wrong — valueChanges emits on every change after subscription. D is wrong.',
  },
  {
    id: 164, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'What is `ActivatedRoute` and how do you access route parameters with it?',
    options: [
      "ActivatedRoute is the router itself — use it to navigate",
      "The current route; read snapshot.paramMap or subscribe to it",
      "ActivatedRoute is only ever available in root, not lazy routes",
      "ActivatedRoute is deprecated — use ActivatedRouteSnapshot",
    ],
    answer: 1,
    topicPath: 'route-params',
    explanation: 'B is correct: `inject(ActivatedRoute)` (or constructor injection) gives you the active route. `route.snapshot.paramMap.get("id")` reads the current value once. `route.paramMap` is an Observable that emits whenever route params change, which happens when navigating between routes that share the same component instance. With `withComponentInputBinding()`, params automatically map to signal inputs. A is wrong — use `Router` for navigation. C is wrong. D is wrong.',
  },
  {
    id: 165, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'What is the Angular `@defer` `prefetch` modifier and when would you use it?',
    options: [
      "prefetch is just a CSS optimization hint — entirely unrelated to @defer",
      "It prefetches the bundle on idle but only renders the block on interaction",
      "prefetch forces the deferred block to render right after it is prefetched",
      "prefetch is exactly equivalent to a <link rel=\"prefetch\"> in the HTML head",
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
      "ShadowDom uses native browser Shadow DOM; Emulated fakes scoping with attributes",
      "ShadowDom stops all event bubbling from escaping out of the component",
      "ShadowDom is faster mainly because it skips Angular's entire style-compilation step",
      "Emulated uses inline styles while ShadowDom uses linked stylesheets",
    ],
    answer: 0,
    topicPath: 'components',
    explanation: 'A is correct: `ViewEncapsulation.ShadowDom` attaches a real Shadow DOM to the host element — native browser isolation, styles truly cannot leak in or out, and `::ng-deep` does not work through it. `Emulated` (default) simulates scoping by adding `[_ngcontent-xxx]` attributes without using Shadow DOM, meaning `::ng-deep` can still penetrate it and styles apply to dynamically created content more reliably. B is wrong — ShadowDom does not affect event propagation (custom events can use `composed: true`). C and D are wrong.',
  },
  {
    id: 167, type: 'multiple-choice', difficulty: 'junior', category: 'forms',
    question: 'What does `[formGroup]="myForm"` do in a template?',
    options: [
      "It binds the form's submit event straight to the myForm method for you",
      "It links the form to a FormGroup so child directives can resolve controls",
      "It imports the FormGroup class directly into the template for you to use here",
      "It automatically calls myForm.reset() every time the form is submitted",
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
      "toSignal() converts a Promise to a signal; it cannot handle Observables",
      "Wraps an Observable as a read-only signal; needs an injection context",
      "toSignal() sets up a two-way binding between an Observable and a signal",
      "toSignal() behaves just like takeUntilDestroyed — it only handles cleanup",
    ],
    answer: 1,
    topicPath: 'rxjs-interop',
    explanation: 'B is correct: `toSignal(obs$)` returns `Signal<T | undefined>` unless you provide `{ initialValue: T }` (making it `Signal<T>`) or `{ requireSync: true }` (for synchronous sources like BehaviorSubject). Call it at class construction time inside an injection context. It subscribes immediately and unsubscribes automatically on destroy. A is wrong — it works with Observables, not Promises. C is wrong. D is wrong.',
  },
  {
    id: 170, type: 'multiple-choice', difficulty: 'senior', category: 'rxjs',
    question: 'What does `exhaustMap` do and when should you prefer it over `switchMap`?',
    options: [
      "exhaustMap cancels the current inner when a new value arrives",
      "exhaustMap ignores new values while an inner is active",
      "exhaustMap is identical to concatMap but runs in parallel",
      "exhaustMap subscribes to all inners, emitting whichever is first",
    ],
    answer: 1,
    topicPath: 'rxjs-operators',
    explanation: 'B is correct: while `switchMap` cancels the in-progress inner Observable on each new source value, `exhaustMap` ignores new source values entirely while an inner Observable is still active. Perfect for a Save button — if a save is in progress, additional clicks are silently ignored until the current save completes. Use `switchMap` for cancellable operations (search), `concatMap` for ordering, `mergeMap` for parallelism, `exhaustMap` for ignoring duplicates. A describes the wrong operator. C is wrong. D describes `race`.',
  },
  {
    id: 171, type: 'multiple-choice', difficulty: 'junior', category: 'testing',
    question: 'What is a spy in Jasmine testing and how is it created?',
    options: [
      "A spy is a mock HTTP server created via the HttpClientTestingModule here",
      "A wrapper recording calls without real logic; made with spyOn/createSpy",
      "A spy is used only for Angular routing — it intercepts router.navigate calls",
      "A spy is a TypeScript partial interface that satisfies the type checker",
    ],
    answer: 1,
    topicPath: 'testing-services-http',
    explanation: 'B is correct: Jasmine spies are the primary tool for test isolation. `spyOn(service, "login")` replaces `service.login` with a spy that you can configure: `.and.returnValue(of(user))`, `.and.throwError("fail")`, or `.and.callThrough()` (calls real impl). After the test: `expect(service.login).toHaveBeenCalledWith({ email, password })`. A is wrong — that is `HttpTestingController`. C is wrong. D describes TypeScript mocking patterns, not Jasmine spies.',
  },
  {
    id: 172, type: 'multiple-choice', difficulty: 'junior', category: 'signals',
    question: 'What is the difference between `signal.update()` and `signal.set()`?',
    options: [
      "update() triggers change detection whereas set() does not do so at all",
      "set(value) replaces it; update(fn) maps the current value to a new one",
      "update() is meant for objects while set() is meant only for primitives",
      "They are identical — update(fn) is just shorthand for set(fn(signal()))",
    ],
    answer: 1,
    topicPath: 'signals',
    explanation: 'B is correct: `set(value)` takes a direct value. `update(fn)` takes a function that receives the current value and returns the new one — avoiding the need to read the signal separately before setting. `counter.update(v => v + 1)` is cleaner than `counter.set(counter() + 1)`. D is close but misses the point — `update` is for ergonomics and avoids an extra read expression. A is wrong — both trigger dependents. C is wrong.',
  },
  {
    id: 173, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'What does `CanDeactivateFn` guard do?',
    options: [
      "It stops a route from activating unless a condition is met",
      "It runs when navigating AWAY — for unsaved-changes prompts",
      "It deactivates a route, making it inaccessible without reload",
      "It clears route parameters when leaving the component",
    ],
    answer: 1,
    topicPath: 'route-guards',
    explanation: 'B is correct: `CanDeactivateFn<T>` receives the component instance and allows or blocks leaving. The component typically implements a `canDeactivate()` method or has a `isDirty` signal that the guard checks. Return `true` to allow navigation, `false` to block, or a `UrlTree` to redirect. This is the correct hook for "unsaved changes" warnings. A describes `CanActivateFn`. C and D are wrong.',
  },
  {
    id: 174, type: 'multiple-choice', difficulty: 'mid', category: 'typescript',
    question: 'What does `Record<string, User>` do?',
    options: [
      "It creates an array of User objects indexed by string keys",
      "An object type: string keys, User values, like an index signature",
      "It records every change made to User objects for an undo/redo stack",
      "It maps a User object down to a string for serialization",
    ],
    answer: 1,
    topicPath: 'ts-utility-types',
    explanation: 'B is correct: `Record<K, V>` is a mapped type that creates an object type with keys of type `K` and values of type `V`. `Record<string, User>` is equivalent to `{ [key: string]: User }`. Use it for dictionaries: `Record<UserId, User>`, `Record<"loading" | "success" | "error", boolean>`. A is wrong — it is not an array. C and D are wrong.',
  },
  {
    id: 175, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'What is `provideExperimentalZonelessChangeDetection()` and what does enabling it require?',
    options: [
      "It strips Zone.js out of the bundle and relies only on manual markForCheck() calls everywhere",
      "It drops Zone.js patching; components must use signals, async pipe, or markForCheck",
      "It is equivalent to running Angular in strict mode, with no performance gain",
      "It enables Web Workers to run every change-detection cycle off the main thread",
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
      "2, 4, 6 (once) — the result is shared between both subscribers",
      "2, 4, 6, 2, 4, 6 — each subscription re-runs the cold source",
      "An error — you cannot subscribe to an Observable more than once",
      "2, 2, 4, 4, 6, 6 — the values interleave between subscribers",
    ],
    answer: 1,
    topicPath: 'rxjs-observables',
    explanation: 'B is correct: `of(1,2,3)` is a COLD Observable — every `subscribe()` call creates a brand new, independent execution. Both subscriptions run the full sequence independently, logging 2, 4, 6 twice. This contrasts with HOT Observables (like `fromEvent`, `Subject`) which share one execution. A would be the behaviour of a hot/multicasted Observable. C is wrong — multiple subscriptions are fully supported. D is wrong — cold Observables do not interleave.',
  },
  {
    id: 177, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What is the purpose of `FormArray` and when should you use it?',
    options: [
      "FormArray holds primitive values like strings — a multi-value FormControl",
      "FormArray manages an ordered, dynamic list of controls you add or remove",
      "FormArray is a deprecated alternative to FormGroup for the flat forms here",
      "FormArray binds to a <select multiple> element for multi-value selection",
    ],
    answer: 1,
    topicPath: 'form-arrays',
    explanation: 'B is correct: `FormArray` is the right tool when the number of controls is dynamic. `this.form.get("phones") as FormArray` holds an arbitrary number of phone `FormGroup`s. Use `array.push(new FormGroup({...}))` to add and `array.removeAt(i)` to remove. `array.controls` iterates the current controls. A is wrong. C is wrong — it is not deprecated. D is wrong.',
  },
  {
    id: 178, type: 'multiple-choice', difficulty: 'junior', category: 'testing',
    question: 'What is the role of `HttpClientTestingModule` in Angular tests?',
    options: [
      "It provides a real HTTP client that makes actual requests to a test server",
      "It replaces HttpClient with a mock you flush via HttpTestingController",
      "It validates that all of the HTTP URLs in your app are actually reachable",
      "It is just a thin test wrapper for the fetch API, not Angular's HttpClient",
    ],
    answer: 1,
    topicPath: 'testing-services-http',
    explanation: 'B is correct: `provideHttpClientTesting()` (or `HttpClientTestingModule` in older APIs) installs an interceptor that captures all `HttpClient` requests. In your test, inject `HttpTestingController` and use `httpMock.expectOne("/api/users").flush(mockData)` to return controlled data. No network calls are made. A is wrong — no real requests. C is wrong. D is wrong.',
  },
  {
    id: 179, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'What is the Angular `afterRender` phase system and why does it matter?',
    options: [
      "The phases control which components in the tree get to render first",
      "Four ordered phases (read/write) run reads after writes, avoiding thrash",
      "The phases are used by the Angular animations engine to sequence work",
      "The afterRender phases only ever apply within server-side rendering here",
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
      "OnPush does not support accessing service properties directly in templates",
      "push() mutates the same array reference, so OnPush sees no change and skips",
      "The template should really use the async pipe to observe service.items here",
      "OnPush components are not allowed to inject services in their constructor",
    ],
    answer: 1,
    topicPath: 'onpush',
    explanation: 'B is correct: `OnPush` only re-checks a component when an @Input reference changes, an Observable emits (via async pipe), a signal changes, or `markForCheck()` is called. `Array.push()` mutates the SAME array reference — the reference does not change, so OnPush skips the check entirely. Fix: either use `this.items = [...this.items, item]` (new reference), or use a `signal<Item[]>([])` in the service which OnPush automatically tracks. A is wrong. C is one solution but not the diagnosis. D is wrong.',
  },
  {
    id: 181, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'What is a route `resolver` and when should you use one?',
    options: [
      "A resolver is a guard blocking navigation by user permission",
      "It pre-fetches data BEFORE a route activates, no loading flash",
      "A resolver transforms route params before the component gets them",
      "Resolvers are deprecated — use resource() in the component now",
    ],
    answer: 1,
    topicPath: 'resolvers',
    explanation: 'B is correct: `ResolveFn<T>` returns a value or Observable — Angular waits for it to complete before activating the route. Access the result in the component: `route.snapshot.data["product"]` or via signal input with `withComponentInputBinding()`. Use resolvers when you want zero loading state UI. Skip them when you prefer to show a skeleton/spinner — load in the component instead. A describes guards. C is wrong. D is wrong — resolvers are still the preferred pre-fetch pattern.',
  },
  {
    id: 182, type: 'multiple-choice', difficulty: 'junior', category: 'typescript',
    question: 'What does `Required<T>` do?',
    options: [
      "It adds the required HTML attribute to every form input of type T",
      "It makes all properties of T required — the inverse of Partial<T>",
      "It forces a class to implement every member of an interface T",
      "It is basically equivalent to NonNullable<T> on the type",
    ],
    answer: 1,
    topicPath: 'ts-utility-types',
    explanation: 'B is correct: `Required<T>` removes `?` from every property, making them all mandatory. `Required<{ name?: string; age?: number }>` becomes `{ name: string; age: number }`. Use it when you receive a Partial (e.g., from an API patch endpoint) and need to assert that you have filled all required fields before saving. A is wrong. C is wrong. D is wrong — `NonNullable` removes `null | undefined` from the type itself.',
  },
  {
    id: 183, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What does `@ViewChild(MyComponent, { static: true })` vs `{ static: false }` mean?',
    options: [
      "static: true resolves in ngOnInit; static: false resolves in ngAfterViewInit",
      "static: true caches the query result, while static: false re-runs it on every cycle",
      "They control whether the parent is allowed to modify the child component",
      "static: true is the default; static: false is only for dynamic components",
    ],
    answer: 0,
    topicPath: 'view-queries',
    explanation: 'A is correct: `static: true` resolves the query once BEFORE change detection runs, making it available in `ngOnInit`. Only use `static: true` for elements that always exist in the template (not inside structural directives like `@if`/`@for`). `static: false` (default) resolves after change detection, available in `ngAfterViewInit`, and correctly handles conditionally rendered elements. With the modern signal `viewChild()` API, the distinction is handled automatically. B, C, D are wrong.',
  },
  {
    id: 184, type: 'multiple-choice', difficulty: 'junior', category: 'rxjs',
    question: 'What is the purpose of the `async` pipe in Angular templates?',
    options: [
      "It makes template expressions run async so they never block render",
      "It subscribes in the template and auto-unsubscribes on destroy",
      "It converts a Promise to an Observable before template use",
      "It is required to use async/await inside component methods",
    ],
    answer: 1,
    topicPath: 'rxjs-interop',
    explanation: 'B is correct: `{{ data$ | async }}` or `@if (user$ | async; as user)` subscribes to the Observable and renders the current value. Crucially, it automatically calls `unsubscribe()` in `ngOnDestroy`, preventing memory leaks. Multiple async pipes on the same Observable create multiple subscriptions — use `shareReplay(1)` or a single `@let` variable to share one subscription. A, C, D are wrong descriptions.',
  },
  {
    id: 185, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'What is the "Arrange, Act, Assert" (AAA) pattern and why is it important?',
    options: [
      "It is a CSS methodology used for structuring Angular component styling",
      "Arrange, Act, Assert — set up, act, then verify; keeps tests readable",
      "It is the name of Angular's own three-phase change-detection cycle here",
      "It refers to Angular's Accessibility, Animation and API testing strategy",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct: the AAA pattern gives every test a predictable shape. Arrange: `const service = TestBed.inject(AuthService); service.login.and.returnValue(of(user))`. Act: `component.submit()`. Assert: `expect(router.navigate).toHaveBeenCalledWith(["/dashboard"])`. This separation makes tests self-documenting and pinpoints failures precisely. It is universally applicable across Jasmine, Jest, and Vitest. A, C, D are wrong.',
  },
  {
    id: 186, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'How does `contentChild()` differ from `viewChild()` in Angular?',
    options: [
      "viewChild() queries the component's own template; contentChild() queries projection",
      "contentChild() is only for CSS selectors, while viewChild() is for component or directive types",
      "viewChild() is signal-based while contentChild() returns a plain reference",
      "They are identical — contentChild is just an alias for viewChild in Angular 17+",
    ],
    answer: 0,
    topicPath: 'content-projection',
    explanation: 'A is correct: `viewChild(MyComponent)` queries within the component\'s own template. `contentChild(MyComponent)` queries content that was projected from OUTSIDE via `<ng-content>`. Example: a tab panel component uses `contentChild` to find tab headers that parents project in. Both return signals — `viewChild()` resolves to `Signal<MyComponent | undefined>`. B, C, D are wrong.',
  },
  {
    id: 187, type: 'multiple-choice', difficulty: 'junior', category: 'performance',
    question: 'What does the `trackBy` (or `track` in @for) function do for list rendering performance?',
    options: [
      "It sorts the whole list before rendering it, keyed by the tracked property",
      "It gives each item a stable identity so Angular can reuse existing nodes",
      "It stops Angular from re-rendering any items that have not changed value",
      "It applies CSS will-change: transform to the list items for GPU speed-up",
    ],
    answer: 1,
    topicPath: 'control-flow-for',
    explanation: 'B is correct: without `track`, Angular has no way to match old and new items — it destroys all DOM nodes and creates new ones on any data change. With `track item.id` (or `trackBy: fn`), Angular identifies which items are new, moved, or removed and surgically updates the DOM. For a list of 1000 items where 1 changes, `track` means one node update instead of 1000 re-renders. A is wrong — no sorting. C is wrong. D is wrong.',
  },
  {
    id: 188, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'What does `inject()` do and how does it differ from constructor injection?',
    options: [
      "inject() bypasses Angular DI entirely and directly instantiates the service",
      "inject(Token) resolves a dependency from the current context, no constructor needed",
      "inject() only works for services, whereas constructor injection works for any token",
      "inject() is slower than constructor injection because it looks the token up each time",
    ],
    answer: 1,
    topicPath: 'services-di',
    explanation: 'B is correct: `const router = inject(Router)` in a class property initializer, a `CanActivateFn` guard, or a factory function resolves the dependency from the nearest injector. This is more flexible than constructor injection — you can compose DI usage in standalone functions. Both approaches use the same DI hierarchy. A is wrong — inject() fully participates in DI. C is wrong — both handle all tokens. D is wrong — same underlying resolution.',
  },
  {
    id: 189, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What problem does `resource()` solve compared to subscribing to an HTTP Observable in a constructor?',
    options: [
      "resource() caches responses forever; Observable subscriptions do not",
      "It ties async loading to signals: auto re-fetch, status, and cancellation",
      "resource() is only for HTTP; Observables can work with any async source here",
      "resource() is faster because it uses the Fetch API instead of HttpClient",
    ],
    answer: 1,
    topicPath: 'resource-api',
    explanation: 'B is correct: `resource()` integrates async loading with Angular\'s reactive graph. When you do `const id = signal(1); const user = resource({ request: id, loader: ({request}) => fetch(...) })`, changing `id` automatically triggers a re-fetch and the `user.isLoading()`, `user.value()`, `user.error()` signals update accordingly. With a manual Observable subscription, you write all this orchestration yourself. A is wrong — no permanent caching. C is wrong. D is wrong.',
  },
  {
    id: 190, type: 'multiple-choice', difficulty: 'mid', category: 'typescript',
    question: 'What is a discriminated union and why is it useful for Angular state modeling?',
    options: [
      "A union type that excludes one member using Exclude<T, U>",
      "A union of shapes with a shared tag that TS narrows on",
      "A union that only accepts values defined in a named enum",
      "A union where only one member can be assigned — an XOR type",
    ],
    answer: 1,
    topicPath: 'ts-narrowing',
    explanation: 'B is correct: discriminated unions are the TypeScript way to model "states with different shapes". After `if (state.status === "success")`, TypeScript knows `state.data: User` exists. In Angular, this pattern models loading states, form states, or any "tagged variant" data cleanly — no optional properties, no `null` checks everywhere, exhaustive switch statements. A, C, D are wrong descriptions.',
  },
  {
    id: 191, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'What is the purpose of `ngOnChanges` and how does it relate to signal inputs?',
    options: [
      "ngOnChanges fires whenever any signal used by the component changes value",
      "ngOnChanges fires on @Input() changes with a SimpleChanges object — not for input()",
      "ngOnChanges fires exactly once, after every other lifecycle hook has completed",
      "ngOnChanges entirely replaces ngOnInit whenever the component declares @Input() bindings",
    ],
    answer: 1,
    topicPath: 'inputs',
    explanation: 'B is correct: `ngOnChanges(changes: SimpleChanges)` fires before `ngOnInit` and before each change detection cycle when @Input properties change. It gives you previous/current values and whether it is the first change. With signal inputs (`input()`), Angular\'s signal graph handles reactivity — compute values in `computed()` or react in `effect()` instead of `ngOnChanges`. The lifecycle hook is not called for signal inputs. A is wrong. C is wrong. D is wrong.',
  },
  {
    id: 192, type: 'multiple-choice', difficulty: 'senior', category: 'rxjs',
    question: 'What is a `ReplaySubject(1)` and how does it differ from `BehaviorSubject`?',
    options: [
      "They are identical — ReplaySubject(1) is a BehaviorSubject alias",
      "Both replay the last value, but ReplaySubject(1) starts empty",
      "ReplaySubject(1) emits asynchronously; BehaviorSubject is sync",
      "ReplaySubject replays to all; BehaviorSubject only to new ones",
    ],
    answer: 1,
    topicPath: 'rxjs-subjects',
    explanation: 'B is correct: the key practical difference is the initial state requirement. `BehaviorSubject` must be constructed with a value (`new BehaviorSubject<User | null>(null)`) and always has a `.value` getter. `ReplaySubject(1)` is empty until the first `next()` call — late subscribers get nothing if no value has been emitted yet. Use BehaviorSubject when there is a sensible initial state; use ReplaySubject(1) when "no value yet" is a valid state you want to preserve. A, C, D are wrong.',
  },
  {
    id: 193, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'How do you apply a CSS class conditionally in Angular templates?',
    options: [
      "[className]=\"isActive ? 'active' : ''\" with manual empty-string handling",
      "[class.active]=\"isActive\" toggles the class from the isActive value",
      "ngClass=\"{{ isActive }}\"",
      "style.className=\"active\"",
    ],
    answer: 1,
    topicPath: 'class-style-binding',
    explanation: 'B is correct: `[class.className]="expression"` is the idiomatic Angular single-class binding. For multiple conditional classes: `[ngClass]="{ active: isActive, disabled: isDisabled }"` or `[class]="{ active: isActive }"`. A works but requires managing the empty string carefully. C is wrong syntax. D is wrong — `style` is for CSS properties, not class names.',
  },
  {
    id: 194, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What does `AbstractControl.dirty` mean and how does it differ from `touched`?',
    options: [
      "dirty means that validation failed, while touched means the user interacted",
      "dirty means the value changed; touched means it was focused then blurred",
      "They are identical — both turn true the moment the user types in a field",
      "dirty tracks async validation state while touched tracks sync validation",
    ],
    answer: 1,
    topicPath: 'form-validation',
    explanation: 'B is correct: `dirty` tracks VALUE changes; `touched` tracks focus/blur interactions. Typical pattern: show validation errors when `control.invalid && control.touched` (user has visited but has an error). Show "unsaved changes" warnings when `form.dirty` (value changed from saved state). `markAsDirty()` and `markAsTouched()` can set these programmatically. A is wrong. C is wrong. D is wrong.',
  },
  {
    id: 195, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'What is Angular\'s "signal-based component" model and what does it enable?',
    options: [
      "Components that use signals in place of templates for doing the rendering",
      "Components whose reactive state is all signals — enabling fine-grained CD",
      "Components that cannot use Zone.js at all — they require the zoneless mode",
      "A special component class that extends SignalComponent, not base Component",
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
      "You simply cannot check form.valid synchronously the way this code does",
      "Disabled controls are dropped from form.value; use getRawValue() instead",
      "The save() call really ought to be wrapped inside a try/catch block here",
      "You must call form.markAllAsTouched() before you check form.valid at all",
    ],
    answer: 1,
    topicPath: 'reactive-forms',
    explanation: 'B is correct: `FormGroup.value` silently excludes disabled controls. If your form has a pre-filled, disabled "userId" field, `this.form.value` will NOT include it. `this.form.getRawValue()` returns ALL controls regardless of disabled state. This is a subtle bug that causes silent data loss — the save request goes through but without the disabled field\'s value. A is wrong. C is wrong for this question\'s purpose. D is a UX improvement, not a bug fix.',
  },
  {
    id: 197, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'What is `routerLinkActiveOptions: { exact: true }` used for?',
    options: [
      "It makes the router do exact URL matching for its decisions",
      "It marks routerLinkActive only on an EXACT URL match, not prefix",
      "It disables partial matching for the route parameters",
      "exact: true is the default — set exact: false for prefix matching",
    ],
    answer: 1,
    topicPath: 'routing-basics',
    explanation: 'B is correct: by default, `routerLinkActive` uses prefix matching — a link to `/` is considered active on any URL. `[routerLinkActiveOptions]="{ exact: true }"` switches to exact matching, so the home link is only highlighted on the root `/`. This is critical for navigation menus where the home/dashboard link should not always appear active. A is wrong — this is a CSS class question, not a routing decision. C is wrong. D is wrong.',
  },
  {
    id: 198, type: 'multiple-choice', difficulty: 'mid', category: 'typescript',
    question: 'What is a type guard and how do you write a user-defined one?',
    options: [
      "A runtime validator TypeScript generates and runs before calls",
      "A function returning boolean typed \"value is Type\", used to narrow",
      "A try/catch wrapper that catches TypeScript type errors at runtime",
      "Type guards only work on primitives; use instanceof for objects",
    ],
    answer: 1,
    topicPath: 'ts-narrowing',
    explanation: 'B is correct: user-defined type guards use the `value is Type` return type syntax. When the function returns `true`, TypeScript narrows the type of `value` to `Type` in the enclosing `if` block. They are essential for narrowing `unknown` API responses, discriminated unions, and any "is this thing of type X?" check. A is wrong — TypeScript does not generate runtime validators. C is wrong. D is wrong — type guards work with any type.',
  },
  {
    id: 199, type: 'multiple-choice', difficulty: 'junior', category: 'signals',
    question: 'Can you read a signal inside an `@if` block in a template, and will it be reactive?',
    options: [
      "No — signals inside @if blocks never update because the block may not run",
      "Yes — the compiler tracks signal reads in @if, @for and @switch blocks",
      "Only if you manually call detectChanges() after each and every update",
      "Yes, but only for OnPush components; default detection ignores the reads",
    ],
    answer: 1,
    topicPath: 'signals',
    explanation: 'B is correct: Angular\'s template engine tracks signal reads throughout the entire template, including inside control flow blocks. If `showAdmin()` is a signal read inside `@if (showAdmin())`, and if `user()` inside that block is a signal, both are tracked. When either signal changes, Angular re-evaluates the template. Signal tracking in templates is one of the core benefits of Angular\'s reactivity model. A, C, D are wrong.',
  },
  {
    id: 200, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'What is the Angular `@let` template syntax and what problem does it solve?',
    options: [
      "@let creates a template variable that, unlike a #ref, you can later reassign",
      "@let binds a computed expression to a local name, evaluated once per template",
      "@let imports an external variable from the component class into the template",
      "@let is the template form of TypeScript let, replacing @const for mutable values",
    ],
    answer: 1,
    topicPath: 'let-block',
    explanation: 'B is correct: `@let name = expression` (Angular 18+) evaluates the expression once and binds the result to a local name within the template scope. It solves the "double pipe" problem: instead of writing `(user$ | async)?.name` and `(user$ | async)?.email` (two subscriptions), write `@let user = user$ | async` once and reference `user.name`, `user.email`. Works with any expression — signal calls, pipe chains, method calls. A, C, D are wrong.',
  },

  // ─── BATCH 201-224: MODERN APIS & DEEP DIVES ────────────────────────────────
  {
    id: 201, type: 'predict-output', difficulty: 'mid', category: 'signals',
    question: 'What does count() return after b.set(20) runs?',
    code: `const a = signal(1);
const b = signal(10);
const count = computed(() => a() + untracked(() => b()));

count();      // first read → memoized
a.set(2);     // a is tracked
b.set(20);    // b was read via untracked
console.log(count());`,
    options: [
      "22 — count re-runs and reads both the new a (2) and the new b (20)",
      "12 — it last ran on a.set(2) with untracked b=10; b.set does not invalidate",
      "11 — the initial value, because untracked entirely freezes the computed in place",
      "21 — a stays at 1 the whole time while b updates its value to 20",
    ],
    answer: 1,
    topicPath: 'signals-advanced',
    explanation: 'B is correct. `untracked(() => b())` reads b\'s CURRENT value but does NOT register b as a dependency. So `count` only recomputes when `a` changes. First read caches 1 + 10 = 11. `a.set(2)` invalidates count → it recomputes to 2 + untracked(b=10) = 12. `b.set(20)` is invisible to count (b is not a tracked dependency), so it never recomputes — `count()` returns the stale 12. This is the whole point of untracked: read a signal without subscribing to it. Why others fail: (A) count never re-reads b reactively. (C) untracked reads the live value, it does not freeze. (D) a was updated to 2, not left at 1.',
  },
  {
    id: 202, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'What does the `onCleanup` callback passed into an effect do?',
    code: `effect((onCleanup) => {
  const id = setInterval(() => poll(), 1000);
  onCleanup(() => clearInterval(id));
});`,
    options: [
      "It runs a single time on component destroy, exactly like ngOnDestroy",
      "Teardown that runs before the effect's next run and on its destruction",
      "It cancels the effect permanently right after its very first execution",
      "onCleanup is not a real API — effects simply never need manual cleanup",
    ],
    answer: 1,
    topicPath: 'signals-advanced',
    explanation: 'B is correct. The function you pass to `onCleanup` runs (1) immediately before the effect re-executes due to a dependency change, and (2) when the effect is torn down (its injection context is destroyed). This lets each run clean up after itself — clear timers, unsubscribe, abort fetches — so you never stack duplicate intervals or leak subscriptions. Why others fail: (A) it also runs between re-runs, not only on final destroy. (C) it does not stop the effect; the effect keeps reacting. (D) side-effecting work (timers, listeners) absolutely needs cleanup.',
  },
  {
    id: 203, type: 'multiple-choice', difficulty: 'mid', category: 'signals',
    question: 'What does the `equal` option do in `signal(value, { equal: fn })`?',
    options: [
      "It runs once at creation only to validate the initial value's type",
      "Called with (prev, next) per write; returning true means \"not changed\"",
      "It deep-clones the value before storing it so as to guarantee immutability",
      "It turns the signal into a computed by deriving equality from others",
    ],
    answer: 1,
    topicPath: 'signals-advanced',
    explanation: 'B is correct. `equal` is a custom equality function called on every write. If `equal(prev, next)` returns true, Angular considers the value unchanged, skips the update, and does NOT notify computeds/effects/templates — avoiding wasted recomputation and change detection. The default is `Object.is`, which treats a new array/object reference as different even when structurally identical; supplying a structural comparator (e.g. `_.isEqual`) stops needless updates. Why others fail: (A) it runs on every set, not just at creation. (C) it compares, it does not clone. (D) it does not turn a writable signal into a computed.',
  },
  {
    id: 204, type: 'spot-the-bug', difficulty: 'senior', category: 'forms',
    question: 'After reset(), value is `null` and breaks the string-typed consumer. Why, and how do you fix it?',
    code: `const name = new FormControl('Ada');
// ...later
name.reset();
const upper: string = name.value.toUpperCase(); // 💥 runtime + type error`,
    options: [
      "reset() is deprecated now; use clear(), which will preserve the type here",
      "A default control is nullable; reset() yields null — use { nonNullable }",
      "FormControl values are always strings; the error is unrelated to reset()",
      "You must pass an empty string: reset(\"\"), but the type stays nullable still",
    ],
    answer: 1,
    topicPath: 'reactive-forms',
    explanation: 'B is correct. By default `new FormControl(\'Ada\')` is typed `FormControl<string | null>` and `reset()` sets the value to `null` (not the initial value), so `name.value.toUpperCase()` throws at runtime and TypeScript flags the possible null. The fix is `new FormControl(\'Ada\', { nonNullable: true })` — now the type is `FormControl<string>` and `reset()` returns to the initial `\'Ada\'` instead of null. Why others fail: (A) there is no `clear()`; reset() is correct. (C) values are nullable by default, which is the whole problem. (D) passing `reset(\'\')` works at runtime but the declared type stays nullable, so the type error remains.',
  },
  {
    id: 205, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What does `new FormControl(\'\', { updateOn: \'blur\' })` change?',
    options: [
      "It disables the control entirely until the user first focuses into it",
      "Value and validity update on blur, not each keystroke, reducing churn",
      "It debounces the control's value changes by a fixed 300ms delay instead",
      "It makes the control update on every change AND on blur, whichever is first",
    ],
    answer: 1,
    topicPath: 'form-validation',
    explanation: 'B is correct. `updateOn` controls when the model syncs from the view. `\'change\'` (default) updates on every input event; `\'blur\'` updates only when the field loses focus; `\'submit\'` updates only when the parent form is submitted. Using `\'blur\'` is ideal for expensive async validators (e.g. "is this email taken?") because it fires one validation when the user leaves the field instead of one per keystroke. Why others fail: (A) it does not disable anything. (C) it is event-based, not a timer/debounce. (D) it replaces change-based updating, it does not combine them.',
  },
  {
    id: 206, type: 'predict-output', difficulty: 'mid', category: 'rxjs',
    question: 'What values are logged?',
    code: `of(1, 2, 3).pipe(
  scan((acc, n) => acc + n, 0)
).subscribe(console.log);`,
    options: [
      "6 — like reduce, only the final total is ever emitted",
      "1, 3, 6 — scan emits the running accumulator after each value",
      "0, 1, 3, 6 — the seed value is emitted first, then all the rest",
      "1, 2, 3 — scan passes the values straight through unchanged",
    ],
    answer: 1,
    topicPath: 'rxjs-operators',
    explanation: 'B is correct. `scan` is "reduce that emits every step". Starting from seed 0: 0+1=1 (emit 1), 1+2=3 (emit 3), 3+6... 3+3=6 (emit 6). So it logs 1, 3, 6. Use `scan` for running totals / accumulating state over a stream. Why others fail: (A) that is `reduce`, which emits only once on completion. (C) the seed itself is not emitted — the first emission is seed+first value; prepend `startWith(0)` if you want the 0. (D) scan transforms and accumulates; it does not pass values through.',
  },
  {
    id: 207, type: 'multiple-choice', difficulty: 'senior', category: 'rxjs',
    question: 'Why can `shareReplay(1)` leak, and what is the fix?',
    code: `readonly ticks$ = interval(1000).pipe(shareReplay(1));`,
    options: [
      "It buffers every emission forever; cap it with take(1)",
      "The source stays subscribed after all unsub; use refCount: true",
      "shareReplay makes a new subscription per subscriber; use share()",
      "It only works inside components; move it to a service to fix",
    ],
    answer: 1,
    topicPath: 'rxjs-advanced',
    explanation: 'B is correct. By default `shareReplay(1)` is NOT reference-counted: once it subscribes to the source it keeps that subscription open forever, so a hot source like `interval`/`fromEvent`/a WebSocket keeps running even after every consumer has unsubscribed — a leak. Passing `{ bufferSize: 1, refCount: true }` makes it drop the source subscription when the subscriber count hits zero (and re-subscribe when a new one arrives). Why others fail: (A) bufferSize 1 already caps the buffer; the leak is the source subscription, not the buffer. (C) sharing is exactly what it does; the issue is teardown. (D) location is irrelevant to the refCount behavior.',
  },
  {
    id: 208, type: 'spot-the-bug', difficulty: 'senior', category: 'rxjs',
    question: 'After one failed request the typeahead stops responding entirely. Why?',
    code: `this.query$.pipe(
  debounceTime(300),
  switchMap(q => this.api.search(q)),
  catchError(() => of([]))   // ← placement
).subscribe(results => this.results.set(results));`,
    options: [
      "The debounceTime must be placed only after switchMap in the pipe",
      "catchError sits on the OUTER stream; move it inside switchMap",
      "switchMap should be mergeMap so requests are not cancelled",
      "of([]) is wrong; catchError must rethrow to keep it alive",
    ],
    answer: 1,
    topicPath: 'rxjs-advanced',
    explanation: 'B is correct. An RxJS error terminates the observable it lives on. Here `catchError` sits on the OUTER `query$` chain, so the first failed search errors-then-completes the entire pipeline and the subscription dies — the typeahead goes silent. Put `catchError` on the INNER observable so only that one request recovers and the outer stream keeps flowing: `switchMap(q => this.api.search(q).pipe(catchError(() => of([]))))`. Why others fail: (A) debounceTime is correctly placed before switchMap. (C) switchMap is the right operator for search (cancels stale requests). (D) returning `of([])` to recover is correct — the bug is placement, not the recovery value.',
  },
  {
    id: 209, type: 'predict-output', difficulty: 'senior', category: 'rxjs',
    question: 'What does this forkJoin emit?',
    code: `forkJoin({
  user: of({ id: 1 }),
  ticks: interval(1000)
}).subscribe({
  next: v => console.log('next', v),
  complete: () => console.log('done')
});`,
    options: [
      "{ user: {id:1}, ticks: 0 } after one second, then done",
      "Nothing — forkJoin needs all to complete; interval never does",
      "{ user: {id:1} } immediately, ignoring the pending ticks",
      "It errors because you cannot mix finite and infinite sources",
    ],
    answer: 1,
    topicPath: 'rxjs-operators',
    explanation: 'B is correct. `forkJoin` waits for every input observable to COMPLETE, then emits a single object of their LAST values. `interval(1000)` never completes, so forkJoin never emits `next` and never completes — the subscription just sits there. Use `combineLatest` if you want the latest values whenever any source emits, or make each source finite (e.g. `interval(1000).pipe(take(1))`). Why others fail: (A) forkJoin needs completion, not just a first value. (C) it never emits partial results. (D) mixing finite/infinite is legal — it simply never fires.',
  },
  {
    id: 210, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What does the transform enable here: `disabled = input(false, { transform: booleanAttribute })`?',
    options: [
      "It validates at compile time that only boolean values may ever be assigned to the input",
      "It coerces attribute inputs to boolean, so a bare disabled attribute becomes true",
      "It makes the input two-way bindable with the banana-in-a-box syntax",
      "It runs the transform once, on the initial value only, and never again",
    ],
    answer: 1,
    topicPath: 'inputs',
    explanation: 'B is correct. An input `transform` runs on every incoming value before it reaches the signal. `booleanAttribute` (built in, alongside `numberAttribute`) coerces the way native HTML boolean attributes do: a present-but-empty attribute (`<my-cmp disabled>`) and the string `"true"` become `true`; absence/`"false"` become `false`. This lets custom components accept `disabled` like real DOM elements. Why others fail: (A) it coerces at runtime, not just type-checks. (C) two-way binding is `model()`, not a transform. (D) the transform runs on every value change, not once.',
  },
  {
    id: 211, type: 'spot-the-bug', difficulty: 'senior', category: 'components',
    question: 'Why is `this.box()` undefined in the constructor?',
    code: `@Component({ template: '<div #box>hi</div>' })
export class Card {
  box = viewChild<ElementRef>('box');

  constructor() {
    console.log(this.box());  // undefined
  }
}`,
    options: [
      "viewChild cannot query a plain <div>; it only ever finds components",
      "The query resolves after view init — read it in effect()/afterNextRender, not here",
      "You must call viewChild.required() or the query always returns undefined",
      "The #box template reference must be exposed with exportAs before it becomes queryable",
    ],
    answer: 1,
    topicPath: 'view-queries',
    explanation: 'B is correct. Signal view queries are populated when Angular creates the component\'s view — which happens AFTER the constructor runs. So reading `this.box()` in the constructor returns `undefined`. Read it once the view exists: inside an `effect(() => { const el = this.box(); if (el) {...} })` (the effect re-runs when the query resolves), in `afterNextRender()`, or in `ngAfterViewInit`. Why others fail: (A) viewChild finds elements, directives, and components. (C) `.required()` throws if not found — it does not change WHEN the query resolves. (D) `exportAs` is for directive instances; a template ref var does not need it.',
  },
  {
    id: 212, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'What does `model()` provide that `input()` does not?',
    code: `value = model<string>('');   // vs  value = input<string>('')`,
    options: [
      "model() adds full runtime validation to each and every value that gets assigned to it",
      "model() is a writable two-way signal — setting it emits a valueChange for [(value)]",
      "model() makes the input required by default, unlike an optional input()",
      "model() converts the input signal into an Observable you subscribe to",
    ],
    answer: 1,
    topicPath: 'outputs',
    explanation: 'B is correct. `input()` is READ-ONLY inside the component. `model()` creates a WRITABLE signal AND, whenever you call `value.set(x)`/`value.update()`, Angular emits a matching `valueChange` output — which is exactly the contract `[(value)]="parentSignal"` relies on. It is the modern, signal-based replacement for the `@Input() x` + `@Output() xChange` pair. Why others fail: (A) it does not add validation. (C) use `model.required()` for required; plain `model()` is optional. (D) it stays a signal, not an Observable.',
  },
  {
    id: 213, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'What does `provideRouter(routes, withComponentInputBinding())` let you do?',
    code: `{ path: 'user/:id', component: UserPage }
// UserPage:
id = input.required<string>();   // ← bound from the :id param`,
    options: [
      "It automatically lazy-loads every routed component for you",
      "It binds route params, query params and data to inputs by name",
      "It validates that route params match the input types at runtime",
      "It enables two-way binding between the URL and component state",
    ],
    answer: 1,
    topicPath: 'route-params',
    explanation: 'B is correct. `withComponentInputBinding()` wires router data into `@Input()`/`input()` properties by name: a path param `:id`, a matching query param `?id=`, and resolver data keyed `id` all flow into an `id` input. It removes the boilerplate of injecting `ActivatedRoute` and subscribing to `paramMap` for simple cases. Why others fail: (A) lazy loading is `loadComponent`/`loadChildren`, unrelated. (C) there is no runtime type validation — params arrive as strings. (D) it is one-way (URL → input), not two-way.',
  },
  {
    id: 214, type: 'multiple-choice', difficulty: 'senior', category: 'routing',
    question: 'How do you register an HTTP interceptor in modern (functional) Angular?',
    options: [
      "Add { provide: HTTP_INTERCEPTORS, useClass, multi: true }",
      "provideHttpClient(withInterceptors([authInterceptor]))",
      "Decorate the class with @Interceptor() so it auto-registers",
      "Pass it to bootstrapApplication as its second argument",
    ],
    answer: 1,
    topicPath: 'http-interceptors',
    explanation: 'B is correct. Functional interceptors are plain functions of type `HttpInterceptorFn` — `(req, next) => next(modifiedReq)` — registered via `provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor]))`. They run in array order, can use `inject()` inside for services, and are the standalone-first standard. Why others fail: (A) the `HTTP_INTERCEPTORS` multi-provider is the OLD DI-based approach — still supported via `withInterceptorsFromDi()`, but not the modern default. (C) there is no `@Interceptor()` decorator. (D) interceptors are configured through `provideHttpClient`, not a bootstrap argument.',
  },
  {
    id: 215, type: 'predict-output', difficulty: 'mid', category: 'typescript',
    question: 'What is the type of `p`?',
    code: `const config = {
  port: 3000,
  host: 'localhost',
} satisfies Record<string, string | number>;

const p = config.port;`,
    options: [
      "string | number — each value widened to the Record's value type",
      "number — satisfies validates the shape without widening types",
      "any — the satisfies operator erases the specific types",
      "3000 — the exact literal type is preserved by satisfies",
    ],
    answer: 1,
    topicPath: 'ts-utility-types',
    explanation: 'B is correct. `satisfies` checks that the value is assignable to `Record<string, string | number>` but keeps the NARROW inferred type of the literal. So `config.port` stays `number` (and `config.host` stays `string`), giving you both validation and precise types. Contrast with a type ANNOTATION `const config: Record<string, string | number> = {...}`, which widens `config.port` to `string | number`. Why others fail: (A) that is what an annotation would do, not satisfies. (C) satisfies never produces `any`. (D) object property inference widens `3000` to `number` (only `as const` keeps the literal `3000`).',
  },
  {
    id: 216, type: 'multiple-choice', difficulty: 'senior', category: 'typescript',
    question: 'What makes a discriminated union exhaustively checkable at compile time?',
    code: `type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'square'; side: number };`,
    options: [
      "Marking every single property in each variant as readonly",
      "A shared tag narrows cases; a never default catches new ones",
      "Wrapping the whole union inside a single interface",
      "Using a real enum instead of string literals for the kind field",
    ],
    answer: 1,
    topicPath: 'ts-narrowing',
    explanation: 'B is correct. A common literal discriminant (`kind`) lets TypeScript narrow the union inside `switch (shape.kind)` so each branch sees the right member type. Add a `default` that assigns the value to a `never`: `const _exhaustive: never = shape;`. If someone later adds `{ kind: \'triangle\'; ... }` and forgets a case, `shape` is no longer `never` in the default branch and the assignment fails to compile — a free exhaustiveness check. Why others fail: (A) readonly affects mutability, not narrowing. (C) an interface cannot express a union of shapes. (D) an enum tag works too, but the enum itself is not what enables exhaustiveness — the never-assignment is.',
  },
  {
    id: 217, type: 'multiple-choice', difficulty: 'mid', category: 'typescript',
    question: 'Which built-in utility type makes every property of T optional?',
    options: [
      'Required<T>',
      'Partial<T>',
      'Readonly<T>',
      'Pick<T, K>',
    ],
    answer: 1,
    topicPath: 'ts-utility-types',
    explanation: 'B is correct. `Partial<T>` maps every property to optional (`{ [K in keyof T]?: T[K] }`) — ideal for patch/update payloads and `patchValue`-style APIs. Know the family: `Required<T>` makes all properties required (the inverse); `Readonly<T>` makes them immutable; `Pick<T, K>` keeps only keys K; `Omit<T, K>` removes keys K; `Record<K, V>` builds an object type from a key set. Why others fail: (A) Required is the opposite. (C) Readonly changes mutability, not optionality. (D) Pick selects a subset of keys, it does not make them optional.',
  },
  {
    id: 218, type: 'spot-the-bug', difficulty: 'mid', category: 'testing',
    question: 'This test asserts too early for an async-loading component. What is missing?',
    code: `it('shows loaded data', () => {
  fixture.detectChanges();          // triggers ngOnInit → async load
  const text = fixture.nativeElement.textContent;
  expect(text).toContain('Loaded');  // fails: still "Loading..."
});`,
    options: [
      "detectChanges() simply has to be called twice, one right after the other",
      "Async work has not resolved; await whenStable() before re-checking DOM",
      "querySelector really ought to be used here in place of textContent access",
      "ngOnInit cannot start async work at all — move that work to the constructor",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct. The first `detectChanges()` runs `ngOnInit`, which kicks off an async fetch — but the promise/HTTP response has not resolved by the next synchronous line, so the DOM still shows the loading state. Await stabilization, then re-render: `await fixture.whenStable(); fixture.detectChanges(); expect(...)`. Alternatives: `fakeAsync` + `tick()`/`flush()`, or flush a mock via `HttpTestingController`. Why others fail: (A) calling detectChanges twice does not make time pass for the pending async task. (C) the query method is irrelevant to the timing bug. (D) starting async work in ngOnInit is normal and correct.',
  },
  {
    id: 219, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'What is the modern TestBed setup for testing a service that uses HttpClient?',
    options: [
      "imports: [HttpClient] and inject HttpClient directly to make real requests",
      "providers: [provideHttpClient(), provideHttpClientTesting()], then inject",
      "imports: [HttpClientModule] and then just spyOn(window, \"fetch\") for it",
      "No setup at all is needed; HttpClient is auto-mocked for you in TestBed",
    ],
    answer: 1,
    topicPath: 'testing-services-http',
    explanation: 'B is correct. The standalone-first pattern is `TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })`. `provideHttpClientTesting()` swaps in a backend you drive with `HttpTestingController` — `httpMock.expectOne(url).flush(data)` to answer requests and `httpMock.verify()` in afterEach to assert none were left unhandled. Why others fail: (A) hitting the real network in a unit test is flaky and slow. (C) `HttpClientModule` + fetch spying is neither the module you\'d use nor how HttpClient works under the hood. (D) TestBed does not auto-mock HttpClient — you must provide the testing backend.',
  },
  {
    id: 220, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'In a zoneless app (`provideZonelessChangeDetection()`), what triggers change detection?',
    options: [
      "Nothing at all — you must call detectChanges() manually just about everywhere",
      "Signal reads, async pipe, template events, and markForCheck notify directly",
      "Only the HTTP responses trigger it, via one single built-in HTTP interceptor",
      "Every setTimeout and Promise, exactly like Zone.js but noticeably faster",
    ],
    answer: 1,
    topicPath: 'zoneless',
    explanation: 'B is correct. Without Zone.js, Angular no longer monkey-patches setTimeout/Promise/addEventListener to guess when to re-render. Instead, change detection is scheduled by explicit reactive signals: a signal used in a template changing, the async pipe emitting, a template `(event)` firing, or `ChangeDetectorRef.markForCheck()`. The practical consequence: a bare `setTimeout(() => this.plainField = x)` will NOT update the view unless it writes to a signal or calls markForCheck. Why others fail: (A) the listed reactive primitives schedule CD for you. (C) it is not limited to HTTP. (D) the whole point is that arbitrary async callbacks no longer auto-trigger CD.',
  },
  {
    id: 221, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'What does `provideClientHydration()` do for a server-rendered (SSR) Angular app?',
    options: [
      "It re-renders the whole app on the client, replacing the server's HTML",
      "Non-destructive hydration — Angular reuses the server DOM, with no flicker",
      "It disables JavaScript on the client entirely for the sake of faster loads",
      "It caches all of the app's API responses inside localStorage for later use",
    ],
    answer: 1,
    topicPath: 'hydration',
    explanation: 'B is correct. Without hydration, Angular throws away the server-rendered DOM on bootstrap and re-creates it, causing a visible flash and layout shift. `provideClientHydration()` turns on non-destructive hydration: Angular walks the existing server DOM, attaches event listeners and state to it, and skips re-rendering — better LCP/CLS and no flicker. Add `withIncrementalHydration()` to hydrate `@defer` blocks lazily (e.g. on interaction/viewport). Why others fail: (A) that is the pre-hydration destructive behavior it eliminates. (C) it does not disable client JS. (D) it hydrates DOM; it is not an HTTP cache.',
  },
  {
    id: 222, type: 'predict-output', difficulty: 'mid', category: 'performance',
    question: 'With a PURE pipe, when does `transform()` re-run for `{{ items | tally }}`?',
    code: `@Pipe({ name: 'tally' })            // pure by default
export class TallyPipe implements PipeTransform {
  transform(items: Item[]) { return items.length; }
}

// component: this.items.push(newItem);  // mutate in place`,
    options: [
      "On every single change-detection cycle, regardless of the input value",
      "Only when the items reference changes; an in-place push does not re-run it",
      "Never — a pure pipe runs its transform exactly one single time only, ever here",
      "Whenever literally any signal anywhere in the component changes at all",
    ],
    answer: 1,
    topicPath: 'custom-pipes',
    explanation: 'B is correct. A pure pipe (the default) re-runs `transform` only when Angular detects a change to its INPUT by reference (or a changed primitive). `this.items.push(x)` mutates the existing array — the reference is unchanged — so the pipe does not re-run and the displayed count goes stale. Fix by replacing the reference (`this.items = [...this.items, x]`) or using a signal. An IMPURE pipe (`pure: false`) runs every CD cycle, which is why impure pipes must be cheap. Why others fail: (A) that describes an impure pipe. (C) it re-runs on every reference change, not just once. (D) pure-pipe re-evaluation is keyed on its input reference, not arbitrary signals.',
  },
  {
    id: 223, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'What does the `resource()` API give you over a manual `toSignal(http.get(...))`?',
    code: `user = resource({
  request: () => ({ id: this.userId() }),
  loader: ({ request, abortSignal }) =>
    fetch(\`/api/users/\${request.id}\`, { signal: abortSignal }).then(r => r.json()),
});`,
    options: [
      "Nothing — it is honestly just a shorter syntax for the same behavior",
      "Reactive re-fetch on request change, value/status/error signals, abort",
      "It caches every one of the results permanently and then never refetches",
      "It converts an Observable into a Promise for you behind the scenes here",
    ],
    answer: 1,
    topicPath: 'resource-api',
    explanation: 'B is correct. `resource()` models an async dependency reactively. Its `request` is a signal-computing function; whenever those signals change, the `loader` re-runs, and the previous in-flight request is cancelled through the provided `abortSignal`. It exposes fine-grained signals — `value()`, `status()` (idle/loading/resolved/error), `error()`, `isLoading()` — so templates can render loading/error/data states without manual bookkeeping. `toSignal(http.get(...))` gives you a single value with no built-in request-tracking, cancellation, or status. Why others fail: (A) it adds cancellation, status, and auto-refetch. (C) it refetches when the request changes; it is not a permanent cache. (D) it is not an Observable-to-Promise converter.',
  },
  {
    id: 224, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'Where can you call `takeUntilDestroyed()` with NO argument, and why?',
    options: [
      "Anywhere — it always finds the current component for you",
      "Only in an injection context; else pass the DestroyRef in",
      "Only inside ngOnDestroy, after the component is torn down",
      "Only in services, and never inside any component at all",
    ],
    answer: 1,
    topicPath: 'rxjs-interop',
    explanation: 'B is correct. `takeUntilDestroyed()` needs a `DestroyRef`. Called with no argument it uses `inject(DestroyRef)`, which is only legal in an INJECTION CONTEXT — a constructor or a field initializer. If you set up a subscription later (e.g. in `ngOnInit`, which is not an injection context), inject a `DestroyRef` once via `private destroyRef = inject(DestroyRef)` and pass it explicitly: `takeUntilDestroyed(this.destroyRef)`. It auto-completes the stream when the component/service is destroyed, replacing manual `takeUntil(this.destroy$)` boilerplate. Why others fail: (A) outside an injection context the argless form throws. (C) ngOnDestroy is too late to set up a subscription. (D) it works in any injectable — components, services, directives.',
  },

  // ─── BATCH 225-248: SECURITY, TESTING DEPTH, A11Y, JUNIOR ON-RAMPS ───────────
  {
    id: 225, type: 'spot-the-bug', difficulty: 'junior', category: 'security',
    question: 'A user\'s comment contains an onerror script. Does this render a working XSS payload?',
    code: `@Component({ template: '<div [innerHTML]="comment"></div>' })
export class CommentView {
  comment = '<img src=x onerror="stealCookies()">';
}`,
    options: [
      "Yes — [innerHTML] injects the raw markup, so the onerror handler runs immediately",
      "No — Angular's sanitizer strips onerror and scripts, leaving an inert <img>",
      "Yes — unless you manually escape the string first, the handler executes",
      "No — [innerHTML] silently ignores and drops every <img> tag it receives",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. Binding to `[innerHTML]` runs the value through Angular\'s sanitizer in the HTML security context, which removes dangerous constructs — inline event handlers like `onerror`, `<script>`, `javascript:` URLs — before the markup reaches the DOM. The image is inserted without the handler, so `stealCookies()` never fires. The real danger is deliberately DISABLING this with `DomSanitizer.bypassSecurityTrustHtml(userInput)`. Why others fail: (A/C) sanitization already neutralizes the payload without manual escaping. (D) the tag renders; only the unsafe attribute is stripped.',
  },
  {
    id: 226, type: 'multiple-choice', difficulty: 'mid', category: 'security',
    question: 'How does `{{ userComment }}` interpolation protect against XSS?',
    options: [
      "It pipes the string through the DOMPurify library before writing it to the DOM",
      "It renders the value as text, HTML-escaping < > & so the markup never parses",
      "It blocks the render entirely if the string contains any HTML tags",
      "It offers no XSS protection — interpolation and [innerHTML] are equally risky",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. Interpolation writes to `textContent`, not `innerHTML`. Characters like `<` and `>` are escaped and displayed as literal text, so `<script>` shows up on screen as harmless characters rather than executing. This is why interpolation is safe by default — the danger only appears when you switch to `[innerHTML]` and bypass sanitization, or write to the DOM directly. Why others fail: (A) no third-party library is involved; it is plain text rendering. (C) tags are shown, not blocked. (D) interpolation is fundamentally safer than raw innerHTML.',
  },
  {
    id: 227, type: 'multiple-choice', difficulty: 'senior', category: 'security',
    question: 'When is `DomSanitizer.bypassSecurityTrustHtml(value)` dangerous?',
    options: [
      "Always — the method is deprecated and the compiler rejects it in strict mode",
      "Whenever the value holds user-controlled data, since bypassing skips sanitizing",
      "Only on Internet Explorer, where the sanitizer is not available at runtime",
      "Never — Angular quietly re-sanitizes bypassed values on the next change detection",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. `bypassSecurityTrust*` marks a value as trusted and turns OFF Angular\'s sanitizer for it. That is safe only for markup you fully control and that contains no user/attacker input. The moment any user data flows into a bypassed value, you have a stored/reflected XSS hole. Prefer to restructure so you can bind the raw value (letting Angular sanitize it) or sanitize server-side with a strict allowlist. Why others fail: (A) it is not deprecated — it has legitimate narrow uses. (C) the risk is universal, not browser-specific. (D) once bypassed, Angular trusts it and does not re-sanitize.',
  },
  {
    id: 228, type: 'multiple-choice', difficulty: 'mid', category: 'security',
    question: 'What happens with `<a [href]="userUrl">` when userUrl is `"javascript:alert(1)"`?',
    options: [
      "The stealCookies() script executes the moment a user clicks the link",
      "Angular sanitizes the URL context, rewriting it to an inert unsafe:javascript:",
      "Angular throws a runtime error and refuses to render the whole component",
      "The link works normally — Angular does not sanitize URL bindings the way it does HTML",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. `[href]`, `[src]`, and similar URL bindings are sanitized in the URL security context. Dangerous schemes like `javascript:` are prefixed with `unsafe:`, producing an inert `unsafe:javascript:alert(1)` that the browser will not execute. Safe schemes (`http`, `https`, `mailto`, `tel`, relative paths) pass through unchanged. Why others fail: (A) the scheme is neutralized before it reaches the DOM. (C) it degrades gracefully, it does not crash. (D) URL bindings ARE sanitized by default.',
  },
  {
    id: 229, type: 'multiple-choice', difficulty: 'senior', category: 'security',
    question: 'How does Angular\'s HttpClient help defend against CSRF?',
    options: [
      "It automatically encrypts every request body before it leaves the browser",
      "It echoes the XSRF-TOKEN cookie into an X-XSRF-TOKEN header on same-origin writes",
      "It blocks every cross-origin request outright, so a forged call can never even be sent",
      "It attaches an Authorization: Bearer header read from localStorage for you",
    ],
    answer: 1,
    topicPath: 'http-interceptors',
    explanation: 'B is correct. Angular implements the cookie-to-header token pattern: it reads a token your server set in the `XSRF-TOKEN` cookie and sends it back in the `X-XSRF-TOKEN` header on mutating (POST/PUT/DELETE) same-origin requests. Because a malicious cross-site page cannot read your cookie to replay it in a custom header, the server can distinguish genuine requests. Configure names via `provideHttpClient(withXsrfConfiguration({ cookieName, headerName }))`. Why others fail: (A) it does not encrypt bodies (that is TLS). (C) it does not block cross-origin requests (that is CORS). (D) it does not manage bearer tokens for you.',
  },
  {
    id: 230, type: 'spot-the-bug', difficulty: 'senior', category: 'security',
    question: 'This "render user bio" feature is a stored-XSS hole. Why?',
    code: `setBio(userBio: string) {
  // userBio comes straight from the profile API (user-entered)
  this.safeBio = this.sanitizer.bypassSecurityTrustHtml(userBio);
}
// template: <div [innerHTML]="safeBio"></div>`,
    options: [
      "bypassSecurityTrustHtml is fine here; the real bug is using [innerHTML] at all",
      "Calling bypassSecurityTrustHtml on user input disables sanitizing — markup runs",
      "The bug is that safeBio should be a signal instead of a plain class field",
      "There is no bug — bypassSecurityTrustHtml sanitizes the value before returning",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. `bypassSecurityTrustHtml` explicitly turns OFF Angular\'s sanitizer for that value. Feeding it user-entered content means any `<script>`/`onerror` an attacker saved in their bio runs for every viewer — classic stored XSS. The fix is to NOT bypass: bind `[innerHTML]="userBio"` so Angular sanitizes it, or if you must allow rich text, sanitize on the server with a strict tag/attribute allowlist. Why others fail: (A) `[innerHTML]` with sanitization is safe; bypassing is the actual bug. (C) signal vs field is irrelevant to the vulnerability. (D) bypassing does the opposite of sanitizing.',
  },
  {
    id: 231, type: 'multiple-choice', difficulty: 'mid', category: 'security',
    question: 'Why prefer template bindings / Renderer2 over `el.nativeElement.innerHTML = html`?',
    options: [
      "Direct DOM writes parse noticeably slower than Angular's template bindings do",
      "el.nativeElement.innerHTML skips sanitizing (XSS) and breaks on SSR / non-DOM",
      "ElementRef is deprecated and will be removed in a future Angular release",
      "It is fine — nativeElement.innerHTML is sanitized exactly like [innerHTML] is",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. Assigning to `nativeElement.innerHTML` writes raw HTML straight to the DOM with NO sanitization, so any embedded user data becomes an XSS vector. It also assumes a real DOM exists, which breaks server-side rendering and other platforms. Prefer `[innerHTML]`/`[textContent]` bindings (sanitized) or `Renderer2` methods, which are platform-agnostic. Why others fail: (A) performance is not the concern. (C) ElementRef is not deprecated, just to be used carefully. (D) the direct property assignment is NOT sanitized — only the `[innerHTML]` binding is.',
  },
  {
    id: 232, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'Inside fakeAsync, what is the difference between `tick(1000)` and `flush()`?',
    options: [
      "They are simply identical aliases for one another in the fakeAsync zone",
      "tick(1000) advances exactly 1000ms; flush() drains ALL pending macrotasks",
      "tick() handles the Promises while flush() handles only the timers instead",
      "flush() advances a fixed 1000ms while tick() advances just 1ms at a time",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct. `fakeAsync` gives you a virtual clock. `tick(ms)` moves it forward by a precise amount and runs any timers/microtasks scheduled up to that point — use it to assert intermediate timing (e.g. a 300ms debounce). `flush()` repeatedly advances the clock until no timer macrotasks remain, settling everything at once — use it when you just want the async work to finish. `flushMicrotasks()` drains pending Promises without advancing timers. Why others fail: (A) they behave differently. (C) tick drains microtasks too. (D) flush has no fixed duration.',
  },
  {
    id: 233, type: 'spot-the-bug', difficulty: 'senior', category: 'testing',
    question: 'This fakeAsync test throws "1 periodic timer(s) still in the queue". Why, and how do you fix it?',
    code: `it('polls the server', fakeAsync(() => {
  component.startPolling();   // uses setInterval(...)
  tick(1000);
  expect(component.count).toBe(1);
}));  // 💥 Error: 1 periodic timer(s) still in the queue`,
    options: [
      "tick() simply must be replaced with a flush() call to clear periodic timers",
      "setInterval leaves a periodic task queued; call discardPeriodicTasks/stop",
      "fakeAsync cannot be used with setInterval at all — use a real async test",
      "The interval needs to be created inside of the tick() callback instead here",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct. `fakeAsync` asserts a clean timer queue at the end of the test to catch leaks. `setInterval` schedules a recurring (periodic) task that never completes on its own, so it is still queued when the test finishes → the error. Fix by tearing down the interval the way production would (`component.stop()` / `ngOnDestroy`), or explicitly call `discardPeriodicTasks()` to drop pending periodic timers before returning. Why others fail: (A) `flush()` also leaves the periodic timer re-scheduling, so it still throws. (C) fakeAsync works fine with intervals when you clean them up. (D) where the interval is created does not change the pending-queue check.',
  },
  {
    id: 234, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'What does marble testing with RxJS TestScheduler give you?',
    options: [
      "A way to run your Observables on a background thread purely for the speed",
      "ASCII marble diagrams describe timed emissions; assert them synchronously",
      "It gives you automatic mocking of all of the HttpClient requests for free",
      "A replacement for fakeAsync that happens to only ever work with Promises",
    ],
    answer: 1,
    topicPath: 'testing-services-http',
    explanation: 'B is correct. `TestScheduler` runs your stream against a VIRTUAL time frame described by marble strings: `-` is a frame of time, letters are emissions, `|` is complete, `#` is error. Inside `scheduler.run(({ cold, hot, expectObservable }) => ...)` you build inputs and assert the exact emission timing of `debounceTime`, `delay`, `retry`, etc. — all synchronously and deterministically, with no real clock. Why others fail: (A) it does not use threads. (C) HTTP mocking is HttpTestingController\'s job. (D) it targets Observables and virtual time, not just Promises.',
  },
  {
    id: 235, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'What is the advantage of a Component Harness over `fixture.nativeElement.querySelector`?',
    code: `const loader = TestbedHarnessEnvironment.loader(fixture);
const button = await loader.getHarness(MatButtonHarness);
await button.click();`,
    options: [
      "Harnesses render the components about ten times faster than queries do",
      "A semantic API (click, getText, isDisabled) so tests survive DOM refactors",
      "Harnesses only ever exist for the sole purpose of testing forms in Angular",
      "Harnesses remove the need to ever call fixture.detectChanges() entirely",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct. A harness wraps a component behind an intent-based API. Your test says `button.click()` / `await input.setValue(\'x\')` instead of querying `.mat-button` and dispatching events. When the internal DOM structure or CSS classes change, only the harness implementation updates — the tests stay green because they assert behavior, not markup. Angular Material ships harnesses for every component; you can build your own by extending `ComponentHarness`. Why others fail: (A) speed is comparable. (C) harnesses work for any component, not just forms. (D) harness methods trigger change detection internally but the concept is about stable, semantic queries.',
  },
  {
    id: 236, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'Why obtain a service with `TestBed.inject(UserService)` rather than `new UserService(...)` in a test?',
    options: [
      "new UserService() is actually a plain syntax error when inside a spec file here",
      "inject resolves via DI, wiring deps and overrides, returning the singleton",
      "TestBed.inject creates a fresh instance per call, which is what you want",
      "They are equivalent; TestBed.inject just happens to be a bit shorter here",
    ],
    answer: 1,
    topicPath: 'testing-services-http',
    explanation: 'B is correct. `TestBed.inject` goes through the configured injector, so the service is constructed with its real (or overridden/mocked) dependencies and you get the SAME singleton the components in that TestBed use. `new UserService(...)` forces you to manually build every constructor dependency, ignores any `{ provide, useValue }` mocks you set up, and produces an instance disconnected from the component tree. Why others fail: (A) `new` is legal, just usually wrong here. (C) inject returns the DI singleton, not a fresh instance each call. (D) they differ in dependency wiring and override behavior.',
  },
  {
    id: 237, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'How do you replace a real service with a fake for the component under test?',
    options: [
      "Reassign it: component[\"userService\"] = fake after the component is built",
      "Register it: providers: [{ provide: UserService, useValue: fake }] in DI",
      "Just import the fake instead of the real service inside of the spec file",
      "Fakes are not actually supported at all; you must hit the real backend here",
    ],
    answer: 1,
    topicPath: 'testing-services-http',
    explanation: 'B is correct. Provider overriding is the DI-native way to inject test doubles. In `configureTestingModule({ providers: [{ provide: UserService, useValue: fake }] })` (or `useClass: MockUserService`), any component/service that injects `UserService` gets the fake — including nested dependencies you never touch directly. For already-built modules use `TestBed.overrideProvider(UserService, { useValue: fake })` before creating the component. Why others fail: (A) reassigning a private field is brittle and misses nested injections. (C) importing does not change what DI resolves. (D) test doubles are the standard practice.',
  },
  {
    id: 238, type: 'spot-the-bug', difficulty: 'junior', category: 'a11y',
    question: 'This "button" is inaccessible. What is wrong and how do you fix it?',
    code: `<div class="btn" (click)="save()">Save</div>`,
    options: [
      "Nothing — a click handler makes any element a proper button",
      "A <div> is not focusable, has no button role, isn't announced",
      "The bug is the CSS class name; just rename it to \"button\"",
      "You must add a (mouseover) alongside (click) for accessibility",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. A clickable `<div>` only responds to mouse clicks: keyboard users cannot Tab to it or activate it with Enter/Space, and assistive tech announces it as plain text, not a control. The right fix is the native `<button>`, which is focusable, keyboard-operable, and announced as a button for free. If a non-button element is unavoidable, you must manually add `role="button"`, `tabindex="0"`, and a keydown handler for Enter and Space. Why others fail: (A) a handler alone gives no keyboard/role semantics. (C) the class name is irrelevant to accessibility. (D) hover is not an accessibility affordance.',
  },
  {
    id: 239, type: 'multiple-choice', difficulty: 'mid', category: 'a11y',
    question: 'What makes an icon-only button `<button><svg>…</svg></button>` accessible?',
    options: [
      "Add a plain title attribute to the inner <svg> element only",
      "Give the button an aria-label and mark the icon aria-hidden",
      "Wrap the whole thing in a <div role=\"button\"> element",
      "Nothing needed — screen readers read the SVG path data aloud",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. A button with only an icon has no text for a screen reader to announce, so it reads as an unlabeled button. Provide an accessible name with `aria-label` (or a visually-hidden `<span>` with real text), and hide the purely decorative glyph from assistive tech with `aria-hidden="true"` on the icon. Why others fail: (A) `title` on the SVG is unreliable across screen readers and not a substitute for an accessible name. (C) a div wrapper adds nothing and loses native button semantics. (D) screen readers do not narrate SVG path data.',
  },
  {
    id: 240, type: 'multiple-choice', difficulty: 'senior', category: 'a11y',
    question: 'When a modal dialog opens, what must you manage for accessibility?',
    options: [
      "Only add a semi-transparent backdrop behind the dialog",
      "Move focus in, trap it inside, and restore it to the trigger",
      "Disable the keyboard entirely while the dialog is open",
      "Nothing special — the browser handles <div> modal focus for free",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. An accessible modal takes focus on open, confines Tab/Shift+Tab to elements inside it so keyboard and screen-reader users cannot wander into the inert background, and returns focus to the element that opened it when it closes. Semantically it needs `role="dialog"` with `aria-modal="true"` and a label (`aria-labelledby`/`aria-label`). Angular CDK\'s `a11y` module (`cdkTrapFocus` / `FocusTrap`, `FocusMonitor`) implements this. Why others fail: (A) a backdrop is visual only, not a focus boundary. (C) disabling the keyboard breaks all keyboard users. (D) a plain `<div>` gets none of this for free.',
  },
  {
    id: 241, type: 'multiple-choice', difficulty: 'mid', category: 'a11y',
    question: 'How do you announce a dynamic status like "3 results found" to screen readers?',
    options: [
      "Show a toast with a bright color so it clearly stands out",
      "Put it in an aria-live region, or use CDK LiveAnnouncer",
      "Call element.focus() on the results heading every time",
      "Nothing — screen readers re-read the whole page on DOM changes",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. Silent DOM updates are invisible to screen-reader users. An ARIA live region (`aria-live="polite"` announces when the user is idle; `"assertive"` interrupts) tells assistive tech to read out changes to that region automatically. Angular CDK\'s `LiveAnnouncer.announce(\'3 results found\')` manages a visually-hidden live region for you. Why others fail: (A) color is a purely visual cue. (C) yanking focus on every update is disorienting and hijacks the user\'s place. (D) screen readers do NOT re-read the page on arbitrary DOM changes.',
  },
  {
    id: 242, type: 'multiple-choice', difficulty: 'mid', category: 'a11y',
    question: 'How should animations respect users prone to motion sickness?',
    options: [
      "Make sure that all animations are shorter than about 500ms each",
      "Honor prefers-reduced-motion; gate non-essential motion on it",
      "Only animate on desktop screens, and never on mobile",
      "Add a manual \"turn off animations\" toggle and nothing else",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. The OS-level `prefers-reduced-motion` setting signals users who experience discomfort from motion. Respect it by wrapping non-essential animation CSS in `@media (prefers-reduced-motion: no-preference)` (so it only runs when motion is welcome), or by disabling large parallax/slide/zoom effects in Angular when the query matches. Keep essential feedback but drop gratuitous motion. Why others fail: (A) shorter is still motion. (C) motion sensitivity is not platform-specific. (D) a custom toggle ignores the standard OS preference users already set.',
  },
  {
    id: 243, type: 'spot-the-bug', difficulty: 'junior', category: 'components',
    question: 'This button is always disabled, even when isDisabled is false. Why?',
    code: `@Component({
  template: '<button disabled="{{ isDisabled }}">Go</button>',
})
export class Toolbar {
  isDisabled = false;
}`,
    options: [
      "isDisabled has to be a string rather than a boolean for this to work",
      "Attribute interpolation yields the string \"false\", which still disables it",
      "You must add [(ngModel)] to two-way bind the button's disabled state",
      "The template needs standalone: true before the interpolation will evaluate",
    ],
    answer: 1,
    topicPath: 'property-binding',
    explanation: 'B is correct. `disabled="{{ isDisabled }}"` is attribute interpolation, which always yields a STRING. The presence of a `disabled` attribute with value `"false"` still disables the button — HTML boolean attributes are truthy whenever present with any value. Property binding `[disabled]="isDisabled"` sets the DOM property to the actual boolean, so `false` correctly enables the button (Angular removes the attribute). Why others fail: (A) isDisabled is correctly a boolean; the bug is the binding form. (C) ngModel is for form values, not this. (D) standalone has nothing to do with interpolation.',
  },
  {
    id: 244, type: 'spot-the-bug', difficulty: 'junior', category: 'signals',
    question: 'The template shows something like "() => …" instead of 0. What is missing?',
    code: `@Component({ template: '<p>Count: {{ count }}</p>' })
export class Counter {
  count = signal(0);
}`,
    options: [
      "The signal() call is wrong — it should be signal({ value: 0 }) instead",
      "A signal is a getter function — you must call it in the template: count()",
      "You forgot to import CommonModule, which is required in order to display signals",
      "The signal has to be marked readonly before it is allowed to render out",
    ],
    answer: 1,
    topicPath: 'signals',
    explanation: 'B is correct. Signals are accessed by CALLING them: `count()` returns the current value and registers the template as a reader so it updates on change. `{{ count }}` interpolates the signal function object itself (Angular stringifies it), not the number. The fix is `{{ count() }}`. This "forgot the parentheses" mistake is the most common signals gotcha. Why others fail: (A) `signal(0)` is the correct creation syntax. (C) signals render without CommonModule. (D) readonly affects writability, not whether it displays.',
  },
  {
    id: 245, type: 'spot-the-bug', difficulty: 'junior', category: 'forms',
    question: 'This input throws "Can\'t bind to \'ngModel\'". What is missing?',
    code: `@Component({
  standalone: true,
  imports: [],
  template: '<input [(ngModel)]="name" />',
})
export class NameField {
  name = '';
}`,
    options: [
      "ngModel is deprecated now; you are required to use a Reactive FormControl",
      "Two-way [(ngModel)] needs FormsModule — add it to the imports array here",
      "The name field must be declared as a signal for ngModel to work at all",
      "[(ngModel)] must be split into [ngModel] with a separate (ngModelChange)",
    ],
    answer: 1,
    topicPath: 'template-forms',
    explanation: 'B is correct. `ngModel` is provided by `FormsModule`. In a standalone component you must add it to `imports: [FormsModule]`; otherwise Angular does not recognize the `ngModel` directive and reports "Can\'t bind to \'ngModel\' since it isn\'t a known property of \'input\'". Why others fail: (A) template-driven `ngModel` is fully supported, just not imported here. (C) `ngModel` works with a plain string property. (D) `[(ngModel)]` is valid banana-in-a-box sugar; splitting it does not fix the missing import.',
  },
  {
    id: 246, type: 'spot-the-bug', difficulty: 'junior', category: 'components',
    question: 'This @for block fails to compile. What is required?',
    code: `@for (item of items) {
  <li>{{ item.name }}</li>
}`,
    options: [
      "@for must instead be written as the older *ngFor with an <ng-template> wrapper",
      "The built-in @for requires a track expression — add \"; track item.id\"",
      "items has to be a signal before @for is able to iterate over it",
      "You must add an @empty block or the @for block will not compile",
    ],
    answer: 1,
    topicPath: 'control-flow-for',
    explanation: 'B is correct. Unlike the old `*ngFor`, the built-in `@for` block makes the track expression MANDATORY: `@for (item of items; track item.id) { … }`. `track` tells Angular how to identify each item so it can reuse DOM nodes efficiently across updates; omitting it is a compile-time error. Use a stable unique id when available, or `track item` / `track $index` for primitive lists. Why others fail: (A) `@for` is the modern replacement for `*ngFor`, not the other way around. (C) `@for` iterates any iterable, not only signals. (D) `@empty` is optional; the missing `track` is the error.',
  },
  {
    id: 247, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'When must you use `[prop]="expr"` instead of `prop="{{ expr }}"`?',
    options: [
      "Never — the two binding forms really are always completely interchangeable here",
      "When the target wants a non-string — interpolation always produces a string",
      "Only when binding to custom components, never to native DOM elements",
      "Only inside @if blocks",
    ],
    answer: 1,
    topicPath: 'property-binding',
    explanation: 'B is correct. `prop="{{ expr }}"` (attribute interpolation) coerces the result to a STRING, which is fine for text but wrong for booleans, numbers, and objects. Property binding `[prop]="expr"` passes the real typed value to the DOM property or `@Input()`. Classic trap: `[disabled]="isOpen"` sets the boolean, whereas `disabled="{{ isOpen }}"` always yields a non-empty string that keeps the control disabled. For plain string values either form works. Why others fail: (A) they diverge for non-string types. (C) the rule applies to native elements too (disabled, hidden, value). (D) it is unrelated to control-flow blocks.',
  },
  {
    id: 248, type: 'spot-the-bug', difficulty: 'junior', category: 'components',
    question: 'The page shows "[object Object]" where a name should be. Why?',
    code: `@Component({ template: '<p>{{ user$ }}</p>' })
export class Profile {
  private http = inject(HttpClient);
  user$ = this.http.get<{ name: string }>('/api/me');
}`,
    options: [
      "http.get actually returns a Promise, so you have to await it inside of the template",
      "user$ is an Observable — interpolating it prints the object; use the async pipe",
      "The URL is wrong; /api/me returns nothing for the template to show",
      "You must call user$.value to read the Observable's current value",
    ],
    answer: 1,
    topicPath: 'rxjs-observables',
    explanation: 'B is correct. `http.get(...)` returns an Observable, and interpolating the Observable object itself just stringifies it (`[object Object]`). Use the `async` pipe to subscribe, unwrap the emitted value, and auto-unsubscribe on destroy: `{{ (user$ | async)?.name }}` — or assign it with `@let user = user$ | async`. Why others fail: (A) HttpClient returns an Observable, not a Promise, and templates cannot await. (C) the request is fine; the display is the bug. (D) plain Observables have no synchronous `.value` (that is a BehaviorSubject).',
  },

  // ─── BATCH 249-272: STATE/ARCHITECTURE, RXJS & SIGNAL OUTPUTS, I18N, ANIMATION ─
  {
    id: 249, type: 'multiple-choice', difficulty: 'senior', category: 'state',
    question: 'What does `@ngrx/signals` `signalStore()` give you?',
    options: [
      "A wrapper that converts NgRx actions and reducers into signals for you",
      "A signal store composed from features like withState and withMethods",
      "A helper for saving signals into localStorage automatically",
      "A full replacement for Angular's dependency injection system",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. `signalStore()` builds a store by composing feature functions: `withState({...})` declares reactive state as signals, `withComputed(store => ({...}))` adds memoized derived signals, `withMethods(store => ({...}))` defines updaters and rxMethod-based effects, and `withHooks` runs onInit/onDestroy logic. The result is provided via DI (`providedIn` or a route/component provider) and gives fine-grained signal reactivity without the actions → reducers → effects → selectors ceremony of the classic Store. Why others fail: (A) it is a standalone store, not an action/reducer adapter. (C) persistence is a separate concern. (D) it uses DI, it does not replace it.',
  },
  {
    id: 250, type: 'multiple-choice', difficulty: 'mid', category: 'state',
    question: 'In classic NgRx Store, what is each building block responsible for?',
    options: [
      "Actions mutate state; reducers dispatch; selectors run HTTP",
      "Actions are events; reducers are pure (state, action) => state",
      "They are interchangeable layers usable in any order you like",
      "Reducers perform the HTTP calls and selectors mutate the store",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. NgRx enforces unidirectional data flow: an **action** is a plain event object (`{ type, payload }`); a **reducer** is a pure `(state, action) => newState` function with no side effects; a **selector** derives and memoizes a view of state for components; an **effect** listens to actions, performs impure work (HTTP, router, storage), and emits follow-up actions. Why others fail: (A) it scrambles every responsibility. (C) the layers have strict, distinct roles. (D) reducers must be pure and selectors are read-only.',
  },
  {
    id: 251, type: 'multiple-choice', difficulty: 'mid', category: 'state',
    question: 'What defines a "presentational" (dumb) component?',
    options: [
      "It injects the store directly and then manages the global state",
      "It takes inputs, emits outputs, holds no services or app state",
      "It has no template at all, containing only its logic",
      "It must use OnPush change detection and nothing else matters",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. The container/presentational split keeps most components pure: presentational components take everything through `input()`/`@Input()`, report user intent through `output()`/`@Output()`, and avoid injecting services or touching global state — making them trivial to reuse and test with plain inputs. Smart/container components sit above them, inject stores/services, orchestrate state, and pass data down. Why others fail: (A) that describes a smart/container component. (C) presentational components absolutely have templates — that is their job. (D) OnPush is a common pairing but not the defining trait.',
  },
  {
    id: 252, type: 'spot-the-bug', difficulty: 'senior', category: 'state',
    question: 'This NgRx reducer breaks memoized selectors and devtools. Why?',
    code: `on(addItem, (state, { item }) => {
  state.items.push(item);   // ← mutates existing state
  return state;
})`,
    options: [
      "Reducers are simply not allowed to receive an action payload at all",
      "Reducers must be pure and return a NEW state object, not mutate",
      "push() is simply not a valid array method inside reducers",
      "You must set state.items = [...] rather than returning it",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. NgRx relies on immutability: selectors are memoized by reference and OnPush change detection compares references, so a reducer must produce a brand-new state object rather than mutate the old one. `state.items.push(item)` mutates the existing array (same reference) and returns the same `state`, so downstream consumers see "no change" and the UI/selectors go stale — plus devtools time-travel is corrupted. Fix immutably: `return { ...state, items: [...state.items, item] }`. Why others fail: (A) the destructured payload is fine. (C) push is valid JS, just wrong here. (D) reassigning a field still mutates the shared object.',
  },
  {
    id: 253, type: 'multiple-choice', difficulty: 'senior', category: 'state',
    question: 'Why derive state with `createSelector` instead of computing it in the component?',
    options: [
      "createSelector runs the derivation on a separate Web Worker",
      "It MEMOIZES: recomputes only when input references change",
      "It is required syntax — selectors cannot be plain functions",
      "It automatically persists the derived value into storage",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. `createSelector(inputA, inputB, (a, b) => derive(a, b))` caches its last inputs and output. If the input selectors return the same references, it skips the projector and hands back the memoized value — so expensive derivations (filtering, sorting, joining slices) run only when their inputs actually change, and components bound to the selector do not re-render needlessly. Why others fail: (A) it runs on the main thread. (C) selectors CAN be plain functions; createSelector adds memoization. (D) it does not persist anything.',
  },
  {
    id: 254, type: 'multiple-choice', difficulty: 'senior', category: 'state',
    question: 'Why do side effects (HTTP calls) go in NgRx Effects rather than reducers?',
    options: [
      "Effects simply run faster than reducers do at runtime",
      "Reducers must stay pure; effects isolate impure async work",
      "Reducers cannot access any services, but effects mutate state",
      "Effects fully replace reducers in a modern NgRx setup",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. A reducer is a pure function of `(state, action)`; putting an HTTP call in it would make it non-deterministic and un-testable and would break time-travel. Effects are the sanctioned home for impurity: an effect is an Observable that filters for a trigger action (`ofType`), does the async work, and dispatches result actions (`loadSuccess`/`loadFailure`) which reducers then handle purely. Why others fail: (A) performance is not the reason. (C) effects do NOT mutate state — they dispatch actions; only reducers change state. (D) effects and reducers are complementary, not substitutes.',
  },
  {
    id: 255, type: 'multiple-choice', difficulty: 'senior', category: 'state',
    question: 'When would you choose a signal-based store over the full NgRx Store?',
    options: [
      "Always — the full NgRx Store has now been officially deprecated",
      "For local/feature state; full Store suits time-travel, scale",
      "Never — signals simply cannot hold any shared application state",
      "Only when the application makes no HTTP calls whatsoever",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. Choose by complexity, not fashion. Signal stores (a service with private writable signals + public readonly/computed + methods, or `@ngrx/signals`) cover most local and feature-level state with minimal ceremony and excellent ergonomics. The full NgRx Store earns its overhead when you need an auditable event log, time-travel debugging, elaborate coordinated effects, or a consistent structure imposed across a big team. Why others fail: (A) NgRx Store is not deprecated. (C) a root-provided signal service holds shared state fine. (D) HTTP presence is orthogonal — you can do HTTP with either.',
  },
  {
    id: 256, type: 'spot-the-bug', difficulty: 'mid', category: 'state',
    question: 'This store keeps drifting out of sync. What is the design flaw?',
    code: `@Injectable({ providedIn: 'root' })
export class CounterStore {
  readonly count = signal(0);
  readonly doubled = signal(0);          // ← stored derived state

  increment() {
    this.count.update(c => c + 1);
    this.doubled.set(this.count() * 2);  // must remember to update both
  }
}`,
    options: [
      "signal(0) should be written signal<number>(0) with an explicit type",
      "doubled is derived state stored separately — make it a computed",
      "The store must extend a shared BaseStore class in order to work",
      "increment() should return the new count value it computed",
    ],
    answer: 1,
    topicPath: 'signals-advanced',
    explanation: 'B is correct. `doubled` is fully determined by `count`, yet it is stored separately and hand-synchronized inside `increment()`. Any other method (or a future one) that changes `count` without also setting `doubled` silently desyncs the two. The rule is: never store what you can derive. Replace it with `readonly doubled = computed(() => this.count() * 2)` — now it is always correct, lazily recomputed, and memoized. Why others fail: (A) the explicit generic is optional and unrelated. (C) no base class is needed. (D) returning a value does not solve the duplication.',
  },
  {
    id: 257, type: 'predict-output', difficulty: 'mid', category: 'rxjs',
    question: 'What is logged?',
    code: `const a$ = new BehaviorSubject('a1');
const b$ = new BehaviorSubject('b1');
combineLatest([a$, b$]).subscribe(([a, b]) => console.log(a + b));
a$.next('a2');
b$.next('b2');`,
    options: [
      "a2b2 — only the final combination is ever logged",
      "a1b1, a2b1, a2b2 — emits initially, then on each change",
      "a1b1, a2b2 — only when both change together simultaneously",
      "a1b1 — combineLatest emits just once and then completes",
    ],
    answer: 1,
    topicPath: 'rxjs-operators',
    explanation: 'B is correct. `combineLatest` emits once BOTH sources have produced a value, then re-emits whenever ANY source emits, always pairing the latest values. BehaviorSubjects start with values, so the initial emission is `a1b1`. `a$.next(\'a2\')` → `a2b1`. `b$.next(\'b2\')` → `a2b2`. Total: three emissions. Why others fail: (A) it emits on every change, not only the last. (C) it does not wait for simultaneous changes. (D) it stays subscribed and keeps emitting; it does not complete after one.',
  },
  {
    id: 258, type: 'predict-output', difficulty: 'senior', category: 'rxjs',
    question: 'In what order are values logged?',
    code: `from([1, 2, 3]).pipe(
  concatMap(n => of(n).pipe(delay(n === 1 ? 30 : 0)))
).subscribe(console.log);`,
    options: [
      "2, 3, 1 — the one delayed value ends up arriving last of all",
      "1, 2, 3 — concatMap runs each inner fully before the next",
      "3, 2, 1 — the values come out in reverse order",
      "1, 2, 3 emitted all at once with no delay honored",
    ],
    answer: 1,
    topicPath: 'rxjs-advanced',
    explanation: 'B is correct. `concatMap` processes inner observables one at a time IN ORDER: it fully subscribes to the inner observable for 1 (waiting the 30ms delay) before it even starts the inner observable for 2, then 3. So the output is strictly `1, 2, 3` regardless of per-item delays. Contrast `mergeMap`, which subscribes to all inners concurrently — there 2 and 3 (0ms) would emit before 1 (30ms), giving `2, 3, 1`. Why others fail: (A/C) that is mergeMap-style concurrency, not concatMap. (D) the 30ms delay is honored; concatMap waits for it.',
  },
  {
    id: 259, type: 'predict-output', difficulty: 'mid', category: 'rxjs',
    question: 'What values are logged?',
    code: `of(1, 1, 2, 2, 3, 1).pipe(
  distinctUntilChanged()
).subscribe(console.log);`,
    options: [
      "1, 2, 3 — every duplicate value is removed globally here",
      "1, 2, 3, 1 — only CONSECUTIVE duplicates are suppressed",
      "1, 1, 2, 2, 3, 1 — nothing at all is filtered out",
      "1 — the stream stops at the very first repeat",
    ],
    answer: 1,
    topicPath: 'rxjs-operators',
    explanation: 'B is correct. `distinctUntilChanged` compares each value to the PREVIOUS emitted one and drops it only if they are equal. So the runs `1,1` → `1`, `2,2` → `2`, then `3`, then a `1` again — which is NOT equal to the immediately preceding `3`, so it passes. Result: `1, 2, 3, 1`. To remove ALL duplicates ever seen (globally), you would need `distinct()` instead. Why others fail: (A) that is `distinct()`, not distinctUntilChanged. (C) consecutive dupes ARE removed. (D) it filters, it does not stop the stream.',
  },
  {
    id: 260, type: 'predict-output', difficulty: 'mid', category: 'rxjs',
    question: 'What is logged?',
    code: `of(2, 4, 6, 7, 8).pipe(
  takeWhile(n => n % 2 === 0)
).subscribe(console.log);`,
    options: [
      "2, 4, 6, 8 — all even numbers, just skipping the odd 7",
      "2, 4, 6 — takeWhile completes at the first failing value (7)",
      "2, 4, 6, 7 — the failing value is emitted just before it stops",
      "2 — the stream stops right after the very first value",
    ],
    answer: 1,
    topicPath: 'rxjs-operators',
    explanation: 'B is correct. `takeWhile(pred)` emits values while the predicate holds and COMPLETES as soon as one fails — it does not skip and continue like `filter`. At `7` the predicate is false, so the stream completes right there and `7` (and everything after) is not emitted: output `2, 4, 6`. Pass `takeWhile(pred, true)` (inclusive) if you want the failing value emitted before completing. Why others fail: (A) that is `filter` behavior. (C) the default is exclusive, so 7 is not emitted. (D) it takes all leading passing values, not just the first.',
  },
  {
    id: 261, type: 'predict-output', difficulty: 'senior', category: 'rxjs',
    question: 'What does this log?',
    code: `const clicks$ = new Subject<void>();
const count$ = new BehaviorSubject(0);
clicks$.pipe(withLatestFrom(count$)).subscribe(([_, c]) => console.log(c));

count$.next(5);
clicks$.next();   // a click
count$.next(9);`,
    options: [
      "0, 5, 9 — every single count change is logged as it happens",
      "5 — emits only on clicks$, pairing count's latest (5)",
      "5, 9 — both of the counts after the click occurs",
      "nothing — clicks$ never carries a value to log",
    ],
    answer: 1,
    topicPath: 'rxjs-advanced',
    explanation: 'B is correct. `withLatestFrom` is driven by the SOURCE observable: it emits only when `clicks$` emits, attaching the most recent value of `count$` at that instant. When the click happens, `count$` is `5`, so it logs `5`. The earlier `count$.next(5)` did not emit (no click yet), and the later `count$.next(9)` does not emit either (withLatestFrom ignores changes in the "other" stream). Why others fail: (A/C) count changes alone never trigger the output. (D) clicks$ does emit (a void click); the count is what gets logged.',
  },
  {
    id: 262, type: 'predict-output', difficulty: 'senior', category: 'signals',
    question: 'What does choice() return at the end?',
    code: `const options = signal(['a', 'b', 'c']);
const choice = linkedSignal(() => options()[0]);

choice.set('b');          // user overrides
options.set(['x', 'y']);  // source changes
console.log(choice());`,
    options: [
      "'b' — the manual override that the user set sticks around permanently",
      "'x' — linkedSignal resets to its derived value when the source changes",
      "'a' — it always returns the original first option no matter what happens",
      "'y' — it takes the last element of the array rather than the first one",
    ],
    answer: 1,
    topicPath: 'signals-advanced',
    explanation: "B is correct. `linkedSignal` is writable but also reactive: `choice.set('b')` overrides it to `'b'`, but the moment its source computation\'s dependencies change (`options.set([...])`), it RESETS to the freshly derived value `options()[0]`, which is now `'x'`. That is exactly the behavior `computed` cannot give you (computed is read-only) and a plain writable signal cannot give you (it would keep `'b'`). Why others fail: (A) the override is transient — it survives only until the source changes. (C) it re-derives from the current options, not the original. (D) the derivation takes index 0, not the last.",
  },
  {
    id: 263, type: 'predict-output', difficulty: 'mid', category: 'signals',
    question: 'What do the two logs print?',
    code: `let runs = 0;
const a = signal(1);
const c = computed(() => { runs++; return a() * 2; });

a.set(2);
a.set(3);
console.log(runs);        // (1)
console.log(c(), runs);   // (2)`,
    options: [
      "(1) 2 then (2) 6 2 — the computed recomputes once on each set() call",
      "(1) 0 then (2) 6 1 — computed is lazy and memoized; sets collapse into one",
      "(1) 0 then (2) 6 3 — it runs once for every set() plus once more for the read",
      "(1) 1 then (2) 6 1 — it runs eagerly a single time at creation of it",
    ],
    answer: 1,
    topicPath: 'signals',
    explanation: 'B is correct. A `computed` does not execute until it is READ. So after two `a.set(...)` calls with no read in between, `runs` is still `0` (log 1). The first `c()` triggers a single computation using the latest value `a() = 3` → returns `6` and increments `runs` to `1` (log 2 prints `6 1`). This is laziness + memoization: intermediate values are never computed, and the result is cached until a dependency changes. Why others fail: (A) it does not recompute per set. (C) it computed once, not per set. (D) computed is lazy, not eager at creation.',
  },
  {
    id: 264, type: 'predict-output', difficulty: 'senior', category: 'signals',
    question: 'How many times does this effect log, and with what value?',
    code: `const a = signal(0);
effect(() => console.log('run', a()));
a.set(1);
a.set(2);
// ...synchronous code finishes, then the scheduler flushes`,
    options: [
      "Three times: it logs run 0, then run 1, and finally run 2 in order",
      "Once: run 2 — effects run async and coalesce the synchronous writes",
      "Twice: it logs run 0 first, and then it logs run 2 afterwards here",
      "Never: effects need a change-detection pass to run and none happens",
    ],
    answer: 1,
    topicPath: 'signals-advanced',
    explanation: 'B is correct. An `effect` does not run synchronously at creation — its first execution is SCHEDULED. Because `a.set(1)` and `a.set(2)` both happen synchronously before the scheduler flushes, the writes coalesce and the effect runs a single time, reading the latest value `a() = 2`, logging `run 2`. This "glitch-free, coalesced" model means you never see intermediate values `0` or `1`. Why others fail: (A) writes are batched, not one-run-per-write. (C) there is no separate initial `run 0` because the flush happens after both sets. (D) effects are driven by their own scheduler, not manual change detection.',
  },
  {
    id: 265, type: 'multiple-choice', difficulty: 'mid', category: 'i18n',
    question: 'How do you mark static template text for translation in Angular\'s built-in i18n?',
    options: [
      "Wrap the text inside a translate() pipe on every single element",
      "Add the i18n attribute; the CLI then extracts the marked text",
      "Rename the template file to use the *.i18n.html suffix",
      "Set a translate=\"yes\" attribute on the page's <body> tag",
    ],
    answer: 1,
    topicPath: 'i18n',
    explanation: 'B is correct. Angular\'s built-in i18n marks translatable content with the `i18n` attribute on the element (and `i18n-title`/`i18n-alt` for attributes). The optional value encodes `meaning|description@@customId` to give translators context and a stable id. Running `ng extract-i18n` pulls all marked messages into an XLIFF/XMB/JSON file for translation; for strings in TypeScript you use the `$localize\`...\`` tagged template. Why others fail: (A) built-in i18n is compile-time and attribute-driven, not a runtime pipe. (C) file naming does nothing. (D) the native `translate` attribute is unrelated to Angular i18n.',
  },
  {
    id: 266, type: 'multiple-choice', difficulty: 'senior', category: 'i18n',
    question: 'How do you correctly render "1 item" vs "5 items" across languages?',
    options: [
      "Concatenate: count + (count === 1 ? \" item\" : \" items\")",
      "Use an ICU plural expression so each locale sets its own forms",
      "Store both strings and pick the right one in the component",
      "Always just use the plural form — users will understand it anyway",
    ],
    answer: 1,
    topicPath: 'i18n',
    explanation: 'B is correct. Pluralization rules differ wildly between languages (some have separate forms for 0, 1, 2, few, many). Angular supports ICU MessageFormat inside i18n text: `{ count, plural, =0 {...} =1 {...} other {...} }`, and a sibling `{ gender, select, male {...} female {...} other {...} }` for enumerations. Translators can then supply the plural categories their language needs. Why others fail: (A) hand-rolled `=== 1` logic only works for English-like languages and breaks for others. (C) manual string selection reimplements ICU badly and is not translator-friendly. (D) using one form is grammatically wrong in most locales.',
  },
  {
    id: 267, type: 'multiple-choice', difficulty: 'senior', category: 'i18n',
    question: 'How does Angular\'s default (compile-time) i18n produce localized apps?',
    options: [
      "It translates strings at runtime by fetching per-locale JSON",
      "It builds a separate fully-translated bundle for each locale",
      "It ships every language in one bundle, toggled with a signal",
      "It requires a dedicated backend translation microservice",
    ],
    answer: 1,
    topicPath: 'i18n',
    explanation: 'B is correct. Angular\'s built-in i18n is compile-time: the CLI produces one optimized, pre-translated build per configured locale (via `i18n` config + `localize`), so `de`, `fr`, etc. are separate artifacts you deploy under different URLs. The upside is zero runtime translation overhead and full tree-shaking; the trade-off is N builds and no in-app language switching without reload. Runtime libraries like `ngx-translate`/Transloco take the opposite approach — one bundle, JSON loaded and swapped at runtime. Why others fail: (A/C) that describes runtime i18n libraries, not the built-in default. (D) no translation server is involved.',
  },
  {
    id: 268, type: 'multiple-choice', difficulty: 'mid', category: 'i18n',
    question: 'You translated all text, but DatePipe/CurrencyPipe still format as en-US. Why?',
    options: [
      "Those formatting pipes simply cannot be localized at all",
      "Register the locale data and provide LOCALE_ID, or it falls back",
      "You must pass the locale string into every pipe call manually",
      "DatePipe reads the browser's own language automatically, so do nothing",
    ],
    answer: 1,
    topicPath: 'i18n',
    explanation: 'B is correct. Text translation and DATA formatting are separate. Pipes like `DatePipe`, `CurrencyPipe`, `DecimalPipe`, and `PercentPipe` format according to `LOCALE_ID`, and each non-`en-US` locale needs its CLDR data registered: `registerLocaleData(localeFr, \'fr\')` plus providing `{ provide: LOCALE_ID, useValue: \'fr\' }` (a localized production build wires this for you). Miss either and the pipes silently fall back to en-US. Why others fail: (A) they are specifically locale-aware. (C) you can pass a locale per call, but the point is the app-wide default via LOCALE_ID + data. (D) DatePipe does not auto-read navigator.language.',
  },
  {
    id: 269, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What are the pieces of an Angular animation defined in `animations: [...]`?',
    options: [
      "Just one single CSS class that some directive toggles on and off on the element there",
      "trigger() names it; state() defines end styles; transition() animates between them",
      "A single animate() call placed on the component's own selector",
      "keyframes that are defined only inside the global stylesheet file",
    ],
    answer: 1,
    topicPath: 'animations',
    explanation: 'B is correct. Angular\'s animation DSL composes: `trigger(\'name\', [...])` names an animation and is attached in the template via `[@name]="expr"`; `state(\'open\', style({...}))` declares the styles for a named state; and `transition(\'open <=> closed\', animate(\'200ms ease\'))` describes the timed change between states (optionally with `keyframes`, `group`, `query`, `stagger`). Requires `provideAnimationsAsync()` (or the animations provider). Why others fail: (A) it is a full state machine, not a class toggle. (C) a lone `animate()` has no trigger/state binding. (D) keyframes live inside the trigger DSL, not (only) global CSS.',
  },
  {
    id: 270, type: 'multiple-choice', difficulty: 'senior', category: 'components',
    question: 'What do the `:enter` and `:leave` animation aliases target?',
    options: [
      "They target the mouseenter and mouseleave hover events fired on the element itself here",
      ":enter is void => * (element entering) and :leave is * => void (element leaving)",
      "Route entry and exit transitions only",
      "The focus and blur states of a form control",
    ],
    answer: 1,
    topicPath: 'animations',
    explanation: 'B is correct. When an element is added to or removed from the DOM (via `@if`, `@for`, `*ngIf`, etc.), Angular represents those with the special `void` state. `:enter` is shorthand for `transition(\':enter\', ...)` = `void => *` (appearing), and `:leave` = `* => void` (disappearing). Angular keeps a leaving element in the DOM until its `:leave` animation finishes. Wrapping a list in a trigger and using `query(\':enter\', stagger(50, animate(...)))` animates children in sequence. Why others fail: (A) those are `mouseenter`/`mouseleave` DOM events, unrelated. (C) enter/leave apply to any element insertion/removal, not just routes. (D) focus/blur are different events.',
  },
  {
    id: 271, type: 'multiple-choice', difficulty: 'senior', category: 'routing',
    question: 'What does `provideRouter(routes, withViewTransitions())` do?',
    options: [
      "It preloads every one of the lazy routes on application startup",
      "It wraps navigations in the View Transitions API for animation",
      "It enables server-side rendering for all of the routes",
      "It adds a loading spinner shown between every single route change",
    ],
    answer: 1,
    topicPath: 'view-transitions',
    explanation: 'B is correct. `withViewTransitions()` hooks the router into the native View Transitions API: on navigation Angular calls `document.startViewTransition()` so the browser snapshots the old and new DOM and cross-fades (or morphs shared elements via `view-transition-name`) between them. It is a progressive enhancement — where the API is unsupported the navigation just happens instantly — and you customize the animation with `::view-transition-old/new` CSS pseudo-elements. Why others fail: (A) preloading is a separate feature (`withPreloading`). (C) SSR is `provideServerRendering`, unrelated. (D) it animates the transition, it is not a spinner.',
  },
  {
    id: 272, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'Which CSS properties animate most smoothly, and why?',
    options: [
      "width and height, simply because they are the most basic numeric values",
      "transform and opacity — the GPU compositor animates them without reflow",
      "margin and padding, mainly because they manage to avoid any repaints here",
      "It genuinely makes no difference at all which properties you animate here",
    ],
    answer: 1,
    topicPath: 'performance',
    explanation: 'B is correct. Browsers run a pipeline of layout → paint → composite. `transform` and `opacity` can be handled purely in the COMPOSITE step on the GPU, so they animate at 60fps without recalculating geometry. Animating layout-affecting properties (`width`, `height`, `top`, `left`, `margin`) forces the browser to re-run layout and paint on every frame, which drops frames on complex pages. Prefer `transform: translate()/scale()` over positional/size changes, and hint with `will-change` sparingly. Why others fail: (A) width/height trigger layout — the opposite of smooth. (C) margin/padding also trigger layout. (D) property choice is one of the biggest factors in animation smoothness.',
  },
  {
    id: 273, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What is the difference between an attribute directive and a structural directive?',
    options: [
      "Attribute directives add or remove elements, whereas structural directives only change styles",
      "A structural directive (*) reshapes DOM layout; an attribute one restyles its host",
      "They are identical — the leading asterisk is entirely optional syntax",
      "Attribute directives can only ever be applied to <input> elements",
    ],
    answer: 1,
    topicPath: 'structural-directives',
    explanation: 'B is correct. A STRUCTURAL directive changes DOM structure — it is desugared from the `*` shorthand (`*ngIf="x"`) into an `<ng-template>` and works by injecting `TemplateRef` and `ViewContainerRef` and calling `createEmbeddedView`/`clear`. An ATTRIBUTE directive has no `*`, sits on an existing element like a normal attribute (`[ngClass]`, `[ngStyle]`, or your own `appHighlight`), and alters that element via `ElementRef`/`Renderer2` or host bindings. Why others fail: (A) reverses the two definitions. (C) the `*` is meaningful sugar, not optional. (D) attribute directives apply to any element.',
  },
  {
    id: 274, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What do `@HostBinding` and `@HostListener` do inside a directive?',
    options: [
      "@HostListener subscribes to a service and @HostBinding injects a DI token",
      "@HostBinding keeps a class/style on the host in sync; @HostListener wires host events",
      "Both of these decorators are usable only inside of @Component, and never within @Directive",
      "They both require a ViewChild query in order to reach the host element",
    ],
    answer: 1,
    topicPath: 'attribute-directives',
    explanation: 'B is correct. `@HostBinding(\'class.active\') isActive = true` mirrors a field onto a DOM class/attr/style/property of the HOST, and `@HostListener(\'mouseenter\') onEnter() {}` binds a host (or window/document) event to a method. A classic highlight directive combines them: listen for `mouseenter`/`mouseleave` and toggle a `@HostBinding(\'style.background\')`. The modern equivalent is the `host: {}` metadata object. Why others fail: (A) neither performs DI. (C) both work in `@Directive` — that is their primary home. (D) the host is implicit, so no `ViewChild` is needed.',
  },
  {
    id: 275, type: 'spot-the-bug', difficulty: 'senior', category: 'components',
    question: 'This custom structural directive delays showing content. What bug appears if `appDelay` is re-set (bound to a changing value)?',
    code: `@Directive({ selector: '[appDelay]' })
export class DelayDirective {
  constructor(private tpl: TemplateRef<any>,
              private vcr: ViewContainerRef) {}

  @Input() set appDelay(ms: number) {
    setTimeout(() => this.vcr.createEmbeddedView(this.tpl), ms);
  }
}
// used as: <div *appDelay="delay">Hi</div>`,
    options: [
      "Nothing — Angular automatically deduplicates the embedded views for you",
      "Each change creates another view without clearing — the content duplicates",
      "TemplateRef simply cannot be injected into a structural directive",
      "The setTimeout is a memory leak that crashes the entire application almost immediately",
    ],
    answer: 1,
    topicPath: 'structural-directives',
    explanation: 'B is correct. `ViewContainerRef` is additive — every `createEmbeddedView` appends another instance of the template. Because the setter never clears the container (or cancels the previous `setTimeout`), each change to `appDelay` stacks a fresh copy of the content. A correct version clears first: `this.vcr.clear(); this.timer = setTimeout(() => this.vcr.createEmbeddedView(this.tpl), ms);` and clears `this.timer` in `ngOnDestroy`. Why others fail: (A) there is no automatic dedup. (C) injecting `TemplateRef`/`ViewContainerRef` is exactly how structural directives work. (D) the timeout is not an instant crash — the defect is duplicated views.',
  },
  {
    id: 276, type: 'multiple-choice', difficulty: 'mid', category: 'components',
    question: 'What does `<div *ngIf="user as u">{{ u.name }}</div>` desugar to?',
    options: [
      "A hidden <div> with display:none applied whenever the user value is falsy",
      "An <ng-template> instantiated only when truthy, binding the value to u",
      "A ternary expression that is evaluated a single time at compile time",
      "Two separate components that Angular's compiler merges together into one",
    ],
    answer: 1,
    topicPath: 'structural-directives',
    explanation: 'B is correct. The `*` prefix is shorthand: Angular lifts the host element into an `<ng-template>` and moves the directive onto it. `*ngIf="user as u"` becomes roughly `<ng-template [ngIf]="user" let-u="ngIf"><div>{{ u.name }}</div></ng-template>`. The `as` clause captures the directive exported context value into a template input variable — which is why the element is NOT rendered (and `u` does not exist) when the condition is falsy. Why others fail: (A) `ngIf` adds/removes from the DOM rather than hiding with CSS (that is `[hidden]`). (C) it is a runtime template, not a compile-time ternary. (D) no component merging occurs.',
  },
  {
    id: 277, type: 'multiple-choice', difficulty: 'junior', category: 'components',
    question: 'Why does `<li *ngIf="show" *ngFor="let x of items">` throw a compile error?',
    options: [
      "ngFor must be written before ngIf so that the two directives stay in alphabetical order",
      "An element hosts only ONE structural directive — wrap one in <ng-container>",
      "ngIf and ngFor were both deprecated and then removed from Angular",
      "You must import each of the two directives separately for it to work",
    ],
    answer: 1,
    topicPath: 'structural-directives',
    explanation: 'B is correct. Each `*` structural directive claims the element by lifting it into its own `<ng-template>`; two on the same element would need competing templates, so the compiler forbids it. The classic pre-v17 fix is `<ng-container *ngIf="show"><li *ngFor="let x of items">…</li></ng-container>` (a grouping element that renders no extra DOM). Modern control flow sidesteps it entirely because `@if`/`@for` are block syntax that nests: `@if (show) { @for (x of items; track x.id) { <li>…</li> } }`. Why others fail: (A) ordering is not the issue. (C) both still exist, though `@if`/`@for` are now preferred. (D) importing does not lift the one-structural-directive rule.',
  },
  {
    id: 278, type: 'multiple-choice', difficulty: 'mid', category: 'state',
    question: 'What is the difference between `@Injectable({ providedIn: \'root\' })` and listing a service in a component\'s `providers: [Svc]`?',
    options: [
      "They are completely identical in every respect, scope included",
      "root is one app-wide singleton; component providers make a new one",
      "providedIn: 'root' instead creates a fresh instance for each component",
      "Component providers are global, whereas root scope is local",
    ],
    answer: 1,
    topicPath: 'di-providers',
    explanation: 'B is correct. `providedIn: \'root\'` puts the provider in the root injector, so the whole app shares a single lazily-created instance, and if nothing injects it the class is tree-shaken away. Declaring `providers: [Svc]` on a component creates a new instance in that component element injector — a distinct copy handed to the component and every descendant, overriding the root instance for that subtree (useful for per-feature or per-dialog state). Why others fail: (A) their scoping differs fundamentally. (C) root is a singleton, not per-component. (D) reversed — root is app-wide, component providers are local.',
  },
  {
    id: 279, type: 'multiple-choice', difficulty: 'senior', category: 'state',
    question: 'Why use `new InjectionToken<Config>(\'app.config\')` instead of a string or interface as a DI key?',
    options: [
      "Plain strings are simply much faster to inject than these tokens",
      "Interfaces are erased at compile time; a token is a runtime key",
      "An InjectionToken can only ever hold primitive values",
      "It automatically makes the provided value an observable",
    ],
    answer: 1,
    topicPath: 'di-providers',
    explanation: 'B is correct. Angular DI keys must exist at runtime. Classes qualify because they are runtime values, but a TypeScript `interface`/`type` is erased during compilation and cannot be a key. `new InjectionToken<Config>(\'desc\')` creates a unique, collision-proof token that also carries `<Config>` so `inject(APP_CONFIG)` is typed. Tokens also support `{ multi: true }` to gather many providers into an array (as `HTTP_INTERCEPTORS` does). Why others fail: (A) performance is not the reason. (C) tokens hold any value, including objects and functions. (D) a token adds no observability.',
  },
  {
    id: 280, type: 'multiple-choice', difficulty: 'senior', category: 'state',
    question: 'What do the `@Self()` and `@SkipSelf()` dependency-injection modifiers control?',
    options: [
      "They control whether the resolved service is a singleton",
      "@Self() searches only its own injector; @SkipSelf() the parent",
      "They decide which change detection strategy the given class uses",
      "@Self means a private service and @SkipSelf a public one",
    ],
    answer: 1,
    topicPath: 'di-advanced',
    explanation: 'B is correct. Angular resolves a dependency by walking up the injector tree, and the resolution modifiers change where that walk starts and stops: `@Self()` looks ONLY in the current (element) injector and throws if the token is absent there; `@SkipSelf()` ignores the current injector and begins at its parent; `@Optional()` returns `null` instead of throwing; `@Host()` stops the search at the host component boundary. They compose — `@Optional() @SkipSelf()` is the classic guard against a directive resolving a token from itself. Why others fail: (A) singleton-ness depends on where you provide, not these flags. (C) unrelated to change detection. (D) they are not access modifiers.',
  },
  {
    id: 281, type: 'multiple-choice', difficulty: 'mid', category: 'state',
    question: 'What advantage does the `inject()` function have over constructor parameter injection?',
    options: [
      "It is the only injection style allowed in Angular 17 and later",
      "It works in field initializers, guards, and helper functions",
      "inject() bypasses the injector entirely for better performance",
      "inject() automatically makes every dependency it reads optional",
    ],
    answer: 1,
    topicPath: 'services-di',
    explanation: 'B is correct. `inject(Foo)` reads from the current injection context instead of a constructor signature, so it works in property initializers (`private http = inject(HttpClient)`), in functional guards/resolvers/interceptors, and in shared functions — and it removes the `super(...)` ceremony when extending a base class. The catch: it must be called in an injection context (constructor, field initializer, or `runInInjectionContext`), otherwise it throws `NG0203`. Why others fail: (A) constructor injection still works. (C) it uses the same injector, no bypass. (D) you still pass `{ optional: true }` for optional dependencies.',
  },
  {
    id: 282, type: 'multiple-choice', difficulty: 'senior', category: 'state',
    question: 'How does `{ provide: Logger, useExisting: BetterLogger }` differ from `useClass: BetterLogger`?',
    options: [
      "They are exact aliases with no meaningful difference whatsoever",
      "useExisting aliases to the SAME instance; useClass makes a new one",
      "useExisting instead creates a brand-new instance on every injection",
      "useExisting works only with an InjectionToken, never a class",
    ],
    answer: 1,
    topicPath: 'di-providers',
    explanation: 'B is correct. `useExisting` constructs nothing — it points one token at another provider so both resolve to the identical instance. `{ provide: Logger, useClass: BetterLogger }` instead instantiates a distinct `BetterLogger` for the `Logger` token, so you would have two objects if `BetterLogger` is also provided directly. The provider recipes are: `useClass` (instantiate a class), `useValue` (a ready object/constant), `useExisting` (alias to another token), and `useFactory` (call a function, optionally with `deps`). Why others fail: (A) they differ in instance sharing. (C) it reuses, never news up. (D) it can alias any token type.',
  },
  {
    id: 283, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'What does Angular\'s full hydration via `provideClientHydration()` do?',
    options: [
      "It re-renders the whole page on the client, discarding the server's HTML",
      "It reuses the server-rendered DOM instead of destroying and recreating it",
      "It disables JavaScript entirely on the client side once it has loaded here",
      "It only works at all when you are using one special kind of pages router",
    ],
    answer: 1,
    topicPath: 'ssr',
    explanation: 'B is correct. Without hydration a server-rendered app throws away the server DOM on bootstrap and rebuilds it, causing a visible flash. `provideClientHydration()` enables non-destructive hydration: Angular matches the server markup to the component tree, reuses the existing nodes, and wires up event listeners and bindings in place — improving Core Web Vitals (no re-paint, lower CLS) and killing the flicker. Why others fail: (A) that is precisely the non-hydrated behavior it fixes. (C) it enables interactivity, not disables it. (D) Angular has no such router mode — that is a Next.js notion.',
  },
  {
    id: 284, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'In Angular 19+, what does `@defer (hydrate on interaction)` enable?',
    options: [
      "It lazy-loads the component, but only ever on the server side of things",
      "Incremental hydration: server-rendered HTML, JS hydrated on the trigger",
      "It fully disables SSR for that one particular deferred block of content",
      "It duplicates the whole block on both the server and the client at once",
    ],
    answer: 1,
    topicPath: 'ssr',
    explanation: 'B is correct. Incremental hydration layers `@defer` triggers on top of hydration: the deferred block still renders on the server (so content and SEO stay intact), but Angular ships its code lazily and hydrates it only once the trigger condition is met — `on interaction`, `on viewport`, `on idle`, `on hover`, etc. This keeps initial JavaScript small while preserving server-rendered markup, unlike plain `@defer`, which shows a placeholder until the block loads on the client. Why others fail: (A) it renders on the server and hydrates on the client. (C) SSR still happens for the block. (D) there is no duplication — the same DOM is reused.',
  },
  {
    id: 285, type: 'spot-the-bug', difficulty: 'senior', category: 'performance',
    question: 'Why does this component crash when the app is server-side rendered?',
    code: `@Component({ selector: 'app-width', template: '{{ width }}' })
export class WidthComponent {
  width = window.innerWidth;   // read at construction
}`,
    options: [
      "The window.innerWidth property just always returns a plain 0 in this case",
      "No window exists in Node during SSR; reading it at construction throws",
      "innerWidth must be invoked as a function call: window.innerWidth() here",
      "The template interpolation syntax used in this component is just invalid",
    ],
    answer: 1,
    topicPath: 'ssr',
    explanation: 'B is correct. Server-side rendering runs your component code in Node, where browser globals (`window`, `document`, `navigator`, `localStorage`) do not exist — referencing them during construction or `ngOnInit` throws and breaks the render. Safe patterns: gate the code with `isPlatformBrowser(inject(PLATFORM_ID))`, move it into `afterNextRender`/`afterRender` (which never execute on the server), or use Angular abstractions (`DOCUMENT` token, `Renderer2`) instead of raw globals. Why others fail: (A) it is undefined on the server, not 0. (C) `innerWidth` is a property, not a method. (D) the template is fine — the crash is the global access.',
  },
  {
    id: 286, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'What problem does the HttpClient transfer cache (part of `provideClientHydration()`) solve in SSR?',
    options: [
      "It automatically compresses all of the images on the page during the SSR",
      "It serializes server-fetched data into the HTML so the client reuses it",
      "It caches the application's routes out on a CDN for much faster delivery",
      "It encrypts every one of the API responses while they are in transit here",
    ],
    answer: 1,
    topicPath: 'ssr',
    explanation: 'B is correct. During SSR the server often fetches data to render the page; without a transfer cache the freshly bootstrapped client would fire those very same requests again, wasting a round trip and possibly flashing content. The transfer cache (enabled by `provideClientHydration(withHttpTransferCacheOptions(...))`) embeds those responses in the served HTML as a JSON blob the client reads on startup, so the initial render needs no re-fetch. Why others fail: (A) it moves data, not images. (C) it is not CDN caching. (D) it inlines JSON, it does not encrypt.',
  },
  {
    id: 287, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'What are the primary benefits of server-side rendering an Angular app?',
    options: [
      "It fully removes the need for any client-side JavaScript in the app at all",
      "Faster First Contentful Paint and better SEO, at the cost of server compute",
      "It makes change detection completely unnecessary once the page has loaded",
      "It guarantees that the entire app will work fully offline without a network",
    ],
    answer: 1,
    topicPath: 'ssr',
    explanation: 'B is correct. SSR (Angular Universal, now built into `@angular/ssr`) renders the initial view to HTML on the server so the browser paints meaningful content immediately — improving perceived load (FCP/LCP) and giving crawlers and link-unfurlers fully rendered markup for SEO. The trade-offs: you run a Node server (or prerender), and your code must be SSR-safe (no unguarded browser globals). Hydration then makes that server HTML interactive without a re-render. Why others fail: (A) the client still downloads and runs Angular to become interactive. (C) change detection still runs in the browser. (D) SSR is not a service worker — offline needs a PWA/caching strategy.',
  },
  {
    id: 288, type: 'predict-output', difficulty: 'mid', category: 'rxjs',
    question: 'What does this stream log?',
    code: `of(1, 2, 3).pipe(
  map(n => { if (n === 2) throw new Error('boom'); return n; }),
  catchError(() => of(99)),
).subscribe(v => console.log(v));`,
    options: [
      "1, 2, 3 — every value passes through untouched",
      "1, 99 — throws on 2, catchError yields 99, then completes",
      "1, 2, 99, 3 — the error is caught and yet 3 still emits after",
      "99 only — the whole stream is replaced from the start",
    ],
    answer: 1,
    topicPath: 'rxjs-operators',
    explanation: 'B is correct. An RxJS error is terminal: when `map` throws on `2`, the source errors and stops — values after the failure (`3`) are never emitted. `catchError` intercepts the error and switches to the returned observable (`of(99)`), which emits `99` then completes. So the output is `1, 99`. To keep processing later values you must move the try/handling INSIDE a per-item inner observable (e.g. `mergeMap(x => of(x).pipe(map(...), catchError(...)))`) so one failure does not kill the outer stream. Why others fail: (A) ignores the throw. (C) `3` cannot appear — the source already errored. (D) `1` is emitted before the error.',
  },
  {
    id: 289, type: 'multiple-choice', difficulty: 'senior', category: 'rxjs',
    question: 'What does `retry({ count: 3, delay: 1000 })` do on an HTTP observable?',
    options: [
      "It caches the successful response for roughly 3 whole seconds",
      "On error it re-requests up to 3 times, 1000ms apart",
      "It fires the same request three times in parallel",
      "It retries only on 4xx client errors, nothing else",
    ],
    answer: 1,
    topicPath: 'rxjs-advanced',
    explanation: 'B is correct. `retry` responds to an error by unsubscribing and re-subscribing to the SOURCE — for an HttpClient call that fires the request again. The object form `{ count, delay }` bounds the attempts and inserts a wait (a number for fixed backoff, or a function returning an observable for exponential/conditional backoff). After the final failed attempt the error passes through to the consumer. Why others fail: (A) it does not cache. (C) retries are sequential, not parallel. (D) `retry` retries ALL errors unless your `delay` callback filters by status.',
  },
  {
    id: 290, type: 'multiple-choice', difficulty: 'senior', category: 'rxjs',
    question: 'What is the role of a Scheduler like `asyncScheduler` or `asapScheduler` in RxJS?',
    options: [
      "It selects which operator in the pipe runs next",
      "It controls WHEN and in what context emissions are delivered",
      "It is required for every observable to emit any value at all",
      "It only ever affects how errors are handled in a stream",
    ],
    answer: 1,
    topicPath: 'rxjs-advanced',
    explanation: 'B is correct. A Scheduler is a policy for dispatching work: it decides the clock and context in which an observable emits. `observeOn(asyncScheduler)` pushes emissions onto the macrotask queue (setTimeout-like), `asapScheduler` onto the microtask queue, `queueScheduler` runs synchronously in a trampoline, and `animationFrameScheduler` aligns with `requestAnimationFrame`. Operators like `delay`, `throttleTime`, and `interval` accept a scheduler, and `TestScheduler` uses virtual time so marble tests run instantly and deterministically. Why others fail: (A) it schedules delivery, not operator selection. (C) most observables run synchronously with no explicit scheduler. (D) it governs timing broadly, not just errors.',
  },
  {
    id: 291, type: 'spot-the-bug', difficulty: 'mid', category: 'rxjs',
    question: 'The `error` handler on subscribe never fires even when the request fails. Why?',
    code: `this.http.get('/api/data').pipe(
  catchError(err => {
    console.error(err);
    return EMPTY;          // swallow the error
  })
).subscribe({
  next: d => this.data = d,
  error: () => this.showError(),   // never called
});`,
    options: [
      "EMPTY throws synchronously the moment it is returned",
      "catchError returns EMPTY, which completes without erroring",
      "The object-form subscribe observer syntax is invalid here",
      "HttpClient errors simply cannot be caught by catchError at all",
    ],
    answer: 1,
    topicPath: 'rxjs-advanced',
    explanation: 'B is correct. `catchError` REPLACES the errored stream with whatever observable you return. Returning `EMPTY` yields a stream that emits nothing and completes normally, so downstream the error is gone — `next` and `error` both stay silent and the observable just completes. If the UI must react to failure, either handle it inside `catchError` (call `this.showError()` there and return a fallback value) or re-throw with `return throwError(() => err)` so the subscriber error callback still runs. Why others fail: (A) `EMPTY` completes, it does not throw. (C) the object-form observer is valid. (D) HTTP errors are ordinary RxJS errors and are catchable.',
  },
  {
    id: 292, type: 'multiple-choice', difficulty: 'mid', category: 'rxjs',
    question: 'When does the `finalize(fn)` operator run its callback?',
    options: [
      "Only when the observable actually emits a value downstream",
      "Once on termination — complete, error, OR unsubscription",
      "Immediately, just before the very first emission happens",
      "Only on successful completion, and never ever on an error",
    ],
    answer: 1,
    topicPath: 'rxjs-operators',
    explanation: 'B is correct. `finalize` registers teardown that fires once the subscription ends by ANY path: normal completion, an error, or the consumer unsubscribing (including via `takeUntil` or an async pipe tearing down). That makes it ideal for `finalize(() => this.loading.set(false))` so a spinner clears whether the call succeeded or failed. Note it runs AFTER the error/complete notification propagates. Why others fail: (A) it runs on teardown, not per value. (C) it runs at the end, not before emissions. (D) it also runs on error and unsubscribe — that is its entire purpose.',
  },
  {
    id: 293, type: 'multiple-choice', difficulty: 'mid', category: 'typescript',
    question: 'What does `Omit<User, \'password\'>` produce?',
    options: [
      "A User type where the password property is made optional",
      "Every User property except password — strips one named field",
      "A type containing only the password property of User",
      "A runtime User object with the password field deleted from it",
    ],
    answer: 1,
    topicPath: 'ts-utility-types',
    explanation: 'B is correct. `Omit<T, K>` builds a type from `T` minus the keys in `K` (it is defined as `Pick<T, Exclude<keyof T, K>>`). `Omit<User, \'password\'>` is `User` without the `password` field — handy for API responses or form models that must not carry a secret. Its complement `Pick<T, K>` keeps only the listed keys. Both are compile-time only. Why others fail: (A) making one field optional is `Partial`-like, not removal. (C) that is `Pick<User, \'password\'>`. (D) types are erased — no runtime object is created.',
  },
  {
    id: 294, type: 'multiple-choice', difficulty: 'senior', category: 'typescript',
    question: 'What does `function get<T, K extends keyof T>(obj: T, key: K): T[K]` guarantee?',
    options: [
      "key can be absolutely any arbitrary string value that is passed in",
      "key is limited to obj's real keys; T[K] types the exact return",
      "The function always returns a value typed as any",
      "T and K are required to be exactly the same type",
    ],
    answer: 1,
    topicPath: 'ts-generics',
    explanation: 'B is correct. `K extends keyof T` constrains `key` to the union of `T`\'s property names, and the indexed access type `T[K]` returns exactly the type stored at that key. So for `user: { name: string; age: number }`, `get(user, \'age\')` is `number`, `get(user, \'name\')` is `string`, and `get(user, \'missing\')` fails to compile — full type safety with no casts or `any`. Why others fail: (A) arbitrary strings are rejected by the constraint. (C) the return is precisely typed, not `any`. (D) `K` is a key of `T`, not equal to `T`.',
  },
  {
    id: 295, type: 'multiple-choice', difficulty: 'senior', category: 'typescript',
    question: 'What makes a discriminated (tagged) union like `{ kind: \'circle\'; r: number } | { kind: \'square\'; side: number }` powerful?',
    options: [
      "It merges both of the shapes together into a single combined object",
      "A shared literal tag lets TS narrow to one member per branch",
      "It requires classes and inheritance in order to work",
      "It disables type checking on the union's members",
    ],
    answer: 1,
    topicPath: 'ts-narrowing',
    explanation: 'B is correct. A discriminated union pairs each member with a common singleton-typed field (the discriminant, here `kind`). When you branch on that field, TypeScript narrows to the matching member — inside `case \'circle\'` only `r` is accessible, inside `case \'square\'` only `side`. Assigning the value in the `default` branch to `const _exhaustive: never = shape` turns a forgotten case into a compile error, so adding a new shape forces you to handle it. Why others fail: (A) the members stay separate, narrowed by the tag. (C) plain object types suffice — no classes needed. (D) it strengthens checking, not disables it.',
  },
  {
    id: 296, type: 'multiple-choice', difficulty: 'senior', category: 'typescript',
    question: 'What does a mapped type with template-literal key remapping, like `{ [K in keyof T as \`on\${Capitalize<string & K>}\`]: () => void }`, generate?',
    options: [
      "A runtime object that is already populated with event handler functions",
      "A type remapping each key K via the as clause and a template literal",
      "This syntax only ever works on array types, nothing else",
      "It requires a decorator to actually run at runtime",
    ],
    answer: 1,
    topicPath: 'ts-mapped-conditional',
    explanation: 'B is correct. A mapped type `{ [K in keyof T]: … }` iterates every key of `T`; the optional `as` clause REMAPS each key to a new one, and template literal types build that new key from string pieces plus helpers like `Capitalize`. So the shown type turns `{ name: string; age: number }` into `{ onName: () => void; onAge: () => void }`. These are pure type-level computations — ideal for deriving handler or getter types from a model. Why others fail: (A) it is a compile-time type, not a runtime object. (C) it maps any object type, not just arrays. (D) no decorator or runtime is involved.',
  },
  {
    id: 297, type: 'multiple-choice', difficulty: 'junior', category: 'a11y',
    question: 'When should an image have `alt=""` (empty) versus descriptive alt text?',
    options: [
      "alt is optional — screen readers skip images without it",
      "Informative images need alt; decorative ones get alt=\"\" to skip",
      "Every single image needs a long alt describing every pixel",
      "alt=\"\" hides the image visually as well as from the screen reader",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. `alt` communicates what a sighted user gets from the image: a product photo needs a description, an icon that duplicates adjacent text or a decorative flourish should carry `alt=""` — the EXPLICIT empty value tells assistive tech "intentionally skippable". Leaving `alt` off is worse than empty: many screen readers then read the src file name ("IMG-2024-final-v3.png"). Keep alt concise and purposeful, not exhaustive. Why others fail: (A) a missing attribute is not skipped — it degrades to the file name. (C) alt should convey purpose briefly, not pixel-level detail. (D) alt affects only assistive tech; the image still renders.',
  },
  {
    id: 298, type: 'multiple-choice', difficulty: 'junior', category: 'a11y',
    question: 'Why is a `placeholder` not a substitute for a `<label>` on form fields?',
    options: [
      "Placeholders were fully deprecated as of the HTML5 specification",
      "Placeholder text vanishes on typing and is unreliably announced",
      "Labels are only required for checkboxes and radio buttons",
      "A placeholder works fine as long as it is written in capitals",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. A visible, associated `<label for="email">` (matching the input `id`) or a wrapping label gives the field a persistent, accessible name: it stays visible while typing, screen readers announce it, and clicking it focuses the input (a bigger touch target). Placeholders disappear on input, are usually low-contrast grey, and are not reliably treated as the accessible name. Use placeholder only for a format EXAMPLE (a name@example.com style hint), never as the sole label. Why others fail: (A) placeholder is not deprecated — just misused. (C) all form controls need labels. (D) capitalization changes nothing about the problems.',
  },
  {
    id: 299, type: 'fill-blank', difficulty: 'junior', category: 'a11y',
    question: 'Complete the "skip link" that lets keyboard users jump past the navigation:',
    code: `<body>
  <a class="skip-link" ____>Skip to main content</a>
  <nav><!-- 40 links… --></nav>
  <main ____>…</main>
</body>`,
    options: [
      "(click)=\"skip()\" on the anchor and #main on the <main> tag",
      "href=\"#main-content\" on the anchor, matching id on <main>",
      "routerLink=\"/main\" on the anchor and a \"main\" route path",
      "aria-skip=\"true\" on the anchor and aria-target on <main>",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. A skip link is a plain same-page anchor: `<a href="#main-content">` as the FIRST focusable element, targeting `<main id="main-content" tabindex="-1">` (the tabindex lets a non-interactive element receive programmatic focus in all browsers). It is typically positioned off-screen and revealed on `:focus`, so keyboard and screen-reader users can bypass repeated navigation — WCAG 2.4.1 Bypass Blocks. Why others fail: (A) a click handler alone does not move focus reliably and #main is a template ref, not a fragment target. (C) routing to a different URL reloads context — a fragment is enough. (D) aria-skip/aria-target do not exist.',
  },
  {
    id: 300, type: 'multiple-choice', difficulty: 'junior', category: 'a11y',
    question: 'How should heading levels (h1–h6) be used on a page?',
    options: [
      "Pick whichever heading tag happens to have the font size you want",
      "A logical outline: one h1, then h2, h3, with no skipped levels",
      "Every heading on the page should be an h1 for better SEO",
      "Headings are decorative and interchangeable with styled divs",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. Headings form the document outline that screen-reader users jump through (a heading list is one of the most-used navigation methods). The hierarchy must be semantic: a single `h1` describing the page, `h2` sections, `h3` inside those — never jumping h1 → h4 because it "looks right". If a level looks too big, restyle it with CSS; the tag encodes STRUCTURE, the stylesheet encodes appearance. Why others fail: (A) choosing tags by font size breaks the outline. (C) multiple h1s dilute structure and modern SEO does not reward it. (D) a styled div is invisible to heading navigation.',
  },
  {
    id: 301, type: 'multiple-choice', difficulty: 'mid', category: 'a11y',
    question: 'What does WCAG AA require for text color contrast?',
    options: [
      "Any color combination is fine if the design team approves it",
      "At least 4.5:1 for normal text, 3:1 for large text and UI",
      "Only black text on a white background is truly compliant",
      "Contrast rules apply only to links, never to body text",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. WCAG 2.x AA sets 4.5:1 minimum contrast for normal body text and relaxes to 3:1 for LARGE text (roughly 24px regular or 18.5px bold), because bigger glyphs are legible at lower contrast. Non-text UI essentials (input borders, focus indicators, icons) need 3:1 under 1.4.11. Grey-on-grey aesthetics commonly fail — check with the browser DevTools color picker, which shows the ratio and AA/AAA pass marks. Why others fail: (A) contrast is a measurable requirement, not a taste call. (C) many palettes pass — black/white is just the extreme. (D) the rule covers all meaningful text and UI parts.',
  },
  {
    id: 302, type: 'fill-blank', difficulty: 'mid', category: 'a11y',
    question: 'Complete the nav so assistive tech knows which page is the current one:',
    code: `<nav>
  <a routerLink="/home" routerLinkActive="active"
     #rla="routerLinkActive"
     ____>Home</a>
</nav>`,
    options: [
      "aria-selected=\"true\" hardcoded onto the current link",
      "[attr.aria-current]=\"rla.isActive ? 'page' : null\" drives it",
      "disabled on the current link so that it can no longer be clicked",
      "title=\"current\", which every screen reader will announce",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. The visual `.active` class means nothing to a screen reader — the semantic equivalent is `aria-current="page"` on the current nav link. Export the directive (`#rla="routerLinkActive"`) and bind `[attr.aria-current]="rla.isActive ? \'page\' : null"`: binding null REMOVES the attribute when the route is inactive. Recent Angular versions can set aria-current automatically via routerLinkActive, but the manual wiring shows the mechanism. Why others fail: (A) aria-selected belongs to tabs/options, not nav links — and hardcoding true on every link is wrong anyway. (C) disabling removes it from tab order; users should still be able to reach it. (D) title tooltips are unreliably exposed.',
  },
  {
    id: 303, type: 'multiple-choice', difficulty: 'senior', category: 'a11y',
    question: 'After a client-side route change in an Angular SPA, what accessibility gap must you close that a normal page load handles for free?',
    options: [
      "Nothing — the router fully replicates real browser navigation",
      "Focus and announcement: move focus to the new view, set titles",
      "You must manually reload all of the stylesheets on every route change",
      "You must re-register every event listener after navigating",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. In a classic multi-page site, navigation reloads the document: focus returns to the top and the screen reader announces the new page title. An SPA replaces router-outlet content with NO focus change and NO announcement — a screen-reader user may not know anything happened. Fixes: on NavigationEnd, focus the new view\'s main heading (give it `tabindex="-1"`, then call `.focus()`) or announce via an `aria-live` region (the CDK LiveAnnouncer helps), and set per-route titles with the route `title` property / TitleStrategy. Why others fail: (A) the router swaps DOM only — the semantics are your job. (C) styles persist fine. (D) Angular bindings survive navigation; that is not the issue.',
  },
  {
    id: 304, type: 'multiple-choice', difficulty: 'junior', category: 'security',
    question: 'Why must API keys and secrets never be put in Angular code or environment.ts?',
    options: [
      "The Angular build encrypts environment.ts, so the secrets it holds stay safe",
      "The whole bundle ships to the browser — anyone can read secrets in DevTools",
      "Committing secrets to environment.ts noticeably slows the production build down",
      "It is fine to store them there as long as the git repository stays private",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. The browser downloads your entire compiled bundle — minified, but fully readable. Any string in it (API keys, tokens, credentials) is extractable in seconds from the Network or Sources tab. `environment.ts` merely selects build-time constants; it offers zero secrecy. The pattern: the SPA calls YOUR backend, and the backend holds the secret and makes the privileged call. Public-by-design keys (e.g. a maps key locked to your domain) are the only exception. Why others fail: (A) nothing is encrypted — it is compiled in as plain text. (C) irrelevant to build speed. (D) repo privacy does not matter once the bundle is served to browsers.',
  },
  {
    id: 305, type: 'multiple-choice', difficulty: 'junior', category: 'security',
    question: 'A route guard (`canActivate`) hides the /admin page from non-admins. Is the data behind it safe?',
    options: [
      "Yes — if the router blocks the route, the data behind it is unreachable",
      "No — guards are client-side UX; the server must authorize each request itself",
      "Yes, provided the guard also verifies the JWT's expiry before it allows entry",
      "Only if you pair canActivate with canLoad to also gate the lazy chunk",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. All frontend checks run in an environment the user fully controls — they can bypass the router entirely and hit /api/admin/users with curl, or edit the bundle in DevTools. Guards exist for UX (do not render a page that will 403) and for lazy-load gating, never as the enforcement layer. Real security = the server validating the caller\'s token and permissions on EVERY endpoint. Why others fail: (A) the API is a separate surface from the route. (C) client-side JWT checks are equally bypassable. (D) canLoad only prevents downloading the chunk — the API remains exposed.',
  },
  {
    id: 306, type: 'fill-blank', difficulty: 'mid', category: 'security',
    question: 'Complete this functional interceptor so every API request carries the auth token:',
    code: `export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthStore).token();
  if (!token) return next(req);
  const authReq = ____;
  return next(authReq);
};`,
    options: [
      "req.headers.set(\"Authorization\", token) — mutate the request headers in place",
      "req.clone({ setHeaders: { Authorization: \"Bearer \" + token } }) — clone it",
      "new HttpRequest(\"GET\", req.url) — rebuild the request from scratch each call",
      "next(req, { headers: token }) — pass the headers as a second argument to next",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. `HttpRequest` is immutable — `req.headers.set(...)` returns a NEW headers object and does not change the outgoing request, a classic silent bug. The pattern is `req.clone({ setHeaders: { Authorization: \'Bearer \' + token } })` and forwarding the clone. Functional interceptors (`HttpInterceptorFn`, registered via `provideHttpClient(withInterceptors([...]))`) can use `inject()` for dependencies. Consider skipping the header for non-API or public URLs. Why others fail: (A) mutation is a no-op on an immutable request. (C) rebuilding loses the body, params, and method generality. (D) next() takes only the request.',
  },
  {
    id: 307, type: 'multiple-choice', difficulty: 'mid', category: 'security',
    question: 'How does a Content-Security-Policy (CSP) header complement Angular\'s built-in sanitization?',
    options: [
      "CSP fully replaces sanitization, so Angular skips its own sanitizer when a CSP is present",
      "Defense in depth: CSP is a browser-enforced policy that blocks injection at load",
      "CSP only governs cookies and storage, so it has no effect on script execution",
      "CSP is configured in angular.json and shipped compiled inside the app bundle",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. They operate at different layers. Angular sanitizes interpolated/bound values so script tags or javascript: payloads are neutralized in templates. CSP is an HTTP response header (`Content-Security-Policy: script-src \'self\'; …`) the BROWSER enforces: forbidding inline script execution, eval, and loading from unlisted origins. If an XSS slips through anyway, a strict CSP usually prevents the payload from running or phoning home. Angular supports strict CSP via nonces (`ngCspNonce` / the `CSP_NONCE` token) for its inline styles. Why others fail: (A) both stay active — layers, not alternatives. (C) CSP governs scripts, styles, frames, connects, and more. (D) it is a server/header concern, not a bundle setting.',
  },
  {
    id: 308, type: 'spot-the-bug', difficulty: 'senior', category: 'security',
    question: 'This post-login redirect is an open-redirect vulnerability. Why?',
    code: `// /login?returnUrl=... handling
onLoginSuccess() {
  const returnUrl =
    this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
  window.location.href = returnUrl;   // redirect wherever it says
}`,
    options: [
      "queryParamMap is simply unable to read the returnUrl parameter from the URL",
      "returnUrl is attacker-controlled — validate it is an internal path before nav",
      "window.location.href is too slow here; you should defer the redirect via setTimeout",
      "The ?? should be || or the '/' default is never actually applied at all",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. An open redirect lets an attacker craft a link on YOUR trusted domain that bounces victims to theirs — ideal for phishing ("please log in again") right after a real login. Because the value comes from the URL, treat it as hostile: accept only relative internal paths (starts with `/`, reject `//` and protocol-relative tricks, or match against a route allowlist) and use `router.navigateByUrl(returnUrl)`, which stays inside the SPA rather than performing a raw browser navigation to an arbitrary absolute URL. Why others fail: (A) queryParamMap reads it fine — that is the problem. (C) performance is irrelevant. (D) ?? correctly defaults on null.',
  },
  {
    id: 309, type: 'multiple-choice', difficulty: 'mid', category: 'security',
    question: 'How do you prevent your Angular app from being loaded in a hostile iframe (clickjacking)?',
    options: [
      "Add [preventIframe]=\"true\" to the application's root component to block it",
      "Send CSP frame-ancestors (or X-Frame-Options) from the server — not from Angular",
      "Obfuscate and minify the JavaScript bundle so a hostile iframe cannot parse or load it",
      "Serve the app over HTTPS, which automatically blocks all framing attempts",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. Clickjacking overlays your real UI (in an invisible iframe) under fake controls, tricking users into clicking privileged buttons. The defense is response headers the BROWSER enforces before your code runs: `Content-Security-Policy: frame-ancestors \'none\'` (modern, supersedes) or `X-Frame-Options: DENY/SAMEORIGIN` (legacy). Configure them on the web server/CDN serving index.html. JavaScript frame-busting is bypassable and not recommended alone. Why others fail: (A) no such Angular API — by the time Angular runs, the frame already loaded. (C) obfuscation does not affect framing. (D) HTTPS secures transport, not embedding.',
  },
  {
    id: 310, type: 'multiple-choice', difficulty: 'junior', category: 'security',
    question: 'What is the practical risk of outdated npm dependencies in an Angular project, and the first-line tooling?',
    options: [
      "Outdated packages only risk slower builds — there is no real security impact",
      "Dependencies run with full privilege, so a known CVE becomes your vulnerability",
      "npm refuses to install any package that has a known published vulnerability",
      "Only devDependencies can ever carry vulnerabilities; shipped runtime deps are always safe",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. A frontend app is mostly other people\'s code: hundreds of transitive packages execute in your CI and ship to every user. Known vulnerabilities (XSS in a widget library, prototype pollution in a util) and supply-chain attacks (malicious patch versions) flow straight in. Baseline hygiene: `npm audit` in CI, regular `ng update` for the framework, a committed lockfile so installs are reproducible, and skepticism toward tiny unmaintained packages. Why others fail: (A) the risk is security, not just speed. (C) npm warns but does not block. (D) runtime deps ship to users; dev deps threaten your build pipeline — both matter.',
  },
  {
    id: 311, type: 'fill-blank', difficulty: 'junior', category: 'i18n',
    question: 'Complete the component code so this string is translatable with Angular\'s built-in i18n:',
    code: `@Component({ template: '<h1>{{ title }}</h1>' })
export class Banner {
  title = ____;
}`,
    options: [
      "translate(\"Welcome back!\") from some global translate() function",
      "$localize with a tagged template marks TS strings for extraction",
      "i18n(\"Welcome back!\") imported directly from the @angular/core package",
      "new TranslatedString(\"Welcome back!\") from the framework",
    ],
    answer: 1,
    topicPath: 'i18n',
    explanation: 'B is correct. The i18n attribute only covers TEMPLATE text; strings born in TypeScript (titles, toasts, validation messages) use the $localize tagged template literal from @angular/localize. `ng extract-i18n` collects these into the translation file alongside template messages, and each locale build substitutes the translated text at compile time. You can attach metadata the same way as in templates: $localize with a `:meaning|description@@id:` prefix before the text. Why others fail: (A) translate() is the ngx-translate library pattern, not built-in i18n. (C) there is no i18n() function in core. (D) no such class exists.',
  },
  {
    id: 312, type: 'multiple-choice', difficulty: 'junior', category: 'i18n',
    question: 'How do you translate an element ATTRIBUTE like title or placeholder, not just its text content?',
    options: [
      "Element attributes simply cannot be translated in Angular i18n",
      "Prefix the attribute name with i18n-, e.g. i18n-placeholder",
      "Wrap the whole element inside a dedicated <i18n> tag",
      "Move every attribute string into the component class first",
    ],
    answer: 1,
    topicPath: 'i18n',
    explanation: 'B is correct. The bare `i18n` attribute marks an element\'s CONTENT; user-visible attributes (placeholder, title, aria-label, alt) each get their own marker by prefixing: `i18n-placeholder`, `i18n-title`, `i18n-aria-label`. The extractor then includes those attribute values as separate translation units, and the same `meaning|description@@customId` metadata syntax applies (`i18n-title="tooltip|Header logo tooltip@@logoTitle"`). Why others fail: (A) they are fully supported via the prefix. (C) no <i18n> element exists. (D) unnecessary — though class strings would then use $localize.',
  },
  {
    id: 313, type: 'multiple-choice', difficulty: 'mid', category: 'i18n',
    question: 'In `<h1 i18n="site header|Greeting on the landing page@@homeGreeting">Hello</h1>`, what are the three parts of the i18n value?',
    options: [
      "Three alternative translations of the same source text",
      "meaning|description@@id — context, translator note, stable id",
      "locale|region@@currency configuration used by the pipes",
      "A CSS class, inline style, and element id applied after translation",
    ],
    answer: 1,
    topicPath: 'i18n',
    explanation: 'B is correct. The full syntax is `i18n="meaning|description@@id"`. The MEANING partitions translation units: two "Hello" texts with different meanings become separate units (a greeting vs. a button label may translate differently); texts with the SAME meaning share one translation. The DESCRIPTION is free-form context for the human translator. The `@@id` pins a custom stable identifier — without it Angular generates an id from the content, which CHANGES whenever the text changes, orphaning existing translations. Why others fail: (A) translations live in the locale files, not inline. (C) locale data is a separate mechanism. (D) nothing here touches CSS.',
  },
  {
    id: 314, type: 'fill-blank', difficulty: 'mid', category: 'i18n',
    question: 'Complete the ICU expression so the message adapts to the user\'s gender:',
    code: `<span i18n>
  { gender, ____ }
</span>
<!-- goal: "She replied" / "He replied" / "They replied" -->`,
    options: [
      "plural, =0 {She} =1 {He} other {They} — numeric branches",
      "select, female {She replied} ... — matches by string value",
      "switch, case female: … — like a TypeScript switch statement",
      "Gender is not supported — use three separate *ngIf blocks",
    ],
    answer: 1,
    topicPath: 'i18n',
    explanation: 'B is correct. ICU messages have two flavors: `plural` for NUMBERS (with locale-aware categories like one/few/many plus exact `=0` matches) and `select` for arbitrary STRING values: `{gender, select, female {She replied} male {He replied} other {They replied}}`. The `other` branch is required as the fallback. Translators receive the whole ICU block and can restructure it per language — which per-branch *ngIf markup would prevent. Why others fail: (A) plural matches numeric categories, not strings like "female". (C) there is no switch keyword in ICU. (D) select exists precisely for this.',
  },
  {
    id: 315, type: 'multiple-choice', difficulty: 'senior', category: 'i18n',
    question: 'Built-in compile-time i18n vs a runtime library like ngx-translate — what is the core trade-off?',
    options: [
      "They are functionally identical, so the choice is cosmetic",
      "Compile-time bakes per-locale bundles; runtime swaps JSON live",
      "ngx-translate is faster because it skips translation entirely",
      "Built-in i18n supports only two locales per application",
    ],
    answer: 1,
    topicPath: 'i18n',
    explanation: 'B is correct. @angular/localize replaces messages during the build, producing per-locale bundles (dist/fr/, dist/de/) served by URL or Accept-Language — zero translation work in the browser, plain templates, and missing-translation failures at BUILD time. The cost: an in-app language switcher requires navigating to another build. Runtime libraries (ngx-translate, Transloco) load locale JSON dynamically and interpolate through a pipe/service — seamless switching and lazy locale loading, but a runtime dependency, pipe overhead, and typo-prone keys with no compile check. Choose by whether live switching is a hard requirement. Why others fail: (A) the architectures differ fundamentally. (C) it still translates — at runtime. (D) built-in i18n supports any number of locales.',
  },
  {
    id: 316, type: 'multiple-choice', difficulty: 'junior', category: 'state',
    question: 'Two sibling components each keep their own `cartItems` copy and they keep disagreeing. What is the fix?',
    options: [
      "Have each component poll the other every second to compare",
      "Lift it to one shared source — a service signal both read",
      "Pass the array back and forth with @Input/@Output each change",
      "Store the whole array in a global window.cart variable",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. Duplicated state ALWAYS drifts — each copy updates on its own schedule. The remedy is one owner: a root-provided CartStore whose `items = signal<Item[]>([])` is mutated only through store methods like `add(item)`. Components inject the store, render `computed` projections, and call its methods to change data. This is the core of every state-management pattern: single source of truth, derive do not store. Why others fail: (A) polling is a race-condition band-aid. (C) sibling-to-sibling @Input/@Output chains must route through a common parent and re-introduce copies. (D) window globals are untracked, untyped, and invisible to change detection.',
  },
  {
    id: 317, type: 'multiple-choice', difficulty: 'junior', category: 'state',
    question: 'A value must travel from a component to its great-great-grandchild. What is the alternative to passing @Input through every layer ("prop drilling")?',
    options: [
      "Use document.querySelector to reach the descendant node directly",
      "Provide a shared service at an ancestor; descendant injects it",
      "Emit a global CustomEvent on window and listen everywhere",
      "Merge the five components into one so no inputs are needed",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. Threading an @Input through components that only forward it couples every intermediate layer to data it does not use — each rename touches five files. Dependency injection is Angular\'s built-in answer: put the state in a service (providedIn: \'root\', or in a feature component\'s `providers` to scope it to that subtree), and ANY descendant injects it directly. Signals make the shared value reactive for free. Inputs remain right for genuinely parent-to-child, presentational data. Why others fail: (A) DOM queries bypass Angular\'s data flow and break encapsulation. (C) window events are stringly-typed and leak listeners. (D) merging destroys reuse and testability.',
  },
  {
    id: 318, type: 'multiple-choice', difficulty: 'mid', category: 'state',
    question: 'What is the Facade pattern in Angular state management?',
    options: [
      "A decorator that hides a component from change detection",
      "A service fronting state with a small intent-based API",
      "A component with no template used only for routing logic",
      "An HTTP interceptor that caches every single GET request",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. A facade is an injectable that exposes WHAT the feature can do (queries as signals/observables, commands as methods) and hides HOW state is managed (dispatching actions, selecting slices, calling APIs). Components become thin — inject the facade, bind its view model, invoke intents — and gain painless testing (mock one facade instead of a store) plus freedom to migrate the state layer later. The risk to watch: a lazy facade that just re-exports the store 1:1 adds indirection without abstraction. Why others fail: (A) not a change-detection tool. (C) that describes a shell/container route component. (D) unrelated to HTTP caching.',
  },
  {
    id: 319, type: 'multiple-choice', difficulty: 'mid', category: 'state',
    question: 'Why store collections NORMALIZED — entities keyed by id plus an ids array — instead of a plain nested array?',
    options: [
      "Arrays simply cannot be stored in NgRx or signal stores",
      "O(1) lookup/update by id, no duplicates, stable references",
      "Normalization compresses the data to save on memory use",
      "It is only ever needed when you are using a REST API backend",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. Normalization treats client state like a tiny relational DB: each entity type keyed by id (`entities: Record<id, Item>`), relations stored AS ids, plus an `ids: []` array preserving order. Updating one todo is a single spread on `entities[id]` — no deep array surgery; and because an author embedded in 40 posts exists ONCE, an author rename cannot miss stale copies. Selectors then join/denormalize for the view, and @ngrx/entity / withEntities generate the adapters. Why others fail: (A) arrays store fine — they just scale badly for updates. (C) memory use is similar; correctness and update ergonomics are the win. (D) the shape helps regardless of transport.',
  },
  {
    id: 320, type: 'multiple-choice', difficulty: 'senior', category: 'state',
    question: 'What is an OPTIMISTIC update, and what must the implementation always include?',
    options: [
      "Updating the UI only once the server confirms, just to be safe",
      "Apply the change locally at once, with a rollback on failure",
      "Retrying the failed requests forever until they succeed",
      "Batching all writes and syncing them once every minute",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. Optimistic UI assumes success: snapshot the prior value, mutate the store first, fire the HTTP call, and on error restore the snapshot and surface a toast — e.g. save `const prev = this.items()`, apply the update, and in catchError call `this.items.set(prev)` before notifying. The rollback (plus idempotent server handling for retries) is NOT optional — without it a failed call leaves the UI lying. Use the pessimistic (wait-for-server) flow for payments and destructive actions. Why others fail: (A) that is the pessimistic approach. (C) blind retries can duplicate effects and never resolve conflicts. (D) batching is a different strategy with its own consistency issues.',
  },
  {
    id: 321, type: 'multiple-choice', difficulty: 'junior', category: 'forms',
    question: 'What does the "banana in a box" syntax `[(ngModel)]="name"` actually desugar to?',
    options: [
      "A special compiler mode that has no equivalent longhand form at all here",
      "[ngModel]=\"name\" plus (ngModelChange)=\"name = value\" — input and output",
      "A two-way binding straight to the DOM element's value attribute directly",
      "A shortcut that creates a FormControl behind the scenes in reactive forms",
    ],
    answer: 1,
    topicPath: 'template-forms',
    explanation: 'B is correct. `[( )]` is pure sugar: `[(x)]="prop"` expands to `[x]="prop" (xChange)="prop = $event"`. Knowing the desugared form matters because you can use the halves independently — e.g. `[ngModel]="name" (ngModelChange)="name = $event.trim()"` to normalize input, something the combined syntax cannot express. The same convention powers custom two-way bindings: an input `value` paired with an output `valueChange` (or the `model()` signal API). Why others fail: (A) it is mechanical sugar, fully expressible longhand. (C) it binds through the directive, not the raw attribute. (D) ngModel belongs to template-driven forms; it does create internal state but not a reactive-forms FormControl you declare.',
  },
  {
    id: 322, type: 'multiple-choice', difficulty: 'junior', category: 'forms',
    question: 'When should a validation error message become visible to the user?',
    options: [
      "Immediately on page load, so that users know all of the rules upfront",
      "Once the control is touched or dirty — earlier just reads as nagging",
      "Only after the entire form has already been submitted successfully once",
      "Never — invalid controls really should just be silently ignored entirely",
    ],
    answer: 1,
    topicPath: 'form-validation',
    explanation: 'B is correct. A pristine, untouched form is full of empty required fields — all technically invalid — so gating messages on interaction state is the standard UX: `control.touched` (user focused then left the field) or `control.dirty` (user changed the value). Read the specific failure from the errors object: `email.errors?.[\'required\']` vs `email.errors?.[\'email\']` to show the right message. On submit, `form.markAllAsTouched()` reveals everything still invalid. Why others fail: (A) errors on load punish the user before any input. (C) waiting until after successful submit is too late — an invalid form should not submit at all. (D) silent invalid fields leave users stuck.',
  },
  {
    id: 323, type: 'multiple-choice', difficulty: 'junior', category: 'forms',
    question: 'How do you disable a control in a reactive form, and why not `[disabled]` in the template?',
    options: [
      "Bind [disabled]=\"isDisabled\" on the input just like any other property",
      "Use the API: { value: \"\", disabled: true } or control.disable()/enable()",
      "Just set control.readonly = true on the control and leave it at that here",
      "Remove the control from the FormGroup entirely to disable it for the user",
    ],
    answer: 1,
    topicPath: 'reactive-forms',
    explanation: 'B is correct. In reactive forms the FormControl is the single source of truth for the control\'s state, including disabled-ness. Declare it with the boxed value `{ value: \'\', disabled: true }` or toggle at runtime with `control.disable()` / `control.enable()`. Binding the DOM `[disabled]` attribute alongside `formControlName` creates two owners of one state — Angular logs a warning about exactly this. Remember the side effect: disabled controls are EXCLUDED from `form.value` (use `getRawValue()` to include them). Why others fail: (A) that is the template-driven approach and triggers the warning with reactive forms. (C) readonly is a different concept (editable vs focusable) and not a FormControl API. (D) removing the control loses its value and validators entirely.',
  },
  {
    id: 324, type: 'multiple-choice', difficulty: 'junior', category: 'forms',
    question: 'What are the three building blocks of reactive forms and what does each model?',
    options: [
      "FormControl, FormGroup, FormArray — one value, a keyed object, a list",
      "Input, Form, Button — the three HTML elements that Angular enhances here",
      "Model, View, Controller — the classic MVC triad applied here onto forms",
      "ngModel, ngForm, ngSubmit — the three main reactive forms directives here",
    ],
    answer: 0,
    topicPath: 'reactive-forms',
    explanation: 'A is correct. `FormControl` tracks one value + validation state (one input/select/checkbox). `FormGroup` composes controls into a keyed object (`{ name, email }`) whose value is the object of child values. `FormArray` holds an ordered, growable list (e.g. multiple phone numbers) you `push()`/`removeAt()`. All three extend `AbstractControl`, so value/validity/statusChanges work uniformly, and they nest: a FormArray of FormGroups of FormControls models a table of rows. Why others fail: (B) they are TypeScript model classes, not HTML elements. (C) MVC is unrelated. (D) ngModel/ngForm belong to TEMPLATE-driven forms.',
  },
  {
    id: 325, type: 'multiple-choice', difficulty: 'junior', category: 'forms',
    question: 'How do you apply multiple built-in validators to one FormControl?',
    options: [
      "Only a single validator is ever allowed per control in reactive forms",
      "Pass an array: [Validators.required, Validators.email] — errors merge",
      "Chain them fluently like Validators.required.email.minLength(8) instead",
      "Write them purely as HTML attributes only, such as required minlength=8",
    ],
    answer: 1,
    topicPath: 'form-validation',
    explanation: 'B is correct. The second FormControl argument accepts a single validator or an array; all run on every value change and their errors MERGE into one object — e.g. an empty field gives `{ required: true }`, a short password `{ minlength: { requiredLength: 8, actualLength: 3 } }`. Note some built-ins are factories you CALL (`Validators.minLength(8)`, `Validators.pattern(/…/)`) while others are used bare (`Validators.required`, `Validators.email`) — passing `Validators.minLength` uncalled is a classic bug. Why others fail: (A) arrays of validators are standard. (C) validators do not chain fluently. (D) attributes only feed template-driven forms; reactive validators live in the class.',
  },
  {
    id: 326, type: 'multiple-choice', difficulty: 'junior', category: 'forms',
    question: 'Why bind submission with `<form [formGroup]="form" (ngSubmit)="save()">` rather than `(click)="save()"` on the button?',
    options: [
      "ngSubmit is required here, or else Angular throws a runtime error at you",
      "ngSubmit fires on click AND Enter, and prevents the default page reload",
      "A click handler is simply unable to call any component methods at all here",
      "ngSubmit automatically validates the form and blocks invalid ones for you",
    ],
    answer: 1,
    topicPath: 'reactive-forms',
    explanation: 'B is correct. Native forms submit on submit-button click OR Enter in an input — `(ngSubmit)` hooks that unified event, so keyboard users are covered for free, and Angular\'s form directives suppress the browser\'s default page-reloading POST. A `(click)` on the button captures only mouse/keyboard activation of that one button and leaves Enter-in-field either dead or triggering an unhandled native submit. Still guard inside: `if (this.form.invalid) { this.form.markAllAsTouched(); return; }` — nothing blocks invalid submission automatically. Why others fail: (A) it is best practice, not enforced. (C) click handlers work, they are just incomplete. (D) validation gating is your code\'s job.',
  },
  {
    id: 327, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'With nested groups — form = fb.group({ address: fb.group({ street: [""] }) }) — how do you reach the street control from the class?',
    options: [
      "Use form.address.street — the controls become properties on the group",
      "form.get(\"address.street\") — get() walks the nested groups and arrays",
      "Call form.find(\"street\"), which searches every level of the form by name",
      "Nested FormGroups are not supported at all, so flatten the whole form out",
    ],
    answer: 1,
    topicPath: 'reactive-forms',
    explanation: 'B is correct. `AbstractControl.get()` accepts a dot-delimited path (`\'address.street\'`) or array path (`[\'address\', \'street\']`) and returns the control or null — the classic access pattern. With the typed forms API, chaining `form.controls.address.controls.street` is fully type-safe and non-null, which many teams now prefer. In the template, nesting is declared structurally: a container with `formGroupName="address"` scopes the inner `formControlName="street"`. Why others fail: (A) controls are not promoted to properties of the group instance. (C) there is no find-by-name search. (D) nesting is a core, fully supported feature.',
  },
  {
    id: 328, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What is the canonical pipeline for a search box that queries an API as the user types?',
    options: [
      "Call the API directly in (keyup) — the very simplest option is best here",
      "valueChanges.pipe(debounceTime, distinctUntilChanged, switchMap) does it",
      "Poll the API once every second and then filter the results client-side",
      "valueChanges.pipe(mergeMap(...)) so every keystroke's request completes",
    ],
    answer: 1,
    topicPath: 'reactive-forms',
    explanation: 'B is correct. Each operator solves a real defect: `debounceTime(300)` stops a request per keystroke; `distinctUntilChanged()` skips re-querying when the settled value is the same (e.g. type + delete a char); `switchMap` maps to the HTTP call AND cancels the previous in-flight request, killing the out-of-order-response bug where slow results for "ang" overwrite fresh results for "angular". Render with the async pipe or `toSignal`. Why others fail: (A) raw keyup floods the API and races responses. (C) polling wastes requests and is not type-ahead. (D) `mergeMap` keeps stale requests alive — their late responses can clobber newer ones.',
  },
  {
    id: 329, type: 'fill-blank', difficulty: 'mid', category: 'forms',
    question: 'Complete the custom validator that rejects usernames containing spaces:',
    code: `const noSpaces: ValidatorFn = (control: AbstractControl) => {
  return ____;
};
// usage: new FormControl('', [Validators.required, noSpaces])`,
    options: [
      "control.value.includes(\" \") — just returning a boolean pass or fail value",
      "control.value?.includes(\" \") ? { noSpaces: true } : null — errors or null",
      "throw new ValidationError(\"spaces\") from the validator whenever invalid",
      "control.setErrors({ noSpaces: true }) and then return nothing at all here",
    ],
    answer: 1,
    topicPath: 'form-validation',
    explanation: 'B is correct. The `ValidatorFn` contract: take the control, return `null` for VALID or a `ValidationErrors` object (`{ noSpaces: true }`, or richer like `{ noSpaces: { position: 3 } }`) for invalid. The key becomes addressable in templates (`errors?.[\'noSpaces\']`) and merges with other validators\' errors. Guard against null values (after `reset()`). Factories that need parameters return a ValidatorFn: `forbidden(name: string): ValidatorFn => (c) => …`. Why others fail: (A) booleans are not the contract — Angular expects errors-object-or-null. (C) validators return, never throw. (D) calling setErrors inside a validator fights the forms engine, which overwrites errors from validator returns each run.',
  },
  {
    id: 330, type: 'multiple-choice', difficulty: 'mid', category: 'forms',
    question: 'What is the difference between `formControlName="email"` and `[formControl]="emailCtrl"` in a template?',
    options: [
      "They are freely interchangeable in absolutely any context you use them",
      "formControlName is a string key under a parent group; [formControl] a ref",
      "[formControl] is deprecated now, in favor of using formControlName instead",
      "formControlName creates the control, while [formControl] only ever reads it",
    ],
    answer: 1,
    topicPath: 'reactive-forms',
    explanation: 'B is correct. `formControlName="email"` is a lookup: it requires an ancestor `[formGroup]="form"` (or `formGroupName`) and resolves the string against that group\'s controls — using it without a parent group throws the classic "formControlName must be used with a parent formGroup directive" error. `[formControl]="emailCtrl"` binds an actual FormControl reference, perfect for standalone inputs (search fields, filters) that do not belong to any form. Both connect the same way once resolved. Why others fail: (A) formControlName outside a group errors. (C) both are current API. (D) neither creates controls — you create them in the class; the directives just connect.',
  },
  {
    id: 331, type: 'spot-the-bug', difficulty: 'senior', category: 'forms',
    question: 'This input mixes two form systems. What does Angular do?',
    code: `<form [formGroup]="form">
  <input formControlName="email"
         [(ngModel)]="email" />
</form>`,
    options: [
      "It works fine — ngModel and formControlName just sync up automatically",
      "Mixing ngModel with reactive directives is unsupported; pick one system",
      "ngModel silently wins the conflict and the FormControl is quietly detached",
      "It only actually breaks in the case where the form is submitted twice over",
    ],
    answer: 1,
    topicPath: 'reactive-forms',
    explanation: 'B is correct. `ngModel` (template-driven) and `formControlName`/`formControl` (reactive) are two different state-management systems; putting both on one input gives the value two competing owners with different update timing. Angular deprecated the combination in v6 with a prominent console warning, and modern versions reject it — the documented migration is to choose one API. If a component field must mirror the value, derive it: subscribe to `valueChanges` or read the control, do not attach ngModel. Why others fail: (A) the sync is exactly what is NOT defined. (C) neither cleanly wins — behavior was undefined-ish, which is why it was banned. (D) the conflict exists from the first render, not on submit.',
  },
  {
    id: 332, type: 'multiple-choice', difficulty: 'senior', category: 'forms',
    question: 'What does the unified `control.events` observable (Angular 18+) give you that valueChanges/statusChanges do not?',
    options: [
      "Nothing at all — control.events is merely an alias for valueChanges here",
      "One typed stream of ALL events, including touched and pristine changes",
      "It replaces the form's validators with plain event handlers on the control",
      "Synchronous access to future values even before the user has typed them in",
    ],
    answer: 1,
    topicPath: 'reactive-forms',
    explanation: 'B is correct. Before v18, `valueChanges` and `statusChanges` covered value/validity, but touched/pristine transitions were unobservable (teams monkey-patched markAsTouched). `control.events` unifies everything as typed event classes on one stream: `events.pipe(filter(e => e instanceof TouchedChangeEvent))` reacts to blur-driven state, `PristineChangeEvent` to dirtiness, and on a root FormGroup you also see form submit/reset events. Each event carries its source control. Why others fail: (A) it is a superset with typed wrappers, not an alias. (C) validators are untouched. (D) nothing predicts future input.',
  },
  {
    id: 333, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'Why must route order in the Routes array be considered, and where does the wildcard go?',
    options: [
      "Order is irrelevant — Angular auto-picks the most specific match",
      "First-match-wins top to bottom; the ** wildcard must go LAST",
      "Routes are matched alphabetically by their path string",
      "The wildcard must be first so that errors are caught early",
    ],
    answer: 1,
    topicPath: 'routing-basics',
    explanation: 'B is correct. The router walks the config in array order and takes the first route whose path matches — there is no specificity scoring. Practical consequences: `products/new` must precede `products/:id` (otherwise "new" is captured as an id), and `{ path: \'**\' }` is the universal fallback that must sit at the very END; anything after it is unreachable. The same logic applies within each children array. Why others fail: (A) no automatic specificity — that is CSS thinking. (C) nothing is alphabetical. (D) a leading wildcard would match EVERY url and hide your entire app.',
  },
  {
    id: 334, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'Why does `{ path: "", redirectTo: "/home" }` need `pathMatch: "full"`?',
    options: [
      "The pathMatch is decorative here and can safely be omitted",
      "Default prefix matches every URL; \"full\" needs an empty rest",
      "pathMatch: \"full\" makes the redirect permanent (a 301)",
      "It enables query parameters to ride along on the redirect URL",
    ],
    answer: 1,
    topicPath: 'routing-basics',
    explanation: 'B is correct. Route matching consumes url segments by PREFIX by default. The empty path `\'\'` is a prefix of every url — `/products/42` starts with nothing — so a prefix-matched empty redirect would fire on every navigation (Angular throws at config time for exactly this misconfiguration). `pathMatch: \'full\'` restricts the match to when no unconsumed segments remain, i.e. the user is genuinely at the root. Non-empty redirects usually keep prefix matching. Why others fail: (A) omitting it on an empty redirect is a config error. (C) client-side redirects have no HTTP status. (D) query params are unrelated (they are preserved by default on redirects).',
  },
  {
    id: 335, type: 'fill-blank', difficulty: 'junior', category: 'routing',
    question: 'Complete the link so each product card navigates to its own detail page (/products/42):',
    code: `@for (product of products(); track product.id) {
  <a ____>{{ product.name }}</a>
}`,
    options: [
      "href=\"/products/{{ product.id }}\" — plain interpolated href",
      "[routerLink]=\"['/products', product.id]\" — the array form",
      "routerLink=\"/products/product.id\" — evaluated automatically",
      "(click)=\"window.location = '/products/' + product.id\"",
    ],
    answer: 1,
    topicPath: 'route-params',
    explanation: 'B is correct. The property-bound array form `[routerLink]="[\'/products\', product.id]"` composes the url from segments — dynamic values slot in as real values (numbers, strings) with proper encoding, and you can append `[queryParams]="{ ref: \'list\' }"`. A static string form (`routerLink="/about"`) suits fixed links only. Why others fail: (A) a raw href works but triggers a FULL page reload, discarding SPA state — and misses the router\'s base-href handling. (C) an unbracketed routerLink is a literal string; "product.id" is not evaluated. (D) window.location is a hard navigation and untestable inline code.',
  },
  {
    id: 336, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'Why use `routerLink` instead of a plain `href` for internal navigation?',
    options: [
      "href is entirely forbidden inside Angular templates",
      "href fully reloads the app; routerLink routes client-side",
      "routerLink is only needed for lazy-loaded routes anyway",
      "They behave identically since both of them just render anchors",
    ],
    answer: 1,
    topicPath: 'routing-basics',
    explanation: 'B is correct. The entire point of an SPA is client-side navigation: `routerLink` prevents the default anchor behavior and asks the Router to swap views — no page reload, state (stores, form data, scroll positions per strategy) survives, and navigation is near-instant. Crucially it still renders an actual `href` on the anchor, so middle-click/ctrl-click open-in-new-tab, link previews, and crawlers all work. Reserve raw `href` for EXTERNAL urls. Why others fail: (A) href is fine — for external links. (C) it applies to all internal routes. (D) the rendered anchor looks similar but the click behavior differs completely.',
  },
  {
    id: 337, type: 'multiple-choice', difficulty: 'junior', category: 'routing',
    question: 'What role does `<router-outlet />` play in a template?',
    options: [
      "It renders the routed component right INSIDE itself, like a div",
      "A placeholder; the component renders as a SIBLING after it",
      "It fetches the component's data before it is displayed",
      "An app can contain only a single router-outlet, ever",
    ],
    answer: 1,
    topicPath: 'routing-basics',
    explanation: 'B is correct. `<router-outlet>` marks WHERE routed content appears; the router instantiates the active component as a sibling node immediately after the outlet (inspect the DOM — the component tag sits next to `<router-outlet>`, not inside it). Everything else in the hosting template persists across navigations, which is how shells (header/nav/footer) work. Nesting: a route with `children` renders them into an outlet inside the PARENT route\'s component. Multiple named outlets (`name="sidebar"`) enable auxiliary routes. Why others fail: (A) sibling, not inside — a common DOM-inspection surprise. (C) data fetching is resolvers/services. (D) apps regularly have nested and named outlets.',
  },
  {
    id: 338, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'A list page holds filters in query params. How do you navigate without losing them, and what is the merge/preserve difference?',
    options: [
      "Query params always survive a navigation automatically",
      "Use \"preserve\" to keep params, or \"merge\" to combine them",
      "Store the params in localStorage and restore them manually",
      "Use a resolver to re-fetch the params after navigating",
    ],
    answer: 1,
    topicPath: 'route-params',
    explanation: 'B is correct. By default a navigation replaces the query string with whatever `queryParams` you pass (or nothing) — filters vanish. `queryParamsHandling: \'preserve\'` keeps the existing params and IGNORES newly passed ones; `\'merge\'` unions them with your new `queryParams` taking precedence — the right choice when adding a tab/sort key on top of live filters. The same option exists on `[routerLink]` via `queryParamsHandling`. Why others fail: (A) the default drops them — that is the very problem. (C) localStorage works but reinvents a built-in and breaks shareable urls. (D) resolvers fetch data; they do not restore urls.',
  },
  {
    id: 339, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'What is the difference between `router.navigate()` and `router.navigateByUrl()`?',
    options: [
      "They are identical; navigateByUrl is simply the legacy one",
      "navigate() takes a commands array; navigateByUrl() a full URL",
      "navigate() is synchronous while navigateByUrl() returns a promise",
      "navigateByUrl() bypasses all of the route guards entirely",
    ],
    answer: 1,
    topicPath: 'routing-basics',
    explanation: 'B is correct. `router.navigate([\'products\', id], { relativeTo: this.route, queryParams: {...} })` builds a UrlTree from parts and supports RELATIVE navigation — its power tool. `router.navigateByUrl(\'/products/42?tab=specs\')` treats the string as the complete new url (always absolute; extras like queryParams are ignored because they belong in the string). Both return `Promise<boolean>` and both run guards/resolvers. The login `returnUrl` pattern is the classic navigateByUrl use. Why others fail: (A) both are current, different-shaped APIs. (C) both are async promises. (D) nothing bypasses guards — they run for every router-initiated navigation.',
  },
  {
    id: 340, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'For /products/42?sort=price — what is the difference between `paramMap` and `queryParamMap` on ActivatedRoute?',
    options: [
      "They are two names for the same map of the whole URL",
      "paramMap holds path params; queryParamMap holds the ?query",
      "queryParamMap only works with the HashLocationStrategy",
      "paramMap contains numbers while queryParamMap holds strings",
    ],
    answer: 1,
    topicPath: 'route-params',
    explanation: 'B is correct. Route params are placeholders YOU declared in the route config (`path: \'products/:id\'`) and belong to a specific matched route; query params are the free-form `?sort=price&page=2` tail, readable from any ActivatedRoute since they apply url-wide. Both are string-valued (convert ids with Number()) and both come as `snapshot.paramMap` / `snapshot.queryParamMap` for one-shot reads or observables for same-component navigations. `withComponentInputBinding()` can map BOTH kinds onto component inputs. Why others fail: (A) they cover disjoint url sections. (C) query strings work with any location strategy. (D) everything in a url is a string.',
  },
  {
    id: 341, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'How do you give every routed page a proper document title?',
    options: [
      "Set document.title inside every component's constructor",
      "Use the route title property, or a custom TitleStrategy",
      "Titles can only ever be set once in the index.html file",
      "Add a <title> element inside each component's template",
    ],
    answer: 1,
    topicPath: 'routing-basics',
    explanation: 'B is correct. Since v14 the Router owns titles: `title: \'Products · Shop\'` on the route, or `title: resolveProductTitle` (a ResolveFn returning a string, so /products/:id can show the product name). For app-wide formatting, extend `TitleStrategy` and provide it — one class appends " · MyApp" everywhere instead of repeating it per route. This also fixes the SPA accessibility gap where screen readers announce the new title on navigation. Why others fail: (A) works but scatters the concern and misses non-component routes; the Title service predates the route-based API. (C) index.html only sets the initial title. (D) a <title> tag inside body markup is invalid HTML and ignored.',
  },
  {
    id: 342, type: 'multiple-choice', difficulty: 'mid', category: 'routing',
    question: 'Deep links like /products/42 return 404 from the web server (but work when navigating in-app). What is going on?',
    options: [
      "The Angular router is simply broken in all production builds now",
      "The server has no such file; rewrite unknown paths to index.html",
      "Deep links always require SSR in every possible case",
      "You must generate a physical HTML file for each route",
    ],
    answer: 1,
    topicPath: 'routing-basics',
    explanation: 'B is correct. Client-side routes exist only in JavaScript. In-app navigation never asks the server, but a hard refresh or shared link DOES — and a static server looks for a literal `/products/42` file, finds nothing, and 404s. The fix is a server-side rewrite/fallback rule (`try_files $uri /index.html` in nginx, `_redirects` on Netlify, etc.) so every app path serves index.html. `withHashLocation()` sidesteps it because the fragment is never sent to servers — at the cost of ugly #-urls and weaker SEO. Why others fail: (A) the router never runs — the failure is before the app loads. (C) SSR also solves it but is not required. (D) prerendering is one option, not a requirement.',
  },
  {
    id: 343, type: 'multiple-choice', difficulty: 'senior', category: 'routing',
    question: 'What does a custom `RouteReuseStrategy` let you do?',
    options: [
      "Reuse one component class across several different route paths",
      "Control whether a route's component is destroyed or stored",
      "Automatically deduplicate identical HTTP requests across routes",
      "Force every navigation to recreate all of its components",
    ],
    answer: 1,
    topicPath: 'router-children-lazy',
    explanation: 'B is correct. By default the router destroys the outgoing component and creates the incoming one (except param-only changes on the same route, which reuse the instance). A custom `RouteReuseStrategy` overrides five hooks — `shouldDetach`, `store`, `shouldAttach`, `retrieve`, `shouldReuseRoute` — so you can stash a detached component tree (typically keyed by route path in a Map) and reattach it later: the back-to-search-results-without-refetching pattern. Watch memory (stored trees are alive) and lifecycle expectations (no ngOnInit on reattach). Why others fail: (A) mapping one component to many paths is just route config. (C) HTTP caching is interceptors/services. (D) recreation is already the default.',
  },
  {
    id: 344, type: 'multiple-choice', difficulty: 'senior', category: 'routing',
    question: 'A "refresh" button re-navigates to the CURRENT url, but guards and resolvers do not re-run. Which router options fix this?',
    options: [
      "Impossible — same-url navigation is always a plain no-op",
      "onSameUrlNavigation \"reload\" plus runGuardsAndResolvers \"always\"",
      "Just call window.location.reload() — that is the intended API here",
      "Set every guard to return false once to force the refresh",
    ],
    answer: 1,
    topicPath: 'route-guards',
    explanation: 'B is correct. Two separate switches govern this. First, the router by default ignores navigation to the exact current url — `withRouterConfig({ onSameUrlNavigation: \'reload\' })` (or the same option per-navigate) makes it process the navigation anyway. Second, even a processed navigation only re-runs guards/resolvers when something RELEVANT changed — the route-level `runGuardsAndResolvers: \'always\'` (or `\'paramsOrQueryParamsChange\'`, or a custom predicate) widens that trigger. Together they enable in-place data refresh through the router pipeline. Why others fail: (A) it is configurable, not impossible. (C) a full reload throws away the SPA session — the heavyweight last resort. (D) returning false CANCELS navigation; it refreshes nothing.',
  },
  {
    id: 345, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'You need a writable "selected item" signal that automatically RESETS whenever the options list it depends on changes, but that the user can also set freely in between. Which primitive fits?',
    options: [
      "computed() — simply derive the current selection straight from the list",
      "linkedSignal(() => options()[0]) — writable, re-derives when source changes",
      "An effect() that watches the list and then calls selection.set() when it moves",
      "A plain signal plus a manual subscription kept in sync with the list here",
    ],
    answer: 1,
    topicPath: 'signals-advanced',
    explanation: 'B is correct. `linkedSignal` exists precisely for "local state that follows a source": it behaves like a computed on source changes (re-running the computation, resetting the selection) yet stays writable for user interaction. The advanced form — `linkedSignal({ source, computation: (src, previous) => … })` — even receives the previous value so you can PRESERVE the current selection when it still exists in the new list. Why others fail: (A) computed is read-only, so the user could never change the selection. (C) an effect that writes signals to derive state is the classic anti-pattern — it introduces an extra change-detection turn and a glitch window where list and selection disagree. (D) signals are not observables; there is no subscription API, and hand-wiring one via toObservable adds complexity linkedSignal removes.',
  },
  {
    id: 346, type: 'predict-output', difficulty: 'senior', category: 'signals',
    question: 'What does this log?',
    code: `const count = signal(1);
const double = computed(() => {
  console.log('computing');
  return count() * 2;
});
count.set(2);
count.set(3);
console.log(double());
console.log(double());`,
    options: [
      "\"computing\" three times (once per value), and then it prints 6, 6",
      "\"computing\" once, then 6, then 6 — computed is lazy and memoized here",
      "\"computing\", 6, \"computing\", 6 — every single read recomputes the body",
      "\"computing\", 2, then 6, 6 — the intermediate value 2 prints in between",
    ],
    answer: 1,
    topicPath: 'signals',
    explanation: 'B is correct. A `computed` does no work when its dependencies change — the two `set()` calls only mark it STALE. The body executes on the first actual read (`double()`), logging "computing" once and returning `3 * 2 = 6`. The second read finds the cached value still fresh (count has not changed since) and returns 6 without re-executing, so nothing else logs. This lazy + memoized contract is why you can build large computed graphs cheaply: unread branches cost nothing, and diamond-shaped dependencies evaluate once. Why others fail: (A) assumes eager recomputation on every set — that is Rx `map`, not signals. (C) assumes no memoization; repeated reads of a fresh computed are cache hits. (D) the first read happens AFTER both sets, so the intermediate value 2 (from count=1... doubled) is never produced.',
  },
  {
    id: 347, type: 'spot-the-bug', difficulty: 'senior', category: 'signals',
    question: 'This component keeps a running total. What is wrong with the approach?',
    code: `export class Cart {
  readonly items = signal<Item[]>([]);
  readonly total = signal(0);

  constructor() {
    effect(() => {
      this.total.set(
        this.items().reduce((sum, i) => sum + i.price, 0),
      );
    });
  }
}`,
    options: [
      "effect() cannot read signals at all — it must take them as arguments",
      "Derived state via an effect: total should be a computed(), not a write",
      "reduce() is simply not allowed to be used inside any reactive context",
      "The effect must be wrapped in untracked() to avoid an infinite loop here",
    ],
    answer: 1,
    topicPath: 'signals-advanced',
    explanation: 'B is correct. Anything that is a pure function of other signals belongs in `computed` — it is synchronous (no frame where `items` is new but `total` is stale), lazy, memoized, and cannot loop. The effect version updates `total` only after the effect flushes, so any computed or template reading both during that window sees inconsistent state, and the second signal write triggers another round of change detection. The Angular docs call this out directly: do not use effects to propagate state; use them for OUTWARD side effects — logging, localStorage, imperative DOM/chart APIs. Why others fail: (A) reading signals is exactly how effects track dependencies. (C) any plain JS is fine inside reactive contexts. (D) there is no loop here — the effect does not read `total` — and untracked changes tracking, not writability.',
  },
  {
    id: 348, type: 'spot-the-bug', difficulty: 'mid', category: 'signals',
    question: 'Clicking "add" never updates the list on screen. Why?',
    code: `export class Todos {
  readonly todos = signal<string[]>([]);

  add(todo: string) {
    this.todos().push(todo);
  }
}
// template: @for (t of todos(); track t) { <li>{{ t }}</li> }`,
    options: [
      "@for is fundamentally unable to iterate over the values held in a signal",
      "The array is mutated in place with push(); no set()/update() ever fires",
      "The track expression has to be $index whenever you use string arrays",
      "signal<string[]> is invalid syntax; arrays require the signal.array() form",
    ],
    answer: 1,
    topicPath: 'signals',
    explanation: 'B is correct. Signals notify when their value is SET through `.set()` or `.update()`; the default equality is reference-based (`Object.is`), and mutating the existing array bypasses the write path entirely — the graph never learns anything happened. `this.todos.update(list => [...list, todo])` creates a fresh array and pushes it through the signal, so the template re-renders. Treat signal-held objects and arrays as immutable; that is also what makes OnPush and zoneless scheduling reliable. Why others fail: (A) @for over `todos()` is the standard pattern. (C) `track t` vs `track $index` affects DOM reuse, not whether an update is detected. (D) there is no signal.array() — plain signal<T[]> is correct.',
  },
  {
    id: 349, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'What must you know before writing `readonly ticks = toSignal(interval(1000))` in a component?',
    options: [
      "toSignal waits for the first template read before it ever subscribes",
      "It subscribes at once, needs an injection context, reads undefined early",
      "It throws an error at you unless the source observable actually completes",
      "It re-subscribes to the source observable again on every single read",
    ],
    answer: 1,
    topicPath: 'rxjs-interop',
    explanation: 'B is correct — three separate contracts in one API. (1) Eager subscription: the interval starts on construction, not on first read. (2) Injection context: `toSignal` grabs `DestroyRef` to tear the subscription down automatically; call it in a field initializer/constructor or pass an injector, otherwise it throws. (3) The type is honest about timing: `Signal<number | undefined>` because a signal must ALWAYS have a value to read while the observable may not have emitted yet — `initialValue` fills the gap, and `requireSync: true` narrows the type when the source emits synchronously (BehaviorSubject, startWith), throwing if it actually does not. Why others fail: (A) subscription is eager, one of the main behavioral differences from the async pipe. (C) completion is fine — the signal keeps the last value. (D) one subscription for the signal lifetime; reads are cache reads.',
  },
  {
    id: 350, type: 'fill-blank', difficulty: 'mid', category: 'signals',
    question: 'Complete the signal-input declarations: the parent MUST provide a user, and size accepts "sm"/"md" strings but is stored as a number:',
    code: `export class UserCard {
  user = ____<User>();
  size = input(16, { ____: (v: 'sm' | 'md') => (v === 'sm' ? 12 : 16) });
}`,
    options: [
      "signal.required for the first blank and coerce for the second blank",
      "input.required for the first blank and transform for the second blank",
      "@Input({ required }) for the first blank and map for the second blank",
      "input.mandatory for the first blank and parse for the second blank here",
    ],
    answer: 1,
    topicPath: 'inputs',
    explanation: 'B is correct. Signal inputs come in two flavors: `input<T>(default)` and `input.required<T>()` — required inputs take no default (there is nothing to read before the parent binds) and missing bindings are a template TYPE-CHECK error, not a runtime surprise. The `transform` option converts the value the parent binds into the value the component stores — the classic examples being booleanAttribute/numberAttribute coercion or, as here, mapping a size keyword to pixels; the input signal then reads as the TRANSFORMED type. Why others fail: (A) signal.required does not exist — signals always need initial values; inputs are the special case. (C) decorator @Input is the legacy API and its option is `required: true`, not bare `required` — and it gives you a plain property, not a signal. (D) input.mandatory and parse are invented names.',
  },
  {
    id: 351, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'What does the resource()/httpResource() API give you over calling HttpClient yourself in ngOnInit?',
    options: [
      "Nothing real — it is only a bit of syntax sugar around subscribe()",
      "Signal-native async: tracked params, request abort, status/value signals",
      "It caches every single one of the responses into localStorage for you",
      "It makes HTTP calls fully synchronous so templates never need loading states",
    ],
    answer: 1,
    topicPath: 'resource-api',
    explanation: 'B is correct. `resource({ params, loader })` models the whole lifecycle of "async data that depends on reactive state": the params computation is tracked, each change cancels the outdated request via the provided AbortSignal (race-condition-free by construction — the switchMap of the signal world), and the result surfaces as signals — `value()`, `status()`, `error()`, `isLoading()` — that templates and computeds consume directly. `reload()` refetches on demand and setting `value` locally supports optimistic UI. `httpResource(() => url)` is the HttpClient-backed shorthand. Why others fail: (A) cancellation, status tracking, and reactivity are real behavior you would otherwise hand-write. (C) no persistence layer is involved. (D) the API embraces loading states — it just represents them as signals instead of booleans you juggle manually.',
  },
  {
    id: 352, type: 'multiple-choice', difficulty: 'senior', category: 'signals',
    question: 'A filter signal holds an object and is set to a structurally identical NEW object on every keystroke, re-running an expensive downstream computed each time. Best fix?',
    options: [
      "Wrap the downstream computed body in untracked() so it stops updating",
      "Give the signal a custom equal that compares fields, not object identity",
      "Debounce the keystrokes instead, since equality simply cannot be tuned",
      "Convert the object to a JSON string signal so the comparison works right",
    ],
    answer: 1,
    topicPath: 'signals-advanced',
    explanation: 'B is correct. Every signal (and computed) accepts `{ equal }`: when a write produces a value the function deems equal to the current one, the signal keeps the OLD value and notifies nobody — the dependency graph downstream never wakes up. That is precisely the tool for object-valued signals where semantic equality differs from reference equality. Note the flip side: with a custom equal, in-place mutations are even more invisible, so immutability discipline still applies. Why others fail: (A) untracked would DETACH the computed from its dependency — it stops updating even for real changes. (C) debouncing reduces frequency but every surviving write still spuriously propagates; and equality IS customizable. (D) JSON.stringify per write is a slow, fragile (key-order-dependent) way to get what `equal` expresses directly.',
  },
  {
    id: 353, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'How does a STANDALONE component enter TestBed, and how do you replace one of its heavyweight child components in a test?',
    options: [
      "declarations: [UserCard] — exactly the same as the NgModule components",
      "imports: [UserCard]; swap a child via TestBed.overrideComponent imports",
      "They cannot be TestBed-tested at all; only constructor unit tests work here",
      "providers: [UserCard] — standalone components are treated as injectables",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct. A standalone component is imported, not declared — `declarations` is for NgModule-owned classes and putting a standalone component there is an error. Because the component brings its OWN imports array, stubbing a child is no longer a module concern: `TestBed.overrideComponent` surgically removes the real child from the component\'s imports metadata and adds a fake with the same selector/inputs. Providers can be overridden the same way or with TestBed.overrideProvider. Why others fail: (A) declarations rejects standalone classes. (C) TestBed fully supports standalone — it is the primary path now. (D) providers is for injectables; a component in providers is just a useless factory registration, not a renderable declaration.',
  },
  {
    id: 354, type: 'predict-output', difficulty: 'senior', category: 'testing',
    question: 'What does this fakeAsync test log?',
    code: `it('advances virtual time', fakeAsync(() => {
  let msg = 'none';
  setTimeout(() => (msg = 'first'), 1000);
  setTimeout(() => (msg = 'second'), 3000);
  tick(2000);
  console.log(msg);
  flush();
  console.log(msg);
}));`,
    options: [
      "\"none\" then \"none\" — the timers just never fire inside a fakeAsync zone",
      "\"first\" then \"second\" — tick(2000) runs the 1s timer; flush() the 3s one",
      "\"first\" then \"first\" — because flush() only ever flushes the microtasks",
      "It throws: you are not allowed to mix tick() and flush() in one test here",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct. Inside `fakeAsync`, time is a number Angular controls: `setTimeout` registers into a virtual queue and nothing fires until you move the clock. `tick(2000)` moves it to t=2000 — the 1000ms callback runs synchronously during the call (msg = "first"), the 3000ms one stays pending. `flush()` says "run whatever timers remain, however far ahead they are", executing the second callback (msg = "second"). One more rule: a fakeAsync test that ENDS with pending timers throws — flush(), discardPeriodicTasks(), or enough tick() calls must clean the queue. Why others fail: (A) timers fire fine — under your control. (C) flushMicrotasks() is the microtask-only variant; flush() targets the timer queue. (D) mixing tick and flush is routine.',
  },
  {
    id: 355, type: 'spot-the-bug', difficulty: 'mid', category: 'testing',
    question: 'This HttpTestingController test fails with "Expected one matching request, found none". Why?',
    code: `it('loads users', () => {
  const users$ = service.getUsers(); // returns http.get<User[]>('/api/users')

  const req = httpTesting.expectOne('/api/users');
  req.flush([{ id: 1 }, { id: 2 }]);
});`,
    options: [
      "expectOne needs the full absolute URL, including the host, to match here",
      "Nobody subscribed — http.get() is cold, so no request left; subscribe first",
      "flush() simply has to be called before expectOne(), not the other way round",
      "The fake body must be JSON.stringify-ed first before you flush it in here",
    ],
    answer: 1,
    topicPath: 'testing-services-http',
    explanation: 'B is correct. Cold observables do work per subscriber, and HttpClient is strictly cold: `getUsers()` merely BUILDS the request description. Until something subscribes, `HttpTestingController` has recorded zero requests, so `expectOne` correctly reports none. The working shape is: subscribe (stashing results or using firstValueFrom + await after flush), THEN expectOne, THEN req.flush(body) — flush makes the response arrive and the subscriber assertion run. Finish with httpTesting.verify() in afterEach so stray unexpected requests fail loudly. Why others fail: (A) relative URLs match fine — expectOne matches what the app requested. (C) flush belongs to the TestRequest that expectOne returns; the order cannot invert. (D) flush takes the deserialized body directly.',
  },
  {
    id: 356, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'A component test asserts DOM immediately after clicking a button and passes with zone.js but shows STALE DOM in a zoneless app. What is the robust pattern?',
    options: [
      "Add an arbitrary setTimeout right before you assert on the DOM state here",
      "Use autoDetectChanges() and await whenStable() before asserting on the DOM",
      "Call detectChanges() twice in a row — the second one always catches up here",
      "Zoneless apps just cannot be tested against the DOM; test class fields only",
    ],
    answer: 1,
    topicPath: 'zoneless',
    explanation: 'B is correct. Zoneless removes the "zone saw your click and synchronously ran app-wide CD" behavior tests silently relied on; instead a click handler notifies the scheduler, which renders shortly after. Tests should mirror that: automatic change detection plus `await fixture.whenStable()` gives you the post-render DOM deterministically, and works identically in zone and zoneless apps (which also makes it the right migration-proof style). Manual `detectChanges()` still works but can PAPER OVER real scheduling bugs — the test forces a render the app might never perform. Why others fail: (A) sleeping is flaky and slow — whenStable resolves exactly when work settles. (C) double detectChanges is cargo-culting; the reliable primitive is awaiting stability. (D) DOM testing is fully supported zoneless — only the flush mechanism changed.',
  },
  {
    id: 357, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'A service effect() persists a signal to localStorage. The unit test sets the signal and asserts localStorage on the next line — and fails. Why, and what is the fix?',
    options: [
      "Effects simply cannot ever run inside of a TestBed unit test environment",
      "Effects are scheduled, not synchronous; call TestBed.tick() then assert",
      "localStorage is read-only when you are running inside of the test harness",
      "Signals must be declared with { effects: true } before they are observable",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct. An effect marks itself dirty when a dependency changes and runs at the next FLUSH point — during change detection for component effects, at scheduler ticks for root/injector effects. A bare `TestBed.inject(MyService)` test has no fixture and never renders, so the flush never comes; the assertion runs before the effect body ever has. `TestBed.tick()` triggers application synchronization (running pending effects); in component tests, `fixture.detectChanges()`/`whenStable` does it as a side effect of rendering. The same scheduling rule explains why the effect also did not run at construction time in the test. Why others fail: (A) effects run fine in TestBed once something flushes. (C) localStorage works normally (jsdom/browser). (D) there is no such option — every signal is trackable.',
  },
  {
    id: 358, type: 'fill-blank', difficulty: 'mid', category: 'testing',
    question: 'Complete the test so the signal-input receives a value and the DOM reflects it:',
    code: `const fixture = TestBed.createComponent(UserCard);
fixture.componentRef.____('user', { name: 'Ada' });
____;
expect(fixture.nativeElement.textContent).toContain('Ada');`,
    options: [
      "setProperty for the first blank and fixture.autoDetect() for the second",
      "setInput first, then detectChanges()/whenStable() — the only supported way",
      "user.set for the first blank and TestBed.flush() for the second blank here",
      "Direct assignment for the first blank and nothing at all for the second",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct. `input()` produces an `InputSignal` — reading it calls it like a function, and there is no setter on the instance, so `componentInstance.user = value` is a type error (and with decorator inputs it silently skipped transforms and OnPush marking anyway). `fixture.componentRef.setInput(name, value)` goes through the real input pipeline: transform functions run, `markForCheck`-equivalent dirtying happens, and ngOnChanges fires for decorator inputs. Then the DOM assertion needs a render — `detectChanges()` or auto-detect + `await whenStable()`. Why others fail: (A) setProperty targets DOM properties via the renderer, and autoDetect is enabled BEFORE interactions, not called as a flush. (C) input signals expose no .set — only the component template/parent or setInput feed them. (D) assignment fails on read-only signal inputs — exactly the situation setInput exists for.',
  },
  {
    id: 359, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'Why drive UI-library widgets through component test harnesses (MatButtonHarness etc.) instead of querying their DOM directly?',
    options: [
      "Harnesses run tests in a real browser, whereas CSS queries simply cannot",
      "A stable semantic API over internal DOM; one code path for unit and e2e",
      "They make the tests faster mainly by skipping the rendering step entirely",
      "They are required — Material components throw when they are queried directly",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct — the CDK harness contract has three payoffs. Stability: the harness ships WITH the component, so when mat-select\'s internal markup changes, the harness is updated by the library and your `selectHarness.clickOptions(…)` keeps working, where a `.mat-select-trigger` query silently rots. Portability: `TestbedHarnessEnvironment` and e2e environments implement the same `HarnessLoader` interface, so page-object logic is written once. Determinism: each harness interaction flushes change detection and awaits stability before returning, killing a whole class of "assert before render" flakes — including in zoneless apps. Why others fail: (A) environment choice is orthogonal — TestBed harness tests run in the same runner as other unit tests. (C) rendering still happens; nothing is skipped. (D) direct queries work, they are just brittle — harnesses are a convention, not an enforcement.',
  },
  {
    id: 360, type: 'spot-the-bug', difficulty: 'senior', category: 'testing',
    question: 'This test is green today — and would STAY green if the filtering logic broke completely. What is the flaw?',
    code: `it('emits only active items', () => {
  service.activeItems$.subscribe(items => {
    expect(items.every(i => i.active)).toBe(true);
  });
});`,
    options: [
      "subscribe() is just not allowed to be used inside of an it() block here",
      "It passes vacuously if nothing emits; use firstValueFrom so silence fails",
      "every() is simply not allowed to be called from inside an expect() call",
      "The subscription leaks memory, which will eventually fail the whole suite",
    ],
    answer: 1,
    topicPath: 'testing-services-http',
    explanation: 'B is correct — the assertion lives inside a callback whose execution is OPTIONAL. If `activeItems$` becomes async (a delay, a switchMap to HTTP), or errors, or never emits, the subscribe callback does not run before the synchronous test body ends, no expectation executes, and the runner reports success. `await firstValueFrom(obs)` inverts the contract: no emission → rejected promise → failed test; the value comes back to the test body where assertions are guaranteed to run. Alternatives with the same property: done callbacks (fail by timeout), expect.assertions(1) (Vitest/Jest, fails when the count is off), or marble testing. Why others fail: (A) subscribing in tests is legal, just assertion-unsafe as shown. (C) any boolean expression works in expect. (D) one dangling test subscription is untidy but will not fail anything — which is exactly the problem.',
  },
  {
    id: 361, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'A heavy chart component sits below the fold. Which @defer configuration loads it best?',
    options: [
      "@defer (on immediate) — just load absolutely everything up front, ready",
      "@defer (on viewport; prefetch on idle) with a sized @placeholder slot",
      "@defer (when isVisible()) polling a scroll listener that you write by hand",
      "Wrap the whole thing in @if (false) and flip the flag in ngAfterViewInit",
    ],
    answer: 1,
    topicPath: 'deferrable-views',
    explanation: 'B is correct — and the separation of the two triggers is the senior detail. `on viewport` (an IntersectionObserver on the @placeholder content) gates INSTANTIATION, keeping main-thread work out of startup. `prefetch on idle` gates only the network FETCH, so by the time the user scrolls down, the JavaScript is usually already in cache — no spinner at the moment of visibility. The placeholder both reserves layout (avoiding CLS) and provides the element the observer watches. Dependencies must be otherwise-unreferenced (no @ViewChild into the deferred block, no eager import elsewhere) or they stay in the main bundle. Why others fail: (A) on immediate still splits the chunk but downloads AND instantiates at startup — the work you were avoiding. (C) hand-rolled visibility tracking recreates `on viewport` worse, and @defer (when …) never code-splits reactively better than triggers. (D) @if hides rendering but the import keeps the chart in the initial bundle.',
  },
  {
    id: 362, type: 'spot-the-bug', difficulty: 'mid', category: 'performance',
    question: 'Sorting this list makes row components lose their expanded/edit state, and profiling shows every row re-rendering. The data items have stable ids. What is wrong?',
    code: `@for (user of sortedUsers(); track $index) {
  <app-user-row [user]="user" />
}`,
    options: [
      "@for is simply not able to render component elements, only plain old HTML",
      "track $index keys DOM by position, not identity; use track user.id instead",
      "The track expression has to be a function here, not a plain property access",
      "sortedUsers() is required to return a readonly array for the tracking work",
    ],
    answer: 1,
    topicPath: 'control-flow-for',
    explanation: 'B is correct. The track expression is the identity key for DOM reuse. With `$index`, a reorder looks like "every position kept its identity but all the DATA changed" — Angular rebinds N inputs, child components re-run their input-driven logic, and any state living inside a row (an open accordion, a half-typed input, focus) stays at its old POSITION while its data moves elsewhere: the classic wrong-row bug. With `track user.id`, the same reorder is "identities moved" — Angular moves the existing DOM nodes, zero rebinds, state travels with its item. $index is only right when items truly have no identity (static lists, primitive duplicates). Why others fail: (A) @for renders components fine. (C) property access is the normal form — trackBy FUNCTIONS were the old NgFor API. (D) mutability of the array is irrelevant to tracking.',
  },
  {
    id: 363, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'What do you get by switching <img src="hero.jpg"> to <img ngSrc="hero.jpg" width="800" height="400" priority>?',
    options: [
      "It does automatic conversion of the image over to WebP on the client side",
      "It enforces perf best practices: dimensions, lazy-load, priority, srcset",
      "It inlines the whole image as a base64 data URI straight into the bundle",
      "It only ever works when you are using one of the Angular-hosted CDNs here",
    ],
    answer: 1,
    topicPath: 'performance',
    explanation: 'B is correct. The directive encodes the Core-Web-Vitals checklist a performance reviewer would apply by hand. Dimensions (or fill mode) prevent layout shift; below-the-fold images get loading="lazy" decoding="async" for free; the ONE above-the-fold hero gets `priority`, which flips it to eager + fetchpriority=high and (with SSR) emits a <link rel="preload">, directly attacking LCP. Loader functions integrate image CDNs so srcset/sizes emit automatically, and dev-mode diagnostics warn about oversized or distorted images. Client-side format conversion is not something a directive can do — that is the CDN\'s job via the loader. Why others fail: (A) format negotiation happens at the server/CDN. (C) nothing is inlined; URLs are rewritten. (D) any host works — loaders exist for generic and custom CDNs.',
  },
  {
    id: 364, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'In a zoneless application, what actually causes change detection to run?',
    options: [
      "A polling loop that Angular quietly runs on every single animation frame",
      "Explicit notifications only: signal reads, async pipe, markForCheck, events",
      "Every macrotask, in exactly the same way as zone.js but implemented natively",
      "Only the router navigations and the HTTP responses ever cause it to run",
    ],
    answer: 1,
    topicPath: 'zoneless',
    explanation: 'B is correct. Zone.js made EVERY async completion a CD trigger — safe but wasteful (a mousemove that changes nothing still runs app-wide dirty checking). Zoneless inverts the contract: the framework renders when something it can SEE changes — signal writes into read signals, AsyncPipe emissions, explicit markForCheck, listener callbacks — and the scheduler coalesces bursts into one pass. The migration hazard is exactly the plain-field case: `setTimeout(() => this.count++)` renders under zone.js by accident and never renders zoneless; the fix is making state reactive (signals) rather than sprinkling markForCheck. This is also why OnPush-with-signals apps migrate almost for free. Why others fail: (A) no polling — idle apps do zero work, part of the point. (C) reproducing zone semantics without zones is what zoneless deliberately abandons. (D) router/HTTP matter only insofar as they end in signal/AsyncPipe/listener updates like everything else.',
  },
  {
    id: 365, type: 'multiple-choice', difficulty: 'senior', category: 'performance',
    question: 'With SSR + incremental hydration (withIncrementalHydration and @defer hydrate triggers), what happens to a section marked @defer (hydrate on interaction)?',
    options: [
      "It is skipped entirely during server rendering and stays blank until clicked",
      "Server renders real HTML that stays inert; JS hydrates on the interaction",
      "It hydrates right away, immediately — hydrate triggers only affect dev builds",
      "The section renders twice: on the server, then again from scratch on client",
    ],
    answer: 1,
    topicPath: 'hydration',
    explanation: 'B is correct. Incremental hydration decouples "visible" from "interactive": full HTML arrives from the server (SEO and perceived performance keep their SSR benefits), but the deferred subtree\'s code is excluded from the initial client work — less JS parsed, less hydration CPU, better TTI/INP on the pages that need it most. `hydrate on interaction/viewport/idle` etc. choose the wake-up moment; hydration happens IN PLACE against the existing DOM (the non-destructive kind), and event replay (withEventReplay) captures the interaction that arrived before hydration finished and re-dispatches it after, so the triggering click actually does something. Why others fail: (A) blank-until-clicked describes plain @defer WITHOUT SSR hydration triggers — incremental hydration exists to avoid exactly that. (C) hydrate triggers are the production feature, not a dev toggle. (D) re-rendering from scratch is destructive hydration, the legacy fallback this replaces.',
  },
  {
    id: 366, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'A template shows {{ calculateTotal() }} where calculateTotal is a component METHOD looping over the cart. Why do performance guides flag this, and what replaces it?',
    options: [
      "Method calls placed in templates are actually compile errors in strict mode",
      "It re-runs on every CD cycle; replace it with a memoized computed() value",
      "Methods run outside of the zone, so the total is never going to update at all",
      "It is completely fine — Angular caches template method call results for you",
    ],
    answer: 1,
    topicPath: 'performance',
    explanation: 'B is correct. An interpolated method call is an opaque expression: change detection must re-evaluate it every pass because anything could have changed its result. On default (non-OnPush, zone) components that means every async event app-wide re-runs your loop; even under OnPush it runs on every check of that component. `computed()` flips the model — the dependency graph knows EXACTLY when cart items changed and memoizes otherwise, so template reads between changes are cache hits. Pure pipes solve the same problem via input-reference memoization when the source is a bound value rather than a signal. (Cheap property-access getters are fine; it is per-check WORK that hurts.) Why others fail: (A) legal, merely costly. (C) template expressions run during CD, inside the zone — updating is not the issue, over-updating is. (D) no such caching exists for method calls; that is precisely what computed/pipes add.',
  },
  {
    id: 367, type: 'multiple-choice', difficulty: 'mid', category: 'performance',
    question: 'A zone-based app draws on a canvas from a mousemove listener and profiling shows change detection running hundreds of times per second. The drawing touches no template state. Fix?',
    options: [
      "Throttle the listener down to one event per second and accept choppy drawing",
      "Register it via ngZone.runOutsideAngular so no CD is scheduled per event",
      "Set the whole component to ChangeDetectionStrategy.OnPush to stop the CD here",
      "Move the whole canvas into a Web Worker; DOM listeners cannot be optimized",
    ],
    answer: 1,
    topicPath: 'performance',
    explanation: 'B is correct. Zone.js patches addEventListener, so every mousemove ends with an application-wide tick even though nothing data-bound changed. `runOutsideAngular` executes the registration in the parent zone: events still fire, the canvas still draws at 60fps, but Angular is never notified — CD cost drops to zero for the hot path. The escape hatch composes with re-entry: `zone.run()` for the rare state-affecting event, or better, write a signal (signals do not need the zone at all — they notify the scheduler directly, which is also why this whole pattern dissolves under zoneless). Why others fail: (A) trades UX for a problem that has a free solution. (C) OnPush skips the component\'s own re-render but the zone still triggers app ticks; template listeners also mark OnPush components dirty anyway. (D) workers cannot touch the DOM/canvas element directly (barring OffscreenCanvas plumbing) — vast machinery for a one-line fix.',
  },
  {
    id: 368, type: 'spot-the-bug', difficulty: 'senior', category: 'performance',
    question: 'Users report the app getting slower the longer they navigate around. This dashboard component is on the busiest route. Find the leak:',
    code: `@Component({ /* … */ })
export class Dashboard {
  readonly now = signal(new Date());

  constructor() {
    interval(1000).subscribe(() =>
      this.now.set(new Date()),
    );
  }
}`,
    options: [
      "signal(new Date()) is allocating far too much memory on every single tick",
      "The interval subscription is never torn down; use takeUntilDestroyed()",
      "Signals just must not ever be written from inside a subscribe() callback",
      "interval() drifts over time and so it must be replaced with a setInterval",
    ],
    answer: 1,
    topicPath: 'rxjs-interop',
    explanation: 'B is correct — the textbook Angular memory leak, made worse by living on a hot route. Each navigation constructs a new Dashboard, each constructor opens an infinite subscription, and destruction does NOT magically unsubscribe: the closure captures `this`, the retained component keeps its whole object graph alive (GC cannot collect it), and after N visits N timers run every second — the "slower over time" signature. `takeUntilDestroyed()` is the modern one-liner: called in an injection context it grabs DestroyRef automatically and completes the stream when the component is destroyed; the explicit alternatives are `inject(DestroyRef).onDestroy(() => sub.unsubscribe())` or the classic ngOnDestroy. (A timer this simple could also just be an effect-free `afterNextRender` + setInterval with cleanup, but the subscription discipline is the exam point.) Why others fail: (A) allocation per second is trivial; retention is the problem. (C) writing signals from subscriptions is normal and fine. (D) drift is real but cosmetic here — it neither leaks nor slows the app.',
  },
  {
    id: 369, type: 'multiple-choice', difficulty: 'junior', category: 'i18n',
    question: 'What does adding the i18n attribute to an element actually do?',
    code: `<h1 i18n="site header|Greeting shown on the landing page@@homeGreeting">
  Welcome back!
</h1>`,
    options: [
      "It translates the text at runtime via a translation API call",
      "It marks content for extraction and build-time replacement",
      "It enables right-to-left layout when the locale requires it",
      "It restricts the element to only render for non-English users",
    ],
    answer: 1,
    topicPath: 'i18n',
    explanation: 'B is correct. Angular\'s built-in i18n is a compile-time pipeline: mark text with `i18n` (the syntax is `meaning|description@@customId` — the meaning disambiguates identical source strings, the description helps translators, the @@id keeps the unit stable when text changes), run `ng extract-i18n` to produce an XLF/XMB file, hand it to translators, then build once per locale with the translated file. Because substitution happens during the build, the shipped bundle contains only the final strings — no dictionary lookups, no flash of untranslated text. Why others fail: (A) nothing happens at runtime; there is no API call and no dynamic switching in the built-in flow. (C) direction comes from the `dir` attribute/locale data, not from marking text. (D) i18n never conditions rendering — every user sees the element, in their build\'s language.',
  },
  {
    id: 370, type: 'multiple-choice', difficulty: 'mid', category: 'i18n',
    question: 'What does this ICU expression render, and why is it better than an @if chain?',
    code: `<span i18n>{count, plural,
  =0 {no messages}
  one {one message}
  other {{{count}} messages}
}</span>`,
    options: [
      "It only saves typing; an @if/@else chain compiles the same",
      "It branches by the locale's CLDR plural rules, set in the file",
      "It memoizes the string so change detection skips the span",
      "ICU syntax is now deprecated in favor of a built-in plural pipe",
    ],
    answer: 1,
    topicPath: 'i18n',
    explanation: 'B is correct — the point of ICU plurals is that plural GRAMMAR is locale-specific. English has two forms (one/other), Arabic has six, Polish needs few/many; CLDR defines the categories per language and the ICU message carries all branches as ONE translation unit, so the translator supplies whatever forms their language needs. `=0` style exact matches layer on top for special-casing. An @if chain freezes the source language\'s rules into the template: a Polish translator has nowhere to put the `few` form because the branching lives in code, not in the translatable message. ICU `select` does the same for non-numeric variants (gender, status). Why others fail: (A) the outputs differ fundamentally — one is a single translatable unit with locale-driven branching, the other is untranslatable control flow around fragments. (C) ICU has no change-detection semantics. (D) ICU is the current, supported mechanism; there is no plural pipe in Angular.',
  },
  {
    id: 371, type: 'spot-the-bug', difficulty: 'mid', category: 'i18n',
    question: 'The template is fully marked with i18n, yet German users still see English text in the toast. Where is the leak?',
    code: `@Component({ /* … */ })
export class Cart {
  private readonly toast = inject(ToastService);

  remove(item: CartItem): void {
    this.toast.show('Removed ' + item.name + ' from your cart');
  }
}`,
    options: [
      "ToastService must be provided in the root injector for translations to load",
      "The string is built in TypeScript, so extraction misses it — use $localize",
      "String concatenation with + is not allowed in zoneless apps",
      "The i18n attribute is missing from the component decorator",
    ],
    answer: 1,
    topicPath: 'i18n',
    explanation: 'B is correct. Template `i18n` attributes cover only what lives in templates; any user-facing string born in TypeScript — toasts, dialog titles, validation messages, document.title — must be tagged with the `$localize` template literal (from @angular/localize) to enter the extraction pipeline. `$localize` supports the same `:meaning|description@@id:` prefix and NAMED placeholders (`\${expr}:name:`), which matters because translators must be able to REORDER the placeholder: German might say "…aus dem Warenkorb entfernt: NAME". The original concatenation is doubly broken — invisible to extraction AND word-order-locked. Why others fail: (A) injector scope has nothing to do with extraction. (C) concatenation is legal everywhere; it is just untranslatable. (D) there is no i18n field on @Component — marking happens per string, not per class.',
  },
  {
    id: 372, type: 'multiple-choice', difficulty: 'senior', category: 'i18n',
    question: 'How does built-in Angular i18n actually DELIVER multiple languages to production, and what is the main trade-off?',
    options: [
      "One single bundle holds every language; a runtime switch flips instantly",
      "One build per locale with translations baked in; you redirect to switch",
      "Translations are fetched as JSON on startup and applied by a pipe",
      "Each lazy route downloads only its own language file on demand",
    ],
    answer: 1,
    topicPath: 'i18n',
    explanation: 'B is correct. With `"localize": true` (or an array of locales) in angular.json, the build compiles the app once, then generates a per-locale variant by substituting translation units into the templates — the docs call this build-time inlining. Deployment is directory-per-locale behind content negotiation (Accept-Language redirect, path prefix like /de/, or user preference cookie). The strengths and the constraint are two sides of one fact: because strings are inlined, there is no translation lookup at runtime and dead branches per locale can be optimized, but the running app knows only its own language — in-place switching requires a full navigation to the other build. Teams that need live switching typically reach for runtime libraries (Transloco/ngx-translate) and accept dictionary lookups instead. Why others fail: (A) describes runtime i18n libraries, not the built-in pipeline. (C) same — built-in i18n fetches nothing at startup. (D) locale granularity is per-app, not per-route; lazy chunks within the German build are still all-German.',
  },
  {
    id: 373, type: 'fill-blank', difficulty: 'mid', category: 'i18n',
    question: 'Complete the template so the title ATTRIBUTE (not just the text content) gets translated:',
    code: `<button
  title="Download the yearly report"
  ______
  i18n>
  Download
</button>`,
    options: [
      "i18n-title — attributes are marked with the i18n-<name> prefix",
      "[title.i18n]=\"true\" — attribute translation uses a binding flag",
      "translate=\"title\" — a translate attribute lists what to localize",
      "i18n=\"title\" — the i18n attribute takes the attribute name",
    ],
    answer: 0,
    topicPath: 'i18n',
    explanation: 'A is correct — `i18n-title` is the marker for translating the title attribute, and the pattern generalizes: `i18n-alt` for image alt text, `i18n-placeholder` for inputs, `i18n-aria-label` for accessibility labels. Each i18n-x attribute creates a separate unit in the extraction file and accepts the same `meaning|description@@customId` value syntax as element-content i18n. Forgetting these is the classic "the page is translated but tooltips, alts and aria-labels are still English" bug — attribute text is invisible on screen-reading the page casually, so it slips through review, and for aria-label it is an accessibility failure for non-English screen-reader users. Why others fail: (B) there is no i18n binding flag syntax. (C) a translate attribute belongs to third-party runtime libraries, not built-in i18n. (D) the plain i18n attribute\'s VALUE is the meaning/description/id metadata for the element\'s CONTENT — it does not name attributes.',
  },
  {
    id: 374, type: 'multiple-choice', difficulty: 'senior', category: 'i18n',
    question: 'A Swiss-German build (locale de-CH) shows dates as 3/15/2026 and currency as $ instead of CHF formats. The DatePipe and CurrencyPipe are used correctly. What is missing?',
    options: [
      "Pass the locale on each and every call, e.g. date:\"medium\":\"\":\"de-CH\"",
      "The CLDR locale data was never registered; pipes fall back to en-US",
      "The pipes only support English; use Intl.DateTimeFormat directly",
      "The server must send a Content-Language: de-CH header to switch",
    ],
    answer: 1,
    topicPath: 'i18n',
    explanation: 'B is correct — formatting is a two-part contract: LOCALE_ID tells pipes WHICH locale to use, and registered CLDR locale data tells them HOW that locale formats dates, numbers and currencies (day order, separators, currency symbol placement — de-CH uses apostrophe-grouped numbers like 1\'234.50). Angular ships only en-US data by default to keep bundles lean, so an unregistered locale silently degrades to US formats. The i18n build pipeline wires both for you per locale build; hand-rolled setups (or runtime-i18n apps) must call `registerLocaleData(localeDeCh)` (data imported from @angular/common/locales/de-CH) and provide LOCALE_ID — and CurrencyPipe additionally defaults its currency CODE from DEFAULT_CURRENCY_CODE, which you set to CHF. Why others fail: (A) per-call locale arguments work but still require the locale data to be registered, and repeating the locale at every call site is exactly what LOCALE_ID exists to avoid. (C) the pipes are Intl/CLDR-driven and support every registered locale. (D) HTTP headers never reach pipe internals.',
  },
  {
    id: 375, type: 'multiple-choice', difficulty: 'junior', category: 'a11y',
    question: 'A code review flags this "button". What is actually broken about it for keyboard and screen-reader users?',
    code: `<div class="btn" (click)="save()">Save</div>`,
    options: [
      "Nothing — (click) works the same on any element, style only",
      "No focus, no Enter/Space activation, no button role announced",
      "The div fires click twice on touch devices, double-saving",
      "Divs cannot receive (click) bindings in zoneless applications",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct — this is the canonical "use the platform" lesson. Native <button> ships focusability, Enter/Space activation (with Space correctly suppressing page scroll), the implicit `button` role, form semantics (`type`), and correct disabled behavior, all tested across every browser and assistive technology. The clickable div has none of that: keyboard-only users cannot reach it, and screen-reader users hear undifferentiated text. The ARIA spec\'s own first rule is to prefer the native element over retrofitting role+tabindex+key handlers — every hand-rolled piece is a place to get Space-vs-Enter or focus styling subtly wrong. Angular-specific note: (click) on a div binds fine, which is exactly why templates like this pass code review — the framework cannot know the element\'s semantics are wrong. Why others fail: (A) (click) firing is the ONLY thing that works; the accessibility contract is absent. (C) double-fire on touch is not a div-vs-button issue. (D) zoneless changes scheduling, not event binding.',
  },
  {
    id: 376, type: 'spot-the-bug', difficulty: 'mid', category: 'a11y',
    question: 'The toolbar looks perfect, but a screen-reader user hears only "button… button… button". Fix the root cause:',
    code: `<button type="button" (click)="edit()">
  <mat-icon>edit</mat-icon>
</button>
<button type="button" (click)="remove()">
  <mat-icon>delete</mat-icon>
</button>`,
    options: [
      "mat-icon requires the fontIcon input instead of text content",
      "Icon-only buttons have no accessible name; add aria-label",
      "Buttons may not contain custom elements; move icons outside",
      "The buttons need tabindex=\"0\" to be announced correctly",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. An element\'s accessible name is computed from (in priority order) aria-labelledby, aria-label, then text content; an icon-only button yields either nothing or — worse with ligature icon fonts — the raw ligature text like "delete" being announced in some configurations while others get silence. `aria-label` supplies a stable, translatable name (remember `i18n-aria-label`), and `aria-hidden="true"` on the mat-icon keeps the decorative glyph from double-announcing. A visually-hidden <span class="cdk-visually-hidden">Edit</span> is an equivalent fix that also benefits voice-control users, who can then say the visible-ish name. This is one of the most common real-world audit findings because the UI looks completely fine. Why others fail: (A) fontIcon changes how the glyph renders, not the name computation. (C) buttons can contain any phrasing content including components. (D) native buttons are already focusable and focus order is not the problem — the NAME is.',
  },
  {
    id: 377, type: 'multiple-choice', difficulty: 'mid', category: 'a11y',
    question: 'You are building a custom modal dialog (no Material/CDK Dialog). Which keyboard/focus behavior is REQUIRED, and what does the Angular CDK give you for it?',
    options: [
      "Dialogs only need a close button; focus is a nice-to-have",
      "Trap focus inside, return it on close; CDK cdkTrapFocus helps",
      "Set tabindex=\"-1\" on everything behind it by walking the DOM",
      "Just add autofocus to the first input; the browser does the rest",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct — this is the WAI-ARIA dialog pattern, and every piece exists because of what happens without it: if focus stays on the trigger, a screen-reader user "opens" a dialog they cannot find; if Tab escapes the dialog, keyboard users interact with controls they cannot see behind the overlay; if focus is not restored on close, the user is dumped at the document top and loses their place. The CDK ships the hard parts: `cdkTrapFocus` (with cdkTrapFocusAutoCapture to capture and later restore focus) implements the wrap-around trap, and pairing it with role="dialog", aria-modal="true" and an aria-labelledby pointing at the title completes the semantics. Escape-to-close and click-outside remain yours to wire. (Using CDK Dialog/Overlay gets all of this pre-assembled — the exam point is knowing WHAT the contract is.) Why others fail: (A) without focus management the dialog is unusable non-visually, not merely less polished. (C) hiding the background from the TAB ORDER is what the trap does, but you also need aria-modal/inert semantics — hand-walking the DOM misses dynamically added content and is exactly the wheel CDK invented. (D) autofocus addresses only the entry half of the contract, and unreliably.',
  },
  {
    id: 378, type: 'multiple-choice', difficulty: 'senior', category: 'a11y',
    question: 'After an async save, a toast appears for 4 seconds: <div class="toast">Saved!</div>. Sighted users see it; screen-reader users get nothing. What is the correct mechanism?',
    options: [
      "Move focus onto the toast so the reader is forced to read it",
      "A live region (aria-live/role=status) announces without focus",
      "Add aria-label=\"Saved!\" to the toast div when it appears",
      "Screen readers automatically read any element added to the DOM",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. Live regions solve the "something changed elsewhere on the page" problem: focus stays where the user is working, and the assistive tech inserts the announcement into its speech queue — `polite` waits for the current utterance, `assertive` (role="alert") interrupts and is reserved for urgent errors. The pre-existing-element requirement is the classic gotcha: injecting a div that ALREADY contains aria-live text often goes unannounced because the accessibility tree never saw a change WITHIN a tracked region; you render the empty region up front and swap its text content. `LiveAnnouncer` from @angular/cdk/a11y encapsulates all of this behind announce(message, politeness), which is why toast/snackbar services should call it (Material\'s MatSnackBar already does). Why others fail: (A) stealing focus from a form to a transient toast is hostile — focus loss mid-typing — and focus is not required for announcement. (C) aria-label names an element; changing it does not generate an announcement on a non-focused div. (D) DOM insertion is silent by default — that is precisely the problem live regions exist to solve.',
  },
  {
    id: 379, type: 'multiple-choice', difficulty: 'mid', category: 'a11y',
    question: 'In an SPA, clicking a routerLink swaps the page content — but a screen-reader user hears NOTHING and their focus is still on the old nav link. What is the established remediation?',
    options: [
      "Nothing — updating document.title triggers a full announcement",
      "Move focus to the new view's heading (tabindex=-1) on nav end",
      "Set aria-live=\"assertive\" on <router-outlet> for all changes",
      "Use full page reloads always; SPAs simply cannot be accessible",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. A real page load gives screen-reader users two signals: the new title is announced and the reading cursor resets to document top. Router navigation gives neither — the DOM under the outlet changed but focus and the reading position still sit on the clicked link, so the user must explore to discover anything happened. The pattern: give the main content region (or its h1) tabindex="-1", subscribe to NavigationEnd (or use an afterNextRender hook in the routed component), and call .focus() on it — tabindex="-1" is the key detail, making the element focusable by SCRIPT but not adding a Tab stop for keyboard users. Angular sets the document title per route via the title property; announcing it through a LiveAnnouncer complements the focus move. Why others fail: (A) title changes alone are not reliably announced by screen readers during SPA navigation. (C) firing assertive announcements of entire page contents on every navigation is unusable noise, and router-outlet\'s replaced content is not a well-formed live-region update. (D) SPAs are perfectly accessible WITH focus management — that is the remediation, not surrender.',
  },
  {
    id: 380, type: 'fill-blank', difficulty: 'junior', category: 'a11y',
    question: 'Complete the template so the input has a proper, clickable, screen-reader-announced label:',
    code: `<label ______>Email address</label>
<input id="email" type="email" [formControl]="email" />`,
    options: [
      "for=\"email\" — matching the input's id links label and control",
      "[label]=\"email\" — bind the label to the FormControl instance",
      "aria-label=\"email\" — labels reference inputs via aria-label",
      "name=\"email\" — the label's name attribute pairs it with control",
    ],
    answer: 0,
    topicPath: 'a11y',
    explanation: 'A is correct — `for`/`id` pairing is the foundational form-accessibility association (wrapping the input inside the label is the equivalent implicit form). It does three jobs at once: the accessible NAME of the input becomes the label text, clicking/tapping the label focuses the control (a real usability win on mobile), and voice-control users can target the field by its visible name. Common Angular-specific slips: generating non-unique ids in @for loops (association silently binds to the FIRST match) and placeholder-as-label designs, which fail because placeholders vanish on input and are not reliably announced. When a visible label is truly impossible, aria-label on the INPUT is the fallback — but the visible+associated label is strictly better. Why others fail: (B) there is no label binding to FormControl; reactive forms and accessibility wiring are separate concerns. (C) aria-label goes on the control itself and replaces, not references, a visible label. (D) name participates in form submission, not labeling.',
  },
  {
    id: 381, type: 'multiple-choice', difficulty: 'junior', category: 'security',
    question: 'A user saves their display name as <img src=x onerror="alert(1)">. The template renders {{ user.displayName }}. What happens?',
    options: [
      "The alert fires — interpolation inserts the string as HTML, so you must sanitize",
      "Nothing fires — interpolation renders the value as literal text, never as markup",
      "Angular throws a runtime error, refusing to render strings with angle brackets",
      "The <img> is created, but Angular strips the onerror attribute before display",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct — this is Angular\'s baseline XSS posture: {{ }} and [property] bindings NEVER interpret the bound value as HTML. The malicious payload displays as harmless text because it goes through DOM text APIs, not innerHTML parsing. The distinct, second layer is sanitization, which only enters when you explicitly ask Angular to treat a value as markup — [innerHTML]="…" — at which point the value is sanitized per CONTEXT (HTML strips script-capable constructs like onerror handlers; URL contexts like [href] get javascript: schemes neutralized). Option D describes THAT innerHTML path, not interpolation. The escape hatches (bypassSecurityTrustHtml etc.) exist for values you can vouch for and are where audits focus. Why others fail: (A) inverts the model — interpolation is the SAFE path precisely because no HTML parsing occurs. (C) no error; angle brackets are ordinary text. (D) applies to [innerHTML] sanitization, not to {{ }} — with interpolation no <img> exists at all.',
  },
  {
    id: 382, type: 'spot-the-bug', difficulty: 'mid', category: 'security',
    question: 'This renders user-submitted forum posts "with formatting support". Find the vulnerability:',
    code: `@Component({
  template: \`<article [innerHTML]="trustedBody"></article>\`,
})
export class Post {
  private readonly sanitizer = inject(DomSanitizer);
  readonly post = input.required<ForumPost>();

  get trustedBody(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.post().body);
  }
}`,
    options: [
      "getters cannot legally return SafeHtml — convert trustedBody to a computed signal",
      "bypassSecurityTrustHtml on user input is self-inflicted stored XSS — drop it",
      "innerHTML must be written [innerHtml] with a lowercase t to bind correctly",
      "input() should be a plain @Input() when the value is used with DomSanitizer",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. The bypass* family exists for app-CONTROLLED values that the sanitizer would mangle — an iframe URL you construct yourself, SVG markup you author — never for content that originated in another user\'s hands. The name is the warning: you are asserting trust Angular cannot verify, and with forum posts you are asserting it about your attackers. Stored XSS like this is worse than reflected: the payload persists and fires for every visitor, harvesting sessions or acting as the victim. The fix is deleting code — plain [innerHTML] binding sends the string through sanitization, keeping <b>, <a href="https://…"> etc. while stripping event handlers and script vectors. If posts are markdown, render to HTML server-side with a strict allowlist and still bind without bypass. Defense in depth: a Content-Security-Policy and Trusted Types catch the bypasses code review misses. Why others fail: (A) getters returning SafeHtml are legal (though a computed would memoize) — style, not security. (C) [innerHTML] is correct casing. (D) signal inputs vs decorator inputs is irrelevant to the vulnerability.',
  },
  {
    id: 383, type: 'multiple-choice', difficulty: 'senior', category: 'security',
    question: 'Your API uses cookie-based sessions. How does Angular\'s HttpClient participate in CSRF/XSRF defense, and what must the SERVER do for it to work?',
    options: [
      "HttpClient blocks every cross-origin request by default, which on its own stops CSRF",
      "HttpClient mirrors the XSRF-TOKEN cookie into a header; the server checks they match",
      "A JWT sent in an Authorization header needs the very same XSRF machinery",
      "Enabling withCredentials on every request is itself the CSRF protection",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct, and the mechanism only clicks once you see WHY reading matters more than sending: CSRF exists because browsers attach cookies to cross-site requests automatically, so a hostile page can trigger authenticated POSTs blind. The token cookie is deliberately NOT HttpOnly — page JavaScript (Angular\'s HttpXsrfInterceptor) must read it to mirror it into the header, and same-origin policy stops the attacker\'s page from doing that read. Server-side responsibilities: issue the token cookie (e.g. Spring Security\'s CookieCsrfTokenRepository.withHttpOnlyFalse()), and reject mutating requests where header and cookie disagree. Angular skips GET/HEAD (safe methods should have no side effects to forge) and absolute URLs to other origins (mirroring the token there would LEAK it). Why others fail: (A) HttpClient enforces no such blocking — CORS is a server-declared browser policy and does not stop simple form POSTs anyway. (C) header-borne JWTs are not auto-attached by browsers, so classic CSRF does not apply — the trade is XSS theft risk instead. (D) withCredentials makes cross-origin requests CARRY cookies — closer to enabling the attack surface than defending it.',
  },
  {
    id: 384, type: 'predict-output', difficulty: 'mid', category: 'security',
    question: 'A user profile contains website: "javascript:stealCookies()". What does the rendered link actually do?',
    code: `<!-- profile.website === "javascript:stealCookies()" -->
<a [href]="profile.website">My site</a>`,
    options: [
      "Clicking runs stealCookies() — attribute bindings are not sanitized by Angular",
      "Angular sanitizes the URL context, rewriting the href to an inert unsafe: scheme",
      "The link renders but Angular removes the href attribute, leaving dead text",
      "A runtime NG0904 error is thrown during the next change-detection pass",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct — this demonstrates CONTEXT-AWARE sanitization. Angular\'s template compiler knows [href] is a URL security context, so bound values pass through URL sanitization at render: safe schemes (https, http, mailto, tel…) pass untouched; javascript: and data:text/html get the `unsafe:` prefix, defusing them while leaving forensic evidence in the DOM. Each context has its own rules — [innerHTML] gets HTML sanitization, [style.xyz] historically style checks, and RESOURCE URL contexts like <iframe src> accept NO sanitization at all (there is no safe way to sanitize an arbitrary document to embed), which is why iframes demand either a static string or an explicit bypassSecurityTrustResourceUrl. The correct app-level fix for user "website" fields is validating/normalizing to https?:// at input time, not trusting the defusal. Why others fail: (A) attribute/property bindings in security contexts ARE sanitized — that is the core mechanism. (C) the attribute survives with the prefixed value, not removed. (D) sanitization degrades gracefully; no error is thrown for plain URL contexts.',
  },
  {
    id: 385, type: 'multiple-choice', difficulty: 'senior', category: 'security',
    question: 'Security wants defense-in-depth so that even a bypassSecurityTrustHtml misuse cannot inject script. Which platform mechanism does Angular integrate with for this?',
    options: [
      "X-Frame-Options: DENY on every response is what covers this DOM injection",
      "A CSP with Trusted Types makes the browser reject strings sent to injection sinks",
      "Enabling strictTemplates rejects unsafe HTML at compile time before it ships",
      "Switching to zoneless change detection removes the DOM sinks scripts abuse",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. Trusted Types moves XSS defense from convention to platform enforcement: with the CSP directive active, `element.innerHTML = someString` THROWS unless the value was produced by a registered policy, no matter how the string got there. Angular\'s renderer routes its sanitized output through its `angular` policy, so a normal app runs cleanly with `trusted-types angular; require-trusted-types-for \'script\'` — and because the bypass APIs use the separate `angular#unsafe-bypass` policy name, OMITTING that name from the header means every bypassSecurityTrust* call site fails loudly in the browser: the exact backstop asked for. Rollout is observable via Content-Security-Policy-Report-Only. Third-party libs that write raw HTML will also surface, which is a feature. Why others fail: (A) X-Frame-Options addresses clickjacking (framing), unrelated to script injection. (C) strictTemplates checks TYPES; a string is a string whether malicious or not. (D) change-detection strategy has zero relationship to DOM injection sinks.',
  },
  {
    id: 386, type: 'multiple-choice', difficulty: 'mid', category: 'security',
    question: 'Where should an SPA keep its session credential — localStorage JWT or HttpOnly cookie — and what is the actual trade-off?',
    options: [
      "localStorage — cookies are legacy tech that modern SPAs have largely moved past",
      "HttpOnly cookie blocks XSS token theft but needs CSRF defense; JWT is the reverse",
      "They are equivalent, since an attacker with XSS can act as the user either way",
      "sessionStorage fixes it — clearing on tab close removes the exfiltration risk",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct — and knowing WHY option C is only half-true is the senior discriminator. Yes, XSS on a cookie-based app lets the attacker fire authenticated requests from the victim\'s browser (session riding). But token EXFILTRATION is strictly worse: the stolen JWT works from the attacker\'s own infrastructure, outlives the page, survives the victim closing the tab, and keeps working until expiry with no server-side session to kill. HttpOnly caps the blast radius to the duration of the injected script\'s execution. The full modern posture: HttpOnly + Secure + SameSite=Lax/Strict cookie, CSRF token (Angular\'s XSRF support), short-lived access + rotating refresh, and CSP to make XSS itself unlikely. Why others fail: (A) fashion is not a threat model; cookies with modern flags are the hardened option. (C) equivalence collapses exactly at exfiltration/revocation, as above. (D) sessionStorage narrows persistence, but it is still script-readable — same XSS theft, plus broken "remember me".',
  },
  {
    id: 387, type: 'multiple-choice', difficulty: 'junior', category: 'state',
    question: 'A cart count must show in the header, the product page, and a checkout badge. Passing it through inputs is getting painful. What is the idiomatic Angular solution?',
    options: [
      "Keep threading inputs/outputs through every intermediate layer",
      "A root service holding the count as a signal that all inject",
      "Store the count in localStorage and poll it in each constructor",
      "Emit the count through a global window event others listen for",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. Inputs/outputs are the right tool for parent-child conversation, but state needed by SIBLINGS scattered across the tree turns intermediate components into dumb couriers (prop drilling) — they gain inputs they only forward, and every re-plumbing touches files with no stake in the data. `providedIn: "root"` gives a tree-shakable singleton; a signal makes reads reactive with fine-grained updates (only templates actually reading count() re-render). Convention: keep the writable signal private and expose `readonly count = this._count.asReadonly()` plus intention-revealing methods (addItem), so mutations stay auditable. Why others fail: (A) explicit is good BETWEEN parent and child; through five indifferent layers it is just coupling. (C) localStorage is persistence, not reactivity — polling is a code smell and cross-component sync via storage is fragile. (D) window events bypass DI and types, leak listeners, and fight change detection instead of joining it.',
  },
  {
    id: 388, type: 'multiple-choice', difficulty: 'mid', category: 'state',
    question: 'Review this store. Why is this shape — private writable, public readonly, mutations as methods — the recommended discipline?',
    code: `@Injectable({ providedIn: 'root' })
export class TodoStore {
  private readonly _todos = signal<Todo[]>([]);

  readonly todos = this._todos.asReadonly();
  readonly remaining = computed(() =>
    this._todos().filter(t => !t.done).length);

  add(title: string): void {
    this._todos.update(list => [...list, { id: crypto.randomUUID(), title, done: false }]);
  }
}`,
    options: [
      "It is purely stylistic; exposing the writable signal behaves the same",
      "It enforces one-way flow: readers can't set, mutations use methods",
      "asReadonly() makes a defensive deep copy on every single read",
      "Signals in services need this pattern or CD will not trigger",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. Exposing the WritableSignal means ANY component can `todos.set([])` from anywhere — after a few features, "who cleared the list?" has forty possible answers. The readonly projection makes illegal writes a compile error, shrinking the mutation surface to the store\'s methods, where invariants (ids assigned, business rules applied) live in exactly one place. Two supporting details are load-bearing: `update` with spread produces a NEW array because signals compare with Object.is — an in-place push would leave the reference equal and nothing downstream would re-run; and `computed` keeps derivations colocated, cached, and impossible to forget to recalculate. This shape is also the on-ramp to the SignalStore idea: same discipline, more machinery. Why others fail: (A) behavior differs exactly when someone writes from outside — the readonly type FORBIDS it. (C) asReadonly is a zero-cost capability restriction, not a copy; the inner array is the same object (another reason for immutable updates). (D) signals trigger CD regardless of encapsulation; the pattern is about maintainability, not correctness of rendering.',
  },
  {
    id: 389, type: 'spot-the-bug', difficulty: 'senior', category: 'state',
    question: 'Clicking "complete" updates the database, but the remaining-count in the header never changes. The store method is below. Why does nothing react?',
    code: `complete(id: string): void {
  const list = this._todos();
  const todo = list.find(t => t.id === id);
  if (todo) {
    todo.done = true;
    this._todos.set(list);
  }
}`,
    options: [
      "find() returns a copy, so the mutation edits a throwaway object",
      "Mutated in place, set() got the same reference — Object.is no-op",
      "set() cannot take a variable; it requires an inline literal value",
      "Signals can't hold object arrays; switch to a BehaviorSubject",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct — the single most common signals-in-practice bug. The write path mutated `todo.done` (visible to anything holding the reference, hence the confusing console.log evidence) and then handed the unchanged ARRAY reference back to set(). The signal asks "did the value change?" with Object.is(old, new), gets true→false... no: gets `true` (same reference), and skips notifying dependents entirely — remaining\'s computed never re-runs, effects never fire, OnPush templates never refresh. The immutable-update discipline (map + object spread) is not aesthetic: NEW references are the change-detection signal itself. Alternatives with the same property: structural-sharing helpers (immer via produce returning new objects). Note that a custom `equal` option can change comparison semantics per signal, but reference discipline remains the sane default. Why others fail: (A) find() returns the actual element reference, not a copy — the mutation DID land, which is the trap. (C) set() takes any expression. (D) BehaviorSubject.next(sameRef) has the same reference-identity blindness downstream with distinctUntilChanged; the fix is immutability, not a different container.',
  },
  {
    id: 390, type: 'multiple-choice', difficulty: 'senior', category: 'state',
    question: 'When does adopting a state-management LIBRARY (NgRx Store / SignalStore) genuinely pay for itself over the signal-in-a-service pattern?',
    options: [
      "Immediately, in every single app — it is the professionalism baseline",
      "When real coordination problems exist: overlapping writes, effects",
      "Only when you require SSR, which plain services cannot support",
      "Never — signals have now made all state libraries fully obsolete",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct — this is an engineering-judgment question, and the honest answer names the FORCES rather than a team allegiance. Event-sourced stores (NgRx Store) shine when you need to answer "what sequence of events produced this state?" — devtools time-travel, action logs for debugging production incidents, strict unidirectionality that survives 30 contributors. Those benefits are real and so is their price: every trivial write becomes action + reducer case + possibly effect + selector, files multiply, and newcomers learn a meta-framework. The signal-service pattern covers a surprising share of real apps; NgRx SignalStore is the middle path (structured, opinionated, signal-native, less boilerplate). Choosing SMALLEST-tool-that-solves-the-problem is the senior signal here. Why others fail: (A) cargo-culting infrastructure ahead of need is how simple apps rot. (C) SSR works fine with plain services (TransferState is orthogonal). (D) signals changed the REACTIVITY substrate; coordination, auditability and convention problems still exist at scale — SignalStore existing is NgRx agreeing.',
  },
  {
    id: 391, type: 'predict-output', difficulty: 'mid', category: 'state',
    question: 'What logs, in what order, when run() executes? (Assume an injection context.)',
    code: `const source = signal(1);
const double = computed(() => {
  console.log('computing');
  return source() * 2;
});

function run(): void {
  source.set(2);
  source.set(3);
  console.log('before read');
  console.log(double());
  console.log(double());
}`,
    options: [
      "computing, computing, before read, computing, 6, computing, 6",
      "before read, computing, 6, 6 — computeds are lazy and cached",
      "computing, before read, 6, 6 — the computed runs eagerly once",
      "before read, computing, 6, computing, 6 — caching is template-only",
    ],
    answer: 1,
    topicPath: 'signals',
    explanation: 'B is correct, and each logged line teaches a rule. Nothing logs at creation or on either set(): a computed does ZERO work until someone reads it — writes merely mark it stale (push invalidation, pull recomputation). "before read" prints, then the first double() call finds the memo stale, runs the callback ("computing"), caches 6, returns it. The second double() finds nothing stale and returns cached 6 silently. That source was briefly 2 is invisible — unlike an RxJS stream, which would have EMITTED both 2 and 3 to subscribers, signals model "current state", so intermediate values between reads simply never happened. This laziness+memoization is why liberally layering computeds is cheap and why they must stay side-effect-free (they may run never, once, or often). Why others fail: (A) describes eager push semantics signals deliberately avoid. (C) no eager initial run exists; creation just wires the graph. (D) caching is intrinsic to computed, identical in templates and imperative code.',
  },
  {
    id: 392, type: 'multiple-choice', difficulty: 'senior', category: 'state',
    question: 'This component copies store state into local fields "so the template is simpler" — and now search results go stale when another tab of the app adds a product. What principle was violated?',
    code: `export class ProductSearch {
  private readonly store = inject(ProductStore);

  products: Product[] = [];
  query = '';

  ngOnInit(): void {
    this.products = this.store.products();
  }

  get results(): Product[] {
    return this.products.filter(p => p.name.includes(this.query));
  }
}`,
    options: [
      "ngOnInit is the wrong hook; ngAfterViewInit would stay fresh",
      "Single source of truth: ngOnInit snapshotted; use a computed",
      "Signals cannot be read in ngOnInit; only templates track reads",
      "The store should push updates into each field via refresh()",
    ],
    answer: 1,
    topicPath: 'state-management',
    explanation: 'B is correct. `this.store.products()` OUTSIDE a reactive context returns a plain array value — a photograph, not a subscription. From that line on the app has two versions of the truth, and every stale-data bug is some flavor of this fork. The rewrite eliminates the copy rather than synchronizing it: `readonly query = signal(\'\')` and `readonly results = computed(() => this.store.products().filter(p => p.name.includes(this.query())))` — the computed re-derives when EITHER dependency changes, there is nothing to refresh, and the template reads results(). The rule generalizes: store MINIMAL source state; everything expressible as a function of it should be computed, not copied (the getter here also re-filtered on every CD cycle without caching — computeds memoize). Why others fail: (A) any lifecycle hook that copies produces the same fork, just timed differently. (C) signal reads work anywhere; only TRACKING requires a reactive context (computed/effect/template) — which is exactly why the snapshot did not subscribe. (D) push-refresh reinvents change propagation manually and scales as O(components × stores) wiring; deriving gets it from the reactive graph for free.',
  },

  // --- TEMPLATES (HTML in Angular) ---
  {
    id: 393, type: 'multiple-choice', difficulty: 'junior', category: 'templates',
    question: 'What is the difference between binding `[src]="url"` and writing `src="{{ url }}"` on an <img>?',
    options: [
      "[src] binds one-time only; the {{ url }} interpolation form updates live",
      "Both stay in sync — [src] sets the DOM property, {{ url }} the attribute",
      "src=\"{{ url }}\" is a compile error on native <img> elements",
      "They differ only for custom components, never for native elements",
    ],
    answer: 1,
    topicPath: 'property-binding',
    explanation: 'B is correct. Both stay in sync with the component field. `[src]="url"` assigns to the element\'s src PROPERTY with the actual value (any type); `src="{{ url }}"` builds a STRING and Angular then sets the property from it. Property binding is the guideline default: it skips stringification, works for booleans/objects (e.g. [disabled]="isBusy"), and cannot render a literal "{{ url }}" flash in unsupported contexts. Why others fail: (A) both are live bindings. (C) interpolation in attribute position is valid syntax. (D) the distinction applies to native elements too.',
  },
  {
    id: 394, type: 'spot-the-bug', difficulty: 'mid', category: 'templates',
    question: 'This table cell never spans two columns. Why?',
    code: `<!-- span = 2 in the component -->
<td [colspan]="span">Total</td>`,
    options: [
      "colspan must be written uppercase — even [colSpan] will never work on a <td>",
      "colspan is an attribute, not a property, so bind [attr.colspan]=\"span\"",
      "Numbers cannot be bound in templates, so span must be a string first",
      "Angular property binding does not work on any <td> element at all",
    ],
    answer: 1,
    topicPath: 'property-binding',
    explanation: 'B is correct. Angular property binding writes to DOM properties, and it is a compile-time error (or silent miss) when no such property exists. colspan lives only as an HTML attribute (the property is actually colSpan, with different casing — the classic tell that attributes ≠ properties). The reliable form is `[attr.colspan]="span"`, which calls setAttribute under the hood. The same rule covers aria-* (`[attr.aria-label]`) and data-* attributes. Why others fail: (A) [colSpan] happens to exist as a property, but the general fix — and what the exam wants — is attr. binding for attribute-only targets. (C) numbers bind fine; attr binding stringifies them. (D) every element supports bindings.',
  },
  {
    id: 395, type: 'multiple-choice', difficulty: 'mid', category: 'templates',
    question: 'What does <ng-container> render into the DOM, and when do you reach for it?',
    options: [
      "A <div> styled with display: contents so it collapses visually",
      "Nothing — a logical group for directives, adds no wrapper element",
      "An HTML comment node that measurably slows down template rendering",
      "A real <ng-container> custom element which the browser then ignores",
    ],
    answer: 1,
    topicPath: 'structural-directives',
    explanation: 'B is correct. <ng-container> is purely logical: Angular uses it to anchor directives and then renders only its CHILDREN. The two canonical uses: grouping several elements under one *ngIf without a wrapper <div> (which could break flex/grid layout), and putting control flow inside markup where extra elements are INVALID — e.g. between <table> and <tr>, where a <div> would be ejected by the parser. Why others fail: (A) no element is emitted at all, so no display: contents trick is needed. (C) it leaves at most a comment anchor — negligible. (D) no custom element reaches the DOM.',
  },
  {
    id: 396, type: 'multiple-choice', difficulty: 'mid', category: 'templates',
    question: 'What does a template reference variable point at — #box on a <div> versus #search on an <app-search> component?',
    options: [
      "Always the raw underlying DOM element in both of these cases",
      "Plain element → DOM element; component host → component instance",
      "Always the component class instance backing the current template",
      "A plain string holding the id attribute of the element it sits on",
    ],
    answer: 1,
    topicPath: 'view-queries',
    explanation: 'B is correct. The reference resolves by what it sits on: plain element → element instance (so #input lets you write input.value in an event handler), component host → the component instance (so #search exposes its public API, e.g. search.clear()). When several directives share the host, `#x="ngForm"`-style exportAs picks WHICH one you get — that is exactly how template-driven forms hand out the NgForm. viewChild(\'box\') reads the same reference from the class. Why others fail: (A)/(C) the target depends on the host, and (D) they are real object references, not id strings.',
  },
  {
    id: 397, type: 'predict-output', difficulty: 'junior', category: 'templates',
    question: 'user is undefined during the first render. What does this template show and log?',
    code: `<p>{{ user?.name }}</p>
<p>{{ user!.email }}</p>  <!-- non-null assertion -->`,
    options: [
      "Both lines throw a template compile error immediately on first render",
      "First <p> empty; the second throws — ! only fools the type-checker",
      "Both interpolations render the literal string \"undefined\" instead",
      "The safe-navigation line renders \"null\"; the assertion line stays empty",
    ],
    answer: 1,
    topicPath: 'interpolation',
    explanation: 'B is correct. `?.` is a RUNTIME guard: when user is null/undefined the whole expression evaluates to undefined and interpolation renders it as an empty string — no error. `!` is the opposite kind of tool: a COMPILE-TIME promise to the type-checker that user is non-null, erased entirely from the emitted code — so at runtime the property read executes on undefined and throws. The exam point: ?. changes behavior, ! only changes type-checking. Why others fail: (A) the first line is explicitly safe. (C) interpolation renders null/undefined as empty string, not the word "undefined". (D) reversed.',
  },
  {
    id: 398, type: 'multiple-choice', difficulty: 'senior', category: 'templates',
    question: 'A CMS sends HTML strings that you render with [innerHTML]="post.html". A <script> tag and an onclick attribute are in the payload. What happens?',
    options: [
      "The script executes — [innerHTML] is a direct XSS hole in Angular",
      "Angular sanitizes it: the script and inline handlers are removed",
      "Angular throws a sanitization error and then renders nothing at all",
      "The HTML renders as escaped text, with every tag visible to the user",
    ],
    answer: 1,
    topicPath: 'security',
    explanation: 'B is correct. Angular treats values crossing into dangerous sinks (innerHTML, style, URLs) by CONTEXT: an innerHTML binding runs through the built-in sanitizer, which whitelists safe tags and removes executable content — <script>, on* handlers, javascript: URLs. The page shows the formatting but cannot execute the payload. bypassSecurityTrustHtml exists for content you can vouch for (already sanitized server-side) and is the audit-me keyword in reviews. Why others fail: (A) the sanitizer is precisely what prevents this. (C) it strips rather than throws. (D) escaping-to-text is what INTERPOLATION does — {{ post.html }} would show the tags; [innerHTML] renders them.',
  },
  {
    id: 399, type: 'multiple-choice', difficulty: 'mid', category: 'templates',
    question: 'What problem does the template @let block solve, e.g. @let total = items().length * price();?',
    options: [
      "It declares a real component class field from within the template",
      "It names an expression once for reuse later in the same template",
      "It is a compile-time constant frozen at the first render pass",
      "It replaces @if, rendering its block only when the value is truthy",
    ],
    answer: 1,
    topicPath: 'let-block',
    explanation: 'B is correct. @let gives a template-local name to any expression: subsequent bindings read `total` instead of re-writing the expression, and it re-evaluates when its dependencies change — it is a live alias, not a snapshot. It especially shines for `@let user = user$ | async` (one subscription, one name, no *ngIf-as-a-variable hack) and for narrowing long optional chains. Scope is lexical: available after its declaration within the same block. Why others fail: (A) it never touches the class. (C) it stays reactive across change detection. (D) it declares a value and renders nothing conditionally — that is @if\'s job.',
  },
  {
    id: 400, type: 'multiple-choice', difficulty: 'junior', category: 'templates',
    question: 'Why does the Angular style guide favor <button (click)="save()"> over <div (click)="save()"> for a save action?',
    options: [
      "Plain <div> elements simply cannot host Angular event bindings at all",
      "A real <button> is focusable, keyboard-activatable and announced",
      "Buttons render measurably faster than divs during change detection",
      "The (click) event binding syntax only compiles on native form controls",
    ],
    answer: 1,
    topicPath: 'a11y',
    explanation: 'B is correct. The template is still HTML, and element choice carries behavior contracts: <button> participates in the tab order, fires click for Enter/Space presses, exposes an implicit role="button" to assistive tech, and honors the disabled attribute. The div version silently works for mouse users only — the accessibility bugs surface later as keyboard traps and silent screen readers. Recreating it needs tabindex="0", role="button", a keydown handler and aria-disabled — four attributes to badly imitate one element. Why others fail: (A) any element can bind (click). (C) rendering cost is identical. (D) event bindings compile on every element.',
  },

  // --- STYLING (CSS in Angular) ---
  {
    id: 401, type: 'multiple-choice', difficulty: 'junior', category: 'styling',
    question: 'A rule `p { color: red; }` sits in one component\'s styles. Why do <p> elements in OTHER components stay uncolored?',
    options: [
      "Angular renames every <p> tag to a unique generated element name",
      "Emulated encapsulation adds a per-component attribute the selector then requires",
      "Component styles only apply to elements that carry an [ngStyle] binding",
      "The styles array is documentation-only, so real CSS must live in the global sheet",
    ],
    answer: 1,
    topicPath: 'components',
    explanation: 'B is correct. With ViewEncapsulation.Emulated (the default) the compiler stamps the component\'s DOM with a generated attribute and rewrites `p { … }` into `p[_ngcontent-xxx] { … }`. The effect: styles cannot leak OUT of the component (and outside page styles that do not use such attributes still cascade IN unless more specific). This is why each component can use generic selectors fearlessly. Why others fail: (A) tags are untouched; attributes are added. (C) ngStyle is an unrelated binding API. (D) component styles are fully real CSS, just scoped.',
  },
  {
    id: 402, type: 'multiple-choice', difficulty: 'junior', category: 'styling',
    question: 'Which binding conditionally applies the "active" class when isActive is true?',
    options: [
      "<li class=\"active={{ isActive }}\"> — interpolates the class name inline",
      "<li [class.active]=\"isActive\"> — toggles that one class as the boolean flips",
      "<li className=\"isActive\"> — sets the DOM className property to that string",
      "<li (class)=\"active: isActive\"> — binds class changes as a DOM event handler",
    ],
    answer: 1,
    topicPath: 'class-style-binding',
    explanation: 'B is correct. `[class.name]="boolExpr"` is the surgical form — one class, toggled by one boolean, coexisting peacefully with the element\'s static class attribute. The object-map form ([class]="{…}") and [ngClass] handle multiple conditional classes. Why others fail: (A) interpolates the literal text "active=true" INTO the class attribute value — a garbage class name. (C) className is not an Angular binding and the string "isActive" would be applied literally. (D) parentheses are event-binding syntax; classes are not events.',
  },
  {
    id: 403, type: 'multiple-choice', difficulty: 'mid', category: 'styling',
    question: 'What changes when a component sets encapsulation: ViewEncapsulation.None?',
    options: [
      "Its template stops rendering the component's own styles entirely",
      "Its styles inject as unscoped globals that can match elements anywhere",
      "It switches the component over to native Shadow DOM isolation of styles",
      "Child components can no longer receive inputs from this component",
    ],
    answer: 1,
    topicPath: 'components',
    explanation: 'B is correct. None removes the scoping step: the component\'s CSS lands in a plain <style> tag with the selectors untouched, exactly as if written in styles.css. Legitimate uses: a design-system root that intentionally publishes global rules, or styling content Angular cannot attribute-stamp. The risk is selector collision — `button { … }` now restyles every button in the app, loading-order dependent. ShadowDom is the third mode: real shadow-root isolation where outside styles cannot cascade in at all. Why others fail: (A) styles still render — globally. (C) that is ViewEncapsulation.ShadowDom, the opposite direction. (D) encapsulation is a CSS concern; inputs are unaffected.',
  },
  {
    id: 404, type: 'multiple-choice', difficulty: 'mid', category: 'styling',
    question: 'In component CSS, what does the :host selector target — and what does :host(.compact) add?',
    options: [
      ":host targets the <body> element that hosts the whole Angular app",
      ":host styles the component's own element; :host(.compact) adds the class case",
      ":host targets the first child element rendered inside the component template",
      ":host targets the router outlet the component was rendered into by the router",
    ],
    answer: 1,
    topicPath: 'components',
    explanation: 'B is correct. A component\'s scoped styles match elements INSIDE its template; the tag itself (<app-card>) belongs to the parent\'s markup, so it needs the special :host selector — the standard place for `:host { display: block; }` (custom elements default to inline!). The functional form :host(.selector) matches conditionally on the host, so `<app-card class="compact">` can flip an internal layout without any input plumbing. :host-context(.dark) extends the idea to ANCESTOR conditions — theme switches. Why others fail: (A)/(C)/(D) :host is precisely the component\'s own element, nothing broader or narrower.',
  },
  {
    id: 405, type: 'spot-the-bug', difficulty: 'senior', category: 'styling',
    question: 'A parent tries to restyle a child component\'s internals and it does not work. What is the accepted fix?',
    code: `/* parent.component.css */
app-fancy-list .item-title {
  color: purple;      /* never applies */
}`,
    options: [
      "Raise specificity until it wins, e.g. app-fancy-list div .item-title",
      "Expose a CSS custom property the child consumes and the parent sets",
      "Move the rule into index.html so it loads before Angular boots up",
      "Set encapsulation: ShadowDom on the parent to reach into the child",
    ],
    answer: 1,
    topicPath: 'components',
    explanation: 'B is correct. The parent\'s scoped rule compiles to `app-fancy-list[_ngcontent-parent] .item-title[_ngcontent-parent]` — but the child\'s internals carry the CHILD\'s attribute, so the selector can never match. That is encapsulation working as designed. The maintainable escape hatch is a contract, not a crowbar: CSS custom properties INHERIT through encapsulation boundaries, so the child declares which knobs exist (var(--item-title-color)) and any ancestor sets them (`app-fancy-list { --item-title-color: purple; }`). ::ng-deep pierces everything, is deprecated, and leaks the rule to every descendant forever. Why others fail: (A) specificity is irrelevant — the attribute requirement makes the match impossible. (C) load order does not change scoping attributes. (D) ShadowDom on the parent isolates it MORE, not less.',
  },
  {
    id: 406, type: 'multiple-choice', difficulty: 'mid', category: 'styling',
    question: 'What is the difference between the styles in a component\'s `styles`/`styleUrls` and the ones in the global `src/styles.css`?',
    options: [
      "None — the build simply concatenates them into one shared stylesheet",
      "Global styles are document-wide and unscoped; component styles ship scoped",
      "Component styles always override global ones regardless of CSS specificity",
      "Global styles in styles.css are not permitted to use CSS custom properties",
    ],
    answer: 1,
    topicPath: 'class-style-binding',
    explanation: 'B is correct. Two delivery mechanisms with different scopes: styles.css (registered under "styles" in angular.json) is document-wide plain CSS — the right home for resets, design tokens (:root { --brand: … }), and typography. Component styles are code-split with their component (a lazily-loaded page\'s CSS arrives only when visited) and are attribute-scoped so they cannot leak. The idiomatic architecture: global tokens + component-scoped consumption via var(). Why others fail: (A) they are bundled and injected differently. (C) the cascade still follows normal specificity and order — scoping ADDS specificity but does not create a special override tier. (D) globals are where shared CSS variables usually LIVE.',
  },
  {
    id: 407, type: 'multiple-choice', difficulty: 'senior', category: 'styling',
    question: 'Why are CSS custom properties (var(--x)) THE theming mechanism that plays well with view encapsulation?',
    options: [
      "They are the only CSS feature that Angular chooses not to sanitize at runtime",
      "Custom properties inherit through the DOM; encapsulation rewrites only selectors",
      "Angular compiles each var() reference into a real component input automatically",
      "They bypass the browser cascade entirely, which is what makes them fast",
    ],
    answer: 1,
    topicPath: 'class-style-binding',
    explanation: 'B is correct. Encapsulation works by rewriting selectors so parent rules cannot MATCH child internals — but it does not (and cannot) stop value INHERITANCE, and custom properties inherit by definition. So the theme lives at the top (`:root { --surface: #fff }`, flipped by `[data-theme=dark] { --surface: #111 }`), and every component writes `background: var(--surface)` in its own scoped CSS. Components keep their internals private while still following the theme — this exact app\'s light/dark toggle works this way. Why others fail: (A) sanitization concerns bindings, not stylesheet features. (C) no such compilation exists. (D) they participate in the cascade normally; the win is inheritance, not bypass.',
  },
  {
    id: 408, type: 'predict-output', difficulty: 'mid', category: 'styling',
    question: 'width is the number 250 in the component. What ends up on the element?',
    code: `<div class="bar"
     [style.width.px]="width"
     [style.opacity]="0.5">`,
    options: [
      "A crash — style bindings require strings that already include their units",
      "style=\"width: 250px; opacity: 0.5\" — the .px suffix appends the unit",
      "Only opacity applies; the width binding needs an [ngStyle] object instead",
      "width: 250 unitless and ignored — the .px suffix syntax is not real",
    ],
    answer: 1,
    topicPath: 'class-style-binding',
    explanation: 'B is correct. Style bindings accept unit suffixes — [style.width.px], [style.font-size.em], [style.margin.%] — appending the unit to a plain number, which keeps component code numeric and free of string concatenation. Each binding targets one property; on conflicts, the more specific [style.prop] binding wins over a [style] object binding, which wins over the static style attribute. Why others fail: (A)/(D) the suffix syntax is real and exists precisely so numbers work. (C) [ngStyle] is an alternative for maps, not a requirement.',
  },

  // --- TOOLING (angular.json, tsconfig, package.json) ---
  {
    id: 409, type: 'multiple-choice', difficulty: 'junior', category: 'tooling',
    question: 'In package.json, why is @angular/core under "dependencies" while @angular/cli sits in "devDependencies"?',
    options: [
      "Alphabetical convention only — the split carries no real meaning at all",
      "dependencies ship in the app; devDependencies are build-time-only tools",
      "devDependencies are optional and may silently fail to install",
      "Packages in devDependencies cannot be imported from TypeScript",
    ],
    answer: 1,
    topicPath: 'terminal-and-npm',
    explanation: 'B is correct. The runtime/tooling split: @angular/core code is compiled INTO your bundles — it is a real dependency of the artifact. @angular/cli, @angular/compiler-cli, typescript, vitest/karma exist only to BUILD and TEST; a server doing `npm ci --omit=dev` for a deploy pipeline can skip them entirely. For a frontend app the bundler makes the distinction less enforced than for a Node library — but it still documents intent and trims CI installs. Why others fail: (A) the sections have defined semantics. (C) both install identically by default. (D) imports work from either at dev time; the difference is deployment.',
  },
  {
    id: 410, type: 'multiple-choice', difficulty: 'junior', category: 'tooling',
    question: 'What does the "scripts" block in package.json do — e.g. "start": "ng serve"?',
    options: [
      "Lists the JavaScript files to inject directly into the index.html page",
      "Names commands run via npm run, with node_modules/.bin on PATH",
      "Configures the Angular compiler's entry script files",
      "Registers the service workers used by the production build",
    ],
    answer: 1,
    topicPath: 'terminal-and-npm',
    explanation: 'B is correct. scripts are the project\'s command palette: `npm start` → ng serve, `npm test` → ng test, `npm run build` → ng build. npm prepends node_modules/.bin to PATH for the child shell, so the locally-installed ng binary resolves — every collaborator and CI machine runs the exact pinned CLI version, no global install needed (that is also why `npx ng` works ad hoc). Why others fail: (A) script/style INJECTION is angular.json\'s "scripts"/"styles" arrays — a classic name collision the exam probes. (C)/(D) unrelated to npm scripts.',
  },
  {
    id: 411, type: 'multiple-choice', difficulty: 'junior', category: 'tooling',
    question: 'What is angular.json?',
    options: [
      "The npm manifest listing project dependencies and run scripts",
      "The CLI workspace config: projects, build/serve/test targets, options",
      "The TypeScript compiler configuration used across the project",
      "A runtime config file the browser fetches during application bootstrap",
    ],
    answer: 1,
    topicPath: 'cli-project-structure',
    explanation: 'B is correct. angular.json is how `ng build` knows WHAT to do: for each project it maps target names to a builder (e.g. @angular/build:application) plus options — entry points, index.html, tsconfig to use, assets to copy, the global "styles"/"scripts" arrays, size budgets, and named configurations like production/development that ng build -c selects. package.json says what to install; angular.json says how to build; tsconfig says how to compile TS. Why others fail: (A) that is package.json. (C) that is tsconfig.json. (D) it is consumed at build time only — nothing in the browser reads it.',
  },
  {
    id: 412, type: 'multiple-choice', difficulty: 'mid', category: 'tooling',
    question: 'In package.json, what is the difference between "^20.1.0" and "~20.1.0" — and what does package-lock.json add?',
    options: [
      "^ means beta releases, while ~ means only stable releases instead",
      "^ allows minor+patch, ~ only patch; the lockfile pins exact versions",
      "They are interchangeable — npm quietly ignores the range prefix entirely",
      "^ pins the one exact version while ~ allows anything strictly newer",
    ],
    answer: 1,
    topicPath: 'terminal-and-npm',
    explanation: 'B is correct. Under semver (major.minor.patch), ^ trusts the package to keep minors backward-compatible, ~ trusts only patch releases. But ranges alone make installs time-dependent — the same package.json can resolve differently next month. package-lock.json freezes the ENTIRE resolved tree (including transitive dependencies) with integrity hashes; `npm ci` installs exactly that. Commit the lockfile — deleting it to "fix" an install is how works-on-my-machine bugs are born. Why others fail: (A) prefixes are about version RANGES, not stability channels. (C) npm honors them precisely. (D) reversed and wrong — exact pinning is no prefix at all.',
  },
  {
    id: 413, type: 'multiple-choice', difficulty: 'mid', category: 'tooling',
    question: 'You install a CSS framework and add its stylesheet to the "styles" array in angular.json. What did that do, and why did the dev server need a restart?',
    options: [
      "It imported that CSS into every single component's scoped styles",
      "It bundles the CSS globally; angular.json isn't watched, hence restart",
      "It only adds a <link> tag for production builds, never for the dev serve",
      "Nothing — third-party CSS has to be imported inside main.ts instead",
    ],
    answer: 1,
    topicPath: 'cli-project-structure',
    explanation: 'B is correct. Entries in build options "styles" (and their sibling "scripts" for JS libraries) are bundled globally and injected into index.html — unscoped, document-wide, exactly right for a framework\'s base stylesheet. The builder reads angular.json when it boots; the file watcher covers your SOURCE tree, not the workspace config, hence the restart ritual after editing it. Alternative route: @import the library in styles.css (which IS watched). Why others fail: (A) global styles are never scoped into components. (C) it applies to serve and build alike. (D) main.ts imports work for JS; CSS belongs in styles.css or the styles array.',
  },
  {
    id: 414, type: 'multiple-choice', difficulty: 'mid', category: 'tooling',
    question: 'What do the "budgets" in angular.json\'s production configuration enforce?',
    options: [
      "Monetary cost limits applied to each of the app's cloud deployments",
      "Bundle size thresholds checked at build time — warn, then fail",
      "Wall-clock time limits on how long a single ng build may run",
      "Memory usage limits imposed on the dev server process",
    ],
    answer: 1,
    topicPath: 'performance',
    explanation: 'B is correct. Budgets make performance a build contract: "initial" guards the eagerly-loaded bundle set (what every user downloads before first paint), "anyComponentStyle" catches a single component\'s CSS ballooning, and each has warn/error tiers. Because exceeding maximumError breaks the build, a PR that accidentally imports a heavy library eagerly gets caught by CI, not by users. This app raised its style budget deliberately — a conscious decision, which is the point: budgets force the conversation. Why others fail: (A)/(C)/(D) budgets measure ARTIFACT bytes, nothing about money, time or memory.',
  },
  {
    id: 415, type: 'multiple-choice', difficulty: 'mid', category: 'tooling',
    question: 'A fresh workspace has tsconfig.json, tsconfig.app.json and tsconfig.spec.json. How do they relate?',
    options: [
      "Three fully independent configs that must be kept in sync entirely by hand",
      "The base holds shared options; app and spec extend it, narrowing scope",
      "Only tsconfig.app.json is real; the other two are legacy stubs",
      "They correspond to the dev, staging and production builds",
    ],
    answer: 1,
    topicPath: 'cli-project-structure',
    explanation: 'B is correct. The "extends" chain keeps one source of truth for compiler strictness while letting each COMPILATION UNIT define its own file set: the app build must not compile test files (they would bloat and could break the build — and spec-only types like describe/it do not exist there), while the test build needs exactly those globals via its "types" entry. angular.json points each architect target at the right tsconfig — build → app, test → spec. Add a shared option in the base; add file-set concerns in the leaf. Why others fail: (A) extends exists precisely to avoid manual sync. (C) all three are active. (D) environments are angular.json configurations, not tsconfigs.',
  },
  {
    id: 416, type: 'multiple-choice', difficulty: 'senior', category: 'tooling',
    question: 'What does "strictTemplates": true under angularCompilerOptions add on top of TypeScript\'s "strict": true?',
    options: [
      "Nothing — it is simply an alias for the same strict flag",
      "It extends strict type-checking into templates; binding typos fail the build",
      "It forces every component template into a separate external .html file",
      "It enables a whole set of extra runtime assertions inside production templates",
    ],
    answer: 1,
    topicPath: 'why-typescript-angular',
    explanation: 'B is correct. TypeScript\'s strict flag governs .ts code; templates are compiled by ANGULAR\'s compiler, which has its own checking dial. With strictTemplates, the compiler type-checks binding expressions against component types: `[user]="userName"` (string into a User input) is a compile error, `(input)="onInput($event)"` checks the real event type, and misspelled members in interpolation are caught. Without it, whole classes of template bugs surface only when a user clicks. It is on in new CLI workspaces and is the single highest-value compiler option to verify in an existing repo. Why others fail: (A) different compilers, different flags. (C) inline vs file templates are both checked. (D) all checking is compile-time.',
  },
  {
    id: 417, type: 'multiple-choice', difficulty: 'senior', category: 'tooling',
    question: 'How does `ng build --configuration production` change what gets built, mechanically?',
    options: [
      "It only sets NODE_ENV and then hopes the libraries react to it",
      "It merges the named \"configurations\" overrides: optimize, hash, budgets",
      "It runs the exact same build twice over and then diffs the two resulting outputs",
      "A production build simply pulls in a different framework version",
    ],
    answer: 1,
    topicPath: 'cli-project-structure',
    explanation: 'B is correct. "configurations" are named option-override sets on a target; -c production merges that set over the target\'s base options. Modern defaults: production turns on optimization (minify, tree-shake, CSS optimization), outputHashing: "all" (immutable-cacheable file names), extractLicenses and budget enforcement; development keeps fast rebuilds with sourcemaps. fileReplacements is the traditional environment mechanism (environment.ts → environment.prod.ts). serve borrows via "buildTarget". defaultConfiguration decides what plain `ng build` means — production in recent CLIs. Why others fail: (A) it is declarative config selection, not env vars. (C)/(D) one build, one framework.',
  },
  {
    id: 418, type: 'spot-the-bug', difficulty: 'senior', category: 'tooling',
    question: 'CI builds fail with "Cannot find name describe" — locally everything compiles. The developer recently "cleaned up" a tsconfig. What was the likely change?',
    code: `// tsconfig.app.json (after the cleanup)
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "outDir": "./out-tsc/app" },
  "files": ["src/main.ts"]
  // "exclude": ["src/**/*.spec.ts"]  <- removed as "redundant"
}`,
    options: [
      "Nothing here matters — CI just needs a newer Node version",
      "The app tsconfig now sweeps in spec files, which lack test \"types\"",
      "describe must now be imported from @angular/core in every spec file",
      "The \"files\" and \"extends\" keys cannot be used together at all",
    ],
    answer: 1,
    topicPath: 'cli-project-structure',
    explanation: 'B is correct. The two leaf tsconfigs exist to keep two DIFFERENT file sets compiling with two different ambient type sets: the app compilation must never see *.spec.ts (their globals come from the test runner\'s type package, listed only in tsconfig.spec.json\'s "types"). With the exclude gone, spec files enter the app program — and every describe/it/expect is an unknown identifier there. It often "works locally" because the dev only ran ng serve with a warm cache or an editor using the spec config. Why others fail: (A) it is a TypeScript program-membership issue, not Node. (C) test globals are ambient, not framework imports. (D) they combine fine — files pins entry points, extends inherits options.',
  },

  // --- TESTING (.spec.ts files) ---
  {
    id: 419, type: 'multiple-choice', difficulty: 'junior', category: 'testing',
    question: 'ng generate component user-card created user-card.spec.ts alongside the .ts/.html/.css. What is that file?',
    options: [
      "A backup copy that the Angular CLI keeps around purely for the rollbacks",
      "The unit-test file: a describe/it suite run by ng test, next to the code",
      "A TypeScript spec the compiler validates the component against at build",
      "An end-to-end test that drives the whole application inside a real browser",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct. The .spec.ts suffix is the test-file convention tsconfig.spec.json and the test runner are wired to pick up. Colocation is deliberate: the test sits next to the component (not in a parallel test/ tree), so renames, moves and reviews keep them together — the file structure itself nags you when a component has no spec. The generated seed compiles the component via TestBed and asserts it constructs; your real behavioral tests replace that placeholder. Why others fail: (A) nothing CLI-generated is a backup. (C) the type-checker uses types, not spec files. (D) e2e tests live in a separate project/tooling; specs are fast, isolated unit tests.',
  },
  {
    id: 420, type: 'multiple-choice', difficulty: 'junior', category: 'testing',
    question: 'In a spec file, what are describe, it and expect respectively?',
    options: [
      "They are all Angular decorators that get registered by the TestBed for you",
      "describe groups a suite; it is one case; expect starts an assertion",
      "Three convenient aliases for the console.log function used within tests",
      "Keywords that TypeScript itself only understands inside of .spec.ts files",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct. This trio is the near-universal test grammar (Jasmine, Jest and Vitest all share it): suites nest via describe for organization, it names ONE observable behavior ("clamps at zero on -"), and expect(...).matcher(...) performs the check — .toBe (Object.is), .toEqual (deep), .toContain, .toThrow. They are global functions provided by the runner, whose type declarations come in via tsconfig.spec.json\'s "types" — which is why they exist in specs and are compile errors in app code. Why others fail: (A) they predate and sit outside Angular. (C) they control test execution and reporting. (D) TypeScript knows them only through those type declarations, not as language keywords.',
  },
  {
    id: 421, type: 'multiple-choice', difficulty: 'mid', category: 'testing',
    question: 'Why does the generated spec create the component inside beforeEach with TestBed.configureTestingModule?',
    options: [
      "A quirk that is only kept around for backwards compatibility with AngularJS",
      "beforeEach re-runs before every it(), giving each test a fresh fixture",
      "Components can only ever be instantiated one single time per whole file",
      "It caches the component so all of the tests can share one instance for speed",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct. Two ideas compose here. Isolation: beforeEach means test #3 gets the same pristine component as test #1 — a test that passes alone and fails in the suite (or vice versa) is almost always shared state, and this pattern eliminates it. Realism with control: TestBed compiles the component into a real module-like environment (imports: [MyComponent] for standalone), wires DI so inject() works, and its providers array is where you substitute { provide: ApiService, useValue: fake } — the seam that makes components testable without real HTTP. Why others fail: (A) it is current practice. (C) you can create many. (D) sharing an instance is exactly the anti-pattern beforeEach prevents.',
  },
  {
    id: 422, type: 'predict-output', difficulty: 'mid', category: 'testing',
    question: 'The name renders into the <h1>. What does this test print?',
    code: `const fixture = TestBed.createComponent(Greeting);
fixture.componentInstance.name = 'Ada';
console.log('1:', fixture.nativeElement.querySelector('h1').textContent);
fixture.detectChanges();
console.log('2:', fixture.nativeElement.querySelector('h1').textContent);`,
    options: [
      "1: Hello Ada — 2: Hello Ada, because the binding here is synchronous",
      "1: (empty) then 2: Hello Ada — the fixture never auto-renders on its own",
      "A runtime error, because componentInstance is read-only inside of the tests",
      "1: Hello — 2: Hello Ada, because the static part of it renders eagerly",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct. TestBed hands YOU the change-detection trigger so tests can assert intermediate states deterministically. createComponent instantiates the class and creates the DOM skeleton, but no binding has executed — interpolations are empty until the first detectChanges(), which also fires ngOnInit. After that, mutations still need explicit detectChanges() calls (in zone-based test setups) because nothing is watching. The practical rhythm burned into every component test: arrange → detectChanges → act → detectChanges → assert. Signal-based components with zoneless auto-detection relax this, but the fixture contract is what specs are written against. Why others fail: (A) rendering is explicitly manual in tests. (C) componentInstance is a normal writable instance. (D) not even static template parts are flushed before the first CD run.',
  },
  {
    id: 423, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'What does wrapping a test in fakeAsync(() => { … }) with tick() enable, versus using real async/await?',
    options: [
      "It runs the whole test inside a Web Worker purely for the sake of isolation",
      "Timers become a virtual clock you advance with tick(ms) — instant, no flake",
      "It silently converts every promise into a synchronous function everywhere",
      "It is strictly required for any test that so much as touches the HttpClient",
    ],
    answer: 1,
    topicPath: 'testing-components',
    explanation: 'B is correct. Time is the classic source of slow, flaky tests. Inside a fakeAsync zone, scheduled timers and microtasks land in a controlled queue; tick(300) says "pretend 300ms elapsed" and runs exactly what is due — the debounced search test asserts nothing fired at tick(299) and everything at tick(1) more, in microseconds of real time. flush() runs all pending timers; forgetting to drain them fails the test with "timers still in queue" — a feature, catching leaked intervals. Real async/await tests wait wall-clock time and can race. Why others fail: (A) no workers involved. (C) promises resolve via the controlled microtask queue, not synchronously-everywhere. (D) HttpTestingController is synchronous already — fakeAsync is about TIME, not HTTP.',
  },
  {
    id: 424, type: 'multiple-choice', difficulty: 'senior', category: 'testing',
    question: 'How does provideHttpClientTesting() + HttpTestingController let a service spec verify HTTP behavior without a network?',
    options: [
      "It spins up a local mock HTTP server for you, listening on the port 4200",
      "It swaps the backend for a double: expectOne asserts, flush answers, verify",
      "It records the real API responses a single time and then replays them forever",
      "It makes HttpClient just return undefined so that tests skip the HTTP paths",
    ],
    answer: 1,
    topicPath: 'testing-services-http',
    explanation: 'B is correct. The providers pair (provideHttpClient(), provideHttpClientTesting()) replaces the real backend, so the service under test runs its genuine request-building code — URL, params, headers, interceptors — while nothing touches the network. The controller inverts control: the TEST decides when and how each request resolves, including error cases via req.flush(body, { status: 500, statusText: … }) that are nearly impossible to produce reliably against a live API. expectOne doubles as an assertion (two identical requests = failure = caught duplicate-call bug), and httpMock.verify() closes the loop on requests your code made that the test never expected. Why others fail: (A)/(C) no server, no recording — pure in-memory doubles. (D) requests are captured, not nulled.',
  },
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
