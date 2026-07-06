import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CODING_TASKS } from './coding-tasks-data';
import { CodingTasks } from './coding-tasks';

/**
 * The behavioral contract of the simulator: completion is GATED on the full
 * requirements checklist, unchecking a requirement revokes completion, and all
 * of it persists under the storage key the Progress dashboard and Exam-Day
 * read ('angular-coding-tasks-v1').
 */
const STORAGE_KEY = 'angular-coding-tasks-v1';

describe('CodingTasks', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CodingTasks],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function create(): CodingTasks {
    return TestBed.createComponent(CodingTasks).componentInstance;
  }

  it('starts every task unchecked, unrevealed and not done', () => {
    const component = create();
    const state = component.stateOf(CODING_TASKS[0].id);
    expect(state.done).toBe(false);
    expect(state.revealed).toBe(false);
    expect(state.hintsShown).toBe(0);
    expect(component.checkedCount(CODING_TASKS[0])).toBe(0);
    expect(component.completedCount()).toBe(0);
  });

  it('counts checked requirements as they toggle', () => {
    const component = create();
    const task = CODING_TASKS[0];
    component.toggleCheck(task, 0);
    component.toggleCheck(task, 2);
    expect(component.checkedCount(task)).toBe(2);
    component.toggleCheck(task, 0);
    expect(component.checkedCount(task)).toBe(1);
  });

  it('revokes completion when a requirement is unchecked afterwards', () => {
    const component = create();
    const task = CODING_TASKS[0];
    task.requirements.forEach((_, i) => component.toggleCheck(task, i));
    component.setDone(task, true);
    expect(component.stateOf(task.id).done).toBe(true);

    component.toggleCheck(task, 1);
    expect(component.stateOf(task.id).done).toBe(false);
  });

  it('reveals hints one at a time, capped at the hint count', () => {
    const component = create();
    const task = CODING_TASKS[0];
    for (let i = 0; i < task.hints.length + 3; i++) component.showHint(task);
    expect(component.stateOf(task.id).hintsShown).toBe(task.hints.length);
    expect(component.visibleHints(task)).toEqual(task.hints);
  });

  it('persists state under the key the dashboard and Exam-Day read', () => {
    const component = create();
    const task = CODING_TASKS[0];
    task.requirements.forEach((_, i) => component.toggleCheck(task, i));
    component.setDone(task, true);
    TestBed.tick(); // flush the persistence effect()

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored[task.id]?.done).toBe(true);

    // A fresh component (new visit) restores the same state.
    const fresh = create();
    expect(fresh.stateOf(task.id).done).toBe(true);
    expect(fresh.completedCount()).toBe(1);
  });
});
