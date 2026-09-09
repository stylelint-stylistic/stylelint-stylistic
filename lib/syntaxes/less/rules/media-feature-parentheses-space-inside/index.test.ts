import { createRule } from "../../../../rules/media-feature-parentheses-space-inside/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// See #138
			description: `a parenthesis inside the text of an inline comment opens no media feature`,
			code: `
				@media ( min-width: 100px ) and // (z
				( max-width: 200px ) { a { color: red; } }
			`,
		},
		{
			// See #347
			description: `a parenthesis written in the text of an inline comment, which closes the feature to the value parser, so neither space this option asks for is written into that text`,
			code: `@media (a: 1px // c) and (b: 2px\n2px) { a { b: c; } }`,
		},
		{
			// See #347
			description: `the same shape with a form feed for the break, which is whitespace to the parser and no line break, so the comment runs on to the end of the parameters`,
			code: `@media (a: 1px // c\u000C2px) { a { b: c; } }`,
		},
	],

	reject: [
		{
			// See #347
			description: `such a feature standing beside one the file does spell, whose parentheses are spaced out while the text of the comment is left as it stands`,
			code: `@media (a: 1) and (b: 2 // c) and (d: 3\n4) { a { b: c; } }`,
			fixed: `@media ( a: 1 ) and (b: 2 // c) and (d: 3\n4) { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 12,
					message: messages.expectedClosing,
				},
			],
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// See #138
			description: `a parenthesis inside the text of an inline comment opens no media feature`,
			code: `
				@media (min-width: 100px) and // ( z
				(max-width: 200px) { a { color: red; } }
			`,
		},
		{
			// Sass answers alike for both spellings of the name here, as in a declaration's value: `@media (min-width: aurl(a/b))` and `@media (min-width: éurl(a/b))` both compile, while `aurl(a//b)` and `éurl(a//b)` in their place both fail at the length of the file, the `//` comment having carried off the parenthesis. See #343
			description: `a call inside the parameters whose name opens on a code point outside ASCII, which leaves the parentheses behind it inside the text of a comment`,
			code: `@media (min-width: \u00E9url(http://a/b.png) b( 1px )) { a { c: 2px; } }`,
		},
		{
			// See #347
			description: `a parenthesis written in the text of an inline comment, with the whitespace this option refuses standing inside that text, which is left where the file spells it`,
			code: `@media ( a: 1px // c ) and (b: 2px\n2px) { a { b: c; } }`,
		},
	],

	reject: [
		{
			// See #138
			description: `the fix reaches the features of the query and leaves the text of the comment as it stands`,
			code: `
				@media ( min-width: 100px ) and // ( z
				(max-width: 200px) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 100px) and // ( z
				(max-width: 200px) { a { color: red; } }
			`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 26,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// See #347 and #575
			description: `a comment that leaves the feature unclosed at the end of the file, whose end the parser puts inside that comment: such a node ends on no parenthesis, and it is read as it always was`,
			code: `@media ( a: 1 // c`,
			fixed: `@media (a: 1 // c`,
			line: 1,
			column: 9,
			message: messages.rejectedOpening,
		},
		{
			// See #347
			description: `a feature the value parser closed on a parenthesis of a comment's text, whose whitespace the option refuses standing in that text too, beside a feature the file does spell: only the second is reported, and the comment is left as it stands`,
			code: `@media ( a: 1 ) and (b: 2 // c ) and (d: 3\n4) { a { b: c; } }`,
			fixed: `@media (a: 1) and (b: 2 // c ) and (d: 3\n4) { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 14,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// See #152
			description: `inline comment before the closing parenthesis: the parenthesis cannot join the comment's line, so the parameters are left alone and the warning stands`,
			code: `
				@media (min-width: 100px // c
					) { a { color: red; } }
			`,
			fixed: `
				@media (min-width: 100px // c
					) { a { color: red; } }
			`,
			line: 2,
			column: 1,
			message: messages.rejectedClosing,
		},
	],
})
