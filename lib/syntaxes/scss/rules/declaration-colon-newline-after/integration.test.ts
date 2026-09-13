import { createRule } from "../../../../rules/declaration-colon-newline-after/index.ts"
import { createRule as createColonSpaceAfter } from "../../../../rules/declaration-colon-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)
let { ruleName: colonSpaceAfterRuleName } = createColonSpaceAfter(scss)

let testRule = createTestRule({ ruleName })

// The two colon rules read the same run behind the colon (#484), and an inline comment stands where a word does: the file used to grow by a space on every run of the fixer with this rule listed first.
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,
	extraRules: { [colonSpaceAfterRuleName]: `always` },

	reject: [
		{
			// See #484
			description: `an inline comment on the colon's line, over whose run the file used to grow: the space rule is listed last and has the last word, so the break is not written and the warning stands`,
			code: `
				a { color: // c
				; }
			`,
			fixed: `
				a { color: // c
				; }
			`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/linebreaks": `windows` },

	reject: [
		{
			// See #716
			description: `a plain CSS file on one line, with the rule asking for Windows pairs listed under the core's name, which reads the same file`,
			code: `a { color: red; }`,
			fixed: `a { color:\r\n red; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
	],
})
