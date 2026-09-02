import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space after an equality operator`,
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
			description: `a space on either side of the operator`,
			code: `@media (width > 600px) {}`,
		},
		{
			description: `a space after each of the two-character operators of two features`,
			code: `@media (width>= 600px) and (width<= 3em) {}`,
		},
		{
			description: `an operator inside a comment standing in front of the query`,
			code: `@media /*(width>=600px) and*/ (width <= 3em) {}`,
		},
		{
			description: `an operator inside a comment standing after the query`,
			code: `@media (width >= 600px) /*and (width<3em)*/ {}`,
		},
		{
			description: `a comment standing between the operator and the value, the space after the operator still in place`,
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
			description: `no space after the operator`,
			code: `@media (width<600px) {}`,
			fixed: `@media (width< 600px) {}`,
			line: 1,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `a feature behind a hyphen and a number, which name no call and so leave the parentheses a feature's rather than a call's arguments`,
			code: `@media 2-(width>=1px) {}`,
			fixed: `@media 2-(width>= 1px) {}`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `no space after the operator, under a mixed-case at-rule name`,
			code: `@mEdIa (width<600px) {}`,
			fixed: `@mEdIa (width< 600px) {}`,
			line: 1,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			description: `no space after the operator, under an upper-case at-rule name`,
			code: `@MEDIA (width<600px) {}`,
			fixed: `@MEDIA (width< 600px) {}`,
			line: 1,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces after the operator`,
			code: `@media (width<=  600px) {}`,
			fixed: `@media (width<= 600px) {}`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab after the operator`,
			code: `@media (width=\t600px) {}`,
			fixed: `@media (width= 600px) {}`,
			line: 1,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			description: `a newline after the operator`,
			code: `@media (width>\n600px) {}`,
			fixed: `@media (width> 600px) {}`,
			line: 1,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			description: `a carriage return and a newline after the operator`,
			code: `@media (width>\r\n600px) {}`,
			fixed: `@media (width> 600px) {}`,
			line: 1,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			description: `no space after the operator of the first of two features`,
			code: `@media (width>=600px) and (width< 3em) {}`,
			fixed: `@media (width>= 600px) and (width< 3em) {}`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
		{
			description: `no space after the operator of the second of two features`,
			code: `@media (width> 600px) and (width=3em) {}`,
			fixed: `@media (width> 600px) and (width= 3em) {}`,
			line: 1,
			column: 34,
			message: messages.expectedAfter(),
		},
		{
			description: `no space after the operator of either feature`,
			code: `@media (width>=600px) and (width<3em) {}`,
			fixed: `@media (width>= 600px) and (width< 3em) {}`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 34,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `a comment standing right after the operator, with nothing in between`,
			code: `@media (width</**/600px) {}`,
			fixed: `@media (width< /**/600px) {}`,
			line: 1,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			description: `a media feature standing behind a bare address, whose double slash opens no comment`,
			code: `@media (url(http://x) >=1px) { a { b: c; } }`,
			fixed: `@media (url(http://x) >= 1px) { a { b: c; } }`,
			line: 1,
			column: 25,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/240
			description: `a two-character operator standing right behind another one, which the single run the fixture is put through has to space as well`,
			code: `@media ,a<>=b screen<screen { a { b: c; } }`,
			fixed: `@media ,a< >= b screen< screen { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 22,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/240
			description: `two one-character operators standing side by side, of which the second used to be read as the tail of the first`,
			code: `@media (a<<b) { c { d: e; } }`,
			fixed: `@media (a< < b) { c { d: e; } }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 12,
					message: messages.expectedAfter(),
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
			description: `no space after the operator`,
			code: `@media (width =600px) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa (width =600px) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA (width =600px) {}`,
		},
		{
			description: `no space on either side of the operator`,
			code: `@media (width>600px) {}`,
		},
		{
			description: `no space after either of the two-character operators of two features`,
			code: `@media (width >=600px) and (width <=3em) {}`,
		},
		{
			description: `an operator inside a comment standing in front of the query`,
			code: `@media /*(width >= 600px) and*/ (width<=3em) {}`,
		},
		{
			description: `an operator inside a comment standing after the query`,
			code: `@media (width>=600px) /*and (width < 3em)*/ {}`,
		},
		{
			description: `a comment standing right after the operator, with nothing in between`,
			code: `@media (width>=/* > */ 600px) {}`,
		},
	],

	reject: [
		{
			description: `a space after the operator`,
			code: `@media (width < 600px) {}`,
			fixed: `@media (width <600px) {}`,
			line: 1,
			column: 16,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space after the operator, under a mixed-case at-rule name`,
			code: `@mEdIa (width < 600px) {}`,
			fixed: `@mEdIa (width <600px) {}`,
			line: 1,
			column: 16,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space after the operator, under an upper-case at-rule name`,
			code: `@MEDIA (width < 600px) {}`,
			fixed: `@MEDIA (width <600px) {}`,
			line: 1,
			column: 16,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces after the operator`,
			code: `@media (width <=  600px) {}`,
			fixed: `@media (width <=600px) {}`,
			line: 1,
			column: 17,
			message: messages.rejectedAfter(),
		},
		{
			description: `a tab after the operator`,
			code: `@media (width =\t600px) {}`,
			fixed: `@media (width =600px) {}`,
			line: 1,
			column: 16,
			message: messages.rejectedAfter(),
		},
		{
			description: `a newline after the operator`,
			code: `@media (width >\n600px) {}`,
			fixed: `@media (width >600px) {}`,
			line: 1,
			column: 16,
			message: messages.rejectedAfter(),
		},
		{
			description: `a carriage return and a newline after the operator`,
			code: `@media (width >\r\n600px) {}`,
			fixed: `@media (width >600px) {}`,
			line: 1,
			column: 16,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space after the operator of the first of two features`,
			code: `@media (width >= 600px) and (width <3em) {}`,
			fixed: `@media (width >=600px) and (width <3em) {}`,
			line: 1,
			column: 17,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space after the operator of the second of two features`,
			code: `@media (width >600px) and (width = 3em) {}`,
			fixed: `@media (width >600px) and (width =3em) {}`,
			line: 1,
			column: 35,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space after the operator of either feature`,
			code: `@media (width >= 600px) and (width < 3em) {}`,
			fixed: `@media (width >=600px) and (width <3em) {}`,
			warnings: [
				{
					line: 1,
					column: 17,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 37,
					message: messages.rejectedAfter(),
				},
			],
		},
		{
			description: `a space between the operator and a comment standing in the value's place`,
			code: `@media (width = /**/ 600px) {}`,
			fixed: `@media (width =/**/ 600px) {}`,
			line: 1,
			column: 16,
			message: messages.rejectedAfter(),
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
			description: `a vertical tab behind the range operator, a word to the tokenizer: the space is written beside the character, which stays`,
			code: `@media (a >=\v10px) {}`,
			fixed: `@media (a >= \v10px) {}`,
			line: 1,
			column: 13,
			endLine: 1,
			endColumn: 14,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/496
			description: `a vertical tab behind the run after the range operator: only the tokenizer's run goes, and the character stays`,
			code: `@media (a >= \v10px) {}`,
			fixed: `@media (a >=\v10px) {}`,
			line: 1,
			column: 13,
			endLine: 1,
			endColumn: 14,
			message: messages.rejectedAfter(),
		},
	],
})
