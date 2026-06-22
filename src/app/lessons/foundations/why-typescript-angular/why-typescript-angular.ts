import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-why-typescript-angular',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Web Basics</span>
      <h1>Why TypeScript & Angular?</h1>
      <p class="lead">
        You now know the building blocks: values, variables, functions, arrays, objects,
        decisions, loops, the DOM and events. This last Foundations lesson connects them
        to the two tools the rest of this curriculum is about — and sets you up to keep
        going with confidence.
      </p>

      <h2>Why TypeScript? (JavaScript with a safety net)</h2>
      <p>
        Plain JavaScript happily lets you make mistakes that only blow up later, when a
        user hits them. <strong>TypeScript</strong> is JavaScript plus
        <strong>types</strong> — labels that say what kind of value each variable holds,
        so the editor catches mistakes <em>as you type</em>:
      </p>
      <div class="code">
        <pre>// JavaScript — no warning, crashes at runtime:
function greet(name) {{ '{' }} return 'Hi ' + name.toUpperCase(); {{ '}' }}
greet(42);          // 💥 numbers have no toUpperCase()

// TypeScript — the ": string" catches it instantly in your editor:
function greet(name: string) {{ '{' }} return 'Hi ' + name.toUpperCase(); {{ '}' }}
greet(42);          // ❌ red squiggle: "42 is not a string" — fixed before it ships</pre>
      </div>
      <p>
        Think of types as guardrails. They feel like extra typing at first, but they
        prevent a huge class of bugs and make the editor able to <em>autocomplete</em>
        and explain your code. Angular is written in TypeScript, and so is every lesson
        here.
      </p>

      <h2>Why Angular? (structure for real apps)</h2>
      <p>
        In the last lesson you saw that updating the DOM by hand doesn't scale. Angular
        is a <strong>framework</strong>: a complete, organised system for building large
        web apps. It gives you, out of the box:
      </p>
      <ul>
        <li><strong>Components</strong> — reusable pieces of UI (a button, a card, a whole page).</li>
        <li><strong>Automatic DOM updates</strong> — describe the UI for your data; Angular keeps it in sync.</li>
        <li><strong>Routing</strong> — moving between "pages" without reloading.</li>
        <li><strong>Forms, HTTP, testing</strong> — official tools for the things every app needs.</li>
      </ul>
      <p>
        A <em>library</em> gives you one tool; a <em>framework</em> gives you the whole
        workshop and a way to organise it. That's the trade: more to learn up front, far
        less glue code and chaos later.
      </p>

      <div class="note">
        <strong>Library vs framework, simply:</strong> with a library, <em>you</em> call
        <em>its</em> code when you want. With a framework, you fill in the blanks and
        <em>it</em> calls <em>your</em> code at the right time. Angular runs the show and
        invites your components in.
      </div>

      <h2>How to use this curriculum</h2>
      <p>Follow the tracks in order — each builds on the last:</p>
      <ol>
        <li><strong>Foundations</strong> (you are here) — coding and the web from zero.</li>
        <li><strong>TypeScript Essentials</strong> — the language Angular is written in.</li>
        <li><strong>Beginner</strong> — core Angular: components, templates, binding, signals.</li>
        <li><strong>Intermediate</strong> — forms, routing, HTTP, RxJS, directives, testing.</li>
        <li><strong>Expert</strong> — change detection, performance, SSR, security, architecture.</li>
      </ol>
      <p>
        Every lesson has a live, interactive demo you can poke at. Don't just read —
        change the inputs, click the buttons, and watch what happens. That's how the
        ideas stick.
      </p>

      <div class="tip">
        You don't need to memorise anything. Understand the <em>idea</em> of each lesson,
        and know it's here when you need to look it up. That's what a one-stop reference
        is for.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><strong>TypeScript</strong> = JavaScript + types that catch mistakes early and power autocomplete.</li>
        <li><strong>Angular</strong> = a full framework that structures big apps and keeps the DOM in sync for you.</li>
        <li>A framework calls <em>your</em> code at the right time; a library is code <em>you</em> call.</li>
        <li>Work through the tracks in order, and play with every live demo.</li>
      </ul>

      <p><a routerLink="/ts-types">Next: start TypeScript → Types, Annotations & Inference →</a></p>
    </article>
  `,
})
export class WhyTypescriptAngular {}
