/**
 * Length-balanced option rewrites for the `security` category.
 * All answers stay at index 1 (unchanged); only option TEXT is rebalanced so the
 * correct choice is no longer a length outlier. Justification lives in the
 * (untouched) explanation field. Option strings use backticks to avoid quote
 * escaping — none contain a backtick or ${ interpolation.
 */
export default {
  225: { answer: 1, options: [
    `Yes — [innerHTML] injects the raw markup, so the onerror handler runs immediately`,
    `No — Angular's sanitizer strips onerror and scripts, leaving an inert <img>`,
    `Yes — unless you manually escape the string first, the handler executes`,
    `No — [innerHTML] silently ignores and drops every <img> tag it receives`,
  ] },
  226: { answer: 1, options: [
    `It pipes the string through the DOMPurify library before writing it to the DOM`,
    `It renders the value as text, HTML-escaping < > & so the markup never parses`,
    `It blocks the render entirely if the string contains any HTML tags`,
    `It offers no XSS protection — interpolation and [innerHTML] are equally risky`,
  ] },
  227: { answer: 1, options: [
    `Always — the method is deprecated and the compiler rejects it in strict mode`,
    `Whenever the value holds user-controlled data, since bypassing skips sanitizing`,
    `Only on Internet Explorer, where the sanitizer is not available at runtime`,
    `Never — Angular quietly re-sanitizes bypassed values on the next change detection`,
  ] },
  228: { answer: 1, options: [
    `The stealCookies() script executes the moment a user clicks the link`,
    `Angular sanitizes the URL context, rewriting it to an inert unsafe:javascript:`,
    `Angular throws a runtime error and refuses to render the whole component`,
    `The link works normally — URL bindings are never sanitized by Angular`,
  ] },
  229: { answer: 1, options: [
    `It automatically encrypts every request body before it leaves the browser`,
    `It echoes the XSRF-TOKEN cookie into an X-XSRF-TOKEN header on same-origin writes`,
    `It blocks all cross-origin requests, so a forged call can never be sent`,
    `It attaches an Authorization: Bearer header read from localStorage for you`,
  ] },
  230: { answer: 1, options: [
    `bypassSecurityTrustHtml is fine here; the real bug is using [innerHTML] at all`,
    `Calling bypassSecurityTrustHtml on user input disables sanitizing — markup runs`,
    `The bug is that safeBio should be a signal instead of a plain class field`,
    `There is no bug — bypassSecurityTrustHtml sanitizes the value before returning`,
  ] },
  231: { answer: 1, options: [
    `Direct DOM writes parse noticeably slower than Angular's template bindings do`,
    `el.nativeElement.innerHTML skips sanitizing (XSS) and breaks on SSR / non-DOM`,
    `ElementRef is deprecated and will be removed in a future Angular release`,
    `It is fine — nativeElement.innerHTML is sanitized exactly like [innerHTML] is`,
  ] },
  304: { answer: 1, options: [
    `The Angular build encrypts environment.ts, so the secrets it holds stay safe`,
    `The whole bundle ships to the browser — anyone can read secrets in DevTools`,
    `Committing secrets to environment.ts noticeably slows the production build down`,
    `It is fine to store them there as long as the git repository stays private`,
  ] },
  305: { answer: 1, options: [
    `Yes — if the router blocks the route, the data behind it is unreachable`,
    `No — guards are client-side UX; the server must authorize each request itself`,
    `Yes, provided the guard also verifies the JWT's expiry before it allows entry`,
    `Only if you pair canActivate with canLoad to also gate the lazy chunk`,
  ] },
  306: { answer: 1, options: [
    `req.headers.set("Authorization", token) — mutate the request headers in place`,
    `req.clone({ setHeaders: { Authorization: "Bearer " + token } }) — clone it`,
    `new HttpRequest("GET", req.url) — rebuild the request from scratch each call`,
    `next(req, { headers: token }) — pass the headers as a second argument to next`,
  ] },
  307: { answer: 1, options: [
    `CSP replaces sanitization entirely, so Angular skips it when a CSP is present`,
    `Defense in depth: CSP is a browser-enforced policy that blocks injection at load`,
    `CSP only governs cookies and storage, so it has no effect on script execution`,
    `CSP is configured in angular.json and shipped compiled inside the app bundle`,
  ] },
  308: { answer: 1, options: [
    `queryParamMap is simply unable to read the returnUrl parameter from the URL`,
    `returnUrl is attacker-controlled — validate it is an internal path before nav`,
    `window.location.href is too slow here; you should defer the redirect via setTimeout`,
    `The ?? should be || or the '/' default is never actually applied at all`,
  ] },
  309: { answer: 1, options: [
    `Add [preventIframe]="true" to the application's root component to block it`,
    `Send CSP frame-ancestors (or X-Frame-Options) from the server — not from Angular`,
    `Obfuscate the JavaScript bundle so a hostile iframe cannot parse or load it`,
    `Serve the app over HTTPS, which automatically blocks all framing attempts`,
  ] },
  310: { answer: 1, options: [
    `Outdated packages only risk slower builds — there is no real security impact`,
    `Dependencies run with full privilege, so a known CVE becomes your vulnerability`,
    `npm refuses to install any package that has a known published vulnerability`,
    `Only devDependencies can carry vulnerabilities; runtime deps are always safe`,
  ] },
  381: { answer: 1, options: [
    `The alert fires — interpolation inserts the string as HTML, so you must sanitize`,
    `Nothing fires — interpolation renders the value as literal text, never as markup`,
    `Angular throws a runtime error, refusing to render strings with angle brackets`,
    `The <img> is created, but Angular strips the onerror attribute before display`,
  ] },
  382: { answer: 1, options: [
    `getters cannot legally return SafeHtml — convert trustedBody to a computed signal`,
    `bypassSecurityTrustHtml on user input is self-inflicted stored XSS — drop it`,
    `innerHTML must be written [innerHtml] with a lowercase t to bind correctly`,
    `input() should be a plain @Input() when the value is used with DomSanitizer`,
  ] },
  383: { answer: 1, options: [
    `HttpClient blocks every cross-origin request by default, which on its own stops CSRF`,
    `HttpClient mirrors the XSRF-TOKEN cookie into a header; the server checks they match`,
    `A JWT sent in an Authorization header needs the very same XSRF machinery`,
    `Enabling withCredentials on every request is itself the CSRF protection`,
  ] },
  384: { answer: 1, options: [
    `Clicking runs stealCookies() — attribute bindings are not sanitized by Angular`,
    `Angular sanitizes the URL context, rewriting the href to an inert unsafe: scheme`,
    `The link renders but Angular removes the href attribute, leaving dead text`,
    `A runtime NG0904 error is thrown during the next change-detection pass`,
  ] },
  385: { answer: 1, options: [
    `X-Frame-Options: DENY on every response is what covers this DOM injection`,
    `A CSP with Trusted Types makes the browser reject strings sent to injection sinks`,
    `Enabling strictTemplates rejects unsafe HTML at compile time before it ships`,
    `Switching to zoneless change detection removes the DOM sinks scripts abuse`,
  ] },
  386: { answer: 1, options: [
    `localStorage — cookies are legacy tech that modern SPAs have largely moved past`,
    `HttpOnly cookie blocks XSS token theft but needs CSRF defense; JWT is the reverse`,
    `They are equivalent, since an attacker with XSS can act as the user either way`,
    `sessionStorage fixes it — clearing on tab close removes the exfiltration risk`,
  ] },
};
