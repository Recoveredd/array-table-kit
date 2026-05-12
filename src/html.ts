import { escapeHtml } from './escape.js';
import { createTableModel } from './model.js';
import type { HtmlTableOptions } from './types.js';

export function arrayToHtmlTable<TRecord extends Record<string, unknown>>(
  records: readonly TRecord[],
  options?: HtmlTableOptions<TRecord>
): string;
export function arrayToHtmlTable<TRecord extends Record<string, unknown>>(
  records: readonly unknown[],
  options?: HtmlTableOptions<Record<string, unknown>>
): string;
export function arrayToHtmlTable<TRecord extends Record<string, unknown>>(
  records: readonly unknown[],
  options: HtmlTableOptions<TRecord> | null = {}
): string {
  const settings = options ?? {};
  const model = createTableModel(records, settings as HtmlTableOptions<Record<string, unknown>>);

  if (model.columns.length === 0) {
    return '';
  }

  const attributes = [
    settings.tableId ? `id="${escapeHtml(settings.tableId)}"` : '',
    settings.tableClassName ? `class="${escapeHtml(settings.tableClassName)}"` : ''
  ].filter(Boolean).join(' ');
  const openTable = attributes ? `<table ${attributes}>` : '<table>';
  const caption = settings.caption ? `<caption>${escapeHtml(settings.caption)}</caption>` : '';
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
