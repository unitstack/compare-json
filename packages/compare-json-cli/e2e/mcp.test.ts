import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { JSONValueDifference } from '@compare-json/core';

const CLI_PATH = join(__dirname, '../dist/cli.js');

function createMCPClient() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [CLI_PATH, '--mcp'],
  });

  const client = new Client(
    { name: 'test-client', version: '1.0.0' },
    { capabilities: {} },
  );

  return { client, transport };
}

beforeAll(() => {
  mkdirSync(join(__dirname, 'temp'), { recursive: true });
});

describe('MCP e2e', () => {
  const testFile = join(__dirname, 'temp', 'mcp-test.json');

  afterEach(() => {
    try {
      unlinkSync(testFile);
    } catch {
      //
    }
  });

  it('should list tools', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      const tools = await client.listTools();

      expect(tools.tools).toHaveLength(1);
      expect(tools.tools[0].name).toBe('compare_json');
    } finally {
      await client.close();
    }
  });

  it('should compare JSON via tool', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: 'compare_json',
        arguments: {
          baseJSON: { a: 1 },
          contrastJSON: { a: 2 },
        },
      });

      expect(result.structuredContent).toEqual({
        differences: [
          {
            pathString: 'a',
            pathSegments: ['a'],
            pathBelongsTo: 'both',
            diffType: 'valueChanged',
          },
        ],
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      const parsed = JSON.parse(text) as JSONValueDifference[];
      expect(parsed).toEqual([
        {
          pathString: 'a',
          pathSegments: ['a'],
          pathBelongsTo: 'both',
          diffType: 'valueChanged',
        },
      ]);
    } finally {
      await client.close();
    }
  });

  it('should compare with file paths via tool', async () => {
    const baseFile = join(__dirname, 'temp', 'base.json');
    const contrastFile = join(__dirname, 'temp', 'contrast.json');

    writeFileSync(baseFile, JSON.stringify({ x: 'hello' }));
    writeFileSync(contrastFile, JSON.stringify({ x: 'world' }));

    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: 'compare_json',
        arguments: {
          baseJSONFilePath: baseFile,
          contrastJSONFilePath: contrastFile,
        },
      });

      expect(result.structuredContent).toEqual({
        differences: [
          {
            pathString: 'x',
            pathSegments: ['x'],
            pathBelongsTo: 'both',
            diffType: 'valueChanged',
          },
        ],
      });
    } finally {
      await client.close();
      try {
        unlinkSync(baseFile);
        unlinkSync(contrastFile);
      } catch {
        //
      }
    }
  });

  it('should compare with JSON strings via tool', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: 'compare_json',
        arguments: {
          baseJSONString: '{"b":true}',
          contrastJSONString: '{"b":false}',
        },
      });

      expect(result.structuredContent).toEqual({
        differences: [
          {
            pathString: 'b',
            pathSegments: ['b'],
            pathBelongsTo: 'both',
            diffType: 'valueChanged',
          },
        ],
      });
    } finally {
      await client.close();
    }
  });

  it('should compare with options via tool', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: 'compare_json',
        arguments: {
          baseJSON: { arr: [1, 2] },
          contrastJSON: { arr: [2, 1] },
          options: { arrayCompareMethod: 'unordered' },
        },
      });

      expect(result.structuredContent).toEqual({
        differences: [],
      });
    } finally {
      await client.close();
    }
  });

  it('should error for unknown tool', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      await expect(
        client.callTool({
          name: 'unknown_tool',
          arguments: {},
        }),
      ).rejects.toThrow();
    } finally {
      await client.close();
    }
  });

  it('should error for invalid arguments', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      await expect(
        client.callTool({
          name: 'compare_json',
          arguments: {
            baseJSON: { a: 1 },
            // missing contrastJSON
          },
        }),
      ).rejects.toThrow();
    } finally {
      await client.close();
    }
  });

  it('should error for non-existent file path', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      await expect(
        client.callTool({
          name: 'compare_json',
          arguments: {
            baseJSONFilePath: '/nonexistent/file.json',
            contrastJSON: { a: 1 },
          },
        }),
      ).rejects.toThrow(/base file not found/);
    } finally {
      await client.close();
    }
  });

  it('should error for invalid JSON string', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      await expect(
        client.callTool({
          name: 'compare_json',
          arguments: {
            baseJSONString: 'not valid json',
            contrastJSON: { a: 1 },
          },
        }),
      ).rejects.toThrow(/Failed to parse base JSON string/);
    } finally {
      await client.close();
    }
  });
});
