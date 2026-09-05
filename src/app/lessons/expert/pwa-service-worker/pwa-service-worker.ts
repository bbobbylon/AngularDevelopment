import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Chapter, CodeLab } from '../../../shared/brain';
import type { ChapterStop, CodeNote } from '../../../shared/brain';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
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
];

/** One step in the simulated update lifecycle. */
interface SimState {
  id: 'v1' | 'deployed' | 'detected' | 'ready' | 'activated';
  log: string[];
}

/**
 * Lesson: Angular's service worker and PWAs in depth — what ng add scaffolds,
 * how the generated ngsw engine actually versions and serves your app,
 * assetGroups vs dataGroups with a strategy decision lab, a live SwUpdate
 * lifecycle simulator (deploy → detect → ready → activate), SwPush, and the
 * debugging/gotcha list (ngsw/state, ngsw-bypass, the safety worker).
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer. The whole lesson hangs off one
 * analogy: **Angular's service worker renovates your app like a hotel that
 * never closes.** A new wing (v2) is built and inspected completely off to
 * the side while the current wing (v1) keeps serving every guest already
 * checked in — nobody gets moved mid-stay, only at checkout (a reload). It
 * explains atomicity, hash verification, the one-tab-one-version rule, and
 * why `VERSION_READY` means "built and inspected," not "occupied."
 */
@Component({
  selector: 'app-lesson-pwa-service-worker',
  imports: [RouterLink, BfPage, Chapter, CodeLab, Faq, Flow, Predict, Quiz, Remember],
  styleUrl: './pwa-service-worker.css',
  templateUrl: './pwa-service-worker.html',
})
export class PwaServiceWorker {
  /**
   * The cacheable resources.
   */
  readonly resources = RESOURCES;
  /**
   * The resource being examined, or `null` for none.
   */
  readonly activeResource = signal<Resource | null>(null);

  // --- update lifecycle simulator ---
  /**
   * The stages of the update lifecycle, in order.
   */
  readonly stages = [
    { id: 'v1' as const, label: 'running v1' },
    { id: 'deployed' as const, label: 'v2 deployed' },
    { id: 'detected' as const, label: 'VERSION_DETECTED' },
    { id: 'ready' as const, label: 'VERSION_READY' },
    { id: 'activated' as const, label: 'activated + reloaded' },
  ];
  /**
   * The stage ids, for comparing progress by position.
   */
  private readonly order = this.stages.map((s) => s.id);

  /**
   * Where the simulator has got to, plus its log.
   */
  readonly state = signal<SimState>({
    id: 'v1',
    log: ['[app] running version v1 — service worker serving from cache'],
  });

  /**
   * What the next click will do — a label rather than just "Next", so the
   * simulator reads as a sequence of real events.
   */
  readonly nextAction = computed(() => {
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
  reached(id: SimState['id']): boolean {
    return this.order.indexOf(id) <= this.order.indexOf(this.state().id);
  }

  /**
   * Advances one stage, appending the events a real service worker would emit.
   *
   * The stage worth reading closely is `VERSION_READY`: the new version is fully
   * downloaded and verified but **not** running, and it will not run until
   * `activateUpdate()` plus a reload. That gap is why a deployed fix does not
   * reach a long-lived tab on its own, and why the prompt-to-reload pattern
   * exists.
   */
  advance() {
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

  /**
   * Resets the simulator.
   */
  resetSim() {
    this.state.set({
      id: 'v1',
      log: ['[app] running version v1 — service worker serving from cache'],
    });
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Rendering & Delivery track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'SSR', id: 'ssr' },
    { label: 'Hydration', id: 'hydration' },
    { label: 'PWA & Service Worker' },
  ];

  /** The deploy-to-ready pipeline, from the worker's point of view. */
  protected readonly engineFlow: FlowStep[] = [
    { label: 'Deploy', detail: 'server publishes a new manifest with fresh file hashes' },
    {
      label: 'Build the wing',
      detail: 'worker downloads every v2 file in the background',
      tone: 'accent',
    },
    {
      label: 'Inspect it',
      detail: "each file's hash is checked against the manifest",
      tone: 'accent',
    },
    { label: 'Ready', detail: 'v2 fully cached and verified — not occupied yet', tone: 'good' },
    { label: 'Guests stay put', detail: 'open tabs keep serving v1 until they reload' },
  ];

  /** Options for the VERSION_READY self-test. */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'This tab is already running v2.',
      why: "Not yet — VERSION_READY means v2 is fully downloaded and hash-verified, but this tab keeps executing v1's code until activateUpdate() runs and the page reloads.",
    },
    {
      text: 'v2 is fully cached and verified, but this tab is still running v1.',
      correct: true,
      why: '"Ready" describes the cache, not the running tab. Nothing changes for the user until activateUpdate() plus a reload.',
    },
    {
      text: 'Every open tab, for every user, just switched to v2.',
      why: "There's no broadcast that force-switches other tabs or other users — each tab's own app code decides when (or whether) to call activateUpdate().",
    },
    {
      text: "v1's cached files have already been deleted.",
      why: "Cleanup happens after activation, not before — deleting v1's files while a tab might still be running them would break that tab outright.",
    },
  ];

  /** The "no dumb questions" block. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Freshness vs performance — which for a stock ticker, which for a country list?',
      a: 'Ticker: freshness — network-first with a timeout, because a stale price is actively harmful. Country list: performance — cache-first, because staleness for a week is irrelevant and the instant response is worth more.',
    },
    {
      q: "Why don't users see a half-updated app during a deploy?",
      a: "Updates are atomic. The worker keeps serving the complete current version while the new manifest's files download in the background, and the new version only becomes activatable once every one of its hash-verified files is cached — never some of v1 mixed with some of v2.",
    },
    {
      q: 'A user reports week-old code. Where do you even start?',
      a: "Check `/ngsw/state` for the version actually being served; confirm `index.html` isn't sitting behind a long-TTL edge cache; check whether the tab is simply long-lived with no `checkForUpdate()` poll; and if the deployed worker itself is broken, ship the safety worker to unregister it for everyone.",
    },
    {
      q: 'Why is the service worker disabled in `ng serve`?',
      a: "Dev rebuilds change file hashes constantly — the worker would thrash trying to cache a moving target, and it would fight with live-reload. It's enabled only for production builds (`enabled: !isDevMode()`), served over HTTPS or localhost.",
    },
    {
      q: 'If v2 is sitting there fully verified, why not just switch every tab automatically?',
      a: 'Because "automatically" can land mid-keystroke in a form or mid-scroll in a long list, and a forced reload throws that away. Angular hands you the decision instead — your own code calls activateUpdate() only after asking, which is why every wired-up service worker needs an explicit prompt-to-reload.',
    },
  ];

  // --- code samples ---
  /**
   * Sample: `ng add @angular/pwa` and the provider it registers.
   */
  readonly setupSample = `ng add @angular/pwa

// app.config.ts
import { provideServiceWorker } from '@angular/service-worker';

provideServiceWorker('ngsw-worker.js', {
  enabled: !isDevMode(),
  registrationStrategy: 'registerWhenStable:30000',
});`;

  /** Line-by-line notes for {@link setupSample}. */
  protected readonly setupNotes: CodeNote[] = [
    {
      line: 1,
      text: 'One command scaffolds all three PWA ingredients at once: a web app manifest, an icon set, `ngsw-config.json`, and this provider call — no hand-written worker code anywhere.',
    },
    {
      line: 4,
      text: '`provideServiceWorker` is the entire runtime footprint in your own code. Caching, versioning and update checks all run inside the generated `ngsw-worker.js`, which you never edit directly.',
    },
    {
      line: 7,
      text: "`isDevMode()` is true during `ng serve`. Dev rebuilds change file hashes on every save, which would make the worker thrash trying to cache a moving target — so it's switched off entirely until a real production build.",
    },
    {
      line: 8,
      text: "Registering the instant the app boots competes with the app's own startup for bandwidth and the main thread. This waits for Angular to report the app stable, or 30 seconds — whichever comes first — so the worker's own download doesn't slow down the thing it's meant to help.",
    },
  ];

  /**
   * Sample: driving updates from `SwUpdate.versionUpdates`, including the polling
   * a long-lived tab needs.
   */
  readonly updateSample = `export class UpdateService {
  private updates = inject(SwUpdate);

  constructor() {
    this.updates.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.promptUser());

    setInterval(() => this.updates.checkForUpdate(), 6 * 60 * 60 * 1000);

    this.updates.unrecoverable.subscribe(() => document.location.reload());
  }

  async promptUser() {
    if (confirm('A new version is available. Reload?')) {
      await this.updates.activateUpdate();
      document.location.reload();
    }
  }
}`;

  /** Line-by-line notes for {@link updateSample}. */
  protected readonly updateNotes: CodeNote[] = [
    {
      line: 5,
      text: '`versionUpdates` emits several event types as v2 moves through the pipeline — `VERSION_DETECTED`, `VERSION_READY`, `VERSION_INSTALLATION_FAILED`. This stream is the only way your own code finds out any of that happened.',
    },
    {
      line: 6,
      text: "A type predicate (`e is VersionReadyEvent`), not a plain boolean. That's what narrows the stream's type for everything downstream — inside `subscribe`, TypeScript already knows `e` is a `VersionReadyEvent`.",
    },
    {
      line: 7,
      text: '`VERSION_READY` is the one event worth reacting to: v2 is fully downloaded and hash-verified — the new wing has passed inspection. It is not running yet.',
    },
    {
      line: 9,
      text: 'Without this, a tab only rechecks on navigation. A dashboard left open on a wall display for a week would never notice a deploy — this polls every six hours regardless. Much more often than that just burns requests for no benefit.',
    },
    {
      line: 11,
      text: '`unrecoverable` fires when the cached version no longer matches what the server has — usually a deploy that deleted files this client still needs. Nothing can be fetched to fix it, so an unconditional reload is the one case where reloading without asking is the right call.',
    },
    {
      line: 15,
      text: "Ask, don't force. `activateUpdate()` is available the moment `VERSION_READY` fires, but reloading a page out from under someone mid-form loses whatever they were typing.",
    },
    {
      line: 16,
      text: 'This swaps the service worker over to v2. On its own it changes nothing visible yet — the page currently running is still the v1 JavaScript already loaded into memory.',
    },
    {
      line: 17,
      text: 'This is the step that actually matters to the user: reloading is what makes the now-activated worker start serving v2. Skip it and `activateUpdate()` alone leaves v1 running until the next natural navigation.',
    },
  ];

  /**
   * Sample: `SwPush` — subscribing, and handling a push message.
   */
  readonly pushSample = `private swPush = inject(SwPush);

async subscribe() {
  const sub = await this.swPush.requestSubscription({
    serverPublicKey: VAPID_PUBLIC_KEY,
  });
  await firstValueFrom(this.http.post('/api/push/subscribe', sub));
}

this.swPush.messages.subscribe((msg) => this.toast.show(msg));

this.swPush.notificationClicks.subscribe(({ notification }) =>
  this.router.navigateByUrl(notification.data.url),
);`;

  /** Line-by-line notes for {@link pushSample}. */
  protected readonly pushNotes: CodeNote[] = [
    {
      line: 4,
      text: "This call triggers the browser's native permission prompt. Fire it from a real user gesture — a button click — not on page load; browsers penalise unprompted requests, and a denied permission is hard to win back.",
    },
    {
      line: 5,
      text: 'The **public** half of a VAPID key pair. The private half stays on your server and signs every push; this one is safe to ship in the client bundle.',
    },
    {
      line: 7,
      text: "The subscription holds the endpoint URL and encryption keys for this specific browser. Skip sending it to your server and there's no address to push to — the whole flow silently no-ops with nothing to debug.",
    },
    {
      line: 10,
      text: "`messages` fires only while the tab is focused. When it isn't, the operating system shows a system notification instead — a different code path entirely, outside your JavaScript.",
    },
    {
      line: 12,
      text: 'The payoff line. `notification.data` is whatever your server put in the push payload originally, so you decide what it contains — usually enough to route straight to the thing the notification was about.',
    },
  ];
}
