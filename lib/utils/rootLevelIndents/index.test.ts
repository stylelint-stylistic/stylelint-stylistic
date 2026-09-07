import { parse, type Parser, type Root } from "postcss"
import postcssHtml from "postcss-html"
import { describe, expect, it } from "vitest"

import { rootLevelIndents } from "./index.ts"

let html = postcssHtml as { parse: Parser }

describe(`rootLevelIndents`, () => {
	it(`reads the line each child of the root opens on and the line each block closes on`, () => {
		expect(run(`\ta {\n\t\tcolor: pink;\n\t}\n\t/* c */\n\tb {}`)).toEqual({ own: [`\t`, `\t`, `\t`, `\t`], tagLine: [] })
	})

	it(`leaves out the continuation of a statement and the lines of a nested block`, () => {
		expect(run(`a,\nb {\n\tcolor:\n\t\tpink;\n\t@media (\n\t\tx) {}\n}`)).toEqual({ own: [``, ``], tagLine: [] })
	})

	it(`reads the closing brace's line where an at-rule with neither a block nor a semicolon swallowed the run in front of it`, () => {
		expect(run(`a {\n\t@extend .b\n\t}`)).toEqual({ own: [``, `\t`], tagLine: [] })
	})

	it(`reads the first child's own line off the run behind the break the code in front of the stylesheet ends in`, () => {
		expect(run(`<style>\n\ta {\n\t\tcolor: pink;\n\t}\n</style>`, html)).toEqual({ own: [`\t`, `\t`], tagLine: [] })
		expect(run(`<style>\n\n\ta {}\n</style>`, html)).toEqual({ own: [`\t`], tagLine: [] })
	})

	it(`reads a form feed or a bare carriage return in front of the first child as part of its own line's indentation`, () => {
		expect(run(`<style>\n\f\ta {}\n</style>`, html)).toEqual({ own: [`\f\t`], tagLine: [] })
		expect(run(`<style>\n\r\ta {}\n</style>`, html)).toEqual({ own: [`\r\t`], tagLine: [] })
	})

	it(`hands the tag's line back apart where the first child stands on it, indented by what the tag is`, () => {
		expect(run(`\t<style>a {\n\t\tcolor: pink; }\n\t</style>`, html)).toEqual({ own: [], tagLine: [`\t`] })
		expect(run(`<style> a {\n\tcolor: pink;\n}\n</style>`, html)).toEqual({ own: [``], tagLine: [``] })
		expect(run(`  <a style="@import url(\n'x')"></a>`, html)).toEqual({ own: [], tagLine: [`  `] })
	})

	it(`leaves the closing braces' lines out where they stand a level deeper than their blocks`, () => {
		expect(run(`<style>a {\n\tcolor: pink;\n\t}\n</style>`, html, true)).toEqual({ own: [], tagLine: [``] })
		expect(run(`a {\n\tcolor: pink;\n\t}\nb {}`, undefined, true)).toEqual({ own: [``, ``], tagLine: [] })
	})

	it(`reads nothing off a root without a child`, () => {
		expect(run(``)).toEqual({ own: [], tagLine: [] })
	})
})

/**
 * Parses a stylesheet and asks the question about its root, or about the one root a page holds.
 * @param css - The stylesheet, or the page.
 * @param syntax - The syntax to read it with, where plain CSS is not the one.
 * @param closingBraceIndented - Whether a closing brace stands a level deeper than its block.
 * @returns What the util answers.
 */
function run (css: string, syntax?: { parse: Parser }, closingBraceIndented: boolean = false): ReturnType<typeof rootLevelIndents> {
	let root = syntax ? syntax.parse(css) : parse(css)

	return rootLevelIndents((syntax ? root.first : root) as Root, closingBraceIndented)
}
