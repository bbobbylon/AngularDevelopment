import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * One fake command: what you type, what it prints, and why it matters.
 */
interface FakeCmd {
  cmd: string;
  out: string;
  note?: string;
}

/**
 * Lesson: Terminal & npm — anatomy of a command (program/args/flags),
 * navigation with a working simulated filesystem, reading command output
 * and errors, Node vs npm vs npx, package.json/node_modules/lock file
 * relationships, semver ranges, npm scripts, and the Angular CLI workflow.
 */
@Component({
  selector: 'app-lesson-terminal-and-npm',
  imports: [RouterLink],
  templateUrl: './terminal-and-npm.html',
  styleUrl: './terminal-and-npm.css',
})
export class TerminalAndNpm {
  /**
   * The commands run so far, as a transcript.
   */
  protected readonly history = signal<FakeCmd[]>([]);
  /**
   * The note for the most recent command.
   */
  protected readonly lastNote = signal('');

  /**
   * The commands the fake terminal accepts.
   */
  protected readonly commands: FakeCmd[] = [
    {
      cmd: 'pwd',
      out: '/Users/you/projects/my-app',
      note: 'Lost? pwd always tells you where you are standing.',
    },
    {
      cmd: 'ls',
      out: 'src   package.json   angular.json   README.md',
      note: 'These four are the top of every Angular project. Your code lives in src/.',
    },
    {
      cmd: 'cd src',
      out: '',
      note: 'No output = it worked. The prompt path changes — later commands now act inside src/.',
    },
    {
      cmd: 'ls',
      out: 'app   index.html   main.ts   styles.css',
      note: 'Same command, different folder, different answer — commands are relative to where you stand.',
    },
    {
      cmd: 'cd ..',
      out: '',
      note: '".." always means the parent folder — back up to the project root.',
    },
    {
      cmd: 'npm install',
      out: 'added 312 packages in 8s',
      note: '312 packages: your dependencies plus THEIR dependencies, resolved from package-lock.json into node_modules/.',
    },
    {
      cmd: 'ng serve',
      out: '✔ Compiled successfully.\n  ➜ Local: http://localhost:4200/',
      note: 'This one keeps running (no new prompt) — it is now watching your files. Ctrl+C would stop it.',
    },
    {
      cmd: 'ng g c header --dry-run',
      out: 'CREATE src/app/header/header.ts (245 bytes)\nCREATE src/app/header/header.html (21 bytes)\nNOTE: The "--dry-run" option means no changes were made.',
      note: 'Flags in action: --dry-run previews without touching disk. Drop it to really scaffold.',
    },
  ];

  /** Track the working directory shown in each history line's prompt. */
  private cwds: string[] = [];

  /**
   * Runs a command: appends it to the transcript and updates the working
   * directory if it was a `cd`.
   *
   * @param c The command to run.
   */
  protected run(c: FakeCmd) {
    const prev = this.cwds.length ? this.cwds[this.cwds.length - 1] : '';
    let next = prev;
    if (c.cmd === 'cd src') next = 'src';
    if (c.cmd === 'cd ..') next = '';
    this.cwds = [...this.cwds, next];
    this.history.update((h) => [...h, c]);
    this.lastNote.set(c.note ?? '');
  }

  /**
   * The prompt for a transcript line — the directory as it was **before** that
   * command ran, which is what a real prompt shows.
   *
   * @param i Line index.
   */
  protected cwdFor(i: number): string {
    // Prompt for line i shows the directory BEFORE that command ran.
    return i === 0 ? '' : this.cwds[i - 1];
  }

  /**
   * Clears the transcript.
   */
  protected clear() {
    this.history.set([]);
    this.cwds = [];
    this.lastNote.set('');
  }
}
