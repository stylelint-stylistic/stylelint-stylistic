import { createRule } from "../../../../rules/color-hex-case/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// Sass and `lightningcss` both read the escaped name as `url`, so what stands inside the parentheses is an address no rule may write to. See #344
			description: `an upper-case hex colour inside an address whose name an escape spells`,
			code: `a { b: u\\rl(#AABBCC); }`,
		},
		{
			// See #344
			description: `the same colour inside an address whose name a hexadecimal escape spells, which the value parser hands the rule as a word and a call of two letters`,
			code: `a { b: \\75 rl(#AABBCC); }`,
		},
		{
			// See #271
			description: `an upper-case hex colour standing in the text of an inline comment the value holds`,
			code: `
				a { b: #aabbcc // #DDEEFF
					#00112a; }
			`,
		},
		{
			// See #271
			description: `an address opened in the text of an inline comment and reaching past the break that closes it, which the rule passes over as it passes over every address`,
			code: `
				a { b: 1px // url(
					#aabbcc); }
			`,
		},
	],

	reject: [
		{
			// See #271
			description: `an upper-case hex colour on either side of an inline comment whose text holds one as well`,
			code: `
				a { b: #AABBCC // #DDEEFF
					#00112A; }
			`,
			fixed: `
				a { b: #aabbcc // #DDEEFF
					#00112a; }
			`,
			warnings: [
				{
					line: 1,
					column: 8,
					message: messages.expected(`#AABBCC`, `#aabbcc`),
				},
				{
					line: 2,
					column: 2,
					message: messages.expected(`#00112A`, `#00112a`),
				},
			],
		},
		{
			// See #271
			description: `an upper-case hex colour a line below such a comment, gathered by a call the parser opened inside its text: the call is left alone and what it gathered is read where it stands`,
			code: `
				a { b: f(#AABBCC // c) calc(
					#DDEEFF); }
			`,
			fixed: `
				a { b: f(#aabbcc // c) calc(
					#ddeeff); }
			`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.expected(`#AABBCC`, `#aabbcc`),
				},
				{
					line: 2,
					column: 2,
					message: messages.expected(`#DDEEFF`, `#ddeeff`),
				},
			],
		},
	],
})
