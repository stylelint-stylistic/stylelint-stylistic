import { createRule } from "../../../../rules/declaration-block-single-line-max-declarations/index.ts"
import { styled } from "../../index.ts"

let { ruleName, messages } = createRule(styled)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [1],
	customSyntax: `postcss-styled-syntax`,

	accept: [
		{
			description: `a template holding two declarations with no rule around them, which is the root and no block`,
			code: `const A = styled.div\`color: pink; top: 0;\``,
		},
	],

	reject: [
		{
			description: `a single-line block holding two declarations inside a template`,
			code: `const A = styled.div\`a { color: pink; top: 0; }\``,
			line: 1,
			column: 24,
			endLine: 1,
			endColumn: 48,
			message: messages.expected(1),
		},
		// #640
		{
			description: `a single-line block of an at-rule holding two declarations inside a template`,
			code: `const A = styled.div\`@media (x) { color: pink; top: 0; }\``,
			line: 1,
			column: 33,
			endLine: 1,
			endColumn: 57,
			message: messages.expected(1),
		},
	],
})
