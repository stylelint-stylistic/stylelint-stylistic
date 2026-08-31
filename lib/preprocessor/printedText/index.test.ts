import { type AtRule, type Declaration, type Document, parse, type Root, type Rule } from "postcss"
import { parse as parseLess } from "postcss-less"
import { parse as parseScss, stringify as stringifyScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import type { SyntaxRaw } from "../../utils/typeGuards/index.ts"

import { printedText, writePrintedText } from "./index.ts"

describe(`printedText`, () => {
	it(`hands back the node's own text where no raw stands beside it`, () => {
		expect(printedText(scssDecl(`a { color: pink }`))).toBe(`pink`)
	})

	it(`hands back the raw where PostCSS keeps one`, () => {
		expect(printedText(decl(`a { margin: 0 /* c */ 1px }`))).toBe(`0 /* c */ 1px`)
	})

	it(`hands back the copy the syntax spells where it keeps one beside the pair`, () => {
		expect(printedText(scssDecl(`a { margin: 0 // c\n  1px }`))).toBe(`0 // c\n  1px`)
	})

	it(`reads the params of an at-rule through the same pair`, () => {
		expect(printedText(scssAtRule(`@mixin foo(\n\t// c\n\t$bar: 1\n) {}`))).toBe(`foo(\n\t// c\n\t$bar: 1\n)`)
	})

	it(`reads the selector of a rule through the same pair`, () => {
		expect(printedText(scssRule(`a // c\n, b {}`))).toBe(`a // c\n, b`)
	})

	it(`reads the raw where the syntax keeps the comment in no copy of its own`, () => {
		expect(printedText(lessRule(`a // c\n, b {}`))).toBe(`a // c\n, b`)
	})
})

describe(`writePrintedText`, () => {
	it(`writes the node's own text where no raw stands beside it`, () => {
		let node = scssDecl(`a { color: pink }`)

		writePrintedText(node, `red`)

		expect(node.value).toBe(`red`)
		expect(node.toString()).toBe(`color: red`)
	})

	it(`writes the copy the syntax prints`, () => {
		let node = scssDecl(`a { margin: 0 // c\n  1px }`)

		writePrintedText(node, `0 // c\n  2px`)

		expect((node.raws.value as SyntaxRaw).scss).toBe(`0 // c\n  2px`)
	})

	it(`keeps the raw beside it in step`, () => {
		let node = scssDecl(`a { margin: 0 // c\n  1px }`)

		writePrintedText(node, `0 // c\n  2px`)

		expect((node.raws.value as SyntaxRaw).raw).toBe(`0 /* c*/\n  2px`)
	})

	it(`the syntax prints what was written`, () => {
		let root = parseScss(`a { margin: 0 // c\n  1px }`)

		root.walkDecls((node) => {
			writePrintedText(node, `0 // c\n  2px`)
		})

		expect(root.toString(stringifyScss)).toBe(`a { margin: 0 // c\n  2px }`)
	})

	it(`writes both copies of an at-rule's params`, () => {
		let node = scssAtRule(`@media screen // c\n  and (min-width: 1px) {}`)

		writePrintedText(node, `screen // c\n  and (min-width: 2px)`)

		expect((node.raws.params as SyntaxRaw).scss).toBe(`screen // c\n  and (min-width: 2px)`)
		expect((node.raws.params as SyntaxRaw).raw).toBe(`screen /* c*/\n  and (min-width: 2px)`)
	})

	it(`writes both copies of a rule's selector`, () => {
		let node = scssRule(`a // c\n, b {}`)

		writePrintedText(node, `a // c\r\n, b`)

		expect((node.raws.selector as SyntaxRaw).scss).toBe(`a // c\r\n, b`)
		expect((node.raws.selector as SyntaxRaw).raw).toBe(`a /* c*/\r\n, b`)
	})
})

/**
 * Reads the first declaration of a stylesheet.
 * @param css - The stylesheet.
 * @returns That declaration.
 */
function decl (css: string): Declaration {
	let list: Declaration[] = []

	parse(css).walkDecls((d) => {
		list.push(d)
	})

	return pick(list)
}

/**
 * Reads the first declaration of a stylesheet written in SCSS.
 * @param css - The stylesheet.
 * @returns That declaration.
 */
function scssDecl (css: string): Declaration {
	let list: Declaration[] = []

	parseScss(css).walkDecls((d) => {
		list.push(d)
	})

	return pick(list)
}

/**
 * Reads the first at-rule of a stylesheet written in SCSS.
 * @param css - The stylesheet.
 * @returns That at-rule.
 */
function scssAtRule (css: string): AtRule {
	let list: AtRule[] = []

	parseScss(css).walkAtRules((rule) => {
		list.push(rule)
	})

	return pick(list)
}

/**
 * Reads the first rule of a stylesheet written in SCSS.
 * @param css - The stylesheet.
 * @returns That rule.
 */
function scssRule (css: string): Rule {
	return collect(parseScss(css))
}

/**
 * Reads the first rule of a stylesheet written in Less.
 * @param css - The stylesheet.
 * @returns That rule.
 */
function lessRule (css: string): Rule {
	return collect(parseLess(css))
}

/**
 * Takes the first rule out of a parsed stylesheet.
 * @param root - The parsed stylesheet.
 * @returns That rule.
 */
function collect (root: Root | Document): Rule {
	let list: Rule[] = []

	root.walkRules((node) => {
		list.push(node)
	})

	return pick(list)
}
