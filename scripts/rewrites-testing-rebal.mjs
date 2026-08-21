/** Rebalance pass: lengthen the correct answer with genuine clarifying detail so
 * it becomes the strictly-longest option, on a representative subset of
 * "testing" MC questions. Distractor text and answer index unchanged. Also
 * doubles as the fix for the 10 ids (121, 185, 357, 359, 421, 126, 218, 40,
 * 178, 420) that were strictly-shortest. */
export default {
  121: { answer: 1, options: [
    `A brand-new instance of MyService built outside of Angular's DI system`,
    `The exact same DI singleton instance that the tested components themselves receive from the injector`,
    `A Jasmine or a Jest generated mock stand-in of the real MyService class`,
    `It throws — services must be reached only through the component fixture`,
  ] },
  185: { answer: 1, options: [
    `It is a CSS methodology used for structuring Angular component styling`,
    `Arrange, Act, Assert — set up state, perform the action, then verify the outcome; keeps tests readable`,
    `It is the name of Angular's own three-phase change-detection cycle here`,
    `It refers to Angular's Accessibility, Animation and API testing strategy`,
  ] },
  357: { answer: 1, options: [
    `Effects simply cannot ever run inside of a TestBed unit test environment`,
    `Effects run on a scheduled microtask, not synchronously; call TestBed.flushEffects() or tick(), then assert`,
    `localStorage is read-only when you are running inside of the test harness`,
    `Signals must be declared with { effects: true } before they are observable`,
  ] },
  359: { answer: 1, options: [
    `Harnesses run tests in a real browser, whereas CSS queries simply cannot`,
    `A stable, semantic API layered over the internal DOM structure, giving one shared code path for unit and e2e tests`,
    `They make the tests faster mainly by skipping the rendering step entirely`,
    `They are required — Material components throw when they are queried directly`,
  ] },
  421: { answer: 1, options: [
    `A quirk that is only kept around for backwards compatibility with AngularJS`,
    `beforeEach re-runs before every single it() block, giving each individual test its own fresh fixture instance`,
    `Components can only ever be instantiated one single time per whole file`,
    `It caches the component so all of the tests can share one instance for speed`,
  ] },
  126: { answer: 1, options: [
    `createComponent() must be called inside beforeEach(), never inside it()`,
    `detectChanges() has never been called on the fixture, so the template has not rendered its bindings yet`,
    `textContent returns an array within jsdom rather than an ordinary string`,
    `The component must implement OnInit for its textContent to be populated`,
  ] },
  218: { answer: 1, options: [
    `detectChanges() simply has to be called twice, one right after the other`,
    `The pending async work has not resolved yet; await fixture.whenStable() before re-checking the rendered DOM`,
    `querySelector really ought to be used here in place of textContent access`,
    `ngOnInit cannot start async work at all — move that work to the constructor`,
  ] },
  40: { answer: 1, options: [
    `It runs the tests in parallel across several separate OS-level threads`,
    `It lets you control simulated time synchronously via explicit tick(ms) and flushMicrotasks() calls`,
    `It lets you skip all of the async setup done inside the beforeEach block`,
    `Mock the HTTP requests entirely without any HttpTestingController at all`,
  ] },
  178: { answer: 1, options: [
    `It provides a real HTTP client that makes actual requests to a test server`,
    `It swaps the real HttpClient for a mock backend that you drive and flush via HttpTestingController`,
    `It validates that all of the HTTP URLs in your app are actually reachable`,
    `It is just a thin test wrapper for the fetch API, not Angular's HttpClient`,
  ] },
  420: { answer: 1, options: [
    `They are all Angular decorators that get registered by the TestBed for you`,
    `describe groups a related test suite; it defines one individual case; expect starts a single assertion`,
    `Three convenient aliases for the console.log function used within tests`,
    `Keywords that TypeScript itself only understands inside of .spec.ts files`,
  ] },
  124: { answer: 1, options: [
    `To reset the underlying HTTP client cleanly in between the tests here`,
    `To assert that no unexpected pending requests remain outstanding; leftovers would contaminate the next test`,
    `To flush every one of the pending requests with an automatic 200 OK here`,
    `verify() is only ever needed when you are testing the error scenarios`,
  ] },
};
