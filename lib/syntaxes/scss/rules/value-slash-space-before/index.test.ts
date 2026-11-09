import scssParser from "postcss-scss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../../../vitest.helpers.ts"
import plugins from "../../../../index.ts"
import { createRule } from "../../../../rules/value-slash-space-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a solidus beside a variable, which Sass divides at`,
			code: `a { b: 4/$a; }`,
		},
		{
			description: `a solidus beside a call, which Sass divides at`,
			code: `a { b: fn()/2; }`,
		},
		{
			description: `a solidus beside a call through a module`,
			code: `a { b: 2/math.div(4, 2); }`,
		},
		{
			description: `a parenthesized group, which is Sass's arithmetic`,
			code: `a { b: (4/2); }`,
		},
		{
			description: `a variable's own declaration, which is no declaration to this rule`,
			code: `$a: 4/2;`,
		},
		{
			description: `a solidus inside the text of an inline comment`,
			code: `a { b: 1 / 2; // 1/2\n}`,
		},
	],

	reject: [
		{
			description: `a solidus of the value beside one inside a block comment holding a parenthesis, in an address Sass reads as code`,
			code: `a { b: 1/2 url(a /* ) / b */ ) }`,
			fixed: `a { b: 1 /2 url(a /* ) / b */ ) }`,
			line: 1,
			column: 9,
			message: messages.expectedBefore(),
		},
		{
			description: `a solidus beside a call Sass hands through as plain CSS, which keeps the separator`,
			code: `a { b: var(--x)/2; }`,
			fixed: `a { b: var(--x) /2; }`,
			line: 1,
			column: 16,
			message: messages.expectedBefore(),
		},
		{
			description: `an inline comment closed by the break in front of the solidus, the space the option asks for having nowhere to go but the text of the comment`,
			code: `a { b: 1 // c\n/2; }`,
			fixed: `a { b: 1 // c\n/2; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a solidus beside a variable, which Sass divides at`,
			code: `a { b: 4 / $a; }`,
		},
		{
			description: `a custom property whose value already holds two solidi beside each other, which Sass divides at and which needs no fix`,
			code: `a { --b: 1//2; }`,
		},
	],

	reject: [
		{
			description: `an inline comment closed by the break in front of the solidus, which the fixer has to leave standing`,
			code: `a { b: 1 // c\n /2; }`,
			fixed: `a { b: 1 // c\n /2; }`,
			line: 2,
			column: 2,
			message: messages.rejectedBefore(),
		},
		{
			// A custom property's value is raw text to Sass: `//` there opens no comment, so the space before the solidus may be taken away
			description: `a custom property whose value holds two solidi with a space between them, which Sass divides at and which the fixer closes up`,
			code: `a { --b: 1/ /2; }`,
			fixed: `a { --b: 1//2; }`,
			line: 1,
			column: 13,
			message: messages.rejectedBefore(),
		},
	],
})

// A `never` write emptying the run between two solidi brings them together into a `//` comment, and everything behind it on the line goes into that comment
describe(`the run in front of a solidus under a syntax that spells a \`//\` comment`, () => {
	let scssRule = `@stylistic/scss/value-slash-space-before`

	/**
	 * Fixes a Sass text under a primary of this rule.
	 * @param code - The text.
	 * @param primary - The primary option.
	 * @returns What the fix left and what a check of it says.
	 */
	async function fix (code: string, primary: string): Promise<{
		fixed: string | undefined,
		left: string[],
	}> {
		let config = { plugins, rules: { [scssRule]: primary }, customSyntax: scssParser }
		let ours = await stylelint.lint({ code, config, fix: true })
		let again = await stylelint.lint({ code: ours.code ?? code, config })

		return { fixed: ours.code, left: pick(again.results).warnings.map((warning) => `${warning.line}:${warning.column} ${warning.text}`) }
	}

	it(`leaves the run between two solidi, whose closing would take the rest of the line into a comment`, async () => {
		expect(await fix(`a { b: 1/  /2 }`, `never`)).toEqual({
			fixed: `a { b: 1/  /2 }`,
			left: [`1:12 Unexpected whitespace before "/" (@stylistic/scss/value-slash-space-before)`],
		})
	})

	it(`leaves it under \`never-single-line\`, whose fix writes the same empty run`, async () => {
		expect(await fix(`a { b: 1/  /2 }`, `never-single-line`)).toEqual({
			fixed: `a { b: 1/  /2 }`,
			left: [`1:12 Unexpected whitespace before "/" in a single-line declaration (@stylistic/scss/value-slash-space-before)`],
		})
	})

	it(`closes the run where the word in front of it opens no comment`, async () => {
		expect(await fix(`a { b: 1 /2 }`, `never`)).toEqual({ fixed: `a { b: 1/2 }`, left: [] })
	})
})
