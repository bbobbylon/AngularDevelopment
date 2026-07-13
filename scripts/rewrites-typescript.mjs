/** Length-balanced option rewrites for the `typescript` category.
 * Skips the already-balanced #21/#145/#168/#217. Answer indices unchanged
 * (#144 and #146 stay 0; the rest stay 1). Depth lives in each (untouched)
 * explanation. Backtick strings — no option contains a backtick or ${ . */
export default {
  22: { answer: 1, options: [
    `They are completely identical — use whichever one feels natural to you`,
    `interface supports declaration merging and extends; type supports unions`,
    `type is only for primitive values, while interface is only for object shapes`,
    `interface is deprecated; type is now the modern standard to use`,
  ] },
  23: { answer: 1, options: [
    `getUser() should return a Promise instead of a plain union type`,
    `user may be undefined; strict null checks block the unsafe access`,
    `console.log does not accept objects; you must convert to a string`,
    `Arrow functions inside arrays need an explicit return type annotation`,
  ] },
  24: { answer: 1, options: [
    `{ id: number; name: string } — the mapped type applies no changes`,
    `{ readonly id: number; readonly name: string } — all props readonly`,
    `{ id: Readonly<number>; name: Readonly<string> } — each value wrapped`,
    `A type error — readonly cannot be applied to primitive properties`,
  ] },
  46: { answer: 1, options: [
    `string — it allows any arbitrary property name at all`,
    `"host" | "port" | "debug" — a union of literal key names`,
    `string | number | boolean — the union of the value types`,
    `never — the object has no valid keys to extract`,
  ] },
  47: { answer: 1, options: [
    `Makes the array fully immutable at runtime, blocking push and splice`,
    `Narrows to readonly ["admin","editor","viewer"], enabling union types`,
    `Converts the array into a const enum at compile time instead`,
    `Stops the array's literal values from being tree-shaken from the bundle`,
  ] },
  143: { answer: 1, options: [
    `It creates a type with only the first half of User's properties`,
    `It makes every property of User optional by adding ? to each`,
    `It removes all optional properties, leaving only the required ones`,
    `It is roughly equivalent to the type User | undefined`,
  ] },
  144: { answer: 0, options: [
    `Pick keeps named properties; Omit excludes named properties`,
    `Pick only works on interfaces, whereas Omit works on classes`,
    `Omit is deprecated now — you should always use Pick instead`,
    `They are identical when used on the same set of properties`,
  ] },
  146: { answer: 0, options: [
    `typeof gets a value's type; keyof gets the union of its keys`,
    `It is basically equivalent to Object.keys() but at runtime`,
    `typeof gets the class; keyof then lists that class's methods`,
    `They are separate operators that cannot be chained together`,
  ] },
  147: { answer: 1, options: [
    `T must be a real class instance rather than just a plain object literal`,
    `T is any non-primitive: object, array or function, never a primitive`,
    `T must implement a specific interface literally named "object"`,
    `T is guaranteed to have at least one property defined on it`,
  ] },
  148: { answer: 1, options: [
    `Both evaluate to "yes" — every value extends string in some way`,
    `"yes" for "hello" (extends string); "no" for number (does not)`,
    `TypeScript throws — conditional types cannot use string literals`,
    `"yes" for number, since Number objects have a string form`,
  ] },
  149: { answer: 1, options: [
    `It returns the function's argument types as a tuple`,
    `infer R captures and names the function's return type in the branch`,
    `It stops any generic function from ever returning an undefined value`,
    `infer is a runtime keyword, so this executes on each function call`,
  ] },
  150: { answer: 1, options: [
    `It counts how many parameters a given function declares`,
    `It extracts a function's parameter types as a tuple type`,
    `It validates a function's parameter count at runtime instead`,
    `Parameters<> works only on constructors, not plain functions`,
  ] },
  160: { answer: 1, options: [
    `unknown is faster at runtime; any is only a compile-time hint`,
    `any disables all checking; unknown forces a check before use`,
    `any only works on primitives; unknown works on all types`,
    `They are completely identical in TypeScript 5.0 and later`,
  ] },
  174: { answer: 1, options: [
    `It creates an array of User objects indexed by string keys`,
    `An object type: string keys, User values, like an index signature`,
    `It records every change made to User objects for an undo/redo stack`,
    `It maps a User object down to a string for serialization`,
  ] },
  182: { answer: 1, options: [
    `It adds the required HTML attribute to every form input of type T`,
    `It makes all properties of T required — the inverse of Partial<T>`,
    `It forces a class to implement every member of an interface T`,
    `It is basically equivalent to NonNullable<T> on the type`,
  ] },
  190: { answer: 1, options: [
    `A union type that excludes one member using Exclude<T, U>`,
    `A union of shapes with a shared tag that TS narrows on`,
    `A union that only accepts values defined in a named enum`,
    `A union where only one member can be assigned — an XOR type`,
  ] },
  198: { answer: 1, options: [
    `A runtime validator TypeScript generates and runs before calls`,
    `A function returning boolean typed "value is Type", used to narrow`,
    `A try/catch wrapper that catches TypeScript type errors at runtime`,
    `Type guards only work on primitives; use instanceof for objects`,
  ] },
  215: { answer: 1, options: [
    `string | number — each value widened to the Record's value type`,
    `number — satisfies validates the shape without widening types`,
    `any — the satisfies operator erases the specific types`,
    `3000 — the exact literal type is preserved by satisfies`,
  ] },
  216: { answer: 1, options: [
    `Marking every single property in each variant as readonly`,
    `A shared tag narrows cases; a never default catches new ones`,
    `Wrapping the whole union inside a single interface`,
    `Using a real enum instead of string literals for the kind field`,
  ] },
  293: { answer: 1, options: [
    `A User type where the password property is made optional`,
    `Every User property except password — strips one named field`,
    `A type containing only the password property of User`,
    `A runtime User object with the password field deleted from it`,
  ] },
  294: { answer: 1, options: [
    `key can be absolutely any arbitrary string value that is passed in`,
    `key is limited to obj's real keys; T[K] types the exact return`,
    `The function always returns a value typed as any`,
    `T and K are required to be exactly the same type`,
  ] },
  295: { answer: 1, options: [
    `It merges both of the shapes together into a single combined object`,
    `A shared literal tag lets TS narrow to one member per branch`,
    `It requires classes and inheritance in order to work`,
    `It disables type checking on the union's members`,
  ] },
  296: { answer: 1, options: [
    `A runtime object that is already populated with event handler functions`,
    `A type remapping each key K via the as clause and a template literal`,
    `This syntax only ever works on array types, nothing else`,
    `It requires a decorator to actually run at runtime`,
  ] },
};
