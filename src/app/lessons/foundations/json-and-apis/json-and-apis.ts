import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: JSON & APIs — JSON's grammar and its strict differences from JS
 * objects (with a live validator that names the mistake), parse/stringify
 * round-trips and their traps, REST endpoint anatomy, verbs + status codes
 * as a contract, a real fetch dissected line by line, and API error handling.
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

@Component({
  selector: 'app-lesson-json-and-apis',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Data &amp; the Web</span>
      <h1>Data on the Web: JSON &amp; APIs</h1>
      <p class="lead">
        Apps are mostly about <strong>data</strong> — users, products, messages — and
        that data usually lives on a server. Two ideas make the whole exchange work:
        <strong>JSON</strong> (the format data travels in) and <strong>APIs</strong>
        (the doorways you request it through). This page goes deep on both, because
        every Angular <code>HttpClient</code> lesson later is built directly on them.
      </p>

      <h2>What is JSON?</h2>
      <p>
        JSON (JavaScript Object Notation) is <strong>text</strong> shaped like the
        objects and arrays you already know. That "text" part matters: over the wire,
        between programs, in files — data travels as characters, and JSON is the
        agreed way to write structured data down so <em>any</em> language can read it
        back. Python, Java, Rust — everyone speaks it.
      </p>
      <div class="code"><pre>{{ '{' }}
  "name": "Ada",                      ← string (double quotes, always)
  "age": 36,                          ← number (no quotes)
  "isAdmin": true,                    ← boolean
  "nickname": null,                   ← null = deliberately empty
  "hobbies": ["chess", "coding"],     ← array — order preserved
  "address": {{ '{' }} "city": "London" {{ '}' }}    ← objects nest arbitrarily deep
{{ '}' }}</pre></div>
      <p>
        It looks like JavaScript but is <em>stricter</em>. The grammar has exactly six
        value types (string, number, boolean, null, array, object) and hard rules that
        trip everyone at least once. Spot the error in each:
      </p>
      <div class="demo">
        <p class="demo__title">Try it — four classic almost-JSON mistakes</p>
        <div class="row" style="flex-wrap:wrap;margin-bottom:8px">
          @for (p of pitfalls; track p.label) {
            <button [class.ghost]="pitfall() !== p" (click)="pitfall.set(p)">{{ p.label }}</button>
          }
        </div>
        @if (pitfall(); as p) {
          <div class="code"><pre>{{ p.bad }}   ← ❌ invalid JSON</pre></div>
          <p style="font-size:.9rem">{{ p.why }}</p>
        } @else {
          <p style="color:var(--text-muted)">Pick one — each is valid-ish JavaScript but rejected by every JSON parser.</p>
        }
      </div>

      <h2>Text ⇄ objects: parse and stringify</h2>
      <p>
        JSON arrives as one long string. Before you can write
        <code>data.name</code>, the text must become a real object — and to send data
        back, the object must become text again. Two built-ins do the converting:
      </p>
      <div class="code"><pre>const text = '{{ '{' }} "name": "Ada", "age": 36 {{ '}' }}';  // a STRING (note the outer quotes)

const obj = JSON.parse(text);      // text → live object
obj.name                           // 'Ada' — now it has properties
// text.name                       // undefined! strings don't have .name

const back = JSON.stringify(obj);         // object → text, one line
const pretty = JSON.stringify(obj, null, 2);  // …or indented 2 spaces (debugging!)</pre></div>
      <ul>
        <li><strong><code>parse</code> throws on bad input.</strong> One missing quote and it raises an error rather than returning half the data — which is why real code wraps it in <code>try/catch</code> (the demo below does; feed it junk and watch).</li>
        <li><strong><code>stringify</code> silently drops what JSON can't express</strong> — functions and <code>undefined</code> properties just vanish. A <code>Date</code> becomes a plain string, and parsing it back gives you a string, <em>not</em> a Date. Round-trips are not always lossless.</li>
        <li>The <code>null, 2</code> trick prints readable JSON — you'll use it for debugging weekly.</li>
      </ul>
      <div class="demo">
        <p class="demo__title">Try it — edit JSON text, watch it parse (or fail)</p>
        <textarea [value]="raw()" (input)="raw.set($any($event.target).value)" rows="4" style="width:100%"></textarea>
        @if (parsed(); as p) {
          <div class="code"><pre>JSON.parse(text).name   → {{ p.name }}
JSON.parse(text).age    → {{ p.age }}</pre></div>
        } @else {
          <p style="color:var(--accent)">⚠ JSON.parse threw — not valid JSON yet. (Try removing a quote or adding a trailing comma to see how picky it is.)</p>
        }
      </div>

      <h2>What is an API?</h2>
      <p>
        An <strong>API</strong> (Application Programming Interface) is a server's
        <strong>menu of URLs you may request data from</strong>. Each URL is an
        <em>endpoint</em>; the whole set forms a contract: ask this way, receive this
        shape. The dominant style, <strong>REST</strong>, organizes endpoints around
        <em>things</em> (resources) and reuses the HTTP verbs you met in
        <a routerLink="/how-the-web-works">How the Web Works</a> as actions on them:
      </p>
      <div class="code"><pre>GET    /users          → the list of users            (read, changes nothing)
GET    /users/42       → just user #42                (the id lives in the path)
POST   /users          → create a user                (you SEND JSON in the body)
PUT    /users/42       → replace user #42 entirely
PATCH  /users/42       → update SOME fields of #42
DELETE /users/42       → remove user #42

GET    /users/42/orders?status=open&page=2
       └──── nesting: #42's orders ────┘└── query string: filters & paging ──┘</pre></div>
      <ul>
        <li><strong>Nouns in the path, verbs in the method.</strong> Not <code>/getUsers</code> or <code>/deleteUser?id=42</code> — the resource is <code>/users/42</code> and the verb says what to do to it.</li>
        <li><strong>The response pairs a status code with JSON:</strong> 200 + data, 201 ("created") after a successful POST, 404 when the id doesn't exist, 400 when your JSON was malformed, 401/403 when you aren't allowed. Your app must branch on these — a good UI shows "user not found", not a blank screen.</li>
        <li><strong>Most APIs require identification:</strong> typically a token sent in a header (<code>Authorization: Bearer eyJhbG…</code>) with every request — HTTP is stateless, so you prove who you are each time.</li>
      </ul>

      <h2>Try it — ask a real API for data</h2>
      <div class="demo">
        <p class="demo__title">Live — a real GET request to a public test API</p>
        <button (click)="fetchUser()" [disabled]="busy()">{{ busy() ? 'Asking…' : 'GET /users/1' }}</button>
        @if (apiResult()) {
          <div class="code"><pre>{{ apiResult() }}</pre></div>
        }
        <p style="color:var(--text-muted);font-size:.85rem">
          A real request just crossed the internet and returned JSON. The exact code
          that ran, line by line:
        </p>
        <div class="code"><pre>const res  = await fetch('https://jsonplaceholder.typicode.com/users/1');
//    └ fetch returns a promise of the RESPONSE — headers ready, body still streaming

const data = await res.json();
//    └ second await! .json() reads the body to the end AND parses it

data.address.city   // from here on it's just objects — dot into the nesting</pre></div>
        <p style="color:var(--text-muted);font-size:.85rem">
          Two awaits surprise everyone: the first gets the envelope (status, headers),
          the second finishes reading and parsing the letter inside. One more trap:
          <code>fetch</code> does <em>not</em> reject on a 404/500 — the request
          "succeeded" in reaching the server. You must check
          <code>res.ok</code> / <code>res.status</code> yourself. (Angular's
          <code>HttpClient</code>, coming later, treats error statuses as errors for
          you — one of many conveniences it layers on top of exactly this.)
        </p>
      </div>

      <div class="note">
        The full backbone of nearly every app, in one sentence: the app
        <strong>asynchronously</strong> asks an <strong>endpoint</strong> for data,
        the server answers with a <strong>status code</strong> and
        <strong>JSON</strong>, the app <strong>parses</strong> it, branches on
        success/failure, and renders objects to the screen. Every piece of that
        sentence is a lesson you've now had.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why does <code>data.name</code> fail with "undefined" right after <code>const data = await fetch(url)</code>?</summary>
        <div>One await short: <code>fetch</code> resolves to the <em>Response</em>
        object (status, headers), not the parsed body. You need
        <code>const data = await res.json()</code>. Symptom to memorize: a Response
        where you expected data = missing <code>.json()</code> step.</div>
      </details>
      <details class="qa">
        <summary>The server answered <code>500</code> but your <code>catch</code> around fetch never ran. Why?</summary>
        <div><code>fetch</code> only rejects on <em>network</em> failure (offline, DNS,
        CORS). An HTTP error status is still a completed exchange, so it resolves
        normally — you must check <code>res.ok</code>. Forgetting this means your app
        happily tries to parse an error page as data.</div>
      </details>
      <details class="qa">
        <summary>Is <code>{{ '{' }} "when": "2026-07-10T09:00:00Z" {{ '}' }}</code> a date?</summary>
        <div>No — JSON has no date type; it's a string in ISO format by convention.
        After parsing, <code>typeof data.when === 'string'</code>; you convert
        explicitly with <code>new Date(data.when)</code>. APIs and apps agreeing on
        ISO-8601 strings is convention, not grammar.</div>
      </details>
      <details class="qa">
        <summary>Design the endpoint: "mark notification #7 as read".</summary>
        <div>Most RESTful: <code>PATCH /notifications/7</code> with body
        <code>{{ '{' }} "read": true {{ '}' }}</code> — a partial update of one field on one
        resource. <code>POST /notifications/7/mark-read</code> also exists in the wild
        (action-style); what you should <em>not</em> do is
        <code>GET /markRead?id=7</code> — GET must never change data (browsers
        prefetch and cache GETs, which would mark things read at random!).</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><strong>JSON</strong> is strict text: double-quoted keys and strings, six value types, no functions/undefined/trailing commas. It looks like JS but a parser rejects what JS tolerates.</li>
        <li><code>JSON.parse</code> (throws on bad input — try/catch it) and <code>JSON.stringify</code> (drops the unexpressible; dates become strings) convert between wire text and live objects.</li>
        <li>A REST <strong>API</strong> = nouns in paths (<code>/users/42</code>), verbs as HTTP methods, filters in query strings, identity in headers, and a status code + JSON in every answer.</li>
        <li><code>fetch</code> needs <strong>two awaits</strong> (response, then <code>.json()</code>) and does <em>not</em> reject on 404/500 — check <code>res.ok</code>.</li>
        <li>GET must never mutate. Ever. Browsers and caches assume it.</li>
      </ul>

      <p><a routerLink="/terminal-and-npm">Next: The Terminal &amp; npm →</a></p>
    </article>
  `,
  styles: [
    `.qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class JsonAndApis {
  protected readonly raw = signal('{ "name": "Ada", "age": 36 }');
  protected readonly busy = signal(false);
  protected readonly apiResult = signal('');

  protected readonly pitfalls = PITFALLS;
  protected readonly pitfall = signal<JsonPitfall | null>(null);

  private readonly rawValue = computed(() => this.raw());

  protected parsed(): { name?: unknown; age?: unknown } | null {
    try {
      return JSON.parse(this.rawValue());
    } catch {
      return null;
    }
  }

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
