import { describe, expect, it } from 'vitest';
import { compareJSON } from '@compare-json/core';
import type { JSONValueDifference } from '@compare-json/core';
import { jsonToCodeLines } from '@/alignment/codeLine';
import {
  showJSONCodeWithDifferences,
  type JSONViewLine,
} from '@/alignment/codeView';

function contents(lines: JSONViewLine[]): string[] {
  return lines.map((l) => (l.codeLine ? l.codeLine.content : ''));
}

describe('showJSONCodeWithDifferences', () => {
  it('pairs a deleted region with an added region at the same position', () => {
    const base = { a: 1, b: 2 };
    const contrast = { a: 1, c: 3 };
    const differences: JSONValueDifference[] = [
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
    ];

    const [baseView, contrastView] = showJSONCodeWithDifferences({
      jsonCodeLines: jsonToCodeLines({ json: base, anotherJSON: contrast }),
      anotherJSONCodeLines: jsonToCodeLines({
        json: contrast,
        anotherJSON: base,
      }),
      jsonValueDifferences: differences,
    });

    expect(contents(baseView)).toEqual(['{', '"a": 1,', '"b": 2', '}']);
    expect(contents(contrastView)).toEqual(['{', '"a": 1,', '"c": 3', '}']);
    expect(baseView[2].diffType).toBe('deleted');
    expect(contrastView[2].diffType).toBe('added');
  });

  it('pads the shorter side of a replaced region pair with unequal sizes', () => {
    const base = { gone: { x: 1, y: 2 } };
    const contrast = { new: [1] };
    const differences = compareJSON({ baseJSON: base, contrastJSON: contrast });

    const [baseView, contrastView] = showJSONCodeWithDifferences({
      jsonCodeLines: jsonToCodeLines({ json: base, anotherJSON: contrast }),
      anotherJSONCodeLines: jsonToCodeLines({
        json: contrast,
        anotherJSON: base,
      }),
      jsonValueDifferences: differences,
    });

    expect(contents(baseView)).toEqual([
      '{',
      '"gone": {',
      '"x": 1,',
      '"y": 2',
      '}',
      '}',
    ]);
    expect(contents(contrastView)).toEqual([
      '{',
      '"new": [',
      '1',
      ']',
      '',
      '}',
    ]);
    expect(baseView.length).toBe(contrastView.length);
    expect([1, 2, 3, 4].map((i) => baseView[i].diffType)).toEqual([
      'deleted',
      'deleted',
      'deleted',
      'deleted',
    ]);
    expect([1, 2, 3].map((i) => contrastView[i].diffType)).toEqual([
      'added',
      'added',
      'added',
    ]);
    expect(contrastView[4].blank).toBe(true);
  });

  it('pads the shorter side of a type-changed region so following lines stay aligned', () => {
    const base = { o: { x: 1 } };
    const contrast = { o: [1, 2, 3] };
    const differences: JSONValueDifference[] = [
      {
        pathSegments: ['o'],
        pathString: 'o',
        pathBelongsTo: 'both',
        diffType: 'typeChanged',
      },
    ];

    const [baseView, contrastView] = showJSONCodeWithDifferences({
      jsonCodeLines: jsonToCodeLines({ json: base, anotherJSON: contrast }),
      anotherJSONCodeLines: jsonToCodeLines({
        json: contrast,
        anotherJSON: base,
      }),
      jsonValueDifferences: differences,
    });

    expect(contents(baseView)).toEqual([
      '{',
      '"o": {',
      '"x": 1',
      '}',
      '',
      '',
      '}',
    ]);
    expect(contents(contrastView)).toEqual([
      '{',
      '"o": [',
      '1,',
      '2,',
      '3',
      ']',
      '}',
    ]);
    expect(baseView[1].diffType).toBe('typeChanged');
    expect(contrastView[5].diffType).toBe('typeChanged');
  });

  it('marks both sides of a value-changed line', () => {
    const base = { a: 1 };
    const contrast = { a: 2 };
    const differences: JSONValueDifference[] = [
      {
        pathSegments: ['a'],
        pathString: 'a',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ];

    const [baseView, contrastView] = showJSONCodeWithDifferences({
      jsonCodeLines: jsonToCodeLines({ json: base, anotherJSON: contrast }),
      anotherJSONCodeLines: jsonToCodeLines({
        json: contrast,
        anotherJSON: base,
      }),
      jsonValueDifferences: differences,
    });

    expect(contents(baseView)).toEqual(['{', '"a": 1', '}']);
    expect(contents(contrastView)).toEqual(['{', '"a": 2', '}']);
    expect(baseView[1].diffType).toBe('valueChanged');
    expect(contrastView[1].diffType).toBe('valueChanged');
  });

  it('pads the contrast side when the base type-changed region is longer', () => {
    const base = { o: [1, 2, 3] };
    const contrast = { o: { x: 1 } };
    const differences: JSONValueDifference[] = [
      {
        pathSegments: ['o'],
        pathString: 'o',
        pathBelongsTo: 'both',
        diffType: 'typeChanged',
      },
    ];

    const [baseView, contrastView] = showJSONCodeWithDifferences({
      jsonCodeLines: jsonToCodeLines({ json: base, anotherJSON: contrast }),
      anotherJSONCodeLines: jsonToCodeLines({
        json: contrast,
        anotherJSON: base,
      }),
      jsonValueDifferences: differences,
    });

    expect(contents(baseView)).toEqual([
      '{',
      '"o": [',
      '1,',
      '2,',
      '3',
      ']',
      '}',
    ]);
    expect(contents(contrastView)).toEqual([
      '{',
      '"o": {',
      '"x": 1',
      '}',
      '',
      '',
      '}',
    ]);
    expect(baseView.length).toBe(contrastView.length);
    expect(baseView[1].diffType).toBe('typeChanged');
    expect(contrastView[1].diffType).toBe('typeChanged');
    expect(contrastView[4].blank).toBe(true);
    expect(contrastView[5].blank).toBe(true);
  });

  it('aligns type-changed regions whose keys differ only by case (keyCaseInsensitive)', () => {
    const base = { Name: 1 };
    const contrast = { name: [1, 2, 3] };
    const differences = compareJSON({
      baseJSON: base,
      contrastJSON: contrast,
      options: { keyCaseInsensitive: true },
    });

    const [baseView, contrastView] = showJSONCodeWithDifferences({
      jsonCodeLines: jsonToCodeLines({ json: base, anotherJSON: contrast }),
      anotherJSONCodeLines: jsonToCodeLines({
        json: contrast,
        anotherJSON: base,
      }),
      jsonValueDifferences: differences,
    });

    expect(baseView.length).toBe(7);
    expect(contrastView.length).toBe(7);
    expect(contents(baseView)).toEqual(['{', '"Name": 1', '', '', '', '', '}']);
    expect(contents(contrastView)).toEqual([
      '{',
      '"name": [',
      '1,',
      '2,',
      '3',
      ']',
      '}',
    ]);
    expect(baseView[1].diffType).toBe('typeChanged');
    expect([2, 3, 4, 5].map((i) => baseView[i].blank)).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect([1, 2, 3, 4, 5].map((i) => contrastView[i].diffType)).toEqual([
      'typeChanged',
      'typeChanged',
      'typeChanged',
      'typeChanged',
      'typeChanged',
    ]);
  });

  it('aligns a multi-line deleted region with blank lines on the contrast side', () => {
    const base = { a: 1, gone: { x: 1, y: 2 } };
    const contrast = { a: 1 };
    const differences: JSONValueDifference[] = [
      {
        pathSegments: ['gone'],
        pathString: 'gone',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
    ];

    const [baseView, contrastView] = showJSONCodeWithDifferences({
      jsonCodeLines: jsonToCodeLines({ json: base, anotherJSON: contrast }),
      anotherJSONCodeLines: jsonToCodeLines({
        json: contrast,
        anotherJSON: base,
      }),
      jsonValueDifferences: differences,
    });

    expect(contents(baseView)).toEqual([
      '{',
      '"a": 1,',
      '"gone": {',
      '"x": 1,',
      '"y": 2',
      '}',
      '}',
    ]);
    expect(contents(contrastView)).toEqual([
      '{',
      '"a": 1',
      '',
      '',
      '',
      '',
      '}',
    ]);
    expect(baseView.length).toBe(contrastView.length);
    expect(baseView[2].diffType).toBe('deleted');
    expect(baseView[5].diffType).toBe('deleted');
    expect(contrastView[2].blank).toBe(true);
    expect(contrastView[3].blank).toBe(true);
    expect(contrastView[4].blank).toBe(true);
    expect(contrastView[5].blank).toBe(true);
  });
});
