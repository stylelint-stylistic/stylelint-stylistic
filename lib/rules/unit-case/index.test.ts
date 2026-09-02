import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],

	accept: [
		{
			description: `a unitless number`,
			code: `a { line-height: 1; }`,
		},
		{
			description: `a hex colour, whose digits carry no unit`,
			code: `a { color: #000; }`,
		},
		{
			description: `a percentage`,
			code: `a { font-size: 100%; }`,
		},
		{
			description: `a unit after a fraction with no leading zero`,
			code: `a { font-size: .5rem; }`,
		},
		{
			description: `a unit after a fraction with a leading zero`,
			code: `a { font-size: 0.5rem; }`,
		},
		{
			description: `a lower-case unit`,
			code: `a { width: 10px; }`,
		},
		{
			description: `a run of values with lower-case units`,
			code: `a { margin: 0 10em 5rem 2in; }`,
		},
		{
			description: `a keyword pair and a pair of units in one value`,
			code: `a { background-position: top right, 1em 5vh; }`,
		},
		{
			description: `units inside a calc expression`,
			code: `a { top: calc(10em - 3em); }`,
		},
		{
			description: `units on either side of a multiplication inside calc`,
			code: `a { top: calc(10px*2rem); }`,
		},
		{
			description: `a unit inside a calc expression nested in a gradient`,
			code: `a { background-image: linear-gradient(to right, white calc(100% - 50em), silver); }`,
		},
		{
			description: `a unit inside the arguments of a function`,
			code: `a { transform: rotate(90deg); }`,
		},
		{
			description: `a keyword, which carries no unit`,
			code: `a { color: green; }`,
		},
		{
			description: `a keyword that ends in what looks like a unit`,
			code: `a { color: green10PX; }`,
		},
		{
			description: `a unit inside a comment, which the rule does not read`,
			code: `a { width: /* 100PX */ 1em; }`,
		},
		{
			description: `a unit inside a string`,
			code: `a::before { content: "10PX"}`,
		},
		{
			description: `a unit inside the name of an SCSS variable`,
			code: `a { font-size: $fs10PX; }`,
		},
		{
			description: `a unit inside the name of a Less variable`,
			code: `a { font-size: @fs10PX; }`,
		},
		{
			description: `a unit inside the name of a custom property`,
			code: `a { font-size: var(--some-fs-10PX); }`,
		},
		{
			description: `a unit inside the address of a url call`,
			code: `a { margin: url(13PX); }`,
		},
		{
			description: `the same call written in mixed case`,
			code: `a { margin: uRl(13PX); }`,
		},
		{
			description: `the same call written in upper case`,
			code: `a { margin: URL(13PX); }`,
		},
		{
			description: `a unit inside a property name`,
			code: `a { marginPX: 10px; }`,
		},
		{
			description: `a unit inside a type selector`,
			code: `a10PX { margin: 10px; }`,
		},
		{
			description: `a unit inside an id selector`,
			code: `#a10PX { margin: 10px; }`,
		},
		{
			description: `a unit inside a class selector`,
			code: `.a10PX { margin: 10px; }`,
		},
		{
			description: `a unit inside the value of an attribute selector`,
			code: `input[type=10PX] { margin: 10px; }`,
		},
		{
			description: `a unit inside a pseudo-class`,
			code: `a:hover10PX { margin: 10px; }`,
		},
		{
			description: `a unit inside a pseudo-element`,
			code: `a::before10PX { margin: 10px; }`,
		},
		{
			description: `a unit no specification knows, written in lower case`,
			code: `a { margin: 13xpx; }`,
		},
		{
			description: `a unit inside a media feature`,
			code: `@media (min-width: 10px) {}`,
		},
		{
			description: `a unit inside each of two media features`,
			code: `@media (min-width: 10px)\n  and (max-width: 20px) {}`,
		},
		{
			description: `a unit inside a negated media query`,
			code: `@media not screen and (min-width: 100px) {}`,
		},
		{
			description: `an at-rule that is neither a media query nor a variable`,
			code: `@import 'foo.css'`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/234
			description: `a lower-case unit in front of each of two bang flags, one of them spelled in capitals`,
			code: `a { b: 1px!IMPORTANT 2px!important; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/297
			description: `a capital in the part of a multiplication that carries no number, and so no unit either`,
			code: `a { b: 1px*A; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/297
			description: `the capital of an exponent in a part of a multiplication, which is a number and no unit of it`,
			code: `a { b: 10px*2E5; }`,
		},
	],

	reject: [
		{
			description: `a unit ending in a capital`,
			code: `a { width: 10pX; }`,
			fixed: `a { width: 10px; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`pX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `an upper-case unit standing between two braces that open and close no interpolation, one in each of two quoted strings`,
			code: `a { b: "{" 10PX "}"; }`,
			fixed: `a { b: "{" 10px "}"; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `the same unit standing between two braces written in comments`,
			code: `a { b: 1px /* { */ 10PX /* } */; }`,
			fixed: `a { b: 1px /* { */ 10px /* } */; }`,
			line: 1,
			column: 22,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `the same unit standing behind a brace written in a comment, in a set of media parameters`,
			code: `@media (min-width: /* { */ 10PX /* } */) { a { b: c; } }`,
			fixed: `@media (min-width: /* { */ 10px /* } */) { a { b: c; } }`,
			line: 1,
			column: 30,
			endLine: 1,
			endColumn: 32,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `an upper-case unit standing between the opening of a Sass interpolation written in one comment and the brace closing it in another, neither of which opens an interpolation of anything`,
			code: `a { b: 1px /* #{ */ 10PX /* } */; }`,
			fixed: `a { b: 1px /* #{ */ 10px /* } */; }`,
			line: 1,
			column: 23,
			endLine: 1,
			endColumn: 25,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `the same pair of comments written with the opening of a Less interpolation`,
			code: `a { b: 1px /* @{ */ 10PX /* } */; }`,
			fixed: `a { b: 1px /* @{ */ 10px /* } */; }`,
			line: 1,
			column: 23,
			endLine: 1,
			endColumn: 25,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `the same pair of comments written in a set of media parameters`,
			code: `@media (min-width: /* #{ */ 10PX /* } */) { a { b: c; } }`,
			fixed: `@media (min-width: /* #{ */ 10px /* } */) { a { b: c; } }`,
			line: 1,
			column: 31,
			endLine: 1,
			endColumn: 33,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `an upper-case unit in front of a text spelled the way postcss-simple-vars spells an interpolation, whitespace and all, and another unit inside that text`,
			code: `a { b: 1PX $(a 2PX); }`,
			fixed: `a { b: 1px $(a 2PX); }`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 11,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `an upper-case unit inside a block written as the value of a custom property, which is where plain CSS does let a bare brace stand in the code`,
			code: `a { --x: 1px { 10PX } 2px; }`,
			fixed: `a { --x: 1px { 10px } 2px; }`,
			line: 1,
			column: 18,
			endLine: 1,
			endColumn: 20,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `a unit opening with a capital`,
			code: `a { width: 10Px; }`,
			fixed: `a { width: 10px; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`Px`, `px`),
		},
		{
			description: `a unit in upper case`,
			code: `a { width: 10PX; }`,
			fixed: `a { width: 10px; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `the second of two units in upper case`,
			code: `a { margin: 10px 10PX; }`,
			fixed: `a { margin: 10px 10px; }`,
			line: 1,
			column: 20,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit after a fraction with no leading zero`,
			code: `a { font-size: .5REM; }`,
			fixed: `a { font-size: .5rem; }`,
			line: 1,
			column: 18,
			endLine: 1,
			endColumn: 21,
			message: messages.expected(`REM`, `rem`),
		},
		{
			description: `an upper-case unit after a fraction with a leading zero`,
			code: `a { font-size: 0.5REM; }`,
			fixed: `a { font-size: 0.5rem; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(`REM`, `rem`),
		},
		{
			description: `an upper-case unit inside a calc expression`,
			code: `a { margin: calc(10px + 10PX); }`,
			fixed: `a { margin: calc(10px + 10px); }`,
			line: 1,
			column: 27,
			endLine: 1,
			endColumn: 29,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit after a multiplication inside calc`,
			code: `a { top: calc(10px*2REM); }`,
			fixed: `a { top: calc(10px*2rem); }`,
			line: 1,
			column: 21,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`REM`, `rem`),
		},
		{
			description: `an upper-case unit inside a vendor-prefixed calc expression`,
			code: `a { margin: -webkit-calc(13PX + 10px); }`,
			fixed: `a { margin: -webkit-calc(13px + 10px); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 30,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit inside the arguments of a function no specification knows`,
			code: `a { margin: some-function(13PX + 10px); }`,
			fixed: `a { margin: some-function(13px + 10px); }`,
			line: 1,
			column: 29,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit in the value of a custom property`,
			code: `root { --margin: 10PX; }`,
			fixed: `root { --margin: 10px; }`,
			line: 1,
			column: 20,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit in a sum inside a custom property`,
			code: `root { --margin: 10px + 10PX; }`,
			fixed: `root { --margin: 10px + 10px; }`,
			line: 1,
			column: 27,
			endLine: 1,
			endColumn: 29,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `a unit no specification knows, written in upper case`,
			code: `a { margin: 13XPX; }`,
			fixed: `a { margin: 13xpx; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 18,
			message: messages.expected(`XPX`, `xpx`),
		},
		{
			description: `an upper-case unit inside a media feature`,
			code: `@media (min-width: 13PX) {}`,
			fixed: `@media (min-width: 13px) {}`,
			line: 1,
			column: 22,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA (min-width: 13PX) {}`,
			fixed: `@MEDIA (min-width: 13px) {}`,
			line: 1,
			column: 22,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@Media (min-width: 13PX) {}`,
			fixed: `@Media (min-width: 13px) {}`,
			line: 1,
			column: 22,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit in the second of two media features`,
			code: `@media (min-width: 10px)\n  and (max-width: 20PX) {}`,
			fixed: `@media (min-width: 10px)\n  and (max-width: 20px) {}`,
			line: 2,
			column: 21,
			endLine: 2,
			endColumn: 23,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit inside a media feature written in range syntax`,
			code: `@media (width < 10.01REM) {}`,
			fixed: `@media (width < 10.01rem) {}`,
			line: 1,
			column: 22,
			endLine: 1,
			endColumn: 25,
			message: messages.expected(`REM`, `rem`),
		},
		{
			description: `an upper-case unit inside a negated media query`,
			code: `@media not screen and (min-width: 100PX) {}`,
			fixed: `@media not screen and (min-width: 100px) {}`,
			line: 1,
			column: 38,
			endLine: 1,
			endColumn: 40,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit in a negated media query and another in its block`,
			code: `@media not screen and (min-width: 100PX) { width: 100Px; }`,
			fixed: `@media not screen and (min-width: 100px) { width: 100px; }`,
			warnings: [
				{
					line: 1,
					column: 38,
					endLine: 1,
					endColumn: 40,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 54,
					endLine: 1,
					endColumn: 56,
					message: messages.expected(`Px`, `px`),
				},
			],
		},
		{
			description: `an upper-case unit inside a url address and another beside it in the value`,
			code: `a { background: url("10PX.png") 10PX 20px no-repeat; }`,
			fixed: `a { background: url("10PX.png") 10px 20px no-repeat; }`,
			line: 1,
			column: 35,
			endLine: 1,
			endColumn: 37,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/234
			description: `an upper-case unit in front of each of two bang flags`,
			code: `a { b: 1PX!important 2PX!important; }`,
			fixed: `a { b: 1px!important 2px!important; }`,
			warnings: [
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 11,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 23,
					endLine: 1,
					endColumn: 25,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/272
			description: `a dimension standing behind a comment the value parser does not give back as it read it`,
			code: `a { b: x/*/*a*/10PX; }`,
			fixed: `a { b: x/*/*a*/10px; }`,
			line: 1,
			column: 18,
			endLine: 1,
			endColumn: 20,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/296
			description: `an upper-case unit behind a multiplication, in a word the rule reads part by part`,
			code: `a { b: 10px*2REM; }`,
			fixed: `a { b: 10px*2rem; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`REM`, `rem`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/296
			description: `an upper-case unit in the part of a multiplication that closes the word, the part in front of it carrying no unit`,
			code: `a { b: 2*10PX; }`,
			fixed: `a { b: 2*10px; }`,
			line: 1,
			column: 12,
			endLine: 1,
			endColumn: 14,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/297
			description: `three dimensions multiplied in one word, each of them carrying an upper-case unit`,
			code: `a { b: 10PX*2REM*3EM; }`,
			fixed: `a { b: 10px*2rem*3em; }`,
			warnings: [
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 12,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 17,
					message: messages.expected(`REM`, `rem`),
				},
				{
					line: 1,
					column: 19,
					endLine: 1,
					endColumn: 21,
					message: messages.expected(`EM`, `em`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/297
			description: `four dimensions of one and the same upper-case unit multiplied in one word`,
			code: `a { b: 1PX*2PX*3PX*4PX; }`,
			fixed: `a { b: 1px*2px*3px*4px; }`,
			warnings: [
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 11,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 13,
					endLine: 1,
					endColumn: 15,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 17,
					endLine: 1,
					endColumn: 19,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 21,
					endLine: 1,
					endColumn: 23,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/297
			description: `an upper-case unit in the part that closes a multiplication of three, both parts in front of it lower-case`,
			code: `a { b: 1px*2px*3EM; }`,
			fixed: `a { b: 1px*2px*3em; }`,
			line: 1,
			column: 17,
			endLine: 1,
			endColumn: 19,
			message: messages.expected(`EM`, `em`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/297
			description: `an upper-case unit in each of the two dimensions a doubled star stands between, which leaves a part holding nothing at all`,
			code: `a { b: 10PX**2REM; }`,
			fixed: `a { b: 10px**2rem; }`,
			warnings: [
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 12,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 15,
					endLine: 1,
					endColumn: 18,
					message: messages.expected(`REM`, `rem`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/297
			description: `an upper-case unit in a word a star closes, whose second part holds nothing`,
			code: `a { b: 10PX*; }`,
			fixed: `a { b: 10px*; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/297
			description: `a multiplication no part of which holds a miscased unit, standing beside a word that does, whose fix writes every edit the value collected`,
			code: `a { b: 1px*A 2PX; }`,
			fixed: `a { b: 1px*A 2px; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/297
			description: `two dimensions multiplied in the parameters of a media at-rule, where a part is counted off the parameter list rather than off a value`,
			code: `@media (min-width: 10PX*2REM) { a { b: c; } }`,
			fixed: `@media (min-width: 10px*2rem) { a { b: c; } }`,
			warnings: [
				{
					line: 1,
					column: 22,
					endLine: 1,
					endColumn: 24,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 26,
					endLine: 1,
					endColumn: 29,
					message: messages.expected(`REM`, `rem`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/296
			description: `an upper-case unit a hack unit stands behind, in front of a bang flag the value keeps`,
			code: `a { b: 1PX\\9!important 2px; }`,
			fixed: `a { b: 1px\\9!important 2px; }`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 11,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378
			description: `a dimension standing beside a comment opening with a solidus, a star and a solidus, whose text spells a dimension of its own that the value parser hands back as a word`,
			code: `a { b: 1PX /*/ 2PX */ 3; }`,
			fixed: `a { b: 1px /*/ 2PX */ 3; }`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 11,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378
			description: `dimensions behind a bare address holding a slash and a star, which every tokenizer reads as two characters of the address, so that the comment standing between the two dimensions is the only comment of the value`,
			code: `a { background: url(http://x.y/*.png) 1PX /* fallback */ 3PX; }`,
			fixed: `a { background: url(http://x.y/*.png) 1px /* fallback */ 3px; }`,
			warnings: [
				{
					line: 1,
					column: 40,
					endLine: 1,
					endColumn: 42,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 59,
					endLine: 1,
					endColumn: 61,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`upper`],

	accept: [
		{
			description: `a unitless number`,
			code: `a { line-height: 1; }`,
		},
		{
			description: `a hex colour, whose digits carry no unit`,
			code: `a { color: #000; }`,
		},
		{
			description: `a percentage`,
			code: `a { font-size: 100%; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `a lower-case unit in front of an interpolation whose text holds whitespace, in a custom property, which plain CSS carries as readily as either custom syntax does`,
			code: `a { --x: 10px#{$aB != $b}; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `the same interpolation written in a set of media parameters`,
			code: `@media (min-width: 10px#{$aB != $b}) { a { b: c; } }`,
		},
		{
			description: `a unit after a fraction with no leading zero`,
			code: `a { font-size: .5REM; }`,
		},
		{
			description: `a unit after a fraction with a leading zero`,
			code: `a { font-size: 0.5REM; }`,
		},
		{
			description: `an upper-case unit`,
			code: `a { width: 10PX; }`,
		},
		{
			description: `a run of values with upper-case units`,
			code: `a { margin: 0 10EM 5REM 2IN; }`,
		},
		{
			description: `a keyword pair and a pair of units in one value`,
			code: `a { background-position: top right, 1EM 5VH; }`,
		},
		{
			description: `units inside a calc expression`,
			code: `a { top: calc(10EM - 3EM); }`,
		},
		{
			description: `a unit inside a calc expression nested in a gradient`,
			code: `a { background-image: linear-gradient(to right, white calc(100% - 50EM), silver); }`,
		},
		{
			description: `a unit inside the arguments of a function`,
			code: `a { transform: rotate(90DEG); }`,
		},
		{
			description: `a keyword, which carries no unit`,
			code: `a { color: green; }`,
		},
		{
			description: `a keyword that ends in what looks like a unit`,
			code: `a { color: green10px; }`,
		},
		{
			description: `a unit inside a comment, which the rule does not read`,
			code: `a { width: /* 100px */ 1EM; }`,
		},
		{
			description: `a unit inside a string`,
			code: `a::before { content: "10px"}`,
		},
		{
			description: `a unit inside the name of an SCSS variable`,
			code: `a { font-size: $fs10px; }`,
		},
		{
			description: `a unit inside the name of a Less variable`,
			code: `a { font-size: @fs10px; }`,
		},
		{
			description: `a unit inside the name of a custom property`,
			code: `a { font-size: var(--some-fs-10px); }`,
		},
		{
			description: `a unit inside the address of a url call`,
			code: `a { margin: url(13px); }`,
		},
		{
			description: `a unit inside a property name`,
			code: `a { margin10px: 10PX; }`,
		},
		{
			description: `a unit inside a type selector`,
			code: `a10px { margin: 10PX; }`,
		},
		{
			description: `a unit inside an id selector`,
			code: `#a10px { margin: 10PX; }`,
		},
		{
			description: `a unit inside a class selector`,
			code: `.a10px { margin: 10PX; }`,
		},
		{
			description: `a unit inside the value of an attribute selector`,
			code: `input[type=10px] { margin: 10PX; }`,
		},
		{
			description: `a unit inside a pseudo-class`,
			code: `a:hover10px { margin: 10PX; }`,
		},
		{
			description: `a unit inside a pseudo-element`,
			code: `a::before10px { margin: 10PX; }`,
		},
		{
			description: `a unit no specification knows, written in upper case`,
			code: `a { margin: 13XPX; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/234
			description: `an upper-case unit in front of each of two bang flags, whose keyword is no unit`,
			code: `a { b: 1PX!important 2PX!important; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/234
			description: `a unit inside a string that ends in a bang flag`,
			code: `a::before { content: "10px!important"}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/297
			description: `a lower-case letter in the part of a multiplication that carries no number, and so no unit either`,
			code: `a { b: 1PX*a; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/297
			description: `the lower-case letter of an exponent in a part of a multiplication, which is a number and no unit of it`,
			code: `a { b: 10PX*2e5; }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/297
			description: `three dimensions multiplied in one word, each of them carrying a lower-case unit`,
			code: `a { b: 10px*2rem*3em; }`,
			fixed: `a { b: 10PX*2REM*3EM; }`,
			warnings: [
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 12,
					message: messages.expected(`px`, `PX`),
				},
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 17,
					message: messages.expected(`rem`, `REM`),
				},
				{
					line: 1,
					column: 19,
					endLine: 1,
					endColumn: 21,
					message: messages.expected(`em`, `EM`),
				},
			],
		},
		{
			description: `a unit ending in a capital`,
			code: `a { width: 10pX; }`,
			fixed: `a { width: 10PX; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`pX`, `PX`),
		},
		{
			description: `a unit opening with a capital`,
			code: `a { width: 10Px; }`,
			fixed: `a { width: 10PX; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`Px`, `PX`),
		},
		{
			description: `a unit in lower case`,
			code: `a { width: 10px; }`,
			fixed: `a { width: 10PX; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a lower-case unit after a fraction with no leading zero`,
			code: `a { font-size: .5rem; }`,
			fixed: `a { font-size: .5REM; }`,
			line: 1,
			column: 18,
			endLine: 1,
			endColumn: 21,
			message: messages.expected(`rem`, `REM`),
		},
		{
			description: `a lower-case unit after a fraction with a leading zero`,
			code: `a { font-size: 0.5rem; }`,
			fixed: `a { font-size: 0.5REM; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(`rem`, `REM`),
		},
		{
			description: `the second of two units in lower case`,
			code: `a { margin: 10PX 10px; }`,
			fixed: `a { margin: 10PX 10PX; }`,
			line: 1,
			column: 20,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a lower-case unit inside a calc expression`,
			code: `a { margin: calc(10PX + 10px); }`,
			fixed: `a { margin: calc(10PX + 10PX); }`,
			line: 1,
			column: 27,
			endLine: 1,
			endColumn: 29,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a lower-case unit inside a vendor-prefixed calc expression`,
			code: `a { margin: -webkit-calc(13px + 10PX); }`,
			fixed: `a { margin: -webkit-calc(13PX + 10PX); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 30,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a lower-case unit inside the arguments of a function no specification knows`,
			code: `a { margin: some-function(13px + 10PX); }`,
			fixed: `a { margin: some-function(13PX + 10PX); }`,
			line: 1,
			column: 29,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a lower-case unit in the value of a custom property`,
			code: `root { --margin: 10px; }`,
			fixed: `root { --margin: 10PX; }`,
			line: 1,
			column: 20,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a lower-case unit in a sum inside a custom property`,
			code: `root { --margin: 10PX + 10px; }`,
			fixed: `root { --margin: 10PX + 10PX; }`,
			line: 1,
			column: 27,
			endLine: 1,
			endColumn: 29,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a unit no specification knows, written in lower case`,
			code: `a { margin: 13xpx; }`,
			fixed: `a { margin: 13XPX; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 18,
			message: messages.expected(`xpx`, `XPX`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/233
		{
			description: `a lower-case unit on either side of a block comment the value holds`,
			code: `a { b: 1px /* c */ 2px; }`,
			fixed: `a { b: 1PX /* c */ 2PX; }`,
			warnings: [
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 11,
					message: messages.expected(`px`, `PX`),
				},
				{
					line: 1,
					column: 21,
					endLine: 1,
					endColumn: 23,
					message: messages.expected(`px`, `PX`),
				},
			],
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/233
		{
			description: `a lower-case unit in front of a block comment the parameters of a media query hold`,
			code: `@media (min-width: 100px /* c */) { a { color: red; } }`,
			fixed: `@media (min-width: 100PX /* c */) { a { color: red; } }`,
			line: 1,
			column: 23,
			endLine: 1,
			endColumn: 25,
			message: messages.expected(`px`, `PX`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/234
			description: `a lower-case unit in front of each of two bang flags`,
			code: `a { b: 1px!important 2px!important; }`,
			fixed: `a { b: 1PX!important 2PX!important; }`,
			warnings: [
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 11,
					message: messages.expected(`px`, `PX`),
				},
				{
					line: 1,
					column: 23,
					endLine: 1,
					endColumn: 25,
					message: messages.expected(`px`, `PX`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/234
			description: `a word whose whole unit is a bang flag, in front of a unit of the same declaration`,
			code: `a { b: 1!important 1px!important; }`,
			fixed: `a { b: 1!important 1PX!important; }`,
			line: 1,
			column: 21,
			endLine: 1,
			endColumn: 23,
			message: messages.expected(`px`, `PX`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/234
			description: `a lower-case unit in front of a bang flag that a hack unit follows`,
			code: `a { b: 1px!important\\9 2px!important; }`,
			fixed: `a { b: 1PX!important\\9 2PX!important; }`,
			warnings: [
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 11,
					message: messages.expected(`px`, `PX`),
				},
				{
					line: 1,
					column: 25,
					endLine: 1,
					endColumn: 27,
					message: messages.expected(`px`, `PX`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/296
			description: `a lower-case unit in front of a hack unit`,
			code: `a { b: 10px\\0; }`,
			fixed: `a { b: 10PX\\0; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`px`, `PX`),
		},
	],
})
