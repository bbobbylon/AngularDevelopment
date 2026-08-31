import { Component, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from './index';
import { highlightLines } from './code-lab/highlight-lines';

/**
 * Tests for the brain-friendly presentation set.
 *
 * Same weight as `teaching.spec.ts` and for the same reason: every migrated lesson
 * renders these, so a regression here is a regression in every lesson at once. The
 * assertions concentrate on three things that are easy to break silently while
 * restyling — the accessibility contracts each component documents, the line/note
 * pairing in `CodeLab` (whose whole value is that the numbers line up), and the tag
 * balancing in `highlightLines` (which exists precisely because the obvious
 * implementation is wrong).
 */

// ── helpers ─────────────────────────────────────────────────────────────────────────

/** A mounted component plus the two things every assertion below needs. */
interface Harness<T> {
  readonly fixture: ComponentFixture<T>;
  readonly host: HTMLElement;
  /** Clicks the nth match of a selector, then flushes change detection. */
  click(selector: string, index?: number): void;
}

/** Configures the TestBed and mounts a component with the given inputs. */
function render<T>(component: Type<T>, inputs: Record<string, unknown> = {}): Harness<T> {
  TestBed.configureTestingModule({ imports: [component], providers: [provideRouter([])] });

  const fixture = TestBed.createComponent(component);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();

  const host = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host,
    click(selector, index = 0) {
      const targets = host.querySelectorAll<HTMLElement>(selector);
      if (!targets[index]) throw new Error(`No element ${index} matching "${selector}"`);
      targets[index].click();
      fixture.detectChanges();
    },
  };
}

// ── highlightLines ──────────────────────────────────────────────────────────────────

describe('highlightLines', () => {
  it('returns one entry per source line', () => {
    expect(highlightLines('const a = 1;\nconst b = 2;')).toHaveLength(2);
  });

  it('keeps a blank line as its own empty entry, so note numbering stays aligned', () => {
    const lines = highlightLines('const a = 1;\n\nconst b = 2;');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe('');
  });

  // The reason this module exists. A naive `highlight(code).split('\n')` cuts a block
  // comment's <span> in half, leaving line 1 unclosed and line 2 with an orphan closer.
  it('balances a span that straddles a newline', () => {
    const lines = highlightLines('/* one\n   two */\nconst a = 1;');

    expect(lines[0]).toContain('<span class="hl-cmt">');
    expect(lines[0].endsWith('</span>')).toBe(true);
    expect(lines[1].startsWith('<span class="hl-cmt">')).toBe(true);
    expect(lines[1]).toContain('</span>');

    for (const line of lines) {
      const opens = (line.match(/<span/g) ?? []).length;
      const closes = (line.match(/<\/span>/g) ?? []).length;
      expect(opens).toBe(closes);
    }
  });

  it('escapes source that looks like markup rather than emitting it', () => {
    expect(highlightLines('const el = "<script>";')[0]).not.toContain('<script>');
  });
});

// ── CodeLab ─────────────────────────────────────────────────────────────────────────

describe('CodeLab', () => {
  const CODE = 'const a = 1;\nconst b = 2;\nconst c = 3;';

  it('marks exactly the lines that carry a note', () => {
    const { host } = render(CodeLab, { code: CODE, notes: [{ line: 2, text: 'the middle' }] });

    expect(host.querySelectorAll('.lab__marker')).toHaveLength(1);
    expect(host.querySelectorAll('.lab__line')[1].querySelector('.lab__marker')).not.toBeNull();
  });

  // Notes are authored in whatever order made sense while writing, but the markers have
  // to read 1, 2, 3 down the snippet or the walkthrough is nonsense.
  it('numbers notes by line order, not by array order', () => {
    const { host } = render(CodeLab, {
      code: CODE,
      notes: [
        { line: 3, text: 'last' },
        { line: 1, text: 'first' },
      ],
    });

    const markers = [...host.querySelectorAll('.lab__marker')].map((m) => m.textContent?.trim());
    expect(markers).toEqual(['1', '2']);

    const notes = [...host.querySelectorAll('.lab__note-body')].map((n) => n.textContent ?? '');
    expect(notes[0]).toContain('first');
    expect(notes[1]).toContain('last');
  });

  it('lights the matching line when a note is activated', () => {
    const harness = render(CodeLab, { code: CODE, notes: [{ line: 2, text: 'the middle' }] });

    expect(harness.host.querySelector('.lab__line--lit')).toBeNull();
    harness.click('.lab__note');

    const lit = harness.host.querySelector('.lab__line--lit');
    expect(lit).not.toBeNull();
    expect(lit?.textContent).toContain('const b');
  });

  it('activates in both directions — a marker lights its note', () => {
    const harness = render(CodeLab, { code: CODE, notes: [{ line: 1, text: 'the first' }] });

    harness.click('.lab__marker');
    expect(harness.host.querySelector('.lab__note--lit')).not.toBeNull();
  });

  // Clicking the lit pair again turning it off is what a reader expects, and it is the
  // only way to dismiss a highlight without a mouse.
  it('toggles off when the active pair is activated again', () => {
    const harness = render(CodeLab, { code: CODE, notes: [{ line: 1, text: 'the first' }] });

    harness.click('.lab__note');
    harness.click('.lab__note');
    expect(harness.host.querySelector('.lab__line--lit')).toBeNull();
  });

  it('exposes the active state to assistive tech, not only as a colour', () => {
    const harness = render(CodeLab, { code: CODE, notes: [{ line: 1, text: 'the first' }] });

    expect(harness.host.querySelector('.lab__note')?.getAttribute('aria-pressed')).toBe('false');
    harness.click('.lab__note');
    expect(harness.host.querySelector('.lab__note')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('gives every marker an accessible name naming its line', () => {
    const { host } = render(CodeLab, { code: CODE, notes: [{ line: 2, text: 'the middle' }] });

    expect(host.querySelector('.lab__marker')?.getAttribute('aria-label')).toBe(
      'Note 1, about line 2',
    );
  });

  it('keeps the output out of the DOM until it is revealed', () => {
    const harness = render(CodeLab, {
      code: CODE,
      prompt: 'What prints?',
      output: 'the answer',
    });

    expect(harness.host.textContent).not.toContain('the answer');
    harness.click('.lab__reveal');
    expect(harness.host.textContent).toContain('the answer');
  });

  it('renders no strip at all when there is nothing to predict', () => {
    const { host } = render(CodeLab, { code: CODE });
    expect(host.querySelector('.lab__strip')).toBeNull();
  });

  it('renders backticks and bold in note copy rather than printing the delimiters', () => {
    const { host } = render(CodeLab, {
      code: CODE,
      notes: [{ line: 1, text: 'calls `set()` and runs **once**' }],
    });

    const note = host.querySelector('.lab__note-body');
    expect(note?.querySelector('code')?.textContent).toBe('set()');
    expect(note?.querySelector('strong')?.textContent).toBe('once');
    expect(note?.textContent).not.toContain('**');
  });
});

// ── Layers ──────────────────────────────────────────────────────────────────────────

describe('Layers', () => {
  const INPUTS = {
    core: { label: 'Leaf', sub: 'the value' },
    rings: [{ label: 'Outer' }, { label: 'Middle' }],
  };

  it('draws one ring per wrapper', () => {
    const { host } = render(Layers, INPUTS);
    expect(host.querySelectorAll('.layers__ring')).toHaveLength(2);
  });

  // The rings are decorative; the containment they depict is the actual content, so it
  // has to survive in the accessible tree rather than being announced as loose labels.
  it('describes the nesting for assistive tech, innermost last', () => {
    const { host } = render(Layers, INPUTS);
    const items = [...host.querySelectorAll('.layers__sr li')].map((li) => li.textContent ?? '');

    expect(items).toHaveLength(3);
    expect(items[0]).toContain('Outer');
    expect(items[2]).toContain('Leaf');
    expect(items[2]).toContain('the value');
  });

  it('hides the decorative rings and core from assistive tech', () => {
    const { host } = render(Layers, INPUTS);

    expect(host.querySelector('.layers__ring')?.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('.layers__core')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('omits the arrow when there is nothing to say on it', () => {
    const { host } = render(Layers, INPUTS);
    expect(host.querySelector('.layers__arrow')).toBeNull();
  });

  it('clamps the depth class to the insets the CSS actually defines', () => {
    const { host } = render(Layers, {
      core: { label: 'Leaf' },
      rings: [1, 2, 3, 4, 5, 6].map((n) => ({ label: `Ring ${n}` })),
    });

    expect(host.querySelector('.layers')?.classList.contains('layers--n4')).toBe(true);
  });
});

// ── Bubbles ─────────────────────────────────────────────────────────────────────────

describe('Bubbles', () => {
  const TURNS = [
    { who: 'Template', says: 'I read `count()`.' },
    { who: 'Signal', says: 'Noted.' },
  ];

  // A definition list rather than two loose strings, so a screen reader announces
  // "Signal: Noted." instead of leaving the reader to guess who spoke.
  it('pairs each speaker with their line as a definition list', () => {
    const { host } = render(Bubbles, { turns: TURNS });

    expect(host.querySelector('dl')).not.toBeNull();
    expect(host.querySelectorAll('dt')).toHaveLength(2);
    expect(host.querySelectorAll('dd')).toHaveLength(2);
    expect(host.querySelectorAll('dt')[1].textContent?.trim()).toBe('Signal');
  });

  it('alternates sides so a two-party exchange reads as one', () => {
    const { host } = render(Bubbles, { turns: TURNS });
    const bubbles = host.querySelectorAll('.bubble');

    expect(bubbles[0].classList.contains('bubble--right')).toBe(false);
    expect(bubbles[1].classList.contains('bubble--right')).toBe(true);
  });

  it('renders backticked spans in dialogue as code', () => {
    const { host } = render(Bubbles, { turns: TURNS });
    expect(host.querySelector('dd code')?.textContent).toBe('count()');
  });
});

// ── Chapter ─────────────────────────────────────────────────────────────────────────

describe('Chapter', () => {
  const STOPS = [
    { label: 'Before', id: 'before' },
    { label: 'Here' },
    { label: 'After', id: 'after' },
  ];

  it('renders the concept name as the page heading', () => {
    const { host } = render(Chapter, { title: 'Change Detection' });
    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Change Detection');
  });

  it('renders the rail as an ordered list so the sequence survives without the dots', () => {
    const { host } = render(Chapter, { title: 'Here', stops: STOPS, current: 1 });

    expect(host.querySelectorAll('.rail__stop')).toHaveLength(3);
    expect(host.querySelector('ol.rail')).not.toBeNull();
  });

  it('marks the current stop as the current step', () => {
    const { host } = render(Chapter, { title: 'Here', stops: STOPS, current: 1 });
    const current = host.querySelector('[aria-current="step"]');

    expect(current?.textContent?.trim()).toBe('Here');
  });

  // A link to the page you are already on is a dead end; the current stop is plain text.
  it('does not link the stop the reader is standing on', () => {
    const { host } = render(Chapter, { title: 'Here', stops: STOPS, current: 1 });
    const links = [...host.querySelectorAll('a.rail__label')].map((a) => a.textContent?.trim());

    expect(links).toEqual(['Before', 'After']);
  });

  it('hides the rail when there is no sequence to show', () => {
    const { host } = render(Chapter, { title: 'Alone', stops: [{ label: 'Alone' }] });
    expect(host.querySelector('.chapter__rail')).toBeNull();
  });

  it('hides the decorative numeral from assistive tech', () => {
    const { host } = render(Chapter, { title: 'Here', number: '4' });
    expect(host.querySelector('.chapter__numeral')?.getAttribute('aria-hidden')).toBe('true');
  });
});

// ── TapeCard and Napkin ─────────────────────────────────────────────────────────────

describe('TapeCard', () => {
  it('labels the section by its own visible heading', () => {
    const { host } = render(TapeCard, { heading: 'Component' });
    expect(host.querySelector('.tape-card__heading')?.textContent?.trim()).toBe('Component');
  });

  it('hides the tape and pin from assistive tech', () => {
    const { host } = render(TapeCard, { heading: 'Component' });
    expect(host.querySelector('.tape-card__tape')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies the tone as a class rather than as the only carrier of meaning', () => {
    const { host } = render(TapeCard, { heading: 'Trap', tone: 'accent' });
    expect(host.querySelector('.tape-card')?.classList.contains('tape-card--accent')).toBe(true);
  });
});

describe('Napkin', () => {
  it('renders as an aside so it is announced as a set-aside remark', () => {
    const { host } = render(Napkin, {});
    expect(host.querySelector('aside')).not.toBeNull();
  });

  // The lead-in is a scrawl ("psst —"), which is useless as an accessible name, so the
  // component carries a separate `label` for that job.
  it('names the aside from label, not from the decorative lead-in', () => {
    const { host } = render(Napkin, { lead: 'psst —', label: 'Predict first' });

    expect(host.querySelector('aside')?.getAttribute('aria-label')).toBe('Predict first');
    expect(host.querySelector('.napkin__lead')?.getAttribute('aria-hidden')).toBe('true');
  });
});

// ── BfPage ──────────────────────────────────────────────────────────────────────────

describe('BfPage', () => {
  @Component({ selector: 'app-bf-host', imports: [BfPage], template: '<div bfPage></div>' })
  class BfHost {}

  // The page tint has to reach <html>, which no component stylesheet can do — so the
  // directive's only job is this class, and cleaning it up on destroy is what stops a
  // migrated lesson from leaving the rest of the app cream-coloured behind it.
  it('tints the page while mounted and restores it on destroy', () => {
    const { fixture } = render(BfHost);
    expect(document.documentElement.classList.contains('bf-page')).toBe(true);

    fixture.destroy();
    expect(document.documentElement.classList.contains('bf-page')).toBe(false);
  });
});
