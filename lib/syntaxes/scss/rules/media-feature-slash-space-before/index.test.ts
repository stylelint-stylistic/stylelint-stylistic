import scssParser from "postcss-scss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../../../vitest.helpers.ts"
import plugins from "../../../../index.ts"
import { createRule } from "../../../../rules/media-feature-slash-space-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a ratio whose numerator is a variable, which Sass divides at`,
			code: `@media (aspect-ratio: $a/9) {}`,
		},
		{
			description: `a ratio whose denominator is a call, which Sass divides at`,
			code: `@media (min-aspect-ratio: 16/fn()) {}`,
		},
		{
			description: `a parameter list holding an interpolation, which is passed over whole`,
			code: `@media (aspect-ratio: #{$a}/9) {}`,
		},
	],

	reject: [
		{
			description: `a ratio of two plain numbers, which Sass keeps as it stands`,
			code: `@media (aspect-ratio: 16/9) {}`,
			fixed: `@media (aspect-ratio: 16 /9) {}`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
	],
})

describe(`the run in front of a solidus under a syntax that spells a \`//\` comment`, () => {
	let rule = `@stylistic/scss/media-feature-slash-space-before`

	/**
	 * Fixes a Sass text under this rule's `never`.
	 * @param code - The text.
	 * @returns What the fix left and what a check of it says.
	 */
	async function fix (code: string): Promise<{
		fixed: string | undefined,
		left: string[],
	}> {
		let config = { plugins, rules: { [rule]: `never` }, customSyntax: scssParser }
		let ours = await stylelint.lint({ code, config, fix: true })
		let again = await stylelint.lint({ code: ours.code ?? code, config })

		return { fixed: ours.code, left: pick(again.results).warnings.map((warning) => `${warning.line}:${warning.column} ${warning.text}`) }
	}

	it(`leaves the run between two solidi, whose closing would take the rest of the line into a comment`, async () => {
		expect(await fix(`@media (aspect-ratio: 16/  /9) {}`)).toEqual({
			fixed: `@media (aspect-ratio: 16/  /9) {}`,
			left: [`1:28 Unexpected whitespace before "/" (@stylistic/scss/media-feature-slash-space-before)`],
		})
	})

	it(`closes the run where the word in front of it opens no comment`, async () => {
		expect(await fix(`@media (aspect-ratio: 16 /9) {}`)).toEqual({ fixed: `@media (aspect-ratio: 16/9) {}`, left: [] })
	})
})
