import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/** A promise that settles after `ms` milliseconds, with no way to cancel it. */
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The cancellation-aware sibling of {@link wait}. This is the exact function
 * shown, annotated, in the cancellation section below — the live demo runs
 * the real thing, not a simplified stand-in.
 *
 * @param ms How long to wait before resolving.
 * @param signal Aborting this signal rejects the promise instead, with
 *   `signal.reason` — a `DOMException` named `'AbortError'` unless the caller
 *   passed a different reason to `controller.abort()`.
 */
function cancellableWait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }

    const id = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(id);
      reject(signal.reason);
    });
  });
}

/**
 * Lesson: Promises & async/await — the three-state machine underneath every
 * promise, what `await` actually desugars to (suspend, schedule a
 * continuation as a microtask), microtask-vs-macrotask ordering with a live
 * log and a harder predict-the-order puzzle, the `return await` subtlety and
 * the far more common `forEach(async …)` bug, all four combinators with their
 * failure semantics and how TypeScript types their results, real cancellation
 * with `AbortController`, and the Promise/Observable/async-iterable three-way
 * comparison.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape set by `expert/change-detection`. The teaching order:
 *
 * 1. **Pose the problem before naming it.** The lesson opens on "you can't
 *    have the value yet — so what do you hold instead?", with a napkin
 *    prediction to check against the live demo further down.
 * 2. **Analogy, then vocabulary.** A promise as a claim ticket — issued now,
 *    exchanged later for the thing or an apology, and the ticket never
 *    reprints itself — gives the reader somewhere to put "settles once"
 *    before that phrase is used formally.
 * 3. **The same idea in four modes** — a lifecycle diagram, a dialogue
 *    between the parts of an `await`, annotated compiled-down code, and live
 *    counters/logs the reader operates themselves.
 * 4. **Three questions, asked explicitly** — mirroring the change-detection
 *    lesson's structure: *when* does paused code resume (timing), *what*
 *    happens when it fails (failure), and *how* do you run several at once
 *    (combining) — because "async is confusing" almost always turns out to
 *    be one of these three questions answered with the wrong mental model.
 * 5. **Every snippet is annotated line by line** via `app-code-lab`. Nothing
 *    on this page assumes the reader can already read the snippet.
 *
 * ## Demos
 *
 * Four, all real: the basic await demo (`run`), the microtask/macrotask
 * ordering log (`runOrder`), the sequential-vs-parallel timing race
 * (`raceStrategies`), and a genuine cancellable operation built on
 * `AbortController` (`startCancellable` / `cancelIt`) — press Cancel mid-flight
 * and the pending timer is actually cleared, not just ignored.
 */
@Component({
  selector: 'app-lesson-ts-async',
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
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './async.html',
  styleUrl: './async.css',
})
export class Async {
  // ── Demo 1: the basic await demo ───────────────────────────────────────────

  /** Whether the await demo is running, for the button's disabled state. */
  protected readonly busy = signal(false);
  /** The await demo's output. */
  protected readonly result = signal('idle');

  /**
   * Runs the basic `await` demo: shows the loading state, waits, then shows
   * the result. Nothing here blocks — the rest of the page stays fully
   * interactive while this is pending.
   */
  protected async run() {
    this.busy.set(true);
    this.result.set('loading…');
    await wait(900);
    this.result.set('✅ resolved after 900ms');
    this.busy.set(false);
  }

  // ── Demo 2: microtask vs macrotask ordering ─────────────────────────────────

  /** The execution-order log, appended to as each callback fires. */
  protected readonly orderLog = signal<string[]>([]);

  /**
   * Runs the execution-order demo, logging synchronous code, a resolved
   * promise's `.then`, and a zero-delay `setTimeout` in the order they
   * actually fire — the microtask/macrotask distinction made visible.
   */
  protected runOrder() {
    this.orderLog.set([]);
    const log = (line: string) => this.orderLog.update((l) => [...l, line]);
    log('1: sync');
    setTimeout(() => log('4: macrotask (timer)'));
    Promise.resolve().then(() => log('3: microtask'));
    log('2: sync');
  }

  // ── Demo 3: sequential vs parallel ──────────────────────────────────────────

  /** Whether the sequential-vs-parallel race is running. */
  protected readonly racing = signal(false);
  /** Elapsed time for the sequential run. */
  protected readonly seqTime = signal('—');
  /** Elapsed time for the parallel run — the number the demo exists to contrast. */
  protected readonly parTime = signal('—');

  /**
   * Races two `await` strategies over the same work: sequential `await`s
   * against `Promise.all`. Sequential awaits add up; `Promise.all` overlaps
   * them — the two timings printed side by side make the cost concrete.
   */
  protected async raceStrategies() {
    this.racing.set(true);
    this.seqTime.set('running…');
    this.parTime.set('…');

    const t0 = performance.now();
    await wait(400);
    await wait(400);
    await wait(400);
    this.seqTime.set(`${Math.round(performance.now() - t0)}ms`);

    const t1 = performance.now();
    await Promise.all([wait(400), wait(400), wait(400)]);
    this.parTime.set(`${Math.round(performance.now() - t1)}ms`);
    this.racing.set(false);
  }

  // ── Demo 4: real cancellation with AbortController ──────────────────────────

  /** The cancellable demo's current state, driving the pill and both buttons. */
  protected readonly cancelState = signal<'idle' | 'running' | 'cancelled' | 'done'>('idle');

  /** The controller for whichever run is currently in flight, if any. */
  private cancelHandle: AbortController | null = null;

  /**
   * Starts a real 3-second cancellable wait, built on {@link cancellableWait} —
   * the exact function annotated in the cancellation section.
   */
  protected async startCancellable(): Promise<void> {
    const controller = new AbortController();
    this.cancelHandle = controller;
    this.cancelState.set('running');
    try {
      await cancellableWait(3000, controller.signal);
      this.cancelState.set('done');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        this.cancelState.set('cancelled');
      } else {
        throw err;
      }
    }
  }

  /** Aborts the in-flight run, if there is one. A no-op otherwise. */
  protected cancelIt(): void {
    this.cancelHandle?.abort();
  }

  // ── Presentation data ────────────────────────────────────────────────────────

  /** The Language Features track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Decorators', id: 'ts-decorators' },
    { label: 'Modules', id: 'ts-modules' },
    { label: 'Async/await' },
    { label: 'Nullish', id: 'ts-nullish' },
  ];

  /**
   * The three stops on a promise's lifecycle, as a vertical sequence.
   *
   * Deliberately linear even though the real machine forks at the end —
   * {@link Flow} draws sequences, not branches. The fork itself is drawn just
   * below it as two colour-coded cards, so the branching is a second,
   * different mode rather than something bent to fit the wrong shape.
   */
  protected readonly lifecycleSteps: FlowStep[] = [
    {
      label: 'new Promise(executor)',
      detail:
        'The executor function runs immediately — synchronously, before .then is ever attached.',
      tone: 'accent',
    },
    {
      label: 'pending',
      detail: 'No value yet. Every .then, .catch and await just registers a callback for later.',
    },
    {
      label: 'settles — exactly once',
      detail:
        'Fulfilled with a value, or rejected with a reason. After this the promise can never change again.',
      tone: 'good',
    },
  ];

  /**
   * A preview dialogue for what `await` sets in motion, staged before the
   * mechanism section formally names any of these parts.
   *
   * The relationship learners reliably get backwards: they assume the
   * *Promise* runs their resumed code. It does not — it only tells the
   * microtask queue to. Five actors, five jobs, far easier to keep straight
   * as a conversation than as a paragraph about a pipeline.
   */
  protected readonly awaitTalk: BubbleTurn[] = [
    { who: 'Your code', says: 'I wrote `const a = await getA();`. Go get it.' },
    { who: 'getA()', says: "Here's a promise. I'm still pending — ask me again later." },
    {
      who: 'Your function',
      says: "Fine. I'll suspend right here and hand the rest of me over as a continuation.",
    },
    {
      who: 'The Promise',
      says: "Noted. The moment I settle, I'll schedule your continuation as a microtask — I never run it myself.",
    },
    {
      who: 'The microtask queue',
      says: 'And when I reach yours, every microtask ahead of it goes first — but every timer, click and repaint waits behind all of us.',
    },
  ];

  /** Sample: eager executors, `.then` chaining, and the `async`/`await` equivalent. */
  protected readonly createConsumeSample = `const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

wait(500)
  .then(() => 'done')
  .then((msg) => console.log(msg))
  .catch((err) => console.error(err));

async function run() {
  await wait(500);
  console.log('done');
}`;

  /** Line-by-line walkthrough of {@link createConsumeSample}. */
  protected readonly createConsumeNotes: CodeNote[] = [
    {
      line: 2,
      text: '`new Promise(...)` runs its executor — the function passed in — **immediately**, the moment this line executes. Nothing has called `.then()` yet. This is the deepest contrast with Observables, which run nothing at all until something subscribes.',
    },
    {
      line: 4,
      text: 'Calling `wait(500)` has already started the timer by the time this line finishes. Everything below just describes what to do *once it settles* — it does not delay the start.',
    },
    {
      line: 5,
      text: "Every `.then()` returns a **brand-new promise**, not the same one. That's the whole reason chaining works: each link settles from the return value of the one before it.",
    },
    {
      line: 6,
      text: "`msg` is `'done'` — the string returned on line 5. A `.then()` callback's return value becomes the fulfillment value of the promise `.then()` itself hands back.",
    },
    {
      line: 7,
      text: 'One `.catch()` at the end catches a rejection from **any** link above it — the original `wait(500)`, or either `.then()` callback, if either one throws.',
    },
    {
      line: 9,
      text: '`async` guarantees the return type is always a `Promise` — even with no `return` statement at all, calling `run()` hands back `Promise<void>`, not `undefined`.',
    },
    {
      line: 10,
      text: '`await` unwraps whatever `wait(500)` returns and flattens it fully — a `Promise<Promise<void>>` would still come out as plain `void`. Nested promises never stack.',
    },
  ];

  /** Sample: what `await` desugars to, side by side with the `.then()` it hides. */
  protected readonly desugarSample = `async function f() {
  const a = await getA();
  return a + 1;
}

// roughly the same as:
function fDesugared() {
  return getA().then((a) => {
    return a + 1;
  });
}`;

  /** Line-by-line walkthrough of {@link desugarSample}. */
  protected readonly desugarNotes: CodeNote[] = [
    {
      line: 2,
      text: "The whole trick, on one line. `getA()` returns a promise; `await` **suspends** `f()` right here and hands control back to whoever called it — `f()` doesn't block, it pauses.",
    },
    {
      line: 3,
      text: "This line doesn't run until `getA()`'s promise settles — and when it finally does, it runs as a **microtask**, not synchronously as part of whatever resumed it.",
    },
    {
      line: 8,
      text: 'The desugared version, side by side. `.then((a) => {...})` is the actual mechanism `await` is hiding: a callback registered on the promise, scheduled to run once it settles.',
    },
    {
      line: 9,
      text: 'Same expression as line 3. `await` really is `.then()` with better syntax, not a separate runtime feature — nothing here can do anything a `.then()` chain could not already do.',
    },
  ];

  /** Predict prompt: an async function runs synchronously up to its first `await`. */
  protected readonly syncUntilAwaitSample = `console.log('1');

async function demo() {
  console.log('2');
  await wait(0);
  console.log('4');
}

demo();
console.log('3');`;

  /** The reveal for {@link syncUntilAwaitSample}. */
  protected readonly syncUntilAwaitAnswer =
    "`1, 2, 3, 4` — the numbers you were given, in that exact order, which is itself the trap: it's tempting to assume `demo()` runs either entirely before `console.log('3')` or entirely after it. Neither is true. `demo()` runs **synchronously up to its first `await`**, so `'2'` logs immediately, mid-call — then it suspends and hands control straight back, so `'3'` logs next. Only `'4'`, the code *after* the `await`, waits its turn, landing dead last.";

  /** Predict prompt: the harder interleaving puzzle, microtask enqueue order. */
  protected readonly tickPuzzleSample = `console.log('A');

async function inner() {
  console.log('B');
  await null;
  console.log('E');
}

inner();

Promise.resolve().then(() => console.log('D'));
Promise.resolve().then(() => console.log('F'));

console.log('C');`;

  /** The reveal for {@link tickPuzzleSample}. */
  protected readonly tickPuzzleAnswer =
    "`A, B, C, E, D, F`. `inner()` runs synchronously up to `await null` — that's `B` — and the **instant** that `await` executes, its continuation (`E`) is already queued as a microtask, before the two `Promise.resolve().then()` calls on the next lines even run. `C` still logs before any microtask, because the whole synchronous script finishes first. Then the queue drains in the order things were *queued*: `E` (queued during the `inner()` call) before `D` and `F` (queued afterwards) — not the order the `.then()`s and the `await` *appear* in the file. (Every evergreen engine today takes exactly one microtask tick per `await` on an already-settled value — older engines needed three, which is why some older answers to this exact puzzle disagree with what actually happens now.)";

  /** Sample: `return p` versus `return await p` — the version that loses a rejection. */
  protected readonly returnBugSample = `async function load() {
  try {
    return fetchJson();
  } catch (err) {
    return fallback();
  }
}`;

  /** Sample: the fixed version. */
  protected readonly returnFixSample = `async function load() {
  try {
    return await fetchJson();
  } catch (err) {
    return fallback();
  }
}`;

  /** The classic return-await misconception, as a self-test. */
  protected readonly returnAwaitQuiz: QuizOption[] = [
    {
      text: "The catch block runs and returns fallback() — that's what try/catch is for.",
      why: "That's what try/catch is for when the promise is awaited. Here it isn't: `return fetchJson()` hands the still-pending promise straight to the **caller** and pops this function's try/catch off the stack in the same instant. The rejection happens later, outside any protection this function ever offered.",
    },
    {
      text: 'Nothing here catches it — the rejection surfaces at whoever called this function, not at this catch block.',
      correct: true,
      why: 'Exactly. `return p` (no `await`) is a handoff, not a wait. Add the `await` — `return await fetchJson()` — and the rejection is thrown **inside** this function while the try/catch is still on the stack, so `catch` finally does its job.',
    },
    {
      text: 'A silent unhandled rejection, with no error anywhere.',
      why: 'Unhandled by **this** function, but not unhandled globally — whoever called `load()` still gets a rejected promise they can `.catch` or `await`. Truly unhandled means nobody, anywhere, ever attaches a handler — a different and worse situation than this one.',
    },
    {
      text: "TypeScript won't compile this — you can't return a promise from a function meant to return a value.",
      why: "Perfectly legal. An async function's return type is always wrapped in a `Promise` automatically, so returning a `Promise<T>` from inside one is exactly what's expected. Nothing here is a type error.",
    },
  ];

  /** Sample: the `forEach(async …)` bug — the failure mode `await`-in-a-loop warnings miss. */
  protected readonly forEachBugSample = `async function saveAll(items: Item[]): Promise<void> {
  items.forEach(async (item) => {
    await save(item);
    console.log('saved', item.id);
  });

  console.log('all saved');
}`;

  /** Line-by-line walkthrough of {@link forEachBugSample}. */
  protected readonly forEachBugNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The callback passed to `forEach` is itself `async`, which means it returns a `Promise`, exactly like any other async function. `forEach` calls it and **never looks at what it returned**.',
    },
    {
      line: 3,
      text: '`await` really does pause here — but only this **one** invocation of the callback. `forEach` has already called the callback again for the next item before this line finishes.',
    },
    {
      line: 4,
      text: "This line does eventually run, once each item's own `save()` resolves — just not in a reliable order, and not before line 7.",
    },
    {
      line: 7,
      text: 'By the time control reaches here, `forEach` has already returned — it never collected the promises its callbacks handed back, so it has nothing to wait for.',
    },
  ];

  /** Sample: the fix — concurrent via `Promise.all(items.map(...))`. */
  protected readonly forEachFixBadSample = `items.forEach(async (item) => {
  await save(item);
});
console.log('all saved');   // fires immediately`;

  /** Sample: the fix, right side. */
  protected readonly forEachFixGoodSample = `await Promise.all(items.map(save));
console.log('all saved');   // fires once every save has settled`;

  /** Sample: the classic race-as-timeout use of `Promise.race`. */
  protected readonly raceTimeoutSample = `const result = await Promise.race([
  fetchData(),
  wait(5000).then(() => {
    throw new Error('timeout');
  }),
]);
// race doesn't CANCEL the loser — promises aren't cancellable.
// The slow fetch keeps running; you've merely stopped waiting for it.`;

  /** Sample: how TypeScript types the results of `Promise.all` and `allSettled`. */
  protected readonly combinatorTypesSample = `interface User { id: string }
interface Order { id: string; total: number }

declare function getUser(): Promise<User>;
declare function getOrders(): Promise<Order[]>;

// Promise.all infers a TUPLE from an array literal, not a union:
const [user, orders] = await Promise.all([getUser(), getOrders()]);
// user: User        orders: Order[]

const settled = await Promise.allSettled([getUser(), getOrders()]);
// settled[0]: PromiseSettledResult<User>
// settled[1]: PromiseSettledResult<Order[]>

for (const r of settled) {
  if (r.status === 'fulfilled') r.value;   // User | Order[] here
  else r.reason;                           // always any
}`;

  /** Line-by-line walkthrough of {@link combinatorTypesSample}. */
  protected readonly combinatorTypesNotes: CodeNote[] = [
    {
      line: 8,
      text: "`Promise.all` has overloads in TypeScript's own type declarations specifically for an array **literal** passed directly — that's what lets it hand back a real tuple, `[User, Order[]]`, instead of one array typed as a union of both.",
    },
    {
      line: 9,
      text: 'So destructuring works exactly like it would for any other tuple: `user` is `User`, `orders` is `Order[]` — no cast, no runtime check needed to tell them apart.',
    },
    {
      line: 11,
      text: '`allSettled` gets the identical tuple-preserving treatment, just with every slot wrapped in `PromiseSettledResult<T>` instead of the bare `T`.',
    },
    {
      line: 15,
      text: '`r` is typed `PromiseSettledResult<User> | PromiseSettledResult<Order[]>` here — a **discriminated union**, with `status` as the field that tells the two arms apart.',
    },
    {
      line: 16,
      text: "The `status === 'fulfilled'` check is what unlocks `r.value` — the compiler will not let you read `.value` outside this branch, because `PromiseRejectedResult` doesn't declare that property at all.",
    },
    {
      line: 17,
      text: "`r.reason` is typed `any`, always — TypeScript's own lib declares it that way, because JavaScript lets you `throw` literally anything, so there's no `T` to be precise about here.",
    },
  ];

  /** Sample: `.map()` widens the result — no more tuple. */
  protected readonly mapWideningSample = `const promises = items.map(fetchOne);         // Promise<Item>[]
const results = await Promise.all(promises);   // Item[] — one array type, not a tuple`;

  /** Sample: naming an async function's payload type without wrapping it yourself. */
  protected readonly awaitedIdiomSample = `type Payload = Awaited<ReturnType<typeof load>>;
// ReturnType<typeof load> is Promise<Payload>; Awaited peels the Promise off.`;

  /** The `Promise.all` vs `allSettled` decision, as a self-test. */
  protected readonly combinatorQuiz: QuizOption[] = [
    {
      text: "Promise.all — it's faster.",
      why: "It isn't faster; both start all ten saves in parallel at the same instant. 'Faster' is a non-answer to the actual tradeoff, which is about what happens on failure, not speed.",
    },
    {
      text: "Promise.allSettled — you can show '8 saved, 2 failed — retry?' instead of losing all information about which succeeded.",
      correct: true,
      why: "Exactly. `all` is fail-fast: one rejection rejects the whole thing and you can't tell which of the other nine succeeded — they still ran to completion; their results are simply discarded. `allSettled` never rejects and reports every outcome.",
    },
    {
      text: 'Promise.race — whichever section saves first wins.',
      why: '`race` is for picking **one** winner among competing attempts at the same goal — a timeout, a fastest-mirror lookup. Here all ten need to actually happen; discarding nine of them the moment the first settles would be a bug, not a feature.',
    },
    {
      text: 'Promise.any — as long as one section saves, treat the whole save as successful.',
      why: "`any` is built for the opposite scenario: several attempts at the SAME goal where only one needs to succeed. Ten independent, unrelated sections all need to persist — 'one succeeded' tells you nothing about the other nine.",
    },
  ];

  /** Sample: an async generator and the `for await…of` that consumes it. */
  protected readonly asyncIterSample = `async function* pages(url: string) {
  let next: string | null = url;

  while (next) {
    const res = await fetch(next);
    const page = await res.json();
    yield page.items;
    next = page.nextUrl;
  }
}

for await (const items of pages('/api/items')) {
  render(items);
  if (enoughAlready()) break;
}`;

  /** Line-by-line walkthrough of {@link asyncIterSample}. */
  protected readonly asyncIterNotes: CodeNote[] = [
    {
      line: 1,
      text: '`async function*` — a **generator** (the `*`), which can pause mid-body and hand a value out with `yield`, and `async` at the same time, so each step in between can `await`.',
    },
    {
      line: 5,
      text: 'An ordinary `await` inside the generator body — one full round trip per page, exactly like any other async function.',
    },
    {
      line: 7,
      text: "`yield` hands one page's worth of items **out** to whoever is iterating, then pauses this function right here — line 8 doesn't run until the next value is asked for.",
    },
    {
      line: 12,
      text: "`for await…of` is the consuming half. It pulls one value at a time and awaits each `yield` automatically, which makes it sequential **by construction** — the next page's `fetch` doesn't start until the previous one was yielded and consumed.",
    },
    {
      line: 14,
      text: "`break` does something an ordinary loop's `break` can't: it calls the generator's `.return()` method, running any pending `finally` around the `yield` before the loop actually exits — cleanup happens even when you stop early.",
    },
  ];

  /**
   * Sample: the exact source of {@link cancellableWait}, shown verbatim so the
   * annotated code and the code the live demo actually runs are the same text.
   */
  protected readonly cancellableWaitSample = `function cancellableWait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }

    const id = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(id);
      reject(signal.reason);
    });
  });
}`;

  /** Line-by-line walkthrough of {@link cancellableWaitSample}. */
  protected readonly cancellableWaitNotes: CodeNote[] = [
    {
      line: 1,
      text: '`signal: AbortSignal` is the second parameter — this promise takes cancellation as an explicit input, something `wait()` from the top of the page never could. `Promise<void>` says it resolves with nothing, same as `wait()`.',
    },
    {
      line: 3,
      text: 'Guards against a signal that was **already aborted** before this function ever ran — say, the reader clicked Cancel before Start finished setting up. Without this, an already-cancelled call would still schedule a timer that fires.',
    },
    {
      line: 4,
      text: "`signal.reason` is whatever was passed to `.abort(reason)` — or, if nothing was passed, a `DOMException` named `'AbortError'` that the platform creates automatically.",
    },
    {
      line: 8,
      text: 'The ordinary path — exactly the `setTimeout(resolve, ms)` from `wait()`. Nothing about this line knows cancellation exists yet.',
    },
    {
      line: 9,
      text: "`signal.addEventListener('abort', …)` — an `AbortSignal` is a real `EventTarget`. Calling `controller.abort()` anywhere in the app fires this listener, however far away that call is from this promise.",
    },
    {
      line: 10,
      text: "`clearTimeout(id)` is the step it's easy to forget. Without it the original timer still fires and calls `resolve()` a moment later, silently un-cancelling a promise that was supposed to be dead.",
    },
    {
      line: 11,
      text: 'Rejects with the same `signal.reason` used on line 4, so both paths — aborted before we started, and aborted while waiting — produce an identical rejection a caller can check for.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "Why does an `async` function always return a Promise, even when there's no `return` in sight?",
      a: "Because `async` isn't a hint, it's a **contract**: the return value is always wrapped in a Promise, no matter what the body does. No `return` statement means the promise resolves with `undefined` — exactly like a normal function falling off the end — it's just wrapped in one more layer.",
    },
    {
      q: 'Does Promise.race actually stop the promise that lost?',
      a: "No — and this is the fact worth remembering. `race` only decides which settlement you're told about first; the loser keeps running, keeps using memory and network, and can still throw an unhandled rejection later if nobody's watching it. The AbortController demo further down is what real cancellation looks like — a signal the losing operation actually checks and reacts to.",
    },
    {
      q: 'Why is `err` in `catch (err)` typed `unknown` instead of `Error`?',
      a: "Because JavaScript lets you `throw` literally anything — a string, a number, `{ code: 42 }`, even `undefined`. TypeScript can't promise you an `Error` when the language itself doesn't. `unknown` forces a check before you touch it: `if (err instanceof Error)` before reading `.message`.",
    },
    {
      q: 'What does `.finally()` actually get handed, and can it change the outcome?',
      a: 'Nothing, and no — on purpose. Its callback receives no arguments and whatever it returns is discarded; the original settlement passes straight through unchanged. The one exception: if the `.finally()` callback itself throws or returns a rejected promise, that new rejection replaces the original outcome. It mirrors a synchronous `try { … } finally { … }` almost exactly.',
    },
    {
      q: "Why does a Promise.then() loop freeze the page while a setTimeout loop doesn't?",
      a: 'Because the browser paints a frame **between** macrotasks but never between microtasks. A `setTimeout` recursion is a chain of macrotasks, so rendering gets a turn between each one. A microtask that queues another microtask keeps the queue non-empty forever, and the whole queue has to drain before the next paint — an accidental microtask loop starves the screen completely, with no error and no warning.',
    },
    {
      q: 'Is AbortController just a fetch thing, or does Angular use it too?',
      a: "Both `resource()` and fetch-backed `HttpClient` are built on it. `resource({ loader: ({ abortSignal }) => … })` hands your loader the exact same kind of signal this lesson built by hand, and aborts it automatically when the resource's params change or it's destroyed. And when `HttpClient` runs on the fetch backend (`provideHttpClient(withFetch())`), unsubscribing from the returned Observable calls `.abort()` on that request's signal — which is exactly why Observables are the 'cancellable' column in the table below and Promises are not.",
    },
  ];
}
