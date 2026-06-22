import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-ts-decorators',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Language Features</span>
      <h1>Decorators</h1>
      <p class="lead">
        A decorator is a function prefixed with <code>&#64;</code> that attaches
        metadata or behavior to a class, method, accessor, property or parameter.
        Angular is built on them — <code>&#64;Component</code>, <code>&#64;Injectable</code>,
        <code>&#64;Input</code>, <code>&#64;Directive</code> are all decorators.
      </p>

      <h2>How Angular uses them</h2>
      <div class="code">
        <pre>&#64;Component({{ '{' }} selector: 'app-x', template: '...' {{ '}' }})  // class decorator + metadata
export class X {{ '{' }}
  &#64;Input() value = 0;           // property decorator
  &#64;Output() done = new EventEmitter();
  &#64;HostListener('click') onClick() {{ '{' }}{{ '}' }}  // method decorator
  constructor(&#64;Inject(TOKEN) dep: Dep) {{ '{' }}{{ '}' }} // parameter decorator
{{ '}' }}</pre>
      </div>
      <p>
        The decorator records configuration that Angular's compiler reads to wire up
        the component, its inputs/outputs and its dependencies.
      </p>

      <h2>A decorator is just a function</h2>
      <div class="code">
        <pre>function Logged(target: any, key: string, desc: PropertyDescriptor) {{ '{' }}
  const original = desc.value;
  desc.value = function (...args: any[]) {{ '{' }}
    console.log(\`calling \${{ '{' }}key{{ '}' }}\`, args);
    return original.apply(this, args);
  {{ '}' }};
{{ '}' }}

class Api {{ '{' }}
  &#64;Logged
  fetch(id: number) {{ '{' }} /* ... */ {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>Decorator factories</h2>
      <p>
        A factory is a function that <em>returns</em> a decorator — that is why
        Angular's decorators take arguments and use parentheses
        (<code>&#64;Component({{ '{' }}...{{ '}' }})</code>):
      </p>
      <div class="code">
        <pre>function Role(name: string) {{ '{' }}            // factory
  return function (target: any) {{ '{' }} /* use name */ {{ '}' }};
{{ '}' }}
&#64;Role('admin') class AdminPage {{ '{' }}{{ '}' }}</pre>
      </div>

      <div class="note">
        Angular relies on TypeScript's decorators plus
        <code>experimentalDecorators</code> (set in this project's
        <code>tsconfig.json</code>). The Angular compiler also reads the type
        metadata they emit. You rarely write custom decorators in apps — but
        understanding them demystifies the framework.
      </div>

      <h2>The signal era</h2>
      <p>
        Modern Angular increasingly replaces decorators with functions:
        <code>input()</code> instead of <code>&#64;Input()</code>,
        <code>output()</code> instead of <code>&#64;Output()</code>,
        <code>inject()</code> instead of constructor parameter injection. But
        <code>&#64;Component</code>/<code>&#64;Injectable</code> remain.
      </p>

      <h2>Key takeaways</h2>
      <ul>
        <li>A decorator is a function applied with <code>&#64;</code> that adds metadata/behavior.</li>
        <li>Angular's building blocks (<code>&#64;Component</code>, <code>&#64;Injectable</code>, …) are decorators.</li>
        <li>Factories return decorators, enabling arguments like <code>&#64;Component({{ '{' }}…{{ '}' }})</code>.</li>
        <li>Signal-based APIs are shifting some decorators to plain functions.</li>
      </ul>

      <p><a routerLink="/ts-modules">Next: Modules, Imports &amp; Exports →</a></p>
    </article>
  `,
})
export class Decorators {}
