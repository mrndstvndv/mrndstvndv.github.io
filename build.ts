import { readdir, mkdir } from 'fs/promises';
import { build, write } from 'bun';
import { docWrapper, initHighlighter, renderMarkdown } from './src/utils';

// Build JS/CSS entrypoints
await build({
	entrypoints: ['./src/main.ts'],
	outdir: './dist',
	naming: 'index.[ext]',
});

// Copy root index.html
await write('./dist/index.html', Bun.file('./index.html'));

// Copy static assets
await mkdir('./dist/assets', { recursive: true });
for (const asset of await readdir('./assets')) {
	await write(`./dist/assets/${asset}`, Bun.file(`./assets/${asset}`));
}

// Build blog pages from markdown
await mkdir('./dist/blogs', { recursive: true });

const highlighter = await initHighlighter();

for (const entry of await readdir('./blogs')) {
	if (!entry.endsWith('.md')) continue;
	const slug = entry.slice(0, -3);
	const md = await Bun.file(`./blogs/${entry}`).text();
	const title = md.split('\n')[0]?.replace(/^#+\s*/, '') ?? slug;
	const { tocHtml, html } = renderMarkdown(md, highlighter);
	await write(
		`./dist/blogs/${slug}.html`,
		docWrapper(title, html, tocHtml),
	);
}
