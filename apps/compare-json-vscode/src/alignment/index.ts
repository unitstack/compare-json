import type { JSONValueDifference } from '@compare-json/core';
import { jsonToCodeLines } from './codeLine';
import { showJSONCodeWithDifferences, type JSONViewLine } from './codeView';

export interface AlignedDocuments {
  baseText: string;
  contrastText: string;
  /** diff pathString -> 1-based line number in the aligned documents (valid for both sides) */
  lineMap: Map<string, number>;
}

const INDENT = '  ';

export function buildAlignedDocuments({
  baseJSON,
  contrastJSON,
  differences,
}: {
  baseJSON: unknown;
  contrastJSON: unknown;
  differences: JSONValueDifference[];
}): AlignedDocuments {
  const [baseViewLines, contrastViewLines] = showJSONCodeWithDifferences({
    jsonCodeLines: jsonToCodeLines({
      json: baseJSON,
      anotherJSON: contrastJSON,
    }),
    anotherJSONCodeLines: jsonToCodeLines({
      json: contrastJSON,
      anotherJSON: baseJSON,
    }),
    jsonValueDifferences: differences,
  });

  // Defensive: both sides must end up with the same number of lines.
  while (baseViewLines.length < contrastViewLines.length) {
    baseViewLines.push({ codeLine: undefined, blank: true });
  }
  while (contrastViewLines.length < baseViewLines.length) {
    contrastViewLines.push({ codeLine: undefined, blank: true });
  }

  return {
    baseText: renderViewLines(baseViewLines),
    contrastText: renderViewLines(contrastViewLines),
    lineMap: buildLineMap(differences, baseViewLines, contrastViewLines),
  };
}

function renderViewLines(viewLines: JSONViewLine[]): string {
  return viewLines
    .map((line) =>
      line.codeLine
        ? INDENT.repeat(line.codeLine.pathSegments.length) +
          line.codeLine.content
        : '',
    )
    .join('\n');
}

function buildLineMap(
  differences: JSONValueDifference[],
  baseViewLines: JSONViewLine[],
  contrastViewLines: JSONViewLine[],
): Map<string, number> {
  const lineMap = new Map<string, number>();

  for (const diff of differences) {
    const viewLines =
      diff.pathBelongsTo === 'contrast' ? contrastViewLines : baseViewLines;
    const index = viewLines.findIndex(
      (line) => line.codeLine?.pathString === diff.pathString,
    );

    if (index >= 0) {
      lineMap.set(diff.pathString, index + 1);
    }
  }

  return lineMap;
}
