import { createRule } from "../../../../rules/at-rule-name-case/index.ts"
import { less } from "../../index.ts"

let { ruleName } = createRule(less)

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
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
		{
			description: `a call to a Less detached ruleset, which takes no arguments and no space in front of its parentheses`,
			code: `
				@detachedRuleset: { margin: 0; };
				span { @detachedRuleset(); }
			`,
		},
	],
})
