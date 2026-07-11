import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Terminal & npm — anatomy of a command (program/args/flags),
 * navigation with a working simulated filesystem, reading command output
 * and errors, Node vs npm vs npx, package.json/node_modules/lock file
 * relationships, semver ranges, npm scripts, and the Angular CLI workflow.
 */

interface FakeCmd {
  cmd: string;
  out: string;
  note?: string;
}

@Component({
  selector: 'app-lesson-terminal-and-npm',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Your Dev Toolkit</span>
      <h1>The Terminal &amp; npm</h1>
      <p class="lead">
        To build apps you'll type commands into a <strong>terminal</strong> (also
        called a command line or shell) — a text window where you tell the computer
        what to do by typing instead of clicking. It looks intimidating; it isn't.
        You need about eight commands, one mental model ("I am always standing
        <em>somewhere</em>"), and the ability to read what comes back. This page
        gives you all three, plus the npm ecosystem every Angular project lives in.
      </p>

      <h2>Why a terminal at all?</h2>
      <ul>
        <li><strong>Precision &amp; repeatability</strong> — <code>ng serve</code> means exactly one thing, on every machine, every time. No hunting through menus that moved in the last update.</li>
        <li><strong>Automation</strong> — commands can be chained, scripted and run by robots. Your future CI pipeline is just the terminal commands you're learning now, run by a server on every push.</li>
        <li><strong>It's where the tools live</strong> — Angular's CLI, npm, Git: all terminal programs. Every tutorial, error message and Stack Overflow answer assumes you can run them.</li>
      </ul>

      <h2>Anatomy of a command</h2>
      <div class="code"><pre>ng generate component header --dry-run
└┬┘ └──┬───┘ └───┬───┘ └─┬──┘ └───┬───┘
program  sub-     what     its    a FLAG (starts with -):
to run   command  kind     name   an option — here, "show me
                                  what you WOULD do, change nothing"</pre></div>
      <ul>
        <li><strong>First word = the program.</strong> Everything after = arguments handed to it, separated by spaces. (That's why paths with spaces need quotes: <code>cd "My Documents"</code>.)</li>
        <li><strong>Flags</strong> start with <code>-</code>/<code>--</code> and switch options on. <code>--help</code> works on almost everything and prints the manual — the single most useful flag in existence.</li>
        <li><strong>Pressing Enter runs it; output prints below; then a new prompt appears.</strong> No output at all usually means <em>success</em> — silence is golden in Unix tradition. Errors, by contrast, say so.</li>
      </ul>

      <h2>You are always standing somewhere</h2>
      <p>
        Every terminal session has a <strong>working directory</strong> — the folder
        you're "standing in". Commands act relative to it: <code>ls</code> lists
        <em>this</em> folder, <code>npm install</code> installs into <em>this</em>
        project. Half of all beginner terminal errors are really "I'm standing in the
        wrong folder" — <code>pwd</code> is the fix-finder:
      </p>
      <table class="t">
        <tr><td><code>pwd</code></td><td>"print working directory" — where am I right now?</td></tr>
        <tr><td><code>ls</code> (or <code>dir</code>)</td><td>list the files here</td></tr>
        <tr><td><code>cd folder</code></td><td>move into a folder · <code>cd ..</code> = up one level · <code>cd ~</code> = home</td></tr>
        <tr><td><code>mkdir name</code></td><td>make a new folder</td></tr>
        <tr><td><code>code .</code></td><td>open the current folder (<code>.</code> means "here") in VS Code</td></tr>
        <tr><td><kbd>Tab</kbd></td><td>autocomplete the file/folder name you started typing — use it constantly, it also catches typos</td></tr>
        <tr><td><kbd>↑</kbd></td><td>recall previous commands instead of retyping</td></tr>
        <tr><td><kbd>Ctrl+C</kbd></td><td>stop the currently running program (this is how you stop <code>ng serve</code>)</td></tr>
      </table>

      <h2>Try it — a working pretend terminal</h2>
      <div class="demo">
        <p class="demo__title">Live — click commands, read the output</p>
        <div class="row" style="margin-bottom:10px;flex-wrap:wrap">
          @for (c of commands; track c.cmd) {
            <button class="ghost" (click)="run(c)">{{ c.cmd }}</button>
          }
          <button (click)="clear()">clear</button>
        </div>
        <div class="terminal">
          @for (line of history(); track $index) {
            <div><span class="prompt">{{ line.cmd.startsWith('cd') || cwdFor($index) === '' ? 'my-app $' : 'my-app/' + cwdFor($index) + ' $' }}</span> {{ line.cmd }}</div>
            @if (line.out) { <div class="out">{{ line.out }}</div> }
          } @empty {
            <div class="out">// click a command above… (try ls, then cd src, then ls again)</div>
          }
        </div>
        @if (lastNote()) {
          <p style="color:var(--text-muted);font-size:.85rem;margin-top:8px">💡 {{ lastNote() }}</p>
        }
      </div>

      <h2>Node &amp; npm — the ecosystem under every Angular app</h2>
      <p>
        <strong>Node.js</strong> lets JavaScript run <em>outside</em> the browser —
        it's the engine that Angular's build tools, dev server and CLI all run on.
        Installing Node also installs <strong>npm</strong> (Node Package Manager),
        whose job is managing <em>packages</em>: folders of open-source code your
        project depends on. Three files/folders form the system — know what each is
        for and who owns it:
      </p>
      <table class="t">
        <tr><td><code>package.json</code></td><td><strong>Yours.</strong> The project manifest: name, scripts, and the list of dependencies <em>with version ranges</em>. Small, human-edited, committed to Git.</td></tr>
        <tr><td><code>package-lock.json</code></td><td><strong>npm's, but committed.</strong> The exact resolved version of every package (including dependencies-of-dependencies). Guarantees teammates and CI get byte-identical installs.</td></tr>
        <tr><td><code>node_modules/</code></td><td><strong>Disposable.</strong> The downloaded packages themselves — often 100s of MB. Never edit it, never commit it; anyone can rebuild it from the two files above with one command.</td></tr>
      </table>
      <div class="code"><pre>node --version      # is Node installed, and which version?
npm install         # read package.json → download everything → node_modules/
                    #   (the first command to run in ANY freshly-cloned project)
npm install lodash  # add one package + record it in package.json
npm run build       # run the "build" script defined in package.json
npx create-thing    # run a tool ONCE without permanently installing it</pre></div>
      <p>Version ranges in <code>package.json</code> follow <strong>semver</strong> (semantic versioning) — <code>major.minor.patch</code>, where a major bump signals breaking changes:</p>
      <div class="code"><pre>"dependencies": {{ '{' }}
  "&#64;angular/core": "^21.2.0",   // ^ = any 21.x.y from 21.2.0 up — minors ok, never 22
  "some-lib":      "~3.4.1",    // ~ = only patches: 3.4.x
  "fragile-lib":   "3.4.1"      // exact — no surprises, and no automatic fixes either
{{ '}' }}</pre></div>
      <div class="note">
        The two npm facts that solve most day-one confusion:
        (1) <code>node_modules</code> missing after cloning a repo is <em>normal</em> —
        run <code>npm install</code>. (2) "Weird" unexplainable errors are sometimes a
        corrupted install — deleting <code>node_modules</code> and re-running
        <code>npm install</code> is the developer's turn-it-off-and-on-again, and it's
        completely safe <em>because</em> that folder is disposable.
      </div>

      <h2>npm scripts — the project's command palette</h2>
      <div class="code"><pre>// in package.json:
"scripts": {{ '{' }}
  "start": "ng serve",
  "build": "ng build",
  "test":  "ng test"
{{ '}' }}

npm start           # → runs "ng serve"
npm run build       # → runs "ng build"   (only start/test skip the word "run")</pre></div>
      <p>
        Why not just type <code>ng serve</code>? Two reasons: scripts document the
        project's standard workflows in one place, and npm puts the project's own
        <code>node_modules/.bin</code> on the PATH first — so the <em>project's
        pinned</em> CLI version runs, not whatever's globally installed. Teams rely
        on this for reproducibility.
      </p>

      <h2>The Angular CLI</h2>
      <div class="code"><pre>npm install -g &#64;angular/cli    # -g = global: install the "ng" command itself, once
ng new my-app                  # scaffold a complete project (asks a few questions)
cd my-app                      # ⚠ step into it — ng commands must run INSIDE a project
ng serve                       # dev server → http://localhost:4200, rebuilds on save
ng generate component header   # scaffold a component (shorthand: ng g c header)
ng build                       # production build → dist/
ng test                        # run the unit tests</pre></div>
      <p>
        <code>ng serve</code> is where you'll live: it compiles the app, serves it
        locally, and recompiles + refreshes the browser every time you save a file.
        It keeps running (that's why the prompt doesn't come back) —
        <kbd>Ctrl+C</kbd> stops it. <code>localhost:4200</code> means "this machine,
        door 4200" — connecting the URL-anatomy lesson to your own dev loop.
      </p>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>You clone a project, run <code>ng serve</code>, and get "Cannot find module …". What's the almost-certain fix?</summary>
        <div><code>npm install</code>. Freshly-cloned projects have no
        <code>node_modules</code> (it's gitignored by design); nothing can run until
        the dependencies in package.json are downloaded. Second suspect if that
        fails: you're in the wrong folder — check with <code>pwd</code>.</div>
      </details>
      <details class="qa">
        <summary>What's the difference between <code>npm</code> and <code>npx</code>?</summary>
        <div><code>npm install</code> downloads a package into the project for
        repeated use. <code>npx tool</code> fetches (if needed) and runs a tool
        <em>once</em> without adding it to anything — perfect for scaffolders like
        <code>npx create-vite</code> that you run one time per project.</div>
      </details>
      <details class="qa">
        <summary>Why commit <code>package-lock.json</code> but never <code>node_modules</code>?</summary>
        <div>The lock file is tiny and pins exact versions so every machine installs
        identical code — deleting it invites "works on my machine" drift.
        <code>node_modules</code> is hundreds of MB of <em>reproducible output</em> —
        anyone can regenerate it from the lock file, so committing it is pure bloat.</div>
      </details>
      <details class="qa">
        <summary>With <code>"^21.2.0"</code> in package.json, can <code>npm install</code> ever give you Angular 22?</summary>
        <div>No — caret ranges stop at the next major version, because majors may
        contain breaking changes (that's semver's promise). You'd get the newest
        21.x.y. Moving to 22 is a deliberate act (<code>ng update</code> for Angular,
        which also runs code migrations).</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>A command = program + arguments + flags; <code>--help</code> explains any of them; silence usually means success; <kbd>Tab</kbd>, <kbd>↑</kbd> and <kbd>Ctrl+C</kbd> are your quality of life.</li>
        <li>You're always standing in a <strong>working directory</strong> (<code>pwd</code>, <code>ls</code>, <code>cd</code>) — wrong-folder is the #1 beginner error.</li>
        <li><strong>Node</strong> runs JS outside the browser; <strong>npm</strong> manages packages: manifest (<code>package.json</code>, yours) + lock file (exact versions, committed) + <code>node_modules</code> (huge, disposable, never committed).</li>
        <li><code>npm install</code> is the first command in any cloned project; npm scripts (<code>npm start</code>) are the documented, version-pinned way to run things.</li>
        <li>The <strong>Angular CLI</strong>: <code>ng new</code>, <code>ng serve</code> (Ctrl+C to stop), <code>ng generate</code>, <code>ng build</code> — your daily loop.</li>
      </ul>

      <p><a routerLink="/git-basics">Next: Git &amp; Version Control →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin: 8px 0; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 150px; white-space: nowrap; }
     kbd { border: 1px solid var(--border); border-bottom-width: 2px; border-radius: 4px; padding: 1px 6px; font-size: .8rem; font-family: monospace; background: var(--bg-elevated); }
     /* Fixed dark panel — text colours must NOT come from theme vars (--text /
        --text-muted are near-black in light mode and vanish on this background). */
     .terminal { background: #0a0c12; color: #d4d4e4; border: 1px solid var(--border); border-radius: 8px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: .82rem; min-height: 120px; }
     .terminal .prompt { color: var(--green); }
     .terminal .out { color: #8b93a8; margin: 2px 0 8px; white-space: pre-wrap; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class TerminalAndNpm {
  protected readonly history = signal<FakeCmd[]>([]);
  protected readonly lastNote = signal('');

  protected readonly commands: FakeCmd[] = [
    { cmd: 'pwd', out: '/Users/you/projects/my-app', note: 'Lost? pwd always tells you where you are standing.' },
    { cmd: 'ls', out: 'src   package.json   angular.json   README.md', note: 'These four are the top of every Angular project. Your code lives in src/.' },
    { cmd: 'cd src', out: '', note: 'No output = it worked. The prompt path changes — later commands now act inside src/.' },
    { cmd: 'ls', out: 'app   index.html   main.ts   styles.css', note: 'Same command, different folder, different answer — commands are relative to where you stand.' },
    { cmd: 'cd ..', out: '', note: '".." always means the parent folder — back up to the project root.' },
    { cmd: 'npm install', out: 'added 312 packages in 8s', note: '312 packages: your dependencies plus THEIR dependencies, resolved from package-lock.json into node_modules/.' },
    { cmd: 'ng serve', out: '✔ Compiled successfully.\n  ➜ Local: http://localhost:4200/', note: 'This one keeps running (no new prompt) — it is now watching your files. Ctrl+C would stop it.' },
    { cmd: 'ng g c header --dry-run', out: 'CREATE src/app/header/header.ts (245 bytes)\nCREATE src/app/header/header.html (21 bytes)\nNOTE: The "--dry-run" option means no changes were made.', note: 'Flags in action: --dry-run previews without touching disk. Drop it to really scaffold.' },
  ];

  /** Track the working directory shown in each history line's prompt. */
  private cwds: string[] = [];

  protected run(c: FakeCmd) {
    const prev = this.cwds.length ? this.cwds[this.cwds.length - 1] : '';
    let next = prev;
    if (c.cmd === 'cd src') next = 'src';
    if (c.cmd === 'cd ..') next = '';
    this.cwds = [...this.cwds, next];
    this.history.update((h) => [...h, c]);
    this.lastNote.set(c.note ?? '');
  }

  protected cwdFor(i: number): string {
    // Prompt for line i shows the directory BEFORE that command ran.
    return i === 0 ? '' : this.cwds[i - 1];
  }

  protected clear() {
    this.history.set([]);
    this.cwds = [];
    this.lastNote.set('');
  }
}
