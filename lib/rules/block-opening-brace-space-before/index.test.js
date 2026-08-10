import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: true })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@import url(x.css)`,
		},
		{
			code: `a { color: pink; }`,
		},
		{
			code: `@media print { a { color: pink; } }`,
		},
		{
			code: `a {{ &:hover { color: pink; }}}`,
		},
		{
			code: `a {\n&:hover { color: pink; }}`,
		},
	],

	reject: [
		{
			code: `a{ color: pink; }`,
			fixed: `a { color: pink; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 1,
		},
		{
			code: `a  { color: pink; }`,
			fixed: `a { color: pink; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink; }`,
			fixed: `a { color: pink; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `a\n{ color: pink; }`,
			fixed: `a { color: pink; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `a\r\n{ color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `CRLF`,
			message: messages.expectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print\n{ a { color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print { a\n{ color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 17,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/63
			description: `comment between the selector and the opening brace`,
			code: `
				.some-class /* v3+ */
				{
					color: green;
				}
			`,
			fixed: `
				.some-class /* v3+ */ {
					color: green;
				}
			`,
			message: messages.expectedBefore(),
			line: 1,
			column: 22,
		},
		{
			code: `.some-class /* v3+ */\r\n{ color: pink; }`,
			fixed: `.some-class /* v3+ */ { color: pink; }`,
			description: `CRLF with a comment before the opening brace`,
			message: messages.expectedBefore(),
			line: 1,
			column: 22,
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreAtRules: [`for`, `/for/i`, /for/iu] }],

	accept: [
		{
			code: `a { color: pink; }`,
		},
		{
			code: `@for ...\n{ color: pink; }`,
		},
		{
			code: `@for ...\r\n{ color: pink; }`,
		},
	],

	reject: [
		{
			code: `a{ color: pink; }`,
			fixed: `a { color: pink; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreSelectors: [`a`, `/a/`, /a/u] }],

	accept: [
		{
			code: `a { color: pink; }`,
		},
		{
			code: `a{ color: pink; }`,
		},
		{
			code: `a\n{ color: pink; }`,
		},
		{
			code: `a\r\n{ color: pink; }`,
		},
	],

	reject: [
		{
			code: `b{ color: pink; }`,
			fixed: `b { color: pink; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a{ color: pink; }`,
		},
		{
			code: `@media print{ a{ color: pink; } }`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a{ color: pink; }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `a  { color: pink; }`,
			fixed: `a{ color: pink; }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `a\n{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `a\r\n{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			description: `CRLF`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print { a{ color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print{ a { color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 16,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/63
			description: `comment between the selector and the opening brace`,
			code: `
				.some-class /* v3+ */
				{
					color: green;
				}
			`,
			fixed: `
				.some-class /* v3+ */{
					color: green;
				}
			`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 22,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `a { color: pink; }`,
		},
		{
			code: `@media print { a { color: pink; } }`,
		},
		{
			code: `a{ color:\npink; }`,
		},
		{
			code: `@media print { a{ color:\npink; } }`,
		},
		{
			code: `@media print{ a { color:\npink; } }`,
		},
		{
			code: `@media print{\na { color: pink; } }`,
		},
	],

	reject: [
		{
			code: `a{ color: pink; }`,
			fixed: `a { color: pink; }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 1,
		},
		{
			code: `a  { color: pink; }`,
			fixed: `a { color: pink; }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink; }`,
			fixed: `a { color: pink; }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a\n{ color: pink; }`,
			fixed: `a { color: pink; }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a\r\n{ color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `CRLF`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print\n{ a { color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print { a\n{ color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 17,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `a{ color: pink; }`,
		},
		{
			code: `@media print{ a{ color: pink; } }`,
		},
		{
			code: `a { color:\npink; }`,
		},
		{
			code: `a { color:\r\npink; }`,
			description: `CRLF`,
		},
		{
			code: `@media print { a { color:\npink; } }`,
		},
		{
			code: `@media print{ a{ color:\npink; } }`,
		},
		{
			code: `@media print {\na{ color: pink; } }`,
		},
		{
			code: `@media print{\na{ color: pink; } }`,
		},
		{
			code: `@media print{\r\na{ color: pink; } }`,
			description: `CRLF`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a{ color: pink; }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a  { color: pink; }`,
			fixed: `a{ color: pink; }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a\n{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a\r\n{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			description: `CRLF`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print { a{ color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print{ a { color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 16,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `a { color: pink;\nbackground: orange; }`,
		},
		{
			code: `@media print {\na { color: pink;\nbackground: orange } }`,
		},
		{
			code: `@media print {\r\na { color: pink;\r\nbackground: orange } }`,
			description: `CRLF`,
		},
		{
			code: `a { color: pink; }`,
		},
		{
			code: `@media print { a { color: pink; } }`,
		},
		{
			code: `a{ color: pink; }`,
		},
		{
			code: `a  { color: pink; }`,
		},
		{
			code: `a\t{ color: pink; }`,
		},
	],

	reject: [
		{
			code: `a{ color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 1,
		},
		{
			code: `a  { color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a\n{ color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a\r\n{ color: pink;\r\nbackground: orange; }`,
			fixed: `a { color: pink;\r\nbackground: orange; }`,
			description: `CRLF`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print\n{\na { color: pink;\nbackground: orange; } }`,
			fixed: `@media print {\na { color: pink;\nbackground: orange; } }`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print { a\n{ color: pink;\nbackground: orange; } }`,
			fixed: `@media print { a { color: pink;\nbackground: orange; } }`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 17,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `a{ color: pink;\nbackground: orange; }`,
		},
		{
			code: `@media print{\na{ color: pink;\nbackground: orange } }`,
		},
		{
			code: `@media print{\r\na{ color: pink;\r\nbackground: orange } }`,
			description: `CRLF`,
		},
		{
			code: `a { color: pink; }`,
		},
		{
			code: `@media print { a { color: pink; } }`,
		},
		{
			code: `a{ color: pink; }`,
		},
		{
			code: `a  { color: pink; }`,
		},
		{
			code: `a\t{ color: pink; }`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\nbackground: orange; }`,
			fixed: `a{ color: pink;\nbackground: orange; }`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a  { color: pink;\nbackground: orange; }`,
			fixed: `a{ color: pink;\nbackground: orange; }`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink;\nbackground: orange; }`,
			fixed: `a{ color: pink;\nbackground: orange; }`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a\n{ color: pink;\nbackground: orange; }`,
			fixed: `a{ color: pink;\nbackground: orange; }`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print\n{\na{ color: pink;\nbackground: orange; } }`,
			fixed: `@media print{\na{ color: pink;\nbackground: orange; } }`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print{ a\n{ color: pink;\nbackground: orange; } }`,
			fixed: `@media print{ a{ color: pink;\nbackground: orange; } }`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 16,
		},
		{
			code: `@media print{ a\r\n{ color: pink;\r\nbackground: orange; } }`,
			fixed: `@media print{ a{ color: pink;\r\nbackground: orange; } }`,
			description: `CRLF`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 16,
		},
	],
})

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
			message: messages.expectedBefore(),
			line: 1,
			column: 19,
		},
		{
			code: `.some-class // v3+\r\n{ color: pink; }`,
			fixed: `.some-class // v3+\r\n{ color: pink; }`,
			description: `CRLF, inline comment: the line ending survives untouched`,
			message: messages.expectedBefore(),
			line: 1,
			column: 19,
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
			message: messages.rejectedBefore(),
			line: 1,
			column: 19,
		},
	],
})
