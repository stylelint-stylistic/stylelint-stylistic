import type { ChildNode, Container } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { commentTextHead } from "./index.ts"

/**
 * Parses a stylesheet of one block.
 * @param code - The block's content.
 * @param syntax - The syntax the stylesheet is parsed with.
 * @returns The block and a result naming the syntax.
 */
function block (code: string, syntax: typeof less | typeof scss = less): { rule: Container, result: PostcssResult } {
	return { rule: syntax.parse(`a {\n\t${code}\n}`, { from: undefined }).first as Container, result: { opts: { syntax } } as unknown as PostcssResult }
}

describe(`commentTextHead`, () => {
	it(`the rest of the comment in the raw behind a node a semicolon of its text closed, up to the line feed or carriage return closing it`, () => {
		let { rule, result } = block(`color: pink // ;;`)

		expect(commentTextHead(rule, `after`, result)).toBe(`;`)

		let middle = block(`color: pink // ; ;\n\t;\n\ttop: 0;`)

		expect(commentTextHead(middle.rule.last as ChildNode, `before`, middle.result)).toBe(` ;`)

		let bareReturn = block(`color: pink // ;;\r;`)

		expect(commentTextHead(bareReturn.rule, `after`, bareReturn.result)).toBe(`;`)
	})

	it(`the text on through a block comment carved out of the comment, and an empty head where the break opens the raw, behind an inline comment carved out of it too, and behind a node Less may read the comment behind or not`, () => {
		let { rule, result } = block(`color: pink // ; /* c */ ;`)

		expect(commentTextHead(rule.last as ChildNode, `before`, result)).toBe(` `)
		expect(commentTextHead(rule, `after`, result)).toBe(` ;`)

		let opened = block(`color: pink // ;`)

		expect(commentTextHead(opened.rule, `after`, opened.result)).toBe(``)

		let variable = block(`@v: pink // ; /* c */ ;`)

		expect(commentTextHead(variable.rule, `after`, variable.result)).toBe(` ;`)

		let inline = block(`color: pink // ; // c ;\n\t;`)

		expect(commentTextHead(inline.rule, `after`, inline.result)).toBe(``)
	})

	it(`no head behind a semicolon of code, behind a block comment the break has closed the comment in front of, or under a parser cutting the comment out of the node`, () => {
		let code = block(`color: pink;;`)

		expect(commentTextHead(code.rule, `after`, code.result)).toBeNull()

		let closed = block(`color: pink // ;\n\t/* c */ ;`)

		expect(commentTextHead(closed.rule, `after`, closed.result)).toBeNull()

		let sass = block(`color: pink // ;;`, scss)

		expect(commentTextHead(sass.rule, `after`, sass.result)).toBeNull()
	})
})
