import { pathSegmentsToString } from '@/utils';
import type { CompareOptions, JSONValueDifference } from '@/types';
import { compareJSONValue } from './value';

export function compareArray({
  baseArray,
  contrastArray,
  pathSegments = [],
  options = {},
}: {
  baseArray: unknown[];
  contrastArray: unknown[];
  pathSegments: string[];
  options?: CompareOptions;
}): JSONValueDifference[] {
  const differences: JSONValueDifference[] = [];
  const minLength = Math.min(baseArray.length, contrastArray.length);

  for (let index = 0; index < minLength; index++) {
    const newPathSegments = pathSegments.concat([formatIndexStr(index)]);
    differences.push(
      ...compareJSONValue({
        baseJSON: baseArray[index],
        contrastJSON: contrastArray[index],
        pathSegments: newPathSegments,
        options,
      }),
    );
  }

  if (minLength < baseArray.length) {
    for (let index = minLength; index < baseArray.length; index++) {
      const newPathSegments = pathSegments.concat([formatIndexStr(index)]);
      differences.push({
        pathSegments: newPathSegments,
        pathString: pathSegmentsToString(newPathSegments),
        pathBelongsTo: 'base',
        diffType: 'deleted',
      });
    }
  }

  if (minLength < contrastArray.length) {
    for (let index = minLength; index < contrastArray.length; index++) {
      const newPathSegments = pathSegments.concat([formatIndexStr(index)]);
      differences.push({
        pathSegments: newPathSegments,
        pathString: pathSegmentsToString(newPathSegments),
        pathBelongsTo: 'contrast',
        diffType: 'added',
      });
    }
  }

  return differences;
}

export function compareArrayLCS({
  baseArray,
  contrastArray,
  pathSegments = [],
  options = {},
}: {
  baseArray: unknown[];
  contrastArray: unknown[];
  pathSegments: string[];
  options?: CompareOptions;
}): JSONValueDifference[] {
  const differences: JSONValueDifference[] = [];
  const { baseMatchedIndex, contrastMatchedIndex } = computeLCS(
    baseArray,
    contrastArray,
    options,
  );

  const baseInLCS = new Set(baseMatchedIndex);
  const contrastInLCS = new Set(contrastMatchedIndex);

  for (let i = 0; i < baseArray.length; i++) {
    if (!baseInLCS.has(i)) {
      const newPathSegments = pathSegments.concat([formatIndexStr(i)]);
      differences.push({
        pathSegments: newPathSegments,
        pathString: pathSegmentsToString(newPathSegments),
        pathBelongsTo: 'base',
        diffType: 'deleted',
      });
    }
  }

  for (let i = 0; i < contrastArray.length; i++) {
    if (!contrastInLCS.has(i)) {
      const newPathSegments = pathSegments.concat([formatIndexStr(i)]);
      differences.push({
        pathSegments: newPathSegments,
        pathString: pathSegmentsToString(newPathSegments),
        pathBelongsTo: 'contrast',
        diffType: 'added',
      });
    }
  }

  return differences;
}

export function compareArrayUnordered({
  baseArray,
  contrastArray,
  pathSegments = [],
  options = {},
}: {
  baseArray: unknown[];
  contrastArray: unknown[];
  pathSegments: string[];
  options?: CompareOptions;
}): JSONValueDifference[] {
  const differences: JSONValueDifference[] = [];
  const contrastMatched = new Array(contrastArray.length).fill(false);

  for (let i = 0; i < baseArray.length; i++) {
    let found = false;
    for (let j = 0; j < contrastArray.length; j++) {
      if (
        !contrastMatched[j] &&
        deepEqual(baseArray[i], contrastArray[j], options)
      ) {
        contrastMatched[j] = true;
        found = true;
        break;
      }
    }
    if (!found) {
      const newPathSegments = pathSegments.concat([`[${i}]`]);
      differences.push({
        pathSegments: newPathSegments,
        pathString: pathSegmentsToString(newPathSegments),
        pathBelongsTo: 'base',
        diffType: 'deleted',
      });
    }
  }

  for (let j = 0; j < contrastArray.length; j++) {
    if (!contrastMatched[j]) {
      const newPathSegments = pathSegments.concat([formatIndexStr(j)]);
      differences.push({
        pathSegments: newPathSegments,
        pathString: pathSegmentsToString(newPathSegments),
        pathBelongsTo: 'contrast',
        diffType: 'added',
      });
    }
  }

  return differences;
}

function formatIndexStr(index: number): string {
  return `[${index}]`;
}

export function deepEqual(
  a: unknown,
  b: unknown,
  options: CompareOptions = {},
): boolean {
  const differences = compareJSONValue({
    baseJSON: a,
    contrastJSON: b,
    options,
    pathSegments: [],
  });

  return differences.length === 0;
}

function computeLCS(
  base: unknown[],
  contrast: unknown[],
  options: CompareOptions = {},
): { baseMatchedIndex: number[]; contrastMatchedIndex: number[] } {
  const m = base.length;
  const n = contrast.length;
  const dp: number[][] = Array.from(
    { length: m + 1 },
    () => Array(n + 1).fill(0) as number[],
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (deepEqual(base[i - 1], contrast[j - 1], options)) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const baseMatchedIndex: number[] = [];
  const contrastMatchedIndex: number[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (deepEqual(base[i - 1], contrast[j - 1], options)) {
      baseMatchedIndex.unshift(i - 1);
      contrastMatchedIndex.unshift(j - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return { baseMatchedIndex, contrastMatchedIndex };
}
