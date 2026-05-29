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

export const renderMarkdown = (markdown: string, highlighter: Highlighter) =>
	Bun.markdown.render(markdown, {
		heading: (children, { level }) => `<h${level}>${children}</h${level}>`,
		codespan: (children) => `<code class="inline-code">${children}</code>`,
		code: (children, meta) => {
			const lang = meta?.language ?? 'plaintext';
			return highlighter.codeToHtml(children, {
				lang,
				themes: { light: 'github-light', dark: 'github-dark' },
			});
		},
		link: (children, { href }) => `<a href="${href}">${children} </a>`,
		emphasis: (children) => `<em>${children}</em>`,
		list: (children, { ordered }) => {
			if (ordered) {
				return `<ol>${children}</ol>`
			} else {
				return `<ul>${children}</ul>`
			}
		},
		listItem: (children) => `<li>${children}</li>`,
		strong: (children) => `<strong>${children}</strong>`,
	});
