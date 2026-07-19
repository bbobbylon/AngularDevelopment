import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

interface Post {
  id: number;
  title: string;
  body: string;
}

@Component({
  selector: 'app-lesson-http-basics',
  imports: [RouterLink],
  styles: [
    `
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · HTTP</span>
      <h1>HttpClient Basics</h1>
      <p class="lead">
        <code>HttpClient</code> is Angular's typed wrapper over the browser's
        fetch/XHR. It returns RxJS <strong>Observables</strong>, integrates with
        interceptors, and gives you typed responses.
      </p>

      <h2>1. Provide it once</h2>
      <div class="code">
        <pre>// app.config.ts
providers: [provideHttpClient(withFetch())]</pre>
      </div>

      <h2>2. Inject & request</h2>
      <div class="code">
        <pre>private http = inject(HttpClient);

load() &#123;
  this.http.get&lt;Post[]&gt;('https://jsonplaceholder.typicode.com/posts')
    .subscribe(posts =&gt; this.posts.set(posts));
&#125;</pre>
      </div>

      <h2>Try it — a real GET request</h2>
      <div class="demo">
        <p class="demo__title">Live (calls jsonplaceholder.typicode.com)</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="load()" [disabled]="state() === 'loading'">
            {{ state() === 'loading' ? 'Loading…' : 'Fetch 5 posts' }}
          </button>
          <span class="pill">state: {{ state() }}</span>
        </div>

        @switch (state()) {
          @case ('error') {
            <p style="color:var(--accent)">Request failed (are you online?).</p>
          }
          @case ('done') {
            <ul>
              @for (post of posts(); track post.id) {
                <li><strong>{{ post.title }}</strong></li>
              }
            </ul>
          }
          @default {
            <p style="color:var(--text-muted)">Press the button to load data.</p>
          }
        }
      </div>

      <div class="note">
        <code>http.get()</code> is <strong>lazy</strong>: nothing happens until you
        <code>subscribe()</code> (or use the <code>async</code> pipe / <code>toSignal</code>).
        Each subscription fires a new request.
      </div>

      <h2>The verbs</h2>
      <div class="code">
        <pre>http.get&lt;T&gt;(url, &#123; params, headers &#125;)
http.post&lt;T&gt;(url, body)
http.put&lt;T&gt;(url, body)
http.patch&lt;T&gt;(url, body)
http.delete&lt;T&gt;(url)</pre>
      </div>

      <h2>Handling errors</h2>
      <div class="code">
        <pre>this.http.get&lt;Post[]&gt;(url).pipe(
  catchError(err =&gt; &#123; console.error(err); return of([]); &#125;)
).subscribe(...)</pre>
      </div>
      <p>
        The error is an <code>HttpErrorResponse</code> with <code>status</code>,
        <code>message</code> and the parsed <code>error</code> body — branch on
        <code>err.status</code> to handle 401/404/500 differently.
      </p>

      <h2>Bridging to signals & cancellation</h2>
      <div class="code">
        <pre>// turn the Observable into a signal (auto-subscribes & cleans up):
posts = toSignal(this.http.get&lt;Post[]&gt;(url), &#123; initialValue: [] &#125;);

// switchMap cancels the previous request when a new one starts (typeahead):
results$ = this.query$.pipe(switchMap(q =&gt; this.http.get(&#96;/search?q=&#36;&#123;q&#125;&#96;)));</pre>
      </div>
      <p>
        Because requests are Observables, unsubscribing <strong>cancels</strong> the
        in-flight HTTP call (with <code>withFetch()</code>, via <code>AbortController</code>)
        — no wasted responses. The <code>async</code> pipe and <code>toSignal</code>
        unsubscribe for you.
      </p>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Forgetting to subscribe.</strong> <code>http.get()</code> is a <em>cold</em>
          Observable — no request fires until <code>subscribe()</code>, the <code>async</code>
          pipe, or <code>toSignal</code>.</li>
        <li><strong>Subscribing multiple times.</strong> Each subscription is a new HTTP call.
          Share with <code>toSignal</code>/<code>async</code> or <code>shareReplay</code>.</li>
        <li><strong>Manual subscriptions that leak.</strong> A hand-rolled
          <code>.subscribe()</code> should be cleaned up (<code>takeUntilDestroyed()</code>);
          <code>async</code>/<code>toSignal</code> do it for you.</li>
        <li><strong>Swallowing errors.</strong> <code>catchError</code> that returns a value
          hides failures — branch on <code>err.status</code> and surface real problems.</li>
        <li><strong>Not typing the response.</strong> <code>get&lt;Post[]&gt;()</code> gives you
          compile-time safety; <code>get()</code> returns <code>Object</code>.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Nothing happens when I call <code>http.get()</code>. Why?</summary>
        <div>It returns a cold Observable — it only runs on <code>subscribe()</code> (or via the
        <code>async</code> pipe / <code>toSignal</code>).</div>
      </details>
      <details class="qa">
        <summary>How do you cancel an in-flight request?</summary>
        <div>Unsubscribe — with <code>withFetch()</code> it aborts via <code>AbortController</code>.
        <code>switchMap</code> does this automatically for typeaheads;
        <code>async</code>/<code>toSignal</code> unsubscribe on destroy.</div>
      </details>
      <details class="qa">
        <summary>What type is the error in <code>catchError</code>?</summary>
        <div>An <code>HttpErrorResponse</code> with <code>status</code>, <code>message</code>, and
        the parsed <code>error</code> body. Branch on <code>status</code> for 401/404/500.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Provide once with <code>provideHttpClient()</code>; inject <code>HttpClient</code>.</li>
        <li>Methods return cold Observables — subscribe (or async pipe) to trigger them.</li>
        <li>Type the response with the generic: <code>get&lt;Post[]&gt;()</code>.</li>
        <li>Handle failures with the RxJS <code>catchError</code> operator.</li>
      </ul>

      <p><a routerLink="/template-forms">Next: Template-Driven Forms →</a></p>
    </article>
  `,
})
export class HttpBasics {
  private readonly http = inject(HttpClient);
  protected readonly posts = signal<Post[]>([]);
  protected readonly state = signal<'idle' | 'loading' | 'done' | 'error'>('idle');

  protected load() {
    this.state.set('loading');
    this.http
      .get<Post[]>('https://jsonplaceholder.typicode.com/posts')
      .pipe(catchError(() => of<Post[] | null>(null)))
      .subscribe((posts) => {
        if (posts === null) {
          this.state.set('error');
          return;
        }
        this.posts.set(posts.slice(0, 5));
        this.state.set('done');
      });
  }
}
