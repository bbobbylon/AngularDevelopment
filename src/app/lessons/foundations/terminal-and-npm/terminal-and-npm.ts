import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

/**
 * One fake command: what you type, what it prints, and why it matters.
 */
interface FakeCmd {
  cmd: string;
  out: string;
  note?: string;
}

/**
 * Lesson: Terminal & npm — the two tools every single Angular workflow assumes you already
 * have, taught from absolute zero: a shell that only understands typed instructions, and a
 * package manager that turns three quietly different files into a working project.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`). It copies
 * `expert/change-detection`'s section rhythm and `foundations/arrays-objects-basics`'s
 * absolute-beginner register — nothing on this page assumes the reader has ever opened a
 * terminal, and every substantial sample is annotated line by line rather than left for the
 * reader to decode alone.
 *
 * ## Teaching order, and why it is this order
 *
 * 1. **Pose the trap before naming it.** The opening napkin asks what a *successful* command
 *    prints, and deliberately withholds the answer — most beginners guess "something", and the
 *    real answer ("usually nothing") is one of the most useful facts on the page precisely
 *    because it contradicts the guess.
 * 2. **A physical analogy before any command name.** "You are always standing in one room of a
 *    house" gives `pwd`/`ls`/`cd` somewhere to attach before the words themselves arrive —
 *    vocabulary introduced before its picture has nothing to stick to.
 * 3. **Anatomy of a command staged as a conversation.** "Program vs. subcommand vs. argument vs.
 *    flag" is a relationship between parts of one line, and a dialogue stages a relationship far
 *    better than a labelled diagram does.
 * 4. **The npm ecosystem gets the most retention weight in the lesson**, because
 *    `package.json` / `package-lock.json` / `node_modules/` is the one idea here a beginner will
 *    otherwise misuse for years: a diagram, a card row, a memory hook and a quiz all carry the
 *    same fact in different modes, on purpose.
 * 5. **The three real beginner traps get three different devices.** A predict-then-reveal for
 *    `npm ci` versus `npm install`, a multiple-choice for committing `node_modules/`, and a
 *    second multiple-choice for caret ranges — each trap meets the device that suits it, rather
 *    than one quiz trying to cover all three.
 */
@Component({
  selector: 'app-lesson-terminal-and-npm',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
  ],
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
   *
   * The failing `cd reports` entry is deliberate: every other command here succeeds, and a
   * lesson that only ever shows success cannot teach a reader what failure looks like. It fails
   * from anywhere, because `reports` is not a real folder in either listing above it.
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
      cmd: 'cd reports',
      out: 'cd: no such file or directory: reports',
      note: "This is what failure looks like: a specific sentence explaining exactly what went wrong. Compare it with 'cd src' above, which printed nothing at all because it worked.",
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
   * Any `cd` other than the two recognised ones (`cd src`, `cd ..`) is treated as failing —
   * which is exactly right for `cd reports`: the working directory simply does not change,
   * the same as a real shell after a failed `cd`.
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

  // ── Presentation data ─────────────────────────────────────────────────────

  /** The Your Dev Toolkit track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Terminal & npm' },
    { label: 'Git & Version Control', id: 'git-basics' },
    { label: 'Debugging & Errors', id: 'debugging-basics' },
  ];

  /**
   * The anatomy of `ng generate component header --dry-run`, staged as four parts of the line
   * talking about their own job — a beginner reliably conflates "program", "subcommand",
   * "argument" and "flag", and a conversation keeps the four roles distinct better than a
   * single labelled diagram does.
   */
  protected readonly anatomyTalk: BubbleTurn[] = [
    { who: 'You, at the prompt', says: 'ng generate component header --dry-run' },
    {
      who: 'The shell',
      says: "I only run the very first word myself — `ng`. Everything after it, I just hand over as a list: `generate`, `component`, `header`, `--dry-run`. I don't read any of it; I just deliver it.",
    },
    {
      who: 'ng, the program',
      says: 'Thanks. My first argument, `generate`, tells me which of my jobs you want right now — I also know `serve`, `build`, `test`, and a few others.',
    },
    {
      who: 'generate',
      says: "My own first argument, `component`, says what **kind** of thing to make. My second, `header`, is the name — I don't invent one, you chose it.",
    },
    {
      who: '--dry-run',
      says: 'And I\'m not a job or a name at all. Starting with `--` means "switch on this option" — mine means: show what you would create, and don\'t touch the disk.',
    },
  ];

  /**
   * Sample: a real terminal session, narrated line by line — the format is the same `my-app $`
   * prompt style the live demo below uses, so the two reinforce each other rather than
   * teaching two different-looking terminals.
   */
  protected readonly dirTranscriptSample = `my-app $ pwd
/Users/you/projects/my-app
my-app $ ls
src   package.json   angular.json   README.md
my-app $ cd src
my-app/src $ ls
app   index.html   main.ts   styles.css
my-app/src $ cd ..
my-app $ npm install
added 312 packages in 8s`;

  /** Line-by-line walkthrough of {@link dirTranscriptSample}. */
  protected readonly dirTranscriptNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Read every line here as two things stuck together: the **prompt** (`my-app $`, which the shell prints for you automatically) and the **command** (`pwd`, the only part you actually typed).',
    },
    {
      line: 2,
      text: 'The output of `pwd` — "print working directory". That is the whole job: print one line, the folder you\'re standing in, then stop.',
    },
    {
      line: 3,
      text: 'The prompt still reads `my-app $`, so nothing has moved. Same folder, different command: `ls`.',
    },
    {
      line: 4,
      text: 'Four items, listed. Notice there is no line saying "done" or "success" anywhere — `ls` printed the answer and nothing else.',
    },
    {
      line: 5,
      text: '`cd src` prints **nothing at all**. That is not a mistake in this transcript — a successful `cd` is one of the quietest commands there is.',
    },
    {
      line: 6,
      text: 'Proof that line 5 worked: the prompt itself changed, to `my-app/src $`. The terminal tells you where you are before you even type the next command.',
    },
    {
      line: 7,
      text: "The exact same word, `ls`, and a completely different answer — because `ls` always means 'list here', and 'here' just changed.",
    },
    {
      line: 8,
      text: '`cd ..` is the universal "step back out one level, whatever this folder is called" command. You never need to know the parent folder\'s name to use it.',
    },
    {
      line: 9,
      text: 'The prompt is back to `my-app $`, confirming line 8 worked, and now `npm install` is running — the command that reads `package.json` and downloads every package it lists.',
    },
    {
      line: 10,
      text: 'The one line `npm install` decides is worth printing when it finishes: how many packages, how long it took. The download itself — hundreds of individual files — happens silently in between.',
    },
  ];

  /**
   * Sample: the handful of Node/npm commands worth knowing by heart, each doing a
   * meaningfully different job despite three of them starting with the same word.
   */
  protected readonly cmdReferenceSample = `node --version
npm install
npm install lodash
npm run build
npx http-server .`;

  /** Line-by-line walkthrough of {@link cmdReferenceSample}. */
  protected readonly cmdReferenceNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Is Node.js even installed, and which version? The very first command worth running on a brand-new machine, before anything else.',
    },
    {
      line: 2,
      text: 'No package name after `install` means: read `package.json`, and download **everything** it lists into `node_modules/`. This is the one command every freshly-cloned project needs before it can run at all.',
    },
    {
      line: 3,
      text: 'A package name after `install` means something different: download **this one specific package**, right now, and add a line for it to `package.json` so the project remembers it needs this dependency from now on.',
    },
    {
      line: 4,
      text: '`npm run <name>` looks up `<name>` inside `package.json`\'s "scripts" section and runs whatever is written there — `build` here is very likely running `ng build` underneath, without you needing to know that.',
    },
    {
      line: 5,
      text: '`npx` is for a tool you want to run **once**, without permanently installing it into the project. `http-server` is a real, tiny package that serves the current folder over a local URL — install it forever with `npm install`, or borrow it for thirty seconds with `npx`.',
    },
  ];

  /**
   * Sample: three real dependency lines, each using a different semver range symbol.
   *
   * Deliberately valid JSON with no inline comments, unlike an earlier version of this sample —
   * a real `package.json` cannot contain `//` comments, and the annotation panel is a better
   * place for the explanation than a comment that would break the file if pasted verbatim.
   */
  protected readonly semverSample = `{
  "dependencies": {
    "@angular/core": "^21.2.0",
    "chart-lib": "~4.2.1",
    "old-plugin": "4.2.1"
  }
}`;

  /** Line-by-line walkthrough of {@link semverSample}. */
  protected readonly semverNotes: CodeNote[] = [
    {
      line: 3,
      text: 'The caret `^` — by far the most common range. Read it as "this version, or newer, but never the next **major**". `^21.2.0` allows `21.2.1`, `21.9.0`, any `21.x.y` — never `22.0.0`, because a major bump is semver\'s own signal that something breaking changed.',
    },
    {
      line: 4,
      text: 'The tilde `~` is stricter: "this version, or newer, but never the next **minor**". `~4.2.1` allows `4.2.2` and `4.2.9`, but not `4.3.0`. Reach for it on a dependency where even small feature releases make you nervous.',
    },
    {
      line: 5,
      text: 'No symbol at all means **exact**. `npm install` will never pick anything but precisely `4.2.1` here — no surprises, but also no automatic bug fixes; you would have to bump the number yourself.',
    },
  ];

  /**
   * Sample: the "scripts" block, and which names get npm's shorthand treatment.
   */
  protected readonly scriptsSample = `{
  "scripts": {
    "start": "ng serve",
    "build": "ng build",
    "test": "ng test"
  }
}`;

  /** Line-by-line walkthrough of {@link scriptsSample}. */
  protected readonly scriptsNotes: CodeNote[] = [
    {
      line: 3,
      text: '`start` is one of a handful of names npm treats specially — you can type the shorter `npm start`, no `run` in the middle.',
    },
    {
      line: 4,
      text: '`build` is an ordinary name, so it needs the full form: `npm run build`. Most of your own scripts will need the word `run`.',
    },
    {
      line: 5,
      text: '`test` gets the same shortcut as `start` — `npm test` works, alongside the longer `npm run test`.',
    },
  ];

  /**
   * Sample: the Angular CLI commands that make up a typical day, in the order you would
   * actually type them starting from nothing.
   */
  protected readonly cliSample = `npm install -g @angular/cli
ng new my-app
cd my-app
ng serve
ng generate component header
ng build
ng test`;

  /** Line-by-line walkthrough of {@link cliSample}. */
  protected readonly cliNotes: CodeNote[] = [
    {
      line: 1,
      text: '`-g` means **global** — this installs the `ng` command onto your whole machine, once, so it exists in every project from now on rather than just this one.',
    },
    {
      line: 2,
      text: 'Scaffolds an entire runnable project from nothing: folders, config, a starter component, asking you a few setup questions along the way.',
    },
    {
      line: 3,
      text: "**Step inside the project.** Every `ng` command from here on assumes you're standing inside an Angular project — run one from the wrong folder and there's nothing for it to act on.",
    },
    {
      line: 4,
      text: 'Starts the dev server and **keeps running** — no new prompt appears until you press Ctrl+C. It rebuilds and refreshes the browser automatically every time you save a file.',
    },
    {
      line: 5,
      text: 'Scaffolds a new component — a `.ts`, `.html` and `.css` file, wired together and ready to use. Shorthand: `ng g c header`.',
    },
    {
      line: 6,
      text: 'Compiles the whole app for real users: optimized, minified, and written into a `dist/` folder — the thing you actually deploy.',
    },
    {
      line: 7,
      text: "Runs the project's automated tests once and reports pass or fail. No server, no browser tab — just a report in this same window.",
    },
  ];

  /** The wall of text npm prints on a peer-dependency conflict. */
  protected readonly eresolveSample = `npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR!
npm ERR! While resolving: my-app@1.0.0
npm ERR! Found: @angular/core@21.2.0
npm ERR!
npm ERR! Could not resolve dependency:
npm ERR! peer @angular/core@"^18.0.0" from some-old-library@2.0.0
npm ERR!
npm ERR! Fix the upstream dependency conflict, or retry
npm ERR! this command with --force or --legacy-peer-deps
npm ERR! to accept an incorrect (and potentially broken) dependency resolution.`;

  /** The ERESOLVE predict's prompt — a scenario, not a definition. */
  protected readonly eresolvePrompt =
    'You run `npm install some-old-library` and instead of the usual one-line summary, npm prints a wall of ten-plus red lines ending in `npm ERR! code ERESOLVE`. Before you scroll: is `node_modules/` corrupted — so deleting it and reinstalling will fix this — or is something else going on?';

  /** The reveal for {@link eresolvePrompt}. */
  protected readonly eresolveAnswer =
    "Nothing is corrupted, and deleting `node_modules/` changes nothing — the exact same error comes back, because the conflict lives in `package.json`, not in any cached files. `ERESOLVE` means two packages disagree about which version of a **shared dependency** is allowed: your project has `@angular/core@21`, but `some-old-library` declares in its own `package.json` that it only works with `@angular/core@^18`. npm 7+ refuses to silently guess which one wins, so it stops and shows you both sides of the disagreement. There are exactly two honest fixes: find a newer version of `some-old-library` that actually supports Angular 21, or add `--legacy-peer-deps` to the install command, which tells npm to stop enforcing peer-dependency ranges (the way npm 6 always behaved) and install anyway. That flag doesn't fix the incompatibility — it just means you're accepting the risk that `some-old-library` was never tested against your Angular version.";

  /** The wall of text npm prints on a permissions failure during a global install. */
  protected readonly eaccesSample = `npm ERR! code EACCES
npm ERR! syscall mkdir
npm ERR! path /usr/local/lib/node_modules/@angular
npm ERR! errno -13
npm ERR! Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules/@angular'`;

  /** The reach-for-it-first fix — and why it makes the next install worse, not better. */
  protected readonly sudoFixSample = `sudo npm install -g @angular/cli
# installs fine — but every file it created is now owned by root`;

  /** The fix that actually solves the underlying permissions problem. */
  protected readonly properFixSample = `nvm install --lts
nvm use --lts
npm install -g @angular/cli   # no sudo — this Node install is entirely yours`;

  /** The `npm ci` predict prompt — a scenario, not a definition. */
  protected readonly npmCiPrompt =
    'Your CI server runs `npm ci` on every push, and today it turned red with: "npm ci can only install packages when your package.json and package-lock.json are in sync." Meanwhile `npm install` still works perfectly on your own laptop — no errors at all. Before you scroll: why would two commands that both claim to install the dependencies disagree about whether this project can even be installed?';

  /** The reveal for {@link npmCiPrompt}. */
  protected readonly npmCiAnswer =
    'Neither command is broken — they disagree on purpose. `npm install` is **forgiving**: if `package.json` and `package-lock.json` have drifted apart (someone added a dependency by hand, or a range now resolves differently), it quietly reconciles them, rewrites the lock file to match, and installs anyway. `npm ci` is **strict**: it never touches the lock file, deletes `node_modules/` completely, and installs exactly what the lock file already says — if that disagrees with package.json, it stops immediately instead of guessing. That strictness is exactly why CI reaches for it: a build that passes should mean the lock file is trustworthy everywhere, not just on one laptop. The usual fix is to run `npm install` locally, commit the regenerated `package-lock.json`, and push again — now `npm ci` has a lock file that actually matches.';

  /**
   * Self-test 1 — committing `node_modules/` to Git.
   *
   * The correct option names the sharp, easy-to-miss edge (platform-specific compiled
   * binaries); the distractors are the three ways people talk themselves into thinking it is
   * fine, each corrected on its own terms rather than just told it is wrong.
   */
  protected readonly gitQuizOptions: QuizOption[] = [
    {
      text: 'Not much — it just makes `git clone` a little slower for anyone who checks the project out.',
      why: 'It does make clones slower, but that undersells it badly. `node_modules/` is routinely hundreds of megabytes, and once it is in Git history it stays there forever — even if someone deletes it in a later commit, every future clone still downloads that history. "a little slower" is optimistic for what is usually a ten-times-or-more repository size increase.',
    },
    {
      text: "It can genuinely fail to run at all on a teammate's machine, because some packages ship compiled binaries built for one specific operating system and CPU.",
      correct: true,
      why: "This is the sharp edge people do not expect. Packages with native or image-processing code download or compile a real binary file during install — one built for Windows will not run on macOS, and one built for an Intel Mac will not run on Apple Silicon. Commit `node_modules/` and you have frozen in one machine's binaries; a teammate on different hardware gets a mysterious crash that a fresh `npm install` would have quietly prevented by installing the right binary for them.",
    },
    {
      text: "It's harmless, because `npm install` will just overwrite it with the correct files the next time someone runs it.",
      why: 'True on the machine where someone eventually reruns install — but the damage to the repository already happened and cannot be undone by a later install. Every clone from now on still pays for the bloat already sitting in Git history, diffs and blame become useless inside a folder nobody should ever read, and if nobody reruns install, the wrong binaries ship exactly as committed.',
    },
    {
      text: 'It actually improves reproducibility, since everyone gets the literal files instead of relying on a lock file.',
      why: 'It has the right instinct — reproducibility matters — aimed at the wrong tool. `package-lock.json` already guarantees everyone resolves the exact same versions, in a few kilobytes of plain text that diffs cleanly. `node_modules/` is generated output, not source, and output generated for a different operating system or chip is less reproducible than simply regenerating it fresh on each machine, not more.',
    },
  ];

  /**
   * Self-test 2 — caret ranges.
   *
   * The correct option is deliberately not the "obvious" boundary case; it is the ordinary,
   * unremarkable version bump that a beginner would not expect npm to be allowed to choose.
   */
  protected readonly semverQuizOptions: QuizOption[] = [
    {
      text: 'Only exactly `18.0.0` — the version written down, nothing else.',
      why: 'That is what no symbol at all would mean. A caret specifically means "this version or later", so npm is free to pick something newer than what is written — that is the entire point of writing a range instead of an exact number.',
    },
    {
      text: '`18.4.2` — a newer patch and minor release, still Angular 18.',
      correct: true,
      why: 'Exactly — the caret allows any `18.x.y`, so long as it is at least `18.0.0`. This is the whole reason caret ranges exist: you get bug fixes and new backwards-compatible features automatically, with no edits to package.json at all.',
    },
    {
      text: '`19.0.0` — the next major version.',
      why: 'This is the one line a caret range refuses to cross. A major version bump is the signal semver reserves for "breaking changes may be inside", so `npm install` will never pick 19 on your behalf — only a deliberate upgrade does that.',
    },
    {
      text: '`17.9.9` — an older version, in case that one turns out more stable.',
      why: 'Caret ranges only ever move forward from the version written down. `18.0.0` is a floor, not a suggestion — nothing older than it is ever installed by this range.',
    },
  ];

  /** The Angular CLI refusing to run at all because Node itself is too old. */
  protected readonly nodeVersionMismatchSample = `The Angular CLI requires a minimum Node.js version of v20.19.0.

Node.js version v18.16.0 detected.`;

  /** `ng serve` refusing to start — the two most common reasons, side by side. */
  protected readonly portInUseSample = `? Port 4200 is already in use. Would you like to use a different port? (Y/n)`;

  /** `ng` not being found at all — a different failure, from before Angular ever runs. */
  protected readonly ngNotFoundSample = `'ng' is not recognized as an internal or external command,
operable program or batch file.`;

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Is the terminal the same thing as Command Prompt or PowerShell?',
      a: 'Not quite — think of the **terminal** as the window, and Command Prompt, PowerShell, bash and zsh as the program running inside it that actually understands your typing, called a **shell**. Windows ships two shells (Command Prompt and PowerShell); Mac and Linux ship bash or zsh. Editors like VS Code let you pick which shell opens in their built-in terminal, and every command on this page works in any of them.',
    },
    {
      q: 'Do I need to understand every line of package.json?',
      a: 'No, and you should not try to memorise it. Most lines are maintained for you: `npm install lodash` writes its own line; `ng new` writes the whole skeleton once, at the very start. The two sections worth reading on purpose are `"dependencies"` (what the project needs) and `"scripts"` (the commands the team agreed on) — everything else, look up the one time you actually need it.',
    },
    {
      q: "What's actually inside node_modules, and is it safe to delete the whole folder?",
      a: "Completely safe — that is the entire point of it being disposable. Inside are the packages you listed, plus every package **they** depend on, sometimes thousands of folders deep. Delete it, run `npm install` again, and it comes back byte-for-byte from `package-lock.json`. 'Delete node_modules and reinstall' is most developers' first fix for a bizarre, unexplainable error — it is web development's version of turning it off and on again, and it costs you nothing you cannot get back.",
    },
    {
      q: 'What is the difference between npm and npx?',
      a: '`npm install <pkg>` downloads a package **into this project**, permanently, for repeated use — it becomes a line in `package.json`. `npx <tool>` fetches (if needed) and runs a tool **once**, without installing it long-term. Reach for `npx` for a one-off scaffolder you will only ever run a single time per project.',
    },
    {
      q: 'With `^18.0.0` in package.json, could `npm install` ever give you Angular 22?',
      a: 'No. A caret range stops dead at the next major version, because a major bump is the signal semver uses for "this release may contain breaking changes." `npm install` will never cross that line by itself — you would only ever get the newest `18.x.y` available. Moving to Angular 22 is a deliberate act, usually `ng update`, which also runs the accompanying code migrations.',
    },
  ];
}
