import type {
  JSONValueDifference,
  JSONValueDiffType,
} from '@compare-json/core';
import type { JSONCodeLine } from './codeLine';

export interface JSONViewLine {
  codeLine: JSONCodeLine | undefined;
  diffType?: JSONValueDiffType;
  blank?: boolean;
}

export function showJSONCodeWithDifferences({
  jsonCodeLines,
  anotherJSONCodeLines,
  jsonValueDifferences,
}: {
  jsonCodeLines: JSONCodeLine[];
  anotherJSONCodeLines: JSONCodeLine[];
  jsonValueDifferences: JSONValueDifference[];
}): [JSONViewLine[], JSONViewLine[]] {
  const baseDiffMap = new Map<string, JSONValueDifference>();
  const contrastDiffMap = new Map<string, JSONValueDifference>();
  const bothDiffMap = new Map<string, JSONValueDifference>();

  jsonValueDifferences.forEach((item) => {
    if (item.pathBelongsTo === 'base') {
      baseDiffMap.set(item.pathString.toLowerCase(), item);
    } else if (item.pathBelongsTo === 'contrast') {
      contrastDiffMap.set(item.pathString.toLowerCase(), item);
    } else {
      bothDiffMap.set(item.pathString.toLowerCase(), item);
    }
  });

  const viewLines: JSONViewLine[] = jsonCodeLines.map((line) => ({
    codeLine: line,
  }));
  const anotherViewLines: JSONViewLine[] = anotherJSONCodeLines.map((line) => ({
    codeLine: line,
  }));
  let index = 0;
  let anotherIndex = 0;

  while (index < viewLines.length || anotherIndex < anotherViewLines.length) {
    const codeLine = viewLines[index]?.codeLine;
    const anotherCodeLine = anotherViewLines[anotherIndex]?.codeLine;
    let skipLineCount = 1;

    if (
      codeLine &&
      anotherCodeLine &&
      baseDiffMap.has(codeLine.pathString.toLowerCase()) &&
      contrastDiffMap.has(anotherCodeLine.pathString.toLowerCase())
    ) {
      const { maxLineCount } = setReplacedCodeLines({
        viewLines,
        anotherViewLines,
        codeLine,
        anotherCodeLine,
        index,
        anotherIndex,
      });

      skipLineCount = maxLineCount;
    } else if (codeLine && baseDiffMap.has(codeLine.pathString.toLowerCase())) {
      const { lineCount } = setRemovedCodeLines({
        viewLines,
        anotherViewLines,
        codeLine,
        anotherIndex,
      });

      skipLineCount = lineCount;
    } else if (
      anotherCodeLine &&
      contrastDiffMap.has(anotherCodeLine.pathString.toLowerCase())
    ) {
      const { lineCount } = setAddedCodeLines({
        viewLines,
        anotherViewLines,
        anotherCodeLine,
        index,
      });

      skipLineCount = lineCount;
    } else if (
      codeLine &&
      anotherCodeLine &&
      codeLine.pathString.toLowerCase() ===
        anotherCodeLine.pathString.toLowerCase() &&
      bothDiffMap.has(codeLine.pathString.toLowerCase())
    ) {
      const { maxLineCount } = setTypeChangedOrValueChangedCodeLines({
        viewLines,
        anotherViewLines,
        codeLine,
        anotherCodeLine,
        index,
        anotherIndex,
        diffType: bothDiffMap.get(codeLine.pathString.toLowerCase())?.diffType,
      });

      skipLineCount = maxLineCount;
    }

    index += skipLineCount;
    anotherIndex += skipLineCount;
  }

  return [viewLines, anotherViewLines];
}

function setDiffTypeToViewLines({
  viewLines,
  startLineNumber,
  endLineNumber,
  diffType,
}: {
  viewLines: JSONViewLine[];
  startLineNumber: number;
  endLineNumber: number;
  diffType: JSONValueDiffType | undefined;
}) {
  viewLines.forEach((line) => {
    const { codeLine } = line;

    if (
      codeLine &&
      startLineNumber <= codeLine.startLineNumber &&
      endLineNumber >= codeLine.endLineNumber
    ) {
      line.diffType = diffType;
    }
  });

  return viewLines;
}

function addBlankLines({
  viewLines,
  index,
  count,
}: {
  viewLines: JSONViewLine[];
  index: number;
  count: number;
}) {
  viewLines.splice(
    index,
    0,
    ...Array.from(
      { length: count },
      (): JSONViewLine => ({
        codeLine: undefined,
        blank: true,
      }),
    ),
  );
}

function setTypeChangedOrValueChangedCodeLines({
  viewLines,
  anotherViewLines,
  codeLine,
  anotherCodeLine,
  index,
  anotherIndex,
  diffType,
}: {
  viewLines: JSONViewLine[];
  anotherViewLines: JSONViewLine[];
  codeLine: JSONCodeLine;
  anotherCodeLine: JSONCodeLine;
  index: number;
  anotherIndex: number;
  diffType: JSONValueDiffType | undefined;
}) {
  const lineCount = codeLine.endLineNumber - codeLine.startLineNumber + 1;
  const anotherLineCount =
    anotherCodeLine.endLineNumber - anotherCodeLine.startLineNumber + 1;
  const lineCountDelta = anotherLineCount - lineCount;

  setDiffTypeToViewLines({
    viewLines,
    startLineNumber: codeLine.startLineNumber,
    endLineNumber: codeLine.endLineNumber,
    diffType,
  });

  setDiffTypeToViewLines({
    viewLines: anotherViewLines,
    startLineNumber: anotherCodeLine.startLineNumber,
    endLineNumber: anotherCodeLine.endLineNumber,
    diffType,
  });

  if (lineCountDelta > 0) {
    addBlankLines({
      viewLines,
      index: index + lineCount,
      count: lineCountDelta,
    });
  } else if (lineCountDelta < 0) {
    addBlankLines({
      viewLines: anotherViewLines,
      index: anotherIndex + anotherLineCount,
      count: Math.abs(lineCountDelta),
    });
  }

  return { maxLineCount: Math.max(lineCount, anotherLineCount) };
}

function setReplacedCodeLines({
  viewLines,
  anotherViewLines,
  codeLine,
  anotherCodeLine,
  index,
  anotherIndex,
}: {
  viewLines: JSONViewLine[];
  anotherViewLines: JSONViewLine[];
  codeLine: JSONCodeLine;
  anotherCodeLine: JSONCodeLine;
  index: number;
  anotherIndex: number;
}) {
  const lineCount = codeLine.endLineNumber - codeLine.startLineNumber + 1;
  const anotherLineCount =
    anotherCodeLine.endLineNumber - anotherCodeLine.startLineNumber + 1;
  const lineCountDelta = anotherLineCount - lineCount;

  setDiffTypeToViewLines({
    viewLines,
    startLineNumber: codeLine.startLineNumber,
    endLineNumber: codeLine.endLineNumber,
    diffType: 'deleted',
  });

  setDiffTypeToViewLines({
    viewLines: anotherViewLines,
    startLineNumber: anotherCodeLine.startLineNumber,
    endLineNumber: anotherCodeLine.endLineNumber,
    diffType: 'added',
  });

  if (lineCountDelta > 0) {
    addBlankLines({
      viewLines,
      index: index + lineCount,
      count: lineCountDelta,
    });
  } else if (lineCountDelta < 0) {
    addBlankLines({
      viewLines: anotherViewLines,
      index: anotherIndex + anotherLineCount,
      count: Math.abs(lineCountDelta),
    });
  }

  return { maxLineCount: Math.max(lineCount, anotherLineCount) };
}

function setAddedCodeLines({
  viewLines,
  anotherViewLines,
  anotherCodeLine,
  index,
}: {
  viewLines: JSONViewLine[];
  anotherViewLines: JSONViewLine[];
  anotherCodeLine: JSONCodeLine;
  index: number;
}) {
  const lineCount =
    anotherCodeLine.endLineNumber - anotherCodeLine.startLineNumber + 1;

  setDiffTypeToViewLines({
    viewLines: anotherViewLines,
    startLineNumber: anotherCodeLine.startLineNumber,
    endLineNumber: anotherCodeLine.endLineNumber,
    diffType: 'added',
  });

  addBlankLines({ viewLines, index, count: lineCount });

  return { lineCount };
}

function setRemovedCodeLines({
  viewLines,
  anotherViewLines,
  codeLine,
  anotherIndex,
}: {
  viewLines: JSONViewLine[];
  anotherViewLines: JSONViewLine[];
  codeLine: JSONCodeLine;
  anotherIndex: number;
}) {
  const lineCount = codeLine.endLineNumber - codeLine.startLineNumber + 1;

  setDiffTypeToViewLines({
    viewLines,
    startLineNumber: codeLine.startLineNumber,
    endLineNumber: codeLine.endLineNumber,
    diffType: 'deleted',
  });

  addBlankLines({
    viewLines: anotherViewLines,
    index: anotherIndex,
    count: lineCount,
  });

  return { lineCount };
}
