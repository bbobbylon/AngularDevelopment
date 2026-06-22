import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface User {
  name: string;
  role: 'admin' | 'member';
}

@Component({
  selector: 'app-lesson-control-flow-if',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Control Flow</span>
      <h1>Control Flow: &#64;if / &#64;else</h1>
      <p class="lead">
        The built-in <code>&#64;if</code> block conditionally includes part of a
        template. It replaced the older <code>*ngIf</code> directive and needs no
        imports — it is part of the template language itself.
      </p>

      <h2>&#64;if, &#64;else if, &#64;else</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:14px">
          <button (click)="logIn('admin')">Log in as admin</button>
          <button (click)="logIn('member')">Log in as member</button>
          <button class="ghost" (click)="user.set(null)">Log out</button>
        </div>

        @if (user(); as u) {
          <p>✅ Welcome back, <strong>{{ u.name }}</strong>.</p>
          @if (u.role === 'admin') {
            <p class="pill">You have admin privileges.</p>
          } @else {
            <p class="pill">Standard member access.</p>
          }
        } @else {
          <p>👋 Please log in to continue.</p>
        }
      </div>

      <div class="code">
        <pre>&#64;if (user(); as u) {{ '{' }}
  &lt;p&gt;Welcome, {{ '{{' }} u.name {{ '}}' }}&lt;/p&gt;
{{ '}' }} &#64;else if (loading()) {{ '{' }}
  &lt;p&gt;Loading…&lt;/p&gt;
{{ '}' }} &#64;else {{ '{' }}
  &lt;p&gt;Please log in&lt;/p&gt;
{{ '}' }}</pre>
      </div>

      <h2>The <code>as</code> alias</h2>
      <p>
        <code>&#64;if (expr; as name)</code> stores the (truthy) result in a local
        template variable. This is perfect for narrowing nullable values: inside
        the block, <code>u</code> is guaranteed to be a non-null <code>User</code>.
      </p>

      <p>
        The <code>as</code> alias shines with the <code>async</code> pipe — unwrap an
        Observable once and reuse the value (and narrow away <code>null</code>):
      </p>
      <div class="code">
        <pre>&#64;if (user$ | async; as user) {{ '{' }}
  &lt;h2&gt;{{ '{{' }} user.name {{ '}}' }}&lt;/h2&gt;   &lt;!-- user is non-null here --&gt;
{{ '}' }}</pre>
      </div>

      <div class="tip">
        Unlike <code>*ngIf</code>, the new control flow is <strong>built in</strong>:
        nothing to import, better type-narrowing, and it is faster. There is an
        automatic migration: <code>ng generate &#64;angular/core:control-flow</code>.
        Note there's no <code>else</code>-without-<code>if</code> by itself — use
        <code>&#64;if (cond) {{ '{' }} … {{ '}' }} &#64;else {{ '{' }} … {{ '}' }}</code>.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&#64;if</code> / <code>&#64;else if</code> / <code>&#64;else</code> handle conditionals.</li>
        <li>It is part of the template syntax — no <code>CommonModule</code> import.</li>
        <li><code>; as alias</code> captures and narrows the condition's value.</li>
        <li>Content in a false branch is fully removed from the DOM.</li>
      </ul>

      <p><a routerLink="/control-flow-for">Next: Control Flow — &#64;for →</a></p>
    </article>
  `,
})
export class ControlFlowIf {
  protected readonly user = signal<User | null>(null);

  protected logIn(role: 'admin' | 'member') {
    this.user.set({ name: role === 'admin' ? 'Root' : 'Sam', role });
  }
}
