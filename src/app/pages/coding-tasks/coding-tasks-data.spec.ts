import { CURRICULUM } from '../../core/curriculum';
import { CODING_TASKS } from './coding-tasks-data';

/**
 * Integrity checks over the coding-task bank. The simulator keys checklist
 * state by task id and index, and Exam-Day assigns tasks by difficulty —
 * these invariants keep both consumers safe as the bank grows.
 */
describe('coding-tasks data bank', () => {
  it('has unique ids (localStorage checklist state keys on them)', () => {
    const ids = CODING_TASKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every task a scenario, requirements, hints and a solution', () => {
    for (const task of CODING_TASKS) {
      expect(task.scenario.trim().length, `task ${task.id} scenario`).toBeGreaterThan(0);
      expect(task.requirements.length, `task ${task.id} requirements`).toBeGreaterThanOrEqual(3);
      expect(task.hints.length, `task ${task.id} hints`).toBeGreaterThanOrEqual(1);
      expect(task.starterCode.trim().length, `task ${task.id} starter`).toBeGreaterThan(0);
      expect(task.solutionCode.trim().length, `task ${task.id} solution`).toBeGreaterThan(0);
      expect(task.explanation.trim().length, `task ${task.id} explanation`).toBeGreaterThan(0);
      expect(task.timeboxMinutes, `task ${task.id} timebox`).toBeGreaterThan(0);
    }
  });

  it('points every topicPath at a real curriculum lesson', () => {
    const lessonIds = new Set(CURRICULUM.map((l) => l.id));
    for (const task of CODING_TASKS) {
      if (!task.topicPath) continue;
      expect(lessonIds.has(task.topicPath), `task ${task.id} topicPath "${task.topicPath}"`).toBe(
        true,
      );
    }
  });

  it('has at least one mid and one senior task (Exam-Day assigns one of each)', () => {
    expect(CODING_TASKS.some((t) => t.difficulty === 'mid')).toBe(true);
    expect(CODING_TASKS.some((t) => t.difficulty === 'senior')).toBe(true);
  });
});
