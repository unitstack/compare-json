# @compare-json/core

A lightweight, dependency-free TypeScript library for deep comparison of JSON values. Detects additions, deletions, type changes, and value changes between two JSON structures with fine-grained control over comparison behavior.

## Online Playground

Try it out at [https://comparejson.com](https://comparejson.com)

## Installation

```bash
# npm
npm install @compare-json/core

# yarn
yarn add @compare-json/core

# pnpm
pnpm add @compare-json/core
```

## Quick Start

```typescript
import { compareJSON } from '@compare-json/core';

const baseJSON = { name: 'Alice', age: 30, hobbies: ['reading'] };
const contrastJSON = { name: 'Bob', age: '30', hobbies: ['reading', 'coding'], email: 'bob@test.com' };

const differences = compareJSON({ baseJSON, contrastJSON });

console.log(differences);
// [
//   {
//     pathSegments: ['name'],
//     pathString: 'name',
//     pathBelongsTo: 'both',
//     diffType: 'valueChanged',
//   },
//   {
//     pathSegments: ['age'],
//     pathString: 'age',
//     pathBelongsTo: 'both',
//     diffType: 'typeChanged',
//   },
//   {
//     pathSegments: ['hobbies', '[1]'],
//     pathString: 'hobbies[1]',
//     pathBelongsTo: 'contrast',
//     diffType: 'added',
//   },
//   {
//     pathSegments: ['email'],
//     pathString: 'email',
//     pathBelongsTo: 'contrast',
//     diffType: 'added',
//   },
// ]
```

## Examples

### Using Compare Options

```typescript
import { compareJSON } from '@compare-json/core';

// Treat numeric strings as equal to numbers
compareJSON({
  baseJSON: { count: 1 },
  contrastJSON: { count: '1' },
  options: { numericStringEqualsNumber: true },
});
// [] (no differences)

// Case-insensitive key comparison
compareJSON({
  baseJSON: { Name: 'Alice' },
  contrastJSON: { name: 'Alice' },
  options: { keyCaseInsensitive: true },
});
// [] (no differences)

// Case-insensitive value comparison
compareJSON({
  baseJSON: { status: 'OK' },
  contrastJSON: { status: 'ok' },
  options: { valueCaseInsensitive: true },
});
// [] (no differences)
```

### Array Comparison Methods

```typescript
import { compareJSON } from '@compare-json/core';

const baseJSON = [1, 2, 3];
const contrastJSON = [2, 3, 4];

// 'byIndex' (default) — compares elements at the same index
compareJSON({ baseJSON, contrastJSON });

// 'lcs' — uses Longest Common Subsequence for minimal diff
compareJSON({
  baseJSON,
  contrastJSON,
  options: { arrayCompareMethod: 'lcs' },
});

// 'unordered' — treats arrays as multisets, ignoring element order
compareJSON({
  baseJSON: [1, 2, 3],
  contrastJSON: [3, 2, 1],
  options: { arrayCompareMethod: 'unordered' },
});
// [] (no differences)
```

### Formatting Paths

```typescript
import { pathSegmentsToString } from '@compare-json/core';

pathSegmentsToString(['users', '[0]', 'name']);
// 'users[0].name'
```

## API Reference

### `compareJSON`

```typescript
function compareJSON(params: {
  baseJSON: unknown;
  contrastJSON: unknown;
  options?: CompareOptions;
}): JSONValueDifference[];
```

Deeply compares two JSON values and returns an array of differences. Returns an empty array when the values are equal.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `baseJSON` | `unknown` | The base JSON value (the side considered the original). |
| `contrastJSON` | `unknown` | The JSON value compared against the base. |
| `options` | `CompareOptions` | Optional settings to customize comparison behavior. |

**Returns:** `JSONValueDifference[]` — array of difference objects describing each detected change.

---

### `pathSegmentsToString`

```typescript
function pathSegmentsToString(pathSegments: string[]): string;
```

Converts a path segment array (as found in `JSONValueDifference.pathSegments`) into a human-readable dot-notation string. Array index segments (e.g. `'[0]'`) are appended without a leading dot; object key segments are joined with `.`.

```typescript
pathSegmentsToString([]);                              // ''
pathSegmentsToString(['user', 'name']);                // 'user.name'
pathSegmentsToString(['items', '[2]', 'id']);          // 'items[2].id'
```

---

### `CompareOptions`

```typescript
interface CompareOptions {
  arrayCompareMethod?: ArrayCompareMethod;
  keyCaseInsensitive?: boolean;
  valueCaseInsensitive?: boolean;
  numericStringEqualsNumber?: boolean;
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `arrayCompareMethod` | `ArrayCompareMethod` | `'byIndex'` | Strategy used to compare arrays. |
| `keyCaseInsensitive` | `boolean` | `false` | When `true`, object keys are compared case-insensitively. |
| `valueCaseInsensitive` | `boolean` | `false` | When `true`, string values are compared case-insensitively. |
| `numericStringEqualsNumber` | `boolean` | `false` | When `true`, numeric strings are treated as equal to their numeric counterparts (e.g. `"1"` equals `1`). |

---

### `ArrayCompareMethod`

```typescript
type ArrayCompareMethod = 'byIndex' | 'lcs' | 'unordered';
```

| Value | Description |
|-------|-------------|
| `'byIndex'` | Compares array elements pairwise at the same index. Extra trailing elements are reported as `added`/`deleted`. |
| `'lcs'` | Uses the Longest Common Subsequence algorithm for minimal-diff detection in ordered arrays. |
| `'unordered'` | Treats arrays as multisets, matching equal elements regardless of position. |

---

### `JSONValueDiffType`

```typescript
type JSONValueDiffType = 'added' | 'deleted' | 'typeChanged' | 'valueChanged';
```

| Value | Description |
|-------|-------------|
| `'added'` | Value exists in `contrastJSON` but not in `baseJSON`. |
| `'deleted'` | Value exists in `baseJSON` but not in `contrastJSON`. |
| `'typeChanged'` | The value type changed between base and contrast (e.g. `number` → `string`). |
| `'valueChanged'` | The value changed while the type stayed the same. |

---

### `JSONValueDifference`

```typescript
interface JSONValueDifference {
  pathSegments: string[];
  pathString: string;
  pathBelongsTo: 'base' | 'contrast' | 'both';
  diffType: JSONValueDiffType;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `pathSegments` | `string[]` | Path to the differing value as segments. Object keys appear as-is; array indices appear as `'[n]'` (e.g. `['users', '[0]', 'name']`). |
| `pathString` | `string` | Same path joined into dot-notation, with array indices kept as bracket suffixes (e.g. `'users[0].name'`). Use [`pathSegmentsToString`](#pathsegmentstostring) to reproduce this format. |
| `pathBelongsTo` | `'base' \| 'contrast' \| 'both'` | Side that owns the path. `'base'` for `deleted`, `'contrast'` for `added`, `'both'` for `valueChanged` and `typeChanged`. |
| `diffType` | `JSONValueDiffType` | Kind of difference detected at this path. |

## License

MIT
