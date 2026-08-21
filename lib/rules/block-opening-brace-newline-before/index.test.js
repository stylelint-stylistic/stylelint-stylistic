import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: true })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@import url(x.css)`,
			description: `a blockless at-rule, which has no opening brace to break in front of`,
		},
		{
			code: `a\n{ color: pink; }`,
			description: `a break in front of the opening brace`,
		},
		{
			code: `a\r\n{ color: pink; }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a\n\n{ color: pink; }`,
			description: `an empty line in front of the brace, which is a break all the same`,
		},
		{
			code: `a\r\n\r\n{ color: pink; }`,
			description: `the same empty line spelled with carriage returns`,
		},
		{
			code: `a\n{color: pink; }`,
			description: `a declaration abutting the brace, which is none of this rule's business`,
		},
		{
			code: `@media print\n{ a\n{ color: pink; } }`,
			description: `nested blocks, each with the break in front of its brace`,
		},
		{
			code: `@media print\r\n{ a\r\n{ color: pink; } }`,
			description: `the same pair spelled with carriage returns`,
		},
		{
			code: `@media print\n{a\n{color: pink; } }`,
			description: `the same pair with the declarations abutting the braces`,
		},
		{
			code: `@media print\n\t{a\n\t\t{color: pink; } }`,
			description: `indentation between the break and the brace`,
		},
		{
			code: `@media print\n\t{a\n\t\t{color: pink;\n\t\t&:hover\n\t\t\t{\n\t\t\t\tcolor:black;} } }`,
			description: `three blocks nested the same way`,
		},
		{
			code: `@media print\r\n\t{a\r\n\t\t{color: pink;\r\n\t\t&:hover\r\n\t\t\t{\r\n\t\t\t\tcolor:black;} } }`,
			description: `the same three spelled with carriage returns`,
		},
		{
			code: `a\n{ &:hover\n{ color: pink; }}`,
			description: `a parent selector nested in a block, with the break in front of its brace`,
		},
		{
			code: `a\n{ color: red; &:hover\n{ color: pink; }}`,
			description: `the same nesting standing behind a declaration`,
		},
		{
			code: `a /* x */\n{ color: pink; }`,
			description: `an end-of-line comment behind the selector, with the break behind the comment`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a\n { color: pink; }`,
			description: `a space in front of the brace`,
			message: messages.expectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `a{ color: pink; }`,
			fixed: `a\n{ color: pink; }`,
			description: `a brace abutting the selector`,
			message: messages.expectedBefore(),
			line: 1,
			column: 1,
		},
		{
			code: `a  { color: pink; }`,
			fixed: `a\n  { color: pink; }`,
			description: `two spaces in front of the brace`,
			message: messages.expectedBefore(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink; }`,
			fixed: `a\n\t{ color: pink; }`,
			description: `a tab in front of the brace`,
			message: messages.expectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print { a\n{ color: pink; } }`,
			fixed: `@media print\n { a\n{ color: pink; } }`,
			description: `an at-rule with a space in front of its brace, the nested rule broken`,
			message: messages.expectedBefore(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print { a\r\n{ color: pink; } }`,
			fixed: `@media print\r\n { a\r\n{ color: pink; } }`,
			description: `the same pair spelled with a carriage return`,
			message: messages.expectedBefore(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print\n{ a { color: pink; } }`,
			fixed: `@media print\n{ a\n { color: pink; } }`,
			description: `a nested rule with a space in front of its brace`,
			message: messages.expectedBefore(),
			line: 2,
			column: 4,
		},
		{
			code: `@media print{ a\n{ color: pink; } }`,
			fixed: `@media print\n{ a\n{ color: pink; } }`,
			description: `an at-rule whose brace abuts its params`,
			message: messages.expectedBefore(),
			line: 1,
			column: 12,
		},
		{
			code: `@media print{ a\r\n{ color: pink; } }`,
			fixed: `@media print\r\n{ a\r\n{ color: pink; } }`,
			description: `the same pair spelled with a carriage return`,
			message: messages.expectedBefore(),
			line: 1,
			column: 12,
		},
		{
			code: `@media print\n{ a{ color: pink; } }`,
			fixed: `@media print\n{ a\n{ color: pink; } }`,
			description: `a nested rule whose brace abuts its selector`,
			message: messages.expectedBefore(),
			line: 2,
			column: 3,
		},
		{
			code: `a\n/* foo */{ color: pink; }`,
			fixed: `a\n/* foo */\n{ color: pink; }`,
			description: `a comment standing between the break and the brace`,
			message: messages.expectedBefore(),
			line: 2,
			column: 9,
		},
		{
			code: `a\r\n/* foo */{ color: pink; }`,
			fixed: `a\r\n/* foo */\r\n{ color: pink; }`,
			description: `the same comment behind a carriage return`,
			message: messages.expectedBefore(),
			line: 2,
			column: 9,
		},
		{
			code: `@media print /* foo */ { a /* foo */ { color: pink; } }`,
			fixed: `@media print /* foo */\n { a /* foo */\n { color: pink; } }`,
			description: `comments in front of both braces, each on the brace's own line`,
			warnings: [
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 37,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 23,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `a\n{ color: pink; }`,
			description: `a single-line block with the break in front of its brace`,
		},
		{
			code: `a\n{color: pink; }`,
			description: `the same block with the declaration abutting the brace`,
		},
		{
			code: `@media print\n{ a\n{ color: pink; } }`,
			description: `nested single-line blocks, each broken in front of its brace`,
		},
		{
			code: `@media print\r\n{ a\r\n{ color: pink; } }`,
			description: `the same pair spelled with carriage returns`,
		},
		{
			code: `@media print\n{a\n{color: pink; } }`,
			description: `the same pair with the declarations abutting the braces`,
		},
		{
			code: `a{ color: pink;\nbackground:orange; }`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `@media print { a{ color: pink;\nbackground:orange; } }`,
			description: `a nested multi-line block, likewise passed over`,
		},
		{
			code: `@media print{ a { color: pink;\nbackground:orange; } }`,
			description: `the same block with the at-rule's brace abutting its params`,
		},
		{
			code: `@media print{\na\n{ color: pink; } }`,
			description: `a break behind the at-rule's brace, with the nested block broken in front of its own`,
		},
		{
			code: `@media print{\r\na\r\n{ color: pink; } }`,
			description: `the same pair spelled with a carriage return`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a\n { color: pink; }`,
			description: `a space in front of the brace of a single-line block`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a{ color: pink; }`,
			fixed: `a\n{ color: pink; }`,
			description: `a brace abutting the selector of a single-line block`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 1,
		},
		{
			code: `a  { color: pink; }`,
			fixed: `a\n  { color: pink; }`,
			description: `two spaces in front of the brace`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink; }`,
			fixed: `a\n\t{ color: pink; }`,
			description: `a tab in front of the brace`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print\n{ a { color: pink; } }`,
			fixed: `@media print\n{ a\n { color: pink; } }`,
			description: `a nested single-line block with a space in front of its brace`,
			message: messages.expectedBeforeSingleLine(),
			line: 2,
			column: 4,
		},
		{
			code: `@media print\n{ a{ color: pink; } }`,
			fixed: `@media print\n{ a\n{ color: pink; } }`,
			description: `a nested single-line block whose brace abuts its selector`,
			message: messages.expectedBeforeSingleLine(),
			line: 2,
			column: 3,
		},
		{
			code: `@media print\r\n{ a{ color: pink; } }`,
			fixed: `@media print\r\n{ a\r\n{ color: pink; } }`,
			description: `the same pair spelled with a carriage return`,
			message: messages.expectedBeforeSingleLine(),
			line: 2,
			column: 3,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `a{ color: pink; }`,
			description: `a single-line block whose brace abuts the selector`,
		},
		{
			code: `a{color: pink; }`,
			description: `the same block with the declaration abutting the brace too`,
		},
		{
			code: `@media print{ a{ color: pink; } }`,
			description: `nested single-line blocks, each abutting its selector`,
		},
		{
			code: `@media print{a{color: pink; } }`,
			description: `the same pair with the declarations abutting the braces`,
		},
		{
			code: `a\n{ color: pink;\nbackground:orange; }`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `a\r\n{ color: pink;\r\nbackground:orange; }`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `@media print { a\n{ color: pink;\nbackground:orange; } }`,
			description: `a nested multi-line block, likewise passed over`,
		},
		{
			code: `@media print{ a\n{ color: pink;\nbackground:orange; } }`,
			description: `the same block with the at-rule's brace abutting its params`,
		},
		{
			code: `@media print{\na{ color: pink; } }`,
			description: `a break behind the at-rule's brace, with the nested block abutting its own`,
		},
		{
			code: `@media print{\r\na{ color: pink; } }`,
			description: `the same pair spelled with a carriage return`,
		},
	],

	reject: [
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
			description: `two spaces in front of the brace`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			description: `a tab in front of the brace`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print\n{ a\n{ color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			description: `nested single-line blocks, each broken in front of its brace`,
			message: messages.rejectedBeforeSingleLine(),
			line: 2,
			column: 4,
		},
		{
			code: `@media print\r\n{ a\r\n{ color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			description: `the same pair spelled with carriage returns`,
			message: messages.rejectedBeforeSingleLine(),
			line: 2,
			column: 4,
		},
		{
			code: `@media print { a\n{ color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			description: `a nested single-line block broken in front of its brace`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `@media print/*comment*/ { a/*comment*/\n{ color: pink; } }`,
			fixed: `@media print/*comment*/{ a/*comment*/{ color: pink; } }`,
			description: `comments abutting both selectors, with the break in front of the inner brace`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 39,
		},
		{
			code: `@media print /*comment*/ { a /*comment*/\n{ color: pink; } }`,
			fixed: `@media print /*comment*/{ a /*comment*/{ color: pink; } }`,
			description: `the same comments standing behind spaces`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 41,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `a\n{ color: pink;\nbackground: orange; }`,
			description: `a multi-line block with the break in front of its brace`,
		},
		{
			code: `a\r\n{ color: pink;\nbackground: orange; }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `@media print\n{\na\n{ color: pink;\nbackground: orange } }`,
			description: `nested multi-line blocks, each broken in front of its brace`,
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
			description: `a single-line block whose brace abuts its selector`,
		},
		{
			code: `a  { color: pink; }`,
			description: `two spaces in front of the brace of a single-line block`,
		},
		{
			code: `a\t{ color: pink; }`,
			description: `a tab in front of the brace of a single-line block`,
		},
		{
			code: `a /* foo */\n  {\n    color: pink;\n  }`,
			description: `a comment behind the selector, with the break and indentation in front of the brace`,
		},
	],

	reject: [
		{
			code: `a{ color: pink;\nbackground: orange; }`,
			fixed: `a\n{ color: pink;\nbackground: orange; }`,
			description: `a multi-line block whose brace abuts its selector`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 1,
		},
		{
			code: `a  { color: pink;\nbackground: orange; }`,
			fixed: `a\n  { color: pink;\nbackground: orange; }`,
			description: `two spaces in front of the brace of a multi-line block`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 3,
		},
		{
			code: `a\t{ color: pink;\nbackground: orange; }`,
			fixed: `a\n\t{ color: pink;\nbackground: orange; }`,
			description: `a tab in front of the brace of a multi-line block`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a { color: pink;\nbackground: orange; }`,
			fixed: `a\n { color: pink;\nbackground: orange; }`,
			description: `a space in front of the brace of a multi-line block`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a { color: pink;\r\nbackground: orange; }`,
			fixed: `a\r\n { color: pink;\r\nbackground: orange; }`,
			description: `the same block spelled with a carriage return`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `@media print\n{\na { color: pink;\nbackground: orange; } }`,
			fixed: `@media print\n{\na\n { color: pink;\nbackground: orange; } }`,
			description: `a nested multi-line block with a space in front of its brace`,
			message: messages.expectedBeforeMultiLine(),
			line: 3,
			column: 2,
		},
		{
			code: `@media print { a\n{ color: pink;\nbackground: orange; } }`,
			fixed: `@media print\n { a\n{ color: pink;\nbackground: orange; } }`,
			description: `an at-rule with a space in front of its brace, the nested block multi-line`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 13,
		},
		{
			code: `@media print { a\r\n{ color: pink;\r\nbackground: orange; } }`,
			fixed: `@media print\r\n { a\r\n{ color: pink;\r\nbackground: orange; } }`,
			description: `the same pair spelled with carriage returns`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 13,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `a{ color: pink;\nbackground: orange; }`,
			description: `a multi-line block whose brace abuts its selector`,
		},
		{
			code: `a{ color: pink;\r\nbackground: orange; }`,
			description: `the same block spelled with a carriage return`,
		},
		{
			code: `@media print{\na{ color: pink;\nbackground: orange } }`,
			description: `nested blocks, the inner one multi-line and abutting its selector`,
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
			description: `a single-line block whose brace abuts its selector`,
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
			code: `a { color: pink;\r\nbackground: orange; }`,
			fixed: `a{ color: pink;\r\nbackground: orange; }`,
			description: `the same block spelled with a carriage return`,
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
			description: `nested blocks broken in front of both braces, the inner one multi-line`,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/89
			description: `comment between the selector and the opening brace`,
			code: `
				.some-class /* v3+ */
				{
					color: green;
					background: orange;
				}
			`,
			fixed: `
				.some-class /* v3+ */{
					color: green;
					background: orange;
				}
			`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 22,
		},
		{
			description: `comment holding a double slash`,
			code: `
				.some-class /* keep // me */
				{
					color: green;
					background: orange;
				}
			`,
			fixed: `
				.some-class /* keep // me */{
					color: green;
					background: orange;
				}
			`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 29,
		},
	],
})

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
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 19,
		},
		{
			code: `.some-class // v3+\r\n{ color: pink;\r\nbackground: orange; }`,
			fixed: `.some-class // v3+\r\n{ color: pink;\r\nbackground: orange; }`,
			description: `CRLF, inline comment: the line ending survives untouched`,
			message: messages.rejectedBeforeMultiLine(),
			line: 1,
			column: 19,
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
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 19,
		},
	],
})
