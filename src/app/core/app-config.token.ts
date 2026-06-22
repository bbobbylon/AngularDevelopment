import { InjectionToken } from '@angular/core';

export interface AppConfig {
  name: string;
  angularVersion: string;
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
