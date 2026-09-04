import { createRule } from "../../../../rules/declaration-block-semicolon-space-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/398
			description: `a call named with a code point of an identifier that lies outside ASCII, whose double slashes open a comment the semicolon cannot join`,
			code: `a { b: éurl(http://a/b.png) 1px; c: 2px }`,
			fixed: `a { b: éurl(http://a/b.png) 1px; c: 2px }`,
			line: 1,
			column: 31,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/117
			description: `inline comment before the semicolon: the semicolon cannot join the comment's line, so the code is left alone and the warning stands`,
			code: `
				a {
					color: red // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red // keep me
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/117
			description: `inline comment in front of the flag: the space goes behind the flag, and the comment stays where it is`,
			code: `
				a {
					color: red // keep me
						!important;
				}
			`,
			fixed: `
				a {
					color: red // keep me
						!important ;
				}
			`,
			line: 3,
			column: 12,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/211
			description: `a flag standing in the text of the comment, which Less reads as comment text while the parser reads it as the flag — the value and the flag's raw together show the comment running on to the semicolon`,
			code: `
				a {
					color: red // c !important
					;
				}
			`,
			fixed: `
				a {
					color: red // c !important
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/211
			description: `the same flag with the semicolon already standing on the comment's line, which the parser keeps no raw of, so the value alone shows the comment`,
			code: `
				a {
					color: red // c !important;
				}
			`,
			fixed: `
				a {
					color: red // c !important;
				}
			`,
			line: 2,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/333
			description: `a form feed inside an inline comment, which is whitespace and no line break, so the semicolon stands in the comment's text and the value is left alone`,
			code: `a { b: 1px // c\f\t2px; }`,
			fixed: `a { b: 1px // c\f\t2px; }`,
			line: 1,
			column: 20,
			message: messages.expectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/117
			description: `inline comment before the semicolon: the semicolon cannot join the comment's line, so the code is left alone and the warning stands`,
			code: `
				a {
					color: red // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red // keep me
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/211
			description: `a flag standing in the text of the comment, which Less reads as comment text while the parser reads it as the flag — the value and the flag's raw together show the comment running on to the semicolon`,
			code: `
				a {
					color: red // c !important
					;
				}
			`,
			fixed: `
				a {
					color: red // c !important
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBefore(),
		},
	],
})
