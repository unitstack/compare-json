import { describe, expect, it } from 'vitest';
import { compareJSON } from '@compare-json/core';
import { buildAlignedDocuments } from '@/alignment';

describe('buildAlignedDocuments', () => {
  it('produces aligned, indented documents and a line map for each diff', () => {
    const baseJSON = { name: 'Alice', age: 30 };
    const contrastJSON = { name: 'Bob', age: '30', email: 'bob@test.com' };
    const differences = compareJSON({ baseJSON, contrastJSON });

    const { baseText, contrastText, lineMap } = buildAlignedDocuments({
      baseJSON,
      contrastJSON,
      differences,
    });

    expect(baseText).toBe('{\n  "age": 30,\n\n  "name": "Alice"\n}');
    expect(contrastText).toBe(
      '{\n  "age": "30",\n  "email": "bob@test.com",\n  "name": "Bob"\n}',
    );
    expect(baseText.split('\n')).toHaveLength(contrastText.split('\n').length);
    expect(Object.fromEntries(lineMap)).toEqual({ age: 2, email: 3, name: 4 });
  });

  it('returns identical texts and an empty line map when there are no differences', () => {
    const json = { a: [1, 2], b: { c: 'x' } };
    const differences = compareJSON({ baseJSON: json, contrastJSON: json });

    const { baseText, contrastText, lineMap } = buildAlignedDocuments({
      baseJSON: json,
      contrastJSON: json,
      differences,
    });

    expect(baseText).toBe(contrastText);
    expect(lineMap.size).toBe(0);
  });

  it('handles root-level primitive differences', () => {
    const differences = compareJSON({ baseJSON: 1, contrastJSON: 2 });

    const { baseText, contrastText, lineMap } = buildAlignedDocuments({
      baseJSON: 1,
      contrastJSON: 2,
      differences,
    });

    expect(baseText).toBe('1');
    expect(contrastText).toBe('2');
    expect(lineMap.get('')).toBe(1);
  });
});
