/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  { files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: { ecmaVersion: 2021, sourceType: 'module' },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    } }
];
