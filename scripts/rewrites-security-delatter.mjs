// Standalone rewrites module for the 'security'-category letter-reference fix.
// Consumed by scripts/apply-option-rewrites.mjs (run separately/centrally by a human).
// Do NOT run apply-option-rewrites.mjs from here and do NOT edit practice-data.ts directly.

export default {
  381: {
    options: [
      "The alert fires — interpolation inserts the string as HTML, so you must sanitize",
      "Nothing fires — interpolation renders the value as literal text, never as markup",
      "Angular throws a runtime error, refusing to render strings with angle brackets",
      "The <img> is created, but Angular strips the onerror attribute before display",
    ],
    answer: 1,
    explanation: `This is Angular's baseline XSS posture: {{ }} and [property] bindings NEVER interpret the bound value as HTML. The malicious payload displays as harmless text because it goes through DOM text APIs, not innerHTML parsing. The distinct, second layer is sanitization, which only enters when you explicitly ask Angular to treat a value as markup — [innerHTML]="…" — at which point the value is sanitized per CONTEXT (HTML strips script-capable constructs like onerror handlers; URL contexts like [href] get javascript: schemes neutralized). That claim — that the <img> element is created but Angular strips its onerror handler — describes that innerHTML path, not interpolation. The escape hatches (bypassSecurityTrustHtml etc.) exist for values you can vouch for and are where audits focus. Why others fail: the claim that the alert fires because interpolation inserts the string as HTML inverts the model — interpolation is the SAFE path precisely because no HTML parsing occurs. The claim that Angular throws a runtime error is wrong — no error occurs; angle brackets are ordinary text. The claim that Angular strips the onerror attribute before displaying the <img> applies to [innerHTML] sanitization, not to {{ }} — with interpolation no <img> exists at all.`,
  },
  386: {
    options: [
      "localStorage — cookies are outdated legacy tech that modern SPAs have largely moved past",
      "HttpOnly cookie blocks XSS token theft but needs CSRF defense; JWT is the reverse",
      "They are equivalent, since an attacker with XSS can act as the user either way",
      "sessionStorage fixes it — clearing on tab close removes the exfiltration risk",
    ],
    answer: 1,
    explanation: `And knowing WHY the claim that the two approaches are equivalent is only half-true is the senior discriminator. Yes, XSS on a cookie-based app lets the attacker fire authenticated requests from the victim's browser (session riding). But token EXFILTRATION is strictly worse: the stolen JWT works from the attacker's own infrastructure, outlives the page, survives the victim closing the tab, and keeps working until expiry with no server-side session to kill. HttpOnly caps the blast radius to the duration of the injected script's execution. The full modern posture: HttpOnly + Secure + SameSite=Lax/Strict cookie, CSRF token (Angular's XSRF support), short-lived access + rotating refresh, and CSP to make XSS itself unlikely. Why others fail: the claim that cookies are outdated legacy tech treats fashion as a threat model; cookies with modern flags are the hardened option. The equivalence claim collapses exactly at exfiltration/revocation, as above. The sessionStorage claim narrows persistence, but it is still script-readable — same XSS theft, plus broken "remember me".`,
  },
};
