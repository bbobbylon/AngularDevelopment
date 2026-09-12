import { JsonPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, catchError, of } from 'rxjs';
import {
  BfPage,
  Bubbles,
  type BubbleTurn,
  Chapter,
  type ChapterStop,
  CodeLab,
  type CodeNote,
  Napkin,
} from '../../../shared/brain';
import {
  Compare,
  Faq,
  type FaqItem,
  Flow,
  type FlowStep,
  Predict,
  Quiz,
  type QuizOption,
  Remember,
} from '../../../shared/teaching';

/**
 * A post from the demo API. `id` is optional because a POST body does not carry
 * one — the server assigns it.
 */
interface Post {
  id?: number;
  title: string;
  body: string;
  userId: number;
}

const API = 'https://jsonplaceholder.typicode.com/posts';

/**
 * Lesson: HttpClient CRUD — every write verb (POST/PUT/PATCH/DELETE), request
 * options (params/headers/observe/responseType), a live demo that makes REAL
 * network calls against jsonplaceholder, and a second live demo that proves
 * HttpParams' immutability gotcha using nothing but a signal.
 */
@Component({
  selector: 'app-lesson-http-crud',
  imports: [
    RouterLink,
    JsonPipe,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './http-crud.css',
  templateUrl: './http-crud.html',
})
export class HttpCrud {
  /**
   * The HTTP client.
   */
  private readonly http = inject(HttpClient);

  /**
   * The last response, shown as JSON.
   */
  protected readonly response = signal<unknown>(null);
  /**
   * A label for the last request, so the panel says which verb produced what.
   */
  protected readonly action = signal('—');
  /**
   * Where the last request has got to.
   */
  protected readonly status = signal<'idle' | 'loading' | 'done'>('idle');
  /**
   * Whether the last request failed.
   */
  protected readonly isError = signal(false);

  /**
   * Runs a request and mirrors its outcome into the demo panel.
   *
   * One helper for all seven buttons: every verb differs only in the observable it
   * produces, and the loading/success/error handling around it is identical. That
   * sameness is itself the lesson — an HTTP verb is a parameter, not a code path.
   *
   * @param label Human-readable description of the request.
   * @param obs$  The request to run.
   */
  private run(label: string, obs$: Observable<unknown>) {
    this.action.set(label);
    this.status.set('loading');
    this.isError.set(false);
    obs$
      .pipe(
        catchError((err: HttpErrorResponse) => {
          this.isError.set(true);
          return of({ error: true, status: err.status, message: err.message || 'Request failed' });
        }),
      )
      .subscribe((res) => {
        this.response.set(res);
        this.status.set('done');
      });
  }

  /**
   * GET one record.
   */
  protected getOne() {
    this.run('GET /posts/1', this.http.get<Post>(`${API}/1`));
  }

  /**
   * GET with `observe: 'response'`, so the whole `HttpResponse` — status, headers
   * and body — comes through rather than just the body.
   */
  protected getFullResponse() {
    this.run(
      "GET /posts/1 (observe: 'response')",
      this.http.get<Post>(`${API}/1`, { observe: 'response' }),
    );
  }

  /**
   * POST a new record. No `id` in the body; the server assigns it.
   */
  protected create() {
    const body: Post = { title: 'My new post', body: 'Hello from the demo', userId: 1 };
    this.run('POST /posts', this.http.post<Post>(API, body));
  }

  /**
   * PUT a full replacement. Every field must be sent, since PUT means "make it
   * exactly this".
   */
  protected update() {
    const body: Post = { id: 1, title: 'Updated title', body: 'Edited via PUT', userId: 1 };
    this.run('PUT /posts/1', this.http.put<Post>(`${API}/1`, body));
  }

  /**
   * PATCH a partial update — the difference from PUT, shown by sending one field.
   */
  protected patch() {
    const body: Partial<Post> = { title: 'Patched title only' };
    this.run('PATCH /posts/1', this.http.patch<Post>(`${API}/1`, body));
  }

  /**
   * DELETE a record.
   */
  protected remove() {
    this.run('DELETE /posts/1', this.http.delete(`${API}/1`));
  }

  /**
   * Requests a record that does not exist, to exercise the error path. A real 404
   * from a real server rather than a simulated one.
   */
  protected forceError() {
    this.run('GET /posts/999999 (will 404)', this.http.get<Post>(`${API}/999999`));
  }

  // --- HttpErrorResponse anatomy demo (raw fields, not routed through run()) ---

  /**
   * The last `HttpErrorResponse`'s raw fields, shown as-is so the two failure
   * shapes below are visibly different, not summarised into one label.
   */
  protected readonly errorAnatomy = signal<{
    status: number;
    statusText: string;
    error: unknown;
    message: string;
  } | null>(null);

  /**
   * A request the server actually answered — with a real, non-2xx status.
   */
  protected showServerError() {
    this.http
      .get<Post>(`${API}/999999`)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          this.errorAnatomy.set({
            status: err.status,
            statusText: err.statusText,
            error: err.error,
            message: err.message,
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  /**
   * A request that never reaches a server at all — the host does not resolve.
   */
  protected showNetworkError() {
    this.http
      .get<Post>('https://this-host-does-not-exist.invalid/posts/1')
      .pipe(
        catchError((err: HttpErrorResponse) => {
          this.errorAnatomy.set({
            status: err.status,
            statusText: err.statusText,
            error: err.error,
            message: err.message,
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  // --- HttpParams immutability demo (no network — pure signal state) ---
  /**
   * The query parameters in the immutability demo.
   */
  protected readonly demoParams = signal(new HttpParams().set('userId', '1'));
  /**
   * Those parameters serialised, so the effect of an edit is visible.
   */
  protected readonly demoQuery = computed(() => this.demoParams().toString());
  /**
   * Whether the deliberately-wrong mutation has been attempted, so the demo can
   * point out that nothing happened.
   */
  protected readonly paramsAttemptedWrong = signal(false);

  /**
   * Demonstrates the `HttpParams` mistake: `set()` returns a **new** instance and
   * this discards it, so the parameters are unchanged. No error, no warning — the
   * sort order just silently never applies.
   */
  protected addParamWrong() {
    this.demoParams().set('sort', 'desc'); // return value discarded — nothing changes
    this.paramsAttemptedWrong.set(true);
  }

  /**
   * The correct form: take the returned instance and store it.
   */
  protected addParamRight() {
    this.demoParams.update((p) => p.set('sort', 'desc'));
  }

  /**
   * Resets the parameter demo.
   */
  protected resetParams() {
    this.demoParams.set(new HttpParams().set('userId', '1'));
    this.paramsAttemptedWrong.set(false);
  }

  /**
   * Sample: the verbs and their signatures side by side.
   */
  readonly verbsSample = `http.post<Post>(url, body)
http.put<Post>(\`\${url}/\${id}\`, body)
http.patch<Post>(\`\${url}/\${id}\`, partial)
http.delete<void>(\`\${url}/\${id}\`)

http.get<Post[]>(url, {
  params: new HttpParams().set('userId', 1),
  headers: { Authorization: 'Bearer …' },
})`;

  /**
   * Sample: this page's own `run` helper, so the demo's plumbing is not a black
   * box.
   */
  readonly demoSourceSample = `private run(label: string, obs$: Observable<unknown>) {
  this.action.set(label);      // drives the "last:" pill
  this.status.set('loading');  // drives the "status:" pill
  this.isError.set(false);     // clear any previous failure highlight

  obs$
    .pipe(
      catchError((err: HttpErrorResponse) => {
        this.isError.set(true);
        return of({ error: true, status: err.status, message: err.message });
      }),
    )
    .subscribe((res) => {
      this.response.set(res);  // renders as formatted JSON below
      this.status.set('done');
    });
}

protected getOne() {
  this.run('GET /posts/1', this.http.get<Post>(\`\${API}/1\`));
}`;

  /**
   * Sample: reading the right field depending on which failure shape arrived.
   */
  readonly errorAnatomySample = `catchError((err: HttpErrorResponse) => {
  if (err.status === 0) {
    // The request never reached a server — offline, DNS failure, CORS block,
    // timeout. err.error here is a client-side ProgressEvent or TypeError,
    // NOT anything a server sent. There is no server message to read.
    return of({ kind: 'network', detail: 'Could not reach the server' });
  }

  // The server DID respond — err.status is its real HTTP status code, and
  // err.error is the response BODY (parsed as JSON when possible).
  return of({ kind: 'server', status: err.status, body: err.error });
})`;

  /**
   * Sample: the `HttpParams` immutability trap and its fix.
   */
  readonly paramsImmutableSample = `// WRONG — set() returns a NEW HttpParams; the return value is discarded here
this.demoParams().set('sort', 'desc');

// RIGHT — signal.update() writes the callback's return value back in
this.demoParams.update((p) => p.set('sort', 'desc'));

// the same fix, spelled out without .update()'s sugar:
this.demoParams.set(this.demoParams().set('sort', 'desc'));`;

  /**
   * Sample: typed options — `observe`, `responseType`, `params` and `headers`.
   */
  readonly typedOptionsSample = `// observe the full response (status, headers), not just the body:
http.get<Post>(url, { observe: 'response' })
   .subscribe((res) => { res.status; res.headers; res.body; });

// responseType for non-JSON (plain text, blob, arraybuffer):
http.get(url, { responseType: 'text' });

// the two options combine freely:
http.get(url, { observe: 'response', responseType: 'text' });`;

  /**
   * Compare panel: PUT's full-replacement body.
   */
  readonly putBodySample = `http.put(url, {
  id: 1,
  title: 'New title',
  body: 'body',
  userId: 1,
});
// every field must be resent`;

  /**
   * Compare panel: PATCH's partial body.
   */
  readonly patchBodySample = `http.patch(url, {
  title: 'New title',
});
// only the changed field`;

  // ── brain-friendly content ──

  /**
   * Chapter rail: this lesson's HTTP track. Only one same-level sibling exists
   * in the curriculum, so the rail is thin — but `Chapter.showRail` only needs
   * more than one stop, and two clears that.
   */
  readonly stops: ChapterStop[] = [
    { label: 'HttpClient CRUD' },
    { label: 'HTTP Interceptors', id: 'http-interceptors' },
    { label: 'httpResource()', id: 'http-resource' },
  ];

  /**
   * Bridge dialogue: why the "wrong way" button in the params demo does
   * nothing, tied to the same immutability rule as a JS string.
   */
  readonly bridgeTalk: BubbleTurn[] = [
    {
      who: 'You',
      says: "I called `demoParams().set('sort', 'desc')` right before rendering. Why didn't the URL change?",
    },
    {
      who: 'HttpParams',
      says: "I didn't change. `.set()` never mutates me — it always hands back a *new* `HttpParams` and leaves the original exactly as it was.",
    },
    { who: 'You', says: 'So the new one I just built… vanished?' },
    {
      who: 'HttpParams',
      says: "Since nothing captured it, yes. Same rule as a string — `'abc'.toUpperCase()` doesn't touch `'abc'`, it hands you back `'ABC'` to keep.",
    },
    { who: 'You', says: 'So I need to write the result back somewhere.' },
    {
      who: 'HttpParams',
      says: "Exactly — `signal.update(p => p.set(...))` takes whatever I return and stores it. That's the entire fix.",
    },
  ];

  /**
   * Line-by-line notes for `verbsSample`.
   */
  readonly verbsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'POST creates a new resource. body is a plain positional arg (Angular JSON-serializes it), and <Post> types what the server returns — not what you sent.',
    },
    {
      line: 2,
      text: 'PUT replaces the whole resource. The id lives in the URL, never the body — omit a field here and the server can wipe it.',
    },
    {
      line: 3,
      text: 'PATCH sends only the changed fields; the server merges them in. The safe choice for "update one field."',
    },
    { line: 4, text: 'DELETE takes no body at all — the URL alone identifies what to remove.' },
    {
      line: 6,
      text: 'GET (and DELETE) have no body argument, so options slides into the 2nd parameter slot instead of the 3rd.',
    },
    {
      line: 7,
      text: 'HttpParams builds the query string for you. Its immutability gotcha gets a live demo — and its own bug — two sections down.',
    },
    {
      line: 8,
      text: 'A header set here applies to this call only. One every request needs belongs in an interceptor, not here.',
    },
  ];

  /**
   * Line-by-line notes for `demoSourceSample`.
   */
  readonly demoSourceNotes: CodeNote[] = [
    {
      line: 1,
      text: 'One helper takes any verb’s Observable as a parameter — the loading/error bookkeeping only has to be written once.',
    },
    {
      line: 4,
      text: "Resetting isError up front means a fresh request doesn't still show the previous request's failure pill while this one's in flight.",
    },
    {
      line: 8,
      text: 'catchError intercepts the error channel — the only place a non-2xx response shows up, since HttpClient never throws synchronously.',
    },
    {
      line: 10,
      text: 'of({ ... }) returns a replacement Observable, so the pipeline completes normally with a fallback value instead of propagating the error and killing the subscription.',
    },
    {
      line: 13,
      text: "One subscribe callback handles both the real success value and catchError's fallback — both now arrive on the same next channel.",
    },
    {
      line: 20,
      text: "A caller method's whole job: build the request, hand it to run() with a label. No per-verb loading/error logic.",
    },
  ];

  /**
   * Line-by-line notes for `errorAnatomySample`.
   */
  readonly errorAnatomyNotes: CodeNote[] = [
    {
      line: 2,
      text: 'status === 0 means the request never got far enough for any server to answer — it is not a status code any server sent.',
    },
    {
      line: 5,
      text: 'err.error in this branch is a client-side object (a ProgressEvent under XHR, a TypeError under fetch) — reading it as a parsed server payload is the bug this section warns about.',
    },
    {
      line: 11,
      text: 'Once status is a real HTTP code, err.error is finally the response BODY — parsed as JSON automatically when the Content-Type says so.',
    },
  ];

  /**
   * Line-by-line notes for `paramsImmutableSample`.
   */
  readonly paramsImmutableNotes: CodeNote[] = [
    {
      line: 2,
      text: 'demoParams() reads the current value and calls .set() on it — but .set() returns a new HttpParams instead of mutating, and nothing catches it here.',
    },
    {
      line: 5,
      text: 'update() calls the callback with the current value and stores whatever it returns — precisely the "build new, then store" step .set() needs.',
    },
    {
      line: 8,
      text: 'The same fix by hand, no sugar: read the params, .set() to get a new instance, then signal.set() that instance back in.',
    },
  ];

  /**
   * Line-by-line notes for `typedOptionsSample`.
   */
  readonly typedOptionsNotes: CodeNote[] = [
    {
      line: 2,
      text: "observe: 'response' changes what the Observable emits — a full HttpResponse wrapper instead of the bare decoded body.",
    },
    {
      line: 3,
      text: 'res.body is now the parsed JSON that get<Post>() used to hand you directly; res.status and res.headers ride along beside it.',
    },
    {
      line: 6,
      text: "responseType tells HttpClient how to parse the wire. 'text' skips JSON.parse entirely — needed for non-JSON payloads.",
    },
    {
      line: 9,
      text: 'The two options are independent and compose freely: full envelope and raw text body in one call.',
    },
  ];

  /**
   * The request pipeline, as a visual flow — matches "Under the hood" below.
   */
  readonly requestFlow: FlowStep[] = [
    {
      label: 'http.get(...) is called',
      detail: 'Nothing is sent yet — this only builds a description of the request',
      tone: 'default',
    },
    {
      label: '.subscribe()',
      detail: 'This is what actually fires the network call',
      tone: 'accent',
    },
    {
      label: 'Interceptor chain',
      detail: 'Auth headers, logging, retries — in registration order',
      tone: 'default',
    },
    { label: 'Real backend', detail: 'jsonplaceholder.typicode.com', tone: 'default' },
    {
      label: 'One value, then complete — or an error',
      detail:
        'Success emits once and closes; failure arrives on the error channel, never a thrown exception',
      tone: 'warn',
    },
  ];

  /**
   * Self-test: PUT vs PATCH.
   */
  readonly verbQuizOptions: QuizOption[] = [
    {
      text: 'PUT, sending just the one field that changed',
      why: 'PUT means "replace the whole resource." Sending only one field can wipe out every field you omitted, server-side.',
    },
    {
      text: 'PATCH, sending only the field(s) that changed',
      correct: true,
      why: 'PATCH means "apply a partial update" — the server merges what you send into the record that already exists.',
    },
    {
      text: 'Either verb — HttpClient normalizes the request either way',
      why: 'HttpClient never rewrites your verb or your body. You choose PUT or PATCH; the server trusts whichever semantics you claim.',
    },
  ];

  /**
   * Exam-corner questions, ported from the original detail/summary blocks.
   */
  readonly questions: FaqItem[] = [
    {
      q: "Why did params.set('page', 2) not change the URL?",
      a: 'HttpParams is immutable — set() returns a new instance you must assign or pass on. The original is unchanged. (This is the exact bug the live demo above walks through.)',
    },
    {
      q: 'PUT or PATCH to change one field?',
      a: 'PATCH — it sends only that field. PUT replaces the entire resource, so any field you omit may be cleared.',
    },
    {
      q: 'How do you read response headers or status, not just the body?',
      a: "Pass { observe: 'response' } — you get the full HttpResponse, with status, headers and body all together.",
    },
    {
      q: 'A component throws "NullInjectorError: No provider for HttpClient" at startup. What’s missing, and why doesn’t it show up as a network error instead?',
      a: 'provideHttpClient() was never added to the app’s providers. Dependency injection resolves at construction time — before any request is ever made — so the failure is a wiring error, not a runtime network failure.',
    },
    {
      q: 'Why does a failed HTTP call need catchError instead of a try/catch around subscribe()?',
      a: 'HttpClient methods never throw synchronously — a non-2xx response is delivered as an error notification on the Observable, not a thrown exception. A try/catch around .subscribe(...) would never see it; you need catchError in the pipe, or the error callback passed to subscribe.',
    },
  ];
}
