import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space inside each parenthesis of a single feature`,
			code: `@media ( max-width: 300px ) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa ( max-width: 300px ) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA ( max-width: 300px ) {}`,
		},
		{
			description: `spaces inside the parentheses of both features of a query list`,
			code: `@media screen and ( color ), projection and ( color ) {}`,
		},
		{
			description: `spaces inside the parentheses of two features joined by and`,
			code: `@media ( grid ) and ( max-width: 15em ) {}`,
		},
		{
			description: `a comment standing where the value would be, the spaces still in place`,
			code: `@media ( max-width: /*comment*/ ) {}`,
		},
		{
			description: `one space inside a feature holding nothing else, which is the whole run the parentheses enclose and answers for both halves of the option`,
			code: `@media ( ) { a { b: c; } }`,
		},
		{
			description: `a parenthesis written in the text of a comment opened by a solidus, a star and a solidus, which closes the feature to the parser, so neither space this option asks for is written into that text`,
			code: `@media (a: 1 /*/ ) */ ) { a { b: c; } }`,
		},
		{
			description: `a vertical tab between single spaces inside a feature, which the tokenizer reads as what the feature holds, so each parenthesis already has its space`,
			code: `@media ( \v ) { a { b: c; } }`,
		},
		{
			description: `a feature the file never closes, which holds the rest of the file to the parser and ends on no parenthesis, so it is passed over whole and nothing is written at the end of the file`,
			code: `@media (a: 1 { a { b: c; } }`,
		},
		{
			description: `an unclosed call inside such a feature, which is a second node ending on no parenthesis`,
			code: `@media (min-width: calc(1px { a { b: c; } }`,
		},
	],

	reject: [
		{
			description: `a call in a feature's value whose name a hexadecimal escape welds to the word in front of it, holding a bare address with a quotation mark, where the space behind its parenthesis would hand the parentheses to code and leave a string nothing closes`,
			code: `@media ( a: \\61 url(b"c.png) ) { d { e: f } }`,
			fixed: `@media ( a: \\61 url(b"c.png ) ) { d { e: f } }`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 27,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `the same call holding a parenthesis nothing closes, where the space would open a group the params run past every brace with, and the at-rule would swallow its own block`,
			code: `@media ( a: \\61 url(b(c.png) ) { d { e: f } }`,
			fixed: `@media ( a: \\61 url(b(c.png ) ) { d { e: f } }`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 27,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `an address inside a feature, whose name a backslash and a break divide from what stands in front`,
			code: `@media (a: \\\nurl(b.png)) { e { f: 1px } }`,
			fixed: `@media ( a: \\\nurl(b.png) ) { e { f: 1px } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expectedOpening,
				},
				{
					line: 2,
					column: 10,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// The value parser closes such an address on the string's parenthesis
			description: `a feature holding an address with a string with a closing parenthesis, whose parenthesis the tokenizer's whitespace parts from it`,
			code: `@media (c: url( a ")" b )) {}`,
			fixed: `@media ( c: url( a ")" b ) ) {}`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 25,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// The value parser closes the address on the comment's parenthesis, and the whitespace behind the opening one makes the comment a comment to the tokenizer
			description: `a feature holding an address with a comment with a closing parenthesis, whose closing parenthesis stands against the address's`,
			code: `@media (c: url( $a /* ) */)) {}`,
			fixed: `@media ( c: url( $a /* ) */) ) {}`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 27,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `such a feature standing beside one the file does spell, whose parentheses are spaced out while the text of the comment is left as it stands`,
			code: `@media (a: 1) and (b: 2 /*/ ) */ ) { a { b: c; } }`,
			fixed: `@media ( a: 1 ) and (b: 2 /*/ ) */ ) { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 12,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `no space after the opening parenthesis`,
			code: `@media (max-width: 300px ) {}`,
			fixed: `@media ( max-width: 300px ) {}`,
			line: 1,
			column: 9,
			message: messages.expectedOpening,
		},
		{
			description: `no space after the opening parenthesis, under a mixed-case at-rule name`,
			code: `@mEdIa (max-width: 300px ) {}`,
			fixed: `@mEdIa ( max-width: 300px ) {}`,
			line: 1,
			column: 9,
			message: messages.expectedOpening,
		},
		{
			description: `no space after the opening parenthesis of a feature whose value is a comment`,
			code: `@MEDIA (max-width: /*comment*/ ) {}`,
			fixed: `@MEDIA ( max-width: /*comment*/ ) {}`,
			line: 1,
			column: 9,
			message: messages.expectedOpening,
		},
		{
			description: `no space after the opening parenthesis, under an upper-case at-rule name`,
			code: `@MEDIA (max-width: 300px ) {}`,
			fixed: `@MEDIA ( max-width: 300px ) {}`,
			line: 1,
			column: 9,
			message: messages.expectedOpening,
		},
		{
			description: `no space before the closing parenthesis`,
			code: `@media ( max-width: 300px) {}`,
			fixed: `@media ( max-width: 300px ) {}`,
			line: 1,
			column: 25,
			message: messages.expectedClosing,
		},
		{
			description: `no space before the closing parenthesis of a feature whose value is a comment`,
			code: `@media ( max-width: /*comment*/) {}`,
			fixed: `@media ( max-width: /*comment*/ ) {}`,
			line: 1,
			column: 31,
			message: messages.expectedClosing,
		},
		{
			description: `no space after the opening parenthesis of the first feature of a query list`,
			code: `@media screen and (color ), projection and ( color ) {}`,
			fixed: `@media screen and ( color ), projection and ( color ) {}`,
			line: 1,
			column: 20,
			message: messages.expectedOpening,
		},
		{
			description: `no space before the closing parenthesis of the first feature of a query list`,
			code: `@media screen and ( color), projection and ( color ) {}`,
			fixed: `@media screen and ( color ), projection and ( color ) {}`,
			line: 1,
			column: 25,
			message: messages.expectedClosing,
		},
		{
			description: `no space after the opening parenthesis of the second feature of a query list`,
			code: `@media screen and ( color ), projection and (color ) {}`,
			fixed: `@media screen and ( color ), projection and ( color ) {}`,
			line: 1,
			column: 46,
			message: messages.expectedOpening,
		},
		{
			description: `no space before the closing parenthesis of the second feature of a query list`,
			code: `@media screen and ( color ), projection and ( color) {}`,
			fixed: `@media screen and ( color ), projection and ( color ) {}`,
			line: 1,
			column: 51,
			message: messages.expectedClosing,
		},
		{
			description: `no space after the opening parenthesis of the second of two features joined by and`,
			code: `@media ( grid ) and (max-width: 15em ) {}`,
			fixed: `@media ( grid ) and ( max-width: 15em ) {}`,
			line: 1,
			column: 22,
			message: messages.expectedOpening,
		},
		{
			description: `a comment holding a parenthesis between two quotation marks it closes around them: the string those marks open reaches past nothing, so the mask leaves them where they stand and the parenthesis stays the comment's`,
			code: `@media ( b: 2 /*/ "(" */ ) and (c: d) { a { c: d; } }`,
			fixed: `@media ( b: 2 /*/ "(" */ ) and ( c: d ) { a { c: d; } }`,
			warnings: [
				{
					line: 1,
					column: 33,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 36,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `a feature holding nothing at all, whose one run is what both halves of the option are about`,
			code: `@media () { a { b: c; } }`,
			fixed: `@media ( ) { a { b: c; } }`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 10,
			message: messages.expectedOpening,
		},
		{
			description: `a call holding nothing at all standing as a feature's value, read the same way as the feature itself`,
			code: `@media (min-width: calc()) { a { b: c; } }`,
			fixed: `@media ( min-width: calc( ) ) { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 25,
					message: messages.expectedClosing,
				},
				{
					line: 1,
					column: 21,
					message: messages.expectedOpening,
				},
			],
		},
		{
			description: `vertical tabs abutting both parentheses of a feature, which the tokenizer reads as characters of the feature, so each space is written between a parenthesis and a tab`,
			code: `@media (\va\v) { a { b: c; } }`,
			fixed: `@media ( \va\v ) { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 11,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// The run behind the `(` of an address is what parts the parenthesis from what it holds, and a tokenizer reads the two spellings by different rules, so this option writes no space there
			description: `a feature holding an address whose own parentheses hold no whitespace, spaced out around the address while the address is left as it stands`,
			code: `@media (c: url(a b)) { a { b: 1px } }`,
			fixed: `@media ( c: url(a b) ) { a { b: 1px } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 19,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `a feature the file does spell beside one it never closes, whose parentheses are spaced out while the unclosed one is left as it stands`,
			code: `@media (a: 1) and (b: 2 { a { b: c; } }`,
			fixed: `@media ( a: 1 ) and (b: 2 { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 12,
					message: messages.expectedClosing,
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
			description: `no space inside either parenthesis`,
			code: `@media (max-width: 300px) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa (max-width: 300px) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA (max-width: 300px) {}`,
		},
		{
			description: `a comment standing where the value would be, with no spaces around it`,
			code: `@MEDIA (max-width: /*comment*/) {}`,
		},
		{
			description: `a query list with no spaces inside any parenthesis`,
			code: `@media screen and (color), projection and (color) {}`,
		},
		{
			description: `two features joined by and, with no spaces inside their parentheses`,
			code: `@media (grid) and (max-width: 15em) {}`,
		},
		{
			description: `a comment leaving a quotation mark open in front of a parenthesis it also holds: taking the mark away hands the parser that parenthesis, and the feature it closes is one the file never spells, so the whole of it is passed over and the space in front of the parenthesis the file does spell goes unreported with it`,
			code: `@media ( b: 2 /*/ " ) */ ) and (c: d) { a { b: c; } }`,
		},
		{
			description: `a parenthesis written in the text of a comment opened by a solidus, a star and a solidus, which closes the feature to the parser`,
			code: `@media (a: 1 /*/ ) */ ) { a { b: c; } }`,
		},
		{
			// The address is named by the spelling the file carries, so an escape inside the name is one a reader of the address resolves
			description: `a feature holding an address whose name is written with a hexadecimal escape, its whitespace left as it stands`,
			code: `@media (c: \\75 rl( a b )) { a { b: 1px } }`,
		},
		{
			description: `a space behind the parenthesis of a feature the file never closes, which ends on no parenthesis and is passed over whole`,
			code: `@media ( a: 1 { a { b: c; } }`,
		},
	],

	reject: [
		{
			description: `the same call holding a string with a closing parenthesis, where emptying the run behind its parenthesis would close the address's token inside that string and leave its quotation mark unpaired`,
			code: `@media (a: \\61 url( b ")" c )) { d { e: f } }`,
			fixed: `@media (a: \\61 url( b ")" c)) { d { e: f } }`,
			warnings: [
				{
					line: 1,
					column: 17,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 28,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// A string opening the parentheses makes them a call's to every tokenizer, so they are closed up as any call's
			description: `a spaced quoted address with a spaced call among its arguments`,
			code: `@media (c: url( "x", f( 1 ) )) {}`,
			fixed: `@media (c: url("x", f(1))) {}`,
			warnings: [
				{
					line: 1,
					column: 13,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 28,
					message: messages.rejectedClosing,
				},
				{
					line: 1,
					column: 23,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 26,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `such a feature standing beside one the file does spell, whose whitespace is taken away while the text of the comment is left as it stands`,
			code: `@media ( a: 1 ) and (b: 2 /*/ ) */ ) { a { b: c; } }`,
			fixed: `@media (a: 1) and (b: 2 /*/ ) */ ) { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 14,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `two spaces after the opening parenthesis`,
			code: `@media (  min-width: 700px) {}`,
			fixed: `@media (min-width: 700px) {}`,
			line: 1,
			column: 9,
			message: messages.rejectedOpening,
		},
		{
			description: `two spaces before the closing parenthesis`,
			code: `@media (min-width: 700px  ) {}`,
			fixed: `@media (min-width: 700px) {}`,
			line: 1,
			column: 26,
			message: messages.rejectedClosing,
		},
		{
			description: `a tab and a space after the opening parenthesis`,
			code: `@media (\t  min-width: 700px) {}`,
			fixed: `@media (min-width: 700px) {}`,
			line: 1,
			column: 9,
			message: messages.rejectedOpening,
		},
		{
			description: `a tab before the closing parenthesis`,
			code: `@media (min-width: 700px\t) {}`,
			fixed: `@media (min-width: 700px) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedClosing,
		},
		{
			description: `a space before the closing parenthesis`,
			code: `@media (max-width: 300px ) {}`,
			fixed: `@media (max-width: 300px) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedClosing,
		},
		{
			description: `a space before the closing parenthesis, under a mixed-case at-rule name`,
			code: `@mEdIa (max-width: 300px ) {}`,
			fixed: `@mEdIa (max-width: 300px) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedClosing,
		},
		{
			description: `a space before the closing parenthesis of a feature whose value is a comment`,
			code: `@MEDIA (max-width: /*comment*/ ) {}`,
			fixed: `@MEDIA (max-width: /*comment*/) {}`,
			line: 1,
			column: 31,
			message: messages.rejectedClosing,
		},
		{
			description: `a space before the closing parenthesis, under an upper-case at-rule name`,
			code: `@MEDIA (max-width: 300px ) {}`,
			fixed: `@MEDIA (max-width: 300px) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedClosing,
		},
		{
			description: `a space after the opening parenthesis`,
			code: `@media ( max-width: 300px) {}`,
			fixed: `@media (max-width: 300px) {}`,
			line: 1,
			column: 9,
			message: messages.rejectedOpening,
		},
		{
			description: `a space after the opening parenthesis of a feature whose value is a comment`,
			code: `@media ( max-width: /*comment*/) {}`,
			fixed: `@media (max-width: /*comment*/) {}`,
			line: 1,
			column: 9,
			message: messages.rejectedOpening,
		},
		{
			description: `a space before the closing parenthesis of the first feature of a query list`,
			code: `@media screen and (color ), projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 25,
			message: messages.rejectedClosing,
		},
		{
			description: `a space after the opening parenthesis of the first feature of a query list`,
			code: `@media screen and ( color), projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 20,
			message: messages.rejectedOpening,
		},
		{
			description: `a space before the closing parenthesis of the second feature of a query list`,
			code: `@media screen and (color), projection and (color ) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 49,
			message: messages.rejectedClosing,
		},
		{
			description: `a space after the opening parenthesis of the second feature of a query list`,
			code: `@media screen and (color), projection and ( color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 44,
			message: messages.rejectedOpening,
		},
		{
			description: `a space before the closing parenthesis of the second of two features joined by and`,
			code: `@media (grid) and (max-width: 15em ) {}`,
			fixed: `@media (grid) and (max-width: 15em) {}`,
			line: 1,
			column: 35,
			message: messages.rejectedClosing,
		},
		{
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash, so the feature behind it is read`,
			code: `@media (myurl(//a)) and ( min-width:1px ) { c {} }`,
			fixed: `@media (myurl(//a)) and (min-width:1px) { c {} }`,
			warnings: [
				{
					line: 1,
					column: 26,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 40,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a feature standing behind a comment the value parser does not give back as it read it`,
			code: `@media (min-width:1px) and x/*/*a*/( max-width:2px ) { a { b: c; } }`,
			fixed: `@media (min-width:1px) and x/*/*a*/(max-width:2px) { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 37,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 51,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a feature standing beside a comment opening with a solidus, a star and a solidus, whose text spells a feature of its own that the value parser hands back as one`,
			code: `@media ( a: 1 ) /*/ ( b: 2 ) */ and (c: 3) { a { b: c; } }`,
			fixed: `@media (a: 1) /*/ ( b: 2 ) */ and (c: 3) { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 14,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a feature in front of a comment holding one quotation mark, and a feature of the same spelling inside a string behind that comment: the mark the comment holds opens no string, so the string the file spells is one, and its text is no feature`,
			code: `@media ( b: 2 ) /*/ " */ and (c: "( b: 2 )") { a { c: d; } }`,
			fixed: `@media (b: 2) /*/ " */ and (c: "( b: 2 )") { a { c: d; } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 14,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `the whitespace in front of the closing parenthesis of a feature holding a comment opening with a solidus, a star and a solidus, reported at the character in front of the parenthesis as it is for the twin holding a comment of that width the value parser gives back as it read it, rather than a column further on`,
			code: `@media (a: 1 /*/ c */ ) { a { b: c; } }`,
			fixed: `@media (a: 1 /*/ c */) { a { b: c; } }`,
			line: 1,
			column: 22,
			message: messages.rejectedClosing,
		},
		{
			description: `spaces around vertical tabs inside a feature, which the tokenizer reads as characters of the feature, so the spaces go and the tabs stay`,
			code: `@media ( \va\v ) { a { b: c; } }`,
			fixed: `@media (\va\v) { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 13,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// Taking the run behind the `(` of an address away hands the tokenizer the parenthesis of the string as the address's end, and the file stops parsing
			description: `a feature holding an address whose string holds a closing parenthesis, whose whitespace is taken away while the address keeps its own`,
			code: `@media ( c: url( a ")" b ) ) { a { b: 1px } }`,
			fixed: `@media (c: url( a ")" b )) { a { b: 1px } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 27,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// The same run is what makes a comment inside an address a comment rather than characters of the address
			description: `the same feature holding an address with a comment in place of the string`,
			code: `@media ( c: url( a /* c */ ) ) { a { b: 1px } }`,
			fixed: `@media (c: url( a /* c */ )) { a { b: 1px } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 29,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a feature the file does spell beside one it never closes, whose whitespace goes while the unclosed one is left as it stands`,
			code: `@media ( a: 1 ) and ( b: 2 { a { b: c; } }`,
			fixed: `@media (a: 1) and ( b: 2 { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 14,
					message: messages.rejectedClosing,
				},
			],
		},
	],
})
