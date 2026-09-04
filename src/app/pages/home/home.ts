import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  afterNextRender,
  computed,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CURRICULUM } from '../../core/curriculum';
import { LEVELS, CategoryGroup, LevelGroup } from '../../core/lesson.model';
import { ProgressService } from '../../core/progress.service';
import { FilterLessonsPipe } from '../../shared/filter-lessons.pipe';
import { FilterTabsComponent, TabOption } from '../../shared/filter-tabs.component';
import { RevealOnScrollDirective } from '../../shared/reveal-on-scroll.directive';
import { TooltipDirective } from '../../shared/tooltip.directive';
import { TapeCard } from '../../shared/brain';

/**
 * Home — the curriculum landing page and the app's table of contents.
 *
 * Renders all 100+ lessons grouped by level and then by category, with a level
 * filter, a free-text search, per-lesson completion ticks from
 * {@link ProgressService}, and animated hero counters.
 *
 * This is a tool, not a lesson — it never opts into `.lesson.bf`. The hero's
 * six counters are the one place it reaches for a brain-friendly *presentation*
 * device ({@link TapeCard}): the app-wide warm palette and type tokens from
 * `brain-friendly.css` §3 apply to every page unconditionally, restyle-only.
 *
 * ## Where the grouping happens
 *
 * The curriculum is stored as a **flat** array (`core/curriculum.ts`); the
 * two-level level → category → lesson nesting the page renders is derived here
 * in {@link levels}, not stored. Keeping the source flat is what lets every
 * other consumer — the sidebar, search, the progress ring, the topicPath specs
 * — treat a lesson as a single record with an id, instead of each one having to
 * walk a tree.
 *
 * ## Three Angular APIs on show
 *
 * This page doubles as a live demonstration of the things it teaches:
 * `linkedSignal` for state that resets on a dependency, `afterNextRender` for
 * DOM-timed work, and `@HostListener` for document-level shortcuts.
 *
 * @see core/curriculum.ts — the flat lesson list.
 * @see core/progress.service.ts — the completion ticks.
 */
@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    FilterLessonsPipe,
    FilterTabsComponent,
    TooltipDirective,
    RevealOnScrollDirective,
    TapeCard,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  /** Completion state, for the per-lesson ticks and the level progress bars. */
  protected readonly progress = inject(ProgressService);

  /** Active level filter; `'all'` shows every level. */
  protected readonly filter = signal<string>('all');

  /**
   * Free-text search over lesson titles.
   *
   * A `linkedSignal` rather than a plain signal: it is writable like any other,
   * but **resets to `''` whenever {@link filter} changes**. Switching level
   * while a search is active would otherwise leave a stale query silently
   * filtering the new level down to nothing, which reads as an empty section
   * rather than as a filter still being applied.
   */
  protected readonly searchQuery = linkedSignal(() => {
    this.filter(); // establish reactive dependency
    return '';
  });

  /** The search box, focused by the `/` shortcut in {@link onKey}. */
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  /**
   * The flat curriculum reshaped into level → category → lesson, with per-level
   * totals.
   *
   * `built` counts lessons that have a `loadComponent`, i.e. that have a real
   * component behind them rather than a curriculum entry alone.
   */
  protected readonly levels = computed<LevelGroup[]>(() =>
    LEVELS.map((lvl) => {
      const lessons = CURRICULUM.filter((l) => l.level === lvl.id);
      const categories: CategoryGroup[] = [];
      for (const lesson of lessons) {
        let group = categories.find((c) => c.name === lesson.category);
        if (!group) {
          group = { name: lesson.category, lessons: [] };
          categories.push(group);
        }
        group.lessons.push(lesson);
      }
      return {
        id: lvl.id,
        label: lvl.label,
        blurb: lvl.blurb,
        total: lessons.length,
        built: lessons.filter((l) => l.loadComponent).length,
        categories,
      };
    }),
  );

  /** {@link levels} narrowed by the active filter — what actually renders. */
  protected readonly visibleLevels = computed(() => {
    const f = this.filter();
    return f === 'all' ? this.levels() : this.levels().filter((l) => l.id === f);
  });

  /** Tabs for the filter bar: "All" plus one per level, derived from the
   *  curriculum so adding a level needs no change here. */
  protected readonly filterOptions = computed<TabOption[]>(() => [
    { id: 'all', label: 'All' },
    ...this.levels().map((l) => ({ id: l.id, label: l.label })),
  ]);

  /** Every lesson in the curriculum — the hero's "concepts" figure. */
  protected readonly total = computed(() => CURRICULUM.length);

  /** Lessons with a component written — the hero's "lessons" figure. */
  protected readonly built = computed(() => CURRICULUM.filter((l) => l.loadComponent).length);

  // --- animated hero counters (see the constructor) ---

  /** Displayed value counting up towards {@link total}. */
  protected readonly animTotal = signal(0);

  /** Displayed value counting up towards {@link built}. */
  protected readonly animBuilt = signal(0);

  /** Displayed value counting up towards the practice-challenge count. */
  protected readonly animExercises = signal(0);

  /** Displayed value counting up towards the interview-question count. */
  protected readonly animInterviews = signal(0);

  /**
   * Starts the hero counter animation and registers its cleanup.
   *
   * The count-up runs inside `afterNextRender` rather than at construction for
   * two reasons: there is nothing to animate before the DOM exists, and on the
   * server there is no next render at all — so this never runs during SSR and
   * the markup is emitted with the final numbers rather than mid-count.
   *
   * Every timer handle is collected and cleared through `DestroyRef.onDestroy`.
   * Navigating away mid-animation would otherwise leave intervals writing to
   * signals on a destroyed component.
   */
  constructor() {
    const destroyRef = inject(DestroyRef);
    const handles: ReturnType<typeof setTimeout>[] = [];

    // Animate stat counters after first render.
    afterNextRender(() => {
      const countUp = (setter: (n: number) => void, target: number, delay: number) => {
        const t = setTimeout(() => {
          let n = 0;
          const step = Math.ceil(target / 40);
          const id = setInterval(() => {
            n = Math.min(n + step, target);
            setter(n);
            if (n >= target) clearInterval(id);
          }, 18);
          handles.push(id);
        }, delay);
        handles.push(t);
      };

      countUp((v) => this.animTotal.set(v), this.total(), 0);
      countUp((v) => this.animBuilt.set(v), this.built(), 80);
      countUp((v) => this.animExercises.set(v), 200, 160);
      countUp((v) => this.animInterviews.set(v), 253, 240);
    });

    // Cleanup timers on destroy.
    destroyRef.onDestroy(() => handles.forEach((h) => clearTimeout(h)));
  }

  /**
   * Document-level keyboard shortcuts: `/` focuses the search box, `Escape`
   * clears and blurs it.
   *
   * Bound on `document` rather than on the input, because `/` has to work when
   * the input is *not* focused — that is the entire point of the shortcut. The
   * `INPUT`/`TEXTAREA` check is what stops it hijacking a literal slash the
   * user is trying to type, and the modifier check leaves browser shortcuts
   * alone.
   *
   * @param e The keydown event.
   */
  @HostListener('document:keydown', ['$event'])
  protected onKey(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement).tagName;
    if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      this.searchInput()?.nativeElement.focus();
    }
    if (e.key === 'Escape') {
      this.searchQuery.set('');
      this.searchInput()?.nativeElement.blur();
    }
  }

  /**
   * An array of `count` empty slots (capped at 8) for `@for` to render skeleton
   * placeholders against. Angular's `@for` iterates a collection, so a count
   * has to be turned into one to repeat markup N times.
   *
   * @param count How many placeholders are wanted.
   */
  protected placeholderArr(count: number): unknown[] {
    return Array.from({ length: Math.min(count, 8) });
  }
}
