import { createRule } from "../../../../rules/declaration-block-semicolon-newline-before/index.ts"
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/207
			description: `inline comment before the semicolon: the semicolon cannot join the comment's line, so the code is left alone and the warning stands`,
			code: `
				a {
					color: red // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red // keep me
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/207
			description: `inline comment behind the flag: the semicolon cannot join its line either`,
			code: `
				a {
					color: red !important // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red !important // keep me
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/207
			description: `inline comment in front of the flag: the whitespace behind the flag goes, and the comment stays where it is`,
			code: `
				a {
					color: red // keep me
						!important
					;
				}
			`,
			fixed: `
				a {
					color: red // keep me
						!important;
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `block comment before the semicolon: nothing of it depends on a line break, so the fix goes through`,
			code: `
				a {
					color: red /* keep me */
					;
				}
			`,
			fixed: `
				a {
					color: red /* keep me */;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `unquoted URL, its double slash opening no comment`,
			code: `
				a {
					background: url(http://foo.bar/a.png)
					;
				}
			`,
			fixed: `
				a {
					background: url(http://foo.bar/a.png);
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `string holding a double slash, which opens no comment either`,
			code: `
				a::before {
					content: "a//b"
					;
				}
			`,
			fixed: `
				a::before {
					content: "a//b";
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `a Sass nested property with a declaration behind it, whose own text ends where its value does rather than where its block does`,
			code: `
				a {
					font: 12px
					{ family: serif; }
					top: 0
				;
				}
			`,
		},
	],
})
