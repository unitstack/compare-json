import { describe, it, afterEach, expect } from 'vitest';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { Server } from '@modelcontextprotocol/sdk/server';
import { Client } from '@modelcontextprotocol/sdk/client';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { compareJSONTool, createServer } from '../server';

describe('createServer', () => {
  let server: Server | undefined;
  let client: Client | undefined;

  afterEach(async () => {
    try {
      await server?.close();
    } finally {
      server = undefined;
    }

    try {
      await client?.close();
    } finally {
      client = undefined;
    }
  });

  it('should list tools via client', async () => {
    server = createServer();

    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} },
    );

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    const tools = await client.listTools();
    expect(tools.tools).toHaveLength(1);
    expect(tools.tools[0].name).toBe('compare_json');

    await client.close();
    await server.close();
  });

  it('should call tool via client', async () => {
    server = createServer();
    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} },
    );

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    const result = await client.callTool({
      name: 'compare_json',
      arguments: { baseJSON: { a: 1 }, contrastJSON: { a: 2 } },
    });

    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
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

    await client.close();
    await server.close();
  });

  it('should throw error for unknown tool', async () => {
    server = createServer();
    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} },
    );

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    await expect(
      client.callTool({ name: 'unknown_tool', arguments: {} }),
    ).rejects.toThrow();

    await client.close();
    await server.close();
  });
});

describe('compareJSONTool', () => {
  it('should compare JSON values', () => {
    const result = compareJSONTool({
      baseJSON: { a: 1 },
      contrastJSON: { a: 2 },
    });
    expect(result).toEqual([
      {
        pathString: 'a',
        pathSegments: ['a'],
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should compare with file paths', () => {
    const baseFile = join(__dirname, 'base.json');
    const contrastFile = join(__dirname, 'contrast.json');

    writeFileSync(baseFile, JSON.stringify({ a: 1 }));
    writeFileSync(contrastFile, JSON.stringify({ a: 2 }));

    const result = compareJSONTool({
      baseJSONFilePath: baseFile,
      contrastJSONFilePath: contrastFile,
    });

    expect(result).toEqual([
      {
        pathString: 'a',
        pathSegments: ['a'],
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);

    unlinkSync(baseFile);
    unlinkSync(contrastFile);
  });

  it('should compare with JSON strings', () => {
    const result = compareJSONTool({
      baseJSONString: '{"a":1}',
      contrastJSONString: '{"a":2}',
    });

    expect(result).toEqual([
      {
        pathString: 'a',
        pathSegments: ['a'],
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should compare with options', () => {
    const result = compareJSONTool({
      baseJSON: { arr: [1, 2] },
      contrastJSON: { arr: [2, 1] },
      options: { arrayCompareMethod: 'unordered' },
    });

    expect(result).toEqual([]);
  });
});
