import { createRule as createWriter } from "../../../../rules/declaration-block-semicolon-newline-before/index.ts"
import { createRule } from "../../../../rules/linebreaks/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)
let { ruleName: writerRuleName, messages: writerMessages } = createWriter(less)

// A break another rule writes is the one `linebreaks` asks for, and that setting is read under the namespace's own name: listed ahead of the writer, as the library lists the rule a block names ahead of its extra rules, `linebreaks` used to be looked up under the core's name alone, never found, and the writer fell back on the break the file spells (#478).
let testRule = createTestRule({ ruleName, autoStripIndent: false, customSyntax: `postcss-less`, extraRules: { [writerRuleName]: `always` } })

testRule({
	ruleName,
	config: [`windows`],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/478
			description: `a file of line feeds asked for Windows pairs, whose written break in front of the semicolon is a pair like the respelled ones`,
			code: `a {\n\tb: c;\n}`,
			fixed: `a {\r\n\tb: c\r\n;\r\n}`,
			warnings: [
				{
					line: 1,
					column: 4,
					endLine: 1,
					endColumn: 5,
					message: messages.expected(`windows`),
				},
				{
					line: 2,
					column: 7,
					endLine: 2,
					endColumn: 8,
					message: messages.expected(`windows`),
				},
				{
					line: 2,
					column: 5,
					endLine: 2,
					endColumn: 6,
					message: writerMessages.expectedBefore(),
				},
			],
		},
	],
})
