import { testRule } from "stylelint-test-rule-node"

import plugins from "../../index.js"

import { messages, ruleName } from "./index.js"

testRule({
	plugins,
	ruleName,
	config: [true],
	fix: true,

	accept: [
		{
			code: `/* This  is  comment */\na { gap: 0 /* And   another   comment */ }`,
		},
		{
			code: `a::before { content: "   " }`,
			description: `breaking the rule within a string`,
		},
		{
			code: `a { grid-template-areas: "a  b" "c  d" }`,
			description: `breaking the rule within a named grid area string`,
		},
		{
			code: `a { gap: 1em 2em }`,
			description: `value delimiter`,
		},
		{
			code: `a { aspect-ratio: 1 / 2 }`,
			description: `value delimiter around slash`,
		},
		{
			code: `a { aspect-ratio: 1/2 }`,
			description: `value slash delimiter without spaces`,
		},
		{
			code: `a { color: rgb(0 0 0) }`,
			description: `function arguments with spaces as delimiters`,
		},
		{
			code: `a { color: rgb(0 0 0/0) }`,
			description: `function parameter with slash delimiter without spaces`,
		},
		{
			code: `a { color: rgb(0 0 0 / 0) }`,
			description: `function parameter with slash delimiter with spaces around slash`,
		},
		{
			code: `a { transform: translate(50%,50%) }`,
			description: `function arguments with comma as delimiters without spaces`,
		},
		{
			code: `a { transform: translate(50%, 50%) }`,
			description: `function arguments with comma as delimiters with space after comma`,
		},
		{
			code: `a {\n  color: pink }`,
			description: `after opening brace with space after newline`,
		},
		{
			code: `a { color: red;\n  top: 0 }`,
			description: `between declarations with two spaces after newline`,
		},
		{
			code: `a {\n  background-position:\n    top left,\n    top right;\n}`,
			description: `multiline value with indentation`,
		},
	],

	reject: [
		{
			code: `a { gap: 1em  2em }`,
			fixed: `a { gap: 1em 2em }`,
			description: `value delimiter`,
			message: messages.rejected,
			line: 1,
			column: 13,
		},
		{
			code: `a { grid-template-areas: "a  b"  "c  d" }`,
			fixed: `a { grid-template-areas: "a  b" "c  d" }`,
			description: `string value delimiter`,
			message: messages.rejected,
			line: 1,
			column: 32,
		},
		{
			code: `a { aspect-ratio: 1  / 2 }`,
			fixed: `a { aspect-ratio: 1 / 2 }`,
			description: `value delimiter before slash`,
			message: messages.rejected,
			line: 1,
			column: 20,
		},
		{
			code: `a { aspect-ratio: 1 /  2 }`,
			fixed: `a { aspect-ratio: 1 / 2 }`,
			description: `value delimiter after slash`,
			message: messages.rejected,
			line: 1,
			column: 22,
		},
		{
			code: `a { color: rgb(0  0 0) }`,
			fixed: `a { color: rgb(0 0 0) }`,
			description: `function parameter delimiters`,
			message: messages.rejected,
			line: 1,
			column: 17,
		},
		{
			code: `a { color: rgb(0 0  0) }`,
			fixed: `a { color: rgb(0 0 0) }`,
			description: `function parameter delimiters`,
			message: messages.rejected,
			line: 1,
			column: 19,
		},
		{
			code: `a { color: rgb(0 0 0  / 0) }`,
			fixed: `a { color: rgb(0 0 0 / 0) }`,
			description: `function parameter delimiter before slash`,
			message: messages.rejected,
			line: 1,
			column: 21,
		},
		{
			code: `a { color: rgb(0 0 0 /  0) }`,
			fixed: `a { color: rgb(0 0 0 / 0) }`,
			description: `function parameter delimiter after slash`,
			message: messages.rejected,
			line: 1,
			column: 23,
		},
		{
			code: `a { transform: translate(50%,  50%) }`,
			fixed: `a { transform: translate(50%, 50%) }`,
			description: `function arguments with comma as delimiters with spaces`,
			message: messages.rejected,
			line: 1,
			column: 30,
		},
		{
			code: `a {\n  background-position:\n    top  left,\n    top right;\n}`,
			fixed: `a {\n  background-position:\n    top left,\n    top right;\n}`,
			description: `between multiline value with indentation`,
			message: messages.rejected,
			line: 3,
			column: 8,
		},
		{
			code: `a {\n  background-position:\n    top left,\n    top  right;\n}`,
			fixed: `a {\n  background-position:\n    top left,\n    top right;\n}`,
			description: `between multiline value with indentation`,
			message: messages.rejected,
			line: 4,
			column: 8,
		},
		{
			code: `a {\n  background-position:\n    top  left,\n    top  right;\n}`,
			fixed: `a {\n  background-position:\n    top left,\n    top right;\n}`,
			description: `between multiline value with indentation`,
			message: messages.rejected,
			warnings: [
				{
					message: messages.rejected,
					line: 3,
					column: 8,
				},
				{
					message: messages.rejected,
					line: 4,
					column: 8,
				},
			],
		},
	],
})
