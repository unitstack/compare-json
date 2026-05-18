import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { JSONValueDifference } from '@compare-json/core';

const CLI_PATH = join(__dirname, '../dist/cli.js');

beforeAll(() => {
  mkdirSync(join(__dirname, 'temp'), { recursive: true });
});

describe('CLI e2e', () => {
  const testFile1 = join(__dirname, 'temp', 'test1.json');
  const testFile2 = join(__dirname, 'temp', 'test2.json');
  const outputFile = join(__dirname, 'temp', 'output.json');

  beforeEach(() => {
    writeFileSync(testFile1, JSON.stringify({ a: 1, b: 2 }));
    writeFileSync(testFile2, JSON.stringify({ a: 2, c: 3 }));
  });

  afterEach(() => {
    [testFile1, testFile2, outputFile].forEach((f) => {
      try {
        unlinkSync(f);
      } catch {
        //
      }
    });
  });

  it('should show help when no arguments provided', () => {
    const result = execSync(`node ${CLI_PATH}`, {
      encoding: 'utf-8',
    });
    expect(result).toContain('Usage:');
    expect(result).toContain('compare-json');
  });

  it('should show version with --version', () => {
    const result = execSync(`node ${CLI_PATH} --version`, {
      encoding: 'utf-8',
    });
    expect(result.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('should error on invalid JSON string', () => {
    expect(() =>
      execSync(`node ${CLI_PATH} '{invalid}' '{"a":1}'`, {
        encoding: 'utf-8',
      }),
    ).toThrow();
  });

  it('should error on non-existent file path', () => {
    expect(() =>
      execSync(`node ${CLI_PATH} /nonexistent/file.json '{"a":1}'`, {
        encoding: 'utf-8',
      }),
    ).toThrow();
  });

  it('should compare JSON strings', () => {
    const result = execSync(`node ${CLI_PATH} '{"a":1}' '{"a":2}'`, {
      encoding: 'utf-8',
    });
    expect(result.trim()).toBe(EXPECTED_SINGLE_VALUE_CHANGED);
  });

  it('should compare JSON files', () => {
    const result = execSync(`node ${CLI_PATH} ${testFile1} ${testFile2}`, {
      encoding: 'utf-8',
    });
    expect(result.trim()).toBe(EXPECTED_MULTIPLE_CHANGES);
  });

  it('should output JSON format', () => {
    const result = execSync(
      `node ${CLI_PATH} '{"a":1}' '{"a":2}' --json-export`,
      { encoding: 'utf-8' },
    );
    const parsed = JSON.parse(result) as JSONValueDifference[];
    expect(parsed).toEqual([
      {
        pathSegments: ['a'],
        pathString: 'a',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should write to output file', () => {
    execSync(`node ${CLI_PATH} ${testFile1} ${testFile2} -o ${outputFile}`, {
      encoding: 'utf-8',
    });
    const content = readFileSync(outputFile, 'utf-8');
    expect(content).toBe(EXPECTED_MULTIPLE_CHANGES);
  });

  it('should write JSON format to output file', () => {
    execSync(`node ${CLI_PATH} ${testFile1} ${testFile2} -j -o ${outputFile}`, {
      encoding: 'utf-8',
    });
    const content = readFileSync(outputFile, 'utf-8');
    const parsed = JSON.parse(content) as JSONValueDifference[];
    expect(parsed).toEqual([
      {
        pathSegments: ['a'],
        pathString: 'a',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
      {
        pathSegments: ['b'],
        pathString: 'b',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
      {
        pathSegments: ['c'],
        pathString: 'c',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });

  it('should use array compare method', () => {
    const result = execSync(
      `node ${CLI_PATH} '{"arr":[1,2]}' '{"arr":[2,1]}' -a unordered`,
      { encoding: 'utf-8' },
    );
    expect(result).toContain('No differences found');
  });

  it('should use key case insensitive option', () => {
    const result = execSync(
      `node ${CLI_PATH} '{"Name":"Alice"}' '{"name":"Alice"}' -k`,
      { encoding: 'utf-8' },
    );
    expect(result).toContain('No differences found');
  });

  it('should use value case insensitive option', () => {
    const result = execSync(
      `node ${CLI_PATH} '{"status":"OK"}' '{"status":"ok"}' -v`,
      { encoding: 'utf-8' },
    );
    expect(result).toContain('No differences found');
  });

  it('should use numeric string equals number option', () => {
    const result = execSync(
      `node ${CLI_PATH} '{"count":1}' '{"count":"1"}' --numeric-string-equals-number`,
      { encoding: 'utf-8' },
    );
    expect(result).toContain('No differences found');
  });

  it('should handle root-level differences', () => {
    const result = execSync(`node ${CLI_PATH} '1' '"hello"'`, {
      encoding: 'utf-8',
    });
    expect(result.trim()).toBe(EXPECTED_ROOT_DIFF);
  });
});

const EXPECTED_ROOT_DIFF = `
┌────────┬─────────────┐
│ Key    │ Change Type │
├────────┼─────────────┤
│ (Root) │ typeChanged │
└────────┴─────────────┘
`.trim();

const EXPECTED_SINGLE_VALUE_CHANGED = `
┌──────────┬──────────────┐
│ Key      │ Change Type  │
├──────────┼──────────────┤
│ (Base) a │ valueChanged │
└──────────┴──────────────┘
`.trim();

const EXPECTED_MULTIPLE_CHANGES = `
┌──────────────┬──────────────┐
│ Key          │ Change Type  │
├──────────────┼──────────────┤
│ (Base) a     │ valueChanged │
│ (Base) b     │ deleted      │
│ (Contrast) c │ added        │
└──────────────┴──────────────┘
`.trim();
