import { createRule as createNewlineAfterRule } from "../../../../rules/declaration-block-semicolon-newline-after/index.ts"
import { createRule } from "../../../../rules/declaration-block-semicolon-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)
let { ruleName: newlineAfterRuleName, messages: newlineAfterMessages } = createNewlineAfterRule(scss)

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
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// See #139
			description: `no space behind a semicolon standing on the line the value's inline comment ends, which this syntax keeps a second copy of`,
			code: `
				a { color: red // c
				;
				top: 0;
				}
			`,
			fixed: `
				a { color: red // c
				; top: 0;
				}
			`,
			line: 2,
			column: 2,
			message: messages.expectedAfter(),
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

// The break twin behind this rule writes nothing where its guard holds, so it takes no run from this rule (1789508663)
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,
	extraRules: { [newlineAfterRuleName]: `never-multi-line` },

	reject: [
		{
			// The twin's own guard is asked before its write is counted
			description: `a break behind a semicolon closing a value that holds a double slash, which the twin behind this rule reports and leaves for fear of a comment: the space is written, and the twin's warning stands`,
			code: `
				a {
					b: c//x;
					d: e
				}
			`,
			fixed: `
				a {
					b: c//x; d: e
				}
			`,
			warnings: [
				{
					line: 2,
					column: 10,
					endLine: 2,
					endColumn: 11,
					message: messages.expectedAfter(),
				},
				{
					line: 2,
					column: 10,
					endLine: 2,
					endColumn: 11,
					message: newlineAfterMessages.rejectedAfterMultiLine(),
				},
			],
		},
	],
})
