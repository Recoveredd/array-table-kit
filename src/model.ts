import type {
  CellValue,
  ColumnDefinition,
  ColumnInput,
  ResolvedColumn,
  TableModel,
  TableOptions
} from './types.js';

const DEFAULT_OPTIONS = {
  emptyValue: '',
  flatten: true,
  maxDepth: 6,
  sortColumns: false
};

export function createTableModel<TRecord extends Record<string, unknown>>(
  records: TRecord[],
  options: TableOptions<TRecord> = {}
): TableModel<TRecord> {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  const columns = resolveColumns(records, options.columns, settings);

  const rows = records.map((record, sourceIndex) => {
    const flatRecord = settings.flatten ? flattenRecord(record, settings.maxDepth) : record;

    return {
      sourceIndex,
      cells: columns.map((column) => {
        const initialValue = column.accessor ? column.accessor(record, sourceIndex) : getPathValue(flatRecord, column.key);
        const formattedValue = column.format ? column.format(initialValue, record, sourceIndex) : initialValue;
        const finalValue = options.formatValue
          ? options.formatValue(formattedValue, column.key, record, sourceIndex)
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

function resolveColumns<TRecord extends Record<string, unknown>>(
  records: TRecord[],
  columns: Array<ColumnInput<TRecord>> | undefined,
  options: Required<Pick<TableOptions<TRecord>, 'emptyValue' | 'flatten' | 'maxDepth' | 'sortColumns'>> & TableOptions<TRecord>
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
      align: 'left'
    };
  }

  const resolved: ResolvedColumn<TRecord> = {
    key: column.key,
    header: column.header ?? (options.formatHeader ? options.formatHeader(column.key) : column.key),
    align: column.align ?? inferAlignment(index)
  };

  if (column.accessor) {
    resolved.accessor = column.accessor;
  }

  if (column.format) {
    resolved.format = column.format;
  }

  return resolved;
}

function inferAlignment(_index: number): 'left' {
  return 'left';
}

function flattenRecord(
  record: Record<string, unknown>,
  maxDepth: number,
  prefix = '',
  depth = 0,
  output: Record<string, unknown> = {}
): Record<string, unknown> {
  Object.entries(record).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isPlainRecord(value) && depth < maxDepth) {
      flattenRecord(value, maxDepth, path, depth + 1, output);
      return;
    }

    output[path] = value;
  });

  return output;
}

function getPathValue(record: Record<string, unknown>, key: string): CellValue {
  if (Object.hasOwn(record, key)) {
    return record[key] as CellValue;
  }

  return undefined;
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
    return JSON.stringify(value);
  }

  return String(value);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}
