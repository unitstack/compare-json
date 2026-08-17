import { getValueType, pathSegmentsToString } from '@compare-json/core';

export interface JSONCodeLine {
  pathSegments: string[];
  pathString: string;
  startLineNumber: number;
  endLineNumber: number;
  content: string;
}

export function jsonToCodeLines({
  json,
  anotherJSON,
}: {
  json: unknown;
  anotherJSON: unknown;
}): JSONCodeLine[] {
  return valueToCodeLines({
    value: json,
    anotherJSON,
    pathSegments: [],
    startLineNumber: 1,
    hasPrefixKey: false,
    hasEndComma: false,
  }).map((item) => ({
    ...item,
    pathSegments: [...item.pathSegments],
  }));
}

function getAtPath(json: unknown, pathSegments: string[]): unknown {
  let current: unknown = json;

  for (const segment of pathSegments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    const match = /^\[(\d+)\]$/.exec(segment);
    const key: string | number = match ? Number(match[1]) : segment;
    current = (current as Record<string | number, unknown>)[key];
  }

  return current;
}

function valueToCodeLines({
  value,
  anotherJSON,
  pathSegments,
  startLineNumber,
  hasPrefixKey,
  hasEndComma,
}: {
  value: unknown;
  anotherJSON: unknown;
  pathSegments: string[];
  startLineNumber: number;
  hasPrefixKey: boolean;
  hasEndComma: boolean;
}): JSONCodeLine[] {
  const type = getValueType(value);
  const key = pathSegments[pathSegments.length - 1] || '';

  if (type === 'object') {
    return objectToCodeLines({
      value: value as Record<string, unknown>,
      anotherJSON,
      pathSegments,
      startLineNumber,
      hasEndComma,
      hasPrefixKey,
    });
  } else if (type === 'array') {
    return arrayToCodeLines({
      value: value as unknown[],
      anotherJSON,
      pathSegments,
      startLineNumber,
      hasEndComma,
      hasPrefixKey,
    });
  } else {
    return [
      {
        pathSegments,
        pathString: pathSegmentsToString(pathSegments),
        content: formatBaseValue({
          type,
          key,
          value,
          hasPrefixKey,
          hasEndComma,
        }),
        startLineNumber,
        endLineNumber: startLineNumber,
      },
    ];
  }
}

function objectToCodeLines({
  value,
  anotherJSON,
  pathSegments,
  startLineNumber,
  hasEndComma,
  hasPrefixKey,
}: {
  value: Record<string, unknown>;
  anotherJSON: unknown;
  pathSegments: string[];
  startLineNumber: number;
  hasEndComma: boolean;
  hasPrefixKey: boolean;
}): JSONCodeLine[] {
  const key = pathSegments[pathSegments.length - 1] || '';
  const pathString = pathSegmentsToString(pathSegments);
  const lines: JSONCodeLine[] = [
    {
      pathSegments,
      pathString,
      content: `${hasPrefixKey ? formatDataKey(key) : ''}{`,
      startLineNumber,
      endLineNumber: startLineNumber,
    },
  ];
  const childKeys = Object.keys(value).sort((a, b) => a.localeCompare(b));

  let lineNumber = startLineNumber;

  childKeys.forEach((childKey, index) => {
    const childValue = value[childKey];

    const childLines = valueToCodeLines({
      value: childValue,
      anotherJSON,
      pathSegments: pathSegments.concat([childKey]),
      startLineNumber: lineNumber + 1,
      hasPrefixKey: true,
      hasEndComma: childKeys.length > 1 && index < childKeys.length - 1,
    });

    lines.push(...childLines);

    lineNumber += childLines.length;
  });

  const valueInAnotherJSON = getAtPath(anotherJSON, pathSegments);
  const endStr = `}${addEndComma(hasEndComma)}`;

  if (lines.length > 1 || getValueType(valueInAnotherJSON) === 'object') {
    const endLineNumber = lineNumber + 1;

    lines[0].endLineNumber = endLineNumber;
    lines.push({
      pathSegments,
      pathString,
      content: endStr,
      startLineNumber: endLineNumber,
      endLineNumber,
    });
  } else {
    lines[0].content += endStr;
  }

  return lines;
}

function arrayToCodeLines({
  value,
  anotherJSON,
  pathSegments,
  startLineNumber,
  hasEndComma,
  hasPrefixKey,
}: {
  value: unknown[];
  anotherJSON: unknown;
  pathSegments: string[];
  startLineNumber: number;
  hasEndComma: boolean;
  hasPrefixKey: boolean;
}): JSONCodeLine[] {
  const key = pathSegments[pathSegments.length - 1] || '';
  const pathString = pathSegmentsToString(pathSegments);
  const lines: JSONCodeLine[] = [
    {
      pathSegments,
      pathString,
      content: `${hasPrefixKey ? formatDataKey(key) : ''}[`,
      startLineNumber,
      endLineNumber: startLineNumber,
    },
  ];
  let lineNumber = startLineNumber;

  value.forEach((childValue, childIndex) => {
    const childLines = valueToCodeLines({
      value: childValue,
      anotherJSON,
      pathSegments: pathSegments.concat([`[${childIndex}]`]),
      startLineNumber: lineNumber + 1,
      hasPrefixKey: false,
      hasEndComma: value.length > 1 && childIndex < value.length - 1,
    });

    lines.push(...childLines);
    lineNumber += childLines.length;
  });

  const valueInAnotherJSON = getAtPath(anotherJSON, pathSegments);
  const endStr = `]${addEndComma(hasEndComma)}`;

  if (lines.length > 1 || getValueType(valueInAnotherJSON) === 'array') {
    const endLineNumber = lineNumber + 1;

    lines[0].endLineNumber = endLineNumber;
    lines.push({
      pathSegments,
      pathString,
      content: endStr,
      startLineNumber: endLineNumber,
      endLineNumber,
    });
  } else {
    lines[0].content += endStr;
  }

  return lines;
}

function formatDataKey(key: string | number) {
  return typeof key === 'string' ? `${JSON.stringify(key)}: ` : '';
}

function addEndComma(hasEndComma: boolean) {
  return hasEndComma ? ',' : '';
}

function formatBaseValue({
  type,
  key,
  value,
  hasPrefixKey,
  hasEndComma,
}: {
  type: string;
  key: string | number;
  value: unknown;
  hasPrefixKey: boolean;
  hasEndComma: boolean;
}) {
  const keyStr = hasPrefixKey ? formatDataKey(key) : '';
  const valueStr = type === 'string' ? JSON.stringify(value) : String(value);

  return `${keyStr}${valueStr}${addEndComma(hasEndComma)}`;
}
