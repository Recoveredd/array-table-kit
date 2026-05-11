import type {
  CellValue,
  ColumnInput,
  ResolvedColumn,
  TableAlign,
  TableModel,
  TableOptions
} from './types.js';

const DEFAULT_OPTIONS = {
  emptyValue: '',
  flatten: true,
  maxDepth: 6,
  sortColumns: false
} satisfies Required<Pick<TableOptions, 'emptyValue' | 'flatten' | 'maxDepth' | 'sortColumns'>>;

type ResolvedTableOptions<TRecord extends Record<string, unknown>> =
  Required<Pick<TableOptions<TRecord>, 'emptyValue' | 'flatten' | 'maxDepth' | 'sortColumns'>> & TableOptions<TRecord>;

export function createTableModel<TRecord extends Record<string, unknown>>(
  records: TRecord[],
  options?: TableOptions<TRecord>
): TableModel<TRecord>;
export function createTableModel<TRecord extends Record<string, unknown>>(
  records: unknown[],
  options?: TableOptions<Record<string, unknown>>
): TableModel<Record<string, unknown>>;
export function createTableModel<TRecord extends Record<string, unknown>>(
  records: unknown,
  options: TableOptions<TRecord> | null = {}
): TableModel<TRecord> | TableModel<Record<string, unknown>> {
  const settings = resolveOptions(options);
  const normalizedRecords = normalizeRecords(assertRecordsArray(records)) as TRecord[];
  const columns = resolveColumns(normalizedRecords, settings.columns, settings);

  const rows = normalizedRecords.map((record, sourceIndex) => {
    const flatRecord = settings.flatten ? flattenRecord(record, settings.maxDepth) : record;

    return {
      sourceIndex,
      cells: columns.map((column) => {
        const initialValue = column.accessor ? column.accessor(record, sourceIndex) : getPathValue(flatRecord, column.path);
        const formattedValue = column.format ? column.format(initialValue, record, sourceIndex) : initialValue;
        const finalValue = settings.formatValue
          ? settings.formatValue(formattedValue, column.key, record, sourceIndex)
          : formattedValue;

        return {
          key: column.key,
          value: finalValue,
          text: stringifyCell(finalValue, settings.emptyValue)
        };
      })
    };
  });

  return { columns, rows };
}

export function normalizeRecords(records: unknown[]): Array<Record<string, unknown>>;
export function normalizeRecords(records: unknown): Array<Record<string, unknown>> {
  return assertRecordsArray(records).map((record) => {
    if (isPlainRecord(record)) {
      return record;
    }

    return { value: record };
  });
}

function resolveColumns<TRecord extends Record<string, unknown>>(
  records: TRecord[],
  columns: Array<ColumnInput<TRecord>> | undefined,
  options: ResolvedTableOptions<TRecord>
): Array<ResolvedColumn<TRecord>> {
  if (columns?.length) {
    return columns.map((column, index) => resolveColumn(column, index, options));
  }

  const discovered = new Set<string>();

  records.forEach((record) => {
    const source = options.flatten ? flattenRecord(record, options.maxDepth) : record;

    Object.keys(source).forEach((key) => {
      discovered.add(key);
    });
  });

  const keys = [...discovered];

  if (keys.length === 0 && records.length > 0) {
    keys.push('value');
  }

  if (options.sortColumns) {
    keys.sort((a, b) => a.localeCompare(b));
  }

  return keys.map((key, index) => resolveColumn<TRecord>(key, index, options));
}

function resolveColumn<TRecord extends Record<string, unknown>>(
  column: ColumnInput<TRecord>,
  index: number,
  options: TableOptions<TRecord>
): ResolvedColumn<TRecord> {
  if (typeof column === 'string') {
    return {
      key: column,
      header: options.formatHeader ? options.formatHeader(column) : column,
      align: 'left',
      path: column
    };
  }

  const resolved: ResolvedColumn<TRecord> = {
    key: column.key,
    header: column.header ?? (options.formatHeader ? options.formatHeader(column.key) : column.key),
    align: normalizeAlign(column.align),
    path: column.path ?? column.key
  };

  if (column.accessor) {
    resolved.accessor = column.accessor;
  }

  if (column.format) {
    resolved.format = column.format;
  }

  return resolved;
}

function flattenRecord(
  record: Record<string, unknown>,
  maxDepth: number,
  prefix = '',
  depth = 0,
  output: Record<string, unknown> = {},
  ancestors = new WeakSet<object>()
): Record<string, unknown> {
  ancestors.add(record);

  Object.entries(record).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isPlainRecord(value) && depth < maxDepth) {
      if (ancestors.has(value)) {
        output[path] = value;
        return;
      }

      flattenRecord(value, maxDepth, path, depth + 1, output, ancestors);
      return;
    }

    output[path] = value;
  });

  ancestors.delete(record);

  return output;
}

function getPathValue(record: Record<string, unknown>, key: string): CellValue {
  if (Object.hasOwn(record, key)) {
    return record[key] as CellValue;
  }

  return readPath(record, key);
}

function readPath(record: Record<string, unknown>, key: string): CellValue {
  let current: unknown = record;

  for (const segment of key.split('.')) {
    if (!isIndexable(current) || !Object.hasOwn(current, segment)) {
      return undefined;
    }

    current = current[segment];
  }

  return current as CellValue;
}

function stringifyCell(value: CellValue, emptyValue: string): string {
  if (value === null || value === undefined) {
    return emptyValue;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? emptyValue : value.toISOString();
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'object') {
    return safeStringify(value);
  }

  return String(value);
}

function safeStringify(value: object): string {
  const seen = new WeakSet<object>();

  try {
    const result = JSON.stringify(value, (_key, item: unknown) => {
      if (typeof item === 'bigint') {
        return item.toString();
      }

      if (item && typeof item === 'object') {
        if (seen.has(item)) {
          return '[Circular]';
        }

        seen.add(item);
      }

      return item;
    });

    return result ?? String(value);
  } catch {
    return String(value);
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

function isIndexable(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function assertRecordsArray(records: unknown): unknown[] {
  if (!Array.isArray(records)) {
    throw new TypeError('array-table-kit expects an array.');
  }

  return records;
}

function resolveOptions<TRecord extends Record<string, unknown>>(
  options: TableOptions<TRecord> | null | undefined
): ResolvedTableOptions<TRecord> {
  const source = options ?? {};

  return {
    ...source,
    emptyValue: source.emptyValue ?? DEFAULT_OPTIONS.emptyValue,
    flatten: source.flatten ?? DEFAULT_OPTIONS.flatten,
    maxDepth: normalizeMaxDepth(source.maxDepth),
    sortColumns: source.sortColumns ?? DEFAULT_OPTIONS.sortColumns
  };
}

function normalizeMaxDepth(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_OPTIONS.maxDepth;
  }

  return Math.max(0, Math.floor(value));
}

function normalizeAlign(value: unknown): TableAlign {
  if (value === 'center' || value === 'right') {
    return value;
  }

  return 'left';
}
