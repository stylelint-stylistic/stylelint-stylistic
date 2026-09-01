import { createRule as createNewlineBefore } from "../../../../rules/declaration-block-semicolon-newline-before/index.ts"
import { createRule as createSpaceBefore } from "../../../../rules/declaration-block-semicolon-space-before/index.ts"
import { createRule } from "../../../../rules/declaration-block-trailing-semicolon/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)
let { ruleName: newlineBeforeRuleName } = createNewlineBefore(less)
let { ruleName: spaceBeforeRuleName } = createSpaceBefore(less)

// The neighbour is named and this rule listed behind it, for the reason the core's integration test gives (#354); what these blocks add is that the settings read are the namespace's own, under the names a configuration for this syntax lists, and that a double slash comment ending the value is where the two whitespaces part: a break closes the comment ahead of the semicolon, and a space would take the semicolon into it.
let testRule = createTestRule({ ruleName, extraRules: { [ruleName]: `always` }, customSyntax: `postcss-less` })

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
			description: `an inline comment ending the value, which the break closes ahead of the semicolon, so the fix lands`,
			code: `
				a {
					b: c // x
				}
			`,
			fixed: `
				a {
					b: c // x
				;
				}
			`,
			line: 2,
			column: 10,
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
			description: `an inline comment ending the value, which a space would take the semicolon into, so the code is left alone and the warning stands`,
			code: `
				a {
					b: c // x
				}
			`,
			fixed: `
				a {
					b: c // x
				}
			`,
			line: 2,
			column: 10,
			message: messages.expected,
		},
	],
})
