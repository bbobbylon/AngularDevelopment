import { highlight } from './highlighter';
import { highlightLines } from './brain/code-lab/highlight-lines';

/**
 * The highlighter is hand-written and emits raw HTML that the app binds with
 * `[innerHTML]`, so it carries two obligations a library would have carried for
 * us: it must tokenise correctly, and it must never let source text escape as
 * markup. Both are tested here.
 *
 * The `html` mode gets the most attention because it is the newest and because
 * markup is the one language whose scanner is not the shared linear one.
 */
describe('highlight', () => {
  /** Pulls the text out of every `<span class="hl-X">` for a given token role. */
  const tokens = (html: string, role: string): string[] =>
    [...html.matchAll(new RegExp(`<span class="hl-${role}">(.*?)</span>`, 'g'))].map((m) => m[1]);

  describe('escaping', () => {
    it('escapes markup in every language so a sample cannot execute', () => {
      const attack = '<script>alert(1)</script>';
      for (const lang of ['ts', 'html', 'css', 'bash', 'json', 'text'] as const) {
        const out = highlight(attack, lang);
        expect(out, lang).not.toContain('<script>');
        expect(out, lang).toContain('&lt;');
      }
    });

    it('escapes quotes and ampersands', () => {
      expect(highlight('a && b', 'ts')).toContain('&amp;&amp;');
    });
  });

  describe('typescript (the default)', () => {
    it('still defaults to ts when no language is given', () => {
      expect(highlight('const x = 1;')).toBe(highlight('const x = 1;', 'ts'));
    });

    it('tokenises keywords, strings, numbers and comments', () => {
      const out = highlight(`const n = 42; // note\nconst s = 'hi';`);
      expect(tokens(out, 'kw')).toContain('const');
      expect(tokens(out, 'num')).toContain('42');
      expect(tokens(out, 'str')).toContain("'hi'");
      expect(tokens(out, 'cmt')).toContain('// note');
    });

    it('separates a free call from a method call from a property read', () => {
      const out = highlight('loadUser(Foo); user.save(); user.name; inject(Dep);');
      expect(tokens(out, 'fn')).toContain('loadUser');
      expect(tokens(out, 'builtin')).toContain('inject');
      expect(tokens(out, 'method')).toContain('save');
      expect(tokens(out, 'prop')).toContain('name');
    });
  });

  // Dozens of lessons show the class and its template in one sample. Neither
  // scanner alone is right for those, so the ts scanner hands markup *lines* to
  // the markup scanner and takes over again on the next line.
  describe('mixed samples (template islands inside ts)', () => {
    it('colours a tag line inside a TypeScript sample as markup', () => {
      const out = highlight('// template\n<p>{{ name() }}</p>\nconst x = 1;');
      expect(tokens(out, 'cmt')).toContain('// template');
      expect(tokens(out, 'tag')).toEqual(['p', 'p']);
      expect(tokens(out, 'fn')).toContain('name');
      expect(tokens(out, 'kw')).toContain('const');
    });

    it('keeps a mid-line `<` as an operator and a generic as a type', () => {
      const out = highlight('if (a < b) { x = signal<Type<unknown>>(y); }');
      expect(tokens(out, 'tag')).toEqual([]);
      expect(tokens(out, 'type')).toContain('Type');
    });

    it('hands a multi-line tag over whole, so a binding on line two is a binding', () => {
      const out = highlight('<ng-container\n  [ngTemplateOutlet]="tpl"\n/>\nfoo();');
      expect(tokens(out, 'bind')).toContain('[ngTemplateOutlet]');
      expect(tokens(out, 'fn')).toContain('foo');
    });

    it('treats a control-flow block at a line start as template, and a decorator as a decorator', () => {
      const out = highlight('@for (item of items(); track item.id) {\n@Component({');
      expect(tokens(out, 'kw')).toEqual(expect.arrayContaining(['@for', 'of', 'track']));
      expect(tokens(out, 'dec')).toContain('@Component');
    });

    it('recognises an HTML comment line and an interpolation mid-line', () => {
      const out = highlight('<!-- note -->\nlabel: {{ total() }}');
      expect(tokens(out, 'cmt')).toContain('&lt;!-- note --&gt;');
      expect(tokens(out, 'punct')).toEqual(expect.arrayContaining(['{{', '}}']));
    });

    it('does the same for a stylesheet that ends with the markup it styles', () => {
      const out = highlight('.dot { color: red; }\n<div [style.--x]="v()"></div>', 'css');
      expect(tokens(out, 'key')).toContain('color');
      expect(tokens(out, 'tag')).toEqual(['div', 'div']);
    });

    it('leaves the languages without templates alone', () => {
      expect(tokens(highlight('<div>', 'bash'), 'tag')).toEqual([]);
      expect(tokens(highlight('<div>', 'java'), 'tag')).toEqual([]);
    });
  });

  describe('html', () => {
    it('colours the tag name separately from the angle brackets', () => {
      const out = highlight('<app-lesson-nav></app-lesson-nav>', 'html');
      expect(tokens(out, 'tag')).toEqual(['app-lesson-nav', 'app-lesson-nav']);
    });

    it('distinguishes a plain attribute from Angular binding syntax', () => {
      const out = highlight(
        '<button class="go" [disabled]="busy()" (click)="save()" #ref *ngIf="on"></button>',
        'html',
      );
      expect(tokens(out, 'attr')).toContain('class');
      expect(tokens(out, 'bind')).toEqual(
        expect.arrayContaining(['[disabled]', '(click)', '#ref', '*ngIf']),
      );
    });

    it('highlights a binding value as an expression, not as a flat string', () => {
      const out = highlight('<button [disabled]="form.invalid()">x</button>', 'html');
      // The quotes stay string-coloured...
      expect(tokens(out, 'str')).toContain('&quot;');
      // ...but the contents are tokenised as code.
      expect(tokens(out, 'method')).toContain('invalid');
      expect(tokens(out, 'prop').concat(tokens(out, 'attr'))).not.toContain('form.invalid()');
    });

    it('leaves a plain attribute value as a string', () => {
      const out = highlight('<div class="card is-open"></div>', 'html');
      expect(tokens(out, 'str')).toContain('&quot;card is-open&quot;');
    });

    it('tokenises interpolations as expressions', () => {
      const out = highlight('<p>{{ user.name() }}</p>', 'html');
      expect(tokens(out, 'punct')).toEqual(expect.arrayContaining(['{{', '}}']));
      expect(tokens(out, 'method')).toContain('name');
    });

    it('treats control-flow blocks as keywords and their heads as expressions', () => {
      const out = highlight('@for (item of items(); track item.id) {', 'html');
      expect(tokens(out, 'kw')).toEqual(expect.arrayContaining(['@for', 'of', 'track']));
      expect(tokens(out, 'fn')).toContain('items');
      expect(tokens(out, 'prop')).toContain('id');
    });

    it('handles @if / @else and @let', () => {
      expect(tokens(highlight('@if (ok) {', 'html'), 'kw')).toContain('@if');
      expect(tokens(highlight('} @else {', 'html'), 'kw')).toContain('@else');
      expect(tokens(highlight('@let total = a() + b();', 'html'), 'kw')).toContain('@let');
    });

    it('does not treat an annotation-shaped token as a control-flow block', () => {
      // `@Component` is not in TEMPLATE_BLOCKS, so it must not come out as a keyword.
      expect(tokens(highlight('@Component', 'html'), 'kw')).not.toContain('@Component');
    });

    it('tokenises HTML comments', () => {
      expect(tokens(highlight('<!-- a note -->', 'html'), 'cmt')).toContain(
        '&lt;!-- a note --&gt;',
      );
    });

    it('treats a `//` that opens a line as an annotation, but not one inside a URL', () => {
      const out = highlight('// template\n<a href="https://x.dev">x</a>', 'html');
      expect(tokens(out, 'cmt')).toEqual(['// template']);
      expect(tokens(out, 'str')).toContain('&quot;https://x.dev&quot;');
    });

    it('does not treat `class` inside a template as a TypeScript keyword', () => {
      // This is the whole reason the mode exists: the ts scanner used to colour
      // this attribute name as a reserved word.
      const out = highlight('<div class="x"></div>', 'html');
      expect(tokens(out, 'kw')).not.toContain('class');
    });

    it('survives an unterminated tag and an unterminated interpolation', () => {
      expect(() => highlight('<div class="x', 'html')).not.toThrow();
      expect(() => highlight('{{ oops', 'html')).not.toThrow();
    });

    it('closes a self-closing tag without swallowing what follows', () => {
      const out = highlight('<img src="a.png" /><p>after</p>', 'html');
      expect(tokens(out, 'tag')).toEqual(['img', 'p', 'p']);
      expect(out).toContain('after');
    });
  });

  describe('css', () => {
    it('colours the property half of a declaration and the hex value', () => {
      const out = highlight('.card {\n  color: #1a2b3c;\n}', 'css');
      expect(tokens(out, 'key')).toContain('color');
      expect(tokens(out, 'num')).toContain('#1a2b3c');
    });

    it('colours at-rules and value keywords', () => {
      const out = highlight('@media (min-width: 40rem) {\n  display: flex;\n}', 'css');
      expect(tokens(out, 'dec')).toContain('@media');
      expect(tokens(out, 'builtin')).toContain('flex');
    });

    it('tokenises block comments', () => {
      expect(tokens(highlight('/* hi */', 'css'), 'cmt')).toContain('/* hi */');
    });

    it('does not mistake a shorthand hex for a fragment identifier', () => {
      expect(tokens(highlight('color: #fff;', 'css'), 'num')).toContain('#fff');
    });
  });

  describe('other languages', () => {
    it('tokenises bash flags and variables', () => {
      const out = highlight('ng build --configuration $MODE', 'bash');
      expect(tokens(out, 'flag')).toContain('--configuration');
      expect(tokens(out, 'var')).toContain('$MODE');
    });

    it('tokenises json keys', () => {
      expect(tokens(highlight('{ "name": "app" }', 'json'), 'key')).toContain('&quot;name&quot;');
    });

    it('accepts comments in json, because tsconfig and angular.json do', () => {
      const out = highlight('// angular.json\n{ "budgets": [] }', 'json');
      expect(tokens(out, 'cmt')).toContain('// angular.json');
      expect(tokens(out, 'key')).toContain('&quot;budgets&quot;');
    });

    it('leaves `text` untokenised', () => {
      expect(highlight('anything at all', 'text')).toBe('anything at all');
    });
  });
});

describe('highlightLines', () => {
  /** Every emitted line must be independently well-formed for `[innerHTML]`. */
  const balanced = (line: string): boolean => {
    const opens = (line.match(/<span /g) ?? []).length;
    const closes = (line.match(/<\/span>/g) ?? []).length;
    return opens === closes;
  };

  it('returns one entry per source line', () => {
    expect(highlightLines('a\nb\nc')).toHaveLength(3);
  });

  it('keeps every line balanced when a token spans a newline', () => {
    // A block comment is the case that motivated the span-reopening walk.
    for (const line of highlightLines('/* one\n   two\n   three */\nconst x = 1;')) {
      expect(balanced(line), line).toBe(true);
    }
  });

  it('keeps every line balanced in html mode', () => {
    const template = [
      '<div class="card">',
      '  @for (item of items(); track item.id) {',
      '    <app-row [item]="item" (pick)="choose(item)" />',
      '  }',
      '  {{ total() }}',
      '</div>',
    ].join('\n');
    for (const line of highlightLines(template, 'html')) {
      expect(balanced(line), line).toBe(true);
    }
  });

  it('defaults to ts, so existing call sites are unchanged', () => {
    expect(highlightLines('const x = 1;')).toEqual(highlightLines('const x = 1;', 'ts'));
  });
});
