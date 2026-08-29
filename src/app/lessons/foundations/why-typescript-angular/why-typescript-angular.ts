import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
    jsOutcome: '💥 Runtime crash — in production, when a user hits it: "name.toUpperCase is not a function".',
    tsOutcome: '❌ Caught while typing: with greet(name: string), the call greet(42) gets a red squiggle — "Argument of type number is not assignable to parameter of type string."',
  },
  {
    id: 2,
    code: `const user = { name: 'Ada', age: 36 };\nconsole.log(user.nmae);`,
    jsOutcome: '🤫 No crash at all — user.nmae is just undefined. The page quietly shows nothing where the name should be. Silent bugs are the worst bugs.',
    tsOutcome: '❌ Caught while typing: "Property \'nmae\' does not exist on type { name: string; age: number }. Did you mean \'name\'?" — it even suggests the fix.',
  },
  {
    id: 3,
    code: `const price = document\n  .querySelector('input').value;\nconst total = price * 1.2;   // price is a STRING`,
    jsOutcome: '🤔 Sometimes works! "10" * 1.2 coerces to 12 — until someone types "10,50" and total becomes NaN. The bug appears intermittently, weeks later.',
    tsOutcome: '❌ Caught while typing: value is typed as string, and string * number is an error. You are forced to convert deliberately: Number(price) * 1.2.',
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
  imports: [RouterLink],
  templateUrl: './why-typescript-angular.html',
  styleUrl: './why-typescript-angular.css',
})
export class WhyTypescriptAngular {
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
