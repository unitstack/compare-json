# @compare-json/cli

A command-line tool and [MCP](https://modelcontextprotocol.io) server for comparing JSON files or strings. Built on top of [@compare-json/core](https://www.npmjs.com/package/@compare-json/core).

## Online Playground

Try it out at [https://comparejson.com](https://comparejson.com)

## Installation

```bash
# npm
npm install -g @compare-json/cli

# yarn
yarn global add @compare-json/cli

# pnpm
pnpm add -g @compare-json/cli
```

## CLI

### Quick Start

```bash
# View help
compare-json --help

# Compare two JSON strings
compare-json '{"a":1}' '{"a":2}'

# Compare two JSON files
compare-json file1.json file2.json

# Output as JSON format
compare-json file1.json file2.json --json-export

# Save output to file
compare-json file1.json file2.json -o output.txt

# Start the MCP server (stdio transport)
compare-json --mcp
```

### Usage

```
compare-json [base] [contrast] [options]
```

Each positional argument can be either an inline JSON string or a path to a JSON file. The CLI inspects the value: if it resolves to an existing file, the file content is parsed; otherwise the argument itself is parsed as JSON. If neither `base` nor `contrast` is provided (and `--mcp` is not set), help is printed.

#### Arguments

| Argument | Description |
|----------|-------------|
| `[base]` | Base JSON string or file path |
| `[contrast]` | Contrast JSON string or file path |

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--array-compare-method <method>` | `-a` | Array compare method: `byIndex`, `lcs`, `unordered` | `byIndex` |
| `--key-case-insensitive` | `-k` | Case-insensitive key comparison | `false` |
| `--value-case-insensitive` | `-v` | Case-insensitive value comparison | `false` |
| `--numeric-string-equals-number` | – | Treat numeric strings as numbers | `false` |
| `--json-export` | `-j` | Output as JSON format | `false` |
| `--output <file>` | `-o` | Write output to a file instead of stdout | – |
| `--mcp` | – | Run as an MCP server via stdio | `false` |
| `--version` | `-V` | Print the CLI version | – |
| `--help` | `-h` | Print help | – |

### Examples

#### Basic Comparison

```bash
compare-json '{"name":"Alice","age":30}' '{"name":"Bob","age":30}'
```

Output:
```
┌─────────────┬──────────────┐
│ Key         │ Change Type  │
├─────────────┼──────────────┤
│ (Base) name │ valueChanged │
└─────────────┴──────────────┘
```

#### Compare Files

```bash
compare-json base.json contrast.json
```

#### Array Comparison Methods

```bash
# By index (default)
compare-json '[1,2,3]' '[2,3,4]'

# LCS — minimal diff for ordered arrays
compare-json '[1,2,3]' '[2,3,4]' -a lcs
compare-json '[1,2,3]' '[2,3,4]' --array-compare-method lcs

# Unordered — treat as multisets
compare-json '[1,2,3]' '[3,2,1]' -a unordered
compare-json '[1,2,3]' '[3,2,1]' --array-compare-method unordered
```

#### Case-Insensitive Comparison

```bash
# Case-insensitive keys
compare-json '{"Name":"Alice"}' '{"name":"Alice"}' -k
compare-json '{"Name":"Alice"}' '{"name":"Alice"}' --key-case-insensitive

# Case-insensitive values
compare-json '{"status":"OK"}' '{"status":"ok"}' -v
compare-json '{"status":"OK"}' '{"status":"ok"}' --value-case-insensitive
```

#### Numeric String Comparison

```bash
compare-json '{"count":1}' '{"count":"1"}' --numeric-string-equals-number
```

#### JSON Output

```bash
compare-json file1.json file2.json -j
compare-json file1.json file2.json --json-export
```

Output:
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

#### Save to File

```bash
# Save table format
compare-json file1.json file2.json -o diff.txt

# Save JSON format
compare-json file1.json file2.json -j -o diff.json
```

When `-o` is set, the CLI writes the formatted result to the file and prints `Output written to <path>` to stdout.

### Output Format

#### Table Format (Default)

A Unicode box-drawn table. Each row is labeled with the side that owns the path:

- `(Base) <path>` — the path exists on the base side (value or type changes, deletions).
- `(Contrast) <path>` — the path exists only on the contrast side (additions).
- `(Root)` — used when the top-level value itself differs.

```
┌──────────────┬──────────────┐
│ Key          │ Change Type  │
├──────────────┼──────────────┤
│ (Base) a     │ valueChanged │
│ (Base) b     │ deleted      │
│ (Contrast) c │ added        │
└──────────────┴──────────────┘
```

When the two inputs match exactly, the output is simply:

```
No differences found
```

#### JSON Format

```json
[
  {
    "pathSegments": ["name"],
    "pathString": "name",
    "pathBelongsTo": "both",
    "diffType": "valueChanged"
  },
  {
    "pathSegments": ["age"],
    "pathString": "age",
    "pathBelongsTo": "base",
    "diffType": "deleted"
  },
  {
    "pathSegments": ["email"],
    "pathString": "email",
    "pathBelongsTo": "contrast",
    "diffType": "added"
  }
]
```

See [`JSONValueDifference`](https://www.npmjs.com/package/@compare-json/core#jsonvaluedifference) in `@compare-json/core` for the full shape.

### Difference Types

| Type | Description |
|------|-------------|
| `added` | Value exists in `contrast` but not in `base`. |
| `deleted` | Value exists in `base` but not in `contrast`. |
| `typeChanged` | Value type changed between base and contrast (e.g. `number` → `string`). |
| `valueChanged` | Value changed while the type stayed the same. |

## MCP Server

`@compare-json/cli` also ships an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that exposes the comparison engine as a tool for AI assistants.

### Start the MCP Server

```bash
# from a global install
compare-json --mcp

# or via npx
npx @compare-json/cli --mcp
```

The server communicates over stdio.

### Available Tools

#### `compare_json`

Compare two JSON values and return their differences.

**Input parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseJSON` | `any` | conditional | Base JSON value (already parsed). |
| `baseJSONString` | `string` | conditional | Base JSON as a stringified value (parsed by the server). |
| `baseJSONFilePath` | `string` | conditional | Path to a base JSON file (read and parsed by the server). |
| `contrastJSON` | `any` | conditional | Contrast JSON value (already parsed). |
| `contrastJSONString` | `string` | conditional | Contrast JSON as a stringified value. |
| `contrastJSONFilePath` | `string` | conditional | Path to a contrast JSON file. |
| `options` | `object` | No | Comparison options (see below). |

At least one of `baseJSON` / `baseJSONString` / `baseJSONFilePath` must be provided, and at least one of `contrastJSON` / `contrastJSONString` / `contrastJSONFilePath`. When more than one is set for a side, file path takes precedence, then string, then raw value.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `arrayCompareMethod` | `'byIndex' \| 'lcs' \| 'unordered'` | `'byIndex'` | Array comparison strategy. |
| `keyCaseInsensitive` | `boolean` | `false` | Case-insensitive key comparison. |
| `valueCaseInsensitive` | `boolean` | `false` | Case-insensitive value comparison. |
| `numericStringEqualsNumber` | `boolean` | `false` | Treat numeric strings as equal to numbers. |

**Output:**

Returns `structuredContent.differences` — an array of `JSONValueDifference` objects — and a `content[0].text` mirror of the same data as JSON text.

```json
{
  "differences": [
    {
      "pathSegments": ["name"],
      "pathString": "name",
      "pathBelongsTo": "both",
      "diffType": "valueChanged"
    }
  ]
}
```

### MCP Client Configuration

Add the following to your MCP client config (e.g. `mcp.json`):

```json
{
  "mcpServers": {
    "compare-json": {
      "command": "npx",
      "args": ["@compare-json/cli@latest", "--mcp"]
    }
  }
}
```

## License

MIT
