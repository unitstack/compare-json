import { describe, it, expect, afterEach, vi, beforeAll } from 'vitest';
import { unlinkSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { JSONValueDifference } from '@compare-json/core';
import { compare, formatTable } from '../compare';

beforeAll(() => {
  mkdirSync(join(__dirname, 'temp'), { recursive: true });
});

describe('compare', () => {
  const outputFile = join(__dirname, 'temp', 'output.txt');

  afterEach(() => {
    try {
      unlinkSync(outputFile);
    } catch {
      //
    }
  });

  it('should output table format to console', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    compare('{"a":1}', '{"b":2}');
    expect(consoleSpy).toHaveBeenCalledWith(EXPECTED_TABLE_OUTPUT);
    consoleSpy.mockRestore();
  });

  it('should output JSON format', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    compare('{"a":1}', '{"a":2}', {
      jsonExport: true,
    });
    const output = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output) as JSONValueDifference[];
    expect(parsed).toEqual([
      {
        pathSegments: ['a'],
        pathString: 'a',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
    consoleSpy.mockRestore();
  });

  it('should write to output file', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    compare('{"a":1}', '{"b":2}', {
      output: outputFile,
    });
    expect(readFileSync(outputFile, 'utf-8')).toEqual(EXPECTED_TABLE_OUTPUT);
    consoleSpy.mockRestore();
  });

  it('should use compare options', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    compare('{"arr":[1,2]}', '{"arr":[2,1]}', {
      arrayCompareMethod: 'unordered',
      keyCaseInsensitive: true,
    });
    expect(consoleSpy).toHaveBeenCalledWith('No differences found');
    consoleSpy.mockRestore();
  });

  it('should show (Contrast) prefix for added keys in table output', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    compare('{"a":1}', '{"a":1,"b":2}');
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('(Contrast) b');
    expect(output).toContain('added');
    consoleSpy.mockRestore();
  });

  it('should show (Base) prefix for deleted keys in table output', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    compare('{"a":1,"b":2}', '{"a":1}');
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('(Base) b');
    expect(output).toContain('deleted');
    consoleSpy.mockRestore();
  });

  it('should use all comparison options', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    compare('{"Name":"100"}', '{"name":100}', {
      keyCaseInsensitive: true,
      valueCaseInsensitive: true,
      numericStringEqualsNumber: true,
    });
    expect(consoleSpy).toHaveBeenCalledWith('No differences found');
    consoleSpy.mockRestore();
  });
});

describe('formatTable', () => {
  it('should format empty differences', () => {
    const result = formatTable([]);
    expect(result).toBe('No differences found');
  });

  it('should format differences as table with borders', () => {
    const diffs: JSONValueDifference[] = [
      {
        pathSegments: ['a'],
        pathString: 'a',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
      {
        pathSegments: ['b'],
        pathString: 'b',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ];
    const result = formatTable(diffs);
    expect(result).toBe(EXPECTED_TABLE_OUTPUT);
  });

  it('should prefix added keys with (Contrast)', () => {
    const diffs: JSONValueDifference[] = [
      {
        pathSegments: ['newKey'],
        pathString: 'newKey',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ];
    const result = formatTable(diffs);
    expect(result).toContain('(Contrast) newKey');
  });

  it('should prefix deleted/valueChanged/typeChanged keys with (Base)', () => {
    const diffs: JSONValueDifference[] = [
      {
        pathSegments: ['oldKey'],
        pathString: 'oldKey',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
      {
        pathSegments: ['changed'],
        pathString: 'changed',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
      {
        pathSegments: ['type'],
        pathString: 'type',
        pathBelongsTo: 'both',
        diffType: 'typeChanged',
      },
    ];
    const result = formatTable(diffs);
    expect(result).toContain('(Base) oldKey');
    expect(result).toContain('(Base) changed');
    expect(result).toContain('(Base) type');
  });

  it('should use root label for empty path segments', () => {
    const diffs: JSONValueDifference[] = [
      {
        pathSegments: [],
        pathString: '',
        pathBelongsTo: 'both',
        diffType: 'typeChanged',
      },
    ];
    const result = formatTable(diffs);
    expect(result).toBe(EXPECTED_TABLE_WITH_ROOT);
  });
});

const EXPECTED_TABLE_OUTPUT = `
┌──────────────┬─────────────┐
│ Key          │ Change Type │
├──────────────┼─────────────┤
│ (Base) a     │ deleted     │
│ (Contrast) b │ added       │
└──────────────┴─────────────┘
`.trim();

const EXPECTED_TABLE_WITH_ROOT = `
┌────────┬─────────────┐
│ Key    │ Change Type │
├────────┼─────────────┤
│ (Root) │ typeChanged │
└────────┴─────────────┘
`.trim();
