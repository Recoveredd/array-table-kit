import { escapeMarkdownCell } from './escape.js';
import { createTableModel } from './model.js';
import type { MarkdownTableOptions, TableAlign } from './types.js';

export function arrayToMarkdownTable<TRecord extends Record<string, unknown>>(
  records: TRecord[],
  options: MarkdownTableOptions<TRecord> = {}
): string {
  const model = createTableModel(records, options);

  if (model.columns.length === 0) {
    return '';
  }

  const alignments = resolveAlignments(model.columns.length, options.align);
  const header = model.columns.map((column) => escapeMarkdownCell(column.header));
  const rows = model.rows.map((row) => row.cells.map((cell) => escapeMarkdownCell(cell.text)));
  const widths = measureWidths([header, ...rows]);

  return [
    renderMarkdownRow(header, widths, alignments),
    renderSeparatorRow(widths, alignments),
    ...rows.map((row) => renderMarkdownRow(row, widths, alignments))
  ].join('\n');
}

export const toMarkdownTable = arrayToMarkdownTable;

function resolveAlignments(count: number, align: TableAlign | TableAlign[] | undefined): TableAlign[] {
  return Array.from({ length: count }, (_, index) => {
    if (Array.isArray(align)) {
      return align[index] ?? 'left';
    }

    return align ?? 'left';
  });
}

function measureWidths(rows: string[][]): number[] {
  const widths: number[] = [];

  rows.forEach((row) => {
    row.forEach((cell, index) => {
      widths[index] = Math.max(widths[index] ?? 0, visibleLength(cell));
    });
  });

  return widths.map((width) => Math.max(width, 3));
}

function renderMarkdownRow(cells: string[], widths: number[], alignments: TableAlign[]): string {
  const padded = cells.map((cell, index) => padCell(cell, widths[index] ?? 3, alignments[index] ?? 'left'));
  return `| ${padded.join(' | ')} |`;
}

function renderSeparatorRow(widths: number[], alignments: TableAlign[]): string {
  const cells = widths.map((width, index) => {
    const marker = '-'.repeat(width);
    const alignment = alignments[index] ?? 'left';

    if (alignment === 'center') {
      return `:${marker.slice(1, -1) || '-'}:`;
    }

    if (alignment === 'right') {
      return `${marker.slice(0, -1) || '-'}:`;
    }

    return marker;
  });

  return `| ${cells.join(' | ')} |`;
}

function padCell(value: string, width: number, alignment: TableAlign): string {
  const missing = Math.max(0, width - visibleLength(value));

  if (alignment === 'right') {
    return `${' '.repeat(missing)}${value}`;
  }

  if (alignment === 'center') {
    const left = Math.floor(missing / 2);
    const right = missing - left;
    return `${' '.repeat(left)}${value}${' '.repeat(right)}`;
  }

  return `${value}${' '.repeat(missing)}`;
}

function visibleLength(value: string): number {
  return value.replace(/\\\|/g, '|').length;
}
