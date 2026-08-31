import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a blockless at-rule, which has no opening brace to space in front of`,
			code: `@import url(x.css)`,
		},
		{
			description: `a space in front of the opening brace`,
			code: `a { color: pink; }`,
		},
		{
			description: `nested blocks, each with the space`,
			code: `@media print { a { color: pink; } }`,
		},
		{
			description: `a block opening straight inside another, whose braces abut one another`,
			code: `a {{ &:hover { color: pink; }}}`,
		},
		{
			description: `a parent selector on the line behind an opening brace`,
			code: `a {\n&:hover { color: pink; }}`,
		},
	],

	reject: [
		{
			description: `a brace abutting the selector`,
			code: `a{ color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces where one belongs`,
			code: `a  { color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 3,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab where the space belongs`,
			code: `a\t{ color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expectedBefore(),
		},
		{
			description: `a break where the space belongs`,
			code: `a\n{ color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a\r\n{ color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expectedBefore(),
		},
		{
			description: `a break in front of the at-rule's brace`,
			code: `@media print\n{ a { color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			line: 1,
			column: 13,
			message: messages.expectedBefore(),
		},
		{
			description: `a break in front of the nested block's brace`,
			code: `@media print { a\n{ color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
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
			line: 1,
			column: 22,
			message: messages.expectedBefore(),
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
			line: 1,
			column: 35,
			message: messages.expectedBefore(),
		},
		{
			description: `CRLF with a comment before the opening brace`,
			code: `.some-class /* v3+ */\r\n{ color: pink; }`,
			fixed: `.some-class /* v3+ */ { color: pink; }`,
			line: 1,
			column: 22,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreAtRules: [`for`, `/for/i`, /for/iu] }],

	accept: [
		{
			description: `a rule with the space, which the ignored at-rules have nothing to do with`,
			code: `a { color: pink; }`,
		},
		{
			description: `an @for broken in front of its brace, matched by the option three ways over`,
			code: `@for ...\n{ color: pink; }`,
		},
		{
			description: `the same at-rule broken with a carriage return`,
			code: `@for ...\r\n{ color: pink; }`,
		},
	],

	reject: [
		{
			description: `a rule abutting its brace, with no ignored at-rule anywhere near it`,
			code: `a{ color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 1,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreSelectors: [`a`, `/a/`, /a/u] }],

	accept: [
		{
			description: `a selector named in the option, with the space in front of its brace`,
			code: `a { color: pink; }`,
		},
		{
			description: `the same selector abutting its brace`,
			code: `a{ color: pink; }`,
		},
		{
			description: `the same selector broken in front of its brace`,
			code: `a\n{ color: pink; }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a\r\n{ color: pink; }`,
		},
	],

	reject: [
		{
			description: `a selector the option does not name, abutting its brace`,
			code: `b{ color: pink; }`,
			fixed: `b { color: pink; }`,
			line: 1,
			column: 1,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a brace abutting the selector`,
			code: `a{ color: pink; }`,
		},
		{
			description: `nested blocks, each abutting its selector`,
			code: `@media print{ a{ color: pink; } }`,
		},
	],

	reject: [
		{
			description: `a space in front of the brace`,
			code: `a { color: pink; }`,
			fixed: `a{ color: pink; }`,
			line: 1,
			column: 2,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the brace`,
			code: `a  { color: pink; }`,
			fixed: `a{ color: pink; }`,
			line: 1,
			column: 3,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the brace`,
			code: `a\t{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			line: 1,
			column: 2,
			message: messages.rejectedBefore(),
		},
		{
			description: `a break in front of the brace`,
			code: `a\n{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			line: 1,
			column: 2,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a\r\n{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			line: 1,
			column: 2,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the nested block's brace`,
			code: `@media print { a{ color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			line: 1,
			column: 13,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the at-rule's brace`,
			code: `@media print{ a { color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			line: 1,
			column: 16,
			message: messages.rejectedBefore(),
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
			line: 1,
			column: 22,
			message: messages.rejectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a single-line block with the space in front of its brace`,
			code: `a { color: pink; }`,
		},
		{
			description: `nested single-line blocks, each with the space`,
			code: `@media print { a { color: pink; } }`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `a{ color:\npink; }`,
		},
		{
			description: `a nested multi-line block, likewise passed over`,
			code: `@media print { a{ color:\npink; } }`,
		},
		{
			description: `the same block with the at-rule abutting its own brace`,
			code: `@media print{ a { color:\npink; } }`,
		},
		{
			description: `a break behind the at-rule's brace, with the nested block single-line`,
			code: `@media print{\na { color: pink; } }`,
		},
	],

	reject: [
		{
			description: `a single-line block abutting its brace`,
			code: `a{ color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 1,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `two spaces in front of the brace of a single-line block`,
			code: `a  { color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 3,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a tab in front of the brace of a single-line block`,
			code: `a\t{ color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a break in front of the brace of a single-line block`,
			code: `a\n{ color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a\r\n{ color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a break in front of the at-rule's brace`,
			code: `@media print\n{ a { color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			line: 1,
			column: 13,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a break in front of the nested block's brace`,
			code: `@media print { a\n{ color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			line: 1,
			column: 17,
			message: messages.expectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `a single-line block abutting its brace`,
			code: `a{ color: pink; }`,
		},
		{
			description: `nested single-line blocks, each abutting its brace`,
			code: `@media print{ a{ color: pink; } }`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `a { color:\npink; }`,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color:\r\npink; }`,
		},
		{
			description: `a nested multi-line block, likewise passed over`,
			code: `@media print { a { color:\npink; } }`,
		},
		{
			description: `the same pair with both braces abutting their selectors`,
			code: `@media print{ a{ color:\npink; } }`,
		},
		{
			description: `a break behind the at-rule's brace, with the nested block abutting its own`,
			code: `@media print {\na{ color: pink; } }`,
		},
		{
			description: `the same pair with the at-rule abutting its brace as well`,
			code: `@media print{\na{ color: pink; } }`,
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `@media print{\r\na{ color: pink; } }`,
		},
	],

	reject: [
		{
			description: `a space in front of the brace of a single-line block`,
			code: `a { color: pink; }`,
			fixed: `a{ color: pink; }`,
			line: 1,
			column: 2,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `two spaces in front of the brace of a single-line block`,
			code: `a  { color: pink; }`,
			fixed: `a{ color: pink; }`,
			line: 1,
			column: 3,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a tab in front of the brace of a single-line block`,
			code: `a\t{ color: pink; }`,
			fixed: `a{ color: pink; }`,
			line: 1,
			column: 2,
			message: messages.rejectedBeforeSingleLine(),
		},
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
			description: `a space in front of the nested block's brace`,
			code: `@media print { a{ color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			line: 1,
			column: 13,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a space in front of the at-rule's brace`,
			code: `@media print{ a { color: pink; } }`,
			fixed: `@media print{ a{ color: pink; } }`,
			line: 1,
			column: 16,
			message: messages.rejectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a multi-line block with the space in front of its brace`,
			code: `a { color: pink;\nbackground: orange; }`,
		},
		{
			description: `a nested multi-line block with the space in front of its brace`,
			code: `
				@media print {
				a { color: pink;
				background: orange } }
			`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print {\r\na { color: pink;\r\nbackground: orange } }`,
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
			description: `a single-line block abutting its brace`,
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
			description: `a multi-line block abutting its brace`,
			code: `a{ color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			line: 1,
			column: 1,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `two spaces in front of the brace of a multi-line block`,
			code: `a  { color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			line: 1,
			column: 3,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `a tab in front of the brace of a multi-line block`,
			code: `a\t{ color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			line: 1,
			column: 2,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `a break in front of the brace of a multi-line block`,
			code: `
				a
				{ color: pink;
				background: orange; }
			`,
			fixed: `
				a { color: pink;
				background: orange; }
			`,
			line: 1,
			column: 2,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same break spelled with carriage returns`,
			code: `a\r\n{ color: pink;\r\nbackground: orange; }`,
			fixed: `a { color: pink;\r\nbackground: orange; }`,
			line: 1,
			column: 2,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `an at-rule broken in front of its brace, holding a multi-line block`,
			code: `
				@media print
				{
				a { color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print {
				a { color: pink;
				background: orange; } }
			`,
			line: 1,
			column: 13,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `a nested multi-line block broken in front of its brace`,
			code: `
				@media print { a
				{ color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print { a { color: pink;
				background: orange; } }
			`,
			line: 1,
			column: 17,
			message: messages.expectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a multi-line block abutting its brace`,
			code: `a{ color: pink;\nbackground: orange; }`,
		},
		{
			description: `a nested multi-line block abutting its brace, the at-rule broken behind its own`,
			code: `
				@media print{
				a{ color: pink;
				background: orange } }
			`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print{\r\na{ color: pink;\r\nbackground: orange } }`,
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
			description: `a single-line block abutting its brace`,
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
			description: `an at-rule broken in front of its brace, holding a multi-line block`,
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
	],
})
