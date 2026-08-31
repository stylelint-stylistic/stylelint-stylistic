import { createRule } from "../../../../rules/block-opening-brace-space-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/63
			description: `inline comment between the selector and the opening brace: the brace cannot leave its line, so the code is left alone and the warning stands`,
			code: `
				.some-class // v3+
				{
					color: green;
				}
			`,
			fixed: `
				.some-class // v3+
				{
					color: green;
				}
			`,
			line: 1,
			column: 19,
			message: messages.expectedBefore(),
		},
		{
			description: `CRLF, inline comment: the line ending survives untouched`,
			code: `.some-class // v3+\r\n{ color: pink; }`,
			fixed: `.some-class // v3+\r\n{ color: pink; }`,
			line: 1,
			column: 19,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/63
			description: `inline comment between the selector and the opening brace: the brace cannot leave its line, so the code is left alone and the warning stands`,
			code: `
				.some-class // v3+
				{
					color: green;
				}
			`,
			fixed: `
				.some-class // v3+
				{
					color: green;
				}
			`,
			line: 1,
			column: 19,
			message: messages.rejectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never-multi-line`],
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
