import { build, write } from 'bun';

await build({
  entrypoints: ['./src/main.ts'],
  outdir: './dist',
  naming: 'index.[ext]',
});

await write('./dist/index.html', Bun.file('./index.html'));
