import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-resolvers',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Routing</span>
      <h1>Resolvers & Route Data</h1>
      <p class="lead">
        A resolver fetches data <em>before</em> a route activates, so the component
        renders with its data already present — no loading flicker. Static
        <code>data</code> attaches fixed values to a route.
      </p>

      <h2>A functional resolver</h2>
      <div class="code">
        <pre>export const userResolver: ResolveFn&lt;User&gt; = (route) =&gt; {{ '{' }}
  const api = inject(UserApi);
  return api.getById(route.paramMap.get('id')!);   // Observable&lt;User&gt;
{{ '}' }};

// route:
{{ '{' }} path: 'users/:id', component: UserPage, resolve: {{ '{' }} user: userResolver {{ '}' }} {{ '}' }}</pre>
      </div>

      <h2>Reading resolved data</h2>
      <div class="code">
        <pre>// option A: from the snapshot
private route = inject(ActivatedRoute);
user = this.route.snapshot.data['user'] as User;

// option B: with component input binding (withComponentInputBinding())
user = input&lt;User&gt;();   // matched by the resolve key name 'user'</pre>
      </div>
      <div class="tip">
        With <code>provideRouter(routes, withComponentInputBinding())</code> (enabled
        in this app), resolved data, path params and query params are bound directly
        to matching component <code>input()</code>s — no <code>ActivatedRoute</code>
        plumbing.
      </div>

      <h2>Static route data</h2>
      <div class="code">
        <pre>{{ '{' }} path: 'admin', component: Admin, data: {{ '{' }} roles: ['admin'], title: 'Admin' {{ '}' }} {{ '}' }}

// read it the same way:
this.route.snapshot.data['roles'];</pre>
      </div>

      <h2>Title strategy</h2>
      <div class="code">
        <pre>{{ '{' }} path: 'about', component: About, title: 'About us' {{ '}' }}
// or a dynamic ResolveFn&lt;string&gt; as the title, or a custom TitleStrategy</pre>
      </div>
      <p>
        The router sets <code>document.title</code> for you from the route's
        <code>title</code> — this app uses that for every lesson page.
      </p>

      <div class="warn">
        Resolvers delay navigation until they complete, so keep them fast and handle
        errors (return an empty value or redirect). For slow data, prefer rendering
        the route immediately and loading inside the component (e.g. with
        <code>resource()</code>) so the UI stays responsive. By default a resolver
        re-runs only when the matched params change; tune that with the route's
        <code>runGuardsAndResolvers</code> option (e.g. <code>'always'</code>). An
        Observable resolver should <strong>complete</strong> (use <code>first()</code>) or
        navigation hangs waiting for it.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>A resolver (<code>ResolveFn&lt;T&gt;</code>) pre-fetches data before activation.</li>
        <li>Read it via <code>route.data</code> or bound inputs with <code>withComponentInputBinding()</code>.</li>
        <li>Static <code>data</code> attaches fixed metadata (roles, flags) to routes.</li>
        <li><code>title</code> drives the document title automatically.</li>
      </ul>

      <p><a routerLink="/route-params">Next: Route &amp; Query Parameters →</a></p>
    </article>
  `,
})
export class Resolvers {}
