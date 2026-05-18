---
name: compare-json
description: Compare two JSON files or strings and identify the differences (added, deleted, type-changed, value-changed) at each path. Use when the user wants to diff JSON values, find what changed between two payloads, fixtures, configs, or API responses.
---

# compare-json

Use `npx @compare-json/cli` to compare two JSON values and identify their differences.

## Usage

```bash
npx @compare-json/cli <base> <contrast> [options]
```

Each positional argument can be either an inline JSON string or a path to a JSON file. The CLI resolves the value at runtime: if it matches an existing file, the file is read and parsed; otherwise the argument itself is parsed as JSON.

## Arguments

- `<base>` — Base JSON string or file path
- `<contrast>` — Contrast JSON string or file path

## Options

- `-a, --array-compare-method <method>` — Array compare method, one of `byIndex` (default), `lcs`, `unordered`
  - `byIndex` — Compare arrays by index position
  - `lcs` — Minimal diff for ordered arrays via Longest Common Subsequence
  - `unordered` — Treat arrays as multisets
- `-k, --key-case-insensitive` — Case-insensitive key comparison
- `-v, --value-case-insensitive` — Case-insensitive value comparison
- `--numeric-string-equals-number` — Treat numeric strings as equal to numbers (e.g. `"1"` equals `1`)
- `-j, --json-export` — Output as JSON instead of the default table
- `-o, --output <file>` — Write the output to a file instead of stdout

## Examples

Compare two JSON strings:

```bash
npx @compare-json/cli '{"name":"Alice"}' '{"name":"Bob"}'
```

Compare two JSON files:

```bash
npx @compare-json/cli base.json contrast.json
```

Case-insensitive keys:

```bash
npx @compare-json/cli '{"Name":"Alice"}' '{"name":"Alice"}' -k
```

LCS array comparison — minimal diff for ordered arrays:

```bash
npx @compare-json/cli '[1,2,3]' '[2,3,4]' -a lcs
```

JSON output:

```bash
npx @compare-json/cli base.json contrast.json -j
```

Save output to a file:

```bash
npx @compare-json/cli base.json contrast.json -o diff.txt
```

Combine tolerance options:

```bash
npx @compare-json/cli '{"count":"123"}' '{"count":123}' -k -v --numeric-string-equals-number
```

## Output Format

By default, results are printed as a Unicode box-drawn table. Each row is labeled with the side that owns the path: `(Base)` for value changes and deletions, `(Contrast)` for additions, and `(Root)` when the top-level value itself differs.

```
┌──────────────┬──────────────┐
│ Key          │ Change Type  │
├──────────────┼──────────────┤
│ (Base) a     │ valueChanged │
│ (Base) b     │ deleted      │
│ (Contrast) c │ added        │
└──────────────┴──────────────┘
```

When the two inputs match exactly, the output is simply `No differences found`.

With `--json-export` (`-j`), the same data is emitted as JSON:

```json
[
  {
    "pathSegments": ["name"],
    "pathString": "name",
    "pathBelongsTo": "both",
    "diffType": "valueChanged"
  }
]
```

## Difference Types

- `added` — Value exists in `contrast` but not in `base`
- `deleted` — Value exists in `base` but not in `contrast`
- `typeChanged` — Value type changed between base and contrast (e.g. `number` → `string`)
- `valueChanged` — Value changed while the type stayed the same
