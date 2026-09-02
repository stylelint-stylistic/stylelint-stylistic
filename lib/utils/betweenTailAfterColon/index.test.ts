import { type Declaration, parse } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"

import { betweenTailAfterColon } from "./index.ts"

/** The least of a Stylelint result, which names no syntax, so that the file is read as plain CSS. */
const RESULT = {} as unknown as PostcssResult

/**
 * Parses one declaration out of a block.
 * @param block - The block to parse.
 * @returns Its first declaration.
 */
function declarationOf (block: string): Declaration {
	let decl: Declaration | undefined

	parse(block).walkDecls((found) => {
		decl ??= found
	})

	if (!decl) throw new Error(`The block holds no declaration`)

	return decl
}

describe(`betweenTailAfterColon`, () => {
	it(`the parser's own layouts: the trimmed run of a worded value, and nothing on a whitespace-only one`, () => {
		expect(betweenTailAfterColon(css, declarationOf(`a { b:\nx; }`), RESULT)).toBe(`\n`)
		expect(betweenTailAfterColon(css, declarationOf(`a { --b: ; }`), RESULT)).toBe(``)
	})

	it(`a colon a comment of the between spells is not the declaration's: the tail runs from the first colon outside comments, whichever side of it the comment stands on`, () => {
		let decl = declarationOf(`a { b: x; }`)

		decl.raws.between = `:\n/*x:y*/ `
		expect(betweenTailAfterColon(css, decl, RESULT)).toBe(`\n/*x:y*/ `)

		decl.raws.between = ` /*x:y*/: `
		expect(betweenTailAfterColon(css, decl, RESULT)).toBe(` `)
	})

	it(`a reading that cannot answer, which leaves no tail rather than the raw entire: a caller asks whether a single space is all that stands behind the colon, and the whole raw would tell it otherwise`, () => {
		let decl = declarationOf(`a { b: x; }`)
		let readsNothing = { ...css, colonTokenIndex: (): number => -1 }

		decl.raws.between = `: `
		expect(betweenTailAfterColon(readsNothing, decl, RESULT)).toBe(``)
	})

	it(`a between spelling no colon, which no parser hands over: there is no tail behind a colon that is not there`, () => {
		let decl = declarationOf(`a { b: x; }`)

		decl.raws.between = ` `
		expect(betweenTailAfterColon(css, decl, RESULT)).toBe(``)
	})
})
