import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Commit {
  msg: string;
  id: string;
}

@Component({
  selector: 'app-lesson-git-basics',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Your Dev Toolkit</span>
      <h1>Git & Version Control</h1>
      <p class="lead">
        <strong>Git</strong> is a time machine and a safety net for your code. It records
        snapshots of your project as you work, so you can see what changed, undo
        mistakes, and collaborate with others without overwriting each other's work.
        Practically every software team uses it — it's a must-know tool.
      </p>

      <h2>The problem it solves</h2>
      <p>
        Without version control you end up with <code>project-final.zip</code>,
        <code>project-final-REAL.zip</code>, <code>project-final-v2-fixed.zip</code>… and
        no idea what changed or how to undo anything. Git replaces all that with one
        clean, navigable history.
      </p>

      <h2>The core vocabulary</h2>
      <table class="t">
        <tr><td><strong>Repository (repo)</strong></td><td>Your project folder, tracked by Git, with its full history.</td></tr>
        <tr><td><strong>Commit</strong></td><td>A saved snapshot with a message describing what changed. The unit of history.</td></tr>
        <tr><td><strong>Branch</strong></td><td>A parallel line of work — try something risky without touching the main code.</td></tr>
        <tr><td><strong>Remote / GitHub</strong></td><td>A copy of the repo hosted online, so you can back up and share with a team.</td></tr>
      </table>

      <h2>The everyday loop</h2>
      <div class="code">
        <pre>git status                     # what have I changed?
git add .                      # stage changes you want to save
git commit -m "Add login form" # save a snapshot with a message
git push                       # upload your commits to GitHub
git pull                       # download teammates' commits

git checkout -b new-feature    # create & switch to a new branch
git merge new-feature          # bring a branch's work back into main</pre>
      </div>
      <p>
        The rhythm is: change some files → <code>add</code> them → <code>commit</code>
        with a clear message → <code>push</code> to share. Small, frequent commits with
        good messages make your history easy to read and undo.
      </p>

      <h2>Try it — build a commit history</h2>
      <div class="demo">
        <p class="demo__title">Live — make commits and watch the timeline grow</p>
        <div class="row" style="margin-bottom:10px">
          <input #m placeholder="commit message" (keyup.enter)="commit(m.value); m.value=''" />
          <button (click)="commit(m.value); m.value=''">git commit</button>
          <button class="ghost" (click)="undo()" [disabled]="!commits().length">undo last</button>
        </div>
        <div class="timeline">
          @for (c of commits(); track c.id) {
            <div class="commit">
              <span class="dot"></span>
              <code>{{ c.id }}</code> — {{ c.msg }}
            </div>
          } @empty {
            <p style="color:var(--text-muted)">No commits yet. Type a message and commit.</p>
          }
        </div>
        @if (commits().length) {
          <p class="pill">{{ commits().length }} commit(s) on branch <code>main</code></p>
        }
      </div>

      <div class="note">
        <strong>GitHub</strong> (and GitLab/Bitbucket) host your repos online. They add
        <em>pull requests</em> — a way to propose changes, review each other's code, and
        discuss before merging. It's where open-source collaboration happens, and where
        you'll showcase your own projects.
      </div>

      <div class="tip">
        Add a <code>.gitignore</code> file listing things Git should ignore — like
        <code>node_modules</code> (huge, re-installable) and secret keys. Never commit
        passwords or API secrets.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Git records <strong>commits</strong> (snapshots) so you can review and undo changes safely.</li>
        <li>Daily loop: <code>add</code> → <code>commit -m "message"</code> → <code>push</code>; <code>pull</code> to get others' work.</li>
        <li><strong>Branches</strong> let you work in parallel; <strong>merge</strong> brings it back together.</li>
        <li><strong>GitHub</strong> hosts repos online and adds reviews via pull requests; ignore <code>node_modules</code> & secrets.</li>
      </ul>

      <p><a routerLink="/debugging-basics">Next: Debugging & Reading Errors →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin: 8px 0; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 180px; }
     .timeline { border-left: 2px solid var(--border); margin-left: 8px; padding-left: 16px; }
     .commit { position: relative; margin: 10px 0; }
     .commit .dot { position: absolute; left: -22px; top: 5px; width: 10px; height: 10px; border-radius: 50%; background: var(--accent); }`,
  ],
})
export class GitBasics {
  private n = 0;
  protected readonly commits = signal<Commit[]>([]);

  protected commit(msg: string) {
    const m = msg.trim();
    if (!m) return;
    const id = (0xa1c0 + this.n++).toString(16).slice(0, 7);
    this.commits.update((list) => [{ msg: m, id }, ...list]);
  }
  protected undo() {
    this.commits.update((list) => list.slice(1));
  }
}
