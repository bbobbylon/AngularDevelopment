import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-router-children-lazy',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Routing</span>
      <h1>Child Routes & Lazy Loading</h1>
      <p class="lead">
        Real apps nest routes and split code so the browser only downloads a feature
        when the user visits it. Child routes render into a nested
        <code>&lt;router-outlet&gt;</code>; lazy loading defers the code.
      </p>

      <h2>Child routes & nested outlets</h2>
      <div class="code">
        <pre>const routes: Routes = [
  {{ '{' }}
    path: 'settings',
    component: SettingsShell,        // has its own &lt;router-outlet&gt;
    children: [
      {{ '{' }} path: '', redirectTo: 'profile', pathMatch: 'full' {{ '}' }},
      {{ '{' }} path: 'profile', component: ProfileTab {{ '}' }},
      {{ '{' }} path: 'security', component: SecurityTab {{ '}' }},
    ],
  {{ '}' }},
];</pre>
      </div>
      <p>
        <code>SettingsShell</code>'s template places a second
        <code>&lt;router-outlet&gt;</code> where <code>ProfileTab</code>/<code>SecurityTab</code>
        render — that is the nested outlet.
      </p>

      <h2>Lazy loading a component</h2>
      <div class="code">
        <pre>{{ '{' }}
  path: 'admin',
  loadComponent: () =&gt; import('./admin/admin').then(m =&gt; m.Admin),
{{ '}' }}</pre>
      </div>
      <p>
        The <code>admin</code> chunk is built separately and fetched on first
        navigation. <strong>This entire tutorial app uses exactly this pattern</strong>
        — every lesson is its own lazy chunk.
      </p>

      <h2>Lazy loading a group of routes</h2>
      <div class="code">
        <pre>{{ '{' }}
  path: 'shop',
  loadChildren: () =&gt; import('./shop/shop.routes').then(m =&gt; m.SHOP_ROUTES),
{{ '}' }}

// shop.routes.ts
export const SHOP_ROUTES: Routes = [
  {{ '{' }} path: '', component: ShopHome {{ '}' }},
  {{ '{' }} path: ':id', component: ProductPage {{ '}' }},
];</pre>
      </div>

      <h2>Route-scoped providers</h2>
      <div class="code">
        <pre>{{ '{' }}
  path: 'shop',
  providers: [ShopApi],          // a service scoped to this feature
  loadChildren: () =&gt; import('./shop/shop.routes').then(m =&gt; m.SHOP_ROUTES),
{{ '}' }}</pre>
      </div>

      <h2>Preloading strategies</h2>
      <div class="code">
        <pre>provideRouter(routes, withPreloading(PreloadAllModules));</pre>
      </div>
      <p>
        Lazy chunks load on demand by default. A preloading strategy fetches them in
        the background after the app boots, so navigation feels instant without
        bloating the initial bundle.
      </p>

      <div class="note">
        <strong>pathMatch:</strong> an empty-path redirect needs
        <code>pathMatch: 'full'</code> so it matches only the exact empty URL — the
        default <code>'prefix'</code> matches every path and would create a redirect
        loop. For finer control, <code>withPreloading</code> accepts a custom strategy
        (e.g. preload only routes flagged <code>data: {{ '{' }} preload: true {{ '}' }}</code>),
        and <code>loadChildren</code> can point at a file whose <strong>default
        export</strong> is the <code>Routes</code> array.
      </div>

      <div class="tip">
        Lazy loading is the #1 lever for a small initial bundle. Split by feature
        (route) and keep the eagerly-loaded shell tiny. For below-the-fold pieces
        <em>within</em> a page, reach for <code>&#64;defer</code> instead of a route.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>children</code> + a nested <code>&lt;router-outlet&gt;</code> build layered UIs.</li>
        <li><code>loadComponent</code> lazy-loads one component; <code>loadChildren</code> a route group.</li>
        <li>Route <code>providers</code> scope services to a feature.</li>
        <li><code>withPreloading</code> warms lazy chunks in the background.</li>
      </ul>

      <p><a routerLink="/route-guards">Next: Functional Route Guards →</a></p>
    </article>
  `,
})
export class RouterChildrenLazy {}
