import { createRule } from "../../../../rules/declaration-colon-newline-after/index.ts"
import { createRule as createColonSpaceAfter } from "../../../../rules/declaration-colon-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)
let { ruleName: colonSpaceAfterRuleName } = createColonSpaceAfter(scss)

let testRule = createTestRule({ ruleName })

// The two colon rules read one and the same run behind the colon (#484), and an inline comment stands where a word does: the file used to grow by a space on every run of the fixer with this rule listed first.
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,
	extraRules: { [colonSpaceAfterRuleName]: `always` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/484
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
