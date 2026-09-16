import { describe, expect, it } from "vitest"

import { editsOpenNoComment } from "./index.ts"

const SCSS = { spells: true, tokenizes: true, endsOnFormFeed: true }

describe(`editsOpenNoComment`, () => {
	it(`edits leaving every comment where it stood, moved by what they wrote in front of it`, () => {
		expect(editsOpenNoComment(`f( a /* c */ )`, [{ start: 2, end: 3, text: `` }], SCSS)).toBe(true)
		expect(editsOpenNoComment(`f( a // c\n)`, [{ start: 2, end: 3, text: `  ` }, { start: 10, end: 10, text: ` ` }], SCSS)).toBe(true)
	})

	// The tokenizer asks only the character behind the parenthesis
	it(`whitespace taken away in front of a string behind the parenthesis of an address, which opens a comment there`, () => {
		expect(editsOpenNoComment(`\\61 url( 'a' \\// c ) 1px`, [{ start: 8, end: 9, text: `` }], SCSS)).toBe(false)
	})

	it(`whitespace written there, which takes the comment's reading away`, () => {
		expect(editsOpenNoComment(`\\61 url('a' \\// c\n) 1px`, [{ start: 8, end: 8, text: ` ` }], SCSS)).toBe(true)
	})

	it(`an edit bringing two solidi together, which opens a comment of its own`, () => {
		expect(editsOpenNoComment(`a / /b`, [{ start: 3, end: 4, text: `` }], SCSS)).toBe(false)
	})
})
