import { createRule } from "../../../../rules/declaration-colon-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

// A space no editor trims from the end of a line.
const S = ` `

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
			description: `a value that is nothing but an inline comment and a flag, whose run behind the colon this syntax keeps in the value's raw`,
			code: `a { color:  // c\n!important; }`,
			fixed: `a { color:\n  // c\n!important; }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/388
			description: `an inline comment holding a colon of its own on the colon's line, whose text a break written at that colon would close early`,
			code: `a { color: //x:y\n red; }`,
			fixed: `a { color:\n //x:y\n red; }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
		{
			description: `a double slash welded to the word in front of the colon, which opens no comment for this syntax's tokenizer, so the colon behind it is the declaration's`,
			code: `a { b $//:  red; }`,
			fixed: `a { b $//:\n  red; }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
		{
			description: `an inline comment holding a colon in front of the declaration's, which stands on the next line with a space behind it`,
			code: `a { b //x:y\n: red; }`,
			fixed: `a { b //x:y\n:\n red; }`,
			line: 2,
			column: 1,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
			description: `a declaration standing at the top level of a stylesheet with an inline comment written behind it, a node of this syntax alone, whose space that comment's raw holds`,
			code: `color:${S}// c`,
			fixed: `color:\n${S}// c`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(),
		},
	],
})
