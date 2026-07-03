import { Routes } from '@angular/router';
import { CURRICULUM } from './core/curriculum';

/**
 * Routes are generated from the master curriculum so there is exactly one
 * source of truth. A lesson that has a `loadComponent` is lazy-loaded; every
 * other (not-yet-written) concept routes to the shared "coming soon" page,
 * carrying its id in route data so that page can show the right title.
 */
export const routes: Routes = [
  {
    path: '',
    title: 'Angular Concepts — Home',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'certification',
    title: 'Certification Prep · Angular Concepts',
    loadComponent: () => import('./pages/certification/certification').then((m) => m.Certification),
  },
  {
    path: 'practice',
    title: 'Practice Challenges · Angular Concepts',
    loadComponent: () => import('./pages/practice/practice').then((m) => m.Practice),
  },
  {
    path: 'mock-exam',
    title: 'Mock Exam · Angular Concepts',
    loadComponent: () => import('./pages/mock-exam/mock-exam').then((m) => m.MockExam),
  },
  {
    path: 'review',
    title: 'Review Queue · Angular Concepts',
    loadComponent: () => import('./pages/review/review').then((m) => m.Review),
  },
  {
    path: 'interview',
    title: 'Interview Prep · Angular Concepts',
    loadComponent: () => import('./pages/interview/interview').then((m) => m.Interview),
  },
  ...CURRICULUM.map((lesson) => ({
    path: lesson.id,
    title: `${lesson.title} · Angular Concepts`,
    ...(lesson.loadComponent
      ? { loadComponent: lesson.loadComponent }
      : {
          loadComponent: () =>
            import('./shared/coming-soon/coming-soon').then((m) => m.ComingSoon),
          data: { lessonId: lesson.id },
        }),
  })),
  {
    path: '**',
    title: 'Page Not Found · Angular Concepts',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
