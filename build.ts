import { mkdir } from 'fs/promises';
import { build, write } from 'bun';

// Build JS/CSS entrypoints
await build({
	entrypoints: ['./src/main.ts'],
	outdir: './dist',
	naming: 'index.[ext]',
});

// Copy root index.html
await write('./dist/index.html', Bun.file('./index.html'));

await mkdir('./dist/blogs', { recursive: true });
await write(
	'./dist/blogs/run-void-on-termux.html',
	renderMarkdown(await Bun.file('./blogs/run-void-on-termux.md').text()),
);

function renderMarkdown(markdown: string | ArrayBufferLike): string {
	return Bun.markdown.render(markdown, {
		heading: (children, { level }) => `<h${level}>${children}</h${level}>`
	})
}
