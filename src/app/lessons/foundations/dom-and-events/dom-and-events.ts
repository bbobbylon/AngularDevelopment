import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Predict, Quiz, type QuizOption, Remember } from '../../../shared/teaching';

/**
 * One layer's record of a bubbling click: which layer, and where in the order it
 * fired.
 */
interface BubbleHit {
  layer: string;
  order: number;
}

/**
 * Lesson: The DOM & events — the element tree (explorable live), nodes vs
 * attributes vs properties, the event object, bubbling demonstrated with a
 * live nested-box demo, addEventListener anatomy line by line, and the
 * manual-sync pain that motivates Angular's data binding.
 */
@Component({
  selector: 'app-lesson-dom-and-events',
  imports: [RouterLink, Predict, Quiz, Remember],
  templateUrl: './dom-and-events.html',
  styleUrl: './dom-and-events.css',
})
export class DomAndEvents {
  /**
   * The attribute-vs-property divergence puzzle used by the ask-before-telling
   * block.
   *
   * `checked` is one of the classic examples: reading the attribute never
   * reflects what the user (or code) did after page load, while the property
   * always does. Nothing errors — the two just quietly stop agreeing.
   *
   * Held in the class rather than the template because the snippet is full of
   * `{`/`}`, which Angular's parser reads as control-flow syntax in an attribute.
   */
  protected readonly attributeVsPropertySample = `<input id="agree" type="checkbox" checked>

const box = document.querySelector('#agree');

console.log(box.getAttribute('checked'));   // ① before anything happens

box.checked = false;                        // user unchecks it

console.log(box.getAttribute('checked'));   // ② after unchecking
console.log(box.checked);                   // ③ after unchecking`;

  /**
   * The self-test, on event delegation and elements that don't exist yet at
   * the time a listener is registered. Every wrong answer assumes bubbling
   * needs to be "told about" new nodes somehow, rather than simply happening
   * to whatever the current tree looks like at click time.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: "Yes — bubbling doesn't care when a descendant was added. The listener lives on the ul, and any click anywhere inside it, now or from a row appended years later, still travels up through the SAME ul and triggers the SAME handler.",
      correct: true,
      why: 'This is exactly why event delegation is worth learning: the listener is attached to a stable ancestor, and bubbling is evaluated fresh at the moment of each click against whatever the tree looks like right then — it was never bound to a fixed snapshot of children.',
    },
    {
      text: 'No — addEventListener only ever binds to the elements that existed in the DOM at the moment it was called.',
      why: "That would be true if the listener were attached directly to each li. It isn't — it's attached once to the ul, and the ul itself never changed. What changed is only which children happen to exist when a click bubbles through it.",
    },
    {
      text: 'Only if the code manually calls addEventListener again on the ul after the new rows are appended.',
      why: 'Re-registering would actually create a SECOND listener, firing the handler twice per click. The single original listener already covers every descendant, present or future, with no re-registration needed.',
    },
    {
      text: 'It depends on how the new li elements were inserted — only nodes created with createElement participate in bubbling.',
      why: 'Bubbling is a property of the DOM tree structure, not of how a node was constructed. Any element attached anywhere under the ul bubbles clicks up to it, regardless of insertAdjacentHTML, createElement, innerHTML, or any other insertion method.',
    },
  ];
  /**
   * Click count for the simplest listener demo.
   */
  protected readonly count = signal(0);
  /**
   * Increments the click count.
   */
  protected onClick() {
    this.count.update((c) => c + 1);
  }

  /** Explorable DOM tree — one entry per node with its depth and description. */
  protected readonly nodes = [
    {
      id: 'body',
      tag: '<body>',
      depth: 0,
      info: 'The root of everything visible. Parent of header and main.',
    },
    {
      id: 'header',
      tag: '<header>',
      depth: 1,
      info: 'A child of body, sibling of main, parent of the h1.',
    },
    {
      id: 'h1',
      tag: '<h1>',
      depth: 2,
      info: 'A leaf node. Its textContent property is "My App" — write to it and the heading changes instantly.',
    },
    {
      id: 'main',
      tag: '<main>',
      depth: 1,
      info: 'A child of body with two children of its own: the p and the button.',
    },
    { id: 'p', tag: '<p>', depth: 2, info: 'Sibling of the button — same parent (main).' },
    {
      id: 'button',
      tag: '<button>',
      depth: 2,
      info: 'The interactive one: it has properties like disabled, and events like click fire on it first before bubbling up through main and body.',
    },
  ];
  /**
   * Which node is selected in the DOM-tree explorer.
   */
  protected readonly selected = signal('body');
  /**
   * The selected node. The non-null assertion is safe because the selection only
   * ever comes from the node list.
   */
  protected readonly selectedNode = computed(() =>
    this.nodes.find((n) => n.id === this.selected())!,
  );

  /** Bubbling demo — each layer logs when the click reaches it. */
  protected readonly hits = signal<BubbleHit[]>([]);
  /**
   * Records that a layer's handler ran.
   *
   * Called by three nested boxes. One physical click on the innermost fires all
   * three in order — inner, middle, outer — because the event **bubbles** up the
   * tree. Numbering them in arrival order is what makes that order visible rather
   * than theoretical.
   *
   * @param layer Which box's handler fired.
   */
  protected hit(layer: string) {
    // Angular's (click) listens per-element; one physical click on the inner box
    // runs inner's handler first, then bubbles to middle's, then outer's.
    this.hits.update((h) => [...h, { layer, order: h.length + 1 }]);
  }
}
