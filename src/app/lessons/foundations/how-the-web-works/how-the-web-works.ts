import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { BrainPower, Scribble, Whiteboard } from '../../../shared/shapes';

/**
 * One stage of the page-load journey, from typing a URL to pixels on screen.
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
      "The browser reads the HTML top-to-bottom and builds the DOM (a live tree of every element). HTML references CSS and JavaScript files — each triggers ANOTHER request/response round-trip. CSS is applied, JavaScript runs, and pixels finally hit the screen. An Angular app's JavaScript bundle arrives exactly this way.",
  },
];

/**
 * One HTTP status code and what it means.
 */
interface StatusCode {
  code: string;
  meaning: string;
  story: string;
}

const STATUS_CODES: StatusCode[] = [
  { code: '200 OK', meaning: 'Success', story: 'Here is exactly what you asked for.' },
  {
    code: '301 Moved',
    meaning: 'Redirect',
    story:
      'That page lives at a new address now — go there instead (the browser follows automatically).',
  },
  {
    code: '404 Not Found',
    meaning: 'Client error',
    story:
      'You asked for something that does not exist. The 4xx family means "your request was the problem".',
  },
  {
    code: '403 Forbidden',
    meaning: 'Client error',
    story: 'The page exists but you are not allowed to see it.',
  },
  {
    code: '500 Server Error',
    meaning: 'Server error',
    story:
      'Your request was fine — the server blew up processing it. The 5xx family means "our fault, not yours".',
  },
];

/**
 * Lesson: How the web works — client/server, URLs, DNS, HTTP anatomy, status codes, what the
 * browser does with a response, and where Angular sits in the whole picture. Zero prior
 * knowledge assumed, but deep: by the end the reader can narrate every step between typing an
 * address and seeing a page — and, critically, explain *why* two of those steps can each stall
 * the page on their own.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`). It copies
 * `expert/change-detection`'s section rhythm and shares its "you are here" rail with the other
 * two Web Basics lessons, `dom-and-events` and `why-typescript-angular` — this is stop 1 of 3.
 *
 * ## Teaching order, and why it is this order
 *
 * 1. **Pose the two ground rules before any mechanism.** Client-always-starts and
 *    stateless-by-default are the two facts everything later depends on — cookies, sessions,
 *    auth, even why an SPA needs a router. State them, then let a dialogue (`app-bubbles`) show
 *    a browser being "forgotten" between two requests, which is a far more vivid way to meet
 *    statelessness than being told about it.
 * 2. **One diagram carries the whole pipeline, before the interactive walkthrough repeats it
 *    one stage at a time.** The retention bar asks for the same idea in different *modes*: the
 *    `app-flow` diagram is the "read it in one glance, see what blocks what" mode; the existing
 *    click-through demo is the "drive it yourself, one stage at a time" mode. Same six-to-seven
 *    stops, two different jobs.
 * 3. **The most useful beginner trap gets its own code sample and its own predict-then-reveal**,
 *    because "the HTML arrived" and "the page appeared" are NOT the same moment, and almost
 *    nobody guesses that correctly the first time they're asked directly.
 * 4. **Two things that *look* similar to a beginner but are completely different failures**
 *    — a 404 versus a dead connection, and HTTP versus HTTPS — each get a device suited to a
 *    "these look alike but aren't" trap: a self-test with explained wrong answers for the
 *    first, a side-by-side `app-compare` for the second.
 */
@Component({
  selector: 'app-lesson-how-the-web-works',
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
    BrainPower,
    Scribble,
    Whiteboard,
  ],
  templateUrl: './how-the-web-works.html',
  styleUrl: './how-the-web-works.css',
})
export class HowTheWebWorks {
  // ── Shape: "The Whiteboard" opener ──────────────────────────────────────────

  /**
   * The condensed 4-step version of {@link pageLoadFlow}, zoomed in on only the
   * render-blocking stretch the shape block's figure draws — a fresh, shorter
   * pass over the same fact rather than the full seven-stop pipeline repeated
   * early.
   */
  protected readonly renderBlockFlow: FlowStep[] = [
    { label: 'HTML starts parsing', detail: 'Top to bottom, building the DOM as it reads' },
    {
      label: 'Hits `<link rel="stylesheet">`',
      detail: 'A render-blocking file — the browser refuses to guess the final styles',
      tone: 'warn',
    },
    {
      label: 'Parsing pauses',
      detail: 'Nothing else happens on this tab until that one file finishes downloading',
      tone: 'warn',
    },
    {
      label: 'File arrives → parsing resumes → paints',
      detail: 'Pixels finally change — however long that one file took, the screen was blank',
      tone: 'good',
    },
  ];

  /**
   * The shape block's own self-test — the `defer` half of
   * {@link headBlockingSample} rather than the stylesheet half the Predict
   * further down already covers, so this is a fresh angle on the identical
   * rule: a file's presence isn't what blocks paint, a file's SCHEDULING is.
   */
  protected readonly deferQuizOptions: QuizOption[] = [
    {
      text: 'Neither delays first paint — a `<script>` tag never blocks rendering, only a stylesheet does.',
      why: 'A plain `<script>` tag is exactly as render-blocking as a stylesheet — parsing stops dead until it downloads AND runs. Only the deferred one is exempt.',
    },
    {
      text: 'The plain `<script src="analytics.js">` does; the `defer`red one does not.',
      correct: true,
      why: 'A plain script pauses parsing immediately — download, then run, then resume reading the HTML. `defer` downloads in the background and only runs after parsing has already finished, so it never gets a chance to block anything.',
    },
    {
      text: 'Both delay first paint identically, because both are scripts referencing the same slow file.',
      why: "Same file, same slowness — completely different scheduling. `defer` is the one attribute standing between the two outcomes; the file's own download time is not what determines whether paint waits.",
    },
    {
      text: 'Neither delays paint, because scripts only affect behavior, never rendering.',
      why: 'A plain script absolutely affects rendering — by stopping the parser that builds what gets rendered. `defer` is the exception, not the rule.',
    },
  ];

  /**
   * The journey stages.
   */
  protected readonly steps = JOURNEY;

  /**
   * The status codes.
   */
  protected readonly statusCodes = STATUS_CODES;

  /**
   * Which stage the animation is on.
   */
  protected readonly step = signal(0);
  /**
   * Whether the animation is auto-advancing.
   */
  protected readonly playing = signal(false);
  /**
   * The status code being examined, or `null` for none.
   */
  protected readonly picked = signal<StatusCode | null>(null);

  /**
   * The current stage.
   */
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

  /**
   * Stops the animation and returns to the first stage.
   */
  protected reset() {
    this.step.set(0);
    this.playing.set(false);
  }

  // ── Presentation data ─────────────────────────────────────────────────────

  /** The Web Basics track, for the "you are here" rail. Shared verbatim with the other two stops. */
  protected readonly stops: ChapterStop[] = [
    { label: 'How the Web Works' },
    { label: 'The DOM & Events', id: 'dom-and-events' },
    { label: 'Why TS & Angular', id: 'why-typescript-angular' },
  ];

  /**
   * Sample: a URL, then its six parts pulled out one per line so each can carry its own
   * `CodeLab` note — the parts are the same as the earlier ASCII-art diagram used to show
   * with arrows, but a line-per-part shape is what lets every part get an individually
   * addressable annotation instead of one caption trying to label all six at once.
   */
  protected readonly urlSample = `https://www.shop.example.com:443/products/42?color=red&size=m#reviews

scheme     https
host       www.shop.example.com
port       443
path       /products/42
query      color=red&size=m
fragment   reviews`;

  /** Line-by-line walkthrough of {@link urlSample}. */
  protected readonly urlNotes: CodeNote[] = [
    {
      line: 1,
      text: 'One string, six jobs, all stapled together with no spaces. Every line below pulls one job out on its own — keep this line in view while you read them.',
    },
    {
      line: 3,
      text: '`https` is the **scheme**: which protocol to speak, and whether the connection gets encrypted. Swap it for plain `http` and you are on an entirely different, unencrypted pipeline — see the comparison further down the page.',
    },
    {
      line: 4,
      text: 'The **host**: which machine to talk to, read **right to left** — `com` (top-level domain) → `example` (the name someone registered) → `shop`, `www` (subdomains the owner made up freely). This is the exact string DNS turns into an IP address.',
    },
    {
      line: 5,
      text: 'The **port**: which "door" on that machine. One computer can run many programs at once; ports keep them from answering each other\'s mail. `443` is https\'s default, which is why your address bar hides it — type it in by hand and the page loads exactly the same.',
    },
    {
      line: 6,
      text: "The **path**: which resource, on that server. In this very app, Angular's router turns a path shaped just like this into the lesson you are reading right now.",
    },
    {
      line: 7,
      text: 'The **query string**: extra `key=value` pairs, joined with `&`. Filters, search terms, page numbers — anything the page needs that is not really about *which* resource this is.',
    },
    {
      line: 8,
      text: 'The **fragment**: a position *inside* the page. The one part of this whole address that **never gets sent to the server at all** — the browser reads it alone and scrolls, without a single extra network request.',
    },
  ];

  /**
   * The six-to-seven stops of a page load, drawn as one diagram — the "read it in one glance"
   * mode that complements the click-through demo below. `tone: 'warn'` marks the two stops that
   * are the actual answer to "why did that feel slow", which is the whole reason this diagram
   * earns its place instead of just re-drawing the analogy.
   */
  protected readonly pageLoadFlow: FlowStep[] = [
    {
      label: 'DNS lookup',
      detail:
        'The browser cannot talk to a name — only a number. It asks a DNS server "what is the IP for this host?" **Nothing below this step can start until the answer comes back.**',
    },
    {
      label: 'TCP + TLS handshake',
      detail:
        'A reliable pipe opens to that IP address; for `https`, both sides also swap certificates and agree on encryption keys first. **The request below cannot be sent one byte earlier than this finishes.**',
    },
    {
      label: 'HTTP request',
      detail:
        'The browser sends a small text message — verb, path, headers — then **waits**. Nothing on screen changes while it waits.',
    },
    {
      label: 'Server responds',
      detail:
        'A status code, headers and the HTML body arrive together. Until this lands there is nothing yet to draw — a blank tab (or the previous page) is still all the browser has.',
    },
    {
      label: 'Browser parses the HTML',
      detail:
        'Reading top to bottom, building the DOM as it goes. Hit a `<link rel="stylesheet">` or a plain `<script>` tag and **parsing pauses right there** until that file finishes downloading — and, for a script, running.',
      tone: 'warn',
    },
    {
      label: 'Browser fetches CSS / JS / images',
      detail:
        'Each referenced file is its **own trip back through the request-and-response steps above** — its own request, its own response. A page with twenty assets makes twenty more round trips, some of which are still blocking the step above.',
      tone: 'warn',
    },
    {
      label: 'Browser paints',
      detail:
        'Only now do pixels actually change. Every blocking file above delayed this exact moment by however long it took to fetch — and, for a script, run — which is the entire subject of the next section.',
      tone: 'good',
    },
  ];

  /**
   * Sample: what actually blocks a first paint — a stylesheet, a plain script, and a deferred
   * script, side by side in the one place they'd really be written: a document `<head>`.
   */
  protected readonly headBlockingSample = `<head>
  <link rel="stylesheet" href="theme.css">
  <script src="analytics.js"></script>
  <script src="app.js" defer></script>
</head>`;

  /** Line-by-line walkthrough of {@link headBlockingSample}. */
  protected readonly headBlockingNotes: CodeNote[] = [
    {
      line: 2,
      text: 'A stylesheet **always blocks rendering**. The browser refuses to paint anything until it knows the final styles — otherwise it might have to draw the page twice, once ugly and once styled.',
    },
    {
      line: 3,
      text: 'A plain `<script>` tag blocks **both** parsing and rendering: the browser stops reading the rest of the HTML, downloads this file, runs it top to bottom, and only then keeps going. One slow script here can freeze an entire page on white.',
    },
    {
      line: 4,
      text: '`defer` changes the deal completely: the file downloads **in the background** while parsing continues, and it only runs after the HTML is fully parsed. Same file, same folder — one attribute is the entire gap between a blank screen and an instant one.',
    },
  ];

  /** The predict-then-reveal for the "HTML arrived ≠ page appeared" trap. */
  protected readonly renderBlockingPrompt =
    "The server's response has fully arrived — the browser is holding the complete HTML in memory, this instant. True or false: the page appears on screen at that exact moment?";

  /** The reveal for {@link renderBlockingPrompt}. */
  protected readonly renderBlockingAnswer =
    'False — and this is the trap almost everyone falls into at least once. Arriving is not the same as painting. The browser still has to **parse** that HTML top to bottom, and the instant it hits a render-blocking `<link rel="stylesheet">` or a plain `<script>` tag (see the sample above), parsing **stops** and waits for that file — a whole extra request-and-response round trip — before it can continue. A page can sit on perfectly good HTML in memory for a full second or more while the screen stays blank, and none of that delay shows up as "the server was slow": the server already answered. The delay happened entirely inside the browser, after the response was already sitting in memory.';

  /**
   * The browser-and-server exchange, staged as dialogue rather than described in a paragraph
   * — the second half of the conversation is where statelessness stops being an abstract word
   * and becomes something that visibly happens.
   */
  protected readonly clientServerTalk: BubbleTurn[] = [
    { who: 'Browser', says: 'GET me /products/42, please.' },
    { who: 'Server', says: '200 OK. Here is the HTML, headers and all.' },
    {
      who: 'Browser',
      says: "Thanks. Three seconds later — GET me /cart. Oh, and it's still me from before.",
    },
    {
      who: 'Server',
      says: '"Still me from before"? I have no idea who you are — I never remembered the last request in the first place. Every request starts from zero on my end.',
    },
    { who: 'Browser', says: 'Right, sorry — here is the cookie you gave me last time, as proof.' },
    { who: 'Server', says: 'Ah, this checks out. Welcome back — here is your cart.' },
  ];

  /**
   * The self-test: the sharpest version of "these look similar but are completely different
   * failures". The distractors are the two ways a beginner talks themselves into "it's some
   * kind of error page, so it's probably a 4xx or a 5xx" — the correct answer is the one case
   * where no HTTP response was ever produced at all.
   */
  protected readonly connectionQuizOptions: QuizOption[] = [
    {
      text: 'A 404 — the page does not exist on that server.',
      why: 'A 404 is a real, deliberate HTTP response: a server received the request, looked, and sent back a status line, headers and usually its own styled "not found" page. Here, nothing with the site\'s own branding ever appeared — which is the tell that no server got the chance to answer at all.',
    },
    {
      text: 'A connection failure earlier in the pipeline — DNS could not resolve the name, or nothing answered at that address.',
      correct: true,
      why: "Exactly — this failure happens *before* HTTP even begins. DNS lookup or the TCP connect attempt failed, so there is no status code, no headers and no body, because there was never a server on the other end of the conversation to produce one. The generic page you see is the **browser's own** error message, not the website's.",
    },
    {
      text: 'A 500 — the server crashed while building the page.',
      why: "A 500 still requires a server to have received the request and attempted to handle it — it is a real (if unhappy) HTTP response, with its own status line and usually the server's own error page. That is a later, different failure point than never reaching a server in the first place.",
    },
    {
      text: 'A 403 — you are not allowed to see this page.',
      why: '403 is also a deliberate, well-formed response: the server saw the request perfectly well and chose to refuse it. That is a world away from nobody answering — a 403 proves the server exists and is reachable; this scenario proves the opposite.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'What actually *is* a server? Is it special hardware?',
      a: 'No — a server is a **role**, not a type of machine. Any computer running a program that sits and waits for requests, then answers them, is a server for as long as that program runs. Run `ng serve` on your own laptop and, for as long as that command keeps going, your laptop genuinely is a server — it is listening on a port and answering anyone who asks.',
    },
    {
      q: 'Why does the exact same URL sometimes load instantly and sometimes crawl?',
      a: 'Several independent shortcuts stack up, and any one of them can be missing. The browser might already have the response cached (see `Cache-Control` further down — that skips the network entirely). DNS might already be resolved and cached. The TCP connection might already be open and reused. Or the server itself might simply be busier right now than it was last time. A "slow" load is almost never one single villain — it is whichever of those shortcuts did not get to fire this time.',
    },
    {
      q: 'If HTTP forgets me between requests, why do I stay logged in?',
      a: 'Because your **browser** does the remembering, not the server — this is exactly what the dialogue above is showing. After you log in, the server hands back a cookie or token; your browser then attaches it to every later request automatically, and the server re-checks it fresh, every single time. Nothing is stored in the relationship between the two of you — it is re-proven on every trip, which is also exactly why stealing that cookie is the same as stealing your login.',
    },
    {
      q: 'What is actually different between a 404 and my Wi-Fi being down?',
      a: 'Everything about *where* the failure happens — this is the exact distinction the self-test above is built around. A 404 means a server answered you, with a real, well-formed HTTP response that just happens to say "I do not have that." Your Wi-Fi being down, or DNS failing, or the server being completely offline, means no server ever got the chance to respond at all: there is no status code, no headers, nothing — just your browser\'s own generic message.',
    },
    {
      q: 'In a single-page app like this one, what does the server send after the very first load?',
      a: "Mostly just data — usually JSON from an API — plus any extra JavaScript chunks the router lazily loads along the way. The actual screen updates happen inside your browser, carried out by Angular's own code, not by a fresh HTML page from the server. That is the whole reason an SPA's Network tab looks so different from a classic website's: small JSON replies instead of a brand-new HTML document every single click.",
    },
  ];

  /**
   * Sample: a real request and response, headers and all, so HTTP is something seen rather
   * than described — this exact shape is what you will later watch in the browser's Network
   * tab and build against with Angular's `HttpClient`.
   */
  protected readonly httpSample = `── the browser sends ──────────────────────────────
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

  /** Line-by-line walkthrough of {@link httpSample}. */
  protected readonly httpNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The **request line**: verb, path, protocol version. `GET` is a promise about intent — it must not change anything on the server. `POST` (create or send data), `PUT` / `PATCH` (update) and `DELETE` are the other verbs you will meet, each promising something different.',
    },
    {
      line: 3,
      text: '`Host` says **which site** — one server can answer for many different domains at once, so every request has to say which one it actually means.',
    },
    {
      line: 4,
      text: '`Accept` says which formats the browser can digest. A server holding, say, only an image can check this before sending back the wrong kind of body.',
    },
    {
      line: 5,
      text: '`Cookie` is the "remember me" proof. HTTP itself is stateless — the server keeps nothing between requests — so **this one line is the entire reason you stay logged in**, exactly as the dialogue above plays out.',
    },
    {
      line: 8,
      text: 'The **status line**: protocol, then the status code and its reason phrase. `200 OK` here — `404 Not Found` and `500 Internal Server Error` are the same shape with a different number and phrase.',
    },
    {
      line: 9,
      text: '`Content-Type` tells the browser **how to interpret the body** that is about to arrive. Get this header wrong on the server and correctly-written HTML displays as garbled text — the body is just bytes until a header explains it.',
    },
    {
      line: 10,
      text: '`Cache-Control` is the server granting permission ahead of time: reuse this response for up to an hour without asking again. This is a big part of the answer to "why does the same URL sometimes load instantly" in the FAQ below.',
    },
    {
      line: 11,
      text: 'The **blank line** is not decoration — it is the actual separator the protocol defines. Everything above it is headers; everything below it is body, no matter what that body contains.',
    },
    {
      line: 12,
      text: "The body starts. For a page load this is HTML text; for most API calls you will make with Angular's `HttpClient`, it will be JSON instead.",
    },
  ];
}
