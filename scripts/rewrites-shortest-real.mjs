/** The one genuinely eyeball-exploitable shortest-answer tell in the bank:
 * testing #122's correct option was "Both A and C are correct" (24 chars) sitting
 * beside an 88-char distractor — a test-taker spots the runt instantly. Expand it
 * to a full-length explanation so length carries no signal. Distractors verbatim. */
export default {
  122: { answer: 3, options: [
    `fixture.componentInstance.myInput = value; then fixture.detectChanges()`,
    `TestBed.configureTestingModule({ inputs: { myInput: value } })`,
    `fixture.setInput("myInput", value) — Angular 14+ API that also triggers change detection`,
    `Both A and C are correct — each sets the input and then runs change detection`,
  ] },
};
