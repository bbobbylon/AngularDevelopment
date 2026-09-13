/**
 * Everything that touches CodeMirror lives in this one module, and the only way
 * in is a dynamic `import()` from {@link CodeEditor}. That is what keeps the
 * editor out of the initial bundle: CodeMirror plus its three grammars is
 * roughly 400 kB before compression, more than the whole app shell, and most
 * page views never open an editor. The build emits this file as its own lazy
 * chunk that is fetched the first time a reader clicks "Edit".
 *
 * ## One palette, not two
 *
 * The read-only samples are coloured by `shared/highlighter.ts`, which emits
 * `.hl-*` spans that `styles.css` and `brain-friendly.css` paint. Rather than
 * give the editor a second theme that drifts from the first, the CodeMirror
 * highlight style below maps Lezer's token tags onto *the same class names*.
 * A keyword is `.hl-kw` whether it sits in a static block or in the editor, so
 * a lesson's colours do not change when the reader starts typing — and the
 * Darcula overrides that a brain-friendly page applies to `.hl-*` apply here
 * for free.
 *
 * ## Keyboard
 *
 * `Tab` is deliberately *not* bound to indentation. A bound Tab turns the
 * editor into a keyboard trap (WCAG 2.1.2): a keyboard user who tabs into it
 * cannot tab out. CodeMirror's default keymap already indents with
 * `Ctrl-]` / `Ctrl-[` and `Mod-Enter`-style commands, which is enough.
 */
import { EditorState, Compartment, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { basicSetup } from 'codemirror';
import { tags as t } from '@lezer/highlight';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import type { EditorLang } from './editor-lang';

/**
 * Lezer tags → the highlighter's class names. Modified tags (`t.function(x)`)
 * are more specific than their base and win when both match, which is how a
 * call site becomes `.hl-fn` while a plain identifier stays uncoloured.
 */
const tokenClasses = HighlightStyle.define([
  {
    tag: [
      t.keyword,
      t.controlKeyword,
      t.operatorKeyword,
      t.definitionKeyword,
      t.moduleKeyword,
      t.self,
      t.null,
      t.bool,
    ],
    class: 'hl-kw',
  },
  { tag: [t.string, t.special(t.string), t.regexp, t.attributeValue], class: 'hl-str' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], class: 'hl-cmt' },
  { tag: [t.number, t.integer, t.float, t.unit], class: 'hl-num' },
  { tag: [t.meta, t.annotation], class: 'hl-dec' },
  {
    tag: [t.typeName, t.className, t.definition(t.className), t.namespace, t.macroName],
    class: 'hl-type',
  },
  { tag: [t.function(t.variableName), t.function(t.definition(t.variableName))], class: 'hl-fn' },
  { tag: t.function(t.propertyName), class: 'hl-method' },
  { tag: [t.propertyName, t.definition(t.propertyName)], class: 'hl-prop' },
  {
    tag: [
      t.operator,
      t.compareOperator,
      t.arithmeticOperator,
      t.logicOperator,
      t.bitwiseOperator,
      t.updateOperator,
      t.definitionOperator,
      t.typeOperator,
    ],
    class: 'hl-op',
  },
  {
    tag: [
      t.punctuation,
      t.separator,
      t.bracket,
      t.angleBracket,
      t.squareBracket,
      t.paren,
      t.brace,
      t.special(t.brace),
    ],
    class: 'hl-punct',
  },
  { tag: t.tagName, class: 'hl-tag' },
  { tag: t.attributeName, class: 'hl-attr' },
  { tag: [t.atom, t.labelName, t.standard(t.variableName)], class: 'hl-builtin' },
]);

/**
 * Chrome only — colours come from the token classes above and the app's own
 * `--code-*` tokens, so the editor is the same dark panel a static sample is,
 * in both themes. `dark: true` tells CodeMirror to pick its dark defaults for
 * anything not set here (scrollbars, selection fallbacks).
 */
const theme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--code-bg)',
      color: 'var(--code-fg)',
      fontSize: '0.86rem',
      minHeight: 'var(--editor-min-height, 9rem)',
    },
    '&.cm-focused': {
      outline: '2px solid var(--accent)',
      outlineOffset: '-2px',
    },
    '.cm-scroller': {
      fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
      lineHeight: '1.6',
    },
    '.cm-content': {
      padding: '0.85rem 0',
      caretColor: 'var(--code-fg)',
    },
    '.cm-line': { padding: '0 1rem 0 0.5rem' },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: 'rgba(212, 212, 228, 0.38)',
      border: 'none',
      paddingLeft: '0.5rem',
    },
    '.cm-activeLine': { backgroundColor: 'rgba(255, 255, 255, 0.045)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--code-fg)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--code-fg)' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground':
      { backgroundColor: 'rgba(99, 102, 241, 0.38)' },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'transparent',
      outline: '1px solid rgba(212, 212, 228, 0.45)',
    },
    '.cm-tooltip': {
      backgroundColor: 'var(--bg-card)',
      color: 'var(--text)',
      border: '1px solid var(--border)',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      backgroundColor: 'var(--accent)',
      color: '#fff',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: '1px solid rgba(212, 212, 228, 0.35)',
      color: 'var(--code-fg)',
    },
  },
  { dark: true },
);

/** The grammar for a language. JSON parses cleanly as a JavaScript expression, so it shares the grammar. */
function languageFor(lang: EditorLang): Extension {
  switch (lang) {
    case 'ts':
      return javascript({ typescript: true });
    case 'js':
    case 'json':
      return javascript();
    case 'html':
      return html();
    case 'css':
      return css();
  }
}

/** What {@link CodeEditor} holds once the editor is mounted. */
export interface EditorHandle {
  /** The current text. */
  getDoc(): string;
  /** Replaces the whole text — used for reset and for a parent pushing a new sample in. */
  setDoc(code: string): void;
  setLang(lang: EditorLang): void;
  setReadonly(readonly: boolean): void;
  focus(): void;
  destroy(): void;
}

export interface EditorOptions {
  doc: string;
  lang: EditorLang;
  readonly: boolean;
  /** Accessible name for the text area. */
  label: string;
  /** Called with the full text after every edit the user makes. */
  onChange: (doc: string) => void;
}

/** Mounts a CodeMirror editor into `parent` and returns a small handle over it. */
export function createEditor(parent: HTMLElement, options: EditorOptions): EditorHandle {
  const language = new Compartment();
  const access = new Compartment();
  const accessFor = (readonly: boolean): Extension => [
    EditorState.readOnly.of(readonly),
    EditorView.editable.of(!readonly),
  ];

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: options.doc,
      extensions: [
        basicSetup,
        theme,
        syntaxHighlighting(tokenClasses),
        language.of(languageFor(options.lang)),
        access.of(accessFor(options.readonly)),
        EditorView.contentAttributes.of({ 'aria-label': options.label }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) options.onChange(update.state.doc.toString());
        }),
      ],
    }),
  });

  return {
    getDoc: () => view.state.doc.toString(),
    setDoc: (code) =>
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } }),
    setLang: (lang) => view.dispatch({ effects: language.reconfigure(languageFor(lang)) }),
    setReadonly: (readonly) => view.dispatch({ effects: access.reconfigure(accessFor(readonly)) }),
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  };
}
