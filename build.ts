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
await write('./dist/assets/DAY20_00147.JPG', Bun.file('./assets/DAY20_00147.JPG'));

// Build blog pages from markdown
await mkdir('./dist/blogs', { recursive: true });

const highlighter = await initHighlighter();

for (const entry of await readdir('./blogs')) {
	if (!entry.endsWith('.md')) continue;
	const slug = entry.slice(0, -3);
	const md = await Bun.file(`./blogs/${entry}`).text();
	const title = md.split('\n')[0]?.replace(/^#+\s*/, '') ?? slug;
	await write(
		`./dist/blogs/${slug}.html`,
		docWrapper(title, renderMarkdown(md, highlighter)),
	);
}
