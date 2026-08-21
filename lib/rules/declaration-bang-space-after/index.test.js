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
			code: `a { color: pink! important; }`,
			description: `a space behind the bang and none in front of it`,
		},
		{
			code: `a { color: pink ! default; }`,
			description: `spaces on both sides of the bang`,
		},
		{
			code: `a { color: pink\n! important; }`,
			description: `a break in front of the bang and a space behind it`,
		},
		{
			code: `a { color: pink\r\n! optional; }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a::before { content: "!!!" ! important; }`,
			description: `bangs standing in a string, which spell no flag`,
		},
		{
			code: `a { color: pink /* !important */;}`,
			description: `a flag spelled inside a comment, which is no flag`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			autoStripIndent: true,
			description: `the flag standing behind a bare address, whose double slash opens no comment`,
			code: `a { b: url(http://x) ! important; }`,
		},
	],

	reject: [
		{
			code: `a { color: pink!important; }`,
			fixed: `a { color: pink! important; }`,
			description: `the flag abutting the bang`,
			message: messages.expectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink!  global; }`,
			fixed: `a { color: pink! global; }`,
			description: `two spaces behind the bang`,
			message: messages.expectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink!\nimportant; }`,
			fixed: `a { color: pink! important; }`,
			description: `a break behind the bang`,
			message: messages.expectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink!\r\nexciting; }`,
			fixed: `a { color: pink! exciting; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink !/*comment*/important; }`,
			fixed: `a { color: pink ! /*comment*/important; }`,
			description: `a comment behind the bang, standing where the space belongs`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink !/*comment*/global; }`,
			fixed: `a { color: pink ! /*comment*/global; }`,
			description: `the same comment in front of another flag word`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			autoStripIndent: true,
			description: `the flag standing behind a bare address, whose double slash opens no comment`,
			code: `a { b: url(http://x) !important; }`,
			fixed: `a { b: url(http://x) ! important; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 22,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			autoStripIndent: true,
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash`,
			code: `a { b: myurl(//a) !important; }`,
			fixed: `a { b: myurl(//a) ! important; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
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
			description: `the flag abutting the bang, with nothing in front of it either`,
		},
		{
			code: `a { color: pink !important; }`,
			description: `a space in front of the bang and none behind it`,
		},
		{
			code: `a { color: pink\n!important; }`,
			description: `a break in front of the bang and nothing behind it`,
		},
		{
			code: `a { color: pink\r\n!important; }`,
			description: `the same break spelled with a carriage return`,
		},
	],

	reject: [
		{
			code: `a { color: pink! important; }`,
			fixed: `a { color: pink!important; }`,
			description: `a space behind the bang`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink!\nimportant; }`,
			fixed: `a { color: pink!important; }`,
			description: `a break behind the bang`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink!\r\nimportant; }`,
			fixed: `a { color: pink!important; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink ! /*comment*/important; }`,
			fixed: `a { color: pink !/*comment*/important; }`,
			description: `a comment behind the bang, standing where nothing should`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink ! /*comment*/global; }`,
			fixed: `a { color: pink !/*comment*/global; }`,
			description: `the same comment in front of another flag word`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 17,
		},
	],
})
