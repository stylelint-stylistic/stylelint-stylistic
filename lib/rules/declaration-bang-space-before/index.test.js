import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `a declaration with no bang at all`,
		},
		{
			code: `a { color: pink !important; }`,
			description: `a space in front of the bang and none behind it`,
		},
		{
			code: `a { color: pink ! important; }`,
			description: `spaces on both sides of the bang`,
		},
		{
			code: `a { color: pink !\noptional; }`,
			description: `a space in front of the bang and a break behind it`,
		},
		{
			code: `a { color: pink !\r\nimportant; }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a::before { content: "!!!" !default; }`,
			description: `bangs standing in a string, which spell no flag`,
		},
		{
			code: `a { color: pink/*!important */;}`,
			description: `a flag spelled inside a comment, which is no flag`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			autoStripIndent: true,
			description: `the flag standing behind a bare address, whose double slash opens no comment`,
			code: `a { b: url(http://x) !important; }`,
		},
	],

	reject: [
		{
			code: `a { color: pink  !important; }`,
			fixed: `a { color: pink !important; }`,
			description: `two spaces in front of the bang`,
			message: messages.expectedBefore(),
			line: 1,
			column: 18,
		},
		{
			code: `a { color: pink!default; }`,
			fixed: `a { color: pink !default; }`,
			description: `the bang abutting the value`,
			message: messages.expectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink\n!important; }`,
			fixed: `a { color: pink !important; }`,
			description: `a break in front of the bang`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { color: pink\r\n!something; }`,
			fixed: `a { color: pink !something; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { color: pink/*comment*/!important; }`,
			fixed: `a { color: pink/*comment*/ !important; }`,
			description: `a comment abutting the bang, standing where the space belongs`,
			message: messages.expectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `a { color: pink/*comment*/!something; }`,
			fixed: `a { color: pink/*comment*/ !something; }`,
			description: `the same comment in front of another flag word`,
			message: messages.expectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `a { color: pink\n/*comment*/!important; }`,
			fixed: `a { color: pink\n/*comment*/ !important; }`,
			description: `the same comment on a line of its own`,
			message: messages.expectedBefore(),
			line: 2,
			column: 12,
		},
		{
			code: `a { color: pink\n/*comment*/!something; }`,
			fixed: `a { color: pink\n/*comment*/ !something; }`,
			description: `the same again, in front of another flag word`,
			message: messages.expectedBefore(),
			line: 2,
			column: 12,
		},
		{
			code: `a { background: url(http://foo.bar/a.png)\n!important; }`,
			fixed: `a { background: url(http://foo.bar/a.png) !important; }`,
			description: `unquoted URL before, its double slash opening no comment`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a::before { content: "//"\n!important; }`,
			fixed: `a::before { content: "//" !important; }`,
			description: `string holding a double slash before`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			autoStripIndent: true,
			description: `the flag standing behind a bare address, whose double slash opens no comment`,
			code: `a { b: url(http://x)!important; }`,
			fixed: `a { b: url(http://x) !important; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 21,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			autoStripIndent: true,
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash`,
			code: `a { b: myurl(//a)!important; }`,
			fixed: `a { b: myurl(//a) !important; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 18,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `a declaration with no bang at all`,
		},
		{
			code: `a { color: pink!important; }`,
			description: `the bang abutting the value, with the flag abutting the bang`,
		},
		{
			code: `a { color: pink! important; }`,
			description: `the bang abutting the value and a space behind it`,
		},
		{
			code: `a { color: pink!\nimportant; }`,
			description: `a break behind the bang, with nothing in front of it`,
		},
		{
			code: `a { color: pink!\r\nimportant; }`,
			description: `the same break spelled with a carriage return`,
		},
	],

	reject: [
		{
			code: `a { color: pink !important; }`,
			fixed: `a { color: pink!important; }`,
			description: `a space in front of the bang`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink\n!important; }`,
			fixed: `a { color: pink!important; }`,
			description: `a break in front of the bang`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { color: pink\r\n!important; }`,
			fixed: `a { color: pink!important; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { color: pink/*comment*/ !important; }`,
			fixed: `a { color: pink/*comment*/!important; }`,
			description: `a comment in front of a space, with the bang behind the space`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `a { color: pink/*comment*/ !something; }`,
			fixed: `a { color: pink/*comment*/!something; }`,
			description: `the same comment in front of another flag word`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `a { color: pink\n/*comment*/\n!important; }`,
			fixed: `a { color: pink\n/*comment*/!important; }`,
			description: `the same comment on a line of its own, broken on both sides`,
			message: messages.rejectedBefore(),
			line: 3,
			column: 1,
		},
		{
			code: `a { color: pink\n/*comment*/\n!something; }`,
			fixed: `a { color: pink\n/*comment*/!something; }`,
			description: `the same again, in front of another flag word`,
			message: messages.rejectedBefore(),
			line: 3,
			column: 1,
		},
		{
			code: `a { background: url(http://foo.bar/a.png)\n!important; }`,
			fixed: `a { background: url(http://foo.bar/a.png)!important; }`,
			description: `unquoted URL before, its double slash opening no comment`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a::before { content: "//"\n!important; }`,
			fixed: `a::before { content: "//"!important; }`,
			description: `string holding a double slash before`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,
	autoStripIndent: true,

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
			message: messages.expectedBefore(),
			line: 3,
			column: 3,
		},
		{
			code: `a { color: red // keep me\r\n!important; }`,
			fixed: `a { color: red // keep me\r\n!important; }`,
			description: `CRLF, inline comment: the line ending survives untouched`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
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
			message: messages.expectedBefore(),
			line: 3,
			column: 3,
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
			message: messages.expectedBefore(),
			line: 3,
			column: 3,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,
	autoStripIndent: true,

	reject: [
		{
			code: `a { color: red // keep me\rblue !important; }`,
			fixed: `a { color: red // keep me\rblue!important; }`,
			description: `a carriage return ends the comment, so the bang does not join its line and the fix goes through`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 32,
		},
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
			message: messages.rejectedBefore(),
			line: 3,
			column: 3,
		},
		{
			code: `a { color: red // keep me\r\n!important; }`,
			fixed: `a { color: red // keep me\r\n!important; }`,
			description: `CRLF, inline comment: the line ending survives untouched`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
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
			message: messages.rejectedBefore(),
			line: 3,
			column: 3,
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
			message: messages.rejectedBefore(),
			line: 3,
			column: 3,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,
	autoStripIndent: true,

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
			message: messages.expectedBefore(),
			line: 3,
			column: 3,
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
			message: messages.expectedBefore(),
			line: 3,
			column: 3,
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
			message: messages.expectedBefore(),
			line: 3,
			column: 6,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,
	autoStripIndent: true,

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
			message: messages.rejectedBefore(),
			line: 3,
			column: 3,
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
			message: messages.rejectedBefore(),
			line: 3,
			column: 3,
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
			message: messages.rejectedBefore(),
			line: 3,
			column: 7,
		},
	],
})
