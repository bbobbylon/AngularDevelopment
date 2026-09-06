import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * One JSON gotcha: the thing people write, and the thing that actually works.
 */
interface JsonPitfall {
  label: string;
  bad: string;
  why: string;
}

const PITFALLS: JsonPitfall[] = [
  {
    label: 'Single quotes',
    bad: `{ 'name': 'Ada' }`,
    why: 'JSON strings and keys must use DOUBLE quotes. Single quotes are fine in JavaScript source, illegal in JSON — this is the single most common hand-written-JSON mistake there is.',
  },
  {
    label: 'Unquoted keys',
    bad: `{ name: "Ada" }`,
    why: 'JavaScript object literals allow a bare key; JSON never does. Every key needs double quotes: { "name": "Ada" }.',
  },
  {
    label: 'Trailing comma',
    bad: `{ "name": "Ada", }`,
    why: 'The comma after the last item is tolerated by JavaScript but is a syntax error in JSON. A parser rejects the whole document for it — not just the one field.',
  },
  {
    label: 'A function value',
    bad: `{ "greet": () => 'hi' }`,
    why: 'JSON is pure data — no functions, no undefined, no dates-as-objects. A value may only be one of six things: string, number, boolean, null, array, object.',
  },
];

/**
 * Lesson: JSON & APIs — what a network connection actually carries and why that
 * forces a universal text format, the flat-pack analogy for JSON, its six-type
 * grammar proven with a live mistake-picker, parse/stringify and the round-trip
 * losses nobody warns you about, REST endpoint anatomy, verbs + status codes as
 * a contract, a real fetch dissected line by line, and API error handling.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`).
 * This is a **foundations**-tier lesson — the audience may never have written a
 * line of code before, and may never have heard of a server — so the tone stays
 * deliberately gentler than an expert-tier page even while covering the same
 * ground in the same shape. The reference implementation is
 * `expert/change-detection`; the closest tonal match is
 * `foundations/arrays-objects-basics`, migrated for the same audience.
 *
 * ## Teaching order, and why it is this order
 *
 * 1. **Pose the problem before naming it.** The opening section never says the
 *    word "JSON" until the reader has already felt the actual problem: a live
 *    object cannot leave the process it lives in. The napkin makes them commit
 *    to a guess about a `Date` surviving a round trip before any mechanism is
 *    explained — the quiz later in the page is the proof.
 * 2. **The flat-pack analogy carries the whole mental model.** Everything that
 *    "cannot go in the box" (functions, `undefined`, class identity) falls out
 *    of the analogy for free, rather than being a list to memorise. The wire
 *    diagram and the bubbles dialogue restate the same idea in two more modes.
 * 3. **Grammar before verbs.** JSON's six types and its stricter-than-JS rules
 *    come first, proven with a `Compare` (what you'd naturally write vs. what
 *    is legal) and a live mistake-picker built on `CodeLab` so the highlighting
 *    stays correct no matter which mistake is selected.
 * 4. **Every snippet is annotated line by line** via `app-code-lab`. Nothing on
 *    this page assumes the reader can already read the snippet; the parse／
 *    stringify pair, the endpoint anatomy, and the real fetch call all get a
 *    note per line rather than one sentence above a block.
 * 5. **The two classic bugs get the full ask-before-telling treatment twice** —
 *    once as a `Predict` on a snippet, once live against a real API — so the
 *    reader proves the mechanism to themselves rather than being told it.
 */
@Component({
  selector: 'app-lesson-json-and-apis',
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
  templateUrl: './json-and-apis.html',
  styleUrl: './json-and-apis.css',
})
export class JsonAndApis {
  // ── Presentation data ─────────────────────────────────────────────────────

  /**
   * A short bridging rail: this lesson's own category ("Data & the Web") has
   * no siblings, so the rail shows its true neighbours in the curriculum's
   * reading order instead — the DOM lesson just before it, and the terminal
   * lesson just after.
   */
  protected readonly stops: ChapterStop[] = [
    { label: 'The DOM & Events', id: 'dom-and-events' },
    { label: 'JSON & APIs' },
    { label: 'Terminal & npm', id: 'terminal-and-npm' },
  ];

  /**
   * The raw bytes shown inside the wire diagram. Kept as a bound field rather
   * than literal text in the template so the diagram never has to type a raw
   * `{` or `}` into the HTML body — the exact trap this lesson is most at risk
   * of tripping, given that it is a lesson about JSON.
   */
  protected readonly wireBytes = '{"name":"Ada","age":36}';

  /**
   * The flat-pack idea, staged as a conversation between a live object and the
   * function doing the packing. Dramatizes that nothing is negotiated — a
   * function or an `undefined` property is simply not there afterwards, and the
   * object never gets a say.
   */
  protected readonly flatPackTalk: BubbleTurn[] = [
    {
      who: 'Your live object',
      says: "I have a name, an age, a `when` that's a real `Date`, and a `greet()` method.",
    },
    {
      who: 'JSON.stringify',
      says: 'Noted. I can only write down six kinds of thing: strings, numbers, booleans, null, arrays, plain objects. Let me see what I can do with each.',
    },
    {
      who: 'The Date',
      says: 'So what happens to me?',
    },
    {
      who: 'JSON.stringify',
      says: 'I ask you politely for your `toJSON()`. You hand me back a string. That string is what crosses — not you.',
    },
    {
      who: 'greet()',
      says: 'And me?',
    },
    {
      who: 'JSON.stringify',
      says: "You're not data, you're behaviour. You don't even get converted — you're just absent from the output, and nothing complains.",
    },
  ];

  /**
   * A JS object literal written the way a beginner naturally would — and every
   * one of its four features that JSON rejects outright.
   */
  protected readonly jsObjectSample = `{
  name: 'Ada',
  age: 36,
  greet: () => 'hi',
}`;

  /** The same data, written the only way JSON actually allows. */
  protected readonly jsonCorrectSample = `{
  "name": "Ada",
  "age": 36
}`;

  /**
   * The gotcha list, and which one is currently open in the live picker.
   */
  protected readonly pitfalls = PITFALLS;
  protected readonly pitfall = signal<JsonPitfall>(PITFALLS[0]);

  /** The selected pitfall's bad snippet, fed to `app-code-lab`'s `[code]`. */
  protected readonly pitfallCode = computed(() => this.pitfall().bad);

  /**
   * A single note explaining the selected pitfall, fed to `app-code-lab`'s
   * `[notes]`. Rebuilding this on every selection — rather than relying on the
   * page-navigation highlight sweep — is what keeps the syntax highlighting
   * correct no matter which mistake the reader clicks through to.
   */
  protected readonly pitfallNotes = computed<CodeNote[]>(() => [
    { line: 1, text: this.pitfall().why },
  ]);

  /**
   * The six JSON types, one property per type, nested one level to show that
   * objects can hold objects. Fed to `app-code-lab` rather than typed as
   * literal template text, for the same brace-safety reason as {@link wireBytes}.
   */
  protected readonly jsonSample = `{
  "name": "Ada",
  "age": 36,
  "isAdmin": true,
  "nickname": null,
  "hobbies": ["chess", "coding"],
  "address": { "city": "London" }
}`;

  /** Line-by-line walkthrough of {@link jsonSample}. */
  protected readonly jsonNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The outer `{ }` is the object itself — everything below belongs to this one JSON object, and the whole thing is one value.',
    },
    {
      line: 2,
      text: '`"name"` is a **string** — and in JSON a string is only ever wrapped in **double** quotes, on the key and on the value both. Single quotes, which JavaScript happily accepts, are not legal JSON at all.',
    },
    {
      line: 3,
      text: '`"age"` is a **number** — no quotes anywhere. Quote a number by mistake (`"36"`) and it silently becomes a string instead of a number, and nothing warns you.',
    },
    {
      line: 4,
      text: '`"isAdmin"` is a **boolean** — the bare word `true` or `false`, never `"true"` in quotes.',
    },
    {
      line: 5,
      text: '`"nickname"` is `null` — JSON\'s way of saying "this key exists, and its value is deliberately nothing." That is a different fact from the key being missing entirely.',
    },
    {
      line: 6,
      text: '`"hobbies"` is an **array** — square brackets, comma-separated values, and the order you wrote them in is preserved exactly.',
    },
    {
      line: 7,
      text: '`"address"` is an **object** — and objects can hold other objects. There is no limit to how deep this nests, which is exactly how a real API response ends up with a customer, an address, and a city all in one document.',
    },
    {
      line: 8,
      text: 'And the document closes. Six types appeared above it — string, number, boolean, null, array, object — and that is the entire JSON vocabulary. Nothing else is legal.',
    },
  ];

  /**
   * The JSON text in the live parser box. Seeded with a valid object so the demo
   * opens showing success rather than an error.
   */
  protected readonly raw = signal('{ "name": "Ada", "age": 36 }');

  /**
   * Indirection over {@link raw} so {@link parsed} can be a plain method and still
   * re-run when the text changes — a method called from the template is not
   * reactive by itself, but reading a signal inside one that a `computed` feeds
   * keeps the dependency intact.
   */
  private readonly rawValue = computed(() => this.raw());

  /**
   * Parses {@link raw}, or `null` if it is not valid JSON.
   *
   * The `try` is the lesson: `JSON.parse` **throws** on malformed input rather
   * than returning `null`, which is the single most common way a fetch-and-parse
   * pipeline blows up in production.
   */
  protected parsed(): { name?: unknown; age?: unknown } | null {
    try {
      return JSON.parse(this.rawValue());
    } catch {
      return null;
    }
  }

  /**
   * Sample: `JSON.parse` and `JSON.stringify` as an actual round trip, ending
   * on the exact line that catches almost everyone — reading `.name` off the
   * original *string* instead of the parsed object.
   */
  protected readonly parseStringifySample = `const text = '{ "name": "Ada", "age": 36 }';   // a STRING — note the outer quotes

const obj = JSON.parse(text);        // text → a live object
obj.name;                            // 'Ada' — now it has real properties
text.name;                           // undefined — a string has no .name

const back = JSON.stringify(obj);            // object → text, one line
const pretty = JSON.stringify(obj, null, 2); // …or indented 2 spaces, for humans`;

  /** Line-by-line walkthrough of {@link parseStringifySample}. */
  protected readonly parseStringifyNotes: CodeNote[] = [
    {
      line: 1,
      text: "`text` is not JSON yet — it's a **JavaScript string** that happens to contain JSON-shaped characters. The outer `'...'` quotes are the giveaway: to JavaScript this is indistinguishable from any other string, until something parses it.",
    },
    {
      line: 3,
      text: '`JSON.parse` reads that string end to end and builds a **real object** from it. This is the step that turns "characters that look like data" into data you can actually use.',
    },
    {
      line: 4,
      text: 'Now `obj` has an honest `.name` property, because it is a live object. This line only works **after** line 3 has run.',
    },
    {
      line: 5,
      text: "And here is the trap in miniature: `text` is still just a string. Strings don't have a `.name` property, so this reads `undefined` — not an error, just nothing. Confusing the parsed object with the raw text it came from is the single most common JSON bug a beginner writes.",
    },
    {
      line: 7,
      text: '`JSON.stringify` runs the trip in reverse — a live object back to one unbroken line of text, ready to put on the wire or into `localStorage`.',
    },
    {
      line: 8,
      text: 'Same call, two extra arguments: `null` (no value transformer) and `2` (indent with 2 spaces). Purely cosmetic — it changes how the text *looks*, never what it means — and you will reach for it constantly while debugging in the console.',
    },
  ];

  /** Choices for the round-trip-loss check. */
  protected readonly roundTripOptions: QuizOption[] = [
    {
      text: 'All four survive — `stringify` and `parse` are exact inverses',
      why: 'They are inverses only for values JSON can express. Three of these four cannot survive the trip, and the surprise is that nothing warns you about any of them.',
    },
    {
      text: '`id` survives as a number; the other three come back changed or missing',
      correct: true,
      why: '`id: 1` is a number and round-trips perfectly. `when` was a `Date`, and `stringify` calls its `toJSON()`, so it goes out as the ISO **string** `"2026-08-29T…"` and parses back as a string — `data.when.getFullYear()` now throws. `tags: undefined` is dropped entirely; the key is not even present afterwards. And `greet` is a function, which JSON has no concept of, so it vanishes silently too. The rule underneath all three: the wire only carries the six JSON types, and anything else is either converted or quietly deleted.',
    },
    {
      text: 'It throws — `stringify` refuses to serialize a function',
      why: 'It would be kinder if it did. `stringify` throws on exactly one thing, a circular reference; functions and `undefined` are simply skipped without complaint.',
    },
    {
      text: '`greet` survives as a string of its source code',
      why: 'A reasonable guess, and some serializers do work that way. `JSON.stringify` does not — a function-valued property is treated as if it were not there at all.',
    },
  ];

  /**
   * The doubts this lesson reliably leaves behind — the same misconceptions
   * from before this lesson's presentation migration, kept intact.
   */
  protected readonly endpointNotes: CodeNote[] = [
    {
      line: 1,
      text: '`GET` reads. The path names a **collection** — `/users`, plural, no id — so this means "give me all of them." Nothing on the server changes because you asked.',
    },
    {
      line: 2,
      text: 'Same verb, but now the path names **one specific resource** — the id `42` slots straight into the URL. This is "nouns in the path": the thing you want lives in the address itself, never in a query parameter.',
    },
    {
      line: 3,
      text: "`POST` creates. Notice the path is the **collection** again, not an id — you don't know the new user's id yet, the server assigns one and hands it back in the response. The new user's data travels in the request **body**, not the URL.",
    },
    {
      line: 4,
      text: '`PUT` replaces the **whole** resource named at that exact path. Send a partial object and whatever you leave out is treated as deleted — this verb has no concept of "just this one field."',
    },
    {
      line: 5,
      text: "`PATCH` is `PUT`'s gentler sibling — send only the fields you want changed, and everything else on the resource is left alone.",
    },
    {
      line: 6,
      text: '`DELETE` removes. It targets one specific resource, exactly like `GET /users/42` and `PUT /users/42` did — the id-in-the-path convention holds across every verb.',
    },
    {
      line: 8,
      text: 'One request, three things at once. `/users/42` says whose orders; `/orders` says which sub-resource; and everything after the `?` is a **query string** — `status=open` and `page=2` are separate filters joined by `&`, and neither one changes *which* resource you asked for, only which slice of it comes back.',
    },
  ];

  /**
   * Sample: the six core REST verbs, each with the shape of its path spelled
   * out, plus one URL showing nesting and a query string together.
   */
  protected readonly endpointSample = `GET    /users              → the list of users          (read only; changes nothing)
GET    /users/42           → just user #42               (the id lives in the path)
POST   /users              → create a user                (you SEND the data in the body)
PUT    /users/42           → replace user #42 entirely
PATCH  /users/42           → update SOME fields of #42
DELETE /users/42           → remove user #42

GET    /users/42/orders?status=open&page=2`;

  /**
   * How each HTTP verb behaves. The three columns are the ones exams ask about,
   * and they explain design rules people otherwise memorize blindly — GET must
   * not mutate *because* it is safe and therefore cacheable and prefetchable.
   */
  protected readonly verbs = [
    {
      verb: 'GET',
      use: 'Read a resource',
      safe: 'Yes',
      idempotent: 'Yes',
      body: 'No',
      note: 'Cached and prefetched by browsers — never let one change data',
    },
    {
      verb: 'POST',
      use: 'Create; or any non-CRUD action',
      safe: 'No',
      idempotent: 'No',
      body: 'Yes',
      note: 'Send it twice and you get two records. This is why double-submit guards exist',
    },
    {
      verb: 'PUT',
      use: 'Replace a resource whole',
      safe: 'No',
      idempotent: 'Yes',
      body: 'Yes',
      note: 'Omit a field and you have just erased it',
    },
    {
      verb: 'PATCH',
      use: 'Update some fields',
      safe: 'No',
      idempotent: 'Usually',
      body: 'Yes',
      note: 'The right verb for "mark as read"',
    },
    {
      verb: 'DELETE',
      use: 'Remove a resource',
      safe: 'No',
      idempotent: 'Yes',
      body: 'Rarely',
      note: 'The second call is a 404, but the world still ends up the same',
    },
  ];

  /** The two-awaits / `res.ok` trap, in one snippet. */
  protected readonly fetchSample = `async function loadUser() {
  try {
    const data = await fetch('/api/users/999');
    return data.name;
  } catch {
    return 'could not load';
  }
}

// User 999 does not exist. The server replies 404
// with a JSON error body. What comes back?`;

  /**
   * The round trip, drawn out. Written as a sequence because the two things
   * learners get wrong here — the second `await` and `fetch` not rejecting on a
   * 500 — are both really "which step am I standing on?" questions.
   */
  protected readonly roundTrip: FlowStep[] = [
    {
      label: 'You call `fetch(url)`',
      detail: 'Returns a promise immediately. Nothing has left the machine yet',
      tone: 'accent',
    },
    {
      label: 'The request crosses the network',
      detail: 'DNS, TCP, TLS, then the bytes of your GET line and headers',
    },
    {
      label: 'The server answers with a status line',
      detail: '`200`, `404`, `500` — a reply either way. All of them count as an answer',
    },
    {
      label: 'The first `await` resolves',
      detail: 'You now hold a `Response`: status and headers ready, body still arriving',
    },
    {
      label: '`await res.json()`',
      detail: 'Reads the body to the end, then parses the text into objects',
    },
    {
      label: 'You have real objects',
      detail: '`data.address.city` works. Just dot into it from here',
      tone: 'good',
    },
  ];

  /**
   * Sample: exactly the code {@link fetchUser} runs, minus the busy/result
   * signal plumbing, so the reader sees the real shape rather than a toy.
   */
  protected readonly liveFetchSample = `const res = await fetch('https://jsonplaceholder.typicode.com/users/1');

if (!res.ok) {
  return 'HTTP ' + res.status;     // the server answered — just with bad news
}

const data = await res.json();

data.address.city;   // now it's just objects — dot into the nesting`;

  /** Line-by-line walkthrough of {@link liveFetchSample}. */
  protected readonly liveFetchNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The first `await`. `fetch` resolves as soon as the status line and headers arrive — `res` is a **Response**, not your data. The body may still be streaming in behind it.',
    },
    {
      line: 3,
      text: '`res.ok` is `true` for any 2xx status and `false` for everything else — 404, 500, all of it. `fetch` itself never rejects for these; you have to ask.',
    },
    {
      line: 4,
      text: "So you ask, and hand back your own message if the answer was bad news. Skip this check and a 404's error page gets treated as if it were a real user record.",
    },
    {
      line: 7,
      text: 'The **second** `await`. `.json()` reads the rest of the body to the end and parses it in one step — this is the line that actually produces your data.',
    },
    {
      line: 9,
      text: "From here on it's an ordinary object. `data.address.city` is just dotting into nested objects, exactly like every other object on this page.",
    },
  ];

  /**
   * Whether the demo fetch is in flight, for the button's disabled state.
   */
  protected readonly busy = signal(false);
  /**
   * The demo fetch's outcome, rendered as text.
   */
  protected readonly apiResult = signal('');

  /**
   * Fetches a real record from a public API so the lesson shows a genuine network
   * round-trip — status, latency and all — rather than a mocked one.
   */
  protected async fetchUser() {
    this.busy.set(true);
    this.apiResult.set('');
    try {
      const res = await fetch('https://jsonplaceholder.typicode.com/users/1');
      if (!res.ok) {
        // fetch resolved but the server reported an error status — handle it explicitly
        this.apiResult.set(`HTTP ${res.status} — the server answered, but with an error.`);
        return;
      }
      const data = await res.json();
      this.apiResult.set(
        `status: ${res.status} OK\nname:  ${data.name}\nemail: ${data.email}\ncity:  ${data.address?.city}`,
      );
    } catch {
      this.apiResult.set(
        'Network failure — are you online? (This is the case fetch actually rejects on.)',
      );
    } finally {
      this.busy.set(false);
    }
  }

  /** The exam-corner predict's prompt. */
  protected readonly examPrompt =
    'A classic interview warm-up: design the endpoint for **"mark notification #7 as read."** Pick a verb and a path before you scroll — what would you send, and what belongs in the body?';

  /** The exam-corner predict's reveal. */
  protected readonly examAnswer =
    'The answer most interviewers want is `PATCH /notifications/7` with a body of just `{"read": true}` — a partial update of one field on one resource. `POST /notifications/7/mark-read` is common in the wild too, since not every action maps cleanly onto CRUD, and a reasonable interviewer accepts it. What loses you the point is `GET /markRead?id=7`, and now you know exactly why: `GET` is **safe**, so browsers, proxies and link-prefetchers all feel free to call it whenever they like. Ship that, and notifications start marking themselves read at random — a browser merely preloading a link is enough to trigger it.';

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why does `data.name` come back `undefined` right after `await fetch(url)`?',
      a: 'One await short. `fetch` resolves as soon as the status line and headers arrive — the body is still streaming — so what you are holding is a `Response`, not your data. `await res.json()` is the step that drains the body and parses it. The symptom to memorize: an object with `.status` and `.ok` on it where you expected a user means you skipped `.json()`.',
    },
    {
      q: 'The server sent a 500 and my `catch` never ran. Is that a bug?',
      a: "No, and it is the single most consequential design decision in `fetch`. It rejects only when the exchange never completed — offline, DNS failure, CORS block. A 500 is a completed exchange: you asked, the server answered, the answer was bad news. So the promise resolves and you have to check `res.ok` yourself. Skip that and your app cheerfully parses an error page as if it were data. Angular's `HttpClient` takes the opposite view and routes error statuses to the error channel for you.",
    },
    {
      q: 'Is an ISO string like `2026-08-29T09:00:00Z` a date?',
      a: 'It is a string that everyone has agreed to read as a date. JSON has six value types and none of them is a date, so ISO-8601 text is pure convention — a very strong one, but convention. After parsing you must convert explicitly with `new Date(data.when)`. The bug this causes is always the same: sorting works by accident (ISO strings sort correctly as text) until someone sends a different format.',
    },
    {
      q: 'Should numbers ever be strings in JSON?',
      a: 'Sometimes, and deliberately. JSON numbers are IEEE-754 doubles, so any integer past 2^53 loses precision — database IDs, Twitter/X snowflake IDs and financial amounts in cents are the usual victims. Serious APIs send those as strings on purpose. If an ID ever comes back off by one, this is why.',
    },
    {
      q: 'Why do I need `JSON.parse` at all if the response looks like an object in DevTools?',
      a: 'DevTools is being helpful — the Network tab pretty-prints the raw text into a tree so you can read it. What actually crossed the wire was characters. `res.json()` is doing the parse for you, which is why you rarely call `JSON.parse` by hand on a fetch; you do call it on `localStorage`, on a config file, or on anything you stored as text yourself.',
    },
  ];
}
