import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
 */
@Component({
  selector: 'app-lesson-pwa-service-worker',
  imports: [RouterLink],
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

  // --- code samples ---
  /**
   * Sample: `ng add @angular/pwa` and the provider it registers.
   */
  readonly setupSample = `ng add @angular/pwa     # manifest + icons + ngsw-config.json + provider

// app.config.ts
import { provideServiceWorker } from '@angular/service-worker';

provideServiceWorker('ngsw-worker.js', {
  enabled: !isDevMode(),
  // don't compete with app startup for bandwidth — register when
  // the app stabilizes (or after 30s, whichever comes first):
  registrationStrategy: 'registerWhenStable:30000',
})`;

  /**
   * Sample: driving updates from `SwUpdate.versionUpdates`, including the polling
   * a long-lived tab needs.
   */
  readonly updateSample = `export class UpdateService {
  private updates = inject(SwUpdate);

  constructor() {
    // 1. react to the lifecycle
    // versionUpdates emits several event types. VERSION_READY is the one that
    // matters: the new version is fully downloaded and waiting to activate.
    this.updates.versionUpdates
      // A TYPE PREDICATE ("e is VersionReadyEvent"), not just a boolean —
      // that is what narrows the stream's type for everything downstream.
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.promptUser());

    // 2. long-lived tabs: poll (worker only auto-checks on navigation)
    // Without this, a dashboard left open on a wall display for a week never
    // notices a deploy — the worker only checks when the page navigates.
    // 6 hours in ms. Poll far more often and you are just burning requests.
    setInterval(() => this.updates.checkForUpdate(), 6 * 60 * 60 * 1000);

    // 3. broken cache → only way out is a reload
    // "Unrecoverable" means the worker's cached files no longer match what
    // the server has — usually a deploy that deleted the hashed files this
    // client still needs. Nothing can be fetched, so a hard reload is the
    // only exit. This is the one case where reloading without asking is right.
    this.updates.unrecoverable.subscribe(() => document.location.reload());
  }

  async promptUser() {
    // ASK, don't force. Reloading under someone mid-form loses their work.
    if (confirm('A new version is available. Reload?')) {
      // activateUpdate() swaps the worker over to the new version...
      await this.updates.activateUpdate();
      // ...and the reload is what makes the running page pick it up. Both
      // steps are required: activate alone leaves the old code executing.
      document.location.reload();
    }
  }
}`;

  /**
   * Sample: `SwPush` — subscribing, and handling a push message.
   */
  readonly pushSample = `private swPush = inject(SwPush);

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
}
