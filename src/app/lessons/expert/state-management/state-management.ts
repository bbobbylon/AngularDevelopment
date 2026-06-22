import { Component, Injectable, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Todo {
  id: number;
  title: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
}

type Filter = 'all' | 'active' | 'done';

@Injectable()
class TodoStore {
  private readonly _todos = signal<Todo[]>([
    { id: 1, title: 'Learn signals', done: true, priority: 'high' },
    { id: 2, title: 'Build a signal store', done: false, priority: 'high' },
    { id: 3, title: 'Add NgRx when team grows', done: false, priority: 'low' },
  ]);
  private readonly _filter = signal<Filter>('all');
  private nextId = 4;

  readonly todos = this._todos.asReadonly();
  readonly filter = this._filter.asReadonly();

  readonly filtered = computed(() => {
    const f = this._filter();
    return this._todos().filter((t) =>
      f === 'active' ? !t.done : f === 'done' ? t.done : true,
    );
  });
  readonly remaining = computed(() => this._todos().filter((t) => !t.done).length);
  readonly total = computed(() => this._todos().length);
  readonly allDone = computed(() => this.total() > 0 && this.remaining() === 0);

  add(title: string, priority: Todo['priority'] = 'medium') {
    if (!title.trim()) return;
    this._todos.update((l) => [...l, { id: this.nextId++, title, done: false, priority }]);
  }
  toggle(id: number) {
    this._todos.update((l) => l.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
  remove(id: number) {
    this._todos.update((l) => l.filter((t) => t.id !== id));
  }
  clearDone() {
    this._todos.update((l) => l.filter((t) => !t.done));
  }
  setFilter(f: Filter) {
    this._filter.set(f);
  }
}

@Component({
  selector: 'app-lesson-state-management',
  imports: [RouterLink],
  providers: [TodoStore],
  styles: [`
    .priority-high { color: #ef4444; font-weight: 600; }
    .priority-medium { color: #f59e0b; }
    .priority-low { color: #6b7280; }
    .state-tier { display: flex; gap: 12px; flex-wrap: wrap; margin: 12px 0; }
    .tier-card { flex: 1; min-width: 160px; padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); }
    .tier-card h4 { margin: 0 0 6px; font-size: .9rem; }
    .tier-card p { margin: 0; font-size: .82rem; color: var(--text-muted); }
    .mistakes-table { width: 100%; border-collapse: collapse; font-size: .88rem; margin: 12px 0; }
    .mistakes-table th { background: var(--surface); padding: 8px 12px; text-align: left; border-bottom: 2px solid var(--border); }
    .mistakes-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
    .bad { color: #ef4444; }
    .good { color: #22c55e; }
    .filter-row { display: flex; gap: 8px; margin-bottom: 12px; }
    .filter-row button { padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; font-size: .85rem; }
    .filter-row button.active { background: #6366f1; color: #fff; border-color: #6366f1; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Architecture</span>
      <h1>State Management</h1>
      <p class="lead">
        Every Angular app manages state — values that change over time and drive the UI.
        Choosing <em>where</em> that state lives and <em>who</em> can change it is one of
        the most consequential architecture decisions you make.
      </p>

      <h2>The three tiers of state</h2>
      <p>Think of state in three buckets before reaching for any library:</p>
      <div class="state-tier">
        <div class="tier-card">
          <h4>Local / UI state</h4>
          <p>Lives inside one component. Tooltip open, tab index, form dirty flag. Use a plain signal or class field.</p>
        </div>
        <div class="tier-card">
          <h4>Feature / shared state</h4>
          <p>Several components in a feature share it (cart, current user). Use a <strong>signal store service</strong>.</p>
        </div>
        <div class="tier-card">
          <h4>Global / cross-feature state</h4>
          <p>Auth session, theme, notifications. Signal store with <code>providedIn: 'root'</code> or NgRx.</p>
        </div>
      </div>

      <h2>The signal store pattern (no library needed)</h2>
      <p>
        A signal store is just an <code>&#64;Injectable</code> that owns <strong>private</strong>
        writable signals, exposes <strong>read-only</strong> signals and <code>computed</code>
        selectors, and mutates state only through explicit methods. Components inject it and
        <em>read</em>; they never write directly.
      </p>
      <div class="code">
        <pre>&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class CartStore {{ '{' }}
  // --- private writable state ---
  private readonly _items = signal&lt;CartItem[]&gt;([]);
  private readonly _coupon = signal&lt;string | null&gt;(null);

  // --- public read-only projections ---
  readonly items   = this._items.asReadonly();
  readonly coupon  = this._coupon.asReadonly();

  // --- derived / computed selectors ---
  readonly subtotal = computed(() =&gt;
    this._items().reduce((s, i) =&gt; s + i.price * i.qty, 0)
  );
  readonly discount = computed(() =&gt;
    this._coupon() === 'SAVE10' ? this.subtotal() * 0.1 : 0
  );
  readonly total = computed(() =&gt; this.subtotal() - this.discount());

  // --- mutations: one clear entry-point per action ---
  addItem(item: CartItem) {{ '{' }}
    this._items.update(list =&gt; {{ '{' }}
      const exists = list.find(i =&gt; i.id === item.id);
      return exists
        ? list.map(i =&gt; i.id === item.id ? {{ '{' }} ...i, qty: i.qty + 1 {{ '}' }} : i)
        : [...list, {{ '{' }} ...item, qty: 1 {{ '}' }}];
    {{ '}' }});
  {{ '}' }}
  removeItem(id: number) {{ '{' }} this._items.update(l =&gt; l.filter(i =&gt; i.id !== id)); {{ '}' }}
  applyCoupon(code: string) {{ '{' }} this._coupon.set(code.toUpperCase()); {{ '}' }}
  clearCart() {{ '{' }} this._items.set([]); this._coupon.set(null); {{ '}' }}
{{ '}' }}</pre>
      </div>
      <div class="tip">
        The contract that makes this pattern work: writable state is <strong>always private</strong>,
        mutations go through <strong>named methods</strong>, and derived values use
        <strong>computed()</strong>. Any component can inject the store but none can break
        its invariants.
      </div>

      <h2>Live demo — signal store with filter + priority</h2>
      <div class="demo">
        <p class="demo__title">TodoStore — private signals, public computed, named mutations</p>
        <div class="row" style="margin-bottom:10px;gap:8px;flex-wrap:wrap">
          <input #t placeholder="New todo" style="flex:1;min-width:160px"
            (keyup.enter)="store.add(t.value, $any(priorityRef.value)); t.value=''" />
          <select #priorityRef style="border:1px solid var(--border);border-radius:6px;padding:4px 8px;background:var(--surface);color:var(--text)">
            <option value="high">High</option>
            <option value="medium" selected>Medium</option>
            <option value="low">Low</option>
          </select>
          <button (click)="store.add(t.value, $any(priorityRef.value)); t.value=''">Add</button>
          <button class="ghost" (click)="store.clearDone()">Clear done</button>
        </div>
        <div class="filter-row">
          @for (f of ['all','active','done']; track f) {
            <button [class.active]="store.filter() === f" (click)="store.setFilter($any(f))">
              {{ f }}
            </button>
          }
          <span class="pill" style="margin-left:auto">{{ store.remaining() }}/{{ store.total() }} remaining</span>
        </div>
        <ul style="list-style:none;padding:0;margin:0">
          @for (todo of store.filtered(); track todo.id) {
            <li class="row" style="padding:5px 0;border-bottom:1px solid var(--border)">
              <input type="checkbox" [checked]="todo.done" (change)="store.toggle(todo.id)" />
              <span [style.textDecoration]="todo.done ? 'line-through' : 'none'"
                    [style.opacity]="todo.done ? '0.5' : '1'" style="flex:1">
                {{ todo.title }}
              </span>
              <span [class]="'priority-' + todo.priority" style="font-size:.8rem">
                {{ todo.priority }}
              </span>
              <button class="ghost" style="padding:2px 8px;font-size:.8rem" (click)="store.remove(todo.id)">x</button>
            </li>
          }
        </ul>
        @if (store.allDone() && store.total() > 0) {
          <p style="color:var(--green);margin-top:10px;text-align:center">All done!</p>
        }
      </div>

      <h2>Persisting state to localStorage</h2>
      <p>Hydrate from storage in the constructor; sync back in an effect:</p>
      <div class="code">
        <pre>&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class ThemeStore {{ '{' }}
  private readonly _theme = signal&lt;'light' | 'dark'&gt;(
    (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light'
  );
  readonly theme = this._theme.asReadonly();

  constructor() {{ '{' }}
    effect(() =&gt; {{ '{' }}
      localStorage.setItem('theme', this._theme());
    {{ '}' }});
  {{ '}' }}
  toggle() {{ '{' }} this._theme.update(t =&gt; (t === 'light' ? 'dark' : 'light')); {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>NgRx Signal Store — when you want structure</h2>
      <p>
        <code>&#64;ngrx/signals</code> wraps the same pattern with conventions: typed
        state slices, built-in entity management, and RxJS-powered side effects.
        The shape is identical in concept — private writes, public reads — but the
        toolkit gives you entity CRUD helpers, devtools integration and a consistent
        team API.
      </p>
      <div class="code">
        <pre>// with &#64;ngrx/signals (separate package — install first)
import {{ '{' }} signalStore, withState, withComputed, withMethods {{ '}' }}
  from '&#64;ngrx/signals';

export const TodoStore = signalStore(
  {{ '{' }} providedIn: 'root' {{ '}' }},
  withState({{ '{' }} todos: [] as Todo[], filter: 'all' as Filter {{ '}' }}),
  withComputed((s) =&gt; ({{ '{' }}
    remaining: computed(() =&gt; s.todos().filter(t =&gt; !t.done).length),
  {{ '}' }})),
  withMethods((s, patchState = inject(patchState)) =&gt; ({{ '{' }}
    add: (title: string) =&gt;
      patchState(s, {{ '{' }} todos: [...s.todos(), mk(title)] {{ '}' }}),
  {{ '}' }}))
);</pre>
      </div>

      <h2>NgRx Store — Redux for large teams</h2>
      <p>
        Classic NgRx (actions → reducers → selectors → effects) shines when you need
        a strict, auditable flow, time-travel debugging, or a large team that must
        reason about all state changes via an action log.
      </p>
      <div class="code">
        <pre>// actions
export const loadTodos    = createAction('[Todos] Load');
export const todosLoaded  = createAction('[Todos] Loaded', props&lt;{{ '{' }} todos: Todo[] {{ '}' }}&gt;());
export const todosFailed  = createAction('[Todos] Failed', props&lt;{{ '{' }} error: string {{ '}' }}&gt;());

// reducer
export const todosReducer = createReducer(
  {{ '{' }} todos: [] as Todo[], loading: false, error: '' {{ '}' }},
  on(loadTodos,  (s)    =&gt; ({{ '{' }} ...s, loading: true  {{ '}' }})),
  on(todosLoaded,(s, a) =&gt; ({{ '{' }} ...s, loading: false, todos: a.todos {{ '}' }})),
  on(todosFailed,(s, a) =&gt; ({{ '{' }} ...s, loading: false, error: a.error  {{ '}' }})),
);

// selector
export const selectTodos   = (state: AppState) =&gt; state.todos.todos;
export const selectLoading = (state: AppState) =&gt; state.todos.loading;

// effect
export class TodoEffects {{ '{' }}
  loadTodos$ = createEffect(() =&gt;
    this.actions$.pipe(
      ofType(loadTodos),
      switchMap(() =&gt; this.api.getAll().pipe(
        map(todos =&gt; todosLoaded({{ '{' }} todos {{ '}' }})),
        catchError(e  =&gt; of(todosFailed({{ '{' }} error: e.message {{ '}' }})))
      ))
    )
  );
{{ '}' }}</pre>
      </div>

      <h2>Choosing the right tool</h2>
      <table class="mistakes-table">
        <tr><th>Situation</th><th>Recommended approach</th></tr>
        <tr><td>One component needs transient UI state</td><td class="good">Plain signal field</td></tr>
        <tr><td>A feature's components share state (cart, wizard)</td><td class="good">Signal store service, <code>providers:[Store]</code></td></tr>
        <tr><td>App-wide auth / theme / notifications</td><td class="good">Signal store, <code>providedIn:'root'</code></td></tr>
        <tr><td>Large team, strict conventions, time-travel devtools</td><td class="good">NgRx Store</td></tr>
        <tr><td>NgRx Store but you'd like signal ergonomics</td><td class="good">&#64;ngrx/signals signalStore</td></tr>
        <tr><td>Every component has its own copy of shared state</td><td class="bad">Anti-pattern — use a shared store</td></tr>
        <tr><td>Subjects scattered across multiple services</td><td class="bad">Anti-pattern — consolidate into a store</td></tr>
      </table>

      <h2>Common mistakes</h2>
      <table class="mistakes-table">
        <tr><th>Mistake</th><th>Fix</th></tr>
        <tr>
          <td class="bad">Expose writable signal: <code>readonly items = signal([])</code></td>
          <td class="good">Use <code>.asReadonly()</code> on the public property</td>
        </tr>
        <tr>
          <td class="bad">Mutate arrays in place: <code>this._items().push(x)</code></td>
          <td class="good">Always use <code>update(l =&gt; [...l, x])</code> — immutable updates trigger CD</td>
        </tr>
        <tr>
          <td class="bad">Reach for NgRx on a solo/small project</td>
          <td class="good">Signal store is enough for &lt; 5 devs; add NgRx when the team and complexity justify it</td>
        </tr>
        <tr>
          <td class="bad">Calling <code>effect()</code> inside a store method</td>
          <td class="good"><code>effect()</code> is for side-effects triggered reactively; use it in <code>constructor</code></td>
        </tr>
      </table>

      <h2>Key takeaways</h2>
      <ul>
        <li>Classify state first: local → component field; shared → signal store; global → root store.</li>
        <li>The contract: <strong>private writes, public reads, named mutations, derived via computed()</strong>.</li>
        <li>Persist with <code>effect()</code> syncing to localStorage; hydrate in the constructor.</li>
        <li>Reach for NgRx/ngrx-signals when you need time-travel, strict conventions, or entity helpers.</li>
        <li>Always update state immutably — spread or filter, never push/splice in place.</li>
      </ul>

      <p><a routerLink="/dynamic-components">Next: Dynamic Components →</a></p>
    </article>
  `,
})
export class StateManagement {
  protected readonly store = inject(TodoStore);
}
