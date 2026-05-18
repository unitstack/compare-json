import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import { packageDirectorySync } from 'package-directory';
import { getPkgVersion, parseInput } from '../utils';
import { version as pkgVersion } from '../../../package.json';

vi.mock('package-directory', () => ({
  packageDirectorySync: vi.fn(),
}));

describe('getPkgVersion', () => {
  beforeEach(() => {
    vi.mocked(packageDirectorySync).mockReturnValue(
      join(__dirname, '../../..'),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return the package version', () => {
    const version = getPkgVersion();
    expect(version).toEqual(pkgVersion);
  });

  it('should throw error when package directory not found', () => {
    vi.mocked(packageDirectorySync).mockReturnValue(undefined);
    expect(() => getPkgVersion()).toThrow('Failed to find package directory');
  });
});

describe('parseInput', () => {
  const testFile = join(__dirname, 'test.json');
  const testData = { test: 'data' };

  beforeAll(() => {
    writeFileSync(testFile, JSON.stringify(testData));
  });

  afterAll(() => {
    unlinkSync(testFile);
  });

  it('should throw error when no input provided', () => {
    expect(() => parseInput(undefined, undefined, undefined, 'base')).toThrow(
      'No base value provided. Please set one of: baseJSON, baseJSONString, or baseJSONFilePath',
    );
  });

  it('should parse JSON from file path', () => {
    const result = parseInput(undefined, undefined, testFile, 'base');
    expect(result).toEqual(testData);
  });

  it('should throw error for non-existent file', () => {
    expect(() =>
      parseInput(undefined, undefined, '/nonexistent/file.json', 'base'),
    ).toThrow('base file not found: /nonexistent/file.json');
  });

  it('should throw error for invalid JSON file content', () => {
    const invalidFile = join(__dirname, 'invalid.json');
    writeFileSync(invalidFile, 'invalid json');
    expect(() =>
      parseInput(undefined, undefined, invalidFile, 'contrast'),
    ).toThrow(/Failed to parse contrast file content from .+\. Error: .+/);
    unlinkSync(invalidFile);
  });

  it('should parse JSON from string', () => {
    const result = parseInput(undefined, '{"key":"value"}', undefined, 'base');
    expect(result).toEqual({ key: 'value' });
  });

  it('should throw error for invalid JSON string', () => {
    expect(() =>
      parseInput(undefined, 'invalid json', undefined, 'base'),
    ).toThrow(/Failed to parse base JSON string\. Error: .+/);
  });

  it('should return JSON value directly', () => {
    const input = { direct: 'object' };
    const result = parseInput(input, undefined, undefined, 'base');
    expect(result).toEqual(input);
  });

  it('should prioritize file path over string and JSON', () => {
    const result = parseInput({ a: 1 }, '{"b":2}', testFile, 'base');
    expect(result).toEqual(testData);
  });

  it('should prioritize string over JSON', () => {
    const result = parseInput({ a: 1 }, '{"b":2}', undefined, 'base');
    expect(result).toEqual({ b: 2 });
  });
});
