import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      padding: 48px 24px;
    }
    .code {
      font-size: 6rem;
      font-weight: 800;
      line-height: 1;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0 0 16px;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 8px;
    }
    p {
      color: var(--text-muted);
      margin: 0 0 32px;
      max-width: 360px;
    }
    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .btn-primary {
      padding: 10px 20px;
      background: #6366f1;
      color: #fff;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: .92rem;
    }
    .btn-primary:hover { background: #5558e3; }
    .btn-ghost {
      padding: 10px 20px;
      border: 1px solid var(--border);
      border-radius: 8px;
      text-decoration: none;
      color: var(--text);
      font-size: .92rem;
    }
    .btn-ghost:hover { background: var(--surface); }
  `],
  template: `
    <div class="not-found">
      <div class="code">404</div>
      <h1>Page not found</h1>
      <p>That URL doesn't match any lesson or page. Head home to browse all 98 concepts.</p>
      <div class="actions">
        <a routerLink="/" class="btn-primary">Back to all concepts</a>
        <a routerLink="/practice" class="btn-ghost">Practice challenges</a>
      </div>
    </div>
  `,
})
export class NotFound {}
