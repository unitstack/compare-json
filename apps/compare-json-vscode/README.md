# Compare JSON for VSCode

Semantic JSON comparison inside your editor — find what changed between two JSON documents, with control over how keys, values, and arrays are matched. Powered by [`@compare-json/core`](https://github.com/unitstack/compare-json).

> Online playground: **[comparejson.com](https://comparejson.com)**

## Features

- **Compare anything JSON**: the active editor against another open editor, a file on disk, or the clipboard.
- **Aligned diff view**: results open in VSCode's native diff editor, with both sides padded so corresponding keys line up — even when whole blocks were added or removed.
- **Difference navigator**: a sidebar view groups every difference by kind — Added, Deleted, Value Changed, Type Changed — and jumps to it on click.
- **Semantic options** (from the command `Compare JSON: Configure Comparison Options`, or as workspace defaults):
  - `compare-json.arrayCompareMethod` — `byIndex` (default), `lcs` (minimal diff), or `unordered` (multiset match)
  - `compare-json.keyCaseInsensitive` — ignore key case (default `false`)
  - `compare-json.valueCaseInsensitive` — ignore string value case (default `false`)
  - `compare-json.numericStringEqualsNumber` — treat `"1"` as equal to `1` (default `false`)

## Usage

1. Open a JSON file.
2. Run **Compare JSON: Compare Active Editor with...** from the command palette (or the editor title menu) and pick what to compare against.
3. Browse the differences in the **Compare JSON** sidebar; click one to jump to it.

You can also right-click a `.json` file in the explorer and use **Select for Compare**, then **Compare with Selected** on the second file — the same flow as VSCode's built-in file compare.

## License

MIT
