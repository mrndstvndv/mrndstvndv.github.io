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

const decodeHtml = (s: string) =>
	s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');

const codeBlockRe = /<pre><code(?: class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g;

/** Match either a <pre><code> block (left as-is) or a standalone <code> (add class). */
const inlineCodeRe = /(<pre><code[^>]*>[\s\S]*?<\/code><\/pre>)|<code>/g;

export const renderMarkdown = (markdown: string, highlighter: Highlighter) => {
	const html = Bun.markdown.html(markdown);

	// Add inline-code class to all <code> elements not inside <pre><code>
	const withInlineCode = html.replace(inlineCodeRe, (match, preBlock) =>
		preBlock ?? '<code class="inline-code">',
	);

	// Syntax-highlight fenced code blocks
	return withInlineCode.replace(codeBlockRe, (_, lang, code) =>
		highlighter.codeToHtml(decodeHtml(code), {
			lang: lang ?? 'plaintext',
			themes: { light: 'github-light', dark: 'github-dark' },
		}),
	);
};
