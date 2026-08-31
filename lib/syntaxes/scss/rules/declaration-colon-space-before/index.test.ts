import { createRule } from "../../../../rules/declaration-colon-space-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/88
			description: `inline comment before the colon: the colon cannot leave its line, so the code is left alone and the warning stands`,
			code: `
				a {
					color // keep me
					: pink;
				}
			`,
			fixed: `
				a {
					color // keep me
					: pink;
				}
			`,
			line: 2,
			column: 8,
			message: messages.expectedBefore(),
		},
		{
			description: `CRLF, inline comment: the line ending survives untouched`,
			code: `a { color // keep me\r\n: pink; }`,
			fixed: `a { color // keep me\r\n: pink; }`,
			line: 1,
			column: 11,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/88
			description: `inline comment before the colon: the colon cannot leave its line, so the code is left alone and the warning stands`,
			code: `
				a {
					color // keep me
					: pink;
				}
			`,
			fixed: `
				a {
					color // keep me
					: pink;
				}
			`,
			line: 2,
			column: 8,
			message: messages.rejectedBefore(),
		},
		{
			description: `CRLF, inline comment: the line ending survives untouched`,
			code: `a { color // keep me\r\n: pink; }`,
			fixed: `a { color // keep me\r\n: pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedBefore(),
		},
	],
})
