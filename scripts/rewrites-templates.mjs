/** Length-balanced option rewrites for the `templates` category (8 Qs).
 * Answer indices unchanged; correct option trimmed into the distractor band,
 * distractors made plausible and comparable, depth left in each (untouched)
 * explanation. Backtick strings — no option contains a backtick or ${ . */
export default {
  393: { answer: 1, options: [
    `[src] binds one-time only; the {{ url }} interpolation form updates live`,
    `Both stay in sync — [src] sets the DOM property, {{ url }} the attribute`,
    `src="{{ url }}" is a compile error on native <img> elements`,
    `They differ only for custom components, never for native elements`,
  ] },
  394: { answer: 1, options: [
    `colspan must be written uppercase — even [colSpan] will never work on a <td>`,
    `colspan is an attribute, not a property, so bind [attr.colspan]="span"`,
    `Numbers cannot be bound in templates, so span must be a string first`,
    `Angular property binding does not work on any <td> element at all`,
  ] },
  395: { answer: 1, options: [
    `A <div> styled with display: contents so it collapses visually`,
    `Nothing — a logical group for directives, adds no wrapper element`,
    `An HTML comment node that measurably slows down template rendering`,
    `A real <ng-container> custom element which the browser then ignores`,
  ] },
  396: { answer: 1, options: [
    `Always the raw underlying DOM element in both of these cases`,
    `Plain element → DOM element; component host → component instance`,
    `Always the component class instance backing the current template`,
    `A plain string holding the id attribute of the element it sits on`,
  ] },
  397: { answer: 1, options: [
    `Both lines throw a template compile error immediately on first render`,
    `First <p> empty; the second throws — ! only fools the type-checker`,
    `Both interpolations render the literal string "undefined" instead`,
    `The safe-navigation line renders "null"; the assertion line stays empty`,
  ] },
  398: { answer: 1, options: [
    `The script executes — [innerHTML] is a direct XSS hole in Angular`,
    `Angular sanitizes it: the script and inline handlers are removed`,
    `Angular throws a sanitization error and then renders nothing at all`,
    `The HTML renders as escaped text, with every tag visible to the user`,
  ] },
  399: { answer: 1, options: [
    `It declares a real component class field from within the template`,
    `It names an expression once for reuse later in the same template`,
    `It is a compile-time constant frozen at the first render pass`,
    `It replaces @if, rendering its block only when the value is truthy`,
  ] },
  400: { answer: 1, options: [
    `Plain <div> elements simply cannot host Angular event bindings at all`,
    `A real <button> is focusable, keyboard-activatable and announced`,
    `Buttons render measurably faster than divs during change detection`,
    `The (click) event binding syntax only compiles on native form controls`,
  ] },
};
