import { messages, ruleName } from "./index.js"

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
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`lower`],

	accept: [
		{
			description: `a unit inside an end-of-line comment, which the rule does not read`,
			code: `a { width: 1em; \n// width: 10PX\n }`,
		},
		{
			description: `an interpolation inside a calc expression, which carries no unit of its own`,
			code: `a { margin: calc(100% - #{$margin * 2}); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/234
			description: `a unit in front of an interpolation whose text holds a bang, in a word that is no standard value`,
			code: `a { b: 1px#{$aB!=$b}; }`,
		},
	],

	reject: [
		{
			description: `an upper-case unit`,
			code: `a { margin: 10PX; }`,
			fixed: `a { margin: 10px; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `a unit ending in a capital`,
			code: `a { margin: 10pX; }`,
			fixed: `a { margin: 10px; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`pX`, `px`),
		},
		{
			description: `a unit opening with a capital`,
			code: `a { margin: 10Px; }`,
			fixed: `a { margin: 10px; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`Px`, `px`),
		},
		{
			description: `an upper-case unit in a sum`,
			code: `a { margin: 10PX + 10px; }`,
			fixed: `a { margin: 10px + 10px; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit in the value of an SCSS variable`,
			code: `a { $margin: 10PX; }`,
			fixed: `a { $margin: 10px; }`,
			line: 1,
			column: 16,
			endLine: 1,
			endColumn: 18,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit in a sum inside an SCSS variable`,
			code: `a { $margin: 10px + 10PX; }`,
			fixed: `a { $margin: 10px + 10px; }`,
			line: 1,
			column: 23,
			endLine: 1,
			endColumn: 25,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit added to an SCSS variable`,
			code: `a { margin: $margin + 10PX; }`,
			fixed: `a { margin: $margin + 10px; }`,
			line: 1,
			column: 25,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit in the second entry of an SCSS map`,
			code: `$breakpoints: ( small: 767px, medium: 992PX, large: 1200px );`,
			fixed: `$breakpoints: ( small: 767px, medium: 992px, large: 1200px );`,
			line: 1,
			column: 42,
			endLine: 1,
			endColumn: 44,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit in a value written as a parenthesised list`,
			code: `a { font: (italic bold 10px/8PX) }`,
			fixed: `a { font: (italic bold 10px/8px) }`,
			line: 1,
			column: 30,
			endLine: 1,
			endColumn: 32,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit in a value that ends in an interpolation`,
			code: `font: 14PX/#{$line-height};`,
			fixed: `font: 14px/#{$line-height};`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 11,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `an upper-case unit inside an interpolation nested in calc`,
			code: `a { margin: calc(100% - #{$margin * 2PX}); }`,
			fixed: `a { margin: calc(100% - #{$margin * 2px}); }`,
			line: 1,
			column: 38,
			endLine: 1,
			endColumn: 41,
			message: messages.expected(`PX`, `px`),
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`lower`],

	accept: [
		{
			description: `a unit inside an end-of-line comment, which the rule does not read`,
			code: `a { width: 1em; \n// width: 10PX\n }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/321
			description: `a unit behind a double slash whose first character an escape spells, which opens no comment to Less and does open one to the scan that finds them`,
			code: `a { b: a\\//b 1PX; }`,
		},
	],

	reject: [
		{
			description: `an upper-case unit in the value of a Less at-variable`,
			code: `@variable: 10PX`,
			fixed: `@variable: 10px`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`PX`, `px`),
		},
		{
			description: `a unit ending in a capital in the value of a Less at-variable`,
			code: `@variable: 10pX`,
			fixed: `@variable: 10px`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`pX`, `px`),
		},
		{
			description: `a unit opening with a capital in the value of a Less at-variable`,
			code: `@variable: 10Px`,
			fixed: `@variable: 10px`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`Px`, `px`),
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
	],

	reject: [
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
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`upper`],

	accept: [
		{
			description: `a unit inside an end-of-line comment, which the rule does not read`,
			code: `a { width: 1EM; \n// width: 10px\n }`,
		},
		{
			description: `an interpolation inside a calc expression, which carries no unit of its own`,
			code: `a { margin: calc(100% - #{$margin * 2}); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/234
			description: `a unit in front of an interpolation whose text holds a bang, in a word that is no standard value`,
			code: `a { b: 10px#{$a!=$b}; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a lower-case unit standing in the text of an inline comment the value holds`,
			code: `
				a { b: 1PX // 2px
					3PX; }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a lower-case unit standing in the text of an inline comment a set of media parameters holds`,
			code: `
				@media (min-width: 100PX // 2px
				) { a { b: c } }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a word of a multiplication standing in the text of an inline comment the value holds, which the rule reads part by part`,
			code: `
				a { b: 1PX // 2px*3rem
					; }
			`,
		},
	],

	reject: [
		{
			description: `a lower-case unit`,
			code: `a { margin: 10px; }`,
			fixed: `a { margin: 10PX; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`px`, `PX`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a lower-case unit on either side of an inline comment whose text holds one as well`,
			code: `
				a { b: 1px // 2px
					3px; }
			`,
			fixed: `
				a { b: 1PX // 2px
					3PX; }
			`,
			warnings: [
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 11,
					message: messages.expected(`px`, `PX`),
				},
				{
					line: 2,
					column: 3,
					endLine: 2,
					endColumn: 5,
					message: messages.expected(`px`, `PX`),
				},
			],
		},
		{
			description: `a unit ending in a capital`,
			code: `a { margin: 10pX; }`,
			fixed: `a { margin: 10PX; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`pX`, `PX`),
		},
		{
			description: `a unit opening with a capital`,
			code: `a { margin: 10Px; }`,
			fixed: `a { margin: 10PX; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`Px`, `PX`),
		},
		{
			description: `a lower-case unit in a sum`,
			code: `a { margin: 10px + 10PX; }`,
			fixed: `a { margin: 10PX + 10PX; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a lower-case unit in the value of an SCSS variable`,
			code: `a { $margin: 10px; }`,
			fixed: `a { $margin: 10PX; }`,
			line: 1,
			column: 16,
			endLine: 1,
			endColumn: 18,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a lower-case unit in a sum inside an SCSS variable`,
			code: `a { $margin: 10PX + 10px; }`,
			fixed: `a { $margin: 10PX + 10PX; }`,
			line: 1,
			column: 23,
			endLine: 1,
			endColumn: 25,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a lower-case unit added to an SCSS variable`,
			code: `a { margin: $margin + 10px; }`,
			fixed: `a { margin: $margin + 10PX; }`,
			line: 1,
			column: 25,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a lower-case unit in the second entry of an SCSS map`,
			code: `$breakpoints: ( small: 767PX, medium: 992px, large: 1200PX );`,
			fixed: `$breakpoints: ( small: 767PX, medium: 992PX, large: 1200PX );`,
			line: 1,
			column: 42,
			endLine: 1,
			endColumn: 44,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a lower-case unit in a value written as a parenthesised list`,
			code: `a { font: (italic bold 10PX/8px) }`,
			fixed: `a { font: (italic bold 10PX/8PX) }`,
			line: 1,
			column: 30,
			endLine: 1,
			endColumn: 32,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a lower-case unit in a value that ends in an interpolation`,
			code: `font: 14px/#{$line-height};`,
			fixed: `font: 14PX/#{$line-height};`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 11,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a lower-case unit inside an interpolation nested in calc`,
			code: `a { margin: calc(100% - #{$margin * 2px}); }`,
			fixed: `a { margin: calc(100% - #{$margin * 2PX}); }`,
			line: 1,
			column: 38,
			endLine: 1,
			endColumn: 41,
			message: messages.expected(`px`, `PX`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/233
		{
			description: `a lower-case unit on either side of an end-of-line comment the value holds`,
			code: `
				a {
					b: 1px // c
						2px;
				}
			`,
			fixed: `
				a {
					b: 1PX // c
						2PX;
				}
			`,
			warnings: [
				{
					line: 2,
					column: 6,
					endLine: 2,
					endColumn: 8,
					message: messages.expected(`px`, `PX`),
				},
				{
					line: 3,
					column: 4,
					endLine: 3,
					endColumn: 6,
					message: messages.expected(`px`, `PX`),
				},
			],
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/233
		{
			description: `a lower-case unit in front of an end-of-line comment the parameters of a media query hold`,
			code: `
				@media (min-width: 100px // c
				) {
					a { color: red; }
				}
			`,
			fixed: `
				@media (min-width: 100PX // c
				) {
					a { color: red; }
				}
			`,
			line: 1,
			column: 23,
			endLine: 1,
			endColumn: 25,
			message: messages.expected(`px`, `PX`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/234
			description: `a lower-case unit in front of the default flag of a Sass variable`,
			code: `$a: 1px!default;`,
			fixed: `$a: 1PX!default;`,
			line: 1,
			column: 6,
			endLine: 1,
			endColumn: 8,
			message: messages.expected(`px`, `PX`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/234
			description: `a lower-case unit in front of the global flag of a Sass variable`,
			code: `$a: 1px!global;`,
			fixed: `$a: 1PX!global;`,
			line: 1,
			column: 6,
			endLine: 1,
			endColumn: 8,
			message: messages.expected(`px`, `PX`),
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`upper`],

	accept: [
		{
			description: `a unit inside an end-of-line comment, which the rule does not read`,
			code: `a { width: 1EM; \n// width: 10px\n }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/234
			description: `a unit in front of an interpolation whose text holds a bang, in a word that is no standard value`,
			code: `a { b: 10px@{aB!x}; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a word of a multiplication standing in the text of an inline comment the value holds, which the rule reads part by part`,
			code: `
				a { b: 1PX // 2px*3rem
					; }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a lower-case unit standing in the text of an inline comment a set of media parameters holds`,
			code: `
				@media (min-width: 100PX // 2px
				) { a { b: c } }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `an address opened in that text and reaching past the break that closes the comment, which the rule passes over as it passes over every address`,
			code: `
				a { b: 1PX // url(
					2px); }
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a lower-case unit on either side of an inline comment whose text holds one as well`,
			code: `
				a { b: 1px // 2px
					3px; }
			`,
			fixed: `
				a { b: 1PX // 2px
					3PX; }
			`,
			warnings: [
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 11,
					message: messages.expected(`px`, `PX`),
				},
				{
					line: 2,
					column: 3,
					endLine: 2,
					endColumn: 5,
					message: messages.expected(`px`, `PX`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a unit a line below an inline comment, gathered by a call the parser opened inside that comment's text: the call is left alone and what it gathered is read where it stands`,
			code: `
				a { b: f(1px // c) calc(
					2px); }
			`,
			fixed: `
				a { b: f(1PX // c) calc(
					2PX); }
			`,
			warnings: [
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 13,
					message: messages.expected(`px`, `PX`),
				},
				{
					line: 2,
					column: 3,
					endLine: 2,
					endColumn: 5,
					message: messages.expected(`px`, `PX`),
				},
			],
		},
		{
			description: `a lower-case unit in the value of a Less at-variable`,
			code: `@variable: 10px`,
			fixed: `@variable: 10PX`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`px`, `PX`),
		},
		{
			description: `a unit ending in a capital in the value of a Less at-variable`,
			code: `@variable: 10pX`,
			fixed: `@variable: 10PX`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`pX`, `PX`),
		},
		{
			description: `a unit opening with a capital in the value of a Less at-variable`,
			code: `@variable: 10Px`,
			fixed: `@variable: 10PX`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`Px`, `PX`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/233
		{
			description: `a lower-case unit on either side of a block comment the value of a Less at-variable holds`,
			code: `@variable: 10px /* c */ 20px`,
			fixed: `@variable: 10PX /* c */ 20PX`,
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
					column: 27,
					endLine: 1,
					endColumn: 29,
					message: messages.expected(`px`, `PX`),
				},
			],
		},
	],
})
