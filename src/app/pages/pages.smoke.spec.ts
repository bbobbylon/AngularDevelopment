import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../app.routes';
import { CURRICULUM } from '../core/curriculum';

/**
 * Smoke coverage for every study-tool page, driven by the route table.
 *
 * The companion to `lessons/lessons.smoke.spec.ts`: that one walks the
 * curriculum, this one walks everything else the router can reach. Eight pages
 * (home, review, glossary, bookmarks, api-playground, interview, certification,
 * not-found) had no tests at all before this; the rest have behavioural specs
 * beside them, and this adds a mount check they were missing.
 *
 * Walking `routes` rather than a hand-kept list means a page added to the router
 * is covered automatically, and one whose component is renamed or moved fails
 * here rather than 404-ing in front of a user.
 *
 * Pages read from localStorage on construction, so each test starts from a clean
 * slate — otherwise one page's seeded state would leak into the next.
 */
const lessonIds = new Set(CURRICULUM.map((lesson) => lesson.id));

const pageRoutes = routes.filter(
  (route) => route.loadComponent && !lessonIds.has(route.path ?? ''),
);

describe('study-tool pages', () => {
  beforeEach(() => localStorage.clear());

  it('the route table has pages to test', () => {
    // A green run over zero routes would look identical to a real pass.
    expect(pageRoutes.length).toBeGreaterThan(10);
  });

  for (const route of pageRoutes) {
    const label = route.path === '**' ? 'not-found (wildcard)' : `/${route.path}`;

    it(`${label} mounts and renders content`, async () => {
      const component = (await route.loadComponent!()) as Type<unknown>;

      TestBed.configureTestingModule({
        imports: [component],
        providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      });
      await TestBed.compileComponents();

      const fixture = TestBed.createComponent(component);
      fixture.detectChanges(false);
      await fixture.whenStable();

      const host = fixture.nativeElement as HTMLElement;
      expect(host.textContent?.trim().length ?? 0).toBeGreaterThan(0);

      fixture.destroy();
    });
  }
});
