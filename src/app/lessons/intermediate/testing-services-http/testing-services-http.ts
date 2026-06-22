import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type Tab = 'pure' | 'http' | 'interceptors' | 'rxjs' | 'patterns';

@Component({
  selector: 'app-lesson-testing-services-http',
  imports: [RouterLink],
  styles: [`
    .tab-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .tab-row button { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border);
      background: var(--surface); cursor: pointer; font-size: .85rem; color: var(--text); }
    .tab-row button.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .test-table { width: 100%; border-collapse: collapse; font-size: .87rem; margin: 12px 0; }
    .test-table th { background: var(--surface); padding: 8px 10px; text-align: left; border-bottom: 2px solid var(--border); }
    .test-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
    .good { color: #22c55e; }
    .bad { color: #ef4444; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Testing</span>
      <h1>Testing Services &amp; HTTP</h1>
      <p class="lead">
        Services are the easiest things to test because they're just classes. HTTP services
        need a bit more setup, but Angular's <code>HttpTestingController</code> gives you
        full, synchronous control over every request — no network, no async timing issues.
      </p>

      <div class="tab-row">
        @for (t of tabs; track t.id) {
          <button [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
            {{ t.label }}
          </button>
        }
      </div>

      @if (activeTab() === 'pure') {
        <h2>Pure services — no TestBed needed</h2>
        <p>
          A service with no DI dependencies can be tested with a plain constructor call.
          This is the fastest, most isolated test possible.
        </p>
        <div class="code">
          <pre>// &#64;Injectable service with only signals — no http, no router, no deps:
&#64;Injectable()
export class CartService {{ '{' }}
  private readonly _items = signal&lt;CartItem[]&gt;([]);
  readonly items = this._items.asReadonly();
  readonly total = computed(() =&gt; this._items().reduce((s, i) =&gt; s + i.price, 0));

  add(item: CartItem) {{ '{' }} this._items.update(l =&gt; [...l, item]); {{ '}' }}
  remove(id: number) {{ '{' }} this._items.update(l =&gt; l.filter(i =&gt; i.id !== id)); {{ '}' }}
{{ '}' }}

// Test — no TestBed at all:
describe('CartService', () =&gt; {{ '{' }}
  let service: CartService;

  beforeEach(() =&gt; {{ '{' }}
    service = new CartService();       // plain constructor
  {{ '}' }});

  it('adds items and computes total', () =&gt; {{ '{' }}
    service.add({{ '{' }} id: 1, name: 'Widget', price: 10 {{ '}' }});
    service.add({{ '{' }} id: 2, name: 'Gadget', price: 25 {{ '}' }});
    expect(service.items().length).toBe(2);
    expect(service.total()).toBe(35);
  {{ '}' }});

  it('removes an item', () =&gt; {{ '{' }}
    service.add({{ '{' }} id: 1, name: 'Widget', price: 10 {{ '}' }});
    service.remove(1);
    expect(service.items().length).toBe(0);
    expect(service.total()).toBe(0);
  {{ '}' }});
{{ '}' }});</pre>
        </div>

        <h2>Services with inject() deps — use TestBed</h2>
        <div class="code">
          <pre>// When your service uses inject() you need TestBed to resolve the injector:
describe('UserService', () =&gt; {{ '{' }}
  let service: UserService;

  beforeEach(() =&gt; {{ '{' }}
    TestBed.configureTestingModule({{ '{' }}
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    {{ '}' }});
    service = TestBed.inject(UserService);
  {{ '}' }});
{{ '}' }});</pre>
        </div>
      }

      @if (activeTab() === 'http') {
        <h2>HttpTestingController — full control over the network</h2>
        <div class="code">
          <pre>import {{ '{' }} provideHttpClient {{ '}' }} from '&#64;angular/common/http';
import {{ '{' }} provideHttpClientTesting, HttpTestingController {{ '}' }}
  from '&#64;angular/common/http/testing';

let http: HttpTestingController;
let api: UserApi;

beforeEach(() =&gt; {{ '{' }}
  TestBed.configureTestingModule({{ '{' }}
    providers: [UserApi, provideHttpClient(), provideHttpClientTesting()],
  {{ '}' }});
  http = TestBed.inject(HttpTestingController);
  api  = TestBed.inject(UserApi);
{{ '}' }});

afterEach(() =&gt; http.verify());   // fails if any request was made but not handled</pre>
        </div>

        <h2>Flushing responses — happy path</h2>
        <div class="code">
          <pre>it('fetches a user', () =&gt; {{ '{' }}
  let result: User | undefined;
  api.getUser(1).subscribe((u) =&gt; (result = u));

  // Assert a request was made (expectOne throws if 0 or 2+ requests match):
  const req = http.expectOne('/api/users/1');
  expect(req.request.method).toBe('GET');
  expect(req.request.headers.get('Accept')).toBe('application/json');

  // Deliver the fake response — this synchronously resolves the observable:
  req.flush({{ '{' }} id: 1, name: 'Ada Lovelace', email: 'ada&#64;example.com' {{ '}' }});
  expect(result?.name).toBe('Ada Lovelace');
{{ '}' }});</pre>
        </div>

        <h2>Simulating errors</h2>
        <div class="code">
          <pre>it('handles 404 gracefully', () =&gt; {{ '{' }}
  let error: string | undefined;
  api.getUser(999).subscribe({{ '{' }}
    next: () =&gt; fail('should not succeed'),
    error: (e) =&gt; (error = e.message),
  {{ '}' }});

  const req = http.expectOne('/api/users/999');
  // flush() with status &gt;= 400 produces an HttpErrorResponse:
  req.flush('User not found', {{ '{' }} status: 404, statusText: 'Not Found' {{ '}' }});
  expect(error).toContain('404');
{{ '}' }});

it('handles network error', () =&gt; {{ '{' }}
  let error: any;
  api.getUser(1).subscribe({{ '{' }} error: e =&gt; (error = e) {{ '}' }});

  const req = http.expectOne('/api/users/1');
  req.error(new ProgressEvent('error'));   // simulates a network failure
  expect(error).toBeTruthy();
{{ '}' }});</pre>
        </div>

        <h2>Flexible matching &amp; POST body inspection</h2>
        <div class="code">
          <pre>it('creates a user with correct body', () =&gt; {{ '{' }}
  let createdId: number | undefined;
  api.createUser({{ '{' }} name: 'Bob', email: 'bob&#64;test.com' {{ '}' }}).subscribe(r =&gt; (createdId = r.id));

  // Match by predicate instead of exact URL:
  const req = http.expectOne(r =&gt; r.url.includes('/api/users') &amp;&amp; r.method === 'POST');

  // Inspect what was sent:
  expect(req.request.body.name).toBe('Bob');
  expect(req.request.body.email).toBe('bob&#64;test.com');

  req.flush({{ '{' }} id: 42, ...req.request.body {{ '}' }});
  expect(createdId).toBe(42);
{{ '}' }});

// match() returns ALL matching requests (useful for debounced search):
const reqs = http.match(r =&gt; r.url.startsWith('/api/search'));
reqs.forEach(r =&gt; r.flush([]));

// expectNone — assert no request was made:
http.expectNone('/api/admin');         // ensure unauthenticated users never hit admin routes</pre>
        </div>
      }

      @if (activeTab() === 'interceptors') {
        <h2>Testing HTTP interceptors</h2>
        <p>
          Test interceptors by registering them and then making a real HTTP call through
          the controller — the interceptor runs in the middle.
        </p>
        <div class="code">
          <pre>describe('authInterceptor', () =&gt; {{ '{' }}
  let http: HttpTestingController;
  let client: HttpClient;
  const fakeAuth = {{ '{' }} accessToken: vi.fn().mockReturnValue('my-token') {{ '}' }};

  beforeEach(() =&gt; {{ '{' }}
    TestBed.configureTestingModule({{ '{' }}
      providers: [
        {{ '{' }} provide: AuthService, useValue: fakeAuth {{ '}' }},
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    {{ '}' }});
    http   = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  {{ '}' }});

  it('attaches Authorization header', () =&gt; {{ '{' }}
    client.get('/api/profile').subscribe();
    const req = http.expectOne('/api/profile');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');
    req.flush({{ '{' }} name: 'Ada' {{ '}' }});
  {{ '}' }});

  it('does not attach header when not logged in', () =&gt; {{ '{' }}
    fakeAuth.accessToken.mockReturnValueOnce(null);
    client.get('/api/profile').subscribe();
    const req = http.expectOne('/api/profile');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({{ '{' }} name: 'Ada' {{ '}' }});
  {{ '}' }});
{{ '}' }});</pre>
        </div>

        <h2>Testing error interceptors (retry, refresh)</h2>
        <div class="code">
          <pre>it('retries once on 500', fakeAsync(() =&gt; {{ '{' }}
  let result: any;
  client.get('/api/data').subscribe(r =&gt; (result = r));

  // First call → 500:
  http.expectOne('/api/data').flush('Error', {{ '{' }} status: 500, statusText: 'Server Error' {{ '}' }});
  tick();                             // advance to the retry

  // Retry → success:
  http.expectOne('/api/data').flush({{ '{' }} ok: true {{ '}' }});
  tick();
  expect(result).toEqual({{ '{' }} ok: true {{ '}' }});
{{ '}' }}));</pre>
        </div>
      }

      @if (activeTab() === 'rxjs') {
        <h2>Testing Observables — marble testing concept</h2>
        <p>
          Marble testing lets you describe Observable sequences as ASCII strings and
          compare them precisely. Most of the time you don't need it — <code>fakeAsync +
          tick</code> is simpler. Use marbles for complex operator chains.
        </p>
        <div class="code">
          <pre>import {{ '{' }} TestScheduler {{ '}' }} from 'rxjs/testing';

describe('debounceSearch$', () =&gt; {{ '{' }}
  let scheduler: TestScheduler;
  beforeEach(() =&gt; {{ '{' }}
    scheduler = new TestScheduler((actual, expected) =&gt;
      expect(actual).toEqual(expected)
    );
  {{ '}' }});

  it('debounces search input by 300ms', () =&gt; {{ '{' }}
    scheduler.run({{ '{' }} hot, cold, expectObservable {{ '}' }} =&gt; {{ '{' }}
      // Marble syntax: '-' = 10ms, '|' = complete, '#' = error
      const input$  = hot('-a-b---------c', {{ '{' }} a:'h', b:'he', c:'hello' {{ '}' }});
      const result$ = input$.pipe(debounceTime(300));
      // 'he' is swallowed; only 'hello' survives the 300ms silence
      expectObservable(result$).toBe('-------------c', {{ '{' }} c:'hello' {{ '}' }});
    {{ '}' }});
  {{ '}' }});
{{ '}' }});</pre>
        </div>

        <h2>Simple Observable testing without marbles</h2>
        <div class="code">
          <pre>it('maps and filters items', (done) =&gt; {{ '{' }}
  const source$ = of([1, 2, 3, 4, 5]);
  const result$ = source$.pipe(
    switchMap(arr =&gt; of(arr.filter(n =&gt; n % 2 === 0)))
  );
  result$.subscribe(arr =&gt; {{ '{' }}
    expect(arr).toEqual([2, 4]);
    done();
  {{ '}' }});
{{ '}' }});

// Or with fakeAsync + firstValueFrom:
it('resolves the first value', fakeAsync(() =&gt; {{ '{' }}
  let val: number | undefined;
  firstValueFrom(of(42)).then(v =&gt; (val = v));
  tick();
  expect(val).toBe(42);
{{ '}' }}));</pre>
        </div>

        <h2>Testing BehaviorSubject / signals interop</h2>
        <div class="code">
          <pre>it('toSignal reflects latest BehaviorSubject value', () =&gt; {{ '{' }}
  const subject$ = new BehaviorSubject(10);
  const sig = TestBed.runInInjectionContext(() =&gt;
    toSignal(subject$, {{ '{' }} requireSync: true {{ '}' }})
  );
  expect(sig()).toBe(10);

  subject$.next(20);
  expect(sig()).toBe(20);
{{ '}' }});</pre>
        </div>
      }

      @if (activeTab() === 'patterns') {
        <h2>Service test patterns reference</h2>
        <table class="test-table">
          <tr><th>Scenario</th><th>Pattern</th></tr>
          <tr>
            <td>Pure service (signals only)</td>
            <td class="good">Plain <code>new Service()</code> — fastest</td>
          </tr>
          <tr>
            <td>Service with inject() dependencies</td>
            <td class="good">TestBed.configureTestingModule with providers</td>
          </tr>
          <tr>
            <td>Service makes HTTP calls</td>
            <td class="good">provideHttpClientTesting + HttpTestingController</td>
          </tr>
          <tr>
            <td>Service has a timer/polling loop</td>
            <td class="good">fakeAsync + tick/flush to control time</td>
          </tr>
          <tr>
            <td>Service depends on another service</td>
            <td class="good">Inject a mock/spy: useValue + vi.fn()</td>
          </tr>
          <tr>
            <td>Test an interceptor</td>
            <td class="good">Register with withInterceptors([...]) + HttpTestingController</td>
          </tr>
          <tr>
            <td>Service uses localStorage</td>
            <td class="good">Set/assert directly in beforeEach/afterEach</td>
          </tr>
        </table>

        <h2>What NOT to test</h2>
        <table class="test-table">
          <tr><th>Thing</th><th>Why</th></tr>
          <tr>
            <td>Private methods directly</td>
            <td class="bad">Test through public API — internal impl can change</td>
          </tr>
          <tr>
            <td>Angular internals (that HttpClient calls the right URL)</td>
            <td class="bad">Angular tests that — you test your logic around it</td>
          </tr>
          <tr>
            <td>Every getter/setter independently</td>
            <td class="bad">Test behaviors, not structure: "cart total updates when item is added"</td>
          </tr>
        </table>

        <h2>Test organization</h2>
        <div class="code">
          <pre>describe('UserService', () =&gt; {{ '{' }}
  // Setup once per describe block in beforeEach

  describe('getUser()', () =&gt; {{ '{' }}
    it('fetches user by id', ...);
    it('caches the result', ...);
    it('throws 404 for unknown id', ...);
  {{ '}' }});

  describe('createUser()', () =&gt; {{ '{' }}
    it('posts the correct body', ...);
    it('returns the created user with id', ...);
    it('rejects with validation errors', ...);
  {{ '}' }});
{{ '}' }});</pre>
        </div>
      }

      <h2>Key takeaways</h2>
      <ul>
        <li>Pure services: <code>new Service()</code> — no TestBed, fastest possible test.</li>
        <li>HTTP: <code>provideHttpClientTesting()</code> + <code>HttpTestingController</code> gives synchronous control.</li>
        <li><code>expectOne</code> + <code>flush</code>/<code>error</code> assert the request and deliver a response.</li>
        <li><code>http.verify()</code> in <code>afterEach</code> ensures no unhandled requests.</li>
        <li>Test interceptors by registering them with <code>withInterceptors([])</code> and using the controller.</li>
        <li>Mock collaborators with <code>useValue</code> + <code>vi.fn()</code>; use <code>vi.spyOn</code> for partial mocks.</li>
      </ul>

      <p><a routerLink="/change-detection">Next: Change Detection Deep Dive →</a></p>
    </article>
  `,
})
export class TestingServicesHttp {
  protected readonly activeTab = signal<Tab>('pure');
  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'pure', label: 'Pure Services' },
    { id: 'http', label: 'HTTP Controller' },
    { id: 'interceptors', label: 'Interceptors' },
    { id: 'rxjs', label: 'RxJS / Marbles' },
    { id: 'patterns', label: 'Patterns' },
  ];
}
