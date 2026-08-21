import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@media (width= 600px) {}`,
			description: `a space after an equality operator`,
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
			code: `@media (width > 600px) {}`,
			description: `a space on either side of the operator`,
		},
		{
			code: `@media (width>= 600px) and (width<= 3em) {}`,
			description: `a space after each of the two-character operators of two features`,
		},
		{
			code: `@media /*(width>=600px) and*/ (width <= 3em) {}`,
			description: `an operator inside a comment standing in front of the query`,
		},
		{
			code: `@media (width >= 600px) /*and (width<3em)*/ {}`,
			description: `an operator inside a comment standing after the query`,
		},
		{
			code: `@media (width >= /*>*/ 600px) {}`,
			description: `a comment standing between the operator and the value, the space after the operator still in place`,
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
			code: `@media (width<600px) {}`,
			fixed: `@media (width< 600px) {}`,
			description: `no space after the operator`,
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			code: `@mEdIa (width<600px) {}`,
			fixed: `@mEdIa (width< 600px) {}`,
			description: `no space after the operator, under a mixed-case at-rule name`,
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			code: `@MEDIA (width<600px) {}`,
			fixed: `@MEDIA (width< 600px) {}`,
			description: `no space after the operator, under an upper-case at-rule name`,
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			code: `@media (width<=  600px) {}`,
			fixed: `@media (width<= 600px) {}`,
			description: `two spaces after the operator`,
			message: messages.expectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@media (width=\t600px) {}`,
			fixed: `@media (width= 600px) {}`,
			description: `a tab after the operator`,
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			code: `@media (width>\n600px) {}`,
			fixed: `@media (width> 600px) {}`,
			description: `a newline after the operator`,
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			code: `@media (width>\r\n600px) {}`,
			fixed: `@media (width> 600px) {}`,
			description: `a carriage return and a newline after the operator`,
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			code: `@media (width>=600px) and (width< 3em) {}`,
			fixed: `@media (width>= 600px) and (width< 3em) {}`,
			description: `no space after the operator of the first of two features`,
			message: messages.expectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@media (width> 600px) and (width=3em) {}`,
			fixed: `@media (width> 600px) and (width= 3em) {}`,
			description: `no space after the operator of the second of two features`,
			message: messages.expectedAfter(),
			line: 1,
			column: 34,
		},
		{
			code: `@media (width>=600px) and (width<3em) {}`,
			fixed: `@media (width>= 600px) and (width< 3em) {}`,
			description: `no space after the operator of either feature`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 16,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 34,
				},
			],
		},
		{
			code: `@media (width</**/600px) {}`,
			fixed: `@media (width< /**/600px) {}`,
			description: `a comment standing right after the operator, with nothing in between`,
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			description: `a media feature standing behind a bare address, whose double slash opens no comment`,
			code: `@media (url(http://x) >=1px) { a { b: c; } }`,
			fixed: `@media (url(http://x) >= 1px) { a { b: c; } }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 25,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `@media (width =600px) {}`,
			description: `no space after the operator`,
		},
		{
			code: `@mEdIa (width =600px) {}`,
			description: `the same query under a mixed-case at-rule name`,
		},
		{
			code: `@MEDIA (width =600px) {}`,
			description: `the same query under an upper-case at-rule name`,
		},
		{
			code: `@media (width>600px) {}`,
			description: `no space on either side of the operator`,
		},
		{
			code: `@media (width >=600px) and (width <=3em) {}`,
			description: `no space after either of the two-character operators of two features`,
		},
		{
			code: `@media /*(width >= 600px) and*/ (width<=3em) {}`,
			description: `an operator inside a comment standing in front of the query`,
		},
		{
			code: `@media (width>=600px) /*and (width < 3em)*/ {}`,
			description: `an operator inside a comment standing after the query`,
		},
		{
			code: `@media (width>=/* > */ 600px) {}`,
			description: `a comment standing right after the operator, with nothing in between`,
		},
	],

	reject: [
		{
			code: `@media (width < 600px) {}`,
			fixed: `@media (width <600px) {}`,
			description: `a space after the operator`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@mEdIa (width < 600px) {}`,
			fixed: `@mEdIa (width <600px) {}`,
			description: `a space after the operator, under a mixed-case at-rule name`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@MEDIA (width < 600px) {}`,
			fixed: `@MEDIA (width <600px) {}`,
			description: `a space after the operator, under an upper-case at-rule name`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@media (width <=  600px) {}`,
			fixed: `@media (width <=600px) {}`,
			description: `two spaces after the operator`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `@media (width =\t600px) {}`,
			fixed: `@media (width =600px) {}`,
			description: `a tab after the operator`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@media (width >\n600px) {}`,
			fixed: `@media (width >600px) {}`,
			description: `a newline after the operator`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@media (width >\r\n600px) {}`,
			fixed: `@media (width >600px) {}`,
			description: `a carriage return and a newline after the operator`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@media (width >= 600px) and (width <3em) {}`,
			fixed: `@media (width >=600px) and (width <3em) {}`,
			description: `a space after the operator of the first of two features`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `@media (width >600px) and (width = 3em) {}`,
			fixed: `@media (width >600px) and (width =3em) {}`,
			description: `a space after the operator of the second of two features`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 35,
		},
		{
			code: `@media (width >= 600px) and (width < 3em) {}`,
			fixed: `@media (width >=600px) and (width <3em) {}`,
			description: `a space after the operator of either feature`,
			warnings: [
				{
					message: messages.rejectedAfter(),
					line: 1,
					column: 17,
				},
				{
					message: messages.rejectedAfter(),
					line: 1,
					column: 37,
				},
			],
		},
		{
			code: `@media (width = /**/ 600px) {}`,
			fixed: `@media (width =/**/ 600px) {}`,
			description: `a space between the operator and a comment standing in the value's place`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
	],
})
