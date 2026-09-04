import { Component, InjectionToken, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';
import { Beacon } from './di-advanced.shared';
import { DiChildOwn } from './di-child-own/di-child-own';
import { DiChildBare } from './di-child-bare/di-child-bare';
import { DiHostChild } from './di-host-child/di-host-child';

/** A multi-provider token — many providers contribute to one array. */
const FEATURE = new InjectionToken<string>('FEATURE');

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: advanced dependency injection — the two injector trees walked as one
 * containment diagram, a LIVE resolution-modifier playground (real components
 * proving self/skipSelf/optional/host against real instances, including a
 * directive nested a view deep to make `host` mean something `self` cannot),
 * multi providers, viewProviders, injection context rules, tree-shakable
 * tokens (`root`/`any`/route-scoped), authoring `provideX()` functions with
 * `makeEnvironmentProviders`, the two modern initializer functions, forwardRef,
 * and — the mix-up worth being precise about — a declaration-order cycle
 * against a real, unfixable construction cycle.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9); shape copied from
 * `expert/change-detection`, the reference implementation. Teaching order:
 * pose the ambiguity (which instance do you get?) before naming resolution at
 * all, an analogy for the two-tree walk before its vocabulary, then the same
 * walk in four modes — a containment diagram, live components proving each
 * modifier against real instances, a dialogue for the injection-context rule,
 * and annotated code for every API surface.
 */
@Component({
  selector: 'app-lesson-di-advanced',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
    DiChildOwn,
    DiChildBare,
    DiHostChild,
  ],
  providers: [
    Beacon,
    { provide: FEATURE, useValue: 'logging', multi: true },
    { provide: FEATURE, useValue: 'analytics', multi: true },
    { provide: FEATURE, useValue: 'offline-cache', multi: true },
  ],
  styleUrl: './di-advanced.css',
  templateUrl: './di-advanced.html',
})
export class DiAdvanced {
  /**
   * The lesson component's own instance, the one the children walk up to.
   */
  readonly lessonBeacon = inject(Beacon);
  /**
   * Everything contributed under the multi-provider token. Cast because the token
   * is declared per-contribution but injects as an array.
   */
  protected readonly features = inject(FEATURE) as unknown as string[];

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Dependency Injection track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Services & DI', id: 'services-di' },
    { label: 'DI Providers', id: 'di-providers' },
    { label: 'Advanced DI' },
  ];

  /**
   * The exchange that decides whether `inject()` is legal right now.
   *
   * Learners reliably picture "injection context" as a property of a FILE or a
   * CLASS — as if some methods are simply allowed to call `inject()` and others
   * are not. It's actually a property of a MOMENT: Angular is either in the
   * middle of constructing something, or it isn't, and the same method would
   * answer differently depending on when you ask. A dialogue stages that timing
   * far better than a paragraph about "constructors and field initializers."
   */
  protected readonly contextTalk: BubbleTurn[] = [
    {
      who: 'Your code',
      says: "I'm a field initializer. Can I call `inject(HttpClient)`?",
    },
    {
      who: 'The injector',
      says: "Yes — Angular is actively constructing you right now, so there's a current injector to ask.",
    },
    {
      who: 'Your code',
      says: "Now I'm inside a `(click)` handler, ten minutes later. Same call — can I?",
    },
    {
      who: 'The injector',
      says: "No. Construction finished the moment your constructor returned, and the context closed with it. I'm not here to ask anymore.",
    },
    {
      who: 'Your code',
      says: 'I captured `Injector` in a field before you left. Can I use that?',
    },
    {
      who: 'The injector',
      says: "That's `runInInjectionContext()` — hand me back to `inject()` for one call, and it works. I never left, you just kept my number.",
    },
  ];

  /**
   * Sample: the resolution modifiers, matching the live playground.
   */
  protected readonly modifiersSample = `readonly own = inject(Beacon);
// full walk — finds the nearest Beacon, including one on this element

readonly fromParent = inject(Beacon, { skipSelf: true });
// starts at the PARENT — steps over a local provider on purpose

readonly localOnly = inject(Beacon, { self: true, optional: true });
// only this element's own injector — never climbs, so it is null with no local provider

readonly bounded = inject(ControlContainer, { host: true, optional: true });
// allowed to see this component's own view — walled off from an ancestor component

// the decorator-era spelling of the same four options:
constructor(@Optional() @SkipSelf() parent?: Beacon) {}`;

  /** Line-by-line walkthrough of {@link modifiersSample}. */
  protected readonly modifiersNotes: CodeNote[] = [
    {
      line: 1,
      text: '`inject(Beacon)` with no second argument is the default walk: this element first, then every DOM ancestor, then the environment chain.',
    },
    {
      line: 2,
      text: 'A trailing `//` comment — kept in the sample on purpose alongside the note, because the two do different jobs (CONTRIBUTING §2B.4).',
    },
    {
      line: 4,
      text: '`{ skipSelf: true }` is the second argument to `inject()` — an `InjectOptions` object, not a separate function. `skipSelf` moves the STARTING point up one, unconditionally.',
    },
    {
      line: 5,
      text: 'This is an instruction about WHERE to start looking, not about what happens if this element has its own provider. It skips straight past it either way.',
    },
    {
      line: 7,
      text: '`self: true` narrows the search to exactly this element — no parent, no environment chain, nothing else.',
    },
    {
      line: 8,
      text: '`optional: true` is what turns a miss into `null` instead of a thrown `NullInjectorError`. It composes with any of the other three.',
    },
    {
      line: 10,
      text: "`host: true` — the one that stops the walk at THIS component's own view boundary. `ControlContainer` here is the real service Angular's own form directives look up this exact way.",
    },
    {
      line: 14,
      text: '`@Optional()` and `@SkipSelf()` are parameter decorators — the pre-`inject()` spelling of the same two options, still legal, still seen in older code and in some third-party libraries.',
    },
  ];

  /**
   * Sample: several providers accumulating into one array under `multi: true`.
   */
  protected readonly multiSample = `{ provide: FEATURE, useValue: 'logging',       multi: true },
{ provide: FEATURE, useValue: 'analytics',     multi: true },
{ provide: FEATURE, useValue: 'offline-cache', multi: true },

const features = inject(FEATURE);
// string[] — all three, in registration order. Drop \`multi: true\` from any
// one of these and it REPLACES the others instead of joining them.

// the framework's own extension points work exactly like this:
{ provide: NG_VALIDATORS, useExisting: MyValidator, multi: true }`;

  /** Line-by-line walkthrough of {@link multiSample}. */
  protected readonly multiNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Three separate provider objects, all naming the same `FEATURE` token. Without `multi: true` on every single one, each later registration would REPLACE the one before it.',
    },
    {
      line: 5,
      text: '`inject(FEATURE)` on a multi-provider token returns the whole collected array — never one value — even though each individual provider above only names one string.',
    },
    {
      line: 6,
      text: "The type signature does not save you here, in either direction: `InjectionToken<string>` types `inject(FEATURE)` as one `string`, not `string[]` — which is why this lesson's own class field above has to force it with `as unknown as string[]` instead of getting the array for free. And nothing checks that every registration below actually kept `multi: true` either, so a forgotten one is a silent runtime surprise, not a compile error.",
    },
    {
      line: 10,
      text: "`NG_VALIDATORS` is Angular Forms' own multi-provider token — every `Validator` directive on a control registers itself this way. It is the same pattern, not a special case.",
    },
  ];

  /**
   * Sample: `providers` against `viewProviders` — the difference only shows for
   * projected content, which can inject the first and not the second.
   */
  protected readonly viewProvidersSample = `@Component({
  selector: 'app-card',
  providers:     [CardState],   // view AND projected content can inject this
  viewProviders: [CardTheme],   // ONLY the view can inject this
  template: \`<div class="card"><ng-content /></div>\`,
})
export class Card {}

// consumer writes:
// <app-card><app-badge /></app-card>
//
// app-badge is PROJECTED content — written in the consumer's template, not
// Card's — so it walks Card's element injector too, but never Card's view:
// app-badge CAN inject CardState. app-badge CANNOT inject CardTheme.`;

  /** Line-by-line walkthrough of {@link viewProvidersSample}. */
  protected readonly viewProvidersNotes: CodeNote[] = [
    {
      line: 1,
      text: 'One decorator, two separate provider arrays — `providers` and `viewProviders` are not alternative spellings of the same thing.',
    },
    {
      line: 3,
      text: "`providers` sits on the element injector that BOTH `Card`'s own template and anything projected into it can see. This is the array most components use.",
    },
    {
      line: 4,
      text: "`viewProviders` sits one layer deeper — visible only to `Card`'s own view. It exists specifically so an internal implementation detail cannot be reached by a consumer's projected content.",
    },
    {
      line: 5,
      text: "`<ng-content />` is where the consumer's markup actually renders — physically inside `Card`'s DOM, but logically still the CONSUMER's content for DI purposes.",
    },
    {
      line: 10,
      text: '`app-badge` is written in the OUTER template, between `<app-card>`\'s tags — that is what "projected" means here, as opposed to appearing inside `card.html` itself.',
    },
    {
      line: 13,
      text: "The one-line rule: `providers` is the component's public DI surface for its consumers; `viewProviders` is its private one.",
    },
  ];

  /**
   * Sample: injection context — where `inject()` is legal, and `Injector` /
   * `runInInjectionContext` for when it is not.
   */
  protected readonly contextSample = `export class Widget {
  private http = inject(HttpClient);        // field initializer — a context exists here
  private injector = inject(Injector);      // capture the injector while you still can

  constructor() {
    const cfg = inject(APP_CONFIG);         // constructors also run in a context
  }

  onClick() {
    const svc = inject(Thing);              // too late — the context already closed
    runInInjectionContext(this.injector, () => {
      const svc = inject(Thing);            // bridged back in, using the captured injector
    });
  }
}`;

  /** Line-by-line walkthrough of {@link contextSample}. */
  protected readonly contextNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Field initializers run WHILE Angular is constructing the instance, which is exactly what an injection context is — so `inject()` is legal here.',
    },
    {
      line: 3,
      text: '`Injector` is itself an injectable — a handle to the current injector. Capturing it here is the standard move for using `inject()`-like lookups later, after the context closes.',
    },
    {
      line: 6,
      text: 'The constructor body is still inside construction, so this is legal too — same rule as line 2, different syntax.',
    },
    {
      line: 10,
      text: 'A click handler runs long after construction finished. There is no current injector to ask, so this throws `NG0203`.',
    },
    {
      line: 11,
      text: '`runInInjectionContext(injector, fn)` re-opens a context for the duration of `fn`, using the injector you captured earlier — the sanctioned bridge back in.',
    },
  ];

  /**
   * Sample: tree-shakable tokens, provider scopes, and route-scoped environment
   * injectors.
   */
  protected readonly tokenSample = `// tree-shakable service — bundled only if something injects it
@Injectable({ providedIn: 'root' })
export class Metrics {}

// a token with a factory default (the factory runs in an injection context)
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => inject(ENVIRONMENT).apiUrl,
});

// route-scoped environment injector — one instance per lazy feature, not one per app
{
  path: 'admin',
  providers: [AdminAuditService],
  loadChildren: () => import('./admin/admin.routes'),
}`;

  /** Line-by-line walkthrough of {@link tokenSample}. */
  protected readonly tokenNotes: CodeNote[] = [
    {
      line: 2,
      text: "`providedIn: 'root'` registers `Metrics` with the root environment injector WITHOUT listing it in any `providers` array — and if nothing ever injects it, the bundler drops the class entirely.",
    },
    {
      line: 6,
      text: '`InjectionToken<string>` gives `API_URL` a real, distinct compile-time type — plain strings as tokens would all collide on the same underlying object.',
    },
    {
      line: 8,
      text: 'The `factory` runs lazily, the first time something injects `API_URL` — and it runs IN an injection context, so it can `inject()` other services to compute its value.',
    },
    {
      line: 14,
      text: 'A lazy route\'s own `providers` array creates a fresh environment injector scoped to that feature — "singleton within the feature," not an app-wide singleton, and it is destroyed if the route is fully unloaded.',
    },
  ];

  /**
   * Sample: authoring a library-shaped `provideX()` function with
   * `makeEnvironmentProviders`, and the two modern initializer functions.
   */
  protected readonly envProvidersSample = `export function provideAnalytics(config: AnalyticsConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ANALYTICS_CONFIG, useValue: config },
    AnalyticsService,
    provideEnvironmentInitializer(() => inject(AnalyticsService).start()),
  ]);
}

// consumer, in app.config.ts:
bootstrapApplication(AppComponent, {
  providers: [provideAnalytics({ writeKey: 'abc123' })],
});

// blocks bootstrap until it settles — for "the app must not render without this":
provideAppInitializer(() => inject(FeatureFlags).load());

// runs eagerly the instant the injector exists — blocks nothing:
provideEnvironmentInitializer(() => inject(AnalyticsService).start());`;

  /** Line-by-line walkthrough of {@link envProvidersSample}. */
  protected readonly envProvidersNotes: CodeNote[] = [
    {
      line: 1,
      text: 'This is the exact shape `provideRouter()` and `provideHttpClient()` use: a plain function returning `EnvironmentProviders`, not a `Provider[]`.',
    },
    {
      line: 2,
      text: '`makeEnvironmentProviders()` wraps a normal provider array into that opaque `EnvironmentProviders` type — the wrapping is the whole point, see the notes below.',
    },
    {
      line: 5,
      text: '`provideEnvironmentInitializer()` can be registered from INSIDE a `provideX()` function, alongside the services it configures — nothing forces initializers to live only in `app.config.ts`.',
    },
    {
      line: 11,
      text: "This is the ONLY kind of place `provideAnalytics` is allowed to go, because it returns `EnvironmentProviders`. TypeScript refuses to let that exact same call into a single component's `providers: []` array — see the quiz below.",
    },
    {
      line: 15,
      text: '`provideAppInitializer()` — the modern, function-based replacement for the old `{ provide: APP_INITIALIZER, useFactory: ..., multi: true }` boilerplate. Its callback runs in an injection context, and if it returns a promise or observable, bootstrap genuinely waits.',
    },
    {
      line: 18,
      text: '`provideEnvironmentInitializer()` looks almost identical but answers a different question: it runs synchronously and eagerly the moment the injector is built, and nothing waits for it — see the FAQ for when to reach for which.',
    },
  ];

  /**
   * Sample: `forwardRef`, for the declaration-order cycle a provider that
   * references its own not-yet-defined class creates.
   */
  protected readonly forwardRefSample = `@Component({
  selector: 'app-rating',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => RatingControl),
    multi: true,
  }],
})
export class RatingControl implements ControlValueAccessor { /* … */ }`;

  /** Line-by-line walkthrough of {@link forwardRefSample}. */
  protected readonly forwardRefNotes: CodeNote[] = [
    {
      line: 3,
      text: "The decorator's `providers` array is evaluated the MOMENT the class body runs — which is before the class itself finishes being defined a few lines down.",
    },
    {
      line: 4,
      text: '`useExisting`, not `useClass`: resolve to the component instance Angular already created for this element, not a second, disconnected copy of it. This is the standard `ControlValueAccessor` self-registration idiom.',
    },
    {
      line: 5,
      text: 'Naming `RatingControl` directly here would throw "Cannot access \'RatingControl\' before initialization" — a plain JavaScript temporal-dead-zone error, nothing Angular-specific. `forwardRef(() => RatingControl)` wraps it in an arrow function Angular calls LATER, once the class exists. The arrow is the entire fix.',
    },
    {
      line: 6,
      text: 'Still needs `multi: true` — `NG_VALUE_ACCESSOR` is itself a multi-provider token, same rule as the `FEATURE` example above.',
    },
    {
      line: 9,
      text: 'By the time anything actually asks for `NG_VALUE_ACCESSOR`, the class is long since defined — the delay only had to last until the module finished loading, and it did.',
    },
  ];

  /** The self-test on resolution modifiers, tied to the live playground above it. */
  protected readonly modifierQuizOptions: QuizOption[] = [
    {
      text: "Its own — skipSelf only matters when there's no local provider.",
      why: 'Backwards. `skipSelf` steps over the local provider ON PURPOSE, whether or not one exists — that is the entire feature. If it only mattered in the absence of a local provider, it would be indistinguishable from the default walk.',
    },
    {
      text: "The lesson's instance.",
      correct: true,
      why: "Right. `skipSelf` starts the search at the PARENT, ignoring whatever this element itself provides. It's the standard tool for a component that needs its own instance for its own descendants but ALSO needs to reach its ancestor's — a recursive tree component is the classic case.",
    },
    {
      text: 'null, because skipSelf implies optional.',
      why: 'The two are independent. `skipSelf` only changes WHERE the walk starts; whether a miss throws or returns `null` is entirely down to `optional`. Without `optional: true` here, a miss would throw `NullInjectorError`, not return `null`.',
    },
    {
      text: 'Throws NullInjectorError — nothing above a component provides its own instance.',
      why: "There is something above it: the LESSON component provides its own `Beacon`, and skipSelf's whole job is to start looking from there. The walk finds it on the very next hop.",
    },
  ];

  /** The self-test on EnvironmentProviders, tied to the provideX() section. */
  protected readonly envProvidersQuizOptions: QuizOption[] = [
    {
      text: 'It works — a component providers array accepts anything.',
      why: "A component's `providers` array is typed as `Provider[]`, and `EnvironmentProviders` is a deliberately different, opaque type. This never gets past the compiler.",
    },
    {
      text: 'It compiles, but throws at runtime the first time DI resolves the token.',
      why: "Close, but caught earlier than that: this is a TYPE error, not a runtime one. `EnvironmentProviders` isn't assignable to a `Provider[]`-typed array, so the build fails before the app ever runs.",
    },
    {
      text: "It fails to compile — EnvironmentProviders isn't assignable there.",
      correct: true,
      why: "Exactly, and that's the feature, not a limitation. Wrapping an array in `makeEnvironmentProviders` is how a library author GUARANTEES their function can only be used where an environment injector is being configured — never accidentally dropped onto one component.",
    },
    {
      text: 'It works, but creates a new instance per component instead of one for the app.',
      why: "It never gets that far — the compiler stops it first. A fresh instance per component is what a component's own plain `providers: [MyService]` array already gives you; `EnvironmentProviders` is answering a different question entirely.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "What's actually different between `host` and `self`?",
      a: '`self: true` only ever looks at the exact element the call is running on. `host: true` is more generous — it can see anything provided anywhere inside the CURRENT COMPONENT\'S OWN VIEW — but refuses to step outside that view into an ancestor component, which `self` was never going to reach anyway. The two agree whenever the call is made directly inside a component\'s own class, because there is no "inside the view" left to be generous about; they disagree the moment a directive further inside that view is the one asking — exactly the live probe above.',
    },
    {
      q: "Two lazy-loaded routes each list the same `providedIn: 'root'` service in their OWN `providers` array. Do they share one instance?",
      a: "No — and this is one of the nastier DI bugs to spot, because nothing errors. You actually end up with THREE separate instances: root's own, plus one fresh instance per route, each scoped to that route's own environment injector and shared with neither root nor the other route. Components under a route silently get that route's own copy. The tell is state that resets every time you navigate into the feature. The fix is almost always to delete the redundant `providers` entry — `providedIn: 'root'` already registered it everywhere.",
    },
    {
      q: 'Does `forwardRef` fix a real circular dependency between two services?',
      a: 'No, and this is the mix-up worth being precise about — see the section below. `forwardRef` only fixes a **declaration-order** problem: one class referencing itself before the file has finished evaluating. Two DIFFERENT services genuinely needing each other to construct is a real graph cycle, and no amount of delaying a class reference changes that neither one can be built first.',
    },
    {
      q: "Why does `provideAppInitializer` block bootstrap but `provideEnvironmentInitializer` doesn't?",
      a: 'Because they answer different questions. `provideAppInitializer` is for "the app must not render before this is ready" — bootstrap genuinely waits for the returned promise or observable. `provideEnvironmentInitializer` is for "wire this up the moment the injector exists" — it runs eagerly and synchronously, and nothing waits on it. Reach for the blocking one only when a blank screen for a few extra milliseconds is actually the right trade.',
    },
    {
      q: 'Can I rely on multi providers keeping registration order?',
      a: "Within one `providers` array, yes — Angular collects a multi-token's contributions in the order you registered them, which is why the three `FEATURE` entries at the top of this lesson always resolve `['logging', 'analytics', 'offline-cache']` in that order. Don't extend that assumption ACROSS different injector levels, though — a child that provides the same token again gets its OWN list, not a merge with its parent's.",
    },
  ];

  /** Illustration: the SAME error, `NG0200`, from a declaration-order cycle — `forwardRef` fixes this one. */
  protected readonly cycleFixableSample = `@Component({
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => RatingControl),
  }],
})
export class RatingControl {}
// forwardRef delays the lookup past class-definition time — works, always`;

  /** Illustration: `NG0200` from a REAL construction cycle — forwardRef cannot fix this one. */
  protected readonly cycleUnfixableSample = `@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private router: RouterService) {}
}

@Injectable({ providedIn: 'root' })
export class RouterService {
  constructor(private auth: AuthService) {}
}
// there is no valid order to construct either one first —
// forwardRef does not help: this isn't a timing problem, it's a real graph cycle`;

  /** Ask-before-telling on skipSelf's independence from whether a local provider exists. */
  protected readonly skipSelfPredictPrompt =
    "You've just seen `skipSelf` step over a LOCAL provider on purpose. Now picture a child with no local `Beacon` provider at all, calling the exact same `inject(Beacon, { skipSelf: true, optional: true })`. Does removing the local provider change what it finds?";
  protected readonly skipSelfPredictAnswer =
    'No. `skipSelf` was never "about" the local provider — it\'s an instruction about WHERE TO START, full stop. With or without a local provider, the walk begins at the parent. The one call that DOES change its answer when you remove the local provider is the DEFAULT call with no modifier at all — that\'s the only one that checks locally first and only climbs if it comes up empty.';
}
