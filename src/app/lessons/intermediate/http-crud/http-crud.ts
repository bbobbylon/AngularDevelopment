import { JsonPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, catchError, of } from 'rxjs';

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
  imports: [RouterLink, JsonPipe],
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
}
