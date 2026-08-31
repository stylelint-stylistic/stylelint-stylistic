import { createRule } from "../../../../rules/block-opening-brace-newline-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/89
			description: `inline comment between the selector and the opening brace: the brace cannot leave its line, so the code is left alone and the warning stands`,
			code: `
				.some-class // v3+
				{
					color: green;
					background: orange;
				}
			`,
			fixed: `
				.some-class // v3+
				{
					color: green;
					background: orange;
				}
			`,
			line: 1,
			column: 19,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `CRLF, inline comment: the line ending survives untouched`,
			code: `.some-class // v3+\r\n{ color: pink;\r\nbackground: orange; }`,
			fixed: `.some-class // v3+\r\n{ color: pink;\r\nbackground: orange; }`,
			line: 1,
			column: 19,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})
testRule({
	ruleName,
	config: [`never-single-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/89
			description: `inline comment between the selector and the opening brace: the brace cannot leave its line, so the code is left alone and the warning stands`,
			code: `
				.some-class // v3+
				{ color: green; }
			`,
			fixed: `
				.some-class // v3+
				{ color: green; }
			`,
			line: 1,
			column: 19,
			message: messages.rejectedBeforeSingleLine(),
		},
	],
})
testRule({
	ruleName,
	config: [`always-single-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `two single-line blocks behind a media feature holding an inline comment, the outer one of which the option reaches only once the block is measured as the file spells it`,
			code: `
				@media (min-width: 100px // c
					) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 100px // c
					) { a
				 { color: red; } }
			`,
			warnings: [
				{
					line: 2,
					column: 7,
					message: messages.expectedBeforeSingleLine(),
				},
				{
					line: 2,
					column: 3,
					message: messages.expectedBeforeSingleLine(),
				},
			],
		},
	],
})
