import { TestBed } from '@angular/core/testing';
import { ProgressService } from './progress.service';
import { STORAGE_KEYS } from './storage';

/**
 * The visited-lessons store. Small, but three things about it are load-bearing
 * elsewhere and easy to break:
 *
 * - **Idempotent marking** — the app shell calls `markVisited` on every
 *   `NavigationEnd`, so a re-visit must not disturb the signal (which would
 *   fire the persist effect for no reason).
 * - **Set/array round-trip** — a `Set` is not JSON-serializable, so it is
 *   stored as an array and rebuilt on load. A regression here loses all
 *   progress silently on the next reload.
 * - **`reset()` really resets** — including after the persist effect runs.
 *   Clearing the signal and deleting the key would race, and the effect would
 *   win; the service deliberately only clears the signal.
 */
describe('ProgressService', () => {
  /** Builds a fresh service against whatever is currently in localStorage. */
  function makeService(): ProgressService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(ProgressService);
  }

  /** Reads what the persist effect actually wrote. */
  function persisted(): string[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.visitedLessons) ?? '[]');
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty', () => {
    const progress = makeService();
    expect(progress.visitedCount()).toBe(0);
    expect(progress.isVisited('signals')).toBe(false);
  });

  it('marks a lesson visited', () => {
    const progress = makeService();
    progress.markVisited('signals');
    expect(progress.isVisited('signals')).toBe(true);
    expect(progress.visitedCount()).toBe(1);
  });

  it('counts distinct lessons only, however many times each is visited', () => {
    const progress = makeService();
    progress.markVisited('signals');
    progress.markVisited('signals');
    progress.markVisited('signals');
    progress.markVisited('control-flow-if');
    expect(progress.visitedCount()).toBe(2);
  });

  it('does not replace the set when re-marking an already-visited lesson', () => {
    // Identity check: `markVisited` returns early rather than building a new
    // Set, so the persist effect has nothing to react to.
    const progress = makeService();
    progress.markVisited('signals');
    const before = progress.visited();
    progress.markVisited('signals');
    expect(progress.visited()).toBe(before);
  });

  it('persists as a JSON array and rebuilds the Set on reload', () => {
    const progress = makeService();
    progress.markVisited('signals');
    progress.markVisited('inputs');
    TestBed.tick(); // flush the persistence effect()
    expect(persisted().sort()).toEqual(['inputs', 'signals']);

    const reloaded = makeService();
    expect(reloaded.isVisited('signals')).toBe(true);
    expect(reloaded.isVisited('inputs')).toBe(true);
    expect(reloaded.visitedCount()).toBe(2);
  });

  it('starts empty when the persisted data is corrupt', () => {
    localStorage.setItem(STORAGE_KEYS.visitedLessons, '{not json');
    expect(makeService().visitedCount()).toBe(0);
  });

  it('reset() clears everything and stays cleared after the effect runs', () => {
    const progress = makeService();
    progress.markVisited('signals');
    progress.reset();
    expect(progress.visitedCount()).toBe(0);

    TestBed.tick(); // flush the persistence effect()
    expect(persisted()).toEqual([]);
    expect(makeService().visitedCount()).toBe(0);
  });
});
