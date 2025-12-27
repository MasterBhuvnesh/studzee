const eslintPluginImport = require('eslint-plugin-import');
const eslintPluginTS = require('@typescript-eslint/eslint-plugin');
const parserTS = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: ['dist', 'node_modules', 'prisma'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: parserTS,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': eslintPluginTS,
      import: eslintPluginImport,
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal'],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
        },
      ],
    },
  },
];
