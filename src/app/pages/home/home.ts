import { Component, DestroyRef, ElementRef, HostListener, afterNextRender, computed, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CURRICULUM } from '../../core/curriculum';
import { LEVELS, CategoryGroup, LevelGroup } from '../../core/lesson.model';
import { ProgressService } from '../../core/progress.service';
import { FilterLessonsPipe } from '../../shared/filter-lessons.pipe';
import { FilterTabsComponent, TabOption } from '../../shared/filter-tabs.component';
import { TooltipDirective } from '../../shared/tooltip.directive';

@Component({
  selector: 'app-home',
  imports: [RouterLink, FilterLessonsPipe, FilterTabsComponent, TooltipDirective],
  template: `
    <header class="hero">
      <span class="pill">Angular 21 · Standalone · Signals</span>
      <h1>From Zero to Angular Expert, in One Place</h1>
      <p class="lead">
        A complete, hands-on curriculum that starts at absolute zero and takes you through
        Foundations, TypeScript, Beginner, Intermediate and Expert Angular — plus interactive
        practice challenges, interview prep, and real project walkthroughs. Everything you
        need to land a senior Angular role.
      </p>
      <div class="stats">
        <div class="stat">
          <strong>{{ animTotal() }}</strong>
          <span>concepts</span>
        </div>
        <div class="stat">
          <strong>{{ animBuilt() }}</strong>
          <span>live lessons</span>
        </div>
        <div class="stat">
          <strong>{{ animExercises() }}+</strong>
          <span>exercises</span>
        </div>
        <div class="stat">
          <strong>{{ animInterviews() }}</strong>
          <span>interview Q&A</span>
        </div>
        <div class="stat">
          <strong>5</strong>
          <span>difficulty tracks</span>
        </div>
        <div class="stat stat--progress">
          <strong>{{ progress.visitedCount() }}<span class="stat__denom">/{{ built() }}</span></strong>
          <span>lessons visited</span>
        </div>
      </div>
    </header>

    <!-- Tools section -->
    <section class="tools-section">
      <h2 class="tools-heading">Go Beyond Reading — Build & Practice</h2>
      <div class="tools-grid">
        <a class="tool-card tool-card--practice" routerLink="/practice">
          <div class="tool-card__icon">⚡</div>
          <div class="tool-card__body">
            <h3>Practice Challenges</h3>
            <p>424 exercises: spot the bug, predict output, multiple choice — plus a timed mock exam, flashcard drills, and a spaced-repetition review queue for everything you miss.</p>
            <span class="tool-card__cta">Start practicing →</span>
          </div>
        </a>
        <a class="tool-card tool-card--interview" routerLink="/interview">
          <div class="tool-card__icon">🎯</div>
          <div class="tool-card__body">
            <h3>Interview Prep</h3>
            <p>253 real interview questions — Junior, Mid, and Senior — with complete answers, flashcard mode, and follow-up prompts.</p>
            <span class="tool-card__cta">Study interview Q&A →</span>
          </div>
        </a>
        <a class="tool-card tool-card--projects" routerLink="/task-manager">
          <div class="tool-card__icon">🏗️</div>
          <div class="tool-card__body">
            <h3>Project Walkthroughs</h3>
            <p>3 full-stack builds: Task Manager, Auth Flow, and Data Dashboard. Step-by-step with live demos.</p>
            <span class="tool-card__cta">Build something real →</span>
          </div>
        </a>
        <a class="tool-card tool-card--tasks" routerLink="/coding-tasks">
          <div class="tool-card__icon">🛠️</div>
          <div class="tool-card__body">
            <h3>Coding-Task Simulator</h3>
            <p>Timeboxed practical-exam briefs: build it in your editor, then verify against a requirements checklist and model solution.</p>
            <span class="tool-card__cta">Take on a build task →</span>
          </div>
        </a>
        <a class="tool-card tool-card--api" routerLink="/api-playground">
          <div class="tool-card__icon">📡</div>
          <div class="tool-card__body">
            <h3>API Playground</h3>
            <p>Fire real HTTP requests and dissect every step — headers, auth, interceptors, request/response bodies — with live data at each stage.</p>
            <span class="tool-card__cta">Dissect a request →</span>
          </div>
        </a>
        <a class="tool-card tool-card--examday" routerLink="/exam-day">
          <div class="tool-card__icon">🎓</div>
          <div class="tool-card__body">
            <h3>Exam-Day Readiness</h3>
            <p>The full dress rehearsal: a timed 20-question exam plus two build briefs in one sitting, with a single READY / NOT YET verdict.</p>
            <span class="tool-card__cta">Run the readiness check →</span>
          </div>
        </a>
        <a class="tool-card tool-card--progress" routerLink="/progress">
          <div class="tool-card__icon">📊</div>
          <div class="tool-card__body">
            <h3>Progress Dashboard</h3>
            <p>Lessons, practice accuracy by category, mock-exam history, review queue, and coding tasks — your whole journey on one page.</p>
            <span class="tool-card__cta">See where you stand →</span>
          </div>
        </a>
        <a class="tool-card tool-card--cert" routerLink="/certification">
          <div class="tool-card__icon">📋</div>
          <div class="tool-card__body">
            <h3>Certification Prep</h3>
            <p>Complete map of every certificates.dev exam topic to the lesson that covers it. Junior → Senior.</p>
            <span class="tool-card__cta">See the cert map →</span>
          </div>
        </a>
      </div>
    </section>

    <!-- Project overview (resume / demo snapshot) -->
    <section class="about">
      <div class="about__header">
        <h2 class="about__title">Project Overview</h2>
        <p class="about__sub">Built as a portfolio project demonstrating end-to-end Angular 21 engineering — from architecture to UX.</p>
      </div>

      <div class="about__body">
        <div class="about__desc">
          <p>
            A fully self-contained, zero-dependency Angular learning platform that takes a developer from
            absolute beginner to senior certification level. Every feature in the app is itself a live
            demonstration of the Angular concept it teaches — signals drive the quiz engine, lazy-loaded
            routes power the lesson library, and a custom tokenizer highlights code blocks without any
            external library.
          </p>
          <ul class="about__feats">
            <li>95-lesson curriculum across 5 difficulty tracks, mapped to the <strong>certificates.dev</strong> Angular certification exam</li>
            <li>200+ randomised practice challenges (MCQ, spot-the-bug, predict-output) with Fisher-Yates shuffle and per-option wrong-answer explanations</li>
            <li>253 interview Q&amp;As with flashcard mode, self-rating (Easy / Review), and spaced-repetition session summaries</li>
            <li>Custom IDE-style syntax tokeniser (TypeScript, no external deps) applied globally via Router event subscription</li>
            <li>Signal-native state management throughout — <code>signal()</code>, <code>computed()</code>, <code>effect()</code>, <code>resource()</code> — zero NgRx or third-party state library</li>
            <li>Lazy-loaded standalone components on every route; responsive 4-column grid with mobile breakpoints</li>
          </ul>
        </div>

        <div class="about__sidebar">
          <div class="about__block">
            <h4>Stack</h4>
            <div class="chip-row">
              <span class="chip chip--blue"   appTooltip="Latest Angular release — standalone-first, signal-native">Angular 21</span>
              <span class="chip chip--blue"   appTooltip="Full strict mode enforced; satisfies & infer used throughout">TypeScript 5.9</span>
              <span class="chip chip--teal"   appTooltip="Reactive streams powering the quiz and interview engines">RxJS 7.8</span>
              <span class="chip chip--violet" appTooltip="Fine-grained reactivity: signal(), computed(), effect(), resource()">Signals API</span>
              <span class="chip chip--green"  appTooltip="Zero NgModules — every component, pipe, and directive is standalone">Standalone</span>
              <span class="chip chip--amber"  appTooltip="Sub-second HMR and optimised production bundles">esbuild / Vite</span>
            </div>
          </div>

          <div class="about__block">
            <h4>Key Numbers</h4>
            <div class="kpi-grid">
              <div class="kpi"><strong>95+</strong><span>Lessons</span></div>
              <div class="kpi"><strong>200+</strong><span>Challenges</span></div>
              <div class="kpi"><strong>253</strong><span>Interview Q&amp;As</span></div>
              <div class="kpi"><strong>5</strong><span>Difficulty tracks</span></div>
            </div>
          </div>

          <div class="about__block">
            <h4>Highlights for Resume</h4>
            <ul class="about__bullets">
              <li>Zero third-party UI or state libraries</li>
              <li>Custom syntax highlighter — pure TS tokeniser</li>
              <li>Full signal-based reactivity (no Zone.js required)</li>
              <li>Covers the full certificates.dev exam syllabus</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <div class="filters">
      <div class="search-wrap">
        <input
          #searchInput
          class="search-input"
          type="search"
          placeholder="Search lessons… (press /)"
          [value]="searchQuery()"
          (input)="searchQuery.set($any($event.target).value)"
          aria-label="Search lessons"
        />
      </div>
      <!--
        FilterTabsComponent uses model() two-way binding.
        [(value)] reads + writes the parent's writable signal automatically.
        No Output() boilerplate needed — model() replaces both Input + Output.
      -->
      <app-filter-tabs [(value)]="filter" [options]="filterOptions()" />
    </div>

    @let filtered = visibleLevels() | filterLessons: searchQuery();

    @if (filtered.length === 0) {
      <div class="empty-state">
        <p>No lessons match <strong>"{{ searchQuery() }}"</strong>. Try a different keyword.</p>
        <button class="ghost" (click)="searchQuery.set('')">Clear search</button>
      </div>
    }

    @for (lvl of filtered; track lvl.id) {
      <section class="level">
        <div class="level__head">
          <h2 [attr.data-level]="lvl.id">{{ lvl.label }}</h2>
          <span class="progress">{{ lvl.built }}/{{ lvl.total }} ready</span>
        </div>
        <p class="level__blurb">{{ lvl.blurb }}</p>

        @defer (on viewport; prefetch on idle) {
          <div class="grid">
            @for (cat of lvl.categories; track cat.name) {
              @for (lesson of cat.lessons; track lesson.id) {
                <a class="card"
                   [class.card--soon]="!lesson.loadComponent"
                   [class.card--visited]="progress.isVisited(lesson.id)"
                   [routerLink]="lesson.id">
                  <span class="card__cat">{{ cat.name }}</span>
                  <div class="card__top">
                    <span class="card__title">{{ lesson.title }}</span>
                    <div class="card__badges">
                      @if (progress.isVisited(lesson.id)) {
                        <span class="badge badge--visited" title="Visited">✓</span>
                      }
                      @if (lesson.loadComponent) {
                        <span class="badge badge--ready">Live</span>
                      } @else {
                        <span class="badge">Soon</span>
                      }
                    </div>
                  </div>
                  <p class="card__summary">{{ lesson.summary }}</p>
                </a>
              }
            }
          </div>
        } @placeholder {
          <div class="grid">
            @for (_ of placeholderArr(lvl.total); track $index) {
              <div class="skeleton-card"></div>
            }
          </div>
        }
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 1100px;
        margin: 0 auto;
      }
      .hero {
        position: relative;
        text-align: center;
        padding: 32px 0 16px;
      }
      /* Soft ambient glow behind the hero — the modern "aurora" backdrop */
      .hero::before {
        content: '';
        position: absolute;
        inset: -60px -120px auto;
        height: 360px;
        background:
          radial-gradient(520px 240px at 30% 10%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%),
          radial-gradient(520px 240px at 70% 0%, color-mix(in srgb, var(--violet) 12%, transparent), transparent 70%);
        pointer-events: none;
        z-index: -1;
      }
      .hero h1 {
        font-size: clamp(1.8rem, 4vw, 2.8rem);
        margin: 14px 0 8px;
        background: linear-gradient(135deg, var(--accent-2), var(--blue));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .hero .lead {
        max-width: 680px;
        margin: 0 auto;
      }
      .stats {
        display: flex;
        justify-content: center;
        gap: 32px;
        margin: 28px 0 8px;
        flex-wrap: wrap;
      }
      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .stat {
        padding: 10px 18px;
        border-radius: 16px;
        background: color-mix(in srgb, var(--bg-card) 65%, transparent);
        border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
        backdrop-filter: blur(6px);
      }
      .stat strong {
        font-size: 1.8rem;
        background: linear-gradient(135deg, var(--accent), var(--violet));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .stat span {
        font-size: 0.8rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      /* ---- Tools Section ---- */
      .tools-section {
        margin: 40px 0 8px;
      }
      .tools-heading {
        text-align: center;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: .06em;
        margin: 0 0 16px;
      }
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 14px;
        margin-bottom: 12px;
      }
      /* Per-card accent — one variable drives the top bar, icon tile,
         CTA color, hover border and tinted hover shadow. */
      .tool-card--practice  { --card-accent: #f59e0b; }
      .tool-card--interview { --card-accent: #6366f1; }
      .tool-card--projects  { --card-accent: #22c55e; }
      .tool-card--tasks     { --card-accent: #0ea5e9; }
      .tool-card--api       { --card-accent: #14b8a6; }
      .tool-card--examday   { --card-accent: #ef4444; }
      .tool-card--progress  { --card-accent: #a855f7; }
      .tool-card--cert      { --card-accent: #e74694; }

      .tool-card {
        position: relative;
        display: flex;
        gap: 14px;
        padding: 22px 20px 18px;
        border-radius: 20px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        text-decoration: none;
        color: var(--text);
        overflow: hidden;
        align-items: flex-start;
        transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
      }
      .tool-card::before {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 4px;
        background: linear-gradient(90deg,
          var(--card-accent),
          color-mix(in srgb, var(--card-accent) 40%, transparent));
      }
      .tool-card:hover {
        transform: translateY(-4px);
        text-decoration: none;
        border-color: color-mix(in srgb, var(--card-accent) 55%, var(--border));
        box-shadow: 0 14px 34px color-mix(in srgb, var(--card-accent) 22%, transparent);
      }
      .tool-card:active { transform: translateY(-1px); }
      .tool-card__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 14px;
        font-size: 1.45rem;
        line-height: 1;
        flex-shrink: 0;
        background: linear-gradient(135deg,
          color-mix(in srgb, var(--card-accent) 22%, var(--bg-card)),
          color-mix(in srgb, var(--card-accent) 8%, var(--bg-card)));
        border: 1px solid color-mix(in srgb, var(--card-accent) 30%, transparent);
        transition: transform .2s ease;
      }
      .tool-card:hover .tool-card__icon { transform: scale(1.08) rotate(-3deg); }
      .tool-card__body h3 {
        margin: 0 0 6px;
        font-size: 1rem;
        font-weight: 650;
        letter-spacing: -0.01em;
      }
      .tool-card__body p {
        margin: 0 0 10px;
        font-size: .83rem;
        color: var(--text-muted);
        line-height: 1.5;
      }
      .tool-card__cta {
        font-size: .8rem;
        font-weight: 650;
        color: var(--card-accent);
        transition: gap .15s ease;
      }
      .tool-card:hover .tool-card__cta { text-decoration: underline; text-underline-offset: 3px; }

      .filters {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: center;
        margin: 28px 0;
        position: sticky;
        top: 0;
        padding: 10px 0;
        background: var(--bg);
        z-index: 5;
      }
      .filters button {
        background: var(--bg-card);
        border: 1px solid var(--border);
        color: var(--text-muted);
      }
      .filters button.active {
        background: var(--accent);
        color: #fff;
        border-color: var(--accent);
      }
      .level {
        margin: 40px 0;
      }
      .level__head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }
      .level__head h2 {
        font-size: 1.5rem;
        margin: 0;
      }
      h2[data-level='foundations']  { color: #7c3aed; }
      h2[data-level='typescript']   { color: #0ea5e9; }
      h2[data-level='beginner']     { color: #059669; }
      h2[data-level='intermediate'] { color: #d97706; }
      h2[data-level='expert']       { color: #0284c7; }
      h2[data-level='projects']     { color: #14b8a6; }
      .progress {
        font-size: 0.8rem;
        color: var(--text-muted);
        white-space: nowrap;
      }
      .level__blurb {
        color: var(--text-muted);
        margin: 4px 0 8px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
      }
      @media (max-width: 900px) { .grid { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 540px) { .grid { grid-template-columns: 1fr; } }
      .card__cat {
        display: block;
        font-size: 0.67rem;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--accent);
        opacity: 0.75;
        margin-bottom: 5px;
      }
      .card {
        display: block;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 16px;
        text-decoration: none;
        color: var(--text);
        transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
      }
      .card:hover {
        transform: translateY(-3px);
        border-color: var(--accent);
        box-shadow: 0 10px 26px color-mix(in srgb, var(--accent) 15%, transparent);
        text-decoration: none;
      }
      .card--soon {
        opacity: 0.62;
      }
      .card__top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 8px;
      }
      .card__title {
        font-weight: 600;
      }
      .card__summary {
        margin: 8px 0 0;
        font-size: 0.85rem;
        color: var(--text-muted);
      }
      .badge {
        font-size: 0.62rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 2px 8px;
        border-radius: 999px;
        border: 1px solid var(--border);
        color: var(--text-muted);
        white-space: nowrap;
      }
      .badge--ready {
        background: rgba(46, 193, 107, 0.15);
        border-color: var(--green);
        color: var(--green);
      }
      .badge--visited {
        background: rgba(5, 150, 105, 0.12);
        border-color: var(--green);
        color: var(--green);
        font-weight: 700;
      }
      .card__badges { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
      .card--visited { border-left: 3px solid var(--green); }
      .badge--visited {
        background: rgba(2, 132, 199, 0.15);
        border-color: var(--accent);
        color: var(--accent);
        font-weight: 600;
      }

      /* ---- Visited stat ---- */
      .stat--progress strong { color: var(--green); }
      .stat__denom { font-size: 0.7em; opacity: 0.6; font-weight: 400; }

      /* ---- Search input ---- */
      .search-wrap { position: relative; flex: 1 1 180px; max-width: 280px; }
      .search-input {
        width: 100%;
        max-width: 280px;
        padding: 6px 12px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text);
        font-size: 0.88rem;
      }
      .search-input:focus {
        outline: 2px solid var(--accent);
        outline-offset: 1px;
      }

      /* ---- Skeleton cards (@defer placeholder) ---- */
      @keyframes shimmer {
        0%   { background-position: -400px 0; }
        100% { background-position: 400px 0; }
      }
      .skeleton-card {
        height: 100px;
        border-radius: var(--radius);
        background: linear-gradient(
          90deg,
          var(--bg-elevated) 25%,
          var(--border) 50%,
          var(--bg-elevated) 75%
        );
        background-size: 800px 100%;
        animation: shimmer 1.4s infinite linear;
      }

      /* ---- Empty search state ---- */
      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: var(--text-muted);
      }
      .empty-state p { margin: 0 0 16px; }

      /* ---- About / Project Overview ---- */
      .about {
        margin: 40px 0 8px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 32px;
        box-shadow: var(--shadow);
      }
      .about__header {
        margin-bottom: 24px;
      }
      .about__title {
        margin: 0 0 6px;
        font-size: 1.25rem;
        color: var(--text);
      }
      .about__sub {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-muted);
      }
      .about__body {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 32px;
        align-items: start;
      }
      @media (max-width: 820px) {
        .about__body { grid-template-columns: 1fr; }
      }
      .about__desc p {
        margin: 0 0 16px;
        font-size: 0.92rem;
        line-height: 1.7;
        color: var(--text);
      }
      .about__feats {
        margin: 0;
        padding-left: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .about__feats li {
        font-size: 0.88rem;
        color: var(--text);
        line-height: 1.55;
      }
      .about__feats code {
        font-size: 0.82rem;
        background: var(--bg-elevated);
        padding: 1px 5px;
        border-radius: 4px;
        color: var(--accent);
      }
      .about__sidebar {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .about__block {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 16px 18px;
      }
      .about__block h4 {
        margin: 0 0 10px;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--text-muted);
      }
      .chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .chip {
        font-size: 0.72rem;
        font-weight: 600;
        padding: 3px 10px;
        border-radius: 999px;
        border: 1px solid transparent;
      }
      .chip--blue   { background: rgba(2, 132, 199, 0.12);  border-color: rgba(2,132,199,.3);  color: #0284c7; }
      .chip--teal   { background: rgba(20, 184, 166, 0.12); border-color: rgba(20,184,166,.3); color: #0d9488; }
      .chip--violet { background: rgba(124, 58, 237, 0.12); border-color: rgba(124,58,237,.3); color: #7c3aed; }
      .chip--green  { background: rgba(5, 150, 105, 0.12);  border-color: rgba(5,150,105,.3);  color: #059669; }
      .chip--amber  { background: rgba(217,119,6,0.12);     border-color: rgba(217,119,6,.3);  color: #d97706; }
      .kpi-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .kpi {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 10px 8px;
        text-align: center;
      }
      .kpi strong {
        font-size: 1.4rem;
        color: var(--accent);
        line-height: 1.1;
      }
      .kpi span {
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-muted);
        margin-top: 2px;
      }
      .about__bullets {
        margin: 0;
        padding-left: 18px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .about__bullets li {
        font-size: 0.83rem;
        color: var(--text);
        line-height: 1.45;
      }
    `,
  ],
})
export class Home {
  protected readonly progress = inject(ProgressService);
  protected readonly filter = signal<string>('all');

  // linkedSignal: searchQuery is writable, but resets to '' whenever the filter changes.
  protected readonly searchQuery = linkedSignal(() => {
    this.filter(); // establish reactive dependency
    return '';
  });

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

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

  protected readonly visibleLevels = computed(() => {
    const f = this.filter();
    return f === 'all' ? this.levels() : this.levels().filter((l) => l.id === f);
  });

  protected readonly filterOptions = computed<TabOption[]>(() => [
    { id: 'all', label: 'All' },
    ...this.levels().map((l) => ({ id: l.id, label: l.label })),
  ]);

  protected readonly total = computed(() => CURRICULUM.length);
  protected readonly built = computed(() => CURRICULUM.filter((l) => l.loadComponent).length);

  // afterNextRender: animated hero counters tick up after first render.
  protected readonly animTotal = signal(0);
  protected readonly animBuilt = signal(0);
  protected readonly animExercises = signal(0);
  protected readonly animInterviews = signal(0);

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

  // @HostListener('document:keydown') — press '/' to focus search, Escape to clear+blur.
  // Demonstrates document-level event handling from a component.
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

  protected placeholderArr(count: number): unknown[] {
    return Array.from({ length: Math.min(count, 8) });
  }
}
