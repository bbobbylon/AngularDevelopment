/**
 * Achievement definitions — pure data, no Angular DI. Every achievement is
 * evaluated from a snapshot of stats already computed elsewhere (Progress
 * dashboard, mainly) so this file owns no storage of its own; "unlocked" is
 * always derived, never persisted, which means it can never drift out of
 * sync with the underlying stores.
 */
export interface AchievementStats {
  lessonsVisited: number;
  lessonsBuilt: number;
  practiceAnswered: number;
  practiceCorrect: number;
  examsPassed: number;
  bestExam: number;
  streakLongest: number;
  bookmarksCount: number;
  tasksDone: number;
  reviewMastered: number;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: (s: AchievementStats) => boolean;
  /** 0-100 progress toward unlocking — drives a progress bar while locked. */
  progress: (s: AchievementStats) => number;
}

function pct(value: number, target: number): number {
  return target <= 0 ? 0 : Math.min(100, Math.round((value / target) * 100));
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-lesson',
    icon: '🌱',
    title: 'First Steps',
    description: 'Visit your first lesson.',
    unlocked: (s) => s.lessonsVisited >= 1,
    progress: (s) => pct(s.lessonsVisited, 1),
  },
  {
    id: 'all-lessons',
    icon: '🎓',
    title: 'Curriculum Complete',
    description: 'Visit every lesson in the curriculum.',
    unlocked: (s) => s.lessonsBuilt > 0 && s.lessonsVisited >= s.lessonsBuilt,
    progress: (s) => pct(s.lessonsVisited, s.lessonsBuilt),
  },
  {
    id: 'practice-50',
    icon: '⚡',
    title: 'Half Century',
    description: 'Answer 50 practice challenges.',
    unlocked: (s) => s.practiceAnswered >= 50,
    progress: (s) => pct(s.practiceAnswered, 50),
  },
  {
    id: 'practice-100',
    icon: '💯',
    title: 'Century Club',
    description: 'Answer 100 practice challenges.',
    unlocked: (s) => s.practiceAnswered >= 100,
    progress: (s) => pct(s.practiceAnswered, 100),
  },
  {
    id: 'sharp-shooter',
    icon: '🎯',
    title: 'Sharpshooter',
    description: 'Get 25 practice answers correct.',
    unlocked: (s) => s.practiceCorrect >= 25,
    progress: (s) => pct(s.practiceCorrect, 25),
  },
  {
    id: 'exam-pass',
    icon: '📝',
    title: 'Exam Ready',
    description: 'Pass a mock exam.',
    unlocked: (s) => s.examsPassed >= 1,
    progress: (s) => pct(s.examsPassed, 1),
  },
  {
    id: 'exam-90',
    icon: '🏆',
    title: 'Top of the Class',
    description: 'Score 90% or higher on a mock exam.',
    unlocked: (s) => s.bestExam >= 90,
    progress: (s) => pct(s.bestExam, 90),
  },
  {
    id: 'streak-3',
    icon: '🔥',
    title: 'Warming Up',
    description: 'Study 3 days in a row.',
    unlocked: (s) => s.streakLongest >= 3,
    progress: (s) => pct(s.streakLongest, 3),
  },
  {
    id: 'streak-7',
    icon: '🔥',
    title: 'Week-Long Streak',
    description: 'Study 7 days in a row.',
    unlocked: (s) => s.streakLongest >= 7,
    progress: (s) => pct(s.streakLongest, 7),
  },
  {
    id: 'collector',
    icon: '⭐',
    title: 'Collector',
    description: 'Bookmark 5 lessons or questions.',
    unlocked: (s) => s.bookmarksCount >= 5,
    progress: (s) => pct(s.bookmarksCount, 5),
  },
  {
    id: 'builder',
    icon: '🛠️',
    title: 'Builder',
    description: 'Complete 5 coding tasks.',
    unlocked: (s) => s.tasksDone >= 5,
    progress: (s) => pct(s.tasksDone, 5),
  },
  {
    id: 'reviewer',
    icon: '🔁',
    title: 'Spaced Out',
    description: 'Master 10 questions via the review queue.',
    unlocked: (s) => s.reviewMastered >= 10,
    progress: (s) => pct(s.reviewMastered, 10),
  },
];
