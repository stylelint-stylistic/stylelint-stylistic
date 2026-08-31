import { createRule } from "../../../../rules/declaration-bang-space-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/116
			description: `inline comment before the bang: the bang cannot join the comment's line, so the code is left alone and the warning stands`,
			code: `
				a {
					color: red // keep me
						!important;
				}
			`,
			fixed: `
				a {
					color: red // keep me
						!important;
				}
			`,
			line: 3,
			column: 3,
			message: messages.expectedBefore(),
		},
		{
			description: `CRLF, inline comment: the line ending survives untouched`,
			code: `a { color: red // keep me\r\n!important; }`,
			fixed: `a { color: red // keep me\r\n!important; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/116
			description: `inline comment before a bang standing inside the value`,
			code: `
				a {
					color: red // keep me
						!default;
				}
			`,
			fixed: `
				a {
					color: red // keep me
						!default;
				}
			`,
			line: 3,
			column: 3,
			message: messages.expectedBefore(),
		},
		{
			description: `block comment before the bang: nothing of it depends on a line break, so the fix goes through`,
			code: `
				a {
					color: red /* keep me */
						!important;
				}
			`,
			fixed: `
				a {
					color: red /* keep me */ !important;
				}
			`,
			line: 3,
			column: 3,
			message: messages.expectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/116
			description: `inline comment before the bang: the bang cannot join the comment's line, so the code is left alone and the warning stands`,
			code: `
				a {
					color: red // keep me
						!important;
				}
			`,
			fixed: `
				a {
					color: red // keep me
						!important;
				}
			`,
			line: 3,
			column: 3,
			message: messages.rejectedBefore(),
		},
		{
			description: `CRLF, inline comment: the line ending survives untouched`,
			code: `a { color: red // keep me\r\n!important; }`,
			fixed: `a { color: red // keep me\r\n!important; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/116
			description: `inline comment before a bang standing inside the value`,
			code: `
				a {
					color: red // keep me
						!default;
				}
			`,
			fixed: `
				a {
					color: red // keep me
						!default;
				}
			`,
			line: 3,
			column: 3,
			message: messages.rejectedBefore(),
		},
		{
			description: `block comment before the bang: nothing of it depends on a line break, so the fix goes through`,
			code: `
				a {
					color: red /* keep me */
						!important;
				}
			`,
			fixed: `
				a {
					color: red /* keep me */!important;
				}
			`,
			line: 3,
			column: 3,
			message: messages.rejectedBefore(),
		},
	],
})
