import { Component, Injectable, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { BrainPower } from '../../../shared/shapes';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

// ── Live-demo store ───────────────────────────────────────────────────────────

/**
 * A todo in the signal-store demo.
 */
interface Todo {
  id: number;
  title: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Which todos the list shows.
 */
type Filter = 'all' | 'active' | 'done';

/**
 * A signal store — the pattern this lesson argues for, working and live.
 *
 * A plain injectable holding private writable signals, exposing them read-only,
 * deriving everything else with `computed`, and mutating only through named
 * methods. No library, no reducers, no action types: the encapsulation NgRx
 * provides by convention falls out of `private` plus `asReadonly()`.
 *
 * The lesson's position is that most apps never need more than this, and that
 * reaching for a store library before feeling the pain it solves is how a todo
 * list ends up with fifteen files.
 */
@Injectable()
class TodoStore {
  /**
   * The todos. Private and writable; exposed read-only below.
   */
  private readonly _todos = signal<Todo[]>([
    { id: 1, title: 'Learn signals', done: true, priority: 'high' },
    { id: 2, title: 'Build a signal store', done: false, priority: 'high' },
    { id: 3, title: 'Add NgRx when team grows', done: false, priority: 'low' },
  ]);
  /**
   * The active filter. Private and writable.
   */
  private readonly _filter = signal<Filter>('all');
  /**
   * Sequence source for todo ids.
   */
  private nextId = 4;

  /**
   * The todos, read-only. Consumers can read and react but not write, so every
   * mutation goes through a method and is therefore findable.
   */
  readonly todos = this._todos.asReadonly();
  /**
   * The filter, read-only.
   */
  readonly filter = this._filter.asReadonly();

  /**
   * The todos the current filter admits. Derived, so nothing has to remember to
   * recompute it.
   */
  readonly filtered = computed(() => {
    const f = this._filter();
    return this._todos().filter((t) => (f === 'active' ? !t.done : f === 'done' ? t.done : true));
  });
  /**
   * How many todos are outstanding.
   */
  readonly remaining = computed(() => this._todos().filter((t) => !t.done).length);
  /**
   * How many todos there are.
   */
  readonly total = computed(() => this._todos().length);
  /**
   * Whether everything is done — derived from two other derivations, which costs
   * nothing extra because `computed` is lazy and cached.
   */
  readonly allDone = computed(() => this.total() > 0 && this.remaining() === 0);

  /**
   * Adds a todo, ignoring blank input.
   *
   * @param title    What to do.
   * @param priority How urgent.
   */
  add(title: string, priority: Todo['priority'] = 'medium') {
    if (!title.trim()) return;
    this._todos.update((l) => [...l, { id: this.nextId++, title, done: false, priority }]);
  }
  /**
   * Toggles a todo's done state.
   *
   * @param id Which todo.
   */
  toggle(id: number) {
    this._todos.update((l) => l.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
  /**
   * Removes a todo.
   *
   * @param id Which todo.
   */
  remove(id: number) {
    this._todos.update((l) => l.filter((t) => t.id !== id));
  }
  /**
   * Removes every completed todo.
   */
  clearDone() {
    this._todos.update((l) => l.filter((t) => !t.done));
  }
  /**
   * Sets the filter.
   *
   * @param f Which todos to show.
   */
  setFilter(f: Filter) {
    this._filter.set(f);
  }
}

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: State Management — where a value should live, who is allowed to
 * change it, and when a plain signal store stops being enough.
 *
 * ## Shape: `argument`
 *
 * The lesson opens on two components that each declare their own
 * `signal<CartItem[]>` field and quietly disagree about what's in the cart —
 * CartPage's view is right, CartIcon's is stale, and neither signal is
 * malfunctioning. {@link argRoundOne} stages CartPage's signal, CartIcon's
 * signal and the two components each stating a truth that together explains
 * the bug; `app-brain-power` asks what's missing when neither signal is
 * broken; {@link argRoundTwo} has both signals deny responsibility before
 * "You" names the missing piece — one shared signal, not two that happen to
 * share a field name. `app-layers` answers the same split as a containment
 * figure (one `CartStore` instance, two readers), a quiz checks the
 * shared-instance case directly, and the block closes on `app-napkin` with a
 * wristwatch-vs-wall-clock analogy — kept separate from the bank-teller
 * analogy just below, which explains the *write* side (private/readonly/
 * named-method) rather than this block's *read* side (one instance, not two).
 * See `docs/CONTRIBUTING.md` §2C.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9) following the teaching order set by
 * `expert/change-detection`, the reference implementation:
 *
 * 1. **Pose the problem before naming it.** Two components — a cart badge and
 *    a cart page — need to agree on the same number, and the lesson opens on
 *    that disagreement rather than on the word "state".
 * 2. **Analogy next, mechanism after.** The bank-teller frame (a vault nobody
 *    reaches into directly, a lobby display board, exactly one counter where
 *    change happens) gives the reader somewhere to put "private signal,
 *    read-only projection, named method" before those words arrive.
 * 3. **The same idea in four modes** — a dialogue between a component and its
 *    store, a containment diagram for provider scope, annotated source for
 *    every pattern (signal store, persistence, NgRx signals, classic NgRx,
 *    async state), and the original live `TodoStore` demo.
 * 4. **Every snippet is annotated line by line** via `app-code-lab`. Nothing
 *    here assumes the reader can already read a signal store, a reducer or an
 *    effect chain — they are here because at least one of those is new.
 *
 * The ladder this lesson climbs, and the question at each rung: component
 * state → a shared signal store ({@link TodoStore}) → `@ngrx/signals` → classic
 * NgRx — with "what does the next rung actually buy you?" asked at every step,
 * because the lesson's whole argument is that most apps should stop climbing
 * earlier than they think.
 *
 * @see beginner/services-di — the plain `@Injectable` this pattern starts from.
 * @see beginner/signals — `signal`/`computed`/`effect`, assumed knowledge here.
 * @see intermediate/signals-advanced — `linkedSignal` and equality functions in depth.
 * @see expert/change-detection — why a mutated array renders nothing; the mechanism this lesson's quiz relies on.
 * @see expert/dynamic-components — next stop on the Architecture track.
 */
@Component({
  selector: 'app-lesson-state-management',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    BrainPower,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
  ],
  providers: [TodoStore],
  styleUrl: './state-management.css',
  templateUrl: './state-management.html',
})
export class StateManagement {
  /**
   * The store, provided at this component so the demo — and the scope
   * discussion further down — starts fresh on each visit.
   */
  protected readonly store = inject(TodoStore);

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Architecture track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'State Management' },
    { label: 'Dynamic Components', id: 'dynamic-components' },
    { label: 'Host Directives', id: 'host-directives' },
    { label: 'NgModules & Standalone', id: 'ngmodules-migration' },
  ];

  /**
   * The shape block's first round: CartPage's signal, CartIcon's signal and
   * the two components each stating a true fact that, together, explains why
   * the badge is stale without either signal having misbehaved.
   */
  protected readonly argRoundOne: BubbleTurn[] = [
    {
      who: "CartPage's signal",
      says: 'One `update()` call and I changed — CartPage read me right after, in its own template, and got the new array. That is the entire contract I promised.',
    },
    {
      who: "CartIcon's signal",
      says: "I promised the exact same contract, and I've kept it too — I still say zero, because nothing has ever called `.set()` or `.update()` on me. Not once.",
    },
    {
      who: 'CartPage',
      says: 'Hang on — I called `this.items.update(list => [...list, mug])`. The mug is really in there. I can see it right now.',
    },
    {
      who: 'CartIcon',
      says: "I called `this.items()` too, in my badge's interpolation, a hundred times since you clicked. It's not that I'm not reading. I'm reading something.",
    },
    {
      who: 'CartPage',
      says: 'Wait. Is your `items` even the same object as mine?',
    },
    {
      who: "CartIcon's signal",
      says: 'We were never the same object. Each of you declared your own `private readonly items = signal<CartItem[]>([])`, in your own class. I am not a copy of theirs — I only happen to have the same name.',
    },
  ];

  /**
   * The shape block's second round: everyone denies responsibility before
   * "You" names the missing piece — one shared signal, not two that share a
   * field name.
   */
  protected readonly argRoundTwo: BubbleTurn[] = [
    {
      who: "CartPage's signal",
      says: "Not me. I notified every reader I have the instant I changed. That's the whole job description.",
    },
    {
      who: "CartIcon's signal",
      says: 'Not me either. I cannot announce a change that was never made to me — there is nothing to announce.',
    },
    {
      who: 'CartPage',
      says: 'Not me. I did the work. The mug really is sitting in an array, right now, correctly.',
    },
    {
      who: 'You',
      says: "It's mine. Two components can't share a value by each declaring their own copy of it — a signal only ever knows about writes made through it directly. The fix isn't a better update() call. It's one CartStore, injected by both, so there's exactly one signal between them.",
    },
  ];

  /**
   * The shape block's quiz: the shared-instance case, checked directly
   * against the two-separate-signals bug the block opened on.
   */
  protected readonly argBlockQuiz: QuizOption[] = [
    {
      text: 'It updates to match — both components got the SAME CartStore instance from the root injector, so `store.items()` is one signal, read twice.',
      correct: true,
      why: "`providedIn: 'root'` means the injector builds exactly one CartStore and hands that same instance to every injector that asks — CartPage and CartIcon are reading one signal, not two, so CartIcon's next render sees the update.",
    },
    {
      text: 'Nothing changes — CartIcon would still need to manually re-fetch the count.',
      why: "That's the two-separate-signals bug, not this scenario. A single shared, root-provided signal notifies every current reader automatically; nothing needs to poll or re-fetch.",
    },
    {
      text: "It throws, because two components can't read the same signal at the same time.",
      why: 'A signal supports any number of simultaneous readers — that is the entire point of exposing one publicly. Nothing about two components reading it is a conflict.',
    },
    {
      text: 'It depends on which component was constructed first.',
      why: 'Construction order plays no part here. The root injector builds CartStore once, on first request, and every later request — regardless of order — gets that same instance back.',
    },
  ];

  /**
   * A component trying to shortcut the store, and getting turned away.
   *
   * This exchange exists because the mistake it depicts is the one nearly
   * every learner makes first: reach for the array itself, not the method.
   * Staging it as a refusal — "there's no `.push()` to call" — lands harder
   * than a paragraph explaining that the signal is read-only.
   */
  protected readonly mechanismTalk: BubbleTurn[] = [
    {
      who: 'CartPage',
      says: 'One more mug in the cart. Let me just push it onto `items`.',
    },
    {
      who: 'The store',
      says: "`items` is `asReadonly()`. There's no `.push()`, no `.set()` — you got a value, not a handle to write through.",
    },
    {
      who: 'CartPage',
      says: 'Fine. `addItem(mug)`, then.',
    },
    {
      who: 'The store',
      says: 'That I can do. I `update()` my own private array, hand back a brand-new one, and every consumer reading `items()` notices the new reference.',
    },
    {
      who: 'CartIcon',
      says: 'I read `items()` too — same store, same instance. My badge just went from 2 to 3, and I never spoke to CartPage at all.',
    },
  ];

  /**
   * Sample: the whole signal-store contract in one class — private write,
   * public read, derived value, one named door in.
   */
  protected readonly storeSample = `@Injectable({ providedIn: 'root' })
export class CartStore {
  // private, writable — only this class may call .set() / .update()
  private readonly _items = signal<CartItem[]>([]);

  // public, read-only — every consumer gets a signal it cannot write to
  readonly items = this._items.asReadonly();

  // derived — recomputed only when a signal it reads actually changes,
  // and cached until then
  readonly total = computed(() =>
    this._items().reduce((sum, i) => sum + i.price * i.qty, 0),
  );

  // the ONLY door in — one named method per action, never a raw setter
  addItem(item: CartItem) {
    this._items.update((list) => [...list, item]);
  }

  removeItem(id: number) {
    this._items.update((list) => list.filter((i) => i.id !== id));
  }
}`;

  /** Line-by-line walkthrough of {@link storeSample}. */
  protected readonly storeNotes: CodeNote[] = [
    {
      line: 1,
      text: "`providedIn: 'root'` means the injector creates exactly **one** instance the first time anything asks for it, and keeps it alive for the life of the app — every component that injects `CartStore` gets the same object.",
    },
    {
      line: 4,
      text: '`private` is the entire contract. It is not a convention here — TypeScript will not compile a call to `this._items` from outside this class, so `.set()` and `.update()` are physically unreachable from a component.',
    },
    {
      line: 7,
      text: '`asReadonly()` returns a **new** signal that shares the same value but has no `.set()` or `.update()` at all — not even this class can write through the copy it just handed out.',
    },
    {
      line: 11,
      text: '`computed()` is lazy and cached: reading `total()` twice with no write to `_items` in between costs one recomputation, not two.',
    },
    {
      line: 16,
      text: 'The signature is the API. A consumer never sees `_items`; it sees `addItem(item)` — a verb, not a slot to assign to.',
    },
    {
      line: 17,
      text: 'The spread is the whole reason this renders anywhere: `[...list, item]` is a **new array**, a new reference the signal can compare against the old one and find different.',
    },
  ];

  /**
   * Sample: syncing a signal to `localStorage` — hydrate once, in a field
   * initializer; sync back with an `effect()` created in the constructor.
   */
  protected readonly persistSample = `@Injectable({ providedIn: 'root' })
export class ThemeStore {
  // HYDRATE — read storage synchronously, in the FIELD INITIALIZER, so
  // the correct theme is already the signal's first value.
  private readonly _theme = signal<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light',
  );

  readonly theme = this._theme.asReadonly();

  constructor() {
    // SYNC BACK — effect() needs an injection context; the constructor
    // is the simplest one. It runs once immediately, then again after
    // every change to a signal it reads.
    effect(() => {
      // Reading _theme() here is what SUBSCRIBES this effect to it.
      localStorage.setItem('theme', this._theme());
    });
  }

  toggle() {
    this._theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }
}`;

  /** Line-by-line walkthrough of {@link persistSample}. */
  protected readonly persistNotes: CodeNote[] = [
    {
      line: 5,
      text: 'The initial value is computed **during construction**, before the first render — so a returning user sees the right theme on the very first paint instead of a flash of the default.',
    },
    {
      line: 6,
      text: "`getItem` returns `string | null`. The cast narrows it to the union and `?? 'light'` covers a first visit — but a cast is a promise to the compiler, not a check: a corrupted value in storage would slip through exactly as written.",
    },
    {
      line: 11,
      text: "A component's constructor is an injection context, which is what `effect()` requires. Creating it anywhere else — a later method call, an event handler — throws.",
    },
    {
      line: 15,
      text: 'This runs once immediately (there is nothing to compare yet) and then again every time `_theme` changes. Persistence is exactly the right job for an `effect` — a side effect on the world **outside** Angular. Deriving a value is not; that is what `computed` is for.',
    },
  ];

  /**
   * Sample: `@ngrx/signals` — the same private/public/derived/method shape,
   * generated by composing `with*` features instead of writing the class.
   */
  protected readonly ngrxSignalsSample = `export const TodoStore = signalStore(
  { providedIn: 'root' },
  withState({ todos: [] as Todo[], filter: 'all' as Filter }),
  withComputed((s) => ({
    remaining: computed(() => s.todos().filter((t) => !t.done).length),
  })),
  withMethods((store) => ({
    add(title: string) {
      patchState(store, { todos: [...store.todos(), mk(title)] });
    },
  })),
);`;

  /** Line-by-line walkthrough of {@link ngrxSignalsSample}. */
  protected readonly ngrxSignalsNotes: CodeNote[] = [
    {
      line: 1,
      text: '`signalStore()` returns an injectable class built from the `with*` calls below — same shape as the hand-written `CartStore`, just generated instead of typed out.',
    },
    {
      line: 3,
      text: '`withState` defines the slice. Every top-level key becomes a signal automatically — `store.todos()` and `store.filter()` exist with no boilerplate declarations, the way `_todos`/`todos` had to be written by hand above.',
    },
    {
      line: 4,
      text: '`withComputed` receives the store built so far, so `s.todos` already exists and is fully typed. This is the equivalent of an NgRx **selector**.',
    },
    {
      line: 9,
      text: '`patchState` shallow-merges a partial into the state — name only the key you are changing, and `filter` is left untouched. Same immutability rule as raw signals: the spread inside is what makes this a new reference.',
    },
  ];

  /**
   * Sample: classic NgRx — actions in, a pure reducer, an effect for the
   * impure work. Condensed to the two mistakes that actually cost people time.
   */
  protected readonly ngrxClassicSample = `// ACTIONS — every state change is one of these, and nothing else
export const loadTodos   = createAction('[Todos] Load');
export const todosLoaded = createAction('[Todos] Loaded', props<{ todos: Todo[] }>());
export const todosFailed = createAction('[Todos] Failed', props<{ error: string }>());

// REDUCER — (state, action) => new state. Pure. Synchronous.
export const todosReducer = createReducer(
  { todos: [] as Todo[], loading: false, error: '' },
  on(loadTodos,   (s)    => ({ ...s, loading: true })),
  on(todosLoaded, (s, a) => ({ ...s, loading: false, todos: a.todos })),
  on(todosFailed, (s, a) => ({ ...s, loading: false, error: a.error })),
);

// EFFECT — actions in, actions out. The impure work lives here.
loadTodos$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadTodos),
    switchMap(() =>
      this.api.getAll().pipe(
        map((todos) => todosLoaded({ todos })),
        catchError((e) => of(todosFailed({ error: e.message }))),
      ),
    ),
  ),
);`;

  /** Line-by-line walkthrough of {@link ngrxClassicSample}. */
  protected readonly ngrxClassicNotes: CodeNote[] = [
    {
      line: 3,
      text: "`props<{ todos: Todo[] }>()` declares the payload shape. Dispatch the wrong shape and it fails to **compile** — most of NgRx's safety is this one line, repeated per action.",
    },
    {
      line: 11,
      text: "This handler and the one above it both clear `loading`. Miss either — write the failure handler and forget the success one, or the reverse — and the spinner spins forever. This is the single most common NgRx bug, and the reducer's own type system cannot catch it for you.",
    },
    {
      line: 17,
      text: '`ofType` filters `actions$` — a stream of **every** action dispatched anywhere in the app — down to the one this effect cares about.',
    },
    {
      line: 18,
      text: '`switchMap` cancels an in-flight request the moment a new `loadTodos` arrives — correct here, because only the latest result matters. Use `concatMap` instead for a save, where every request must complete.',
    },
    {
      line: 21,
      text: '`catchError` sits **inside** the inner pipe on purpose. Move it to the outer `pipe()` and one failed request completes `actions$` itself — silently killing every future dispatch in the app, not just this effect.',
    },
  ];

  /**
   * Sample: async data is state too — `resource()` covers the loading/error/
   * data triple, `linkedSignal()` covers writable state that should reset.
   */
  protected readonly asyncSample = `// resource(): request params in, an async loader out — status signals included
readonly userId = signal(1);
readonly user = resource({
  params: () => ({ id: this.userId() }),          // reactive — reruns on change
  loader: ({ params }) => fetch('/api/users/' + params.id).then((r) => r.json()),
});
// user.value() · user.isLoading() · user.error() — no hand-rolled triple

// linkedSignal(): writable state that RESETS whenever its source changes
readonly options = input.required<string[]>();
readonly selected = linkedSignal(() => this.options()[0]);
// selected.set(...) is legal — a plain computed() would reject that`;

  /** Line-by-line walkthrough of {@link asyncSample}. */
  protected readonly asyncNotes: CodeNote[] = [
    {
      line: 3,
      text: '`resource()` takes a reactive `params` function and a `loader`. Angular re-runs the loader whenever `params()` produces a new value — here, whenever `userId` changes.',
    },
    {
      line: 7,
      text: 'Three signals come free: `value()`, `isLoading()`, `error()`. That is the triple every hand-rolled service used to declare by hand, for every single request.',
    },
    {
      line: 11,
      text: '`linkedSignal` looks like `computed` — a function of other signals — but the value it produces is **writable**, and resets to the computed default whenever `options` itself changes.',
    },
    {
      line: 12,
      text: 'A plain `computed()` would refuse a `.set()` outright. `linkedSignal` is the one primitive built for "derived, but the user is also allowed to override it".',
    },
  ];

  /**
   * The self-test.
   *
   * The distractors are the beliefs that make "it silently doesn't render"
   * feel wrong: that mutation should throw, that it should catch up on its
   * own, or that `computed()` is somehow immune. Each `why` names the belief
   * directly (CONTRIBUTING §2A), because the correct answer alone doesn't
   * correct any of them.
   */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'Nothing — the new todo is in the array, but no view re-renders, because `push` returns the same reference and the signal never announces a change.',
      correct: true,
      why: 'Exactly. The signal only compares the reference it holds against the one it held last time. `push` mutates in place, so that comparison always says "unchanged" — no matter what the array now contains.',
    },
    {
      text: 'It throws, because a signal rejects any direct mutation of the value it holds.',
      why: 'Signals do not wrap or freeze the value — `this._todos()` hands back the real array, and JavaScript lets you call `.push()` on it without complaint. The mistake compiles and runs; it just never notifies anyone.',
    },
    {
      text: 'It renders on the next click of something else, because the array is still being tracked.',
      why: 'Only if that unrelated click happens to change a **different** signal or otherwise schedules a pass — the mutation itself never causes one. Nothing about it is "delayed"; it stays invisible until something else forces a render, which is not something to build on.',
    },
    {
      text: '`computed()` selectors built from this store still update correctly, even though direct reads of the signal do not.',
      why: 'The opposite, if anything: a `computed` reruns only when a signal **it reads** reports a change, and this one never does. Every downstream `computed` — a remaining count, a filtered list — is exactly as stale as the raw signal underneath it.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why does the store have to expose `asReadonly()` signals instead of the writable ones?',
      a: 'Encapsulation of invariants. With a writable signal, any component that injects the store could `set()` arbitrary state, skipping validation and the one-method-per-action audit trail. Read-only projections make the named methods the **only** way in — the same reason Redux only lets you dispatch actions, never assign to state directly.',
    },
    {
      q: 'I mutated the array by accident — is my data actually broken now, or just the screen?',
      a: 'Just the screen. `this._todos()` still holds the real, updated array in memory — call `remove(id)` right after and it will find and remove the item you just pushed. All that failed was the announcement: no new reference, so the signal never wrote, so nothing scheduled a pass. The next totally unrelated state change will re-read the mutated array and the view will suddenly catch up.',
    },
    {
      q: "This page's store is provided on the component, not the root — what's the actual lifetime difference?",
      a: "`providedIn: 'root'` gives you one instance for the whole app, created on first use and never destroyed. Listing a store in a component's (or a lazy route's) `providers` scopes one instance to that subtree — created when it is, destroyed when it is. Reload this lesson and you get a fresh `TodoStore` with the seeded data back; a wizard or a per-order cart wants exactly that, while auth or theme wants the root.",
    },
    {
      q: 'When is classic NgRx actually worth its ceremony over a signal store?',
      a: 'When you need the action log itself: time-travel debugging, an audit requirement, many developers coordinating on the same state slice, or cross-cutting side effects that several features need to react to consistently. Below that bar — which is most apps — a signal store gives the same one-path-in guarantee for a fraction of the files.',
    },
    {
      q: 'Where do side effects like persistence belong in a signal store?',
      a: "In an `effect()` created in the store's constructor — an injection context — reading the public signals, exactly like the `localStorage` sync above. Not inside a mutation method: an effect created there would run imperatively on that one call path and get skipped by every other method that changes the same state. And never in a component, or every consumer duplicates the same side effect.",
    },
  ];
}
