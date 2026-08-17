import {
  compareJSON,
  type CompareOptions,
  type JSONValueDifference,
} from '@compare-json/core';
import { buildAlignedDocuments } from '../alignment';

export interface SourceText {
  label: string;
  text: string;
}

export interface SessionData {
  base: SourceText;
  contrast: SourceText;
  options: Required<CompareOptions>;
  differences: JSONValueDifference[];
  baseAlignedText: string;
  contrastAlignedText: string;
  /** diff pathString -> 1-based line number in the aligned documents (valid for both sides) */
  lineMap: Map<string, number>;
}

export function computeSession(
  base: SourceText,
  contrast: SourceText,
  options: Required<CompareOptions>,
): SessionData {
  const baseJSON = parseJSONWithLocation(base.text, base.label);
  const contrastJSON = parseJSONWithLocation(contrast.text, contrast.label);
  const differences = compareJSON({ baseJSON, contrastJSON, options });
  const { baseText, contrastText, lineMap } = buildAlignedDocuments({
    baseJSON,
    contrastJSON,
    differences,
  });

  return {
    base,
    contrast,
    options,
    differences,
    baseAlignedText: baseText,
    contrastAlignedText: contrastText,
    lineMap,
  };
}

export function parseJSONWithLocation(text: string, label: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const position = /position (\d+)/.exec(message);

    if (position) {
      const offset = Number(position[1]);
      const before = text.slice(0, offset);
      const line = before.split('\n').length;
      const column = offset - before.lastIndexOf('\n');

      throw new Error(
        `Invalid JSON in ${label} at line ${line}, column ${column}: ${message}`,
      );
    }

    throw new Error(`Invalid JSON in ${label}: ${message}`);
  }
}
