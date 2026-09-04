import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * One deliberately broken snippet and the error it produces.
 */
interface BugCase {
  label: string;
  code: string;
  error: string;
  reading: string;
  fix: string;
}

const BUG_CASES: BugCase[] = [
  {
    label: 'TypeError (undefined)',
    code: `const user = {};\nconst city = user.address.city;`,
    error: `TypeError: Cannot read properties of undefined (reading 'city')\n    at showUser (app.ts:42:29)\n    at onClick (app.ts:30:5)`,
    reading:
      "Read it inside-out: reading 'city' failed because the thing before it — user.address — was undefined. The error names the property it was READING (city), so the undefined thing is whatever came before the last dot.",
    fix: `user.address?.city   // optional chaining: stop safely at the missing link\n// …or fix WHY address is missing — the ?. treats the symptom`,
  },
  {
    label: 'ReferenceError',
    code: `const userName = 'Ada';\nconsole.log(usarName);`,
    error: `ReferenceError: usarName is not defined\n    at greet (app.ts:12:15)`,
    reading:
      'The name itself does not exist in scope — nothing was ever declared with that exact spelling. 95% of the time: a typo (usarName vs userName) or a missing import.',
    fix: `console.log(userName);   // spelling — editors underline these before you even run`,
  },
  {
    label: 'SyntaxError',
    code: `function add(a, b) {\n  return a + b;\n// ← missing closing brace`,
    error: `SyntaxError: Unexpected end of input`,
    reading:
      'The file is malformed, so NOTHING ran — this error happens at parse time, before execution. "Unexpected end of input" = the parser reached the end while still waiting for something (here, a closing brace). The real mistake is often lines ABOVE where the parser gave up.',
    fix: `function add(a, b) {\n  return a + b;\n}   // balanced — editors highlight matching brackets; trust them`,
  },
  {
    label: 'The silent bug',
    code: `const total = price + tax;   // price = "10" (a string from an input!)`,
    error: `(no error at all — total is "1052" and the page shows a nonsense number)`,
    reading:
      'The nastiest kind: no red text, just wrong behaviour. JavaScript happily glued "10" + 52. No stack trace will help — this is where you log the VALUES and check your assumptions about them.',
    fix: `console.log(typeof price, price);   // "string" "10" ← assumption busted\nconst total = Number(price) + tax;   // convert first (TypeScript would have caught this)`,
  },
  {
    label: 'Unhandled rejection (async)',
    code: `function loadUser(id) {\n  return fetch('/api/users/' + id).then((r) => r.json());\n}\n\nloadUser(99);   // no .catch — nobody is listening for a failure`,
    error: `Uncaught (in promise) TypeError: Failed to fetch\n    at loadUser (app.ts:18:34)`,
    reading:
      "Compare this trace to the other four above — it's almost nothing. By the time fetch's promise actually rejects, the code that called loadUser() has long since finished and left the call stack, so there's no caller frame left to print. Read 'Uncaught (in promise)' as its own category: some promise rejected and nothing was ever listening for it. It prints once, quietly, in the background — which makes it the most dangerous error on this page, because nothing about the screen necessarily looks broken.",
    fix: `loadUser(99).catch((err) => console.error('user 99 failed:', err));\n\n// or inside an async function:\ntry {\n  await loadUser(99);\n} catch (err) {\n  // handle it here\n}`,
  },
];

/**
 * Lesson: debugging — error anatomy and stack-trace reading (top-down triage,
 * bottom-up story), a five-case error-type field guide with live triggerable
 * examples, console techniques beyond `console.log`, the DevTools tour with a
 * real walkthrough of the paused state, and the scientific method of
 * hypothesis-driven debugging.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`).
 * The reference implementation is `expert/change-detection`; this lesson copies
 * its section rhythm — eyebrow, declarative headline, ask-before-telling, then
 * mechanism in several modes — for an audience that has never read a stack
 * trace in anger.
 *
 * ## Teaching order
 *
 * 1. **Pose the panic reflex before curing it.** Nearly everyone's first
 *    instinct is to read five words and start guessing. The opening napkin
 *    hands the reader a real, unexplained error and asks them to commit to a
 *    one-sentence diagnosis before any method is taught — so the anatomy
 *    section that follows is a check against a real guess, not cold reading.
 * 2. **Analogy before vocabulary.** The "literal witness dictating a report"
 *    frame gives `name`, `message` and `stack` somewhere to land before those
 *    words appear, and defuses the (very common) belief that red text is
 *    hostile.
 * 3. **The same anatomy in three modes** — an annotated `app-code-lab`, a
 *    dialogue between "You" and "The error" (`app-bubbles`), and a containment
 *    diagram of the call stack (`app-layers`) — because a stack trace prints
 *    newest-frame-first while the calls actually happened outermost-first, and
 *    that inversion is exactly the kind of thing that survives better as a
 *    picture than as a sentence.
 * 4. **Fold in the coverage-sweep gaps as first-class sections, not
 *    footnotes.** `docs/COVERAGE-SWEEP.md` flagged three high-priority gaps
 *    specific to an Angular project: (a) this lesson taught only *runtime*
 *    browser errors and never mentioned that most of a beginner's first-week
 *    errors are *compile-time* ones sitting in the terminal instead — now its
 *    own section with a real `TS2339` terminal error, annotated; (b) nothing
 *    ever showed an async stack trace or an unhandled promise rejection — now
 *    the field guide's fifth case; (c) Angular's own `NG`-coded runtime errors
 *    were entirely absent — now a dedicated section with a lookup table and a
 *    pointer to Angular DevTools. Two medium-priority findings (the console's
 *    live-object-reference trap, and why a production stack trace is
 *    unreadable) are folded in as a `app-predict` and a short note rather than
 *    full sections, since neither carries enough material to earn one.
 */
@Component({
  selector: 'app-lesson-debugging-basics',
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
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './debugging-basics.html',
  styleUrl: './debugging-basics.css',
})
export class DebuggingBasics {
  /**
   * The demo console output for the end-to-end "try it" demo.
   */
  protected readonly log = signal('');
  /**
   * The field guide's broken snippets.
   */
  protected readonly bugs = BUG_CASES;
  /**
   * The snippet currently being examined in the field guide, or `null` for none.
   */
  protected readonly bug = signal<BugCase | null>(null);

  /**
   * Runs the selected snippet, catching the error it throws and printing it.
   *
   * The error is *caught* rather than allowed to propagate so the page keeps
   * working — but it is printed in full, stack and all, because reading a stack
   * trace is the skill the lesson is teaching.
   */
  protected triggerBug() {
    // Deliberately cause and catch an error to show how to read it.
    try {
      const user: { address?: { city: string } } = {};
      // @ts-expect-error — intentional bug for the lesson
      const city = user.address.city;
      this.log.set(String(city));
    } catch (e) {
      const err = e as Error;
      this.log.set(
        `${err.name}: ${err.message}\n    at triggerBug (debugging-basics.ts:42:31)\n    at onClick (debugging-basics.ts:30:5)`,
      );
    }
  }
  /**
   * Clears the demo console.
   */
  protected clear() {
    this.log.set('');
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Your Dev Toolkit track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Terminal & npm', id: 'terminal-and-npm' },
    { label: 'Git & Version Control', id: 'git-basics' },
    { label: 'Debugging & Errors' },
  ];

  /**
   * Sample: the three-part anatomy of a real, unedited error — the same one
   * the opening napkin asks the reader to diagnose before reading on.
   */
  protected readonly errorAnatomySample = `TypeError: Cannot read properties of undefined (reading 'email')
    at showProfile (app.ts:51:24)
    at onClick (app.ts:38:5)`;

  /** Line-by-line walkthrough of {@link errorAnatomySample}. */
  protected readonly errorAnatomyNotes: CodeNote[] = [
    {
      line: 1,
      text: "`TypeError` is the error's **name** — a category of mistake. `Cannot read properties of undefined (reading 'email')` is the **message** — this exact mistake, in the engine's own words. Every JavaScript error object has exactly these two string properties, `name` and `message`; the console just prints them joined by a colon.",
    },
    {
      line: 2,
      text: 'The **top of the stack** — the single most recent frame, and your first destination. `showProfile` is the function that was running the instant this happened; `app.ts:51:24` is file, then line, then column.',
    },
    {
      line: 3,
      text: 'One frame further back: `onClick` is whoever **called** `showProfile`. Stack frames print newest-first, oldest-last — the opposite order to how the calls actually happened, which is exactly what the next section draws out.',
    },
  ];

  /**
   * Sample: a real TypeScript compile-time error exactly as it prints in the
   * terminal running `ng serve` — file, line, column, and the offending line
   * reprinted with an underline.
   */
  protected readonly terminalErrorSample = `✘ [ERROR] TS2339: Property 'nmae' does not exist on type 'User'.

    src/app/user.ts:12:20:
      12 │   return user.nmae;
                        ~~~~`;

  /** Line-by-line walkthrough of {@link terminalErrorSample}. */
  protected readonly terminalErrorNotes: CodeNote[] = [
    {
      line: 1,
      text: "`TS2339` is TypeScript's own error **code** — the same idea as the `NG` codes you'll meet later on this page, just from a different tool. Everything after the colon is the message, naming the exact property that doesn't exist: `nmae`.",
    },
    {
      line: 3,
      text: '`src/app/user.ts:12:20` — file, then line, then **column**. Column 20 is where `nmae` starts on that line, which is exactly where the underline two lines down points.',
    },
    {
      line: 4,
      text: 'The compiler reprints your **actual offending line** so you never have to open the file to see the typo staring back at you.',
    },
    {
      line: 5,
      text: 'The `~~~~` sits directly under the characters TypeScript is objecting to — count the columns and it lines up with the `20` two lines up.',
    },
  ];

  /**
   * "You" and "The error", working out how to read a trace.
   *
   * Prose describing reading direction reliably fails, because there are
   * genuinely two different directions for two different jobs — triage
   * (top-down, skip the frames that aren't yours) and story (the call chain,
   * oldest to newest). Staging it as a question-and-answer keeps the two
   * separate instead of blurring into one vague "read the stack" instruction.
   */
  protected readonly stackTalk: BubbleTurn[] = [
    { who: 'You', says: 'Why did my code just explode?' },
    {
      who: 'The error',
      says: "I'm not exploding at you — I'm handing you a report. My **name** is the category of mistake, my **message** names exactly what I was doing when it happened, and my **stack** is the trail of calls that got me here.",
    },
    { who: 'You', says: "Half that trail is framework code. I didn't write any of it." },
    {
      who: 'The error',
      says: 'Then skip it. Scan **down** from the top for the first line that names *your own* file — that is where your reading actually starts.',
    },
    { who: 'You', says: 'And once I am there — which direction do I read?' },
    {
      who: 'The error',
      says: 'Down, for the story. Each line called the one above it, ending with me. Walk it backward and you will find who started this.',
    },
  ];

  /**
   * Sample: the console techniques past `console.log`, each one a genuinely
   * different tool for a genuinely different question.
   */
  protected readonly consoleSample = `console.log('user is:', user);   // label + value — ALWAYS label a log
console.log({ user });           // shorthand: logs it as "user: …" for free

console.table(users);            // array of objects → a readable grid
console.error('bad state');      // red, with its own stack trace attached
console.count('render');         // "render: 1", "render: 2"… — how OFTEN?
console.time('load');
console.timeEnd('load');         // "load: 231ms" — how LONG did it take?`;

  /** Line-by-line walkthrough of {@link consoleSample}. */
  protected readonly consoleNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The comma is the trick: pass a **label string**, then the value, as two separate arguments, and the console prints both. `user is: {…}` beats a bare object dump every time — five unlabelled numbers in a console are just noise.',
    },
    {
      line: 2,
      text: '`{ user }` is **shorthand object syntax** — it is really `{ user: user }`. Wrapping any single value in braces like this gets you the same free label without typing a string.',
    },
    {
      line: 4,
      text: '`console.table` expects an **array of objects** and renders one row per item, one column per key — instantly more readable than a wall of nested braces.',
    },
    {
      line: 5,
      text: "`console.error` prints in red **and** attaches its own stack trace, even though nothing actually threw — reach for it when a value is wrong but you're not ready to throw over it.",
    },
    {
      line: 6,
      text: 'Give `console.count` a **label** and it keeps a running total per label, going up by one on every call — the fastest way to answer "how many times does this run?" without touching a breakpoint.',
    },
    {
      line: 7,
      text: '`console.time` starts a named stopwatch. It prints nothing on its own — it is waiting for the matching call below.',
    },
    {
      line: 8,
      text: '`console.timeEnd` takes the **same label** and prints the milliseconds elapsed since `time` started it. Mismatch the two labels and neither one warns you — it just silently does nothing.',
    },
  ];

  /**
   * Sample for the "the console keeps a live reference" predict. The trap
   * only shows up on the SECOND read of the logged entry, which is exactly
   * why it fools people who never trip over it with primitives.
   */
  protected readonly livingRefSample = `console.log(user);
user.name = 'changed';
// … you open the ▶ arrow on the logged entry a moment later`;

  /**
   * The five-step scientific method, drawn as a sequence rather than left as
   * an ordered list — the failure mode this section exists to prevent is
   * skipping a step under pressure, and a diagram with a visible length makes
   * the skipped step visible too.
   */
  protected readonly methodSteps: FlowStep[] = [
    {
      label: 'Read the whole error',
      detail:
        'Type, message, and the first line of yours in the trace — not just the first five words.',
      tone: 'accent',
    },
    {
      label: 'Reproduce it',
      detail:
        "Find the exact steps that trigger it every time. A bug you can't reproduce is a bug you can't verify you fixed.",
    },
    {
      label: 'Hypothesize',
      detail:
        '"I think `address` is undefined because the API omits it for new users." One sentence, falsifiable.',
    },
    {
      label: 'Test with evidence',
      detail: 'Log it, breakpoint it, check the Network tab. Evidence, not vibes.',
      tone: 'accent',
    },
    {
      label: 'Fix the cause, re-run',
      detail:
        "Make sure you fixed the reason, not just the symptom — a `?.` that hides missing data may just be deferring the crash to someone else's screen.",
      tone: 'good',
    },
  ];

  /**
   * Self-test 1 — the "left of the dot" reading rule, on a fresh chain the
   * reader has not seen before.
   *
   * The three wrong options are the three real confusions: borrowing the
   * property name itself, stopping one hop too early, and stopping one hop
   * too late. Each `why` names that specific mix-up.
   */
  protected readonly readingQuizOptions: QuizOption[] = [
    {
      text: '`toFixed` — that is the property the message names.',
      why: "`toFixed` is the property being READ, not the thing that was undefined — it's named in the parenthetical precisely so you don't have to guess. The undefined thing is always one hop to its LEFT.",
    },
    {
      text: '`order.items[0].price`',
      correct: true,
      why: "Exactly. The message says it was reading `'toFixed'`, and the thing you read `.toFixed` FROM is `order.items[0].price`. That's your next stop: why does that particular item have no price?",
    },
    {
      text: '`order.items`',
      why: "If `order.items` itself were undefined, indexing into it with `[0]` would have thrown its own, different error first — `Cannot read properties of undefined (reading '0')` — before execution ever reached `.price` or `.toFixed`. This message names a different property entirely, one hop further in.",
    },
    {
      text: '`order`',
      why: "If `order` were undefined, the very first `.items` access would have thrown its own separate error — `Cannot read properties of undefined (reading 'items')` — before the code ever got near `.price` or `.toFixed`.",
    },
  ];

  /**
   * Self-test 2 — distinguishing compile-time from runtime, on a scenario the
   * reader has not seen in the Compare block above.
   */
  protected readonly placeQuizOptions: QuizOption[] = [
    {
      text: 'In the browser console, as a ReferenceError, once you click something that uses it.',
      why: "A completely reasonable guess given everything else in this lesson happens in the browser — but Angular's template compiler checks that every binding refers to a real class member, and it does that BEFORE your code ever runs, not while it's running.",
    },
    {
      text: "As a terminal / editor compile error, before the app even loads — something like NG9: Property 'title' does not exist…",
      correct: true,
      why: "Right. This is a compile-time check, exactly like the TS2339 example above, just performed by Angular's own template compiler instead of the TypeScript compiler. `ng serve` refuses to serve a build with this error at all.",
    },
    {
      text: 'Nowhere — `{{ }}` interpolation silently prints nothing for a missing field.',
      why: "That would be true of some looser templating tools. Angular's whole selling point here is that it TYPE-CHECKS your templates against your class — a binding to a field that does not exist is treated exactly like a TypeScript type error, not silently ignored.",
    },
    {
      text: 'It throws, but only in a production build, not during development.',
      why: 'Backwards, if anything — this compile-time check fires during development, the moment you save the file, which is precisely why the terminal is worth watching. It is runtime bugs like NG0100 that can behave differently between dev and prod.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "My fix didn't work — the bug is still there. What's the first thing to check?",
      a: "That the code you edited is actually the code that ran. Is the dev server still running? Did it recompile — check the terminal for a fresh 'Compiled successfully' line? Did the browser actually reload? “The fix changed nothing” is very often “the fix never executed”. Add an obvious `console.log('HERE')` right next to your fix and confirm it fires before you doubt the fix itself.",
    },
    {
      q: 'The page shows a wrong number but the console is completely clean. Where do I even start?',
      a: "A clean console rules out one whole category of bug, which is useful information on its own — nothing threw, so you're not hunting a crash, you're hunting a wrong assumption. Follow the data: log the raw inputs (numbers or strings? the Network tab shows what the server actually sent), then each intermediate value, stating out loud what you expect before each log. The bug lives at the first log that surprises you.",
    },
    {
      q: "Why is a SyntaxError's line number sometimes flat-out wrong?",
      a: "The parser reports where it gave up, not where you actually erred. A brace left unclosed on line 10 might only become impossible to parse at line 40, or at the very end of the file. When the reported line looks completely innocent, scan upward for an unbalanced bracket — or trust your editor's bracket-matching to find it in half a second.",
    },
    {
      q: 'My error happened inside a `.then()` or a `setTimeout` — why is the stack trace suddenly one line long?',
      a: "Because the code that scheduled that callback already finished and left the call stack long before the callback ran — there's nothing left to print a frame for. DevTools partly papers over this with 'Async' stack-trace stitching (look for greyed 'Async' separators inside the Call Stack panel), but the honest fix is a mental one: for async code, stop asking 'what called this' and start asking 'what scheduled this', and go look at the code that kicked off the promise or timer in the first place.",
    },
    {
      q: 'I found NG0100 in the console — is that a TypeScript thing or an Angular thing?',
      a: "Angular's own — the `NG` prefix is the tell, exactly the way `TS2339` tells you TypeScript wrote a message. Angular's runtime raises a small, documented set of these, every one with a page at `angular.dev/errors/NG0100` (swap in your own code) explaining precisely what triggers it. Search the CODE itself, not the sentence around it — the sentence has your class and variable names baked into it, which nobody else's search results will match.",
    },
    {
      q: 'Do I really need to learn breakpoints, or is console.log good enough forever?',
      a: "console.log is genuinely fine for most of what you'll do, especially 'how does this value change across many events' — but it means editing code, guessing what to print in advance, and cleaning the logs up afterward. A breakpoint needs none of that: it pauses the exact instant you care about and hands you everything — every variable in scope, not just what you thought to log. Ten minutes learning the four step controls pays for itself the first time a bug depends on three variables you didn't think to print.",
    },
  ];
}
