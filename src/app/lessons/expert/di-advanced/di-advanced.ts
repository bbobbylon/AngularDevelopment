import { Component, InjectionToken, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

/** A multi-provider token — many providers contribute to one array. */
const FEATURE = new InjectionToken<string>('FEATURE');

@Component({
  selector: 'app-lesson-di-advanced',
  imports: [RouterLink],
  providers: [
    { provide: FEATURE, useValue: 'logging', multi: true },
    { provide: FEATURE, useValue: 'analytics', multi: true },
    { provide: FEATURE, useValue: 'offline-cache', multi: true },
  ],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Dependency Injection</span>
      <h1>Advanced DI</h1>
      <p class="lead">
        Angular's injector is hierarchical and highly configurable. Beyond basic
        providers, you can register <strong>many</strong> implementations under one
        token, control <strong>where</strong> in the tree a dependency is resolved, and
        break circular references.
      </p>

      <h2>Multi providers</h2>
      <p>
        With <code>multi: true</code>, several providers contribute to a single token
        and injecting it yields an <strong>array</strong> — the pattern behind
        <code>HTTP_INTERCEPTORS</code> and <code>NG_VALIDATORS</code>.
      </p>
      <div class="code">
        <pre>{{ '{' }} provide: FEATURE, useValue: 'logging',   multi: true {{ '}' }}
{{ '}' }} provide: FEATURE, useValue: 'analytics', multi: true {{ '}' }}

const features = inject(FEATURE);   // string[] — ['logging', 'analytics', …]</pre>
      </div>
      <div class="demo">
        <p class="demo__title">Live — three providers, one token</p>
        <p class="row">
          @for (f of features; track f) {<span class="pill" style="color:var(--green)">{{ f }}</span>}
        </p>
        <p class="lead" style="font-size:.95rem">Injecting <code>FEATURE</code> returns all contributions as an array.</p>
      </div>

      <h2>Resolution modifiers</h2>
      <div class="code">
        <pre>inject(Service, {{ '{' }} optional: true {{ '}' }});   // null instead of throwing if absent
inject(Service, {{ '{' }} self: true {{ '}' }});       // only THIS injector, don't walk up
inject(Service, {{ '{' }} skipSelf: true {{ '}' }});   // start at the PARENT injector
inject(Service, {{ '{' }} host: true {{ '}' }});       // stop at the host component boundary

// decorator form: &#64;Optional() &#64;Self() &#64;SkipSelf() &#64;Host()</pre>
      </div>
      <ul>
        <li><strong>&#64;Optional</strong> — tolerate a missing dependency.</li>
        <li><strong>&#64;Self</strong> — resolve only from the element's own injector.</li>
        <li><strong>&#64;SkipSelf</strong> — skip self, resolve from an ancestor (great for recursive components).</li>
        <li><strong>&#64;Host</strong> — search up to the host component, no further.</li>
      </ul>

      <h2>forwardRef — breaking cycles</h2>
      <div class="code">
        <pre>// when a token is referenced before its class is declared:
{{ '{' }} provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() =&gt; MyControl), multi: true {{ '}' }}</pre>
      </div>

      <div class="note">
        Every component/directive has its own <strong>element injector</strong>, nested
        inside its parent's. A token is resolved by walking up that chain until found —
        which is exactly what the modifiers above let you steer. <code>&#64;SkipSelf</code>
        is the classic fix for recursive/tree components that need the
        <em>parent's</em> instance of a service, not their own; <code>&#64;Host</code> stops
        the search at the component hosting a directive, which is how form directives find
        their surrounding <code>ControlContainer</code>.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>multi: true</code> collects many providers into one injected array.</li>
        <li><code>optional</code>/<code>self</code>/<code>skipSelf</code>/<code>host</code> control resolution along the injector hierarchy.</li>
        <li><code>forwardRef</code> defers a reference to a not-yet-declared class.</li>
        <li>The element-injector tree is what makes scoped, overridable DI possible.</li>
      </ul>

      <p><a routerLink="/rxjs-advanced">Next: Advanced RxJS →</a></p>
    </article>
  `,
})
export class DiAdvanced {
  protected readonly features = inject(FEATURE) as unknown as string[];
}
