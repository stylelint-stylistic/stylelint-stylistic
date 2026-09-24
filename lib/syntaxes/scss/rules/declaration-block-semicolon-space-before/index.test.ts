import { createRule } from "../../../../rules/declaration-block-semicolon-space-before/index.ts"
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
					top: 0 ;
				}
			`,
		},
		{
			description: `the same nested property with a stray semicolon behind its block, which is the next declaration's raw and no semicolon of the property's`,
			code: `a { font: 12px { family: serif; }; top: 0 ; }`,
		},
	],

	reject: [
		{
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
			message: messages.expectedBefore(),
		},
		{
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
			message: messages.expectedBefore(),
		},
		{
			description: `inline comment in front of the flag: the space goes behind the flag, and the comment stays where it is`,
			code: `
				a {
					color: red // keep me
						!important;
				}
			`,
			fixed: `
				a {
					color: red // keep me
						!important ;
				}
			`,
			line: 3,
			column: 12,
			message: messages.expectedBefore(),
		},
		{
			description: `block comment behind the flag: nothing of it depends on a line break, so the fix goes through`,
			code: `
				a {
					color: red !important /* keep me */
					;
				}
			`,
			fixed: `
				a {
					color: red !important /* keep me */ ;
				}
			`,
			line: 3,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a flag standing in the text of the comment, which this syntax reads as comment text and no flag of its own — the twin of the Less case below, where the guard used to let the fix through`,
			code: `
				a {
					color: red // c !important
					;
				}
			`,
			fixed: `
				a {
					color: red // c !important
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.expectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a comment behind an address whose name is written in upper case and which holds the opening delimiter of a block comment, where Sass reads an address and the double slash behind it`,
			code: `
				a {
					b: URL(a/*b) // c */)
					;
				}
			`,
			fixed: `
				a {
					b: URL(a/*b) // c */)
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
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
			message: messages.rejectedBefore(),
		},
		{
			description: `the same comment with a backslash standing against its double slash, which this parser reads as a comment all the same`,
			code: `
				a {
					color: red \\// keep me
					;
				}
			`,
			fixed: `
				a {
					color: red \\// keep me
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
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
			message: messages.rejectedBefore(),
		},
		{
			description: `inline comment in front of the flag: the whitespace behind the flag is what goes, and the comment stays where it is`,
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
			message: messages.rejectedBefore(),
		},
		{
			description: `a flag standing in the text of the comment, which this syntax reads as comment text and no flag of its own — the twin of the Less case below, where the guard used to let the fix through`,
			code: `
				a {
					color: red // c !important
					;
				}
			`,
			fixed: `
				a {
					color: red // c !important
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
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
			code: `$a: 1 ;$b: 2 ;`,
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a Sass nested property with a declaration behind it, whose own text ends where its value does rather than where its block does`,
			code: `a { font: 12px { family: serif; } ; top: 0 ; }`,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `Sass variables at the top level of a style element, which are no declaration block`,
			code: `<style lang="scss">$a: 1 ;$b: 2 ;</style>`,
		},
	],
})
