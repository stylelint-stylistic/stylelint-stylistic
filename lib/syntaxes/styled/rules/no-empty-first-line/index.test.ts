import { createRule } from "../../../../rules/no-empty-first-line/index.ts"
import { styled } from "../../index.ts"

let { ruleName, messages } = createRule(styled)

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	customSyntax: `postcss-styled-syntax`,
	ruleName,
	config: [true],

	accept: [
		{
			description: `a template whose declaration opens the first line`,
			code: `const A = styled.div\`color: red;\`\n`,
		},
		{
			// The break behind the opening backtick ends the line of the host code, which is no line of the stylesheet
			description: `a template opening with a break, whose declaration stands on the line behind the host's`,
			code: `const A = styled.div\`\n\tcolor: red;\n\`\n`,
		},
		{
			description: `the same template with spaces in front of the break, on the host's line`,
			code: `const A = styled.div\`  \n\tcolor: red;\n\`\n`,
		},
		{
			description: `a template holding an empty line between two declarations, which is no first line`,
			code: `const A = styled.div\`\n\tcolor: red;\n\n\tdisplay: block;\n\`\n`,
		},
		{
			description: `a template opening with a break in front of a free semicolon, which leaves the template's root no node`,
			code: `const A = styled.div\`\n;\`\n`,
		},
	],
	reject: [
		{
			// The second break of the run ends an empty line of the stylesheet, which comes off while the host's break stays
			description: `an empty line behind the host's line, in front of the declaration`,
			code: `const A = styled.div\`\n\n\tcolor: red;\n\`\n`,
			fixed: `const A = styled.div\`\n\tcolor: red;\n\`\n`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		{
			description: `the same template written with carriage-return line breaks`,
			code: `const A = styled.div\`\r\n\r\n\tcolor: red;\r\n\`\n`,
			fixed: `const A = styled.div\`\r\n\tcolor: red;\r\n\`\n`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		{
			description: `two empty lines behind the host's line`,
			code: `const A = styled.div\`\n\n\n\tcolor: red;\n\`\n`,
			fixed: `const A = styled.div\`\n\tcolor: red;\n\`\n`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		{
			description: `an empty line holding spaces behind the host's line`,
			code: `const A = styled.div\`\n  \n\tcolor: red;\n\`\n`,
			fixed: `const A = styled.div\`\n\tcolor: red;\n\`\n`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		{
			description: `an empty line behind the host's line in front of a free semicolon, which leaves the template's root no node`,
			code: `const A = styled.div\`\n\n;\`\n`,
			fixed: `const A = styled.div\`\n;\`\n`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
	],
})
