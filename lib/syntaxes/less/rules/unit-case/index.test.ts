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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			// CSS closes a hexadecimal escape with one whitespace character belonging to the escape rather than to the text, so this is one dimension token, and Less prints the line back exactly as it stands. The value parser hands the word back parted at that space, and the rule used to read `2PX` as a dimension of its own.
			description: `a lower-case unit whose hack unit's escape swallows the whitespace in front of a second run of digits and letters`,
			code: `a { b: 10px\\9 2PX; }`,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/413
			description: `a variable spelled in capitals multiplied by an upper-case unit, a word the whole of which is no dimension`,
			code: `a { b: @VAR*10PX; }`,
			fixed: `a { b: @VAR*10px; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/527
			// Less multiplies the unescaped twin and does not multiply this one, parting it instead into the dimension and an escaped value it prints as it stands: `a { b: 10PX \\*2REM; }`. The unit is `PX` here, where the core reads the whole of `PX\\*2REM`, so the escaped value keeps its case.
			description: `an upper-case unit welded by an escaped star to a second one, which Less does not multiply`,
			code: `a { b: 10PX\\*2REM; }`,
			fixed: `a { b: 10px\\*2REM; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/527
			// Less parts the word at the escape and prints `a { b: 10PX \\@VAR; }`, the escaped name a value of its own, so the unit ends in front of the backslash and the name keeps its case.
			description: `an upper-case unit with an escaped at-sign and a name in capitals welded to it, which Less reads as a value of its own`,
			code: `a { b: 10PX\\@VAR; }`,
			fixed: `a { b: 10px\\@VAR; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/527
			// A declaration whose value spells no operator Less stores unread and prints whole, so this one compiles to `a { b: 10PX\\!important; }`; in a variable's value or a call's arguments it reads an expression and prints `10PX \\!important`. In neither reading is the flag part of the unit, and the core's fix, which recased the flag along with the unit, used to leave `10px\\!important`.
			description: `an upper-case unit with an escaped bang flag welded to it, in a declaration Less prints as it stands`,
			code: `a { b: 10PX\\!important; }`,
			fixed: `a { b: 10px\\!important; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/527
			// To the tokenizer the escape spells the letter `a` and the unit is `PaX`. Less stores this declaration unread and prints it whole, and wherever it reads an expression — a variable's value, a call's arguments, the last declaration of a block written without a semicolon — it reads a unit as ASCII letters alone and prints `10P \\61 X`; in neither reading is the escape part of the unit, so it ends at `P` and the letter behind the escape keeps its case.
			description: `a unit whose middle letter a hexadecimal escape spells, which Less parts at the escape`,
			code: `a { b: 10P\\61 X; }`,
			fixed: `a { b: 10p\\61 X; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expected(`P`, `p`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/527
			// The core takes the hack out of the copy it reads the unit in and names `PX`. Less stores this declaration unread and prints it whole, and wherever it reads an expression it parts the word at the hack as at any escape, `10P \\9X` in a variable's value; the letter behind the hack is no letter of the unit in either reading.
			description: `a unit with a hack unit between its letters, which Less parts at the hack`,
			code: `a { b: 10P\\9X; }`,
			fixed: `a { b: 10p\\9X; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expected(`P`, `p`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/527
			// An escaped backslash and a digit, no hack: the core reads the unit `PX\\\\9` whole, as the tokenizer does, and Less reads `10PX \\\\9` in a variable's value, so the unit ends in front of the escape here. The write is the base's, since the escape spells no letter; the name is not.
			description: `an upper-case unit closing on an escaped backslash and a digit, which is no hack unit`,
			code: `a { b: 10PX\\\\9; }`,
			fixed: `a { b: 10px\\\\9; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/527
			// An escaped space is a code point of the unit to the tokenizer, which reads `PX\\ 2REM` as one identifier; Less reads `10PX \\ 2REM` in a variable's value, and the unit ends in front of the escape here, so the second run of digits and letters keeps its case.
			description: `an upper-case unit an escaped space welds to a second one`,
			code: `a { b: 10PX\\ 2REM; }`,
			fixed: `a { b: 10px\\ 2REM; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/527
			// The hack's whitespace welds the second run of digits and letters onto the word, and the unit ends in front of the hack under this syntax as under the core: the same `PX`, the same write.
			description: `an upper-case unit whose hack unit's escape swallows the whitespace in front of a second run of digits and letters, which is off the unit under either reading`,
			code: `a { b: 10PX\\9 2PX; }`,
			fixed: `a { b: 10px\\9 2PX; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/527
			// Less reads a variable's value as an expression whatever it spells, and prints `10PX \\#fff` for this one.
			description: `an upper-case unit with an escaped hash welded to it, in the value of a Less at-variable`,
			code: `@v: 10PX\\#fff;`,
			fixed: `@v: 10px\\#fff;`,
			line: 1,
			column: 7,
			endLine: 1,
			endColumn: 9,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/527
			description: `the same word in a set of media parameters, which Less reads as an expression too`,
			code: `@media (min-width: 10PX\\#fff) { a { b: c } }`,
			fixed: `@media (min-width: 10px\\#fff) { a { b: c } }`,
			line: 1,
			column: 22,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			// The line break is the end of the comment before it is the closing character of the escape the comment's text ends in, and the value parser hands that text back as words like any other: Less compiles this to `a { b: 1PX 2REM; }`, the second dimension a value of its own. A word standing in the text of a comment is welded onto nothing, so the dimension on the line below is read.
			description: `an upper-case unit on the line below an inline comment whose text ends in a hack unit, whose escape would swallow the break that closes the comment`,
			code: `a { b: 1PX // 10PX\\9\n2REM; }`,
			fixed: `a { b: 1px // 10PX\\9\n2rem; }`,
			warnings: [
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 11,
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
			// The dimension token is `10PX\*ns`, and the guard that turns a reading through a Sass module away is asked about that token rather than about the whole word, so the unit is named where the rule used to say nothing; Less refuses the line, and `lightningcss` prints it as it stands. The unit ends in front of the escape under this namespace, so `PX` is named where the core names `PX\*ns` (#527).
			description: `an upper-case unit an escaped star welds to a reading through a Sass module`,
			code: `a { b: 10PX\\*ns.$V; }`,
			fixed: `a { b: 10px\\*ns.$V; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526
			description: `two upper-case units in one word, a percent sign between them, which is plain CSS's reading and the one this namespace inherits`,
			code: `a { b: 10PX%2REM; }`,
			fixed: `a { b: 10px%2rem; }`,
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
	],
})
testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`upper`],

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/527
			// Less compiles this to `a { width: 10PX \\#fff; }`: the dimension, and beside it an escaped value printed exactly as written. The unit is `PX` and nothing of the hash, where the core names `PX\\#fff` and asks for `PX\\#FFF`.
			description: `an upper-case unit with an escaped hash in lower case welded to it, which Less reads as a value of its own`,
			code: `a { width: 10PX\\#fff; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/527
			// A number and an escaped value to Less, `10 \\#fff`; the core reads a dimension whose whole unit is the escaped hash, and asked for `\\#FFF` here.
			description: `a number with an escaped hash welded to it, which leaves no unit to read`,
			code: `a { width: 10\\#fff; }`,
		},
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
			description: `a word of a multiplication standing in the text of an inline comment the value holds, whose dimensions the rule would read one at a time`,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/425
			description: `a variable multiplied by a lower-case unit, which used to be reported and never written`,
			code: `a { b: @var*2rem; }`,
			fixed: `a { b: @var*2REM; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`rem`, `REM`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/527
			// The hash opens no interpolation and is a code point of the unit to the tokenizer, to Sass and to `lightningcss`, and the core names `px\\#fff`; Less parts the word at the escape and compiles the line to `a { width: 10px \\#fff; }`, the escaped value printed as it stands, so the unit is `px` here and the fix leaves the hash's case alone — it used to write `10PX\\#FFF`.
			description: `a lower-case unit with an escaped hash welded to it, which Less reads as a value of its own`,
			code: `a { b: 10px\\#fff; }`,
			fixed: `a { b: 10PX\\#fff; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`px`, `PX`),
		},
	],
})
