import { createRule as createAtRuleSpaceBefore } from "../../../../rules/at-rule-semicolon-space-before/index.ts"
import { createRule as createNewlineBefore } from "../../../../rules/declaration-block-semicolon-newline-before/index.ts"
import { createRule as createSpaceBefore } from "../../../../rules/declaration-block-semicolon-space-before/index.ts"
import { createRule } from "../../../../rules/declaration-block-trailing-semicolon/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)
let { ruleName: newlineBeforeRuleName } = createNewlineBefore(scss)
let { ruleName: spaceBeforeRuleName } = createSpaceBefore(scss)
let { ruleName: atRuleSpaceBeforeRuleName } = createAtRuleSpaceBefore(scss)

// The neighbour is named and this rule listed behind it, for the reason the core's integration test gives (#354); what these blocks add is that the settings read are the namespace's own, under the names a configuration for this syntax lists, and that a double slash comment closing the block is a node of its own here, which the semicolon is written in front of.
let testRule = createTestRule({ ruleName, extraRules: { [ruleName]: `always` }, customSyntax: `postcss-scss` })

testRule({
	ruleName: newlineBeforeRuleName,
	config: [`always`],

	reject: [
		{
			description: `a block on one line, whose written semicolon gets the break the namespace's rule asks for`,
			code: `a { b: c }`,
			fixed: `
				a { b: c
				; }
			`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `an inline comment closing the block behind the declaration, which the parser reads as a node of its own, so the break and the semicolon are written in front of it`,
			code: `
				a {
					b: c // x
				}
			`,
			fixed: `
				a {
					b: c
				; // x
				}
			`,
			line: 2,
			column: 5,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName: spaceBeforeRuleName,
	config: [`always`],

	reject: [
		{
			description: `a block on one line, whose written semicolon gets the space the namespace's rule asks for`,
			code: `a { b: c }`,
			fixed: `a { b: c ; }`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `an inline comment closing the block behind the declaration, which the parser reads as a node of its own, so the space and the semicolon are written in front of it`,
			code: `
				a {
					b: c // x
				}
			`,
			fixed: `
				a {
					b: c ; // x
				}
			`,
			line: 2,
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
			description: `a bodiless at-rule closing the block, whose written semicolon gets the space the namespace's rule asks for`,
			code: `a { @include foo }`,
			fixed: `a { @include foo ; }`,
			line: 1,
			column: 16,
			message: messages.expected,
		},
		{
			description: `a Sass @content, which the space rule of at-rules passes over as no at-rule of standard CSS, so the written semicolon stays bare whatever that rule asks`,
			code: `a { @content }`,
			fixed: `a { @content; }`,
			line: 1,
			column: 12,
			message: messages.expected,
		},
	],
})
