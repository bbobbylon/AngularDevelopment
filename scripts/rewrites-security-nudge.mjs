/** Micro-nudge: lengthen one plausible distractor so the correct option is no
 * longer the unique longest in these five. Meaning unchanged. */
export default {
  228: { answer: 1, options: [
    `The stealCookies() script executes the moment a user clicks the link`,
    `Angular sanitizes the URL context, rewriting it to an inert unsafe:javascript:`,
    `Angular throws a runtime error and refuses to render the whole component`,
    `The link works normally — Angular does not sanitize URL bindings the way it does HTML`,
  ] },
  229: { answer: 1, options: [
    `It automatically encrypts every request body before it leaves the browser`,
    `It echoes the XSRF-TOKEN cookie into an X-XSRF-TOKEN header on same-origin writes`,
    `It blocks every cross-origin request outright, so a forged call can never even be sent`,
    `It attaches an Authorization: Bearer header read from localStorage for you`,
  ] },
  307: { answer: 1, options: [
    `CSP fully replaces sanitization, so Angular skips its own sanitizer when a CSP is present`,
    `Defense in depth: CSP is a browser-enforced policy that blocks injection at load`,
    `CSP only governs cookies and storage, so it has no effect on script execution`,
    `CSP is configured in angular.json and shipped compiled inside the app bundle`,
  ] },
  309: { answer: 1, options: [
    `Add [preventIframe]="true" to the application's root component to block it`,
    `Send CSP frame-ancestors (or X-Frame-Options) from the server — not from Angular`,
    `Obfuscate and minify the JavaScript bundle so a hostile iframe cannot parse or load it`,
    `Serve the app over HTTPS, which automatically blocks all framing attempts`,
  ] },
  310: { answer: 1, options: [
    `Outdated packages only risk slower builds — there is no real security impact`,
    `Dependencies run with full privilege, so a known CVE becomes your vulnerability`,
    `npm refuses to install any package that has a known published vulnerability`,
    `Only devDependencies can ever carry vulnerabilities; shipped runtime deps are always safe`,
  ] },
};
