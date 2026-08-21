import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { margin: 0; }`,
			description: `a plain zero`,
		},
		{
			code: `a { line-height: 2; }`,
			description: `a plain integer`,
		},
		{
			code: `a { margin: 2px; }`,
			description: `an integer with a unit`,
		},
		{
			code: `a { line-height: 0.5; }`,
			description: `a unitless fraction with its leading zero`,
		},
		{
			code: `a { line-height: -0.5; }`,
			description: `a negative unitless fraction with its leading zero`,
		},
		{
			code: `a { margin: 0.5px; }`,
			description: `a fraction in pixels with its leading zero`,
		},
		{
			code: `a { margin: 0.5em; }`,
			description: `a fraction in em with its leading zero`,
		},
		{
			code: `a { line-height: 1.5; }`,
			description: `a unitless fraction greater than one`,
		},
		{
			code: `a { margin: 1.5px; }`,
			description: `a fraction greater than one with a unit`,
		},
		{
			code: `a { line-height: 10.5; }`,
			description: `a unitless fraction whose whole part ends in a zero`,
		},
		{
			code: `a { margin: 10.5px; }`,
			description: `the same fraction with a unit`,
		},
		{
			code: `a { margin: 0.3em 0.123px 0.999999px; }`,
			description: `three fractions in one value, each with its leading zero`,
		},
		{
			code: `a { transform: translate(0.4px, 0.8px); }`,
			description: `two fractions inside the arguments of a function, each with its leading zero`,
		},
		{
			code: `@media (min-width: 0.01em)`,
			description: `a fraction inside a media feature`,
		},
		{
			code: `a { background: url(data:image/svg+xml;...0.5); }`,
			description: `a data URI carrying a fraction, which the rule does not read`,
		},
		{
			code: `a { background: uRl(data:image/svg+xml;...0.5); }`,
			description: `the same call written in mixed case`,
		},
		{
			code: `a { background: URL(data:image/svg+xml;...0.5); }`,
			description: `the same call written in upper case`,
		},
		{
			code: `@import 'testfile.0.3.css'`,
			description: `an import path carrying a fraction`,
		},
		{
			code: `@iMpOrT 'testfile.0.3.css'`,
			description: `the same at-rule written in mixed case`,
		},
		{
			code: `@IMPORT 'testfile.0.3.css'`,
			description: `the same at-rule written in upper case`,
		},
		{
			code: `a { margin: 0.5em /*.6em*/ 0.7em; }`,
			description: `a fraction inside a comment, which the rule does not read`,
		},
		{
			code: `a::before { content: ".9em"; }`,
			description: `a fraction inside a string`,
		},
		{
			code: `a { my-string: ".1"; }`,
			description: `a fraction inside a string that is no content value`,
		},
	],

	reject: [
		{
			code: `a { line-height: .5; }`,
			fixed: `a { line-height: 0.5; }`,
			description: `a unitless fraction with no leading zero`,
			message: messages.expected,
			line: 1,
			column: 18,
		},
		{
			code: `a { line-height: -.5; }`,
			fixed: `a { line-height: -0.5; }`,
			description: `a negative unitless fraction with no leading zero`,
			message: messages.expected,
			line: 1,
			column: 19,
		},
		{
			code: `a { margin: .5px; }`,
			fixed: `a { margin: 0.5px; }`,
			description: `a fraction with a unit and no leading zero`,
			message: messages.expected,
			line: 1,
			column: 13,
		},
		{
			code: `a { margin: 1px .5px; }`,
			fixed: `a { margin: 1px 0.5px; }`,
			description: `a fraction with no leading zero standing second in the value`,
			message: messages.expected,
			line: 1,
			column: 17,
		},
		{
			code: `a { transform: translate(.4px, 2px); }`,
			fixed: `a { transform: translate(0.4px, 2px); }`,
			description: `a fraction with no leading zero opening the arguments of a function`,
			message: messages.expected,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(2px, .4px); }`,
			fixed: `a { transform: translate(2px, 0.4px); }`,
			description: `a fraction with no leading zero standing second in the arguments of a function`,
			message: messages.expected,
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: translate(.4px, .8px); }`,
			fixed: `a { transform: translate(0.4px, 0.8px); }`,
			description: `two fractions with no leading zeros inside the arguments of a function`,
			warnings: [
				{
					message: messages.expected,
					line: 1,
					column: 26,
				},
				{
					message: messages.expected,
					line: 1,
					column: 32,
				},
			],
		},
		{
			code: `@media (min-width: .01em)`,
			fixed: `@media (min-width: 0.01em)`,
			description: `a fraction with no leading zero inside a media feature`,
			message: messages.expected,
			line: 1,
			column: 20,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a { margin: 0; }`,
			description: `a plain zero`,
		},
		{
			code: `a { line-height: 2; }`,
			description: `a plain integer`,
		},
		{
			code: `a { margin: 2px; }`,
			description: `an integer with a unit`,
		},
		{
			code: `a { line-height: .5; }`,
			description: `a unitless fraction with no leading zero`,
		},
		{
			code: `a { line-height: -.5; }`,
			description: `a negative unitless fraction with no leading zero`,
		},
		{
			code: `a { margin: .5px; }`,
			description: `a fraction in pixels with no leading zero`,
		},
		{
			code: `a { margin: .5em; }`,
			description: `a fraction in em with no leading zero`,
		},
		{
			code: `a { line-height: 1.5; }`,
			description: `a unitless fraction greater than one`,
		},
		{
			code: `a { margin: 1.5px; }`,
			description: `a fraction greater than one with a unit`,
		},
		{
			code: `a { line-height: 10.5; }`,
			description: `a unitless fraction whose whole part ends in a zero`,
		},
		{
			code: `a { margin: 10.5px; }`,
			description: `the same fraction with a unit`,
		},
		{
			code: `a { margin: .3em .123px .999999px; }`,
			description: `three fractions in one value, none of them with a leading zero`,
		},
		{
			code: `a { transform: translate(.4px, .8px); }`,
			description: `two fractions inside the arguments of a function, neither with a leading zero`,
		},
		{
			code: `a { background: url(data:image/svg+xml;...0.5); }`,
			description: `a data URI carrying a fraction, which the rule does not read`,
		},
		{
			code: `a { background: uRl(data:image/svg+xml;...0.5); }`,
			description: `the same call written in mixed case`,
		},
		{
			code: `a { background: URL(data:image/svg+xml;...0.5); }`,
			description: `the same call written in upper case`,
		},
		{
			code: `@import 'testfile.0.3.css'`,
			description: `an import path carrying a fraction`,
		},
		{
			code: `@iMpOrT 'testfile.0.3.css'`,
			description: `the same at-rule written in mixed case`,
		},
		{
			code: `@IMPORT 'testfile.0.3.css'`,
			description: `the same at-rule written in upper case`,
		},
	],

	reject: [
		{
			code: `a { line-height: 0.5; }`,
			fixed: `a { line-height: .5; }`,
			description: `a unitless fraction with a leading zero`,
			message: messages.rejected,
			line: 1,
			column: 18,
		},
		{
			code: `a { line-height: -0.5; }`,
			fixed: `a { line-height: -.5; }`,
			description: `a negative unitless fraction with a leading zero`,
			message: messages.rejected,
			line: 1,
			column: 19,
		},
		{
			code: `a { margin: 0.5px; }`,
			fixed: `a { margin: .5px; }`,
			description: `a fraction with a unit and a leading zero`,
			message: messages.rejected,
			line: 1,
			column: 13,
		},
		{
			code: `a { margin: 1px 0.5px; }`,
			fixed: `a { margin: 1px .5px; }`,
			description: `a fraction with a leading zero standing second in the value`,
			message: messages.rejected,
			line: 1,
			column: 17,
		},
		{
			code: `a { transform: translate(0.4px, 2px); }`,
			fixed: `a { transform: translate(.4px, 2px); }`,
			description: `a fraction with a leading zero opening the arguments of a function`,
			message: messages.rejected,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(2px, 0.8px); }`,
			fixed: `a { transform: translate(2px, .8px); }`,
			description: `a fraction with a leading zero standing second in the arguments of a function`,
			message: messages.rejected,
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: translate(0.4px, 0.8px); }`,
			fixed: `a { transform: translate(.4px, .8px); }`,
			description: `two fractions with leading zeros inside the arguments of a function`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 26,
				},
				{
					message: messages.rejected,
					line: 1,
					column: 33,
				},
			],
		},
		{
			code: `a { line-height: 000.5; }`,
			fixed: `a { line-height: .5; }`,
			description: `three zeros in front of the decimal point`,
			message: messages.rejected,
			line: 1,
			column: 18,
		},
		{
			code: `@media (min-width: 0.01em)`,
			fixed: `@media (min-width: .01em)`,
			description: `a fraction with a leading zero inside a media feature`,
			message: messages.rejected,
			line: 1,
			column: 20,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
		{
			code: `@foo: .5px;`,
			fixed: `@foo: 0.5px;`,
			description: `a Less at-variable keeps the fix written to its params`,
			message: messages.expected,
			line: 1,
			column: 7,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	reject: [
		{
			code: `@foo: 0.5px;`,
			fixed: `@foo: .5px;`,
			description: `a Less at-variable keeps the fix written to its params`,
			message: messages.rejected,
			line: 1,
			column: 7,
		},
	],
})
