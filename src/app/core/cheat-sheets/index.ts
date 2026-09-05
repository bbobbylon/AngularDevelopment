import { ANGULAR_CLI_SHEET } from './angular-cli';
import { AWS_CLI_SHEET } from './aws-cli';
import type { CheatSheet } from './cheat-sheet.model';
import { DOCKER_SHEET } from './docker';
import { MYSQL_SHEET } from './mysql';
import { TYPESCRIPT_SHEET } from './typescript';

export type {
  CheatSheet,
  CheatBlock,
  CheatCategory,
  CheatLang,
  CheatSection,
} from './cheat-sheet.model';

/**
 * Every cheat sheet, one entry per file in this directory. Both
 * `pages/cheat-sheets/*` and `app.routes.ts` read from this single array —
 * adding a sheet here is the only step needed to route, smoke-test and
 * a11y-scan it (see `pages.smoke.spec.ts` / `a11y.spec.ts`, which walk the
 * route table generically).
 */
export const CHEAT_SHEETS: CheatSheet[] = [
  ANGULAR_CLI_SHEET,
  TYPESCRIPT_SHEET,
  MYSQL_SHEET,
  AWS_CLI_SHEET,
  DOCKER_SHEET,
];
