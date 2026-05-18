export type ValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'object'
  | 'array';

export function getValueType(value: unknown): ValueType {
  return Object.prototype.toString
    .call(value)
    .slice(8, -1)
    .toLocaleLowerCase() as ValueType;
}

export function pathSegmentsToString(pathSegments: string[]) {
  if (pathSegments.length === 0) {
    return '';
  }

  let result = pathSegments[0];
  for (let i = 1; i < pathSegments.length; i++) {
    const seg = pathSegments[i];

    result += /^\[\d+\]$/.test(seg) ? seg : `.${seg}`;
  }
  return result;
}
