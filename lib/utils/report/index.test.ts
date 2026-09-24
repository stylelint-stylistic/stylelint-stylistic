import { Declaration, type Root } from "postcss"
import stylelint, { type Rule } from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

/**
 * A foreign rule that puts a declaration built with no source into every block holding none, as `rule.append({ prop, value })` does.
 * @returns The check.
 */
function build (): (root: Root) => void {
	return (root) => {
		root.walkRules((rule) => {
			if (!rule.some((child) => child.type === `decl`)) rule.append(new Declaration({ prop: `color`, value: `#FFF` }))
		})
	}
}

let builder = stylelint.createPlugin(`probe/builder`, Object.assign(build, { ruleName: `probe/builder`, messages: {} }) as unknown as Rule)

/**
 * Lints a stylesheet with the builder listed in front of a rule of the plugin.
 * @param code - The stylesheet.
 * @param rules - The plugin's rules.
 * @param fix - Whether to fix.
 * @returns The result and the code written.
 */
async function lint (code: string, rules: Record<string, unknown>, fix: boolean): Promise<{ warnings: { line: number, column: number, rule: string }[], code: string | undefined }> {
	let { results, code: written } = await stylelint.lint({ code, config: { plugins: [...plugins, builder], rules: { "probe/builder": true, ...rules } }, fix })

	return { warnings: (results[0]?.warnings ?? []).map(({ line, column, rule }) => ({ line, column, rule })), code: written }
}

describe(`report`, () => {
	it(`a problem on a node another rule built with no source, reported on its nearest ancestor holding a place in the file`, async () => {
		expect((await lint(`a {\n}\n`, { "@stylistic/color-hex-case": `lower` }, false)).warnings).toEqual([{ line: 1, column: 1, rule: `@stylistic/color-hex-case` }])
	})

	it(`the same problem fixed as any other`, async () => {
		expect((await lint(`a {\n}\n`, { "@stylistic/color-hex-case": `lower` }, true)).code).toBe(`a {\n    color: #fff\n}\n`)
	})

	it(`such a problem behind a node in the file, placed on that node, which a disable comment standing there covers`, async () => {
		expect((await lint(`a {\n  /* c */\n}\n`, { "@stylistic/color-hex-case": `lower` }, false)).warnings).toEqual([{ line: 2, column: 3, rule: `@stylistic/color-hex-case` }])
		expect((await lint(`a {\n  /* stylelint-disable */\n}\n`, { "@stylistic/color-hex-case": `lower` }, false)).warnings).toEqual([])
	})

	it(`a missing trailing semicolon behind such a node`, async () => {
		expect((await lint(`a {\n}\n`, { "@stylistic/declaration-block-trailing-semicolon": `always` }, false)).warnings).toEqual([{ line: 1, column: 1, rule: `@stylistic/declaration-block-trailing-semicolon` }])
	})

	it(`no trailing semicolon behind such a node under never, whose place the rule measured the file from`, async () => {
		expect((await lint(`a {\n}\n`, { "@stylistic/declaration-block-trailing-semicolon": `never` }, false)).warnings).toEqual([])
	})
})
