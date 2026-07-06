import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CHALLENGES } from '../practice/practice-data';
import { recordMisses } from '../practice/review-queue';
import { Progress } from './progress';

/**
 * The dashboard aggregates stores it does NOT own via duplicated key
 * constants — these tests seed those exact keys and assert the numbers,
 * so a silently-bumped -v suffix in any owner page breaks a test here
 * instead of quietly zeroing a dashboard section.
 */
const PRACTICE_KEY = 'angular-practice-progress-v1';
const EXAM_HISTORY_KEY = 'angular-mock-exam-history-v1';
const CODING_TASKS_KEY = 'angular-coding-tasks-v1';
const EXAM_DAY_HISTORY_KEY = 'angular-exam-day-history-v1';

describe('Progress', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Progress],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function create(): Progress {
    return TestBed.createComponent(Progress).componentInstance;
  }

  it('shows zeros with a clean slate', () => {
    const component = create();
    expect(component.practiceAnswered()).toBe(0);
    expect(component.practiceAccuracy()).toBe(0);
    expect(component.examAttempts()).toEqual([]);
    expect(component.tasksDone()).toBe(0);
    expect(component.reviewDue()).toBe(0);
    expect(component.readinessChecks()).toEqual([]);
  });

  it('aggregates practice accuracy and per-category stats from the practice store', () => {
    const [a, b, c] = CHALLENGES;
    localStorage.setItem(
      PRACTICE_KEY,
      JSON.stringify({
        [a.id]: { answered: true, correct: true },
        [b.id]: { answered: true, correct: false },
        [c.id]: { answered: false, correct: false },
      }),
    );

    const component = create();
    expect(component.practiceAnswered()).toBe(2);
    expect(component.practiceCorrect()).toBe(1);
    expect(component.practiceAccuracy()).toBe(50);

    const total = component.categoryStats().reduce((sum, cat) => sum + cat.total, 0);
    expect(total).toBe(2);
  });

  it('ignores stale practice ids that no longer resolve in the bank', () => {
    localStorage.setItem(
      PRACTICE_KEY,
      JSON.stringify({ 999999: { answered: true, correct: true } }),
    );
    const component = create();
    expect(component.categoryStats()).toEqual([]);
  });

  it('summarizes mock-exam history: best, average, passes and weak areas', () => {
    localStorage.setItem(
      EXAM_HISTORY_KEY,
      JSON.stringify([
        {
          when: 1, scorePercent: 80, correct: 8, total: 10, passed: true,
          categories: { signals: { correct: 5, total: 5 }, forms: { correct: 1, total: 4 } },
        },
        {
          when: 2, scorePercent: 60, correct: 6, total: 10, passed: false,
          categories: { forms: { correct: 2, total: 4 } },
        },
      ]),
    );

    const component = create();
    expect(component.bestExam()).toBe(80);
    expect(component.avgExam()).toBe(70);
    expect(component.passCount()).toBe(1);

    // forms: 3/8 = 38% over >= 3 questions -> weak; signals 100% -> not weak.
    const weak = component.weakCategories();
    expect(weak.map((w) => w.id)).toEqual(['forms']);
    expect(weak[0].percent).toBe(38);
  });

  it('counts completed coding tasks from the simulator store', () => {
    localStorage.setItem(
      CODING_TASKS_KEY,
      JSON.stringify({ 1: { done: true }, 2: { done: false }, 3: { done: true } }),
    );
    const component = create();
    expect(component.tasksDone()).toBe(2);
  });

  it('reflects the review queue counts', () => {
    recordMisses([CHALLENGES[0].id, CHALLENGES[1].id]);
    const component = create();
    expect(component.reviewQueueSize()).toBe(2);
    expect(component.reviewDue()).toBe(2);
  });

  it('lists exam-day readiness verdicts, most recent first (capped at 3 shown)', () => {
    localStorage.setItem(
      EXAM_DAY_HISTORY_KEY,
      JSON.stringify([
        { when: 4, examScore: 85, tasksDone: 2, tasksTotal: 2, ready: true },
        { when: 3, examScore: 60, tasksDone: 1, tasksTotal: 2, ready: false },
        { when: 2, examScore: 55, tasksDone: 0, tasksTotal: 2, ready: false },
        { when: 1, examScore: 40, tasksDone: 0, tasksTotal: 2, ready: false },
      ]),
    );
    const component = create();
    expect(component.readinessChecks().length).toBe(4);
    expect(component.recentReadiness().length).toBe(3);
    expect(component.recentReadiness()[0].ready).toBe(true);
  });
});
