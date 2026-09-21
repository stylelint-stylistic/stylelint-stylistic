import less from "postcss-less"
import scss from "postcss-scss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import plugins from "../../index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			// See #533
			description: `a bare address holding a quotation mark, which a space behind the parenthesis would part from it and leave a file the parser refuses`,
			code: `a { b: url(a"b); }`,
		},
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale(); }`,
		},
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale( ); }`,
		},
		{
			description: `parentheses spelled inside a string, which open no call`,
			code: `a::before { content: "(a) ( a )"; }`,
		},
		{
			description: `the same parentheses spelled inside a url(), whose parentheses are the address's and no call's`,
			code: `a::before { background: url( 'asdf(Vcxvsd)ASD' ); }`,
		},
		{
			description: `spaces on the inside of both parentheses`,
			code: `a { transform: translate( 1, 1 ); }`,
		},
		{
			description: `nested calls, each with the spaces inside its own parentheses`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
		},
		{
			description: `SCSS map`,
			code: `$map: (key: value, key2: value2)`,
		},
		{
			description: `Sass list ignored`,
			code: `$list: (value, value2)`,
		},
		{
			// See #655
			description: `a vertical tab between single spaces inside a call, which the tokenizer reads as the call's argument, so each parenthesis already has its space`,
			code: `a { b: f( \v ); }`,
		},
		{
			// The sign ends the name to `@csstools/css-tokenizer`, so what the parentheses hold is the text of an address; the space used to be written into that text, in front of its first character (1789895915)
			description: `an address glued to a sign, holding what the parser reads as a block comment`,
			code: `a { b: 1!url(a /* c */ ) 1px; }`,
		},
	],

	reject: [
		{
			// The value parser closes the address on the comment's parenthesis, and the whitespace behind the opening one makes the comment a comment to the tokenizer
			description: `a call holding an address with a comment with a closing parenthesis, whose closing parenthesis stands against the address's`,
			code: `a { b: f(url( $a /* ) */)); }`,
			fixed: `a { b: f( url( $a /* ) */) ); }`,
			warnings: [
				{
					line: 1,
					column: 10,
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
			// See #588
			description: `an address whose name a backslash and a break divide from what stands in front, standing beside a call`,
			code: `a { b: \\\nurl(c.png) f(1px); }`,
			fixed: `a { b: \\\nurl(c.png) f( 1px ); }`,
			warnings: [
				{
					line: 2,
					column: 14,
					message: messages.expectedOpening,
				},
				{
					line: 2,
					column: 16,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// An address whose divider is glued to a word reads as a plain address
			description: `the same address with a word glued in front of the backslash, which the backslash ends`,
			code: `a { b: a\\\nurl(c.png) f(1px); }`,
			fixed: `a { b: a\\\nurl(c.png) f( 1px ); }`,
			warnings: [
				{
					line: 2,
					column: 14,
					message: messages.expectedOpening,
				},
				{
					line: 2,
					column: 16,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// The parser hands the divider back inside the word in front of the escape, since the space closing the escape divides the value to it, and the name is read welded across that space
			description: `an address spelling its name by a hexadecimal escape a space closes, holding a call, with a word and the divider in front of the escape`,
			code: `a { b: a\\\n\\75 rl(c(d).png) f(1px); }`,
			fixed: `a { b: a\\\n\\75 rl(c(d).png) f( 1px ); }`,
			warnings: [
				{
					line: 2,
					column: 20,
					message: messages.expectedOpening,
				},
				{
					line: 2,
					column: 22,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// See #533
			description: `a call standing beside an address written in capitals, whose parentheses are spaced out while the address is left as the file spells it`,
			code: `a { b: URL(a) f(1); }`,
			fixed: `a { b: URL(a) f( 1 ); }`,
			warnings: [
				{
					line: 1,
					column: 17,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 17,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// See #344, #533 and #669
			description: `a call whose name a hexadecimal escape welds to the word in front of it, which names no address and is spaced out like any other call, though the parser this plugin runs on reads the parentheses as an address's`,
			code: `a { b: \\61 url(1px); }`,
			fixed: `a { b: \\61 url( 1px ); }`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 18,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// See #669
			description: `the same call holding a bare address with a quotation mark, where the space would hand the parentheses to code and leave a string nothing closes, so the opening warning stands unfixed`,
			code: `a { b: \\61 url(a"b.png); }`,
			fixed: `a { b: \\61 url(a"b.png ); }`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 22,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// See #669
			description: `the same call holding a parenthesis nothing closes, which code reads as a group the parser finds open at the end of the declaration`,
			code: `a { b: \\61 url(a(b.png); }`,
			fixed: `a { b: \\61 url(a(b.png ); }`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 22,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// See #669
			description: `the same call holding a square bracket, which leaves the parentheses one plain token closed where the address's token closed, so both spaces are written`,
			code: `a { b: \\61 url(a[b]c.png); }`,
			fixed: `a { b: \\61 url( a[b]c.png ); }`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 24,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// See #669
			description: `the same call standing inside a call PostCSS read as code, which leaves every parenthesis to that call's first closing one code as well, so the square bracket opens a group nothing closes`,
			code: `a { b: f( \\61 url(c[d.png) ); }`,
			fixed: `a { b: f( \\61 url(c[d.png ) ); }`,
			warnings: [
				{
					line: 1,
					column: 19,
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
			description: `a first argument abutting the opening parenthesis`,
			code: `a { transform: translate(1, 1 ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpening,
		},
		{
			description: `a last argument abutting the closing parenthesis`,
			code: `a { transform: translate( 1, 1); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 30,
			message: messages.expectedClosing,
		},
		{
			description: `two spaces behind the opening parenthesis`,
			code: `a { transform: translate(  1, 1 ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpening,
		},
		{
			description: `two spaces in front of the closing parenthesis`,
			code: `a { transform: translate( 1, 1  ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 32,
			message: messages.expectedClosing,
		},
		{
			description: `the outer opening parenthesis abutting the inner call`,
			code: `a { color: color(rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 18,
			message: messages.expectedOpening,
		},
		{
			description: `an inner call abutting its own opening parenthesis`,
			code: `a { color: color( rgb(0, 0, 0 ) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 23,
			message: messages.expectedOpening,
		},
		{
			description: `an inner call abutting its own closing parenthesis`,
			code: `a { color: color( rgb( 0, 0, 0) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 30,
			message: messages.expectedClosing,
		},
		{
			description: `the second inner call abutting its opening parenthesis`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness(50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 44,
			message: messages.expectedOpening,
		},
		{
			description: `the second inner call abutting its closing parenthesis`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50%) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 47,
			message: messages.expectedClosing,
		},
		{
			description: `the outer closing parenthesis abutting the inner one`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% )); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 49,
			message: messages.expectedClosing,
		},
		{
			description: `an argument abutting the opening parenthesis of a one-argument call`,
			code: `a::before { content: attr(data-foo ); }`,
			fixed: `a::before { content: attr( data-foo ); }`,
			line: 1,
			column: 27,
			message: messages.expectedOpening,
		},
		{
			description: `the same argument abutting the closing parenthesis instead`,
			code: `a::before { content: attr( data-foo); }`,
			fixed: `a::before { content: attr( data-foo ); }`,
			line: 1,
			column: 35,
			message: messages.expectedClosing,
		},
		{
			description: `a call broken across lines whose first argument abuts the parenthesis`,
			code: `
				a { transform: translate(
				  1,
				  1 ); }
			`,
			fixed: `
				a { transform: translate( 1,
				  1 ); }
			`,
			line: 1,
			column: 26,
			message: messages.expectedOpening,
		},
		{
			description: `the same call with a tab in front of the closing parenthesis`,
			code: `
				a { transform: translate( 1,
				  1
					); }
			`,
			fixed: `
				a { transform: translate( 1,
				  1 ); }
			`,
			line: 3,
			column: 1,
			message: messages.expectedClosing,
		},
		{
			description: `CRLF`,
			code: `a { transform: translate(1,\r\n1 ); }`,
			fixed: `a { transform: translate( 1,\r\n1 ); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpening,
		},
		{
			description: `comments`,
			code: `a { transform: translate(/*comment*/1, 1/*comment*/); }`,
			fixed: `a { transform: translate( /*comment*/1, 1/*comment*/ ); }`,
			warnings: [
				{
					line: 1,
					column: 26,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 51,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// See #506 and #508
			description: `a comment holding a parenthesis between two quotation marks it closes around them: the string those marks open reaches past nothing, so the mask leaves them where they stand and the parenthesis stays the comment's`,
			code: `a { b: g(1 /*/ "(" */ 2); }`,
			fixed: `a { b: g( 1 /*/ "(" */ 2 ); }`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 23,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// See #506 and #508
			// See #508
			description: `a call holding a comment with one quotation mark and a string behind it: the string the mark of the comment used to open took the parenthesis the file closes the call on, and the rule read nothing of a call the parser never closed`,
			code: `a { b: g(1 /*/ " */ "1"); }`,
			fixed: `a { b: g( 1 /*/ " */ "1" ); }`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 23,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// See #655
			description: `vertical tabs abutting both parentheses, which the tokenizer reads as characters of the argument, so each space is written between a parenthesis and a tab`,
			code: `a { b: f(\vc\v); }`,
			fixed: `a { b: f( \vc\v ); }`,
			warnings: [
				{
					line: 1,
					column: 10,
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
	config: [`always-single-line`],

	accept: [
		{
			// See #533
			description: `a bare address, whose parentheses are the address's and no call's`,
			code: `a { b: url(a); }`,
		},
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale(); }`,
		},
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale( ); }`,
		},
		{
			description: `parentheses spelled inside a string, which open no call`,
			code: `a::before { content: "(a) ( a )"; }`,
		},
		{
			description: `the same parentheses spelled inside a url(), whose parentheses are the address's and no call's`,
			code: `a::before { background: url( 'asdf(Vcxvsd)ASD' ); }`,
		},
		{
			description: `spaces on the inside of both parentheses`,
			code: `a { transform: translate( 1, 1 ); }`,
		},
		{
			description: `nested calls, each with the spaces inside its own parentheses`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
		},
		{
			description: `a multi-line call, which this option passes over`,
			code: `
				a { transform: translate(
				  1,
				  1
				); }
			`,
		},
		{
			description: `the same call with spaces and a tab of its own`,
			code: `a { transform: translate(  \n  1,\n  1\n\t); }`,
		},
		{
			description: `CRLF`,
			code: `a { transform: translate(1,\r\n1); }`,
		},
		{
			description: `a multi-line inner call inside a single-line outer one`,
			code: `
				a { color: color(rgb(0,
				0,
				0 ) lightness( 50% )); }
			`,
		},
		{
			description: `SCSS map`,
			code: `$map: (key: value, key2: value2)`,
		},
	],

	reject: [
		{
			// See #669
			description: `a call whose name a hexadecimal escape welds to the word in front of it, holding a bare address with a quotation mark, where the space would hand the parentheses to code and leave a string nothing closes`,
			code: `a { b: \\61 url(a"b.png); }`,
			fixed: `a { b: \\61 url(a"b.png ); }`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.expectedOpeningSingleLine,
				},
				{
					line: 1,
					column: 22,
					message: messages.expectedClosingSingleLine,
				},
			],
		},
		{
			// See #244
			description: `form feeds inside the parentheses, which are whitespace and no line break, so the function is single-line and the option asks for a space on the inside`,
			code: `a { b: fn(\f1px\f); }`,
			fixed: `a { b: fn( 1px ); }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.expectedOpeningSingleLine,
				},
				{
					line: 1,
					column: 15,
					message: messages.expectedClosingSingleLine,
				},
			],
		},
		{
			description: `the second inner call abutting its opening parenthesis, the first broken across lines`,
			code: `
				a { color: color(rgb(0,
				0,
				0 ) lightness(50% )); }
			`,
			fixed: `
				a { color: color(rgb(0,
				0,
				0 ) lightness( 50% )); }
			`,
			line: 3,
			column: 15,
			message: messages.expectedOpeningSingleLine,
		},
		{
			description: `a first argument abutting the opening parenthesis`,
			code: `a { transform: translate(1, 1 ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpeningSingleLine,
		},
		{
			description: `a last argument abutting the closing parenthesis`,
			code: `a { transform: translate( 1, 1); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 30,
			message: messages.expectedClosingSingleLine,
		},
		{
			description: `two spaces behind the opening parenthesis`,
			code: `a { transform: translate(  1, 1 ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpeningSingleLine,
		},
		{
			description: `two spaces in front of the closing parenthesis`,
			code: `a { transform: translate( 1, 1  ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 32,
			message: messages.expectedClosingSingleLine,
		},
		{
			description: `the outer opening parenthesis abutting the inner call`,
			code: `a { color: color(rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 18,
			message: messages.expectedOpeningSingleLine,
		},
		{
			description: `an inner call abutting its own opening parenthesis`,
			code: `a { color: color( rgb(0, 0, 0 ) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 23,
			message: messages.expectedOpeningSingleLine,
		},
		{
			description: `an inner call abutting its own closing parenthesis`,
			code: `a { color: color( rgb( 0, 0, 0) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 30,
			message: messages.expectedClosingSingleLine,
		},
		{
			description: `the second inner call abutting its opening parenthesis`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness(50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 44,
			message: messages.expectedOpeningSingleLine,
		},
		{
			description: `the second inner call abutting its closing parenthesis`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50%) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 47,
			message: messages.expectedClosingSingleLine,
		},
		{
			description: `the outer closing parenthesis abutting the inner one`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% )); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 49,
			message: messages.expectedClosingSingleLine,
		},
		{
			description: `an argument abutting the opening parenthesis of a one-argument call`,
			code: `a::before { content: attr(data-foo ); }`,
			fixed: `a::before { content: attr( data-foo ); }`,
			line: 1,
			column: 27,
			message: messages.expectedOpeningSingleLine,
		},
		{
			description: `the same argument abutting the closing parenthesis instead`,
			code: `a::before { content: attr( data-foo); }`,
			fixed: `a::before { content: attr( data-foo ); }`,
			line: 1,
			column: 35,
			message: messages.expectedClosingSingleLine,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			// See #533
			description: `the spaces inside a quoted address's own parentheses, where postcss-scss would read a token of a string holding a parenthesis`,
			code: `a { b: url( "a", format("woff2") ); }`,
		},
		{
			// See #378
			description: `a call the value parser closed on a parenthesis standing inside a comment opening with a solidus, a star and a solidus, which is no parenthesis the file writes, so the call is left alone as one closed inside an end-of-line comment is`,
			code: `a { b: f(1 /*/ ) */ ); }`,
		},
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale(); }`,
		},
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale( ); }`,
		},
		{
			description: `parentheses spelled inside a string, which open no call`,
			code: `a::before { content: "(a) ( a )"; }`,
		},
		{
			description: `the same parentheses spelled inside a url(), whose parentheses are the address's and no call's`,
			code: `a::before { background: url('asdf( Vcxvsd )ASD'); }`,
		},
		{
			description: `a call whose arguments abut both parentheses`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `nested calls, all of them abutting their parentheses`,
			code: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
		},
		{
			description: `SCSS map`,
			code: `$map: ( key: value, key2: value2 )`,
		},
	],

	reject: [
		{
			// See #560
			description: `a call among the arguments behind a quoted address, which are those of any call while the spaces of the address's own parentheses stay`,
			code: `a { b: url( "a", format( "woff2" ) ); }`,
			fixed: `a { b: url( "a", format("woff2") ); }`,
			warnings: [
				{
					line: 1,
					column: 25,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 33,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// See #669
			description: `a call whose name a hexadecimal escape welds to the word in front of it, holding a string with a closing parenthesis, where emptying the run would close the address's token inside that string and leave its quotation mark unpaired`,
			code: `a { b: \\61 url( a ")" b ); }`,
			fixed: `a { b: \\61 url( a ")" b); }`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 24,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// See #660 and #669
			description: `the same call holding a block comment with a closing parenthesis, where emptying the run would open the address's token inside the comment and leave the comment unopened`,
			code: `a { b: \\61 url( a /* ) */ ); }`,
			fixed: `a { b: \\61 url( a /* ) */); }`,
			warnings: [
				{
					line: 1,
					column: 16,
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
			// The value parser closes such an address on the string's parenthesis
			description: `a call inside a string holding a closing parenthesis inside an address the tokenizer's whitespace parts from its parenthesis, beside one of the value`,
			code: `a { b: url( a ") f( 1 )" ), f( 1 ); }`,
			fixed: `a { b: url( a ") f( 1 )" ), f(1); }`,
			warnings: [
				{
					line: 1,
					column: 31,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 33,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// See #533
			description: `an address standing beside the call that names its format, which is spaced out while the address is left as the file spells it`,
			code: `@font-face { src: url( "a.woff2" ) format( "woff2" ); }`,
			fixed: `@font-face { src: url( "a.woff2" ) format("woff2"); }`,
			warnings: [
				{
					line: 1,
					column: 43,
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
			// See #533
			description: `a call standing beside a bare address, whose parentheses are closed up while the address is left as the file spells it`,
			code: `a { b: url( a ) f( 1 ); }`,
			fixed: `a { b: url( a ) f(1); }`,
			warnings: [
				{
					line: 1,
					column: 19,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 21,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a space behind the opening parenthesis`,
			code: `a { transform: translate( 1, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 26,
			message: messages.rejectedOpening,
		},
		{
			description: `two spaces behind the opening parenthesis`,
			code: `a { transform: translate(  1, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 26,
			message: messages.rejectedOpening,
		},
		{
			description: `a space in front of the closing parenthesis`,
			code: `a { transform: translate(1, 1 ); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 30,
			message: messages.rejectedClosing,
		},
		{
			description: `two spaces in front of the closing parenthesis`,
			code: `a { transform: translate(1, 1  ); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 31,
			message: messages.rejectedClosing,
		},
		{
			description: `a space behind the outer opening parenthesis`,
			code: `a { color: color( rgb(0, 0, 0) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 18,
			message: messages.rejectedOpening,
		},
		{
			description: `a space behind an inner opening parenthesis`,
			code: `a { color: color(rgb( 0, 0, 0) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 22,
			message: messages.rejectedOpening,
		},
		{
			description: `a space in front of an inner closing parenthesis`,
			code: `a { color: color(rgb(0, 0, 0 ) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 29,
			message: messages.rejectedClosing,
		},
		{
			description: `a space behind the second inner opening parenthesis`,
			code: `a { color: color(rgb(0, 0, 0) lightness( 50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 41,
			message: messages.rejectedOpening,
		},
		{
			description: `a space in front of the second inner closing parenthesis`,
			code: `a { color: color(rgb(0, 0, 0) lightness(50% )); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 44,
			message: messages.rejectedClosing,
		},
		{
			description: `a space in front of the outer closing parenthesis`,
			code: `a { color: color(rgb(0, 0, 0) lightness(50%) ); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 45,
			message: messages.rejectedClosing,
		},
		{
			description: `a space in front of the closing parenthesis of a one-argument call`,
			code: `a::before { content: attr(data-foo ); }`,
			fixed: `a::before { content: attr(data-foo); }`,
			line: 1,
			column: 35,
			message: messages.rejectedClosing,
		},
		{
			description: `a space behind its opening parenthesis instead`,
			code: `a::before { content: attr( data-foo); }`,
			fixed: `a::before { content: attr(data-foo); }`,
			line: 1,
			column: 27,
			message: messages.rejectedOpening,
		},
		{
			description: `a space behind the opening parenthesis of a call broken at its comma`,
			code: `a { transform: translate( 1,\n1); }`,
			fixed: `a { transform: translate(1,\n1); }`,
			line: 1,
			column: 26,
			message: messages.rejectedOpening,
		},
		{
			description: `CRLF`,
			code: `a { transform: translate(1,\r\n  1\r\n); }`,
			fixed: `a { transform: translate(1,\r\n  1); }`,
			line: 2,
			column: 5,
			message: messages.rejectedClosing,
		},
		{
			description: `a space in front of the closing parenthesis of a multi-line inner call`,
			code: `
				a { color: color(rgb(0,
				0,
				0 ) lightness(50%)); }
			`,
			fixed: `
				a { color: color(rgb(0,
				0,
				0) lightness(50%)); }
			`,
			line: 3,
			column: 2,
			message: messages.rejectedClosing,
		},
		{
			description: `comments`,
			code: `a { transform: translate( /*comment*/ 1, 1 /*comment*/ ); }`,
			fixed: `a { transform: translate(/*comment*/ 1, 1 /*comment*/); }`,
			warnings: [
				{
					line: 1,
					column: 26,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 55,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// See #225
			description: `a double slash of plain CSS opens no comment, so the parenthesis has a line to join and the fix is written`,
			code: `
				a {
					b: translate(1px//c
					);
				}
			`,
			fixed: `
				a {
					b: translate(1px//c);
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedClosing,
		},
		{
			// See #280
			description: `a line break in front of the first argument behind a double slash of plain CSS, which spells no comment there: the guard holds nothing back and the whitespace goes`,
			code: `
				a {
					t: foo(1px // c) calc(
					2px);
				}
			`,
			fixed: `
				a {
					t: foo(1px // c) calc(2px);
				}
			`,
			line: 2,
			column: 24,
			message: messages.rejectedOpening,
		},
		{
			// See #272
			description: `a call standing behind a comment the value parser does not give back as it read it`,
			code: `a { b: x/*/*a*/f( 1 )c; }`,
			fixed: `a { b: x/*/*a*/f(1)c; }`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 20,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// See #378
			description: `a call standing beside a comment opening with a solidus, a star and a solidus, whose text spells a call of its own that the value parser hands back as a call`,
			code: `a { b: g( 1 ) /*/ f( 1 ) */ 3; }`,
			fixed: `a { b: g(1) /*/ f( 1 ) */ 3; }`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 12,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// See #508
			description: `a call in front of a comment holding one quotation mark, and the same text inside a string behind that comment: the mark the comment holds opens no string, so the string the file spells is one, and its text is no call`,
			code: `a { b: f( 1 ) /*/ " */ "f( 1 )"; }`,
			fixed: `a { b: f(1) /*/ " */ "f( 1 )"; }`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 12,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// See #506
			description: `the whitespace in front of the closing parenthesis of a call holding a comment opening with a solidus, a star and a solidus, reported at the character in front of the parenthesis as it is for the twin holding a comment of that width the value parser gives back as it read it, rather than a column further on`,
			code: `a { b: f(2 /*/ c */ ); }`,
			fixed: `a { b: f(2 /*/ c */); }`,
			line: 1,
			column: 20,
			message: messages.rejectedClosing,
		},
		{
			// See #655
			description: `spaces around vertical tabs inside a call, which the tokenizer reads as characters of the argument, so the spaces go and the tabs stay`,
			code: `a { b: f( \vc\v ); }`,
			fixed: `a { b: f(\vc\v); }`,
			warnings: [
				{
					line: 1,
					column: 10,
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

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			// See #533
			description: `a bare address, whose parentheses are the address's and no call's`,
			code: `a { b: url( a ); }`,
		},
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale(); }`,
		},
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale( ); }`,
		},
		{
			description: `parentheses spelled inside a string, which open no call`,
			code: `a::before { content: "(a) ( a )"; }`,
		},
		{
			description: `the same parentheses spelled inside a url(), whose parentheses are the address's and no call's`,
			code: `a::before { background: url('asdf( Vcxvsd )ASD'); }`,
		},
		{
			description: `a call whose arguments abut both parentheses`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `nested calls, all of them abutting their parentheses`,
			code: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
		},
		{
			description: `a multi-line call, which this option passes over`,
			code: `a { transform: translate( 1,\n1 ); }`,
		},
		{
			description: `CRLF`,
			code: `a { transform: translate(\r\n  1,\r\n  1\r\n); }`,
		},
		{
			description: `a multi-line inner call inside a single-line outer one`,
			code: `
				a { color: color(rgb(0,
				0,
				0 ) lightness(50%)); }
			`,
		},
		{
			description: `SCSS map`,
			code: `$map: ( key: value, key2: value2 )`,
		},
	],

	reject: [
		{
			// See #669
			description: `the same call holding a string with a closing parenthesis, where emptying the run would close the address's token inside that string and leave its quotation mark unpaired`,
			code: `a { b: \\61 url( a ")" b ); }`,
			fixed: `a { b: \\61 url( a ")" b); }`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.rejectedOpeningSingleLine,
				},
				{
					line: 1,
					column: 24,
					message: messages.rejectedClosingSingleLine,
				},
			],
		},
		{
			description: `a space behind the opening parenthesis of the single-line inner call`,
			code: `
				a { color: color(rgb(0,
				0,
				0) lightness( 50%)); }
			`,
			fixed: `
				a { color: color(rgb(0,
				0,
				0) lightness(50%)); }
			`,
			line: 3,
			column: 14,
			message: messages.rejectedOpeningSingleLine,
		},
		{
			description: `a space behind the opening parenthesis`,
			code: `a { transform: translate( 1, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 26,
			message: messages.rejectedOpeningSingleLine,
		},
		{
			description: `two spaces behind the opening parenthesis`,
			code: `a { transform: translate(  1, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 26,
			message: messages.rejectedOpeningSingleLine,
		},
		{
			description: `a space in front of the closing parenthesis`,
			code: `a { transform: translate(1, 1 ); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 30,
			message: messages.rejectedClosingSingleLine,
		},
		{
			description: `two spaces in front of the closing parenthesis`,
			code: `a { transform: translate(1, 1  ); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 31,
			message: messages.rejectedClosingSingleLine,
		},
		{
			description: `a space behind the outer opening parenthesis`,
			code: `a { color: color( rgb(0, 0, 0) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 18,
			message: messages.rejectedOpeningSingleLine,
		},
		{
			description: `a space behind an inner opening parenthesis`,
			code: `a { color: color(rgb( 0, 0, 0) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 22,
			message: messages.rejectedOpeningSingleLine,
		},
		{
			description: `a space in front of an inner closing parenthesis`,
			code: `a { color: color(rgb(0, 0, 0 ) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 29,
			message: messages.rejectedClosingSingleLine,
		},
		{
			description: `a space behind the second inner opening parenthesis`,
			code: `a { color: color(rgb(0, 0, 0) lightness( 50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 41,
			message: messages.rejectedOpeningSingleLine,
		},
		{
			description: `a space in front of the second inner closing parenthesis`,
			code: `a { color: color(rgb(0, 0, 0) lightness(50% )); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 44,
			message: messages.rejectedClosingSingleLine,
		},
		{
			description: `a space in front of the outer closing parenthesis`,
			code: `a { color: color(rgb(0, 0, 0) lightness(50%) ); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 45,
			message: messages.rejectedClosingSingleLine,
		},
		{
			description: `a space in front of the closing parenthesis of a one-argument call`,
			code: `a::before { content: attr(data-foo ); }`,
			fixed: `a::before { content: attr(data-foo); }`,
			line: 1,
			column: 35,
			message: messages.rejectedClosingSingleLine,
		},
		{
			description: `a space behind its opening parenthesis instead`,
			code: `a::before { content: attr( data-foo); }`,
			fixed: `a::before { content: attr(data-foo); }`,
			line: 1,
			column: 27,
			message: messages.rejectedOpeningSingleLine,
		},
	],
})

// See #669
describe(`a call whose name the parser reads a url token by though no compiler does`, () => {
	let ruleOfSyntax = { css: ruleName, less: `@stylistic/less/function-parentheses-space-inside`, scss: `@stylistic/scss/function-parentheses-space-inside` }

	/**
	 * Fixes a text under a primary of this rule, the rule taken under the namespace of the syntax the file is parsed with, and checks what a lint of the output says.
	 * @param code - The text.
	 * @param syntax - Which syntax that is.
	 * @param primary - The primary option.
	 * @returns What the fix left and what a check of it says.
	 */
	async function fix (code: string, syntax: `css` | `less` | `scss`, primary: string): Promise<{
		fixed: string | undefined,
		left: string[],
	}> {
		let config = { plugins, rules: { [ruleOfSyntax[syntax]]: primary }, ...(syntax !== `css` && { customSyntax: syntax === `scss` ? scss : less }) }
		let ours = await stylelint.lint({ code, config, fix: true })
		let again = await stylelint.lint({ code: ours.code ?? code, config })

		return { fixed: ours.code, left: pick(again.results).warnings.map((warning) => `${warning.line}:${warning.column} ${warning.text}`) }
	}

	it(`leaves the run behind the parenthesis under postcss-scss, whose token counts the parentheses a string holds`, async () => {
		expect(await fix(String.raw`a { b: \61 url("a(b.png"); }`, `scss`, `always`)).toEqual({
			fixed: String.raw`a { b: \61 url("a(b.png" ); }`,
			left: [`1:16 Expected single space after "(" (@stylistic/scss/function-parentheses-space-inside)`],
		})
	})

	it(`leaves it under Less, which reads the parentheses by PostCSS's tokenizer`, async () => {
		expect(await fix(String.raw`a { b: \61 url(a"b.png); }`, `less`, `always`)).toEqual({
			fixed: String.raw`a { b: \61 url(a"b.png ); }`,
			left: [`1:16 Expected single space after "(" (@stylistic/less/function-parentheses-space-inside)`],
		})
	})

	it(`writes it where the parentheses close at one parenthesis under both readings`, async () => {
		expect(await fix(String.raw`a { b: \61 url(a.png); }`, `css`, `always`)).toEqual({ fixed: String.raw`a { b: \61 url( a.png ); }`, left: [] })
	})
})
