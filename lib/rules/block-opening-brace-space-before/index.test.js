import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@import url(x.css)`,
			description: `a blockless at-rule, which has no opening brace to space in front of`,
		},
		{
			code: `a { color: pink; }`,
			description: `a space in front of the opening brace`,
		},
		{
			code: `@media print { a { color: pink; } }`,
			description: `nested blocks, each with the space`,
		},
		{
			code: `a {{ &:hover { color: pink; }}}`,
			description: `a block opening straight inside another, whose braces abut one another`,
		},
		{
			code: `a {\n&:hover { color: pink; }}`,
			description: `a parent selector on the line behind an opening brace`,
		},
	],

	reject: [
		{
			code: `a{ color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `a brace abutting the selector`,
			message: messages.expectedBefore(),
			line: 1,
			column: 1,
		},
		{
			code: `a  { color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `two spaces where one belongs`,
			message: messages.expectedBefore(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `a tab where the space belongs`,
			message: messages.expectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `a\n{ color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `a break where the space belongs`,
			message: messages.expectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `a\r\n{ color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print\n{ a { color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			description: `a break in front of the at-rule's brace`,
			message: messages.expectedBefore(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print { a\n{ color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			description: `a break in front of the nested block's brace`,
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
			description: `comment between the selector and the opening brace with an URL`,
			code: `
				.some-class /* https://foo.bar/ */
				{
					color: green;
				}
			`,
			fixed: `
				.some-class /* https://foo.bar/ */ {
					color: green;
				}
			`,
			message: messages.expectedBefore(),
			line: 1,
			column: 35,
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
			description: `a rule with the space, which the ignored at-rules have nothing to do with`,
		},
		{
			code: `@for ...\n{ color: pink; }`,
			description: `an @for broken in front of its brace, matched by the option three ways over`,
		},
		{
			code: `@for ...\r\n{ color: pink; }`,
			description: `the same at-rule broken with a carriage return`,
		},
	],

	reject: [
		{
			code: `a{ color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `a rule abutting its brace, with no ignored at-rule anywhere near it`,
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
			description: `a selector named in the option, with the space in front of its brace`,
		},
		{
			code: `a{ color: pink; }`,
			description: `the same selector abutting its brace`,
		},
		{
			code: `a\n{ color: pink; }`,
			description: `the same selector broken in front of its brace`,
		},
		{
			code: `a\r\n{ color: pink; }`,
			description: `the same break spelled with a carriage return`,
		},
	],

	reject: [
		{
			code: `b{ color: pink; }`,
			fixed: `b { color: pink; }`,
			description: `a selector the option does not name, abutting its brace`,
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
			description: `a brace abutting the selector`,
		},
		{
			code: `@media print{ a{ color: pink; } }`,
			description: `nested blocks, each abutting its selector`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a{ color: pink; }`,
			description: `a space in front of the brace`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `a  { color: pink; }`,
			fixed: `a{ color: pink; }`,
			description: `two spaces in front of the brace`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			description: `a tab in front of the brace`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `a\n{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			description: `a break in front of the brace`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `a\r\n{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print { a{ color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			description: `a space in front of the nested block's brace`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print{ a { color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			description: `a space in front of the at-rule's brace`,
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
			description: `a single-line block with the space in front of its brace`,
		},
		{
			code: `@media print { a { color: pink; } }`,
			description: `nested single-line blocks, each with the space`,
		},
		{
			code: `a{ color:\npink; }`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `@media print { a{ color:\npink; } }`,
			description: `a nested multi-line block, likewise passed over`,
		},
		{
			code: `@media print{ a { color:\npink; } }`,
			description: `the same block with the at-rule abutting its own brace`,
		},
		{
			code: `@media print{\na { color: pink; } }`,
			description: `a break behind the at-rule's brace, with the nested block single-line`,
		},
	],

	reject: [
		{
			code: `a{ color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `a single-line block abutting its brace`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 1,
		},
		{
			code: `a  { color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `two spaces in front of the brace of a single-line block`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `a tab in front of the brace of a single-line block`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a\n{ color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `a break in front of the brace of a single-line block`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a\r\n{ color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print\n{ a { color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			description: `a break in front of the at-rule's brace`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print { a\n{ color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			description: `a break in front of the nested block's brace`,
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
			description: `a single-line block abutting its brace`,
		},
		{
			code: `@media print{ a{ color: pink; } }`,
			description: `nested single-line blocks, each abutting its brace`,
		},
		{
			code: `a { color:\npink; }`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `a { color:\r\npink; }`,
			description: `the same block spelled with a carriage return`,
		},
		{
			code: `@media print { a { color:\npink; } }`,
			description: `a nested multi-line block, likewise passed over`,
		},
		{
			code: `@media print{ a{ color:\npink; } }`,
			description: `the same pair with both braces abutting their selectors`,
		},
		{
			code: `@media print {\na{ color: pink; } }`,
			description: `a break behind the at-rule's brace, with the nested block abutting its own`,
		},
		{
			code: `@media print{\na{ color: pink; } }`,
			description: `the same pair with the at-rule abutting its brace as well`,
		},
		{
			code: `@media print{\r\na{ color: pink; } }`,
			description: `the same pair spelled with a carriage return`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a{ color: pink; }`,
			description: `a space in front of the brace of a single-line block`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a  { color: pink; }`,
			fixed: `a{ color: pink; }`,
			description: `two spaces in front of the brace of a single-line block`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			description: `a tab in front of the brace of a single-line block`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a\n{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			description: `a break in front of the brace of a single-line block`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a\r\n{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print { a{ color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			description: `a space in front of the nested block's brace`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print{ a { color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			description: `a space in front of the at-rule's brace`,
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
			description: `a multi-line block with the space in front of its brace`,
		},
		{
			code: `@media print {\na { color: pink;\nbackground: orange } }`,
			description: `a nested multi-line block with the space in front of its brace`,
		},
		{
			code: `@media print {\r\na { color: pink;\r\nbackground: orange } }`,
			description: `the same pair spelled with carriage returns`,
		},
		{
			code: `a { color: pink; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `@media print { a { color: pink; } }`,
			description: `nested single-line blocks, likewise passed over`,
		},
		{
			code: `a{ color: pink; }`,
			description: `a single-line block abutting its brace`,
		},
		{
			code: `a  { color: pink; }`,
			description: `two spaces in front of the brace of a single-line block`,
		},
		{
			code: `a\t{ color: pink; }`,
			description: `a tab in front of the brace of a single-line block`,
		},
	],

	reject: [
		{
			code: `a{ color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			description: `a multi-line block abutting its brace`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 1,
		},
		{
			code: `a  { color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			description: `two spaces in front of the brace of a multi-line block`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			description: `a tab in front of the brace of a multi-line block`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a\n{ color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			description: `a break in front of the brace of a multi-line block`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a\r\n{ color: pink;\r\nbackground: orange; }`,
			fixed: `a { color: pink;\r\nbackground: orange; }`,
			description: `the same break spelled with carriage returns`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print\n{\na { color: pink;\nbackground: orange; } }`,
			fixed: `@media print {\na { color: pink;\nbackground: orange; } }`,
			description: `an at-rule broken in front of its brace, holding a multi-line block`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print { a\n{ color: pink;\nbackground: orange; } }`,
			fixed: `@media print { a { color: pink;\nbackground: orange; } }`,
			description: `a nested multi-line block broken in front of its brace`,
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
			description: `a multi-line block abutting its brace`,
		},
		{
			code: `@media print{\na{ color: pink;\nbackground: orange } }`,
			description: `a nested multi-line block abutting its brace, the at-rule broken behind its own`,
		},
		{
			code: `@media print{\r\na{ color: pink;\r\nbackground: orange } }`,
			description: `the same pair spelled with carriage returns`,
		},
		{
			code: `a { color: pink; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `@media print { a { color: pink; } }`,
			description: `nested single-line blocks, likewise passed over`,
		},
		{
			code: `a{ color: pink; }`,
			description: `a single-line block abutting its brace`,
		},
		{
			code: `a  { color: pink; }`,
			description: `two spaces in front of the brace of a single-line block`,
		},
		{
			code: `a\t{ color: pink; }`,
			description: `a tab in front of the brace of a single-line block`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\nbackground: orange; }`,
			fixed: `a{ color: pink;\nbackground: orange; }`,
			description: `a space in front of the brace of a multi-line block`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a  { color: pink;\nbackground: orange; }`,
			fixed: `a{ color: pink;\nbackground: orange; }`,
			description: `two spaces in front of the brace of a multi-line block`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink;\nbackground: orange; }`,
			fixed: `a{ color: pink;\nbackground: orange; }`,
			description: `a tab in front of the brace of a multi-line block`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a\n{ color: pink;\nbackground: orange; }`,
			fixed: `a{ color: pink;\nbackground: orange; }`,
			description: `a break in front of the brace of a multi-line block`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print\n{\na{ color: pink;\nbackground: orange; } }`,
			fixed: `@media print{\na{ color: pink;\nbackground: orange; } }`,
			description: `an at-rule broken in front of its brace, holding a multi-line block`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print{ a\n{ color: pink;\nbackground: orange; } }`,
			fixed: `@media print{ a{ color: pink;\nbackground: orange; } }`,
			description: `a nested multi-line block broken in front of its brace`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 16,
		},
		{
			code: `@media print{ a\r\n{ color: pink;\r\nbackground: orange; } }`,
			fixed: `@media print{ a{ color: pink;\r\nbackground: orange; } }`,
			description: `the same pair spelled with carriage returns`,
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
