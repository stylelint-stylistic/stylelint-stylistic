import { messages, ruleName } from "./index.js"

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
			description: `a space behind the bang and none in front of it`,
			code: `a { color: pink! important; }`,
		},
		{
			description: `spaces on both sides of the bang`,
			code: `a { color: pink ! default; }`,
		},
		{
			description: `a break in front of the bang and a space behind it`,
			code: `a { color: pink\n! important; }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink\r\n! optional; }`,
		},
		{
			description: `bangs standing in a string, which spell no flag`,
			code: `a::before { content: "!!!" ! important; }`,
		},
		{
			description: `a flag spelled inside a comment, which is no flag`,
			code: `a { color: pink /* !important */;}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			description: `the flag standing behind a bare address, whose double slash opens no comment`,
			code: `a { b: url(http://x) ! important; }`,
		},
	],

	reject: [
		{
			description: `the flag abutting the bang`,
			code: `a { color: pink!important; }`,
			fixed: `a { color: pink! important; }`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces behind the bang`,
			code: `a { color: pink!  global; }`,
			fixed: `a { color: pink! global; }`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
		{
			description: `a break behind the bang`,
			code: `a { color: pink!\nimportant; }`,
			fixed: `a { color: pink! important; }`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink!\r\nexciting; }`,
			fixed: `a { color: pink! exciting; }`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment behind the bang, standing where the space belongs`,
			code: `a { color: pink !/*comment*/important; }`,
			fixed: `a { color: pink ! /*comment*/important; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment in front of another flag word`,
			code: `a { color: pink !/*comment*/global; }`,
			fixed: `a { color: pink ! /*comment*/global; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			description: `the flag standing behind a bare address, whose double slash opens no comment`,
			code: `a { b: url(http://x) !important; }`,
			fixed: `a { b: url(http://x) ! important; }`,
			line: 1,
			column: 22,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash`,
			code: `a { b: myurl(//a) !important; }`,
			fixed: `a { b: myurl(//a) ! important; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
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
			description: `the flag abutting the bang, with nothing in front of it either`,
			code: `a { color: pink!important; }`,
		},
		{
			description: `a space in front of the bang and none behind it`,
			code: `a { color: pink !important; }`,
		},
		{
			description: `a break in front of the bang and nothing behind it`,
			code: `a { color: pink\n!important; }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink\r\n!important; }`,
		},
	],

	reject: [
		{
			description: `a space behind the bang`,
			code: `a { color: pink! important; }`,
			fixed: `a { color: pink!important; }`,
			line: 1,
			column: 16,
			message: messages.rejectedAfter(),
		},
		{
			description: `a break behind the bang`,
			code: `a { color: pink!\nimportant; }`,
			fixed: `a { color: pink!important; }`,
			line: 1,
			column: 16,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink!\r\nimportant; }`,
			fixed: `a { color: pink!important; }`,
			line: 1,
			column: 16,
			message: messages.rejectedAfter(),
		},
		{
			description: `a comment behind the bang, standing where nothing should`,
			code: `a { color: pink ! /*comment*/important; }`,
			fixed: `a { color: pink !/*comment*/important; }`,
			line: 1,
			column: 17,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same comment in front of another flag word`,
			code: `a { color: pink ! /*comment*/global; }`,
			fixed: `a { color: pink !/*comment*/global; }`,
			line: 1,
			column: 17,
			message: messages.rejectedAfter(),
		},
	],
})
