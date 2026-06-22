import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-json-and-apis',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Data & the Web</span>
      <h1>Data on the Web: JSON & APIs</h1>
      <p class="lead">
        Apps are mostly about <strong>data</strong> — users, products, messages — and
        that data usually lives on a server. Two ideas make it all work: <strong>JSON</strong>
        (the universal format data travels in) and <strong>APIs</strong> (the doorways you
        ask for it). Get these and you understand how every app talks to the internet.
      </p>

      <h2>What is JSON?</h2>
      <p>
        JSON (JavaScript Object Notation) is just <strong>text</strong> shaped like the
        objects and arrays you already learned. It's how data is written down so it can
        travel between computers — every language can read and write it.
      </p>
      <div class="code">
        <pre>{{ '{' }}
  "name": "Ada",
  "age": 36,
  "isAdmin": true,
  "hobbies": ["chess", "coding"],
  "address": {{ '{' }} "city": "London" {{ '}' }}
{{ '}' }}</pre>
      </div>
      <p>
        Almost identical to a JavaScript object — with two rules: keys go in
        <strong>double quotes</strong>, and values are only strings, numbers, booleans,
        <code>null</code>, arrays, or objects (no functions). It's just data.
      </p>

      <h2>Text ⇄ objects: parse and stringify</h2>
      <p>JSON arrives as text; you turn it into a real object to use it, and back to text to send it:</p>
      <div class="code">
        <pre>const text = '{{ '{' }} "name": "Ada", "age": 36 {{ '}' }}';   // JSON text (e.g. from a server)

const obj = JSON.parse(text);     // text → real object  → obj.name === 'Ada'
const back = JSON.stringify(obj); // object → text       → to send to a server</pre>
      </div>
      <div class="demo">
        <p class="demo__title">Try it — edit JSON text, read it as data</p>
        <textarea [value]="raw()" (input)="raw.set($any($event.target).value)" rows="4" style="width:100%"></textarea>
        @if (parsed(); as p) {
          <div class="code"><pre>JSON.parse(text).name   → {{ p.name }}
JSON.parse(text).age    → {{ p.age }}</pre></div>
        } @else {
          <p style="color:var(--accent)">⚠ That isn't valid JSON yet — check the quotes and commas.</p>
        }
      </div>

      <h2>What is an API?</h2>
      <p>
        An <strong>API</strong> (Application Programming Interface) is a set of
        <strong>URLs on a server you can ask for data</strong>. You send a request to a
        URL (an "endpoint"); the server sends back JSON. It's a menu of things you're
        allowed to ask for.
      </p>
      <div class="code">
        <pre>GET  https://api.example.com/users        → a JSON list of users
GET  https://api.example.com/users/42     → JSON for user #42
POST https://api.example.com/users        → create a new user (you send JSON)</pre>
      </div>
      <p>
        <code>GET</code>, <code>POST</code>, <code>PUT</code>, <code>DELETE</code> are
        the "verbs" — read, create, update, remove. (You'll meet them again in Angular's
        <code>HttpClient</code> lessons.)
      </p>

      <h2>Try it — ask a real API for data</h2>
      <div class="demo">
        <p class="demo__title">Live — a real GET request to a public test API</p>
        <button (click)="fetchUser()" [disabled]="busy()">{{ busy() ? 'Asking…' : 'GET /users/1' }}</button>
        @if (apiResult()) {
          <div class="code"><pre>{{ apiResult() }}</pre></div>
        }
        <p style="color:var(--text-muted);font-size:.85rem">
          Your browser sent a request over the internet; the server replied with JSON,
          which we turned into an object and displayed.
        </p>
      </div>

      <div class="note">
        Putting it together: an app <strong>asks an API</strong> (a URL) for data, the
        server replies with <strong>JSON</strong>, the app <strong>parses</strong> it into
        objects, and renders them on screen. That round-trip — done asynchronously — is
        the backbone of almost every app you use.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><strong>JSON</strong> is text shaped like objects/arrays — the universal data format (keys in double quotes).</li>
        <li><code>JSON.parse</code> turns JSON text into a usable object; <code>JSON.stringify</code> goes back to text.</li>
        <li>An <strong>API</strong> is a set of server URLs (endpoints) you request data from.</li>
        <li>Verbs <code>GET</code>/<code>POST</code>/<code>PUT</code>/<code>DELETE</code> mean read/create/update/remove.</li>
      </ul>

      <p><a routerLink="/terminal-and-npm">Next: The Terminal & npm →</a></p>
    </article>
  `,
})
export class JsonAndApis {
  protected readonly raw = signal('{ "name": "Ada", "age": 36 }');
  protected readonly busy = signal(false);
  protected readonly apiResult = signal('');

  protected parsed(): { name?: unknown; age?: unknown } | null {
    try {
      return JSON.parse(this.raw());
    } catch {
      return null;
    }
  }

  protected async fetchUser() {
    this.busy.set(true);
    this.apiResult.set('');
    try {
      const res = await fetch('https://jsonplaceholder.typicode.com/users/1');
      const data = await res.json();
      this.apiResult.set(`name:  ${data.name}\nemail: ${data.email}\ncity:  ${data.address?.city}`);
    } catch {
      this.apiResult.set('Request failed — are you online?');
    } finally {
      this.busy.set(false);
    }
  }
}
