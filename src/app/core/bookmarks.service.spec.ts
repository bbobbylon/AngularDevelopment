import { TestBed } from '@angular/core/testing';
import { BookmarksService } from './bookmarks.service';
import { STORAGE_KEYS } from './storage';

/**
 * Bookmarks are the only store the user edits directly (a note per item), and
 * the only one whose ids are namespaced across two different sources. The
 * contracts worth pinning: the `practice-` prefix that distinguishes the two
 * kinds, the note lifecycle around un-starring, newest-first ordering, and the
 * generated practice label the Bookmarks page renders.
 */
describe('BookmarksService', () => {
  /** Builds a fresh service against whatever is currently in localStorage. */
  function makeService(): BookmarksService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(BookmarksService);
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty', () => {
    const bookmarks = makeService();
    expect(bookmarks.count()).toBe(0);
    expect(bookmarks.list()).toEqual([]);
  });

  it('toggles an item on and back off', () => {
    const bookmarks = makeService();
    bookmarks.toggle('signals', 'Signals');
    expect(bookmarks.isBookmarked('signals')).toBe(true);
    expect(bookmarks.count()).toBe(1);

    bookmarks.toggle('signals', 'Signals');
    expect(bookmarks.isBookmarked('signals')).toBe(false);
    expect(bookmarks.count()).toBe(0);
  });

  it('stores the label and an empty note on create', () => {
    const bookmarks = makeService();
    bookmarks.toggle('signals', 'Signals');
    const entry = bookmarks.bookmarks()['signals'];
    expect(entry.label).toBe('Signals');
    expect(entry.note).toBe('');
    expect(entry.addedAt).toBeGreaterThan(0);
  });

  it('keeps lesson and practice ids distinct via the practice- prefix', () => {
    const bookmarks = makeService();
    bookmarks.toggle('signals', 'Signals');
    bookmarks.toggle('practice-12', 'Practice #12 — something');
    expect(bookmarks.count()).toBe(2);
    expect(bookmarks.isBookmarked('practice-12')).toBe(true);
    expect(bookmarks.isBookmarked('12')).toBe(false);
  });

  it('setNote replaces the note on an existing bookmark', () => {
    const bookmarks = makeService();
    bookmarks.toggle('signals', 'Signals');
    bookmarks.setNote('signals', 'computed() is lazy');
    expect(bookmarks.bookmarks()['signals'].note).toBe('computed() is lazy');

    bookmarks.setNote('signals', 'replaced');
    expect(bookmarks.bookmarks()['signals'].note).toBe('replaced');
  });

  it('setNote silently ignores an unknown id rather than creating one', () => {
    const bookmarks = makeService();
    bookmarks.setNote('never-starred', 'orphan note');
    expect(bookmarks.count()).toBe(0);
  });

  it('discards the note when an item is un-starred and re-starred', () => {
    const bookmarks = makeService();
    bookmarks.toggle('signals', 'Signals');
    bookmarks.setNote('signals', 'my note');
    bookmarks.toggle('signals', 'Signals');
    bookmarks.toggle('signals', 'Signals');
    expect(bookmarks.bookmarks()['signals'].note).toBe('');
  });

  it('remove() deletes outright and does not create when absent', () => {
    const bookmarks = makeService();
    bookmarks.toggle('signals', 'Signals');
    bookmarks.remove('signals');
    expect(bookmarks.count()).toBe(0);

    bookmarks.remove('signals');
    expect(bookmarks.count()).toBe(0);
  });

  it('lists newest first', () => {
    const bookmarks = makeService();
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 0, 1));
      bookmarks.toggle('a', 'A');
      vi.setSystemTime(new Date(2026, 0, 2));
      bookmarks.toggle('b', 'B');
      vi.setSystemTime(new Date(2026, 0, 3));
      bookmarks.toggle('c', 'C');
    } finally {
      vi.useRealTimers();
    }
    expect(bookmarks.list().map((b) => b.id)).toEqual(['c', 'b', 'a']);
  });

  it('persists across a reload', () => {
    makeService().toggle('signals', 'Signals');
    TestBed.tick(); // flush the persistence effect()
    expect(makeService().isBookmarked('signals')).toBe(true);
  });

  it('starts empty when the persisted state is corrupt', () => {
    localStorage.setItem(STORAGE_KEYS.bookmarks, '{not json');
    expect(makeService().count()).toBe(0);
  });

  describe('practiceLabel', () => {
    it('prefixes with the challenge number', () => {
      expect(BookmarksService.practiceLabel(7, 'What is a signal?')).toBe(
        'Practice #7 — What is a signal?',
      );
    });

    it('leaves a question at the length limit untouched', () => {
      const exactly60 = 'x'.repeat(60);
      expect(BookmarksService.practiceLabel(1, exactly60)).toBe(`Practice #1 — ${exactly60}`);
    });

    it('ellipsizes a longer question', () => {
      const label = BookmarksService.practiceLabel(1, 'y'.repeat(80));
      expect(label).toBe(`Practice #1 — ${'y'.repeat(60)}…`);
    });
  });
});
