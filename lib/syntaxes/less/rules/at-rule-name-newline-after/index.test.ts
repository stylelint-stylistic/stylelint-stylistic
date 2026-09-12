import { createRule } from "../../../../rules/at-rule-name-newline-after/index.ts"
import { less } from "../../index.ts"

let { messages, ruleName } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`always`],

	accept: [
		{
			description: `a Less variable, which the parser gives the shape of an at-rule`,
			code: `@nice-blue:#5B83AD;`,
		},
		{
			description: `a Less variable with a space behind its colon`,
			code: `@nice-blue: #5B83AD;`,
		},
		{
			description: `a Less variable whose value stands on the next line`,
			code: `@nice-blue:\n#5B83AD;`,
		},
		{
			description: `an interpolated selector, whose at-sign opens no at-rule`,
			code: `@variable: .bucket; .@{variable} { }`,
		},
		{
			description: `a detached ruleset passed to a mixin`,
			code: `@detached-ruleset: { background: red; }; .top { @detached-ruleset(); }`,
		},
		{
			description: `a detached ruleset holding a rule of its own`,
			code: `@my-ruleset: { .my-selector { background-color: black; } };`,
		},
		{
			description: `a mixin call, which is no at-rule`,
			code: `.class1 { .mixin(#ddd) }`,
		},
		{
			description: `a parent selector, which is no at-rule either`,
			code: `.button { &-ok {} }`,
		},
	],

	reject: [
		// See #696
		{
			description: `a space where the break belongs, in a stylesheet whose variable the fixing run leaves alone`,
			code: `@nice-blue: #5B83AD;\n@media (min-width: 1px) { a { color: @nice-blue } }`,
			fixed: `@nice-blue: #5B83AD;\n@media\n (min-width: 1px) { a { color: @nice-blue } }`,
			line: 2,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
	],
})
