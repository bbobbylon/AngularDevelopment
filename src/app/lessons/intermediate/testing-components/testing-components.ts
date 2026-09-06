import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BfPage,
  Bubbles,
  type BubbleTurn,
  Chapter,
  type ChapterStop,
  CodeLab,
  type CodeNote,
  Napkin,
  TapeCard,
} from '../../../shared/brain';
import {
  Compare,
  Faq,
  type FaqItem,
  Flow,
  type FlowStep,
  Predict,
  Quiz,
  type QuizOption,
  Remember,
} from '../../../shared/teaching';
import { CounterDemo } from './counter-demo/counter-demo';

/**
 * Lesson: Testing Components — `TestBed`, `ComponentFixture`, and what a
 * component test should actually assert.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9); shape copied from
 * `expert/change-detection`, the reference implementation.
 *
 * The teaching order:
 *
 * 1. **Pose the problem before naming the tool.** A live, clickable counter
 *    sits at the top with no test in sight — "how would you prove, to CI and
 *    to future-you, that this keeps working?" is the question the rest of the
 *    page answers.
 * 2. **Analogy next.** `TestBed` as a film set, `createComponent()` as
 *    casting a stunt double onto an empty stage, and the `ComponentFixture`
 *    it hands back as the remote control for that double — gives the reader
 *    somewhere to put `detectChanges()`, `nativeElement` and `debugElement`
 *    before those words arrive.
 * 3. **Then the same idea in four modes** — a dialogue between `TestBed`,
 *    the fixture and "you", a step diagram of the lifecycle, an annotated
 *    spec file, and the live counter itself — because retention comes from
 *    redundancy across modes, not repetition in one.
 * 4. **Every snippet is annotated line by line** via `app-code-lab`. Nothing
 *    on this page assumes the reader can already read the snippet.
 *
 * Five areas, covered top to bottom rather than behind tabs (dropped in this
 * migration so the page reads as one chapter, matching every other migrated
 * lesson): the anatomy of a test, async helpers, signals, mocking, and
 * testing patterns that survive a refactor.
 *
 * @see intermediate/testing-services-http — the non-component half.
 */
@Component({
  selector: 'app-lesson-testing-components',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
    CounterDemo,
  ],
  styleUrl: './testing-components.css',
  templateUrl: './testing-components.html',
})
export class TestingComponents {
  // ── Presentation data ──────────────────────────────────────────────────

  /** The Testing track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Testing Components' },
    { label: 'Testing Services & HTTP', id: 'testing-services-http' },
  ];

  /**
   * The exchange behind "why did my query return null?" — the bug this
   * whole lesson exists to prevent.
   */
  protected readonly setupTalk: BubbleTurn[] = [
    {
      who: 'You',
      says: 'I called `TestBed.createComponent(Counter)`. Is my component on the page now?',
    },
    {
      who: 'TestBed',
      says: "It exists — I built the instance and gave it a host element. But that element isn't attached to anything you'd call \"the page\", and I haven't run a single binding yet.",
    },
    {
      who: 'You',
      says: "So `fixture.nativeElement.querySelector('.count')` should find it, right?",
    },
    {
      who: 'Fixture',
      says: "Try it and you'll get `null`. Nothing has told this view to check itself — that's a different call entirely.",
    },
    { who: 'You', says: '`fixture.detectChanges()`, then?' },
    {
      who: 'Fixture',
      says: "Now you're talking. That runs `ngOnInit`, evaluates every binding for the first time, and only then do your query and your assertion have anything real to look at.",
    },
  ];

  /** The TestBed lifecycle, as a visual timeline. */
  protected readonly lifecycleFlow: FlowStep[] = [
    {
      label: 'configureTestingModule()',
      detail: "Declares this component's imports/providers — nothing exists yet",
    },
    {
      label: 'createComponent()',
      detail:
        'Builds the instance and a detached host element. The constructor runs; `ngOnInit` does not',
    },
    {
      label: 'Query now → `null`',
      detail: 'Nothing has rendered, so nothing is there to find',
      tone: 'warn',
    },
    {
      label: 'detectChanges()',
      detail: 'Runs `ngOnInit`, evaluates every binding for the first time, paints the DOM',
      tone: 'accent',
    },
    {
      label: 'Query now → real nodes',
      detail: 'The DOM finally matches component state',
      tone: 'good',
    },
  ];

  /** Sample: the full setup/teardown anatomy of a component test. */
  protected readonly anatomySample = `describe('CounterComponent', () => {
  let fixture: ComponentFixture<CounterComponent>;
  let component: CounterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('starts at zero', () => {
    expect(component.count()).toBe(0);
  });
});`;

  /** Line-by-line walkthrough of {@link anatomySample}. */
  protected readonly anatomyNotes: CodeNote[] = [
    {
      line: 1,
      text: '`describe` groups a suite of tests under one name — this one shows up as "CounterComponent" in the test report.',
    },
    {
      line: 2,
      text: '`ComponentFixture<CounterComponent>` is the test harness: it owns the component instance, its (detached) host DOM element, and the trigger that runs change detection. Declared here, outside `beforeEach`, so every `it()` below can reach it.',
    },
    {
      line: 3,
      text: 'The class instance itself — plain TypeScript, for calling methods and reading signals directly. No DOM involved.',
    },
    {
      line: 6,
      text: "`TestBed.configureTestingModule({...})` describes the module this component gets tested inside — the testing equivalent of the `imports`/`providers` you'd write for it in real code.",
    },
    {
      line: 7,
      text: 'A standalone component goes in `imports`, the exact place a real parent would put it. (Pre-standalone components used `declarations` instead.)',
    },
    {
      line: 8,
      text: '`compileComponents()` resolves an external `templateUrl`/`styleUrl`. The Angular CLI inlines those at build time, so this is usually a no-op — but it returns a Promise, which is why `beforeEach` above is `async`.',
    },
    {
      line: 10,
      text: '`createComponent()` instantiates the component and attaches it to a host element that exists only in memory — nothing is on a real page. Nothing has rendered yet.',
    },
    {
      line: 11,
      text: '`componentInstance` is the same object line 3 declared — grabbed here so the rest of the suite can call its methods or read its signals.',
    },
    {
      line: 12,
      text: "**The line beginners forget.** `ngOnInit` hasn't run and every binding is still empty. `detectChanges()` runs the first check: it fires `ngOnInit` and paints the first real render. Query the DOM before this line and you get `null`.",
    },
    {
      line: 15,
      text: '`fixture.destroy()` runs `ngOnDestroy`, unsubscribes, and removes the host element. Skip it and a leaked timer or subscription from this test can make an unrelated test seven cases later fail for no visible reason.',
    },
    {
      line: 18,
      text: 'Only now — after `detectChanges()` ran in `beforeEach` — does asking the component for its state mean anything: the render this assertion implicitly trusts already happened.',
    },
  ];

  /** Sample: the three ways to find something in the rendered DOM. */
  protected readonly queryingSample = `// Option 1 — nativeElement: plain DOM, no Angular involved
const btn = fixture.nativeElement.querySelector('button');
const items = fixture.nativeElement.querySelectorAll('.item');
expect(btn.textContent.trim()).toBe('Click me');

// Option 2 — debugElement + By: Angular-aware
import { By } from '@angular/platform-browser';
const de = fixture.debugElement.query(By.css('[data-testid="submit"]'));
de.triggerEventHandler('click');

// Option 3 — By.directive: find by TYPE, not markup
const child = fixture.debugElement.query(By.directive(ChildComponent));
const childInstance = child.componentInstance as ChildComponent;`;

  /** Line-by-line walkthrough of {@link queryingSample}. */
  protected readonly queryingNotes: CodeNote[] = [
    {
      line: 2,
      text: "`fixture.nativeElement` **is** the host element — from there it's plain browser DOM API, exactly what you'd type into the console. `querySelector` returns the first match or `null`.",
    },
    {
      line: 3,
      text: '`querySelectorAll` returns a static `NodeList` — every match, with a `.length`, but no Angular metadata attached.',
    },
    {
      line: 4,
      text: "`.trim()` matters: Angular's template formatting leaves whitespace and newlines around interpolated text, so a bare `.toBe('Click me')` often fails on the padded string.",
    },
    {
      line: 7,
      text: '`By` is a namespace of predicate factories — `By.css`, `By.directive` — for `debugElement.query()`. It has nothing to do with `nativeElement`.',
    },
    {
      line: 8,
      text: '`debugElement` wraps the same DOM node `nativeElement` would give you, plus Angular metadata. `query()` returns one `DebugElement` (`queryAll()` returns an array). `data-testid` is the recommended hook here — it survives a CSS refactor that would break a class-name selector.',
    },
    {
      line: 9,
      text: "`triggerEventHandler('click')` calls the `(click)` handler directly, without dispatching a real DOM event. Faster than `.click()`, and it works for component outputs with no native DOM event to fire at all.",
    },
    {
      line: 12,
      text: "`By.directive(ChildComponent)` finds the child by its **class**, no matter what selector or markup it renders — useful when you don't want to hardcode the child's tag name.",
    },
    {
      line: 13,
      text: "`componentInstance` is typed `any` on a `DebugElement`, so casting it back to the real class restores autocomplete and type-checking on the child's own members.",
    },
  ];

  /** Sample: clicking a button and typing into an input, then asserting. */
  protected readonly interactionSample = `it('increments on click', () => {
  const button = fixture.nativeElement.querySelector('button');
  button.click();
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('.count').textContent).toContain('1');
});

it('reflects typed input', () => {
  const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
  input.value = 'Hello';
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  expect(component.name()).toBe('Hello');
});`;

  /** Line-by-line walkthrough of {@link interactionSample}. */
  protected readonly interactionNotes: CodeNote[] = [
    {
      line: 3,
      text: "`.click()` dispatches a **real** click event, exactly like a user would — so the `(click)` binding fires and the component's own handler runs.",
    },
    {
      line: 4,
      text: 'The handler already updated the signal; the DOM has not repainted yet. This line is what makes the next assertion see the new value instead of the old one.',
    },
    {
      line: 5,
      text: "`toContain`, not `toBe` — the element almost certainly renders 'Count: 1', not a bare '1'.",
    },
    {
      line: 9,
      text: "Type it `HTMLInputElement` explicitly — `querySelector`'s return type is the generic `Element`, which has no `.value` property.",
    },
    {
      line: 10,
      text: 'Setting `.value` in code does **not** notify Angular. The DOM property changes silently; `ngModel` and reactive form controls never hear about it.',
    },
    {
      line: 11,
      text: "This is the line that actually wires it up: it fires the same `'input'` event a real keystroke produces, which is exactly what Angular's value accessor is listening for.",
    },
    {
      line: 13,
      text: '`name` is a signal on the component, so reading it means calling it — `component.name()`, not `component.name`.',
    },
  ];

  /** The silent-failure trap: a query that runs before the render it needs. */
  protected readonly detectChangesPredictPrompt =
    'A component template only shows `<p class="msg">Hi</p>` once a signal called `visible` is `true`. Your test does `component.visible.set(true);` and, on the very next line, `expect(fixture.debugElement.query(By.css(\'.msg\'))).toBeTruthy();` — no `detectChanges()` anywhere. What does that assertion actually do?';
  /** Reveal for {@link detectChangesPredictPrompt}. */
  protected readonly detectChangesPredictAnswer =
    'It fails — `query()` returns `null`, so `toBeTruthy()` throws "expected null to be truthy". The signal really did flip to `true`; the template just hasn\'t been asked to re-check itself, so `.msg` doesn\'t exist in the tree `By.css` is searching. That\'s the loud version. The dangerous one is the mirror image: assert `.not.toBeTruthy()` by mistake, or test a feature that\'s supposed to stay hidden, and a missing `detectChanges()` makes a genuinely broken component look like a passing test — because "nothing rendered" and "the state never even changed" look identical from here.';

  /** Sample: skipping manual `detectChanges()` with auto-detection. */
  protected readonly autoDetectSample = `beforeEach(async () => {
  await TestBed.configureTestingModule({ imports: [MyComp] }).compileComponents();
  fixture = TestBed.createComponent(MyComp);
  fixture.autoDetectChanges(true);
});

it('increments on click', () => {
  fixture.nativeElement.querySelector('button').click();
  expect(fixture.nativeElement.querySelector('.count').textContent).toContain('1');
});`;

  /** Line-by-line walkthrough of {@link autoDetectSample}. */
  protected readonly autoDetectNotes: CodeNote[] = [
    {
      line: 4,
      text: "`autoDetectChanges(true)` attaches the fixture to Angular's `ApplicationRef`, so a check runs automatically whenever something asks for one — closer to how a real running app behaves. It also performs the **first** render itself, which is why there's no separate `fixture.detectChanges()` call anywhere in this file.",
    },
    { line: 8, text: 'A real click still fires a real event — that part never changes.' },
    {
      line: 9,
      text: 'No `fixture.detectChanges()` here. Auto-detection already re-rendered after the click, so the DOM is current by the time this line runs.',
    },
  ];

  /** Self-test: what happens with exactly one `detectChanges()` call and no more. */
  protected readonly detectChangesQuizOptions: QuizOption[] = [
    {
      text: 'It passes — a signal write updates the DOM directly, without waiting for change detection.',
      why: 'A signal write does two things: it marks the views that read it as dirty, and it notifies the scheduler that a pass is needed. Neither of those is "write to the DOM". In a running app the scheduler turns that notification into a pass almost immediately — but nothing here plays that role, so nothing paints.',
    },
    {
      text: 'It fails — the assertion still sees whatever was rendered at the last detectChanges(), because nothing has told this view to check itself since.',
      correct: true,
      why: 'Exactly. The write reached the signal; it never reached the screen. A fixture with no `autoDetectChanges` gets change detection only when you explicitly ask for it — that is the entire trade a test makes for determinism.',
    },
    {
      text: 'It fails with NG0100, because the signal changed after the view was already checked.',
      why: "NG0100 fires when dev mode's second, verifying read of a binding disagrees with its first — during a single pass. That comparison only happens while a pass is actually running. This scenario never runs a second pass at all, so there's nothing for two reads to disagree about.",
    },
    {
      text: "It depends on the component's change-detection strategy — Default re-renders on its own, OnPush would need a manual nudge.",
      why: "Strategy decides which views an already-running pass is allowed to skip, not whether a pass gets scheduled in the first place. Outside a real app's zone or scheduler, nothing here schedules one regardless of strategy — Default and OnPush behave identically until something calls detectChanges().",
    },
  ];

  /** Sample: `fakeAsync` + `tick()`/`flush()` against timer-driven code. */
  protected readonly fakeAsyncSample = `it('shows success after 500ms', fakeAsync(() => {
  fixture.componentInstance.submit();
  expect(fixture.nativeElement.querySelector('.spinner')).toBeTruthy();

  tick(500);
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('.success')).toBeTruthy();
}));

it('flushes every pending timer', fakeAsync(() => {
  component.startPolling();
  flush();
  fixture.detectChanges();
  expect(component.data()).toBeDefined();
}));`;

  /** Line-by-line walkthrough of {@link fakeAsyncSample}. */
  protected readonly fakeAsyncNotes: CodeNote[] = [
    {
      line: 1,
      text: '`fakeAsync(...)` swaps `setTimeout`/`setInterval`/Promise scheduling for a fake clock you control. The test body still runs top to bottom, synchronously — nothing here is really waiting on anything.',
    },
    { line: 2, text: 'Kicks off something that will finish 500ms from now, on the fake clock.' },
    {
      line: 3,
      text: '**Assert the "before" state first.** The clock hasn\'t moved, so the loading UI must still be showing — this is what proves the spinner ever appears at all, not just the end result.',
    },
    {
      line: 5,
      text: '`tick(500)` moves the virtual clock forward by exactly that much. Every timer scheduled to fire at or before that point runs now, synchronously — no real waiting, no flakiness from timing.',
    },
    { line: 6, text: "The timer's callback changed state; this paints it." },
    {
      line: 10,
      text: "A second scenario: you don't know or don't care exactly when the polling settles.",
    },
    {
      line: 12,
      text: '`flush()` drains the entire timer queue instead of you guessing a number — reach for it when "run everything" is the goal, and for `tick(n)` when the delay itself is the behaviour under test.',
    },
  ];

  /** The second silent-failure trap: waiting for stability that never arrives. */
  protected readonly whenStablePredictPrompt =
    'A component starts a `setInterval` in `ngOnInit` and never uses a Promise. Your test does `fixture.detectChanges(); await fixture.whenStable();` and then asserts. What happens when you run it?';
  /** Reveal for {@link whenStablePredictPrompt}. */
  protected readonly whenStablePredictAnswer =
    "The test hangs until the runner's own timeout kills it, with a message that never mentions the interval. `whenStable()` resolves once Angular reports no pending macro- or microtasks — and a repeating `setInterval` never stops being pending, so it's never stable. `whenStable()` is for things that **finish** (promises, HTTP). For things that **repeat** (`setInterval`, a debounced RxJS timer), reach for `fakeAsync` + `tick()`, which lets you fast-forward past exactly as many ticks as you want and then stop.";

  /** Sample: waiting on a genuine promise with `whenStable()`. */
  protected readonly whenStableSample = `it('loads data from a promise', async () => {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('.item')).toBeTruthy();
});`;

  /** Line-by-line walkthrough of {@link whenStableSample}. */
  protected readonly whenStableNotes: CodeNote[] = [
    {
      line: 1,
      text: "A genuinely async test — `async () =>`, not `fakeAsync`. The clock here is real; you're waiting, not fast-forwarding.",
    },
    {
      line: 2,
      text: 'First render — this is what runs `ngOnInit`, which presumably starts the promise-based fetch.',
    },
    {
      line: 3,
      text: "`whenStable()` pauses until every promise kicked off above has settled. It is the promise-shaped counterpart of `tick()`: one waits for a clock you control, the other for one you don't.",
    },
    { line: 4, text: 'The data arrived while this line was awaiting; paint it.' },
    { line: 5, text: 'Only now does the list item exist to be found.' },
  ];

  /** Sample: the async pipe's two-render subscription gotcha. */
  protected readonly asyncPipeSample = `it('renders an Observable via async pipe', fakeAsync(() => {
  component.data$ = of({ name: 'Test' });
  fixture.detectChanges();
  tick();
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('Test');
}));`;

  /** Line-by-line walkthrough of {@link asyncPipeSample}. */
  protected readonly asyncPipeNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Swaps the real stream for a synchronous, one-value Observable. `of()` emits immediately and completes — no network involved.',
    },
    {
      line: 3,
      text: 'First pass: this is when `| async` actually **subscribes**. It has no value yet, so the template renders nothing here — one `detectChanges()` alone is never enough for this pattern.',
    },
    {
      line: 4,
      text: '`of()` emits on the microtask queue, not synchronously. `tick()` with no argument lets exactly that queue drain.',
    },
    {
      line: 5,
      text: 'Second pass: the pipe now has a value, so the interpolation using it finally prints something.',
    },
    {
      line: 6,
      text: 'Searching the whole rendered text rather than one selector — good enough when you just need to know the value made it onto the page somewhere.',
    },
  ];

  /** Sample: stubbing a failing dependency and asserting the error UI. */
  protected readonly errorStateSample = `it('shows an error on failed load', fakeAsync(() => {
  const service = TestBed.inject(DataService);
  vi.spyOn(service, 'load').mockReturnValue(
    throwError(() => new Error('Network error')),
  );

  fixture.detectChanges();
  tick();
  fixture.detectChanges();

  expect(fixture.nativeElement.querySelector('.error').textContent)
    .toContain('Network error');
}));`;

  /** Line-by-line walkthrough of {@link errorStateSample}. */
  protected readonly errorStateNotes: CodeNote[] = [
    {
      line: 2,
      text: '`TestBed.inject()` resolves from the same injector the component will use, so patching this exact object patches what the component actually calls.',
    },
    {
      line: 3,
      text: '`spyOn` replaces one method in place and hands back a spy — everything else on `service` still runs its real implementation. Vitest restores the original automatically after the test.',
    },
    {
      line: 4,
      text: '`throwError()` takes a **factory**, not a bare error value, so every subscriber gets its own fresh `Error` and stack trace.',
    },
    {
      line: 7,
      text: '`ngOnInit` runs on this render, and calls `service.load()` — now the rigged version.',
    },
    { line: 8, text: 'Lets the thrown error actually propagate through the subscription.' },
    { line: 9, text: "Repaints so the template's error branch has a chance to appear." },
    {
      line: 11,
      text: "Asserting the **visible message**, not an internal flag. That's what makes this test still pass after a refactor that changes how the error is stored but not what the user sees.",
    },
  ];

  /** Sample: a required signal input and the computed derived from it. */
  protected readonly signalInputSample = `@Component({ /* ... */ })
export class UserCard {
  user = input.required<User>();
  displayName = computed(() => this.user().firstName + ' ' + this.user().lastName);
}

it('shows the full name from a signal input', () => {
  fixture.componentRef.setInput('user', { firstName: 'Ada', lastName: 'Lovelace' });
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
});

it('reacts when the input changes again', () => {
  fixture.componentRef.setInput('user', { firstName: 'Alan', lastName: 'Turing' });
  fixture.detectChanges();
  expect(component.displayName()).toBe('Alan Turing');

  fixture.componentRef.setInput('user', { firstName: 'Grace', lastName: 'Hopper' });
  fixture.detectChanges();
  expect(component.displayName()).toBe('Grace Hopper');
});`;

  /** Line-by-line walkthrough of {@link signalInputSample}. */
  protected readonly signalInputNotes: CodeNote[] = [
    {
      line: 3,
      text: 'A **required** signal input — no default. Reading `user()` before a parent (or a test) supplies one throws, which is exactly why the test below calls `setInput` before `detectChanges()`.',
    },
    {
      line: 4,
      text: '`computed()` recalculates automatically whenever `user` changes — but only when something actually reads `displayName()`.',
    },
    {
      line: 8,
      text: "You cannot write `component.user = ...` — a signal input is read-only from inside the class. `setInput()` goes through `componentRef`, the same path a real parent template's binding uses, so it also marks the component dirty the way a real input change would. The first argument is the input's public name **as a string** — rename the property and this call silently stops matching anything.",
    },
    { line: 9, text: 'Renders with the new input value in place.' },
    { line: 14, text: 'Sets an initial value…' },
    {
      line: 16,
      text: '…and confirms the `computed` picked it up. Note the parentheses — reading any signal, including a `computed`, is always a function call.',
    },
    {
      line: 19,
      text: "Now change it. This is the part actually worth testing: a `computed` that's correct once but never **recomputes** on a second change is a real bug, and only a second assertion like this one catches it.",
    },
  ];

  /** Sample: a `computed` signal and an `effect`, and how tests flush each. */
  protected readonly computedEffectSample = `it('recomputes total when a source signal changes', () => {
  component.quantity.set(3);
  component.price.set(10);

  expect(component.total()).toBe(30);

  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('.total').textContent).toContain('30');
});

it('runs a pending effect synchronously on demand', () => {
  component.theme.set('dark');
  TestBed.tick();
  expect(document.body.classList.contains('dark')).toBe(true);
});`;

  /** Line-by-line walkthrough of {@link computedEffectSample}. */
  protected readonly computedEffectNotes: CodeNote[] = [
    {
      line: 2,
      text: 'These are writable signals on the component (`signal()`, not `input()`), so the test can `.set()` them directly — no `componentRef` needed.',
    },
    {
      line: 5,
      text: 'No `detectChanges()` yet, and none is needed here. A `computed` is lazy but **synchronous**: the moment something reads `total()`, it recalculates from the current values. Change detection is about the DOM; signal maths happens the instant you ask for it.',
    },
    {
      line: 7,
      text: 'The DOM is a different story — it still shows whatever was there before these two `.set()` calls, until a check runs.',
    },
    {
      line: 12,
      text: "Effects are the opposite of a `computed`: they're **scheduled**, not immediate. Setting the signal only queues this effect for later — it does not run inline.",
    },
    {
      line: 13,
      text: "`TestBed.tick()` runs any pending effects (and syncs the UI) right now, so the assertion below isn't racing the scheduler. This is the current API — `TestBed.flushEffects()` does the same job under its old name, and is deprecated in favour of `tick()`.",
    },
    {
      line: 14,
      text: "Asserting the effect's **side effect**, since a side effect is the only thing an effect is allowed to produce.",
    },
  ];

  /** Sample: `useValue` — a hand-built stand-in object as a provider. */
  protected readonly mockValueSample = `const authServiceMock = {
  isLoggedIn: vi.fn().mockReturnValue(true),
  currentUser: signal({ name: 'Test User', role: 'admin' }),
  logout: vi.fn(),
};

await TestBed.configureTestingModule({
  imports: [NavComponent],
  providers: [{ provide: AuthService, useValue: authServiceMock }],
}).compileComponents();`;

  /** Line-by-line walkthrough of {@link mockValueSample}. */
  protected readonly mockValueNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A plain object implementing only the members `NavComponent` actually touches — it does not need to satisfy the whole `AuthService` interface.',
    },
    {
      line: 2,
      text: '`vi.fn()` creates a spy: it records every call and lets you script a return value, for a later `toHaveBeenCalledWith(...)`.',
    },
    {
      line: 3,
      text: 'If the real service exposes a signal, the mock must too — the template calls `currentUser()`, and a plain object there would throw.',
    },
    {
      line: 4,
      text: 'A spy with no scripted return — it does nothing but remember it was called, which is exactly what a "did clicking logout call logout?" test needs.',
    },
    {
      line: 9,
      text: 'This line says: "when anything asks the injector for `AuthService`, hand it this object instead." The real `AuthService` is never constructed, so its HTTP calls, timers and storage access never happen.',
    },
  ];

  /** Sample: `vi.spyOn` — a partial mock layered onto a real service. */
  protected readonly spyOnSample = `it('loads products on init', () => {
  const productService = TestBed.inject(ProductService);
  const spy = vi.spyOn(productService, 'getAll').mockReturnValue(
    of([{ id: 1, name: 'Widget' }]),
  );

  fixture.detectChanges();
  expect(spy).toHaveBeenCalled();
  expect(fixture.nativeElement.querySelectorAll('.product').length).toBe(1);
});`;

  /** Line-by-line walkthrough of {@link spyOnSample}. */
  protected readonly spyOnNotes: CodeNote[] = [
    {
      line: 2,
      text: "The **real** service, straight from the real injector — no `provide` override anywhere in this test's setup.",
    },
    {
      line: 3,
      text: "`spyOn` replaces one method in place and returns a handle to it. Everything else on `productService` keeps running its genuine implementation — that's the whole point of a partial mock.",
    },
    {
      line: 4,
      text: '`of([...])` wraps a value in an Observable that emits once and completes — the standard stand-in for an HTTP call in a synchronous test.',
    },
    {
      line: 7,
      text: 'Confirms the component actually **asked** for data — this catches the bug where someone deletes the `ngOnInit` call and the list is empty for an entirely different, unnoticed reason.',
    },
    { line: 8, text: 'Confirms it rendered exactly one card for the one product it received.' },
  ];

  /** Sample: overriding a provider for one test, and the ordering trap. */
  protected readonly overrideProviderSample = `it('shows an error state', () => {
  TestBed.overrideProvider(DataService, {
    useValue: { fetch: () => throwError(() => new Error('Boom')) },
  });

  // Must create a NEW fixture after the override — the shared beforeEach's
  // fixture already resolved the real DataService before this test ran.
  const brokenFixture = TestBed.createComponent(BrokenPanel);
  brokenFixture.detectChanges();

  expect(brokenFixture.nativeElement.querySelector('.error')).toBeTruthy();
});`;

  /** Line-by-line walkthrough of {@link overrideProviderSample}. */
  protected readonly overrideProviderNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Swaps the provider for **this test only** — the shared `describe`-level setup is untouched for every other test in the file.',
    },
    { line: 3, text: 'A throwaway stub: `fetch()` immediately returns a stream that errors.' },
    {
      line: 6,
      text: 'The comment is the whole trap: `overrideProvider()` only affects components created **after** it runs. The `fixture` from the outer `beforeEach` was already built with the real `DataService` wired in, so reusing it here would silently test against the real service, not the broken stub.',
    },
    {
      line: 8,
      text: 'A fresh `createComponent()` call, now that the override is in place, is what actually gets the broken `DataService` injected.',
    },
    {
      line: 11,
      text: 'Only a component created after the override sees the failing `fetch`, so this is the first point where asserting the error UI makes sense.',
    },
  ];

  /** Sample: template-driven and reactive form tests, side by side. */
  protected readonly formsSample = `// Template-driven — drive it through the DOM, like a user would
it('submits a valid form', () => {
  const nameInput: HTMLInputElement = fixture.nativeElement.querySelector('[name="username"]');
  nameInput.value = 'ada';
  nameInput.dispatchEvent(new Event('input'));
  nameInput.dispatchEvent(new Event('blur'));

  fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  fixture.detectChanges();

  expect(component.submitted()).toBe(true);
});

// Reactive — talk to the model directly, skip the DOM
it('marks username invalid when empty', () => {
  const ctrl = component.form.get('username')!;
  ctrl.setValue('');
  ctrl.markAsTouched();
  fixture.detectChanges();

  expect(ctrl.hasError('required')).toBe(true);
  expect(fixture.nativeElement.querySelector('.error-msg')).toBeTruthy();
});`;

  /** Line-by-line walkthrough of {@link formsSample}. */
  protected readonly formsNotes: CodeNote[] = [
    {
      line: 3,
      text: "Selecting by the `name` attribute — that's what `ngModel` binds to in a template-driven form, making it the most stable selector available here.",
    },
    {
      line: 5,
      text: "`'input'` is the event `ngModel` listens for. Skip this and the form model stays empty while the screen looks filled in — setting `.value` alone notifies nobody, just like the typed-input example above.",
    },
    {
      line: 6,
      text: "`'blur'` is what flips the control from untouched to **touched**. Validation messages are usually gated on `touched`, so a test of error UI needs this line too.",
    },
    {
      line: 8,
      text: "Dispatching `'submit'` fires the `(ngSubmit)` binding. Calling `form.submit()` instead would attempt a real page navigation and do nothing useful here.",
    },
    {
      line: 16,
      text: "The `!` asserts the control is non-null — `get()` returns `AbstractControl | null` because TypeScript can't verify a string control name against the form's actual shape.",
    },
    {
      line: 17,
      text: '`setValue()` runs the validators **synchronously** — no events, no rendering needed to see the result.',
    },
    {
      line: 18,
      text: 'Simulates the user having visited and left the field — what most templates gate their error message on.',
    },
    { line: 21, text: 'Asserting the **model**: which specific validator failed.' },
    {
      line: 22,
      text: 'Asserting the **view** too: the user is actually being told. A passing validator with no visible message is still a bug — hence two assertions, not one.',
    },
  ];

  /** Sample: a routed component test, configured the modern, function-based way. */
  protected readonly routingSample = `describe('with routing', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [
        provideRouter([
          { path: 'home', component: HomeComponent },
          { path: 'detail/:id', component: DetailComponent },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture = TestBed.createComponent(NavComponent);
    fixture.detectChanges();
  });

  it('navigates to a detail route', fakeAsync(() => {
    fixture.nativeElement.querySelector('[data-testid="detail-link"]').click();
    tick();
    expect(location.path()).toBe('/detail/1');
  }));
});`;

  /** Line-by-line walkthrough of {@link routingSample}. */
  protected readonly routingNotes: CodeNote[] = [
    {
      line: 9,
      text: "`provideRouter([...])` supplies a cut-down route table containing only what this spec exercises — the function-based way this app configures a router. `RouterTestingModule.withRoutes([...])` is the older NgModule-era equivalent; you'll still meet it in older code.",
    },
    {
      line: 11,
      text: '`:id` is a route parameter — this is the route the link under test navigates to.',
    },
    {
      line: 17,
      text: "`Location` is the browser-URL abstraction. In tests it's backed by an in-memory implementation, so nothing here touches the real address bar.",
    },
    {
      line: 19,
      text: 'First render — this also activates `routerLink` directives on the page, so it has to happen before any link is clicked.',
    },
    {
      line: 22,
      text: '`fakeAsync` because navigation is asynchronous even when nothing is actually loaded.',
    },
    {
      line: 23,
      text: 'Clicks the anchor the way a user would; `routerLink` turns that click into a navigation instead of a page load.',
    },
    {
      line: 24,
      text: 'Navigation resolves on the microtask queue — without this line the assertion below would run while the URL is still the old one.',
    },
    {
      line: 25,
      text: 'Asserting the **resulting URL**, not a spy on `router.navigate`. This proves the whole pipeline — link, route config, parameter — actually lines up end to end.',
    },
  ];

  /** Compare panel: the old NgModule-era router test setup. */
  protected readonly routingOldSample = `imports: [
  RouterTestingModule.withRoutes([
    { path: 'detail/:id', component: DetailComponent },
  ]),
]`;

  /** Compare panel: the modern, function-based router test setup. */
  protected readonly routingNewSample = `providers: [
  provideRouter([
    { path: 'detail/:id', component: DetailComponent },
  ]),
]`;

  /** Sample: an Angular Material harness, driving a real component by API. */
  protected readonly harnessSample = `import { MatButtonHarness } from '@angular/material/button/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';

let loader: HarnessLoader;
beforeEach(() => {
  loader = TestbedHarnessEnvironment.loader(fixture);
});

it('clicks the submit button', async () => {
  const button = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
  await button.click();
  expect(component.submitted()).toBe(true);
});`;

  /** Line-by-line walkthrough of {@link harnessSample}. */
  protected readonly harnessNotes: CodeNote[] = [
    {
      line: 1,
      text: '**A harness is an official test API for a component**: you say "click the button", not "find `div.mat-mdc-button-touch-target` and dispatch a click". Material can restructure its internal DOM in a minor release and this test still passes.',
    },
    {
      line: 2,
      text: '`TestbedHarnessEnvironment` is what binds a harness loader to a `TestBed` fixture, as opposed to a real end-to-end browser.',
    },
    {
      line: 6,
      text: "Use `.loader(fixture)` for anything inside this component's own DOM. Overlays — dialogs, menus — render outside it and need `.documentRootLoader(fixture)` instead.",
    },
    {
      line: 9,
      text: "`.with({ text: 'Submit' })` filters when several of the same component exist on the page. Ask for a harness that doesn't exist and `getHarness()` rejects with a readable message instead of returning `null`.",
    },
    {
      line: 10,
      text: 'Every harness method is `async`, because it drives real change detection and waits for stability on your behalf — there is no `detectChanges()` to remember here.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'My test passed, but the feature is obviously broken when I click around in the real app. What went wrong?',
      a: "Almost always a missing or misplaced `detectChanges()`. The test asserted against a DOM that hadn't been re-rendered, so it was quietly checking the **previous** state rather than the one your change produced. A passing test only proves what it actually looked at — if that's stale DOM, a real bug hides right behind it.",
    },
    {
      q: 'When do I reach for fakeAsync + tick() instead of async/await with whenStable()?',
      a: "By what's actually pending. `setTimeout`, `setInterval` and debounced RxJS timers never resolve on their own — they need `fakeAsync` so you can fast-forward the clock with `tick(ms)` or `flush()`. Genuine promises and HTTP calls settle by themselves; `whenStable()` (or a plain `await`) just waits for that. Mixing them — `await` inside `fakeAsync` — throws, because a fake clock can't move a real promise forward.",
    },
    {
      q: 'Why does the async-pipe test need two detectChanges() calls instead of one?',
      a: 'The first render is when `| async` actually subscribes — it has no value yet, so the template shows nothing. The value arrives on the microtask queue after that (which `tick()` lets through), and the second `detectChanges()` is what paints it. One call only ever shows you the moment before the data exists.',
    },
    {
      q: 'nativeElement.querySelector or debugElement.query(By.css(...)) — does it matter which I use?',
      a: "For plain DOM reads, not much — `nativeElement` is faster to write. Reach for `debugElement` when you need something `nativeElement` can't do: `By.directive()` to find a child by type instead of markup, or `triggerEventHandler()` to call an output directly without a real DOM event existing for it.",
    },
    {
      q: 'Do I really need fixture.destroy() in afterEach? Nothing seems to break if I skip it.',
      a: 'Nothing breaks in **that** test. `destroy()` runs `ngOnDestroy`, which is usually where a subscription gets torn down or a `setInterval` gets cleared. Skip it enough times and those leaks pile up across the suite — a test that passes alone can start failing when run after twenty others, which is exactly the shape of a flaky suite nobody can reproduce.',
    },
  ];
}
