import { createRule } from "../../../../rules/block-opening-brace-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248
			description: `an inline comment abutting the brace, whose line break is what closes it, so the declaration behind it cannot join its line`,
			code: `
				a {// c
				color: pink;
				}
			`,
			fixed: `
				a {// c
				color: pink;
				}
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248
			description: `an inline comment on a line of its own behind the brace, where the fix would take away two breaks and the second of them closes the comment`,
			code: `
				a {
				// c
				color: pink;
				}
			`,
			fixed: `
				a {
				// c
				color: pink;
				}
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248
			description: `a block comment standing between an inline one and the declaration, which the fix would carry into the inline comment along with everything behind it`,
			code: `
				a {
				// c
				/* b */
				color: pink;
				}
			`,
			fixed: `
				a {
				// c
				/* b */
				color: pink;
				}
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a block comment on a line of its own behind the brace, which closes on its own and leaves the fix a line to pull the declaration onto`,
			code: `
				a {
				/* b */
				color: pink;
				}
			`,
			fixed: `
				a {/* b */color: pink;
				}
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})
testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `a single-line block behind a media feature holding an inline comment, which the option leaves alone because the block is on one line however wide the comment is printed`,
			code: `
				@media (min-width: 100px // c
					) { a { color: red; } }
			`,
		},
	],
})
