import { AtRule, type Root, Rule } from "postcss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import plugins from "../../index.ts"

import { ruleName } from "./index.ts"

/**
 * Builds a rule of another plugin, listed in front of the plugin's, which puts nodes it builds into the tree, carrying no `source` and no raws.
 * @param build - What it puts into the root.
 * @returns The plugin.
 */
function builder (build: (root: Root) => void): stylelint.Plugin {
	let rule = Object.assign(() => (root: Root): void => {
		build(root)
	}, { ruleName: `test/builder`, messages: {} })

	return stylelint.createPlugin(`test/builder`, rule as unknown as stylelint.Rule)
}

/**
 * Fills every empty rule with two declarations.
 * @param root - The root.
 */
function fill (root: Root): void {
	root.walkRules((statement) => {
		if (statement.nodes.length === 0) statement.append({ prop: `color`, value: `pink` }, { prop: `top`, value: `0` })
	})
}

/**
 * Appends an at-rule holding a rule of two declarations.
 * @param root - The root.
 */
function nest (root: Root): void {
	root.append(new AtRule({ name: `media`, params: `screen` }).append(new Rule({ selector: `.x, .y` }).append({ prop: `margin`, value: `0 auto` }, { prop: `color`, value: `#FFF` })))
}

/**
 * Lints and fixes a stylesheet under the builder and the plugin's rules, then lints the output under those rules alone, which is what the next run of the linter has in front of it.
 * @param code - The stylesheet.
 * @param build - What the builder puts into the root.
 * @param rules - The plugin's rules and their settings, in the order the configuration lists them.
 * @returns The lines the rule warns on, the output, and how many warnings a lint of it has.
 */
async function fixBuilt (code: string, build: (root: Root) => void, rules: Record<string, unknown>): Promise<{ lines: number[], fixed: string, left: number }> {
	let config = { plugins: [builder(build), ...plugins], rules: { "test/builder": true, ...rules } }
	let read = await stylelint.lint({ code, config })
	let fixed = (await stylelint.lint({ code, config, fix: true })).code ?? code
	let again = await stylelint.lint({ code: fixed, config: { plugins, rules } })

	return { lines: pick(read.results).warnings.filter((warning) => warning.rule === ruleName).map(({ line }) => line), fixed, left: pick(again.results).warnings.length }
}

describe(`the indentation of a node another plugin's rule built`, () => {
	it.each([
		[`the rule listed first`, { [ruleName]: 2, "@stylistic/declaration-block-semicolon-newline-after": `always` }],
		[`the neighbor listed first`, { "@stylistic/declaration-block-semicolon-newline-after": `always`, [ruleName]: 2 }],
	])(`the line a neighbor's break opens in front of it, %s`, async (_, rules) => {
		// The neighbor writes a break into the run in front of the second declaration, and the line it opens is checked as any other; before the fix no line opens there, and the rule warns on none
		expect(await fixBuilt(`a{}\nb{color:red;top:0}\n`, fill, rules)).toEqual({ lines: [], fixed: `a{color:pink;\n  top:0}\nb{color:red;\n  top:0}\n`, left: 0 })
	})

	it(`the lines PostCSS prints it on`, async () => {
		// The runs PostCSS prints in front of built nodes are four spaces a level, which tab refuses in front of the rule, both declarations and the brace; the warnings stand on `a`, the node in front of the built at-rule, which holds a place in the file
		expect(await fixBuilt(`a {\n}`, nest, { [ruleName]: `tab` })).toEqual({ lines: [1, 1, 1, 1], fixed: `a {\n}\n@media screen {\n\t.x, .y {\n\t\tmargin: 0 auto;\n\t\tcolor: #FFF\n\t}\n}`, left: 0 })
	})
})
