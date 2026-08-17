import * as vscode from 'vscode';
import type { ArrayCompareMethod, CompareOptions } from '@compare-json/core';

const ARRAY_COMPARE_METHODS: readonly ArrayCompareMethod[] = [
  'byIndex',
  'lcs',
  'unordered',
];

export function readDefaultOptions(
  output: vscode.OutputChannel,
): Required<CompareOptions> {
  const config = vscode.workspace.getConfiguration('compare-json');
  const configuredMethod = config.get<string>('arrayCompareMethod', 'byIndex');
  const isValidMethod = (ARRAY_COMPARE_METHODS as readonly string[]).includes(
    configuredMethod,
  );

  if (!isValidMethod) {
    output.appendLine(
      `[compare-json] Invalid arrayCompareMethod "${configuredMethod}", falling back to "byIndex".`,
    );
  }

  return {
    arrayCompareMethod: isValidMethod
      ? (configuredMethod as ArrayCompareMethod)
      : 'byIndex',
    keyCaseInsensitive: config.get<boolean>('keyCaseInsensitive', false),
    valueCaseInsensitive: config.get<boolean>('valueCaseInsensitive', false),
    numericStringEqualsNumber: config.get<boolean>(
      'numericStringEqualsNumber',
      false,
    ),
  };
}
