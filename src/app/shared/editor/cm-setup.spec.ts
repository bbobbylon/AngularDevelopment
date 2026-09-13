import { afterEach, describe, expect, it } from 'vitest';
import { createEditor, type EditorHandle } from './cm-setup';

/**
 * The one place `createEditor` is exercised against a real `EditorView` rather
 * than a mock — everything else in `editor.spec.ts` mocks this module out, so
 * this file is what actually proves CodeMirror mounts, edits and tears down
 * cleanly under jsdom (the environment `CodeEditor` itself falls back from in
 * a real old browser, but Vitest's jsdom happens to run CodeMirror fine).
 */
describe('createEditor', () => {
  let handle: EditorHandle | null = null;
  let parent: HTMLElement | null = null;

  afterEach(() => {
    handle?.destroy();
    handle = null;
    parent?.remove();
    parent = null;
  });

  function mount(doc: string, lang: 'ts' | 'js' | 'html' | 'css' | 'json' = 'ts'): EditorHandle {
    parent = document.createElement('div');
    document.body.appendChild(parent);
    handle = createEditor(parent, {
      doc,
      lang,
      readonly: false,
      label: 'Test editor',
      onChange: () => {},
    });
    return handle;
  }

  it('mounts the starting document into the host element', () => {
    mount('const a = 1;');
    expect(parent?.querySelector('.cm-content')?.textContent).toBe('const a = 1;');
  });

  it('reports the current document through getDoc', () => {
    const h = mount('hello');
    expect(h.getDoc()).toBe('hello');
  });

  it('replaces the whole document on setDoc', () => {
    const h = mount('one');
    h.setDoc('two');
    expect(h.getDoc()).toBe('two');
  });

  it('calls onChange with the full text after an edit', () => {
    parent = document.createElement('div');
    document.body.appendChild(parent);
    const seen: string[] = [];
    handle = createEditor(parent, {
      doc: 'a',
      lang: 'js',
      readonly: false,
      label: 'Test editor',
      onChange: (doc) => seen.push(doc),
    });

    handle.setDoc('ab');
    expect(seen).toEqual(['ab']);
  });

  it('does not call onChange for a change with no doc effect', () => {
    // setLang/setReadonly reconfigure compartments, which is not a document change.
    const h = mount('a');
    let calls = 0;
    // Re-mount with a spying onChange to isolate this from the constructor's own doc.
    parent?.remove();
    parent = document.createElement('div');
    document.body.appendChild(parent);
    handle = createEditor(parent, {
      doc: 'a',
      lang: 'js',
      readonly: false,
      label: 'Test editor',
      onChange: () => calls++,
    });
    handle.setLang('ts');
    handle.setReadonly(true);
    expect(calls).toBe(0);
    void h;
  });

  it('marks the content read-only when asked, and lifts it again', () => {
    const h = mount('a');
    h.setReadonly(true);
    expect(parent?.querySelector('.cm-content')?.getAttribute('contenteditable')).toBe('false');

    h.setReadonly(false);
    expect(parent?.querySelector('.cm-content')?.getAttribute('contenteditable')).not.toBe('false');
  });

  it('exposes the label as the accessible name of the editable content', () => {
    mount('a');
    expect(parent?.querySelector('.cm-content')?.getAttribute('aria-label')).toBe('Test editor');
  });

  it('switches grammar without disturbing the document', () => {
    const h = mount('<p>hi</p>', 'html');
    h.setLang('css');
    expect(h.getDoc()).toBe('<p>hi</p>');
  });

  it('tears down cleanly, leaving nothing mounted', () => {
    const h = mount('a');
    h.destroy();
    expect(parent?.querySelector('.cm-editor')).toBeNull();
  });
});
