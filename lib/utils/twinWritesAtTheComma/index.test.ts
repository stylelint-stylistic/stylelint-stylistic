import { type Declaration, parse, type Rule } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { editsAskedWithTheTwins } from "./index.ts"

let POSTCSS = { tokenizes: false }
let SPACE_BEFORE = `@stylistic/value-list-comma-space-before`
let NEWLINE_BEFORE = `@stylistic/value-list-comma-newline-before`

/**
 * Builds a result carrying a configuration.
 * @param rules - The rules, in the configuration's order.
 * @returns The result.
 */
function result (rules: Record<string, unknown>): PostcssResult {
	return { stylelint: { config: { rules } } } as unknown as PostcssResult
}

/**
 * Parses a declaration and finds its first comma.
 * @param value - The value.
 * @returns The declaration, its printed text and the comma's index in it.
 */
function declarationWithAComma (value: string): { decl: Declaration, text: string, index: number } {
	let decl = (parse(`a { b: ${value} }`).first as Rule).first as Declaration
	let text = decl.toString()

	return { decl, text, index: text.indexOf(`,`) }
}

describe(`editsAskedWithTheTwins`, () => {
	// Taking the break out hands the parentheses to an address's token closing inside the string, and the twin's space behind the `(` would keep them code, but the twin asks its own question over the text the break is taken out of and refuses there, so its write is not counted
	it(`the rule's write alone where the twin behind it would refuse its own over the text the rule leaves`, () => {
		let { decl, text, index } = declarationWithAComma(`1 url (\n,"b)c") 2px`)
		let own = { start: index - 1, end: index, text: `` }

		expect(editsAskedWithTheTwins(text, text, index, index, own, POSTCSS, decl, result({ [NEWLINE_BEFORE]: `never-multi-line`, [SPACE_BEFORE]: `always-single-line` }), NEWLINE_BEFORE)).toEqual({ edits: [own], assumed: [] })
	})
})
