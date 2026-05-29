import { readdir, mkdir } from 'fs/promises';
import { build, write } from 'bun';
import { createHighlighter } from 'shiki';

// Build JS/CSS entrypoints
await build({
	entrypoints: ['./src/main.ts'],
	outdir: './dist',
	naming: 'index.[ext]',
});

// Copy root index.html
await write('./dist/index.html', Bun.file('./index.html'));

// Build blog pages from markdown
await mkdir('./dist/blogs', { recursive: true });

const docWrapper = (title: string, body: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="/index.css">
</head>
<body>${body}</body>
</html>`;

const highlighter = await createHighlighter({
	themes: ['github-light', 'github-dark'],
	langs: ['bash', 'sh', 'shell', 'js', 'ts', 'html', 'css', 'json', 'yaml', 'plaintext'],
});

const renderMarkdown = (markdown: string) =>
	Bun.markdown.render(markdown, {
		heading: (children, { level }) => `<h${level}>${children}</h${level}>`,
		code: (children, meta) => {
			const lang = meta?.language ?? 'plaintext';
			return highlighter.codeToHtml(children, {
				lang,
				themes: { light: 'github-light', dark: 'github-dark' },
			});
		},
	});

for (const entry of await readdir('./blogs')) {
	if (!entry.endsWith('.md')) continue;
	const slug = entry.slice(0, -3);
	const md = await Bun.file(`./blogs/${entry}`).text();
	const title = md.split('\n')[0]?.replace(/^#+\s*/, '') ?? slug;
	await write(
		`./dist/blogs/${slug}.html`,
		docWrapper(title, renderMarkdown(md)),
	);
}
