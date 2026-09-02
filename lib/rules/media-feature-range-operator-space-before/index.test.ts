import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space before an equality operator`,
			code: `@media (width = 600px) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa (width = 600px) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA (width = 600px) {}`,
		},
		{
			description: `a space before the operator and none after it, which this rule does not measure`,
			code: `@media (width >600px) {}`,
		},
		{
			description: `a space before each of the two-character operators of two features`,
			code: `@media (width >= 600px) and (width <= 3em) {}`,
		},
		{
			description: `an operator inside a comment standing in front of the query`,
			code: `@media /*(width>=600px) and*/ (width <= 3em) {}`,
		},
		{
			description: `an operator inside a comment standing after the query`,
			code: `@media (width >= 600px) /*and (width<=3em)*/ {}`,
		},
		{
			description: `a comment standing between the operator and the value, which the rule does not measure`,
			code: `@media (width >= /*>*/ 600px) {}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/213
			description: `an operator inside the arguments of a function belongs to the address and to no media feature`,
			code: `@media (width >= 1px) and (height >= url(a>=b)) { a { b: c; } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			description: `a media feature standing behind a bare address, whose double slash opens no comment`,
			code: `@media (url(http://x) >= 1px) { a { b: c; } }`,
		},
	],

	reject: [
		{
			description: `no space before the operator`,
			code: `@media (width< 600px) {}`,
			fixed: `@media (width < 600px) {}`,
			line: 1,
			column: 13,
			message: messages.expectedBefore(),
		},
		{
			description: `no space before the operator, under a mixed-case at-rule name`,
			code: `@mEdIa (width< 600px) {}`,
			fixed: `@mEdIa (width < 600px) {}`,
			line: 1,
			column: 13,
			message: messages.expectedBefore(),
		},
		{
			description: `no space before the operator, under an upper-case at-rule name`,
			code: `@MEDIA (width< 600px) {}`,
			fixed: `@MEDIA (width < 600px) {}`,
			line: 1,
			column: 13,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces before the operator`,
			code: `@media (width  <= 600px) {}`,
			fixed: `@media (width <= 600px) {}`,
			line: 1,
			column: 15,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab before the operator`,
			code: `@media (width\t= 600px) {}`,
			fixed: `@media (width = 600px) {}`,
			line: 1,
			column: 14,
			message: messages.expectedBefore(),
		},
		{
			description: `a newline before the operator`,
			code: `@media (width\n> 600px) {}`,
			fixed: `@media (width > 600px) {}`,
			line: 1,
			column: 14,
			message: messages.expectedBefore(),
		},
		{
			description: `a carriage return and a newline before the operator`,
			code: `@media (width\r\n> 600px) {}`,
			fixed: `@media (width > 600px) {}`,
			line: 1,
			column: 15,
			message: messages.expectedBefore(),
		},
		{
			description: `no space before the operator of the first of two features`,
			code: `@media (width>= 600px) and (width < 3em) {}`,
			fixed: `@media (width >= 600px) and (width < 3em) {}`,
			line: 1,
			column: 13,
			message: messages.expectedBefore(),
		},
		{
			description: `no space before the operator of the second of two features`,
			code: `@media (width > 600px) and (width= 3em) {}`,
			fixed: `@media (width > 600px) and (width = 3em) {}`,
			line: 1,
			column: 33,
			message: messages.expectedBefore(),
		},
		{
			description: `no space before the operator of either feature`,
			code: `@media (width> 600px) and (width= 3em) {}`,
			fixed: `@media (width > 600px) and (width = 3em) {}`,
			warnings: [
				{
					line: 1,
					column: 13,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 32,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			description: `a comment standing right before the operator, with nothing in between`,
			code: `@media (width/**/< 600px) {}`,
			fixed: `@media (width/**/ < 600px) {}`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			description: `a media feature standing behind a bare address, whose double slash opens no comment`,
			code: `@media (url(http://x)>=1px) { a { b: c; } }`,
			fixed: `@media (url(http://x) >=1px) { a { b: c; } }`,
			line: 1,
			column: 21,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			description: `a double slash standing in the code of a plain CSS text, which spells no comment`,
			code: `@media (a//b>=1px) { c { d: e; } }`,
			fixed: `@media (a//b >=1px) { c { d: e; } }`,
			line: 1,
			column: 12,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/240
			description: `a two-character operator standing right behind another one, which the single run the fixture is put through has to space as well`,
			code: `@media ,a<>=b screen<screen { a { b: c; } }`,
			fixed: `@media ,a < >=b screen <screen { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 10,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 20,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/240
			description: `two one-character operators standing side by side, of which the second used to be read as the tail of the first`,
			code: `@media (a<<b) { c { d: e; } }`,
			fixed: `@media (a < <b) { c { d: e; } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 10,
					message: messages.expectedBefore(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `no space before the operator`,
			code: `@media (width= 600px) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa (width= 600px) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA (width= 600px) {}`,
		},
		{
			description: `no space on either side of the operator`,
			code: `@media (width>600px) {}`,
		},
		{
			description: `no space before either of the two-character operators of two features`,
			code: `@media (width>= 600px) and (width<= 3em) {}`,
		},
		{
			description: `an operator inside a comment standing in front of the query`,
			code: `@media /*(width >= 600px) and*/ (width<= 3em) {}`,
		},
		{
			description: `an operator inside a comment standing after the query`,
			code: `@media (width>= 600px) /*and (width <= 3em)*/ {}`,
		},
		{
			description: `a comment standing after the operator, which this rule does not measure`,
			code: `@media (width>= /* > */ 600px) {}`,
		},
	],

	reject: [
		{
			description: `a space before the operator`,
			code: `@media (width < 600px) {}`,
			fixed: `@media (width< 600px) {}`,
			line: 1,
			column: 14,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space before the operator, under a mixed-case at-rule name`,
			code: `@mEdIa (width < 600px) {}`,
			fixed: `@mEdIa (width< 600px) {}`,
			line: 1,
			column: 14,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space before the operator, under an upper-case at-rule name`,
			code: `@MEDIA (width < 600px) {}`,
			fixed: `@MEDIA (width< 600px) {}`,
			line: 1,
			column: 14,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces before the operator`,
			code: `@media (width  <= 600px) {}`,
			fixed: `@media (width<= 600px) {}`,
			line: 1,
			column: 15,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab before the operator`,
			code: `@media (width\t= 600px) {}`,
			fixed: `@media (width= 600px) {}`,
			line: 1,
			column: 14,
			message: messages.rejectedBefore(),
		},
		{
			description: `a newline before the operator`,
			code: `@media (width\n> 600px) {}`,
			fixed: `@media (width> 600px) {}`,
			line: 1,
			column: 14,
			message: messages.rejectedBefore(),
		},
		{
			description: `a carriage return and a newline before the operator`,
			code: `@media (width\r\n> 600px) {}`,
			fixed: `@media (width> 600px) {}`,
			line: 1,
			column: 15,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space before the operator of the second of two features`,
			code: `@media (width>= 600px) and (width < 3em) {}`,
			fixed: `@media (width>= 600px) and (width< 3em) {}`,
			line: 1,
			column: 34,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space before the operator of the first of two features`,
			code: `@media (width > 600px) and (width= 3em) {}`,
			fixed: `@media (width> 600px) and (width= 3em) {}`,
			line: 1,
			column: 14,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space before the operator of either feature`,
			code: `@media (width >= 600px) and (width < 3em) {}`,
			fixed: `@media (width>= 600px) and (width< 3em) {}`,
			warnings: [
				{
					line: 1,
					column: 14,
					message: messages.rejectedBefore(),
				},
				{
					line: 1,
					column: 35,
					message: messages.rejectedBefore(),
				},
			],
		},
		{
			description: `a space between the operator and a comment standing in front of it`,
			code: `@media (width /**/ = 600px) {}`,
			fixed: `@media (width /**/= 600px) {}`,
			line: 1,
			column: 19,
			message: messages.rejectedBefore(),
		},
	],
})

// A vertical tab and a no-break space are words to PostCSS's tokenizer (#496): the fix rewrites only the run the tokenizer reads beside its anchor, and such a character stays where the fix used to carry it off with the run.
testRule({
	ruleName,
	config: [`always`],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/496
			description: `a vertical tab in front of the range operator, a word to the tokenizer: the space is written beside the character, which stays`,
			code: `@media (a\v>= 10px) {}`,
			fixed: `@media (a\v >= 10px) {}`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/496
			description: `a vertical tab at the run before the range operator: only the tokenizer's run goes, and the character stays`,
			code: `@media (a\v >= 10px) {}`,
			fixed: `@media (a\v>= 10px) {}`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 12,
			message: messages.rejectedBefore(),
		},
	],
})
