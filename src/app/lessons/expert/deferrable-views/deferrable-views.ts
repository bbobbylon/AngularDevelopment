import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeavyWidget } from './heavy-widget/heavy-widget';

/**
 * Lesson: deferrable views — template-level code splitting with @defer. Live
 * demos of the trigger kinds, the compiler mechanics that make the split
 * happen (and silently un-happen), companion-block lifecycles, SSR semantics
 * vs incremental hydration, testing with DeferBlockBehavior, and pitfalls.
 */
@Component({
  selector: 'app-lesson-deferrable-views',
  imports: [RouterLink, HeavyWidget],
  styleUrl: './deferrable-views.css',
  templateUrl: './deferrable-views.html',
})
export class DeferrableViews {
  /**
   * Whether the deferred widget's trigger has fired.
   */
  protected readonly showWidget = signal(false);

  /**
   * Sample: the four blocks — `@defer`, `@placeholder`, `@loading`, `@error` —
   * and the triggers that move between them.
   */
  readonly blocksSample = `@defer (on viewport) {
  <app-heavy-widget />           <!-- ← only this is lazy-loaded -->
} @placeholder (minimum 500ms) {
  <p>Shown before loading starts</p>    <!-- stays in main bundle -->
} @loading (after 100ms; minimum 500ms) {
  <p>Fetching chunk…</p>
} @error {
  <p>Failed to load.</p>
}`;

  /**
   * Sample: what the compiler turns a `@defer` block into, so the lazy chunk is
   * not magic.
   */
  readonly underHoodSample = `// what you write:
@defer (on viewport) { <app-chart /> }

// what the compiler emits (conceptually):
ɵɵdefer(/* … */, () => [
  import('./chart.component').then(m => m.Chart),   // ← real dynamic import
]);
// the bundler sees import() → emits chart-XXXX.js as its own chunk
//
// BUT: one eager <app-chart /> anywhere in the same template, and the
// compiler must import it statically — the chunk quietly disappears.`;

  /**
   * Sample: this app's own use of `@defer` on the lesson grid, including
   * `prefetch on idle`.
   */
  readonly appUsageSample = `@defer (on viewport; prefetch on idle) {
  <div class="grid">
    <!-- lesson cards for each level -->
  </div>
} @placeholder {
  <div class="grid">
    <!-- shimmer skeleton cards (same size → no layout shift) -->
  </div>
}`;

  /**
   * Sample: `@defer` under SSR. The server renders the placeholder, so a plain
   * trigger means the real content only ever appears after hydration — `hydrate on`
   * triggers are what change that.
   */
  readonly hydrationSample = `<!-- plain trigger + SSR: server renders the PLACEHOLDER -->
@defer (on viewport) { <app-reviews /> } @placeholder { <div class="skeleton"></div> }

<!-- hydrate trigger + SSR: server renders the CONTENT, JS arrives lazily -->
@defer (hydrate on viewport) { <app-reviews /> }
@defer (hydrate never)       { <app-static-footer /> }   <!-- never ships JS -->

// app.config.server / client:
provideClientHydration(withIncrementalHydration())`;

  /**
   * Sample: testing deferred blocks with `DeferBlockBehavior.Manual`, which stops
   * the states auto-playing so each can be asserted on.
   */
  readonly testingSample = `TestBed.configureTestingModule({
  deferBlockBehavior: DeferBlockBehavior.Manual,   // don't auto-play states
});
const fixture = TestBed.createComponent(Dashboard);

const [block] = await fixture.getDeferBlocks();
await block.render(DeferBlockState.Loading);      // assert the spinner
await block.render(DeferBlockState.Complete);     // assert the real content
await block.render(DeferBlockState.Error);        // assert the fallback`;
}
