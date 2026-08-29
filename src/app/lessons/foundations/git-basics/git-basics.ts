import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * One commit in the demo history.
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
 * A file in the demo repository.
 */
interface RepoFile {
  name: string;
  state: FileState;
}

/**
 * Lesson: Git — the three areas (working dir / staging / history) with a live
 * simulator that moves files through them, commit anatomy, the everyday loop
 * dissected command by command, branching + merging (incl. what a conflict
 * actually looks like), remotes/GitHub/pull requests, and recovery commands.
 */
@Component({
  selector: 'app-lesson-git-basics',
  imports: [RouterLink],
  templateUrl: './git-basics.html',
  styleUrl: './git-basics.css',
})
export class GitBasics {
  /**
   * Sequence source for fake commit hashes.
   */
  private n = 0;
  /**
   * The simple commit-history demo's commits, newest first.
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
   * The repository's files and their states.
   */
  protected readonly files = signal<RepoFile[]>([{ name: 'app.ts', state: 'committed' }]);
  /**
   * The staging simulator's commits, newest first.
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
   * What `git status` would say right now.
   *
   * The simulator's real payload: the three-state cycle of working directory →
   * staging area → repository is the part of Git that is genuinely unlike saving a
   * file, and "staged but not committed" is where most beginners lose work.
   */
  protected readonly simHint = computed(() => {
    if (this.hasUnstaged()) return 'git status would show app.ts in red ("changes not staged"). Stage it with git add.';
    if (this.hasStaged()) return 'Staged (git status shows it green) — but NOT saved yet. Commit to snapshot it.';
    if (this.simCommits().length) return 'Working tree clean — everything is safely in history. Edit again to start another cycle.';
    return 'Start by editing a file — that dirties the working directory.';
  });

  /**
   * Marks the file modified — the working-directory change.
   */
  protected editFile() {
    this.files.update((fs) => fs.map((f) => (f.name === 'app.ts' ? { ...f, state: 'modified' as FileState } : f)));
  }
  /**
   * Stages everything modified — `git add`.
   */
  protected addAll() {
    this.files.update((fs) =>
      fs.map((f) => (f.state === 'modified' || f.state === 'untracked' ? { ...f, state: 'staged' as FileState } : f)),
    );
  }
  /**
   * Commits what is staged, leaving anything unstaged behind. That the two are
   * separate steps is the point.
   */
  protected commitStaged() {
    const id = (0xb2d0 + this.simN++).toString(16).slice(0, 7);
    this.simCommits.update((list) => [{ id, msg: `Edit app.ts (#${++this.editN})` }, ...list]);
    this.files.update((fs) => fs.map((f) => (f.state === 'staged' ? { ...f, state: 'committed' as FileState } : f)));
  }
  /**
   * Resets the simulator to a clean repository.
   */
  protected resetSim() {
    this.files.set([{ name: 'app.ts', state: 'committed' }]);
    this.simCommits.set([]);
    this.simN = 0;
    this.editN = 0;
  }
}
