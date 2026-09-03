import { createRule } from "../../../../rules/unit-case/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `an upper-case unit in front of an interpolation whose text holds whitespace, which the value parser breaks the word on`,
			code: `a { b: 10PX#{$aB != $b}; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/296 and https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `an upper-case unit written inside an interpolation, where the language reading it is not the one this rule is about`,
			code: `a { margin: calc(100% - #{$margin * 2PX}); }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/297
			description: `a lower-case dimension multiplied by a variable, standing beside a word whose unit is miscased`,
			code: `a { b: 1PX 10px*$VAR; }`,
			fixed: `a { b: 1px 10px*$VAR; }`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 11,
			message: messages.expected(`PX`, `px`),
		},
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
			description: `an upper-case unit multiplied by a variable spelled in capitals, whose name the fix leaves as it is`,
			code: `a { b: 10PX*$VAR; }`,
			fixed: `a { b: 10px*$VAR; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/413
			description: `a variable spelled in capitals multiplied by an upper-case unit, a word the whole of which is no dimension`,
			code: `a { b: $VAR*10PX; }`,
			fixed: `a { b: $VAR*10px; }`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/425
			description: `a variable multiplied by an upper-case unit, which used to be reported and never written`,
			code: `a { b: $var*2REM; }`,
			fixed: `a { b: $var*2rem; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`REM`, `rem`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/425
			description: `a variable read through a Sass module multiplied by an upper-case unit`,
			code: `a { b: ns.$v*10PX; }`,
			fixed: `a { b: ns.$v*10px; }`,
			line: 1,
			column: 16,
			endLine: 1,
			endColumn: 18,
			message: messages.expected(`PX`, `px`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			description: `an upper-case unit with the name of a Sass variable welded behind it, which is no part of the unit and stays as it was written`,
			code: `a { b: 10PX$VAR; }`,
			fixed: `a { b: 10px$VAR; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`PX`, `px`),
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `a lower-case unit in front of an interpolation whose text holds whitespace, which the value parser breaks the word on`,
			code: `a { b: 10px#{$aB != $b}; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `the same unit and interpolation written in a set of media parameters`,
			code: `@media (min-width: 10px#{$aB != $b}) { a { b: c; } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `a multiplication of two lower-case dimensions reaching into an interpolation whose text holds whitespace`,
			code: `a { b: 1px*2rem#{$aB != $b}; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `a lower-case unit in a word that opens inside an interpolation and reaches out of it, which is that word read from the other side`,
			code: `a { b: #{$n * 2}10px; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `the same word opening on the brace that closes the interpolation rather than inside it`,
			code: `a { b: #{$a }10px; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/296 and https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298
			description: `a lower-case unit written inside an interpolation, where the language reading it is not the one this rule is about`,
			code: `a { margin: calc(100% - #{$margin * 2px}); }`,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/425
			description: `a variable multiplied by a lower-case unit, which used to be reported and never written`,
			code: `a { b: $var*2rem; }`,
			fixed: `a { b: $var*2REM; }`,
			line: 1,
			column: 14,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`rem`, `REM`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414
			description: `a lower-case unit welded by an escaped star to a second one, which Sass leaves whole where it multiplies the unescaped twin`,
			code: `a { b: 10px\\*2rem; }`,
			fixed: `a { b: 10PX\\*2REM; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 18,
			message: messages.expected(`px\\*2rem`, `PX\\*2REM`),
		},
	],
})
