import { type AnyNode, type Builder, type ChildNode, Declaration, parse, type Root } from "postcss"
import html from "postcss-html"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { runInFrontOf } from "./index.ts"

/** A parser and the stringifier that prints what it parsed. */
type Syntax = { parse: (source: string) => Root, stringify: (node: AnyNode, builder: Builder) => void }

/**
 * Parses a stylesheet, optionally takes the raw off one node of its first block, and reads the run in front of that node beside the text the print gives.
 * @param source - The stylesheet.
 * @param options - Whether to take the raw off, and which syntax to read the stylesheet with.
 * @param options.withoutTheRaw - Whether the node loses its `raws.before`, as a node another plugin built carries none.
 * @param options.syntax - The syntax, where the stylesheet is not plain CSS.
 * @returns The run and the printed stylesheet.
 */
function headRun (source: string, { withoutTheRaw = false, syntax }: { withoutTheRaw?: boolean, syntax?: Syntax } = {}): { run: string, printed: string } {
	let root = syntax ? syntax.parse(source) : parse(source)
	let node: ChildNode | undefined

	root.walkRules((statement) => {
		node ??= statement.first
	})

	if (!node) throw new Error(`The stylesheet holds no block with a node in it`)

	if (withoutTheRaw) delete node.raws.before

	let printed = ``

	if (syntax) syntax.stringify(root as AnyNode, (part) => { printed += part })
	else printed = root.toString()

	return { run: runInFrontOf(node), printed }
}

describe(`runInFrontOf`, () => {
	it(`hands back the raw the parser filed`, () => {
		expect(headRun(`a {\n\tcolor: pink;\n}`).run).toBe(`\n\t`)
		expect(headRun(`a {color: pink}`).run).toBe(``)
		expect(headRun(`a { /*c*/ }`).run).toBe(` `)
	})

	it(`hands back the run PostCSS invents where the node carries no raw, which is the run it prints`, () => {
		let { run, printed } = headRun(`a {\n\tcolor: pink;\n}`, { withoutTheRaw: true })

		expect(run).toBe(`\n    `)
		expect(printed).toBe(`a {\n    color: pink;\n}`)
	})

	it(`takes that run from what the node's neighbours carry`, () => {
		expect(headRun(`a { color: pink; top: 0 }`, { withoutTheRaw: true }).run).toBe(` `)
		expect(headRun(`a { color: pink;top: 0 }`, { withoutTheRaw: true }).run).toBe(``)
		expect(headRun(`a {\n\tcolor: pink;\n\ttop: 0;\n}`, { withoutTheRaw: true }).run).toBe(`\n\t`)
	})

	it(`agrees with the run a syntax of its own prints`, () => {
		let sass = headRun(`a {\n\t// c\n\tcolor: pink;\n}`, { withoutTheRaw: true, syntax: scss as unknown as Syntax })
		let lessy = headRun(`a {\n\t// c\n\tcolor: pink;\n}`, { withoutTheRaw: true, syntax: less as unknown as Syntax })
		let page = headRun(`<style>\n\ta {\n\t\tcolor: pink;\n\t}\n</style>\n`, { withoutTheRaw: true, syntax: html as unknown as Syntax })

		expect(sass.run).toBe(`\n\t`)
		expect(sass.printed).toBe(`a {\n\t// c\n\tcolor: pink;\n}`)
		expect(lessy.run).toBe(`\n\t`)
		expect(lessy.printed).toBe(`a {\n\t// c\n\tcolor: pink;\n}`)
		expect(page.run).toBe(`\n    `)
		expect(page.printed).toBe(`<style>\n\ta {\n    color: pink;\n\t}\n</style>\n`)
	})

	it(`hands back the empty run for a node standing outside a tree`, () => {
		expect(runInFrontOf(new Declaration({ prop: `color`, value: `pink` }))).toBe(``)
	})

	it(`hands back the empty run for the first node of a root, which PostCSS prints nothing in front of`, () => {
		let statement = parse(`a {}`).first

		if (!statement) throw new Error(`The stylesheet holds no node`)

		delete statement.raws.before

		expect(runInFrontOf(statement)).toBe(``)
	})
})
