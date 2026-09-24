import { createRule } from "../../../../rules/named-grid-areas-alignment/index.ts"
import { messages as noMultipleWhitespacesMessages } from "../../../../rules/no-multiple-whitespaces/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true, { alignColumns: true }],
	extraRules: { "@stylistic/no-multiple-whitespaces": true },

	reject: [
		{
			// See #715
			description: `a plain CSS table to pad and a doubled run in front of the solidus, with the neighbor that collapses runs listed under the core's name, which reads the same file`,
			code: `
				a {
					grid-template:
						[a] "x  x" 1fr
						[bbb] "y y" auto  / 1fr;
				}
			`,
			fixed: `
				a {
					grid-template:
						[a]   "x x" 1fr
						[bbb] "y y" auto / 1fr;
				}
			`,
			warnings: [
				{
					line: 3,
					column: 3,
					endLine: 4,
					endColumn: 26,
					message: messages.expected(`grid-template`),
				},
				{
					line: 4,
					column: 19,
					endLine: 4,
					endColumn: 21,
					message: noMultipleWhitespacesMessages.rejected,
				},
			],
		},
	],
})
