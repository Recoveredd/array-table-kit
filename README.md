# array-table-kit

Convert arrays of objects into clean Markdown and HTML tables.

`array-table-kit` is a small TypeScript utility for reports, README generation, admin exports, docs tooling and static sites. It has no runtime dependencies and works without a frontend framework.

## Install

```bash
npm install array-table-kit
```

## Markdown

```ts
import { arrayToMarkdownTable } from 'array-table-kit';

const rows = [
  { name: 'Ada', role: 'Engineer', stats: { score: 98 } },
  { name: 'Grace', role: 'Admiral', stats: { score: 94 } }
];

console.log(arrayToMarkdownTable(rows));
```

```md
| name  | role     | stats.score |
| ----- | -------- | ----------- |
| Ada   | Engineer | 98          |
| Grace | Admiral  | 94          |
```

## HTML

```ts
import { arrayToHtmlTable } from 'array-table-kit';

const html = arrayToHtmlTable(rows, {
  tableClassName: 'data-table',
  caption: 'Team'
});
```

String values are escaped before rendering HTML.

## Columns

```ts
arrayToMarkdownTable(rows, {
  columns: [
    { key: 'name', header: 'Name' },
    { key: 'stats.score', header: 'Score', align: 'right' }
  ]
});
```

## Options

| Option | Default | Description |
| ------ | ------- | ----------- |
| `columns` | auto-discovered | Explicit column keys or column definitions. |
| `emptyValue` | `''` | Text for `null`, `undefined` and invalid dates. |
| `flatten` | `true` | Flatten nested objects into dot-path columns. |
| `formatHeader` | none | Format auto-discovered column labels. |
| `formatValue` | none | Format every cell value before rendering. |
| `maxDepth` | `6` | Maximum depth for object flattening. |
| `sortColumns` | `false` | Sort auto-discovered columns alphabetically. |

## CLI

```bash
array-table-kit data.json
array-table-kit data.json --html
array-table-kit data.json --format=html
```

The CLI expects a top-level JSON array. Primitive array items are wrapped in a `value` column.

## Why

`array-to-table` is useful but old and focused on simple Markdown output. `array-table-kit` keeps the tiny utility spirit while adding TypeScript types, HTML output, safer escaping, nested object flattening, explicit columns and a small CLI.
