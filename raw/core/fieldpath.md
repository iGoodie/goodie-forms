# FieldPath.ts

> Reference for the FieldPath namespace

## Overview

```ts
export namespace FieldPath
```

`FieldPath` is the core abstraction behind form field management in the library.
It provides a **type-safe**, **runtime-aware** path system for **reading, writing, modifying, and deleting** deeply nested values inside complex objects — including arrays.

At *runtime*, it handles:

- Converting between `["user", "address", 0, "city"]` and `"user.address[0].city"`
- Safely walking object trees (with auto-creation of missing branches)
- **Getting, setting, modifying, and deleting** deeply nested values
- Comparing and matching hierarchical paths

At the *type level*, it provides:

- Fully inferred string paths ("user.address<span>

0

</span>

.city")
- Compile-time validation of valid object paths
- Deep type resolution (`FieldPath.Resolve<TObject, TPath>`)
- Smart array index handling with **IntelliSense** support

In short, `FieldPath` ensures that form fields remain **structurally safe**, **deeply typed**, and **predictable**, whether you interact with them using string paths or segment arrays.
It acts as the **backbone** that keeps form state manipulation both **ergonomic** and **strongly** typed.

---

## Type Aliases

### 📗 `Segments`

<doc-ref-section>

```ts
export type Segments = readonly PropertyKey[];
```

`Segments` is the **canonical**, **low-level** representation of an object path.
Each entry corresponds to one navigation step inside an object or array.

It supports:

- `string` → object keys
- `number` → array indicecs
- `symbol` → symbol keys

This format is what all runtime operations (`getValue()`, `setValue()`, `walkPath()`, etc.) operate on internally.

#### Examples

```ts
const path: FieldPath.Segments = ["user", "addresses", 0, "city"];
// ^ Represents obj.user.addresses[0].city
```

```ts
const path: FieldPath.Segments = ["grid". 10, 20, "coord", "x"]
// ^ Represents obj.grid[10][20].coord.x
```

```ts
const META = Symbol("meta");
const path: FieldPath.Segments = ["user", META, "createdAt"];
// ^ Represents: obj.user[META].createdAt
```

</doc-ref-section>

### 📗 `StringPath`

<doc-ref-section>

```ts
export type StringPath = string;
```

`StringPath` is the string representation of a field path.
It encodes deep object access using **dot notation** and **bracket indices**.

This is the **ergonomic**, **user-facing format** designed for APIs and declarative bindings — internally,
it is parsed and normalized into `Segments` before any operation is performed.

Format Rules

- `.` separates object properties
- `[number]` represents array indices
- Nested structures combine both

#### Examples

```ts
const path: FieldPath.StringPath = "user.addresses[0].city";
// ^ Equivalent to: ["user", "addresses", 0, "city"]
```

```ts
const path: FieldPath.StringPath = "grid[10][20].coord.x";
// ^ Equivalent to: ["grid", 10, 20, "coord", "x"]
```

<tip>

`StringPath` values can be converted to `Segments` using `FieldPath.fromStringPath()`,
and `Segments` can be serialized back using `FieldPath.toStringPath()`.

</tip>

<tip>

An union of valid string-paths on a given `TObj extends object` can be extracted via `FieldPath.StringPaths<TObj>`,
enabling fully type-safe deep field references.

</tip>
</doc-ref-section>

## Type Helpers

### 📗 `Resolve<>`

<doc-ref-section>

```ts
export type Resolve<
  TObject,
  TPath extends FieldPath.Segments,
>;
```

`Resolve<>` computes the **exact value type** located at a given path.

Given an object type and a `FieldPath.Segments` path, it recursively walks the type and produces the type that exists at the end of that path — including proper array index resolution and nullability handling.

It is the foundation that makes `getValue()`, `setValue()`, and `modifyValue()` fully type-safe.

`Resolve<>` is what bridges a structural path (`FieldPath.Segments`) with precise static type inference.

#### Examples

```ts
interface Model {
  user: {
    addresses: { city: string }[];
  };
}

type User = FieldPath.Resolve<Model, ["user"]>;
//   ^? { addresses: { city:string }[] }

type Addresses = FieldPath.Resolve<Model, ["user", "addresses"]>;
//   ^? { city:string }[]

type Address = FieldPath.Resolve<Model, ["user", "addresses", 0]>;
//   ^? { city:string }
type Address = FieldPath.Resolve<Model, ["user", "addresses", 99]>;
//   ^? { city:string }
type Address = FieldPath.Resolve<Model, ["user", "addresses", number]>;
//   ^? { city:string }

type City = FieldPath.Resolve<Model, ["user", "addresses", 0, "city"]>;
//   ^? string

type Nonexistent = FieldPath.Resolve<
  Model,
  ["invalid", "or", "missing", "field"]
>;
//   ^? never
```

```ts
const META = Symbol("meta");
type META = typeof META;

interface Model {
  [META]: { createdAt: Date };
}

type Meta = FieldPath.Resolve<Model, [META]>;
//   ^? { createdAt: Date }
```

<note>

If a path **does not exist** on the object, the resulting type becomes `never`, preventing invalid deep access at compile time.

</note>
</doc-ref-section>

### 📗 `StringPaths<>`

<doc-ref-section>

```ts
export type StringPaths<TObject extends object>;
```

`StringPaths<>` generates the **complete union of all valid string paths** for a given object type `TObject`.

It **statically analyzes** the structure of `TObject` and produces *dot/bracket-notation* paths that accurately reflect:

- Nested objects
- Arrays (with index support)
- Deeply composed structures

This enables strict **IntelliSense auto-complete** and **compile-time validation** for string-based field access.

#### Examples

<tabs className="w-full">
<tabs-item icon="i-lucide-code" label="Code">

```ts
type Model = {
  user: {
    name: string;
    addresses: { city: string }[];
  };
};

type ModelPath = FieldPath.StringPaths<Model>;
// ^ This will yield an union identical to this:
"user" |
  "user.name" |
  "user.addresses" |
  "user.addresses[0]" |
  `user.addresses[${number}]` |
  "user.addresses[0].city" |
  `user.addresses[${number}].city`;

const paths: ModelPath[] = [
  "user",
  "user.name",
  "user.addresses[42]",
  "user.addresses[0].city",
  "user.addresses[99].city",
  // ^ ✅ Compiler is happy with these

  "user.invalid",
  // ^ ❌ Type error
];
```

</tabs-item>

<tabs-item icon="i-lucide-eye" label="IntelliSense Preview">
<note>

Due to limitations in how IntelliSense represents array indices, only `[0]` is suggested.
However, accessing an array at any index is considered a valid string path.

</note>

![IntelliSense Preview of StringPaths<>](doc/string-paths.intellisense.png)

</tabs-item>
</tabs>
</doc-ref-section>

### 📗 `ParseStringPath<>`

<doc-ref-section>

```ts
export type ParseStringPath<TStrPath extends string>;
```

`ParseStringPath<>` converts a **string path literal** into its exact `FieldPath.Segments` tuple type at compile time.

It interprets **dot notation** and **bracket indices**, producing a strongly typed path representation that can be consumed by `Resolve<>` and other `FieldPath.Segments`-based utilities.

This type is what bridges **ergonomic string literals** with the internal `FieldPath.Segments` system
— enabling full *compile-time validation* and *deep type inference* when working with **string-based field paths**.

#### Examples

```ts
type Path = FieldPath.ParseStringPath<"user.addresses[0].city">;
//   ^? ["user", "addresses", 0, "city"]
```

```ts
type IndexPath = FieldPath.ParseStringPath<"grid[10][20].x">;
//   ^? ["grid", 10, 20, "x"]
```

</doc-ref-section>

## Runtime Helpers

### 📙 `toStringPath()`

<doc-ref-section>

```ts
export function toStringPath(path: FieldPath.Segments): FieldPath.StringPath;
```

Converts a `Segments` path into its **canonical string representation**.

It **serializes** object keys using **dot notation** and array indices using **bracket notation** — *producing a normalized StringPath suitable for display, logging, storage, or public APIs.*

Behavior:

- `string` keys → `"user.name"`
- `number` indices → `"items[0]"`
- Nested structures combine both forms
- Output is always **normalized**

#### Returns

```ts
FieldPath.StringPath;
```

#### Arguments

<field-group>
<field name="path!" type="FieldPath.Segments">

Path to be converted to `StringPath`

</field>
</field-group>

#### Examples

```ts
const segments: FieldPath.Segments = ["user", "addresses", 0, "city"];

const path = FieldPath.toStringPath(segments);
//    ^? "user.addresses[0].city"
```

```ts
const path = FieldPath.toStringPath(["grid", 10, 20, "x"]);
//    ^? "grid[10][20].x"
```

</doc-ref-section>

### 📙 `fromStringPath()`

<doc-ref-section>

```ts
export function fromStringPath<TStrPath extends string>(
  stringPath: TStrPath,
): FieldPath.ParseStringPath<TStrPath>;
```

<doc-tree>
<doc-tree-item title="TStrPath">

`StringPath` to be converted to `Segments`

</doc-tree-item>
</doc-tree>

Parses a string-based path (`StringPath`) into its structural `Segments` representation.

It understands **dot notation** and **bracket indices**, producing a normalized array of property keys that can be used directly with `getValue()`, `setValue()`, `walkPath()`, and other core utilities.

When called with a **string literal**, the return type is **inferred** precisely using `ParseStringPath<>`.

#### Returns

```ts
FieldPath.ParseStringPath<TStrPath>;
```

<doc-tree>
<doc-tree-item title="TStrPath">

from `fromStringPath()`'s generics (See [fromStringPath()](#fromstringpath))

</doc-tree-item>
</doc-tree>

#### Arguments

<field-group>
<field name="stringPath!" type="FieldPath.StringPath">

Path to be converted to `Segments`

</field>
</field-group>

#### Examples

```ts
const path = FieldPath.fromStringPath("user.addresses[0].city");
//    ^? ["user", "addresses", 0, "city"]
```

```ts
const path = FieldPath.fromStringPath("grid[10][20].x");
//    ^? ["grid", 10, 20, "x"]
```

```ts
const path = FieldPath.fromStringPath("users[abc]");
//    ^? ["users", "abc"]
```

</doc-ref-section>

### 📙 `equals()`

<doc-ref-section>

```ts
export function equals(
  path1?: FieldPath.Segments,
  path2?: FieldPath.Segments,
): boolean;
```

Performs a **strict**, **segment-by-segment** comparison between **two paths**.

Returns `true` only if both paths:

- Are **defined**
- Have **the same length**
- Contain **identical segments in the same order**

No **normalization** or **coercion** is performed — *comparison is structural and exact.*

#### Returns

```ts
boolean;
```

#### Arguments

<field-group>
<field name="path1!" type="FieldPath.Segments">

First path to compare. Acts as the left-hand structural reference.

</field>

<field name="path2!" type="FieldPath.Segments">

Second path to compare. Must match `path1` exactly (**length** and **segments**) for the result to be `true`.

</field>
</field-group>

#### Examples

```ts
FieldPath.equals(
  ["user", "address", 0, "city"],
  ["user", "address", 0, "city"],
); // => true
```

```ts
FieldPath.equals(
  ["user", "address", 0, "city"],
  ["user", "address", 1, "city"],
); // => false
```

```ts
FieldPath.equals(
  ["world", "tiles", 100, 200],
  ["world", "tiles", 100, 200, "blockId"],
); // => false
```

</doc-ref-section>

### 📙 `isDescendant()`

<doc-ref-section>

```ts
export function isDescendant(
  parentPath: FieldPath.Segments,
  childPath: FieldPath.Segments,
): boolean;
```

Determines whether `childPath` is structurally nested under `parentPath`.

Returns `true` only if:

- `childPath` is strictly longer than `parentPath`, and
- Every segment of `parentPath` matches the beginning of `childPath`.

This is a **prefix check** — *not a deep comparison.*

#### Returns

```ts
boolean;
```

#### Arguments

<field-group>
<field name="parentPath!" type="FieldPath.Segments">

The potential ancestor path. Used as the prefix reference to test against.

</field>

<field name="childPath!" type="FieldPath.Segments">

The path being evaluated. Must start with all segments of `parentPath` and be strictly longer to qualify as a descendant.

</field>
</field-group>

#### Examples

```ts
FieldPath.isDescendant(
  ["user", "detail", "addresses"],
  ["user", "detail", "addresses", 0, "city"],
); // => true
```

```ts
FieldPath.isDescendant(
  ["user", "detail", "addresses"],
  ["user", "detail", "profile"],
); // => false
```

```ts
FieldPath.isDescendant(
  ["user", "addresses", 0, "city"],
  ["user", "addresses", 0, "city"],
); // => false
```

</doc-ref-section>

### 📙 `walkPath()`

<doc-ref-section>

```ts
export function walkPath<
  TObject extends object,
  const TPath extends FieldPath.Segments,
>(
  object: TObject,
  path: TPath,
  opts?: { returnOnEmptyBranch?: boolean },
): {
  target: any;
  key: PropertyKey | null;
};
```

<doc-tree>
<doc-tree-item title="TObject">

The root object type that will be traversed and potentially mutated during path walking.

</doc-tree-item>

<doc-tree-item title="TPath">

A segmented path describing where traversal should occur within `TObject`.
Its structure dictates how branches are navigated *(and created, if necessary)*.

</doc-tree-item>
</doc-tree>

Traverses `object` up to the parent container of the final segment in `TPath`,
then returns **the container** and **the last key**.

It is the internal primitive powering `setValue()`, `modifyValue()`, and `deleteValue()`.

By default, missing intermediate branches are created automatically (object or array depending on the upcoming segment).

#### Returns

```ts
{
  target: any;
  key: PropertyKey | null;
}
```

<doc-tree>
<doc-tree-item title="target">

The object that directly contains the final property.

</doc-tree-item>

<doc-tree-item title="key">

The last segment of `TPath`.
It will be `null` only when `returnOnEmptyBranch` is enabled and traversal stops early.

</doc-tree-item>
</doc-tree>

#### Arguments

<field-group>
<field name="object!" type="TObject extends object">

Root object to traverse.

</field>

<field name="path!" type="TPath extends FieldPath.Segments">

Segmented path to walk.

</field>

<field name="config.returnOnEmptyBranch?:" type="boolean">

If `true`, traversal stops and returns `{ target: null, key: null }` instead of creating missing branches.

</field>
</field-group>

#### Examples

```ts
const obj = {};

const path = ["user", "addresses", 0, "city"];
const { target, key } = FieldPath.walkPath(obj, path);
//              ^? "city"

target[key] = "Berlin";

console.log(obj);
// {
//   user: {
//     addresses: [
//       { city: "Berlin" }
//     ]
//   }
// }
```

```ts
const obj = {};

const path = ["user", "name"];
const result = FieldPath.walkPath(obj, path, {
  returnOnEmptyBranch: true,
});

console.log(result);
// { target: null, key: null }
```

</doc-ref-section>

### 📙 `getValue()`

<doc-ref-section>

```ts
export function getValue<
  TObject extends object,
  const TPath extends FieldPath.Segments,
>(object: TObject, path: TPath): FieldPath.Resolve<TObject, TPath> | undefined;
```

<doc-tree>
<doc-tree-item title="TObject">

The root object type being traversed.
All type inference and deep resolution are computed relative to this structure.

</doc-tree-item>

<doc-tree-item title="TPath">

A segmented path pointing to a nested property inside `TObject`.
Its structure determines both the runtime traversal and the inferred return type via `FieldPath.Resolve<TObject, TPath>`.

</doc-tree-item>
</doc-tree>

Reads the value located at `TPath` inside `TObject`.

The return type is fully inferred using `FieldPath.Resolve<>`.

<tip>

**Traversal is safe** — if any intermediate branch is `null` or `undefined`, the function immediately returns `undefined` instead of throwing.

</tip>

#### Returns

```ts
FieldPath.Resolve<TObject, TPath> | undefined;
```

<doc-tree>
<doc-tree-item title="TObject*">

from `getValue()`'s generics (See [getValue()](#getvalue))

</doc-tree-item>

<doc-tree-item title="TPath*">

from `getValue()`'s generics (See [getValue()](#getvalue))

</doc-tree-item>

<doc-tree-item title="FieldPath.Resolve<TOutput, TPath>">

value type of `TOutput` at given `TPath`

</doc-tree-item>
</doc-tree>

#### Arguments

<field-group>
<field name="object!" type="TObject extends object">

Root object to read from.

</field>

<field name="path!" type="TPath extends FieldPath.Segments">

Segmented path pointing to the desired value.

</field>
</field-group>

#### Examples

```ts
const data = {
  user: {
    addresses: [{ city: "Berlin" }],
  },
};

const path = ["user", "addresses", 0, "city"];
const city = FieldPath.getValue(data, path);

// city inferred as: string | undefined
// value: "Berlin"
```

```ts
const data = {};

const path = ["user", "addresses", 0, "city"];
const city = FieldPath.getValue(data, path);

// city === undefined
// no runtime error
```

</doc-ref-section>

### 📙 `setValue()`

<doc-ref-section>

```ts
export function setValue<
  TObject extends object,
  const TPath extends FieldPath.Segments,
>(object: TObject, path: TPath, value: FieldPath.Resolve<TObject, TPath>): void;
```

<doc-tree>
<doc-tree-item title="TObject">

The root object type being traversed.
Defines the full structural context in which the path will be resolved and mutated.

</doc-tree-item>

<doc-tree-item title="TPath">

A segmented path.
Determines both the target location inside `TObject` and the expected value type via `FieldPath.Resolve<TObject, TPath>`.

</doc-tree-item>
</doc-tree>

Writes `value` to `object` at the location described by `TPath`.

Missing intermediate branches are created automatically, ensuring the assignment always lands at the correct depth.

The `value` type is strictly inferred using `FieldPath.Resolve<>`, preventing invalid assignments at compile time.

#### Arguments

<field-group>
<field name="object!" type="TObject extends object">

Root object to mutate.

</field>

<field name="path!" type="TPath extends FieldPath.Segments">

Segmented path describing where the value should be written.

</field>

<field name="value!" type="FieldPath.Resolve<TObject, TPath>">

Value to assign at the given path.
Must match the exact resolved type of `TObject` at `TPath`.

</field>
</field-group>

#### Examples

```ts
const data = {};

const path = ["user", "addresses", 0, "city"];
FieldPath.setValue(data, path, "Berlin");

console.log(data);
// {
//   user: {
//     addresses: [
//       { city: "Berlin" }
//     ]
//   }
// }
```

```ts
type Model = {
  user: { age: number };
};

const model: Model = { user: { age: 18 } };

FieldPath.setValue(model, ["user", "age"], 25); // ✅
FieldPath.setValue(model, ["user", "age"], "25"); // ❌ Type error
```

</doc-ref-section>

### 📙 `modifyValue()`

<doc-ref-section>

```ts
export function modifyValue<
  TObject extends object,
  const TPath extends FieldPath.Segments,
>(
  object: TObject,
  path: TPath,
  modifier: (
    currentValue: FieldPath.Resolve<TObject, TPath> | undefined,
  ) => void,
): void;
```

<doc-tree>
<doc-tree-item title="TObject">

The root object type whose structure defines where the modification occurs.
All type inference for the current value is derived from this shape.

</doc-tree-item>

<doc-tree-item title="TPath">

A segmented path describing the exact location inside `TObject` to modify.
It determines the type of `currentValue` through `FieldPath.Resolve<TObject, TPath>`.

</doc-tree-item>
</doc-tree>

Executes a mutation function against the value located at `TPath`.

Unlike `setValue()`, this does not replace the value directly.
Instead, it provides the current value to a `modifier` callback, allowing in-place updates (e.g. pushing into arrays or mutating objects).

Missing branches are created automatically before the modifier runs.

#### Arguments

<field-group>
<field name="object!" type="TObject extends object">

Root object to mutate.

</field>

<field name="path!" type="TPath extends FieldPath.Segments">

Segmented path pointing to the value to modify.

</field>

<field name="modifier!" type="(currentValue: FieldPath.Resolve<TObject, TPath> | undefined) => void">

Function that receives the current value and performs mutations on it.

</field>
</field-group>

#### Examples

```ts
const data = {
  user: {
    tags: [] as string[],
  },
};

const path = ["user", "tags"];
FieldPath.modifyValue(data, path, (tags) => {
  //                               ^? string[] | undefined
  tags?.push("admin");
});

console.log(data.user.tags);
// ["admin"]
```

```ts
const data = {};

const path = ["user", "count"];
FieldPath.modifyValue(data, path, (count) => {
  //                               ^? undefined
});
```

</doc-ref-section>

### 📙 `deleteValue()`

<doc-ref-section>

```ts
export function deleteValue<
  TObject extends object,
  TPath extends readonly PropertyKey[],
>(object: TObject, path: TPath): void;
```

<doc-tree>
<doc-tree-item title="TObject">

The root object type being traversed.
Defines the structural boundary within which the deletion is evaluated.

</doc-tree-item>

<doc-tree-item title="TPath">

A segmented path pointing to the property inside `TObject` that should be removed.
Its structure determines which branch is walked at runtime.

</doc-tree-item>
</doc-tree>

Removes the property located at `TPath` from `object`.

Traversal is performed safely. If any intermediate branch does not exist, the operation exits without mutation.

Unlike `setValue()` or `modifyValue()`, this does not create missing branches.

#### Arguments

<field-group>
<field name="object!" type="TObject extends object">

Root object to mutate.

</field>

<field name="path!" type="TPath extends FieldPath.Segments">

Segmented path pointing to the property to delete.

</field>
</field-group>

#### Examples

```ts
const data = {
  user: {
    name: "John",
    age: 25,
  },
};

FieldPath.deleteValue(data, ["user", "age"]);

console.log(data);
// {
//   user: {
//     name: "John"
//   }
// }
```

```ts
const data = {};

FieldPath.deleteValue(data, ["user", "age"]);
// No error, no mutation
```

</doc-ref-section>

::
