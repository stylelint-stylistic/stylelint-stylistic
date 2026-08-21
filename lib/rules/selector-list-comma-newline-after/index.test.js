import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a newline after the comma`,
			code: `a,\nb {}`,
		},
		{
			description: `two newlines after the comma`,
			code: `
				a,

				b {}
			`,
		},
		{
			description: `a carriage-return line break after the comma`,
			code: `a,\r\nb {}`,
		},
		{
			description: `two carriage-return line breaks after the comma`,
			code: `a,\r\n\r\nb {}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/196
			description: `a bare carriage return, which ends a line as readily`,
			code: `a,\rb {}`,
		},
		{
			description: `a form feed, which ends a line to every syntax this plugin reads through`,
			code: `a,\fb {}`,
		},
		{
			description: `a newline after each of the two commas`,
			code: `
				a,
				b,
				c {}
			`,
		},
		{
			description: `a space in front of the comma and a newline after it`,
			code: `a ,\nb {}`,
		},
		{
			description: `a newline on either side of the comma`,
			code: `a\n,\nb {}`,
		},
		{
			description: `the same list written with carriage-return line breaks`,
			code: `a\r\n,\r\nb {}`,
		},
		{
			description: `a comma inside an attribute value, which is no comma of the list`,
			code: `a,\nb[data-foo="tr,tr"] {}`,
		},
		{
			description: `a selector list nested inside a rule`,
			code: `
				a {
				  &:hover,
				  &:focus {
				    color: pink; }
				}
			`,
		},
		{
			description: `a selector list nested inside a media query`,
			code: `
				@media (min-width: 10px) {
				  a,
				  b {}
				}
			`,
		},
		{
			description: `the same list written with carriage-return line breaks`,
			code: `@media (min-width: 10px) {\r\n  a,\r\n  b {}\r\n}`,
		},
		{
			autoStripIndent: false,
			description: `an indented selector list`,
			code: `\ta,\n\tb {}`,
		},
		{
			description: `a comment standing between the comma and the newline`,
			code: `a, /* comment */\nb {}`,
		},
		{
			description: `the same comment behind several spaces`,
			code: `a,   /* comment */\nb {}`,
		},
		{
			description: `the same behind a tab`,
			code: `a,\t/* comment */\nb {}`,
		},
		{
			description: `the same behind two tabs`,
			code: `a,\t\t/* comment */\nb {}`,
		},
		{
			description: `the same behind tabs and spaces`,
			code: `a, \t \t /* comment */\nb {}`,
		},
		{
			description: `a comment of two lines standing between the comma and the newline`,
			code: `a, /* comment\n       commentline2 */\nb {}`,
		},
		{
			description: `the same comment behind several spaces`,
			code: `a,   /* comment\n       commentline2 */\nb {}`,
		},
		{
			description: `the same behind a tab`,
			code: `a,\t/* comment\n       commentline2 */\nb {}`,
		},
		{
			description: `the same behind two tabs`,
			code: `a,\t\t/* comment\n       commentline2 */\nb {}`,
		},
		{
			description: `the same behind tabs and spaces`,
			code: `a, \t \t /* comment\n       commentline2 */\nb {}`,
		},
		{
			description: `commas inside the argument of a pseudo-class, which are no commas of the list`,
			code: `a:matches(:hover, :focus) {}`,
		},
		{
			description: `the same inside a negation`,
			code: `:not(:hover, :focus) {}`,
		},
		{
			description: `a custom property under the root selector`,
			code: `:root { --foo: 1px; }`,
		},
		{
			description: `a custom property under a type selector`,
			code: `html { --foo: 1px; }`,
		},
		{
			description: `a custom property set under the root selector`,
			code: `:root { --custom-property-set: {} }`,
		},
		{
			description: `a custom property set under a type selector`,
			code: `html { --custom-property-set: {} }`,
		},
	],

	reject: [
		{
			description: `no newline after the comma`,
			code: `a,b {}`,
			fixed: `a,\nb {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `a space after the comma`,
			code: `a, b {}`,
			fixed: `a,\n b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces after the comma`,
			code: `a,  b {}`,
			fixed: `a,\n  b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab after the comma`,
			code: `a,\tb {}`,
			fixed: `a,\n\tb {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `no newline after the second of two commas`,
			code: `a,\nb,c {}`,
			fixed: `a,\nb,\nc {}`,
			line: 2,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a,\r\nb,c {}`,
			fixed: `a,\r\nb,\r\nc {}`,
			line: 2,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment standing after the comma, with no newline behind it`,
			code: `a, /* comment */ b {}`,
			fixed: `a, /* comment */\n b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment of two lines standing after the comma, with no newline behind it`,
			code: `a, /* comment\n       commentline2 */b {}`,
			fixed: `a, /* comment\n       commentline2 */\nb {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `no newline after any of the commas of a list of twenty-six`,
			code: `a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z {\n}`,
			fixed:
				`a,\nb,\nc,\nd,\ne,\nf,\ng,\nh,\ni,\nj,\nk,\nl,\nm,\nn,\no,\np,\nq,\nr,\ns,\nt,\nu,\nv,\nw,\nx,\ny,\nz {\n}`,
			warnings: Array.from({ length: 25 })
				.fill(0)
				.map((_, i) => ({
					line: 1,
					column: 2 * (i + 1),
					message: messages.expectedAfter(),
				})),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a newline after the comma of a multi-line list`,
			code: `a,\nb {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a,\r\nb {}`,
		},
		{
			description: `a single-line list, which this option does not measure`,
			code: `a, b {}`,
		},
		{
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
			code: `a, b {\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a, b {\r\n}`,
		},
		{
			description: `an indented multi-line list`,
			code: `\ta,\n\tb {\n}`,
		},
	],

	reject: [
		{
			description: `no newline after the second comma of a multi-line list`,
			code: `a,\nb, c {}`,
			fixed: `a,\nb,\n c {}`,
			line: 2,
			column: 2,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same list in front of a multi-line block`,
			code: `
				a,
				b, c {
				}
			`,
			fixed: `
				a,
				b,
				 c {
				}
			`,
			line: 2,
			column: 2,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same list and block written with carriage-return line breaks`,
			code: `a,\r\nb, c {\r\n}`,
			fixed: `a,\r\nb,\r\n c {\r\n}`,
			line: 2,
			column: 2,
			message: messages.expectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a newline in front of the comma, which leaves nothing after it`,
			code: `a\n,b {}`,
		},
		{
			description: `a single-line list, which this option does not measure`,
			code: `a ,b {}`,
		},
		{
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
			code: `a ,b {\n}`,
		},
		{
			description: `commas inside the argument of a pseudo-class, which are no commas of the list`,
			code: `a:matches(:hover, :focus) {}`,
		},
		{
			description: `the same inside a negation`,
			code: `:not(:hover, :focus) {}`,
		},
	],

	reject: [
		{
			description: `a newline after the first comma of a multi-line list`,
			code: `a,\nb ,c {}`,
			fixed: `a,b ,c {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a,\r\nb ,c {}`,
			fixed: `a,b ,c {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `the same list in front of a multi-line block`,
			code: `
				a,
				b ,c {
				}
			`,
			fixed: `
				a,b ,c {
				}
			`,
			line: 1,
			column: 2,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a blank line and indentation after the first comma`,
			code: `
				a,

				   	 b ,c {
				}
			`,
			fixed: `
				a,b ,c {
				}
			`,
			line: 1,
			column: 2,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a comment standing on the line after the first comma`,
			code: `
				a,
				/*comment*/
				b ,
				c {
				}
			`,
			fixed: `
				a,
				/*comment*/b ,c {
				}
			`,
			warnings: [
				{
					line: 1,
					column: 2,
					message: messages.rejectedAfterMultiLine(),
				},
				{
					line: 3,
					column: 3,
					message: messages.rejectedAfterMultiLine(),
				},
			],
		},
		{
			description: `a newline after every comma of a long list`,
			code: `
				a,
				b,
				c,
				d,
				e,
				f,
				g,
				h,
				i,
				j,
				k,
				l,
				m,
				n,
				o,
				p,
				q,
				r,
				s,
				t,
				u,
				v,
				w,
				x,
				y,
				z {
				}
			`,
			fixed: `
				a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z {
				}
			`,
			warnings: Array.from({ length: 25 })
				.fill(0)
				.map((_, i) => ({
					line: 1 + i,
					column: 2,
					message: messages.rejectedAfterMultiLine(),
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
			description: `an end-of-line comment standing between the comma and the newline`,
			code: `a, // comment\nb {}`,
		},
		{
			description: `the same comment behind several spaces`,
			code: `a,   // comment\nb {}`,
		},
		{
			description: `the same behind a tab`,
			code: `a,\t// comment\nb {}`,
		},
		{
			description: `the same behind two tabs`,
			code: `a,\t\t// comment\nb {}`,
		},
		{
			description: `the same behind tabs and spaces`,
			code: `a, \t \t // comment\nb {}`,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a Less CSS guard written with no space in front of its condition, which the comma of the list stands behind`,
			code: `.a:hover when(1 = 1), .b { color: red; }`,
		},
		{
			description: `the same, with a condition list of its own, whose comma is none of this rule's business`,
			code: `.a:hover when(1 = 1), (2 = 2) { color: red; }`,
		},
		{
			description: `an end-of-line comment standing between the comma and the newline`,
			code: `a, // comment\nb {}`,
		},
		{
			description: `the same comment behind several spaces`,
			code: `a,   // comment\nb {}`,
		},
		{
			description: `the same behind a tab`,
			code: `a,\t// comment\nb {}`,
		},
		{
			description: `the same behind two tabs`,
			code: `a,\t\t// comment\nb {}`,
		},
		{
			description: `the same behind tabs and spaces`,
			code: `a, \t \t // comment\nb {}`,
		},
		{
			description: `a Less mixin whose parameters carry commas of their own`,
			code: `.col( @a, @b ) {}`,
		},
		{
			description: `the same mixin, its name ending in a digit`,
			code: `.col3( @a, @b ) {}`,
		},
		{
			description: `a CSS guard, which the comma of the list stands behind`,
			code: `.a:hover when (1 = 1), .b { color: red; }`,
		},
	],

	reject: [
		{
			description: `a guard keyword written in another case, which Less reads as no keyword at all`,
			code: `.a:hover WHEN (1 = 1), .b { color: red; }`,
			fixed: `.a:hover WHEN (1 = 1),\n .b { color: red; }`,
			line: 1,
			column: 22,
			message: messages.expectedAfter(),
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
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			code: `.a // c\n.b, .c {}`,
			fixed: `.a // c\n.b,\n .c {}`,
			line: 2,
			column: 3,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a comma whose whitespace holds the break that closes an inline comment, which the fixer has to leave standing`,
			code: `.a, // c\n.b {}`,
			fixed: `.a, // c\n.b {}`,
			line: 1,
			column: 3,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})
