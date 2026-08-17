import { describe, expect, it } from 'vitest';
import { computeSession, parseJSONWithLocation } from '@/core/compareSession';

const defaults = {
  arrayCompareMethod: 'byIndex',
  keyCaseInsensitive: false,
  valueCaseInsensitive: false,
  numericStringEqualsNumber: false,
} as const;

describe('computeSession', () => {
  it('returns differences and aligned texts for valid JSON inputs', () => {
    const session = computeSession(
      { label: 'a.json', text: '{"x": 1}' },
      { label: 'b.json', text: '{"x": 2}' },
      { ...defaults },
    );

    expect(session.differences).toEqual([
      {
        pathSegments: ['x'],
        pathString: 'x',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
    expect(session.baseAlignedText).toBe('{\n  "x": 1\n}');
    expect(session.contrastAlignedText).toBe('{\n  "x": 2\n}');
    expect(session.lineMap.get('x')).toBe(2);
  });

  it('passes comparison options through to compareJSON', () => {
    const session = computeSession(
      { label: 'a.json', text: '{"Name": "ALICE"}' },
      { label: 'b.json', text: '{"name": "alice"}' },
      { ...defaults, keyCaseInsensitive: true, valueCaseInsensitive: true },
    );

    expect(session.differences).toEqual([]);
  });

  it('throws a labeled error for invalid base JSON', () => {
    expect(() =>
      computeSession(
        { label: 'base.json', text: '{bad}' },
        { label: 'b.json', text: '{}' },
        { ...defaults },
      ),
    ).toThrow(/Invalid JSON in base\.json/);
  });

  it('throws a labeled error for invalid contrast JSON', () => {
    expect(() =>
      computeSession(
        { label: 'a.json', text: '{}' },
        { label: 'contrast.json', text: '[1,' },
        { ...defaults },
      ),
    ).toThrow(/Invalid JSON in contrast\.json/);
  });
});

describe('parseJSONWithLocation', () => {
  it('includes line and column when the parser reports a position', () => {
    // Node >= 20 reports: "Unexpected non-whitespace character after JSON at position 9 (line 2 column 2)"
    expect(() => parseJSONWithLocation('{"a":1}\n x', 'a.json')).toThrow(
      /Invalid JSON in a\.json at line 2, column 2/,
    );
  });

  it('includes the raw parser message when no position is reported', () => {
    // "Unexpected end of JSON input" carries no position on any Node version.
    expect(() => parseJSONWithLocation('[1,', 'a.json')).toThrow(
      /Invalid JSON in a\.json: /,
    );
  });
});
