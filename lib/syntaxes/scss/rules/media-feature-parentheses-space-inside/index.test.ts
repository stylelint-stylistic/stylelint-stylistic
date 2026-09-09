import { createRule } from "../../../../rules/media-feature-parentheses-space-inside/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// See #347
			description: `a parenthesis written in the text of an end-of-line comment, which closes the feature to the value parser, so neither space this option asks for is written into that text`,
			code: `@media (a: 1px // c) and (b: 2px\n2px) { a { b: c; } }`,
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
	customSyntax: `postcss-scss`,

	accept: [
		{
			// See #347
			description: `a call standing inside such a feature, whose own parentheses stand outside the comment: the call is the price of turning the feature away, and its spacing goes unreported with it`,
			code: `@media (a: b( 1 // c )\n) ) { a { b: c; } }`,
		},
		{
			// See #347
			description: `the same parenthesis with the whitespace this option refuses standing inside the comment's text, which is left where the file spells it`,
			code: `@media ( a: 1px // c ) and (b: 2px\n2px) { a { b: c; } }`,
		},
	],

	reject: [
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
	],
})
