import { Component, InjectionToken, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Beacon } from './di-advanced.shared';
import { DiChildOwn } from './di-child-own/di-child-own';
import { DiChildBare } from './di-child-bare/di-child-bare';

/** A multi-provider token — many providers contribute to one array. */
const FEATURE = new InjectionToken<string>('FEATURE');

/**
 * Lesson: advanced dependency injection — the two injector trees, a LIVE
 * resolution-modifier playground (real components proving self/skipSelf/
 * optional against real instances), multi providers, viewProviders,
 * injection context rules, tree-shakable tokens, and forwardRef.
 */
@Component({
  selector: 'app-lesson-di-advanced',
  imports: [RouterLink, DiChildOwn, DiChildBare],
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

  /**
   * Sample: the resolution modifiers, matching the live playground above.
   */
  readonly modifiersSample = `readonly own        = inject(Beacon);                          // nearest, self included
readonly fromParent = inject(Beacon, { skipSelf: true });      // start at parent
readonly localOnly  = inject(Beacon, { self: true, optional: true }); // mine or null
readonly bounded    = inject(ControlContainer, { host: true }); // stop at host component

// decorator-era spelling of the same thing:
constructor(@Optional() @SkipSelf() parent: Beacon) {}`;

  /**
   * Sample: several providers accumulating into one array under `multi: true`.
   */
  readonly multiSample = `{ provide: FEATURE, useValue: 'logging',       multi: true },
{ provide: FEATURE, useValue: 'analytics',     multi: true },
{ provide: FEATURE, useValue: 'offline-cache', multi: true },

const features = inject(FEATURE);  // string[] — all three

// the framework's own extension points work exactly like this:
{ provide: NG_VALIDATORS, useExisting: MyValidator, multi: true }`;

  /**
   * Sample: `providers` against `viewProviders` — the difference only shows for
   * projected content, which can inject the first and not the second.
   */
  readonly viewProvidersSample = `@Component({
  selector: 'app-card',
  providers:     [CardState],   // view + projected content can inject
  viewProviders: [CardTheme],   // ONLY the view — projected content cannot
  template: '<div class="card"><ng-content /></div>',
})

// consumer writes: <app-card><app-badge /></app-card>
// app-badge CAN inject CardState, CANNOT inject CardTheme`;

  /**
   * Sample: injection context — where `inject()` is legal, and `Injector` /
   * `runInInjectionContext` for when it is not.
   */
  readonly contextSample = `export class Widget {
  private http = inject(HttpClient);        // ✓ field initializer
  private injector = inject(Injector);      // capture for later

  constructor() {
    const cfg = inject(APP_CONFIG);         // ✓ constructor
  }

  onClick() {
    const svc = inject(Thing);              // ✗ NG0203 — no context here
    runInInjectionContext(this.injector, () => {
      const svc = inject(Thing);            // ✓ bridged
    });
  }
}`;

  /**
   * Sample: tree-shakable tokens, so an unused service is not bundled.
   */
  readonly tokenSample = `// tree-shakable service — bundled only if injected
@Injectable({ providedIn: 'root' })
export class Metrics {}

// token with a factory default (factory runs in an injection context)
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => inject(ENVIRONMENT).apiUrl,
});

// route-scoped environment injector — feature singleton, not app singleton
{
  path: 'admin',
  providers: [AdminAuditService],
  loadChildren: () => import('./admin/admin.routes'),
}`;

  /**
   * Sample: `forwardRef`, for the circular reference a class referring to itself
   * in its own `providers` creates.
   */
  readonly forwardRefSample = `@Component({
  selector: 'app-rating',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    // THE CIRCULARITY: this decorator runs while the class below is still
    // being defined, so naming RatingControl directly here throws
    // "Cannot access 'RatingControl' before initialization".
    // forwardRef wraps it in an arrow that Angular calls LATER, once the
    // class exists. The arrow is the delay; that is all forwardRef is.
    useExisting: forwardRef(() => RatingControl),  // class not defined yet
    // useExisting, not useClass — resolve to the component instance Angular
    // already created, not a second, disconnected copy of it.
    multi: true,
  }],
})
export class RatingControl implements ControlValueAccessor { … }`;
}
