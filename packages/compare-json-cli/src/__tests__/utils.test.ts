import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  beforeEach,
  vi,
} from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { packageDirectorySync } from 'package-directory';
import { getPkgVersion, parseInput } from '../utils';
import { version as pkgVersion } from '../../package.json';

vi.mock('package-directory', () => ({
  packageDirectorySync: vi.fn(),
}));

beforeAll(() => {
  mkdirSync(join(__dirname, 'temp'), { recursive: true });
});

describe('getPkgVersion', () => {
  beforeEach(() => {
    vi.mocked(packageDirectorySync).mockReturnValue(join(__dirname, '../..'));
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
  const testFile = join(__dirname, 'temp', 'test.json');

  afterEach(() => {
    try {
      unlinkSync(testFile);
    } catch {
      //
    }
  });

  it('should parse JSON string', () => {
    const result = parseInput('{"a":1}', 'base');
    expect(result).toEqual({ a: 1 });
  });

  it('should parse JSON file', () => {
    writeFileSync(testFile, JSON.stringify({ b: 2 }));
    const result = parseInput(testFile, 'contrast');
    expect(result).toEqual({ b: 2 });
  });

  it('should throw error for invalid JSON string from argument', () => {
    expect(() => parseInput('{invalid}', 'base')).toThrow(
      /Failed to parse base input: if you passed a file path, the file was not found; if you passed a JSON string, it failed to parse\. Error: .+/,
    );
  });

  it('should throw error for invalid JSON file path', () => {
    const testFile = join(__dirname, 'temp', 'unknown.json');
    expect(() => parseInput(testFile, 'contrast')).toThrow(
      /Failed to parse contrast input: if you passed a file path, the file was not found; if you passed a JSON string, it failed to parse\. Error: .+/,
    );
  });

  it('should throw error for invalid JSON file content', () => {
    const testFile = join(__dirname, 'temp', 'invalid.json');
    writeFileSync(testFile, 'not valid json');
    expect(() => parseInput(testFile, 'contrast')).toThrow(
      new RegExp(
        `Failed to parse contrast file content from ${testFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}, unable to parse as JSON\\. Error: .+`,
      ),
    );
    unlinkSync(testFile);
  });
});
