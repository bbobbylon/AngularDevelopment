import { InjectionToken } from '@angular/core';

/** Static facts about the app, shown in the footer and the home-page hero. */
export interface AppConfig {
  /** Display name of the app. */
  name: string;
  /** Major Angular version the curriculum targets, e.g. `21`. */
  angularVersion: string;
  /** Technology chips listed in the footer. */
  builtWith: string[];
}

/**
 * App-level configuration token with a tree-shakable factory default.
 * Inject anywhere with: inject(APP_CONFIG)
 */
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  factory: () => ({
    name: 'Angular Concepts',
    angularVersion: '21',
    builtWith: ['Angular', 'TypeScript', 'RxJS', 'Signals'],
  }),
});
