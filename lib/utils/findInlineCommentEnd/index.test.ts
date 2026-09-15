import { expect, it } from "vitest"

import { findInlineCommentEnd } from "./index.ts"

it(`findInlineCommentEnd`, () => {
	expect(findInlineCommentEnd(`1px // c\n2px`, 4)).toBe(8)
	expect(findInlineCommentEnd(`1px // c\r\n2px`, 4)).toBe(8)
	expect(findInlineCommentEnd(`1px // c\r2px`, 4)).toBe(8)
	expect(findInlineCommentEnd(`1px // c\f2px\n3px`, 4)).toBe(12)
	expect(findInlineCommentEnd(`1px // c`, 4)).toBe(8)
})
