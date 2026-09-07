import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"
import { messages as braceNewlineAfterMessages } from "../block-opening-brace-newline-after/index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

// The library lists the block's rule first and its extra rule behind it: the order in which an undeferred check would have reported a block the neighbour was about to break over two lines
testRule({
	ruleName,
	config: [1],
	extraRules: { "@stylistic/block-opening-brace-newline-after": `always` },

	reject: [
		{
			description: `a single-line block holding two declarations, reported behind the neighbour in the check and not at all in the fixing run, where the neighbour has broken the block over two lines before the rule reads it`,
			code: `a { color: pink; top: 0; }`,
			fixed: `
				a {
				 color: pink; top: 0; }
			`,
			warnings: [
				{
					line: 1,
					column: 4,
					endLine: 1,
					endColumn: 5,
					message: braceNewlineAfterMessages.expectedAfter(),
				},
				{
					line: 1,
					column: 3,
					endLine: 1,
					endColumn: 27,
					message: messages.expected(1),
				},
			],
		},
	],
})

describe(`the check behind the writers of the run`, () => {
	it(`reports the block three never-multi-line rules leave on one line, which was multi-line as parsed`, async () => {
		let { code, results } = await stylelint.lint({
			code: `a {\n\tcolor: pink;\n\ttop: 0;\n}\n`,
			config: {
				plugins,
				rules: {
					[ruleName]: 1,
					"@stylistic/block-opening-brace-newline-after": `never-multi-line`,
					"@stylistic/declaration-block-semicolon-newline-after": `never-multi-line`,
					"@stylistic/block-closing-brace-newline-before": `never-multi-line`,
				},
			},
			fix: true,
		})

		expect(code).toBe(`a {color: pink;top: 0;}\n`)
		expect(results[0]?.warnings.map(({ rule, line, column }) => ({ rule, line, column }))).toEqual([{ rule: ruleName, line: 1, column: 3 }])
	})
})
