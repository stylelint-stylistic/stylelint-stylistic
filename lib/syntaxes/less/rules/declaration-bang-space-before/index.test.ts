import { createRule } from "../../../../rules/declaration-bang-space-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

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
			description: `bang behind code of its own line: the comment on the line above closes before the code, so the fix goes through`,
			code: `
				a {
					color: red // keep me
					blue!default;
				}
			`,
			fixed: `
				a {
					color: red // keep me
					blue !default;
				}
			`,
			line: 3,
			column: 6,
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
			description: `bang behind code of its own line: the comment on the line above closes before the code, so the fix goes through`,
			code: `
				a {
					color: red // keep me
					blue !default;
				}
			`,
			fixed: `
				a {
					color: red // keep me
					blue!default;
				}
			`,
			line: 3,
			column: 7,
			message: messages.rejectedBefore(),
		},
	],
})
