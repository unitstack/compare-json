import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts', '!src/**/__tests__/**'],
  format: ['cjs', 'esm'],
  target: 'es2020',
  outDir: 'dist',
  bundle: false,
  dts: true,
  minify: false,
  splitting: false,
  clean: true,
  sourcemap: true,
});
