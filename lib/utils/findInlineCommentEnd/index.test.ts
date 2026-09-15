import { expect, it } from "vitest"

import { findInlineCommentEnd } from "./index.ts"

/** `postcss-scss`, which closes a `//` comment on a form feed as Sass does. */
const SCSS = { spells: true, tokenizes: true, endsOnFormFeed: true }

/** `postcss-less`, which reads a form feed as the comment's text. */
const LESS = { spells: true, tokenizes: false, endsOnFormFeed: false }

it(`findInlineCommentEnd`, () => {
	expect(findInlineCommentEnd(`1px // c\n2px`, 4)).toBe(8)
	expect(findInlineCommentEnd(`1px // c\r\n2px`, 4)).toBe(8)
	expect(findInlineCommentEnd(`1px // c\r2px`, 4)).toBe(8)
	expect(findInlineCommentEnd(`1px // c\f2px\n3px`, 4)).toBe(12)
	expect(findInlineCommentEnd(`1px // c`, 4)).toBe(8)
})

it(`a form feed, which closes the comment under the syntax reading a line in it and is its text under the other`, () => {
	expect(findInlineCommentEnd(`1px // c\f2px\n3px`, 4, SCSS)).toBe(8)
	expect(findInlineCommentEnd(`1px // c\f2px\n3px`, 4, LESS)).toBe(12)
	expect(findInlineCommentEnd(`1px // c\r2px`, 4, SCSS)).toBe(8)
})
