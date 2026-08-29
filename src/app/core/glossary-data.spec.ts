import { GLOSSARY } from './glossary-data';
import { CURRICULUM } from './curriculum';

/**
 * Integrity guard for the glossary, mirroring the one in
 * `pages/practice/practice-data.spec.ts`.
 *
 * `topicPath` is rendered as a "Study this" link straight to `/<lessonId>`,
 * with no runtime validation — a stale id produces a silent 404 that nothing
 * in the app complains about. The equivalent guard on the challenge bank once
 * caught 43 dead links at once, which is exactly the failure mode this
 * prevents here: lesson ids get renamed during curriculum edits, and the
 * glossary is the last place anyone thinks to update.
 */
describe('glossary data integrity', () => {
  it('has entries', () => {
    expect(GLOSSARY.length).toBeGreaterThan(0);
  });

  it('points every topicPath at a real curriculum lesson (no 404 study links)', () => {
    const lessonIds = new Set(CURRICULUM.map((l) => l.id));
    for (const entry of GLOSSARY) {
      if (!entry.topicPath) continue;
      expect(lessonIds.has(entry.topicPath), `term "${entry.term}" -> "${entry.topicPath}"`).toBe(
        true,
      );
    }
  });

  it('gives every entry a term and a definition', () => {
    for (const entry of GLOSSARY) {
      expect(entry.term?.trim(), JSON.stringify(entry)).toBeTruthy();
      expect(entry.definition?.trim(), entry.term).toBeTruthy();
    }
  });

  it('defines each term only once', () => {
    const seen = new Map<string, number>();
    for (const entry of GLOSSARY) {
      const key = entry.term.toLowerCase();
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    const duplicates = [...seen.entries()].filter(([, n]) => n > 1).map(([term]) => term);
    expect(duplicates).toEqual([]);
  });

  it('keeps the source list grouped A-Z by first letter', () => {
    // The page re-sorts and buckets by letter itself, so exact source order is
    // not a rendering contract. What matters is that the file stays
    // alphabetically grouped: it is edited by hand, and a term filed under the
    // wrong letter is how the same word ends up defined twice.
    const letters = GLOSSARY.map((e) => e.term[0].toUpperCase());
    const outOfPlace = letters
      .map((letter, i) => ({ letter, term: GLOSSARY[i].term, prev: letters[i - 1] }))
      .filter((x, i) => i > 0 && x.letter < x.prev)
      .map((x) => `${x.term} (${x.letter} after ${x.prev})`);
    expect(outOfPlace).toEqual([]);
  });
});
