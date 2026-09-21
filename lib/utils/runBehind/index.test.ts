import { describe, expect, it } from "vitest"

import { runBehind } from "./index.ts"

describe(`runBehind`, () => {
	it(`reads the CSS whitespace right behind the delimiter, up to the first character that is none`, () => {
		expect(runBehind(`a, \n\tb`, 1)).toBe(` \n\t`)
		expect(runBehind(`a,b`, 1)).toBe(``)
		expect(runBehind(`a,`, 1)).toBe(``)
	})

	it(`takes a no-break space for a character of the text, which CSS does not read as whitespace`, () => {
		expect(runBehind(`a,  b`, 1)).toBe(` `)
	})
})
