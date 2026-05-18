export type JSONValueDiffType =
  | 'added'
  | 'deleted'
  | 'typeChanged'
  | 'valueChanged';

export type ArrayCompareMethod = 'byIndex' | 'lcs' | 'unordered';

export interface CompareOptions {
  arrayCompareMethod?: ArrayCompareMethod;
  keyCaseInsensitive?: boolean;
  valueCaseInsensitive?: boolean;
  numericStringEqualsNumber?: boolean;
}

export interface JSONValueDifference {
  pathSegments: string[];
  pathString: string;
  pathBelongsTo: 'base' | 'contrast' | 'both';
  diffType: JSONValueDiffType;
}
