import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import plugins from "../../index.ts"

const CORE = `@stylistic/unit-case`
const SCSS = `@stylistic/scss/unit-case`
const LESS = `@stylistic/less/unit-case`

/**
 * Lints a text and names the rules that reported, sorted, since Stylelint reports in the configuration's order and the order is not the question here.
 * @param code - The text.
 * @param rules - The rules the configuration lists, in its order.
 * @param [customSyntax] - The syntax the text is parsed with.
 * @returns The reporting rules' names, sorted.
 */
async function reporters (code: string, rules: Record<string, unknown>, customSyntax?: string): Promise<string[]> {
	let { results } = await stylelint.lint({ code, config: { plugins, rules, ...(customSyntax && { customSyntax }) } })

	return pick(results).warnings.map(({ rule }) => rule).toSorted()
}

// One copy of a rule reads a root, the other copies yielding, so a configuration listing two families on one level runs nothing twice
describe(`a rule listed under two names over one root`, () => {
	it(`is read by the core's copy over plain CSS, whichever is listed first, the other copies yielding without a word`, async () => {
		expect(await reporters(`a { b: 1Px }`, { [CORE]: `lower`, [SCSS]: `upper` })).toEqual([CORE])
		expect(await reporters(`a { b: 1Px }`, { [SCSS]: `upper`, [LESS]: `upper`, [CORE]: `lower` })).toEqual([CORE])
	})

	it(`is read by the namespace's copy over that namespace's syntax, the root refused once with a warning by the copies that do not read it, as before`, async () => {
		expect(await reporters(`a { b: 1Px; // c\n}`, { [CORE]: `lower`, [SCSS]: `lower`, [LESS]: `lower` }, `postcss-scss`)).toEqual([CORE, SCSS].toSorted())
	})

	it(`is read by the first listed copy over plain CSS where the core's is not configured, or is turned off`, async () => {
		expect(await reporters(`a { b: 1Px }`, { [LESS]: `upper`, [SCSS]: `lower` })).toEqual([LESS])
		expect(await reporters(`a { b: 1Px }`, { [SCSS]: `lower`, [LESS]: `upper` })).toEqual([SCSS])
		expect(await reporters(`a { b: 1Px }`, { [CORE]: null, [SCSS]: `lower` })).toEqual([SCSS])
		expect(await reporters(`a { b: 1Px }`, { [CORE]: [null], [LESS]: `lower`, [SCSS]: `lower` })).toEqual([LESS])
	})

	it(`is read per root of a page, each block by its own family, a block of another syntax refused once by the first listed copy that does not read it`, async () => {
		let page = `<style>a { b: 1Px }</style><style lang="scss">c { d: 2Px }</style><style lang="less">e { f: 3Px }</style>`

		expect(await reporters(page, { [SCSS]: `lower`, [CORE]: `lower`, [LESS]: `lower` }, `postcss-html`)).toEqual([CORE, SCSS, CORE, LESS, SCSS].toSorted())
	})

	it(`yields at the flush too, where its option waits for the run's end`, async () => {
		let rules = { "@stylistic/scss/declaration-colon-space-after": `always-single-line`, "@stylistic/declaration-colon-space-after": `always-single-line` }
		let { code, results } = await stylelint.lint({ code: `a { b:c }`, config: { plugins, rules }, fix: true })

		expect(code).toBe(`a { b: c }`)
		expect(pick(results).warnings).toEqual([])
	})

	it(`writes once under --fix, what the reading copy asks`, async () => {
		let { code } = await stylelint.lint({ code: `a { b: 1Px }`, config: { plugins, rules: { [SCSS]: `upper`, [CORE]: `lower` } }, fix: true })

		expect(code).toBe(`a { b: 1px }`)
	})
})
