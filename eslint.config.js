import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';
import { globalIgnores } from 'eslint/config';

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      prettier,
      react,
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {

      // ---- General JS/TS conventions ----
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-var': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      'prefer-const': 'error',

      // ---- Arrow functions ----
      'prefer-arrow-callback': 'warn',
      'func-style': ['warn', 'expression', { allowArrowFunctions: true }],

      // ---- Null/undefined handling ----
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',

      // ---- Naming conventions ----
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'variableLike',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
      ],

      // ---- Readability ----
      'id-length': ['warn', { min: 3, exceptions: ['id', 'fs', 'db', 't', 'e', '_', 'mx', 'my', 'px', 'py', 'm', 'p', 'de', 'en', 'sx', 'mr', 'xs', 'sm', 'md', 'mt'] }],
      'max-lines-per-function': ['warn', { max: 350, skipBlankLines: true }],

      // React specific
      'react/react-in-jsx-scope': 'off', // Not needed for React 17+
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]);