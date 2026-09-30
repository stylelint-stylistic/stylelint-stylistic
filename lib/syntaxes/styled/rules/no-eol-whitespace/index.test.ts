import { createRule } from "../../../../rules/no-eol-whitespace/index.ts"
import { styled } from "../../index.ts"

let { ruleName, messages } = createRule(styled)

/** A run in front of the closing backtick, which an editor would trim off the end of a source line. */
const SPACES = `  `

let testRule = createTestRule({ ruleName })

testRule({
	// The subject is the edge of the source, which the stripping would cut
	autoStripIndent: false,
	ruleName,
	config: [true],
	customSyntax: `postcss-styled-syntax`,

	accept: [
		{
			// The template's last line is the closing backtick's, and its tab is that backtick's indentation in the host code
			description: `a template inside a function, whose closing backtick carries the indentation of the host's line`,
			code: `function f () {\n\tconst A = styled.div\`\n\t\tcolor: red;\n\t\`\n}\n`,
		},
		{
			description: `spaces in front of the closing backtick of a template not broken over lines, which stand in the middle of the host's line`,
			code: `const A = styled.div\`color: red;${SPACES}\`\n`,
		},
		{
			description: `a template whose last line holds nothing but spaces, in front of the closing backtick`,
			code: `const A = styled.div\`\n\tcolor: red;\n${SPACES}\`\n`,
		},
	],

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
		{
			// The run in front of the break ends a line of the stylesheet and comes off; the tab behind it is the closing backtick's indentation and stays
			description: `spaces ending a declaration's line of a template whose closing backtick carries an indentation`,
			code: `const A = styled.div\`\n\tcolor: red;${SPACES}\n\t\`\n`,
			fixed: `const A = styled.div\`\n\tcolor: red;\n\t\`\n`,
			line: 2,
			column: 14,
			message: messages.rejected,
		},
		{
			// The closing backtick ends a line of the stylesheet, in front of which `no-missing-end-of-source-newline` asks for a break, so the run in front of it ends that line
			description: `spaces in front of the closing backtick ending a declaration's line of a template broken over lines`,
			code: `const A = styled.div\`\n\tcolor: red;${SPACES}\`\n`,
			fixed: `const A = styled.div\`\n\tcolor: red;\`\n`,
			line: 2,
			column: 14,
			message: messages.rejected,
		},
		{
			description: `spaces behind the opening backtick, which end the host's line`,
			code: `const A = styled.div\`${SPACES}\n\tcolor: red;\n\`\n`,
			fixed: `const A = styled.div\`\n\tcolor: red;\n\`\n`,
			line: 1,
			column: 23,
			message: messages.rejected,
		},
	],
})
