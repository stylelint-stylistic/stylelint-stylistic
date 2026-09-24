import { createRule } from "../../../../rules/unicode-bom/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a file opening with a charset, whose compiler carries no mark of the file into its output, so the mark is asked for as over any file`,
			code: `@charset "utf-8";\na{}`,
			fixed: `\uFEFF@charset "utf-8";\na{}`,
			message: messages.expected,
		},
	],
})
