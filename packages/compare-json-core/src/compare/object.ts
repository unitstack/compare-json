import { pathSegmentsToString } from '@/utils';
import type { CompareOptions, JSONValueDifference } from '@/types';
import { compareJSONValue } from './value';

export function compareObject({
  baseObject,
  contrastObject,
  pathSegments,
  options = {},
}: {
  baseObject: Record<string, unknown>;
  contrastObject: Record<string, unknown>;
  pathSegments: string[];
  options?: CompareOptions;
}) {
  const differences: JSONValueDifference[] = [];
  const baseKeys = Object.keys(baseObject);
  const contrastKeys = Object.keys(contrastObject);
  const ignoreKey = options.keyCaseInsensitive ?? false;

  const contrastKeyMap = ignoreKey
    ? buildCaseInsensitiveMap(contrastKeys)
    : null;

  const matchedContrastKeys = new Set<string>();

  for (const key of baseKeys) {
    const baseValue = baseObject[key];
    const matchedContrastKey = ignoreKey
      ? findUnmatchedKey(
          contrastKeyMap!,
          key.toLowerCase(),
          matchedContrastKeys,
        )
      : key;
    const newPathSegments = pathSegments.concat([key]);

    if (
      matchedContrastKey === undefined ||
      !(matchedContrastKey in contrastObject)
    ) {
      differences.push({
        pathSegments: newPathSegments,
        pathString: pathSegmentsToString(newPathSegments),
        pathBelongsTo: 'base',
        diffType: 'deleted',
      });
    } else {
      matchedContrastKeys.add(matchedContrastKey);
      const contrastValue = contrastObject[matchedContrastKey];
      differences.push(
        ...compareJSONValue({
          baseJSON: baseValue,
          contrastJSON: contrastValue,
          pathSegments: newPathSegments,
          options,
        }),
      );
    }
  }

  for (const key of contrastKeys) {
    if (matchedContrastKeys.has(key)) continue;
    const hasMatch = ignoreKey
      ? baseKeys.some((sk) => sk.toLowerCase() === key.toLowerCase())
      : key in baseObject;
    if (!hasMatch) {
      const newPathSegments = pathSegments.concat([key]);
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

function buildCaseInsensitiveMap(keys: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const k of keys) {
    const lower = k.toLowerCase();
    const list = map.get(lower);
    if (list) {
      list.push(k);
    } else {
      map.set(lower, [k]);
    }
  }
  return map;
}

function findUnmatchedKey(
  map: Map<string, string[]>,
  lowerKey: string,
  matched: Set<string>,
): string | undefined {
  const candidates = map.get(lowerKey);
  if (!candidates) return undefined;
  return candidates.find((k) => !matched.has(k));
}
