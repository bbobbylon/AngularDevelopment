import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: How the web works — client/server, URLs, DNS, HTTP anatomy,
 * status codes, what the browser does with a response, and where Angular
 * sits in the whole picture. Zero prior knowledge assumed, but deep:
 * by the end the reader can narrate every step between typing an address
 * and seeing a page.
 */

interface JourneyStep {
  label: string;
  icon: string;
  detail: string;
}

const JOURNEY: JourneyStep[] = [
  {
    label: '1 · You type a URL',
    icon: '⌨️',
    detail:
      'You type "example.com" and press Enter. The browser first checks: do I already have this page cached? If not, the journey begins. The browser cannot talk to "example.com" directly — names are for humans. It needs a numeric address.',
  },
  {
    label: '2 · DNS lookup',
    icon: '📖',
    detail:
      'DNS (Domain Name System) is the internet\'s phone book. The browser asks a DNS server: "what is the IP address for example.com?" and gets back something like 93.184.216.34. Every machine on the internet is reachable by such a number — the name exists purely so you don\'t have to memorize it.',
  },
  {
    label: '3 · Connect (TCP + TLS)',
    icon: '🤝',
    detail:
      'The browser opens a connection to that IP address (TCP — a reliable two-way pipe), and for https:// it also performs a TLS handshake: the server proves its identity with a certificate and both sides agree on encryption keys. From here on, nobody in between can read or tamper with the traffic. This is why the padlock matters.',
  },
  {
    label: '4 · HTTP request',
    icon: '✉️',
    detail:
      'Now the actual ask: the browser sends a small, plain-text-shaped message — "GET / HTTP/1.1" plus headers (who I am, what formats I accept, cookies…). GET means "give me this resource, I\'m not changing anything". The full anatomy is dissected below.',
  },
  {
    label: '5 · Server responds',
    icon: '🖥️',
    detail:
      'The server finds (or generates) the page and answers with a status code (200 = OK), its own headers (what type of content this is, how long you may cache it…), and the body — the HTML text itself. If something went wrong you get 404 (no such page) or 500 (the server crashed trying).',
  },
  {
    label: '6 · Browser renders',
    icon: '🎨',
    detail:
      'The browser reads the HTML top-to-bottom and builds the DOM (a live tree of every element). HTML references CSS and JavaScript files — each triggers ANOTHER request/response round-trip. CSS is applied, JavaScript runs, and pixels finally hit the screen. An Angular app\'s JavaScript bundle arrives exactly this way.',
  },
];

interface StatusCode {
  code: string;
  meaning: string;
  story: string;
}

const STATUS_CODES: StatusCode[] = [
  { code: '200 OK', meaning: 'Success', story: 'Here is exactly what you asked for.' },
  { code: '301 Moved', meaning: 'Redirect', story: 'That page lives at a new address now — go there instead (the browser follows automatically).' },
  { code: '404 Not Found', meaning: 'Client error', story: 'You asked for something that does not exist. The 4xx family means "your request was the problem".' },
  { code: '403 Forbidden', meaning: 'Client error', story: 'The page exists but you are not allowed to see it.' },
  { code: '500 Server Error', meaning: 'Server error', story: 'Your request was fine — the server blew up processing it. The 5xx family means "our fault, not yours".' },
];

@Component({
  selector: 'app-lesson-how-the-web-works',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Web Basics</span>
      <h1>How Websites &amp; Web Apps Work</h1>
      <p class="lead">
        Before any Angular, let's build the mental model everything else rests on.
        We assume <strong>zero</strong> prior knowledge — but we won't stay shallow:
        by the end of this page you'll be able to narrate every single step between
        typing an address and seeing a page, which is exactly the story every web
        framework (Angular included) plugs into.
      </p>

      <h2>The big picture: client and server</h2>
      <p>When you open a website, two computers talk to each other:</p>
      <ul>
        <li>
          <strong>The client</strong> — your browser (Chrome, Safari, Firefox) on your
          phone or laptop. It <em>asks</em> for a page and <em>shows</em> it to you.
        </li>
        <li>
          <strong>The server</strong> — a computer somewhere on the internet that
          <em>stores</em> (or generates) the website and <em>answers</em> requests for it.
          "Server" isn't special hardware — it's any computer whose job is to sit there
          and serve answers. Your laptop becomes one the day you run
          <code>ng serve</code>.
        </li>
      </ul>
      <p>
        Think of a restaurant: you (the client) order from a menu; the kitchen (the
        server) prepares the food and sends it back. The order travelling there is the
        <strong>request</strong>, and the meal travelling back is the
        <strong>response</strong>. Two rules of the relationship matter for everything
        you'll build later:
      </p>
      <ul>
        <li>
          <strong>The client always starts.</strong> Servers never call you out of the
          blue — they only answer. (Later you'll meet tricks like WebSockets that keep
          a line open, but even those start with a client request.)
        </li>
        <li>
          <strong>Each request stands alone.</strong> HTTP is <em>stateless</em>: the
          server doesn't inherently remember your previous request. "Staying logged in"
          works because the browser re-sends a small proof (a cookie or token) with
          every request. This single fact explains half of web security and all of
          authentication — remember it.
        </li>
      </ul>

      <h2>Anatomy of a URL — the address on the envelope</h2>
      <div class="code"><pre>{{ urlSample }}</pre></div>
      <p>Reading that line-by-line, left to right:</p>
      <ul>
        <li><code>https://</code> — the <strong>scheme</strong>: which protocol (language) to use. <code>https</code> is HTTP with encryption; the padlock in your address bar.</li>
        <li><code>www.shop.example.com</code> — the <strong>host</strong>: which machine on the internet to talk to. Read it right-to-left: <code>com</code> (top-level domain) → <code>example</code> (the domain someone bought) → <code>shop</code>, <code>www</code> (subdomains the owner made up).</li>
        <li><code>:443</code> — the <strong>port</strong>: which "door" on that machine. One computer can run many programs; ports keep them apart. 443 is the default for https (80 for http), so browsers hide it. Your dev server's <code>localhost:4200</code> is the same idea — door 4200 on your own machine.</li>
        <li><code>/products/42</code> — the <strong>path</strong>: which resource on that server. In an Angular app, the router turns paths like this into screens.</li>
        <li><code>?color=red&amp;size=m</code> — the <strong>query string</strong>: extra key=value options, separated by <code>&amp;</code>. Filters, search terms, page numbers.</li>
        <li><code>#reviews</code> — the <strong>fragment</strong>: a position <em>within</em> the page. It never even gets sent to the server — the browser handles it alone.</li>
      </ul>

      <h2>The full journey — click through every step</h2>
      <div class="demo">
        <p class="demo__title">Live — from typed URL to rendered page</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="play()" [disabled]="playing()">{{ playing() ? 'Travelling…' : '▶ Play the whole journey' }}</button>
          <button class="ghost" (click)="reset()">Reset</button>
        </div>
        <div class="journey">
          @for (s of steps; track s.label; let i = $index) {
            <button
              class="jstep"
              [class.done]="step() > i"
              [class.active]="step() === i"
              (click)="step.set(i)"
            >
              <span class="jicon">{{ s.icon }}</span>
              <span>{{ s.label }}</span>
            </button>
          }
        </div>
        <div class="jdetail">
          <p>{{ current().detail }}</p>
        </div>
        @if (step() === steps.length - 1) {
          <p style="color:var(--green)">
            ✅ That's the whole loop. Every image, stylesheet and script on a page repeats
            steps 4–5. A typical page fires dozens of these round-trips.
          </p>
        }
      </div>

      <h2>What a request and response actually look like</h2>
      <p>
        HTTP messages are humble, human-readable text. Here is a real exchange,
        annotated line by line — this exact shape is what you'll later watch in the
        browser's Network tab and build against with Angular's <code>HttpClient</code>:
      </p>
      <div class="code"><pre>{{ httpSample }}</pre></div>
      <ul>
        <li><strong>Line 1 of the request</strong> — the verb (<code>GET</code>), the path, the protocol version. Other verbs you'll meet: <code>POST</code> (create/send data), <code>PUT</code>/<code>PATCH</code> (update), <code>DELETE</code>. The verb is a <em>promise about intent</em>: GET must not change anything on the server.</li>
        <li><strong>Request headers</strong> — metadata, one per line, as <code>Name: value</code>. <code>Host</code> says which site (one server can host many); <code>Accept</code> says what formats the browser can digest; <code>Cookie</code> is the "remember me" proof from the statelessness discussion above.</li>
        <li><strong>Line 1 of the response</strong> — protocol, then the <strong>status code</strong> and its reason phrase. The number is machine-readable; the phrase is for humans.</li>
        <li><strong>Response headers</strong> — <code>Content-Type</code> tells the browser how to interpret the body (HTML? image? JSON?). Get this wrong and the browser shows gibberish — the body is just bytes until a header explains it.</li>
        <li><strong>Blank line, then the body</strong> — the payload itself. For a page: HTML text. For an API call: usually JSON. The blank line is the actual separator in the protocol — headers end, body begins.</li>
      </ul>

      <h2>Status codes — the server's one-number verdict</h2>
      <div class="demo">
        <p class="demo__title">Try it — what does each code mean?</p>
        <div class="row" style="flex-wrap:wrap">
          @for (s of statusCodes; track s.code) {
            <button [class.ghost]="picked() !== s" (click)="picked.set(s)">{{ s.code }}</button>
          }
        </div>
        @if (picked(); as p) {
          <p style="margin-top:10px"><strong>{{ p.meaning }}:</strong> {{ p.story }}</p>
        } @else {
          <p style="color:var(--text-muted);margin-top:10px">Pick a code. The first digit is the family: 2xx success, 3xx redirect, 4xx you messed up, 5xx we messed up.</p>
        }
      </div>

      <h2>The three languages of the web</h2>
      <p>The body of that 200 response was HTML — but every page is really three technologies working together:</p>
      <table class="t">
        <tr><td><strong>HTML</strong></td><td>The <em>structure</em> — headings, paragraphs, buttons, images. Like the walls and rooms of a house.</td></tr>
        <tr><td><strong>CSS</strong></td><td>The <em>style</em> — colors, fonts, spacing, layout. The paint and furniture.</td></tr>
        <tr><td><strong>JavaScript</strong></td><td>The <em>behavior</em> — what happens when you click, type or scroll. The electricity and plumbing that make things <em>do</em> something.</td></tr>
      </table>
      <p>
        When HTML arrives, the browser parses it into the <strong>DOM</strong> — a live
        tree of objects, one per element — and paints it. JavaScript's superpower is
        that it can <em>reach into that tree and change it</em> after the page is on
        screen: add elements, remove them, rewrite text, react to clicks. Hold on to
        that sentence — it is literally Angular's job description. Angular is a large,
        organized system for deciding <em>what the DOM should look like right now</em>
        and updating it when your data changes, written in
        <strong>TypeScript</strong> (a safer JavaScript we cover soon).
      </p>

      <h2>Web page vs web app — and where Angular fits</h2>
      <p>
        A simple <strong>web page</strong> mostly shows information (a blog post, a news
        article). A <strong>web app</strong> is interactive software that runs in the
        browser — Gmail, Google Maps, your online bank. The difference is where the
        work happens:
      </p>
      <table class="t">
        <tr><td><strong>Classic website</strong></td><td>Every click asks the server for a whole new HTML page. The browser blanks and redraws. The server does the thinking; the browser mostly displays.</td></tr>
        <tr><td><strong>Single Page Application (SPA)</strong></td><td>The first response ships one HTML shell plus a JavaScript bundle. From then on, clicks are handled <em>by that JavaScript in your browser</em>: it swaps content in place and fetches only raw <em>data</em> (JSON) from the server when needed. No blank flashes.</td></tr>
      </table>
      <div class="note">
        <strong>Angular builds SPAs.</strong> You're inside one right now: click between
        lessons and watch the address bar change <em>without a page reload</em>. The
        Angular <em>router</em> intercepts the click, rewrites the URL, and swaps the
        lesson component into the page — steps 1–6 above happened only once, when you
        first loaded the app.
      </div>
      <p>
        This also explains the trade-off you'll hear about later: an SPA's very first
        load carries the whole JavaScript bundle (slower start), after which everything
        is instant. Techniques you'll meet at the expert tier —
        <em>lazy loading</em>, <em>server-side rendering</em>, <em>hydration</em> — are
        all attacks on that first-load cost. The vocabulary of this page is the
        foundation for all of them.
      </p>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Your friend types a URL and the page appears. Name the steps in order.</summary>
        <div>Browser checks cache → DNS resolves the host name to an IP address →
        TCP connection opens (+ TLS handshake for https) → browser sends an HTTP GET
        request → server replies with status + headers + HTML body → browser parses
        HTML into the DOM, requests the CSS/JS it references, applies styles, runs
        scripts, paints pixels.</div>
      </details>
      <details class="qa">
        <summary>Why do you stay logged in across requests if HTTP is stateless?</summary>
        <div>Because the browser re-sends proof with every request — a cookie or a
        token in a header. The server doesn't "remember" you; it re-recognizes you
        each time. That's also why stealing that cookie/token = stealing the login,
        which is the root of much of web security.</div>
      </details>
      <details class="qa">
        <summary>What's the difference between a 404 and a 500?</summary>
        <div>Both are failures, but blame differs. 4xx = the <em>request</em> was the
        problem (asked for a missing page, no permission). 5xx = the request was fine
        and the <em>server</em> failed to handle it (a crash, a bug). As an app
        developer you handle both, but you can only <em>fix</em> your 5xxs.</div>
      </details>
      <details class="qa">
        <summary>In an SPA, what does the server send after the first load?</summary>
        <div>Mostly just <em>data</em> — JSON from an API — plus lazily-loaded chunks of
        JavaScript. The HTML structure updates happen in the browser, performed by the
        framework. That's why SPAs feel instant and why the network tab of a running
        Angular app shows JSON, not pages.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>The <strong>client</strong> (browser) sends a <strong>request</strong>; the <strong>server</strong> sends a <strong>response</strong>. The client always initiates, and each exchange is stateless.</li>
        <li>A URL decomposes into scheme, host, port, path, query and fragment — and each piece routes a different part of the journey.</li>
        <li>An HTTP message = verb/status line + headers + blank line + body. Status families: 2xx ✅, 3xx ↪, 4xx your fault, 5xx server's fault.</li>
        <li>Pages are built from <strong>HTML</strong> (structure), <strong>CSS</strong> (style) and <strong>JavaScript</strong> (behavior); the browser turns HTML into the live <strong>DOM</strong> tree that JavaScript can rewrite.</li>
        <li>A <strong>SPA</strong> loads once, then updates the DOM in place and fetches only JSON — that's what Angular builds, and this app is one.</li>
      </ul>

      <p><a routerLink="/programming-basics">Next: Programming Basics — Values &amp; Variables →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin: 8px 0; }
     .t td { padding: 10px 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 170px; }

     .journey { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin: 8px 0; }
     .jstep { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; background: var(--bg-elevated); color: var(--text); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; font-size: .78rem; text-align: left; }
     .jstep.active { border-color: var(--accent); outline: 2px solid var(--accent); }
     .jstep.done { border-color: var(--green); }
     .jicon { font-size: 1.1rem; }
     .jdetail { border: 1px solid var(--border); border-left: 3px solid var(--accent); border-radius: 0 10px 10px 0; padding: 4px 14px; margin-top: 10px; font-size: .92rem; min-height: 80px; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class HowTheWebWorks {
  protected readonly steps = JOURNEY;
  protected readonly statusCodes = STATUS_CODES;

  protected readonly step = signal(0);
  protected readonly playing = signal(false);
  protected readonly picked = signal<StatusCode | null>(null);

  protected readonly current = computed(() => this.steps[this.step()]);

  /** Auto-advance through all six stages, ~1s apart, like a real page load in slow motion. */
  protected play() {
    this.playing.set(true);
    this.step.set(0);
    let i = 0;
    const tick = () => {
      if (++i >= this.steps.length) {
        this.playing.set(false);
        return;
      }
      this.step.set(i);
      setTimeout(tick, 1000);
    };
    setTimeout(tick, 1000);
  }

  protected reset() {
    this.step.set(0);
    this.playing.set(false);
  }

  readonly urlSample = `https://www.shop.example.com:443/products/42?color=red&size=m#reviews
└─┬─┘   └────────┬────────┘└┬┘ └────┬─────┘└──────┬──────┘└───┬──┘
scheme         host        port    path         query      fragment`;

  readonly httpSample = `── the browser sends ──────────────────────────────
GET /products/42 HTTP/1.1        ← verb + path + protocol version
Host: www.shop.example.com       ← which site (a server can host many)
Accept: text/html                ← "I can digest HTML"
Cookie: session=abc123           ← the "remember me" proof (statelessness!)

── the server answers ─────────────────────────────
HTTP/1.1 200 OK                  ← protocol + status code + reason
Content-Type: text/html          ← how to interpret the body
Cache-Control: max-age=3600      ← "you may reuse this for an hour"
                                 ← blank line = headers end, body begins
<!doctype html>
<html> …the page itself… </html>`;
}
