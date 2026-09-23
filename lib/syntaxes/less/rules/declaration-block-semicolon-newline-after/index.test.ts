import { createRule } from "../../../../rules/declaration-block-semicolon-newline-after/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// See #720
			description: `a declaration a semicolon of the text of its inline comment closed, a block comment carved out of that text behind it and the semicolon Less closes it on at the head of the next line`,
			code: `
				a {
					color: pink // ; /* c */
					;
					top: 0;
				}
			`,
		},
		{
			// See #248 and #720
			description: `a flag this syntax reads out of the text of an inline comment, the semicolon behind it that text as well, which Less reads no semicolon in`,
			code: `
				a { color: red // c !important;
				top: 0;
				}
			`,
		},
	],

	reject: [
		{
			// See #248
			description: `an inline comment abutting the semicolon, whose line break is what closes it, so the declaration behind it cannot join its line`,
			code: `
				a { color: pink;// c
				top: 0;
				}
			`,
			fixed: `
				a { color: pink;// c
				top: 0;
				}
			`,
			line: 1,
			column: 17,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// See #248
			description: `an inline comment on a line of its own behind the semicolon, which the declaration behind it cannot join either`,
			code: `
				a { color: pink;
				// c
				top: 0;
				}
			`,
			fixed: `
				a { color: pink;
				// c
				top: 0;
				}
			`,
			line: 1,
			column: 17,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// See #248
			description: `an inline comment held by the value, closed by the break the semicolon stands behind, which leaves the fix a line to pull the declaration onto`,
			code: `
				a { color: red // c
				;
				top: 0;
				}
			`,
			fixed: `
				a { color: red // c
				;top: 0;
				}
			`,
			line: 2,
			column: 2,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a block comment on a line of its own behind the semicolon, which closes on its own and leaves the fix a line to pull the declaration onto`,
			code: `
				a { color: pink;
				/* b */
				top: 0;
				}
			`,
			fixed: `
				a { color: pink;
				/* b */top: 0;
				}
			`,
			line: 1,
			column: 17,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// See #248 and #720
			description: `a flag this syntax reads out of the text of an inline comment, the semicolon behind it and the declaration after that text as well, which Less reads no semicolon in`,
			code: `
				a { color: red // c !important; top: 0; }
			`,
		},
	],
})
