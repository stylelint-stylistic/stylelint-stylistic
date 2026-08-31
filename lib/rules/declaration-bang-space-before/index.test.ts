import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a declaration with no bang at all`,
			code: `a { color: pink; }`,
		},
		{
			description: `a space in front of the bang and none behind it`,
			code: `a { color: pink !important; }`,
		},
		{
			description: `spaces on both sides of the bang`,
			code: `a { color: pink ! important; }`,
		},
		{
			description: `a space in front of the bang and a break behind it`,
			code: `a { color: pink !\noptional; }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink !\r\nimportant; }`,
		},
		{
			description: `bangs standing in a string, which spell no flag`,
			code: `a::before { content: "!!!" !default; }`,
		},
		{
			description: `a flag spelled inside a comment, which is no flag`,
			code: `a { color: pink/*!important */;}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			description: `the flag standing behind a bare address, whose double slash opens no comment`,
			code: `a { b: url(http://x) !important; }`,
		},
	],

	reject: [
		{
			description: `two spaces in front of the bang`,
			code: `a { color: pink  !important; }`,
			fixed: `a { color: pink !important; }`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			description: `the bang abutting the value`,
			code: `a { color: pink!default; }`,
			fixed: `a { color: pink !default; }`,
			line: 1,
			column: 16,
			message: messages.expectedBefore(),
		},
		{
			description: `a break in front of the bang`,
			code: `a { color: pink\n!important; }`,
			fixed: `a { color: pink !important; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink\r\n!something; }`,
			fixed: `a { color: pink !something; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment abutting the bang, standing where the space belongs`,
			code: `a { color: pink/*comment*/!important; }`,
			fixed: `a { color: pink/*comment*/ !important; }`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			description: `the same comment in front of another flag word`,
			code: `a { color: pink/*comment*/!something; }`,
			fixed: `a { color: pink/*comment*/ !something; }`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			description: `the same comment on a line of its own`,
			code: `a { color: pink\n/*comment*/!important; }`,
			fixed: `a { color: pink\n/*comment*/ !important; }`,
			line: 2,
			column: 12,
			message: messages.expectedBefore(),
		},
		{
			description: `the same again, in front of another flag word`,
			code: `a { color: pink\n/*comment*/!something; }`,
			fixed: `a { color: pink\n/*comment*/ !something; }`,
			line: 2,
			column: 12,
			message: messages.expectedBefore(),
		},
		{
			description: `unquoted URL before, its double slash opening no comment`,
			code: `a { background: url(http://foo.bar/a.png)\n!important; }`,
			fixed: `a { background: url(http://foo.bar/a.png) !important; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `string holding a double slash before`,
			code: `a::before { content: "//"\n!important; }`,
			fixed: `a::before { content: "//" !important; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			description: `the flag standing behind a bare address, whose double slash opens no comment`,
			code: `a { b: url(http://x)!important; }`,
			fixed: `a { b: url(http://x) !important; }`,
			line: 1,
			column: 21,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash`,
			code: `a { b: myurl(//a)!important; }`,
			fixed: `a { b: myurl(//a) !important; }`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/289
			description: `a value of nothing but a comment: the run in front of the bang is the tail of the value, and the bang opens the raw of the flag`,
			code: `a { b: /*c*/\t!important; }`,
			fixed: `a { b: /*c*/ !important; }`,
			line: 1,
			column: 14,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/289
			description: `a value of nothing but the run itself, which the flag's raw does not hold either`,
			code: `a { b:  !important; }`,
			fixed: `a { b: !important; }`,
			line: 1,
			column: 9,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/289
			description: `a flag the parser does not part from the value: the run in front of it is the tail of what stands between the property and the value`,
			code: `a { b: /*c*/\t!default; }`,
			fixed: `a { b: /*c*/ !default; }`,
			line: 1,
			column: 14,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/239
			description: `two bangs, the second of them standing behind a comment: both are given their space in one run, and the comment keeps its closing slash`,
			code: `a { b: 1px!important 2px /*c*/!important; }`,
			fixed: `a { b: 1px !important 2px /*c*/ !important; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 31,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/239
			description: `two bangs parted by a double slash, which plain CSS spells no comment with: the pair is left standing`,
			code: `a { b: 1px!important//!important; }`,
			fixed: `a { b: 1px !important// !important; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 23,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/239
			description: `two bangs with nothing between them but a value, which keeps its every character`,
			code: `a { b: 1px!important 2px!important; }`,
			fixed: `a { b: 1px !important 2px !important; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 25,
					message: messages.expectedBefore(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a declaration with no bang at all`,
			code: `a { color: pink; }`,
		},
		{
			description: `the bang abutting the value, with the flag abutting the bang`,
			code: `a { color: pink!important; }`,
		},
		{
			description: `the bang abutting the value and a space behind it`,
			code: `a { color: pink! important; }`,
		},
		{
			description: `a break behind the bang, with nothing in front of it`,
			code: `a { color: pink!\nimportant; }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink!\r\nimportant; }`,
		},
	],

	reject: [
		{
			description: `a space in front of the bang`,
			code: `a { color: pink !important; }`,
			fixed: `a { color: pink!important; }`,
			line: 1,
			column: 17,
			message: messages.rejectedBefore(),
		},
		{
			description: `a break in front of the bang`,
			code: `a { color: pink\n!important; }`,
			fixed: `a { color: pink!important; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink\r\n!important; }`,
			fixed: `a { color: pink!important; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a comment in front of a space, with the bang behind the space`,
			code: `a { color: pink/*comment*/ !important; }`,
			fixed: `a { color: pink/*comment*/!important; }`,
			line: 1,
			column: 28,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same comment in front of another flag word`,
			code: `a { color: pink/*comment*/ !something; }`,
			fixed: `a { color: pink/*comment*/!something; }`,
			line: 1,
			column: 28,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same comment on a line of its own, broken on both sides`,
			code: `
				a { color: pink
				/*comment*/
				!important; }
			`,
			fixed: `
				a { color: pink
				/*comment*/!important; }
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same again, in front of another flag word`,
			code: `
				a { color: pink
				/*comment*/
				!something; }
			`,
			fixed: `
				a { color: pink
				/*comment*/!something; }
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `unquoted URL before, its double slash opening no comment`,
			code: `a { background: url(http://foo.bar/a.png)\n!important; }`,
			fixed: `a { background: url(http://foo.bar/a.png)!important; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `string holding a double slash before`,
			code: `a::before { content: "//"\n!important; }`,
			fixed: `a::before { content: "//"!important; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/289
			description: `a value of nothing but a comment: the run in front of the bang is the tail of the value, and the bang opens the raw of the flag`,
			code: `a { b: /*c*/\t!important; }`,
			fixed: `a { b: /*c*/!important; }`,
			line: 1,
			column: 14,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/289
			description: `a value of nothing but the run itself, which the flag's raw does not hold either`,
			code: `a { b:  !important; }`,
			fixed: `a { b:!important; }`,
			line: 1,
			column: 9,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/289
			description: `a flag the parser does not part from the value: the run in front of it is the tail of what stands between the property and the value`,
			code: `a { b: /*c*/\t!default; }`,
			fixed: `a { b: /*c*/!default; }`,
			line: 1,
			column: 14,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/239
			description: `two bangs, whose whitespace this option takes away rather than writes, which moves the second of them the other way`,
			code: `a { b: 1px !important 2px !important; }`,
			fixed: `a { b: 1px!important 2px!important; }`,
			warnings: [
				{
					line: 1,
					column: 12,
					message: messages.rejectedBefore(),
				},
				{
					line: 1,
					column: 27,
					message: messages.rejectedBefore(),
				},
			],
		},
	],
})

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
