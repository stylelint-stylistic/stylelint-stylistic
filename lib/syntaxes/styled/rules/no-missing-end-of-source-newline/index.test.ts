import { createRule } from "../../../../rules/no-missing-end-of-source-newline/index.ts"
import { styled } from "../../index.ts"

let { ruleName, messages } = createRule(styled)

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	customSyntax: `postcss-styled-syntax`,
	ruleName,
	config: [true],

	accept: [
		{
			// The closing backtick stands on the line of the host code, where the stylesheet ends with the host's own line
			description: `a template not broken over lines, closing on the host's line`,
			code: `const A = styled.div\`color: red;\`\n`,
		},
		{
			description: `a template broken over lines, ending with a break in front of the closing backtick`,
			code: `const A = styled.div\`\n\tcolor: red;\n\`\n`,
		},
		{
			description: `a template opening on the host's line and ending with a break`,
			code: `const A = styled.div\`color: red;\n\`\n`,
		},
		{
			description: `a template inside a function, whose closing backtick carries the indentation of the host's line`,
			code: `function f () {\n\tconst A = styled.div\`\n\t\tcolor: red;\n\t\`\n}\n`,
		},
		{
			description: `a free semicolon alone on the host's line`,
			code: `const A = styled.div\`;\`\n`,
		},
	],
	reject: [
		{
			description: `a template broken over lines, whose closing backtick ends the declaration's line`,
			code: `const A = styled.div\`\n\tcolor: red;\`\n`,
			fixed: `const A = styled.div\`\n\tcolor: red;\n\`\n`,
			line: 2,
			column: 12,
			message: messages.rejected,
		},
		{
			description: `the same template written with carriage-return line breaks`,
			code: `const A = styled.div\`\r\n\tcolor: red;\`\n`,
			fixed: `const A = styled.div\`\r\n\tcolor: red;\r\n\`\n`,
			line: 2,
			column: 12,
			message: messages.rejected,
		},
		{
			description: `a template opening on the host's line, whose closing backtick ends the second declaration's line`,
			code: `const A = styled.div\`color: red;\n\tdisplay: block;\`\n`,
			fixed: `const A = styled.div\`color: red;\n\tdisplay: block;\n\`\n`,
			line: 2,
			column: 16,
			message: messages.rejected,
		},
	],
})
