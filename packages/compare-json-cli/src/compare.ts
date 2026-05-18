import {
  compareJSON,
  type ArrayCompareMethod,
  type JSONValueDifference,
} from '@compare-json/core';
import { writeFileSync } from 'fs';
import { parseInput } from './utils';

export const ROOT_LABEL = '(Root)';

export interface CompareOptions {
  arrayCompareMethod?: ArrayCompareMethod;
  keyCaseInsensitive?: boolean;
  valueCaseInsensitive?: boolean;
  numericStringEqualsNumber?: boolean;
  jsonExport?: boolean;
  output?: string;
}

export function compare(
  base: string,
  contrast: string,
  {
    arrayCompareMethod = 'byIndex',
    keyCaseInsensitive,
    valueCaseInsensitive,
    numericStringEqualsNumber,
    jsonExport,
    output: outputPath,
  }: CompareOptions = {},
) {
  const baseJSON = parseInput(base, 'base');
  const contrastJSON = parseInput(contrast, 'contrast');

  const differences = compareJSON({
    baseJSON,
    contrastJSON,
    options: {
      arrayCompareMethod,
      keyCaseInsensitive,
      valueCaseInsensitive,
      numericStringEqualsNumber,
    },
  });

  let output: string;
  if (jsonExport) {
    output = JSON.stringify(differences, null, 2);
  } else {
    output = formatTable(differences);
  }

  if (outputPath) {
    writeFileSync(outputPath, output, 'utf-8');
    console.log(`Output written to ${outputPath}`);
  } else {
    console.log(output);
  }
}

export function formatTable(differences: JSONValueDifference[]): string {
  if (differences.length === 0) {
    return 'No differences found';
  }

  const rows = differences.map((d) => {
    let keyStr = '';

    if (d.pathSegments.length === 0) {
      keyStr = ROOT_LABEL;
    } else {
      const keyPrefix =
        d.pathBelongsTo === 'contrast' ? `(Contrast)` : `(Base)`;
      keyStr = `${keyPrefix} ${d.pathString}`;
    }

    return [keyStr, d.diffType] as string[];
  });
  const maxKeyLen = Math.max(...rows.map((r) => r[0].length), 'Key'.length);
  const maxTypeLen = Math.max(
    ...rows.map((r) => r[1].length),
    'Change Type'.length,
  );

  const topBorder = `┌${'─'.repeat(maxKeyLen + 2)}┬${'─'.repeat(maxTypeLen + 2)}┐`;
  const header = `│ ${'Key'.padEnd(maxKeyLen)} │ ${'Change Type'.padEnd(maxTypeLen)} │`;
  const separator = `├${'─'.repeat(maxKeyLen + 2)}┼${'─'.repeat(maxTypeLen + 2)}┤`;
  const bottomBorder = `└${'─'.repeat(maxKeyLen + 2)}┴${'─'.repeat(maxTypeLen + 2)}┘`;

  return [
    topBorder,
    header,
    separator,
    ...rows.map(
      (r) => `│ ${r[0].padEnd(maxKeyLen)} │ ${r[1].padEnd(maxTypeLen)} │`,
    ),
    bottomBorder,
  ].join('\n');
}
