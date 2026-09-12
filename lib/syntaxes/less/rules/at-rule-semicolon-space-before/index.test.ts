import { createRule } from "../../../../rules/at-rule-semicolon-space-before/index.ts"
import { less } from "../../index.ts"

let { messages, ruleName } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`always`],

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
	],

	reject: [
		{
			// See #697
			description: `an at-rule ending in an inline comment, whose closing break the fix would write over, putting the semicolon inside the comment`,
			code: `@import "x" // c\n;`,
			fixed: `@import "x" // c\n;`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			description: `an import carrying options, which the fix does space`,
			code: `@import (reference) "x";`,
			fixed: `@import (reference) "x" ;`,
			line: 1,
			column: 23,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`never`],

	reject: [
		{
			// See #697
			description: `an at-rule ending in an inline comment, whose closing break the fix would write over, putting the semicolon inside the comment`,
			code: `@import "x" // c\n;`,
			fixed: `@import "x" // c\n;`,
			line: 1,
			column: 17,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the semicolon of an import carrying options`,
			code: `@import (reference) "x" ;`,
			fixed: `@import (reference) "x";`,
			line: 1,
			column: 24,
			message: messages.rejectedBefore(),
		},
	],
})
