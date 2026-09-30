import stylelint from "stylelint"
import { expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import plugins from "../../index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

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
			description: `spaces and a tab between the comma and a break the file spells, which go rather than stand as a line of their own`,
			code: `a, \t\nb {}`,
			fixed: `a,\nb {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `a form feed beside the comma, which is whitespace and no line break, so the break is written in front of it`,
			code: `a,\fb {}`,
			fixed: `a,\n\fb {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
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
		{
			// The search the commas are found with closes no string at a quotation mark a backslash stands in front of, so the comma behind one went unread
			description: `no newline after a comma behind a string ending in an escaped backslash, whose closing quotation mark no escape holds`,
			code: `[a="b\\\\"],c {}`,
			fixed: `[a="b\\\\"],\nc {}`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
		{
			// A write parting the name of a bare address from the comma or joining it to the comma switches how PostCSS reads its parentheses
			description: `a comma glued to the name of a bare address holding a string with a closing parenthesis, which a written run would make the tokenizer close inside the string`,
			code: `[a,url(a ")" b)] {}`,
			fixed: `[a,url(a ")" b)] {}`,
			line: 1,
			column: 3,
			message: messages.expectedAfter(),
		},
		{
			// PostCSS holds `(b[c,d)` as one token, opaque to the parser; a break inside makes it code, whose `[` opens a group nothing closes, and the file stops parsing
			description: `parentheses without a name inside an attribute selector holding a square bracket nothing closes, where the break is refused and the warning stands`,
			code: `[a,\n(b[c,d)] {}`,
			fixed: `[a,\n(b[c,d)] {}`,
			line: 2,
			column: 5,
			message: messages.expectedAfter(),
		},
		{
			// The `(` pops the word `url`, so PostCSS holds the parentheses as an address's token to the first `)`, and a break inside leaves them that token
			description: `an address's parentheses parted from the name by a space and holding a square bracket nothing closes, where the break is written`,
			code: `a,\nurl (b[c,d)(b"c") d {}`,
			fixed: `a,\nurl (b[c,\nd)(b"c") d {}`,
			line: 2,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `the same parentheses behind the name in upper case, which the tokenizer pops as no address, so they are one plain token the break would make code, and the break is refused`,
			code: `a,\nURL (b[c,d)(b"c") d {}`,
			fixed: `a,\nURL (b[c,d)(b"c") d {}`,
			line: 2,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `the same parentheses with the square bracket closed inside them, which code reads as a group of its own, so the break is written`,
			code: `[a,\n(b[c],d)] {}`,
			fixed: `[a,\n(b[c],\nd)] {}`,
			line: 2,
			column: 6,
			message: messages.expectedAfter(),
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
		// A list opening with a comma behind a break is multi-line, as it is where the break stands in front of a later comma
		{
			description: `a break in front of a comma opening the selector`,
			code: `x {}\n,b, c {}`,
			fixed: `x {}\n,\nb,\n c {}`,
			warnings: [
				{
					line: 2,
					column: 1,
					message: messages.expectedAfterMultiLine(),
				},
				{
					line: 2,
					column: 3,
					message: messages.expectedAfterMultiLine(),
				},
			],
		},
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
		{
			// The list is multi-line by a break outside the parentheses, which PostCSS still holds as one token; a break written inside makes them code, whose `[` nothing closes
			description: `a multi-line list holding parentheses without a name whose square bracket nothing closes, where the break is refused and the warning stands`,
			code: `[a,\n(b[c,d)] {}`,
			fixed: `[a,\n(b[c,d)] {}`,
			line: 2,
			column: 5,
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
		{
			// A write parting the name of a bare address from the comma or joining it to the comma switches how PostCSS reads its parentheses
			description: `a run between a comma and the name of a bare address holding a quotation mark nothing closes, which taking the run away would make the tokenizer read as a string`,
			code: `[a,\nurl(a"b)] {}`,
			fixed: `[a,\nurl(a"b)] {}`,
			line: 1,
			column: 3,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})

// A vertical tab and a no-break space are words to PostCSS's tokenizer: the fix rewrites only the run the tokenizer reads beside its anchor, and such a character stays where the fix used to carry it off.
testRule({
	ruleName,
	config: [`never-multi-line`],

	reject: [
		{
			description: `a vertical tab behind a comma's run in a multi-line list: each run is trimmed to the tokenizer's, and the character stays`,
			code: `a, \vb,\nc {}`,
			fixed: `a,\vb,c {}`,
			warnings: [
				{
					line: 1,
					column: 2,
					endLine: 1,
					endColumn: 3,
					message: messages.rejectedAfterMultiLine(),
				},
				{
					line: 1,
					column: 6,
					endLine: 1,
					endColumn: 7,
					message: messages.rejectedAfterMultiLine(),
				},
			],
		},
	],
})

// The break behind the comma in front of the parentheses stands outside them and is written while the one inside is refused, which a reject case cannot say since the warning left moves
it(`writes the break behind a comma right in front of parentheses PostCSS holds as one token and refuses the one inside them, whose square bracket nothing closes`, async () => {
	let config = { plugins, rules: { [ruleName]: `always` } }
	let fixed = await stylelint.lint({ code: `[a,(b[c,d)] {}`, config, fix: true })
	let again = await stylelint.lint({ code: fixed.code ?? ``, config })

	expect({ fixed: fixed.code, left: pick(again.results).warnings.map((warning) => `${warning.line}:${warning.column}`) }).toEqual({ fixed: `[a,\n(b[c,d)] {}`, left: [`2:5`] })
})

// A break written into parentheses the tokenizer takes as one plain token makes them code and pushes the words inside them, and the next parenthesis then pops one of those instead of the word url, so the quotation mark inside its parentheses opens a string nothing closes; the warning left moves with the break written in front, which a reject case cannot say
it(`writes the break behind a comma of the list and refuses the one behind a comma in parentheses a word over the name of a bare address pops, in front of parentheses holding a quotation mark`, async () => {
	let config = { plugins, rules: { [ruleName]: `always` } }
	let fixed = await stylelint.lint({ code: `[a, url a (b,c)(b"c)] {}`, config, fix: true })
	let again = await stylelint.lint({ code: fixed.code ?? ``, config })

	expect({ fixed: fixed.code, left: pick(again.results).warnings.map((warning) => `${warning.line}:${warning.column}`) }).toEqual({ fixed: `[a,\n url a (b,c)(b"c)] {}`, left: [`2:10`] })
})
