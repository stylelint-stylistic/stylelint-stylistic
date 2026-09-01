import { ruleName as atRuleSpaceBeforeRuleName } from "../at-rule-semicolon-space-before/index.ts"
import { messages as newlineBeforeMessages, ruleName as newlineBeforeRuleName } from "../declaration-block-semicolon-newline-before/index.ts"
import { messages as spaceBeforeMessages, ruleName as spaceBeforeRuleName } from "../declaration-block-semicolon-space-before/index.ts"

import { messages, ruleName } from "./index.ts"

// The semicolon this rule writes is formatted by neither rule about the whitespace in front of a block's semicolons where the configuration lists that rule ahead of this one (#354), and the one it writes behind an at-rule is one `at-rule-semicolon-space-before` has no fixer to space at all (#477). The library lists the rule a block names first and its extra rules behind it, so every block below names the neighbour and lists this rule as the extra one: for the declaration rules that is the order the fix has to answer for, since in the other one the neighbour respells whatever this rule wrote, and the at-rule blocks keep it for uniformity, their neighbour having nothing to respell in either order.
let testRule = createTestRule({ ruleName, extraRules: { [ruleName]: `always` } })

testRule({
	ruleName: newlineBeforeRuleName,
	config: [`always`],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/354
			description: `the block of the issue, whose last semicolon is written behind a line break like the one the neighbour puts in front of the other`,
			code: `
				@media screen{
				a{b:c;d:e}
				}
			`,
			fixed: `
				@media screen{
				a{b:c
				;d:e
				;}
				}
			`,
			warnings: [
				{
					line: 2,
					column: 5,
					message: newlineBeforeMessages.expectedBefore(),
				},
				{
					line: 2,
					column: 9,
					message: messages.expected,
				},
			],
		},
		{
			description: `a declaration carrying a flag, where the break goes into the raw of the flag`,
			code: `a { b: c !important }`,
			fixed: `
				a { b: c !important
				; }
			`,
			line: 1,
			column: 19,
			message: messages.expected,
		},
		{
			description: `a custom property whose value is nothing but whitespace`,
			code: `a { --b: }`,
			fixed: `
				a { --b:
				;}
			`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `a comment closing the block behind the declaration, which is a node of its own that the semicolon is written in front of`,
			code: `a { b: c /* x */ }`,
			fixed: `
				a { b: c
				; /* x */ }
			`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `a tab in front of the closing brace, which stays behind the written break and semicolon`,
			code: `a { b: c\t}`,
			fixed: `
				a { b: c
				;\t}
			`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `a double slash, which plain CSS spells no comment with, so the break and the semicolon are written behind it`,
			code: `a { b: c // x }`,
			fixed: `
				a { b: c // x
				; }
			`,
			line: 1,
			column: 13,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName: newlineBeforeRuleName,
	config: [`always-multi-line`],

	reject: [
		{
			description: `a block broken over lines, which the option speaks of, so the written semicolon gets its break`,
			code: `
				a {
					b: c;
					d: e
				}
			`,
			fixed: `
				a {
					b: c
				;
					d: e
				;
				}
			`,
			warnings: [
				{
					line: 2,
					column: 5,
					message: newlineBeforeMessages.expectedBeforeMultiLine(),
				},
				{
					line: 3,
					column: 5,
					message: messages.expected,
				},
			],
		},
		{
			description: `a block on one line, which the option is silent about, so the written semicolon is bare like the other`,
			code: `a { b: c; d: e }`,
			fixed: `a { b: c; d: e; }`,
			line: 1,
			column: 14,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName: spaceBeforeRuleName,
	config: [`always`],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/354
			description: `the block of the issue, whose last semicolon is written behind a space like the one the neighbour puts in front of the other`,
			code: `
				@media screen{
				a{b:c;d:e}
				}
			`,
			fixed: `
				@media screen{
				a{b:c ;d:e ;}
				}
			`,
			warnings: [
				{
					line: 2,
					column: 5,
					message: spaceBeforeMessages.expectedBefore(),
				},
				{
					line: 2,
					column: 9,
					message: messages.expected,
				},
			],
		},
		{
			description: `a declaration carrying a flag, where the space goes into the raw of the flag`,
			code: `a { b: c !important }`,
			fixed: `a { b: c !important ; }`,
			line: 1,
			column: 19,
			message: messages.expected,
		},
		{
			description: `a custom property whose value is nothing but whitespace, which is the space the option asks for already`,
			code: `a { --b: }`,
			fixed: `a { --b: ;}`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `a comment closing the block behind the declaration, which is a node of its own that the semicolon is written in front of`,
			code: `a { b: c /* x */ }`,
			fixed: `a { b: c ; /* x */ }`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `a tab in front of the closing brace, which stays behind the written space and semicolon`,
			code: `a { b: c\t}`,
			fixed: `a { b: c ;\t}`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `a double slash, which plain CSS spells no comment with, so the space and the semicolon are written behind it where the Less namespace declines`,
			code: `a { b: c // x }`,
			fixed: `a { b: c // x ; }`,
			line: 1,
			column: 13,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName: spaceBeforeRuleName,
	config: [`always-single-line`],

	reject: [
		{
			description: `a block on one line, which the option speaks of, so the written semicolon gets its space`,
			code: `a { b: c; d: e }`,
			fixed: `a { b: c ; d: e ; }`,
			warnings: [
				{
					line: 1,
					column: 8,
					message: spaceBeforeMessages.expectedBeforeSingleLine(),
				},
				{
					line: 1,
					column: 14,
					message: messages.expected,
				},
			],
		},
		{
			description: `a block broken over lines, which the option is silent about, so the written semicolon is bare like the other`,
			code: `
				a {
					b: c;
					d: e
				}
			`,
			fixed: `
				a {
					b: c;
					d: e;
				}
			`,
			line: 3,
			column: 5,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName: atRuleSpaceBeforeRuleName,
	config: [`always`],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/477
			description: `a bodiless at-rule closing the block, whose written semicolon gets the space that rule asks for and has no fixer to write`,
			code: `a { @foo bar }`,
			fixed: `a { @foo bar ; }`,
			line: 1,
			column: 12,
			message: messages.expected,
		},
		{
			description: `a block comment standing between the parameters and the brace, which the space and the semicolon are written behind`,
			code: `a { @foo bar /* c */ }`,
			fixed: `a { @foo bar /* c */ ; }`,
			line: 1,
			column: 20,
			message: messages.expected,
		},
		{
			description: `an at-rule standing behind a declaration, which closes the block in its place`,
			code: `a { b: c; @foo bar }`,
			fixed: `a { b: c; @foo bar ; }`,
			line: 1,
			column: 18,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName: atRuleSpaceBeforeRuleName,
	config: [`never`],

	reject: [
		{
			description: `a bodiless at-rule closing the block tight against the brace, whose written semicolon is bare as that rule asks`,
			code: `a { @foo bar}`,
			fixed: `a { @foo bar;}`,
			line: 1,
			column: 12,
			message: messages.expected,
		},
	],
})
