import { createRule } from "../../../../rules/unicode-bom/index.ts"
import { styled } from "../../index.ts"

let { ruleName } = createRule(styled)

let testRule = createTestRule({ ruleName })

// See #728
testRule({
	customSyntax: `postcss-styled-syntax`,
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a template in a file with no byte order mark, which the rule passes over as a stylesheet embedded in a document`,
			code: `const A = styled.div\`color: red;\``,
		},
		{
			description: `two templates in a file opening with a byte order mark`,
			code: `\uFEFFconst A = styled.div\`color: red;\`
				const B = styled.div\`color: blue;\``,
		},
	],
})

// See #728
testRule({
	customSyntax: `postcss-styled-syntax`,
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a template opening with the character a byte order mark is spelled with, which is a character of the template`,
			code: `const A = styled.div\`\uFEFFcolor: red;\``,
		},
	],
})
