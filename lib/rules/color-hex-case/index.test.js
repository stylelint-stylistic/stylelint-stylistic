import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],

	accept: [
		{
			code: `a { border-#$side: 0; }`,
			description: `an interpolation in a property name, whose hash opens no colour`,
		},
		{
			code: `a { box-sizing: #$type-box; }`,
			description: `an interpolation in a value, whose hash opens no colour`,
		},
		{
			code: `a { stroke: url(#gradientA) }`,
			description: `a fragment reference in a url(), whose hash opens no colour either`,
		},
		{
			code: `a { color: pink; }`,
			description: `a keyword, which carries no hash at all`,
		},
		{
			code: `a { color: #000; }`,
			description: `a colour already in lower case`,
		},
		{
			code: `a { something: #000, #fff, #ababab; }`,
			description: `three colours in one value, all in lower case`,
		},
		{
			code: `a { color: #0000ffcc; }`,
			description: `a colour of eight digits, alpha and all`,
		},
		{
			code: `a { color: #00fc; }`,
			description: `a colour of four digits`,
		},
		{
			code: `a { padding: 000; }`,
			description: `a number that only looks like a colour, with no hash in front of it`,
		},
		{
			code: `a::before { content: "#ABABA"; }`,
			description: `a hash standing in a string, which spells no colour`,
		},
		{
			code: `a { color: white /* #FFF */; }`,
			description: `a hash standing in a comment, which spells no colour`,
		},
	],

	reject: [
		{
			code: `a { color: #Ababa; }`,
			fixed: `a { color: #ababa; }`,
			description: `a capital letter in a colour of five digits, which is no valid length but is lowered all the same`,

			message: messages.expected(`#Ababa`, `#ababa`),
			line: 1,
			column: 12,
		},
		{
			code: `a { something: #000F, #fff, #ababab; }`,
			fixed: `a { something: #000f, #fff, #ababab; }`,
			description: `the first of three colours in upper case`,

			message: messages.expected(`#000F`, `#000f`),
			line: 1,
			column: 16,
		},
		{
			code: `a { something: #000, #FFFFAZ, #ababab; }`,
			fixed: `a { something: #000, #ffffaz, #ababab; }`,
			description: `a colour holding a letter no colour can hold, lowered as the rest are`,

			message: messages.expected(`#FFFFAZ`, `#ffffaz`),
			line: 1,
			column: 22,
		},
		{
			code: `a { something: #000, #fff, #12345AA; }`,
			fixed: `a { something: #000, #fff, #12345aa; }`,
			description: `a colour of seven digits, which is no valid length but is lowered all the same`,

			message: messages.expected(`#12345AA`, `#12345aa`),
			line: 1,
			column: 28,
		},
	],
})

testRule({
	ruleName,
	config: [`upper`],

	accept: [
		{
			code: `a { border-#$side: 0; }`,
			description: `an interpolation in a property name, whose hash opens no colour`,
		},
		{
			code: `a { box-sizing: #$type-box; }`,
			description: `an interpolation in a value, whose hash opens no colour`,
		},
		{
			code: `a { stroke: url(#gradientA) }`,
			description: `a fragment reference in a url(), whose hash opens no colour either`,
		},
		{
			code: `a { color: pink; }`,
			description: `a keyword, which carries no hash at all`,
		},
		{
			code: `a { color: #000; }`,
			description: `a colour of digits alone, which has no case to be wrong`,
		},
		{
			code: `a { something: #000, #FFF, #ABABAB; }`,
			description: `three colours in one value, all in upper case`,
		},
		{
			code: `a { color: #0000FFCC; }`,
			description: `a colour of eight digits, alpha and all`,
		},
		{
			code: `a { color: #00FC; }`,
			description: `a colour of four digits`,
		},
		{
			code: `a { padding: 000; }`,
			description: `a number that only looks like a colour, with no hash in front of it`,
		},
		{
			code: `a::before { content: "#ababa"; }`,
			description: `a hash standing in a string, which spells no colour`,
		},
		{
			code: `a { color: white /* #fff */; }`,
			description: `a hash standing in a comment, which spells no colour`,
		},
	],

	reject: [
		{
			code: `a { color: #aBABA; }`,
			fixed: `a { color: #ABABA; }`,
			description: `a lower-case letter in a colour of five digits, which is no valid length but is raised all the same`,

			message: messages.expected(`#aBABA`, `#ABABA`),
			line: 1,
			column: 12,
		},
		{
			code: `a { something: #000f, #FFF, #ABABAB; }`,
			fixed: `a { something: #000F, #FFF, #ABABAB; }`,
			description: `the first of three colours in lower case`,

			message: messages.expected(`#000f`, `#000F`),
			line: 1,
			column: 16,
		},
		{
			code: `a { something: #000, #ffffaz, #ABABAB; }`,
			fixed: `a { something: #000, #FFFFAZ, #ABABAB; }`,
			description: `a colour holding a letter no colour can hold, raised as the rest are`,

			message: messages.expected(`#ffffaz`, `#FFFFAZ`),
			line: 1,
			column: 22,
		},
		{
			code: `a { something: #000, #FFF, #12345aa; }`,
			fixed: `a { something: #000, #FFF, #12345AA; }`,
			description: `a colour of seven digits, which is no valid length but is raised all the same`,

			message: messages.expected(`#12345aa`, `#12345AA`),
			line: 1,
			column: 28,
		},
	],
})

testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-scss`,

	reject: [
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
			message: messages.expected(`#FFF`, `#fff`),
			line: 4,
			column: 7,
		},
	],
})
