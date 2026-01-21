import { default as firefoxicEslintConfig, globals } from "@firefoxic/eslint-config"

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		languageOptions: {
			globals: {
				...globals.nodeBuiltin,
			},
		},
	},
	...firefoxicEslintConfig,
	{
		rules: {
			"prefer-let/prefer-let": `off`,
		},
	},
]
