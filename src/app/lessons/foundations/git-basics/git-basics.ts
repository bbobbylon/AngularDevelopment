import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Git — the three areas (working dir / staging / history) with a live
 * simulator that moves files through them, commit anatomy, the everyday loop
 * dissected command by command, branching + merging (incl. what a conflict
 * actually looks like), remotes/GitHub/pull requests, and recovery commands.
 */

interface Commit {
  msg: string;
  id: string;
}

type FileState = 'untracked' | 'modified' | 'staged' | 'committed';

interface RepoFile {
  name: string;
  state: FileState;
}

@Component({
  selector: 'app-lesson-git-basics',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Your Dev Toolkit</span>
      <h1>Git &amp; Version Control</h1>
      <p class="lead">
        <strong>Git</strong> is a time machine and a safety net for your code. It
        records snapshots of your project as you work, so you can see what changed,
        undo mistakes, and collaborate without overwriting each other. Practically
        every team uses it. The secret to Git making sense — instead of being a bag
        of memorized incantations — is one picture: <strong>your changes move
        through three areas</strong>. Build that picture here and the commands
        become obvious.
      </p>

      <h2>The problem it solves</h2>
      <p>
        Without version control you get <code>project-final.zip</code>,
        <code>project-final-REAL.zip</code>, <code>project-final-v2-fixed.zip</code>…
        no record of what changed, no way back, and merging two people's edits by
        hand. Git replaces all of it with one navigable history — and unlike the
        zips, it can tell you <em>exactly which line</em> changed between any two
        points, who changed it, and why (the commit message).
      </p>

      <h2>The mental model: three areas</h2>
      <div class="code"><pre>  WORKING DIRECTORY   --git add-->   STAGING AREA   --git commit-->   HISTORY
  (your real files,                  (the shopping                   (permanent
   freely edited)                     cart: what the                  snapshots,
                                      NEXT snapshot                   each with id
                                      will contain)                   + message)</pre></div>
      <ul>
        <li><strong>Working directory</strong> — the actual files you edit. Git watches them and can list what differs from the last snapshot (<code>git status</code>).</li>
        <li><strong>Staging area</strong> — a holding zone. <code>git add</code> doesn't save anything permanently; it <em>selects</em> which changes go into the next snapshot. This indirection is a feature: you can edit five files but commit two of them as one tidy, focused unit.</li>
        <li><strong>History</strong> — the chain of commits. Once committed, a snapshot is effectively permanent — this is the safety net. Nothing you've committed can be truly lost by ordinary means.</li>
      </ul>

      <h2>Try it — move a change through all three areas</h2>
      <div class="demo">
        <p class="demo__title">Live — a two-file repo simulator</p>
        <div class="row" style="margin-bottom:10px;flex-wrap:wrap">
          <button class="ghost" (click)="editFile()">edit app.ts</button>
          <button class="ghost" (click)="addAll()" [disabled]="!hasUnstaged()">git add .</button>
          <button (click)="commitStaged()" [disabled]="!hasStaged()">git commit -m "…"</button>
          <button class="ghost" (click)="resetSim()">reset demo</button>
        </div>
        <div class="areas">
          <div class="area">
            <h4>Working dir</h4>
            @for (f of files(); track f.name) {
              @if (f.state === 'modified' || f.state === 'untracked') {
                <span class="file mod">{{ f.name }} <em>({{ f.state }})</em></span>
              }
            }
            @if (!hasUnstaged()) { <span class="clean">clean ✓</span> }
          </div>
          <div class="area">
            <h4>Staging</h4>
            @for (f of files(); track f.name) {
              @if (f.state === 'staged') {
                <span class="file staged">{{ f.name }}</span>
              }
            }
            @if (!hasStaged()) { <span class="clean">empty</span> }
          </div>
          <div class="area">
            <h4>History</h4>
            @for (c of simCommits(); track c.id) {
              <span class="file com"><code>{{ c.id }}</code> {{ c.msg }}</span>
            } @empty {
              <span class="clean">no commits yet</span>
            }
          </div>
        </div>
        <p style="color:var(--text-muted);font-size:.85rem;margin-top:8px">
          {{ simHint() }}
        </p>
      </div>

      <h2>The everyday loop, command by command</h2>
      <div class="code"><pre>git status                      # ALWAYS run first: which files changed? what's staged?
git diff                        # show me the exact changed lines (q to quit the pager)

git add .                       # stage everything changed ("." = this whole folder)
git add src/app/login.ts        # …or stage just one file — surgical commits

git commit -m "Add login form"  # snapshot the staged changes with a message
git log --oneline               # read the history, newest first

git push                        # upload my new commits to the remote (GitHub)
git pull                        # download + merge teammates' commits from it</pre></div>
      <ul>
        <li><strong><code>status</code> before everything.</strong> It literally tells you what to do next — including the undo commands for each situation. When in doubt, status.</li>
        <li><strong>Commit messages are for the future reader.</strong> Convention: imperative mood, said as "if applied, this commit will…" — <em>"Add login form"</em>, not <em>"added stuff"</em>. Six months from now, <code>git log</code> is documentation.</li>
        <li><strong>Small commits, often.</strong> One logical change per commit ("Add validation to signup" — not "Friday's work"). Small commits are readable, revertable and bisectable; giant ones are none of those.</li>
        <li>A commit's <strong>id</strong> (like <code>a1c07f3</code>) is a hash of its content — every snapshot is addressable forever. You'll paste these into commands and PR discussions.</li>
      </ul>

      <h2>Try it — build a commit history</h2>
      <div class="demo">
        <p class="demo__title">Live — make commits and watch the timeline grow</p>
        <div class="row" style="margin-bottom:10px">
          <input #m placeholder='commit message — try "Add navbar"' (keyup.enter)="commit(m.value); m.value=''" />
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

      <h2>Branches — parallel universes for your code</h2>
      <p>
        A <strong>branch</strong> is an independent line of commits. <code>main</code>
        stays stable while you build a feature on its own branch; when it's ready, a
        <strong>merge</strong> combines the work:
      </p>
      <div class="code"><pre>git checkout -b login-page     # create branch + switch to it (one command)
# …edit, add, commit as usual — main is untouched all the while…

git checkout main              # jump back: your files INSTANTLY match main again
git merge login-page           # replay the branch's work into main
git branch -d login-page       # done — delete the label</pre></div>
      <p>
        The moment that makes branches click: <strong>switching branches rewrites
        your working directory</strong>. Checkout <code>main</code> and the login
        code vanishes from the files; checkout the branch and it's back. Branches
        are cheap (a branch is just a movable label pointing at a commit), so teams
        make one per feature or bug fix, however small.
      </p>
      <div class="warn">
        <strong>Merge conflicts</strong> aren't errors — they're a question. If both
        branches edited the same lines, Git stops and marks the spot in the file:
        <div class="code" style="margin:8px 0"><pre>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD
  &lt;h1&gt;Welcome back&lt;/h1&gt;          ← your branch's version
=======
  &lt;h1&gt;Hello again&lt;/h1&gt;           ← their version
&gt;&gt;&gt;&gt;&gt;&gt;&gt; login-page</pre></div>
        You edit the file to the version you actually want, delete the
        <code>&lt;&lt;&lt;/===/&gt;&gt;&gt;</code> markers, then <code>add</code> +
        <code>commit</code>. That's the whole ritual — scary reputation, mechanical fix.
      </div>

      <h2>Remotes, GitHub &amp; pull requests</h2>
      <p>
        Everything so far happened on your machine — Git works fully offline. A
        <strong>remote</strong> is a copy of the repo hosted elsewhere;
        <strong>GitHub</strong> (or GitLab/Bitbucket) is where remotes usually live.
        <code>push</code> uploads your commits, <code>pull</code> brings down
        everyone else's, <code>clone</code> copies an entire repo (history included)
        to a new machine.
      </p>
      <div class="note">
        Teams rarely merge straight to main. The workflow is: push your
        <em>branch</em>, then open a <strong>pull request</strong> — "please pull my
        branch into main" — where teammates review the diff, comment line by line,
        and CI runs the tests. Only then is it merged. PRs are where code review
        lives, and your GitHub PR history is a portfolio interviewers actually read.
      </div>

      <div class="tip">
        Add a <code>.gitignore</code> file listing what Git should never track:
        <code>node_modules/</code> (huge and rebuildable — the npm lesson), build
        output like <code>dist/</code>, and anything secret (<code>.env</code>, API
        keys). A leaked secret in a commit stays in the history even after you
        delete the file — treat committed secrets as compromised and rotate them.
      </div>

      <h2>When things go wrong — the recovery drawer</h2>
      <div class="code"><pre>git restore file.ts             # discard UNCOMMITTED edits to a file (careful: gone!)
git restore --staged file.ts    # un-stage (undo git add) — edits stay in the file
git commit --amend              # fix the last commit's message / add a forgotten file
git revert a1c07f3              # undo a commit SAFELY: new commit with the opposite change
git log --oneline               # find the id you need for the above</pre></div>
      <p>
        Ranked by danger: <code>restore --staged</code> touches nothing real,
        <code>revert</code> is history-safe (it adds rather than erases — right
        choice on shared branches), <code>restore</code> genuinely deletes local
        edits. The general truth: <em>committed work is nearly impossible to lose;
        uncommitted work is trivially easy to lose</em>. Commit early, commit often.
      </p>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>You edited three files but only want two in this commit. How?</summary>
        <div>Stage selectively: <code>git add fileA.ts fileB.ts</code>, then
        <code>git commit</code>. The third file stays modified-but-unstaged for a
        later commit. This is exactly what the staging area exists for — commits as
        curated, logical units instead of "everything I've touched".</div>
      </details>
      <details class="qa">
        <summary>What's the difference between <code>git add</code> and <code>git commit</code>?</summary>
        <div><code>add</code> moves changes into the staging area — a reversible
        selection, nothing saved yet. <code>commit</code> permanently snapshots
        whatever is staged, with a message, into history. Two steps, two areas.</div>
      </details>
      <details class="qa">
        <summary>A bad commit is already pushed and teammates have pulled it. <code>revert</code> or delete it from history?</summary>
        <div><code>git revert</code> — it creates a <em>new</em> commit containing
        the inverse change, so history only ever grows. Rewriting/deleting shared
        history means every teammate's copy disagrees with the remote — a team-wide
        mess. Rule: shared history is append-only.</div>
      </details>
      <details class="qa">
        <summary>Why did the login page's code disappear from your editor after <code>git checkout main</code>?</summary>
        <div>Nothing is lost — switching branches rewrites the working directory to
        match the target branch's snapshot, and main never had the login commits.
        <code>git checkout login-page</code> brings every line back. Branches are
        parallel versions of the whole project, not just labels.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>The three areas: working directory —<code>add</code>→ staging —<code>commit</code>→ history. Staging exists so commits can be curated, logical units.</li>
        <li>Daily rhythm: <code>status</code> → <code>add</code> → <code>commit -m "imperative message"</code> → <code>push</code>; <code>pull</code> for the team's work. Small commits, always.</li>
        <li><strong>Branches</strong> are cheap parallel lines of work; switching rewrites your files; merging combines, and conflicts are a mechanical edit-markers-commit ritual, not a disaster.</li>
        <li><strong>GitHub + pull requests</strong> = where review happens before merge; <code>.gitignore</code> keeps <code>node_modules</code> and secrets out (a committed secret is compromised forever).</li>
        <li>Committed work is nearly unlosable; uncommitted work is fragile — commit early and often, and <code>revert</code> (never rewrite) on shared branches.</li>
      </ul>

      <p><a routerLink="/debugging-basics">Next: Debugging &amp; Reading Errors →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin: 8px 0; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 180px; }
     .timeline { border-left: 2px solid var(--border); margin-left: 8px; padding-left: 16px; }
     .commit { position: relative; margin: 10px 0; }
     .commit .dot { position: absolute; left: -22px; top: 5px; width: 10px; height: 10px; border-radius: 50%; background: var(--accent); }

     .areas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
     @media (max-width: 640px) { .areas { grid-template-columns: 1fr; } }
     .area { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; min-height: 110px; }
     .area h4 { margin: 0 0 8px; font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); }
     .file { display: block; font-size: .82rem; font-family: monospace; margin: 4px 0; padding: 3px 8px; border-radius: 6px; }
     .file.mod { background: rgba(245, 158, 11, .12); }
     .file.staged { background: rgba(99, 102, 241, .12); }
     .file.com { background: rgba(16, 185, 129, .1); }
     .clean { color: var(--text-muted); font-size: .8rem; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
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

  /* ── three-areas simulator ── */
  private simN = 0;
  private editN = 0;
  protected readonly files = signal<RepoFile[]>([{ name: 'app.ts', state: 'committed' }]);
  protected readonly simCommits = signal<Commit[]>([]);

  protected readonly hasUnstaged = computed(() =>
    this.files().some((f) => f.state === 'modified' || f.state === 'untracked'),
  );
  protected readonly hasStaged = computed(() => this.files().some((f) => f.state === 'staged'));

  protected readonly simHint = computed(() => {
    if (this.hasUnstaged()) return 'git status would show app.ts in red ("changes not staged"). Stage it with git add.';
    if (this.hasStaged()) return 'Staged (git status shows it green) — but NOT saved yet. Commit to snapshot it.';
    if (this.simCommits().length) return 'Working tree clean — everything is safely in history. Edit again to start another cycle.';
    return 'Start by editing a file — that dirties the working directory.';
  });

  protected editFile() {
    this.files.update((fs) => fs.map((f) => (f.name === 'app.ts' ? { ...f, state: 'modified' as FileState } : f)));
  }
  protected addAll() {
    this.files.update((fs) =>
      fs.map((f) => (f.state === 'modified' || f.state === 'untracked' ? { ...f, state: 'staged' as FileState } : f)),
    );
  }
  protected commitStaged() {
    const id = (0xb2d0 + this.simN++).toString(16).slice(0, 7);
    this.simCommits.update((list) => [{ id, msg: `Edit app.ts (#${++this.editN})` }, ...list]);
    this.files.update((fs) => fs.map((f) => (f.state === 'staged' ? { ...f, state: 'committed' as FileState } : f)));
  }
  protected resetSim() {
    this.files.set([{ name: 'app.ts', state: 'committed' }]);
    this.simCommits.set([]);
    this.simN = 0;
    this.editN = 0;
  }
}
