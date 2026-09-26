import { createRule } from "../../../../rules/no-eol-whitespace/index.ts"
import { styled } from "../../index.ts"

let { ruleName, messages } = createRule(styled)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-styled-syntax`,

	accept: [],

	reject: [
		{
			// JavaScript cooks the template's escapes before the stylesheet is read, so a backslash in the source escapes the space for JavaScript alone and the stylesheet holds a plain one
			description: `a space a backslash escapes in a template's source, which the stylesheet reads as a plain space`,
			code: `const A = styled.div\`\n  color: a\\ \n\`;`,
			fixed: `const A = styled.div\`\n  color: a\\\n\`;`,
			line: 2,
			column: 12,
			message: messages.rejected,
		},
	],
})
