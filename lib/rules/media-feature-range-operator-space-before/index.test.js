import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@media (width = 600px) {}`,
			description: `a space before an equality operator`,
		},
		{
			code: `@mEdIa (width = 600px) {}`,
			description: `the same query under a mixed-case at-rule name`,
		},
		{
			code: `@MEDIA (width = 600px) {}`,
			description: `the same query under an upper-case at-rule name`,
		},
		{
			code: `@media (width >600px) {}`,
			description: `a space before the operator and none after it, which this rule does not measure`,
		},
		{
			code: `@media (width >= 600px) and (width <= 3em) {}`,
			description: `a space before each of the two-character operators of two features`,
		},
		{
			code: `@media /*(width>=600px) and*/ (width <= 3em) {}`,
			description: `an operator inside a comment standing in front of the query`,
		},
		{
			code: `@media (width >= 600px) /*and (width<=3em)*/ {}`,
			description: `an operator inside a comment standing after the query`,
		},
		{
			code: `@media (width >= /*>*/ 600px) {}`,
			description: `a comment standing between the operator and the value, which the rule does not measure`,
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
			code: `@media (width< 600px) {}`,
			fixed: `@media (width < 600px) {}`,
			description: `no space before the operator`,
			message: messages.expectedBefore(),
			line: 1,
			column: 13,
		},
		{
			code: `@mEdIa (width< 600px) {}`,
			fixed: `@mEdIa (width < 600px) {}`,
			description: `no space before the operator, under a mixed-case at-rule name`,
			message: messages.expectedBefore(),
			line: 1,
			column: 13,
		},
		{
			code: `@MEDIA (width< 600px) {}`,
			fixed: `@MEDIA (width < 600px) {}`,
			description: `no space before the operator, under an upper-case at-rule name`,
			message: messages.expectedBefore(),
			line: 1,
			column: 13,
		},
		{
			code: `@media (width  <= 600px) {}`,
			fixed: `@media (width <= 600px) {}`,
			description: `two spaces before the operator`,
			message: messages.expectedBefore(),
			line: 1,
			column: 15,
		},
		{
			code: `@media (width\t= 600px) {}`,
			fixed: `@media (width = 600px) {}`,
			description: `a tab before the operator`,
			message: messages.expectedBefore(),
			line: 1,
			column: 14,
		},
		{
			code: `@media (width\n> 600px) {}`,
			fixed: `@media (width > 600px) {}`,
			description: `a newline before the operator`,
			message: messages.expectedBefore(),
			line: 1,
			column: 14,
		},
		{
			code: `@media (width\r\n> 600px) {}`,
			fixed: `@media (width > 600px) {}`,
			description: `a carriage return and a newline before the operator`,
			message: messages.expectedBefore(),
			line: 1,
			column: 15,
		},
		{
			code: `@media (width>= 600px) and (width < 3em) {}`,
			fixed: `@media (width >= 600px) and (width < 3em) {}`,
			description: `no space before the operator of the first of two features`,
			message: messages.expectedBefore(),
			line: 1,
			column: 13,
		},
		{
			code: `@media (width > 600px) and (width= 3em) {}`,
			fixed: `@media (width > 600px) and (width = 3em) {}`,
			description: `no space before the operator of the second of two features`,
			message: messages.expectedBefore(),
			line: 1,
			column: 33,
		},
		{
			code: `@media (width> 600px) and (width= 3em) {}`,
			fixed: `@media (width > 600px) and (width = 3em) {}`,
			description: `no space before the operator of either feature`,
			warnings: [
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 13,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 32,
				},
			],
		},
		{
			code: `@media (width/**/< 600px) {}`,
			fixed: `@media (width/**/ < 600px) {}`,
			description: `a comment standing right before the operator, with nothing in between`,
			message: messages.expectedBefore(),
			line: 1,
			column: 17,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			description: `a media feature standing behind a bare address, whose double slash opens no comment`,
			code: `@media (url(http://x)>=1px) { a { b: c; } }`,
			fixed: `@media (url(http://x) >=1px) { a { b: c; } }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 21,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			description: `a double slash standing in the code of a plain CSS text, which spells no comment`,
			code: `@media (a//b>=1px) { c { d: e; } }`,
			fixed: `@media (a//b >=1px) { c { d: e; } }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 12,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `@media (width= 600px) {}`,
			description: `no space before the operator`,
		},
		{
			code: `@mEdIa (width= 600px) {}`,
			description: `the same query under a mixed-case at-rule name`,
		},
		{
			code: `@MEDIA (width= 600px) {}`,
			description: `the same query under an upper-case at-rule name`,
		},
		{
			code: `@media (width>600px) {}`,
			description: `no space on either side of the operator`,
		},
		{
			code: `@media (width>= 600px) and (width<= 3em) {}`,
			description: `no space before either of the two-character operators of two features`,
		},
		{
			code: `@media /*(width >= 600px) and*/ (width<= 3em) {}`,
			description: `an operator inside a comment standing in front of the query`,
		},
		{
			code: `@media (width>= 600px) /*and (width <= 3em)*/ {}`,
			description: `an operator inside a comment standing after the query`,
		},
		{
			code: `@media (width>= /* > */ 600px) {}`,
			description: `a comment standing after the operator, which this rule does not measure`,
		},
	],

	reject: [
		{
			code: `@media (width < 600px) {}`,
			fixed: `@media (width< 600px) {}`,
			description: `a space before the operator`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 14,
		},
		{
			code: `@mEdIa (width < 600px) {}`,
			fixed: `@mEdIa (width< 600px) {}`,
			description: `a space before the operator, under a mixed-case at-rule name`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 14,
		},
		{
			code: `@MEDIA (width < 600px) {}`,
			fixed: `@MEDIA (width< 600px) {}`,
			description: `a space before the operator, under an upper-case at-rule name`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 14,
		},
		{
			code: `@media (width  <= 600px) {}`,
			fixed: `@media (width<= 600px) {}`,
			description: `two spaces before the operator`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 15,
		},
		{
			code: `@media (width\t= 600px) {}`,
			fixed: `@media (width= 600px) {}`,
			description: `a tab before the operator`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 14,
		},
		{
			code: `@media (width\n> 600px) {}`,
			fixed: `@media (width> 600px) {}`,
			description: `a newline before the operator`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 14,
		},
		{
			code: `@media (width\r\n> 600px) {}`,
			fixed: `@media (width> 600px) {}`,
			description: `a carriage return and a newline before the operator`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 15,
		},
		{
			code: `@media (width>= 600px) and (width < 3em) {}`,
			fixed: `@media (width>= 600px) and (width< 3em) {}`,
			description: `a space before the operator of the second of two features`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 34,
		},
		{
			code: `@media (width > 600px) and (width= 3em) {}`,
			fixed: `@media (width> 600px) and (width= 3em) {}`,
			description: `a space before the operator of the first of two features`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 14,
		},
		{
			code: `@media (width >= 600px) and (width < 3em) {}`,
			fixed: `@media (width>= 600px) and (width< 3em) {}`,
			description: `a space before the operator of either feature`,
			warnings: [
				{
					message: messages.rejectedBefore(),
					line: 1,
					column: 14,
				},
				{
					message: messages.rejectedBefore(),
					line: 1,
					column: 35,
				},
			],
		},
		{
			code: `@media (width /**/ = 600px) {}`,
			fixed: `@media (width /**/= 600px) {}`,
			description: `a space between the operator and a comment standing in front of it`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 19,
		},
	],
})
