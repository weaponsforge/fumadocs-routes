import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.node },
  },
  tseslint.configs.recommended,
  { ignores: ['node_modules/**'] },
  {
    rules: {
      'comma-dangle': ['error', 'always-multiline'],
      'eol-last': ['error', 'always'],
      'indent': ['error', 2],
      'keyword-spacing': ['error', { before: true, after: true }],
      'linebreak-style': ['error', 'unix'],
      'object-curly-spacing': ['error', 'always'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'never'],
      'no-console': 'off',
      'no-multi-spaces': 'error',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1, maxBOF: 0 }],
      'no-trailing-spaces': 'error',
      'no-undef': 'error',
      'no-unused-vars': 'off',
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
      ],
      'space-before-blocks': ['error', 'always'],
      'max-lines': [
        'warn',
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'argsIgnorePattern': '^_',
          'varsIgnorePattern': '^_',
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        { 'selector': 'typeLike', 'format': ['PascalCase'] },
        { 'selector': 'variable', 'format': ['camelCase', 'PascalCase', 'UPPER_CASE'], 'leadingUnderscore': 'allow' },
        { 'selector': 'function', 'format': ['camelCase', 'PascalCase'] },
        { 'selector': 'parameter', 'format': ['camelCase', 'PascalCase'], 'leadingUnderscore': 'allow' },
        { 'selector': 'import', 'format': ['camelCase', 'PascalCase', 'UPPER_CASE'] },
        { 'selector': ['property', 'objectLiteralProperty', 'typeProperty'], 'format': null },
      ],
    },
  },
])
