import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

/**
 * API Playground — an interactive anatomy lesson for HTTP calls. You build a
 * REAL request against jsonplaceholder.typicode.com (method, path, body,
 * headers, optional Bearer auth), send it, and watch the full lifecycle unfold
 * step by step with the ACTUAL data at each stage:
 *
 *   1. Build       — the immutable HttpRequest object Angular constructs
 *   2. Interceptors — the auth interceptor cloning the request (headers diff)
 *   3. On the wire — the serialized request line + headers + JSON body
 *   4. In flight   — DNS/TLS/network, and why you cannot see inside
 *   5. Response    — status line, response headers (CORS-limited!), raw body
 *   6. Parse       — JSON.parse into typed objects, or the HttpErrorResponse path
 *
 * The Bearer token is a REAL JWT in structure (base64 header.payload.signature)
 * but signed with nothing — the payload panel decodes it to demystify tokens.
 * jsonplaceholder ignores auth entirely; the point is seeing WHERE the header
 * rides along, which is exactly what an exam asks about interceptors.
 *
 * A generated code panel shows the equivalent HttpClient call for the current
 * builder state, so every experiment doubles as copy-paste-able Angular.
 */
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type StepState = 'idle' | 'active' | 'done' | 'error';

const BASE_URL = 'https://jsonplaceholder.typicode.com';
/** Pause on each lifecycle step so its data can actually be read — the
 *  playground is a teaching device, not a benchmark. */
const STEP_DELAY_MS = 2600;

interface HeaderRow {
  name: string;
  value: string;
  /** Marks headers added by the interceptor so the diff can highlight them. */
  added?: boolean;
}

interface Preset {
  label: string;
  method: Method;
  path: string;
  body: boolean;
  note: string;
}

const PRESETS: Preset[] = [
  { label: 'GET list', method: 'GET', path: '/posts?_limit=5', body: false, note: 'Read a collection (query param limits it to 5)' },
  { label: 'GET one', method: 'GET', path: '/posts/1', body: false, note: 'Read a single resource by id' },
  { label: 'POST create', method: 'POST', path: '/posts', body: true, note: 'Create — server assigns the id (echoed back)' },
  { label: 'PUT replace', method: 'PUT', path: '/posts/1', body: true, note: 'Replace the whole resource' },
  { label: 'PATCH update', method: 'PATCH', path: '/posts/1', body: true, note: 'Partial update — only the sent fields change' },
  { label: 'DELETE', method: 'DELETE', path: '/posts/1', body: false, note: 'Delete — typically returns an empty body' },
  { label: '404 error', method: 'GET', path: '/posts/999999', body: false, note: 'A miss — watch the HttpErrorResponse path' },
];

const DEFAULT_BODY = `{
  "title": "Learning Angular HTTP",
  "body": "Interceptors, headers and observables",
  "userId": 7
}`;

/** Base64url-encode without padding — how real JWT segments are packed. */
function b64url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const JWT_PAYLOAD = { sub: 'user-42', name: 'Ada Lovelace', role: 'ADMIN', exp: 1893456000 };

const STEP_META: { title: string; blurb: string }[] = [
  {
    title: '1 · Build the HttpRequest',
    blurb: 'http.get()/post() does not fire anything yet — it builds an IMMUTABLE HttpRequest object and returns a cold observable. Nothing leaves the browser until something subscribes.',
  },
  {
    title: '2 · Interceptor chain',
    blurb: 'Each interceptor receives the request and MUST clone() to change it — requests are immutable so retries stay identical. Here an auth interceptor attaches the Bearer token.',
  },
  {
    title: '3 · On the wire',
    blurb: 'The HttpRequest is serialized into an actual HTTP message: a request line, one header per line, a blank line, then the JSON-stringified body (if any).',
  },
  {
    title: '4 · In flight',
    blurb: 'DNS lookup → TCP + TLS handshake → bytes out → server work → bytes back. JavaScript sees none of it; you only observe the duration (and a CORS preflight may happen invisibly first).',
  },
  {
    title: '5 · Response received',
    blurb: 'A status line, response headers and a raw text body come back. NOTE: on cross-origin calls JS can only read the few CORS-safelisted headers unless the server exposes more via Access-Control-Expose-Headers.',
  },
  {
    title: '6 · Parse & deliver',
    blurb: 'Angular JSON.parses the body and emits it (typed by YOUR generic — no runtime check!) to the subscriber. Non-2xx skips next() entirely and delivers an HttpErrorResponse to the error path.',
  },
];

@Component({
  selector: 'app-api-playground',
  imports: [RouterLink],
  styles: [`
    .pg-hero { text-align: center; padding: 48px 24px 16px; }
    .pg-hero h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); margin: 12px 0; }
    .pg-hero p { max-width: 660px; margin: 0 auto; color: var(--text-muted); }
    .pill { display: inline-block; font-size: .74rem; letter-spacing: .05em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; background: rgba(99,102,241,.12); color: #6366f1; font-weight: 600; }

    .layout { max-width: 1060px; margin: 24px auto 60px; padding: 0 24px; display: grid; grid-template-columns: 400px 1fr; gap: 18px; align-items: start; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }

    .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px 22px; }
    .panel h3 { font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); margin: 18px 0 8px; }
    .panel h3:first-child { margin-top: 0; }

    .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { padding: 5px 12px; border-radius: 18px; border: 1px solid var(--border); background: transparent; cursor: pointer; font-size: .8rem; color: var(--text); }
    .chip.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .chip.method-GET.active { background: #16a34a; border-color: #16a34a; }
    .chip.method-POST.active { background: #d97706; border-color: #d97706; }
    .chip.method-PUT.active { background: #0ea5e9; border-color: #0ea5e9; }
    .chip.method-PATCH.active { background: #a855f7; border-color: #a855f7; }
    .chip.method-DELETE.active { background: #ef4444; border-color: #ef4444; }
    .preset-note { font-size: .78rem; color: var(--text-muted); margin: 8px 0 0; }

    .url-row { display: flex; align-items: center; gap: 0; margin-top: 4px; }
    .url-base { font-family: monospace; font-size: .74rem; color: var(--text-muted); background: var(--bg, rgba(127,127,127,.06)); border: 1px solid var(--border); border-right: none; border-radius: 8px 0 0 8px; padding: 8px 8px; white-space: nowrap; }
    .url-input { flex: 1; min-width: 0; font-family: monospace; font-size: .8rem; padding: 8px 10px; border: 1px solid var(--border); border-radius: 0 8px 8px 0; background: var(--surface); color: var(--text); }

    textarea.body-editor { width: 100%; min-height: 120px; font-family: monospace; font-size: .8rem; padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--text); resize: vertical; box-sizing: border-box; }
    textarea.body-editor.bad { border-color: #ef4444; }
    .json-bad { font-size: .76rem; color: #ef4444; margin: 4px 0 0; }

    .toggle { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; font-size: .86rem; cursor: pointer; }
    .toggle input { margin-top: 2px; accent-color: #6366f1; }
    .toggle small { display: block; color: var(--text-muted); font-size: .76rem; margin-top: 2px; }
    .jwt-box { font-family: monospace; font-size: .68rem; word-break: break-all; background: var(--bg, rgba(127,127,127,.06)); border: 1px dashed var(--border); border-radius: 8px; padding: 8px 10px; margin-top: 6px; line-height: 1.6; }
    .jwt-h { color: #ef4444; } .jwt-p { color: #a855f7; } .jwt-s { color: #0ea5e9; }

    .hdr-inputs { display: flex; gap: 6px; margin-top: 4px; }
    .hdr-inputs input { flex: 1; min-width: 0; font-family: monospace; font-size: .78rem; padding: 7px 9px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--text); }

    .send-btn { width: 100%; margin-top: 18px; padding: 12px 0; background: #6366f1; color: #fff; border: none; border-radius: 12px; cursor: pointer; font-size: 1rem; font-weight: 700; letter-spacing: .02em; }
    .send-btn:disabled { opacity: .5; cursor: default; }

    .code-panel { margin-top: 14px; }
    .code-block { background: #1e1e2e; color: #cdd6f4; border-radius: 10px; padding: 12px 14px; font-size: .74rem; font-family: monospace; white-space: pre-wrap; overflow-x: auto; margin: 0; line-height: 1.55; }

    .steps { display: flex; flex-direction: column; gap: 10px; }
    .step { border: 1px solid var(--border); border-radius: 14px; background: var(--surface); overflow: hidden; transition: border-color .25s; }
    .step.active { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
    .step.done { border-color: rgba(34,197,94,.5); }
    .step.error { border-color: #ef4444; }
    .step-head { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; background: transparent; border: none; cursor: pointer; text-align: left; color: var(--text); font-size: .92rem; font-weight: 600; }
    .step-dot { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .7rem; font-weight: 700; flex-shrink: 0; border: 2px solid var(--border); color: var(--text-muted); }
    .step.active .step-dot { border-color: #6366f1; color: #6366f1; animation: pgpulse 1s infinite; }
    .step.done .step-dot { border-color: #22c55e; background: #22c55e; color: #fff; }
    .step.error .step-dot { border-color: #ef4444; background: #ef4444; color: #fff; }
    @keyframes pgpulse { 50% { transform: scale(1.15); } }
    .step-caret { margin-left: auto; font-size: .7rem; color: var(--text-muted); }
    .step-body { padding: 0 16px 14px 48px; }
    .blurb { font-size: .82rem; color: var(--text-muted); line-height: 1.6; margin: 0 0 10px; }

    table.hdrs { width: 100%; border-collapse: collapse; font-family: monospace; font-size: .74rem; margin: 6px 0; }
    table.hdrs td { padding: 4px 8px; border-bottom: 1px dashed var(--border); vertical-align: top; word-break: break-all; }
    table.hdrs td:first-child { color: #6366f1; white-space: nowrap; }
    tr.hdr-added td { background: rgba(34,197,94,.1); }
    tr.hdr-added td:first-child::before { content: '+ '; color: #16a34a; font-weight: 700; }

    .status-line { display: inline-block; font-family: monospace; font-size: .84rem; font-weight: 700; padding: 5px 12px; border-radius: 8px; margin: 2px 0 8px; }
    .status-line.ok { background: rgba(34,197,94,.12); color: #16a34a; }
    .status-line.no { background: rgba(239,68,68,.1); color: #dc2626; }
    .timing { font-size: .78rem; color: var(--text-muted); margin-left: 8px; }
    .note { font-size: .76rem; color: var(--text-muted); font-style: italic; margin: 8px 0 0; }
    .placeholder-msg { text-align: center; color: var(--text-muted); padding: 30px 20px; font-size: .9rem; }
    .flight-anim { font-family: monospace; font-size: .82rem; letter-spacing: .1em; color: #6366f1; }
  `],
  template: `
    <div class="pg-hero">
      <span class="pill">HTTP · Interceptors · Auth</span>
      <h1>API Playground</h1>
      <p>
        Build a real request, fire it at a live API, and dissect every step of
        the journey — the exact headers, bodies and objects at each stage, from
        <code>HttpClient</code> call to parsed response.
      </p>
    </div>

    <div class="layout">
      <!-- ======== builder ======== -->
      <div>
        <div class="panel">
          <h3>Presets</h3>
          <div class="chip-row">
            @for (preset of presets; track preset.label) {
              <button class="chip" [class.active]="activePreset() === preset.label" (click)="applyPreset(preset)">
                {{ preset.label }}
              </button>
            }
          </div>
          @if (presetNote()) { <p class="preset-note">{{ presetNote() }}</p> }

          <h3>Method</h3>
          <div class="chip-row">
            @for (m of methods; track m) {
              <button class="chip method-{{ m }}" [class.active]="method() === m" (click)="setMethod(m)">{{ m }}</button>
            }
          </div>

          <h3>URL</h3>
          <div class="url-row">
            <span class="url-base">{{ baseUrl }}</span>
            <input class="url-input" [value]="path()" (input)="path.set($any($event.target).value)" spellcheck="false" />
          </div>

          @if (hasBody()) {
            <h3>Request body (JSON)</h3>
            <textarea class="body-editor" [class.bad]="!bodyValid()" spellcheck="false"
              [value]="bodyText()" (input)="bodyText.set($any($event.target).value)"></textarea>
            @if (!bodyValid()) { <p class="json-bad">⚠ Not valid JSON — fix it before sending.</p> }
          }

          <h3>Auth</h3>
          <label class="toggle">
            <input type="checkbox" [checked]="authOn()" (change)="authOn.set($any($event.target).checked)" />
            <span>
              Attach <code>Authorization: Bearer &lt;JWT&gt;</code> via an interceptor
              <small>The token is structurally real — decoded below — but unsigned. The API ignores it; watch WHERE it gets attached in step 2.</small>
            </span>
          </label>
          @if (authOn()) {
            <div class="jwt-box">
              <span class="jwt-h">{{ jwtParts[0] }}</span>.<span class="jwt-p">{{ jwtParts[1] }}</span>.<span class="jwt-s">{{ jwtParts[2] }}</span>
            </div>
            <p class="note">Decoded payload: {{ jwtPayloadJson }}</p>
          }

          <h3>Custom header (optional)</h3>
          <div class="hdr-inputs">
            <input placeholder="X-Request-Id" [value]="customHeaderName()" (input)="customHeaderName.set($any($event.target).value)" spellcheck="false" />
            <input placeholder="demo-123" [value]="customHeaderValue()" (input)="customHeaderValue.set($any($event.target).value)" spellcheck="false" />
          </div>

          <h3>Step pacing</h3>
          <div class="chip-row">
            <button class="chip" [class.active]="!instant()" (click)="instant.set(false)">🐢 Guided (~2.5s per step)</button>
            <button class="chip" [class.active]="instant()" (click)="instant.set(true)">⚡ Instant</button>
          </div>

          <button class="send-btn" [disabled]="running() || (hasBody() && !bodyValid())" (click)="send()">
            {{ running() ? 'Request in flight…' : '🚀 Send request' }}
          </button>
        </div>

        <div class="panel code-panel">
          <h3>The same request in Angular</h3>
          <pre class="code-block">{{ generatedCode() }}</pre>
        </div>
      </div>

      <!-- ======== lifecycle ======== -->
      <div class="steps">
        @if (!started()) {
          <div class="panel placeholder-msg">
            Configure a request and hit <strong>Send</strong> — the six lifecycle
            steps will light up here with the real data at each stage.
          </div>
        }
        @for (meta of stepMeta; track $index) {
          @let state = stepState($index);
          <div class="step" [class.active]="state === 'active'" [class.done]="state === 'done'" [class.error]="state === 'error'">
            <button class="step-head" (click)="toggleExpand($index)" [disabled]="state === 'idle'">
              <span class="step-dot">{{ state === 'done' ? '✓' : state === 'error' ? '✗' : $index + 1 }}</span>
              {{ meta.title }}
              <span class="step-caret">{{ isExpanded($index) && state !== 'idle' ? '▲' : '▼' }}</span>
            </button>

            @if (isExpanded($index) && state !== 'idle') {
              <div class="step-body">
                <p class="blurb">{{ meta.blurb }}</p>

                @switch ($index) {
                  @case (0) {
                    <pre class="code-block">{{ requestObjectJson() }}</pre>
                    <p class="note">This object is frozen — every later change must clone it.</p>
                  }
                  @case (1) {
                    @if (authOn()) {
                      <p class="blurb" style="margin-bottom:4px"><strong>authInterceptor</strong> ran <code>req.clone(&#123; setHeaders: &#123; Authorization: … &#125; &#125;)</code>:</p>
                    } @else {
                      <p class="blurb" style="margin-bottom:4px">Auth is off — the interceptor passed the request through untouched. Toggle it on to see the clone.</p>
                    }
                    <table class="hdrs">
                      @for (h of finalHeaders(); track h.name) {
                        <tr [class.hdr-added]="h.added"><td>{{ h.name }}</td><td>{{ h.value }}</td></tr>
                      }
                    </table>
                  }
                  @case (2) {
                    <pre class="code-block">{{ wireMessage() }}</pre>
                  }
                  @case (3) {
                    @if (state === 'active') {
                      <p class="flight-anim">▸▸▸ bytes in transit ▸▸▸</p>
                    } @else {
                      <p class="blurb" style="margin:0">Round trip took <strong>{{ durationMs() }} ms</strong> — DNS, TLS, server work and transfer combined.</p>
                    }
                  }
                  @case (4) {
                    @if (status() !== null) {
                      <span class="status-line" [class.ok]="ok()" [class.no]="!ok()">HTTP {{ status() }} {{ statusText() }}</span>
                      <span class="timing">{{ durationMs() }} ms</span>
                      <table class="hdrs">
                        @for (h of responseHeaders(); track h.name) {
                          <tr><td>{{ h.name }}</td><td>{{ h.value }}</td></tr>
                        }
                      </table>
                      <p class="note">Only CORS-safelisted headers are visible to JavaScript on a cross-origin call — the server sent more than this.</p>
                    }
                  }
                  @case (5) {
                    @if (errorMessage()) {
                      <p class="blurb" style="margin-bottom:4px">
                        Non-2xx → the observable ERRORS instead of emitting. Your <code>catchError</code> / error callback receives an <code>HttpErrorResponse</code>:
                      </p>
                      <pre class="code-block">{{ errorMessage() }}</pre>
                    } @else {
                      <p class="blurb" style="margin-bottom:4px">{{ parsedSummary() }}</p>
                      <pre class="code-block">{{ rawBody() }}</pre>
                    }
                  }
                }
              </div>
            }
          </div>
        }

        @if (started() && !running()) {
          <div class="panel" style="text-align:center; padding: 14px;">
            <a routerLink="/http-basics" style="font-size:.84rem">📚 Study HTTP basics →</a>
            <a routerLink="/http-interceptors" style="font-size:.84rem; margin-left:16px">📚 Interceptors →</a>
            <a routerLink="/http-crud" style="font-size:.84rem; margin-left:16px">📚 CRUD patterns →</a>
          </div>
        }
      </div>
    </div>
  `,
})
export class ApiPlayground {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private destroyed = false;
  /** Increments per send so a stale run's timeouts stop advancing the UI. */
  private runToken = 0;

  readonly baseUrl = BASE_URL;
  readonly methods: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  readonly presets = PRESETS;
  readonly stepMeta = STEP_META;

  // --- builder state ---
  readonly method = signal<Method>('GET');
  readonly path = signal('/posts?_limit=5');
  readonly bodyText = signal(DEFAULT_BODY);
  readonly authOn = signal(false);
  readonly customHeaderName = signal('');
  readonly customHeaderValue = signal('');
  readonly activePreset = signal('GET list');
  /** ⚡ mode collapses the per-step pause for repeat runs. */
  readonly instant = signal(false);

  readonly hasBody = computed(() => ['POST', 'PUT', 'PATCH'].includes(this.method()));
  readonly bodyValid = computed(() => {
    if (!this.hasBody()) return true;
    try {
      JSON.parse(this.bodyText());
      return true;
    } catch {
      return false;
    }
  });
  readonly presetNote = computed(
    () => this.presets.find((p) => p.label === this.activePreset())?.note ?? '',
  );

  // --- the fake-but-structurally-real JWT ---
  readonly jwtParts: [string, string, string] = [
    b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    b64url(JSON.stringify(JWT_PAYLOAD)),
    'demo-signature-not-cryptographic',
  ];
  readonly jwtPayloadJson = JSON.stringify(JWT_PAYLOAD);
  private get jwt(): string {
    return this.jwtParts.join('.');
  }

  // --- lifecycle run state ---
  readonly started = signal(false);
  readonly running = signal(false);
  /** Index of the currently-active step; steps below it are done. */
  readonly currentStep = signal(-1);
  readonly failedAtStep = signal<number | null>(null);
  private readonly expanded = signal<Set<number>>(new Set());

  readonly finalHeaders = signal<HeaderRow[]>([]);
  readonly requestObjectJson = signal('');
  readonly wireMessage = signal('');
  readonly status = signal<number | null>(null);
  readonly statusText = signal('');
  readonly ok = signal(false);
  readonly responseHeaders = signal<HeaderRow[]>([]);
  readonly rawBody = signal('');
  readonly parsedSummary = signal('');
  readonly durationMs = signal(0);
  readonly errorMessage = signal('');

  constructor() {
    this.destroyRef.onDestroy(() => (this.destroyed = true));
  }

  // --- builder interactions ---
  applyPreset(preset: Preset): void {
    this.activePreset.set(preset.label);
    this.method.set(preset.method);
    this.path.set(preset.path);
  }

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

  readonly generatedCode = computed(() => {
    const method = this.method().toLowerCase();
    const genericType =
      this.method() === 'DELETE' ? '<void>' : /\/\d+/.test(this.path()) ? '<Post>' : '<Post[]>';
    const lines: string[] = [];
    if (this.authOn()) {
      lines.push(
        '// interceptor (registered once in app.config.ts):',
        'const authInterceptor: HttpInterceptorFn = (req, next) =>',
        "  next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));",
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

  // --- lifecycle helpers ---
  stepState(index: number): StepState {
    if (this.failedAtStep() !== null && index === this.failedAtStep()) return 'error';
    const current = this.currentStep();
    if (index < current) return 'done';
    if (index === current) return this.running() ? 'active' : 'done';
    return 'idle';
  }

  isExpanded(index: number): boolean {
    return this.expanded().has(index);
  }

  toggleExpand(index: number): void {
    this.expanded.update((set) => {
      const next = new Set(set);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  private expand(index: number): void {
    this.expanded.update((set) => new Set(set).add(index));
  }

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
    this.requestObjectJson.set(JSON.stringify(
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
    ));
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
      this.errorMessage.set(JSON.stringify(
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
      ));
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
