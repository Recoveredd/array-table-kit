import { escapeHtml } from './escape.js';
import { createTableModel } from './model.js';
import type { HtmlTableOptions } from './types.js';

export function arrayToHtmlTable<TRecord extends Record<string, unknown>>(
  records: TRecord[],
  options: HtmlTableOptions<TRecord> = {}
): string {
  const model = createTableModel(records, options);

  if (model.columns.length === 0) {
    return '';
  }

  const attributes = [
    options.tableId ? `id="${escapeHtml(options.tableId)}"` : '',
    options.tableClassName ? `class="${escapeHtml(options.tableClassName)}"` : ''
  ].filter(Boolean).join(' ');
  const openTable = attributes ? `<table ${attributes}>` : '<table>';
  const caption = options.caption ? `<caption>${escapeHtml(options.caption)}</caption>` : '';
  const head = `<thead><tr>${model.columns.map((column) => (
    `<th data-key="${escapeHtml(column.key)}" data-align="${column.align}">${escapeHtml(column.header)}</th>`
  )).join('')}</tr></thead>`;
  const body = `<tbody>${model.rows.map((row) => (
    `<tr data-index="${row.sourceIndex}">${row.cells.map((cell, index) => {
      const column = model.columns[index];
      return `<td data-key="${escapeHtml(cell.key)}" data-align="${column?.align ?? 'left'}">${escapeHtml(cell.text)}</td>`;
    }).join('')}</tr>`
  )).join('')}</tbody>`;

  return `${openTable}${caption}${head}${body}</table>`;
}

export const toHtmlTable = arrayToHtmlTable;
