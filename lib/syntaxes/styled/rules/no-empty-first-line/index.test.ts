import { createRule } from "../../../../rules/no-empty-first-line/index.ts"
import { styled } from "../../index.ts"

let { ruleName, messages } = createRule(styled)

let testRule = createTestRule({ ruleName })

testRule({
	customSyntax: `postcss-styled-syntax`,
	ruleName,
	config: [true],

	accept: [
		{
			description: `a template whose declaration opens the first line`,
			code: `
				const A = styled.div\`color: red;\`
			`,
		},
	],
	reject: [
		{
			// See #602
			description: `an empty first line in front of a free semicolon, which leaves the template's root no node`,
			code: `
				const A = styled.div\`
				;\`
			`,
			fixed: `
				const A = styled.div\`;\`
			`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
	],
})
