/** Rebalance pass: lengthen the correct answer with genuine clarifying detail so
 * it becomes the strictly-longest option, on a representative subset of
 * "typescript" MC questions. Distractor text and answer index unchanged. Also
 * doubles as the fix for id 190, which was strictly-shortest. */
export default {
  190: { answer: 1, options: [
    `A union type that excludes one member using Exclude<T, U>`,
    `A union of object shapes that all share one common literal tag property TS can narrow on`,
    `A union that only accepts values defined in a named enum`,
    `A union where only one member can be assigned — an XOR type`,
  ] },
  144: { answer: 0, options: [
    `Pick<T,K> keeps only the named properties; Omit<T,K> excludes those named properties instead`,
    `Pick only works on interfaces, whereas Omit works on classes`,
    `Omit is deprecated now — you should always use Pick instead`,
    `They are identical when used on the same set of properties`,
  ] },
  149: { answer: 1, options: [
    `It returns the function's argument types as a tuple`,
    `infer R captures and names the function's return type so it can be reused in the true branch`,
    `It stops any generic function from ever returning an undefined value`,
    `infer is a runtime keyword, so this executes on each function call`,
  ] },
  160: { answer: 1, options: [
    `unknown is faster at runtime; any is only a compile-time hint`,
    `any disables type checking entirely; unknown forces a narrowing check before it can be used`,
    `any only works on primitives; unknown works on all types`,
    `They are completely identical in TypeScript 5.0 and later`,
  ] },
  293: { answer: 1, options: [
    `A User type where the password property is made optional`,
    `Every property of User except password — Omit strips that one named field out`,
    `A type containing only the password property of User`,
    `A runtime User object with the password field deleted from it`,
  ] },
  24: { answer: 1, options: [
    `{ id: number; name: string } — the mapped type applies no changes`,
    `{ readonly id: number; readonly name: string } — the mapped type makes every property readonly`,
    `{ id: Readonly<number>; name: Readonly<string> } — each value wrapped`,
    `A type error — readonly cannot be applied to primitive properties`,
  ] },
  47: { answer: 1, options: [
    `Makes the array fully immutable at runtime, blocking push and splice`,
    `Narrows the array to a readonly tuple of the literal strings, which is what enables the union type`,
    `Converts the array into a const enum at compile time instead`,
    `Stops the array's literal values from being tree-shaken from the bundle`,
  ] },
};
