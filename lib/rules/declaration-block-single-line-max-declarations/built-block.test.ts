import { AtRule, type Root, Rule } from "postcss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

import { ruleName } from "./index.ts"

/**
 * Builds a rule of another plugin, listed in front of the plugin's, which appends an at-rule holding a rule of two declarations, carrying no `source` and no raws.
 * @returns The plugin.
 */
function builder (): stylelint.Plugin {
	let rule = Object.assign(() => (root: Root): void => {
		root.append(new AtRule({ name: `media`, params: `screen` }).append(new Rule({ selector: `.x, .y` }).append({ prop: `margin`, value: `0 auto` }, { prop: `color`, value: `#FFF` })))
	}, { ruleName: `test/builder`, messages: {} })

	return stylelint.createPlugin(`test/builder`, rule as unknown as stylelint.Rule)
}

describe(`a block another plugin's rule built`, () => {
	it.each([
		[`the warning on the node in front of it`, false],
		[`the fix breaking it over lines`, true],
	])(`%s`, async (_, fix) => {
		// PostCSS prints the built block on one line behind a single-line block, and the check ahead of the lineness tier asks the line of the warning before reporting it
		let linted = await stylelint.lint({ code: `a { top: 0 }\n`, config: { plugins: [builder(), ...plugins], rules: { "test/builder": true, [ruleName]: 1 } }, fix })
		let warnings = linted.results[0]?.warnings.map(({ line }) => line)

		expect(warnings).toEqual(fix ? [] : [1])

		if (!fix) return

		let read = await stylelint.lint({ code: linted.code ?? ``, config: { plugins, rules: { [ruleName]: 1 } } })

		expect(read.results[0]?.warnings).toEqual([])
	})

	it(`the block left on one line under a disable comment on the line of the node in front of it`, async () => {
		// The warning stands on the line of the node in front of the built one, which the comment disables
		let code = `a { top: 0 } /* stylelint-disable-line ${ruleName} */\n`
		let linted = await stylelint.lint({ code, config: { plugins: [builder(), ...plugins], rules: { "test/builder": true, [ruleName]: 1 } }, fix: true })

		expect(linted.code).toBe(`a { top: 0 } /* stylelint-disable-line ${ruleName} */ @media screen { .x, .y { margin: 0 auto; color: #FFF } }\n`)
	})
})
