import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

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
    why: 'JSON strings and keys must use DOUBLE quotes. Single quotes are fine in JavaScript source, illegal in JSON — the #1 hand-written-JSON error.',
  },
  {
    label: 'Unquoted keys',
    bad: `{ name: "Ada" }`,
    why: 'JavaScript object literals allow bare keys; JSON does not. Every key needs double quotes: { "name": "Ada" }.',
  },
  {
    label: 'Trailing comma',
    bad: `{ "name": "Ada", }`,
    why: 'The comma after the last item is tolerated by JavaScript but is a syntax error in JSON. Parsers reject the whole document for it.',
  },
  {
    label: 'A function value',
    bad: `{ "greet": () => 'hi' }`,
    why: 'JSON is pure data — no functions, no undefined, no dates-as-objects. Values may only be: string, number, boolean, null, array, object.',
  },
];

/**
 * Lesson: JSON & APIs — JSON's grammar and its strict differences from JS
 * objects (with a live validator that names the mistake), parse/stringify
 * round-trips and their traps, REST endpoint anatomy, verbs + status codes
 * as a contract, a real fetch dissected line by line, and API error handling.
 */
@Component({
  selector: 'app-lesson-json-and-apis',
  imports: [RouterLink, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './json-and-apis.html',
  styleUrl: './json-and-apis.css',
})
export class JsonAndApis {
  /**
   * The round trip, drawn out. Written as a sequence because the two things
   * learners get wrong here — the second `await` and `fetch` not rejecting on a
   * 500 — are both really "which step am I standing on?" questions.
   */
  protected readonly roundTrip = [
    {
      label: 'You call `fetch(url)`',
      detail: 'Returns a promise immediately. Nothing has left the machine yet',
      tone: 'accent' as const,
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
      tone: 'good' as const,
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

  /** Choices for the round-trip-loss check. */
  protected readonly roundTripOptions = [
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

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
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

  /**
   * The JSON text in the live parser box. Seeded with a valid object so the demo
   * opens showing success rather than an error.
   */
  protected readonly raw = signal('{ "name": "Ada", "age": 36 }');
  /**
   * Whether the demo fetch is in flight, for the button's disabled state.
   */
  protected readonly busy = signal(false);
  /**
   * The demo fetch's outcome, rendered as text.
   */
  protected readonly apiResult = signal('');

  /**
   * The gotcha list.
   */
  protected readonly pitfalls = PITFALLS;
  /**
   * The gotcha being examined, or `null` for none.
   */
  protected readonly pitfall = signal<JsonPitfall | null>(null);

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
}
