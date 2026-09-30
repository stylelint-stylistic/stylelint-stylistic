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
	// The space behind the `(` alone makes the parentheses code with a `[` left open, and the twin behind takes the break out of them in the same pass
	it(`the rule's space in front of the comma along with the break the twin behind it takes out from behind the comma`, () => {
		let { decl, text, index } = declarationWithAComma(`1 url (,\nb[c) 2px`)
		let own = { start: index, end: index, text: ` ` }

		expect(editsAskedWithTheTwins(text, text, index, index, own, POSTCSS, decl, result({ [SPACE_BEFORE]: `always`, "@stylistic/value-list-comma-space-after": `never` }), SPACE_BEFORE)).toEqual([own, { start: index + 1, end: index + 2, text: `` }])
	})

	it(`the rule's write alone where the twin runs in front of it, where its fix is off, and where its option speaks of no multi-line list`, () => {
		let { decl, text, index } = declarationWithAComma(`1 url (,\nb[c) 2px`)
		let own = { start: index, end: index, text: ` ` }

		expect(editsAskedWithTheTwins(text, text, index, index, own, POSTCSS, decl, result({ "@stylistic/value-list-comma-space-after": `never`, [SPACE_BEFORE]: `always` }), SPACE_BEFORE)).toEqual([own])
		expect(editsAskedWithTheTwins(text, text, index, index, own, POSTCSS, decl, result({ [SPACE_BEFORE]: `always`, "@stylistic/value-list-comma-space-after": [`never`, { disableFix: true }] }), SPACE_BEFORE)).toEqual([own])
		expect(editsAskedWithTheTwins(text, text, index, index, own, POSTCSS, decl, result({ [SPACE_BEFORE]: `always`, "@stylistic/value-list-comma-space-after": `never-single-line` }), SPACE_BEFORE)).toEqual([own])
	})

	it(`a twin deferred to the run's end, which runs behind whichever order the configuration lists`, () => {
		let { decl, text, index } = declarationWithAComma(`1 url (,\nb[c) 2px`)
		let own = { start: index, end: index, text: ` ` }

		expect(editsAskedWithTheTwins(text, text, index, index, own, POSTCSS, decl, result({ "@stylistic/value-list-comma-newline-after": `never-multi-line`, [SPACE_BEFORE]: `always` }), SPACE_BEFORE)).toEqual([own, { start: index + 1, end: index + 2, text: `` }])
	})

	// Taking the break out hands the parentheses to an address's token closing inside the string, and the twin's space behind the `(` would keep them code, but the twin asks its own question over the text the break is taken out of and refuses there, so its write is not counted
	it(`the rule's write alone where the twin behind it would refuse its own over the text the rule leaves`, () => {
		let { decl, text, index } = declarationWithAComma(`1 url (\n,"b)c") 2px`)
		let own = { start: index - 1, end: index, text: `` }

		expect(editsAskedWithTheTwins(text, text, index, index, own, POSTCSS, decl, result({ [NEWLINE_BEFORE]: `never-multi-line`, [SPACE_BEFORE]: `always-single-line` }), NEWLINE_BEFORE)).toEqual([own])
	})

	// Stylelint drops a fix on a line a disable comment covers for the twin, so the break stays and the space alone would leave the square bracket open
	it(`the rule's write alone where a disable comment keeps the twin's fix off the comma's line`, () => {
		let { decl, text, index } = declarationWithAComma(`1 url (,\nb[c) 2px`)
		let own = { start: index, end: index, text: ` ` }
		let disabled = { stylelint: { config: { rules: { [SPACE_BEFORE]: `always`, "@stylistic/value-list-comma-space-after": `never` } }, disabledRanges: { "@stylistic/value-list-comma-space-after": [{ start: 1, end: 1 }] } } } as unknown as PostcssResult

		expect(editsAskedWithTheTwins(text, text, index, index, own, POSTCSS, decl, disabled, SPACE_BEFORE)).toEqual([own])
	})

	it(`the rule's write alone under a name of no list`, () => {
		let { decl, text, index } = declarationWithAComma(`1 url (,\nb[c) 2px`)
		let own = { start: index, end: index, text: ` ` }

		expect(editsAskedWithTheTwins(text, text, index, index, own, POSTCSS, decl, result({ "@stylistic/value-list-comma-space-after": `never` }), `@stylistic/declaration-colon-space-before`)).toEqual([own])
	})
})
