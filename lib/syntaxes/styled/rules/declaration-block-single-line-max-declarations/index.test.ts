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
			fixed: `const A = styled.div\`a {\ncolor: pink;\ntop: 0;\n}\``,
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
			fixed: `const A = styled.div\`@media (x) {\ncolor: pink;\ntop: 0;\n}\``,
			line: 1,
			column: 33,
			endLine: 1,
			endColumn: 57,
			message: messages.expected(1),
		},
		// #641; the span ends two columns short of the brace, as the base reports it (#644)
		{
			description: `a single-line block holding an interpolated declaration beside another inside a template, whose runs the fix writes as in a stylesheet`,
			code: `const A = styled.div\`a { color: \${c}; top: 0; }\``,
			fixed: `const A = styled.div\`a {\ncolor: \${c};\ntop: 0;\n}\``,
			line: 1,
			column: 24,
			endLine: 1,
			endColumn: 48,
			message: messages.expected(1),
		},
	],
})
