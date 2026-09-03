import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a plain zero`,
			code: `a { margin: 0; }`,
		},
		{
			description: `a plain integer`,
			code: `a { line-height: 2; }`,
		},
		{
			description: `an integer with a unit`,
			code: `a { margin: 2px; }`,
		},
		{
			description: `a unitless fraction with its leading zero`,
			code: `a { line-height: 0.5; }`,
		},
		{
			description: `a negative unitless fraction with its leading zero`,
			code: `a { line-height: -0.5; }`,
		},
		{
			description: `a fraction in pixels with its leading zero`,
			code: `a { margin: 0.5px; }`,
		},
		{
			description: `a fraction in em with its leading zero`,
			code: `a { margin: 0.5em; }`,
		},
		{
			description: `a unitless fraction greater than one`,
			code: `a { line-height: 1.5; }`,
		},
		{
			description: `a fraction greater than one with a unit`,
			code: `a { margin: 1.5px; }`,
		},
		{
			description: `a unitless fraction whose whole part ends in a zero`,
			code: `a { line-height: 10.5; }`,
		},
		{
			description: `the same fraction with a unit`,
			code: `a { margin: 10.5px; }`,
		},
		{
			description: `three fractions in one value, each with its leading zero`,
			code: `a { margin: 0.3em 0.123px 0.999999px; }`,
		},
		{
			description: `two fractions inside the arguments of a function, each with its leading zero`,
			code: `a { transform: translate(0.4px, 0.8px); }`,
		},
		{
			description: `a fraction inside a media feature`,
			code: `@media (min-width: 0.01em)`,
		},
		{
			description: `a data URI carrying a fraction, which the rule does not read`,
			code: `a { background: url(data:image/svg+xml;...0.5); }`,
		},
		{
			description: `the same call written in mixed case`,
			code: `a { background: uRl(data:image/svg+xml;...0.5); }`,
		},
		{
			description: `the same call written in upper case`,
			code: `a { background: URL(data:image/svg+xml;...0.5); }`,
		},
		{
			description: `an import path carrying a fraction`,
			code: `@import 'testfile.0.3.css'`,
		},
		{
			description: `the same at-rule written in mixed case`,
			code: `@iMpOrT 'testfile.0.3.css'`,
		},
		{
			description: `the same at-rule written in upper case`,
			code: `@IMPORT 'testfile.0.3.css'`,
		},
		{
			description: `a fraction inside a comment, which the rule does not read`,
			code: `a { margin: 0.5em /*.6em*/ 0.7em; }`,
		},
		{
			description: `a fraction inside a string`,
			code: `a::before { content: ".9em"; }`,
		},
		{
			description: `a fraction inside a string that is no content value`,
			code: `a { my-string: ".1"; }`,
		},
	],

	reject: [
		{
			description: `a unitless fraction with no leading zero`,
			code: `a { line-height: .5; }`,
			fixed: `a { line-height: 0.5; }`,
			line: 1,
			column: 18,
			message: messages.expected,
		},
		{
			description: `a negative unitless fraction with no leading zero`,
			code: `a { line-height: -.5; }`,
			fixed: `a { line-height: -0.5; }`,
			line: 1,
			column: 19,
			message: messages.expected,
		},
		{
			description: `a fraction with a unit and no leading zero`,
			code: `a { margin: .5px; }`,
			fixed: `a { margin: 0.5px; }`,
			line: 1,
			column: 13,
			message: messages.expected,
		},
		{
			description: `a fraction with no leading zero standing second in the value`,
			code: `a { margin: 1px .5px; }`,
			fixed: `a { margin: 1px 0.5px; }`,
			line: 1,
			column: 17,
			message: messages.expected,
		},
		{
			description: `a fraction with no leading zero opening the arguments of a function`,
			code: `a { transform: translate(.4px, 2px); }`,
			fixed: `a { transform: translate(0.4px, 2px); }`,
			line: 1,
			column: 26,
			message: messages.expected,
		},
		{
			description: `a fraction with no leading zero standing second in the arguments of a function`,
			code: `a { transform: translate(2px, .4px); }`,
			fixed: `a { transform: translate(2px, 0.4px); }`,
			line: 1,
			column: 31,
			message: messages.expected,
		},
		{
			description: `two fractions with no leading zeros inside the arguments of a function`,
			code: `a { transform: translate(.4px, .8px); }`,
			fixed: `a { transform: translate(0.4px, 0.8px); }`,
			warnings: [
				{
					line: 1,
					column: 26,
					message: messages.expected,
				},
				{
					line: 1,
					column: 32,
					message: messages.expected,
				},
			],
		},
		{
			description: `a fraction with no leading zero inside a media feature`,
			code: `@media (min-width: .01em)`,
			fixed: `@media (min-width: 0.01em)`,
			line: 1,
			column: 20,
			message: messages.expected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/268
		{
			description: `a fraction with no leading zero standing behind a block comment the value holds`,
			code: `a { b: 1px /* c */ .50em; }`,
			fixed: `a { b: 1px /* c */ 0.50em; }`,
			line: 1,
			column: 20,
			message: messages.expected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/268
		{
			description: `three fractions with no leading zero and a block comment standing among them`,
			code: `a { b: .50px /* c */ .50em .5rem; }`,
			fixed: `a { b: 0.50px /* c */ 0.50em 0.5rem; }`,
			warnings: [
				{
					line: 1,
					column: 8,
					message: messages.expected,
				},
				{
					line: 1,
					column: 22,
					message: messages.expected,
				},
				{
					line: 1,
					column: 28,
					message: messages.expected,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378
			description: `a fraction standing beside a comment opening with a solidus, a star and a solidus, whose text spells a fraction of its own that the value parser hands back as a word`,
			code: `a { b: .5 /*/ .5 */ 3; }`,
			fixed: `a { b: 0.5 /*/ .5 */ 3; }`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/508
			description: `a fraction in front of a comment holding one quotation mark, and the same text inside a string behind that comment: the mark the comment holds opens no string, so the string the file spells is one, and its text is no number`,
			code: `a { b: .5 /*/ " */ ".5"; }`,
			fixed: `a { b: 0.5 /*/ " */ ".5"; }`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a plain zero`,
			code: `a { margin: 0; }`,
		},
		{
			description: `a plain integer`,
			code: `a { line-height: 2; }`,
		},
		{
			description: `an integer with a unit`,
			code: `a { margin: 2px; }`,
		},
		{
			description: `a unitless fraction with no leading zero`,
			code: `a { line-height: .5; }`,
		},
		{
			description: `a negative unitless fraction with no leading zero`,
			code: `a { line-height: -.5; }`,
		},
		{
			description: `a fraction in pixels with no leading zero`,
			code: `a { margin: .5px; }`,
		},
		{
			description: `a fraction in em with no leading zero`,
			code: `a { margin: .5em; }`,
		},
		{
			description: `a unitless fraction greater than one`,
			code: `a { line-height: 1.5; }`,
		},
		{
			description: `a fraction greater than one with a unit`,
			code: `a { margin: 1.5px; }`,
		},
		{
			description: `a unitless fraction whose whole part ends in a zero`,
			code: `a { line-height: 10.5; }`,
		},
		{
			description: `the same fraction with a unit`,
			code: `a { margin: 10.5px; }`,
		},
		{
			description: `three fractions in one value, none of them with a leading zero`,
			code: `a { margin: .3em .123px .999999px; }`,
		},
		{
			description: `two fractions inside the arguments of a function, neither with a leading zero`,
			code: `a { transform: translate(.4px, .8px); }`,
		},
		{
			description: `a data URI carrying a fraction, which the rule does not read`,
			code: `a { background: url(data:image/svg+xml;...0.5); }`,
		},
		{
			description: `the same call written in mixed case`,
			code: `a { background: uRl(data:image/svg+xml;...0.5); }`,
		},
		{
			description: `the same call written in upper case`,
			code: `a { background: URL(data:image/svg+xml;...0.5); }`,
		},
		{
			description: `an import path carrying a fraction`,
			code: `@import 'testfile.0.3.css'`,
		},
		{
			description: `the same at-rule written in mixed case`,
			code: `@iMpOrT 'testfile.0.3.css'`,
		},
		{
			description: `the same at-rule written in upper case`,
			code: `@IMPORT 'testfile.0.3.css'`,
		},
	],

	reject: [
		{
			description: `a unitless fraction with a leading zero`,
			code: `a { line-height: 0.5; }`,
			fixed: `a { line-height: .5; }`,
			line: 1,
			column: 18,
			message: messages.rejected,
		},
		{
			description: `a negative unitless fraction with a leading zero`,
			code: `a { line-height: -0.5; }`,
			fixed: `a { line-height: -.5; }`,
			line: 1,
			column: 19,
			message: messages.rejected,
		},
		{
			description: `a fraction with a unit and a leading zero`,
			code: `a { margin: 0.5px; }`,
			fixed: `a { margin: .5px; }`,
			line: 1,
			column: 13,
			message: messages.rejected,
		},
		{
			description: `a fraction with a leading zero standing second in the value`,
			code: `a { margin: 1px 0.5px; }`,
			fixed: `a { margin: 1px .5px; }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			description: `a fraction with a leading zero opening the arguments of a function`,
			code: `a { transform: translate(0.4px, 2px); }`,
			fixed: `a { transform: translate(.4px, 2px); }`,
			line: 1,
			column: 26,
			message: messages.rejected,
		},
		{
			description: `a fraction with a leading zero standing second in the arguments of a function`,
			code: `a { transform: translate(2px, 0.8px); }`,
			fixed: `a { transform: translate(2px, .8px); }`,
			line: 1,
			column: 31,
			message: messages.rejected,
		},
		{
			description: `two fractions with leading zeros inside the arguments of a function`,
			code: `a { transform: translate(0.4px, 0.8px); }`,
			fixed: `a { transform: translate(.4px, .8px); }`,
			warnings: [
				{
					line: 1,
					column: 26,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 33,
					message: messages.rejected,
				},
			],
		},
		{
			description: `three zeros in front of the decimal point`,
			code: `a { line-height: 000.5; }`,
			fixed: `a { line-height: .5; }`,
			line: 1,
			column: 18,
			message: messages.rejected,
		},
		{
			description: `a fraction with a leading zero inside a media feature`,
			code: `@media (min-width: 0.01em)`,
			fixed: `@media (min-width: .01em)`,
			line: 1,
			column: 20,
			message: messages.rejected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/268
		{
			description: `a leading zero standing behind a block comment the value holds`,
			code: `a { b: 1px /* c */ 0.50em; }`,
			fixed: `a { b: 1px /* c */ .50em; }`,
			line: 1,
			column: 20,
			message: messages.rejected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/268
		{
			description: `a leading zero in front of a block comment the parameters of a media query hold`,
			code: `@media (min-width: 0.5px /* c */) { a { b: c; } }`,
			fixed: `@media (min-width: .5px /* c */) { a { b: c; } }`,
			line: 1,
			column: 20,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378
			description: `a fraction standing beside a comment opening with a solidus, a star and a solidus, whose text spells a fraction of its own that the value parser hands back as a word`,
			code: `a { b: 0.5 /*/ 0.5 */ 3; }`,
			fixed: `a { b: .5 /*/ 0.5 */ 3; }`,
			line: 1,
			column: 8,
			message: messages.rejected,
		},
	],
})
