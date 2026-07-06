import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { loadQueue } from '../practice/review-queue';
import { Flashcards } from './flashcards';

/**
 * The deck loop is the heart of the flashcards page: "Got it" clears the head
 * card, "Again" cycles it to the tail AND reports its FIRST miss (only the
 * first) to the shared spaced-repetition queue.
 */
describe('Flashcards', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Flashcards],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function createStarted(deckSize: number): Flashcards {
    const component = TestBed.createComponent(Flashcards).componentInstance;
    component.deckSize.set(deckSize);
    component.start();
    return component;
  }

  it('draws a deck of the requested size and enters the drill', () => {
    const component = createStarted(10);
    expect(component.phase()).toBe('drill');
    expect(component.queue().length).toBe(10);
    expect(component.deckTotal()).toBe(10);
    expect(component.current()).toBeDefined();
  });

  it('ignores grading before the card is flipped', () => {
    const component = createStarted(10);
    const head = component.current();
    component.grade(true);
    expect(component.queue().length).toBe(10);
    expect(component.current()).toBe(head);
  });

  it('"Got it" clears the head card from the deck', () => {
    const component = createStarted(10);
    const head = component.current();
    component.flip();
    component.grade(true);
    expect(component.queue().length).toBe(9);
    expect(component.queue().some((c) => c.id === head.id)).toBe(false);
    expect(component.flipped()).toBe(false);
  });

  it('"Again" cycles the card to the back and enqueues its first miss for review', () => {
    const component = createStarted(10);
    const head = component.current();

    component.flip();
    component.grade(false);

    const queue = component.queue();
    expect(queue.length).toBe(10);
    expect(queue[queue.length - 1].id).toBe(head.id);
    expect(component.missedIds().has(head.id)).toBe(true);
    expect(loadQueue()[head.id]).toBeDefined();
    expect(loadQueue()[head.id].lapses).toBe(1);
  });

  it('reports a repeatedly-missed card to the review queue only once', () => {
    const component = createStarted(2);
    const head = component.current();

    // Miss the same card twice around the loop.
    component.flip();
    component.grade(false);
    while (component.current().id !== head.id) {
      component.flip();
      component.grade(true);
    }
    component.flip();
    component.grade(false);

    expect(loadQueue()[head.id].lapses).toBe(1);
  });

  it('ends in the summary with first-try stats once the deck is cleared', () => {
    const component = createStarted(2);
    // Miss the first card once, then clear everything.
    component.flip();
    component.grade(false);
    while (component.phase() === 'drill') {
      component.flip();
      component.grade(true);
    }
    expect(component.phase()).toBe('summary');
    expect(component.deckTotal()).toBe(2);
    expect(component.missedIds().size).toBe(1);
    expect(component.firstTryCount()).toBe(1);
  });
});
