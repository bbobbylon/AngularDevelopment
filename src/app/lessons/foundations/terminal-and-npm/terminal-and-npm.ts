import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FakeCmd {
  cmd: string;
  out: string;
}

@Component({
  selector: 'app-lesson-terminal-and-npm',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Your Dev Toolkit</span>
      <h1>The Terminal & npm</h1>
      <p class="lead">
        To build apps you'll type commands into a <strong>terminal</strong> (also called
        a command line or shell) — a text window where you tell the computer what to do
        by typing instead of clicking. It looks intimidating, but you only need a handful
        of commands. This is how you run, build and install everything in Angular.
      </p>

      <h2>Why a terminal at all?</h2>
      <p>
        Clicking is great for everyday use, but developers need to run tools precisely
        and repeatably. Typing <code>ng serve</code> is faster and more exact than hunting
        through menus — and it's the same on every machine. The terminal is just another
        way to talk to your computer.
      </p>

      <h2>The handful of commands you actually need</h2>
      <table class="t">
        <tr><td><code>pwd</code></td><td>"print working directory" — where am I right now?</td></tr>
        <tr><td><code>ls</code> (or <code>dir</code>)</td><td>list the files in this folder</td></tr>
        <tr><td><code>cd folder</code></td><td>"change directory" — move into a folder (<code>cd ..</code> goes up)</td></tr>
        <tr><td><code>mkdir name</code></td><td>make a new folder</td></tr>
        <tr><td><code>code .</code></td><td>open the current folder in VS Code (a popular editor)</td></tr>
      </table>

      <h2>Try it — a pretend terminal</h2>
      <div class="demo">
        <p class="demo__title">Live — click a command to "run" it</p>
        <div class="row" style="margin-bottom:10px;flex-wrap:wrap">
          @for (c of commands; track c.cmd) {
            <button class="ghost" (click)="run(c)">{{ c.cmd }}</button>
          }
          <button (click)="clear()">clear</button>
        </div>
        <div class="terminal">
          @for (line of history(); track $index) {
            <div><span class="prompt">my-app $</span> {{ line.cmd }}</div>
            <div class="out">{{ line.out }}</div>
          } @empty {
            <div class="out">// click a command above…</div>
          }
        </div>
      </div>

      <h2>Node & npm: the package manager</h2>
      <p>
        <strong>Node.js</strong> lets JavaScript run <em>outside</em> the browser — it's
        what the Angular tools run on. It comes with <strong>npm</strong> (Node Package
        Manager), which downloads and manages the open-source code libraries ("packages")
        your project depends on.
      </p>
      <div class="code">
        <pre>node --version          # check Node is installed
npm install            # download every package this project needs → node_modules/
npm install lodash     # add a specific package to the project
npm run build          # run a script defined in package.json
npx some-tool          # run a tool without installing it permanently</pre>
      </div>
      <div class="note">
        <code>package.json</code> is your project's shopping list — it records which
        packages and versions the project uses. <code>npm install</code> reads it and
        downloads everything into a <code>node_modules</code> folder (which you never edit
        by hand and never commit to Git).
      </div>

      <h2>The Angular CLI</h2>
      <div class="code">
        <pre>npm install -g &#64;angular/cli   # install the Angular command-line tool, once
ng new my-app                  # create a brand-new Angular project
ng serve                       # run it locally at http://localhost:4200
ng generate component header   # scaffold a new component for you</pre>
      </div>
      <p>The CLI (<code>ng</code>) is the tool you'll use most — it scaffolds, runs, builds and upgrades Angular apps.</p>

      <h2>Key takeaways</h2>
      <ul>
        <li>The <strong>terminal</strong> runs your dev tools by typing commands.</li>
        <li>Core navigation: <code>pwd</code>, <code>ls</code>, <code>cd</code>, <code>mkdir</code>.</li>
        <li><strong>Node</strong> runs JS outside the browser; <strong>npm</strong> installs packages listed in <code>package.json</code>.</li>
        <li>The <strong>Angular CLI</strong> (<code>ng</code>) creates, serves, builds and scaffolds Angular apps.</li>
      </ul>

      <p><a routerLink="/git-basics">Next: Git & Version Control →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin: 8px 0; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 150px; white-space: nowrap; }
     .terminal { background: #0a0c12; border: 1px solid var(--border); border-radius: 8px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: .82rem; min-height: 120px; }
     .terminal .prompt { color: var(--green); }
     .terminal .out { color: var(--text-muted); margin: 2px 0 8px; white-space: pre-wrap; }`,
  ],
})
export class TerminalAndNpm {
  protected readonly history = signal<FakeCmd[]>([]);
  protected readonly commands: FakeCmd[] = [
    { cmd: 'pwd', out: '/Users/you/projects/my-app' },
    { cmd: 'ls', out: 'src   package.json   angular.json   README.md' },
    { cmd: 'cd src', out: '' },
    { cmd: 'npm install', out: 'added 312 packages in 8s' },
    { cmd: 'ng serve', out: '✔ Compiled successfully.\n  ➜ Local: http://localhost:4200/' },
  ];

  protected run(c: FakeCmd) {
    this.history.update((h) => [...h, c]);
  }
  protected clear() {
    this.history.set([]);
  }
}
