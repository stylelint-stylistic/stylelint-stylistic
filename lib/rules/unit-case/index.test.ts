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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			// The tokenizer reads the whole word as one identifier, and Sass, Less and `lightningcss` all print it back exactly as it stands: there is no dimension here to recase.
			description: `an upper-case unit inside a word an escape opens`,
			code: `a { b: \\*10PX; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			// CSS closes a hexadecimal escape with one whitespace character belonging to the escape rather than to the text, so this is one dimension token: `@csstools/css-tokenizer` reads its unit as `px`, a tab and `2PX`, and Sass, Less and `lightningcss` all print the line back exactly as it stands, none of them finding two values in it. The value parser hands the word back parted at that space, and the rule used to read `2PX` as a dimension of its own. The `\9` hack is taken out of the unit as ever, and the space it leaves behind ends what the rule names, so `2PX` stands behind the unit the way the name of a variable does.
			description: `a lower-case unit whose hack unit's escape swallows the whitespace in front of a second run of digits and letters`,
			code: `a { width: 10px\\9 2PX; }`,
		},
		{
			description: `the same word with a Windows pair in place of the space, which closes the escape as the one break it is`,
			code: `a { width: 10px\\9\r\n2PX; }`,
		},
		{
			description: `a chain of three such words, each escape welding the next word onto the one in front of it, so that the whole is one dimension whose unit is the first`,
			code: `a { width: 10px\\9 2px\\9 3PX; }`,
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
			description: `an upper-case unit behind a multiplication, in a word the rule reads dimension by dimension`,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/426
			description: `an upper-case unit with a hash welded to it, which opens no interpolation and is no part of the unit`,
			code: `a { b: 10PX#FFF; }`,
			fixed: `a { b: 10px#FFF; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/426
			description: `the same hash welded to the first of two multiplied dimensions, each of them carrying an upper-case unit`,
			code: `a { b: 1PX#FFF*2REM; }`,
			fixed: `a { b: 1px#FFF*2rem; }`,
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
					column: 17,
					endLine: 1,
					endColumn: 20,
					message: messages.expected(`REM`, `rem`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/413
			description: `an upper-case unit in the first part of a multiplication whose second part is a letter and no unit, which the fix leaves as it is`,
			code: `a { b: 1PX*A; }`,
			fixed: `a { b: 1px*A; }`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 11,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/413
			description: `an upper-case unit behind an exponent whose own capital is part of the number and stays as it is`,
			code: `a { b: 1E5PX; }`,
			fixed: `a { b: 1E5px; }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 13,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			// An escaped star is a code point of the identifier it stands in and parts no two dimensions: the tokenizer reads one dimension whose unit is `PX\*2REM`, Sass leaves the word whole where it multiplies the unescaped twin, and `lightningcss` prints it as it stands.
			description: `an upper-case unit welded by an escaped star to a second one`,
			code: `a { b: 10PX\\*2REM; }`,
			fixed: `a { b: 10px\\*2rem; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 18,
			message: messages.expected(`PX\\*2REM`, `px\\*2rem`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			description: `an upper-case unit with the name of a variable welded behind it, which is no part of the unit and stays as it was written`,
			code: `a { b: 10PX$VAR; }`,
			fixed: `a { b: 10px$VAR; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			// An escaped backslash and a digit are no hack unit: the tokenizer reads `10PX\\0` as one dimension whose unit is `PX\0`, and the hash behind it as a hash of its own. Taking two characters out of the middle of that word would leave every escape written behind them read from the wrong side, and the hash recased along with the unit.
			description: `an upper-case unit closing on an escaped backslash and a digit, with a hash welded behind it`,
			code: `a { b: 10PX\\\\0#FFF; }`,
			fixed: `a { b: 10px\\\\0#FFF; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 15,
			message: messages.expected(`PX\\\\0`, `px\\\\0`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			description: `the hack unit itself, one backslash and a digit, which is no part of the unit and stays where it is`,
			code: `a { b: 10PX\\0#FFF; }`,
			fixed: `a { b: 10px\\0#FFF; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			// A backslash opens no escape where a line break stands behind it: the grammar reads it as a delimiter, and the tokenizer this word as the dimension `10PX`, that delimiter, the break, and the identifier `\@VAR`. `postcss-value-parser` steps over whatever follows a backslash and hands the whole of it over as one word, so the unit has to end at the delimiter here.
			description: `an upper-case unit closing on a backslash a line break stands behind`,
			code: `a { b: 10PX\\\n\\@VAR; }`,
			fixed: `a { b: 10px\\\n\\@VAR; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			description: `the same word with a form feed in place of the line feed, which the grammar counts as the same break`,
			code: `a { b: 10PX\\\f\\@VAR; }`,
			fixed: `a { b: 10px\\\f\\@VAR; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			description: `an upper-case unit with an escaped hash welded to it`,
			code: `a { b: 10PX\\#FFF; }`,
			fixed: `a { b: 10px\\#fff; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`PX\\#FFF`, `px\\#fff`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/508
			description: `an upper-case unit in front of a comment holding one quotation mark, and the same unit inside a string behind that comment: the mark the comment holds opens no string, so the string the file spells is one, and its text is no dimension`,
			code: `a { b: 2PX /*/ " */ "2PX"; }`,
			fixed: `a { b: 2px /*/ " */ "2PX"; }`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 11,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			// A percent sign is no code point of an identifier, so it ends the unit without parting the word the value parser hands over: `@csstools/css-tokenizer` reads the dimension `10PX`, a delimiter and the dimension `2REM`, and `lightningcss` recases the units of both, printing `10px%2rem`. The rule used to read the word as one dimension and reached the second by nothing.
			description: `two upper-case units in one word, a percent sign between them`,
			code: `a { width: 10PX%2REM; }`,
			fixed: `a { width: 10px%2rem; }`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 16,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 18,
					endLine: 1,
					endColumn: 21,
					message: messages.expected(`REM`, `rem`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			// The period and the plus leave no delimiter at all: the tokenizer reads `10PX` and `.2REM` standing next to each other, and `lightningcss` prints `10px.2rem`.
			description: `two upper-case units in one word, the second opening on the point of its fraction`,
			code: `a { width: 10PX.2REM; }`,
			fixed: `a { width: 10px.2rem; }`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 16,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 18,
					endLine: 1,
					endColumn: 21,
					message: messages.expected(`REM`, `rem`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			description: `two upper-case units in one word, the second opening on the sign of its number`,
			code: `a { width: 10PX+2REM; }`,
			fixed: `a { width: 10px+2rem; }`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 16,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 18,
					endLine: 1,
					endColumn: 21,
					message: messages.expected(`REM`, `rem`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			// A backslash in front of a line break opens no escape, and the value parser keeps the break inside the word all the same: the tokenizer reads the dimension `10PX`, that delimiter, the break and the dimension `2REM`, and `lightningcss` recases the units of both. The rule used to end the unit at the delimiter and reach the second dimension by nothing.
			description: `two upper-case units in one word, a backslash and a line break between them`,
			code: `a { width: 10PX\\\n2REM; }`,
			fixed: `a { width: 10px\\\n2rem; }`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 16,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 2,
					column: 2,
					endLine: 2,
					endColumn: 5,
					message: messages.expected(`REM`, `rem`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			// The escape spells the letter `a`, and the whitespace closing it belongs to the escape, so the identifier goes on behind it: the tokenizer reads one dimension whose unit is `PaX`, and Sass and `lightningcss` both print `10PaX`. The value parser parts the word at that space, and the rule used to name `P\61` and leave the `X` as it stood.
			description: `an upper-case unit whose letters a hexadecimal escape and the whitespace closing it stand between`,
			code: `a { width: 10P\\61 X; }`,
			fixed: `a { width: 10p\\61 x; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 20,
			message: messages.expected(`P\\61 X`, `p\\61 x`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			// The escape closes on one whitespace character, and the second parts the word: the tokenizer reads `10PX\9 `, whitespace and `2PX`, and `lightningcss` prints `10PX\9  2px`, recasing the second unit and leaving the first, which it does not know.
			description: `an upper-case unit whose hack unit's escape swallows the first of two spaces in front of a second upper-case unit`,
			code: `a { width: 10PX\\9  2PX; }`,
			fixed: `a { width: 10px\\9  2px; }`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 16,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			// An escaped backslash in front of a digit opens no hexadecimal escape, so the space behind the digit is the text's and parts two dimensions: the tokenizer reads `10PX\\9`, whose unit is `PX\9`, then whitespace and `2REM`, and `lightningcss` prints `10PX\\9 2rem`, leaving the unit it does not know.
			description: `an upper-case unit closing on an escaped backslash and a digit, in front of a space and a second upper-case unit`,
			code: `a { width: 10PX\\\\9 2REM; }`,
			fixed: `a { width: 10px\\\\9 2rem; }`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 19,
					message: messages.expected(`PX\\\\9`, `px\\\\9`),
				},
				{
					line: 1,
					column: 21,
					endLine: 1,
					endColumn: 24,
					message: messages.expected(`REM`, `rem`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			// A hexadecimal escape takes six digits at most, so the seventh is a letter of the unit and the space behind it is the text's: the tokenizer reads `10PX\0000611`, whose unit is `PXa1`, then whitespace and `2REM`; Sass prints `10PXa1 2REM` and `lightningcss` `10PXa1 2rem`.
			description: `an upper-case unit closing on a hexadecimal escape of seven digits, in front of a space and a second upper-case unit`,
			code: `a { width: 10PX\\0000611 2REM; }`,
			fixed: `a { width: 10px\\0000611 2rem; }`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 24,
					message: messages.expected(`PX\\0000611`, `px\\0000611`),
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			// The escape closes on the space, so the dimension token is `10PX\61 ` with the space, and the unit named is what the file spells in front of it: the closing character is the escape's, and `\61` spells the letter `a` with or without it.
			description: `an upper-case unit closing on a hexadecimal escape whose closing whitespace stands in front of the name of a variable, which the warning names without that whitespace`,
			code: `a { width: 10PX\\61 $VAR; }`,
			fixed: `a { width: 10px\\61 $VAR; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 19,
			message: messages.expected(`PX\\61`, `px\\61`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			// The space is the character the escape spells, not one it closes on, so it is a character of the unit and the warning names it: the tokenizer reads one dimension whose unit is `PX` and a space.
			description: `an upper-case unit closing on an escaped space, which the warning names whole`,
			code: `a { width: 10PX\\ ; }`,
			fixed: `a { width: 10px\\ ; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 18,
			message: messages.expected(`PX\\ `, `px\\ `),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			// Every hack unit the word carries is taken out of it, the second as much as the first, so what stands behind the last of them is off the unit.
			description: `an upper-case unit two hack units close, the escape of the second swallowing the whitespace in front of a second dimension`,
			code: `a { width: 10PX\\9\\9 2REM; }`,
			fixed: `a { width: 10px\\9\\9 2REM; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			description: `a list of three upper-case units whose second carries a hack unit, whose escape welds the third dimension onto it and leaves it behind the unit`,
			code: `a { margin: 1PX 10PX\\9 2PX; }`,
			fixed: `a { margin: 1px 10px\\9 2PX; }`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 16,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 19,
					endLine: 1,
					endColumn: 21,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/426
			description: `a lower-case hash welded to an upper-case unit, whose letters are no unit and belong to another rule`,
			code: `a { b: 10PX#fff; }`,
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
			// The whitespace closing the escape belongs to it, so `important\9 2px` is one identifier to the tokenizer and the second `px` is a unit of nothing: Less prints the line back as it stands, and Sass refuses it. The rule used to read `2px` as a dimension of its own, the value parser having parted the word at that space (#526).
			description: `a lower-case unit in front of a bang flag whose keyword a hack unit closes, its escape welding the second dimension into the keyword`,
			code: `a { b: 1px!important\\9 2px!important; }`,
			fixed: `a { b: 1PX!important\\9 2px!important; }`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 11,
			message: messages.expected(`px`, `PX`),
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/426
			description: `a lower-case unit with a hash welded to it, which opens no interpolation and is no part of the unit`,
			code: `a { b: 10px#fff; }`,
			fixed: `a { b: 10PX#fff; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`px`, `PX`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/426
			description: `the same hash welded to the first of two multiplied dimensions, each of them carrying a lower-case unit`,
			code: `a { b: 1px#fff*2rem; }`,
			fixed: `a { b: 1PX#fff*2REM; }`,
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
					column: 17,
					endLine: 1,
					endColumn: 20,
					message: messages.expected(`rem`, `REM`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/413
			description: `a lower-case unit in the first part of a multiplication whose second part is a letter and no unit, which the fix leaves as it is`,
			code: `a { b: 1px*a; }`,
			fixed: `a { b: 1PX*a; }`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 11,
			message: messages.expected(`px`, `PX`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/413
			description: `a lower-case unit behind an exponent whose own letter is part of the number and stays as it is`,
			code: `a { b: 1e5px; }`,
			fixed: `a { b: 1e5PX; }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 13,
			message: messages.expected(`px`, `PX`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			description: `a lower-case unit welded by an escaped star to a second one`,
			code: `a { b: 10px\\*2rem; }`,
			fixed: `a { b: 10PX\\*2REM; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 18,
			message: messages.expected(`px\\*2rem`, `PX\\*2REM`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			// One backslash more, and the star is the file's own again: the escape is a backslash and the one character behind it, so `\\` is an escaped backslash and the star behind it parts two dimensions. Sass multiplies this one and leaves the twin above whole.
			description: `the same star behind an escaped backslash, which parts two dimensions`,
			code: `a { b: 10px\\\\*2rem; }`,
			fixed: `a { b: 10PX\\\\*2REM; }`,
			warnings: [
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 14,
					message: messages.expected(`px\\\\`, `PX\\\\`),
				},
				{
					line: 1,
					column: 16,
					endLine: 1,
					endColumn: 19,
					message: messages.expected(`rem`, `REM`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			// An escaped hash opens no interpolation and is a code point of the unit: `lightningcss` prints the word as it stands, and the tokenizer reads one dimension whose unit is `px\#fff`.
			description: `a lower-case unit with an escaped hash welded to it`,
			code: `a { b: 10px\\#fff; }`,
			fixed: `a { b: 10PX\\#FFF; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`px\\#fff`, `PX\\#FFF`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			description: `a lower-case unit with a percent sign welded behind it, which is no code point of an identifier and no part of the unit`,
			code: `a { b: 10px%; }`,
			fixed: `a { b: 10PX%; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`px`, `PX`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			// The bang is escaped, so it opens no flag and is a code point of the unit: `@csstools/css-tokenizer` reads one dimension, and Sass, Less and `lightningcss` all print the word exactly as it stands.
			description: `a lower-case unit with an escaped bang and a keyword welded behind it`,
			code: `a { b: 10px\\!important; }`,
			fixed: `a { b: 10PX\\!IMPORTANT; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 23,
			message: messages.expected(`px\\!important`, `PX\\!IMPORTANT`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			// The other option over the word the `lower` block accepts: the one unit the word holds is `px`, so the warning names it and the fix recases it, and `2PX` behind the hack stays as it is under both options where each used to change a half of its own.
			description: `a lower-case unit whose hack unit's escape swallows the whitespace in front of a second run of digits and letters, which stands behind the unit and stays as it is`,
			code: `a { width: 10px\\9 2PX; }`,
			fixed: `a { width: 10PX\\9 2PX; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`px`, `PX`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			description: `two lower-case units in one word, a percent sign between them`,
			code: `a { width: 10px%2rem; }`,
			fixed: `a { width: 10PX%2REM; }`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 16,
					message: messages.expected(`px`, `PX`),
				},
				{
					line: 1,
					column: 18,
					endLine: 1,
					endColumn: 21,
					message: messages.expected(`rem`, `REM`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			description: `two lower-case units in one word, a backslash and a line break between them`,
			code: `a { width: 10px\\\n2rem; }`,
			fixed: `a { width: 10PX\\\n2REM; }`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 16,
					message: messages.expected(`px`, `PX`),
				},
				{
					line: 2,
					column: 2,
					endLine: 2,
					endColumn: 5,
					message: messages.expected(`rem`, `REM`),
				},
			],
		},
	],
})
