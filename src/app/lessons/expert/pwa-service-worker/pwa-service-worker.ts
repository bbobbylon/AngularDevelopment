import { Component, afterNextRender, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * One cached resource: which `ngsw-config.json` group it belongs in, and why.
 */
interface Resource {
  label: string;
  group: 'assetGroup' | 'dataGroup';
  strategy: string;
  why: string;
  snippet: string;
}

const RESOURCES: Resource[] = [
  {
    label: 'App shell (JS/CSS/index.html)',
    group: 'assetGroup',
    strategy: 'installMode: prefetch',
    why: 'The shell IS the app — cache every file eagerly at install so the next visit (or offline visit) boots instantly. Files are content-hashed, so updates are exact.',
    snippet: `"assetGroups": [{
  "name": "app",
  "installMode": "prefetch",
  "resources": { "files": ["/index.html", "/*.css", "/*.js"] }
}]`,
  },
  {
    label: 'Fonts & hero images',
    group: 'assetGroup',
    strategy: 'installMode: lazy, updateMode: prefetch',
    why: 'Big and not needed on first paint everywhere — cache each one the first time it is requested (lazy), but refresh already-cached ones eagerly when a new version ships.',
    snippet: `"assetGroups": [{
  "name": "media",
  "installMode": "lazy",
  "updateMode": "prefetch",
  "resources": { "files": ["/assets/**/*.(png|webp|woff2)"] }
}]`,
  },
  {
    label: 'Live API data (prices, feed)',
    group: 'dataGroup',
    strategy: 'strategy: freshness',
    why: 'Network-first: always try the real API (with a timeout), fall back to cache only when offline or too slow. Stale prices are worse than a spinner.',
    snippet: `"dataGroups": [{
  "name": "api-live",
  "urls": ["/api/prices/**"],
  "cacheConfig": {
    "strategy": "freshness",
    "timeout": "3s",
    "maxAge": "1h", "maxSize": 100
  }
}]`,
  },
  {
    label: 'Rarely-changing lookups (countries, config)',
    group: 'dataGroup',
    strategy: 'strategy: performance',
    why: 'Cache-first: serve instantly from cache until maxAge expires, then refetch. The user never waits for data that changes twice a year.',
    snippet: `"dataGroups": [{
  "name": "api-static",
  "urls": ["/api/lookups/**"],
  "cacheConfig": {
    "strategy": "performance",
    "maxAge": "7d", "maxSize": 50
  }
}]`,
  },
  {
    label: 'Paginated search results (?page=N)',
    group: 'dataGroup',
    strategy: 'strategy: performance, cacheQueryOptions',
    why: 'The query string is part of the cache key by default — /api/items?page=1 through ?page=50 alone would fill a 100-entry cache, one page at a time, evicting the oldest as it goes. ignoreSearch would collapse every page into ONE shared entry, which is wrong here (page 2 is not page 40) — the real fix is sizing maxSize to how many pages actually matter.',
    snippet: `"dataGroups": [{
  "name": "api-search",
  "urls": ["/api/items/**"],
  "cacheConfig": {
    "strategy": "performance",
    "maxAge": "10m", "maxSize": 100
  },
  "cacheQueryOptions": { "ignoreSearch": false }
}]`,
  },
];

/** One step in the simulated update lifecycle. */
interface SimState {
  id: 'v1' | 'deployed' | 'detected' | 'ready' | 'activated';
  log: string[];
}

/** One step in the simulated install-prompt flow. Branches at `deferred`. */
interface InstallState {
  id: 'idle' | 'deferred' | 'accepted' | 'dismissed';
  log: string[];
}

const INSTALL_IDLE_LOG = [
  '[browser] evaluating install criteria — manifest, service worker, HTTPS…',
];

/**
 * Lesson: Angular's generated service worker and what it takes to ship a real
 * PWA — the manifest-driven engine, the navigation-request fallback rule that
 * makes deep links (and breaks OAuth callbacks) work, the assetGroup/dataGroup
 * caching split with its unstated limits, the SwUpdate lifecycle (with the
 * `isEnabled` guard the docs bury), getting installed via
 * `beforeinstallprompt`, running a service worker alongside SSR, and SwPush.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The page still asks three questions, the
 * way the reference does, but they are this lesson's three questions rather
 * than a copy of the reference's:
 *
 * 1. **What answers a request nobody wrote a route for?** — the `index` /
 *    `navigationUrls` fallback rule, and the OAuth-callback trap it causes.
 * 2. **What actually gets cached, and what doesn't?** — assetGroups vs
 *    dataGroups, and the GET-only / opaque-response / query-string limits the
 *    original lesson never stated.
 * 3. **How does a running tab find out any of this changed?** — the
 *    `SwUpdate` lifecycle, staged as a dialogue between a tab and the worker
 *    before it is staged as a live simulator.
 *
 * Installability, the SSR overlap and push are treated as material beyond
 * that frame, the way the reference treats `detach()` as an escape hatch
 * beyond its own three questions.
 */
@Component({
  selector: 'app-lesson-pwa-service-worker',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './pwa-service-worker.css',
  templateUrl: './pwa-service-worker.html',
})
export class PwaServiceWorker {
  // ── Presentation scaffolding ────────────────────────────────────────────

  /** The Rendering & Delivery track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Server-Side Rendering', id: 'ssr' },
    { label: 'Hydration', id: 'hydration' },
    { label: 'PWA & Service Worker' },
  ];

  /**
   * The negotiation between a running tab and the worker over an update —
   * every step is something one side has to explicitly ask for, which is the
   * whole point: nothing here happens on its own.
   */
  protected readonly updateTalk: BubbleTurn[] = [
    { who: 'Your tab', says: "I'm running v1. Anything new on the server?" },
    {
      who: 'The worker',
      says: 'Not unless you ask — I only check automatically when you navigate.',
    },
    {
      who: 'Your tab',
      says: "(later) Check now. And if there's a v2, get it — but don't switch me over, I'm mid-form.",
    },
    {
      who: 'The worker',
      says: "Downloading… done, and every file's hash matches the manifest. Sitting on VERSION_READY until you say go.",
    },
    { who: 'Your tab', says: 'Go. Swap me over and reload.' },
    {
      who: 'The worker',
      says: "Done — v1's caches are gone. You're running v2, and so is every other tab that reloads from here on.",
    },
  ];

  /** The navigation-fallback decision every navigation request runs through. */
  protected readonly navFallbackSteps: FlowStep[] = [
    { label: 'Browser navigates', detail: 'e.g. a deep link straight to /profile' },
    { label: 'Not a known file', detail: 'Routes aren’t in the hashed asset list' },
    {
      label: 'Checked against navigationUrls',
      detail: 'The include/exclude glob list',
      tone: 'accent',
    },
    {
      label: 'index.html served',
      detail: 'From cache — the router takes it from here',
      tone: 'good',
    },
  ];

  // ── Caching decision lab (existing demo, kept) ──────────────────────────

  /** The cacheable resources. */
  protected readonly resources = RESOURCES;
  /** The resource being examined, or `null` for none. */
  protected readonly activeResource = signal<Resource | null>(null);

  // ── Update lifecycle simulator (existing demo, kept) ────────────────────

  /** The stages of the update lifecycle, in order. */
  protected readonly stages = [
    { id: 'v1' as const, label: 'running v1' },
    { id: 'deployed' as const, label: 'v2 deployed' },
    { id: 'detected' as const, label: 'VERSION_DETECTED' },
    { id: 'ready' as const, label: 'VERSION_READY' },
    { id: 'activated' as const, label: 'activated + reloaded' },
  ];
  /** The stage ids, for comparing progress by position. */
  private readonly order = this.stages.map((s) => s.id);

  /** Where the simulator has got to, plus its log. */
  protected readonly state = signal<SimState>({
    id: 'v1',
    log: ['[app] running version v1 — service worker serving from cache'],
  });

  /**
   * What the next click will do — a label rather than just "Next", so the
   * simulator reads as a sequence of real events.
   */
  protected readonly nextAction = computed(() => {
    switch (this.state().id) {
      case 'v1':
        return 'Deploy v2 to the server';
      case 'deployed':
        return 'Worker checks for update (navigation / poll)';
      case 'detected':
        return 'Finish downloading v2 in the background';
      case 'ready':
        return 'User accepts → activateUpdate() + reload';
      default:
        return 'Done';
    }
  });

  /**
   * Whether a stage has been reached yet, for the progress display.
   *
   * @param id The stage to test.
   */
  protected reached(id: SimState['id']): boolean {
    return this.order.indexOf(id) <= this.order.indexOf(this.state().id);
  }

  /**
   * Advances one stage, appending the events a real service worker would emit.
   *
   * The stage worth reading closely is `VERSION_READY`: the new version is
   * fully downloaded and verified but **not** running, and it will not run
   * until `activateUpdate()` plus a reload. That gap is why a deployed fix
   * does not reach a long-lived tab on its own, and why the prompt-to-reload
   * pattern exists.
   */
  protected advance(): void {
    const s = this.state();
    switch (s.id) {
      case 'v1':
        this.state.set({
          id: 'deployed',
          log: [
            ...s.log,
            '[server] v2 deployed — new ngsw.json manifest with fresh hashes',
            '[app] tab unaffected: still serving v1 atomically',
          ],
        });
        break;
      case 'deployed':
        this.state.set({
          id: 'detected',
          log: [
            ...s.log,
            '[sw] update check → manifest hash differs',
            '[SwUpdate] versionUpdates emits: VERSION_DETECTED',
            '[sw] downloading v2 files in the background…',
          ],
        });
        break;
      case 'detected':
        this.state.set({
          id: 'ready',
          log: [
            ...s.log,
            '[sw] all v2 files cached & hash-verified',
            '[SwUpdate] versionUpdates emits: VERSION_READY',
            '[app] good moment to prompt: "A new version is available — reload?"',
          ],
        });
        break;
      case 'ready':
        this.state.set({
          id: 'activated',
          log: [
            ...s.log,
            '[app] swUpdate.activateUpdate() → worker switches to v2',
            '[app] document.location.reload()',
            '[app] running version v2 — v1 caches cleaned up',
          ],
        });
        break;
    }
  }

  /** Resets the update simulator. */
  protected resetSim(): void {
    this.state.set({
      id: 'v1',
      log: ['[app] running version v1 — service worker serving from cache'],
    });
  }

  // ── Install-prompt simulator (new demo) ─────────────────────────────────

  /**
   * How this lesson is currently being viewed. Starts as the safe default and
   * is corrected once from the real `matchMedia` API in `afterNextRender` —
   * display mode does not change mid-view without an actual install/
   * uninstall, so there is nothing to subscribe to after that one read.
   *
   * The read is deferred rather than a synchronous field initializer because
   * `matchMedia` does not exist during server rendering, and — the case that
   * actually bit this lesson — jsdom (this app's test environment) does not
   * implement it either. `afterNextRender` is skipped on the server and,
   * like `reveal-on-scroll.directive.ts`'s identical guard, simply never
   * fires within a plain `TestBed`/`fixture.detectChanges()` unit test, so
   * both environments read the safe default instead of throwing.
   */
  protected readonly displayMode = signal<'standalone' | 'browser tab'>('browser tab');

  constructor() {
    afterNextRender(() => {
      if (matchMedia('(display-mode: standalone)').matches) {
        this.displayMode.set('standalone');
      }
    });
  }

  /** Where the install-flow simulator has got to, plus its log. */
  protected readonly installState = signal<InstallState>({
    id: 'idle',
    log: [...INSTALL_IDLE_LOG],
  });

  /** Simulates the browser deciding the install criteria are met. */
  protected fireInstallPrompt(): void {
    if (this.installState().id !== 'idle') return;
    this.installState.set({
      id: 'deferred',
      log: [
        ...this.installState().log,
        '[browser] criteria met → beforeinstallprompt fires',
        '[app] event.preventDefault() — holding the prompt back',
        '[app] showing our own "Install app" button instead',
      ],
    });
  }

  /**
   * Simulates the user resolving the (now-shown) native install dialog.
   *
   * @param outcome Which button the simulated user pressed.
   */
  protected resolveInstall(outcome: 'accepted' | 'dismissed'): void {
    if (this.installState().id !== 'deferred') return;
    const log = [...this.installState().log, '[app] event.prompt() — native install dialog shown'];
    if (outcome === 'accepted') {
      log.push(
        '[user] taps "Install"',
        '[browser] userChoice resolves: { outcome: "accepted" }',
        '[browser] appinstalled fires — icon added to the home screen',
      );
    } else {
      log.push(
        '[user] dismisses the dialog',
        '[browser] userChoice resolves: { outcome: "dismissed" }',
        '[app] deferredPrompt is spent — nothing to show until another beforeinstallprompt',
      );
    }
    this.installState.set({ id: outcome, log });
  }

  /** Resets the install-flow simulator. */
  protected resetInstall(): void {
    this.installState.set({ id: 'idle', log: [...INSTALL_IDLE_LOG] });
  }

  // ── Code samples ─────────────────────────────────────────────────────────

  /** Sample: `ng add @angular/pwa` and the provider it registers. */
  protected readonly setupSample = `ng add @angular/pwa
// scaffolds: manifest.webmanifest, icons, ngsw-config.json, and this provider

// app.config.ts
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};`;

  /** Line-by-line walkthrough of {@link setupSample}. */
  protected readonly setupNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A CLI schematic, not a package install by itself. It adds the `@angular/service-worker` dependency AND writes the four files/edits the comment on the next line lists.',
    },
    {
      line: 10,
      text: '`provideServiceWorker` is the function that actually registers `ngsw-worker.js` — the one generic engine every Angular PWA ships, regardless of what your `ngsw-config.json` says.',
    },
    {
      line: 11,
      text: '`isDevMode()` is true under `ng serve`. Flipping it means the worker only ever runs against a production build — `ng serve` never registers one, whatever this line says.',
    },
    {
      line: 12,
      text: '`registerWhenStable:30000` — register once the app has finished its initial work, or after 30 seconds, whichever comes first. Registering immediately would compete with your app for the same network and CPU on first load.',
    },
  ];

  /**
   * Sample: the top-level `ngsw-config.json` fields that decide which
   * navigation requests get the `index` fallback — the field set the
   * original lesson never showed.
   */
  protected readonly ngswConfigSample = `{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": { "files": ["/index.html", "/*.css", "/*.js"] }
    }
  ],
  "dataGroups": [
    {
      "name": "api-live",
      "urls": ["/api/prices/**"],
      "cacheConfig": { "strategy": "freshness", "timeout": "3s", "maxAge": "1h" }
    }
  ],
  "navigationUrls": [
    "/**",
    "!/**/*.*",
    "!/**/*__*",
    "!/api/**",
    "!/auth/callback"
  ],
  "navigationRequestStrategy": "performance"
}`;

  /** Line-by-line walkthrough of {@link ngswConfigSample}. */
  protected readonly ngswConfigNotes: CodeNote[] = [
    {
      line: 2,
      text: '`$schema` is editor-only — it buys autocomplete and red squiggles on a typo. Nothing at runtime reads it.',
    },
    {
      line: 3,
      text: '`index` — the one file the worker is allowed to hand back for a navigation request **it decides to answer itself**. Almost always your SPA shell.',
    },
    {
      line: 4,
      text: '`assetGroups` — the versioned files that ship **with this build**. `installMode: "prefetch"` caches every listed file the moment the worker installs, not on first request.',
    },
    {
      line: 11,
      text: '`dataGroups` — runtime API responses, cached by their own policy (`strategy`, `timeout`, `maxAge`) with a lifetime **independent of the app version**. The decision lab below goes deep on this half.',
    },
    {
      line: 18,
      text: '`navigationUrls` — an ordered glob list. This is the field that decides which navigations even reach the `index` fallback on line 3; everything else on this page assumes it, and almost nothing explains it.',
    },
    {
      line: 19,
      text: '`"/**"` — include everything, as the starting point. Every entry after this one narrows that.',
    },
    {
      line: 20,
      text: "The CLI's own default excludes: any URL that looks like a **file** (has a `.` in its last segment) is not a navigation — it is an asset request, handled by `assetGroups` instead.",
    },
    {
      line: 22,
      text: '`!/api/**` — **the fix.** Without this line, a client-side navigation to `/api/anything` (rare, but routers do sometimes point at API paths) would get `index.html` back instead of ever reaching the network.',
    },
    {
      line: 23,
      text: '`!/auth/callback` — the same rule, aimed at the request that actually bites people: an OAuth provider redirecting the browser back to your own origin. That redirect **is** a navigation request, and without this exclude it gets swallowed exactly like line 22 describes.',
    },
    {
      line: 25,
      text: '`navigationRequestStrategy` — `"performance"` (the default) serves the cached `index` instantly for any matched navigation. `"freshness"` asks the network first instead, falling back to cache only when that fails — the setting an SSR app needs, further down this page.',
    },
  ];

  /**
   * Sample: driving updates from `SwUpdate.versionUpdates`, guarded by
   * `isEnabled` — the guard the original showcase snippet was missing, which
   * meant copying it produced unhandled rejections in `ng serve`.
   */
  protected readonly updateSample = `export class UpdateService {
  private readonly updates = inject(SwUpdate);

  constructor() {
    // isEnabled is false in ng serve, on non-HTTPS origins, and in any
    // browser that blocks/lacks service workers — skip wiring up dead APIs.
    if (!this.updates.isEnabled) {
      return;
    }

    // 1. react to the lifecycle — versionUpdates emits several event types;
    // VERSION_READY is the one that matters: fully downloaded, waiting to activate.
    this.updates.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.promptUser());

    // 2. long-lived tabs: the worker only auto-checks on navigation, so a
    // dashboard left open for a week never notices a deploy without this.
    setInterval(() => this.updates.checkForUpdate(), 6 * 60 * 60 * 1000);

    // 3. a broken cache can only be escaped with a reload.
    this.updates.unrecoverable.subscribe(() => document.location.reload());
  }

  private async promptUser(): Promise<void> {
    if (confirm('A new version is available. Reload?')) {
      await this.updates.activateUpdate();
      document.location.reload();
    }
  }
}`;

  /** Line-by-line walkthrough of {@link updateSample}. */
  protected readonly updateNotes: CodeNote[] = [
    {
      line: 2,
      text: '`inject(SwUpdate)` — the service every update API on this page hangs off. `readonly` because nothing here ever reassigns it.',
    },
    {
      line: 7,
      text: '`isEnabled` reads false for exactly the three reasons the comment above names. Skip this check and `checkForUpdate()` on line 19 returns a **rejected promise** — silent in `versionUpdates` (it simply never emits), loud in a raw `await`.',
    },
    {
      line: 14,
      text: 'A **type predicate** (`e is VersionReadyEvent`), not a plain boolean. This is what narrows the stream from `VersionEvent` down to specifically `VersionReadyEvent` for everything downstream — without it, `.subscribe()` still only sees the union type.',
    },
    {
      line: 19,
      text: '`setInterval` polling, because the worker itself only checks for updates on registration and on navigation. `6 * 60 * 60 * 1000` is 6 hours in milliseconds — poll much more often than that and you are mostly just burning requests.',
    },
    {
      line: 22,
      text: "`unrecoverable` fires when the worker's cached files no longer match what the server has — usually a deploy that deleted a hashed file this client still needs. Nothing can be fetched to fix it; a hard reload is the only exit, which is why this is the one place reloading without asking is the right call.",
    },
    {
      line: 26,
      text: "**Ask, don't force.** Reloading under someone mid-form loses their work.",
    },
    {
      line: 27,
      text: '`activateUpdate()` swaps the worker over to the new version; the reload on the next line is what makes the **running page** pick it up. Skip either half and the tab is stuck between versions.',
    },
  ];

  /** Sample: capturing `beforeinstallprompt` and driving your own install UI. */
  protected readonly installSample = `protected readonly deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);
protected readonly outcome = signal<'accepted' | 'dismissed' | null>(null);

constructor() {
  // Chrome/Edge fire this instead of showing their own mini-infobar, but
  // only once the install criteria are already met (manifest + SW + HTTPS).
  window.addEventListener('beforeinstallprompt', (event: Event) => {
    event.preventDefault(); // stop the browser's own prompt
    this.deferredPrompt.set(event as BeforeInstallPromptEvent);
  });
}

async install(): Promise<void> {
  const event = this.deferredPrompt();
  if (!event) return;

  await event.prompt(); // NOW show the native install dialog
  const choice = await event.userChoice;
  this.outcome.set(choice.outcome);
  this.deferredPrompt.set(null); // a captured event can only be used once
}`;

  /** Line-by-line walkthrough of {@link installSample}. */
  protected readonly installNotes: CodeNote[] = [
    {
      line: 1,
      text: "`BeforeInstallPromptEvent` is not in TypeScript's DOM lib — it is a real but non-standard Chrome/Edge type, so apps declare the two members they use (`prompt()`, `userChoice`) themselves.",
    },
    {
      line: 7,
      text: 'The event fires **only after** the browser has already decided the install criteria are met — this listener does not check anything itself.',
    },
    {
      line: 8,
      text: "`preventDefault()` stops the browser's own install UI (a mini-infobar in Chrome) so you can show your own button at a moment you choose instead.",
    },
    {
      line: 9,
      text: 'The event object is stashed in a signal because it can only be used **once** — `prompt()` below is only callable while this is the same event the browser handed you.',
    },
    {
      line: 14,
      text: 'May be `null`: criteria not met, the app is already installed, the browser does not support the event at all (Firefox, every version of Safari), or the event simply has not fired yet.',
    },
    {
      line: 17,
      text: '`event.prompt()` — the actual native install dialog. Must be called from within a real user gesture (this method being called from a button click), or the browser silently refuses it.',
    },
    {
      line: 18,
      text: '`userChoice` — a promise that resolves once the person answers, to `{ outcome: "accepted" | "dismissed", platform: string }`.',
    },
    {
      line: 20,
      text: 'Set back to `null` — a used `BeforeInstallPromptEvent` cannot be replayed. The button has nothing left to do until another `beforeinstallprompt` arrives.',
    },
  ];

  /** Sample: `SwPush` — subscribing, and handling a push message. */
  protected readonly pushSample = `private swPush = inject(SwPush);

async subscribe() {
  // This triggers the browser's permission prompt. Call it from a real user
  // gesture — a button click — not on page load. Browsers penalise
  // unprompted requests, and a denied permission is hard to undo.
  const sub = await this.swPush.requestSubscription({
    // The PUBLIC half of a VAPID key pair. The private half stays on your
    // server and signs the pushes; this one is safe to ship in the bundle.
    serverPublicKey: VAPID_PUBLIC_KEY,
  });
  // The subscription object contains the endpoint URL and the encryption
  // keys for THIS browser. Your server must store it — without it there is
  // no address to push to. Skip this line and the whole flow silently no-ops.
  await firstValueFrom(this.http.post('/api/push/subscribe', sub));
}

// receive while the app is open; clicks route the user somewhere useful
// messages fires only when the tab is FOCUSED. When it isn't, the service
// worker shows a system notification instead — a different code path.
this.swPush.messages.subscribe(msg => this.toast.show(msg));
// The payoff line. A notification that just opens the home page wastes the
// interruption; routing to the thing it was about is the point.
this.swPush.notificationClicks.subscribe(({ notification }) =>
  // data is whatever your server put in the push payload, so you control it.
  this.router.navigateByUrl(notification.data.url));`;

  /** Line-by-line walkthrough of {@link pushSample}. */
  protected readonly pushNotes: CodeNote[] = [
    {
      line: 1,
      text: '`inject(SwPush)` — the service every push API on this page hangs off, the same pattern as `SwUpdate` above.',
    },
    {
      line: 7,
      text: "`requestSubscription()` wraps the browser's native push-subscribe call as a promise. This is also what triggers the permission prompt the comment above warns about.",
    },
    {
      line: 10,
      text: '`serverPublicKey` — the **public** half of a VAPID key pair, a constant defined elsewhere in your app. Safe to ship; it identifies your server to the push service, it does not authenticate anything by itself.',
    },
    {
      line: 15,
      text: '`firstValueFrom` converts the `Observable` that `HttpClient.post` returns into a `Promise`, so it can sit next to the `await`s around it instead of needing its own `.subscribe()`.',
    },
    {
      line: 21,
      text: '`swPush.messages` — an `Observable` of whatever JSON payload the push contained, but only while this tab is open and focused.',
    },
    {
      line: 24,
      text: '`swPush.notificationClicks` — an `Observable` of `{ action, notification }`, firing when the person clicks a **system** notification the worker showed while the tab was unfocused or closed.',
    },
    {
      line: 26,
      text: '`notification.data` — whatever object your server attached to the push payload. Entirely yours to shape; here it is read as a URL to route to.',
    },
  ];

  // ── Quiz, FAQ ────────────────────────────────────────────────────────────

  /**
   * The self-test — the exact exam question the missing `navigationUrls`
   * material used to leave a lesson unable to answer.
   */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'The service worker crashed, and the browser served a generic fallback page.',
      why: 'Nothing crashed — a crash would mean the request reaches the network unmodified, or fails outright. What actually happened is a documented, deliberate rule doing exactly what it is built to do: this is a working feature landing on the wrong URL, not an error.',
    },
    {
      text: "The redirect is a navigation request, it didn't match any exclude in navigationUrls, and the worker's index fallback served index.html instead of letting it reach the network.",
      correct: true,
      why: 'Exactly this. A browser following an OAuth redirect is indistinguishable from any other navigation as far as navigationUrls is concerned — without an explicit exclude for that one path, it gets bundled in with every ordinary deep link and answered from the index-fallback rule.',
    },
    {
      text: "Service workers can't handle redirects — the fix is to disable the worker for the whole auth flow.",
      why: 'Disabling the worker for a whole flow throws away every offline/caching benefit to fix a one-line config gap. Service workers intercept navigations, not redirects specifically; a correctly excluded path reaches the network exactly as if there were no worker at all.',
    },
    {
      text: "The OAuth provider's registered redirect URI is misconfigured.",
      why: "A real category of bug, but it does not explain the timing clue: this started **after enabling the PWA**, with no change to the provider's settings. A misconfigured redirect URI fails at the provider before your origin is even reached; this failure happens on your own origin, after the redirect already arrived.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'My update code just does nothing in `ng serve`. Is it broken?',
      a: 'Almost certainly not — the service worker never registers under `ng serve` at all (`enabled: !isDevMode()`), so `SwUpdate.isEnabled` is `false` and every real check is skipped on purpose. Test the update flow against a production build served statically, not the dev server.',
    },
    {
      q: "Why didn't my custom install button ever show up?",
      a: "Either the install criteria genuinely aren't met yet (check DevTools → Application → Manifest for what's missing), the app is already installed, `beforeinstallprompt` already fired before your listener was attached, or you're on a browser that never fires it at all — every version of Safari, and Firefox.",
    },
    {
      q: 'I added `!/api/**` to navigationUrls. Why did my auth callback still break?',
      a: "`navigationUrls` only knows the exact patterns you give it — excluding `/api/**` says nothing about `/auth/callback`, or whatever one-off path a third-party redirect actually lands on. Each route that shouldn't get the index fallback needs its own explicit exclude.",
    },
    {
      q: 'My dataGroup uses freshness with a timeout, but the very first API call is still slow. Bug?',
      a: 'No — `freshness` always tries the network first, and `timeout` only decides how long to wait before falling back to a **cached** copy. On a first visit nothing is cached yet, so there is nothing to fall back to; a slow network is just slow. `freshness` makes stale data less likely, not first load faster.',
    },
    {
      q: 'My assetGroup already caches all my JS — why would `/api/config`, which barely ever changes, need its own dataGroup entry?',
      a: 'Because assetGroups only know about files that exist **at build time**, hashed into `ngsw.json`. An API response is fetched at runtime and was never in that manifest, no matter how static its data is — it needs its own dataGroup with its own strategy, even one as simple as a long `maxAge`.',
    },
  ];
}
