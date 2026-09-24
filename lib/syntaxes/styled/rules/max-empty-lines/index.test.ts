import { createRule } from "../../../../rules/max-empty-lines/index.ts"
import { styled } from "../../index.ts"

let { ruleName, messages } = createRule(styled)

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [1],
	customSyntax: `postcss-styled-syntax`,

	accept: [
		{
			description: `a blank line opening a template, whose run opens on the line the host code stands on`,
			code: `const A = styled.div\`\n\n\tcolor: pink;\n\`\n`,
		},
	],

	reject: [
		{
			description: `two blank lines opening a template, one of them standing on a line of its own`,
			code: `const A = styled.div\`\n\n\n\tcolor: pink;\n\`\n`,
			fixed: `const A = styled.div\`\n\n\tcolor: pink;\n\`\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside a template, whose surrounding code the stringifier of the syntax prints in front of the stylesheet`,
			code: `const A = styled.div\`\n\tcolor: pink;\n\n\n\ttop: 0;\n\`\n`,
			fixed: `const A = styled.div\`\n\tcolor: pink;\n\n\ttop: 0;\n\`\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines in front of a stray semicolon standing behind the closing brace of a rule of a template`,
			code: `const A = styled.div\`\n\ta {}\n\n\n;\n\`\n`,
			fixed: `const A = styled.div\`\n\ta {}\n\n;\n\`\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
	],
})
