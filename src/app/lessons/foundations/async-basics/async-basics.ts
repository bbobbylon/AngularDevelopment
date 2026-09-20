import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { BrainPower, NoDumbQuestions, type NdqItem } from '../../../shared/shapes';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Async — why the single thread can't wait, the event loop traced live
 * (call stack → microtasks → one macrotask, repeat), callbacks → promises →
 * async/await with each code block dissected line by line, promise states,
 * parallel vs sequential awaits, and the forgotten-await bug. The groundwork
 * for `HttpClient` and Observables later.
 *
 * ## Shape: `no-dumb-questions`
 *
 * The lesson opens on {@link asyncQuestions}, six escalating misconceptions —
 * "doesn't a slow line just freeze the page" (yes, if it's truly synchronous),
 * through the sequential-await slowdown and the stale-response race, to the
 * fix — carrying the whole explanation before any API name arrives.
 * `app-brain-power` poses the three-second-loop question the block's own
 * `app-quiz` ({@link freezeQuizOptions}) later checks directly; `app-layers`
 * answers it as a simple stack-and-queue figure — deliberately a higher zoom
 * level than the event loop's own sync/microtask/macrotask breakdown further
 * down the page, which this block does not try to pre-empt. The block closes
 * on `app-napkin` with a one-burner-many-pots analogy, kept separate from the
 * buzzer analogy in the mental-model section just below, which explains the
 * three async TOOLS rather than this block's single question of whether the
 * page freezes. See `docs/CONTRIBUTING.md` §2C.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`).
 * It copies `expert/change-detection`'s section rhythm, and closes out the
 * Programming from Zero track — the four stops before this one (values,
 * functions, arrays/objects, decisions/loops) are all synchronous, so this is
 * the first lesson in the whole app where "when does this line actually run?"
 * stops being a silly question.
 *
 * ## Teaching order, and why it is this order
 *
 * 1. **Pose the freeze before naming the fix.** The opening shape block asks
 *    the reader, through a run of escalating questions, to imagine one slow,
 *    blocking line of code and predict what happens to everything else on the
 *    page — clicks, scrolling, the theme toggle — before "single-threaded" or
 *    "async" is named as the reason. A reader who has committed to a guess
 *    reads the mechanism that follows as confirmation, not as new information.
 * 2. **The buzzer analogy before any API name.** Callbacks, promises and
 *    async/await are one idea wearing three different outfits, and the
 *    analogy is what lets a reader recognise that before the syntax
 *    differences distract them.
 * 3. **The event loop gets its own mechanism section, taught in four modes on
 *    purpose** — a timeline diagram, a staged dialogue between the actors, a
 *    live click-and-watch demo, and a predict-then-reveal on the trickiest
 *    version of the ordering question (microtasks vs. the one macrotask) —
 *    because "sync runs, then every microtask, then one macrotask" is the
 *    single fact this whole page exists to install, and it is also the
 *    classic exam trap.
 * 4. **Then the same story three times, each with its own annotated code** —
 *    callbacks (and the pyramid they collapse into), promises (and the three
 *    states), async/await (and the forgotten-await bug) — because the
 *    evolution only makes sense once the reader has felt the pyramid's pain
 *    for themselves.
 * 5. **Every snippet is annotated line by line** via `app-code-lab`. Nothing
 *    on this page assumes the reader can already read the snippet; they are
 *    here because they cannot yet.
 */
@Component({
  selector: 'app-lesson-async-basics',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    BrainPower,
    NoDumbQuestions,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './async-basics.html',
  styleUrl: './async-basics.css',
})
export class AsyncBasics {
  /**
   * Where the fake request has got to, driving the demo's button and spinner.
   */
  protected readonly status = signal<'idle' | 'loading' | 'done' | 'error'>('idle');
  /**
   * The fake request's result text.
   */
  protected readonly result = signal('');
  /**
   * The error message when the simulated request rejects instead of resolving.
   */
  protected readonly errorMessage = signal('');
  /**
   * Whether the live demo's next request should reject instead of resolve.
   */
  protected readonly simulateFailure = signal(false);

  /** Log lines for the out-of-order-responses race demo. */
  protected readonly raceLog = signal<string[]>([]);
  /** Whichever race response landed most recently — the thing actually on screen. */
  protected readonly raceResult = signal('');
  /** Whether the race demo is mid-run. */
  protected readonly raceRunning = signal(false);

  /**
   * The execution-order log — the A/C/B proof, appended to as each callback runs.
   */
  protected readonly orderLog = signal<string[]>([]);
  /**
   * Whether the ordering demo is mid-run, so it cannot be started twice.
   */
  protected readonly orderRunning = signal(false);

  /** The A/C/B execution-order proof — really uses setTimeout(…, 0). */
  protected runOrder() {
    this.orderRunning.set(true);
    this.orderLog.set([]);
    const log = (s: string) => this.orderLog.update((l) => [...l, s]);

    log(`console.log('A')  → A`);
    setTimeout(() => {
      log(`(the timer callback finally runs)  → B`);
      this.orderRunning.set(false);
    }, 0);
    log(`console.log('C')  → C   ← ran before B despite the 0ms delay`);
  }

  /**
   * Runs the fake request: sets `loading`, waits, then sets `done` or `error`.
   *
   * Deliberately `async`/`await` over a timer rather than a real fetch — the
   * lesson is about *when* code runs, and a real network call adds failure modes
   * that are a different lesson.
   */
  protected async load() {
    this.status.set('loading');
    this.result.set('');
    this.errorMessage.set('');
    try {
      const data = await this.fetchUser();
      this.result.set(data);
      this.status.set('done');
    } catch (err) {
      this.errorMessage.set((err as Error).message);
      this.status.set('error');
    }
  }

  /**
   * The simulated request itself — a Promise that rejects when
   * {@link simulateFailure} is checked, so `load()` above has something real
   * to catch.
   */
  private fetchUser(): Promise<string> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.simulateFailure()) {
          reject(new Error('500 Internal Server Error'));
        } else {
          resolve('{ name: "Ada", role: "admin" }');
        }
      }, 1200);
    });
  }

  /**
   * Fires two fake searches with different delays — "cat" (slow) then
   * "caterpillar" (fast) — and lets whichever response lands *last* win,
   * regardless of which was sent last. That's the race condition.
   */
  protected runRace() {
    this.raceRunning.set(true);
    this.raceLog.set([]);
    this.raceResult.set('');
    const log = (s: string) => this.raceLog.update((l) => [...l, s]);

    log('Typed "cat" → search sent (this one takes 900ms to answer)');
    const catRequest = new Promise<string>((resolve) =>
      setTimeout(() => resolve('results for "cat"'), 900),
    );

    log('Typed "caterpillar" → search sent (this one takes 200ms)');
    const caterpillarRequest = new Promise<string>((resolve) =>
      setTimeout(() => resolve('results for "caterpillar"'), 200),
    );

    catRequest.then((value) => {
      log(`⬅ "cat" landed (900ms) — ${value}`);
      this.raceResult.set(value);
    });
    caterpillarRequest.then((value) => {
      log(`⬅ "caterpillar" landed (200ms) — ${value}`);
      this.raceResult.set(value);
    });

    Promise.all([catRequest, caterpillarRequest]).then(() => this.raceRunning.set(false));
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Programming from Zero track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Values & Variables', id: 'programming-basics' },
    { label: 'Functions', id: 'functions-basics' },
    { label: 'Arrays & Objects', id: 'arrays-objects-basics' },
    { label: 'Decisions & Loops', id: 'decisions-loops' },
    { label: 'Async' },
  ];

  /**
   * The shape block's spine: six questions escalating from "doesn't slow code
   * just freeze the page" through the sequential-await slowdown and the
   * stale-response race, to the fix — carrying the whole explanation before
   * any API name arrives.
   */
  protected readonly asyncQuestions: NdqItem[] = [
    {
      q: "Doesn't a slow line of code just freeze the whole page while it runs?",
      a: 'If it\'s genuinely **synchronous** — a heavy loop, no network, no timer — yes, actually. You have exactly one lane, and while that lane is busy, nothing else on it can move: not a click, not a scroll, not a repaint. "JavaScript never blocks" only applies to *async* work — the slow parts you\'d actually reach for, like a network request.',
    },
    {
      q: 'So async code runs on a separate thread instead, which is why it doesn’t block?',
      a: "No — same one lane, same one thread. What changes is *when* your code gets a turn on it. `fetch()` hands the networking off to the browser itself, not to JavaScript, and your code after `await` doesn't run again until that lane is free — never at the same time as anything else you're doing.",
    },
    {
      q: 'While I’m "waiting" for a fetch, is my function just paused there, frozen mid-line?',
      a: "No — it's not paused, it's **finished**, for now. `await` doesn't freeze a function in place the way a breakpoint does; it hands control back immediately, the rest of your program keeps running, and only once the response arrives does the *rest* of that function get scheduled — as a brand-new turn, not a resumed one.",
    },
    {
      q: 'If I fire off two fetch() calls and await each one, do they at least happen together?',
      a: "Not if you await the first before starting the second — the second `fetch()` doesn't even *execute* until the first one has resolved. Sequential awaits are the single most common accidental 2x slowdown in real code, and nothing about the syntax warns you it's happening.",
    },
    {
      q: "Worst case, my page is just a little slower than it could be — that's the real risk?",
      a: 'There’s a sharper one: fire two requests without awaiting between them, and the network makes no promise about which comes back first. The **last response to land wins** — not the last one you sent — so a slow answer to an old search can overwrite a fast answer to a newer one, with zero errors thrown.',
    },
    {
      q: 'How do you actually stop a late response from winning?',
      a: "Give every request an identity — a ticket number, an `AbortController` — and when a response lands, check whether it's still the *most recent* one you care about before doing anything with it. A stale response gets ignored, no matter how late it wanders in.",
    },
  ];

  /**
   * The shape block's quiz: the three-second synchronous loop, checked
   * against the exact question `app-brain-power` opened on.
   */
  protected readonly freezeQuizOptions: QuizOption[] = [
    {
      text: "It sits unprocessed until the loop finishes — the click handler can't run until the one lane is free again.",
      correct: true,
      why: "A genuinely synchronous loop occupies the one lane completely for its whole three seconds. The click event is noticed and queued, but nothing — not even a click — gets a turn on the lane until whatever's currently running finishes.",
    },
    {
      text: "It's dropped entirely — JavaScript can only register events that happen while it's idle.",
      why: 'The browser still records the click; it just cannot hand it to your code until the lane frees up. Nothing about a busy lane makes the browser stop listening.',
    },
    {
      text: 'It interrupts the loop immediately, since user input always takes priority over running code.',
      why: 'Nothing in JavaScript can interrupt a currently-running synchronous block — that is precisely what "one lane, run to completion" means. Priority only decides queue ORDER once the lane is free, never mid-execution.',
    },
    {
      text: 'It runs in parallel, on a separate thread, since event listeners run off the main thread by default.',
      why: 'There is no second thread here. Click handling shares the exact same one lane as everything else your JavaScript does.',
    },
  ];

  /**
   * The event loop's one rule, drawn as a diagram — the fact the whole page is
   * built to install. `tone: 'warn'` marks the step almost everyone gets wrong:
   * that the ENTIRE microtask queue drains before a single macrotask runs.
   */
  protected readonly eventLoopFlow: FlowStep[] = [
    {
      label: 'Run the call stack',
      detail:
        'Every line of synchronous code runs top to bottom, uninterrupted, until the stack is completely empty. Nothing async gets a turn while this is happening.',
    },
    {
      label: 'Drain the microtask queue',
      detail:
        'Every settled `Promise` callback runs — **all of them**, including any new ones they queue up along the way — until this queue is completely empty too.',
      tone: 'warn',
    },
    {
      label: 'Run exactly one macrotask',
      detail:
        'One `setTimeout` callback, one click handler, one I/O callback — a single macrotask runs, and then the loop goes straight back to step 1.',
    },
  ];

  /**
   * The four actors behind "async code runs later", staged as a conversation.
   *
   * This exists because the relationship it describes is the one beginners
   * reliably get backwards: they picture `setTimeout` itself doing the
   * waiting, or "the event loop" as a vague synonym for "later". Four actors,
   * four separate jobs — far easier to keep straight as a conversation than
   * as a paragraph.
   */
  protected readonly eventLoopTalk: BubbleTurn[] = [
    { who: 'Your code', says: 'I just called `setTimeout(fn, 0)`. Run `fn` now.' },
    {
      who: 'setTimeout',
      says: "I don't run anything, ever. I've handed `fn` to the browser's timer, and I've already returned — you keep going.",
    },
    {
      who: 'The call stack',
      says: "Good, because I'm not done. There's more synchronous code below that line, and I run every bit of it before I let anything else in.",
    },
    {
      who: 'The event loop',
      says: "I'm watching the stack. The instant it's completely empty — not before — I check the microtask queue first, and only once THAT is empty do I hand the stack `fn`.",
    },
    {
      who: 'fn (the callback)',
      says: 'My turn, finally. Everything synchronous is done, and every Promise callback that was waiting already ran ahead of me.',
    },
  ];

  /**
   * Sample: the harder version of the ordering question — synchronous code,
   * one macrotask, one microtask, all mixed together. The predict-then-reveal
   * for this is the natural payoff of the mechanism section above it.
   */
  protected readonly orderingPredictSample = `console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);`;

  /** The reveal for {@link orderingPredictSample}. */
  protected readonly orderingPredictAnswer =
    '`1, 4, 3, 2`. Synchronous code always finishes first, so `1` then `4` print immediately — the two async lines only **register** callbacks, they do not run them yet. Then the event loop drains the microtask queue completely before it ever touches the macrotask queue, so the `.then()` callback (`3`) runs before the `setTimeout` callback (`2`) — even though the timer was written first and asked for `0`ms. "Sync first, microtasks before macrotasks" is worth more interview points than almost anything else on this page.';

  /**
   * Sample: the simplest possible callback — handing a function to
   * `setTimeout` and getting it called back later.
   */
  protected readonly callbackSample = `setTimeout(() => {
  console.log('2 seconds passed!');
}, 2000);
console.log('this prints FIRST');`;

  /** Line-by-line walkthrough of {@link callbackSample}. */
  protected readonly callbackNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A **callback** is just a function handed to another function — no parentheses after it, because you are handing over the function itself to be called **later**, not calling it right now. This is the functions-are-values idea from the Functions lesson, put to work.',
    },
    {
      line: 2,
      text: "This line does not run yet. It only runs once the timer fires **and** the call stack is completely empty — the event loop section above spells out exactly why 'empty' matters.",
    },
    {
      line: 3,
      text: '`2000` is milliseconds, and it is a **minimum**, not a promise — if the stack is still busy when the timer fires, this callback simply waits in the queue a little longer.',
    },
    {
      line: 4,
      text: 'This runs first, immediately. `setTimeout` handed off its function and returned right away — the browser never blocks a single line waiting for a timer to finish.',
    },
  ];

  /**
   * Sample: the callback pyramid — three nested async calls, each depending
   * on the previous one's result.
   */
  protected readonly pyramidSample = `loadUser(id, (user) => {
  loadOrders(user, (orders) => {
    loadInvoice(orders[0], (invoice) => {
      // three levels deep, and every level needs its own error handling
    });
  });
});`;

  /** Line-by-line walkthrough of {@link pyramidSample}. */
  protected readonly pyramidNotes: CodeNote[] = [
    {
      line: 1,
      text: '`loadUser` needs its result before the next step can even start — so `loadOrders` has to be written **inside** its callback, one level deeper than this line.',
    },
    {
      line: 2,
      text: 'Same problem again, one level deeper: `loadInvoice` needs `orders`, and `orders` only exists inside this callback.',
    },
    {
      line: 3,
      text: 'Nothing is wrong with this line by itself — the problem is the **shape** of the whole thing. Every step this deep needs its own error handling, and there is no single place to put one.',
    },
  ];

  /**
   * Sample: a Promise chain — the same three steps as {@link pyramidSample},
   * flattened.
   */
  protected readonly promiseSample = `loadUser()
  .then((user) => console.log('got', user))
  .catch((err) => console.error('oops', err));`;

  /** Line-by-line walkthrough of {@link promiseSample}. */
  protected readonly promiseNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Calling `loadUser()` does not hand you a user — it hands you a **Promise**, instantly, while the real work carries on in the background. The buzzer, not the coffee.',
    },
    {
      line: 2,
      text: '`.then` registers what to do on success, and — the part that actually fixes the pyramid — it returns a **new** Promise, so the next `.then` chains flat instead of nesting one level deeper.',
    },
    {
      line: 3,
      text: '`.catch` catches a failure from **any** earlier step in the chain. One handler for the whole pipeline, instead of one per nesting level.',
    },
  ];

  /**
   * Sample: the same logic again, written with `async`/`await`.
   */
  protected readonly asyncAwaitSample = `async function showUser() {
  try {
    const user = await loadUser();
    const orders = await loadOrders(user);
    console.log('got', orders);
  } catch (err) {
    console.error('oops', err);
  }
}`;

  /** Line-by-line walkthrough of {@link asyncAwaitSample}. */
  protected readonly asyncAwaitNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The `async` keyword marks this function as one that contains `await` — and it means the function always returns a Promise itself, even though nothing here explicitly returns one.',
    },
    {
      line: 3,
      text: '`await` unwraps the Promise: instead of `.then(user => …)`, the resolved value lands straight in an ordinary variable, and the line below simply does not run until it does.',
    },
    {
      line: 4,
      text: 'Reads top to bottom, like synchronous code — but `orders` only exists once line 3 has actually finished settling. Nothing here runs out of order.',
    },
    {
      line: 6,
      text: 'A rejection from **either** `await` above lands here — ordinary `try`/`catch`, the same construct you would reach for on a synchronous mistake.',
    },
  ];

  /**
   * Sample: the demo's actual `load()` + `fetchUser()` source, annotated — the
   * same idle-then-resume gap as every other sample on the page, but this one
   * is real, running code the reader just clicked, and it's the one sample on
   * the page that can actually fail.
   */
  protected readonly liveDemoSample = `protected async load() {
  this.status.set('loading');
  this.result.set('');
  this.errorMessage.set('');
  try {
    const data = await this.fetchUser();
    this.result.set(data);
    this.status.set('done');
  } catch (err) {
    this.errorMessage.set((err as Error).message);
    this.status.set('error');
  }
}

private fetchUser(): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (this.simulateFailure()) {
        reject(new Error('500 Internal Server Error'));
      } else {
        resolve('{ name: "Ada", role: "admin" }');
      }
    }, 1200);
  });
}`;

  /** Line-by-line walkthrough of {@link liveDemoSample}. */
  protected readonly liveDemoNotes: CodeNote[] = [
    {
      line: 5,
      text: 'A `try`/`catch` only catches a rejection reached via `await` — the classic silent-failure trap is wrapping a *call* in try/catch without awaiting it, in which case the function has already returned before the rejection even exists, and this block never runs at all.',
    },
    {
      line: 6,
      text: '`await` pauses here until `fetchUser()` settles, one way or the other. If it rejects, execution skips straight past lines 7–8 and lands in the `catch` block below — exactly like a thrown exception.',
    },
    {
      line: 9,
      text: '`err` is whatever `reject()` was called with on line 20 — here, an `Error` object, so `err.message` reads the string it was constructed with.',
    },
    {
      line: 16,
      text: 'The Promise executor takes **two** callbacks, not one: `resolve` for success, `reject` for failure. Every other Promise on this page only ever calls the first.',
    },
    {
      line: 20,
      text: 'Calling `reject()` does not throw. It settles the Promise as **rejected** — nothing happens synchronously, and the `catch` block above only runs once execution reaches the `await` on line 6.',
    },
  ];

  /** Sample: the classic `forEach` + async trap — for {@link Compare}'s left panel. */
  protected readonly forEachBugSample = `const items = ['a', 'b', 'c'];

items.forEach(async (item) => {
  await save(item);
});

console.log('done saving');
// prints IMMEDIATELY — forEach never looks at
// the promise its callback returns`;

  /** Sample: the `for...of` fix — for {@link Compare}'s right panel. */
  protected readonly forOfFixSample = `const items = ['a', 'b', 'c'];

for (const item of items) {
  await save(item); // waits for EACH save in turn
}

console.log('done saving');
// only prints once every save has finished`;

  /**
   * Sample: the non-awaited try/catch trap. A plain field, not a
   * {@link CodeNote}-annotated `<app-code-lab>`, because it's one line quoted
   * inline in prose — and a raw `{`/`}` in template *text* reads as the start
   * of an interpolation, so this has to arrive as a string, not be typed
   * directly into the `.html`.
   */
  protected readonly tryCatchTrapSample = 'try { this.load(); } catch {}';

  /**
   * Sample: the sequential approach — for {@link Compare}'s left panel.
   */
  protected readonly sequentialSample = `// b doesn't even START until a has finished:
const a = await loadProfile();   // ~1s
const b = await loadSettings();  // ~1s
// total: ~2 seconds`;

  /**
   * Sample: the parallel approach — for {@link Compare}'s right panel.
   */
  protected readonly parallelSample = `// both start immediately, in parallel:
const [profile, settings] = await Promise.all([
  loadProfile(),   // called with NO await — starts right away
  loadSettings(),  // this one starts right away too
]);
// total: ~1 second — the slower of the two`;

  /**
   * The self-test on the forgotten-await bug.
   *
   * The distractors are the ways a reader talks themselves out of the real
   * answer — that JavaScript would somehow catch or fix the mistake for them.
   * The `why` on each wrong option names that specific false comfort, per
   * CONTRIBUTING §2A.
   */
  protected readonly forgottenAwaitOptions: QuizOption[] = [
    {
      text: 'It throws a runtime error immediately, complaining that `user` is not defined.',
      why: 'Nothing throws. `const user = loadUser();` is completely valid JavaScript — a Promise is an ordinary object, and assigning one to a variable never fails. That silence is exactly what makes this bug so easy to miss.',
    },
    {
      text: 'It compiles and runs, but `user` holds a Promise object instead of the actual data.',
      correct: true,
      why: "Exactly. `loadUser()` returns its Promise **instantly**, and without `await` nothing ever unwraps it. `user` is the buzzer, not the coffee — and the bug usually doesn't surface until something later tries to read a property off it.",
    },
    {
      text: 'JavaScript automatically inserts the missing `await`, because the surrounding function is `async`.',
      why: '`async` only changes what happens **inside** the function that has it — it never rewrites a call site for you. Every `await` has to be written by hand, every single time.',
    },
    {
      text: 'The line is skipped, and execution jumps to the next statement only once `loadUser()` resolves.',
      why: 'Nothing is skipped — the assignment happens immediately, synchronously, exactly where it is written. What is wrong is *what* gets assigned: the pending Promise, not its eventual value.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "Why can't I just write a loop that waits until `done === true`?",
      a: 'Because that loop would occupy the single thread completely — the callback that would eventually set `done = true` can never get a turn to run while your loop is still spinning. The thread has to be **yielded** (the function ends, or hits an `await`) before anything queued can run. This is why async in JavaScript is cooperative, not optional: you cannot force it with a busier loop.',
    },
    {
      q: "If `async`/`await` 'is' Promises underneath, why bother learning Promises directly at all?",
      a: "Because plenty of things only make sense in Promise form. `Promise.all` and `Promise.allSettled` (further up this page) have no `await`-only equivalent — you still build an array of Promises first, before awaiting the combined result. Most library APIs — including the `HttpClient` you'll meet soon — hand you Promises or their cousin Observables directly. `await` is nicer syntax for *consuming* one; it doesn't replace understanding what one actually is.",
    },
    {
      q: 'Does calling an `async` function pause my code immediately, the moment I call it?',
      a: 'No — and this one catches people out. An `async` function runs completely normally, synchronously, right up until its **first** `await`. Only at that point does it hand control back to whoever called it. So `showUser()` (further up this page) starts running the instant you call it — the pause happens a line or two in, not at the call site itself.',
    },
    {
      q: "Three independent API calls each take about a second. What's the fastest I can do all three, and how?",
      a: 'About one second: start all three without awaiting them individually, then `await Promise.all([p1, p2, p3])`. Awaiting each one in turn costs roughly three seconds instead. One caveat: `Promise.all` rejects the instant **any** member rejects, discarding the others — reach for `Promise.allSettled` when you need every outcome regardless of individual failures.',
    },
  ];
}
