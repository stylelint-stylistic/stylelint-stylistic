import { createRule } from "../../../../rules/block-closing-brace-empty-line-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// See #374
			description: `a closing brace a line below a mixin call's important flag, where the empty line this option writes stays behind the flag rather than moving in front of it on the next parse`,
			code: `
				a {
					.m() !important
				}
			`,
			fixed: `
				a {
					.m() !important

				}
			`,
			line: 3,
			column: 1,
			message: messages.expected,
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// See #374
			description: `an empty line between a mixin call's important flag and the closing brace, which the parser collects into the call's raw along with the space in front of the flag`,
			code: `
				a {
					.m() !important

				}
			`,
			fixed: `
				a {
					.m() !important
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejected,
		},
	],
})
