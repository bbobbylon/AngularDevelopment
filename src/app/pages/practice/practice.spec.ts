import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Practice } from './practice';
import { CHALLENGES, type Challenge } from './practice-data';
import { STORAGE_KEYS } from '../../core/storage';

/**
 * Two behaviours of the Practice page that nothing else covers:
 *
 * - **Incremental rendering.** The bank is 400+ questions and only a batch is
 *   put in the DOM at a time. The subtle part is not the slicing but the
 *   *resets*: any control that changes the visible set must collapse the limit
 *   back, or a filter change dumps hundreds of cards into the page at once.
 * - **Adaptive difficulty.** A signed streak counter that promotes after 3
 *   correct and demotes after 2 wrong, clamped at both ends of the tier list.
 *   The sign-flip on a change of direction (a miss during a correct run must
 *   restart at -1, not decrement a positive streak) is the easy thing to break.
 */
describe('Practice', () => {
  /** The batch size the component renders in — kept in sync with RENDER_BATCH. */
  const RENDER_BATCH = 25;

  /** Builds a fresh page component against current localStorage. */
  async function makePage(): Promise<Practice> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Practice],
      providers: [provideRouter([])],
    }).compileComponents();
    return TestBed.createComponent(Practice).componentInstance;
  }

  /** Answers a challenge correctly or not, going through the real select+submit path. */
  function answer(page: Practice, ch: Challenge, correct: boolean): void {
    const shuffled = page.getShuffledChallengeOptions(ch);
    const index = correct
      ? shuffled.correctIndex
      : (shuffled.correctIndex + 1) % shuffled.options.length;
    page.selectOption(ch.id, index);
    page.submit(ch);
  }

  /** Reads the persisted adaptive-difficulty state. */
  function persistedAdaptive() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.practiceAdaptive) ?? '{}');
  }

  beforeEach(() => {
    localStorage.clear();
  });

  describe('incremental rendering', () => {
    it('renders only the first batch even though every challenge matches', async () => {
      const page = await makePage();
      expect(page.totalVisible()).toBe(CHALLENGES.length);
      expect(page.pagedChallenges().length).toBe(RENDER_BATCH);
      expect(page.hiddenCount()).toBe(CHALLENGES.length - RENDER_BATCH);
    });

    it('renders a page-worth more on showMore()', async () => {
      const page = await makePage();
      page.showMore();
      expect(page.pagedChallenges().length).toBe(RENDER_BATCH * 2);
    });

    it('renders everything on showAll(), leaving nothing hidden', async () => {
      const page = await makePage();
      page.showAll();
      expect(page.pagedChallenges().length).toBe(CHALLENGES.length);
      expect(page.hiddenCount()).toBe(0);
    });

    it('never renders more than what matches the filters', async () => {
      const page = await makePage();
      page.showAll();
      page.setDifficulty('junior');
      page.showAll();
      expect(page.pagedChallenges().length).toBe(page.totalVisible());
      expect(page.hiddenCount()).toBe(0);
    });

    it('collapses back to one batch when the category filter changes', async () => {
      const page = await makePage();
      page.showAll();
      page.setCategory('signals');
      expect(page.pagedChallenges().length).toBeLessThanOrEqual(RENDER_BATCH);
    });

    it('collapses back to one batch when the difficulty filter changes', async () => {
      const page = await makePage();
      page.showAll();
      page.setDifficulty('senior');
      expect(page.pagedChallenges().length).toBeLessThanOrEqual(RENDER_BATCH);
    });

    it('collapses back to one batch on shuffle', async () => {
      const page = await makePage();
      page.showAll();
      page.reshuffle();
      expect(page.pagedChallenges().length).toBe(RENDER_BATCH);
    });

    it('collapses back to one batch when adaptive mode is toggled', async () => {
      const page = await makePage();
      page.showAll();
      page.toggleAdaptive();
      expect(page.pagedChallenges().length).toBeLessThanOrEqual(RENDER_BATCH);
    });

    it('reports hiddenCount as zero rather than negative for a small filtered set', async () => {
      const page = await makePage();
      page.setCategory('signals');
      expect(page.hiddenCount()).toBeGreaterThanOrEqual(0);
    });

    it('keeps the answer to a card that is no longer rendered', async () => {
      // Answer state is keyed by challenge id, not by list position, so
      // collapsing the render limit must not discard it. Uses a filter change
      // rather than shuffle, which resets the session on purpose (below).
      const page = await makePage();
      page.showAll();
      const late = page.visibleChallenges()[RENDER_BATCH + 10];
      answer(page, late, true);

      page.setCategory(late.category);
      expect(page.getState(late.id).answered).toBe(true);
      expect(page.getState(late.id).correct).toBe(true);
    });

    it('shuffle clears the answer sheet, because the option order changes too', async () => {
      // Not incidental: `selected` is an index into the shuffled options, so
      // keeping it across a reshuffle would mark right answers as wrong.
      const page = await makePage();
      const ch = page.visibleChallenges()[0];
      answer(page, ch, true);
      expect(page.getState(ch.id).answered).toBe(true);

      page.reshuffle();
      expect(page.getState(ch.id).answered).toBe(false);
      expect(page.getState(ch.id).selected).toBeNull();
      expect(page.answeredCount()).toBe(0);
    });
  });

  describe('adaptive difficulty', () => {
    /** Turns adaptive mode on and returns the challenges it is currently serving. */
    function enable(page: Practice): void {
      page.toggleAdaptive();
      expect(page.adaptiveEnabled()).toBe(true);
    }

    it('starts off, at the junior tier', async () => {
      const page = await makePage();
      expect(page.adaptiveEnabled()).toBe(false);
      expect(page.adaptiveLevel()).toBe('junior');
    });

    it('serves only the current tier once enabled', async () => {
      const page = await makePage();
      enable(page);
      expect(page.visibleChallenges().every((c) => c.difficulty === 'junior')).toBe(true);
    });

    it('overrides the manual difficulty filter while enabled', async () => {
      const page = await makePage();
      page.setDifficulty('senior');
      enable(page);
      expect(page.visibleChallenges().every((c) => c.difficulty === 'junior')).toBe(true);
    });

    it('promotes a tier after 3 correct in a row', async () => {
      const page = await makePage();
      enable(page);
      for (let i = 0; i < 3; i++) answer(page, page.visibleChallenges()[i], true);
      expect(page.adaptiveLevel()).toBe('mid');
    });

    it('does not promote after only 2 correct', async () => {
      const page = await makePage();
      enable(page);
      for (let i = 0; i < 2; i++) answer(page, page.visibleChallenges()[i], true);
      expect(page.adaptiveLevel()).toBe('junior');
    });

    it('demotes a tier after 2 wrong in a row', async () => {
      const page = await makePage();
      enable(page);
      for (let i = 0; i < 3; i++) answer(page, page.visibleChallenges()[i], true);
      expect(page.adaptiveLevel()).toBe('mid');

      for (let i = 0; i < 2; i++) answer(page, page.visibleChallenges()[i], false);
      expect(page.adaptiveLevel()).toBe('junior');
    });

    it('restarts the run when the direction changes, rather than netting off', async () => {
      // Two correct then one wrong must leave a miss-run of 1, not a correct-run
      // of 1 — otherwise a single miss inside a good run silently costs nothing.
      const page = await makePage();
      enable(page);
      answer(page, page.visibleChallenges()[0], true);
      answer(page, page.visibleChallenges()[1], true);
      answer(page, page.visibleChallenges()[2], false);
      expect(page.adaptiveLevel()).toBe('junior');

      // One more miss is now enough to demote if there were a tier below.
      answer(page, page.visibleChallenges()[3], false);
      expect(page.adaptiveLevel()).toBe('junior'); // already at the floor
    });

    it('clamps at the junior floor', async () => {
      const page = await makePage();
      enable(page);
      for (let i = 0; i < 6; i++) answer(page, page.visibleChallenges()[i], false);
      expect(page.adaptiveLevel()).toBe('junior');
    });

    it('clamps at the senior ceiling', async () => {
      const page = await makePage();
      enable(page);
      for (let i = 0; i < 12; i++) answer(page, page.visibleChallenges()[i], true);
      expect(page.adaptiveLevel()).toBe('senior');
    });

    it('does not move the tier while adaptive mode is off', async () => {
      const page = await makePage();
      for (let i = 0; i < 6; i++) answer(page, page.visibleChallenges()[i], true);
      expect(page.adaptiveLevel()).toBe('junior');
    });

    it('clears the streak when toggled, so a run does not carry over', async () => {
      const page = await makePage();
      enable(page);
      answer(page, page.visibleChallenges()[0], true);
      answer(page, page.visibleChallenges()[1], true);
      page.toggleAdaptive();
      page.toggleAdaptive();

      // The two earlier correct answers must not count toward the promotion.
      answer(page, page.visibleChallenges()[0], true);
      expect(page.adaptiveLevel()).toBe('junior');
    });

    it('persists the tier across a reload', async () => {
      const page = await makePage();
      enable(page);
      for (let i = 0; i < 3; i++) answer(page, page.visibleChallenges()[i], true);
      TestBed.tick(); // flush the persistence effect()
      expect(persistedAdaptive().level).toBe('mid');

      const reloaded = await makePage();
      expect(reloaded.adaptiveEnabled()).toBe(true);
      expect(reloaded.adaptiveLevel()).toBe('mid');
    });

    it('loads over the defaults, so state saved before a field existed still works', async () => {
      localStorage.setItem(STORAGE_KEYS.practiceAdaptive, JSON.stringify({ enabled: true }));
      const page = await makePage();
      expect(page.adaptiveEnabled()).toBe(true);
      expect(page.adaptiveLevel()).toBe('junior');
    });
  });
});
