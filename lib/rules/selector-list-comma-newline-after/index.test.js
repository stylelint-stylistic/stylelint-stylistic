import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a,\nb {}`,
			description: `a newline after the comma`,
		},
		{
			code: `a,\n\nb {}`,
			description: `two newlines after the comma`,
		},
		{
			code: `a,\r\nb {}`,
			description: `a carriage-return line break after the comma`,
		},
		{
			code: `a,\r\n\r\nb {}`,
			description: `two carriage-return line breaks after the comma`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/196
			code: `a,\rb {}`,
			description: `a bare carriage return, which ends a line as readily`,
		},
		{
			code: `a,\fb {}`,
			description: `a form feed, which ends a line to every syntax this plugin reads through`,
		},
		{
			code: `a,\nb,\nc {}`,
			description: `a newline after each of the two commas`,
		},
		{
			code: `a ,\nb {}`,
			description: `a space in front of the comma and a newline after it`,
		},
		{
			code: `a\n,\nb {}`,
			description: `a newline on either side of the comma`,
		},
		{
			code: `a\r\n,\r\nb {}`,
			description: `the same list written with carriage-return line breaks`,
		},
		{
			code: `a,\nb[data-foo="tr,tr"] {}`,
			description: `a comma inside an attribute value, which is no comma of the list`,
		},
		{
			code: `a {\n  &:hover,\n  &:focus {\n    color: pink; }\n}`,
			description: `a selector list nested inside a rule`,
		},
		{
			code: `@media (min-width: 10px) {\n  a,\n  b {}\n}`,
			description: `a selector list nested inside a media query`,
		},
		{
			code: `@media (min-width: 10px) {\r\n  a,\r\n  b {}\r\n}`,
			description: `the same list written with carriage-return line breaks`,
		},
		{
			code: `\ta,\n\tb {}`,
			description: `an indented selector list`,
		},
		{
			code: `a, /* comment */\nb {}`,
			description: `a comment standing between the comma and the newline`,
		},
		{
			code: `a,   /* comment */\nb {}`,
			description: `the same comment behind several spaces`,
		},
		{
			code: `a,\t/* comment */\nb {}`,
			description: `the same behind a tab`,
		},
		{
			code: `a,\t\t/* comment */\nb {}`,
			description: `the same behind two tabs`,
		},
		{
			code: `a, \t \t /* comment */\nb {}`,
			description: `the same behind tabs and spaces`,
		},
		{
			code: `a, /* comment\n       commentline2 */\nb {}`,
			description: `a comment of two lines standing between the comma and the newline`,
		},
		{
			code: `a,   /* comment\n       commentline2 */\nb {}`,
			description: `the same comment behind several spaces`,
		},
		{
			code: `a,\t/* comment\n       commentline2 */\nb {}`,
			description: `the same behind a tab`,
		},
		{
			code: `a,\t\t/* comment\n       commentline2 */\nb {}`,
			description: `the same behind two tabs`,
		},
		{
			code: `a, \t \t /* comment\n       commentline2 */\nb {}`,
			description: `the same behind tabs and spaces`,
		},
		{
			code: `a:matches(:hover, :focus) {}`,
			description: `commas inside the argument of a pseudo-class, which are no commas of the list`,
		},
		{
			code: `:not(:hover, :focus) {}`,
			description: `the same inside a negation`,
		},
		{
			code: `:root { --foo: 1px; }`,
			description: `a custom property under the root selector`,
		},
		{
			code: `html { --foo: 1px; }`,
			description: `a custom property under a type selector`,
		},
		{
			code: `:root { --custom-property-set: {} }`,
			description: `a custom property set under the root selector`,
		},
		{
			code: `html { --custom-property-set: {} }`,
			description: `a custom property set under a type selector`,
		},
	],

	reject: [
		{
			code: `a,b {}`,
			fixed: `a,\nb {}`,
			description: `no newline after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a, b {}`,
			fixed: `a,\n b {}`,
			description: `a space after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a,  b {}`,
			fixed: `a,\n  b {}`,
			description: `two spaces after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a,\tb {}`,
			fixed: `a,\n\tb {}`,
			description: `a tab after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a,\nb,c {}`,
			fixed: `a,\nb,\nc {}`,
			description: `no newline after the second of two commas`,
			message: messages.expectedAfter(),
			line: 2,
			column: 2,
		},
		{
			code: `a,\r\nb,c {}`,
			fixed: `a,\r\nb,\r\nc {}`,
			description: `the same list written with a carriage-return line break`,
			message: messages.expectedAfter(),
			line: 2,
			column: 2,
		},
		{
			code: `a, /* comment */ b {}`,
			fixed: `a, /* comment */\n b {}`,
			description: `a comment standing after the comma, with no newline behind it`,
			message: messages.expectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a, /* comment\n       commentline2 */b {}`,
			fixed: `a, /* comment\n       commentline2 */\nb {}`,
			description: `a comment of two lines standing after the comma, with no newline behind it`,
			message: messages.expectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z {\n}`,
			fixed:
				`a,\nb,\nc,\nd,\ne,\nf,\ng,\nh,\ni,\nj,\nk,\nl,\nm,\nn,\no,\np,\nq,\nr,\ns,\nt,\nu,\nv,\nw,\nx,\ny,\nz {\n}`,
			description: `no newline after any of the commas of a list of twenty-six`,
			warnings: Array.from({ length: 25 })
				.fill(0)
				.map((_, i) => ({
					message: messages.expectedAfter(),
					line: 1,
					column: 2 * (i + 1),
				})),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `a,\nb {}`,
			description: `a newline after the comma of a multi-line list`,
		},
		{
			code: `a,\r\nb {}`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `a, b {}`,
			description: `a single-line list, which this option does not measure`,
		},
		{
			code: `a, b {\n}`,
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
		},
		{
			code: `a, b {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
		},
		{
			code: `\ta,\n\tb {\n}`,
			description: `an indented multi-line list`,
		},
	],

	reject: [
		{
			code: `a,\nb, c {}`,
			fixed: `a,\nb,\n c {}`,
			description: `no newline after the second comma of a multi-line list`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 2,
		},
		{
			code: `a,\nb, c {\n}`,
			fixed: `a,\nb,\n c {\n}`,
			description: `the same list in front of a multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 2,
		},
		{
			code: `a,\r\nb, c {\r\n}`,
			fixed: `a,\r\nb,\r\n c {\r\n}`,
			description: `the same list and block written with carriage-return line breaks`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 2,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `a\n,b {}`,
			description: `a newline in front of the comma, which leaves nothing after it`,
		},
		{
			code: `a ,b {}`,
			description: `a single-line list, which this option does not measure`,
		},
		{
			code: `a ,b {\n}`,
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
		},
		{
			code: `a:matches(:hover, :focus) {}`,
			description: `commas inside the argument of a pseudo-class, which are no commas of the list`,
		},
		{
			code: `:not(:hover, :focus) {}`,
			description: `the same inside a negation`,
		},
	],

	reject: [
		{
			code: `a,\nb ,c {}`,
			fixed: `a,b ,c {}`,
			description: `a newline after the first comma of a multi-line list`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a,\r\nb ,c {}`,
			fixed: `a,b ,c {}`,
			description: `the same list written with a carriage-return line break`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a,\nb ,c {\n}`,
			fixed: `a,b ,c {\n}`,
			description: `the same list in front of a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a,\n\n   \t b ,c {\n}`,
			fixed: `a,b ,c {\n}`,
			description: `a blank line and indentation after the first comma`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a,\n/*comment*/\nb ,\nc {\n}`,
			fixed: `a,\n/*comment*/b ,c {\n}`,
			description: `a comment standing on the line after the first comma`,
			warnings: [
				{
					message: messages.rejectedAfterMultiLine(),
					line: 1,
					column: 2,
				},
				{
					message: messages.rejectedAfterMultiLine(),
					line: 3,
					column: 3,
				},
			],
		},
		{
			code: `a,\nb,\nc,\nd,\ne,\nf,\ng,\nh,\ni,\nj,\nk,\nl,\nm,\nn,\no,\np,\nq,\nr,\ns,\nt,\nu,\nv,\nw,\nx,\ny,\nz {\n}`,
			fixed: `a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z {\n}`,
			description: `a newline after every comma of a long list`,
			warnings: Array.from({ length: 25 })
				.fill(0)
				.map((_, i) => ({
					message: messages.rejectedAfterMultiLine(),
					line: 1 + i,
					column: 2,
				})),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `a, // comment\nb {}`,
			description: `an end-of-line comment standing between the comma and the newline`,
		},
		{
			code: `a,   // comment\nb {}`,
			description: `the same comment behind several spaces`,
		},
		{
			code: `a,\t// comment\nb {}`,
			description: `the same behind a tab`,
		},
		{
			code: `a,\t\t// comment\nb {}`,
			description: `the same behind two tabs`,
		},
		{
			code: `a, \t \t // comment\nb {}`,
			description: `the same behind tabs and spaces`,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			code: `.a:hover when(1 = 1), .b { color: red; }`,
			description: `a Less CSS guard written with no space in front of its condition, which the comma of the list stands behind`,
		},
		{
			code: `.a:hover when(1 = 1), (2 = 2) { color: red; }`,
			description: `the same, with a condition list of its own, whose comma is none of this rule's business`,
		},
		{
			code: `a, // comment\nb {}`,
			description: `an end-of-line comment standing between the comma and the newline`,
		},
		{
			code: `a,   // comment\nb {}`,
			description: `the same comment behind several spaces`,
		},
		{
			code: `a,\t// comment\nb {}`,
			description: `the same behind a tab`,
		},
		{
			code: `a,\t\t// comment\nb {}`,
			description: `the same behind two tabs`,
		},
		{
			code: `a, \t \t // comment\nb {}`,
			description: `the same behind tabs and spaces`,
		},
		{
			code: `.col( @a, @b ) {}`,
			description: `a Less mixin whose parameters carry commas of their own`,
		},
		{
			code: `.col3( @a, @b ) {}`,
			description: `the same mixin, its name ending in a digit`,
		},
		{
			code: `.a:hover when (1 = 1), .b { color: red; }`,
			description: `a CSS guard, which the comma of the list stands behind`,
		},
	],

	reject: [
		{
			code: `.a:hover WHEN (1 = 1), .b { color: red; }`,
			fixed: `.a:hover WHEN (1 = 1),\n .b { color: red; }`,
			description: `a guard keyword written in another case, which Less reads as no keyword at all`,
			message: messages.expectedAfter(),
			line: 1,
			column: 22,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/193
			code: `.a // c\n.b, .c {}`,
			fixed: `.a // c\n.b,\n .c {}`,
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			message: messages.expectedAfter(),
			line: 2,
			column: 3,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			code: `.a, // c\n.b {}`,
			fixed: `.a, // c\n.b {}`,
			description: `a comma whose whitespace holds the break that closes an inline comment, which the fixer has to leave standing`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 3,
		},
	],
})
