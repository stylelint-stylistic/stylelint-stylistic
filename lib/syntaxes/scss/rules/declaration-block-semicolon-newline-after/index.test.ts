import { createRule } from "../../../../rules/declaration-block-semicolon-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `Sass variables at the top level of a file, which are no declaration block`,
			code: `$a: 1;$b: 2;`,
		},
	],
})
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248
			description: `an inline comment abutting the semicolon, whose line break is what closes it, so the declaration behind it cannot join its line`,
			code: `
				a { color: pink;// c
				top: 0;
				}
			`,
			fixed: `
				a { color: pink;// c
				top: 0;
				}
			`,
			line: 1,
			column: 17,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248
			description: `an inline comment on a line of its own behind the semicolon, which the declaration behind it cannot join either`,
			code: `
				a { color: pink;
				// c
				top: 0;
				}
			`,
			fixed: `
				a { color: pink;
				// c
				top: 0;
				}
			`,
			line: 1,
			column: 17,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248
			description: `an inline comment held by the value, closed by the break the semicolon stands behind, which leaves the fix a line to pull the declaration onto`,
			code: `
				a { color: red // c
				;
				top: 0;
				}
			`,
			fixed: `
				a { color: red // c
				;top: 0;
				}
			`,
			line: 2,
			column: 2,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a block comment on a line of its own behind the semicolon, which closes on its own and leaves the fix a line to pull the declaration onto`,
			code: `
				a { color: pink;
				/* b */
				top: 0;
				}
			`,
			fixed: `
				a { color: pink;
				/* b */top: 0;
				}
			`,
			line: 1,
			column: 17,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `Sass variables at the top level of a style element, which are no declaration block`,
			code: `<style lang="scss">$a: 1;$b: 2;</style>`,
		},
	],
})
