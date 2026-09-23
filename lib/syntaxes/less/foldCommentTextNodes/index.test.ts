import type { Container, Root } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { foldCommentTextNodes } from "./index.ts"

/**
 * Parses a stylesheet of one block and folds it.
 * @param code - The block's content.
 * @param syntax - The syntax the stylesheet is parsed with.
 * @returns The root and the block, folded.
 */
function folded (code: string, syntax: typeof less | typeof scss = less): { root: Root, block: Container } {
	let root = syntax.parse(`a {\n\t${code}\n}\n`, { from: undefined }) as Root

	foldCommentTextNodes(root, { opts: { syntax } } as unknown as PostcssResult)

	return { root, block: root.first as Container }
}

/**
 * Lists a block's children by type.
 * @param block - The block.
 * @returns The types.
 */
function types (block: Container): string[] {
	return (block.nodes ?? []).map((node) => node.type)
}

describe(`foldCommentTextNodes`, () => {
	it(`a declaration, a rule, a mixin call and two declarations standing in the rest of the text of a comment a semicolon of that text closed the last declaration in, folded into the block's final raw with the file printed the same`, () => {
		for (let rest of [` top: 0`, ` top: 0;`, ` .b { c: d }`, ` .m()`, ` .m();`, ` top: 0; left: 0`, ` top: 0; /* c */`]) {
			let code = `color: pink // ;${rest}`
			let { root, block } = folded(code)

			expect(types(block)).toEqual([`decl`])
			expect(block.raws.semicolon).toBe(true)
			expect(root.toString(less)).toBe(`a {\n\t${code}\n}\n`)
		}
	})

	it(`the same text behind a flagged custom property, a variable and an extend, where Less may read the rest of the line as code, left as parsed`, () => {
		expect(types(folded(`--x: pink !important // ; top: 0`).block)).toEqual([`decl`, `decl`])
		expect(types(folded(`@v: pink // ; top: 0`).block)).toEqual([`atrule`, `decl`])
		expect(types(folded(`@extend .b // ; top: 0`).block)).toEqual([`atrule`, `decl`])
	})

	it(`the same text in the middle of a block, folded into the raw in front of the next declaration`, () => {
		let { root, block } = folded(`color: pink // ; top: 0;\n\tright: 0;`)

		expect(types(block)).toEqual([`decl`, `decl`])
		expect(block.last?.raws.before).toBe(` top: 0;\n\t`)
		expect(root.toString(less)).toBe(`a {\n\tcolor: pink // ; top: 0;\n\tright: 0;\n}\n`)
	})

	it(`a run of comments alone, a node the break stands in front of, a node whose own text holds a break, and the same text under a parser cutting the comment out of the node, all left as parsed`, () => {
		expect(types(folded(`color: pink // ; /* c */ ;`).block)).toEqual([`decl`, `comment`])
		expect(types(folded(`color: pink // ;\n\ttop: 0;`).block)).toEqual([`decl`, `decl`])
		expect(types(folded(`color: pink // ; .b {\n\t\tc: d\n\t}`).block)).toEqual([`decl`, `rule`])
		expect(types(folded(`color: pink; // ; top: 0`, scss).block)).toEqual([`decl`, `comment`])
	})
})
