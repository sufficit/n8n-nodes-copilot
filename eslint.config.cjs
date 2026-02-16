/**
 * Purpose: ESLint flat config for this repository.
 *
 * Why: Some environments (or parent folders) enable ESLint flat-config lookup,
 * which can cause this repo to inherit unrelated configs or ignore patterns.
 * Providing a repo-local eslint.config.cjs makes `npm run lint` deterministic.
 */

const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
	{
		ignores: [
			'dist/**',
			'node_modules/**',
			'docs/**',
			'temp/**',
			'tests/**',
		],
	},
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
			'@typescript-eslint/no-unused-vars': 'error',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
		},
	},
];
