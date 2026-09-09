import { parse as postcssParse, type ProcessOptions, type Root, stringify } from "postcss"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

/**
 * Parses a stylesheet and takes the `raws.before` off the node standing at the head of every rule's block, the way a rule of another plugin that inserts a node there leaves one.
 * @param source - The stylesheet.
 * @param opts - The options of the parse.
 * @returns The root.
 */
function parse (source: string, opts?: ProcessOptions): Root {
	let root = postcssParse(source, opts)

	root.walkRules((statement) => {
		if (statement.first) delete statement.first.raws.before
	})

	return root
}

// The library's declaration names a string alone, but it hands whatever it is given to Stylelint, which takes a syntax object as readily as a package name
let headWithoutARun = { parse, stringify } as unknown as string

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: headWithoutARun,

	accept: [
		{
			description: `a single-line block whose head node the file spells no run in front of`,
			code: `a {/*c*/color: pink; }`,
		},
	],

	reject: [
		{
			// See #411
			description: `a break in front of the declaration standing behind a head comment the file spells no run in front of`,
			code: `
				a {/*c*/
				color: pink; }
			`,
			fixed: `a {/*c*/color: pink; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// See #411
			description: `a block of two comments, the head one of which the file spells no run in front of`,
			code: `
				a {/*1*/
				/*2*/ }
			`,
			fixed: `a {/*1*//*2*/}`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// See #411
			description: `the same block holding that one comment alone`,
			code: `
				a {/*1*/
				}
			`,
			fixed: `a {/*1*/}`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: headWithoutARun,

	accept: [
		{
			description: `the break in front of the declaration standing behind such a comment, which is the one the option asks for`,
			code: `
				a {/*c*/
				color: pink; }
			`,
		},
	],

	reject: [],
})
