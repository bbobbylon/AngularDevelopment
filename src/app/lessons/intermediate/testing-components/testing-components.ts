import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

type Tab = 'basics' | 'async' | 'signals' | 'mocking' | 'patterns';

@Component({
  selector: 'app-lesson-testing-components',
  imports: [RouterLink],
  styles: [`
    .tab-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .tab-row button { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border);
      background: var(--surface); cursor: pointer; font-size: .85rem; color: var(--text); }
    .tab-row button.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .test-table { width: 100%; border-collapse: collapse; font-size: .87rem; margin: 12px 0; }
    .test-table th { background: var(--surface); padding: 8px 10px; text-align: left; border-bottom: 2px solid var(--border); }
    .test-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
    .bad { color: #ef4444; }
    .good { color: #22c55e; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Testing</span>
      <h1>Testing Components</h1>
      <p class="lead">
        Angular's <code>TestBed</code> spins up a real (but headless) component so you
        can render it, interact with the DOM and assert on results. Knowing the full
        toolkit — async helpers, signal inputs, mocking — is what separates a senior
        developer from someone who only writes basic tests.
      </p>

      <div class="tab-row">
        @for (t of tabs; track t.id) {
          <button [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
            {{ t.label }}
          </button>
        }
      </div>

      @if (activeTab() === 'basics') {
        <h2>The anatomy of a component test</h2>
        <div class="code">
          <pre>import {{ '{' }} TestBed, ComponentFixture {{ '}' }} from '&#64;angular/core/testing';

describe('CounterComponent', () =&gt; {{ '{' }}
  let fixture: ComponentFixture&lt;CounterComponent&gt;;
  let component: CounterComponent;

  beforeEach(async () =&gt; {{ '{' }}
    await TestBed.configureTestingModule({{ '{' }}
      imports: [CounterComponent],     // standalone → just import it
      // For module-based: declarations: [CounterComponent]
    {{ '}' }}).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();           // triggers ngOnInit + initial render
  {{ '}' }});

  afterEach(() =&gt; fixture.destroy());  // clean up to avoid test pollution
{{ '}' }});</pre>
        </div>

        <h2>Querying the DOM</h2>
        <div class="code">
          <pre>// Via nativeElement (raw DOM — simplest):
const btn = fixture.nativeElement.querySelector('button');
const items = fixture.nativeElement.querySelectorAll('.item');
expect(btn.textContent.trim()).toBe('Click me');

// Via DebugElement + By predicate (Angular-aware, survives minification):
import {{ '{' }} By {{ '}' }} from '&#64;angular/platform-browser';
const de = fixture.debugElement.query(By.css('[data-testid="submit"]'));
de.triggerEventHandler('click');       // fires an event without a real mouse click

// Via By.directive — find by directive/component type:
const child = fixture.debugElement.query(By.directive(ChildComponent));
const childInstance = child.componentInstance as ChildComponent;</pre>
        </div>

        <h2>Clicking, typing, and asserting</h2>
        <div class="code">
          <pre>it('increments on click', () =&gt; {{ '{' }}
  const button = fixture.nativeElement.querySelector('button');
  button.click();
  fixture.detectChanges();             // re-render after state change
  expect(fixture.nativeElement.querySelector('.count').textContent).toContain('1');
{{ '}' }});

it('reflects typed input', () =&gt; {{ '{' }}
  const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
  input.value = 'Hello';
  input.dispatchEvent(new Event('input'));   // trigger Angular's value accessor
  fixture.detectChanges();
  expect(component.name()).toBe('Hello');
{{ '}' }});</pre>
        </div>

        <h2>autoDetectChanges — skip manual detectChanges()</h2>
        <div class="code">
          <pre>beforeEach(async () =&gt; {{ '{' }}
  await TestBed.configureTestingModule({{ '{' }} imports: [MyComp] {{ '}' }}).compileComponents();
  fixture = TestBed.createComponent(MyComp);
  fixture.autoDetectChanges(true);     // re-renders automatically after each change
{{ '}' }});

// Now you can skip detectChanges() calls in each test:</pre>
        </div>
      }

      @if (activeTab() === 'async') {
        <h2>Async testing: fakeAsync + tick</h2>
        <p>
          <code>fakeAsync</code> gives you synchronous control over timers and promises.
          Use it instead of <code>async/await</code> for timer-heavy code.
        </p>
        <div class="code">
          <pre>import {{ '{' }} fakeAsync, tick, flush {{ '}' }} from '&#64;angular/core/testing';

it('shows success after 500ms', fakeAsync(() =&gt; {{ '{' }}
  fixture.componentInstance.submit();
  expect(fixture.nativeElement.querySelector('.spinner')).toBeTruthy();

  tick(500);                           // advance virtual clock 500ms
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('.success')).toBeTruthy();
{{ '}' }}));

it('flushes all pending timers', fakeAsync(() =&gt; {{ '{' }}
  component.startPolling();
  flush();                             // run all pending timers to completion
  fixture.detectChanges();
  expect(component.data()).toBeDefined();
{{ '}' }}));</pre>
        </div>

        <h2>whenStable — wait for promises</h2>
        <div class="code">
          <pre>it('loads data from a promise', async () =&gt; {{ '{' }}
  fixture.detectChanges();             // kick off ngOnInit
  await fixture.whenStable();          // waits for all microtasks/promises
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('.item')).toBeTruthy();
{{ '}' }});</pre>
        </div>

        <h2>Testing the async pipe</h2>
        <div class="code">
          <pre>it('renders Observable via async pipe', fakeAsync(() =&gt; {{ '{' }}
  // Component template has: {{ '{{' }} data$ | async {{ '}}' }}
  component.data$ = of({{ '{' }} name: 'Test' {{ '}' }});
  fixture.detectChanges();
  tick();                              // flush the Observable
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('Test');
{{ '}' }}));</pre>
        </div>

        <h2>Testing error states</h2>
        <div class="code">
          <pre>it('shows error on failed load', fakeAsync(() =&gt; {{ '{' }}
  const service = TestBed.inject(DataService);
  vi.spyOn(service, 'load').mockReturnValue(
    throwError(() =&gt; new Error('Network error'))
  );

  fixture.detectChanges();             // triggers ngOnInit which calls service.load()
  tick();
  fixture.detectChanges();

  expect(fixture.nativeElement.querySelector('.error').textContent)
    .toContain('Network error');
{{ '}' }}));</pre>
        </div>
      }

      @if (activeTab() === 'signals') {
        <h2>Testing signal inputs</h2>
        <div class="code">
          <pre>// Component with signal input:
&#64;Component({{ '{' }} ... {{ '}' }})
export class UserCard {{ '{' }}
  user = input.required&lt;User&gt;();
  displayName = computed(() =&gt; this.user().firstName + ' ' + this.user().lastName);
{{ '}' }}

// Test:
it('shows full name from signal input', () =&gt; {{ '{' }}
  fixture.componentRef.setInput('user', {{ '{' }} firstName: 'Ada', lastName: 'Lovelace' {{ '}' }});
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
{{ '}' }});

it('reacts to input change', () =&gt; {{ '{' }}
  fixture.componentRef.setInput('user', {{ '{' }} firstName: 'Alan', lastName: 'Turing' {{ '}' }});
  fixture.detectChanges();
  expect(component.displayName()).toBe('Alan Turing');

  fixture.componentRef.setInput('user', {{ '{' }} firstName: 'Grace', lastName: 'Hopper' {{ '}' }});
  fixture.detectChanges();
  expect(component.displayName()).toBe('Grace Hopper');
{{ '}' }});</pre>
        </div>

        <h2>Testing computed signals and effects</h2>
        <div class="code">
          <pre>it('updates computed when source changes', () =&gt; {{ '{' }}
  // Component exposes a writable signal method (or test via the store)
  component.quantity.set(3);
  component.price.set(10);

  // computed() evaluates immediately — no detectChanges needed for signal reads:
  expect(component.total()).toBe(30);

  // But you DO need detectChanges to see DOM updates:
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('.total').textContent).toContain('30');
{{ '}' }});

it('effect runs synchronously in tests (with TestBed)', () =&gt; {{ '{' }}
  component.theme.set('dark');
  TestBed.flushEffects();              // force effect execution in tests
  expect(document.body.classList.contains('dark')).toBe(true);
{{ '}' }});</pre>
        </div>
      }

      @if (activeTab() === 'mocking') {
        <h2>Mocking services — the three approaches</h2>

        <h3>1. useValue — simplest mock object</h3>
        <div class="code">
          <pre>const authServiceMock = {{ '{' }}
  isLoggedIn: vi.fn().mockReturnValue(true),
  currentUser: signal({{ '{' }} name: 'Test User', role: 'admin' {{ '}' }}),
  logout: vi.fn(),
{{ '}' }};

await TestBed.configureTestingModule({{ '{' }}
  imports: [NavComponent],
  providers: [
    {{ '{' }} provide: AuthService, useValue: authServiceMock {{ '}' }}
  ],
{{ '}' }}).compileComponents();</pre>
        </div>

        <h3>2. vi.spyOn — partial mock on a real service</h3>
        <div class="code">
          <pre>it('loads products on init', () =&gt; {{ '{' }}
  const productService = TestBed.inject(ProductService);
  // Override just the method you care about — the rest stays real:
  const spy = vi.spyOn(productService, 'getAll').mockReturnValue(
    of([{{ '{' }} id: 1, name: 'Widget' {{ '}' }}])
  );

  fixture.detectChanges();
  expect(spy).toHaveBeenCalled();
  expect(fixture.nativeElement.querySelectorAll('.product').length).toBe(1);
{{ '}' }});</pre>
        </div>

        <h3>3. overrideProvider — override in a specific test</h3>
        <div class="code">
          <pre>it('shows error state', () =&gt; {{ '{' }}
  TestBed.overrideProvider(DataService, {{ '{' }}
    useValue: {{ '{' }} fetch: () =&gt; throwError(() =&gt; new Error('Boom')) {{ '}' }}
  {{ '}' }});
  TestBed.inject(DataService);         // re-inject to apply the override

  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('.error')).toBeTruthy();
{{ '}' }});</pre>
        </div>

        <h2>What to mock vs. what to use real</h2>
        <table class="test-table">
          <tr><th>Dependency</th><th>Recommendation</th></tr>
          <tr><td>HTTP (ApiService)</td><td class="good">Mock — use HttpTestingController or vi.fn()</td></tr>
          <tr><td>Router</td><td class="good">Use real Router with RouterTestingModule or provideRouter([]) for nav tests</td></tr>
          <tr><td>Signal stores (pure signals, no HTTP)</td><td>Use real — they're easy and cheap to test</td></tr>
          <tr><td>localStorage / browser APIs</td><td class="good">Mock — side-effectful and environment-dependent</td></tr>
          <tr><td>Child components</td><td>Use real for integration tests; mock (stubs) for unit tests</td></tr>
          <tr><td>Animations</td><td class="good">Use NoopAnimationsModule to avoid timing issues</td></tr>
        </table>
      }

      @if (activeTab() === 'patterns') {
        <h2>Testing forms</h2>
        <div class="code">
          <pre>it('submits valid form', () =&gt; {{ '{' }}
  // Template-driven form test:
  const nameInput: HTMLInputElement = fixture.nativeElement.querySelector('[name="username"]');
  nameInput.value = 'ada';
  nameInput.dispatchEvent(new Event('input'));
  nameInput.dispatchEvent(new Event('blur'));   // trigger touched state

  const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
  form.dispatchEvent(new Event('submit'));
  fixture.detectChanges();

  expect(component.submitted()).toBe(true);
{{ '}' }});

// Reactive form test — bypass the DOM entirely:
it('marks username invalid when empty', () =&gt; {{ '{' }}
  const ctrl = component.form.get('username')!;
  ctrl.setValue('');
  ctrl.markAsTouched();
  fixture.detectChanges();
  expect(ctrl.hasError('required')).toBe(true);
  expect(fixture.nativeElement.querySelector('.error-msg')).toBeTruthy();
{{ '}' }});</pre>
        </div>

        <h2>Testing routing</h2>
        <div class="code">
          <pre>describe('with router', () =&gt; {{ '{' }}
  let router: Router;
  let location: Location;

  beforeEach(async () =&gt; {{ '{' }}
    await TestBed.configureTestingModule({{ '{' }}
      imports: [RouterTestingModule.withRoutes([
        {{ '{' }} path: 'home', component: HomeComponent {{ '}' }},
        {{ '{' }} path: 'detail/:id', component: DetailComponent {{ '}' }},
      ])],
    {{ '}' }}).compileComponents();

    router   = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture.detectChanges();
  {{ '}' }});

  it('navigates to detail', fakeAsync(() =&gt; {{ '{' }}
    fixture.nativeElement.querySelector('[data-testid="detail-link"]').click();
    tick();                            // flush navigation
    expect(location.path()).toBe('/detail/1');
  {{ '}' }}));
{{ '}' }});</pre>
        </div>

        <h2>Component test harnesses (Angular Material)</h2>
        <div class="code">
          <pre>// Harnesses give a stable API that survives internal markup changes:
import {{ '{' }} MatButtonHarness {{ '}' }} from '&#64;angular/material/button/testing';
import {{ '{' }} HarnessLoader {{ '}' }} from '&#64;angular/cdk/testing';
import {{ '{' }} TestbedHarnessEnvironment {{ '}' }} from '&#64;angular/cdk/testing/testbed';

let loader: HarnessLoader;
beforeEach(() =&gt; {{ '{' }}
  loader = TestbedHarnessEnvironment.loader(fixture);
{{ '}' }});

it('clicks the submit button', async () =&gt; {{ '{' }}
  const button = await loader.getHarness(MatButtonHarness.with({{ '{' }} text: 'Submit' {{ '}' }}));
  await button.click();
  expect(component.submitted()).toBe(true);
{{ '}' }});</pre>
        </div>

        <h2>Test file naming &amp; organization</h2>
        <table class="test-table">
          <tr><th>Convention</th><th>Rule</th></tr>
          <tr><td>File name</td><td><code>my-component.spec.ts</code> next to the component</td></tr>
          <tr><td>describe block</td><td>Named after the component/service: <code>describe('ProductCard', ...)</code></td></tr>
          <tr><td>it block</td><td>Describes behavior, not implementation: <code>'shows error when price is negative'</code></td></tr>
          <tr><td>Test runner (this project)</td><td>Vitest — same TestBed API, faster execution than Karma/Jasmine</td></tr>
          <tr><td>Arrange-Act-Assert</td><td>Structure every test in three sections for readability</td></tr>
        </table>
      }

      <h2>Key takeaways</h2>
      <ul>
        <li><code>TestBed.configureTestingModule</code> → <code>createComponent</code> → <code>detectChanges()</code> is the minimal setup.</li>
        <li>Query the DOM with <code>nativeElement.querySelector</code> or <code>debugElement.query(By.css(...))</code>.</li>
        <li>Use <code>fakeAsync + tick</code> for timers; <code>whenStable()</code> for promises.</li>
        <li>Set signal inputs via <code>fixture.componentRef.setInput()</code>; flush effects with <code>TestBed.flushEffects()</code>.</li>
        <li>Mock services with <code>useValue</code> objects or <code>vi.spyOn</code> on real instances.</li>
        <li>Test behavior (what the user sees), not implementation (internal state).</li>
      </ul>

      <p><a routerLink="/testing-services-http">Next: Testing Services &amp; HTTP →</a></p>
    </article>
  `,
})
export class TestingComponents {
  protected readonly activeTab = signal<Tab>('basics');
  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'basics', label: 'Basics' },
    { id: 'async', label: 'Async / fakeAsync' },
    { id: 'signals', label: 'Signals' },
    { id: 'mocking', label: 'Mocking' },
    { id: 'patterns', label: 'Patterns' },
  ];
}
