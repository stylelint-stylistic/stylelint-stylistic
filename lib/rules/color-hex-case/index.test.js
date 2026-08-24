import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],

	accept: [
		{
			description: `an interpolation in a property name, whose hash opens no colour`,
			code: `a { border-#$side: 0; }`,
		},
		{
			description: `an interpolation in a value, whose hash opens no colour`,
			code: `a { box-sizing: #$type-box; }`,
		},
		{
			description: `a fragment reference in a url(), whose hash opens no colour either`,
			code: `a { stroke: url(#gradientA) }`,
		},
		{
			description: `a keyword, which carries no hash at all`,
			code: `a { color: pink; }`,
		},
		{
			description: `a colour already in lower case`,
			code: `a { color: #000; }`,
		},
		{
			description: `three colours in one value, all in lower case`,
			code: `a { something: #000, #fff, #ababab; }`,
		},
		{
			description: `a colour of eight digits, alpha and all`,
			code: `a { color: #0000ffcc; }`,
		},
		{
			description: `a colour of four digits`,
			code: `a { color: #00fc; }`,
		},
		{
			description: `a number that only looks like a colour, with no hash in front of it`,
			code: `a { padding: 000; }`,
		},
		{
			description: `a hash standing in a string, which spells no colour`,
			code: `a::before { content: "#ABABA"; }`,
		},
		{
			description: `a hash standing in a comment, which spells no colour`,
			code: `a { color: white /* #FFF */; }`,
		},
	],

	reject: [
		{
			description: `a capital letter in a colour of five digits, which is no valid length but is lowered all the same`,
			code: `a { color: #Ababa; }`,
			fixed: `a { color: #ababa; }`,
			line: 1,
			column: 12,
			message: messages.expected(`#Ababa`, `#ababa`),
		},
		{
			description: `the first of three colours in upper case`,
			code: `a { something: #000F, #fff, #ababab; }`,
			fixed: `a { something: #000f, #fff, #ababab; }`,
			line: 1,
			column: 16,
			message: messages.expected(`#000F`, `#000f`),
		},
		{
			description: `a colour holding a letter no colour can hold, lowered as the rest are`,
			code: `a { something: #000, #FFFFAZ, #ababab; }`,
			fixed: `a { something: #000, #ffffaz, #ababab; }`,
			line: 1,
			column: 22,
			message: messages.expected(`#FFFFAZ`, `#ffffaz`),
		},
		{
			description: `a colour of seven digits, which is no valid length but is lowered all the same`,
			code: `a { something: #000, #fff, #12345AA; }`,
			fixed: `a { something: #000, #fff, #12345aa; }`,
			line: 1,
			column: 28,
			message: messages.expected(`#12345AA`, `#12345aa`),
		},
	],
})

testRule({
	ruleName,
	config: [`upper`],

	accept: [
		{
			description: `an interpolation in a property name, whose hash opens no colour`,
			code: `a { border-#$side: 0; }`,
		},
		{
			description: `an interpolation in a value, whose hash opens no colour`,
			code: `a { box-sizing: #$type-box; }`,
		},
		{
			description: `a fragment reference in a url(), whose hash opens no colour either`,
			code: `a { stroke: url(#gradientA) }`,
		},
		{
			description: `a keyword, which carries no hash at all`,
			code: `a { color: pink; }`,
		},
		{
			description: `a colour of digits alone, which has no case to be wrong`,
			code: `a { color: #000; }`,
		},
		{
			description: `three colours in one value, all in upper case`,
			code: `a { something: #000, #FFF, #ABABAB; }`,
		},
		{
			description: `a colour of eight digits, alpha and all`,
			code: `a { color: #0000FFCC; }`,
		},
		{
			description: `a colour of four digits`,
			code: `a { color: #00FC; }`,
		},
		{
			description: `a number that only looks like a colour, with no hash in front of it`,
			code: `a { padding: 000; }`,
		},
		{
			description: `a hash standing in a string, which spells no colour`,
			code: `a::before { content: "#ababa"; }`,
		},
		{
			description: `a hash standing in a comment, which spells no colour`,
			code: `a { color: white /* #fff */; }`,
		},
	],

	reject: [
		{
			description: `a lower-case letter in a colour of five digits, which is no valid length but is raised all the same`,
			code: `a { color: #aBABA; }`,
			fixed: `a { color: #ABABA; }`,
			line: 1,
			column: 12,
			message: messages.expected(`#aBABA`, `#ABABA`),
		},
		{
			description: `the first of three colours in lower case`,
			code: `a { something: #000f, #FFF, #ABABAB; }`,
			fixed: `a { something: #000F, #FFF, #ABABAB; }`,
			line: 1,
			column: 16,
			message: messages.expected(`#000f`, `#000F`),
		},
		{
			description: `a colour holding a letter no colour can hold, raised as the rest are`,
			code: `a { something: #000, #ffffaz, #ABABAB; }`,
			fixed: `a { something: #000, #FFFFAZ, #ABABAB; }`,
			line: 1,
			column: 22,
			message: messages.expected(`#ffffaz`, `#FFFFAZ`),
		},
		{
			description: `a colour of seven digits, which is no valid length but is raised all the same`,
			code: `a { something: #000, #FFF, #12345aa; }`,
			fixed: `a { something: #000, #FFF, #12345AA; }`,
			line: 1,
			column: 28,
			message: messages.expected(`#12345aa`, `#12345AA`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/272
			description: `a colour standing behind a comment the value parser does not give back as it read it`,
			code: `a { b: x/*/*a*/#aabbcc; }`,
			fixed: `a { b: x/*/*a*/#AABBCC; }`,
			line: 1,
			column: 16,
			message: messages.expected(`#aabbcc`, `#AABBCC`),
		},
	],
})

testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `an upper-case hex colour standing in the text of an inline comment the value holds`,
			code: `
				a { b: #aabbcc // #DDEEFF
					#00112a; }
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/115
			description: `the fix reaches the copy of the value this syntax prints, and the inline comment keeps its spelling`,
			code: `
				$m: (
					// c
					'a': 1,
					'b': #FFF
				);
			`,
			fixed: `
				$m: (
					// c
					'a': 1,
					'b': #fff
				);
			`,
			line: 4,
			column: 7,
			message: messages.expected(`#FFF`, `#fff`),
		},
	],
})

testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `an upper-case hex colour standing in the text of an inline comment the value holds`,
			code: `
				a { b: #aabbcc // #DDEEFF
					#00112a; }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `an address opened in the text of an inline comment and reaching past the break that closes it, which the rule passes over as it passes over every address`,
			code: `
				a { b: 1px // url(
					#aabbcc); }
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
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
