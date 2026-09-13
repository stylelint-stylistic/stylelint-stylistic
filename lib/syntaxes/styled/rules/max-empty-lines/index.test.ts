import { createRule } from "../../../../rules/max-empty-lines/index.ts"
import { styled } from "../../index.ts"

let { ruleName, messages } = createRule(styled)

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [1],
	customSyntax: `postcss-styled-syntax`,

	reject: [
		// See #583
		{
			description: `two blank lines inside a template, whose surrounding code the stringifier of the syntax prints in front of the stylesheet`,
			code: `const A = styled.div\`\n\tcolor: pink;\n\n\n\ttop: 0;\n\`\n`,
			fixed: `const A = styled.div\`\n\tcolor: pink;\n\n\ttop: 0;\n\`\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
	],
})
