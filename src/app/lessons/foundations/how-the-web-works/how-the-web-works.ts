import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
 * Lesson: How the web works — client/server, URLs, DNS, HTTP anatomy,
 * status codes, what the browser does with a response, and where Angular
 * sits in the whole picture. Zero prior knowledge assumed, but deep:
 * by the end the reader can narrate every step between typing an address
 * and seeing a page.
 */
@Component({
  selector: 'app-lesson-how-the-web-works',
  imports: [RouterLink],
  templateUrl: './how-the-web-works.html',
  styleUrl: './how-the-web-works.css',
})
export class HowTheWebWorks {
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

  /**
   * Sample: a URL with every part labelled — scheme, host, port, path, query and
   * fragment.
   */
  readonly urlSample = `https://www.shop.example.com:443/products/42?color=red&size=m#reviews
└─┬─┘   └────────┬────────┘└┬┘ └────┬─────┘└──────┬──────┘└───┬──┘
scheme         host        port    path         query      fragment`;

  /**
   * Sample: a real request and response, headers and all, so HTTP is something
   * seen rather than described.
   */
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
