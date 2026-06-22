import { Type } from '@angular/core';

/** Difficulty / exam track a concept belongs to. */
export type Level = 'foundations' | 'typescript' | 'beginner' | 'intermediate' | 'expert' | 'projects';

/**
 * A single tutorial concept.
 *
 * The whole app (routes + navigation + the home dashboard) is generated from
 * an array of these objects, so this is the single source of truth for the
 * curriculum. A lesson whose `loadComponent` is omitted is enumerated and
 * navigable but routes to the shared "coming soon" page until its dedicated
 * component is written.
 */
export interface Lesson {
  /** kebab-case route segment, e.g. `property-binding`. Unique. */
  id: string;
  /** Human readable lesson title. */
  title: string;
  /** One-line description shown on cards and the lesson header. */
  summary: string;
  /** Which exam track this belongs to. */
  level: Level;
  /** Grouping bucket within a level, e.g. "Templates", "Forms", "RxJS". */
  category: string;
  /** Lazy loader for the lesson component. Omit while unwritten. */
  loadComponent?: () => Promise<Type<unknown>>;
}

/** A group of lessons within one level, sharing the same category label. */
export interface CategoryGroup {
  name: string;
  lessons: Lesson[];
}

/** All lessons for one difficulty level, organized into categories. */
export interface LevelGroup {
  id: Level;
  label: string;
  blurb: string;
  total: number;
  built: number;
  categories: CategoryGroup[];
}

export const LEVELS: { id: Level; label: string; blurb: string }[] = [
  {
    id: 'foundations',
    label: 'Foundations',
    blurb:
      'Never coded before? Start right here. How the web works and programming from absolute zero — no prior experience assumed.',
  },
  {
    id: 'typescript',
    label: 'TypeScript Essentials',
    blurb: 'The language foundations every Angular developer is expected to know.',
  },
  {
    id: 'beginner',
    label: 'Beginner',
    blurb: 'Core Angular: components, templates, binding, DI and signals.',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    blurb: 'Forms, routing, HTTP, RxJS, directives, pipes and testing.',
  },
  {
    id: 'expert',
    label: 'Expert',
    blurb: 'Change detection, performance, SSR, state, security and architecture.',
  },
  {
    id: 'projects',
    label: 'Project Walkthroughs',
    blurb: 'Build real features end-to-end. Each walkthrough connects multiple concepts into a working project you can reference in interviews.',
  },
];
