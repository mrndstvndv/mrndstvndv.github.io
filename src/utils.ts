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
</head>
<body>${body}</body>
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

/**
 * Walk HTML char-by-char. At depth 0 (top level), accumulate text + inline tags
 * into a buffer. When a block element opens, flush the buffer as `<p>...</p>`.
 * Inside blocks (depth > 0), output everything directly.
 */
function wrapParagraphs(html: string): string {
	let out = '';
	let buf = '';
	let depth = 0;
	let i = 0;

	while (i < html.length) {
		if (html[i] === '<') {
			const close = html.indexOf('>', i);
			if (close === -1) break;
			const tag = html.slice(i, close + 1);

			const isClosing = tag[1] === '/';
			const tagName = isClosing
				? tag.slice(2, tag.indexOf('>')).split(/\s/)[0]
				: tag.slice(1).split(/[\s>]/)[0];
			const isBlock = /^h[1-6]$|^[uo]l$|^li$|^pre$|^blockquote$|^p$/.test(tagName);

			if (isBlock && !isClosing && depth === 0) {
				// Flush paragraph buffer before entering block
				if (buf.trim()) {
					out += `<p>${buf.trim()}</p>`;
					buf = '';
				} else {
					buf = '';
				}
				depth++;
				out += tag;
			} else if (isBlock && isClosing) {
				depth = Math.max(0, depth - 1);
				out += tag;
			} else if (isBlock && !isClosing && depth > 0) {
				depth++;
				out += tag;
			} else if (depth === 0) {
				// Inline tag at top level — part of the paragraph buffer
				buf += tag;
			} else {
				out += tag;
			}

			i = close + 1;
		} else {
			if (depth === 0) {
				buf += html[i];
			} else {
				out += html[i];
			}
			i++;
		}
	}

	// Flush remaining buffer
	if (buf.trim()) {
		out += `<p>${buf.trim()}</p>`;
	} else {
		out += buf;
	}

	return out;
}

function buildTocNav(toc: TocEntry[]): string {
	let html = '<nav class="page-toc">\n';
	html += '  <input type="checkbox" id="toc-toggle" hidden>\n';
	html += '  <label for="toc-toggle" class="page-toc-toggle">☰</label>\n';
	html += '  <div class="page-toc-content">\n';
	html += '    <div class="page-toc-title">Contents</div>\n';
	for (const entry of toc) {
		const indent = (entry.level - 1) * 1.25;
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

	html = wrapParagraphs(html);

	const tocHtml = toc.length > 1 ? buildTocNav(toc) : '';

	return tocHtml + html;
};
