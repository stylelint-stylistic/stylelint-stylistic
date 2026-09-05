import { createRule } from "../../../../rules/named-grid-areas-alignment/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

/** The same comment, in the syntax that keeps it in the value everywhere but directly behind the colon */
testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-scss`,

	accept: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/322
		{
			description: `rows aligned to each other rather than to the row standing in a comment between them`,
			code: `
				a {
					grid-template-areas: "a a"
						// "bbb bbb"
						"c c";
				}
			`,
		},
	],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/322
		{
			description: `a row standing in the text of an end-of-line comment that follows a row on its line, which the syntax keeps in the value`,
			code: `
				a {
					grid-template-areas: "a  a" // "x   x"
						"b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a" // "x   x"
						"b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 3,
			endColumn: 8,
			message: messages.expected(`grid-template-areas`),
		},
		{
			description: `rows aligned to the width of a row standing in a comment between them, which is no row of the grid`,
			code: `
				a {
					grid-template-areas: "a   a"
						// "bbb bbb"
						"c   c";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a"
						// "bbb bbb"
						"c c";
				}
			`,
			line: 2,
			column: 23,
			endLine: 4,
			endColumn: 10,
			message: messages.expected(`grid-template-areas`),
		},
		{
			description: `a block comment opened as a slash, a star and a slash inside such a comment, which the value parser closes on that third character and prints one wider`,
			code: `
				a {
					grid-template-areas: "a  a"
						// /*/ x
						"b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a"
						// /*/ x
						"b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 4,
			endColumn: 8,
			message: messages.expected(`grid-template-areas`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/504
		{
			description: `a quotation mark standing inside such a comment, which the value parser pairs with the opening mark of the row on the line below, so that the rows behind the comment are cut at the wrong places`,
			code: `
				a {
					grid-template-areas: "c   c" // "
						"a  a" "b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "c c" // "
						"a a" "b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 3,
			endColumn: 15,
			message: messages.expected(`grid-template-areas`),
		},
	],
})

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a shorthand whose rows are followed by an end-of-line comment, which the syntax keeps in the value`,
			code: `
				a {
					grid-template: "a  a" 1fr // "x   x"
						"b b" auto / 1fr 1fr;
				}
			`,
			fixed: `
				a {
					grid-template: "a a" 1fr // "x   x"
						"b b" auto / 1fr 1fr;
				}
			`,
			line: 2,
			column: 17,
			endLine: 3,
			endColumn: 23,
			message: messages.expected(`grid-template`),
		},
	],
})
