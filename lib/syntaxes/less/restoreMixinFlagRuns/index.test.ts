import type { AtRule, Document, Parser, Root, Syntax } from "postcss"
import postcssHtml from "postcss-html"
import less from "postcss-less"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { restoreMixinFlagRuns } from "./index.ts"

let html = postcssHtml as Syntax & { parse: Parser<Document> }

/**
 * Parses a stylesheet with `postcss-less` and restores it.
 * @param code - The stylesheet.
 * @returns The restored root.
 */
function restored (code: string): Root {
	let root = less.parse(code, { from: undefined }) as Root

	restoreMixinFlagRuns(root, resultOf(less))

	return root
}

/**
 * A lint result naming the syntax a file was parsed with.
 * @param syntax - The syntax.
 * @returns The result.
 */
function resultOf (syntax: Syntax): PostcssResult {
	return { opts: { syntax } } as unknown as PostcssResult
}

/**
 * The first at-rule of a root.
 * @param root - The root.
 * @returns The at-rule.
 */
function firstAtRule (root: Root): AtRule {
	let found: AtRule | undefined

	root.walkAtRules((atRule) => {
		found ??= atRule
	})

	if (!found) throw new Error(`The root holds no at-rule`)

	return found
}

describe(`restoreMixinFlagRuns`, () => {
	it(`hands the run behind the flag of a block's last call to the block, so the root prints as the file`, () => {
		let root = restored(`a {\n\t.m() !important\n}`)
		let call = firstAtRule(root)

		expect(call.raws.between).toBe(` `)
		expect(call.raws.important).toBe(`!important`)
		expect(call.parent?.raws.after).toBe(`\n`)
		expect(root.toString(less)).toBe(`a {\n\t.m() !important\n}`)
	})

	it(`keeps a comment behind the flag with the flag, and the whitespace behind the comment with the block`, () => {
		let root = restored(`a {\n\t.m()  !important /* c */\n}`)
		let call = firstAtRule(root)

		expect(call.raws.between).toBe(`  `)
		expect(call.raws.important).toBe(`!important /* c */`)
		expect(call.parent?.raws.after).toBe(`\n`)
		expect(root.toString(less)).toBe(`a {\n\t.m()  !important /* c */\n}`)
	})

	it(`hands the run between the flag and a semicolon to the flag, which the stylesheet prints in front of that semicolon`, () => {
		let root = restored(`a {\n\t.m() !important\t;\n\tcolor: red\n}`)

		expect(firstAtRule(root).raws.important).toBe(`!important\t`)
		expect(root.toString(less)).toBe(`a {\n\t.m() !important\t;\n\tcolor: red\n}`)
	})

	it(`hands the run in front of the flag of a stylesheet's last call without a semicolon to the call, and leaves the rest of the file to the root`, () => {
		let root = restored(`a {}\n.m() !important\n\t/* c */\n`)
		let call = firstAtRule(root)

		expect(call.raws.between).toBe(` `)
		expect(call.raws.important).toBe(`!important`)
		expect(root.raws.after).toBe(`\n\t/* c */\n`)
		expect(root.toString(less)).toBe(`a {}\n.m() !important\n\t/* c */\n`)
	})

	it(`leaves a call whose flag stands in front of a double-slash comment the parser filed as params`, () => {
		let root = restored(`a {\n\t.m() !important // c\n}`)
		let call = firstAtRule(root)

		expect(call.params).toBe(`()  // c`)
		expect(call.raws.between).toBe(`\n`)
		expect(call.raws.important).toBe(`!important`)
	})

	it(`reads an embedded stylesheet at its offsets in the page`, () => {
		let page = `<p>x</p>\n<style lang="less">\na {\n\t.m() !important\n}\n</style>`
		let document = html.parse(page, { from: undefined })
		let root = document.first as Root

		restoreMixinFlagRuns(root, resultOf(html))

		expect(root.toString(less)).toBe(`a {\n\t.m() !important\n}\n`)
	})

	it(`restores a root once, so a run a fix has written is not parted again`, () => {
		let root = restored(`a {\n\t.m() !important\n}`)
		let call = firstAtRule(root)

		call.raws.between = ` \n`
		restoreMixinFlagRuns(root, resultOf(less))

		expect(call.raws.between).toBe(` \n`)
	})
})
