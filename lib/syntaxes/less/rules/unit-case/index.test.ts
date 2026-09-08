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
			// Sass and `lightningcss` read every one of these spellings as a plain address, so what stands inside the parentheses is a URL no rule may write to. See #344
			description: `an upper-case unit inside an address whose name an escape spells`,
			code: `a { b: u\\rl(13PX); }`,
		},
		{
			// See #344
			description: `the same unit inside an address whose name a hexadecimal escape spells, which the value parser hands the rule as a word and a call of two letters`,
			code: `a { b: \\75 rl(13PX); }`,
		},
		{
			description: `a unit inside an end-of-line comment, which the rule does not read`,
			code: `a { width: 1em; \n// width: 10PX\n }`,
		},
		{
			// The reading is CSS's, not this syntax's: in Sass `aurl(a/b)` and `éurl(a/b)` both compile, while `aurl(a//b)` and `éurl(a//b)` both fail at the length of the file, the `//` comment having carried off the closing parenthesis; `lightningcss` leaves all four whole. `postcss-scss` refuses such a file with `Unclosed bracket`. See #343
			description: `an upper-case unit behind a call whose name opens on a code point outside ASCII, which leaves the unit inside the text of a comment`,
			code: `a { b: \u00E9url(http://a/b.png) 1PX; }`,
		},
		{
			// See #343
			description: `the same call named in several such code points`,
			code: `a { b: \u65E5\u672Curl(http://a/b.png) 1PX; }`,
		},
		{
			// See #343
			description: `the same call with such a code point in front of a name whose first letter an escape spells`,
			code: `a { b: \u00E9\\75 rl(http://a/b.png) 1PX; }`,
		},
		{
			// The whitespace closing a hexadecimal escape belongs to the escape, so this is one dimension token, and Less prints the line back as it stands; the value parser hands the word back parted at that space, and the rule used to read `2PX` as a dimension of its own. See #526
			description: `a lower-case unit whose hack unit's escape swallows the whitespace in front of a second run of digits and letters`,
			code: `a { b: 10px\\9 2PX; }`,
		},
	],

	reject: [
		{
			// The whitespace closing a hexadecimal escape belongs to the escape, so the name is `\61 url`, which spells `aurl` and opens an ordinary call: `lightningcss` compiles the line to `a { b: aurl(13px); }`, Sass to `a { b: aurl(13PX); }`. `postcss-value-parser` reads no escape and hands the call back named `url`, which the rule used to match against, passing the unit over as an address's. See #344
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
			// See #344
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
			// See #297
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
			// See #321
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
			// See #321
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
			// Less refuses such a name (`less.render` answers `Unrecognised input`) while Sass and every browser read the address, so the reading is CSS's rather than this syntax's; it is pinned here because `postcss-less` is the only syntax reaching the scan with this shape: plain CSS spells no `//` comment, and `postcss-scss` reads the file the same way on either side of the branch. See #321
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
			// See #426
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
			// See #413
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
			// Less multiplies the unescaped twin but parts this one into the dimension and an escaped value printed as it stands, `a { b: 10PX \\*2REM; }`. The unit is `PX` where the core reads the whole of `PX\\*2REM`, so the escaped value keeps its case. See #414 and #527
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
			// Less parts the word at the escape and prints `a { b: 10PX \\@VAR; }`, so the unit ends in front of the backslash and the name keeps its case. See #527
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
			// Less stores a declaration whose value spells no operator unread and prints it whole, `a { b: 10PX\\!important; }`; in a variable's value or a call's arguments it reads an expression and prints `10PX \\!important`. In neither reading is the flag part of the unit, which the core's fix, recasing the flag along with the unit, used to leave as `10px\\!important`. See #527
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
			// To the tokenizer the escape spells `a` and the unit is `PaX`. Less stores this declaration unread and prints it whole, and wherever it reads an expression (a variable's value, a call's arguments, the last declaration of a block written without a semicolon) it reads a unit as ASCII letters alone and prints `10P \\61 X`; in neither reading is the escape part of the unit, so it ends at `P` and the letter behind the escape keeps its case. See #527
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
			// The core takes the hack out of the copy it reads the unit in and names `PX`. Less stores this declaration unread and prints it whole, and wherever it reads an expression parts the word at the hack as at any escape, `10P \\9X` in a variable's value; in either reading the letter behind the hack is no letter of the unit. See #527
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
			// See #527
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
			// An escaped space is a code point of the unit to the tokenizer, which reads `PX\\ 2REM` as one identifier; Less reads `10PX \\ 2REM` in a variable's value, so the unit ends in front of the escape and the second run keeps its case. See #527
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
			// The hack's whitespace welds the second run onto the word, and the unit ends in front of the hack under this syntax as under the core: the same `PX`, the same write. See #527
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
			// See #527
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
			// See #527
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
			// The line break ends the comment before it closes the escape the comment's text ends in, and the value parser hands that text back as words like any other: Less compiles this to `a { b: 1PX 2REM; }`. A word in the text of a comment is welded onto nothing, so the dimension on the line below is read. See #526
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
			// The dimension token is `10PX\*ns`, and the guard turning a reading through a Sass module away is asked about that token rather than the whole word, so the unit is named where the rule used to say nothing; Less refuses the line, `lightningcss` prints it as it stands. The unit ends in front of the escape under this namespace, so `PX` is named where the core names `PX\*ns` (#527). See #526
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
			// See #526
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
		{
			// Less reads a unit as ASCII letters and underscores, so the hyphen opens an operand of its own and it compiles the line to `a { b: 10PX A; }`, printing the keyword exactly as written; the core reads the hyphen as a code point of the identifier and names `PX-A`. See #633
			description: `an upper-case unit a hyphen welds a word to, which Less reads as a keyword of its own`,
			code: `a { b: 10PX-A; }`,
			fixed: `a { b: 10px-A; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// Less subtracts the two and compiles the line to `a { b: 8PX; }`, so both are units to name, as they are in the word `10PX*2REM` the core parts. See #633
			description: `two upper-case units in one word, a hyphen between them, which Less subtracts`,
			code: `a { b: 10PX-2REM; }`,
			fixed: `a { b: 10px-2rem; }`,
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
			// See #633
			description: `three upper-case units in one word, a hyphen between each pair, which Less subtracts down to one dimension`,
			code: `a { b: 10PX-2REM-3EM; }`,
			fixed: `a { b: 10px-2rem-3em; }`,
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
			// A keyword of Less holds hyphens of its own, so it reads `A-2REM` whole and compiles the line to `a { b: 10PX A-2REM; }`: only the hyphen behind the unit parts the word, and the digits behind the second one are no dimension. See #633
			description: `an upper-case unit a hyphen welds a keyword to, the keyword holding a hyphen and digits of its own`,
			code: `a { b: 10PX-A-2REM; }`,
			fixed: `a { b: 10px-A-2REM; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// See #633
			description: `the same word with a keyword of two letters behind the unit`,
			code: `a { b: 10PX-A-B; }`,
			fixed: `a { b: 10px-A-B; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// The second hyphen is the sign of the keyword, which Less prints as `a { b: 10PX -A; }`. See #633
			description: `an upper-case unit two hyphens weld a word to`,
			code: `a { b: 10PX--A; }`,
			fixed: `a { b: 10px--A; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// The first hyphen is Less's operator and the second the sign of the operand, so it subtracts the two and compiles the line to `a { b: 12PX; }`: `REM` is a unit here as it is behind one hyphen. See #633
			description: `two upper-case units two hyphens weld together, which Less subtracts`,
			code: `a { b: 10PX--2REM; }`,
			fixed: `a { b: 10px--2rem; }`,
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
			// A keyword of Less opens on hyphens of its own, so behind the operator stands `--2REM` whole and no dimension: it compiles the line to `a { b: 10PX --2REM; }`, and the second run of digits and letters keeps its case. See #633
			description: `the same pair three hyphens weld together, which Less leaves a keyword`,
			code: `a { b: 10PX---2REM; }`,
			fixed: `a { b: 10px---2REM; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// The hyphens stand right behind the number, so the unit is empty and only the operand carries one; Less subtracts and compiles the line to `a { b: 12REM; }`. See #633
			description: `a word whose two hyphens leave no unit in front of them and a dimension behind`,
			code: `a { b: 10--2REM; }`,
			fixed: `a { b: 10--2rem; }`,
			line: 1,
			column: 13,
			endLine: 1,
			endColumn: 16,
			message: messages.expected(`REM`, `rem`),
		},
		{
			// The star parts the word before the hyphen does, so the second unit is named after the third and the warnings are put back into the order the file spells them. Less compiles the line to `a { b: 4PX; }`. See #633
			description: `three upper-case units in one word, a hyphen between the first pair and a star between the second`,
			code: `a { b: 10PX-2REM*3EM; }`,
			fixed: `a { b: 10px-2rem*3em; }`,
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
			// The unit in front already stands in the case asked for, and the word is read on past it. See #633
			description: `a miscased unit behind a hyphen whose unit in front needs no change`,
			code: `a { b: 10px-2REM; }`,
			fixed: `a { b: 10px-2rem; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`REM`, `rem`),
		},
		{
			// Less compiles the line to `a { b: 10PX; }`, the hyphen leaving no operand behind it. See #633
			description: `an upper-case unit closing on a hyphen`,
			code: `a { b: 10PX-; }`,
			fixed: `a { b: 10px-; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// The hyphen stands right behind the number, so the unit is empty and `PX` is a keyword Less prints as it stands, `a { b: 10 PX 2REM; }`; the second dimension holds the fixer, since an accept case never runs it. See #633
			description: `a word whose hyphen leaves no unit at all beside a dimension of its own`,
			code: `a { b: 10-PX 2REM; }`,
			fixed: `a { b: 10-PX 2rem; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 18,
			message: messages.expected(`REM`, `rem`),
		},
		{
			// Less reads a variable's value as an expression whatever it spells, and prints `10PX A` for this one. See #633
			description: `an upper-case unit a hyphen welds a word to, in the value of a Less at-variable`,
			code: `@v: 10PX-A;`,
			fixed: `@v: 10px-A;`,
			line: 1,
			column: 7,
			endLine: 1,
			endColumn: 9,
			message: messages.expected(`PX`, `px`),
		},
		{
			// See #633
			description: `the same word in a set of media parameters, which Less reads as an expression too`,
			code: `@media (min-width: 10PX-A) { a { b: c } }`,
			fixed: `@media (min-width: 10px-A) { a { b: c } }`,
			line: 1,
			column: 22,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`PX`, `px`),
		},
		{
			// Less prints `10PX -A` here, the sign kept and the keyword as it stands. See #633
			description: `the same word in the value of a custom property`,
			code: `a { --x: 10PX-A; }`,
			fixed: `a { --x: 10px-A; }`,
			line: 1,
			column: 12,
			endLine: 1,
			endColumn: 14,
			message: messages.expected(`PX`, `px`),
		},
		{
			// Inside a calculation Less prints the subtraction back without spaces, `calc(10PX-2REM)`, and it is two dimensions there as everywhere else. See #633
			description: `two upper-case units a hyphen welds together inside a calculation`,
			code: `a { b: calc(10PX-2REM); }`,
			fixed: `a { b: calc(10px-2rem); }`,
			warnings: [
				{
					line: 1,
					column: 15,
					endLine: 1,
					endColumn: 17,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 19,
					endLine: 1,
					endColumn: 22,
					message: messages.expected(`REM`, `rem`),
				},
			],
		},
		{
			// The escape ends the unit in front of the hyphen it covers, which is the same place, and Less prints `10PX \-A`. See #527 and #633
			description: `an upper-case unit an escaped hyphen welds a word to`,
			code: `a { b: 10PX\\-A; }`,
			fixed: `a { b: 10px\\-A; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// Less reads a number as digits and at most one period, so a use of this variable compiles to `a { width: 1E 5PX; }` — the dimension `1E`, whose unit is `E`, beside the dimension `5PX`. That the `E` is a unit is what the arithmetic says: `1E+5PX` compiles to `6E`. The core reads one dimension whose number is `1E5` and named `PX` alone. See #646
			description: `an upper-case unit behind an exponent, in the value of a Less at-variable`,
			code: `@v: 1E5PX;`,
			fixed: `@v: 1e5px;`,
			warnings: [
				{
					line: 1,
					column: 6,
					endLine: 1,
					endColumn: 7,
					message: messages.expected(`E`, `e`),
				},
				{
					line: 1,
					column: 8,
					endLine: 1,
					endColumn: 10,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// See #646
			description: `the same word in a set of media parameters, which Less reads as an expression too`,
			code: `@media (min-width: 1E5PX) { a { b: c } }`,
			fixed: `@media (min-width: 1e5px) { a { b: c } }`,
			warnings: [
				{
					line: 1,
					column: 21,
					endLine: 1,
					endColumn: 22,
					message: messages.expected(`E`, `e`),
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
			// Less prints `1E 5PX` here as well. See #646
			description: `the same word in the value of a custom property`,
			code: `a { --x: 1E5PX; }`,
			fixed: `a { --x: 1e5px; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: messages.expected(`E`, `e`),
				},
				{
					line: 1,
					column: 13,
					endLine: 1,
					endColumn: 15,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// See #646
			description: `the same word inside a calculation`,
			code: `a { b: calc(1E5PX); }`,
			fixed: `a { b: calc(1e5px); }`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 15,
					message: messages.expected(`E`, `e`),
				},
				{
					line: 1,
					column: 16,
					endLine: 1,
					endColumn: 18,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// See #646
			description: `the same word inside a call of another name`,
			code: `a { b: max(1E5PX, 1px); }`,
			fixed: `a { b: max(1e5px, 1px); }`,
			warnings: [
				{
					line: 1,
					column: 13,
					endLine: 1,
					endColumn: 14,
					message: messages.expected(`E`, `e`),
				},
				{
					line: 1,
					column: 15,
					endLine: 1,
					endColumn: 17,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// See #646
			description: `the same word in the last declaration of a block, written without a semicolon`,
			code: `a { width: 1E5PX }`,
			fixed: `a { width: 1e5px }`,
			warnings: [
				{
					line: 1,
					column: 13,
					endLine: 1,
					endColumn: 14,
					message: messages.expected(`E`, `e`),
				},
				{
					line: 1,
					column: 15,
					endLine: 1,
					endColumn: 17,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// The value spells none of the characters that make Less read a declaration's value, so it is stored unread and printed whole, and what reaches the browser is the CSS dimension `1E5PX` whose unit is `PX`. The write is right under that reading too: the case of an exponent is nothing to CSS, and `lightningcss` compiles both spellings to `width: 100000px`. See #646
			description: `the same word in a declaration closing on a semicolon, whose value Less stores unread`,
			code: `a { width: 1E5PX; }`,
			fixed: `a { width: 1e5px; }`,
			warnings: [
				{
					line: 1,
					column: 13,
					endLine: 1,
					endColumn: 14,
					message: messages.expected(`E`, `e`),
				},
				{
					line: 1,
					column: 15,
					endLine: 1,
					endColumn: 17,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// The tokenizer reads the whole word as a number and the core finds no unit in it at all; Less prints `1E 5`. See #646
			description: `an exponent in a word the tokenizer reads as a number`,
			code: `@v: 1E5;`,
			fixed: `@v: 1e5;`,
			line: 1,
			column: 6,
			endLine: 1,
			endColumn: 7,
			message: messages.expected(`E`, `e`),
		},
		{
			// Less prints `1E 5%`. See #646
			description: `the same exponent in a word the tokenizer reads as a percentage`,
			code: `@v: 1E5%;`,
			fixed: `@v: 1e5%;`,
			line: 1,
			column: 6,
			endLine: 1,
			endColumn: 7,
			message: messages.expected(`E`, `e`),
		},
		{
			// Less prints `1E 5PX 9`, the digit ending the unit and opening a number of its own. See #646
			description: `an exponent and an upper-case unit a digit closes`,
			code: `@v: 1E5PX9;`,
			fixed: `@v: 1e5px9;`,
			warnings: [
				{
					line: 1,
					column: 6,
					endLine: 1,
					endColumn: 7,
					message: messages.expected(`E`, `e`),
				},
				{
					line: 1,
					column: 8,
					endLine: 1,
					endColumn: 10,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// Less prints `1E 5E 5PX`, so the word holds three dimensions; the core reads one whose unit is `E5PX`. See #646
			description: `a word of two exponents and an upper-case unit`,
			code: `@v: 1E5E5PX;`,
			fixed: `@v: 1e5e5px;`,
			warnings: [
				{
					line: 1,
					column: 6,
					endLine: 1,
					endColumn: 7,
					message: messages.expected(`E`, `e`),
				},
				{
					line: 1,
					column: 8,
					endLine: 1,
					endColumn: 9,
					message: messages.expected(`E`, `e`),
				},
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 12,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// The period belongs to the number, so Less prints `1.5E 3PX`. See #646
			description: `an exponent behind a number holding a period`,
			code: `@v: 1.5E3PX;`,
			fixed: `@v: 1.5e3px;`,
			warnings: [
				{
					line: 1,
					column: 8,
					endLine: 1,
					endColumn: 9,
					message: messages.expected(`E`, `e`),
				},
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 12,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// See #646
			description: `the same number written without its leading zero`,
			code: `@v: .5E3PX;`,
			fixed: `@v: .5e3px;`,
			warnings: [
				{
					line: 1,
					column: 7,
					endLine: 1,
					endColumn: 8,
					message: messages.expected(`E`, `e`),
				},
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 11,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// The hyphen is the operator Less subtracts at, and it compiles the use of this variable to `a { width: -4E; }`, the unit of the left operand carried through. See #633 and #646
			description: `an exponent whose sign is a hyphen`,
			code: `@v: 1E-5PX;`,
			fixed: `@v: 1e-5px;`,
			warnings: [
				{
					line: 1,
					column: 6,
					endLine: 1,
					endColumn: 7,
					message: messages.expected(`E`, `e`),
				},
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 11,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// Less adds the two and prints `6E`. See #646
			description: `the same exponent with a plus in place of the hyphen`,
			code: `@v: 1E+5PX;`,
			fixed: `@v: 1e+5px;`,
			warnings: [
				{
					line: 1,
					column: 6,
					endLine: 1,
					endColumn: 7,
					message: messages.expected(`E`, `e`),
				},
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 11,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// Less prints `10PX 9`, the digit opening a number of its own, and the rule named `PX9` for a unit Less calls `PX`. A digit has no case, so the fix writes the same bytes either way. See #646
			description: `an upper-case unit a digit closes`,
			code: `@v: 10PX9;`,
			fixed: `@v: 10px9;`,
			line: 1,
			column: 7,
			endLine: 1,
			endColumn: 9,
			message: messages.expected(`PX`, `px`),
		},
		{
			// Less prints `10PX 9PX`, two dimensions where the core reads the unit `PX9PX`. See #646
			description: `two upper-case units a digit welds together`,
			code: `@v: 10PX9PX;`,
			fixed: `@v: 10px9px;`,
			warnings: [
				{
					line: 1,
					column: 7,
					endLine: 1,
					endColumn: 9,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 12,
					message: messages.expected(`PX`, `px`),
				},
			],
		},
		{
			// An underscore is a code point of the unit Less reads, so it prints `1_ 5PX`: the unit of the first dimension is the underscore alone, which has no case. See #646
			description: `an underscore unit a digit welds an upper-case one to`,
			code: `@v: 1_5PX;`,
			fixed: `@v: 1_5px;`,
			line: 1,
			column: 8,
			endLine: 1,
			endColumn: 10,
			message: messages.expected(`PX`, `px`),
		},
		{
			// Less prints `1E 3PX`, the third dimension subtracted from the second. See #633 and #646
			description: `an exponent in front of a subtraction`,
			code: `@v: 1E5PX-2REM;`,
			fixed: `@v: 1e5px-2rem;`,
			warnings: [
				{
					line: 1,
					column: 6,
					endLine: 1,
					endColumn: 7,
					message: messages.expected(`E`, `e`),
				},
				{
					line: 1,
					column: 8,
					endLine: 1,
					endColumn: 10,
					message: messages.expected(`PX`, `px`),
				},
				{
					line: 1,
					column: 12,
					endLine: 1,
					endColumn: 15,
					message: messages.expected(`REM`, `rem`),
				},
			],
		},
		{
			// Less can open no entity on a code point outside ASCII and compiles the use of this variable to the word unparted, so the unit is the whole identifier here as it is to the core. See #646
			description: `an upper-case unit closing on a code point outside ASCII, which Less parts the word at nowhere`,
			code: `@v: 10PX\u00C4;`,
			fixed: `@v: 10px\u00E4;`,
			line: 1,
			column: 7,
			endLine: 1,
			endColumn: 10,
			message: messages.expected(`PX\u00C4`, `px\u00E4`),
		},
		{
			// No digit stands behind the letter, so the letters run to the end of the word and Less prints `1EPX`. See #646
			description: `a letter of an exponent with no digit behind it`,
			code: `@v: 1EPX;`,
			fixed: `@v: 1epx;`,
			line: 1,
			column: 6,
			endLine: 1,
			endColumn: 9,
			message: messages.expected(`EPX`, `epx`),
		},
	],
})
testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`upper`],

	accept: [
		{
			// Less compiles this to `a { width: 10PX \\#fff; }`, the escaped value printed as written, so the unit is `PX` and nothing of the hash, where the core names `PX\\#fff` and asks for `PX\\#FFF`. See #527
			description: `an upper-case unit with an escaped hash in lower case welded to it, which Less reads as a value of its own`,
			code: `a { width: 10PX\\#fff; }`,
		},
		{
			// See #527
			// A number and an escaped value to Less, `10 \\#fff`; the core reads a dimension whose whole unit is the escaped hash, and asked for `\\#FFF` here.
			description: `a number with an escaped hash welded to it, which leaves no unit to read`,
			code: `a { width: 10\\#fff; }`,
		},
		{
			description: `a unit inside an end-of-line comment, which the rule does not read`,
			code: `a { width: 1EM; \n// width: 10px\n }`,
		},
		{
			// See #234
			description: `a unit in front of an interpolation whose text holds a bang, in a word that is no standard value`,
			code: `a { b: 10px@{aB!x}; }`,
		},
		{
			// See #298
			description: `a lower-case unit in front of an interpolation whose text holds whitespace, in a set of media parameters, which is a place the Less parser carries such a value`,
			code: `@media (min-width: 10px@{aB b}) { a { b: c } }`,
		},
		{
			// See #298
			description: `the same interpolation written in a custom property`,
			code: `a { --x: 10px@{aB b}; }`,
		},
		{
			// See #271
			description: `a word of a multiplication standing in the text of an inline comment the value holds, whose dimensions the rule would read one at a time`,
			code: `
				a { b: 1PX // 2px*3rem
					; }
			`,
		},
		{
			// See #271
			description: `a lower-case unit standing in the text of an inline comment a set of media parameters holds`,
			code: `
				@media (min-width: 100PX // 2px
				) { a { b: c } }
			`,
		},
		{
			// See #271
			description: `an address opened in that text and reaching past the break that closes the comment, which the rule passes over as it passes over every address`,
			code: `
				a { b: 1PX // url(
					2px); }
			`,
		},
		{
			// Less compiles this to `a { b: 10PX a; }`: the dimension, and beside it a keyword printed exactly as written. The unit is `PX` and nothing of the keyword, where the core names `PX-a` and asks for `PX-A`. See #633
			description: `an upper-case unit a hyphen welds a lower-case word to, which Less reads as a keyword of its own`,
			code: `a { b: 10PX-a; }`,
		},
		{
			// Both units of `1E 5PX` already stand in the case asked for. See #646
			description: `an exponent and the unit behind it, both in upper case`,
			code: `@v: 1E5PX;`,
		},
	],

	reject: [
		{
			// See #271
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
			// See #271
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
		// See #233
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
			// See #425
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
			// The hash opens no interpolation and is a code point of the unit to the tokenizer, to Sass and to `lightningcss`, so the core names `px\\#fff`; Less parts the word at the escape and compiles the line to `a { width: 10px \\#fff; }`, so the unit is `px` here and the fix leaves the hash's case alone where it used to write `10PX\\#FFF`. See #414 and #527
			description: `a lower-case unit with an escaped hash welded to it, which Less reads as a value of its own`,
			code: `a { b: 10px\\#fff; }`,
			fixed: `a { b: 10PX\\#fff; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`px`, `PX`),
		},
		{
			// Less prints `1e 5px`, two dimensions, and the core reads one whose number is `1e5` and named `px` alone. See #646
			description: `a lower-case unit behind an exponent, in the value of a Less at-variable`,
			code: `@v: 1e5px;`,
			fixed: `@v: 1E5PX;`,
			warnings: [
				{
					line: 1,
					column: 6,
					endLine: 1,
					endColumn: 7,
					message: messages.expected(`e`, `E`),
				},
				{
					line: 1,
					column: 8,
					endLine: 1,
					endColumn: 10,
					message: messages.expected(`px`, `PX`),
				},
			],
		},
		{
			// The tokenizer reads the whole word as a number and the core finds no unit in it at all; Less prints `1e 5`. See #646
			description: `an exponent in a word the tokenizer reads as a number`,
			code: `@v: 1e5;`,
			fixed: `@v: 1E5;`,
			line: 1,
			column: 6,
			endLine: 1,
			endColumn: 7,
			message: messages.expected(`e`, `E`),
		},
		{
			// The keyword the hyphen welds on keeps its case where the fix used to write `10PX-A`; the second dimension holds the fixer to that. See #633
			description: `a lower-case unit a hyphen welds a word to, beside a dimension of its own`,
			code: `a { b: 10px-a 2rem; }`,
			fixed: `a { b: 10PX-a 2REM; }`,
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
					column: 16,
					endLine: 1,
					endColumn: 19,
					message: messages.expected(`rem`, `REM`),
				},
			],
		},
	],
})
