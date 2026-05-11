import { describe, expect, it } from 'vitest';
import { arrayToHtmlTable, arrayToMarkdownTable, createTableModel } from '../src/index.js';

const records = [
  { name: 'Ada', role: 'Engineer', stats: { score: 98 }, active: true },
  { name: 'Grace', role: 'Admiral', stats: { score: 94 }, active: false }
];

describe('array-table-kit', () => {
  it('renders arrays of objects as Markdown tables', () => {
    expect(arrayToMarkdownTable(records)).toBe([
      '| name  | role     | stats.score | active |',
      '| ----- | -------- | ----------- | ------ |',
      '| Ada   | Engineer | 98          | true   |',
      '| Grace | Admiral  | 94          | false  |'
    ].join('\n'));
  });

  it('supports explicit columns and alignment', () => {
    expect(arrayToMarkdownTable(records, {
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'stats.score', header: 'Score', align: 'right' }
      ],
      align: ['left', 'right']
    })).toBe([
      '| Name  | Score |',
      '| ----- | ----: |',
      '| Ada   |    98 |',
      '| Grace |    94 |'
    ].join('\n'));
  });

  it('uses column alignment when no global Markdown alignment is set', () => {
    expect(arrayToMarkdownTable(records, {
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'stats.score', header: 'Score', align: 'right' }
      ]
    })).toBe([
      '| Name  | Score |',
      '| ----- | ----: |',
      '| Ada   |    98 |',
      '| Grace |    94 |'
    ].join('\n'));
  });

  it('supports a separate path for display-safe column keys', () => {
    expect(arrayToHtmlTable(records, {
      columns: [
        { key: 'score', path: 'stats.score', header: 'Score', align: 'right' }
      ]
    })).toContain('<td data-key="score" data-align="right">98</td>');
  });

  it('resolves dot paths when flattening is disabled', () => {
    expect(arrayToMarkdownTable(records, {
      flatten: false,
      columns: [
        { key: 'score', path: 'stats.score', header: 'Score' }
      ]
    })).toBe([
      '| Score |',
      '| ----- |',
      '| 98    |',
      '| 94    |'
    ].join('\n'));
  });

  it('normalizes invalid alignment values from JavaScript callers', () => {
    expect(arrayToHtmlTable(records, {
      columns: [
        { key: 'name', align: 'banana' as never }
      ]
    })).toContain('<td data-key="name" data-align="left">Ada</td>');

    expect(arrayToMarkdownTable(records, {
      align: 'banana' as never,
      columns: [
        { key: 'name', align: 'right' }
      ]
    })).toBe([
      '|  name |',
      '| ----: |',
      '|   Ada |',
      '| Grace |'
    ].join('\n'));
  });

  it('does not throw on circular cell values', () => {
    const circular: Record<string, unknown> = { name: 'Loop' };
    circular.self = circular;

    expect(arrayToMarkdownTable([circular], {
      columns: ['name', 'self']
    })).toContain('[Circular]');
  });

  it('flattens shared nested objects without marking them as circular references', () => {
    const shared = { score: 42 };

    const model = createTableModel([
      { primary: shared, secondary: shared }
    ]);

    expect(model.columns.map((column) => column.key)).toEqual(['primary.score', 'secondary.score']);
    expect(model.rows[0]?.cells.map((cell) => cell.text)).toEqual(['42', '42']);
  });

  it('throws a clear error for non-array input', () => {
    expect(() => arrayToMarkdownTable({ name: 'Ada' } as unknown as unknown[])).toThrow(
      'array-table-kit expects an array.'
    );
    expect(() => createTableModel({ name: 'Ada' } as unknown as unknown[])).toThrow(
      'array-table-kit expects an array.'
    );
  });

  it('treats null options like omitted options for JavaScript callers', () => {
    expect(arrayToMarkdownTable([{ name: 'Ada' }], null as never)).toBe([
      '| name |',
      '| ---- |',
      '| Ada  |'
    ].join('\n'));
    expect(arrayToHtmlTable([{ name: 'Ada' }], null as never)).toContain('<td data-key="name" data-align="left">Ada</td>');
  });

  it('escapes Markdown and HTML output', () => {
    const unsafe = [{ name: '<script>', note: 'a | b' }];

    expect(arrayToMarkdownTable(unsafe)).toContain('a \\| b');
    expect(arrayToHtmlTable(unsafe)).toContain('&lt;script&gt;');
  });

  it('creates safe HTML tables', () => {
    expect(arrayToHtmlTable(records, { tableClassName: 'data-table', caption: 'Team' })).toContain(
      '<table class="data-table"><caption>Team</caption><thead>'
    );
  });

  it('exposes an intermediate model', () => {
    const model = createTableModel(records);

    expect(model.columns.map((column) => column.key)).toEqual(['name', 'role', 'stats.score', 'active']);
    expect(model.rows[0]?.cells[0]?.text).toBe('Ada');
  });

  it('handles primitive arrays through the CLI-friendly value column shape', () => {
    expect(arrayToMarkdownTable(['one', 'two'])).toBe([
      '| value |',
      '| ----- |',
      '| one   |',
      '| two   |'
    ].join('\n'));
  });
});
