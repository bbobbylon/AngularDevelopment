/** Straggler fix pass 2: these four still had the correct option as the strictly
 * longest. Lengthen one plausible distractor in place; answer text is unchanged
 * and every "Why others fail" letter reference still points at the same option. */
export default {
  230: { answer: 1, options: [
    `bypassSecurityTrustHtml is fine here; the real bug is using the [innerHTML] binding at all`,
    `Calling bypassSecurityTrustHtml on user input disables sanitizing — markup runs`,
    `The bug is that safeBio should be a signal instead of a plain class field`,
    `There is no bug — bypassSecurityTrustHtml sanitizes the value before returning`,
  ] },
  384: { answer: 1, options: [
    `Clicking runs stealCookies() because attribute bindings are never sanitized by Angular`,
    `Angular sanitizes the URL context, rewriting the href to an inert unsafe: scheme`,
    `The link renders but Angular removes the href attribute, leaving dead text`,
    `A runtime NG0904 error is thrown during the next change-detection pass`,
  ] },
  385: { answer: 1, options: [
    `X-Frame-Options: DENY on every response is what covers this DOM injection`,
    `A CSP with Trusted Types makes the browser reject strings sent to injection sinks`,
    `Enabling the strictTemplates flag rejects unsafe HTML at compile time before deployment`,
    `Switching to zoneless change detection removes the DOM sinks scripts abuse`,
  ] },
  386: { answer: 1, options: [
    `localStorage — cookies are outdated legacy tech that modern SPAs have largely moved past`,
    `HttpOnly cookie blocks XSS token theft but needs CSRF defense; JWT is the reverse`,
    `They are equivalent, since an attacker with XSS can act as the user either way`,
    `sessionStorage fixes it — clearing on tab close removes the exfiltration risk`,
  ] },
};
