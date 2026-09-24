import { createRule } from "../../../../rules/declaration-block-semicolon-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a Sass nested property standing in front of another declaration, which its own block closes and no semicolon of its own, so the run between its value and its block is the block's and not the rule's`,
			code: `
				a {
					font: 12px
					{ family: serif; }
					top: 0;
				}
			`,
		},
		{
			description: `the same nested property with a stray semicolon behind its block, which is the next declaration's raw and no semicolon of the property's`,
			code: `a { font: 12px { family: serif; }; top: 0; }`,
		},
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
