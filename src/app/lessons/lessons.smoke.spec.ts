import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CURRICULUM } from '../core/curriculum';

/**
 * Smoke coverage for every written lesson component.
 *
 * `ng build` already proves each template *compiles*. What it cannot prove is
 * that a component *constructs and renders* — an `inject()` called outside an
 * injection context, a missing provider, a `computed` that throws on its first
 * read, or an `effect` that blows up on the initial flush all build cleanly and
 * fail only when someone opens the page.
 *
 * That gap matters here because lessons are the bulk of the app and are
 * otherwise untested: they are demo-heavy by design, and a demo that throws on
 * mount is a broken lesson. Rather than ~100 near-identical spec files, this
 * walks {@link CURRICULUM} itself, so a lesson added tomorrow is covered the
 * moment it is registered — and a lesson whose component is renamed or moved
 * fails here rather than 404-ing at runtime.
 *
 * The providers below are the union of what any lesson needs. Supplying them to
 * every lesson is deliberate: the alternative is a per-lesson provider table
 * that has to be maintained in lockstep with the demos.
 */
const written = CURRICULUM.filter((lesson) => lesson.loadComponent);

describe('lesson components', () => {
  it('the curriculum has lessons to test', () => {
    // Guards against the walk silently covering nothing if CURRICULUM's shape
    // changes — a green run over zero lessons would otherwise look identical.
    expect(written.length).toBeGreaterThan(90);
  });

  for (const lesson of written) {
    it(`${lesson.id} mounts and renders content`, async () => {
      const component = await lesson.loadComponent!();

      TestBed.configureTestingModule({
        imports: [component],
        providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      });
      // Required by lessons using @defer — their metadata resolves asynchronously.
      await TestBed.compileComponents();

      const fixture = TestBed.createComponent(component);
      // `false` skips the checkNoChanges pass. Three lessons (interpolation,
      // change-detection, zoneless) deliberately display a render counter that
      // increments on every pass, snapshotted in `afterEveryRender`. In the real
      // app that hook runs after checkNoChanges, so the binding is stable; under
      // TestBed it runs between the two passes and trips NG0100. Rendering
      // without throwing is what this suite is asserting — NG0100 is a separate
      // property, and enforcing it here would mean breaking those demos.
      fixture.detectChanges(false);
      await fixture.whenStable();

      const host = fixture.nativeElement as HTMLElement;
      // A lesson that renders an empty shell is as broken as one that throws.
      expect(host.textContent?.trim().length ?? 0).toBeGreaterThan(0);
      expect(host.querySelector('h1')).toBeTruthy();

      fixture.destroy();
    });
  }
});
