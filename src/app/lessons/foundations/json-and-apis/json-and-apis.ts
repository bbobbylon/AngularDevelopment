import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  imports: [RouterLink],
  templateUrl: './json-and-apis.html',
  styleUrl: './json-and-apis.css',
})
export class JsonAndApis {
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
      this.apiResult.set('Network failure — are you online? (This is the case fetch actually rejects on.)');
    } finally {
      this.busy.set(false);
    }
  }
}
