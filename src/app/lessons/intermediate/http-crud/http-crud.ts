import { JsonPipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

interface Post {
  id?: number;
  title: string;
  body: string;
  userId: number;
}

const API = 'https://jsonplaceholder.typicode.com/posts';

@Component({
  selector: 'app-lesson-http-crud',
  imports: [RouterLink, JsonPipe],
  styles: [
    `
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · HTTP</span>
      <h1>HttpClient CRUD</h1>
      <p class="lead">
        Beyond GET, <code>HttpClient</code> handles POST/PUT/PATCH/DELETE, request
        bodies, headers, query params and typed responses. (jsonplaceholder fakes
        writes and echoes them back, so the demos below "work" without a real DB.)
      </p>

      <h2>The verbs with bodies, params & headers</h2>
      <div class="code">
        <pre>http.post&lt;Post&gt;(url, body)
http.put&lt;Post&gt;(\`\${{ '{' }}url{{ '}' }}/\${{ '{' }}id{{ '}' }}\`, body)
http.patch&lt;Post&gt;(\`\${{ '{' }}url{{ '}' }}/\${{ '{' }}id{{ '}' }}\`, partial)
http.delete&lt;void&gt;(\`\${{ '{' }}url{{ '}' }}/\${{ '{' }}id{{ '}' }}\`)

http.get&lt;Post[]&gt;(url, {{ '{' }}
  params: new HttpParams().set('userId', 1),
  headers: {{ '{' }} Authorization: 'Bearer …' {{ '}' }},
{{ '}' }})</pre>
      </div>

      <h2>Try it</h2>
      <div class="demo">
        <p class="demo__title">Live — real network calls</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="getOne()">GET /posts/1</button>
          <button (click)="create()">POST new</button>
          <button (click)="update()">PUT /posts/1</button>
          <button class="ghost" (click)="remove()">DELETE /posts/1</button>
        </div>
        <p class="row"><span class="pill">last: {{ action() }}</span><span class="pill">status: {{ status() }}</span></p>
        @if (response()) {
          <div class="code"><pre>{{ response() | json }}</pre></div>
        }
      </div>

      <h2>Typed responses & options</h2>
      <div class="code">
        <pre>// observe the full response (status, headers), not just the body:
http.get&lt;Post&gt;(url, {{ '{' }} observe: 'response' {{ '}' }})
   .subscribe(res =&gt; res.status, res.headers, res.body);

// responseType for non-JSON:
http.get(url, {{ '{' }} responseType: 'text' {{ '}' }});</pre>
      </div>

      <div class="tip">
        Build query strings with <code>HttpParams</code> (immutable — each
        <code>set</code> returns a new instance). Set headers with
        <code>HttpHeaders</code> or a plain object. Cross-cutting headers (auth)
        belong in an interceptor, not every call.
      </div>
      <div class="note">
        Other useful options: <code>withCredentials: true</code> sends cookies
        cross-origin; <code>reportProgress: true</code> with
        <code>observe: 'events'</code> streams upload/download progress; and operators
        like <code>retry({{ '{' }} count: 2 {{ '}' }})</code> and
        <code>timeout(5000)</code> add resilience. Because the result is an Observable,
        nothing is sent until you subscribe — and unsubscribing aborts the request.
      </div>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong><code>HttpParams</code> is immutable.</strong> <code>set()</code>/<code>append()</code>
          return a <em>new</em> instance — <code>params.set('a', 1)</code> alone does nothing;
          reassign it.</li>
        <li><strong>PUT vs PATCH.</strong> PUT replaces the whole resource; PATCH sends only the
          changed fields. Sending a partial body with PUT can wipe omitted fields.</li>
        <li><strong>Body vs options argument order.</strong> Write verbs take
          <code>(url, body, options)</code>; GET/DELETE take <code>(url, options)</code> — easy
          to pass options where the body goes.</li>
        <li><strong>No error handling on writes.</strong> A failed POST/PUT should surface;
          <code>catchError</code> that quietly returns a fake value hides data loss.</li>
        <li><strong>Per-call auth headers.</strong> Cross-cutting headers belong in an
          interceptor, not repeated at every call site.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why did <code>params.set('page', 2)</code> not change the URL?</summary>
        <div><code>HttpParams</code> is immutable — <code>set</code> returns a new instance you
        must assign/pass. The original is unchanged.</div>
      </details>
      <details class="qa">
        <summary>PUT or PATCH to change one field?</summary>
        <div>PATCH — it sends only that field. PUT replaces the entire resource, so omitted
        fields may be cleared.</div>
      </details>
      <details class="qa">
        <summary>How do you read response headers or status, not just the body?</summary>
        <div>Pass <code>&#123; observe: 'response' &#125;</code> — you get the full
        <code>HttpResponse</code> with <code>status</code>, <code>headers</code> and
        <code>body</code>.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Each verb is one method; pass a body for write operations.</li>
        <li>Type responses with the generic; use <code>observe: 'response'</code> for headers/status.</li>
        <li>Use <code>HttpParams</code>/<code>HttpHeaders</code> for query strings &amp; headers.</li>
        <li>Always handle errors (<code>catchError</code>) on write operations.</li>
      </ul>

      <p><a routerLink="/http-interceptors">Next: HTTP Interceptors →</a></p>
    </article>
  `,
})
export class HttpCrud {
  private readonly http = inject(HttpClient);
  protected readonly response = signal<unknown>(null);
  protected readonly action = signal('—');
  protected readonly status = signal('idle');

  private run(label: string, obs$: ReturnType<HttpClient['get']>) {
    this.action.set(label);
    this.status.set('loading');
    obs$.pipe(catchError((e) => of({ error: e.message ?? 'failed' }))).subscribe((res) => {
      this.response.set(res);
      this.status.set('done');
    });
  }

  protected getOne() {
    this.run('GET /posts/1', this.http.get<Post>(`${API}/1`));
  }

  protected create() {
    const body: Post = { title: 'My new post', body: 'Hello', userId: 1 };
    this.run('POST /posts', this.http.post<Post>(API, body));
  }

  protected update() {
    const body: Post = { id: 1, title: 'Updated title', body: 'Edited', userId: 1 };
    this.run('PUT /posts/1', this.http.put<Post>(`${API}/1`, body));
  }

  protected remove() {
    this.run('DELETE /posts/1', this.http.delete(`${API}/1`));
    void new HttpParams(); // referenced for the docs example above
  }
}
