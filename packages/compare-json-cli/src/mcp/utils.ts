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

export function parseInput(
  json: unknown,
  jsonString: string | undefined,
  jsonFilePath: string | undefined,
  label: 'base' | 'contrast',
): unknown {
  if (!json && !jsonString && !jsonFilePath) {
    throw new Error(
      `No ${label} value provided. Please set one of: ${label}JSON, ${label}JSONString, or ${label}JSONFilePath`,
    );
  }

  if (jsonFilePath) {
    if (!existsSync(jsonFilePath)) {
      throw new Error(`${label} file not found: ${jsonFilePath}`);
    }
    try {
      const content = readFileSync(jsonFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to parse ${label} file content from ${jsonFilePath}. Error: ${(error as Error | undefined)?.message}`,
      );
    }
  }

  if (jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(
        `Failed to parse ${label} JSON string. Error: ${(error as Error | undefined)?.message}`,
      );
    }
  }

  return json;
}
