import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { packageDirectorySync } from 'package-directory';

export function getPkgVersion(): string {
  const pkgDir = packageDirectorySync({ cwd: __dirname });
  if (!pkgDir) {
    throw new Error('Failed to find package directory');
  }

  const pkg = JSON.parse(
    readFileSync(join(pkgDir, 'package.json'), 'utf-8'),
  ) as {
    version: string;
  };
  return pkg.version;
}

export function parseInput(input: string, label: 'base' | 'contrast'): unknown {
  let jsonInput: {
    from: 'argument' | 'file';
    value: string;
    filePath?: string;
  } = {
    from: 'argument',
    value: input,
  };

  if (existsSync(input)) {
    jsonInput = {
      from: 'file',
      value: readFileSync(input, 'utf-8'),
      filePath: input,
    };
  }

  try {
    return JSON.parse(jsonInput.value);
  } catch (error) {
    if (jsonInput.from === 'argument') {
      throw new Error(
        `Failed to parse ${label} input: if you passed a file path, the file was not found; if you passed a JSON string, it failed to parse. Error: ${(error as Error | undefined)?.message}`,
      );
    } else {
      throw new Error(
        `Failed to parse ${label} file content from ${jsonInput.filePath}, unable to parse as JSON. Error: ${(error as Error | undefined)?.message}`,
      );
    }
  }
}
