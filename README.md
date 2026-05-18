# compare-json

A toolkit for **structured JSON comparison** — find what changed between two JSON values, with control over how keys, values, and arrays are matched.

> Online playground: **[comparejson.com](https://comparejson.com)**

## Why

Most JSON diff tools either output unstructured text or hide the parts that matter (where a key was added, whether a type changed, whether two arrays differ in order or in content). `compare-json` returns a structured list of differences — every entry carries a path, the side it belongs to (`base` / `contrast` / `both`), and the kind of change (`added`, `deleted`, `typeChanged`, `valueChanged`) — so you can render, filter, or program against it.

## Features

- **Deep comparison** of objects, arrays, and primitives.
- **Three array comparison strategies**: `byIndex` (default), `lcs` (minimal diff via Longest Common Subsequence), and `unordered` (multiset match).
- **Case-insensitive** key and/or value matching.
- **Numeric-string equality** — optionally treat `"1"` and `1` as equal.
- **Path tracking** with both segment-array and dot-notation forms.
- **Zero runtime dependencies** in `@compare-json/core`.
- **CLI** with table or JSON output, reading from inline strings or files.
- **MCP server** built in — drop the CLI into any MCP-aware AI assistant.
- **Agent Skill** — a single skill that works in Claude Code, OpenAI Codex CLI, and OpenCode.
- Full **TypeScript** types.

## Packages

This is a pnpm workspace:

| Package | Description |
|---------|-------------|
| [`@compare-json/core`](./packages/compare-json-core) | Core comparison library (programmatic API). |
| [`@compare-json/cli`](./packages/compare-json-cli) | Command-line tool & MCP server, built on top of `core`. |

## Quick Start

### Library

```bash
npm install @compare-json/core
```

```typescript
import { compareJSON } from '@compare-json/core';

const differences = compareJSON({
  baseJSON: { name: 'Alice', age: 30 },
  contrastJSON: { name: 'Bob', age: '30', email: 'bob@test.com' },
});

// [
//   { pathString: 'name',  pathBelongsTo: 'both',     diffType: 'valueChanged', ... },
//   { pathString: 'age',   pathBelongsTo: 'both',     diffType: 'typeChanged',  ... },
//   { pathString: 'email', pathBelongsTo: 'contrast', diffType: 'added',        ... },
// ]
```

See the [core README](./packages/compare-json-core/README.md) for the full API.

### CLI

```bash
npm install -g @compare-json/cli

compare-json base.json contrast.json
```

```
┌──────────────┬──────────────┐
│ Key          │ Change Type  │
├──────────────┼──────────────┤
│ (Base) a     │ valueChanged │
│ (Base) b     │ deleted      │
│ (Contrast) c │ added        │
└──────────────┴──────────────┘
```

Use `--json-export` for machine-readable output, or `--mcp` to launch as an MCP server. See the [CLI README](./packages/compare-json-cli/README.md) for all flags and the MCP tool schema.

### MCP

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

### Skill

A single [`SKILL.md`](./skills/compare-json/SKILL.md) teaches AI coding assistants how to invoke the CLI on demand. The file follows the open [Agent Skills](https://github.com/anthropics/skills) format and works across Claude Code, OpenAI Codex CLI, OpenCode, Cursor, and 50+ others.

The fastest install is [`npx skills`](https://github.com/vercel-labs/skills) — it auto-detects every agent you have installed and drops the skill into each one:

```bash
npx skills add unitstack/compare-json
```

## Development

Requires Node.js ≥ 20 and pnpm.

```bash
# install dependencies
pnpm install

# build all packages
pnpm -r build

# run tests across the workspace
pnpm -r test

# lint
pnpm -r lint
```

The repo layout:

```
packages/
├── compare-json-core/    # @compare-json/core — library
├── compare-json-cli/     # @compare-json/cli  — CLI + MCP server
└── internal/             # shared eslint/tsconfig (not published)
skills/
└── compare-json/         # SKILL.md for Claude Code / Codex CLI / OpenCode
```

## License

MIT
