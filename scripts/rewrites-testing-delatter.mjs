// Standalone rewrites module for the 15 'testing'-category questions whose
// explanations referenced distractors by bare original letter (A/B/C/D).
// Consumed by scripts/apply-option-rewrites.mjs — do not run that here.

export default {
  121: {
    options: [
      "A brand-new instance of MyService built outside of Angular's DI system",
      "The exact same DI singleton instance that the tested components themselves receive from the injector",
      "A Jasmine or a Jest generated mock stand-in of the real MyService class",
      "It throws — services must be reached only through the component fixture",
    ],
    answer: 1,
    explanation: `\`TestBed.inject(Token)\` retrieves the instance from the test module's injector — the same instance that will be injected into tested components. This lets you call service methods directly to set up state or verify calls. Getting back a brand-new instance built outside DI is wrong — \`TestBed.inject()\` routes through Angular's DI system rather than calling \`new\` directly. It's also not necessarily a fresh mock — it returns the real (or an explicitly provided mock) service registered in the testing module's providers. And it does not throw — retrieving a service directly via \`TestBed.inject()\`, without going through the component fixture, is a standard, fully-supported pattern.`,
  },
  122: {
    options: [
      'fixture.componentInstance.myInput = value; then fixture.detectChanges()',
      'TestBed.configureTestingModule({ inputs: { myInput: value } })',
      'fixture.setInput("myInput", value) — Angular 14+ API that also triggers change detection',
      'Both A and C are correct — each sets the input and then runs change detection',
    ],
    answer: 3,
    explanation: `Both approaches work. Setting \`fixture.componentInstance.myInput = value\` and then calling \`fixture.detectChanges()\` is the classic approach — manually set the property and trigger detection. \`fixture.setInput("myInput", value)\` is the Angular 14+ helper that sets the property AND triggers detection in one call. Additionally it properly handles required signal inputs. Configuring inputs through \`TestBed.configureTestingModule({ inputs: { myInput: value } })\` is wrong — no such TestBed config option exists.`,
  },
  123: {
    options: [
      'nativeElement.click() is always best for accuracy; the other is legacy',
      'click() fires real bubbling browser events; the other fires the binding',
      'triggerEventHandler only works with (click); nativeElement.click() any event',
      'They are entirely identical when running in a jsdom test environment here',
    ],
    answer: 1,
    explanation: `\`nativeElement.click()\` dispatches a native browser event — it bubbles, it can be observed with addEventListener, but in a jsdom test environment it may not trigger Angular bindings reliably for all event types. \`triggerEventHandler("click", mockEvent)\` directly invokes the Angular event handler registered via \`(click)="..."\` — it is more reliable for unit testing and lets you pass a synthetic event object. Treating \`nativeElement.click()\` as always the most accurate option is backwards — it's \`triggerEventHandler\` that's the more reliable, current choice for unit tests, not a legacy fallback. Claiming \`triggerEventHandler\` only works with \`(click)\` is also wrong — it accepts any event name that has a bound handler in the template, such as \`"submit"\` or \`"input"\`, not just click. And the two are not interchangeable even under jsdom — dispatching a real DOM event and directly invoking the bound handler function go through different code paths and can behave differently, which is exactly why the distinction matters for test reliability.`,
  },
  124: {
    options: [
      'To reset the underlying HTTP client cleanly in between the tests here',
      'To assert that no unexpected pending requests remain outstanding; leftovers would contaminate the next test',
      'To flush every one of the pending requests with an automatic 200 OK here',
      'verify() is only ever needed when you are testing the error scenarios',
    ],
    answer: 1,
    explanation: `\`HttpTestingController.verify()\` checks that no outstanding (unflushed) requests remain after the test. Unflushed requests from one test can bleed into the next if not cleaned up. A failing \`verify()\` is a signal that your test triggered an HTTP call you did not account for. Resetting the underlying HTTP client is not what it does — that cleanup happens via TestBed teardown, not \`verify()\`. It doesn't auto-flush pending requests with a 200 OK either — requests are flushed manually with \`expectOne().flush()\`. And it isn't limited to error-scenario tests — \`verify()\` should be called after every test that touches HTTP.`,
  },
  125: {
    options: [
      'Import RouterModule and then inspect the window.location.href value here',
      'Spy on router.navigate and assert toHaveBeenCalledWith(["/home"]) on it',
      'Use fakeAsync with a tick() call to flush the pending navigation here',
      'Call fixture.detectChanges() and check the DOM for a router-outlet change',
    ],
    answer: 1,
    explanation: `For unit tests, spy on \`router.navigate\` with \`jasmine.createSpy()\` or \`spyOn()\`. No real navigation occurs — just verify the correct arguments were passed. For integration tests use \`RouterTestingHarness\` (Angular 15+) which renders the actual routed component. Inspecting \`window.location.href\` is wrong — \`window.location\` does not change in unit tests. Using \`fakeAsync\`/\`tick()\` is wrong too — faking time does not help verify navigation happened. And checking the DOM for a router-outlet change is wrong — the router-outlet does not render a routed component in simple unit tests without full router setup.`,
  },
  126: {
    options: [
      'createComponent() must be called inside beforeEach(), never inside it()',
      'detectChanges() has never been called on the fixture, so the template has not rendered its bindings yet',
      'textContent returns an array within jsdom rather than an ordinary string',
      'The component must implement OnInit for its textContent to be populated',
    ],
    answer: 1,
    explanation: `Angular does NOT run change detection automatically when you call \`createComponent()\`. The template is compiled but not rendered until \`fixture.detectChanges()\` is called. Without it, \`textContent\` is empty or stale. Always call \`detectChanges()\` at least once before asserting DOM state. Calling \`createComponent()\` inside \`it()\` rather than \`beforeEach()\` is not the problem — that's valid. \`textContent\` returning something other than a string is also not the issue — it's an ordinary string in jsdom. And it isn't about missing \`OnInit\` — \`ngOnInit\` runs as part of \`detectChanges()\` regardless.`,
  },
  127: {
    options: [
      'It prevents every kind of error message from showing in the test output',
      'It tells Angular to ignore unknown elements/attributes — a shallow render',
      'It disables all of the form validation for the whole duration of the test',
      'It makes every HTTP error return a 200 OK instead of actually throwing',
    ],
    answer: 1,
    explanation: `\`schemas: [NO_ERRORS_SCHEMA]\` suppresses "unknown element" and "unknown property" errors in tests. Child components become empty placeholders — they do not need to be imported or declared. This enables fast, isolated unit tests for a single component's logic. The trade-off: you miss integration bugs where a child input name was renamed. Use \`CUSTOM_ELEMENTS_SCHEMA\` if you only want to silence custom element warnings. It does not suppress every kind of error message in test output — only template errors about unknown elements/attributes, not thrown exceptions or other failures. It has nothing to do with form validation — \`Validators\` run independently of schemas. And it has no effect on HTTP responses — that's unrelated to what schemas control.`,
  },
  128: {
    options: [
      'Configure a full TestBed with the pipe declared and test via a fixture',
      'Instantiate it with new MyPipe() and call transform() — no TestBed needed',
      "Use Jasmine's createSpy() to mock out the pipe's own transform method",
      'Pipes cannot be unit tested — only integration tested via a host component',
    ],
    answer: 1,
    explanation: `A pure standalone pipe is a simple class — \`const pipe = new TruncatePipe(); expect(pipe.transform("hello world", 5)).toBe("hello...")\`. No TestBed needed. This is the fastest type of unit test in Angular. If the pipe has dependencies (injected services), you can either inject them via TestBed or mock them manually. Configuring a full TestBed with the pipe declared and testing via a fixture works but is heavier than necessary for a pure pipe. Mocking out the pipe's own \`transform\` method with \`createSpy()\` defeats the purpose — that's for mocking a pipe when testing something else, not for testing the pipe itself. And pipes are absolutely unit-testable directly — no host component or integration test is required.`,
  },
  129: {
    options: [
      'Use HttpClientTestingModule and then flush the requests in the normal way here',
      'Provide a test loader, or use provideHttpClientTesting() and flush the HTTP',
      'resource() cannot be tested — just mock the service that wraps it instead',
      'Wrap the whole test in fakeAsync() and tick() to wait for it to resolve',
    ],
    answer: 1,
    explanation: `\`resource()\` uses \`HttpClient\` internally when given an HTTP loader (via \`rxResource()\`). With \`provideHttpClientTesting()\`, the \`HttpTestingController\` intercepts requests made by the resource. Flush them: \`httpMock.expectOne("/api/data").flush(mockData)\`, then call \`fixture.detectChanges()\` to re-render with the resolved value. Alternatively, provide a custom loader function in tests that returns a resolved Promise directly. Using \`HttpClientTestingModule\` and flushing "in the normal way" is close but misses the explicit flushing step needed to resolve the resource. Wrapping the test in \`fakeAsync()\`/\`tick()\` is wrong — \`resource()\` is not purely time-based, so advancing virtual time alone won't resolve it without the HTTP flush.`,
  },
  130: {
    options: [
      'whenStable() is faster only because it does not use any fake timers here',
      'whenStable() resolves when async tasks finish; it works without fakeAsync',
      'whenStable() also flushes the HTTP requests, whereas tick() does not do so',
      'They are interchangeable — just choose based on your own team preference',
    ],
    answer: 1,
    explanation: `\`await fixture.whenStable()\` works in \`async\` tests (using \`async/await\`) and waits for Angular's task queue (Promises, microtasks, change detection) to drain. \`tick()\` is only available inside \`fakeAsync()\` and advances virtual time. Use \`whenStable()\` when you prefer \`async/await\` syntax or when the exact time does not matter; use \`fakeAsync\` + \`tick()\` for time-sensitive tests with debounces or delays. Calling it faster because it skips fake timers is wrong — \`whenStable()\` waits on the real microtask/task queue, it isn't a speed optimization. And it doesn't auto-flush HTTP requests either — pending requests still need to be flushed explicitly through \`HttpTestingController\`, regardless of whether you're using \`whenStable()\` or \`tick()\`.`,
  },
  131: {
    options: [
      'import { AuthService }; const mock = {}; with no DI wiring needed at all',
      'providers: [{ provide: AuthService, useValue: mockAuthService }] does it',
      'TestBed.configureTestingModule({ declarations: [AuthService] }) does it',
      'Override AuthService globally by using jest.mock("./auth.service") instead',
    ],
    answer: 1,
    explanation: `\`{ provide: AuthService, useValue: mockAuthService }\` replaces the real service in the test injector. Any component that injects \`AuthService\` receives your mock. \`mockAuthService\` can be a jasmine spy object: \`jasmine.createSpyObj("AuthService", ["login", "logout"])\`. Just importing \`AuthService\` and creating a plain mock object with no DI wiring does not replace it in DI — Angular's injector never learns about your mock. Adding it to \`declarations\` is wrong — \`declarations\` is for components/pipes/directives, not for providing services. And using \`jest.mock("./auth.service")\` mocks the module at the module-resolution level but does not integrate with Angular's own DI container.`,
  },
  132: {
    options: [
      'flush() is simply the faster one, while tick() is the more accurate one',
      'tick(500) advances exactly 500ms; flush() drains all pending macro-tasks',
      'flush() only flushes the Promises; tick() flushes both Promises and timers',
      'They are identical — flush() is just shorthand for tick(MAX_SAFE_INTEGER)',
    ],
    answer: 1,
    explanation: `\`tick(ms)\` precisely advances the virtual clock by the specified milliseconds — useful for debounce/throttle time assertions. \`flush()\` exhausts all pending macro-tasks (setTimeout, setInterval) in one go without specifying time — useful when you just need "everything done" without caring about precise timing. Framing the difference as one being faster and the other more accurate misses the point — both operate on the same virtual clock inside \`fakeAsync()\`; the real distinction is that \`tick()\` advances by a specified duration while \`flush()\` drains everything pending regardless of duration. Splitting them by Promises vs. timers is also wrong — both tools interact with pending timers, not just one or the other. And they are not the same thing — \`flush()\` isn't shorthand for calling \`tick()\` with a huge number; they resolve pending work in conceptually different ways.`,
  },
  171: {
    options: [
      'A spy is a mock HTTP server created via the HttpClientTestingModule here',
      'A wrapper recording calls without real logic; made with spyOn/createSpy',
      'A spy is used only for Angular routing — it intercepts router.navigate calls',
      'A spy is a TypeScript partial interface that satisfies the type checker',
    ],
    answer: 1,
    explanation: `Jasmine spies are the primary tool for test isolation. \`spyOn(service, "login")\` replaces \`service.login\` with a spy that you can configure: \`.and.returnValue(of(user))\`, \`.and.throwError("fail")\`, or \`.and.callThrough()\` (calls real impl). After the test: \`expect(service.login).toHaveBeenCalledWith({ email, password })\`. Calling it a mock HTTP server is wrong — that's \`HttpTestingController\`, a different tool entirely. It isn't router-specific either — spies work on any method of any object or service; intercepting \`router.navigate\` is just one common example, not a defining trait. And it's not a TypeScript typing construct — that describes structural/partial-interface mocking patterns, not Jasmine's runtime spy mechanism.`,
  },
  178: {
    options: [
      'It provides a real HTTP client that makes actual requests to a test server',
      'It swaps the real HttpClient for a mock backend that you drive and flush via HttpTestingController',
      'It validates that all of the HTTP URLs in your app are actually reachable',
      "It is just a thin test wrapper for the fetch API, not Angular's HttpClient",
    ],
    answer: 1,
    explanation: `\`provideHttpClientTesting()\` (or \`HttpClientTestingModule\` in older APIs) installs an interceptor that captures all \`HttpClient\` requests. In your test, inject \`HttpTestingController\` and use \`httpMock.expectOne("/api/users").flush(mockData)\` to return controlled data. No network calls are made. Claiming it provides a real HTTP client making actual requests is wrong — no real requests happen. It's not a URL-reachability validator either — it doesn't check anything against real endpoints, it simply intercepts and replaces \`HttpClient\` calls so none reach the network. And it isn't a thin wrapper around the \`fetch\` API — it mocks Angular's own \`HttpClient\`/\`HttpBackend\` abstraction directly, unrelated to \`fetch\`.`,
  },
  185: {
    options: [
      'It is a CSS methodology used for structuring Angular component styling',
      'Arrange, Act, Assert — set up state, perform the action, then verify the outcome; keeps tests readable',
      "It is the name of Angular's own three-phase change-detection cycle here",
      "It refers to Angular's Accessibility, Animation and API testing strategy",
    ],
    answer: 1,
    explanation: `The AAA pattern gives every test a predictable shape. Arrange: \`const service = TestBed.inject(AuthService); service.login.and.returnValue(of(user))\`. Act: \`component.submit()\`. Assert: \`expect(router.navigate).toHaveBeenCalledWith(["/dashboard"])\`. This separation makes tests self-documenting and pinpoints failures precisely. It is universally applicable across Jasmine, Jest, and Vitest. It has nothing to do with a CSS methodology — that would be something like BEM, not a testing convention. It also isn't Angular's own change-detection cycle — change detection internals aren't described in arrange/act/assert terms. And it isn't an acronym for an accessibility/animation/API testing strategy — AAA is specifically about structuring individual test cases, not a broader testing discipline.`,
  },
};
