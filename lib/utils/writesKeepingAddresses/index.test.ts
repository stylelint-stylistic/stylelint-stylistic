import { type Declaration, parse, type Rule } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { breakAtRereadsParentheses } from "../breakRereadsParentheses/index.ts"

import { type WriteCandidate, writesKeepingAddresses } from "./index.ts"

let POSTCSS = { tokenizes: false }
let RESULT = { stylelint: { config: {}, disabledRanges: {} } } as unknown as PostcssResult

/**
 * Parses a declaration holding a value and builds the candidates writing a break behind each comma of it, the guard against a square bracket left open asked of each over the text the other writes leave.
 * @param value - The value.
 * @returns The declaration, its printed text and the candidates.
 */
function breaksBehindTheCommas (value: string): { decl: Declaration, text: string, candidates: WriteCandidate[] } {
	let decl = (parse(`a { b: ${value} }`).first as Rule).first as Declaration
	let text = decl.toString()
	let candidates = [...text.matchAll(/,/gu)].map(({ index }) => ({ edits: [{ start: index + 1, end: index + 1, text: `\n` }], holds: (edited: string, move: (at: number) => number): boolean => !breakAtRereadsParentheses(edited, move(index), false, POSTCSS), index }))

	return { decl, text, candidates }
}

describe(`writesKeepingAddresses`, () => {
	// The parentheses are one plain token behind the word `1,url`, whose `[` the break inside would leave open, and the break behind the first comma parts `url` off, so they are an address's token once that write is given
	it(`gives a break the guard refuses over the standing text once another write of the run makes the parentheses an address's token, in either order of the candidates`, () => {
		let { decl, text, candidates } = breaksBehindTheCommas(`1,url (b[c,d) g`)

		expect(writesKeepingAddresses(text, candidates, POSTCSS, decl, RESULT, `rule`)).toEqual([true, true])
		expect(writesKeepingAddresses(text, candidates.toReversed(), POSTCSS, decl, RESULT, `rule`)).toEqual([true, true])
		expect(writesKeepingAddresses(text, candidates.slice(1), POSTCSS, decl, RESULT, `rule`)).toEqual([false])
	})

	// The tokenizer pops `URL` as no address, so the parentheses stay one plain token once the first comma's break parts it off
	it(`gives the break parting a name the tokenizer pops as no address off the comma and refuses the one into the parentheses behind it`, () => {
		let { decl, text, candidates } = breaksBehindTheCommas(`1,URL (b[c,d) g`)

		expect(writesKeepingAddresses(text, candidates, POSTCSS, decl, RESULT, `rule`)).toEqual([true, false])
	})
})
