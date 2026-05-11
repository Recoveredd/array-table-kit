export type TableAlign = 'left' | 'center' | 'right';
export type PrimitiveCellValue = string | number | boolean | bigint | null | undefined;
export type CellValue = PrimitiveCellValue | Date | Record<string, unknown> | unknown[];

export interface ColumnDefinition<TRecord = Record<string, unknown>> {
  key: string;
  header?: string;
  align?: TableAlign;
  accessor?: (row: TRecord, index: number) => CellValue;
  format?: (value: CellValue, row: TRecord, index: number) => CellValue;
}

export type ColumnInput<TRecord = Record<string, unknown>> = string | ColumnDefinition<TRecord>;

export interface TableOptions<TRecord = Record<string, unknown>> {
  columns?: Array<ColumnInput<TRecord>>;
  emptyValue?: string;
  flatten?: boolean;
  formatHeader?: (key: string) => string;
  formatValue?: (value: CellValue, key: string, row: TRecord, index: number) => CellValue;
  maxDepth?: number;
  sortColumns?: boolean;
}

export interface MarkdownTableOptions<TRecord = Record<string, unknown>> extends TableOptions<TRecord> {
  align?: TableAlign | TableAlign[];
}

export interface HtmlTableOptions<TRecord = Record<string, unknown>> extends TableOptions<TRecord> {
  caption?: string;
  tableClassName?: string;
  tableId?: string;
}

export interface ResolvedColumn<TRecord = Record<string, unknown>> {
  key: string;
  header: string;
  align: TableAlign;
  accessor?: (row: TRecord, index: number) => CellValue;
  format?: (value: CellValue, row: TRecord, index: number) => CellValue;
}

export interface TableCell {
  key: string;
  value: CellValue;
  text: string;
}

export interface TableRow {
  cells: TableCell[];
  sourceIndex: number;
}

export interface TableModel<TRecord = Record<string, unknown>> {
  columns: Array<ResolvedColumn<TRecord>>;
  rows: TableRow[];
}
