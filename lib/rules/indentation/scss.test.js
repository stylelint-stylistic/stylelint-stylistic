import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: true })

testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/62
			description: `comments within a map literal are kept`,
			code: `
				$somevar: ( /* some comment */
				  /* another comment here */
				  'a_property': 0 /* Don't forget this one! */
				)
			`,
			fixed: `
				$somevar: ( /* some comment */
					/* another comment here */
					'a_property': 0 /* Don't forget this one! */
				)
			`,
			warnings: [
				{ line: 2, column: 3, message: messages.expected(`1 tab`) },
				{ line: 3, column: 3, message: messages.expected(`1 tab`) },
			],
		},
	],
})
