import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RevealOnScrollDirective } from '../../shared/reveal-on-scroll.directive';
import { Bubbles, Napkin, type BubbleTurn } from '../../shared/brain';
import { highlight } from '../../shared/highlighter';

/** HTTP verbs the playground can issue. */
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Visual state of one lifecycle step.
 *
 * - `idle` — not reached yet.
 * - `active` — currently running; the step animates.
 * - `done` — completed; its captured data stays readable.
 * - `error` — the run failed here (only ever the parse step; see `send`).
 */
type StepState = 'idle' | 'active' | 'done' | 'error';

/**
 * A real public test API. Deliberately a live third-party endpoint rather than
 * a mock: the point of the page is that the request genuinely leaves the
 * browser, so the timings, the CORS-restricted response headers and the 404
 * path are all real rather than staged.
 */
const BASE_URL = 'https://jsonplaceholder.typicode.com';
/** Pause on each lifecycle step so its data can actually be read — the
 *  playground is a teaching device, not a benchmark. */
const STEP_DELAY_MS = 2600;

/** One HTTP header, as rendered in the request/response header tables. */
interface HeaderRow {
  /** Header name, e.g. `Content-Type`. */
  name: string;
  /** Header value. */
  value: string;
  /** Marks headers added by the interceptor so the diff can highlight them. */
  added?: boolean;
}

/** A one-click starting point for the request builder. */
interface Preset {
  /** Button text, also used as the active-preset key. */
  label: string;
  /** Verb to switch to. */
  method: Method;
  /** Path appended to {@link BASE_URL}. */
  path: string;
  /** Whether this preset sends a body — used only for authoring clarity;
   *  the live check is `hasBody`, derived from the method. */
  body: boolean;
  /** One-line explanation shown under the builder once selected. */
  note: string;
}

/**
 * The preset request bar, ordered to walk a reader through CRUD and then a
 * deliberate failure — the `404 error` entry exists so the
 * `HttpErrorResponse` branch is one click away rather than something you have
 * to contrive.
 */
const PRESETS: Preset[] = [
  {
    label: 'GET list',
    method: 'GET',
    path: '/posts?_limit=5',
    body: false,
    note: 'Read a collection (query param limits it to 5)',
  },
  {
    label: 'GET one',
    method: 'GET',
    path: '/posts/1',
    body: false,
    note: 'Read a single resource by id',
  },
  {
    label: 'POST create',
    method: 'POST',
    path: '/posts',
    body: true,
    note: 'Create — server assigns the id (echoed back)',
  },
  {
    label: 'PUT replace',
    method: 'PUT',
    path: '/posts/1',
    body: true,
    note: 'Replace the whole resource',
  },
  {
    label: 'PATCH update',
    method: 'PATCH',
    path: '/posts/1',
    body: true,
    note: 'Partial update — only the sent fields change',
  },
  {
    label: 'DELETE',
    method: 'DELETE',
    path: '/posts/1',
    body: false,
    note: 'Delete — typically returns an empty body',
  },
  {
    label: '404 error',
    method: 'GET',
    path: '/posts/999999',
    body: false,
    note: 'A miss — watch the HttpErrorResponse path',
  },
];

/** Starting request body for the verbs that take one. Valid JSON, and edited in place. */
const DEFAULT_BODY = `{
  "title": "Learning Angular HTTP",
  "body": "Interceptors, headers and observables",
  "userId": 7
}`;

/** Base64url-encode without padding — how real JWT segments are packed. */
function b64url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Claims for the demo token. Structurally a real JWT payload (`sub`, `exp`, a
 * role) so the decoded panel shows what a production token actually carries —
 * but it is signed with nothing and the target API ignores auth entirely.
 */
const JWT_PAYLOAD = { sub: 'user-42', name: 'Ada Lovelace', role: 'ADMIN', exp: 1893456000 };

/**
 * Title and explanation for each of the six lifecycle steps, in order. The
 * array's length defines how many steps the UI renders, so adding a stage here
 * is the only edit needed on the presentation side.
 */
const STEP_META: { title: string; blurb: string }[] = [
  {
    title: '1 · Build the HttpRequest',
    blurb:
      'http.get()/post() does not fire anything yet — it builds an IMMUTABLE HttpRequest object and returns a cold observable. Nothing leaves the browser until something subscribes.',
  },
  {
    title: '2 · Interceptor chain',
    blurb:
      'Each interceptor receives the request and MUST clone() to change it — requests are immutable so retries stay identical. Here an auth interceptor attaches the Bearer token.',
  },
  {
    title: '3 · On the wire',
    blurb:
      'The HttpRequest is serialized into an actual HTTP message: a request line, one header per line, a blank line, then the JSON-stringified body (if any).',
  },
  {
    title: '4 · In flight',
    blurb:
      'DNS lookup → TCP + TLS handshake → bytes out → server work → bytes back. JavaScript sees none of it; you only observe the duration (and a CORS preflight may happen invisibly first).',
  },
  {
    title: '5 · Response received',
    blurb:
      'A status line, response headers and a raw text body come back. NOTE: on cross-origin calls JS can only read the few CORS-safelisted headers unless the server exposes more via Access-Control-Expose-Headers.',
  },
  {
    title: '6 · Parse & deliver',
    blurb:
      'Angular JSON.parses the body and emits it (typed by YOUR generic — no runtime check!) to the subscriber. Non-2xx skips next() entirely and delivers an HttpErrorResponse to the error path.',
  },
];

/**
 * API Playground — an interactive anatomy lesson for a single HTTP call.
 *
 * You build a **real** request against {@link BASE_URL} (method, path, body,
 * headers, optional Bearer auth), send it, and watch the lifecycle unfold one
 * step at a time with the actual data captured at each stage:
 *
 * 1. **Build** — the immutable `HttpRequest` Angular constructs. Nothing has
 *    left the browser yet; `http.get()` returns a *cold* observable.
 * 2. **Interceptors** — an auth interceptor cloning the request, shown as a
 *    header diff so the `clone()`-don't-mutate rule is visible rather than
 *    asserted.
 * 3. **On the wire** — the serialized request line, headers and JSON body.
 * 4. **In flight** — where the real call actually happens. DNS/TLS/network is
 *    a black box to JavaScript; only the duration is observable.
 * 5. **Response** — status line, response headers, raw body. The header list
 *    is short on purpose: cross-origin responses only expose the CORS-safelisted
 *    ones unless the server opts in via `Access-Control-Expose-Headers`.
 * 6. **Parse** — `JSON.parse` into your declared generic (which is *not* checked
 *    at runtime), or the `HttpErrorResponse` branch for a non-2xx.
 *
 * ## Two things that make it a teaching device rather than a client
 *
 * - **Pacing.** Each step pauses for {@link STEP_DELAY_MS} so its data can be
 *   read. The lightning toggle ({@link instant}) shortens that for repeat runs.
 * - **A structurally-real JWT.** {@link jwtParts} is a genuine
 *   `header.payload.signature` triple, base64url-encoded, that the page decodes
 *   in front of you — but the signature is a placeholder and the API ignores
 *   auth. The point is seeing *where* the header is attached, which is what
 *   interceptor questions actually test.
 *
 * A generated-code panel mirrors the builder state as real `HttpClient` code,
 * so every experiment doubles as something copy-pasteable.
 */
@Component({
  selector: 'app-api-playground',
  imports: [RouterLink, RevealOnScrollDirective, Bubbles, Napkin],
  styleUrl: './api-playground.css',
  templateUrl: './api-playground.html',
})
export class ApiPlayground {
  /** Issues the real request in step 4. */
  private readonly http = inject(HttpClient);

  /** Used to notice teardown mid-run — see {@link destroyed}. */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Set once the component is torn down. A run is a sequence of awaited
   * delays, so navigating away mid-run would otherwise keep writing signals on
   * a destroyed component; every step checks this before continuing.
   */
  private destroyed = false;
  /** Increments per send so a stale run's timeouts stop advancing the UI. */
  private runToken = 0;

  /** Exposed so the template can show the origin every request goes to. */
  readonly baseUrl = BASE_URL;

  /** Verb buttons in the builder. */
  readonly methods: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  /** One-click request presets. */
  readonly presets = PRESETS;

  /** Per-step titles and explanations. */
  readonly stepMeta = STEP_META;

  /**
   * The two-line exchange shown in place of the step list before the first
   * request goes out. A dialogue reads as an invitation ("do this") rather
   * than as a caption on empty space, which is what the plain sentence it
   * replaces amounted to.
   */
  readonly introTurns: BubbleTurn[] = [
    { who: 'You', says: 'Configure a request and hit **Send**.' },
    {
      who: 'Playground',
      says: 'Watch — the six lifecycle steps light up here with the real data at each stage.',
    },
  ];

  // --- builder state ---

  /** Verb for the next request. */
  readonly method = signal<Method>('GET');

  /** Path appended to {@link BASE_URL}, query string included. */
  readonly path = signal('/posts?_limit=5');

  /** Raw request-body text. Free-form so invalid JSON can be demonstrated. */
  readonly bodyText = signal(DEFAULT_BODY);

  /** Whether the simulated auth interceptor attaches the Bearer token. */
  readonly authOn = signal(false);

  /** Name of an optional extra request header. Blank = none. */
  readonly customHeaderName = signal('');

  /** Value for {@link customHeaderName}. */
  readonly customHeaderValue = signal('');

  /** Label of the selected preset, or `''` once the builder is hand-edited. */
  readonly activePreset = signal('GET list');
  /** ⚡ mode collapses the per-step pause for repeat runs. */
  readonly instant = signal(false);

  /** Whether the current verb carries a body — drives the body editor and `Content-Type`. */
  readonly hasBody = computed(() => ['POST', 'PUT', 'PATCH'].includes(this.method()));

  /**
   * Whether {@link bodyText} parses. Blocks {@link send} rather than letting a
   * `JSON.parse` throw mid-run, and vacuously `true` for bodiless verbs.
   */
  readonly bodyValid = computed(() => {
    if (!this.hasBody()) return true;
    try {
      JSON.parse(this.bodyText());
      return true;
    } catch {
      return false;
    }
  });
  /** Explanation for the selected preset; empty once the builder is hand-edited. */
  readonly presetNote = computed(
    () => this.presets.find((p) => p.label === this.activePreset())?.note ?? '',
  );

  // --- the fake-but-structurally-real JWT ---

  /**
   * The token's three segments: base64url header, base64url payload, and a
   * placeholder signature. Rendered separately so the dot-delimited structure
   * is visible instead of being one opaque string.
   */
  readonly jwtParts: [string, string, string] = [
    b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    b64url(JSON.stringify(JWT_PAYLOAD)),
    'demo-signature-not-cryptographic',
  ];
  /** The decoded payload, shown next to the encoded segment to demystify it. */
  readonly jwtPayloadJson = JSON.stringify(JWT_PAYLOAD);

  /** The assembled `header.payload.signature` string sent in the Bearer header. */
  private get jwt(): string {
    return this.jwtParts.join('.');
  }

  // --- lifecycle run state ---

  /** Whether a request has ever been sent — hides the step list until then. */
  readonly started = signal(false);

  /** Whether a run is in progress. Blocks re-entry into {@link send}. */
  readonly running = signal(false);
  /** Index of the currently-active step; steps below it are done. */
  readonly currentStep = signal(-1);
  /** Step index that errored, or `null`. Only ever the parse step. */
  readonly failedAtStep = signal<number | null>(null);

  /** Which step panels are open. Steps auto-expand as they run; the user can re-collapse. */
  private readonly expanded = signal<Set<number>>(new Set());

  /** Request headers after the interceptor stage, with additions marked. */
  readonly finalHeaders = signal<HeaderRow[]>([]);

  /** Step 1's captured `HttpRequest`, pretty-printed. */
  readonly requestObjectJson = signal('');

  /** Step 3's serialized HTTP message. */
  readonly wireMessage = signal('');

  /** Response status code, or `null` before one arrives. */
  readonly status = signal<number | null>(null);

  /** Response reason phrase. */
  readonly statusText = signal('');

  /** Whether the response was 2xx. */
  readonly ok = signal(false);

  /** Response headers JS is allowed to read — short by design on cross-origin calls. */
  readonly responseHeaders = signal<HeaderRow[]>([]);

  /** The response body as text, before parsing. */
  readonly rawBody = signal('');

  /** A short description of what parsing produced, e.g. `Array(5) of Post`. */
  readonly parsedSummary = signal('');

  /** Wall-clock duration of the real network call, in ms. */
  readonly durationMs = signal(0);

  /** The serialized `HttpErrorResponse` when a run fails; `''` otherwise. */
  readonly errorMessage = signal('');

  /** Registers the teardown flag that lets an in-flight run bail out. */
  constructor() {
    this.destroyRef.onDestroy(() => (this.destroyed = true));
  }

  // --- builder interactions ---

  /**
   * Loads a preset into the builder. Leaves the body text alone so an edited
   * body survives switching between the verbs that use one.
   *
   * @param preset The preset that was clicked.
   */
  applyPreset(preset: Preset): void {
    this.activePreset.set(preset.label);
    this.method.set(preset.method);
    this.path.set(preset.path);
  }

  /**
   * Changes the verb by hand, clearing the active preset — the builder no
   * longer matches any preset, and leaving one highlighted would be a lie.
   *
   * @param m The verb chosen.
   */
  setMethod(m: Method): void {
    this.method.set(m);
    this.activePreset.set('');
  }

  /** Headers before the interceptor chain touches the request. */
  private baseHeaders(): HeaderRow[] {
    const rows: HeaderRow[] = [{ name: 'Accept', value: 'application/json' }];
    if (this.hasBody()) rows.push({ name: 'Content-Type', value: 'application/json' });
    const name = this.customHeaderName().trim();
    if (name) rows.push({ name, value: this.customHeaderValue().trim() || '(empty)' });
    return rows;
  }

  /**
   * The equivalent `HttpClient` call for the current builder state, so the
   * playground doubles as a code generator.
   *
   * The generic is inferred the way a developer would pick it: `<void>` for a
   * DELETE, `<Post>` when the path ends in an id, `<Post[]>` otherwise —
   * which is also a quiet demonstration that the generic is a *claim* about
   * the response, not a runtime check.
   */
  readonly generatedCode = computed(() => {
    const method = this.method().toLowerCase();
    const genericType =
      this.method() === 'DELETE' ? '<void>' : /\/\d+/.test(this.path()) ? '<Post>' : '<Post[]>';
    const lines: string[] = [];
    if (this.authOn()) {
      lines.push(
        '// interceptor (registered once in app.config.ts):',
        'const authInterceptor: HttpInterceptorFn = (req, next) =>',
        '  next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));',
        '',
      );
    }
    const args: string[] = [`'${BASE_URL}${this.path()}'`];
    if (this.hasBody()) args.push('body');
    lines.push(`this.http.${method}${genericType}(${args.join(', ')})`);
    lines.push(`  .subscribe({`);
    lines.push(`    next: (data) => console.log(data),`);
    lines.push(`    error: (err: HttpErrorResponse) => console.error(err.status),`);
    lines.push(`  });`);
    return lines.join('\n');
  });

  /**
   * Syntax-highlighted copies of the five raw text panels above (the built
   * request, the wire message, the generated code, and the error/success
   * bodies), built the same way `shared/teaching/predict` does: {@link
   * highlight} tokenises into `<span class="hl-*">` markup and escapes every
   * character it emits, so binding the result with `[innerHTML]` is safe
   * even though the request body and custom header value are free-typed by
   * the user. Kept as separate computeds — rather than highlighting the
   * signals in place — so `generatedCode`, `requestObjectJson`, etc. stay
   * plain strings for anything else that reads them (e.g. `JSON.parse`).
   */
  readonly generatedCodeHtml = computed(() => highlight(this.generatedCode()));
  readonly requestObjectHtml = computed(() => highlight(this.requestObjectJson()));
  readonly wireMessageHtml = computed(() => highlight(this.wireMessage()));
  readonly errorMessageHtml = computed(() => highlight(this.errorMessage()));
  readonly rawBodyHtml = computed(() => highlight(this.rawBody()));

  // --- lifecycle helpers ---

  /**
   * Visual state for one step, derived from the run cursor rather than stored
   * per step — so there is exactly one source of truth for "where are we".
   *
   * @param index Zero-based step index.
   */
  stepState(index: number): StepState {
    if (this.failedAtStep() !== null && index === this.failedAtStep()) return 'error';
    const current = this.currentStep();
    if (index < current) return 'done';
    if (index === current) return this.running() ? 'active' : 'done';
    return 'idle';
  }

  /**
   * Whether a step's detail panel is open.
   *
   * @param index Zero-based step index.
   */
  isExpanded(index: number): boolean {
    return this.expanded().has(index);
  }

  /**
   * Opens or closes a step's detail panel. Copies the `Set` rather than
   * mutating it, because a signal only notifies on a new reference.
   *
   * @param index Zero-based step index.
   */
  toggleExpand(index: number): void {
    this.expanded.update((set) => {
      const next = new Set(set);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  /**
   * Opens a panel without closing anything — used by the run itself, so each
   * step reveals its data as it happens.
   *
   * @param index Zero-based step index.
   */
  private expand(index: number): void {
    this.expanded.update((set) => new Set(set).add(index));
  }

  /**
   * Paces the walkthrough. Honours {@link instant}, which collapses the pause
   * to a token 200ms for repeat runs rather than to zero — some delay is still
   * needed for the step transition to read as a transition.
   *
   * @param ms Delay to use in normal mode.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.instant() ? 200 : ms));
  }

  /** Advance to a step: mark it active, auto-expand it, pace the reveal. */
  private async advance(index: number, token: number): Promise<boolean> {
    if (this.destroyed || token !== this.runToken) return false;
    this.currentStep.set(index);
    this.expand(index);
    await this.delay(STEP_DELAY_MS);
    return !this.destroyed && token === this.runToken;
  }

  /**
   * Runs the whole lifecycle: captures the data for each stage, paces the
   * reveal, and makes the one real network call in the middle of it.
   *
   * ## The run token
   *
   * This is a long-lived async sequence with awaits between every step, and
   * two things can invalidate it partway through: the component being
   * destroyed, or the user hitting Send again. Both are handled by
   * {@link runToken} — each run captures the token it started with, and every
   * resumption point compares it against the current one and bails if they
   * differ. Without it, a second run would interleave with the first and the
   * two would fight over the same signals.
   *
   * A non-2xx response is *not* an exception here in the usual sense: it is
   * caught, recorded as {@link failedAtStep}, and rendered as the
   * `HttpErrorResponse` branch of step 6, because that path is the thing being
   * taught.
   */
  async send(): Promise<void> {
    if (this.running() || (this.hasBody() && !this.bodyValid())) return;
    const token = ++this.runToken;

    // reset run state
    this.started.set(true);
    this.running.set(true);
    this.failedAtStep.set(null);
    this.currentStep.set(-1);
    this.expanded.set(new Set());
    this.status.set(null);
    this.errorMessage.set('');
    this.rawBody.set('');
    this.responseHeaders.set([]);

    const url = `${BASE_URL}${this.path()}`;
    const bodyObj = this.hasBody() ? JSON.parse(this.bodyText()) : null;
    const base = this.baseHeaders();

    // 1 · build
    this.requestObjectJson.set(
      JSON.stringify(
        {
          method: this.method(),
          url,
          headers: Object.fromEntries(base.map((h) => [h.name, h.value])),
          body: bodyObj,
          responseType: 'json',
          observe: 'response',
        },
        null,
        2,
      ),
    );
    if (!(await this.advance(0, token))) return;

    // 2 · interceptors
    const final: HeaderRow[] = [...base];
    if (this.authOn()) {
      final.push({ name: 'Authorization', value: `Bearer ${this.jwt}`, added: true });
    }
    this.finalHeaders.set(final);
    if (!(await this.advance(1, token))) return;

    // 3 · wire format
    const pathOnly = this.path() || '/';
    const wire = [
      `${this.method()} ${pathOnly} HTTP/1.1`,
      `Host: jsonplaceholder.typicode.com`,
      ...final.map((h) => `${h.name}: ${h.value}`),
    ];
    if (bodyObj) wire.push('', JSON.stringify(bodyObj));
    this.wireMessage.set(wire.join('\n'));
    if (!(await this.advance(2, token))) return;

    // 4 · in flight — the real call happens here
    this.currentStep.set(3);
    this.expand(3);
    const startedAt = performance.now();
    let response: HttpResponse<unknown> | null = null;
    let failure: HttpErrorResponse | null = null;
    try {
      let headers = new HttpHeaders();
      for (const h of final) headers = headers.set(h.name, h.value);
      response = await firstValueFrom(
        this.http.request(this.method(), url, {
          body: bodyObj ?? undefined,
          headers,
          observe: 'response',
        }),
      );
    } catch (err) {
      failure = err as HttpErrorResponse;
    }
    this.durationMs.set(Math.round(performance.now() - startedAt));
    if (this.destroyed || token !== this.runToken) return;
    await this.delay(STEP_DELAY_MS);
    if (this.destroyed || token !== this.runToken) return;

    // 5 · response
    const headerSource = response?.headers ?? failure?.headers;
    this.status.set(response?.status ?? failure?.status ?? 0);
    this.statusText.set(response?.statusText ?? failure?.statusText ?? 'Unknown');
    this.ok.set(response?.ok ?? false);
    this.responseHeaders.set(
      (headerSource?.keys() ?? []).map((name) => ({
        name,
        value: headerSource?.get(name) ?? '',
      })),
    );
    if (!(await this.advance(4, token))) return;

    // 6 · parse & deliver (or the error path)
    if (failure) {
      this.failedAtStep.set(5);
      this.errorMessage.set(
        JSON.stringify(
          {
            name: 'HttpErrorResponse',
            status: failure.status,
            statusText: failure.statusText,
            url: failure.url,
            message: failure.message,
            error: failure.error,
          },
          null,
          2,
        ),
      );
    } else {
      const body = response!.body;
      const pretty = JSON.stringify(body, null, 2) ?? 'null';
      this.rawBody.set(pretty.length > 2200 ? pretty.slice(0, 2200) + '\n… (truncated)' : pretty);
      this.parsedSummary.set(
        Array.isArray(body)
          ? `JSON.parse produced an ARRAY of ${body.length} objects — typed as Post[] by the generic you chose, delivered to next():`
          : body && typeof body === 'object'
            ? `JSON.parse produced a single object — typed as Post by your generic, delivered to next():`
            : `The body parsed to ${JSON.stringify(body)} — DELETE endpoints often return an empty object:`,
      );
    }
    this.currentStep.set(5);
    this.expand(5);
    this.running.set(false);
  }
}
