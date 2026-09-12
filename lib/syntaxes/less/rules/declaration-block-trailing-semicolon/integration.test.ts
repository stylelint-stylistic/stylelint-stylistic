import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../../../index.ts"
import { createRule as createAtRuleSpaceBefore } from "../../../../rules/at-rule-semicolon-space-before/index.ts"
import { createRule as createNewlineBefore } from "../../../../rules/declaration-block-semicolon-newline-before/index.ts"
import { createRule as createSpaceBefore } from "../../../../rules/declaration-block-semicolon-space-before/index.ts"
import { createRule } from "../../../../rules/declaration-block-trailing-semicolon/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)
let { ruleName: newlineBeforeRuleName } = createNewlineBefore(less)
let { ruleName: spaceBeforeRuleName } = createSpaceBefore(less)
let { ruleName: atRuleSpaceBeforeRuleName } = createAtRuleSpaceBefore(less)

// The neighbour is named and this rule listed behind it, as in the core's integration test (#354); these blocks add that the settings read are the namespace's own, and that a `//` comment ending the value parts the two whitespaces: a break closes the comment ahead of the semicolon, and a space would take the semicolon into it.
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

// The neighbour's fix is off, so the break it asks for could only be this rule's write, and the file and this rule's warning are asserted directly: the neighbour reads the comment's semicolon as well. See #359
describe(`a semicolon in the text of an inline comment ending the value`, () => {
	it(`is left in the comment where the namespace's rule asks for a break in front of the semicolon, which would take it out`, async () => {
		let code = `a {\n\tb: c // ;\n}\n`
		let rules = { [ruleName]: `always`, [newlineBeforeRuleName]: [`always`, { disableFix: true }] }
		let result = await stylelint.lint({ code, config: { plugins, rules }, customSyntax: `postcss-less`, fix: true })

		expect(result.code).toBe(code)
		expect(result.results[0]?.warnings.filter((warning) => warning.rule === ruleName).map((warning) => ({ line: warning.line, column: warning.column, text: warning.text }))).toEqual([{ line: 2, column: 8, text: messages.expected }])
	})
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

testRule({
	ruleName: atRuleSpaceBeforeRuleName,
	config: [`always`],

	reject: [
		{
			// See #477
			description: `a bodiless at-rule closing the block, whose written semicolon gets the space the namespace's rule asks for`,
			code: `a { @foo bar }`,
			fixed: `a { @foo bar ; }`,
			line: 1,
			column: 12,
			message: messages.expected,
		},
		{
			description: `a mixin call, which the parser reads as an at-rule and the space rule of at-rules passes over as no at-rule of standard CSS, so the written semicolon stays bare whatever that rule asks`,
			code: `a { .m() }`,
			fixed: `a { .m(); }`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
	],
})
