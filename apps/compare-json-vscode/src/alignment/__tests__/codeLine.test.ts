import { describe, expect, it } from 'vitest';

import { jsonToCodeLines } from '@/alignment/codeLine';

function shape(lines: ReturnType<typeof jsonToCodeLines>) {
  return lines.map((l) => [
    l.pathString,
    l.startLineNumber,
    l.endLineNumber,
    l.content,
  ]);
}

describe('jsonToCodeLines', () => {
  it('flattens nested objects/arrays into sorted, line-numbered code lines', () => {
    const lines = jsonToCodeLines({
      json: { b: [1, 2], a: { x: 's' } },
      anotherJSON: {},
    });

    expect(shape(lines)).toEqual([
      ['', 1, 9, '{'],
      ['a', 2, 4, '"a": {'],
      ['a.x', 3, 3, '"x": "s"'],
      ['a', 4, 4, '},'],
      ['b', 5, 8, '"b": ['],
      ['b[0]', 6, 6, '1,'],
      ['b[1]', 7, 7, '2'],
      ['b', 8, 8, ']'],
      ['', 9, 9, '}'],
    ]);
  });

  it('renders an empty object on one line when the other side is not an object', () => {
    const lines = jsonToCodeLines({ json: {}, anotherJSON: 5 });
    expect(shape(lines)).toEqual([['', 1, 1, '{}']]);
  });

  it('renders an empty object on two lines when the other side is an object', () => {
    const lines = jsonToCodeLines({ json: {}, anotherJSON: {} });
    expect(shape(lines)).toEqual([
      ['', 1, 2, '{'],
      ['', 2, 2, '}'],
    ]);
  });

  it('renders a root primitive as a single line', () => {
    expect(shape(jsonToCodeLines({ json: 'x', anotherJSON: 'y' }))).toEqual([
      ['', 1, 1, '"x"'],
    ]);
    expect(shape(jsonToCodeLines({ json: true, anotherJSON: false }))).toEqual([
      ['', 1, 1, 'true'],
    ]);
  });

  it('escapes object keys with JSON.stringify', () => {
    const lines = jsonToCodeLines({ json: { 'a"b': 1 }, anotherJSON: {} });
    expect(lines[1].content).toBe('"a\\"b": 1');
  });

  it('renders empty-string keys with their key prefix', () => {
    const lines = jsonToCodeLines({ json: { '': 1 }, anotherJSON: {} });
    expect(lines[1].content).toBe('"": 1');
  });

  it('renders an empty array on one line when the other side is not an array', () => {
    const lines = jsonToCodeLines({ json: [], anotherJSON: 5 });
    expect(shape(lines)).toEqual([['', 1, 1, '[]']]);
  });

  it('renders an empty array on two lines when the other side is an array', () => {
    const lines = jsonToCodeLines({ json: [], anotherJSON: [] });
    expect(shape(lines)).toEqual([
      ['', 1, 2, '['],
      ['', 2, 2, ']'],
    ]);
  });
});
