/** Rebalance pass: lengthen the correct answer with genuine clarifying detail so
 * it becomes the strictly-longest option, on a representative subset of
 * "security" MC questions. Distractor text and answer index unchanged. Also
 * doubles as the fix for id 306, which was strictly-shortest. */
export default {
  306: { answer: 1, options: [
    `req.headers.set("Authorization", token) — mutate the request headers in place`,
    `req.clone({ setHeaders: { Authorization: "Bearer " + token } }) — clone the immutable request with new headers`,
    `new HttpRequest("GET", req.url) — rebuild the request from scratch each call`,
    `next(req, { headers: token }) — pass the headers as a second argument to next`,
  ] },
  226: { answer: 1, options: [
    `It pipes the string through the DOMPurify library before writing it to the DOM`,
    `It renders the value as plain text, HTML-escaping < > & so any embedded markup never gets parsed as real HTML`,
    `It blocks the render entirely if the string contains any HTML tags`,
    `It offers no XSS protection — interpolation and [innerHTML] are equally risky`,
  ] },
  227: { answer: 1, options: [
    `Always — the method is deprecated and the compiler rejects it in strict mode`,
    `Whenever the value holds any user-controlled data at all, since bypassing the sanitizer skips its protection entirely`,
    `Only on Internet Explorer, where the sanitizer is not available at runtime`,
    `Never — Angular quietly re-sanitizes bypassed values on the next change detection`,
  ] },
  304: { answer: 1, options: [
    `The Angular build encrypts environment.ts, so the secrets it holds stay safe`,
    `The whole compiled bundle ships to the browser, so anyone can read the secrets straight out of DevTools`,
    `Committing secrets to environment.ts noticeably slows the production build down`,
    `It is fine to store them there as long as the git repository stays private`,
  ] },
  229: { answer: 1, options: [
    `It automatically encrypts every request body before it leaves the browser`,
    `It reads the XSRF-TOKEN cookie value and echoes it into an X-XSRF-TOKEN request header on same-origin write requests`,
    `It blocks every cross-origin request outright, so a forged call can never even be sent`,
    `It attaches an Authorization: Bearer header read from localStorage for you`,
  ] },
};
