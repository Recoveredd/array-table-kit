import { arrayToHtmlTable, arrayToMarkdownTable } from '../../src/index.js';
import './styles.css';

const sample = [
  { name: 'Ada', role: 'Engineer', team: 'Compiler', stats: { score: 98, shipped: 12 } },
  { name: 'Grace', role: 'Admiral', team: 'Systems', stats: { score: 94, shipped: 9 } },
  { name: 'Katherine', role: 'Mathematician', team: 'Flight', stats: { score: 99, shipped: 16 } }
];

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing app root');
}

app.innerHTML = `
  <main class="shell">
    <section class="hero">
      <div>
        <h1>array-table-kit</h1>
        <p>Convert JSON arrays into Markdown or HTML tables with typed options, nested keys and safe escaping.</p>
      </div>
      <button type="button" data-copy>Copy Markdown</button>
    </section>

    <section class="workspace">
      <div class="panel editor">
        <div class="panel-header">
          <h2>Input JSON</h2>
          <span data-status>Ready</span>
        </div>
        <textarea spellcheck="false" data-input></textarea>
      </div>

      <div class="panel output">
        <div class="panel-header">
          <h2>Markdown</h2>
        </div>
        <pre data-markdown></pre>
      </div>

      <div class="panel output">
        <div class="panel-header">
          <h2>HTML preview</h2>
        </div>
        <div class="preview" data-preview></div>
      </div>
    </section>
  </main>
`;

const input = query<HTMLTextAreaElement>('[data-input]');
const markdown = query<HTMLPreElement>('[data-markdown]');
const preview = query<HTMLDivElement>('[data-preview]');
const status = query<HTMLSpanElement>('[data-status]');
const copy = query<HTMLButtonElement>('[data-copy]');

input.value = JSON.stringify(sample, null, 2);

function query<T extends Element>(selector: string): T {
  const element = app?.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element;
}

function render(): string | null {
  try {
    const parsed = JSON.parse(input.value) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error('Input must be a JSON array.');
    }

    const records = parsed.map((item) => (
      item && typeof item === 'object' && !Array.isArray(item)
        ? item as Record<string, unknown>
        : { value: item }
    ));
    const md = arrayToMarkdownTable(records);
    const html = arrayToHtmlTable(records, {
      tableClassName: 'demo-table'
    });

    markdown.textContent = md;
    preview.innerHTML = html;
    status.textContent = 'Valid array';
    status.dataset.state = 'ok';
    return md;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    markdown.textContent = message;
    preview.innerHTML = `<p class="error">${message}</p>`;
    status.textContent = 'Invalid input';
    status.dataset.state = 'error';
    return null;
  }
}

input.addEventListener('input', render);
copy.addEventListener('click', async () => {
  const md = render();

  if (md) {
    await navigator.clipboard.writeText(md);
    status.textContent = 'Markdown copied';
    status.dataset.state = 'ok';
  }
});

render();
