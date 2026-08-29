import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe, { type RunOptions, type Result } from 'axe-core';
import { routes } from './app.routes';
import { CURRICULUM } from './core/curriculum';

/**
 * Automated accessibility checks over every lesson and study-tool page.
 *
 * The app teaches an a11y lesson, so failing WCAG itself would be a poor look.
 * Nothing verified that until now — `docs/UI-DESIGN.md` claimed a target of
 * WCAG 2.1 AA and the claim was untested.
 *
 * What this can and cannot catch is worth being honest about. axe in jsdom sees
 * the DOM but no layout, so the rules below are switched off:
 *
 *   - `color-contrast` needs computed pixel colours. Contrast ratios are checked
 *     by hand and recorded in `docs/UI-DESIGN.md` §5 instead.
 *   - `region`, `landmark-one-main`, `page-has-heading-one`, `html-has-lang` and
 *     `bypass` are document-level rules. Each component here is mounted on its
 *     own, outside the app shell that supplies the landmarks and the `<html
 *     lang>`, so they would fail on every page for a reason that is an artefact
 *     of the test rather than a defect. `app.spec.ts` covers the real shell.
 *
 * What remains is the structural half of WCAG — labels, names, roles, alt text,
 * heading order, ARIA validity, duplicate ids — which is where hand-written
 * markup actually goes wrong.
 */
const AXE_OPTIONS: RunOptions = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: {
    'color-contrast': { enabled: false },
    region: { enabled: false },
    'landmark-one-main': { enabled: false },
    'page-has-heading-one': { enabled: false },
    'html-has-lang': { enabled: false },
    bypass: { enabled: false },
  },
};

/** Renders `violations` as something a developer can act on without a debugger. */
function describeViolations(violations: Result[]): string {
  return violations
    .map((violation) => {
      const targets = violation.nodes
        .slice(0, 3)
        .map((node) => `      ${node.target.join(' ')}\n        ${node.html.slice(0, 140)}`)
        .join('\n');
      const more =
        violation.nodes.length > 3 ? `\n      …and ${violation.nodes.length - 3} more` : '';
      return `  [${violation.impact}] ${violation.id}: ${violation.help}\n${targets}${more}`;
    })
    .join('\n');
}

async function mountAndScan(component: Type<unknown>): Promise<Result[]> {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  await TestBed.compileComponents();

  const fixture = TestBed.createComponent(component);
  fixture.detectChanges(false);
  await fixture.whenStable();

  try {
    const results = await axe.run(fixture.nativeElement as HTMLElement, AXE_OPTIONS);
    return results.violations;
  } finally {
    fixture.destroy();
  }
}

/**
 * axe walks the rendered DOM rule by rule, and the biggest pages here render a
 * few thousand nodes — `/interview` alone exceeds the 5s default. Generous
 * rather than tuned: a slow scan is not the failure this suite looks for.
 */
const SCAN_TIMEOUT_MS = 30_000;

const lessonIds = new Set(CURRICULUM.map((lesson) => lesson.id));
const written = CURRICULUM.filter((lesson) => lesson.loadComponent);
const pageRoutes = routes.filter(
  (route) => route.loadComponent && !lessonIds.has(route.path ?? ''),
);

describe('accessibility', () => {
  beforeEach(() => localStorage.clear());

  describe('lessons', () => {
    for (const lesson of written) {
      it(
        `${lesson.id} has no WCAG violations`,
        async () => {
          const violations = await mountAndScan(await lesson.loadComponent!());
          expect(violations, `\n${describeViolations(violations)}\n`).toEqual([]);
        },
        SCAN_TIMEOUT_MS,
      );
    }
  });

  describe('study-tool pages', () => {
    for (const route of pageRoutes) {
      const label = route.path === '**' ? 'not-found (wildcard)' : `/${route.path}`;

      it(
        `${label} has no WCAG violations`,
        async () => {
          const component = (await route.loadComponent!()) as Type<unknown>;
          const violations = await mountAndScan(component);
          expect(violations, `\n${describeViolations(violations)}\n`).toEqual([]);
        },
        SCAN_TIMEOUT_MS,
      );
    }
  });
});
