import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@media (width= 600px) {}`,
		},
		{
			code: `@mEdIa (width= 600px) {}`,
		},
		{
			code: `@MEDIA (width= 600px) {}`,
		},
		{
			code: `@media (width > 600px) {}`,
		},
		{
			code: `@media (width>= 600px) and (width<= 3em) {}`,
		},
		{
			code: `@media /*(width>=600px) and*/ (width <= 3em) {}`,
		},
		{
			code: `@media (width >= 600px) /*and (width<3em)*/ {}`,
		},
		{
			code: `@media (width >= /*>*/ 600px) {}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/213
			autoStripIndent: true,
			description: `an operator inside the arguments of a function belongs to the address and to no media feature`,
			code: `@media (width >= 1px) and (height >= url(a>=b)) { a { b: c; } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			autoStripIndent: true,
			description: `a media feature standing behind a bare address, whose double slash opens no comment`,
			code: `@media (url(http://x) >= 1px) { a { b: c; } }`,
		},
	],

	reject: [
		{
			code: `@media (width<600px) {}`,
			fixed: `@media (width< 600px) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			code: `@mEdIa (width<600px) {}`,
			fixed: `@mEdIa (width< 600px) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			code: `@MEDIA (width<600px) {}`,
			fixed: `@MEDIA (width< 600px) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			code: `@media (width<=  600px) {}`,
			fixed: `@media (width<= 600px) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@media (width=\t600px) {}`,
			fixed: `@media (width= 600px) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			code: `@media (width>\n600px) {}`,
			fixed: `@media (width> 600px) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			code: `@media (width>\r\n600px) {}`,
			fixed: `@media (width> 600px) {}`,
			description: `CRLF`,
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			code: `@media (width>=600px) and (width< 3em) {}`,
			fixed: `@media (width>= 600px) and (width< 3em) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@media (width> 600px) and (width=3em) {}`,
			fixed: `@media (width> 600px) and (width= 3em) {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 34,
		},
		{
			code: `@media (width>=600px) and (width<3em) {}`,
			fixed: `@media (width>= 600px) and (width< 3em) {}`,
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
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/215
			autoStripIndent: true,
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
		},
		{
			code: `@mEdIa (width =600px) {}`,
		},
		{
			code: `@MEDIA (width =600px) {}`,
		},
		{
			code: `@media (width>600px) {}`,
		},
		{
			code: `@media (width >=600px) and (width <=3em) {}`,
		},
		{
			code: `@media /*(width >= 600px) and*/ (width<=3em) {}`,
		},
		{
			code: `@media (width>=600px) /*and (width < 3em)*/ {}`,
		},
		{
			code: `@media (width>=/* > */ 600px) {}`,
		},
	],

	reject: [
		{
			code: `@media (width < 600px) {}`,
			fixed: `@media (width <600px) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@mEdIa (width < 600px) {}`,
			fixed: `@mEdIa (width <600px) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@MEDIA (width < 600px) {}`,
			fixed: `@MEDIA (width <600px) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@media (width <=  600px) {}`,
			fixed: `@media (width <=600px) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `@media (width =\t600px) {}`,
			fixed: `@media (width =600px) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@media (width >\n600px) {}`,
			fixed: `@media (width >600px) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@media (width >\r\n600px) {}`,
			fixed: `@media (width >600px) {}`,
			description: `CRLF`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
		{
			code: `@media (width >= 600px) and (width <3em) {}`,
			fixed: `@media (width >=600px) and (width <3em) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `@media (width >600px) and (width = 3em) {}`,
			fixed: `@media (width >600px) and (width =3em) {}`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 35,
		},
		{
			code: `@media (width >= 600px) and (width < 3em) {}`,
			fixed: `@media (width >=600px) and (width <3em) {}`,
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
			message: messages.rejectedAfter(),
			line: 1,
			column: 16,
		},
	],
})
