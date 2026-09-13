import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { HighlightCode } from './highlight-code.directive';

/**
 * The directive exists because the navigation sweep could not highlight a block
 * whose contents change. The middle test here is the regression guard for that:
 * it is the exact scenario that shipped broken in the security lesson and in
 * programming-basics — a `computed` that starts non-empty, gets highlighted, and
 * then has to keep updating.
 */
@Component({
  imports: [HighlightCode],
  template: `<pre [hlCode]="src()" [hlLang]="lang()"></pre>`,
})
class Host {
  readonly src = signal('const x = 1;');
  readonly lang = signal<'ts' | 'html' | 'text'>('ts');
}

describe('HighlightCode', () => {
  function render() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const pre = (fixture.nativeElement as HTMLElement).querySelector('pre')!;
    return { fixture, pre, cmp: fixture.componentInstance };
  }

  it('highlights the initial source', () => {
    const { pre } = render();
    expect(pre.innerHTML).toContain('<span class="hl-kw">const</span>');
  });

  it('re-highlights when the source changes', () => {
    // The freeze bug: an interpolation writes to a text node that assigning
    // innerHTML detaches, so the block stops updating. The directive owns the
    // element instead, so this must keep working.
    const { fixture, pre, cmp } = render();
    expect(pre.textContent).toBe('const x = 1;');

    cmp.src.set('let y = 2;');
    fixture.detectChanges();

    expect(pre.textContent).toBe('let y = 2;');
    expect(pre.innerHTML).toContain('<span class="hl-kw">let</span>');
  });

  it('re-highlights when the language changes', () => {
    const { fixture, pre, cmp } = render();
    cmp.src.set('<div class="x"></div>');
    cmp.lang.set('html');
    fixture.detectChanges();

    expect(pre.innerHTML).toContain('<span class="hl-tag">div</span>');
    expect(pre.innerHTML).toContain('<span class="hl-attr">class</span>');
  });

  it('leaves output alone when told the block is text', () => {
    const { fixture, pre, cmp } = render();
    cmp.src.set('3 passed, 1 failed');
    cmp.lang.set('text');
    fixture.detectChanges();

    expect(pre.innerHTML).toBe('3 passed, 1 failed');
  });

  it('escapes source rather than executing it', () => {
    const { fixture, pre, cmp } = render();
    cmp.src.set('<script>alert(1)</script>');
    fixture.detectChanges();

    expect(pre.querySelector('script')).toBeNull();
    expect(pre.textContent).toContain('<script>');
  });

  it('marks the element so the navigation sweep skips it', () => {
    // Without the marker the sweep and the directive would both assign
    // innerHTML to the same <pre>, and which one won would depend on timing.
    const { pre } = render();
    expect(pre.dataset['hl']).toBe('');
  });
});
