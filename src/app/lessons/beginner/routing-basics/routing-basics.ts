import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-lesson-routing-basics',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Routing</span>
      <h1>Routing Basics</h1>
      <p class="lead">
        The Angular Router maps URLs to components, enabling a single-page app to
        have many "pages" without full reloads. You define a route table, mark
        where components render with <code>&lt;router-outlet&gt;</code>, and link
        with <code>routerLink</code>.
      </p>

      <h2>1. Define the routes</h2>
      <div class="code">
        <pre>// app.routes.ts
export const routes: Routes = [
  {{ '{' }} path: '', component: HomeComponent {{ '}' }},
  {{ '{' }} path: 'about', component: AboutComponent {{ '}' }},
  {{ '{' }} path: 'users/:id', component: UserComponent {{ '}' }},   // route param
  {{ '{' }} path: '**', redirectTo: '' {{ '}' }},                    // wildcard / 404
];</pre>
      </div>

      <h2>2. Register the router</h2>
      <div class="code">
        <pre>// app.config.ts
export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [provideRouter(routes)],
{{ '}' }};</pre>
      </div>

      <h2>3. Place an outlet</h2>
      <p>The matched component renders wherever you put the outlet:</p>
      <div class="code">
        <pre>&lt;nav&gt;...&lt;/nav&gt;
&lt;router-outlet /&gt;   &lt;!-- routed component appears here --&gt;</pre>
      </div>

      <h2>4. Link with routerLink (not href)</h2>
      <p>
        <code>routerLink</code> navigates without reloading the page;
        <code>routerLinkActive</code> adds a class when the link's route is active.
        These links are live — they navigate this very app:
      </p>
      <div class="demo">
        <p class="demo__title">Live navigation</p>
        <div class="navdemo">
          <a routerLink="/signals" routerLinkActive="active">Signals</a>
          <a routerLink="/inputs" routerLinkActive="active">Inputs</a>
          <a routerLink="/pipes" routerLinkActive="active">Pipes</a>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
        </div>
      </div>

      <div class="code">
        <pre>&lt;a routerLink="/about" routerLinkActive="active"&gt;About&lt;/a&gt;
&lt;a [routerLink]="['/users', user.id]"&gt;Profile&lt;/a&gt;   &lt;!-- dynamic --&gt;</pre>
      </div>

      <div class="note">
        Use <code>[routerLinkActiveOptions]="{{ '{' }} exact: true {{ '}' }}"</code> on the
        home link so <code>/</code> is not marked active for every route (since every
        path starts with <code>/</code>).
      </div>

      <h2>Links with params, query & fragment</h2>
      <div class="code">
        <pre>&lt;a [routerLink]="['/users', id]"
   [queryParams]="{{ '{' }} tab: 'profile' {{ '}' }}"
   fragment="bio"&gt;Profile&lt;/a&gt;             // → /users/7?tab=profile#bio

&lt;a routerLink="../sibling"&gt;Up one&lt;/a&gt;   // relative to the current route</pre>
      </div>

      <h2>Programmatic navigation</h2>
      <div class="code">
        <pre>private router = inject(Router);
goToUser(id: number) {{ '{' }}
  this.router.navigate(['/users', id], {{ '{' }}
    queryParams: {{ '{' }} tab: 'profile' {{ '}' }},
    relativeTo: this.route,          // for relative navigation
  {{ '}' }});
{{ '}' }}
// or parse a string: this.router.navigateByUrl('/users/7?tab=profile');</pre>
      </div>
      <div class="note">
        Routes are matched <strong>top-to-bottom, first match wins</strong>, so put the
        wildcard <code>**</code> last and order specific paths before generic ones. Set
        per-route page titles with the <code>title</code> property, and provide a
        <code>TitleStrategy</code> to customise how they're applied.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Routes map a <code>path</code> to a <code>component</code> (or a lazy <code>loadComponent</code>).</li>
        <li><code>&lt;router-outlet&gt;</code> marks where the matched component renders.</li>
        <li><code>routerLink</code> navigates in-app; <code>routerLinkActive</code> highlights the current link.</li>
        <li><code>:param</code> declares a route parameter; <code>**</code> is the wildcard.</li>
        <li>Navigate from code with <code>Router.navigate()</code>.</li>
      </ul>
    </article>
  `,
  styles: [
    `
      .navdemo {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .navdemo a {
        padding: 8px 14px;
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text);
      }
      .navdemo a.active {
        background: var(--accent);
        border-color: var(--accent);
        color: #fff;
        text-decoration: none;
      }
    `,
  ],
})
export class RoutingBasics {}
