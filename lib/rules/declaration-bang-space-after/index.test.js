import { testRule } from "stylelint-test-rule-node"

import plugins from "../../index.js"
import { messages, ruleName } from "./index.js"

testRule({
	plugins,
	ruleName,
	config: [`always`],
	fix: true,

	accept: [
		{
			code: `a { color: pink; }`,
			description: `no !important`,
		},
		{
			code: `a { color: pink! important; }`,
			description: `space only after`,
		},
		{
			code: `a { color: pink ! default; }`,
			description: `space before and after`,
		},
		{
			code: `a { color: pink\n! important; }`,
			description: `newline before and space after`,
		},
		{
			code: `a { color: pink\r\n! optional; }`,
			description: `CRLF before and space after`,
		},
		{
			code: `a::before { content: "!!!" ! important; }`,
			description: `ignores string`,
		},
		{
			code: `a { color: pink /* !important */;}`,
			description: `violating comment`,
		},
	],

	reject: [
		{
			code: `a { color: pink!important; }`,
			fixed: `a { color: pink! important; }`,
			description: `no space after`,
			message: messages.expectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink!  global; }`,
			fixed: `a { color: pink! global; }`,
			description: `two spaces after`,
			message: messages.expectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink!\nimportant; }`,
			fixed: `a { color: pink! important; }`,
			description: `newline after`,
			message: messages.expectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink!\r\nexciting; }`,
			fixed: `a { color: pink! exciting; }`,
			description: `CRLF after`,
			message: messages.expectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink !/*comment*/important; }`,
			fixed: `a { color: pink ! /*comment*/important; }`,
			description: `comment after`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink !/*comment*/global; }`,
			fixed: `a { color: pink ! /*comment*/global; }`,
			description: `comment after`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
	],
})

testRule({
	plugins,
	ruleName,
	config: [`never`],
	fix: true,

	accept: [
		{
			code: `a { color: pink; }`,
			description: `no !important`,
		},
		{
			code: `a { color: pink!important; }`,
			description: `no space before or after`,
		},
		{
			code: `a { color: pink !important; }`,
			description: `space before and none after`,
		},
		{
			code: `a { color: pink\n!important; }`,
			description: `newline before and none after`,
		},
		{
			code: `a { color: pink\r\n!important; }`,
			description: `CRLF before and none after`,
		},
	],

	reject: [
		{
			code: `a { color: pink! important; }`,
			fixed: `a { color: pink!important; }`,
			description: `space after`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink!\nimportant; }`,
			fixed: `a { color: pink!important; }`,
			description: `newline after`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink!\r\nimportant; }`,
			fixed: `a { color: pink!important; }`,
			description: `CRLF after`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink ! /*comment*/important; }`,
			fixed: `a { color: pink !/*comment*/important; }`,
			description: `comment after`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink ! /*comment*/global; }`,
			fixed: `a { color: pink !/*comment*/global; }`,
			description: `comment after`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 17,
		},
	],
})
