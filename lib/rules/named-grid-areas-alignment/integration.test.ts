import { messages as noMultipleWhitespacesMessages } from "../no-multiple-whitespaces/index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

// Under `alignColumns` the runs between the tokens of a line of the table are this rule's, and `no-multiple-whitespaces` leaves them alone (#45); the run in front of the solidus is no run of the table, and that rule collapses it as before. The library lists the rule a block names first, so here the neighbour runs last; its own integration test has it run first.
testRule({
	ruleName,
	config: [true, { alignColumns: true }],
	extraRules: { "@stylistic/no-multiple-whitespaces": true },

	reject: [
		{
			description: `a table to pad and a doubled run in front of the solidus: the padding is written, the run is collapsed, and nothing is left for either rule to say`,
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

// A table an author wrote by hand stands where this rule's fix is off, since the runs are this rule's whether it writes or not, and the neighbour has nothing to say.
testRule({
	ruleName,
	config: [true, { alignColumns: true, disableFix: true }],
	extraRules: { "@stylistic/no-multiple-whitespaces": true },

	accept: [
		{
			description: `a table laid out by hand, which the neighbour leaves alone`,
			code: `
				a {
					grid-template:
						[a]   "x x" 1fr
						[bbb] "y y" 2fr;
				}
			`,
		},
	],

	reject: [
		{
			description: `a table not laid out, reported by this rule and written by nobody`,
			code: `
				a {
					grid-template:
						[a] "x x" 1fr
						[bbb] "y y" 2fr;
				}
			`,
			fixed: `
				a {
					grid-template:
						[a] "x x" 1fr
						[bbb] "y y" 2fr;
				}
			`,
			line: 3,
			column: 3,
			endLine: 4,
			endColumn: 18,
			message: messages.expected(`grid-template`),
		},
	],
})

// Without the option the runs are the neighbour's, as they always were.
testRule({
	ruleName,
	config: [true],
	extraRules: { "@stylistic/no-multiple-whitespaces": true },

	reject: [
		{
			description: `a table laid out by hand under a configuration without the option, whose padding the neighbour collapses`,
			code: `
				a {
					grid-template:
						[a]   "x x" 1fr
						[bbb] "y y" 2fr;
				}
			`,
			fixed: `
				a {
					grid-template:
						[a] "x x" 1fr
						[bbb] "y y" 2fr;
				}
			`,
			line: 3,
			column: 6,
			endLine: 3,
			endColumn: 9,
			message: noMultipleWhitespacesMessages.rejected,
		},
	],
})
