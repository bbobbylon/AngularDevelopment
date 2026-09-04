import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Predict, Quiz, type QuizOption, Remember } from '../../../shared/teaching';

/**
 * One bug-hunt exercise: a snippet of plain JavaScript with a real defect, and
 * the TypeScript error that would have caught it before it ran.
 */
interface BugHunt {
  id: number;
  code: string;
  jsOutcome: string;
  tsOutcome: string;
}

const HUNTS: BugHunt[] = [
  {
    id: 1,
    code: `function greet(name) {\n  return 'Hi ' + name.toUpperCase();\n}\ngreet(42);`,
    jsOutcome:
      '💥 Runtime crash — in production, when a user hits it: "name.toUpperCase is not a function".',
    tsOutcome:
      '❌ Caught while typing: with greet(name: string), the call greet(42) gets a red squiggle — "Argument of type number is not assignable to parameter of type string."',
  },
  {
    id: 2,
    code: `const user = { name: 'Ada', age: 36 };\nconsole.log(user.nmae);`,
    jsOutcome:
      '🤫 No crash at all — user.nmae is just undefined. The page quietly shows nothing where the name should be. Silent bugs are the worst bugs.',
    tsOutcome:
      "❌ Caught while typing: \"Property 'nmae' does not exist on type { name: string; age: number }. Did you mean 'name'?\" — it even suggests the fix.",
  },
  {
    id: 3,
    code: `const price = document\n  .querySelector('input').value;\nconst total = price * 1.2;   // price is a STRING`,
    jsOutcome:
      '🤔 Sometimes works! "10" * 1.2 coerces to 12 — until someone types "10,50" and total becomes NaN. The bug appears intermittently, weeks later.',
    tsOutcome:
      '❌ Caught while typing: value is typed as string, and string * number is an error. You are forced to convert deliberately: Number(price) * 1.2.',
  },
];

/**
 * Lesson: Why TypeScript & Angular — compile-time vs runtime error catching
 * (with a live bug-hunt demo), what the TS compiler actually does, framework
 * vs library and inversion of control, what Angular provides out of the box
 * vs hand-rolled JS, where Angular sits vs React/Vue, and the curriculum map.
 */
@Component({
  selector: 'app-lesson-why-typescript-angular',
  imports: [RouterLink, Predict, Quiz, Remember],
  templateUrl: './why-typescript-angular.html',
  styleUrl: './why-typescript-angular.css',
})
export class WhyTypescriptAngular {
  /**
   * The string-addition puzzle used by the ask-before-telling block.
   *
   * `+` means two different things in JavaScript depending on what is on either
   * side, and a form input hands you strings that look exactly like numbers.
   * There is no crash and no warning — the total is simply wrong, which is why
   * this shape of bug survives all the way to a customer's invoice.
   *
   * Held in the class rather than the template because the snippet is full of
   * `{`/`}`, which Angular's parser reads as control-flow syntax in an attribute.
   */
  protected readonly stringMathSample = `// Three prices, read out of three form inputs.
// Everything you read from an <input> arrives as TEXT, even if it looks numeric.
const prices = ['10', '20', '30'];

let total = 0;              // a number

for (const p of prices) {   // p is a string on every pass
  total += p;               // the line in question
}

console.log(total);`;

  /**
   * The self-test, on the limit of compile-time checking. Every wrong answer
   * assumes the type annotation does something at runtime, which is the single
   * most consequential misunderstanding a new TypeScript developer can hold.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: 'Nothing happens at the fetch. The code runs on, and later blows up somewhere else with "cannot read property of undefined".',
      correct: true,
      why: 'Right, and this is the most important limit to internalise. `as User` is a *claim*, not a check — the compiler believes you and then erases the annotation. At runtime the object is whatever the server actually sent, and the crash happens far away from the line that lied.',
    },
    {
      text: 'TypeScript throws immediately, because the response does not match the `User` type.',
      why: 'It cannot: by the time that response arrives, TypeScript is not there. Annotations are erased during compilation, and the browser is running plain JavaScript with no memory of what you promised.',
    },
    {
      text: 'TypeScript fills in the missing fields with `undefined` so the object matches the declared shape.',
      why: 'Nothing rewrites your data. TypeScript emits no runtime code of its own for a type annotation — it does not add defaults, coerce values, or construct anything.',
    },
    {
      text: 'The build fails, because the compiler checks API responses against declared types.',
      why: 'The compiler has never seen your server. It checks the code in your repository against itself; anything crossing the network boundary is outside what it can know, which is exactly why runtime validation exists as a separate job.',
    },
  ];

  /**
   * The bug-hunt exercises.
   */
  protected readonly hunts = HUNTS;
  /**
   * Which exercise is selected.
   */
  protected readonly huntId = signal(1);
  /**
   * The selected exercise. The non-null assertion is safe because {@link huntId}
   * is only ever set from an id in {@link hunts}.
   */
  protected readonly hunt = computed(() => this.hunts.find((h) => h.id === this.huntId())!);
}
