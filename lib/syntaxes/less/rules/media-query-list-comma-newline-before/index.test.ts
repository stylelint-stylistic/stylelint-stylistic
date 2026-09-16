import { createRule } from "../../../../rules/media-query-list-comma-newline-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// See #137
			description: `an inline comment in front of the comma, closed by the break the rule asks for`,
			code: `
				@media (min-width: 1px) // c
				,(max-width: 2px) { a { color: red; } }
			`,
		},
	],

	reject: [
		{
			// See #137
			description: `a comma inside the text of an inline comment is no comma of the query, and the comma in front of the comment gets its break`,
			code: `
				@media (min-width: 1px), // a , b
				(max-width: 2px) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 1px)
				, // a , b
				(max-width: 2px) { a { color: red; } }
			`,
			line: 1,
			column: 24,
			message: messages.expectedBefore(),
		},
		{
			// Pins the end of an inline comment at the bare carriage return Less reads as a line feed, which the parser keeps in the text, so the fix writes behind the comment rather than into it
			description: `a comma behind an inline comment that a bare carriage return closes`,
			code: `@media (a) // c\r, (b) { d { e: f; } }`,
			fixed: `@media (a) // c\r\n, (b) { d { e: f; } }`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// See #137
			description: `a comma whose whitespace holds the break that closes an inline comment, which the fixer has to leave standing`,
			code: `
				@media (min-width: 1px) // c
				,(max-width: 2px) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 1px) // c
				,(max-width: 2px) { a { color: red; } }
			`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})
