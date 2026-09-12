import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

/**
 * One commit in a demo history.
 */
interface Commit {
  msg: string;
  id: string;
}

/**
 * Where a file sits in Git's four-state model. The staged state is the one that
 * has no equivalent in ordinary file saving, and the one this lesson exists to
 * make concrete.
 */
type FileState = 'untracked' | 'modified' | 'staged' | 'committed';

/**
 * A file in the three-areas simulator's pretend repository.
 */
interface RepoFile {
  name: string;
  state: FileState;
}

/**
 * Lesson: Git — absolute zero to the daily loop. The three-area mental model
 * (working directory / staging / history) proven with a live simulator, the
 * everyday command loop annotated line by line, branches and what checking one
 * out actually does to your files, a real merge conflict read end to end,
 * remotes/GitHub/pull requests, and the recovery drawer ranked by danger.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`).
 * It copies `expert/change-detection`'s section rhythm and
 * `foundations/terminal-and-npm`'s absolute-beginner register — this is the very
 * next lesson in the Your Dev Toolkit track, for a reader who has never opened a
 * terminal or heard the word "commit" before today.
 *
 * ## Teaching order, and why it is this order
 *
 * 1. **Pose the trap before naming it.** The opening napkin asks the reader to
 *    guess what happens when two people edit the exact same line, and
 *    deliberately withholds the answer until the merge-conflicts section — the
 *    curiosity gap is what makes the mechanical answer, once it finally arrives,
 *    worth remembering.
 * 2. **A kitchen analogy before any command name.** "Counter, tray, plated
 *    meal" gives working-directory/staging/history somewhere to attach before
 *    the vocabulary itself shows up — a diagram and a live simulator then say
 *    the same thing two more ways, on purpose, because this three-area model is
 *    the one idea a beginner will misuse for months if it does not stick now.
 * 3. **The staging trap gets its own predict-then-reveal**, right after the
 *    simulator has built the reader's intuition, because "I committed but my
 *    change is missing" is the single most common first real-world Git mistake.
 * 4. **Three different beginner traps get three different devices** — a
 *    predict-and-reveal for the silently-uncommitted file, a self-test for
 *    `push --force` overwriting a teammate's work, and a staged dialogue for
 *    "does committing tell anyone else about it?" — rather than one quiz block
 *    trying to cover all three at once.
 * 5. **Every command sample is annotated line by line**, terminal-transcript
 *    style, via `app-code-lab` — nothing here assumes the reader has ever typed
 *    a Git command before, because the entire audience has not.
 */
@Component({
  selector: 'app-lesson-git-basics',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './git-basics.html',
  styleUrl: './git-basics.css',
})
export class GitBasics {
  /**
   * Sequence source for the commit-history demo's fake hashes.
   */
  private n = 0;
  /**
   * The commit-history demo's commits, newest first.
   */
  protected readonly commits = signal<Commit[]>([]);

  /**
   * Adds a commit, ignoring a blank message.
   *
   * @param msg The commit message.
   */
  protected commit(msg: string) {
    const m = msg.trim();
    if (!m) return;
    const id = (0xa1c0 + this.n++).toString(16).slice(0, 7);
    this.commits.update((list) => [{ msg: m, id }, ...list]);
  }
  /**
   * Drops the newest commit — the demo's stand-in for `git reset`.
   */
  protected undo() {
    this.commits.update((list) => list.slice(1));
  }

  /* ── three-areas simulator ── */
  /**
   * Sequence source for the staging simulator's hashes.
   */
  private simN = 0;
  /**
   * How many times the file has been edited, for generating distinct messages.
   */
  private editN = 0;
  /**
   * The simulator's one file and its current state.
   */
  protected readonly files = signal<RepoFile[]>([{ name: 'app.ts', state: 'committed' }]);
  /**
   * The simulator's own commit history, newest first.
   */
  protected readonly simCommits = signal<Commit[]>([]);

  /**
   * Whether anything is edited but not staged — enables `git add`.
   */
  protected readonly hasUnstaged = computed(() =>
    this.files().some((f) => f.state === 'modified' || f.state === 'untracked'),
  );
  /**
   * Whether anything is staged — enables `git commit`.
   */
  protected readonly hasStaged = computed(() => this.files().some((f) => f.state === 'staged'));

  /**
   * What `git status` would say right now, in plain English.
   *
   * The simulator's real payload: the three-stage cycle of working directory →
   * staging area → history is the part of Git that is genuinely unlike saving a
   * file, and "staged but not committed" is where most beginners lose work.
   */
  protected readonly simHint = computed(() => {
    if (this.hasUnstaged())
      return 'git status right now would list app.ts as a change not staged for commit. Stage it with git add to move it into the middle column.';
    if (this.hasStaged())
      return 'Staged — git status would show it ready to go — but nothing is saved yet. Commit to freeze it into history.';
    if (this.simCommits().length)
      return 'Working tree clean: everything is safely in history. Edit app.ts again to start another lap.';
    return 'Start by editing app.ts — that is what dirties the working directory.';
  });

  /**
   * Marks the file modified — the working-directory change.
   */
  protected editFile() {
    this.files.update((fs) =>
      fs.map((f) => (f.name === 'app.ts' ? { ...f, state: 'modified' as FileState } : f)),
    );
  }
  /**
   * Stages everything modified — `git add`.
   */
  protected addAll() {
    this.files.update((fs) =>
      fs.map((f) =>
        f.state === 'modified' || f.state === 'untracked'
          ? { ...f, state: 'staged' as FileState }
          : f,
      ),
    );
  }
  /**
   * Commits what is staged, leaving anything unstaged behind. That the two are
   * separate steps is the entire point of the demo.
   */
  protected commitStaged() {
    const id = (0xb2d0 + this.simN++).toString(16).slice(0, 7);
    this.simCommits.update((list) => [{ id, msg: `Edit app.ts (#${++this.editN})` }, ...list]);
    this.files.update((fs) =>
      fs.map((f) => (f.state === 'staged' ? { ...f, state: 'committed' as FileState } : f)),
    );
  }
  /**
   * Resets the simulator to a clean, freshly-committed repository.
   */
  protected resetSim() {
    this.files.set([{ name: 'app.ts', state: 'committed' }]);
    this.simCommits.set([]);
    this.simN = 0;
    this.editN = 0;
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Your Dev Toolkit track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Terminal & npm', id: 'terminal-and-npm' },
    { label: 'Git & Version Control' },
    { label: 'Debugging & Errors', id: 'debugging-basics' },
  ];

  /**
   * The local-vs-remote relationship, staged as a conversation — the
   * misconception this corrects is a beginner assuming a commit is somehow
   * already shared, or that `pull` happens on its own.
   */
  protected readonly syncTalk: BubbleTurn[] = [
    {
      who: 'You',
      says: 'I just ran `git commit -m "Add login form"`. My teammate can see it now, right?',
    },
    {
      who: 'Git',
      says: "No. `commit` only ever writes to **your own machine's** history. Nothing has left this computer.",
    },
    { who: 'You', says: 'Okay — `git push`, then.' },
    {
      who: 'The remote (GitHub)',
      says: 'Now I have it. From this moment, anyone who pulls **from me** gets your commit.',
    },
    {
      who: 'Your teammate',
      says: 'I ran `git pull` and now I have it too — but only because I asked. Git never pushes anything at me on its own.',
    },
  ];

  /**
   * Sample: the two ways a repository actually starts — joining one that
   * already exists, or publishing a brand-new one. Every other demo on this
   * page quietly assumes a repo (and, later, a remote) already exists.
   */
  protected readonly dayZeroSample = `git config --global user.name "Ada Lovelace"
git config --global user.email "ada@example.com"
git clone https://github.com/org/repo.git
cd repo
npm install
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/you/repo.git
git push -u origin main`;

  /** Line-by-line walkthrough of {@link dayZeroSample}. */
  protected readonly dayZeroNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Sets the name attached to **every** commit you make on this machine, from now on. `--global` means every repository, not just this one — run it once per machine, not once per project.',
    },
    {
      line: 2,
      text: 'Same idea, for email. Do both of these before your very first commit anywhere — a commit made before they are set is not retroactively fixed by setting them afterward.',
    },
    {
      line: 3,
      text: "**Path A — joining a project that already exists.** Copies the entire history, every file, and the `origin` remote pointer, in one command. This is the only command on this page that hands you a working copy of someone else's repository.",
    },
    {
      line: 4,
      text: '`clone` creates a new folder named after the repository — move into it before touching anything.',
    },
    {
      line: 5,
      text: "Not a Git command. What you cloned is the *source* the project is built from, not the dependencies it needs to actually run — that's what this installs.",
    },
    {
      line: 6,
      text: '**Path B — publishing a brand-new repository, from scratch.** Creates a hidden `.git` folder right here — that folder *is* the entire database. Delete it, and every bit of history is gone with it.',
    },
    {
      line: 7,
      text: 'Ordinary staging, exactly as the everyday loop further down covers — genuinely no different once a repository exists, however it got started.',
    },
    {
      line: 8,
      text: 'Your very first commit. So far, nothing has said anything about where this history lives beyond your own machine.',
    },
    {
      line: 9,
      text: '**Names a remote** — `origin` is only the conventional name, not a keyword — and points it at an empty repository you create on GitHub (or similar) first. Nothing uploads yet; this just tells Git where "there" is.',
    },
    {
      line: 10,
      text: 'The first upload. `-u` links your local `main` to `origin/main` as its upstream, so every push after this one can just be the bare `git push` from the everyday loop below.',
    },
  ];

  /**
   * Sample: a push rejected because the remote has diverged — the terminal
   * output verbatim, since this is the ordinary safety check `--force`
   * (further down this page) exists specifically to bypass.
   */
  protected readonly rejectedPushSample = `git push
To https://github.com/you/repo.git
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to 'https://github.com/you/repo.git'
hint: Updates were rejected because the remote contains work that you do
hint: not have locally. This is usually caused by another repository pushing
hint: to the same ref.`;

  /** Line-by-line walkthrough of {@link rejectedPushSample}. */
  protected readonly rejectedPushNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The exact same command from the everyday loop above. This time, the remote has moved on since your last `pull`.',
    },
    {
      line: 2,
      text: "Git names the remote it's talking to, then reports what actually happened below.",
    },
    {
      line: 3,
      text: "`[rejected]` — nothing uploaded. `(fetch first)` is Git's own hint at the fix, spelled out in one word.",
    },
    {
      line: 4,
      text: 'The push genuinely failed. None of your commits reached the remote, and your local history is completely untouched.',
    },
    {
      line: 5,
      text: "The plain-English reason: someone else pushed to this exact branch after your last pull, so there's no straight line from the remote's tip to yours.",
    },
    {
      line: 6,
      text: 'Git refuses to guess which history should win — that decision is yours, via `pull` or `pull --rebase`, not something a push should ever decide silently.',
    },
  ];

  /**
   * Sample: the everyday loop, as a bare terminal transcript with no inline
   * comments — the numbered notes below carry the entire explanation, the same
   * convention `terminal-and-npm` uses for its own transcripts.
   */
  protected readonly everydayLoopSample = `git status
git diff
git add .
git add src/app/login.ts
git commit -m "Add login form"
git log --oneline
git push
git pull`;

  /** Line-by-line walkthrough of {@link everydayLoopSample}. */
  protected readonly everydayLoopNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Run this first, always. It lists every file that changed since the last commit, split into what is staged (ready to go) and what is not — and it tells you, in words, the exact next command for each one.',
    },
    {
      line: 2,
      text: 'Shows the exact lines that changed, not just which files — added lines marked one way, removed lines another. Reach for it right after `status` to double-check what you are about to stage.',
    },
    {
      line: 3,
      text: 'Stages every changed file in the current folder and everything below it. The `.` means "here, and everything inside here" — the same meaning it has in a terminal.',
    },
    {
      line: 4,
      text: 'Stages exactly one file, by its path, and leaves everything else untouched. This is how a commit stays a focused, logical change even when your working directory has five unrelated edits sitting in it.',
    },
    {
      line: 5,
      text: 'Snapshots whatever is currently staged — and only what is staged — into history, permanently, with the words after `-m` attached to it forever. Anything modified but not staged is left behind, exactly like the simulator above showed.',
    },
    {
      line: 6,
      text: 'Reads the history back, newest commit first: one line per commit, its short id and its message. This is what all those careful commit messages were for.',
    },
    {
      line: 7,
      text: 'Uploads every commit you have that the remote does not — GitHub, by default. Nothing you commit reaches a teammate until this runs.',
    },
    {
      line: 8,
      text: "Downloads every commit your teammates have pushed that you don't have, and merges it into your current branch. Run it at the start of every session, before you start editing anything.",
    },
  ];

  /**
   * Sample: branch creation, a commit on it, switching back to `main`, and
   * merging — with the CodeLab's own predict strip carrying the "did I just
   * lose my files?" beginner fear right where the answer belongs.
   */
  protected readonly branchSample = `git checkout -b login-page
git add .
git commit -m "Add login form"
git checkout main
git merge login-page
git branch -d login-page`;

  /** Line-by-line walkthrough of {@link branchSample}. */
  protected readonly branchNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Two jobs in one command: create a brand-new branch called `login-page`, pointing at your current commit, **and** switch onto it immediately. `main` does not move — this only adds a new label.',
    },
    {
      line: 2,
      text: 'Ordinary staging, exactly as before. Branches change which line of history a commit joins to, not how `add` or `commit` themselves behave.',
    },
    {
      line: 3,
      text: "This commit is added to `login-page` only. `main`'s history is completely untouched by anything that happens while you are standing on another branch.",
    },
    {
      line: 4,
      text: "Switches the label you are standing on back to `main` — and rewrites your working directory to match `main`'s snapshot. Any file that only existed on `login-page` disappears from your editor right now, not because it was deleted, but because you are looking at a different snapshot.",
    },
    {
      line: 5,
      text: "Replays `login-page`'s commits into `main`'s history. If nothing on `main` touched the same lines while you were away, this finishes instantly with no fuss at all.",
    },
    {
      line: 6,
      text: "Deletes the label only, now that its work is safely inside `main`. The commits themselves are not going anywhere — they are simply part of `main`'s history now.",
    },
  ];

  /**
   * Sample: a real merge conflict, exactly as Git writes it into the file —
   * the honest, mechanical answer to the napkin question posed at the top of
   * the page.
   */
  protected readonly conflictSample = `<<<<<<< HEAD
<h1>Welcome back</h1>
=======
<h1>Hello again</h1>
>>>>>>> login-page`;

  /** Line-by-line walkthrough of {@link conflictSample}. */
  protected readonly conflictNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The marker for **your** side starts here. `HEAD` means "the branch you currently have checked out" — `main`, in this example.',
    },
    {
      line: 2,
      text: 'Everything between this marker and the next one is what your branch actually says at this exact line.',
    },
    {
      line: 3,
      text: 'The dividing line. Everything above it is your version; everything below, down to the closing marker, is theirs.',
    },
    {
      line: 4,
      text: "The other branch's version of the exact same line — `login-page`, here. Git genuinely could not choose between the two on its own, which is the entire reason it stopped and asked you.",
    },
    {
      line: 5,
      text: 'The end of their side, labelled with the branch it came from, so you know at a glance whose version is whose.',
    },
  ];

  /**
   * Sample: the recovery drawer, ranked loosely by how dangerous each command
   * actually is — the same order the tape cards below use.
   */
  protected readonly recoverySample = `git restore file.ts
git restore --staged file.ts
git commit --amend
git revert a1c07f3`;

  /** Line-by-line walkthrough of {@link recoverySample}. */
  protected readonly recoveryNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Throws away **uncommitted** edits to this file and replaces them with the last committed version. There is no undo for this one — read the filename twice before you press enter.',
    },
    {
      line: 2,
      text: 'Un-stages the file — undoes a `git add` — without touching a single character inside it. The edit is still sitting right there in your working directory, just no longer selected for the next commit.',
    },
    {
      line: 3,
      text: 'Replaces the most recent commit instead of creating a new one — fix a typo in the message, or add a file you forgot to stage. Safe on a commit only you have; if you already pushed it and a teammate pulled it, amending gives the two of you disagreeing histories.',
    },
    {
      line: 4,
      text: 'Undoes a commit **safely**, by creating a brand-new commit that applies the exact opposite change. History only ever grows — nothing is deleted or rewritten — which is why this is the one to reach for on a branch other people share.',
    },
  ];

  /**
   * The "committed but the new file is missing" predict-then-reveal — the
   * single most common first real-world Git mistake, and a direct extension of
   * the three-areas simulator the reader just used.
   */
  protected readonly commitTrapPrompt =
    'You edit `app.ts`, which Git already tracks, and you also create a brand-new file, `login.ts`. You run `git add app.ts`, then `git commit -m "Add login page"`. Git reports success — no error, no warning. A teammate pulls your commit… and `login.ts` does not exist anywhere on their machine. What went wrong?';

  /** The reveal for {@link commitTrapPrompt}. */
  protected readonly commitTrapAnswer =
    'Git only ever commits what is **staged**, and `git add app.ts` staged exactly one file — not `login.ts`. The commit genuinely succeeded, and genuinely recorded something real (your edit to `app.ts`), which is exactly why there was no error: from `git`\'s point of view, nothing went wrong at all. `login.ts` is still sitting in your working directory, untracked, waiting for its own `git add`. This is the single most common beginner trap in Git — "I committed, but my change is missing" almost always means "I forgot to stage that specific file." Running `git status` before every commit would have shown `login.ts` in the untracked list — which is exactly why the everyday loop starts there.';

  /**
   * The self-test — `git push --force` silently overwriting a teammate's
   * unpushed commit. The distractors are the three ways a beginner talks
   * themselves out of the danger: that Git would refuse, merge, or wait.
   */
  protected readonly forcePushQuestion =
    'You run `git push --force` to clean up your own messy branch. A teammate pushed one commit to that exact branch two minutes earlier, and you never ran `git pull` to get it first. What happens to their commit?';

  /** Options for {@link forcePushQuestion}. */
  protected readonly forcePushOptions: QuizOption[] = [
    {
      text: 'Git refuses the push, the same way an ordinary `git push` refuses when your branch is behind.',
      why: "That refusal is exactly what a plain `git push` does — and exactly the safety check `--force` exists to bypass. The flag's entire job is telling Git: skip that check, make the remote match my branch, no matter what it currently has.",
    },
    {
      text: 'Their commit is silently overwritten on the remote — gone from the branch, with no error printed to you at all.',
      correct: true,
      why: "This is the sharp edge of `--force`. It does not look for commits it does not know about and ask before removing them — it just replaces the remote branch's history with yours. Their commit is not instantly destroyed (it can sometimes be recovered from `git reflog` **on their own machine**, if they still have it locally), but the shared branch no longer points to it, and anyone who pulls after you gets a history where it never happened.",
    },
    {
      text: 'Git automatically merges both sets of commits into the branch, the same way `git pull` would.',
      why: 'That is what `pull` does when there is no conflict — it merges. `push --force` is closer to the opposite: it does not compare histories or combine anything, it overwrites.',
    },
    {
      text: 'Nothing happens yet — Git keeps both versions until your teammate also pushes, then asks which one to keep.',
      why: 'There is no pending or ask-later state here. The moment your force-push finishes, the remote branch pointer already points only at your history. Your teammate finds out the hard way, the next time they try to push or pull — not before.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'I edited three files but only want two of them in this commit. How?',
      a: 'Stage only the ones you want: `git add fileA.ts fileB.ts`, then `git commit`. The third file stays modified-but-unstaged, ready for its own commit later. This is exactly what the staging area is for — a commit as one curated, logical change, not "everything I happened to touch today."',
    },
    {
      q: "What's the difference between `git add` and `git commit`?",
      a: '`add` moves a change into the staging area — a reversible selection, nothing saved yet. `commit` permanently snapshots whatever is currently staged, with a message, into history. Two verbs, two separate areas: you can `add` and re-`add` all day without ever creating a single permanent record.',
    },
    {
      q: 'A bad commit is already pushed and teammates have pulled it. Do I `revert` it or delete it from history?',
      a: '`git revert` — it adds a **new** commit containing the opposite change, so history only ever grows forward. Deleting or rewriting a commit other people already have means your copy of history and theirs now disagree, and the next push or pull between you turns into a mess. The rule for anything shared: history is append-only. Save rewriting for commits that are still only on your own machine.',
    },
    {
      q: "What's the actual difference between Git and GitHub?",
      a: "Git is the tool — a program that runs entirely on your own computer and tracks history, no internet required; every demo on this page ran with zero network calls. GitHub is a company's website that hosts a copy of your Git repository in the cloud, plus features Git itself knows nothing about: pull requests, line-by-line review comments, issue tracking, CI. You could use Git your whole career without ever touching GitHub — some teams use GitLab or Bitbucket instead — but you would be doing without the collaboration layer that makes a team actually work together on the history Git is quietly tracking.",
    },
    {
      q: 'Do I need to commit every single tiny change I make?',
      a: "No — and you don't want to. A useful commit is one **logical** change (\"Add email validation to signup form\"), not every keystroke along the way. A rough guide: if you can't summarise what changed in one honest sentence, it's either too big to commit yet or not finished. What you should do constantly is check `git status` and `git diff` — looking costs nothing and takes a second; committing is the deliberate step you take once a change actually holds together.",
    },
  ];
}
