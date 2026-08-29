import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a blockless at-rule, which has no opening brace to break in front of`,
			code: `@import url(x.css)`,
		},
		{
			description: `a break in front of the opening brace`,
			code: `a\n{ color: pink; }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a\r\n{ color: pink; }`,
		},
		{
			description: `an empty line in front of the brace, which is a break all the same`,
			code: `
				a

				{ color: pink; }
			`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `a\r\n\r\n{ color: pink; }`,
		},
		{
			description: `a declaration abutting the brace, which is none of this rule's business`,
			code: `a\n{color: pink; }`,
		},
		{
			description: `nested blocks, each with the break in front of its brace`,
			code: `
				@media print
				{ a
				{ color: pink; } }
			`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print\r\n{ a\r\n{ color: pink; } }`,
		},
		{
			description: `the same pair with the declarations abutting the braces`,
			code: `
				@media print
				{a
				{color: pink; } }
			`,
		},
		{
			description: `indentation between the break and the brace`,
			code: `
				@media print
					{a
						{color: pink; } }
			`,
		},
		{
			description: `three blocks nested the same way`,
			code: `
				@media print
					{a
						{color: pink;
						&:hover
							{
								color:black;} } }
			`,
		},
		{
			description: `the same three spelled with carriage returns`,
			code: `@media print\r\n\t{a\r\n\t\t{color: pink;\r\n\t\t&:hover\r\n\t\t\t{\r\n\t\t\t\tcolor:black;} } }`,
		},
		{
			description: `a parent selector nested in a block, with the break in front of its brace`,
			code: `
				a
				{ &:hover
				{ color: pink; }}
			`,
		},
		{
			description: `the same nesting standing behind a declaration`,
			code: `
				a
				{ color: red; &:hover
				{ color: pink; }}
			`,
		},
		{
			description: `an end-of-line comment behind the selector, with the break behind the comment`,
			code: `a /* x */\n{ color: pink; }`,
		},
	],

	reject: [
		{
			description: `a space in front of the brace`,
			code: `a { color: pink; }`,
			fixed: `a\n { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expectedBefore(),
		},
		{
			description: `a brace abutting the selector`,
			code: `a{ color: pink; }`,
			fixed: `a\n{ color: pink; }`,
			line: 1,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the brace`,
			code: `a  { color: pink; }`,
			fixed: `a\n  { color: pink; }`,
			line: 1,
			column: 3,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the brace`,
			code: `a\t{ color: pink; }`,
			fixed: `a\n\t{ color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expectedBefore(),
		},
		{
			description: `an at-rule with a space in front of its brace, the nested rule broken`,
			code: `@media print { a\n{ color: pink; } }`,
			fixed: `@media print\n { a\n{ color: pink; } }`,
			line: 1,
			column: 13,
			message: messages.expectedBefore(),
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `@media print { a\r\n{ color: pink; } }`,
			fixed: `@media print\r\n { a\r\n{ color: pink; } }`,
			line: 1,
			column: 13,
			message: messages.expectedBefore(),
		},
		{
			description: `a nested rule with a space in front of its brace`,
			code: `@media print\n{ a { color: pink; } }`,
			fixed: `@media print\n{ a\n { color: pink; } }`,
			line: 2,
			column: 4,
			message: messages.expectedBefore(),
		},
		{
			description: `an at-rule whose brace abuts its params`,
			code: `@media print{ a\n{ color: pink; } }`,
			fixed: `@media print\n{ a\n{ color: pink; } }`,
			line: 1,
			column: 12,
			message: messages.expectedBefore(),
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `@media print{ a\r\n{ color: pink; } }`,
			fixed: `@media print\r\n{ a\r\n{ color: pink; } }`,
			line: 1,
			column: 12,
			message: messages.expectedBefore(),
		},
		{
			description: `a nested rule whose brace abuts its selector`,
			code: `@media print\n{ a{ color: pink; } }`,
			fixed: `@media print\n{ a\n{ color: pink; } }`,
			line: 2,
			column: 3,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment standing between the break and the brace`,
			code: `a\n/* foo */{ color: pink; }`,
			fixed: `a\n/* foo */\n{ color: pink; }`,
			line: 2,
			column: 9,
			message: messages.expectedBefore(),
		},
		{
			description: `the same comment behind a carriage return`,
			code: `a\r\n/* foo */{ color: pink; }`,
			fixed: `a\r\n/* foo */\r\n{ color: pink; }`,
			line: 2,
			column: 9,
			message: messages.expectedBefore(),
		},
		{
			description: `comments in front of both braces, each on the brace's own line`,
			code: `@media print /* foo */ { a /* foo */ { color: pink; } }`,
			fixed: `@media print /* foo */\n { a /* foo */\n { color: pink; } }`,
			warnings: [
				{
					line: 1,
					column: 37,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 23,
					message: messages.expectedBefore(),
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
			description: `a single-line block with the break in front of its brace`,
			code: `a\n{ color: pink; }`,
		},
		{
			description: `the same block with the declaration abutting the brace`,
			code: `a\n{color: pink; }`,
		},
		{
			description: `nested single-line blocks, each broken in front of its brace`,
			code: `
				@media print
				{ a
				{ color: pink; } }
			`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print\r\n{ a\r\n{ color: pink; } }`,
		},
		{
			description: `the same pair with the declarations abutting the braces`,
			code: `
				@media print
				{a
				{color: pink; } }
			`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `a{ color: pink;\nbackground:orange; }`,
		},
		{
			description: `a nested multi-line block, likewise passed over`,
			code: `@media print { a{ color: pink;\nbackground:orange; } }`,
		},
		{
			description: `the same block with the at-rule's brace abutting its params`,
			code: `@media print{ a { color: pink;\nbackground:orange; } }`,
		},
		{
			description: `a break behind the at-rule's brace, with the nested block broken in front of its own`,
			code: `
				@media print{
				a
				{ color: pink; } }
			`,
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `@media print{\r\na\r\n{ color: pink; } }`,
		},
	],

	reject: [
		{
			description: `a space in front of the brace of a single-line block`,
			code: `a { color: pink; }`,
			fixed: `a\n { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a brace abutting the selector of a single-line block`,
			code: `a{ color: pink; }`,
			fixed: `a\n{ color: pink; }`,
			line: 1,
			column: 1,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `two spaces in front of the brace`,
			code: `a  { color: pink; }`,
			fixed: `a\n  { color: pink; }`,
			line: 1,
			column: 3,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a tab in front of the brace`,
			code: `a\t{ color: pink; }`,
			fixed: `a\n\t{ color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a nested single-line block with a space in front of its brace`,
			code: `@media print\n{ a { color: pink; } }`,
			fixed: `@media print\n{ a\n { color: pink; } }`,
			line: 2,
			column: 4,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a nested single-line block whose brace abuts its selector`,
			code: `@media print\n{ a{ color: pink; } }`,
			fixed: `@media print\n{ a\n{ color: pink; } }`,
			line: 2,
			column: 3,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `@media print\r\n{ a{ color: pink; } }`,
			fixed: `@media print\r\n{ a\r\n{ color: pink; } }`,
			line: 2,
			column: 3,
			message: messages.expectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `a single-line block whose brace abuts the selector`,
			code: `a{ color: pink; }`,
		},
		{
			description: `the same block with the declaration abutting the brace too`,
			code: `a{color: pink; }`,
		},
		{
			description: `nested single-line blocks, each abutting its selector`,
			code: `@media print{ a{ color: pink; } }`,
		},
		{
			description: `the same pair with the declarations abutting the braces`,
			code: `@media print{a{color: pink; } }`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `
				a
				{ color: pink;
				background:orange; }
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a\r\n{ color: pink;\r\nbackground:orange; }`,
		},
		{
			description: `a nested multi-line block, likewise passed over`,
			code: `
				@media print { a
				{ color: pink;
				background:orange; } }
			`,
		},
		{
			description: `the same block with the at-rule's brace abutting its params`,
			code: `
				@media print{ a
				{ color: pink;
				background:orange; } }
			`,
		},
		{
			description: `a break behind the at-rule's brace, with the nested block abutting its own`,
			code: `@media print{\na{ color: pink; } }`,
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `@media print{\r\na{ color: pink; } }`,
		},
	],

	reject: [
		{
			description: `a break in front of the brace of a single-line block`,
			code: `a\n{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			line: 1,
			column: 2,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a\r\n{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			line: 1,
			column: 2,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a space in front of the brace of a single-line block`,
			code: `a { color: pink; }`,
			fixed: `a{ color: pink; }`,
			line: 1,
			column: 2,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `two spaces in front of the brace`,
			code: `a  { color: pink; }`,
			fixed: `a{ color: pink; }`,
			line: 1,
			column: 3,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a tab in front of the brace`,
			code: `a\t{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			line: 1,
			column: 2,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `nested single-line blocks, each broken in front of its brace`,
			code: `
				@media print
				{ a
				{ color: pink; } }
			`,
			fixed: `@media print{ a{ color: pink; } }`,
			line: 2,
			column: 4,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print\r\n{ a\r\n{ color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			line: 2,
			column: 4,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a nested single-line block broken in front of its brace`,
			code: `@media print { a\n{ color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			line: 1,
			column: 17,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `comments abutting both selectors, with the break in front of the inner brace`,
			code: `@media print/*comment*/ { a/*comment*/\n{ color: pink; } }`,
			fixed: `@media print/*comment*/{ a/*comment*/{ color: pink; } }`,
			line: 1,
			column: 39,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same comments standing behind spaces`,
			code: `@media print /*comment*/ { a /*comment*/\n{ color: pink; } }`,
			fixed: `@media print /*comment*/{ a /*comment*/{ color: pink; } }`,
			line: 1,
			column: 41,
			message: messages.rejectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a multi-line block with the break in front of its brace`,
			code: `
				a
				{ color: pink;
				background: orange; }
			`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a\r\n{ color: pink;\nbackground: orange; }`,
		},
		{
			description: `nested multi-line blocks, each broken in front of its brace`,
			code: `
				@media print
				{
				a
				{ color: pink;
				background: orange } }
			`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }`,
		},
		{
			description: `nested single-line blocks, likewise passed over`,
			code: `@media print { a { color: pink; } }`,
		},
		{
			description: `a single-line block whose brace abuts its selector`,
			code: `a{ color: pink; }`,
		},
		{
			description: `two spaces in front of the brace of a single-line block`,
			code: `a  { color: pink; }`,
		},
		{
			description: `a tab in front of the brace of a single-line block`,
			code: `a\t{ color: pink; }`,
		},
		{
			description: `a comment behind the selector, with the break and indentation in front of the brace`,
			code: `
				a /* foo */
				  {
				    color: pink;
				  }
			`,
		},
	],

	reject: [
		{
			description: `a multi-line block whose brace abuts its selector`,
			code: `a{ color: pink;\nbackground: orange; }`,
			fixed: `a\n{ color: pink;\nbackground: orange; }`,
			line: 1,
			column: 1,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `two spaces in front of the brace of a multi-line block`,
			code: `a  { color: pink;\nbackground: orange; }`,
			fixed: `a\n  { color: pink;\nbackground: orange; }`,
			line: 1,
			column: 3,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `a tab in front of the brace of a multi-line block`,
			code: `a\t{ color: pink;\nbackground: orange; }`,
			fixed: `a\n\t{ color: pink;\nbackground: orange; }`,
			line: 1,
			column: 2,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `a space in front of the brace of a multi-line block`,
			code: `a { color: pink;\nbackground: orange; }`,
			fixed: `a\n { color: pink;\nbackground: orange; }`,
			line: 1,
			column: 2,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;\r\nbackground: orange; }`,
			fixed: `a\r\n { color: pink;\r\nbackground: orange; }`,
			line: 1,
			column: 2,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `a nested multi-line block with a space in front of its brace`,
			code: `
				@media print
				{
				a { color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print
				{
				a
				 { color: pink;
				background: orange; } }
			`,
			line: 3,
			column: 2,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `an at-rule with a space in front of its brace, the nested block multi-line`,
			code: `
				@media print { a
				{ color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print
				 { a
				{ color: pink;
				background: orange; } }
			`,
			line: 1,
			column: 13,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print { a\r\n{ color: pink;\r\nbackground: orange; } }`,
			fixed: `@media print\r\n { a\r\n{ color: pink;\r\nbackground: orange; } }`,
			line: 1,
			column: 13,
			message: messages.expectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a multi-line block whose brace abuts its selector`,
			code: `a{ color: pink;\nbackground: orange; }`,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a{ color: pink;\r\nbackground: orange; }`,
		},
		{
			description: `nested blocks, the inner one multi-line and abutting its selector`,
			code: `
				@media print{
				a{ color: pink;
				background: orange } }
			`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }`,
		},
		{
			description: `nested single-line blocks, likewise passed over`,
			code: `@media print { a { color: pink; } }`,
		},
		{
			description: `a single-line block whose brace abuts its selector`,
			code: `a{ color: pink; }`,
		},
		{
			description: `two spaces in front of the brace of a single-line block`,
			code: `a  { color: pink; }`,
		},
		{
			description: `a tab in front of the brace of a single-line block`,
			code: `a\t{ color: pink; }`,
		},
	],

	reject: [
		{
			description: `a space in front of the brace of a multi-line block`,
			code: `a { color: pink;\nbackground: orange; }`,
			fixed: `a{ color: pink;\nbackground: orange; }`,
			line: 1,
			column: 2,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;\r\nbackground: orange; }`,
			fixed: `a{ color: pink;\r\nbackground: orange; }`,
			line: 1,
			column: 2,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `two spaces in front of the brace of a multi-line block`,
			code: `a  { color: pink;\nbackground: orange; }`,
			fixed: `a{ color: pink;\nbackground: orange; }`,
			line: 1,
			column: 3,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a tab in front of the brace of a multi-line block`,
			code: `a\t{ color: pink;\nbackground: orange; }`,
			fixed: `a{ color: pink;\nbackground: orange; }`,
			line: 1,
			column: 2,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a break in front of the brace of a multi-line block`,
			code: `
				a
				{ color: pink;
				background: orange; }
			`,
			fixed: `
				a{ color: pink;
				background: orange; }
			`,
			line: 1,
			column: 2,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `nested blocks broken in front of both braces, the inner one multi-line`,
			code: `
				@media print
				{
				a{ color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print{
				a{ color: pink;
				background: orange; } }
			`,
			line: 1,
			column: 13,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a nested multi-line block broken in front of its brace`,
			code: `
				@media print{ a
				{ color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print{ a{ color: pink;
				background: orange; } }
			`,
			line: 1,
			column: 16,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print{ a\r\n{ color: pink;\r\nbackground: orange; } }`,
			fixed: `@media print{ a{ color: pink;\r\nbackground: orange; } }`,
			line: 1,
			column: 16,
			message: messages.rejectedBeforeMultiLine(),
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
			line: 1,
			column: 22,
			message: messages.rejectedBeforeMultiLine(),
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
			line: 1,
			column: 29,
			message: messages.rejectedBeforeMultiLine(),
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
