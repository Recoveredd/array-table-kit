#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { stdin } from 'node:process';
import { arrayToHtmlTable } from './html.js';
import { arrayToMarkdownTable } from './markdown.js';

type Format = 'markdown' | 'html';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const format = readFormat(args);
  const file = args.find((arg) => !arg.startsWith('-'));
  const input = file ? await readFile(file, 'utf8') : await readStdin();
  const parsed = JSON.parse(input) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error('array-table-kit expects a top-level JSON array.');
  }

  const records = parsed.map((item) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return item as Record<string, unknown>;
    }

    return { value: item };
  });

  const output = format === 'html'
    ? arrayToHtmlTable(records)
    : arrayToMarkdownTable(records);

  process.stdout.write(`${output}\n`);
}

function readFormat(args: string[]): Format {
  const flag = args.find((arg) => arg.startsWith('--format='));
  const value = flag?.split('=')[1];

  if (value === 'html' || value === 'markdown') {
    return value;
  }

  return args.includes('--html') ? 'html' : 'markdown';
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
