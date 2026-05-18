import { Server } from '@modelcontextprotocol/sdk/server';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  compareJSON,
  type JSONValueDifference,
  type CompareOptions,
} from '@compare-json/core';
import { getPkgVersion, parseInput } from './utils';

export function createServer() {
  const server = new Server(
    {
      name: 'compare-json-mcp',
      version: getPkgVersion(),
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
  const compareJSONInputSchema = createCompareJSONInputSchema();
  const compareJSONOutputSchema = createCompareJSONOutputSchema();

  server.setRequestHandler(ListToolsRequestSchema, () => {
    return {
      tools: [
        {
          name: 'compare_json',
          description:
            'Compare two JSON values and return differences. Supports various comparison options including comparisons case-insensitive comparisons, and numeric string handling.',
          inputSchema: compareJSONInputSchema.toJSONSchema() as Record<
            string,
            unknown
          >,
          outputSchema: compareJSONOutputSchema.toJSONSchema() as Record<
            string,
            unknown
          >,
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, (request) => {
    if (request.params.name === 'compare_json') {
      const args = compareJSONInputSchema.parse(request.params.arguments);
      const differences = compareJSONTool(args);

      return {
        structuredContent: { differences },
        content: [{ type: 'text', text: JSON.stringify(differences, null, 2) }],
      };
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  return server;
}

export function createCompareJSONInputSchema() {
  return z.object({
    baseJSON: z.any().describe('Base JSON value').optional(),
    baseJSONString: z
      .string()
      .describe('Base stringified JSON value')
      .optional(),
    baseJSONFilePath: z.string().describe('Base JSON file path').optional(),
    contrastJSON: z.any().describe('Contrast JSON value').optional(),
    contrastJSONString: z
      .string()
      .describe('Contrast stringified JSON value')
      .optional(),
    contrastJSONFilePath: z
      .string()
      .describe('Contrast JSON file path')
      .optional(),
    options: z
      .object({
        arrayCompareMethod: z
          .enum(['byIndex', 'lcs', 'unordered'])
          .default('byIndex')
          .describe('Array comparison method'),
        keyCaseInsensitive: z
          .boolean()
          .default(false)
          .describe('Case insensitive key comparison'),
        valueCaseInsensitive: z
          .boolean()
          .default(false)
          .describe('Case insensitive value comparison'),
        numericStringEqualsNumber: z
          .boolean()
          .default(false)
          .describe('Treat numeric strings as numbers'),
      })
      .optional(),
  });
}

export function createCompareJSONOutputSchema() {
  return z.object({
    differences: z.array(
      z.object({
        pathString: z.string(),
        pathSegments: z.array(z.string()),
        pathBelongsTo: z.enum(['base', 'contrast', 'both']),
        diffType: z.enum(['added', 'deleted', 'valueChanged', 'typeChanged']),
      }),
    ),
  });
}

export function compareJSONTool(args: {
  baseJSON?: unknown;
  baseJSONString?: string;
  baseJSONFilePath?: string;
  contrastJSON?: unknown;
  contrastJSONString?: string;
  contrastJSONFilePath?: string;
  options?: CompareOptions;
}): JSONValueDifference[] {
  return compareJSON({
    baseJSON: parseInput(
      args.baseJSON,
      args.baseJSONString,
      args.baseJSONFilePath,
      'base',
    ),
    contrastJSON: parseInput(
      args.contrastJSON,
      args.contrastJSONString,
      args.contrastJSONFilePath,
      'contrast',
    ),
    options: args.options,
  });
}
