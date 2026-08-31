import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * The demo object's shape. Three properties of three different types, so the
 * bracket-access probe can show that a key lookup does not care what kind of
 * value is on the other end.
 */
interface Person {
  name: string;
  age: number;
  member: boolean;
}

/**
 * Renders a string array the way it would be written as a literal in source.
 *
 * `JSON.stringify` would quote with double quotes and drop the spaces, which
 * would make the demo's readout disagree with every snippet on the page. The
 * readout is meant to look like the code it is illustrating.
 *
 * @param list The values to print.
 * @returns e.g. `['apple', 'banana']`, or `[]` for an empty list.
 */
function fmt(list: readonly string[]): string {
  return `[${list.map((v) => `'${v}'`).join(', ')}]`;
}

/**
 * One "→ value ⟨shape⟩" line of a demo readout, with the shape note padded into
 * a rough column so the four answers can be compared down the page.
 *
 * @param value The result, already formatted.
 * @param note What shape that result is — the actual teaching point.
 */
function row(value: string, note: string): string {
  return `  → ${value.padEnd(38)}  ${note}`;
}

/**
 * Lesson: arrays & objects — the two container shapes every piece of app data
 * is built from, and the one idea hiding inside them that explains half the
 * bugs a beginner will ever file: **references**.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`).
 * The reference implementation is `expert/change-detection`; this lesson copies
 * its section rhythm — eyebrow, declarative headline, ask-before-telling, then
 * mechanism in several modes.
 *
 * ## Teaching order, and why it is this order
 *
 * The audience is the hardest one in the app: someone who may never have written
 * a line of code. So nothing here assumes a reader can skim a snippet — every
 * substantial block goes through `app-code-lab`, where a note names each symbol
 * rather than paraphrasing the line.
 *
 * 1. **Pose the trap on line one.** The opening napkin asks whether two
 *    identical-looking arrays are `===`, and deliberately does not answer. That
 *    question is the whole page; a reader carrying a guess reads the middle
 *    sections much more carefully than one reading them cold.
 * 2. **Lockers, then labels.** Arrays get the numbered-locker analogy before the
 *    word "index" appears, and objects get the labelled-form analogy before the
 *    word "property" does. Vocabulary lands on a picture that already exists.
 * 3. **"What shape comes back" for every method.** `map` returns an array,
 *    `find` returns an item or `undefined`, `filter` returns `[]` and never
 *    `undefined` — the confusion between those three is worth a table, a row of
 *    cards, a quiz and a live readout, which is four modes of the same fact.
 * 4. **Then references, at length.** Dialogue, diagram, annotated code, live
 *    demo, quiz, predict. This is the single highest-value idea on the page,
 *    because it is the root of the "I mutated the array and nothing rendered"
 *    problem that the signals and OnPush lessons hit later — so §8 connects it
 *    forward explicitly rather than leaving the reader to notice.
 */
@Component({
  selector: 'app-lesson-arrays-objects-basics',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './arrays-objects-basics.html',
  styleUrl: './arrays-objects-basics.css',
})
export class ArraysObjectsBasics {
  // ── Demo 1: a live array, and the four methods read off it ─────────────────

  /**
   * The list in the array demo.
   */
  protected readonly fruits = signal<string[]>(['apple', 'banana', 'cherry']);

  /**
   * The text typed into the demo's filter box.
   *
   * Drives {@link matches} and {@link firstMatch} so the reader can watch
   * `filter` and `find` disagree about what "nothing matched" looks like — an
   * empty array from one, `undefined` from the other.
   */
  protected readonly query = signal('');

  /**
   * `fruits.map(f => f.toUpperCase())` — a new array, always the same length.
   */
  protected readonly shouted = computed(() => this.fruits().map((f) => f.toUpperCase()));

  /**
   * `fruits.filter(...)` — a new array, zero to length items, never `undefined`.
   */
  protected readonly matches = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.fruits().filter((f) => f.includes(q));
  });

  /**
   * `fruits.find(...)` — one item, or `undefined`. The `undefined` is the point.
   */
  protected readonly firstMatch = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.fruits().find((f) => f.includes(q));
  });

  /**
   * How `find`'s result should be printed, since `undefined` renders as an empty
   * string in a template and the demo's entire job is to make it visible.
   */
  protected readonly firstMatchLabel = computed(() => {
    const hit = this.firstMatch();
    return hit === undefined ? 'undefined' : `'${hit}'`;
  });

  /**
   * `fruits.reduce((sum, f) => sum + f.length, 0)` — one number out of a whole
   * list, showing that reduce's return type is whatever you built, not an array.
   */
  protected readonly letterCount = computed(() =>
    this.fruits().reduce((sum, f) => sum + f.length, 0),
  );

  /**
   * The array demo's readout: the same list put through all four methods, with
   * the *shape* of each answer called out beside it.
   *
   * Rendered as one pre-formatted string rather than as a row of pills because
   * the teaching point is the contrast between four answers seen together —
   * particularly `filter` giving `[]` on the same line that `find` gives
   * `undefined`, which is the distinction the section exists to fix.
   */
  protected readonly readoutMethods = computed(() => {
    const q = this.query().trim().toLowerCase();
    const test = `f.includes('${q}')`;
    return [
      'fruits',
      row(fmt(this.fruits()), `an array of ${this.fruits().length}`),
      '',
      'fruits.map((f) => f.toUpperCase())',
      row(fmt(this.shouted()), 'an array — always the same length'),
      '',
      `fruits.filter((f) => ${test})`,
      row(fmt(this.matches()), `an array — ${this.matches().length} kept, never undefined`),
      '',
      `fruits.find((f) => ${test})`,
      row(this.firstMatchLabel(), 'ONE item, or undefined'),
      '',
      'fruits.reduce((n, f) => n + f.length, 0)',
      row(String(this.letterCount()), 'one number — reduce returns what you built'),
    ].join('\n');
  });

  /**
   * Appends a value, ignoring blank input.
   *
   * Builds a **new** array with a spread rather than pushing. `push` mutates in
   * place, so the signal's reference would not change and nothing would re-render
   * — the single most common signals mistake, demonstrated here on purpose.
   *
   * @param value The raw input text.
   */
  protected add(value: string) {
    const v = value.trim();
    if (v) this.fruits.update((list) => [...list, v]);
  }

  /**
   * Removes the entry at an index, again by building a new array.
   *
   * @param i Index to drop.
   */
  protected removeAt(i: number) {
    this.fruits.update((list) => list.filter((_, idx) => idx !== i));
  }

  // ── Demo 2: one object, its properties, and bracket access ────────────────

  /**
   * The object in the object demo.
   */
  protected readonly person = signal<Person>({ name: 'Ada', age: 36, member: true });

  /**
   * Which key the bracket-access probe is currently reading.
   *
   * The whole reason bracket access exists is that the key can be a *variable*.
   * That is impossible to show with a static snippet, so the demo puts the
   * variable under the reader's control.
   */
  protected readonly probeKey = signal<keyof Person>('name');

  /**
   * `person[key]` evaluated live, printed the way the same value is printed on
   * the demo's dot-access lines.
   *
   * Strings are quoted and everything else is not, because the whole point of
   * the probe is that `person[key]` and `person.name` are the *same read*. If
   * one line said `'Ada'` and the other said `Ada`, the reader would be handed a
   * difference to explain that does not exist.
   */
  protected readonly probeValue = computed(() => {
    const value = this.person()[this.probeKey()];
    return typeof value === 'string' ? `'${value}'` : String(value);
  });

  /**
   * Sets the name, replacing the object rather than mutating it.
   *
   * @param name The new name.
   */
  protected setName(name: string) {
    // NEW object via spread — not mutation — so the signal's reference changes.
    this.person.update((p) => ({ ...p, name }));
  }

  /**
   * Sets the age, likewise by replacement.
   *
   * @param age The new age.
   */
  protected setAge(age: number) {
    this.person.update((p) => ({ ...p, age }));
  }

  /**
   * Points the bracket probe at another key.
   *
   * @param key A property name arriving as a raw string from a `<select>`.
   */
  protected setProbeKey(key: string) {
    this.probeKey.set(key as keyof Person);
  }

  /**
   * The object demo's readout. The last two lines are the whole argument for
   * bracket access: `person[key]` follows the variable, `person.key` does not.
   */
  protected readonly readoutObject = computed(() => {
    const key = this.probeKey();
    return [
      `person = ${this.json()}`,
      '',
      `person.name        → '${this.person().name}'`,
      `person.age         → ${this.person().age}`,
      '',
      `const key = '${key}';        ← you are choosing this from the dropdown`,
      `person[key]        → ${this.probeValue()}`,
      'person.key         → undefined    ← the dot looks for a key spelled "key"',
    ].join('\n');
  });

  /**
   * The object as JSON, so the demo can show the whole value changing at once.
   */
  protected json() {
    return JSON.stringify(this.person());
  }

  // ── Demo 3: two variables, one object ─────────────────────────────────────

  /**
   * Shared-reference demo. We model the "one object, two arrows" situation with
   * a plain mutable object plus a version counter signal that forces re-render
   * (mutation alone wouldn't — which is itself the lesson's punchline).
   */
  private shared = { count: 5 };

  /**
   * The second reference in the shared-reference demo. `null` means `y` is still
   * the *same object* as {@link shared}; cloning points it at a copy.
   */
  private sharedCopy: { count: number } | null = null; // null = still linked to `shared`

  /**
   * A tick bumped whenever the demo mutates a plain object.
   *
   * Needed because the shared-reference demo deliberately works on non-signal
   * objects: mutation is invisible to Angular, so something has to tell the view
   * that anything happened. That it is needed at all is the lesson.
   */
  private readonly version = signal(0);

  /**
   * Whether `x` and `y` still point at one object — the demo's headline state,
   * and also the live answer to `x === y`.
   */
  protected readonly linked = computed(() => {
    this.version();
    return this.sharedCopy === null;
  });

  /**
   * A snapshot of `x` for rendering.
   *
   * Copied through a `computed` that reads {@link version}, because the demo
   * mutates a plain object rather than a signal: without the version bump there
   * would be nothing for Angular to notice. That is the lesson stated in
   * mechanism — mutation is invisible.
   */
  protected readonly sharedX = computed(() => {
    this.version();
    return { ...this.shared };
  });

  /**
   * A snapshot of `y`: the clone if one has been made, otherwise the same object
   * as `x`.
   */
  protected readonly sharedY = computed(() => {
    this.version();
    return this.sharedCopy ? { ...this.sharedCopy } : { ...this.shared };
  });

  /**
   * The shared-reference demo's readout, including the live `x === y` line —
   * the comparison the whole lesson is built around, with a button attached.
   */
  protected readonly readoutShared = computed(() =>
    [
      `x.count   → ${this.sharedX().count}`,
      `y.count   → ${this.sharedY().count}`,
      `x === y   → ${this.linked()}`,
      '',
      this.linked()
        ? '↑ one object, two arrows. Editing through x edited "both".'
        : '↑ two objects now. They will never move together again.',
    ].join('\n'),
  );

  /**
   * Mutates the shared object and bumps {@link version} so the view catches up.
   * Both `x` and `y` change together while they are still linked.
   */
  protected bumpShared() {
    this.shared.count++;
    this.version.update((v) => v + 1);
  }

  /**
   * Points `y` at a copy. From here the two move independently — the moment the
   * demo exists to show.
   */
  protected cloneShared() {
    this.sharedCopy = { ...this.shared };
    this.version.update((v) => v + 1);
  }

  /**
   * Resets both references back to one shared object.
   */
  protected resetShared() {
    this.shared = { count: 5 };
    this.sharedCopy = null;
    this.version.update((v) => v + 1);
  }

  // ── Presentation data ─────────────────────────────────────────────────────

  /** The Programming from Zero track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Programming Basics', id: 'programming-basics' },
    { label: 'Functions', id: 'functions-basics' },
    { label: 'Arrays & Objects' },
    { label: 'Decisions & Loops', id: 'decisions-loops' },
    { label: 'Async Basics', id: 'async-basics' },
  ];

  /**
   * A variable and the array it "holds", arguing about who actually holds it.
   *
   * This is the exchange that the whole reference idea lives or dies on, and
   * prose about it reliably fails: "a variable stores a reference to the array"
   * is a sentence a beginner can read, agree with, and take exactly nothing
   * from. Staging it as two parties — one insisting it holds nothing but an
   * address, the other pointing out there is only one of it — makes the
   * asymmetry the thing you remember instead of the definition.
   */
  protected readonly holderTalk: BubbleTurn[] = [
    {
      who: 'const list',
      says: 'Everyone keeps saying I hold three fruits. I want to be clear: I do not hold three fruits.',
    },
    {
      who: 'The array',
      says: "Correct. I hold them. I'm sitting out in memory at my own address, minding my own business.",
    },
    {
      who: 'const list',
      says: 'And all I have is that address. One arrow, pointing at you. That is my entire contents.',
    },
    {
      who: 'The array',
      says: "Which is why `const` never stopped anyone editing me. It froze **your arrow**, not my insides. `list.push('date')` is perfectly legal.",
    },
    {
      who: 'const other',
      says: 'Meanwhile somebody wrote `const other = list` and handed me a copy of that same arrow. So `push` shows up in me too.',
    },
    {
      who: 'The array',
      says: 'There is no "too". There is one of me. You are both just pointing at it.',
    },
  ];

  /**
   * Sample: the "one name per value" approach, shown failing.
   *
   * Deliberately the only plain (un-annotated) block in the lesson. It is four
   * lines of something the reader has already been taught, and its whole job is
   * to look tedious — annotating it would slow down a joke.
   */
  protected readonly tooManyNames = `const fruit1 = 'apple';
const fruit2 = 'banana';
const fruit3 = 'cherry';
// ...and the fourth one? and the four hundredth?`;

  /** Sample: the mutator family, for the left side of the comparison. */
  protected readonly mutatorsSample = `const list = ['a', 'b', 'c'];

list.push('d');      // ['a','b','c','d']
list.pop();          // ['a','b','c']  → returns 'd'
list.shift();        // ['b','c']      → returns 'a'
list.unshift('z');   // ['z','b','c']
list.splice(1, 1);   // ['z','c']      → returns ['b']
list.sort();         // ['c','z']      reordered in place`;

  /** Sample: the producer family, for the right side of the comparison. */
  protected readonly producersSample = `const list = ['a', 'b', 'c'];

list.map((x) => x + '!');     // ['a!','b!','c!']
list.filter((x) => x < 'c');  // ['a','b']
list.slice(1);                // ['b','c']
list.concat(['d']);           // ['a','b','c','d']
list.join('-');               // 'a-b-c'

list;                         // ['a','b','c'] — untouched`;

  /**
   * Sample for the sort trap predict: a function that quietly reorders its
   * caller's array, because it was handed the arrow and `.sort()` mutates.
   */
  protected readonly sortTrapSample = `function topThree(scores) {
  return scores.sort((a, b) => b - a).slice(0, 3);
}

const myScores = [4, 9, 1, 7];
const top = topThree(myScores);

console.log(top);       // ?
console.log(myScores);  // ?`;

  /** Sample for the shallow-copy predict. */
  protected readonly shallowTrapSample = `const a = { name: 'Ada', settings: { theme: 'light' } };
const b = { ...a };

b.name = 'Grace';
b.settings.theme = 'dark';

a.name;            // ?
a.settings.theme;  // ?`;

  /**
   * Sample: the array literal, indexing, and the two facts that cause every
   * off-by-one error a beginner will ever write.
   */
  protected readonly arraySample = `const fruits = ['apple', 'banana', 'cherry'];

fruits[0];                   // 'apple'
fruits[2];                   // 'cherry'
fruits.length;               // 3
fruits[fruits.length - 1];   // 'cherry'
fruits[9];                   // undefined`;

  /** Line-by-line walkthrough of {@link arraySample}. */
  protected readonly arrayNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The square brackets `[ ]` are the **array literal** — they say "make a list out of what is between me". The commas separate the items; the quotes make each item a piece of text. `const` names the whole list `fruits`, once.',
    },
    {
      line: 3,
      text: 'Square brackets **after** a name mean something different: **reach into it**. `fruits[0]` reads the slot numbered `0`, and `0` is the **first** slot — not the second. Counting starts at zero and this is where most beginner bugs are born.',
    },
    {
      line: 4,
      text: 'Three items, so the slots are numbered `0`, `1`, `2`. `fruits[2]` is therefore the last one. There is no slot `3`.',
    },
    {
      line: 5,
      text: '`.length` is a **property**, not a method — no parentheses, ever. It is the **count** of items, which is a different number from the last index: three items means `length` is `3` while the highest slot is `2`. Those two are never the same number, and the gap between them is where off-by-one bugs live.',
    },
    {
      line: 6,
      text: 'Which makes this the standard "last item" formula: `length - 1`. Write it once and stop counting manually. It also keeps working when the list grows or shrinks.',
    },
    {
      line: 7,
      text: "Reading off the end is **not an error**. There is simply nothing in slot 9, and JavaScript's word for nothing-is-here is `undefined`. The crash comes one line **later**, when you try to use that nothing as if it were a value.",
    },
  ];

  /**
   * Sample: the four methods everything else is built on, each with the shape it
   * returns spelled out in a trailing comment.
   */
  protected readonly methodsSample = `const prices = [12, 5, 30, 8];

prices.map((p) => p * 2);              // [24, 10, 60, 16]
prices.filter((p) => p > 10);          // [12, 30]
prices.find((p) => p > 10);            // 12
prices.reduce((sum, p) => sum + p, 0); // 55

prices;                                // [12, 5, 30, 8]`;

  /** Line-by-line walkthrough of {@link methodsSample}. */
  protected readonly methodsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'An array of numbers this time — a list does not care what is in it, as long as you know. Slots `0` to `3`.',
    },
    {
      line: 3,
      text: '`map` takes **a function** as its argument. `(p) => p * 2` is that function: `p` is a name **you** chose for "one item", and `=>` means "gives back". `map` runs it once per item and collects the answers, so what comes back is a **new array of the same length**. The original is untouched.',
    },
    {
      line: 4,
      text: '`filter` takes a function too, but yours must answer a yes/no question — `p > 10` is `true` or `false` for each item. `filter` keeps the `true` ones. What comes back is a **new array**, anywhere from empty to full. When nothing matches you get `[]`, never `undefined`.',
    },
    {
      line: 5,
      text: '`find` asks the same yes/no question but **stops at the first `true`** and hands back that one item — `12`, a number, not `[12]`. When nothing matches it hands back `undefined`. This one difference from `filter` causes more beginner crashes than any other line on this page.',
    },
    {
      line: 6,
      text: '`reduce` boils the whole list down to one value. Its function takes **two** arguments: `sum` is the answer so far, `p` is the current item. The `0` at the end is the **starting value** for `sum`. So it runs `0+12`, then `12+5`, then `17+30`, then `47+8` — and `55` falls out. Leave off the `0` and an empty list throws.',
    },
    {
      line: 8,
      text: "And here is the payoff: `prices` is exactly what it was. All four of these **build something new** and leave the original alone. That is what makes them safe to chain, and it is the habit that will keep Angular's screen in sync with your data later.",
    },
  ];

  /**
   * Sample: an object literal, dot access, bracket access, and the one thing
   * brackets can do that dots cannot.
   */
  protected readonly objectSample = `const person = {
  name: 'Ada',
  age: 36,
  member: true,
};

person.name;      // 'Ada'
person['name'];   // 'Ada'

const key = 'age';
person[key];      // 36

person.age = 37;
person.email;     // undefined`;

  /** Line-by-line walkthrough of {@link objectSample}. */
  protected readonly objectNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Curly braces `{ }` are the **object literal**: "make one thing with labelled parts". Where an array numbers its slots, an object **names** them.',
    },
    {
      line: 2,
      text: 'One labelled part. The word before the colon is the **key** (also called a property name); the thing after it is the **value**. `name` is a bare word here, not a string — object keys do not need quotes when they look like normal words.',
    },
    {
      line: 4,
      text: "`member` is the key; `true` is the value — a **boolean**, JavaScript's yes/no type, written as a bare word with no quotes. Look at the three values together: text, a number, a true/false. An object's values never have to match each other, because each one is found by **name** rather than by position.",
    },
    {
      line: 7,
      text: 'A dot means "the part called". `person.name` reads the value stored under the key `name`. This is the way you will write 95% of the time.',
    },
    {
      line: 8,
      text: 'Brackets with a **string inside** do exactly the same job. Same result, more typing — so why does it exist? Two lines down.',
    },
    {
      line: 10,
      text: "Here is why. `key` is an ordinary variable holding the text `'age'`.",
    },
    {
      line: 11,
      text: '`person[key]` looks up whatever `key` currently **contains** — so this reads `person.age` and gives `36`. **Dots cannot do this.** `person.key` would look for a property literally named `key`, find none, and hand back `undefined`. Bracket access is how you read a property whose name you only learn at runtime.',
    },
    {
      line: 13,
      text: 'Assignment works through the same accessors: this changes the existing `age`. Assign to a key that does not exist yet and you **add** it — objects are not sealed by default.',
    },
    {
      line: 14,
      text: 'A missing key is `undefined`, exactly like an out-of-range array slot. No error, no warning. Which is convenient right up until you call a method on it.',
    },
  ];

  /**
   * Sample: the nested shape nearly all real app data has — an object holding an
   * array holding more objects — read one hop at a time.
   */
  protected readonly nestedSample = `const order = {
  id: 42,
  customer: { name: 'Ada', address: { city: 'London' } },
  items: [
    { sku: 'A1', qty: 2 },
    { sku: 'B2', qty: 1 },
  ],
};

order.customer.address.city;  // 'London'
order.items[0].qty;           // 2
order.items.length;           // 2
order.items[5].qty;           // TypeError`;

  /** Line-by-line walkthrough of {@link nestedSample}. */
  protected readonly nestedNotes: CodeNote[] = [
    {
      line: 3,
      text: "The value under `customer` is **another object**, and inside that one, `address` is another object again. Nothing new is happening — a value can be anything, and objects are values. That's the whole rule.",
    },
    {
      line: 4,
      text: 'The value under `items` is an **array**, and each of its slots holds an object. Object → array → object is the single most common shape in application data: a cart, a playlist, a table of users.',
    },
    {
      line: 10,
      text: 'Read it strictly left to right, one hop per accessor. `order` is an object; `.customer` gives an object; `.address` gives an object; `.city` gives the string. Four names, three hops, and at every hop you should be able to say out loud what kind of thing you are now holding.',
    },
    {
      line: 11,
      text: 'Same idea, but the middle hop is a **number in brackets** because the thing being reached into is a list, not a labelled group. `order.items` is the array, `[0]` is the first slot, `.qty` is a key on the object living in it.',
    },
    {
      line: 12,
      text: 'Note where `.length` goes: on `order.items`, the array. `order.length` would be `undefined`, because plain objects do not have a length — nothing is counting their keys for you.',
    },
    {
      line: 13,
      text: 'And here is the crash. `order.items[5]` is `undefined` (harmless on its own), but `.qty` **on** `undefined` is asking a nothing for a property, which throws `Cannot read properties of undefined`. When you see that message, the broken thing is one hop to the **left** of where it blew up.',
    },
  ];

  /**
   * Sample: an array of objects — the combination, queried with the same four
   * methods §3 introduced.
   *
   * §5's headline claims almost all app data is a list of records; this is the
   * block that actually shows one being read. Without it the section teaches
   * nesting (`order.items[0].qty`) but never puts `map`/`filter`/`find` to work
   * on records, which is what the reader will spend every later lesson doing.
   */
  protected readonly peopleSample = `const people = [
  { name: 'Ada',   age: 36 },
  { name: 'Grace', age: 41 },
  { name: 'Alan',  age: 29 },
];

people.length;                          // 3
people[1].name;                         // 'Grace'
people.map((p) => p.name);              // ['Ada', 'Grace', 'Alan']
people.filter((p) => p.age > 30);       // the Ada and Grace records
people.find((p) => p.name === 'Alan');  // the whole Alan object
people.find((p) => p.name === 'Zoe');   // undefined`;

  /** Line-by-line walkthrough of {@link peopleSample}. */
  protected readonly peopleNotes: CodeNote[] = [
    {
      line: 1,
      text: 'An **array of objects**: the outer `[ ]` makes the list, and every slot in it holds a `{ }` of its own. This one shape — a list of records that all have the same keys — is what a database table, an API response and a rendered table all arrive as.',
    },
    {
      line: 2,
      text: "Slot `0`. It is a whole object, not a value: `people[0]` hands you `{ name: 'Ada', age: 36 }`, and you then need a **second** accessor to get at anything inside it.",
    },
    {
      line: 7,
      text: '`.length` counts the **records**, not their keys. Three objects in the list, so `3` — it never looks inside them.',
    },
    {
      line: 8,
      text: 'Two hops, and each bracket or dot means something different. `[1]` reaches into the **array** by position and gives you the Grace object; `.name` then reaches into that **object** by key. Say the type out loud after each hop and this never goes wrong.',
    },
    {
      line: 9,
      text: '`p` is the name you chose for "one record". `p.name` pulls one key out of each, so `map` — which always returns the same number of items it was given — turns a list of three objects into a list of three **strings**. Changing the item type is the normal thing for `map` to do.',
    },
    {
      line: 10,
      text: "`filter` keeps whole items, so what comes back is still a list of **objects** — the same objects, not copies. Two passed the `age > 30` test, so the new array has two slots in it. The list is new; the records inside it are not, which is the next section's entire subject.",
    },
    {
      line: 11,
      text: '`find` hands back **one record**, not a one-item list. So you write `people.find(…).age`, with no `[0]` in the middle — which is the whole reason to reach for `find` over `filter` when you want a single thing.',
    },
    {
      line: 12,
      text: 'And the trap again, in its natural habitat: nobody is called Zoe, so this is `undefined`. Put `.age` on the end and it throws. Guard it — `people.find(…)?.age` — or check for `undefined` before you use the result.',
    },
  ];

  /**
   * Sample: the whole value-versus-reference distinction in twelve lines. The
   * numbers are copied; the objects are shared; two matching objects are not
   * equal.
   */
  protected readonly referenceSample = `let a = 5;
let b = a;
a = 10;
b;                  // 5

const x = { count: 5 };
const y = x;
x.count = 10;
y.count;            // 10
x === y;            // true

const p = { count: 10 };
const q = { count: 10 };
p === q;            // false`;

  /** Line-by-line walkthrough of {@link referenceSample}. */
  protected readonly referenceNotes: CodeNote[] = [
    {
      line: 2,
      text: '`b = a` with a **number** on the right copies the value. Two boxes now, each with its own `5` in it. Numbers, text and true/false all behave this way — they are called **primitives**, and they are copied whole.',
    },
    {
      line: 4,
      text: 'So changing `a` cannot possibly reach `b`. This is the behaviour you already assume, which is exactly why the next block is such a shock.',
    },
    {
      line: 6,
      text: 'Now an **object**. Here is the sentence to memorise: `x` does not contain this object. Somewhere in memory there is an object, and `x` contains an **arrow** pointing at it.',
    },
    {
      line: 7,
      text: '`y = x` copies what `x` contains — and what `x` contains is the arrow. So now there are **two arrows and one object**. No second object was created; `{ }` is the only thing that ever creates one, and there is no `{ }` on this line.',
    },
    {
      line: 8,
      text: 'This edits the object at the end of the arrow. Not "x\'s object" — **the** object.',
    },
    {
      line: 9,
      text: '…which is why reading through the other arrow shows `10`. Nobody touched `y`. There was never a second thing to touch.',
    },
    {
      line: 10,
      text: '`===` on objects asks one question and it is **not** "do these match?". It asks "are these two arrows pointing at the same object?". Here they are, so: `true`.',
    },
    {
      line: 12,
      text: 'A fresh `{ }` literal, so this makes a brand-new object at a brand-new address. Nothing on this line has anything to do with `x` or `y`.',
    },
    {
      line: 13,
      text: 'And a **second** `{ }` literal, which makes a **second** object. Two literals ran, so two objects exist — they merely happen to hold the same number.',
    },
    {
      line: 14,
      text: '**`false`.** Identical contents, different objects, different arrows. `===` never looked inside them. Identical twins are still two people — and JavaScript has no built-in operator that compares two objects item by item, so if you want that comparison you have to write it.',
    },
  ];

  /**
   * Sample: spread — copying, copy-and-override, and the shallow trap that
   * catches everyone exactly once.
   */
  protected readonly spreadSample = `const person = { name: 'Ada', age: 36 };

const copy = { ...person };
const older = { ...person, age: 37 };
copy === person;   // false

const fruits = ['apple', 'banana'];
const more = [...fruits, 'cherry'];

const user = { name: 'Ada', settings: { theme: 'light' } };
const clone = { ...user };
clone.settings === user.settings;   // true`;

  /** Line-by-line walkthrough of {@link spreadSample}. */
  protected readonly spreadNotes: CodeNote[] = [
    {
      line: 3,
      text: 'The three dots are the **spread operator**. Read `{ ...person }` as: "open a brand-new object, and pour every property of `person` into it". The `{ }` is doing the creating; the `...` is doing the pouring.',
    },
    {
      line: 4,
      text: 'Pour everything in, **then** write `age` again. Later keys win, so this is a full copy with one value swapped — and the original `person` is untouched. This one line is the most-typed pattern in modern Angular state code.',
    },
    {
      line: 5,
      text: '`false`, and that is the good news: a real new object at a new address means a **new arrow**, which is precisely the signal a framework watches for. This is the whole reason to prefer spread over editing in place.',
    },
    {
      line: 7,
      text: 'Spread is not an object-only tool — arrays take it too. The `[ ]` here is the ordinary **array literal**, building a fresh two-item list so the next line has something to pour out of.',
    },
    {
      line: 8,
      text: '"New array: all of `fruits`, then `\'cherry\'`." Order matters — put the `...` last and you prepend instead. This is the copying replacement for `push`.',
    },
    {
      line: 10,
      text: "Now the trap. `settings` holds an object, so `user` contains an arrow to `{ theme: 'light' }`.",
    },
    {
      line: 11,
      text: 'Spread copies each property **one level deep**. `name` is a string, so `clone` gets its own copy. `settings` is an arrow, so what `clone` gets is a copy of **the arrow**.',
    },
    {
      line: 12,
      text: '**`true`** — one nested object, two parents. Editing `clone.settings.theme` changes `user.settings.theme` as well. That is what "shallow copy" means, and the fix is to spread at every level you intend to change: `{ ...user, settings: { ...user.settings, theme: \'dark\' } }`.',
    },
  ];

  /**
   * Sample: destructuring — the mirror image of building an object, which is
   * exactly why it looks so wrong the first time.
   */
  protected readonly destructureSample = `const person = { name: 'Ada', age: 36 };

const { name, age } = person;
const { name: who } = person;
const { email = 'none' } = person;

const fruits = ['apple', 'banana', 'cherry'];
const [first, second] = fruits;
const [, , third] = fruits;`;

  /** Line-by-line walkthrough of {@link destructureSample}. */
  protected readonly destructureNotes: CodeNote[] = [
    {
      line: 3,
      text: 'Curly braces on the **left** of `=` do not build an object — they take one apart. Read it right to left: "from `person`, pull out the properties called `name` and `age`, and make me two ordinary variables with those names". Afterwards `name` is `\'Ada\'` and `age` is `36`. `person` is unchanged; nothing was moved, only copied out.',
    },
    {
      line: 4,
      text: 'The colon **renames on the way out**: pull out `name`, but call the variable `who`. Note the direction — it is `oldKey: newName`, which is the opposite way round from how an object literal reads, and is the single most common misreading of this syntax.',
    },
    {
      line: 5,
      text: "`=` inside the braces supplies a **default** for a key that is missing. `person` has no `email`, so `email` becomes `'none'` instead of `undefined`. The default only fires for `undefined` — a key that genuinely holds `null` or `0` comes through as-is.",
    },
    {
      line: 8,
      text: 'Square brackets on the left unpack an **array**, and because arrays have no names, the match is purely by **position**. `first` gets slot 0, `second` gets slot 1. You can call them anything you like; the order is what binds them.',
    },
    {
      line: 9,
      text: "The bare commas are placeholders that skip slots. Two commas skip slots 0 and 1, so `third` gets slot 2 — `'cherry'`. Ugly, occasionally exactly what you need.",
    },
  ];

  /**
   * Sample: the forward connection — the same array edited two ways, one of
   * which Angular can see.
   */
  protected readonly angularSample = `// the wrong way — the screen will not update
this.todos().push(newTodo);

// the right way — a new array, so a new arrow
this.todos.update((list) => [...list, newTodo]);`;

  /** Line-by-line walkthrough of {@link angularSample}. */
  protected readonly angularNotes: CodeNote[] = [
    {
      line: 2,
      text: '`this.todos()` reads the array out of the signal, and `.push()` adds to **that array, in place**. The data is genuinely correct afterwards — the list really does have one more item. But the signal is still holding the same arrow it held before, so as far as Angular is concerned nothing was assigned and nothing needs redrawing.',
    },
    {
      line: 5,
      text: '`update` hands you the current list and stores whatever you return. `[...list, newTodo]` builds a **brand-new array**, so the signal ends up holding a different arrow — and a different arrow is the one thing a framework can detect cheaply. Same data, one extra pair of brackets, and the screen now agrees with it.',
    },
  ];

  /**
   * The path a mutation takes to a stale screen.
   *
   * Drawn as a sequence rather than as prose because the failure is entirely
   * about *ordering*: every individual step is reasonable, and it is only when
   * they are laid end to end that the reader can see there was never a moment
   * where anything could have noticed.
   */
  protected readonly staleFlow: FlowStep[] = [
    {
      label: 'You mutate',
      detail: '`list.push(todo)` — the array now genuinely has one more item in it',
      tone: 'accent',
    },
    {
      label: 'The arrow is unchanged',
      detail: 'Same object, same address. The variable holding it never moved.',
    },
    {
      label: 'Angular compares',
      detail: 'Every check compares the new value against the stored one with `===`',
    },
    {
      label: '`===` says true',
      detail: 'Same arrow. As far as the framework can tell, nothing happened here.',
    },
    {
      label: 'The screen stays wrong',
      detail: 'No re-render. Your data is right and your pixels are a lie.',
      tone: 'warn',
    },
  ];

  /**
   * Self-test 1 — the shape question.
   *
   * The three wrong options are the three real confusions: borrowing `find`'s
   * `undefined`, confusing the input with the result, and mistaking the
   * callback's return value for the method's. Each `why` names that specific
   * mix-up rather than simply restating that the answer is `[]`.
   */
  protected readonly shapeQuizOptions: QuizOption[] = [
    {
      text: '`undefined` — nothing matched, so there is nothing to hand back.',
      why: "That is `find`'s answer, not `filter`'s. `find` goes hunting for one item and comes back empty-handed as `undefined`. `filter` builds a new array as it walks, and an array it never put anything into is `[]` — a real, usable, empty array. Blurring the two is why `result.length` crashes on some days and reads `0` on others.",
    },
    {
      text: '`[]` — an empty array.',
      correct: true,
      why: 'Right, and it matters more than it looks. Because you always get an array, `found.length` is safe, `found.map(...)` is safe, and `@for` over it simply renders nothing instead of throwing. `filter` never returns `undefined`, no matter how badly the search goes.',
    },
    {
      text: '`[1, 2, 3]` — `filter` leaves the original alone, so you get it back.',
      why: 'It does leave the original alone — that half is true. But what comes back is the **result**, not the input: a brand-new array containing only the items that passed. Nothing passed, so the new array is empty. `[1, 2, 3]` still exists under its own name; it just is not what `filter` handed you.',
    },
    {
      text: '`false` — none of the items passed the test.',
      why: "`false` is what **your callback** returns for each item, not what the method returns overall. `(n) => n > 10` produces a `true` or `false` per item, and `filter` uses those to decide what to keep. Confusing the callback's return with the method's return is worth watching for generally: it is also why people expect `map` to return one value.",
    },
  ];

  /**
   * Self-test 2 — the reference question, and the most important four options
   * on the page.
   *
   * The first distractor is *the* misconception this lesson exists to break, so
   * its `why` gets the most room.
   */
  protected readonly referenceQuizOptions: QuizOption[] = [
    {
      text: '`a === b`, because both arrays contain exactly the same thing.',
      why: 'This is the single most common wrong answer in the whole topic, and it is wrong for a precise reason: `===` on arrays and objects never looks **inside** them. It asks one question — are these two arrows pointing at the same object? `a` and `b` were built by two separate `[...]` literals, so two arrays exist that merely happen to match. Identical twins are still two people.',
    },
    {
      text: "`a === c`, because `c` was handed `a`'s arrow.",
      correct: true,
      why: 'Yes. `const c = a` copies the arrow, not the array, so both names point at one single array in memory. Push onto `c` and `a.length` changes too — there is only one thing there to change.',
    },
    {
      text: 'Both — `===` compares contents when both sides are arrays.',
      why: '`===` compares contents only for **primitives**: numbers, strings, booleans. For arrays and objects it compares identity, always. There is no built-in operator anywhere in JavaScript that walks two arrays item by item; if you want that, you write a loop or reach for `JSON.stringify`, and either way it is a decision you make on purpose.',
    },
    {
      text: 'Neither — `===` is always `false` for arrays.',
      why: 'It is `false` often enough that this feels like a rule, but it is not one. `===` is `true` whenever both sides are literally the same object, and `c` genuinely is the same object as `a`. If arrays were never equal to each other, Angular could not use a reference check to spot a replaced list — and the whole "new array = something changed" bargain in the next few lessons would not work.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why is reading past the end of an array not an error? Surely that is always a mistake.',
      a: "Usually, but not always — plenty of code reads a slot to **check** whether it is there. JavaScript's answer is `undefined`, meaning nothing-is-here, and it hands it back quietly. The error arrives one step later, when you treat that nothing as a value: `list[9].toUpperCase()` throws `Cannot read properties of undefined`. When you see that message, the broken read is on the **left** of the dot, one hop before the crash.",
    },
    {
      q: 'Does `const` stop me changing an object? Everyone tells me const means constant.',
      a: '`const` seals the **variable**, not the value. It means the arrow can never be pointed somewhere else — `person = somethingElse` fails. The object at the end of the arrow is untouched by any of that, so `person.age = 37` is completely legal. If you want the contents frozen too, that is a separate tool: `Object.freeze()` at runtime, or `readonly` in TypeScript at compile time.',
    },
    {
      q: "Why does `typeof []` say `'object'`? An array is obviously not an object.",
      a: 'It genuinely is one. An array is an object whose keys happen to be the numbers `0`, `1`, `2`… plus a `length` that is kept up to date and a pile of borrowed methods. That is why bracket access looks the same for both, and why `typeof` cannot tell them apart. Use `Array.isArray(value)` when you actually need to know — it is the only reliable check.',
    },
    {
      q: 'When should I reach for an array and when for an object?',
      a: 'Ask whether the things are the **same kind of thing**. Many of one kind, where order matters and the count can change — an array. Several different named facts about one single thing — an object. Users: array. One user: object. And the moment you catch yourself writing `user1`, `user2`, `user3`, you wanted an array three variables ago.',
    },
    {
      q: 'Do I have to use `map` and `filter`, or can I just write a loop?',
      a: 'A loop is fine and does the same job — the next lesson covers them properly. The reason these methods win in an Angular codebase is not elegance, it is that they **return a new array** by default, while a loop that pushes into an existing one is a mutation waiting to be invisible. Reach for the method when you want a new list, and for a loop when you genuinely want to do something to each item rather than produce anything.',
    },
    {
      q: 'Is `JSON.parse(JSON.stringify(obj))` a good way to copy something deeply?',
      a: 'It works, it is a well-known trick, and it quietly destroys things. Dates come back as strings, functions and `undefined` values vanish entirely, and anything that points back at itself throws. Modern browsers have `structuredClone(obj)`, which handles all of that properly — use it. Most of the time, though, you do not want a deep copy at all: you want a spread at the one or two levels you are actually changing.',
    },
  ];
}
