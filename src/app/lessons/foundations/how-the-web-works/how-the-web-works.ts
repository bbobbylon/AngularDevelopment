import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-how-the-web-works',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Web Basics</span>
      <h1>How Websites & Web Apps Work</h1>
      <p class="lead">
        Before any Angular, let's build the mental model everything else rests on.
        If you have never written a line of code, this is the perfect starting point —
        we assume <strong>zero</strong> prior knowledge.
      </p>

      <h2>The big picture: client and server</h2>
      <p>
        When you open a website, two computers talk to each other:
      </p>
      <ul>
        <li>
          <strong>The client</strong> — your browser (Chrome, Safari, Firefox) on your
          phone or laptop. It <em>asks</em> for a page and <em>shows</em> it to you.
        </li>
        <li>
          <strong>The server</strong> — a computer somewhere on the internet that
          <em>stores</em> the website and <em>answers</em> requests for it.
        </li>
      </ul>
      <p>
        Think of a restaurant: you (the client) order from a menu; the kitchen (the
        server) prepares the food and sends it back. The order travelling there and the
        meal travelling back is the <strong>request</strong> and the
        <strong>response</strong>.
      </p>

      <div class="demo">
        <p class="demo__title">Try it — watch a request travel</p>
        <button (click)="send()" [disabled]="busy()">{{ busy() ? 'Sending…' : 'Open a web page' }}</button>
        <div class="flow">
          <div class="node">🧑 You<br /><small>browser</small></div>
          <div class="arrow" [class.lit]="step() >= 1">— request →</div>
          <div class="node">🖥️ Server</div>
          <div class="arrow" [class.lit]="step() >= 2">← response —</div>
          <div class="node">📄 Page</div>
        </div>
        @if (step() >= 2) {
          <p style="color:var(--green)">✅ The server sent back the page, and the browser drew it on screen.</p>
        }
      </div>

      <h2>The three languages of the web</h2>
      <p>Every page in your browser is built from three technologies that work together:</p>
      <table class="t">
        <tr><td><strong>HTML</strong></td><td>The <em>structure</em> — headings, paragraphs, buttons, images. Like the walls and rooms of a house.</td></tr>
        <tr><td><strong>CSS</strong></td><td>The <em>style</em> — colors, fonts, spacing, layout. The paint and furniture.</td></tr>
        <tr><td><strong>JavaScript</strong></td><td>The <em>behavior</em> — what happens when you click, type or scroll. The electricity and plumbing that make things <em>do</em> something.</td></tr>
      </table>
      <p>
        Angular is built on top of JavaScript (specifically a safer version called
        <strong>TypeScript</strong>, which we cover soon). It helps you write the
        behavior of large apps without drowning in detail.
      </p>

      <h2>Web page vs web app</h2>
      <p>
        A simple <strong>web page</strong> mostly shows information (a blog post, a
        news article). A <strong>web app</strong> is interactive software that runs in
        the browser — think Gmail, Google Maps, or an online bank. You click around,
        things update instantly, and it feels like a desktop program. Angular is a tool
        for building web apps.
      </p>

      <div class="note">
        <strong>SPA = Single Page Application.</strong> Traditional sites fetch a whole
        new page from the server every time you click a link (a brief blank flash).
        A SPA loads once, then <em>updates the page in place</em> as you navigate — far
        faster and smoother. Angular builds SPAs. You'll feel it in this very app:
        clicking lessons doesn't reload the browser.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>The <strong>client</strong> (browser) sends a <strong>request</strong>; the <strong>server</strong> sends a <strong>response</strong>.</li>
        <li>Pages are built from <strong>HTML</strong> (structure), <strong>CSS</strong> (style) and <strong>JavaScript</strong> (behavior).</li>
        <li>A <strong>web app</strong> is interactive software in the browser; Angular builds them.</li>
        <li>A <strong>SPA</strong> loads once and updates in place — no full page reloads.</li>
      </ul>

      <p><a routerLink="/programming-basics">Next: Programming Basics — Values & Variables →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin: 8px 0; }
     .t td { padding: 10px 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 130px; }
     .flow { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 16px 0; }
     .node { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; text-align: center; }
     .node small { color: var(--text-muted); }
     .arrow { color: var(--border); font-size: .9rem; transition: color .3s ease; }
     .arrow.lit { color: var(--green); font-weight: 600; }`,
  ],
})
export class HowTheWebWorks {
  protected readonly step = signal(0);
  protected readonly busy = signal(false);

  protected send() {
    this.busy.set(true);
    this.step.set(0);
    setTimeout(() => this.step.set(1), 350);
    setTimeout(() => {
      this.step.set(2);
      this.busy.set(false);
    }, 900);
  }
}
