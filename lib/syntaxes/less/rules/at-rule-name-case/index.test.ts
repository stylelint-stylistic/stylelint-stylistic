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
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
		{
			description: `a call to a Less detached ruleset, which takes no arguments and no space in front of its parentheses`,
			code: `
				@detachedRuleset: { margin: 0; };
				span { @detachedRuleset(); }
			`,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/394
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

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`upper`],

	accept: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/394
		{
			description: `a Less variable declared with a space in front of its colon, which the parser leaves unmarked`,
			code: `
				@v : pink;
				span { background-color: @v; }
			`,
		},
		{
			description: `a Less detached ruleset declared with a space in front of its colon`,
			code: `
				@dr : { margin: 0; };
				span { @dr(); }
			`,
		},
	],

	reject: [
		{
			description: `a page rule whose selector opens on a colon, which is an at-rule to Less`,
			code: `@page :first { margin: 0; }`,
			fixed: `@PAGE :first { margin: 0; }`,
			line: 1,
			column: 1,
			message: messages.expected(`page`, `PAGE`),
		},
	],
})
