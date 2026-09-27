import { AtRule, Comment, type Root, Rule } from "postcss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

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
 * Fixes a snippet under the builder and one rule of the plugin, then lints the output under that rule alone.
 * @param code - The snippet.
 * @param build - What the builder puts into the root.
 * @param rule - The plugin's rule and its setting.
 * @returns The output and the warnings a lint of it has.
 */
async function fixBuilt (code: string, build: (root: Root) => void, rule: [string, unknown]): Promise<{ code: string, left: number }> {
	let fixed = await stylelint.lint({ code, config: { plugins: [builder(build), ...plugins], rules: { "test/builder": true, [rule[0]]: rule[1] } }, fix: true })
	let read = await stylelint.lint({ code: fixed.code ?? code, config: { plugins, rules: { [rule[0]]: rule[1] } } })

	return { code: fixed.code ?? code, left: read.results[0]?.warnings.length ?? 0 }
}

/**
 * Fills the empty block of `a` with two declarations carrying no raws, as a rule of another plugin does.
 * @param root - The root.
 */
function fill (root: Root): void {
	root.walkRules(`a`, (rule) => {
		if (rule.nodes.length > 0) return

		rule.append({ prop: `color`, value: `pink` })
		rule.append({ prop: `top`, value: `0` })
	})
}

describe(`the raws PostCSS invents for a node another plugin's rule built`, () => {
	// The fix finds the raw the node prints, pinned, and writes it in the pass that reports it
	it.each([
		[`@stylistic/at-rule-name-newline-after`, `always`, (root: Root): void => { root.append(new AtRule({ name: `media`, params: `print` })) }, `a {\n}\n@media\n print`],
		[`@stylistic/block-closing-brace-space-before`, `always`, (root: Root): void => { root.append(new Rule({ selector: `.b` }).append({ prop: `color`, value: `red` })) }, `a {\n}\n.b {\n    color: red }`],
		[`@stylistic/block-closing-brace-space-after`, `always`, (root: Root): void => { root.prepend(new Rule({ selector: `.d` }).append({ prop: `top`, value: `0` })) }, `.d {\n    top: 0\n} a {\n}`],
	] as [string, string, (root: Root) => void, string][])(`are written by %s %s in the pass that reports`, async (name, option, build, output) => {
		expect(await fixBuilt(`a {\n}`, build, [name, option])).toEqual({ code: output, left: 0 })
	})

	// A write into the first node's run no longer changes the run PostCSS invents for the next, so the fix over the tree is the fix over the text it prints
	it(`stay as printed behind a run a fix writes`, async () => {
		let code = `b { color: red;top: 0 }\na {\n}`
		let printed = (await stylelint.lint({ code, config: { plugins: [builder(fill)], rules: { "test/builder": true } }, fix: true })).code ?? code
		let overText = await stylelint.lint({ code: printed, config: { plugins, rules: { "@stylistic/block-opening-brace-space-after": `never` } }, fix: true })

		expect((await fixBuilt(code, fill, [`@stylistic/block-opening-brace-space-after`, `never`])).code).toBe(overText.code)
	})

	// PostCSS invents a raw out of the first node carrying one of its kind, so a raw pinned on the way would stand in for the file's own: a rule that reports nothing leaves the print another plugin's rule gives
	it.each([
		[`/* c */\n`, (root: Root): void => { root.prepend(new Comment({ text: `generated` })) }],
		[`a {\n}\n`, (root: Root): void => { root.prepend(new AtRule({ name: `import`, params: `"y"` })); root.append(new Rule({ selector: `.b` }).append({ prop: `color`, value: `red` })) }],
	] as [string, (root: Root) => void][])(`leave the print of %j as it was`, async (code, build) => {
		let alone = await stylelint.lint({ code, config: { plugins: [builder(build)], rules: { "test/builder": true } }, fix: true })

		expect((await fixBuilt(code, build, [`@stylistic/color-hex-case`, `lower`])).code).toBe(alone.code)
	})
})
