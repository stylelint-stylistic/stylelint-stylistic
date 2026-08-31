import { createRule } from "../../../../rules/unit-case/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`lower`],

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/344
			// Sass compiles every one of these spellings to a plain address, and `lightningcss` reads one in every spelling too, so what stands inside the parentheses is a URL and nothing a rule may write to.
			description: `an upper-case unit inside an address whose name an escape spells`,
			code: `a { b: u\\rl(13PX); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/344
			description: `the same unit inside an address whose name a hexadecimal escape spells, which the value parser hands the rule as a word and a call of two letters`,
			code: `a { b: \\75 rl(13PX); }`,
		},
		{
			description: `a unit inside an end-of-line comment, which the rule does not read`,
			code: `a { width: 1em; \n// width: 10PX\n }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/343
			// The reading is CSS's rather than this syntax's, and Sass is the compiler that shows it: `aurl(a/b)` and `éurl(a/b)` both compile there, while `aurl(a//b)` and `éurl(a//b)` both fail at one offset that is the length of the file, the comment the double slash opens having carried off the closing parenthesis. `lightningcss` leaves every one of the four whole. `postcss-scss` never reaches this, refusing such a file with `Unclosed bracket`.
			description: `an upper-case unit behind a call whose name opens on a code point outside ASCII, which leaves the unit inside the text of a comment`,
			code: `a { b: \u00E9url(http://a/b.png) 1PX; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/343
			description: `the same call named in several such code points`,
			code: `a { b: \u65E5\u672Curl(http://a/b.png) 1PX; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/343
			description: `the same call with such a code point in front of a name whose first letter an escape spells`,
			code: `a { b: \u00E9\\75 rl(http://a/b.png) 1PX; }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/344
			// The whitespace closing a hexadecimal escape belongs to the escape, so the name here is `\61 url`, which spells `aurl` and opens an ordinary call: `lightningcss` compiles this very line to `a { b: aurl(13px); }`, lowercasing the unit itself, and Sass to `a { b: aurl(13PX); }`. `postcss-value-parser` reads no escape and hands the call back named `url` alone, which is what the rule used to match against, passing the unit over as an address's.
			description: `an upper-case unit inside a call whose name an escape welds to the word in front of it`,
			code: `a { b: \\61 url(13PX); }`,
			fixed: `a { b: \\61 url(13px); }`,
			line: 1,
			column: 18,
			endLine: 1,
			endColumn: 20,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/344
			description: `an upper-case unit inside a call whose name ends in those three letters while being a name of its own, which is no address`,
			code: `a { b: image-url(13PX); }`,
			fixed: `a { b: image-url(13px); }`,
			line: 1,
			column: 20,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/297
			description: `two dimensions multiplied in one word, both units upper-case`,
			code: `a { b: 10PX*2REM; }`,
			fixed: `a { b: 10px*2rem; }`,
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
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/321
			description: `an upper-case unit behind a double slash whose first character an escape spells, which opens no comment`,
			code: `a { b: a\\//b 1PX; }`,
			fixed: `a { b: a\\//b 1px; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/321
			description: `an upper-case unit on the line below an inline comment that stands behind an escaped quotation mark, whose text holds an upper-case unit too`,
			code: `
				a { b: a\\"b // 1PX
					2PX; }
			`,
			fixed: `
				a { b: a\\"b // 1PX
					2px; }
			`,
			line: 2,
			column: 3,
			endLine: 2,
			endColumn: 5,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/321
			// Less itself refuses such a name — `less.render` answers `Unrecognised input` — while Sass and every browser read the address, so the reading is CSS's rather than this syntax's. It is pinned here all the same, since `postcss-less` is the only syntax that reaches the scan with this shape: plain CSS spells no comment with a double slash, and `postcss-scss` reads the same file the same way on either side of the branch.
			description: `an upper-case unit behind an address whose name an escape spells in a letter that is not its first`,
			code: `a { b: u\\rl(http://a/b.png) 1PX; }`,
			fixed: `a { b: u\\rl(http://a/b.png) 1px; }`,
			line: 1,
			column: 30,
			endLine: 1,
			endColumn: 32,
			message: messages.expected(`PX`, `px`),
		},
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `a lower-case unit in front of an interpolation whose text holds whitespace, in a set of media parameters, which is a place the Less parser carries such a value`,
			code: `@media (min-width: 10px@{aB b}) { a { b: c } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `the same interpolation written in a custom property`,
			code: `a { --x: 10px@{aB b}; }`,
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
