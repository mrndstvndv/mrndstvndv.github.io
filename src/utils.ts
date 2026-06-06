import { loadWasm, createOnigurumaEngine } from '@shikijs/engine-oniguruma';
import wasm from 'shiki/wasm';
import { createHighlighter, type Highlighter } from 'shiki';

export const docWrapper = (title: string, body: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="/index.css">
  <script src="/index.js"></script>
</head>
<body>
<header class="blog-header">
  <a href="/" class="blog-header-link">
    <img src="/assets/DAY20_00147.JPG" alt="Profile" class="blog-profile-img" />
    <div class="blog-profile-info">
      <div class="blog-profile-name"><span class="bracket">{</span> Steven Dave T. Miranda <span class="bracket">}</span></div>
      <div class="blog-profile-role">Android Dev &bull; Web Dev &bull; Linux</div>
    </div>
  </a>
</header>
<main class="blog-content">
  ${body}
</main>
</body>
</html>`;

export const initHighlighter = async (): Promise<Highlighter> => {
	await loadWasm(wasm);

	return createHighlighter({
		themes: ['github-light', 'github-dark'],
		langs: ['bash', 'sh', 'shell', 'js', 'ts', 'html', 'css', 'json', 'yaml', 'plaintext'],
		engine: createOnigurumaEngine(),
	});
};

const slugify = (s: string) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

interface TocEntry {
	level: number;
	text: string;
	id: string;
}

function buildTocNav(toc: TocEntry[]): string {
	let html = '<nav class="page-toc">\n';
	html += '  <input type="checkbox" id="toc-toggle" hidden>\n';
	html += '  <label for="toc-toggle" class="page-toc-toggle">☰</label>\n';
	html += '  <div class="page-toc-content">\n';

	for (const entry of toc) {
		const indent = (entry.level - 1) + 0.5;
		html += `    <a href="#${entry.id}" style="padding-left:${indent}rem">${entry.text}</a>\n`;
	}
	html += '  </div>\n';
	html += '</nav>\n';
	return html;
}

export const renderMarkdown = (markdown: string, highlighter: Highlighter) => {
	const toc: TocEntry[] = [];

	let html = Bun.markdown.render(markdown, {
		heading: (children, { level }) => {
			const id = slugify(children);
			toc.push({ level, text: children, id });
			return `<h${level} id="${id}">${children}</h${level}>`;
		},
		paragraph: (children) => `<p>${children}</p>`,
		blockquote: (children) => `<blockquote>${children}</blockquote>`,
		codespan: (children) => `<code class="inline-code">${children}</code>`,
		code: (children, meta) => {
			const lang = meta?.language ?? 'plaintext';
			return highlighter.codeToHtml(children, {
				lang,
				themes: { light: 'github-light', dark: 'github-dark' },
			});
		},
		link: (children, { href }) => `<a href="${href}">${children}</a>`,
		emphasis: (children) => `<em>${children}</em>`,
		list: (children, { ordered }) =>
			ordered ? `<ol>${children}</ol>` : `<ul>${children}</ul>`,
		listItem: (children) => `<li>${children}</li>`,
		strong: (children) => `<strong>${children}</strong>`,
	});

	const tocHtml = toc.length > 1 ? buildTocNav(toc) : '';

	return tocHtml + html;
};
