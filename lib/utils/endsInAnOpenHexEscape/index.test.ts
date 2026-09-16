import { expect, it } from "vitest"

import { endsInAnOpenHexEscape } from "./index.ts"

it(`endsInAnOpenHexEscape`, () => {
	// A backslash and up to six hexadecimal digits at the end of the word
	expect(endsInAnOpenHexEscape(`10px\\9`)).toBe(true)
	expect(endsInAnOpenHexEscape(`\\75`)).toBe(true)
	expect(endsInAnOpenHexEscape(`a\\\\\\9`)).toBe(true)

	// An escaped backslash in front of the digits, which leaves them plain characters (#579)
	expect(endsInAnOpenHexEscape(`x\\\\9`)).toBe(false)
	expect(endsInAnOpenHexEscape(`\\\\61`)).toBe(false)

	// An escape closed on its whitespace, which reaches no further, and a chain of them welded into one word
	expect(endsInAnOpenHexEscape(`\\61 `)).toBe(false)
	expect(endsInAnOpenHexEscape(`\\61 \\62`)).toBe(true)

	// A seventh digit, a character of its own, and an escape of no hexadecimal digit
	expect(endsInAnOpenHexEscape(`\\1234567`)).toBe(false)
	expect(endsInAnOpenHexEscape(`a\\g`)).toBe(false)
	expect(endsInAnOpenHexEscape(`a9`)).toBe(false)
	expect(endsInAnOpenHexEscape(``)).toBe(false)
})
