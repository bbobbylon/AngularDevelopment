import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Person {
  name: string;
  age: number;
  member: boolean;
}

@Component({
  selector: 'app-lesson-arrays-objects-basics',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Programming from Zero</span>
      <h1>Arrays & Objects</h1>
      <p class="lead">
        Single values are useful, but real apps deal with <em>collections</em> and
        <em>structured</em> data. The two workhorses for that are <strong>arrays</strong>
        (ordered lists) and <strong>objects</strong> (labelled groups of values). Almost
        everything in Angular is arrays of objects.
      </p>

      <h2>Arrays — ordered lists</h2>
      <p>An array is a list of values in square brackets. Each item has a position called an <strong>index</strong>, counting from <strong>0</strong>:</p>
      <div class="code">
        <pre>const fruits = ['apple', 'banana', 'cherry'];

fruits[0]        // 'apple'   ← the FIRST item is index 0, not 1
fruits[2]        // 'cherry'
fruits.length    // 3         ← how many items
fruits.push('date');   // add to the end → ['apple','banana','cherry','date']</pre>
      </div>
      <div class="note">
        Counting from zero trips up every beginner. The first item is at index
        <code>0</code>, the second at <code>1</code>, and the last is always at
        <code>length - 1</code>. You'll get used to it fast.
      </div>

      <h2>Try it — a live array</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:10px">
          <input #f placeholder="add a fruit" (keyup.enter)="add(f.value); f.value=''" />
          <button (click)="add(f.value); f.value=''">Add</button>
        </div>
        <ul>
          @for (fruit of fruits(); track $index) {
            <li>
              <code>fruits[{{ $index }}]</code> = '{{ fruit }}'
              <button class="ghost" (click)="removeAt($index)">remove</button>
            </li>
          } @empty {
            <li style="color:var(--text-muted)">The array is empty: []</li>
          }
        </ul>
        <p class="pill">fruits.length = {{ fruits().length }}</p>
      </div>

      <h2>Objects — labelled groups</h2>
      <p>
        An array holds items by <em>position</em>; an object holds values by
        <strong>name</strong> (called a <em>key</em> or <em>property</em>). It groups
        related facts about one thing:
      </p>
      <div class="code">
        <pre>const person = {{ '{' }}
  name: 'Ada',      // key "name"  → value 'Ada'
  age: 36,          // key "age"   → value 36
  member: true,     // key "member"→ value true
{{ '}' }};

person.name      // 'Ada'   ← read a property with a dot
person.age       // 36
person.age = 37; // change a property</pre>
      </div>

      <div class="demo">
        <p class="demo__title">Live — one object's properties</p>
        <div class="field"><label>name</label><input [value]="person().name" (input)="setName($any($event.target).value)" /></div>
        <div class="field"><label>age</label><input type="number" [value]="person().age" (input)="setAge(+$any($event.target).value)" /></div>
        <div class="code"><pre>person = {{ json() }}

person.name → '{{ person().name }}'
person.age  → {{ person().age }}</pre></div>
      </div>

      <h2>The combo: arrays of objects</h2>
      <p>This is the shape of almost all app data — a list of records:</p>
      <div class="code">
        <pre>const people = [
  {{ '{' }} name: 'Ada',   age: 36 {{ '}' }},
  {{ '{' }} name: 'Grace', age: 41 {{ '}' }},
  {{ '{' }} name: 'Alan',  age: 29 {{ '}' }},
];

people[1].name   // 'Grace'   ← second person, their name
people.length    // 3</pre>
      </div>
      <p>
        A list of users, a cart of products, a feed of posts — all just arrays of
        objects. The whole curriculum you're reading is one big array of lesson objects.
      </p>

      <h2>Key takeaways</h2>
      <ul>
        <li>An <strong>array</strong> <code>[...]</code> is an ordered list; access items by index, starting at <code>0</code>.</li>
        <li>An <strong>object</strong> <code>{{ '{' }}...{{ '}' }}</code> groups values under named keys; read them with a dot (<code>person.name</code>).</li>
        <li><code>.length</code>, <code>.push()</code> and indexing are your everyday array tools.</li>
        <li><strong>Arrays of objects</strong> model almost all real-world app data.</li>
      </ul>

      <p><a routerLink="/decisions-loops">Next: Decisions & Loops →</a></p>
    </article>
  `,
  styles: [
    `.field { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
     .field label { min-width: 70px; color: var(--text-muted); }
     ul { padding-left: 18px; }
     li { margin: 4px 0; }`,
  ],
})
export class ArraysObjectsBasics {
  protected readonly fruits = signal<string[]>(['apple', 'banana', 'cherry']);
  protected readonly person = signal<Person>({ name: 'Ada', age: 36, member: true });

  protected add(value: string) {
    const v = value.trim();
    if (v) this.fruits.update((list) => [...list, v]);
  }
  protected removeAt(i: number) {
    this.fruits.update((list) => list.filter((_, idx) => idx !== i));
  }
  protected setName(name: string) {
    this.person.update((p) => ({ ...p, name }));
  }
  protected setAge(age: number) {
    this.person.update((p) => ({ ...p, age }));
  }
  protected json() {
    return JSON.stringify(this.person());
  }
}
