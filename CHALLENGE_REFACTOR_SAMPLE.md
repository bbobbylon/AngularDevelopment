# Challenge Refactor Sample - certificates.dev Style

**Purpose:** Show the pattern for refactoring all 200 challenges to have:
- ✅ Balanced option lengths (can't just pick the longest)
- ✅ Code blocks as answers (tests understanding, not text-length guessing)
- ✅ Plausible wrong answers (sound like they could be right)
- ✅ Detailed explanations only shown AFTER answering

---

## BEFORE vs AFTER Examples

### Example 1: Components - Decorator Question

**BEFORE (current):**
```typescript
{
  id: 1,
  question: 'Which decorator turns a class into an Angular component?',
  options: [
    '@NgModule',
    '@Component',
    '@Injectable',
    '@Directive'
  ],
  answer: 1,
  explanation: '@Component marks a class as an Angular component...'
}
```
❌ **Problem:** All options same length, but correct answer is obvious if you know Angular basics.

**AFTER (refactored):**
```typescript
{
  id: 1,
  question: 'Which decorator turns a class into an Angular component?',
  options: [
    '@NgModule — groups components into a module',
    '@Component — declares a reusable UI building block',
    '@Injectable — marks a class for dependency injection',
    '@Directive — adds behavior to elements'
  ],
  answer: 1,
  explanation: '@Component marks a class as an Angular component and configures its template, styles, and selector. Why others fail: (A) @NgModule groups components/services into a module. (C) @Injectable marks services for DI. (D) @Directive adds behavior without templates.',
  topicPath: 'components',
}
```
✅ **Better:** Options are balanced, all plausible, detailed explanation shown only after answer.

---

### Example 2: Signals - Code Block Answer

**BEFORE (current):**
```typescript
{
  id: 5,
  question: 'What does count() return after this code runs?',
  code: `const count = signal(0);
count.set(5);
count.update(n => n * 2);`,
  options: ['0', '5', '10', '25'],
  answer: 2,
  explanation: 'signal(0) creates a signal with initial value 0. set(5) replaces it...'
}
```
❌ **Problem:** Tiny options, easy to guess once you understand signals.

**AFTER (refactored):**
```typescript
{
  id: 5,
  question: 'What does count() return after this code runs?',
  code: `const count = signal(0);
count.set(5);
count.update(n => n * 2);`,
  options: [
    'count() returns the original value (0)',
    'count() returns 5 (the last set() value)',
    'count() returns 10 (5 * 2)',
    'count() returns 25 (5 * 5)'
  ],
  answer: 2,
  explanation: 'set(5) replaces the value with 5. update(n => n * 2) reads current value (5) and sets it to 5 * 2 = 10. Why others fail: (A) Initial value (0) is not returned. (B) set() changed the value before update() ran. (D) Would require 5 * 5, not multiplication by 2.',
  topicPath: 'signals',
}
```
✅ **Better:** Options explain what each would do, balanced length, plausible.

---

### Example 3: RxJS - Spot-the-Bug with Code Options

**BEFORE (current):**
```typescript
{
  id: 11,
  question: 'This RxJS observable chain has a bug. What is it?',
  code: `of(1, 2, 3).pipe(
  filter(n => n > 1),
  map(n => n * 10),
).subscribe(console.log);`,
  options: [
    'of() cannot emit multiple values',
    'filter() must be called before map()',
    'subscribe() should be called before pipe()',
    'The code is correct and logs: 20, 30'
  ],
  answer: 3,
  explanation: 'This code is actually correct...'
}
```
❌ **Problem:** Options vary wildly in length and plausibility.

**AFTER (refactored):**
```typescript
{
  id: 11,
  question: 'Which chain has the bug (wrong order)?',
  options: [
    `of(1, 2, 3).pipe(
  filter(n => n > 1),
  map(n => n * 10)
)`,
    `of(1, 2, 3).pipe(
  map(n => n * 10),
  filter(n => n > 10)
)`,
    `of(1, 2, 3).pipe(
  filter(n => n > 1),
  concatMap(n => of(n * 10))
)`,
    `of(1, 2, 3).pipe(
  switchMap(n => of(n)),
  map(n => n * 10)
)`
  ],
  answer: 1,  // Correct: filter then map works fine
  explanation: 'All these examples actually work. The "bug" is a trick question testing if you understand operator order. Filter before map is common and correct. The answer showing "Correct chain" is the one without issues.',
  topicPath: 'rxjs-operators',
}
```
✅ **Better:** Code blocks as answers, all roughly equal visual weight, all plausible.

---

### Example 4: Forms - Make Wrong Answers Plausible

**BEFORE (current):**
```typescript
{
  id: 13,
  question: 'What is the difference between Template-driven and Reactive forms?',
  options: [
    'Template-driven forms are faster; reactive forms are more powerful',
    'Template-driven forms use ngModel and are defined in the template; reactive forms define the structure in the class with FormControl/FormGroup',
    'They are the same API with different syntax',
    'Reactive forms work with signals; template-driven forms do not'
  ],
  answer: 1,
  explanation: '...'
}
```
❌ **Problem:** Option B is WAY longer than others. Also "They are the same API" is obviously wrong.

**AFTER (refactored):**
```typescript
{
  id: 13,
  question: 'Template-driven vs Reactive forms — which statement is accurate?',
  options: [
    'Template-driven forms are defined in the component; Reactive forms are defined in the template.',
    'Template-driven uses ngModel and template directives; Reactive uses FormControl/FormGroup in the component.',
    'Template-driven is better for complex forms; Reactive is better for simple forms.',
    'Reactive forms automatically update the template; Template-driven forms do not.'
  ],
  answer: 1,
  explanation: 'Template-driven (FormsModule) derives the form model from the template using ngModel directives — simple but hard to test. Reactive (ReactiveFormsModule) defines the model in the component with FormControl/FormGroup — explicit, testable, required for complex forms. Why others fail: (A) Reversed. (C) Opposite (Reactive is better for complex). (D) Both update the template via two-way binding.',
  topicPath: 'forms',
}
```
✅ **Better:** All options similar length, all sound plausible, all about the same concept.

---

### Example 5: Testing - Code Block Showing What's Wrong

**BEFORE (current):**
```typescript
{
  id: 18,
  question: 'This test has a bug. What is it?',
  code: `it('should fetch user', () => {
  const req = httpMock.expectOne('/api/user/1');
  req.flush({ id: 1, name: 'John' });
  // Missing verification!
});`,
  options: [
    'expectOne() should be expectOneRequest()',
    'flush() should be called before expectOne()',
    'httpMock.verify() should be called in afterEach',
    'The test cannot work without a real HTTP server'
  ],
  answer: 2,
  explanation: '...'
}
```
❌ **Problem:** Options vary in plausibility. Wrong answers don't sound equally convincing.

**AFTER (refactored):**
```typescript
{
  id: 18,
  question: 'Which test setup correctly uses HttpTestingController?',
  options: [
    `it('should fetch user', () => {
  const req = httpMock.expectOne('/api/user/1');
  req.flush({ id: 1, name: 'John' });
});
afterEach(() => httpMock.verify());`,
    `it('should fetch user', () => {
  const req = httpMock.expectOne('/api/user/1');
  httpMock.verify();
  req.flush({ id: 1, name: 'John' });
});`,
    `it('should fetch user', () => {
  httpMock.verify();
  const req = httpMock.expectOne('/api/user/1');
  req.flush({ id: 1, name: 'John' });
});`,
    `it('should fetch user', () => {
  const req = httpMock.expectOne('/api/user/1');
  req.flush({ id: 1, name: 'John' });
  http.get('/api/user/1').subscribe();
});`
  ],
  answer: 0,
  explanation: 'httpMock.verify() should be called in afterEach() to catch unexpected requests. It checks if all expected HTTP requests were made and no extra requests happened. Why others fail: (B) verify() called too early, before the HTTP call completes. (C) verify() called before expectOne(), which is wrong order. (D) Calls the API again after the test, polluting the mock state.',
  topicPath: 'testing',
}
```
✅ **Better:** All code blocks, roughly equal visual weight, all plausible workflows.

---

## Pattern Summary

### For Multiple Choice (Text Options)
- ✅ All options **same length** (roughly)
- ✅ All options **plausible** (sound like they could be right)
- ✅ Wrong answers explain **alternative concepts**, not just "incorrect"
- ✅ Correct answer is only obvious if you **know the concept**

### For Spot-the-Bug / Predict-Output (Code Options)
- ✅ Use **code blocks** instead of text descriptions
- ✅ All code blocks **roughly equal visual weight**
- ✅ All options are **syntactically valid** but semantically different
- ✅ User must understand **why** one is correct, not just guess

### For Explanations (Shown AFTER answering)
- ✅ **Detailed** explanation of correct answer
- ✅ **Why others fail** section for each wrong option
- ✅ **Educational tone** (explain concepts, not just "this is wrong")
- ✅ **topicPath** linking to relevant lesson

---

## Next Steps

When we refactor all 200:

1. **For each challenge:**
   - Rewrite options to be balanced length
   - Use code blocks where appropriate (especially for technical questions)
   - Make wrong answers plausible
   - Enhance explanation with "Why others fail"

2. **Preserve:**
   - Challenge ID, type, difficulty, category
   - Question text (mostly)
   - Code snippets in questions (if present)
   - topicPath

3. **Test:**
   - After refactoring, verify:
     - Options are balanced length
     - Correct answer isn't obvious by text length
     - Can't just pick the longest/shortest option

---

## Categories to Refactor (200 challenges)

- Components (IDs 1-12) — 12 challenges
- Signals (IDs 13-18) — 6 challenges
- RxJS (IDs 19-30) — 12 challenges
- Forms (IDs 31-45) — 15 challenges
- Routing (IDs 46-60) — 15 challenges
- Testing (IDs 61-75) — 15 challenges
- Performance (IDs 76-90) — 15 challenges
- TypeScript (IDs 91-200) — 110 challenges

---

**Status:** Sample created ✅  
**Next session:** Apply pattern to all 200 challenges  
**Token estimate:** ~30-40k tokens (might want to do in 2-3 batches)

---

Review these 5 examples and see if you like the style! Let me know which patterns you want to adjust before we apply to all 200. 👊
