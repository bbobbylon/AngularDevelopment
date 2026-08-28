import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockExam } from './mock-exam';

/**
 * The timed-exam state machine: config -> active -> review, its scoring math,
 * and the localStorage history it hands to the Progress dashboard.
 */
const HISTORY_KEY = 'angular-mock-exam-history-v1';

describe('MockExam', () => {
  let fixture: ComponentFixture<MockExam>;
  let component: MockExam;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MockExam],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(MockExam);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy(); // stops any running countdown timer
  });

  describe('formatClock (via timeLabel)', () => {
    it('formats seconds as m:ss and does not roll over into an hours segment', () => {
      component.secondsLeft.set(0);
      expect(component.timeLabel()).toBe('0:00');
      component.secondsLeft.set(59);
      expect(component.timeLabel()).toBe('0:59');
      component.secondsLeft.set(60);
      expect(component.timeLabel()).toBe('1:00');
      component.secondsLeft.set(3599);
      expect(component.timeLabel()).toBe('59:59');
      // 3600s (1hr) still prints as raw minutes, not 1:00:00 — this is current
      // behavior, not a bug: no exam is long enough to reach it in practice.
      component.secondsLeft.set(3600);
      expect(component.timeLabel()).toBe('60:00');
    });
  });

  describe('scorePercent / passed', () => {
    it('is 0% with zero questions, never NaN or Infinity', () => {
      expect(component.questions()).toEqual([]);
      expect(component.scorePercent()).toBe(0);
      expect(component.passed()).toBe(false);
    });

    it('passes exactly at the 70% pass-mark boundary', () => {
      component.selectedCount.set(10);
      component.selectedCategory.set('all');
      component.selectedDiff.set('all');
      component.start();
      const qs = component.questions();
      expect(qs.length).toBe(10);

      // Answer 7/10 correctly, 3 wrong -> exactly 70%, which must count as PASS.
      qs.forEach((ch, i) => {
        const shuffled = component.shuffledOptions(ch);
        const wrongIdx = (shuffled.correctIndex + 1) % shuffled.options.length;
        component.answers.update((a) => ({
          ...a,
          [ch.id]: i < 7 ? shuffled.correctIndex : wrongIdx,
        }));
      });

      expect(component.correctCount()).toBe(7);
      expect(component.scorePercent()).toBe(70);
      expect(component.passed()).toBe(true);
    });

    it('fails one point under the pass mark', () => {
      component.selectedCount.set(10);
      component.start();
      const qs = component.questions();

      qs.forEach((ch, i) => {
        const shuffled = component.shuffledOptions(ch);
        const wrongIdx = (shuffled.correctIndex + 1) % shuffled.options.length;
        component.answers.update((a) => ({
          ...a,
          [ch.id]: i < 6 ? shuffled.correctIndex : wrongIdx,
        }));
      });

      expect(component.scorePercent()).toBe(60);
      expect(component.passed()).toBe(false);
    });
  });

  describe('categoryBreakdown', () => {
    it('computes a correct single-category breakdown even though the UI hides it at length <= 1', () => {
      component.selectedCount.set(5);
      component.selectedCategory.set('signals');
      component.start();
      const qs = component.questions();
      expect(qs.length).toBeGreaterThan(0);
      expect(qs.every((ch) => ch.category === 'signals')).toBe(true);

      const shuffled = component.shuffledOptions(qs[0]);
      component.answers.set({ [qs[0].id]: shuffled.correctIndex });

      const rows = component.categoryBreakdown();
      expect(rows.length).toBe(1);
      expect(rows[0].id).toBe('signals');
      expect(rows[0].total).toBe(qs.length);
      expect(rows[0].correct).toBe(1);
    });
  });

  describe('history persistence', () => {
    it('survives corrupt history storage by starting empty, not throwing', () => {
      localStorage.setItem(HISTORY_KEY, '{not json');
      const freshFixture = TestBed.createComponent(MockExam);
      expect(freshFixture.componentInstance.history()).toEqual([]);
      freshFixture.destroy();
    });

    it('finish() records one attempt and clearHistory() wipes it from storage too', () => {
      component.selectedCount.set(5);
      component.start();
      component.finish();

      expect(component.history().length).toBe(1);
      expect(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]').length).toBe(1);

      component.clearHistory();
      expect(component.history()).toEqual([]);
      expect(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')).toEqual([]);
    });

    it('finish() is a no-op the second time (timer + submit-button race guard)', () => {
      component.selectedCount.set(5);
      component.start();
      component.finish();
      const first = component.history();
      component.finish();
      expect(component.history()).toBe(first);
    });
  });
});
