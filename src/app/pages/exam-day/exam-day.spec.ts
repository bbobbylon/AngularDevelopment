import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ExamDay } from './exam-day';

/**
 * The readiness-check flow: exam leg → persisted active check → verdict.
 * The verdict rule (exam >= 70% AND both briefs done) and the localStorage
 * hand-off to /coding-tasks and the Progress dashboard are the contracts.
 */
const ACTIVE_KEY = 'angular-exam-day-active-v1';
const HISTORY_KEY = 'angular-exam-day-history-v1';
const CODING_TASKS_DONE_KEY = 'angular-coding-tasks-v1';

describe('ExamDay', () => {
  let fixture: ComponentFixture<ExamDay>;
  let component: ExamDay;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ExamDay],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ExamDay);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy(); // stops any running exam timer
  });

  it('starts idle with no active check or history', () => {
    expect(component.phase()).toBe('idle');
    expect(component.active()).toBeNull();
    expect(component.history()).toEqual([]);
  });

  it('draws a full timed exam on start', () => {
    component.startCheck();
    expect(component.phase()).toBe('exam');
    expect(component.questions().length).toBe(component.examQuestions);
    expect(component.secondsLeft()).toBe(component.examQuestions * 90);
  });

  it('finishing the exam assigns two tasks and persists the active check', () => {
    component.startCheck();
    component.finishExam();

    expect(component.phase()).toBe('tasks');
    const check = component.active();
    expect(check).not.toBeNull();
    expect(check!.taskIds.length).toBe(component.tasksRequired);
    expect(component.assignedTasks().length).toBe(component.tasksRequired);

    const persisted = JSON.parse(localStorage.getItem(ACTIVE_KEY) ?? 'null');
    expect(persisted?.taskIds).toEqual(check!.taskIds);
  });

  it('finishExam runs once even if the timer and the button race', () => {
    component.startCheck();
    component.finishExam();
    const first = component.active();
    component.finishExam();
    expect(component.active()).toBe(first);
  });

  it('verdict is NOT READY when the assigned briefs are incomplete', () => {
    component.startCheck();
    component.finishExam(); // no answers -> 0%
    component.evaluate();

    expect(component.phase()).toBe('result');
    const result = component.lastResult();
    expect(result?.ready).toBe(false);
    expect(result?.tasksDone).toBe(0);

    // Check is consumed and the verdict is on record for the dashboard.
    expect(component.active()).toBeNull();
    expect(localStorage.getItem(ACTIVE_KEY)).toBeNull();
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    expect(history.length).toBe(1);
    expect(history[0].ready).toBe(false);
  });

  it('counts briefs completed in the Coding-Task Simulator toward the verdict', () => {
    component.startCheck();
    component.finishExam();
    const taskIds = component.active()!.taskIds;

    // Simulate the user completing both briefs over in /coding-tasks.
    localStorage.setItem(
      CODING_TASKS_DONE_KEY,
      JSON.stringify(Object.fromEntries(taskIds.map((id) => [id, { done: true }]))),
    );
    component.refreshTaskStatus();
    expect(component.assignedDoneCount()).toBe(component.tasksRequired);

    component.evaluate();
    const result = component.lastResult();
    expect(result?.tasksDone).toBe(component.tasksRequired);
    // Exam was 0%, so still not ready — BOTH legs must pass.
    expect(result?.ready).toBe(false);
  });

  it('resumes a persisted check on a fresh visit', () => {
    component.startCheck();
    component.finishExam();
    const taskIds = component.active()!.taskIds;
    fixture.destroy();

    fixture = TestBed.createComponent(ExamDay);
    component = fixture.componentInstance;
    expect(component.active()?.taskIds).toEqual(taskIds);
    component.resume();
    expect(component.phase()).toBe('tasks');
  });

  it('discarding an active check clears the persisted state', () => {
    component.startCheck();
    component.finishExam();
    component.abandon();
    expect(component.phase()).toBe('idle');
    expect(component.active()).toBeNull();
    expect(localStorage.getItem(ACTIVE_KEY)).toBeNull();
  });
});
