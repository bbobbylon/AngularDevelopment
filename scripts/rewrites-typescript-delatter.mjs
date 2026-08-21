// Rewrites for 14 'typescript'-category questions whose explanations referenced
// distractors by original (pre-shuffle) letter (e.g. "A is wrong", "C describes...").
// Each explanation below has been rewritten to identify distractors by their actual
// content instead of by letter position, per scripts/apply-option-rewrites.mjs's contract.
// options/answer are verbatim copies of the original (unshuffled) values — unchanged.

export default {
  143: {
    options: [
      "It creates a type with only the first half of User's properties",
      "It makes every property of User optional by adding ? to each",
      "It removes all optional properties, leaving only the required ones",
      "It is roughly equivalent to the type User | undefined"
    ],
    answer: 1,
    explanation: "`Partial<T>` maps every property of `T` to `T[K] | undefined` with `?`. Example: `Partial<{ name: string; age: number }>` becomes `{ name?: string; age?: number }`. Perfect for PATCH request payloads or update functions where you only supply changed fields. The claim that it only keeps the first half of User's properties is wrong — Partial retains every property, it just marks each one optional rather than dropping any of them. Removing all optional properties to leave only the required ones describes something closer to the inverse of `Required<T>`, not what `Partial` does. And treating it as roughly equivalent to `User | undefined` is wrong too — that would make the whole object nullable as a unit, not each property individually; `Partial` operates property-by-property, not on the object as a whole."
  },
  144: {
    options: [
      "Pick<T,K> keeps only the named properties; Omit<T,K> excludes those named properties instead",
      "Pick only works on interfaces, whereas Omit works on classes",
      "Omit is deprecated now — you should always use Pick instead",
      "They are identical when used on the same set of properties"
    ],
    answer: 0,
    explanation: "`Pick<User, \"name\" | \"email\">` creates a type with ONLY `name` and `email`. `Omit<User, \"password\">` creates a type with all User properties EXCEPT `password`. They can produce the same result but from opposite directions. Use `Pick` when you know exactly which properties you want; use `Omit` when you want most properties minus a few sensitive ones (like password). The idea that Pick is restricted to interfaces while Omit is restricted to classes is wrong — both are generic utility types that operate on any object type, whether an interface, a type alias, or a class's instance type. Calling Omit deprecated in favor of Pick is also wrong — both are actively maintained, complementary utilities in the standard lib, not a superseded/replacement pair. And calling them identical when used on the same set of properties is wrong too — given the same key set K, `Pick<T,K>` and `Omit<T,K>` produce complementary, not equal, results: one keeps exactly those keys, the other keeps everything except them."
  },
  145: {
    options: [
      "{ host: string; port: number }",
      "{ readonly host: \"localhost\"; readonly port: 3000 }",
      "Readonly<{ host: string; port: number }>",
      "The code throws — as const cannot be used on object literals"
    ],
    answer: 1,
    explanation: "`as const` creates a deeply readonly type where each value is narrowed to its literal type — `\"localhost\"` not `string`, `3000` not `number`. This prevents accidental mutation and enables exhaustive type checking. `{ host: string; port: number }` is just the widened type you'd get without `as const`. `Readonly<{ host: string; port: number }>` is wrong too — wrapping in `Readonly<>` only adds the `readonly` modifier to each property, it does not narrow the values down to their literal types. And the claim that the code throws is wrong — `as const` is specifically designed to work on object (and array) literals; it's a compile-time assertion with zero runtime effect, so nothing throws."
  },
  146: {
    options: [
      "typeof gets a value's type; keyof gets the union of its keys",
      "It is basically equivalent to Object.keys() but at runtime",
      "typeof gets the class; keyof then lists that class's methods",
      "They are separate operators that cannot be chained together"
    ],
    answer: 0,
    explanation: "`const Colors = { RED: \"#f00\", GREEN: \"#0f0\" } as const; type ColorKey = keyof typeof Colors` produces `\"RED\" | \"GREEN\"`. `typeof Colors` gets the type of the object; `keyof` extracts the union of its keys. This is used extensively for typed dictionaries, enum-like objects, and Angular `@Input` validators. Treating it as basically `Object.keys()` at runtime is wrong — it is a type-level operation that exists only at compile time and produces no runtime value or array. Saying `typeof` gets a class and `keyof` then lists that class's methods is wrong too — `typeof` works on any value (object literals, consts, functions), not just classes, and `keyof` returns the union of all key names on the resulting type, not specifically its methods. And claiming the two operators can't be chained together is wrong — chaining them is exactly the point of the `keyof typeof` pattern shown above."
  },
  147: {
    options: [
      "T must be a real class instance rather than just a plain object literal",
      "T is any non-primitive: object, array or function, never a primitive",
      "T must implement a specific interface literally named \"object\"",
      "T is guaranteed to have at least one property defined on it"
    ],
    answer: 1,
    explanation: "`T extends object` in TypeScript means T must be assignable to the `object` type — i.e., any non-primitive (not string, number, boolean, bigint, symbol, null, undefined). This is useful when you need to use `Object.keys(val)` safely inside the function. The idea that T must be a real class instance rather than a plain object literal is wrong — plain object literals `{}` satisfy `extends object` just fine, no class or constructor is required. The idea that T must implement a specific interface literally named \"object\" is wrong too — `object` is a built-in structural type meaning \"any non-primitive value\", not a nominal interface you implement; arrays and functions satisfy it as well, with no shared member shape to implement. And the claim that T is guaranteed to have at least one property is wrong — `{}` with no properties at all still satisfies the constraint."
  },
  148: {
    options: [
      "Both evaluate to \"yes\" — every value extends string in some way",
      "\"yes\" for \"hello\" (extends string); \"no\" for number (does not)",
      "TypeScript throws — conditional types cannot use string literals",
      "\"yes\" for number, since Number objects have a string form"
    ],
    answer: 1,
    explanation: "Conditional types evaluate the `extends` condition at compile time. `\"hello\" extends string` is `true` → resolves to `\"yes\"`. `number extends string` is `false` → resolves to `\"no\"`. This pattern is powerful for creating type-level logic used in library types like `NonNullable<T>`, `ReturnType<T>`, and Angular's `InputSignal` types. The claim that both cases resolve to \"yes\" because every value extends string in some way is wrong — TypeScript's structural type system does not consider `number` assignable to `string`; only string literal types and `string` itself satisfy that branch. The claim that TypeScript throws because conditional types cannot use string literals is wrong — string literal types are ordinary types, fully supported both as the type being checked and as the branches of a conditional type; nothing here is invalid syntax. And the claim that `number` resolves to \"yes\" because Number objects have a string form is wrong — runtime coercion via `toString()` has no bearing on the type-level `extends` check, which only evaluates structural assignability between types, not runtime conversion behavior."
  },
  149: {
    options: [
      "It returns the function's argument types as a tuple",
      "infer R captures and names the function's return type so it can be reused in the true branch",
      "It stops any generic function from ever returning an undefined value",
      "infer is a runtime keyword, so this executes on each function call"
    ],
    answer: 1,
    explanation: "`infer` is TypeScript's way to \"pattern match and capture\" a type within conditional types. Here, if `T` is a function, `infer R` captures its return type into `R`. This is how `ReturnType<T>` is defined in TypeScript's standard library. The claim that it returns the function's argument types as a tuple is wrong — `infer R` here is positioned to capture the RETURN type, not the parameter list (that's what `Parameters<T>` does by placing `infer` on the arguments instead). The claim that it stops a generic function from ever returning undefined is wrong — `ReturnOf` is purely descriptive; if the function genuinely returns `undefined`, `R` simply gets inferred as `undefined` (or a union including it), there's no enforcement or exclusion happening. And the claim that `infer` is a runtime keyword executing on each call is wrong — it's purely a compile-time construct used only during type checking; it has no runtime representation and no JavaScript is emitted for it."
  },
  150: {
    options: [
      "It counts how many parameters a given function declares",
      "It extracts a function's parameter types as a tuple type",
      "It validates a function's parameter count at runtime instead",
      "Parameters<> works only on constructors, not plain functions"
    ],
    answer: 1,
    explanation: "`Parameters<T>` extracts function parameter types as a tuple. `function save(id: number, name: string) {}; type Args = Parameters<typeof save>` gives `[id: number, name: string]`. Combined with spread: `function memoize<T extends (...args: never[]) => unknown>(fn: T) { return (...args: Parameters<T>) => fn(...args); }`. The claim that it counts how many parameters a function declares is wrong — it produces a tuple TYPE describing each parameter's type, not a numeric count. The claim that it validates parameter count at runtime is wrong — like all utility types, it exists purely at compile time and has no runtime behavior at all. And the claim that it only works on constructors is wrong — `Parameters<T>` works on any function type; it's the separate `ConstructorParameters<T>` utility that specifically targets constructor signatures."
  },
  160: {
    options: [
      "unknown is faster at runtime; any is only a compile-time hint",
      "any disables type checking entirely; unknown forces a narrowing check before it can be used",
      "any only works on primitives; unknown works on all types",
      "They are completely identical in TypeScript 5.0 and later"
    ],
    answer: 1,
    explanation: "`any` opts out of TypeScript entirely — no errors regardless of how you use it. `unknown` is the type-safe \"escape hatch\" — everything is assignable to it, but TypeScript forces you to narrow (`typeof x === \"string\"`, `instanceof MyClass`) before operating on it. Prefer `unknown` over `any` for untyped external data (API responses, JSON.parse results). The claim that unknown is faster at runtime while any is just a compile-time hint is wrong — both are purely compile-time constructs that are erased entirely when TypeScript compiles to JavaScript; neither has any runtime cost or representation, so there's no runtime speed difference to speak of. The claim that any is restricted to primitives while unknown works on all types is wrong — it's actually the opposite kind of distinction: both types can hold any value whatsoever (primitives, objects, functions, arrays); the real difference is how much checking TypeScript performs before you're allowed to use the value. And the claim that they became identical in TypeScript 5.0 is wrong — the narrowing requirement for `unknown` versus the free-for-all behavior of `any` has been a stable, unchanged distinction since `unknown` was introduced in TypeScript 3.0, with no version having merged their behavior."
  },
  168: {
    options: [
      "\"done\" | \"success\" | \"error\" | \"pending\"",
      "\"done\" | \"error\" | \"pending\"",
      "string",
      "\"done\" | Result"
    ],
    answer: 1,
    explanation: "TypeScript's control flow analysis narrows types through conditional expressions. In the false branch of `r === \"success\" ? ... : r`, TypeScript knows `r` cannot be `\"success\"` (it was eliminated in the true branch), so the type narrows to `\"error\" | \"pending\"`. The full type of `result` is `\"done\" | \"error\" | \"pending\"`. This is discriminated union narrowing in action. `\"done\" | \"success\" | \"error\" | \"pending\"` is too wide — it fails to account for the narrowing that excludes `\"success\"` from the false branch. `string` is wrong — TypeScript keeps the literal union narrow here rather than widening it to the general `string` type. And `\"done\" | Result` is wrong too — that would re-include `\"success\"` via the full `Result` union, ignoring that the false branch has already had `\"success\"` narrowed away."
  },
  174: {
    options: [
      "It creates an array of User objects indexed by string keys",
      "An object type: string keys, User values, like an index signature",
      "It records every change made to User objects for an undo/redo stack",
      "It maps a User object down to a string for serialization"
    ],
    answer: 1,
    explanation: "`Record<K, V>` is a mapped type that creates an object type with keys of type `K` and values of type `V`. `Record<string, User>` is equivalent to `{ [key: string]: User }`. Use it for dictionaries: `Record<UserId, User>`, `Record<\"loading\" | \"success\" | \"error\", boolean>`. The claim that it creates an array of User objects is wrong — `Record` always produces a plain object type with an index signature, never an array type. The idea that it records every change made to User objects for an undo/redo stack is wrong — `Record` is a static type-level utility with no runtime behavior or history tracking whatsoever; it just describes a shape. And the claim that it maps a User object down to a string for serialization is wrong too — `Record<string, User>` runs in the opposite direction, describing string keys mapping TO User values, not a User being reduced to a string."
  },
  182: {
    options: [
      "It adds the required HTML attribute to every form input of type T",
      "It makes all properties of T required — the inverse of Partial<T>",
      "It forces a class to implement every member of an interface T",
      "It is basically equivalent to NonNullable<T> on the type"
    ],
    answer: 1,
    explanation: "`Required<T>` removes `?` from every property, making them all mandatory. `Required<{ name?: string; age?: number }>` becomes `{ name: string; age: number }`. Use it when you receive a Partial (e.g., from an API patch endpoint) and need to assert that you have filled all required fields before saving. The claim that it adds the HTML `required` attribute to form inputs is wrong — `Required<T>` is a purely type-level transformation on TypeScript types; it has nothing to do with HTML template attributes or form validation at runtime. The claim that it forces a class to implement every interface member is wrong too — that's just how implementing an interface normally works regardless of `Required`; `Required<T>` instead operates on an already-existing type to strip optionality from its properties. And treating it as basically equivalent to `NonNullable<T>` is wrong — `NonNullable` removes `null | undefined` from the type itself, whereas `Required` removes the `?` optionality modifier from properties; a property can be required yet still typed to allow `null`, so the two are distinct."
  },
  190: {
    options: [
      "A union type that excludes one member using Exclude<T, U>",
      "A union of object shapes that all share one common literal tag property TS can narrow on",
      "A union that only accepts values defined in a named enum",
      "A union where only one member can be assigned — an XOR type"
    ],
    answer: 1,
    explanation: "Discriminated unions are the TypeScript way to model \"states with different shapes\". After `if (state.status === \"success\")`, TypeScript knows `state.data: User` exists. In Angular, this pattern models loading states, form states, or any \"tagged variant\" data cleanly — no optional properties, no `null` checks everywhere, exhaustive switch statements. Describing it as a union that excludes one member via `Exclude<T, U>` is wrong — `Exclude` is a separate utility type for removing members from a union entirely, unrelated to the shared-tag narrowing that defines a discriminated union. Describing it as a union restricted to values from a named enum is wrong — the shared literal tag can be a plain string or number literal type, no `enum` declaration is required at all. And describing it as an XOR type where only one member can ever be assigned is wrong — any single variant of the union can be assigned like normal; the defining feature is just that each variant carries a distinct literal tag TypeScript can switch or narrow on, not some exclusivity constraint on assignment."
  },
  198: {
    options: [
      "A runtime validator TypeScript generates and runs before calls",
      "A function returning boolean typed \"value is Type\", used to narrow",
      "A try/catch wrapper that catches TypeScript type errors at runtime",
      "Type guards only work on primitives; use instanceof for objects"
    ],
    answer: 1,
    explanation: "User-defined type guards use the `value is Type` return type syntax. When the function returns `true`, TypeScript narrows the type of `value` to `Type` in the enclosing `if` block. They are essential for narrowing `unknown` API responses, discriminated unions, and any \"is this thing of type X?\" check. Describing it as a runtime validator TypeScript automatically generates and runs before calls is wrong — TypeScript never auto-generates or auto-inserts any runtime code for you; you write the guard's runtime logic yourself, and TypeScript only uses the `value is Type` annotation to trust your narrowing at compile time. Describing it as a try/catch wrapper that catches TypeScript type errors at runtime is wrong too — there is no such thing as a \"TypeScript type error\" occurring at runtime to catch; type errors are caught by the compiler before the code ever runs, and a type guard is just an ordinary function, not an exception-handling construct. And the claim that type guards only work on primitives is wrong — they work with any type, including class instances, interfaces, and discriminated union members; `instanceof` is just one particular narrowing mechanism, not a required replacement for object types."
  }
};
