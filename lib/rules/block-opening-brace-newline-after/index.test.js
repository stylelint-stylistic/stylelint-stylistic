import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.js"

import { messages, ruleName } from "./index.js"

/** The length of a run of comments the walk of this rule used to overflow the stack on. The threshold sits around eight thousand on Node 26, lower than the walk this one was copied from took; this many throws every time. */
const COMMENT_RUN_LENGTH = 20_000

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a blockless at-rule, which has no opening brace to break behind`,
			code: `@import url(x.css)`,
		},
		{
			description: `a break behind the opening brace`,
			code: `a {\ncolor: pink; }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a {\r\ncolor: pink; }`,
		},
		{
			description: `an empty line behind the brace, which is a break all the same`,
			code: `
				a {

				color: pink; }
			`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `a {\r\n\r\ncolor: pink; }`,
		},
		{
			description: `a brace abutting the selector, with the break behind it`,
			code: `a{\ncolor: pink; }`,
		},
		{
			description: `a tab of indentation behind the break`,
			code: `a{\n\tcolor: pink; }`,
		},
		{
			description: `two spaces of indentation behind the break`,
			code: `a{\n  color: pink; }`,
		},
		{
			description: `the same indentation behind a carriage return`,
			code: `a{\r\n  color: pink; }`,
		},
		{
			description: `nested blocks, each broken behind its brace`,
			code: `
				@media print {
				a {
				color: pink; } }
			`,
		},
		{
			description: `the same pair with the braces abutting their selectors`,
			code: `
				@media print{
				a{
				color: pink; } }
			`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print{\r\na{\r\ncolor: pink; } }`,
		},
		{
			description: `nested blocks with indentation of their own behind each break`,
			code: `
				@media print{
					a{
				  color: pink; } }
			`,
		},
		{
			description: `a comment on the brace's own line, with the break behind the comment`,
			code: `
				a { /* 1 */
				  color: pink;
				}
			`,
		},
		{
			description: `the same comment behind several spaces`,
			code: `
				a {    /* 1 */
				  color: pink;
				}
			`,
		},
		{
			description: `a comment on the line behind the brace`,
			code: `
				a {
				  /* 1 */
				  color: pink;
				}
			`,
		},
		{
			description: `the same comment behind a carriage return`,
			code: `a {\r\n  /* 1 */\r\n  color: pink;\r\n}`,
		},
		{
			description: `a run of comments on the line behind the brace, where the break stands in front of the first of them alone`,
			code: `
				a {
				  /* 1 */ /* 2 */ color: pink;
				}
			`,
		},
		{
			description: `a comment abutting the selector behind it, which the parser reads as part of that selector`,
			code: `
				.a {
				/*.b*/.c {
				 color: pink; }
				 }
			`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `.a {\r\n/*.b*/.c {\r\n color: pink; }\r\n }`,
		},
		{
			description: `a comment abutting a selector nested in an at-rule`,
			code: `
				@media print {
				 /*.test2*/.a {
				 color: pink;
				 }
				 }
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `@media print {\r\n /*.test2*/.a {\r\n color: pink;\r\n }\r\n }`,
		},
		{
			description: `a comment on a line of its own inside an at-rule`,
			code: `
				@media print {
				 /*.test2*/
				 .a {
				 color: pink;
				 }
				 }
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `@media print {\r\n /*.test2*/\r\n .a {\r\n color: pink;\r\n }\r\n }`,
		},
		{
			description: `the same comment behind more indentation`,
			code: `@media print {\r\n      /*.test2*/\r\n .a {\r\n color: pink;\r\n }\r\n }`,
		},
	],

	reject: [
		{
			description: `a space behind the brace`,
			code: `a { color: pink; }`,
			fixed: `a {\n color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `a declaration abutting the brace`,
			code: `a {color: pink; }`,
			fixed: `a {\ncolor: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces behind the brace`,
			code: `a {  color: pink; }`,
			fixed: `a {\n  color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab behind the brace`,
			code: `a {\tcolor: pink; }`,
			fixed: `a {\n\tcolor: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `a nested brace with a space behind it`,
			code: `@media print { a {\ncolor: pink; } }`,
			fixed: `@media print {\n a {\ncolor: pink; } }`,
			line: 1,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			description: `an outer brace broken behind and an inner one with a space`,
			code: `@media print {\na { color: pink; } }`,
			fixed: `@media print {\na {\n color: pink; } }`,
			line: 2,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `@media print {\r\na { color: pink; } }`,
			fixed: `@media print {\r\na {\r\n color: pink; } }`,
			line: 2,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment behind the brace with no break behind the comment`,
			code: `a { /* 1 */ color: pink; }`,
			fixed: `a { /* 1 */\n color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment abutting the selector behind it, all on the brace's line`,
			code: `.a {/*.b*/.c { color: pink; } }`,
			fixed: `.a {/*.b*/\n.c {\n color: pink; } }`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 15,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `a comment abutting the brace, with the break behind the comment`,
			code: `.a {/*.b*/\n.c { color: pink; } }`,
			fixed: `.a {/*.b*/\n.c {\n color: pink; } }`,
			line: 2,
			column: 5,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment behind a carriage return`,
			code: `.a {/*.b*/\r\n.c { color: pink; } }`,
			fixed: `.a {/*.b*/\r\n.c {\r\n color: pink; } }`,
			line: 2,
			column: 5,
			message: messages.expectedAfter(),
		},
		{
			description: `a space in front of the break, which is what the fix trims`,
			code: `a { \ncolor: pink; }`,
			fixed: `a {\ncolor: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `the same trailing space in front of a carriage return`,
			code: `a { \r\ncolor: pink; }`,
			fixed: `a {\r\ncolor: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/244
			description: `a form feed between the declarations, which is whitespace and no line break, so the block is single-line and none of this option's business`,
			code: `a {color: pink;\ftop: 0;}`,
		},
		{
			description: `a multi-line block broken behind its brace`,
			code: `a {\ncolor: pink; }`,
		},
		{
			description: `two declarations, each on a line of its own`,
			code: `
				a {
				  color: pink;
				  background: orange; }
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\n  color: pink;\r\n  background: orange; }`,
		},
		{
			description: `a brace abutting the selector, with the break behind it`,
			code: `a{\ncolor: pink; }`,
		},
		{
			description: `a tab of indentation behind the break`,
			code: `a{\n\tcolor: pink; }`,
		},
		{
			description: `two spaces of indentation behind the break`,
			code: `a{\n  color: pink; }`,
		},
		{
			description: `nested multi-line blocks, each broken behind its brace`,
			code: `
				@media print {
				a {
				color: pink; } }
			`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print {\r\na {\r\ncolor: pink; } }`,
		},
		{
			description: `the same pair with the braces abutting their selectors`,
			code: `
				@media print{
				a{
				color: pink; } }
			`,
		},
		{
			description: `nested blocks with indentation of their own behind each break`,
			code: `
				@media print{
					a{
				  color: pink; } }
			`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print{\r\n\ta{\r\n  color: pink; } }`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }`,
		},
		{
			description: `a tab behind the brace of a single-line block`,
			code: `a {\tcolor: pink; }`,
		},
		{
			description: `two declarations on one line`,
			code: `a {  color: pink;  background: orange; }`,
		},
		{
			description: `a comment behind the brace of a single-line block`,
			code: `a { /* 1 */ color: pink; }`,
		},
		{
			description: `a comment abutting the selector of a single-line nested block`,
			code: `.a {/*.b*/.c { color: pink; } }`,
		},
	],

	reject: [
		{
			description: `a multi-line block with a space behind its brace`,
			code: `a { color: pink;\nbackground: orange; }`,
			fixed: `a {\n color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a multi-line block whose declaration abuts the brace`,
			code: `a {color: pink;\nbackground: orange; }`,
			fixed: `a {\ncolor: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `two spaces behind the brace of a multi-line block`,
			code: `a {  color: pink;\nbackground: orange; }`,
			fixed: `a {\n  color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a tab behind the brace of a multi-line block`,
			code: `a {\tcolor: pink;\nbackground: orange; }`,
			fixed: `a {\n\tcolor: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same block broken with a carriage return`,
			code: `a {\tcolor: pink;\r\nbackground: orange; }`,
			fixed: `a {\r\n\tcolor: pink;\r\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a nested multi-line block with a space behind its brace`,
			code: `
				@media print { a {
				color:
				pink; } }
			`,
			fixed: `
				@media print {
				 a {
				color:
				pink; } }
			`,
			line: 1,
			column: 15,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `an outer brace broken behind and an inner multi-line block with a space`,
			code: `
				@media print {
				a { color:
				pink; } }
			`,
			fixed: `
				@media print {
				a {
				 color:
				pink; } }
			`,
			line: 2,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print {\r\na { color:\r\npink; } }`,
			fixed: `@media print {\r\na {\r\n color:\r\npink; } }`,
			line: 2,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a multi-line block whose declaration abuts the brace`,
			code: `a {color: pink;\nbackground: orange; }`,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a {color: pink;\r\nbackground: orange; }`,
		},
		{
			description: `the same block with the brace abutting the selector`,
			code: `a{color: pink;\nbackground: orange; }`,
		},
		{
			description: `nested blocks, the inner one multi-line and abutting its brace`,
			code: `@media print {a {color: pink;\nbackground: orange; } }`,
		},
		{
			description: `the same pair with the braces abutting their selectors`,
			code: `@media print{a{color: pink;\nbackground: orange; } }`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }`,
		},
		{
			description: `two spaces behind the brace of a single-line block`,
			code: `a {  color: pink; }`,
		},
		{
			description: `a tab behind the brace of a single-line block`,
			code: `a {\tcolor: pink; }`,
		},
		{
			description: `nested single-line blocks`,
			code: `@media print { a { color: pink; } }`,
		},
		{
			description: `nested single-line blocks with tabs behind their braces`,
			code: `@media print {\ta {\tcolor: pink; } }`,
		},
	],

	reject: [
		{
			description: `a space behind the brace of a multi-line block`,
			code: `a { color: pink;\nbackground: orange; }`,
			fixed: `a {color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a break behind the brace of a multi-line block`,
			code: `
				a {
				color: pink;
				background: orange; }
			`,
			fixed: `
				a {color: pink;
				background: orange; }
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `the same break spelled with carriage returns`,
			code: `a {\r\ncolor: pink;\r\nbackground: orange; }`,
			fixed: `a {color: pink;\r\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `two spaces behind the brace of a multi-line block`,
			code: `a {  color: pink;\nbackground: orange; }`,
			fixed: `a {color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a tab behind the brace of a multi-line block`,
			code: `a {\tcolor: pink;\nbackground: orange; }`,
			fixed: `a {color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `an outer brace broken behind, the inner block multi-line`,
			code: `
				@media print {
				a {color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print {a {color: pink;
				background: orange; } }
			`,
			line: 1,
			column: 15,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `an inner brace broken behind, in a multi-line block`,
			code: `
				@media print {a {
				color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print {a {color: pink;
				background: orange; } }
			`,
			line: 1,
			column: 18,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a comment on the line behind the brace`,
			code: `
				a {
				/*comment*/ color: pink;
				background: orange; }
			`,
			fixed: `
				a {/*comment*/color: pink;
				background: orange; }
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `several comments on the lines behind the brace, with an empty line among them`,
			code: `a {\n /*c1*/ /*c2*/ \n\n /*c3*/ color: pink;\nbackground: orange; }`,
			fixed: `a { /*c1*/ /*c2*/  /*c3*/color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignore: [`rules`] }],

	accept: [
		{
			description: `a single-line rule, which the option leaves to itself`,
			code: `a { color: pink; }`,
		},
		{
			description: `a rule broken behind its brace, which the option leaves to itself`,
			code: `a {\ncolor: pink; }`,
		},
		{
			description: `nested rules, both left to themselves`,
			code: `
				@media print {
				a {
				color: pink; } }
			`,
		},
	],
	reject: [
		{
			description: `an at-rule with a space behind its brace, which the option still checks`,
			code: `@media print { a { color: pink; } }`,
			fixed: `@media print {\n a { color: pink; } }`,
			line: 1,
			column: 15,
			message: messages.expectedAfter(),
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
			description: `an inline comment abutting the brace, whose line break is what closes it, so the declaration behind it cannot join its line`,
			code: `
				a {// c
				color: pink;
				}
			`,
			fixed: `
				a {// c
				color: pink;
				}
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248
			description: `an inline comment on a line of its own behind the brace, where the fix would take away two breaks and the second of them closes the comment`,
			code: `
				a {
				// c
				color: pink;
				}
			`,
			fixed: `
				a {
				// c
				color: pink;
				}
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248
			description: `a block comment standing between an inline one and the declaration, which the fix would carry into the inline comment along with everything behind it`,
			code: `
				a {
				// c
				/* b */
				color: pink;
				}
			`,
			fixed: `
				a {
				// c
				/* b */
				color: pink;
				}
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a block comment on a line of its own behind the brace, which closes on its own and leaves the fix a line to pull the declaration onto`,
			code: `
				a {
				/* b */
				color: pink;
				}
			`,
			fixed: `
				a {/* b */color: pink;
				}
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248
			description: `an inline comment abutting the brace, whose line break is what closes it, so the declaration behind it cannot join its line`,
			code: `
				a {// c
				color: pink;
				}
			`,
			fixed: `
				a {// c
				color: pink;
				}
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248
			description: `an inline comment on a line of its own behind the brace, where the fix would take away two breaks and the second of them closes the comment`,
			code: `
				a {
				// c
				color: pink;
				}
			`,
			fixed: `
				a {
				// c
				color: pink;
				}
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248
			description: `a block comment standing between an inline one and the declaration, which the fix would carry into the inline comment along with everything behind it`,
			code: `
				a {
				// c
				/* b */
				color: pink;
				}
			`,
			fixed: `
				a {
				// c
				/* b */
				color: pink;
				}
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a block comment on a line of its own behind the brace, which closes on its own and leaves the fix a line to pull the declaration onto`,
			code: `
				a {
				/* b */
				color: pink;
				}
			`,
			fixed: `
				a {/* b */color: pink;
				}
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})

// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/409
describe(`${ruleName} on a run of comments longer than the stack is deep`, () => {
	let run = `/*c*/`.repeat(COMMENT_RUN_LENGTH)

	it(`reports the brace such a run stands behind, rather than ending the run in a RangeError`, async () => {
		let code = `a {${run}color: pink; }`
		let { results } = await stylelint.lint({
			code,
			config: { plugins, rules: { [ruleName]: `always` } },
		})
		let fixed = await stylelint.lint({
			code,
			config: { plugins, rules: { [ruleName]: `always` } },
			fix: true,
		})

		expect(results[0].warnings.map((warning) => warning.text)).toEqual([messages.expectedAfter()])
		expect(fixed.code).toBe(`a {${run}\ncolor: pink; }`)
	})

	it(`carries the break standing in front of such a run onto the node the run ends in front of`, async () => {
		let code = `a {\n${run}color: pink;\nbackground: orange; }`
		let { results } = await stylelint.lint({
			code,
			config: { plugins, rules: { [ruleName]: `never-multi-line` } },
		})
		let fixed = await stylelint.lint({
			code,
			config: { plugins, rules: { [ruleName]: `never-multi-line` } },
			fix: true,
		})

		expect(results[0].warnings.map((warning) => warning.text)).toEqual([messages.rejectedAfterMultiLine()])
		expect(fixed.code).toBe(`a {${run}color: pink;\nbackground: orange; }`)
	})
})

/**
 * Runs the fix over a stylesheet the rule reports nothing about.
 * @param {string} code - The stylesheet.
 * @param {string} option - The primary option to run under.
 * @returns {Promise<{ code: string | undefined, warnings: number }>} What the fix wrote and how many warnings a run without it raised.
 */
async function fixQuietly (code, option) {
	let fixed = await stylelint.lint({
		code,
		config: { plugins, rules: { [ruleName]: option } },
		fix: true,
	})
	let reported = await stylelint.lint({
		code,
		config: { plugins, rules: { [ruleName]: option } },
	})

	return { code: fixed.code, warnings: reported.results[0].warnings.length }
}

describe(`${ruleName} on the whitespace it carries past a comment`, () => {
	it(`puts back the whitespace it stood in place of, rather than what it wrote over it`, async () => {
		let code = `a {\n/*c*/ color: pink;\nbackground: orange;}`

		expect(await fixQuietly(code, `always`)).toEqual({ code, warnings: 0 })
	})

	// A block holding nothing but comments reaches neither restore of the map, so the two fixtures below are the shapes of such a block where nothing is carried in the first place. One where something is carried comes back rewritten, and that is #410
	it(`carries nothing onto a comment that stands behind a bare carriage return and a form feed, which are whitespace and no break`, async () => {
		let code = `a {\r/*c*/\f/*tail*/}`

		expect(await fixQuietly(code, `always`)).toEqual({ code, warnings: 0 })
	})

	it(`carries nothing past a comment the block ends with`, async () => {
		let code = `a {\n/* c */\n}`

		expect(await fixQuietly(code, `always`)).toEqual({ code, warnings: 0 })
	})
})

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `a single-line block behind a media feature holding an inline comment, which the option leaves alone because the block is on one line however wide the comment is printed`,
			code: `
				@media (min-width: 100px // c
					) { a { color: red; } }
			`,
		},
	],
})
