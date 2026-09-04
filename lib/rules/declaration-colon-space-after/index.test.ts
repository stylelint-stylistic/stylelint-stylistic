import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

// A space no editor trims from the end of a line.
const S = ` `

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a custom property whose value is a single space`,
			code: `a { --a: ; }`,
		},
		{
			description: `the same custom property with a declaration behind it`,
			code: `a { --a: ; color: red; }`,
		},
		{
			description: `a space behind the colon`,
			code: `a { color: pink }`,
		},
		{
			description: `spaces on both sides of the colon`,
			code: `a { color : pink }`,
		},
		{
			description: `a break in front of the colon and a space behind it`,
			code: `a { color\n: pink }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color\r\n: pink }`,
		},
		{
			description: `an SCSS map written on one line, whose inner colon opens no declaration`,
			code: `$map:(key:value)`,
		},
		{
			description: `an SCSS list written on one line`,
			code: `$list:('value1', 'value2')`,
		},
		{
			description: `a data URI, whose own colon opens no declaration either`,
			code: `a { background: url(data:application/font-woff;...); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			description: `comment with an URL, space after the declaration's own colon`,
			code: `a { color/* https://foo.bar/ */: pink; }`,
		},
		{
			description: `a custom property holding nothing but a comment`,
			code: `a { --a: /*comment*/; }`,
		},
		{
			description: `the same custom property with no semicolon behind it`,
			code: `a { --a: /*comment*/ }`,
		},
		{
			description: `the same comment with a flag behind it`,
			code: `a { --a: /*comment*/ !important; }`,
		},
		{
			description: `a value and a comment behind the colon`,
			code: `a { --a: red /*comment*/; }`,
		},
		{
			description: `the same comment and flag, with a space in front of the colon`,
			code: `a { --a : /*comment*/ !important; }`,
		},
		{
			description: `the same comment behind a colon that stands behind a tab`,
			code: `a { --a\t: /*comment*/; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `an ordinary property whose value is nothing but a flag, with one space behind the colon`,
			code: `a { color: !important; }`,
		},
		{
			description: `the same flag behind a comment, which the space stands in front of`,
			code: `a { color: /*comment*/\t!important; }`,
		},
		{
			description: `an ordinary property with no value at all behind the space`,
			code: `a { color: ; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/421
			description: `a property spelling a colon of its own, escaped, with the single space behind the declaration's colon`,
			code: `a { b\\:c: pink; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `a declaration printing nothing behind its colon, whose single space the block's own raw holds`,
			code: `a { color: }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `the same declaration with a comment written behind it, whose single space that comment's raw holds`,
			code: `a { color: /*comment*/ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			description: `a declaration standing last at the top level of a stylesheet, whose run behind the colon is the tail of the file`,
			code: `color:${S}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			description: `the same declaration whose tail is two spaces, a run this option collapses anywhere else`,
			code: `color:${S}${S}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			autoStripIndent: false,
			description: `the same declaration whose tail is the break the file ends on`,
			code: `color:\n`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			description: `the same declaration with no tail at all, the file ending at the colon`,
			code: `color:`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546
			description: `a custom property standing last at the top level of a stylesheet, whose two spaces are the tail of the file and the value's own text`,
			code: `--a:${S}${S}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546
			autoStripIndent: false,
			description: `the same custom property whose value is a space and the break the file ends on`,
			code: `--a:${S}\n`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546
			autoStripIndent: false,
			description: `the same custom property whose value is that break alone`,
			code: `--a:\n`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/408
			description: `a property ending in a run of two solidi, which the search that finds the colon reads to the end of the line as a comment though no syntax spells one there`,
			code: `a { color//c:\nurl(data:x); }`,
			fixed: `a { color//c: url(data:x); }`,
			line: 1,
			column: 14,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/421
			description: `the same escaped colon in front of a value that holds no word of its own`,
			code: `a { b\\:c:  !important; }`,
			fixed: `a { b\\:c: !important; }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
		{
			description: `a custom property with no value at all`,
			code: `a { --a:; }`,
			fixed: `a { --a: ; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `a custom property whose value is two spaces`,
			code: `a { --a:  ; }`,
			fixed: `a { --a: ; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `the same empty custom property in a block broken across lines`,
			code: `
				a {
					--a:;
				}
			`,
			fixed: `
				a {
					--a: ;
				}
			`,
			line: 2,
			column: 6,
			message: messages.expectedAfter(),
		},
		{
			description: `the same two spaces in a block broken across lines`,
			code: `
				a {
					--a:  ;
				}
			`,
			fixed: `
				a {
					--a: ;
				}
			`,
			line: 2,
			column: 6,
			message: messages.expectedAfter(),
		},
		{
			description: `a custom property whose value is a break`,
			code: `
				a {
					--a:
					;
				}
			`,
			fixed: `
				a {
					--a: ;
				}
			`,
			line: 2,
			column: 6,
			message: messages.expectedAfter(),
		},
		{
			description: `a value abutting the colon`,
			code: `a { color :pink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces behind the colon`,
			code: `a { color :  pink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab behind the colon`,
			code: `a { color :\tpink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a break behind the colon`,
			code: `a { color :\npink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color :\r\npink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a value abutting a colon that abuts the property too`,
			code: `a { color:pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `comments on both sides of the colon, neither spaced`,
			code: `a { color/*comment*/:/*comment*/pink; }`,
			fixed: `a { color/*comment*/: /*comment*/pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			description: `a comment holding an address, whose double slash opens none of its own`,
			code: `a { color/* https://foo.bar/ */:pink; }`,
			fixed: `a { color/* https://foo.bar/ */: pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment whose text ends in a backslash, which closes on the first delimiter behind its opening as it does to PostCSS`,
			code: `a { b/*x\\*/:pink; }`,
			fixed: `a { b/*x\\*/: pink; }`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(),
		},
		{
			description: `two comments abutting, whose closing and opening delimiters spell a double slash between them that opens nothing`,
			code: `a { b/*x*//*y*/:pink; }`,
			fixed: `a { b/*x*//*y*/: pink; }`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(),
		},
		{
			description: `a string holding a colon behind a bare double slash, which is code in a plain CSS file and opens no comment for the string to hide in`,
			code: `a { b //"x:":pink; }`,
			fixed: `a { b //"x:": pink; }`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment holding a colon, which opens no declaration`,
			code: `a { color/* a:b */:pink; }`,
			fixed: `a { color/* a:b */: pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment abutting the colon of a custom property`,
			code: `a { --a:/*comment*/; }`,
			fixed: `a { --a: /*comment*/; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment with a flag behind it`,
			code: `a { --a:/*comment*/ !important; }`,
			fixed: `a { --a: /*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment behind two spaces`,
			code: `a { --a:  /*comment*/; }`,
			fixed: `a { --a: /*comment*/; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment behind a tab, with a flag behind it`,
			code: `a { --a:\t/*comment*/ !important; }`,
			fixed: `a { --a: /*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment abutting a colon that stands behind a space`,
			code: `a { --a :/*comment*/ !important; }`,
			fixed: `a { --a : /*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `an ordinary property whose value is nothing but a flag, with two spaces behind the colon`,
			code: `a { color:  !important; }`,
			fixed: `a { color: !important; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `the same flag abutting the colon`,
			code: `a { color:!important; }`,
			fixed: `a { color: !important; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `the same flag behind a break`,
			code: `a { color:\n!important; }`,
			fixed: `a { color: !important; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `the same flag behind a comment, which two spaces stand in front of`,
			code: `a { color:  /*comment*/\t!important; }`,
			fixed: `a { color: /*comment*/\t!important; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `an ordinary property with no value at all behind two tabs`,
			code: `a { color:\t\t; }`,
			fixed: `a { color: ; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `a declaration printing nothing behind its colon, whose two spaces the block's own raw holds`,
			code: `a { color:  }`,
			fixed: `a { color: }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `the same declaration with a comment written behind it, whose two spaces that comment's raw holds`,
			code: `a { color:  /*comment*/ }`,
			fixed: `a { color: /*comment*/ }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `the same declaration whose run is the break the closing brace stands behind, over which the single space is written`,
			code: `
				@media all {
					a {
						color:
					}
				}
			`,
			fixed: `
				@media all {
					a {
						color: }
				}
			`,
			line: 3,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			description: `a declaration standing at the top level of a stylesheet with a comment written behind it, whose two spaces that comment's raw holds`,
			code: `color:${S}${S}/*comment*/`,
			fixed: `color:${S}/*comment*/`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546
			description: `a custom property whose break the closing brace of its block bounds rather than the end of the file`,
			code: `a {--a:${S}\n}`,
			fixed: `a {--a: }`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546
			autoStripIndent: false,
			description: `a custom property standing last at the top level of a stylesheet with a flag behind it, out of whose raw the file writes the break it ends on`,
			code: `--a:${S}${S}!important\n`,
			fixed: `--a: !important\n`,
			line: 1,
			column: 5,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a custom property with no value at all`,
			code: `a { --a:; color:red; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `a declaration printing nothing behind its colon, which the closing brace abuts`,
			code: `a { color:}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `the same declaration which a comment abuts instead`,
			code: `a { color:/*comment*/ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			description: `a declaration standing last at the top level of a stylesheet, whose space is the tail of the file`,
			code: `color:${S}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			autoStripIndent: false,
			description: `the same declaration whose tail is the break the file ends on`,
			code: `color:\n`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546
			description: `a custom property standing last at the top level of a stylesheet, whose single space is the tail of the file and the value's own text`,
			code: `--a:${S}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546
			autoStripIndent: false,
			description: `the same custom property whose value is a space and the break the file ends on`,
			code: `--a:${S}\n`,
		},
		{
			description: `a value abutting the colon`,
			code: `a { color:pink }`,
		},
		{
			description: `a space in front of the colon and none behind it`,
			code: `a { color :pink }`,
		},
		{
			description: `a break in front of the colon and nothing behind it`,
			code: `a { color\n:pink }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color\r\n:pink }`,
		},
		{
			description: `an SCSS map, whose inner colon opens no declaration`,
			code: `$map: (key: value)`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			description: `comment with an URL, no space after the declaration's own colon`,
			code: `a { color/* https://foo.bar/ */:pink; }`,
		},
		{
			description: `a comment abutting the colon of a custom property`,
			code: `a { --a:/*comment*/; }`,
		},
		{
			description: `the same comment with no semicolon behind it`,
			code: `a { --a:/*comment*/ }`,
		},
		{
			description: `the same comment with a flag behind it`,
			code: `a { --a:/*comment*/ !important; }`,
		},
		{
			description: `a value and a comment, the value abutting the colon`,
			code: `a { --a:red /*comment*/; }`,
		},
		{
			description: `the same comment abutting a colon that stands behind a space`,
			code: `a { --a :/*comment*/ !important; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `an ordinary property whose value is nothing but a flag, abutting the colon`,
			code: `a { color:!important; }`,
		},
	],

	reject: [
		{
			description: `a custom property whose value is a single space`,
			code: `a { --a: ; color:red; }`,
			fixed: `a { --a:; color:red; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space behind the colon`,
			code: `a { color : pink; }`,
			fixed: `a { color :pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces behind the colon`,
			code: `a { color:  pink; }`,
			fixed: `a { color:pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `a tab behind the colon`,
			code: `a { color :\tpink; }`,
			fixed: `a { color :pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `a break behind the colon`,
			code: `a { color :\npink; }`,
			fixed: `a { color :pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color :\r\npink; }`,
			fixed: `a { color :pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `comments on both sides of the colon, each spaced`,
			code: `a { color/*comment*/ : /*comment*/pink; }`,
			fixed: `a { color/*comment*/ :/*comment*/pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			description: `a comment holding an address, with a space behind the colon`,
			code: `a { color/* https://foo.bar/ */: pink; }`,
			fixed: `a { color/* https://foo.bar/ */:pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `a comment holding a colon, with a space behind the real one`,
			code: `a { color/* a:b */: pink; }`,
			fixed: `a { color/* a:b */:pink; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `a comment behind a space, in a custom property`,
			code: `a { --a: /*comment*/; }`,
			fixed: `a { --a:/*comment*/; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same comment with no semicolon behind it`,
			code: `a { --a: /*comment*/ }`,
			fixed: `a { --a:/*comment*/ }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same comment with a flag behind it`,
			code: `a { --a: /*comment*/ !important; }`,
			fixed: `a { --a:/*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			description: `a value and a comment behind the colon`,
			code: `a { --a: red /*comment*/; }`,
			fixed: `a { --a:red /*comment*/; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			description: `a value, a comment and a flag behind the colon`,
			code: `a { --a: 10px/*comment*/ !important; }`,
			fixed: `a { --a:10px/*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same comment behind a colon that stands behind a space`,
			code: `a { --a : /*comment*/; }`,
			fixed: `a { --a :/*comment*/; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `an ordinary property whose value is nothing but a flag, with one space behind the colon`,
			code: `a { color: !important; }`,
			fixed: `a { color:!important; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same flag behind a comment, which two spaces stand in front of`,
			code: `a { color:  /*comment*/\t!important; }`,
			fixed: `a { color:/*comment*/\t!important; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `an ordinary property with no value at all behind two spaces`,
			code: `a { color:  ; }`,
			fixed: `a { color:; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `a declaration printing nothing behind its colon, whose space the block's own raw holds`,
			code: `a { color: }`,
			fixed: `a { color:}`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `the same declaration with a comment written behind it, whose two spaces that comment's raw holds`,
			code: `a { color:  /*comment*/ }`,
			fixed: `a { color:/*comment*/ }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			description: `a declaration standing at the top level of a stylesheet with a comment written behind it, whose space that comment's raw holds`,
			code: `color:${S}/*comment*/`,
			fixed: `color:/*comment*/`,
			line: 1,
			column: 7,
			message: messages.rejectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546
			autoStripIndent: false,
			description: `a custom property standing last at the top level of a stylesheet with a flag behind it, out of whose raw the file writes the break it ends on`,
			code: `--a:${S}!important\n`,
			fixed: `--a:!important\n`,
			line: 1,
			column: 5,
			message: messages.rejectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a custom property whose value is a single space, with a declaration behind it`,
			code: `a { --a: ; color: red; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `a declaration printing nothing behind its colon, whose single space the block's own raw holds`,
			code: `a { color: }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			description: `a declaration standing last at the top level of a stylesheet, whose two spaces are the tail of the file`,
			code: `color:${S}${S}`,
		},
		{
			description: `the same custom property alone in its block`,
			code: `a { --a: ; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546
			description: `a custom property standing last at the top level of a stylesheet, whose two spaces are the tail of the file and the value's own text`,
			code: `--a:${S}${S}`,
		},
		{
			description: `a space behind the colon of a single-line declaration`,
			code: `a { color: pink }`,
		},
		{
			description: `a value broken across lines, with the space behind the colon`,
			code: `a { transition: color 1s,\n\twidth 2s; }`,
		},
		{
			description: `the same value abutting the colon, which this option passes over`,
			code: `a { transition:color 1s,\n\twidth 2s; }`,
		},
		{
			description: `the same value spelled with a carriage return`,
			code: `a { transition:color 1s,\r\n\twidth 2s; }`,
		},
		{
			description: `the same value behind a tab`,
			code: `a { transition:\tcolor 1s,\n\twidth 2s; }`,
		},
		{
			description: `a comment behind a space, in a custom property`,
			code: `a { --a: /*comment*/; }`,
		},
		{
			description: `the same comment with a flag behind it`,
			code: `a { --a: /*comment*/ !important; }`,
		},
		{
			description: `a value and a comment behind the colon`,
			code: `a { --a: red /*comment*/; }`,
		},
		{
			description: `the same comment and flag, with a space in front of the colon`,
			code: `a { --a : /*comment*/ !important; }`,
		},
		{
			description: `the same comment behind a colon that stands behind a tab`,
			code: `a { --a\t: /*comment*/; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `an ordinary property whose value is nothing but a flag, with one space behind the colon`,
			code: `a { color: !important; }`,
		},
	],

	reject: [
		{
			description: `a custom property with no value at all`,
			code: `a { --a:; }`,
			fixed: `a { --a: ; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a custom property whose value is two spaces`,
			code: `a { --a:  ; }`,
			fixed: `a { --a: ; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same custom property with a declaration behind it`,
			code: `a { --a:  ; color: red; }`,
			fixed: `a { --a: ; color: red; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a value abutting the colon of a single-line declaration`,
			code: `a { color :pink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `two spaces behind the colon`,
			code: `a { color :  pink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a tab behind the colon`,
			code: `a { color :\tpink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a break behind the colon, which does not make the declaration multi-line`,
			code: `a { color :\npink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color :\r\npink; }`,
			fixed: `a { color : pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a value abutting a colon that abuts the property too`,
			code: `a { color:pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `comments on both sides of the colon, neither spaced`,
			code: `a { color/*comment*/:/*comment*/pink; }`,
			fixed: `a { color/*comment*/: /*comment*/pink; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a comment abutting the colon of a custom property`,
			code: `a { --a:/*comment*/; }`,
			fixed: `a { --a: /*comment*/; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same comment with no semicolon behind it`,
			code: `a { --a:/*comment*/ }`,
			fixed: `a { --a: /*comment*/ }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same comment with a flag behind it`,
			code: `a { --a:/*comment*/ !important; }`,
			fixed: `a { --a: /*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same comment behind two spaces`,
			code: `a { --a:  /*comment*/; }`,
			fixed: `a { --a: /*comment*/; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same comment behind a tab, with a flag behind it`,
			code: `a { --a:\t/*comment*/ !important; }`,
			fixed: `a { --a: /*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same comment abutting a colon that stands behind a space`,
			code: `a { --a :/*comment*/ !important; }`,
			fixed: `a { --a : /*comment*/ !important; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfterSingleLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `an ordinary property whose value is nothing but a flag, with two spaces behind the colon`,
			code: `a { color:  !important; }`,
			fixed: `a { color: !important; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a break behind the colon of a declaration whose value holds no word of its own, which the option speaks about all the same: the value the lines are counted in is empty, and an empty text stands on one line`,
			code: `a { color:\n!important; }`,
			fixed: `a { color: !important; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `a declaration printing nothing behind its colon, whose two spaces the block's own raw holds`,
			code: `a { color:  }`,
			fixed: `a { color: }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			description: `a declaration standing at the top level of a stylesheet with a comment written behind it, whose two spaces that comment's raw holds`,
			code: `color:${S}${S}/*comment*/`,
			fixed: `color:${S}/*comment*/`,
			line: 1,
			column: 7,
			message: messages.expectedAfterSingleLine(),
		},
	],
})

// The two roots an HTML page holds are answered opposite ways. The root of an inline `style` attribute is a container like any other for the run behind a colon: it closes on the attribute's own quotation mark rather than on a brace, and the run standing past a declaration that prints nothing behind its colon goes into its `raws.after` all the same (#387). The root a `<style>` element holds is a stylesheet, which ends in that raw as a file does, and the run there is no rule's to write from the colon (#537).
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-html`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `an attribute whose one declaration prints nothing behind its colon, the single space standing in the root's own raw`,
			code: `<p style="color: "></p>`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			description: `a style element whose one declaration prints nothing behind its colon, the two spaces standing where that element's own stylesheet ends`,
			code: `<style>\ncolor:${S}${S}\n</style>`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			description: `the same element written on one line, whose two spaces this syntax keeps outside the stylesheet altogether and gives back when the page is printed, so that the raw the run would be written into is empty`,
			code: `<style>color:  </style>`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546
			description: `a style element whose one declaration is a custom property, the break its stylesheet ends on standing in that declaration's own value`,
			code: `<style>\n--a:${S}\n</style>`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546
			description: `the same custom property in an element written on one line, whose two spaces this syntax keeps outside the stylesheet as it does a plain property's`,
			code: `<style>--a:  </style>`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `the same attribute with two spaces there instead`,
			code: `<p style="color:  "></p>`,
			fixed: `<p style="color: "></p>`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `the same run held by the raw of a comment written behind that declaration`,
			code: `<p style="color:  /*comment*/"></p>`,
			fixed: `<p style="color: /*comment*/"></p>`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			description: `a style element with a comment written behind its declaration, whose raw bounds the run where the element's own does not`,
			code: `<style>color:  /*comment*/</style>`,
			fixed: `<style>color: /*comment*/</style>`,
			line: 1,
			column: 14,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-html`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
			description: `the same attribute, whose run this option takes away`,
			code: `<p style="color: "></p>`,
			fixed: `<p style="color:"></p>`,
			line: 1,
			column: 17,
			message: messages.rejectedAfter(),
		},
	],
})
