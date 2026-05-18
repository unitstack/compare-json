export type {
  JSONValueDiffType,
  ArrayCompareMethod,
  CompareOptions,
  JSONValueDifference,
} from '@/types';
import type { CompareOptions, JSONValueDifference } from '@/types';
import { compareJSONValue } from './value';

export function compareJSON({
  baseJSON,
  contrastJSON,
  options = {},
}: {
  baseJSON: unknown;
  contrastJSON: unknown;
  options?: CompareOptions;
}): JSONValueDifference[] {
  return compareJSONValue({
    baseJSON,
    contrastJSON,
    pathSegments: [],
    options,
  });
}
