import { Component, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Compare, Faq, Flow, Predict, Quiz, Remember, segmentInlineCode } from './index';

/**
 * Tests for the shared teaching components.
 *
 * These carry more weight than a normal presentational-component test, because every
 * lesson in the curriculum renders them: a regression here is a regression in a hundred
 * places at once. The assertions therefore concentrate on the behaviour lessons depend
 * on and on the accessibility contracts documented in each component — the wiring that
 * is easy to break silently while restyling.
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
  TestBed.configureTestingModule({ imports: [component] });
  return mount(component, inputs);
}

/**
 * Mounts a component into an already-configured TestBed.
 *
 * Separate from {@link render} because `configureTestingModule` throws once the module
 * has been instantiated, so the tests that need *two* instances of the same component —
 * the ones checking that generated ids are unique — have to configure once and mount
 * twice rather than calling `render` twice.
 */
function mount<T>(component: Type<T>, inputs: Record<string, unknown> = {}): Harness<T> {
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

// ── inline code parsing ─────────────────────────────────────────────────────────────

describe('segmentInlineCode', () => {
  it('splits backtick spans into code segments', () => {
    expect(segmentInlineCode('call `set()` to write')).toEqual([
      { text: 'call ', code: false },
      { text: 'set()', code: true },
      { text: ' to write', code: false },
    ]);
  });

  it('treats plain text as a single non-code segment', () => {
    expect(segmentInlineCode('no code here')).toEqual([{ text: 'no code here', code: false }]);
  });

  it('handles an unclosed backtick as literal text rather than throwing', () => {
    // Lesson copy is edited constantly; a stray backtick must degrade, not break a page.
    const segments = segmentInlineCode('a `dangling one');
    expect(segments.every((segment) => !segment.code)).toBe(true);
    expect(segments.map((segment) => segment.text).join('')).toBe('a `dangling one');
  });

  it('drops empty pieces so adjacent spans do not emit blank nodes', () => {
    expect(segmentInlineCode('`a``b`')).toEqual([
      { text: 'a', code: true },
      { text: 'b', code: true },
    ]);
  });
});

// ── Remember ────────────────────────────────────────────────────────────────────────

describe('Remember', () => {
  it('falls back to the variant default heading', () => {
    const { host } = render(Remember, { variant: 'rule' });
    expect(host.querySelector('.remember__label')?.textContent?.trim()).toBe('The rule');
  });

  it('prefers an explicit label over the variant default', () => {
    const { host } = render(Remember, { label: 'Watch out' });
    expect(host.querySelector('.remember__label')?.textContent?.trim()).toBe('Watch out');
  });

  it('labels the aside so the callout is announced, not just seen', () => {
    const { host } = render(Remember);
    expect(host.querySelector('aside')?.getAttribute('aria-label')).toBe(
      'If you remember one thing',
    );
  });
});

// ── Quiz ────────────────────────────────────────────────────────────────────────────

describe('Quiz', () => {
  const options = [
    { text: 'Wrong one', why: 'Because of X.' },
    { text: 'Right one', correct: true, why: 'Because of Y.' },
  ];

  it('shows no feedback until an option is chosen', () => {
    const { host } = render(Quiz, { question: 'Which?', options });
    expect(host.querySelector('.quiz__verdict')).toBeNull();
  });

  it('explains a wrong answer instead of only marking it wrong', () => {
    const harness = render(Quiz, { question: 'Which?', options });
    harness.click('input[type="radio"]', 0);

    expect(harness.host.querySelector('.quiz__verdict')?.textContent).toContain('Not quite');
    expect(harness.host.querySelector('.quiz__why')?.textContent).toContain('Because of X.');
  });

  it('confirms a correct answer', () => {
    const harness = render(Quiz, { question: 'Which?', options });
    harness.click('input[type="radio"]', 1);

    expect(harness.host.querySelector('.quiz__verdict--right')).toBeTruthy();
    expect(harness.host.querySelector('.quiz__why')?.textContent).toContain('Because of Y.');
  });

  it('states the verdict in words, not colour alone', () => {
    const harness = render(Quiz, { question: 'Which?', options });
    harness.click('input[type="radio"]', 1);

    // WCAG 1.4.1: the right/wrong distinction must survive without colour.
    expect(harness.host.querySelector('.quiz__verdict')?.textContent?.trim()).toBe("That's it.");
  });

  it('lets the learner change their answer — this is practice, not a test', () => {
    const harness = render(Quiz, { question: 'Which?', options });
    harness.click('input[type="radio"]', 1);
    harness.click('input[type="radio"]', 0);

    expect(harness.host.querySelector('.quiz__verdict')?.textContent).toContain('Not quite');
  });

  it('uses a fieldset and legend so the question is tied to the options', () => {
    const { host } = render(Quiz, { question: 'Which?', options });
    expect(host.querySelector('fieldset > legend')).toBeTruthy();
  });

  it('announces feedback politely without moving focus', () => {
    const { host } = render(Quiz, { question: 'Which?', options });
    expect(host.querySelector('.quiz__feedback')?.getAttribute('aria-live')).toBe('polite');
  });

  it('gives each instance its own radio group', () => {
    const first = render(Quiz, { question: 'A', options });
    const second = mount(Quiz, { question: 'B', options });

    const nameOf = (host: HTMLElement) =>
      host.querySelector('input[type="radio"]')?.getAttribute('name');

    // Sharing a name would make answering one quiz silently clear the other.
    expect(nameOf(first.host)).not.toBe(nameOf(second.host));
  });
});

// ── Predict ─────────────────────────────────────────────────────────────────────────

describe('Predict', () => {
  const inputs = { prompt: 'What happens?', answer: 'It logs 0.' };

  it('hides the answer until it is revealed', () => {
    const { host } = render(Predict, inputs);

    expect(host.textContent).not.toContain('It logs 0.');
    expect(host.querySelector('button')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps the hidden answer out of the DOM, not merely invisible', () => {
    const { host } = render(Predict, inputs);

    // Hiding with CSS would let a screen reader read ahead and defeat the whole point.
    expect(host.querySelector('.predict__answer')).toBeNull();
  });

  it('reveals the answer on click', () => {
    const harness = render(Predict, inputs);
    harness.click('button');

    expect(harness.host.textContent).toContain('It logs 0.');
  });

  it('points the button at the panel it controls', () => {
    const { host } = render(Predict, inputs);
    const controls = host.querySelector('button')?.getAttribute('aria-controls');

    expect(controls).toBeTruthy();
  });

  it('renders the optional code sample verbatim', () => {
    const { host } = render(Predict, { ...inputs, code: 'const x = 1;' });
    expect(host.querySelector('pre')?.textContent).toBe('const x = 1;');
  });
});

// ── Faq ─────────────────────────────────────────────────────────────────────────────

describe('Faq', () => {
  it('renders each item as a native disclosure', () => {
    const { host } = render(Faq, {
      items: [
        { q: 'Why?', a: 'Because.' },
        { q: 'How?', a: 'Like this.' },
      ],
    });

    // <details>/<summary> is what gives keyboard operation and in-page find for free.
    expect(host.querySelectorAll('details > summary')).toHaveLength(2);
  });

  it('renders backticked spans in answers as code', () => {
    const { host } = render(Faq, { items: [{ q: 'Which call?', a: 'Use `set()`.' }] });
    expect(host.querySelector('.faq__a code')?.textContent).toBe('set()');
  });

  it('starts collapsed so the block does not dominate the page', () => {
    const { host } = render(Faq, { items: [{ q: 'Why?', a: 'Because.' }] });
    expect(host.querySelector('details')?.hasAttribute('open')).toBe(false);
  });
});

// ── Flow ────────────────────────────────────────────────────────────────────────────

describe('Flow', () => {
  const steps = [
    { label: 'One', detail: 'first' },
    { label: 'Two', tone: 'accent' as const },
    { label: 'Three' },
  ];

  it('renders steps as an ordered list so the sequence survives without the arrows', () => {
    const { host } = render(Flow, { steps });

    expect(host.querySelector('ol')).toBeTruthy();
    expect(host.querySelectorAll('li')).toHaveLength(3);
  });

  it('ties the caption to the figure', () => {
    const { host } = render(Flow, { steps, caption: 'How it flows' });
    expect(host.querySelector('figure > figcaption')?.textContent).toContain('How it flows');
  });

  it('applies the tone class only to the step that asked for it', () => {
    const { host } = render(Flow, { steps });

    expect(host.querySelectorAll('.flow__step--accent')).toHaveLength(1);
    expect(host.querySelectorAll('.flow__step--default')).toHaveLength(2);
  });

  it('supports a vertical direction', () => {
    const { host } = render(Flow, { steps, direction: 'vertical' });
    expect(host.querySelector('.flow--vertical')).toBeTruthy();
  });
});

// ── Compare ─────────────────────────────────────────────────────────────────────────

describe('Compare', () => {
  @Component({
    imports: [Compare],
    template: `<app-compare leftTitle="Before" rightTitle="After" note="The point">
      <div left>OLD CODE</div>
      <div right>NEW CODE</div>
    </app-compare>`,
  })
  class CompareHost {}

  function mountCompare(): HTMLElement {
    TestBed.configureTestingModule({ imports: [CompareHost] });
    return mountCompareAgain();
  }

  /** Second and subsequent instances, for the uniqueness check — see {@link mount}. */
  function mountCompareAgain(): HTMLElement {
    const fixture = TestBed.createComponent(CompareHost);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('projects both sides into the right panels', () => {
    const host = mountCompare();
    const sides = host.querySelectorAll('.compare__side');

    expect(sides[0].textContent).toContain('OLD CODE');
    expect(sides[1].textContent).toContain('NEW CODE');
  });

  it('labels each panel by its own visible heading', () => {
    const host = mountCompare();

    for (const side of Array.from(host.querySelectorAll('.compare__side'))) {
      const id = side.getAttribute('aria-labelledby');
      expect(id).toBeTruthy();
      expect(host.querySelector(`#${id}`)?.textContent?.trim()).toBeTruthy();
    }
  });

  it('gives the two panels distinct ids so several comparisons can share a page', () => {
    const first = mountCompare();
    const second = mountCompareAgain();

    const idsOf = (host: HTMLElement) =>
      Array.from(host.querySelectorAll('.compare__side')).map((side) =>
        side.getAttribute('aria-labelledby'),
      );

    expect(new Set([...idsOf(first), ...idsOf(second)]).size).toBe(4);
  });

  it('renders the optional note', () => {
    expect(mountCompare().querySelector('.compare__note')?.textContent).toContain('The point');
  });
});
