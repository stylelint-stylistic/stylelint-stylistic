import { AtRule, Comment, parse, type Root, Rule } from "postcss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"
import { isRule } from "../typeGuards/index.ts"

import { pinInventedRaws, unpinUnwritten } from "./index.ts"

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

	// PostCSS invents a raw out of the first node carrying one of its kind, so a raw pinned on the way would stand in for the file's own: rules that report nothing leave the print another plugin's rule gives. Two of them, since the second drops the cache PostCSS filled while the first asked, and the print reads what is left unpinned afresh
	it.each([
		[`/* c */\n`, (root: Root): void => { root.prepend(new Comment({ text: `generated` })) }],
		[`a {\n}\n`, (root: Root): void => { root.prepend(new AtRule({ name: `import`, params: `"y"` })); root.append(new Rule({ selector: `.b` }).append({ prop: `color`, value: `red` })) }],
		[
			`@layer x;\n@layer y {\n  a { top: 0 }\n}`,
			(root: Root): void => {
				root.prepend(new Rule({ selector: `.d` }).append({ prop: `top`, value: `0` }))
				root.append(new Comment({ text: `q` }))

				// A copy with its raws cleaned, whose own nodes keep the `source` of what it copies
				let layer = root.nodes.find((node) => node.type === `atrule` && node.params === `y`)

				if (!layer) throw new Error(`The fixture must hold the layer it copies`)

				let copy = layer.clone()

				copy.cleanRaws()
				delete copy.source
				layer.after(copy)
			},
		],
	] as [string, (root: Root) => void][])(`leave the print of %j as it was`, async (code, build) => {
		let alone = await stylelint.lint({ code, config: { plugins: [builder(build)], rules: { "test/builder": true } }, fix: true })

		let both = await stylelint.lint({ code, config: { plugins: [builder(build), ...plugins], rules: { "test/builder": true, "@stylistic/color-hex-case": `lower`, "@stylistic/number-leading-zero": `always` } }, fix: true })

		expect(both.code).toBe(alone.code)
	})
})

/**
 * Builds an empty rule in front of the plugin's rules.
 * @param root - The root.
 */
function empty (root: Root): void {
	root.append(new Rule({ selector: `.e` }))
}

/**
 * Fills that rule behind the plugin's rules.
 * @param root - The root.
 */
function late (root: Root): void {
	root.walkRules(`.e`, (statement) => {
		statement.append({ prop: `top`, value: `0` }, { prop: `left`, value: `0` })
	})
}

/** A rule of another plugin, listed behind the plugin's, which fills the empty rule. */
let filler = stylelint.createPlugin(`test/filler`, Object.assign(() => (root: Root): void => {
	late(root)
}, { ruleName: `test/filler`, messages: {} }) as unknown as stylelint.Rule)

/**
 * Fills every empty block behind the plugin's rules.
 * @param root - The root.
 */
function lateAll (root: Root): void {
	root.walkRules((statement) => {
		if (statement.nodes.length === 0) statement.append({ prop: `top`, value: `0` })
	})
}

/** A rule of another plugin, listed behind the plugin's, which fills every empty block. */
let fillerAll = stylelint.createPlugin(`test/filler-all`, Object.assign(() => (root: Root): void => {
	lateAll(root)
}, { ruleName: `test/filler-all`, messages: {} }) as unknown as stylelint.Rule)

/**
 * Builds an at-rule holding an empty rule in front of the plugin's rules.
 * @param root - The root.
 */
function atRule (root: Root): void {
	root.append(new AtRule({ name: `media`, params: `print` }).append(new Rule({ selector: `.e` })))
}

/**
 * Builds a filled rule in front of the plugin's rules.
 * @param root - The root.
 */
function beside (root: Root): void {
	root.append(new Rule({ selector: `.b` }).append({ prop: `color`, value: `red` }))
}

/** A rule of another plugin, listed behind the plugin's, which empties the first rule of the file. */
let emptier = stylelint.createPlugin(`test/emptier`, Object.assign(() => (root: Root): void => {
	let first = root.first

	if (first && isRule(first)) first.removeAll()
}, { ruleName: `test/emptier`, messages: {} }) as unknown as stylelint.Rule)

describe(`the run in front of the closing brace of an empty block another plugin's rule built`, () => {
	// PostCSS invents the run in front of an empty block's brace otherwise than in front of a brace behind nodes, so a run pinned for the empty block and left in place would close a block filled later on its last line
	it(`the brace of a block filled behind the plugin's rules, placed as with no rule of the plugin configured`, async () => {
		let code = `a {\n  color: red;\n}\n`
		let plugged = [builder(empty), filler]
		let alone = await stylelint.lint({ code, config: { plugins: plugged, rules: { "test/builder": true, "test/filler": true } }, fix: true })
		let behind = await stylelint.lint({ code, config: { plugins: [...plugged, ...plugins], rules: { "test/builder": true, "@stylistic/color-hex-case": `lower`, "test/filler": true } }, fix: true })

		expect(behind.code).toBe(alone.code)
	})

	// The same block filled between two of the plugin's own rules is closed as with no rule of the plugin configured too: the rules after the filler read the block as it stands, and the run behind a brace behind nodes is another run than the one behind an empty block's brace, which no rule of the plugin's has read
	it.each([
		[`a {\n  color: red;\n}\n`],
		[`a { color: red }\n`],
	])(`the brace of a block filled between the plugin's rules, placed as with no rule of the plugin configured, in %j`, async (code) => {
		let plugged = [builder(empty), filler]
		let alone = await stylelint.lint({ code, config: { plugins: plugged, rules: { "test/builder": true, "test/filler": true } }, fix: true })
		let between = await stylelint.lint({ code, config: { plugins: [...plugged, ...plugins], rules: { "test/builder": true, "@stylistic/color-hex-case": `lower`, "test/filler": true, "@stylistic/unit-case": `lower` } }, fix: true })

		expect(between.code).toBe(alone.code)
	})

	// A pin taken off with others is asked afresh, and so is the run PostCSS invents the next block's out of: here the run written in front of the other block's brace is what the last block is closed with
	it(`the brace of an empty block beside one whose run is written`, () => {
		let root = parse(`a { color: red }`)

		let written = new Rule({ selector: `.e` })

		root.append(written, new Rule({ selector: `.f` }))
		pinInventedRaws(root)
		written.raws.after = `\n`
		unpinUnwritten(root)

		expect(root.toString()).toBe(`a { color: red }\n.e {\n}\n.f {\n}`)
	})

	// The pin stays where a rule wrote another run
	it(`the brace a rule indents`, async () => {
		expect(await fixBuilt(`a {\n}`, (root) => { root.append(new AtRule({ name: `media`, params: `print` }).append(new Rule({ selector: `.c` }))) }, [`@stylistic/indentation`, `tab`])).toEqual({ code: `a {\n}\n@media print {\n\t.c {\n\t}\n}`, left: 0 })
	})

	// PostCSS invents the run in front of a closing brace out of the first block of the file that holds a node, so a block parsed empty and filled behind the plugin's rules gives a built block beside it a run of its own, which a pin standing in for the file's empty run would take away
	it(`the run in front of the brace of a built at-rule beside a parsed empty block filled behind the plugin's rules`, async () => {
		let code = `a {}\n`
		let plugged = [builder(atRule), fillerAll]
		let alone = await stylelint.lint({ code, config: { plugins: plugged, rules: { "test/builder": true, "test/filler-all": true } }, fix: true })
		let behind = await stylelint.lint({ code, config: { plugins: [...plugged, ...plugins], rules: { "test/builder": true, "@stylistic/color-hex-case": `lower`, "test/filler-all": true } }, fix: true })

		expect(behind.code).toBe(alone.code)
	})

	// The run a rule read is the rule's own answer, and a rule of another plugin emptying a parsed neighbor behind the plugin's rules does not take it back: the run the rule indented is the one the block is closed with
	it(`the run in front of the brace of a block a rule read, with a parsed neighbor emptied behind the plugin's rules`, async () => {
		let code = `a {\n  color: red;\n}\n`
		let fixed = await stylelint.lint({ code, config: { plugins: [builder(beside), ...plugins, emptier], rules: { "test/builder": true, "@stylistic/indentation": 2, "test/emptier": true } }, fix: true })
		let read = await stylelint.lint({ code: fixed.code ?? code, config: { plugins, rules: { "@stylistic/indentation": 2 } } })

		expect(fixed.code).toBe(`a {\n}\n.b {\n  color: red;\n}\n`)
		expect(read.results[0]?.warnings).toEqual([])
	})

	// PostCSS invents the run in front of a brace out of its neighbors, so a rule of the plugin writing a raw of the root moves what a pin taken before it stands for: the pin is the plugin's own answer to a tree it has since written, and the fix over the tree is the fix over the text the tree prints
	it(`the run in front of the brace of a built block beside an at-rule a rule of the plugin wrote`, async () => {
		let code = `@import "x";\na { color: #FFF }\n`
		let alone = await stylelint.lint({ code, config: { plugins: [builder(beside)], rules: { "test/builder": true } }, fix: true })
		let overText = await stylelint.lint({ code: alone.code ?? code, config: { plugins, rules: { "@stylistic/at-rule-semicolon-space-before": `always` } }, fix: true })
		let overTree = await fixBuilt(code, beside, [`@stylistic/at-rule-semicolon-space-before`, `always`])

		expect(overTree.code).toBe(overText.code)
	})
})
