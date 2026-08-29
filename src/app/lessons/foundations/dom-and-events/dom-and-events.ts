import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  imports: [RouterLink],
  templateUrl: './dom-and-events.html',
  styleUrl: './dom-and-events.css',
})
export class DomAndEvents {
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
    { id: 'body', tag: '<body>', depth: 0, info: 'The root of everything visible. Parent of header and main.' },
    { id: 'header', tag: '<header>', depth: 1, info: 'A child of body, sibling of main, parent of the h1.' },
    { id: 'h1', tag: '<h1>', depth: 2, info: 'A leaf node. Its textContent property is "My App" — write to it and the heading changes instantly.' },
    { id: 'main', tag: '<main>', depth: 1, info: 'A child of body with two children of its own: the p and the button.' },
    { id: 'p', tag: '<p>', depth: 2, info: 'Sibling of the button — same parent (main).' },
    { id: 'button', tag: '<button>', depth: 2, info: 'The interactive one: it has properties like disabled, and events like click fire on it first before bubbling up through main and body.' },
  ];
  /**
   * Which node is selected in the DOM-tree explorer.
   */
  protected readonly selected = signal('body');
  /**
   * The selected node. The non-null assertion is safe because the selection only
   * ever comes from the node list.
   */
  protected readonly selectedNode = computed(
    () => this.nodes.find((n) => n.id === this.selected())!,
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
