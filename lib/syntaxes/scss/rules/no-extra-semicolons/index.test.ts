import { createRule } from "../../../../rules/no-extra-semicolons/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			autoStripIndent: true,
			description: `a second semicolon behind a value carrying an inline comment, which this syntax keeps a second copy of`,
			code: `
				a {
					color: pink // c
					;;
				}
			`,
			fixed: `
				a {
					color: pink // c
					;
				}
			`,
			line: 3,
			column: 3,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			autoStripIndent: true,
			description: `a semicolon of the block's own behind a closing brace, with an inline comment standing in front of it`,
			code: `
				a { b { color: pink } // c
				};
			`,
			fixed: `
				a { b { color: pink } // c
				}
			`,
			line: 2,
			column: 2,
			message: messages.rejected,
		},
	],
})
