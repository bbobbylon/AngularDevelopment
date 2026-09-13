import { Component, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { BrainPower, Chain, NoDumbQuestions, Receipt, Scribble, Whiteboard } from './index';

/**
 * Tests for the page-shape set.
 *
 * Same weight as `brain.spec.ts`, for a sharper reason: a shape device opens a
 * lesson, so a regression here is the first thing a reader sees. The assertions
 * stay on the contracts each component documents — the semantic root and the
 * ARIA wiring that let a figure, a bill or a Q&A survive a screen reader, the
 * drawn decoration that has to stay hidden from one, and the RichText rendering
 * every line of copy relies on.
 */

// ── helpers ─────────────────────────────────────────────────────────────────────────

interface Harness<T> {
  readonly fixture: ComponentFixture<T>;
  readonly host: HTMLElement;
}

/** Configures the TestBed and mounts a component with the given inputs. */
function render<T>(component: Type<T>, inputs: Record<string, unknown> = {}): Harness<T> {
  // A test may mount a device twice (its silent and its nudged version), and the
  // TestBed refuses to be configured once a component exists — so start clean.
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [component], providers: [provideRouter([])] });

  const fixture = TestBed.createComponent(component);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();

  return { fixture, host: fixture.nativeElement as HTMLElement };
}

// ── BrainPower ──────────────────────────────────────────────────────────────────────

@Component({
  imports: [BrainPower],
  template: `<app-brain-power question="first" /><app-brain-power question="second" />`,
})
class TwoBrainPowers {}

describe('BrainPower', () => {
  it('is an aside named by its kicker', () => {
    const { host } = render(BrainPower, { question: 'Who caused the timeout?' });

    const aside = host.querySelector('aside.brain-power');
    const kicker = host.querySelector('.brain-power__kicker');
    expect(aside?.getAttribute('aria-labelledby')).toBe(kicker?.id);
    expect(kicker?.id).not.toBe('');
    expect(kicker?.textContent?.trim()).toBe('Brain Power');
  });

  it('renders backticks and bold in the question rather than printing the delimiters', () => {
    const { host } = render(BrainPower, { question: 'Who owns `ngOnInit` — and **when**?' });

    const question = host.querySelector('.brain-power__question');
    expect(question?.querySelector('code')?.textContent).toBe('ngOnInit');
    expect(question?.querySelector('strong')?.textContent).toBe('when');
    expect(question?.textContent).not.toContain('**');
  });

  it('shows the hint line only when there is one', () => {
    const silent = render(BrainPower, { question: 'q' });
    expect(silent.host.querySelector('.brain-power__hint')).toBeNull();

    const nudged = render(BrainPower, { question: 'q', hint: 'Re-read who promised what.' });
    expect(nudged.host.querySelector('.brain-power__hint')?.textContent).toContain(
      'Re-read who promised what.',
    );
  });

  // The device is the question staying open. A reveal control would close it.
  it('has nothing interactive — no reveal, no button', () => {
    const { host } = render(BrainPower, { question: 'q', hint: 'h' });
    expect(host.querySelector('button, details, [tabindex]')).toBeNull();
  });

  it('gives each instance its own id so aria-labelledby resolves on a page with several', () => {
    const { host } = render(TwoBrainPowers);

    const kickers = [...host.querySelectorAll('.brain-power__kicker')].map((k) => k.id);
    expect(kickers).toHaveLength(2);
    expect(kickers[0]).not.toBe(kickers[1]);

    const asides = [...host.querySelectorAll('aside.brain-power')];
    expect(asides.map((a) => a.getAttribute('aria-labelledby'))).toEqual(kickers);
  });
});

// ── Scribble ────────────────────────────────────────────────────────────────────────

describe('Scribble', () => {
  it('quotes the label in a <b> and hides the drawn glyph', () => {
    const { host } = render(Scribble, { quote: 'next(req)', text: 'hands it on' });

    expect(host.querySelector('b.scribble__quote')?.textContent).toBe('next(req)');
    expect(host.querySelector('.scribble__glyph')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('curls down by default and up on request', () => {
    const down = render(Scribble, { quote: 'a', text: 'b' });
    expect(down.host.querySelector('.scribble__glyph')?.textContent).toBe('⤵');
    expect(down.host.querySelector('.scribble--down')).not.toBeNull();

    const up = render(Scribble, { quote: 'a', text: 'b', point: 'up' });
    expect(up.host.querySelector('.scribble__glyph')?.textContent).toBe('⤴');
    expect(up.host.querySelector('.scribble--up')).not.toBeNull();
  });

  it('applies the tone as a modifier class', () => {
    const { host } = render(Scribble, { quote: 'a', text: 'b', tone: 'clay' });
    expect(host.querySelector('.scribble--clay')).not.toBeNull();
  });

  it('renders backticks and bold in the gloss', () => {
    const { host } = render(Scribble, { quote: 'auth', text: 'runs **first**, via `next()`' });

    const gloss = host.querySelector('.scribble__text');
    expect(gloss?.querySelector('strong')?.textContent).toBe('first');
    expect(gloss?.querySelector('code')?.textContent).toBe('next()');
    expect(gloss?.textContent).not.toContain('`');
  });
});

// ── NoDumbQuestions ─────────────────────────────────────────────────────────────────

describe('NoDumbQuestions', () => {
  const ITEMS = [
    { q: 'So my `.card` rule just stops at the child?', a: 'Yes — **nothing matches**.' },
    { q: 'Where does this bite at work?', a: 'The first time you theme a library component.' },
    { q: 'And the fix?', a: 'A custom property crosses the wall; a selector does not.' },
  ];

  it('is a section named by an h2 when it opens the lesson', () => {
    const { host } = render(NoDumbQuestions, { items: ITEMS });

    const heading = host.querySelector('h2.ndq__title');
    expect(heading?.textContent?.trim()).toBe('there are no Dumb Questions');
    expect(host.querySelector('section.ndq')?.getAttribute('aria-labelledby')).toBe(heading?.id);
    expect(heading?.id).not.toBe('');
  });

  it('drops to an h3 inside a section', () => {
    const { host } = render(NoDumbQuestions, { items: ITEMS, level: 3 });
    expect(host.querySelector('h3.ndq__title')).not.toBeNull();
    expect(host.querySelector('h2')).toBeNull();
  });

  it('pairs every question with its answer in a definition list', () => {
    const { host } = render(NoDumbQuestions, { items: ITEMS });

    const terms = host.querySelectorAll('dl.ndq__list > dt');
    const answers = host.querySelectorAll('dl.ndq__list > dd');
    expect(terms).toHaveLength(3);
    expect(answers).toHaveLength(3);
    expect(terms[1].textContent).toContain('Where does this bite at work?');
    expect(answers[1].textContent).toContain('theme a library component');
  });

  // The whole point of the device versus Faq: everything is already open.
  it('keeps every answer open — no disclosure widgets', () => {
    const { host } = render(NoDumbQuestions, { items: ITEMS });
    expect(host.querySelector('details, button')).toBeNull();
  });

  it('hides the drawn Q and A marks from assistive tech', () => {
    const { host } = render(NoDumbQuestions, { items: ITEMS });

    const marks = [...host.querySelectorAll('.ndq__mark')];
    expect(marks).toHaveLength(6);
    expect(marks.every((m) => m.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('renders backticks and bold in questions and answers', () => {
    const { host } = render(NoDumbQuestions, { items: ITEMS });

    const question = host.querySelector('dl.ndq__list > dt');
    expect(question?.querySelector('code')?.textContent).toBe('.card');
    expect(question?.textContent).not.toContain('`');

    const answer = host.querySelector('dl.ndq__list > dd');
    expect(answer?.querySelector('strong')?.textContent).toBe('nothing matches');
    expect(answer?.textContent).not.toContain('**');
  });
});

// ── Receipt ─────────────────────────────────────────────────────────────────────────

describe('Receipt', () => {
  const ROWS = [
    { label: 'main.js', amount: '212 kB' },
    { label: 'chart-widget (eager)', amount: '318 kB', tone: 'warn' as const },
    { label: 'styles.css', amount: '31 kB', tone: 'muted' as const },
  ];

  it('is a table inside a figure, captioned by the heading', () => {
    const { host } = render(Receipt, { heading: 'Initial load', rows: ROWS });

    const caption = host.querySelector('figure.receipt > table.receipt__table > caption');
    expect(caption?.textContent?.trim()).toBe('Initial load');
  });

  it('makes every label a row header with its amount beside it', () => {
    const { host } = render(Receipt, { heading: 'h', rows: ROWS });

    const headers = [...host.querySelectorAll('tbody th[scope="row"]')];
    expect(headers).toHaveLength(3);
    expect(headers[1].textContent).toBe('chart-widget (eager)');
    expect(headers[1].nextElementSibling?.textContent).toBe('318 kB');
  });

  it('prints the total in the footer only when there is one', () => {
    const open = render(Receipt, { heading: 'h', rows: ROWS });
    expect(open.host.querySelector('tfoot')).toBeNull();

    const closed = render(Receipt, {
      heading: 'h',
      rows: ROWS,
      total: { label: 'TOTAL', amount: '561 kB' },
    });
    const total = closed.host.querySelector('tfoot tr.receipt__total');
    expect(total?.querySelector('th')?.textContent).toBe('TOTAL');
    expect(total?.querySelector('td')?.textContent).toBe('561 kB');
  });

  // Weight and a class, so the problem line is findable without colour.
  it('marks the warning and muted lines by class', () => {
    const { host } = render(Receipt, { heading: 'h', rows: ROWS });

    const rows = host.querySelectorAll('tbody tr');
    expect(rows[1].classList.contains('receipt__row--warn')).toBe(true);
    expect(rows[2].classList.contains('receipt__row--muted')).toBe(true);
    expect(rows[0].classList.contains('receipt__row--warn')).toBe(false);
  });

  it('shows the small print only when given', () => {
    const plain = render(Receipt, { heading: 'h', rows: ROWS });
    expect(plain.host.querySelector('figcaption')).toBeNull();

    const signed = render(Receipt, { heading: 'h', rows: ROWS, footer: 'thank you for waiting' });
    expect(signed.host.querySelector('figcaption.receipt__footer')?.textContent?.trim()).toBe(
      'thank you for waiting',
    );
  });
});

// ── Chain ───────────────────────────────────────────────────────────────────────────

describe('Chain', () => {
  const STEPS = ['trigger', 'prefetch', 'load', 'render'];

  it('is an ordered list named by its label', () => {
    const { host } = render(Chain, { steps: STEPS });
    expect(host.querySelector('ol.chain')?.getAttribute('aria-label')).toBe('Pipeline');

    const named = render(Chain, { steps: STEPS, label: 'What @defer does, in order' });
    expect(named.host.querySelector('ol.chain')?.getAttribute('aria-label')).toBe(
      'What @defer does, in order',
    );
  });

  it('renders one chip per step, in order', () => {
    const { host } = render(Chain, { steps: STEPS });

    const chips = [...host.querySelectorAll('li.chain__step > code.chain__chip')];
    expect(chips.map((c) => c.textContent)).toEqual(STEPS);
  });

  it('draws one fewer arrow than steps, all hidden from assistive tech', () => {
    const { host } = render(Chain, { steps: STEPS });

    const arrows = [...host.querySelectorAll('.chain__arrow')];
    expect(arrows).toHaveLength(3);
    expect(arrows.every((a) => a.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(host.querySelectorAll('li.chain__step')[3].querySelector('.chain__arrow')).toBeNull();
  });
});

// ── Whiteboard ──────────────────────────────────────────────────────────────────────

@Component({
  imports: [Whiteboard, Scribble],
  template: `
    <app-whiteboard caption="One request, three interceptors" alt="Three boxes in a column.">
      <svg class="wb-svg" viewBox="0 0 10 10" aria-hidden="true">
        <rect class="wb-node" width="4" height="4" />
      </svg>
      <app-scribble quote="auth" text="runs first" />
    </app-whiteboard>
  `,
})
class WhiteboardHost {}

describe('Whiteboard', () => {
  it('is a figure described by the visually hidden alt text', () => {
    const { host } = render(WhiteboardHost);

    const figure = host.querySelector('figure.whiteboard');
    const descId = figure?.getAttribute('aria-describedby') ?? '';
    expect(descId).not.toBe('');

    const desc = host.querySelector(`#${descId}`);
    expect(desc?.classList.contains('whiteboard__desc')).toBe(true);
    expect(desc?.textContent?.trim()).toBe('Three boxes in a column.');
  });

  it('captions the figure with the visible caption', () => {
    const { host } = render(WhiteboardHost);
    expect(host.querySelector('figcaption.whiteboard__caption')?.textContent?.trim()).toBe(
      'One request, three interceptors',
    );
  });

  it('projects the drawing into the board', () => {
    const { host } = render(WhiteboardHost);
    expect(host.querySelector('.whiteboard__board svg.wb-svg .wb-node')).not.toBeNull();
  });

  // The call-outs belong under the picture, not inside it: they are prose about
  // the figure, and the board is the figure.
  it('routes scribbles into the notes row, after the drawing', () => {
    const { host } = render(WhiteboardHost);

    expect(host.querySelector('.whiteboard__notes app-scribble')).not.toBeNull();
    expect(host.querySelector('.whiteboard__board app-scribble')).toBeNull();
  });

  it('is focusable, and named, only when it scrolls', () => {
    const fixed = render(Whiteboard, { caption: 'c', alt: 'a' });
    const board = fixed.host.querySelector('.whiteboard__board');
    expect(board?.hasAttribute('tabindex')).toBe(false);
    expect(board?.hasAttribute('role')).toBe(false);

    const wide = render(Whiteboard, { caption: 'Wide figure', alt: 'a', scrollable: true });
    const scroller = wide.host.querySelector('.whiteboard__board');
    expect(scroller?.getAttribute('tabindex')).toBe('0');
    expect(scroller?.getAttribute('role')).toBe('group');
    expect(scroller?.getAttribute('aria-label')).toBe('Wide figure');
  });
});
