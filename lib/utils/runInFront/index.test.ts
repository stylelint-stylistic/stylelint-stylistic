import { describe, expect, it } from "vitest"

import { runInFront } from "./index.ts"

describe(`runInFront`, () => {
	it(`reads the CSS whitespace right in front of the delimiter, back to the first character that is none`, () => {
		expect(runInFront(`a \n\t,b`, 4)).toBe(` \n\t`)
		expect(runInFront(`a,b`, 1)).toBe(``)
		expect(runInFront(`,b`, 0)).toBe(``)
	})

	it(`takes a no-break space for a character of the text, which CSS does not read as whitespace`, () => {
		expect(runInFront(`a  ,b`, 3)).toBe(` `)
	})
})
