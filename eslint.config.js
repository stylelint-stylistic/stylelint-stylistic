import globals from "globals"
import js from "@eslint/js"
import stylisticJs from "@stylistic/eslint-plugin-js"

export default [
	{
		languageOptions: {
			globals: {
				...globals.nodeBuiltin,
			},
		},
	},
	js.configs.recommended,
	{
		rules: {
			"accessor-pairs": `error`,
			"arrow-body-style": [
				`error`,
				`as-needed`,
			],
			"camelcase": `error`,
			"curly": [
				`error`,
				`multi-line`,
			],
			"eqeqeq": [
				`error`,
				`always`,
			],
			"func-style": [
				`error`,
				`declaration`,
			],
			"guard-for-in": `error`,
			"no-alert": `error`,
			"no-irregular-whitespace": [
				`error`,
				{
					skipComments: true,
					skipRegExps: true,
					skipTemplates: true,
				},
			],
			"no-lonely-if": `error`,
			"no-multi-assign": `error`,
			"no-nested-ternary": `error`,
			"no-octal-escape": `error`,
			"no-proto": `error`,
			"no-prototype-builtins": `error`,
			"no-return-assign": `error`,
			"no-self-compare": `error`,
			"no-shadow": [
				`error`,
				{
					hoist: `all`,
				},
			],
			"no-template-curly-in-string": `error`,
			"no-unneeded-ternary": `error`,
			"no-unused-expressions": `error`,
			"no-use-before-define": [
				`error`,
				{
					functions: false,
				},
			],
			"no-useless-concat": `error`,
			"no-useless-return": `error`,
			"no-var": `error`,
			"object-shorthand": `error`,
			"one-var": [
				`error`,
				`never`,
			],
			"prefer-arrow-callback": `error`,
			"prefer-object-has-own": `error`,
			"prefer-template": `error`,
			"radix": `error`,
			"sort-imports": [
				`error`,
				{
					ignoreCase: true,
					ignoreDeclarationSort: false,
					ignoreMemberSort: false,
					memberSyntaxSortOrder: [
						`single`,
						`multiple`,
						`all`,
						`none`,
					],
					allowSeparatedGroups: true,
				},
			],
			"strict": [
				`error`,
				`global`,
			],
		},
	},
	{
		plugins: {
			"@stylistic/js": stylisticJs,
		},
		rules: {
			"@stylistic/js/array-bracket-newline": [
				`error`,
				// `consistent`,
				{ multiline: true },
			],
			"@stylistic/js/array-bracket-spacing": [
				`error`,
				`never`,
			],
			"@stylistic/js/array-element-newline": [
				`error`,
				`consistent`,
			],
			"@stylistic/js/arrow-parens": [
				`error`,
				`always`,
			],
			"@stylistic/js/arrow-spacing": [
				`error`,
				{
					before: true,
					after: true,
				},
			],
			"@stylistic/js/block-spacing": [
				`error`,
				`always`,
			],
			"@stylistic/js/brace-style": [
				`error`,
				`1tbs`,
				{
					allowSingleLine: true,
				},
			],
			"@stylistic/js/comma-dangle": [
				`error`,
				`always-multiline`,
			],
			"@stylistic/js/comma-spacing": [
				`error`,
				{
					before: false,
					after: true,
				},
			],
			"@stylistic/js/comma-style": [
				`error`,
				`last`,
			],
			"@stylistic/js/computed-property-spacing": [
				`error`,
				`never`,
			],
			"@stylistic/js/dot-location": [
				`error`,
				`property`,
			],
			"@stylistic/js/eol-last": [
				`error`,
				`always`,
			],
			"@stylistic/js/function-call-argument-newline": [
				`error`,
				`consistent`,
			],
			"@stylistic/js/function-call-spacing": [
				`error`,
				`never`,
			],
			"@stylistic/js/function-paren-newline": [
				`error`,
				`multiline-arguments`,
			],
			"@stylistic/js/generator-star-spacing": [
				`error`,
				{
					before: true,
					after: false,
				},
			],
			"@stylistic/js/implicit-arrow-linebreak": [
				`error`,
				`beside`,
			],
			"@stylistic/js/indent": [
				`error`,
				`tab`,
				{
					SwitchCase: 1,
				},
			],
			"@stylistic/js/key-spacing": [
				`error`,
				{
					beforeColon: false,
					afterColon: true,
				},
			],
			"@stylistic/js/keyword-spacing": [
				`error`,
				{
					before: true,
					after: true,
				},
			],
			"@stylistic/js/linebreak-style": [
				`error`,
				`unix`,
			],
			"@stylistic/js/lines-around-comment": [
				`error`,
				{
					beforeBlockComment: true,
					allowBlockStart: true,
				},
			],
			"@stylistic/js/lines-between-class-members": [
				`error`,
				`always`,
			],
			"@stylistic/js/max-len": [
				`error`,
				{ code: Infinity },
			],
			"@stylistic/js/multiline-ternary": [
				`error`,
				`always-multiline`,
			],
			"@stylistic/js/new-parens": [
				`error`,
				`never`,
			],
			"@stylistic/js/no-extra-semi": [`error`],
			"@stylistic/js/no-floating-decimal": [`error`],
			"@stylistic/js/no-mixed-operators": [
				`error`,
				{ allowSamePrecedence: true },
			],
			"@stylistic/js/no-mixed-spaces-and-tabs": [
				`error`,
				// `smart-tabs`,
			],
			"@stylistic/js/no-multi-spaces": [
				`error`,
				{
					ignoreEOLComments: true,
				},
			],
			"@stylistic/js/no-multiple-empty-lines": [
				`error`,
				{
					max: 1,
				},
			],
			"@stylistic/js/no-trailing-spaces": [`error`],
			"@stylistic/js/no-whitespace-before-property": [`error`],
			"@stylistic/js/nonblock-statement-body-position": [
				`error`,
				`beside`,
			],
			"@stylistic/js/object-curly-newline": [
				`error`,
				{
					consistent: true,
					multiline: true,
				},
			],
			"@stylistic/js/object-curly-spacing": [
				`error`,
				`always`,
			],
			"@stylistic/js/object-property-newline": [
				`error`,
				{
					allowMultiplePropertiesPerLine: true,
				},
			],
			"@stylistic/js/operator-linebreak": [
				`error`,
				`before`,
			],
			"@stylistic/js/padded-blocks": [
				`error`,
				`never`,
			],
			"@stylistic/js/padding-line-between-statements": [
				`error`,
				{
					blankLine: `always`,
					prev: `*`,
					next: [`function`, `const`, `let`, `var`, `export`, `return`],
				},
				{
					blankLine: `always`,
					prev: [`import`, `const`, `let`, `var`, `export`, `function`],
					next: `*`,
				},
				{
					blankLine: `any`,
					prev: [`const`, `let`, `var`],
					next: [`const`, `let`, `var`],
				},
				{
					blankLine: `any`,
					prev: `import`,
					next: `import`,
				},
			],
			"@stylistic/js/quote-props": [
				`error`,
				`consistent-as-needed`,
				{
					keywords: true,
				},
			],
			"@stylistic/js/quotes": [
				`error`,
				`backtick`,
			],
			"@stylistic/js/rest-spread-spacing": [
				`error`,
				`never`,
			],
			"@stylistic/js/semi": [
				`error`,
				`never`,
			],
			"@stylistic/js/semi-spacing": [
				`error`,
				{
					before: false,
					after: true,
				},
			],
			"@stylistic/js/semi-style": [
				`error`,
				`first`,
			],
			"@stylistic/js/space-before-blocks": [
				`error`,
				`always`,
			],
			"@stylistic/js/space-before-function-paren": [
				`error`,
				`always`,
			],
			"@stylistic/js/space-in-parens": [
				`error`,
				`never`,
			],
			"@stylistic/js/space-infix-ops": [
				`error`,
				{ int32Hint: false },
			],
			"@stylistic/js/space-unary-ops": [`error`],
			"@stylistic/js/spaced-comment": [
				`error`,
				`always`,
			],
			"@stylistic/js/switch-colon-spacing": [
				`error`,
				{
					before: false,
					after: true,
				},
			],
			"@stylistic/js/template-curly-spacing": [
				`error`,
				`never`,
			],
			"@stylistic/js/template-tag-spacing": [
				`error`,
				`never`,
			],
			"@stylistic/js/wrap-iife": [
				`error`,
				`outside`,
			],
			"@stylistic/js/wrap-regex": [`error`],
			"@stylistic/js/yield-star-spacing": [
				`error`,
				`before`,
			],
		},
	},
]
