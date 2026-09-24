import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../../../index.ts"
import { createRule } from "../../../../rules/at-rule-name-case/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`lower`],

	accept: [
		{
			description: `a Less mixin, whose parentheses are no at-rule`,
			code: `
				.someMixin() { margin: 0; }

				span { .someMixin(); }
			`,
		},
		{
			description: `a Less variable, which the parser gives the shape of an at-rule`,
			code: `
				@myVariable: #f7f8f9;
				span { background-color: @myVariable; }
			`,
		},
		{
			description: `a call to a Less detached ruleset, which takes no arguments and no space in front of its parentheses`,
			code: `
				@detachedRuleset: { margin: 0; };
				span { @detachedRuleset(); }
			`,
		},
		{
			description: `a Less variable declared with a space in front of its colon, which the parser leaves unmarked`,
			code: `
				@V : pink;
				span { background-color: @V; }
			`,
		},
		{
			description: `the same variable declared with a tab in front of its colon`,
			code: `
				@V\t: pink;
				span { background-color: @V; }
			`,
		},
		{
			description: `the same variable declared with a line break in front of its colon`,
			code: `
				@V
				: pink;
				span { background-color: @V; }
			`,
		},
		{
			description: `a Less variable declared with no whitespace on either side of its colon, which the parser reads into the name`,
			code: `
				@V:PINK 1px;
				span { background-color: @V; }
			`,
		},
		{
			description: `a Less detached ruleset declared with a space in front of its colon`,
			code: `
				@DR : { margin: 0; };
				span { @DR(); }
			`,
		},
	],

	reject: [
		{
			description: `a page rule whose selector opens on a colon, which is an at-rule to Less`,
			code: `@PAGE :first { margin: 0; }`,
			fixed: `@page :first { margin: 0; }`,
			line: 1,
			column: 1,
			message: messages.expected(`PAGE`, `page`),
		},
	],
})

describe(`the upper option`, () => {
	it(`is refused, since Less reads no at-rule name holding an upper-case letter, and the file is left as it is`, async () => {
		let { code, results } = await stylelint.lint({ code: `@page :first { margin: 0; }\n`, customSyntax: `postcss-less`, config: { plugins, rules: { [ruleName]: `upper` } }, fix: true })

		expect(results[0]?.invalidOptionWarnings).toHaveLength(1)
		expect(results[0]?.warnings).toEqual([])
		expect(code).toBe(`@page :first { margin: 0; }\n`)
	})
})
