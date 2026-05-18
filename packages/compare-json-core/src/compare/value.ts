import { getValueType, pathSegmentsToString } from '@/utils';
import type { CompareOptions, JSONValueDifference } from '@/types';
import { compareObject } from './object';
import { compareArray, compareArrayLCS, compareArrayUnordered } from './array';

export function compareJSONValue({
  baseJSON,
  contrastJSON,
  pathSegments,
  options = {},
}: {
  baseJSON: unknown;
  contrastJSON: unknown;
  pathSegments: string[];
  options?: CompareOptions;
}): JSONValueDifference[] {
  const valueType = getValueType(baseJSON);
  const otherValueType = getValueType(contrastJSON);

  if (valueType === 'object' && otherValueType === 'object') {
    return compareObject({
      baseObject: baseJSON as Record<string, unknown>,
      contrastObject: contrastJSON as Record<string, unknown>,
      pathSegments,
      options,
    });
  } else if (valueType === 'array' && otherValueType === 'array') {
    const arrayCompareMethod = options.arrayCompareMethod;
    const compareFn =
      arrayCompareMethod === 'lcs'
        ? compareArrayLCS
        : arrayCompareMethod === 'unordered'
          ? compareArrayUnordered
          : compareArray;
    return compareFn({
      baseArray: baseJSON as unknown[],
      contrastArray: contrastJSON as unknown[],
      pathSegments,
      options,
    });
  } else if (valueType !== otherValueType) {
    if (options.numericStringEqualsNumber) {
      const isNumericStringMatch =
        (valueType === 'string' &&
          otherValueType === 'number' &&
          !isNaN(Number(baseJSON)) &&
          Number(baseJSON) === contrastJSON) ||
        (valueType === 'number' &&
          otherValueType === 'string' &&
          !isNaN(Number(contrastJSON)) &&
          baseJSON === Number(contrastJSON));

      if (isNumericStringMatch) {
        return [];
      }
    }

    return [
      {
        pathSegments,
        pathString: pathSegmentsToString(pathSegments),
        pathBelongsTo: 'both',
        diffType: 'typeChanged',
      },
    ];
  } else if (
    options.valueCaseInsensitive && valueType === 'string'
      ? (baseJSON as string).toLowerCase() !==
        (contrastJSON as string).toLowerCase()
      : baseJSON !== contrastJSON
  ) {
    return [
      {
        pathSegments,
        pathString: pathSegmentsToString(pathSegments),
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ];
  } else {
    return [];
  }
}
