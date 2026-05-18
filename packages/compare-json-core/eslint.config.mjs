import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfig from '@compare-json/eslint-config/base-ts';

export default defineConfig([
  eslintConfig,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
  globalIgnores(['dist/**', 'node_modules/**', '.coverage/**']),
]);
